import type { Id } from '@/convex/_generated/dataModel';
import { withFormatMarker } from '@/components/common/RichContent';

export type ProductSupplementalFaqItem = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

export type ProductSupplementalTemplate = {
  _id?: Id<'productSupplementalContents'>;
  assignmentMode: 'products' | 'categories';
  categoryIds?: Id<'productCategories'>[];
  faqItems: ProductSupplementalFaqItem[];
  name: string;
  postContent?: string;
  preContent?: string;
  productIds?: Id<'products'>[];
  status: 'active' | 'inactive';
};

export const toRichTextContent = (html?: string) => {
  const raw = (html ?? '').trim();
  if (!raw) {
    return '';
  }
  return withFormatMarker('richtext', raw);
};

export const sortSupplementalFaqItems = (items?: ProductSupplementalFaqItem[]) =>
  [...(items ?? [])].sort((a, b) => a.order - b.order);
