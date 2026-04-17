export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  facebook: string;
  linkedin: string;
  twitter: string;
  email: string;
}

export interface TeamEditorMember extends TeamMember {
  id: number;
}

export type TeamStyle = 'grid' | 'cards' | 'carousel' | 'bento' | 'timeline' | 'spotlight';

export type TeamBrandMode = 'single' | 'dual';

export interface TeamConfig {
  members: TeamMember[];
  style: TeamStyle;
  texts?: Record<string, string>;
}
