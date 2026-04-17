import type {
  CareerConfig,
  CareerHarmony,
  CareerStyle,
  CareerTexts,
  JobPosition,
} from '../_types';

export const DEFAULT_CAREER_HARMONY: CareerHarmony = 'analogous';

export const DEFAULT_CAREER_TEXTS: CareerTexts = {
  subtitle: 'Tham gia đội ngũ của chúng tôi',
  emptyTitle: 'Chưa có vị trí tuyển dụng',
  emptyDescription: 'Thêm vị trí đầu tiên để bắt đầu',
  ctaButton: 'Ứng tuyển ngay',
  remainingLabel: 'vị trí khác',
};

export const CAREER_STYLES: Array<{ id: CareerStyle; label: string }> = [
  { id: 'cards', label: 'Cards' },
  { id: 'list', label: 'List' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'table', label: 'Table' },
  { id: 'featured', label: 'Featured' },
  { id: 'timeline', label: 'Timeline' },
];

export const normalizeCareerHarmony = (value?: string): CareerHarmony => {
  if (value === 'complementary' || value === 'triadic' || value === 'analogous') {
    return value;
  }
  return 'analogous';
};

export const createCareerJob = (overrides?: Partial<JobPosition>): JobPosition => ({
  title: '',
  department: '',
  location: '',
  type: '',
  salary: '',
  description: '',
  ...overrides,
});

export const DEFAULT_CAREER_CONFIG: CareerConfig = {
  jobs: [createCareerJob()],
  style: 'cards',
  texts: DEFAULT_CAREER_TEXTS,
  harmony: DEFAULT_CAREER_HARMONY,
};
