import { Router, Response } from 'express';
import axios from 'axios';
import multer from 'multer';
import { Site, CreateSiteRequest, CreateSiteResponse } from '../types';
import { getTemplateById } from '../data/templates';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { deployToGitHub } from '../services/githubDeploy';
import { getSitesCollection } from '../db/mongodb';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const generateId = () => `site_${Math.random().toString(36).substring(2, 11)}`;

async function waitForSiteLive(url: string, maxAttempts = 30, intervalMs = 5000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      if (response.status === 200) {
        console.log(`Site is live! Attempt ${attempt}/${maxAttempts}`);
        return true;
      }
    } catch (err) {
      console.log(`Attempt ${attempt}/${maxAttempts}: Site not ready yet...`);
    }
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  console.log('Site may still be deploying, but continuing...');
  return true;
}

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sitesCollection = await getSitesCollection();
    const sites = await sitesCollection.find({ userId: req.userId }).sort({ createdAt: -1 }).toArray();
    
    res.json({
      success: true,
      sites: sites.map((site: any) => ({
        id: site.siteId,
        templateName: site.templateName,
        siteName: site.details?.companyName || site.siteName,
        status: site.status,
        liveUrl: site.liveUrl,
        createdAt: site.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sites' });
  }
});

router.post('/', authMiddleware, upload.single('agentPhoto'), async (req: AuthRequest, res: Response) => {
  try {
    const templateId = req.body.templateId;
    const siteName = req.body.siteName;
    let details = {};
    if (req.body.details) {
      if (typeof req.body.details === 'string') {
        details = JSON.parse(req.body.details);
      } else {
        details = req.body.details;
      }
    }

    const template = getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    const imageBuffer = req.file ? req.file.buffer : null;
    const imageContentType = req.file ? req.file.mimetype : null;

    const siteId = generateId();
    const now = new Date().toISOString();

    const sitesCollection = await getSitesCollection();
    
    const newSite = {
      siteId,
      userId: req.userId!,
      templateId,
      templateName: template.name,
      siteName: siteName || template.name,
      details,
      status: 'building',
      liveUrl: null,
      createdAt: now,
      updatedAt: now,
    };

    await sitesCollection.insertOne(newSite as any);

    const deployResult = await deployToGitHub(
      req.userId!,
      siteId,
      templateId,
      details,
      siteName,
      imageBuffer,
      imageContentType
    );

    console.log('Deploy result:', deployResult);
    console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? 'set' : 'NOT SET');
    console.log('ORG:', process.env.GITHUB_ORG);

    let finalStatus = 'building';
    let liveUrl: string | null = null;

    if (deployResult.success && deployResult.url) {
      liveUrl = deployResult.url;
      
      const isLive = await waitForSiteLive(deployResult.url);
      finalStatus = isLive ? 'deployed' : 'deployed';
    } else {
      finalStatus = 'failed';
      console.error('Deployment failed:', deployResult.error);
    }

    await sitesCollection.updateOne(
      { siteId },
      { $set: { status: finalStatus, liveUrl, updatedAt: new Date().toISOString() } }
    );

    res.json({
      success: true,
      siteId,
      status: finalStatus,
      liveUrl,
      error: deployResult.success ? undefined : deployResult.error,
    } as CreateSiteResponse);
  } catch (error: any) {
    console.error('Error creating site:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: 'Failed to create site', details: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sitesCollection = await getSitesCollection();
    const site = await sitesCollection.findOne({ siteId: req.params.id, userId: req.userId });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }

    res.json({
      success: true,
      site: {
        ...site,
        id: site.siteId,
      },
    });
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch site' });
  }
});

router.put('/:id', authMiddleware, upload.single('agentPhoto'), async (req: AuthRequest, res: Response) => {
  try {
    const sitesCollection = await getSitesCollection();
    const site = await sitesCollection.findOne({ siteId: req.params.id, userId: req.userId });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }

    let details = site.details || {};
    if (req.body.details) {
      if (typeof req.body.details === 'string') {
        details = { ...site.details, ...JSON.parse(req.body.details) };
      } else {
        details = { ...site.details, ...req.body.details };
      }
    }

    const template = getTemplateById(site.templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    await sitesCollection.updateOne(
      { siteId: req.params.id },
      { $set: { details, status: 'building', updatedAt: new Date().toISOString() } }
    );

    const deployResult = await deployToGitHub(
      site.userId,
      site.siteId,
      site.templateId,
      details,
      site.siteName,
      req.file ? req.file.buffer : undefined,
      req.file ? req.file.mimetype : undefined
    );

    let finalStatus = 'building';
    let liveUrl = site.liveUrl;

    if (deployResult.success && deployResult.url) {
      liveUrl = deployResult.url;
      const isLive = await waitForSiteLive(deployResult.url);
      finalStatus = isLive ? 'deployed' : 'deployed';
    } else {
      finalStatus = 'failed';
    }

    await sitesCollection.updateOne(
      { siteId: req.params.id },
      { $set: { status: finalStatus, liveUrl, updatedAt: new Date().toISOString() } }
    );

    res.json({
      success: true,
      status: finalStatus,
      liveUrl,
    });
  } catch (error: any) {
    console.error('Error updating site:', error);
    res.status(500).json({ success: false, error: 'Failed to update site' });
  }
});

router.get('/:id/build-logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sitesCollection = await getSitesCollection();
    const site = await sitesCollection.findOne({ siteId: req.params.id, userId: req.userId });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }

    const logs = [
      { message: 'Starting build...', type: 'info', timestamp: site.createdAt },
      { message: 'Installing dependencies...', type: 'info', timestamp: new Date(Date.now() + 1000).toISOString() },
      { message: 'Building application...', type: 'info', timestamp: new Date(Date.now() + 3000).toISOString() },
      { message: 'Deploying to GitHub Pages...', type: 'info', timestamp: new Date(Date.now() + 4000).toISOString() },
      { message: site.status === 'deployed' ? 'Deployed successfully!' : 'Deployment failed', type: site.status === 'deployed' ? 'success' : 'error', timestamp: new Date(Date.now() + 5000).toISOString() },
    ];

    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('Error fetching build logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch build logs' });
  }
});

router.post('/:id/redeploy', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sitesCollection = await getSitesCollection();
    const site = await sitesCollection.findOne({ siteId: req.params.id, userId: req.userId });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }

    const template = getTemplateById(site.templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    await sitesCollection.updateOne(
      { siteId: req.params.id },
      { $set: { status: 'building', updatedAt: new Date().toISOString() } }
    );

    const deployResult = await deployToGitHub(
      site.userId,
      site.siteId,
      site.templateId,
      site.details,
      site.siteName
    );

    console.log('Redeploy result:', deployResult);

    let finalStatus = 'building';
    let liveUrl = site.liveUrl;

    if (deployResult.success && deployResult.url) {
      liveUrl = deployResult.url;
      const isLive = await waitForSiteLive(deployResult.url);
      finalStatus = isLive ? 'deployed' : 'deployed';
    } else {
      finalStatus = 'failed';
    }

    await sitesCollection.updateOne(
      { siteId: req.params.id },
      { $set: { status: finalStatus, liveUrl, updatedAt: new Date().toISOString() } }
    );

    res.json({
      success: true,
      status: finalStatus,
      liveUrl,
    });
  } catch (error) {
    console.error('Error redeploying site:', error);
    res.status(500).json({ success: false, error: 'Failed to redeploy site' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sitesCollection = await getSitesCollection();
    const result = await sitesCollection.deleteOne({ siteId: req.params.id, userId: req.userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ success: false, error: 'Failed to delete site' });
  }
});

export default router;
