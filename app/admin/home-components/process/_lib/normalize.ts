import type { ProcessConfig, ProcessStep, ProcessStyle } from '../_types';

export interface ProcessRenderableStep {
  key: string;
  icon: string;
  title: string;
  description: string;
}

export interface ProcessFormStep extends ProcessStep {
  id: string;
}

const PROCESS_STYLE_SET = new Set<ProcessStyle>([
  'horizontal',
  'stepper',
  'cards',
  'accordion',
  'minimal',
  'grid',
]);

const coerceText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

const getStepBaseKey = (
  source: Record<string, unknown>,
  index: number,
  icon: string,
  title: string,
  description: string,
) => {
  const keyCandidate = source.uiKey ?? source.key ?? source.id;

  if (typeof keyCandidate === 'string' && keyCandidate.trim().length > 0) {
    return `key:${keyCandidate.trim()}`;
  }

  if (typeof keyCandidate === 'number') {
    return `key:${keyCandidate}`;
  }

  const contentKey = `${title.trim()}|${description.trim()}|${icon.trim()}`;
  if (contentKey.replaceAll('|', '').trim().length > 0) {
    return `content:${contentKey}`;
  }

  return `idx:${index}`;
};

const toStepRecord = (raw: unknown): Record<string, unknown> => {
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }
  return {};
};

export const normalizeProcessStyle = (value: unknown): ProcessStyle => {
  if (typeof value === 'string' && PROCESS_STYLE_SET.has(value as ProcessStyle)) {
    return value as ProcessStyle;
  }
  return 'horizontal';
};

export const normalizeProcessRenderSteps = (input: unknown): ProcessRenderableStep[] => {
  if (!Array.isArray(input)) {return [];}

  const duplicates = new Map<string, number>();

  return input.map((raw, index) => {
    const step = toStepRecord(raw);
    const icon = coerceText(step.icon);
    const title = coerceText(step.title);
    const description = coerceText(step.description);
    const baseKey = getStepBaseKey(step, index, icon, title, description);
    const count = duplicates.get(baseKey) ?? 0;
    duplicates.set(baseKey, count + 1);

    return {
      key: count === 0 ? baseKey : `${baseKey}::${count}`,
      icon,
      title,
      description,
    };
  });
};

const generateFormStepId = (seed: string, index: number) => `${seed}-${index}-${Math.random().toString(36).slice(2, 8)}`;

export const createProcessFormStep = (partial?: Partial<ProcessStep>): ProcessFormStep => ({
  id: generateFormStepId('process-step', Date.now()),
  icon: partial?.icon ?? '',
  title: partial?.title ?? '',
  description: partial?.description ?? '',
});

export const normalizeProcessFormSteps = (input: unknown): ProcessFormStep[] => {
  const normalized = normalizeProcessRenderSteps(input);

  return normalized.map((step, index) => ({
    id: generateFormStepId(step.key.replaceAll(':', '-'), index),
    icon: step.icon,
    title: step.title,
    description: step.description,
  }));
};

export const serializeProcessFormSteps = (steps: ProcessFormStep[]): ProcessStep[] => (
  steps.map((step) => ({
    icon: step.icon,
    title: step.title,
    description: step.description,
  }))
);

export const normalizeProcessConfig = (rawConfig: unknown): ProcessConfig => {
  const config = (typeof rawConfig === 'object' && rawConfig !== null)
    ? rawConfig as Record<string, unknown>
    : {};

  return {
    steps: serializeProcessFormSteps(normalizeProcessFormSteps(config.steps)),
    style: normalizeProcessStyle(config.style),
  };
};
