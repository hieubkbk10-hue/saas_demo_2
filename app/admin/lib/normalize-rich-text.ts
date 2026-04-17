const EMPTY_BLOCK_REGEX = /<p>\s*(?:<br\s*\/?\s*>|&nbsp;)?\s*<\/p>/gi;

const isEffectivelyEmpty = (html: string) => {
  const stripped = html
    .replace(EMPTY_BLOCK_REGEX, '')
    .replace(/\s+/g, '')
    .replace(/&nbsp;/g, '');
  return stripped.length === 0;
};

export const normalizeRichText = (html?: string) => {
  const raw = (html ?? '').trim();
  if (!raw) {return '';}
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return isEffectivelyEmpty(raw) ? '' : raw;
  }
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  const normalized = doc.body.innerHTML.trim();
  if (!normalized || isEffectivelyEmpty(normalized)) {
    return '';
  }
  return normalized;
};
