export interface ParsedAnnouncement {
  id: string;
  uploadedAt: string;
  fileName: string;
  rawText: string;
  title: string;
  agency: string;
  estimatedPrice: string;
  servicePeriod: string;
  deadline: string;
  qualifications: string;
  documents: string[];
  manualEdits: Partial<Omit<ParsedAnnouncement, 'id' | 'uploadedAt' | 'fileName' | 'rawText' | 'manualEdits' | 'documents'>> & { documents?: string[] };
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  custom: boolean;
}

export interface ProjectRecord {
  id: string;
  serviceTitle: string;
  agency: string;
  contractAmount: string;
  servicePeriod: string;
  description: string;
}

export interface Engineer {
  id: string;
  name: string;
  certification: string;
  experience: string;
  role: string;
}

export interface AppState {
  announcements: Record<string, ParsedAnnouncement>;
  checklists: Record<string, ChecklistItem[]>;
  form: {
    projects: ProjectRecord[];
    engineers: Engineer[];
  };
}
