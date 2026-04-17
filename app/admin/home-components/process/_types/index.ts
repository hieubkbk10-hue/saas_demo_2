export interface ProcessStep {
  icon: string;
  title: string;
  description: string;
}

export type ProcessStyle = 'horizontal' | 'stepper' | 'cards' | 'accordion' | 'minimal' | 'grid';

export type ProcessBrandMode = 'single' | 'dual';

export interface ProcessConfig {
  steps: ProcessStep[];
  style: ProcessStyle;
}
