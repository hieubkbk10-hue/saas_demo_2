/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityLogs from "../activityLogs.js";
import type * as admin_modules from "../admin/modules.js";
import type * as admin_presets from "../admin/presets.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as cart from "../cart.js";
import type * as comments from "../comments.js";
import type * as contactInbox from "../contactInbox.js";
import type * as convexDashboard from "../convexDashboard.js";
import type * as customers from "../customers.js";
import type * as dataManager from "../dataManager.js";
import type * as homeComponentSystemConfig from "../homeComponentSystemConfig.js";
import type * as homeComponents from "../homeComponents.js";
import type * as homepageWizard from "../homepageWizard.js";
import type * as ia from "../ia.js";
import type * as kanban from "../kanban.js";
import type * as landingPages from "../landingPages.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as lib_iaSlugs from "../lib/iaSlugs.js";
import type * as lib_moduleConfigSync from "../lib/moduleConfigSync.js";
import type * as lib_password from "../lib/password.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_search from "../lib/search.js";
import type * as lib_validators from "../lib/validators.js";
import type * as media from "../media.js";
import type * as menus from "../menus.js";
import type * as migrationBundles from "../migrationBundles.js";
import type * as model_comments from "../model/comments.js";
import type * as model_orders from "../model/orders.js";
import type * as model_postCategories from "../model/postCategories.js";
import type * as model_posts from "../model/posts.js";
import type * as model_serviceCategories from "../model/serviceCategories.js";
import type * as model_services from "../model/services.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as pageViews from "../pageViews.js";
import type * as postCategories from "../postCategories.js";
import type * as posts from "../posts.js";
import type * as productCategories from "../productCategories.js";
import type * as productImageFrames from "../productImageFrames.js";
import type * as productOptionValues from "../productOptionValues.js";
import type * as productOptions from "../productOptions.js";
import type * as productSupplementalContents from "../productSupplementalContents.js";
import type * as productVariants from "../productVariants.js";
import type * as products from "../products.js";
import type * as promotions from "../promotions.js";
import type * as roles from "../roles.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as seedManager from "../seedManager.js";
import type * as seeders_base from "../seeders/base.js";
import type * as seeders_dependencies from "../seeders/dependencies.js";
import type * as seeders_fakerVi from "../seeders/fakerVi.js";
import type * as seeders_index from "../seeders/index.js";
import type * as seeders_registry from "../seeders/registry.js";
import type * as serviceCategories from "../serviceCategories.js";
import type * as services from "../services.js";
import type * as settings from "../settings.js";
import type * as storage from "../storage.js";
import type * as subscriptions from "../subscriptions.js";
import type * as trustPages from "../trustPages.js";
import type * as usageStats from "../usageStats.js";
import type * as users from "../users.js";
import type * as wishlist from "../wishlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityLogs: typeof activityLogs;
  "admin/modules": typeof admin_modules;
  "admin/presets": typeof admin_presets;
  analytics: typeof analytics;
  auth: typeof auth;
  bookings: typeof bookings;
  cart: typeof cart;
  comments: typeof comments;
  contactInbox: typeof contactInbox;
  convexDashboard: typeof convexDashboard;
  customers: typeof customers;
  dataManager: typeof dataManager;
  homeComponentSystemConfig: typeof homeComponentSystemConfig;
  homeComponents: typeof homeComponents;
  homepageWizard: typeof homepageWizard;
  ia: typeof ia;
  kanban: typeof kanban;
  landingPages: typeof landingPages;
  "lib/helpers": typeof lib_helpers;
  "lib/iaSlugs": typeof lib_iaSlugs;
  "lib/moduleConfigSync": typeof lib_moduleConfigSync;
  "lib/password": typeof lib_password;
  "lib/permissions": typeof lib_permissions;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/search": typeof lib_search;
  "lib/validators": typeof lib_validators;
  media: typeof media;
  menus: typeof menus;
  migrationBundles: typeof migrationBundles;
  "model/comments": typeof model_comments;
  "model/orders": typeof model_orders;
  "model/postCategories": typeof model_postCategories;
  "model/posts": typeof model_posts;
  "model/serviceCategories": typeof model_serviceCategories;
  "model/services": typeof model_services;
  notifications: typeof notifications;
  orders: typeof orders;
  pageViews: typeof pageViews;
  postCategories: typeof postCategories;
  posts: typeof posts;
  productCategories: typeof productCategories;
  productImageFrames: typeof productImageFrames;
  productOptionValues: typeof productOptionValues;
  productOptions: typeof productOptions;
  productSupplementalContents: typeof productSupplementalContents;
  productVariants: typeof productVariants;
  products: typeof products;
  promotions: typeof promotions;
  roles: typeof roles;
  search: typeof search;
  seed: typeof seed;
  seedManager: typeof seedManager;
  "seeders/base": typeof seeders_base;
  "seeders/dependencies": typeof seeders_dependencies;
  "seeders/fakerVi": typeof seeders_fakerVi;
  "seeders/index": typeof seeders_index;
  "seeders/registry": typeof seeders_registry;
  serviceCategories: typeof serviceCategories;
  services: typeof services;
  settings: typeof settings;
  storage: typeof storage;
  subscriptions: typeof subscriptions;
  trustPages: typeof trustPages;
  usageStats: typeof usageStats;
  users: typeof users;
  wishlist: typeof wishlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
