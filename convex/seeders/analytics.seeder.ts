/**
 * Analytics Seeder
 *
 * Seeds pageViews data for analytics dashboards
 */

import { BaseSeeder, type SeedDependency } from './base';
import type { Doc } from '../_generated/dataModel';

type PageViewData = Omit<Doc<'pageViews'>, '_creationTime' | '_id'>;

const PATHS = ['/', '/products', '/posts', '/about', '/contact', '/services', '/cart', '/checkout'];
const DEVICES = ['mobile', 'desktop', 'tablet'] as const;
const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge'];
const COUNTRIES = ['VN', 'US', 'SG', 'JP', 'KR'];

export class AnalyticsSeeder extends BaseSeeder<PageViewData> {
  moduleName = 'analytics';
  tableName = 'pageViews';
  dependencies: SeedDependency[] = [];

  generateFake(): PageViewData {
    const sessionId = this.faker.string.uuid();

    return {
      browser: this.randomElement(BROWSERS),
      country: this.randomElement(COUNTRIES),
      device: this.randomElement([...DEVICES]),
      os: this.faker.helpers.arrayElement(['iOS', 'Android', 'Windows', 'macOS', 'Linux']),
      path: this.randomElement(PATHS),
      referrer: this.randomBoolean(0.4) ? this.faker.internet.url() : undefined,
      sessionId,
      userAgent: this.faker.internet.userAgent(),
    };
  }

  validateRecord(record: PageViewData): boolean {
    return !!record.path && !!record.sessionId;
  }
}
