export interface User {
  _id: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'business';
  thumbnail: string;
  features: string[];
  formSchema: FormField[];
  deployType: 'github';
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'url' | 'select' | 'image' | 'color';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  step?: number;
}

export interface Site {
  id: string;
  userId: string;
  templateId: string;
  templateName: string;
  siteName: string;
  details: Record<string, string>;
  status: 'draft' | 'building' | 'deployed' | 'failed';
  previewUrl?: string;
  liveUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteRequest {
  templateId: string;
  siteName: string;
  details: Record<string, string>;
}

export interface CreateSiteResponse {
  success: boolean;
  siteId: string;
  status: 'draft' | 'building' | 'deployed' | 'failed';
  previewUrl?: string;
  liveUrl?: string;
  error?: string;
}

export interface SiteDocument extends Site {
  _id: string;
}
