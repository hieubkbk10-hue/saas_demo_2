import type {
  BenefitsConfig,
  BenefitsEditorState,
  BenefitsHarmony,
  BenefitsHeaderAlign,
  BenefitsStyleOption,
} from '../_types';

export const DEFAULT_BENEFITS_HARMONY: BenefitsHarmony = 'analogous';

export const BENEFITS_STYLES: BenefitsStyleOption[] = [
  { id: 'cards', label: 'Cards' },
  { id: 'list', label: 'List' },
  { id: 'bento', label: 'Bento' },
  { id: 'row', label: 'Row' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'timeline', label: 'Timeline' },
];

export const BENEFITS_HARMONY_OPTIONS: Array<{ value: BenefitsHarmony; label: string }> = [
  { value: 'analogous', label: 'Analogous (+30°)' },
  { value: 'complementary', label: 'Complementary (180°)' },
  { value: 'triadic', label: 'Triadic (120°)' },
];

export const BENEFITS_HEADER_ALIGN_OPTIONS: Array<{ value: BenefitsHeaderAlign; label: string }> = [
  { value: 'left', label: 'Trái' },
  { value: 'center', label: 'Giữa' },
  { value: 'right', label: 'Phải' },
];

export const BENEFITS_GRID_COLUMNS_DESKTOP: Array<{ value: 3 | 4; label: string }> = [
  { value: 3, label: '3 cột' },
  { value: 4, label: '4 cột' },
];

export const BENEFITS_GRID_COLUMNS_MOBILE: Array<{ value: 1 | 2; label: string }> = [
  { value: 1, label: '1 cột' },
  { value: 2, label: '2 cột' },
];

export const DEFAULT_BENEFITS_CONFIG: BenefitsConfig = {
  buttonLink: '',
  buttonText: '',
  gridColumnsDesktop: 4,
  gridColumnsMobile: 2,
  headerAlign: 'left',
  harmony: DEFAULT_BENEFITS_HARMONY,
  heading: 'Giá trị cốt lõi',
  items: [
    {
      description: '',
      icon: 'Star',
      title: '',
    },
  ],
  style: 'cards',
  subHeading: 'Vì sao chọn chúng tôi?',
};

export const DEFAULT_BENEFITS_EDITOR_STATE: BenefitsEditorState = {
  buttonLink: DEFAULT_BENEFITS_CONFIG.buttonLink ?? '',
  buttonText: DEFAULT_BENEFITS_CONFIG.buttonText ?? '',
  gridColumnsDesktop: DEFAULT_BENEFITS_CONFIG.gridColumnsDesktop ?? 4,
  gridColumnsMobile: DEFAULT_BENEFITS_CONFIG.gridColumnsMobile ?? 2,
  headerAlign: DEFAULT_BENEFITS_CONFIG.headerAlign ?? 'left',
  harmony: DEFAULT_BENEFITS_HARMONY,
  heading: DEFAULT_BENEFITS_CONFIG.heading ?? '',
  items: [
    {
      description: '',
      icon: 'Star',
      id: 'benefit-default-1',
      title: '',
    },
  ],
  style: DEFAULT_BENEFITS_CONFIG.style,
  subHeading: DEFAULT_BENEFITS_CONFIG.subHeading ?? '',
};
