import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { HOME_COMPONENT_TYPE_VALUES } from "../lib/home-components/componentTypes";
import { DEFAULT_FONT_KEY, FONT_REGISTRY } from "../lib/fonts/registry";

const GROUP_KEY = "home_components";
const HIDDEN_TYPES_KEY = "create_hidden_types";
const OVERRIDES_KEY = "type_color_overrides";
const FONT_OVERRIDES_KEY = "type_font_overrides";
const GLOBAL_FONT_OVERRIDE_KEY = "global_font_override";
const DEFAULT_BRAND_COLOR = "#3b82f6";
const SUPPORTED_CUSTOM_TYPES = new Set(HOME_COMPONENT_TYPE_VALUES);
const FONT_KEYS = new Set(FONT_REGISTRY.map((font) => font.key));

const colorMode = v.union(v.literal("single"), v.literal("dual"));
const colorOverrideDoc = v.object({
  enabled: v.boolean(),
  systemEnabled: v.boolean(),
  mode: colorMode,
  primary: v.string(),
  secondary: v.string(),
});

const fontOverrideDoc = v.object({
  enabled: v.boolean(),
  systemEnabled: v.boolean(),
  fontKey: v.string(),
});

const globalFontOverrideDoc = v.object({
  enabled: v.boolean(),
  fontKey: v.string(),
});

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());
const isValidFontKey = (value: string) => FONT_KEYS.has(value);

const normalizeHiddenTypes = (value: unknown): string[] => {
  if (!Array.isArray(value)) {return [];}
  const result = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return Array.from(new Set(result));
};

const normalizeColorOverride = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const enabled = Boolean(record.enabled);
  const systemEnabled = typeof record.systemEnabled === "boolean" ? record.systemEnabled : enabled;
  const mode: "single" | "dual" = record.mode === "single" ? "single" : "dual";
  const primary = typeof record.primary === "string" && isValidHexColor(record.primary)
    ? record.primary
    : DEFAULT_BRAND_COLOR;
  let secondary = typeof record.secondary === "string" && isValidHexColor(record.secondary)
    ? record.secondary
    : primary;
  if (mode === "single") {
    secondary = primary;
  }
  return {
    enabled,
    systemEnabled,
    mode,
    primary,
    secondary,
  };
};

const normalizeFontOverride = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const enabled = Boolean(record.enabled);
  const systemEnabled = typeof record.systemEnabled === "boolean" ? record.systemEnabled : enabled;
  const fontKey = typeof record.fontKey === "string" && isValidFontKey(record.fontKey)
    ? record.fontKey
    : DEFAULT_FONT_KEY;
  return {
    enabled,
    systemEnabled,
    fontKey,
  };
};

const normalizeGlobalFontOverride = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return {
      enabled: false,
      fontKey: DEFAULT_FONT_KEY,
    };
  }
  const record = value as Record<string, unknown>;
  const enabled = Boolean(record.enabled);
  const fontKey = typeof record.fontKey === "string" && isValidFontKey(record.fontKey)
    ? record.fontKey
    : DEFAULT_FONT_KEY;
  return { enabled, fontKey };
};

const normalizeOverrides = (value: unknown): Record<string, { enabled: boolean; systemEnabled: boolean; mode: "single" | "dual"; primary: string; secondary: string }> => {
  if (!value || typeof value !== "object") {return {};}
  const result: Record<string, { enabled: boolean; systemEnabled: boolean; mode: "single" | "dual"; primary: string; secondary: string }> = {};
  const record = value as Record<string, unknown>;
  Object.entries(record).forEach(([key, entry]) => {
    const normalized = normalizeColorOverride(entry);
    if (normalized) {
      result[key] = normalized;
    }
  });
  return result;
};

const normalizeFontOverrides = (value: unknown): Record<string, { enabled: boolean; systemEnabled: boolean; fontKey: string }> => {
  if (!value || typeof value !== "object") {return {};}
  const result: Record<string, { enabled: boolean; systemEnabled: boolean; fontKey: string }> = {};
  const record = value as Record<string, unknown>;
  Object.entries(record).forEach(([key, entry]) => {
    const normalized = normalizeFontOverride(entry);
    if (normalized) {
      result[key] = normalized;
    }
  });
  return result;
};

const getSettingValue = async (ctx: QueryCtx | MutationCtx, key: string) => {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  return setting?.value ?? null;
};

const upsertSetting = async (ctx: MutationCtx, key: string, value: unknown) => {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (setting) {
    await ctx.db.patch(setting._id, { group: GROUP_KEY, value });
    return;
  }
  await ctx.db.insert("settings", { group: GROUP_KEY, key, value });
};

export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    const hiddenTypes = normalizeHiddenTypes(await getSettingValue(ctx, HIDDEN_TYPES_KEY));
    const overrides = normalizeOverrides(await getSettingValue(ctx, OVERRIDES_KEY));
    const fontOverrides = normalizeFontOverrides(await getSettingValue(ctx, FONT_OVERRIDES_KEY));
    const globalFontOverride = normalizeGlobalFontOverride(await getSettingValue(ctx, GLOBAL_FONT_OVERRIDE_KEY));
    return {
      hiddenTypes,
      typeColorOverrides: overrides,
      typeFontOverrides: fontOverrides,
      globalFontOverride,
    };
  },
  returns: v.object({
    hiddenTypes: v.array(v.string()),
    typeColorOverrides: v.record(v.string(), colorOverrideDoc),
    typeFontOverrides: v.record(v.string(), fontOverrideDoc),
    globalFontOverride: globalFontOverrideDoc,
  }),
});

export const setCreateVisibility = mutation({
  args: { hiddenTypes: v.array(v.string()) },
  handler: async (ctx, args) => {
    const normalized = normalizeHiddenTypes(args.hiddenTypes);
    await upsertSetting(ctx, HIDDEN_TYPES_KEY, normalized);
    return null;
  },
  returns: v.null(),
});

export const setTypeColorOverride = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    systemEnabled: v.optional(v.boolean()),
    mode: v.optional(colorMode),
    primary: v.optional(v.string()),
    secondary: v.optional(v.string()),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    if (!SUPPORTED_CUSTOM_TYPES.has(args.type)) {
      return null;
    }

    const overrides = normalizeOverrides(await getSettingValue(ctx, OVERRIDES_KEY));
    const current = normalizeColorOverride(overrides[args.type]) ?? {
      enabled: false,
      systemEnabled: false,
      mode: "dual" as const,
      primary: DEFAULT_BRAND_COLOR,
      secondary: DEFAULT_BRAND_COLOR,
    };

    const nextMode: "single" | "dual" = args.mode ?? current.mode;
    const primaryCandidate = args.primary ?? current.primary;
    const primary = isValidHexColor(primaryCandidate) ? primaryCandidate : current.primary;
    const providedSecondary = args.secondary ?? current.secondary;
    let secondary = isValidHexColor(providedSecondary) ? providedSecondary : primary;
    if (nextMode === "single") {
      secondary = primary;
    }

    overrides[args.type] = {
      enabled: typeof args.enabled === "boolean" ? args.enabled : current.enabled,
      systemEnabled: typeof args.systemEnabled === "boolean" ? args.systemEnabled : current.systemEnabled,
      mode: nextMode,
      primary,
      secondary,
    };
    await upsertSetting(ctx, OVERRIDES_KEY, overrides);
    return null;
  },
  returns: v.null(),
});

export const bulkSetTypeColorOverride = mutation({
  args: { systemEnabled: v.boolean(), types: v.array(v.string()) },
  handler: async (ctx, args) => {
    const overrides = normalizeOverrides(await getSettingValue(ctx, OVERRIDES_KEY));
    args.types
      .filter((type) => SUPPORTED_CUSTOM_TYPES.has(type))
      .forEach((type) => {
        const current = normalizeColorOverride(overrides[type]) ?? {
          enabled: false,
          systemEnabled: false,
          mode: "dual" as const,
          primary: DEFAULT_BRAND_COLOR,
          secondary: DEFAULT_BRAND_COLOR,
        };
        overrides[type] = { ...current, systemEnabled: args.systemEnabled };
      });
    await upsertSetting(ctx, OVERRIDES_KEY, overrides);
    return null;
  },
  returns: v.null(),
});

export const setTypeFontOverride = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    systemEnabled: v.optional(v.boolean()),
    fontKey: v.optional(v.string()),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    if (!SUPPORTED_CUSTOM_TYPES.has(args.type)) {
      return null;
    }

    const overrides = normalizeFontOverrides(await getSettingValue(ctx, FONT_OVERRIDES_KEY));
    const current = normalizeFontOverride(overrides[args.type]) ?? {
      enabled: false,
      systemEnabled: false,
      fontKey: DEFAULT_FONT_KEY,
    };

    const fontKeyCandidate = args.fontKey ?? current.fontKey;
    const fontKey = isValidFontKey(fontKeyCandidate) ? fontKeyCandidate : current.fontKey;

    overrides[args.type] = {
      enabled: typeof args.enabled === "boolean" ? args.enabled : current.enabled,
      systemEnabled: typeof args.systemEnabled === "boolean" ? args.systemEnabled : current.systemEnabled,
      fontKey,
    };
    await upsertSetting(ctx, FONT_OVERRIDES_KEY, overrides);
    return null;
  },
  returns: v.null(),
});

export const bulkSetTypeFontOverride = mutation({
  args: { systemEnabled: v.boolean(), types: v.array(v.string()) },
  handler: async (ctx, args) => {
    const overrides = normalizeFontOverrides(await getSettingValue(ctx, FONT_OVERRIDES_KEY));
    args.types
      .filter((type) => SUPPORTED_CUSTOM_TYPES.has(type))
      .forEach((type) => {
        const current = normalizeFontOverride(overrides[type]) ?? {
          enabled: false,
          systemEnabled: false,
          fontKey: DEFAULT_FONT_KEY,
        };
        overrides[type] = { ...current, systemEnabled: args.systemEnabled };
      });
    await upsertSetting(ctx, FONT_OVERRIDES_KEY, overrides);
    return null;
  },
  returns: v.null(),
});

export const setGlobalFontOverride = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    fontKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const current = normalizeGlobalFontOverride(await getSettingValue(ctx, GLOBAL_FONT_OVERRIDE_KEY));
    const nextFontKeyCandidate = args.fontKey ?? current.fontKey;
    const fontKey = isValidFontKey(nextFontKeyCandidate) ? nextFontKeyCandidate : current.fontKey;

    const next = {
      enabled: typeof args.enabled === "boolean" ? args.enabled : current.enabled,
      fontKey,
    };
    await upsertSetting(ctx, GLOBAL_FONT_OVERRIDE_KEY, next);
    return null;
  },
  returns: v.null(),
});
