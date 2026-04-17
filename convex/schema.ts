import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================
  // LEVEL 1: SYSTEM CONFIGURATION (cho /system)
  // ============================================================

  // 1. adminModules - Quản lý modules bật/tắt
  adminModules: defineTable({
    category: v.union(
      v.literal("content"),
      v.literal("commerce"),
      v.literal("user"),
      v.literal("system"),
      v.literal("marketing")
    ),
    dependencies: v.optional(v.array(v.string())),
    dependencyType: v.optional(v.union(v.literal("all"), v.literal("any"))),
    description: v.string(),
    enabled: v.boolean(),
    icon: v.string(),
    isCore: v.boolean(),
    key: v.string(),
    name: v.string(),
    order: v.number(),
    updatedBy: v.optional(v.id("users")),
  })
    .index("by_key", ["key"])
    .index("by_category_enabled", ["category", "enabled"])
    .index("by_enabled_order", ["enabled", "order"]),

  // 2. moduleFields - Cấu hình fields động cho mỗi module
  moduleFields: defineTable({
    enabled: v.boolean(),
    fieldKey: v.string(),
    group: v.optional(v.string()),
    isSystem: v.boolean(),
    linkedFeature: v.optional(v.string()),
    moduleKey: v.string(),
    name: v.string(),
    order: v.number(),
    required: v.boolean(),
    type: v.union(
      v.literal("text"),
      v.literal("textarea"),
      v.literal("richtext"),
      v.literal("number"),
      v.literal("price"),
      v.literal("boolean"),
      v.literal("image"),
      v.literal("gallery"),
      v.literal("select"),
      v.literal("date"),
      v.literal("daterange"),
      v.literal("email"),
      v.literal("phone"),
      v.literal("tags"),
      v.literal("password"),
      v.literal("json"),
      v.literal("color")
    ),
  })
    .index("by_module", ["moduleKey"])
    .index("by_module_enabled", ["moduleKey", "enabled"])
    .index("by_module_order", ["moduleKey", "order"]),

  // 3. moduleFeatures - Features bật/tắt cho từng module
  moduleFeatures: defineTable({
    description: v.optional(v.string()),
    enabled: v.boolean(),
    featureKey: v.string(),
    linkedFieldKey: v.optional(v.string()),
    moduleKey: v.string(),
    name: v.string(),
  })
    .index("by_module", ["moduleKey"])
    .index("by_module_feature", ["moduleKey", "featureKey"]),

  // 4. moduleSettings - Settings cấu hình cho module
  moduleSettings: defineTable({
    moduleKey: v.string(),
    settingKey: v.string(),
    value: v.any(),
  })
    .index("by_module", ["moduleKey"])
    .index("by_module_setting", ["moduleKey", "settingKey"]),

  // 5. systemPresets - Preset configurations
  systemPresets: defineTable({
    description: v.string(),
    enabledModules: v.array(v.string()),
    isDefault: v.optional(v.boolean()),
    key: v.string(),
    name: v.string(),
  }).index("by_key", ["key"]),

  // 6. convexDashboard - Link tới Convex Dashboard để xem usage
  convexDashboard: defineTable({
    dashboardUrl: v.string(),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
    password: v.optional(v.string()),
  }),

  // 6a. usageStats - Track bandwidth usage theo ngày
  usageStats: defineTable({
    date: v.string(), // "2026-01-09"
    dbReads: v.number(),
    dbWrites: v.number(),
    fileReads: v.number(),
    fileWrites: v.number(),
    estimatedDbBandwidth: v.number(), // KB
    estimatedFileBandwidth: v.number(), // KB
  }).index("by_date", ["date"]),

  // 7. systemSessions - Sessions cho /system login
  systemSessions: defineTable({
    createdAt: v.number(),
    expiresAt: v.number(),
    token: v.string(),
  }).index("by_token", ["token"]),

  // 8. userSessions - Sessions cho /admin login
  userSessions: defineTable({
    createdAt: v.number(),
    expiresAt: v.number(),
    token: v.string(),
    userId: v.id("users"),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // 9. rateLimitBuckets - Rate limiting buckets
  rateLimitBuckets: defineTable({
    key: v.string(), // "mutation:{name}:{identifier}" or "global:{identifier}"
    tokens: v.number(),
    lastRefill: v.number(),
  }).index("by_key", ["key"]),

  // ============================================================
  // LEVEL 2: DATA TABLES (cho /admin)
  // ============================================================

  // 6. users - Quản trị viên hệ thống
  users: defineTable({
    avatar: v.optional(v.string()),
    email: v.string(),
    lastLogin: v.optional(v.number()),
    name: v.string(),
    passwordHash: v.optional(v.string()),
    phone: v.optional(v.string()),
    roleId: v.id("roles"),
    status: v.union(
      v.literal("Active"),
      v.literal("Inactive"),
      v.literal("Banned")
    ),
    superAdminTrialCreatedAt: v.optional(v.number()),
    superAdminTrialDurationDays: v.optional(v.union(v.literal(1), v.literal(7), v.literal(30), v.literal(90))),
    superAdminTrialExpiresAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_role_status", ["roleId", "status"])
    .index("by_status", ["status"]),

  // 7. roles - RBAC
  roles: defineTable({
    color: v.optional(v.string()),
    description: v.string(),
    isSuperAdmin: v.optional(v.boolean()),
    isSystem: v.boolean(),
    name: v.string(),
    permissions: v.record(v.string(), v.array(v.string())),
  })
    .index("by_name", ["name"])
    .index("by_isSystem", ["isSystem"]),

  // 7a. userStats - Counter table cho user statistics (tránh full scan)
  userStats: defineTable({
    key: v.string(), // "total", "Active", "Inactive", "Banned"
    count: v.number(),
  }).index("by_key", ["key"]),

  // 7b. roleStats - Counter table cho role statistics (tránh full scan)
  roleStats: defineTable({
    key: v.string(), // "total", "system", "custom"
    count: v.number(),
  }).index("by_key", ["key"]),

  // 7c. homeComponentStats - Counter table cho homepage components (tránh full scan)
  homeComponentStats: defineTable({
    key: v.string(), // "total", "active", "inactive", or type names like "hero", "about"
    count: v.number(),
  }).index("by_key", ["key"]),

  // 7d. notificationStats - Counter table cho notifications (tránh full scan)
  notificationStats: defineTable({
    key: v.string(), // "total", "Draft", "Scheduled", "Sent", "Cancelled", "totalReads"
    count: v.number(),
  }).index("by_key", ["key"]),

  // 7e. promotionStats - Counter table cho promotions (tránh full scan)
  promotionStats: defineTable({
    key: v.string(), // "total", "Active", "Inactive", "Expired", "Scheduled", "totalUsed", "percent", "fixed", "buy_x_get_y", ...
    count: v.number(),
  }).index("by_key", ["key"]),

  // 8. customers - Khách hàng
  customers: defineTable({
    address: v.optional(v.string()),
    avatar: v.optional(v.string()),
    city: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
    notes: v.optional(v.string()),
    ordersCount: v.number(),
    passwordHash: v.optional(v.string()),
    phone: v.string(),
    status: v.union(v.literal("Active"), v.literal("Inactive")),
    totalSpent: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_status_totalSpent", ["status", "totalSpent"])
    .index("by_city_status", ["city", "status"]),

  // 8a. customerSessions - Sessions cho khách hàng
  customerSessions: defineTable({
    createdAt: v.number(),
    customerId: v.id("customers"),
    expiresAt: v.number(),
    token: v.string(),
  })
    .index("by_token", ["token"])
    .index("by_customer", ["customerId"]),

  // 9. productCategories - Danh mục sản phẩm (Hierarchical)
  productCategories: defineTable({
    active: v.boolean(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    name: v.string(),
    order: v.number(),
    parentId: v.optional(v.id("productCategories")),
    slug: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentId"])
    .index("by_parent_order", ["parentId", "order"])
    .index("by_active", ["active"]),

  // 10. products - Sản phẩm
  products: defineTable({
    name: v.string(),
    sku: v.string(),
    slug: v.string(),
    categoryId: v.id("productCategories"),
    price: v.number(),
    salePrice: v.optional(v.number()),
    stock: v.number(),
    status: v.union(
      v.literal("Active"),
      v.literal("Draft"),
      v.literal("Archived")
    ),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    imageStorageIds: v.optional(v.array(v.union(v.id("_storage"), v.null()))),
    sales: v.number(),
    description: v.optional(v.string()),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    affiliateLink: v.optional(v.string()),
    order: v.number(),
    hasVariants: v.optional(v.boolean()),
    optionIds: v.optional(v.array(v.id("productOptions"))),
    // SEO fields
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    productType: v.optional(v.union(v.literal("physical"), v.literal("digital"))),
    digitalDeliveryType: v.optional(
      v.union(
        v.literal("account"),
        v.literal("license"),
        v.literal("download"),
        v.literal("custom")
      )
    ),
    digitalCredentialsTemplate: v.optional(v.object({
      username: v.optional(v.string()),
      password: v.optional(v.string()),
      licenseKey: v.optional(v.string()),
      downloadUrl: v.optional(v.string()),
      customContent: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    })),
  })
    .index("by_sku", ["sku"])
    .index("by_slug", ["slug"])
    .index("by_category_status", ["categoryId", "status"])
    .index("by_status_price", ["status", "price"])
    .index("by_status_stock", ["status", "stock"])
    .index("by_status_sales", ["status", "sales"])
    .index("by_status_order", ["status", "order"])
    .index("by_order", ["order"])
    .searchIndex("search_name", { filterFields: ["status", "categoryId"], searchField: "name" })
    .searchIndex("search_sku", { filterFields: ["status", "categoryId"], searchField: "sku" }),

  // 10a. productOptions - Loại option cho variants
  productOptions: defineTable({
    active: v.boolean(),
    compareUnit: v.optional(v.string()),
    displayType: v.union(
      v.literal("dropdown"),
      v.literal("buttons"),
      v.literal("radio"),
      v.literal("color_swatch"),
      v.literal("image_swatch"),
      v.literal("color_picker"),
      v.literal("number_input"),
      v.literal("text_input")
    ),
    inputType: v.optional(
      v.union(v.literal("text"), v.literal("number"), v.literal("color"))
    ),
    isPreset: v.boolean(),
    name: v.string(),
    order: v.number(),
    showPriceCompare: v.optional(v.boolean()),
    slug: v.string(),
    unit: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["active"])
    .index("by_active_order", ["active", "order"]),

  // 10b. productOptionValues - Giá trị của option
  productOptionValues: defineTable({
    active: v.boolean(),
    badge: v.optional(v.string()),
    colorCode: v.optional(v.string()),
    image: v.optional(v.string()),
    isLifetime: v.optional(v.boolean()),
    label: v.optional(v.string()),
    numericValue: v.optional(v.number()),
    optionId: v.id("productOptions"),
    order: v.number(),
    value: v.string(),
  })
    .index("by_option", ["optionId"])
    .index("by_option_active", ["optionId", "active"])
    .index("by_option_order", ["optionId", "order"]),

  // 10c. productVariants - Biến thể sản phẩm
  productVariants: defineTable({
    allowBackorder: v.optional(v.boolean()),
    barcode: v.optional(v.string()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    optionValues: v.array(
      v.object({
        customValue: v.optional(v.string()),
        optionId: v.id("productOptions"),
        valueId: v.id("productOptionValues"),
      })
    ),
    order: v.number(),
    price: v.optional(v.number()),
    productId: v.id("products"),
    salePrice: v.optional(v.number()),
    sku: v.string(),
    status: v.union(v.literal("Active"), v.literal("Inactive")),
    stock: v.optional(v.number()),
  })
    .index("by_sku", ["sku"])
    .index("by_product", ["productId"])
    .index("by_product_status", ["productId", "status"])
    .index("by_product_order", ["productId", "order"]),

  // 10c. productImageFrames - Khung viền ảnh sản phẩm
  productImageFrames: defineTable({
    name: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    aspectRatio: v.string(),
    sourceType: v.union(
      v.literal("system_preset"),
      v.literal("uploaded_overlay"),
      v.literal("line_generator"),
      v.literal("logo_generator")
    ),
    overlayImageUrl: v.optional(v.string()),
    overlayStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    lineConfig: v.optional(v.object({
      strokeWidth: v.number(),
      inset: v.number(),
      radius: v.number(),
      color: v.string(),
      shadow: v.optional(v.string()),
      cornerStyle: v.union(
        v.literal("sharp"),
        v.literal("rounded"),
        v.literal("ornamental-light")
      ),
    })),
    logoConfig: v.optional(v.union(
      v.object({
        logoUrl: v.string(),
        scale: v.number(),
        opacity: v.number(),
        x: v.number(),
        y: v.number(),
      }),
      v.object({
        logoUrl: v.string(),
        placement: v.union(v.literal("center"), v.literal("corners")),
        scale: v.number(),
        opacity: v.number(),
        inset: v.number(),
      })
    )),
    seasonKey: v.optional(v.string()),
    isSystemPreset: v.boolean(),
    createdBy: v.optional(v.union(v.id("users"), v.null())),
    updatedBy: v.optional(v.union(v.id("users"), v.null())),
    metadata: v.optional(v.union(v.record(v.string(), v.any()), v.null())),
  })
    .index("by_aspect_ratio", ["aspectRatio"])
    .index("by_aspect_ratio_status", ["aspectRatio", "status"])
    .index("by_source_type", ["sourceType"])
    .index("by_season_key", ["seasonKey"]),

  // 10d. productSupplementalContents - Khung nội dung bổ sung cho chi tiết sản phẩm
  productSupplementalContents: defineTable({
    name: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    assignmentMode: v.union(v.literal("products"), v.literal("categories")),
    productIds: v.optional(v.array(v.id("products"))),
    categoryIds: v.optional(v.array(v.id("productCategories"))),
    preContent: v.optional(v.string()),
    postContent: v.optional(v.string()),
    faqItems: v.array(v.object({
      id: v.string(),
      question: v.string(),
      answer: v.string(),
      order: v.number(),
    })),
    createdBy: v.optional(v.union(v.id("users"), v.null())),
    updatedBy: v.optional(v.union(v.id("users"), v.null())),
  })
    .index("by_status", ["status"])
    .index("by_assignment_mode", ["assignmentMode"]),

  // 10e. productStats - Counter table cho product statistics (tránh full scan)
  productStats: defineTable({
    key: v.string(), // "total", "Active", "Draft", "Archived"
    count: v.number(),
    lastOrder: v.number(),
  }).index("by_key", ["key"]),

  // 11. postCategories - Danh mục bài viết (Hierarchical)
  postCategories: defineTable({
    active: v.boolean(),
    description: v.optional(v.string()),
    name: v.string(),
    order: v.number(),
    parentId: v.optional(v.id("postCategories")),
    slug: v.string(),
    thumbnail: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentId"])
    .index("by_parent_order", ["parentId", "order"])
    .index("by_active", ["active"]),

  // 12. posts - Bài viết
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    categoryId: v.id("postCategories"),
    authorId: v.optional(v.id("users")),
    authorName: v.optional(v.string()),
    status: v.union(
      v.literal("Published"),
      v.literal("Draft"),
      v.literal("Archived")
    ),
    views: v.number(),
    publishedAt: v.optional(v.number()),
    order: v.number(),
    // SEO fields
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_category_status", ["categoryId", "status"])
    .index("by_author_name_status", ["authorName", "status"])
    .index("by_status_publishedAt", ["status", "publishedAt"])
    .index("by_status_views", ["status", "views"])
    .searchIndex("search_title", { filterFields: ["status", "categoryId"], searchField: "title" }),

  // 13. comments - Bình luận (Polymorphic) - SVC-011: Added "service" targetType
  comments: defineTable({
    authorEmail: v.optional(v.string()),
    authorIp: v.optional(v.string()),
    authorName: v.string(),
    content: v.string(),
    customerId: v.optional(v.id("customers")),
    likesCount: v.optional(v.number()),
    parentId: v.optional(v.id("comments")),
    rating: v.optional(v.number()),
    status: v.union(
      v.literal("Pending"),
      v.literal("Approved"),
      v.literal("Spam")
    ),
    targetId: v.string(),
    targetType: v.union(v.literal("post"), v.literal("product"), v.literal("service")),
  })
    .index("by_target_status", ["targetType", "targetId", "status"])
    .index("by_status", ["status"])
    .index("by_parent", ["parentId"])
    .index("by_customer", ["customerId"]),

  // 14. images - Thư viện media
  images: defineTable({
    alt: v.optional(v.string()),
    extension: v.optional(v.string()),
    filename: v.string(),
    folder: v.optional(v.string()),
    height: v.optional(v.number()),
    mimeType: v.string(),
    size: v.number(),
    storageId: v.id("_storage"),
    uploadedBy: v.optional(v.id("users")),
    width: v.optional(v.number()),
  })
    .index("by_folder", ["folder"])
    .index("by_mimeType", ["mimeType"])
    .index("by_uploadedBy", ["uploadedBy"]),

  // 14a. mediaStats - Counter table cho media statistics (tránh full scan)
  mediaStats: defineTable({
    key: v.string(), // "total", "image", "video", "document", "other"
    count: v.number(),
    totalSize: v.number(),
  }).index("by_key", ["key"]),

  // 14b. mediaFolders - Track folders riêng (tránh scan ALL images)
  mediaFolders: defineTable({
    count: v.number(),
    name: v.string(),
  }).index("by_name", ["name"]),

  // 15. menus - Menu động
  menus: defineTable({
    location: v.string(),
    name: v.string(),
  }).index("by_location", ["location"]),

  // 16. menuItems - Menu items (Hierarchical)
  menuItems: defineTable({
    active: v.boolean(),
    depth: v.number(),
    icon: v.optional(v.string()),
    label: v.string(),
    menuId: v.id("menus"),
    openInNewTab: v.optional(v.boolean()),
    order: v.number(),
    parentId: v.optional(v.id("menuItems")),
    url: v.string(),
  })
    .index("by_menu_order", ["menuId", "order"])
    .index("by_menu_depth", ["menuId", "depth"])
    .index("by_parent", ["parentId"])
    .index("by_menu_active", ["menuId", "active"]),

  // 17. homeComponents - Trang chủ động
  homeComponents: defineTable({
    active: v.boolean(),
    config: v.any(),
    order: v.number(),
    title: v.string(),
    type: v.string(),
  })
    .index("by_active_order", ["active", "order"])
    .index("by_type", ["type"]),

  // 18. settings - Cấu hình hệ thống (Key-Value)
  settings: defineTable({
    group: v.string(),
    key: v.string(),
    value: v.any(),
  })
    .index("by_key", ["key"])
    .index("by_group", ["group"]),

  // 19. activityLogs - Audit Trail
  activityLogs: defineTable({
    action: v.string(),
    details: v.optional(v.any()),
    ip: v.optional(v.string()),
    targetId: v.string(),
    targetType: v.string(),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_targetType", ["targetType"])
    .index("by_action", ["action"]),

  // 19a. kanbanBoards - Bảng kanban
  kanbanBoards: defineTable({
    createdBy: v.id("users"),
    description: v.optional(v.string()),
    name: v.string(),
    order: v.number(),
  }).index("by_order", ["order"]),

  // 19b. kanbanColumns - Cột kanban
  kanbanColumns: defineTable({
    boardId: v.id("kanbanBoards"),
    color: v.optional(v.string()),
    icon: v.string(),
    order: v.number(),
    title: v.string(),
    wipLimit: v.optional(v.number()),
  }).index("by_board_order", ["boardId", "order"]),

  // 19c. kanbanTasks - Task kanban
  kanbanTasks: defineTable({
    assigneeId: v.optional(v.id("users")),
    boardId: v.id("kanbanBoards"),
    columnId: v.id("kanbanColumns"),
    createdBy: v.id("users"),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    order: v.number(),
    priority: v.union(
      v.literal("LOW"),
      v.literal("MEDIUM"),
      v.literal("HIGH")
    ),
    title: v.string(),
  })
    .index("by_board", ["boardId"])
    .index("by_column_order", ["columnId", "order"])
    .index("by_assignee", ["assigneeId"]),

  // 19d. calendarTasks - Subscription gia hạn
  calendarTasks: defineTable({
    allDay: v.boolean(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.id("users"),
    customerId: v.optional(v.id("customers")),
    dueDate: v.optional(v.number()),
    order: v.number(),
    productId: v.optional(v.id("products")),
    status: v.union(
      v.literal("Todo"),
      v.literal("Contacted"),
      v.literal("Renewed"),
      v.literal("Churned")
    ),
    timezone: v.string(),
    title: v.string(),
    updatedAt: v.number(),
  })
    .index("by_dueDate", ["dueDate"])
    .index("by_status_dueDate", ["status", "dueDate"])
    .index("by_customer_dueDate", ["customerId", "dueDate"])
    .index("by_product_dueDate", ["productId", "dueDate"])
    .index("by_createdBy_updatedAt", ["createdBy", "updatedAt"]),

  // 20. orders - Đơn hàng
  orders: defineTable({
    customerId: v.id("customers"),
    items: v.array(
      v.object({
        price: v.number(),
        productId: v.id("products"),
        productImage: v.optional(v.string()),
        productName: v.string(),
        quantity: v.number(),
        variantId: v.optional(v.id("productVariants")),
        variantTitle: v.optional(v.string()),
        isDigital: v.optional(v.boolean()),
        digitalDeliveryType: v.optional(v.string()),
        digitalCredentials: v.optional(v.object({
          username: v.optional(v.string()),
          password: v.optional(v.string()),
          licenseKey: v.optional(v.string()),
          downloadUrl: v.optional(v.string()),
          customContent: v.optional(v.string()),
          expiresAt: v.optional(v.number()),
          deliveredAt: v.optional(v.number()),
        })),
      })
    ),
    note: v.optional(v.string()),
    promotionId: v.optional(v.id("promotions")),
    promotionCode: v.optional(v.string()),
    discountAmount: v.optional(v.number()),
    orderNumber: v.string(),
    paymentMethod: v.optional(
      v.union(
        v.literal("COD"),
        v.literal("BankTransfer"),
        v.literal("VietQR"),
        v.literal("CreditCard"),
        v.literal("EWallet")
      )
    ),
    paymentStatus: v.optional(
      v.union(
        v.literal("Pending"),
        v.literal("Paid"),
        v.literal("Failed"),
        v.literal("Refunded")
      )
    ),
    shippingAddress: v.optional(v.string()),
    shippingMethodId: v.optional(v.string()),
    shippingMethodLabel: v.optional(v.string()),
    shippingFee: v.number(),
    status: v.string(),
    subtotal: v.number(),
    totalAmount: v.number(),
    trackingNumber: v.optional(v.string()),
    isDigitalOrder: v.optional(v.boolean()),
  })
    .index("by_orderNumber", ["orderNumber"])
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_paymentStatus", ["paymentStatus"])
    .index("by_status_paymentStatus", ["status", "paymentStatus"]),

  // 21. wishlist - Sản phẩm yêu thích
  wishlist: defineTable({
    customerId: v.id("customers"),
    note: v.optional(v.string()),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
  })
    .index("by_customer", ["customerId"])
    .index("by_product", ["productId"])
    .index("by_customer_product", ["customerId", "productId"]),

  // 22. carts - Giỏ hàng
  carts: defineTable({
    customerId: v.optional(v.id("customers")),
    expiresAt: v.optional(v.number()),
    itemsCount: v.number(),
    note: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    status: v.union(
      v.literal("Active"),
      v.literal("Converted"),
      v.literal("Abandoned")
    ),
    totalAmount: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_session", ["sessionId"])
    .index("by_status", ["status"])
    .index("by_expiresAt", ["expiresAt"])
    // FIX Issue #8: Compound indexes for efficient filtering
    .index("by_customer_status", ["customerId", "status"])
    .index("by_session_status", ["sessionId", "status"]),

  // 23. cartItems - Items trong giỏ hàng
  cartItems: defineTable({
    cartId: v.id("carts"),
    price: v.number(),
    productId: v.id("products"),
    productImage: v.optional(v.string()),
    productName: v.string(),
    quantity: v.number(),
    subtotal: v.number(),
    variantId: v.optional(v.id("productVariants")),
  })
    .index("by_cart", ["cartId"])
    .index("by_product", ["productId"])
    .index("by_cart_product_variant", ["cartId", "productId", "variantId"]),

  // 24. notifications - Thông báo hệ thống
  notifications: defineTable({
    content: v.string(),
    order: v.number(),
    readCount: v.number(),
    scheduledAt: v.optional(v.number()),
    sendEmail: v.optional(v.boolean()),
    sentAt: v.optional(v.number()),
    status: v.union(
      v.literal("Draft"),
      v.literal("Scheduled"),
      v.literal("Sent"),
      v.literal("Cancelled")
    ),
    targetIds: v.optional(v.array(v.string())),
    targetType: v.union(
      v.literal("all"),
      v.literal("customers"),
      v.literal("users"),
      v.literal("specific")
    ),
    title: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_targetType", ["targetType"])
    .index("by_scheduledAt", ["scheduledAt"])
    .index("by_status_order", ["status", "order"]),

  // 24a. contactInquiries - Tin nhắn liên hệ
  contactInquiries: defineTable({
    createdAt: v.number(),
    email: v.optional(v.string()),
    handledAt: v.optional(v.number()),
    handledBy: v.optional(v.id("users")),
    message: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    sourcePath: v.string(),
    status: v.union(
      v.literal("new"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("spam")
    ),
    subject: v.string(),
    updatedAt: v.number(),
  })
    .index("by_status_createdAt", ["status", "createdAt"])
    .index("by_createdAt", ["createdAt"])
    .index("by_email_createdAt", ["email", "createdAt"]),

  // 24b. contactInboxStats - Counter table cho inbox
  contactInboxStats: defineTable({
    key: v.string(), // total, new, in_progress, resolved, spam
    count: v.number(),
  }).index("by_key", ["key"]),

  // 25. pageViews - Tracking lượt truy cập
  pageViews: defineTable({
    browser: v.optional(v.string()),
    country: v.optional(v.string()),
    device: v.optional(v.union(v.literal("mobile"), v.literal("desktop"), v.literal("tablet"))),
    os: v.optional(v.string()),
    path: v.string(),
    referrer: v.optional(v.string()),
    sessionId: v.string(),
    userAgent: v.optional(v.string()),
  })
    .index("by_path", ["path"])
    .index("by_session", ["sessionId"]),

  // 26. serviceCategories - Danh mục dịch vụ (Hierarchical)
  serviceCategories: defineTable({
    active: v.boolean(),
    description: v.optional(v.string()),
    name: v.string(),
    order: v.number(),
    parentId: v.optional(v.id("serviceCategories")),
    slug: v.string(),
    thumbnail: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentId"])
    .index("by_parent_order", ["parentId", "order"])
    .index("by_active", ["active"]),

  // 27. services - Dịch vụ
  services: defineTable({
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    categoryId: v.id("serviceCategories"),
    price: v.optional(v.number()),
    duration: v.optional(v.string()),
    bookingEnabled: v.optional(v.boolean()),
    bookingDurationMin: v.optional(v.number()),
    bookingSlotIntervalMin: v.optional(v.number()),
    bookingCapacityPerSlot: v.optional(v.number()),
    bookingSlotTemplateDefault: v.optional(v.array(v.string())),
    bookingSlotTemplateByWeekday: v.optional(v.record(v.string(), v.array(v.string()))),
    status: v.union(
      v.literal("Published"),
      v.literal("Draft"),
      v.literal("Archived")
    ),
    views: v.number(),
    publishedAt: v.optional(v.number()),
    order: v.number(),
    featured: v.optional(v.boolean()),
    // SEO fields
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_category_status", ["categoryId", "status"])
    .index("by_status_publishedAt", ["status", "publishedAt"])
    .index("by_status_views", ["status", "views"])
    .index("by_status_order", ["status", "order"])
    .index("by_status_featured", ["status", "featured"])
    .index("by_booking_enabled", ["bookingEnabled"])
    .searchIndex("search_title", { filterFields: ["status", "categoryId"], searchField: "title" }),

  // 27a. bookings - Đặt lịch
  bookings: defineTable({
    serviceId: v.id("services"),
    customerName: v.string(),
    bookingDate: v.string(), // "YYYY-MM-DD"
    slotTime: v.string(), // "HH:mm"
    timezone: v.string(),
    status: v.union(
      v.literal("Pending"),
      v.literal("Confirmed"),
      v.literal("Cancelled")
    ),
    note: v.optional(v.string()),
    bookingFields: v.optional(v.record(v.string(), v.string())),
  })
    .index("by_service_date", ["serviceId", "bookingDate"])
    .index("by_service_date_slot", ["serviceId", "bookingDate", "slotTime"])
    .index("by_status_date", ["status", "bookingDate"])
    .index("by_date_slot", ["bookingDate", "slotTime"]),

  // 28. promotions - Khuyến mãi & Voucher
  promotions: defineTable({
    applicableIds: v.optional(v.array(v.string())),
    applicableTo: v.optional(
      v.union(
        v.literal("all"),
        v.literal("products"),
        v.literal("categories"),
        v.literal("brands"),
        v.literal("tags")
      )
    ),
    budget: v.optional(v.number()),
    budgetUsed: v.optional(v.number()),
    code: v.optional(v.string()),
    customerGroupIds: v.optional(v.array(v.string())),
    customerTierIds: v.optional(v.array(v.string())),
    customerType: v.optional(
      v.union(
        v.literal("all"),
        v.literal("new"),
        v.literal("returning"),
        v.literal("vip")
      )
    ),
    description: v.optional(v.string()),
    discountConfig: v.optional(v.any()),
    discountType: v.union(
      v.literal("percent"),
      v.literal("fixed"),
      v.literal("buy_x_get_y"),
      v.literal("buy_a_get_b"),
      v.literal("tiered"),
      v.literal("free_shipping"),
      v.literal("gift")
    ),
    discountValue: v.optional(v.number()),
    displayOnPage: v.optional(v.boolean()),
    endDate: v.optional(v.number()),
    excludeIds: v.optional(v.array(v.string())),
    featured: v.optional(v.boolean()),
    maxDiscountAmount: v.optional(v.number()),
    minOrderAmount: v.optional(v.number()),
    minOrderHistory: v.optional(v.number()),
    minQuantity: v.optional(v.number()),
    minTotalSpent: v.optional(v.number()),
    name: v.string(),
    order: v.number(),
    priority: v.optional(v.number()),
    promotionType: v.union(
      v.literal("coupon"),
      v.literal("campaign"),
      v.literal("flash_sale"),
      v.literal("bundle"),
      v.literal("loyalty")
    ),
    recurringDays: v.optional(v.array(v.number())),
    recurringHours: v.optional(v.object({ from: v.number(), to: v.number() })),
    scheduleType: v.optional(
      v.union(v.literal("always"), v.literal("dateRange"), v.literal("recurring"))
    ),
    stackable: v.optional(v.boolean()),
    startDate: v.optional(v.number()),
    status: v.union(
      v.literal("Active"),
      v.literal("Inactive"),
      v.literal("Expired"),
      v.literal("Scheduled")
    ),
    thumbnail: v.optional(v.string()),
    usageLimit: v.optional(v.number()),
    usagePerCustomer: v.optional(v.number()),
    usedCount: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"])
    .index("by_status_order", ["status", "order"])
    .index("by_status_promotionType", ["status", "promotionType"])
    .index("by_status_discountType", ["status", "discountType"])
    .index("by_startDate", ["startDate"])
    .index("by_endDate", ["endDate"])
    .index("by_promotionType", ["promotionType"])
    .index("by_discountType", ["discountType"])
    .index("by_displayOnPage", ["displayOnPage"])
    .index("by_featured", ["featured"]),

  // 28a. promotionUsage - Lịch sử sử dụng khuyến mãi
  promotionUsage: defineTable({
    customerId: v.id("customers"),
    discountAmount: v.number(),
    orderId: v.id("orders"),
    promotionId: v.id("promotions"),
    usedAt: v.number(),
  })
    .index("by_promotion", ["promotionId"])
    .index("by_customer", ["customerId"])
    .index("by_order", ["orderId"])
    .index("by_customer_promotion", ["customerId", "promotionId"]),

  // ============================================================
  // SEED PROGRESS TRACKING
  // ============================================================

  seedProgress: defineTable({
    sessionId: v.string(),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    current: v.string(),
    completed: v.number(),
    total: v.number(),
    results: v.array(v.any()),
    errors: v.array(v.string()),
  }).index("by_session", ["sessionId"]),

  // ============================================================
  // SAAS LANDING CONTENT (programmatic SEO surface)
  // ============================================================

  // landingPages - Trang landing cho SaaS (features/use-cases/solutions/compare/integrations/templates/guides)
  landingPages: defineTable({
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    content: v.optional(v.string()),
    heroImage: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    landingType: v.union(
      v.literal("feature"),
      v.literal("use-case"),
      v.literal("solution"),
      v.literal("compare"),
      v.literal("integration"),
      v.literal("template"),
      v.literal("guide")
    ),
    primaryIntent: v.optional(v.string()), // mô tả search intent chính
    faqItems: v.optional(v.array(v.object({
      question: v.string(),
      answer: v.string(),
    }))),
    relatedSlugs: v.optional(v.array(v.string())), // slugs của related landing pages
    relatedProductSlugs: v.optional(v.array(v.string())),
    relatedServiceSlugs: v.optional(v.array(v.string())),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    order: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_type", ["landingType"])
    .index("by_type_status", ["landingType", "status"])
    .index("by_status_updatedAt", ["status", "updatedAt"]),
});
