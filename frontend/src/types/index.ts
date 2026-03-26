export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'portfolio' | 'business' | 'blog' | 'ecommerce' | 'landing';
  thumbnail: string;
  features: string[];
  formSchema: FormField[];
  deployType?: 'vercel' | 'github';
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'url' | 'select' | 'image' | 'color' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  step?: number;
  accept?: string;
}

export interface Site {
  id: string;
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

export interface BuildLog {
  id: string;
  siteId: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}
