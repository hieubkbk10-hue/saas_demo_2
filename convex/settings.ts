import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const settingDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("settings"),
  group: v.string(),
  key: v.string(),
  value: v.any(),
});

// CRIT-001 FIX: Thêm limit để tránh memory overflow
export const listAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("settings").take(500),
  returns: v.array(settingDoc),
});

export const listByGroup = query({
  args: { group: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("settings")
      .withIndex("by_group", (q) => q.eq("group", args.group))
      .collect(),
  returns: v.array(settingDoc),
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique(),
  returns: v.union(settingDoc, v.null()),
});

export const getValue = query({
  args: { defaultValue: v.optional(v.any()), key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    return setting?.value ?? args.defaultValue ?? null;
  },
  returns: v.any(),
});

// HIGH-001 FIX: Batch load thay vì N+1 queries
export const getMultiple = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    // Batch load tất cả settings 1 lần
    const allSettings = await ctx.db.query("settings").take(500);
    const settingsMap = new Map(allSettings.map(s => [s.key, s.value]));
    
    // Build result từ Map (O(1) lookup)
    const result: Record<string, unknown> = {};
    args.keys.forEach(key => {
      result[key] = settingsMap.get(key) ?? null;
    });
    return result;
  },
  returns: v.record(v.string(), v.any()),
});

export const set = mutation({
  args: { group: v.string(), key: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { group: args.group, value: args.value });
    } else {
      await ctx.db.insert("settings", args);
    }
    return null;
  },
  returns: v.null(),
});

// TICKET #1 FIX: Batch load thay vì N+1 queries
export const setMultiple = mutation({
  args: { settings: v.array(v.object({ group: v.string(), key: v.string(), value: v.any() })) },
  handler: async (ctx, args) => {
    // Batch load tất cả settings hiện có 1 lần
    const allSettings = await ctx.db.query("settings").take(500);
    const settingsMap = new Map(allSettings.map(s => [s.key, s]));
    
    // Batch updates với Promise.all
    await Promise.all(args.settings.map(async (setting) => {
      const existing = settingsMap.get(setting.key);
      if (existing) {
        await ctx.db.patch(existing._id, { group: setting.group, value: setting.value });
      } else {
        await ctx.db.insert("settings", setting);
      }
    }));
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (setting) {await ctx.db.delete(setting._id);}
    return null;
  },
  returns: v.null(),
});

export const removeMultiple = mutation({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const keySet = new Set(args.keys);
    const settings = await ctx.db.query('settings').take(500);
    const toDelete = settings.filter(setting => keySet.has(setting.key));
    await Promise.all(toDelete.map(setting => ctx.db.delete(setting._id)));
    return null;
  },
  returns: v.null(),
});

// TICKET #2 FIX: Dùng Promise.all thay vì sequential deletes
export const removeByGroup = mutation({
  args: { group: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_group", (q) => q.eq("group", args.group))
      .collect();
    await Promise.all(settings.map( async setting => ctx.db.delete(setting._id)));
    return null;
  },
  returns: v.null(),
});

// MED-004 FIX: Thêm limit
export const listGroups = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").take(500);
    const groups = new Set<string>();
    for (const setting of settings) {
      groups.add(setting.group);
    }
    return [...groups].sort();
  },
  returns: v.array(v.string()),
});
