
export type DocType = 'pdf' | 'txt' | 'png' | 'jpg' | 'doc';

export interface DocumentItem {
  id: string;
  name: string;
  type: DocType;
  category: string;
  timestamp: string;
  previewUrl?: string;
  content?: string; // For text document content
}

export type Category = 'Alle' | 'Arbeit' | 'Gesundheit' | 'Reisen' | 'Finanzen' | 'Zuhause' | 'Sonstiges';
