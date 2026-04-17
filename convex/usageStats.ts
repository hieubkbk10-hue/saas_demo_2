import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Average document sizes (in KB) - estimates based on typical data
const AVG_DOC_SIZES: Record<string, number> = {
  activityLogs: 0.5,
  comments: 0.5,
  customers: 1,
  default: 1,
  notifications: 1,
  orders: 3,
  pageViews: 0.3,
  posts: 5,
  products: 2,
};

// Average file sizes (in KB)
const AVG_FILE_SIZE = 500; // 500KB per file

// Helper: Get today's date string
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Helper: Get date string for N days ago
function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split("T")[0];
}

// Track a database read operation
export const trackDbRead = internalMutation({
  args: {
    count: v.optional(v.number()),
    table: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = getTodayDate();
    const count = args.count ?? 1;
    const table = args.table ?? "default";
    const docSize = AVG_DOC_SIZES[table] ?? AVG_DOC_SIZES.default;
    const bandwidthKB = count * docSize;

    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        dbReads: existing.dbReads + count,
        estimatedDbBandwidth: existing.estimatedDbBandwidth + bandwidthKB,
      });
    } else {
      await ctx.db.insert("usageStats", {
        date,
        dbReads: count,
        dbWrites: 0,
        estimatedDbBandwidth: bandwidthKB,
        estimatedFileBandwidth: 0,
        fileReads: 0,
        fileWrites: 0,
      });
    }
    return null;
  },
  returns: v.null(),
});

// Track a database write operation
export const trackDbWrite = internalMutation({
  args: {
    count: v.optional(v.number()),
    table: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = getTodayDate();
    const count = args.count ?? 1;
    const table = args.table ?? "default";
    const docSize = AVG_DOC_SIZES[table] ?? AVG_DOC_SIZES.default;
    const bandwidthKB = count * docSize;

    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        dbWrites: existing.dbWrites + count,
        estimatedDbBandwidth: existing.estimatedDbBandwidth + bandwidthKB,
      });
    } else {
      await ctx.db.insert("usageStats", {
        date,
        dbReads: 0,
        dbWrites: count,
        estimatedDbBandwidth: bandwidthKB,
        estimatedFileBandwidth: 0,
        fileReads: 0,
        fileWrites: 0,
      });
    }
    return null;
  },
  returns: v.null(),
});

// Track a file read operation
export const trackFileRead = internalMutation({
  args: {
    count: v.optional(v.number()),
    sizeKB: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const date = getTodayDate();
    const count = args.count ?? 1;
    const sizeKB = args.sizeKB ?? AVG_FILE_SIZE;
    const bandwidthKB = count * sizeKB;

    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        estimatedFileBandwidth: existing.estimatedFileBandwidth + bandwidthKB,
        fileReads: existing.fileReads + count,
      });
    } else {
      await ctx.db.insert("usageStats", {
        date,
        dbReads: 0,
        dbWrites: 0,
        estimatedDbBandwidth: 0,
        estimatedFileBandwidth: bandwidthKB,
        fileReads: count,
        fileWrites: 0,
      });
    }
    return null;
  },
  returns: v.null(),
});

// Track a file write/upload operation
export const trackFileWrite = internalMutation({
  args: {
    count: v.optional(v.number()),
    sizeKB: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const date = getTodayDate();
    const count = args.count ?? 1;
    const sizeKB = args.sizeKB ?? AVG_FILE_SIZE;
    const bandwidthKB = count * sizeKB;

    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        estimatedFileBandwidth: existing.estimatedFileBandwidth + bandwidthKB,
        fileWrites: existing.fileWrites + count,
      });
    } else {
      await ctx.db.insert("usageStats", {
        date,
        dbReads: 0,
        dbWrites: 0,
        estimatedDbBandwidth: 0,
        estimatedFileBandwidth: bandwidthKB,
        fileReads: 0,
        fileWrites: count,
      });
    }
    return null;
  },
  returns: v.null(),
});

// Public mutation for tracking (can be called from client)
export const track = mutation({
  args: {
    count: v.optional(v.number()),
    sizeKB: v.optional(v.number()),
    table: v.optional(v.string()),
    type: v.union(
      v.literal("dbRead"),
      v.literal("dbWrite"),
      v.literal("fileRead"),
      v.literal("fileWrite")
    ),
  },
  handler: async (ctx, args) => {
    const date = getTodayDate();
    const count = args.count ?? 1;

    let bandwidthKB = 0;
    if (args.type === "dbRead" || args.type === "dbWrite") {
      const table = args.table ?? "default";
      const docSize = AVG_DOC_SIZES[table] ?? AVG_DOC_SIZES.default;
      bandwidthKB = count * docSize;
    } else {
      bandwidthKB = count * (args.sizeKB ?? AVG_FILE_SIZE);
    }

    const existing = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      const updates: Record<string, number> = {};
      if (args.type === "dbRead") {
        updates.dbReads = existing.dbReads + count;
        updates.estimatedDbBandwidth = existing.estimatedDbBandwidth + bandwidthKB;
      } else if (args.type === "dbWrite") {
        updates.dbWrites = existing.dbWrites + count;
        updates.estimatedDbBandwidth = existing.estimatedDbBandwidth + bandwidthKB;
      } else if (args.type === "fileRead") {
        updates.fileReads = existing.fileReads + count;
        updates.estimatedFileBandwidth = existing.estimatedFileBandwidth + bandwidthKB;
      } else if (args.type === "fileWrite") {
        updates.fileWrites = existing.fileWrites + count;
        updates.estimatedFileBandwidth = existing.estimatedFileBandwidth + bandwidthKB;
      }
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("usageStats", {
        date,
        dbReads: args.type === "dbRead" ? count : 0,
        dbWrites: args.type === "dbWrite" ? count : 0,
        estimatedDbBandwidth: args.type.startsWith("db") ? bandwidthKB : 0,
        estimatedFileBandwidth: args.type.startsWith("file") ? bandwidthKB : 0,
        fileReads: args.type === "fileRead" ? count : 0,
        fileWrites: args.type === "fileWrite" ? count : 0,
      });
    }
    return null;
  },
  returns: v.null(),
});

// Average sizes for bandwidth estimation (in KB)
const PAGEVIEW_SIZE_KB = 0.5; // ~500 bytes per pageview record
const ACTIVITY_LOG_SIZE_KB = 1; // ~1KB per activity log
const FILE_AVG_SIZE_KB = 200; // Average file size for media operations

// Get bandwidth data for chart - aggregates from pageViews + activityLogs
export const getBandwidthData = query({
  args: {
    range: v.union(
      v.literal("today"),
      v.literal("7d"),
      v.literal("1m"),
      v.literal("3m"),
      v.literal("1y")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Define range configurations
    const configs: Record<
      string,
      { days: number; points: number; format: (d: Date) => string }
    > = {
      "1m": {
        days: 30,
        format: (d) => `${d.getDate()}/${d.getMonth() + 1}`,
        points: 10,
      },
      "1y": {
        days: 365,
        format: (d) => `T${d.getMonth() + 1}`,
        points: 12,
      },
      "3m": {
        days: 90,
        format: (d) => `${d.getDate()}/${d.getMonth() + 1}`,
        points: 12,
      },
      "7d": {
        days: 7,
        format: (d) => `${d.getDate()}/${d.getMonth() + 1}`,
        points: 7,
      },
      today: {
        days: 1,
        points: 12, // Hourly for today
        format: (d) => `${d.getHours()}:00`,
      },
    };

    const config = configs[args.range];
    const startTime = now - config.days * 24 * 60 * 60 * 1000;

    // Fetch pageViews in range (limit to prevent bandwidth explosion)
    const pageViews = await ctx.db
      .query("pageViews")
      .order("desc")
      .take(10_000);
    const pageViewsInRange = pageViews.filter((pv) => pv._creationTime >= startTime);

    // Fetch activityLogs in range
    const activityLogs = await ctx.db
      .query("activityLogs")
      .order("desc")
      .take(5000);
    const activityLogsInRange = activityLogs.filter((al) => al._creationTime >= startTime);

    // Count media-related activities for file bandwidth
    const mediaActivities = activityLogsInRange.filter(
      (al) => al.targetType === "media" || al.targetType === "images"
    );

    // Group by time periods
    const intervalMs = (config.days * 24 * 60 * 60 * 1000) / config.points;
    const result: { time: string; dbBandwidth: number; fileBandwidth: number }[] = [];

    for (let i = config.points - 1; i >= 0; i--) {
      const periodEnd = now - i * intervalMs;
      const periodStart = periodEnd - intervalMs;

      // Count items in this period
      const pvCount = pageViewsInRange.filter(
        (pv) => pv._creationTime >= periodStart && pv._creationTime < periodEnd
      ).length;

      const alCount = activityLogsInRange.filter(
        (al) => al._creationTime >= periodStart && al._creationTime < periodEnd
      ).length;

      const mediaCount = mediaActivities.filter(
        (al) => al._creationTime >= periodStart && al._creationTime < periodEnd
      ).length;

      // Calculate bandwidth (convert to MB)
      const dbBandwidthKB = pvCount * PAGEVIEW_SIZE_KB + alCount * ACTIVITY_LOG_SIZE_KB;
      const fileBandwidthKB = mediaCount * FILE_AVG_SIZE_KB;

      const date = new Date(periodEnd);
      result.push({
        time: config.format(date),
        dbBandwidth: Math.round(dbBandwidthKB / 1024 * 100) / 100, // MB with 2 decimals
        fileBandwidth: Math.round(fileBandwidthKB / 1024 * 100) / 100,
      });
    }

    const totalDbBandwidth = Math.round(result.reduce((sum, d) => sum + d.dbBandwidth, 0) * 100) / 100;
    const totalFileBandwidth = Math.round(result.reduce((sum, d) => sum + d.fileBandwidth, 0) * 100) / 100;
    const hasData = pageViewsInRange.length > 0 || activityLogsInRange.length > 0;

    return {
      data: result,
      hasData,
      totalDbBandwidth,
      totalFileBandwidth,
    };
  },
  returns: v.object({
    data: v.array(
      v.object({
        dbBandwidth: v.number(),
        fileBandwidth: v.number(),
        time: v.string(),
      })
    ),
    hasData: v.boolean(),
    totalDbBandwidth: v.number(),
    totalFileBandwidth: v.number(),
  }),
});

// Get today's stats summary
export const getTodayStats = query({
  args: {},
  handler: async (ctx) => {
    const date = getTodayDate();
    const stat = await ctx.db
      .query("usageStats")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (!stat) {return null;}

    return {
      date: stat.date,
      dbReads: stat.dbReads,
      dbWrites: stat.dbWrites,
      estimatedDbBandwidth: stat.estimatedDbBandwidth,
      estimatedFileBandwidth: stat.estimatedFileBandwidth,
      fileReads: stat.fileReads,
      fileWrites: stat.fileWrites,
    };
  },
  returns: v.union(
    v.object({
      date: v.string(),
      dbReads: v.number(),
      dbWrites: v.number(),
      estimatedDbBandwidth: v.number(),
      estimatedFileBandwidth: v.number(),
      fileReads: v.number(),
      fileWrites: v.number(),
    }),
    v.null()
  ),
});

// Cleanup old stats (keep last 400 days)
export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffDate = getDateNDaysAgo(400);
    const oldStats = await ctx.db
      .query("usageStats")
      .withIndex("by_date")
      .collect();

    let deleted = 0;
    for (const stat of oldStats) {
      if (stat.date < cutoffDate) {
        await ctx.db.delete(stat._id);
        deleted++;
      }
    }
    return deleted;
  },
  returns: v.number(),
});
