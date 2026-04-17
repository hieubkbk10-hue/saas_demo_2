import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { listSeedableModuleKeys } from "./seeders";
import type { TableNames } from "./_generated/dataModel";
import { SEED_MODULE_METADATA } from "../lib/modules/seed-registry";

// ============================================================
// DATA MANAGER - Quản lý clear data cho hệ thống
// NOTE: Seed logic đã được migrate sang seedManager.ts
// Best practices: Batch processing, async operations, safe deletion
// ============================================================

// === CONSTANTS ===
const MAX_COUNT_LIMIT = 1000; // Max records to count (show "1000+" if exceeded)
const BATCH_DELETE_LIMIT = 500; // Records per delete batch to avoid timeout

const EXTRA_TABLES: TableNames[] = [
  "moduleFields",
  "moduleFeatures",
  "moduleSettings",
  "convexDashboard",
  "activityLogs",
  "menuItems",
  "homeComponents",
  "images",
] as TableNames[];

// Danh sách các bảng trong hệ thống
const ALL_TABLES = Array.from(new Set([
  ...listSeedableModuleKeys(),
  ...EXTRA_TABLES,
])) as TableNames[];

type TableName = TableNames;

// === TABLE CATEGORIES ===
const TABLE_CATEGORIES: Record<string, string> = {
  activityLogs: "logs",
  convexDashboard: "system",
  homeComponents: "website",
  images: "media",
  menuItems: "website",
  menus: "website",
  moduleFeatures: "system",
  moduleFields: "system",
  moduleSettings: "system",
};

const SYSTEM_TABLES = new Set([
  ...Object.entries(SEED_MODULE_METADATA)
    .filter(([, meta]) => meta.category === "system")
    .map(([key]) => key),
  "moduleFields",
  "moduleFeatures",
  "moduleSettings",
  "convexDashboard",
]);

// ============================================================
// QUERIES - Đếm số lượng records trong các bảng
// ============================================================

export const getTableStats = query({
  args: {},
  handler: async (ctx) => {
    const results = await Promise.all(
      ALL_TABLES.map(async (table) => {
        const records = await ctx.db.query(table).take(MAX_COUNT_LIMIT);
        const metadataCategory = SEED_MODULE_METADATA[table]?.category;
        return {
          category: metadataCategory || TABLE_CATEGORIES[table] || "other",
          count: records.length,
          isApproximate: records.length === MAX_COUNT_LIMIT,
          table,
        };
      })
    );
    
    return results;
  },
  returns: v.array(v.object({
    category: v.string(),
    count: v.number(),
    isApproximate: v.boolean(),
    table: v.string(),
  })),
});

// ============================================================
// CLEAR FUNCTIONS - Xóa data theo bảng hoặc category
// ============================================================

export const clearTable = mutation({
  args: { table: v.string() },
  handler: async (ctx, args) => {
    const tableName = args.table as TableName;
    if (!ALL_TABLES.includes(tableName)) {
      throw new Error(`Invalid table: ${args.table}`);
    }
    
    const records = await ctx.db.query(tableName).take(BATCH_DELETE_LIMIT);
    await Promise.all(records.map( async record => ctx.db.delete(record._id)));
    
    const remaining = await ctx.db.query(tableName).first();
    return { deleted: records.length, hasMore: remaining !== null };
  },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
});

export const clearAllData = mutation({
  args: { 
    excludeSystem: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tablesToClear = args.excludeSystem 
      ? ALL_TABLES.filter(t => !SYSTEM_TABLES.has(t))
      : [...ALL_TABLES];
    
    const results: { table: string; deleted: number }[] = [];
    let totalDeleted = 0;
    let totalBatchSize = 0;
    
    for (const table of tablesToClear) {
      if (totalBatchSize >= BATCH_DELETE_LIMIT) {break;}
      
      const batchLimit = Math.min(BATCH_DELETE_LIMIT, BATCH_DELETE_LIMIT - totalBatchSize);
      const records = await ctx.db.query(table).take(batchLimit);
      
      await Promise.all(records.map( async record => ctx.db.delete(record._id)));
      
      if (records.length > 0) {
        results.push({ deleted: records.length, table });
        totalDeleted += records.length;
        totalBatchSize += records.length;
      }
    }
    
    let hasMore = false;
    for (const table of tablesToClear) {
      const remaining = await ctx.db.query(table).first();
      if (remaining) {
        hasMore = true;
        break;
      }
    }
    
    return { hasMore, tables: results, totalDeleted };
  },
  returns: v.object({ 
    hasMore: v.boolean(),
    tables: v.array(v.object({ deleted: v.number(), table: v.string() })),
    totalDeleted: v.number(),
  }),
});
