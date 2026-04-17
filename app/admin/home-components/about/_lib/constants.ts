import type {
  AboutConfig,
  AboutEditorState,
  AboutEditorStat,
  AboutHarmony,
  AboutPersistStat,
  AboutStyle,
  AboutStyleOption,
} from '../_types';

export const DEFAULT_ABOUT_HARMONY: AboutHarmony = 'analogous';

export const ABOUT_STYLES: AboutStyleOption[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'bento', label: 'Bento Grid' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'split', label: 'Split' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'showcase', label: 'Showcase' },
];

const ABOUT_STYLE_SET = new Set<AboutStyle>(ABOUT_STYLES.map((style) => style.id));

const toText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

const createAboutStatId = (seed: number) => `about-stat-${seed}-${Math.random().toString(36).slice(2, 8)}`;

export const createAboutEditorStat = (overrides?: Partial<AboutEditorStat>): AboutEditorStat => {
  const seed = Date.now();

  return {
    id: overrides?.id ?? createAboutStatId(seed),
    value: toText(overrides?.value),
    label: toText(overrides?.label),
  };
};

export const normalizeAboutStyle = (value: unknown): AboutStyle => {
  if (typeof value === 'string' && ABOUT_STYLE_SET.has(value as AboutStyle)) {
    return value as AboutStyle;
  }
  return 'bento';
};

export const normalizeAboutHarmony = (value?: string): AboutHarmony => {
  if (value === 'complementary' || value === 'triadic' || value === 'analogous') {
    return value;
  }
  return 'analogous';
};

export const normalizeAboutPersistStats = (input: unknown): AboutPersistStat[] => {
  if (!Array.isArray(input)) {return [];}

  return input
    .map((raw) => {
      if (typeof raw !== 'object' || raw === null) {return null;}
      const source = raw as Record<string, unknown>;

      return {
        value: toText(source.value),
        label: toText(source.label),
      };
    })
    .filter((item): item is AboutPersistStat => item !== null);
};

export const normalizeAboutEditorStats = (input: unknown): AboutEditorStat[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((raw) => {
      if (typeof raw !== 'object' || raw === null) {return null;}
      const source = raw as Record<string, unknown>;
      const idSource = source.id;

      return createAboutEditorStat({
        id: typeof idSource === 'string' ? idSource : (typeof idSource === 'number' ? String(idSource) : undefined),
        value: toText(source.value),
        label: toText(source.label),
      });
    })
    .filter((item): item is AboutEditorStat => item !== null);
};

export const toAboutPersistStats = (stats: AboutEditorStat[]): AboutPersistStat[] => (
  stats.map((item) => ({
    value: toText(item.value),
    label: toText(item.label),
  }))
);

export const DEFAULT_ABOUT_CONFIG: AboutConfig = {
  buttonLink: '',
  buttonText: '',
  description: '',
  heading: '',
  image: '',
  imageCaption: '',
  harmony: DEFAULT_ABOUT_HARMONY,
  stats: [],
  style: 'bento',
  subHeading: '',
};

export const DEFAULT_ABOUT_EDITOR_STATE: AboutEditorState = {
  style: 'bento',
  subHeading: 'Câu chuyện thương hiệu',
  heading: 'Mang đến giá trị thực',
  description: 'Chúng tôi là đội ngũ chuyên gia với hơn 10 năm kinh nghiệm trong lĩnh vực...',
  image: '',
  imageCaption: '',
  stats: [
    createAboutEditorStat({ id: 'about-stat-default-1', value: '10+', label: 'Năm kinh nghiệm' }),
    createAboutEditorStat({ id: 'about-stat-default-2', value: '5000+', label: 'Khách hàng tin dùng' }),
  ],
  buttonText: 'Xem chi tiết',
  buttonLink: '/about',
};
