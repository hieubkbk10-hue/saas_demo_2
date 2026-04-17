import type { Id } from '@/convex/_generated/dataModel';
import type { BlogConfig } from '../_types';

export const BLOG_STYLES = [
  { id: 'grid', label: 'Grid' },
  { id: 'list', label: 'List' },
  { id: 'featured', label: 'Featured' },
  { id: 'magazine', label: 'Magazine' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'minimal', label: 'Minimal' }
];

export const DEFAULT_BLOG_CONFIG: BlogConfig = {
  itemCount: 8,
  selectedPostIds: [],
  selectionMode: 'auto',
  sortBy: 'newest',
  style: 'grid'
};

export interface BlogSortablePost {
  _id: Id<'posts'>;
  _creationTime: number;
  publishedAt?: number;
  views?: number;
}

export const sortBlogPosts = <T extends BlogSortablePost>(
  posts: T[],
  sortBy: BlogConfig['sortBy'],
  randomSeed = 'blog-random-seed',
): T[] => {
  if (sortBy === 'popular') {
    return [...posts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  }

  if (sortBy === 'random') {
    const seed = randomSeed
      .split('')
      .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);

    return [...posts]
      .map((post) => ({
        post,
        weight: (post._id.length * 97 + seed + post._creationTime) % 997,
      }))
      .sort((a, b) => a.weight - b.weight)
      .map((entry) => entry.post);
  }

  return [...posts].sort((a, b) => {
    const aTime = a.publishedAt ?? a._creationTime;
    const bTime = b.publishedAt ?? b._creationTime;
    return bTime - aTime;
  });
};
