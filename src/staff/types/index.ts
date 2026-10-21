/**
 * Platform product kinds. These describe how an item is sold or delivered;
 * simple versus variant products are modeled independently with `hasVariants`.
 * Donation / suggested-amount pricing is not a type — use digital (+ price presets).
 */
export const PRODUCT_TYPES = [
  "physical",
  "digital",
  "service",
  "bundle",
  "gift_card",
  "external",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const CATALOG_PRODUCT_TYPES = PRODUCT_TYPES;

/** Types shown in admin create/edit and list filters. */
export const ADMIN_PRODUCT_TYPES = ["physical", "digital"] as const satisfies readonly ProductType[];

export function adminProductTypeOptions(current?: ProductType | null): ProductType[] {
  const options: ProductType[] = [...ADMIN_PRODUCT_TYPES];
  if (current && !options.includes(current)) {
    options.push(current);
  }
  return options;
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  physical: "Physical",
  digital: "Digital",
  service: "Service",
  bundle: "Bundle",
  gift_card: "Gift card",
  external: "External / affiliate",
};

/** Map legacy Garth-specific admin labels (and DB modeling leftovers) → platform types. */
export function normalizeProductType(value: string | null | undefined): ProductType {
  if (!value) return "physical";
  if ((PRODUCT_TYPES as readonly string[]).includes(value)) return value as ProductType;

  const legacy: Record<string, ProductType> = {
    "WTFU Book": "digital",
    "Audio Book": "digital",
    "Burn This Book PDF": "digital",
    "Generations Training Deck": "digital",
    "Branded Merchandise": "physical",
    pwyw: "digital",
    simple: "physical",
    variable: "physical",
    // In the existing admin implementation this meant a variant product,
    // not a non-shippable service. Preserve that behavior during migration.
    virtual: "physical",
    subscription: "service",
    printify: "physical",
  };
  return legacy[value] ?? "physical";
}

export function productTypeLabel(type: string): string {
  const normalized = normalizeProductType(type);
  return PRODUCT_TYPE_LABELS[normalized] ?? type;
}

export function productRequiresShipping(type: ProductType): boolean {
  return type === "physical" || type === "bundle";
}

export function productTracksInventory(type: ProductType): boolean {
  return type === "physical" || type === "bundle";
}

/** A product's option/variant structure is independent of its product kind. */
export function productSupportsVariants(hasVariants: boolean | undefined): boolean {
  return Boolean(hasVariants);
}

export function productFulfillment(
  type: ProductType,
): "self" | "printify" | "download" {
  if (type === "digital") return "download";
  if (type === "physical") return "self";
  return "self";
}

export const PRODUCT_STATUSES = ["active", "draft", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "fulfilled",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const CUSTOMER_STATUSES = ["active", "inactive"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const BLOG_STATUSES = ["draft", "published"] as const;
export type BlogPostStatus = (typeof BLOG_STATUSES)[number];

export const CONTACT_STATUSES = [
  "new",
  "read",
  "responded",
  "archived",
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const PRINTIFY_SYNC_STATUSES = [
  "synced",
  "pending",
  "failed",
  "unmapped",
] as const;
export type PrintifySyncStatus = (typeof PRINTIFY_SYNC_STATUSES)[number];

export const MEDIA_TYPES = ["image", "video", "document"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const PRODUCT_VARIANT_STATUSES = ["active", "inactive", "archived"] as const;
export type ProductVariantStatus = (typeof PRODUCT_VARIANT_STATUSES)[number];

export const STOCK_STATUSES = ["in_stock", "out_of_stock"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: "In stock",
  out_of_stock: "Out of stock",
};

export interface ProductInventorySettings {
  /** ISBN, UPC, GTIN, or other product barcode */
  barcode?: string;
  trackInventory: boolean;
  quantity: number | null;
  stockStatus: StockStatus;
  /** Allow purchases when inventory reaches zero. */
  allowBackorder: boolean;
  soldIndividually: boolean;
}

export function deriveTrackedStockStatus(
  quantity: number | null,
  allowBackorder: boolean,
): StockStatus {
  if (allowBackorder) return "in_stock";
  if ((quantity ?? 0) <= 0) return "out_of_stock";
  return "in_stock";
}

export function defaultProductInventory(
  type: ProductType,
  existing?: Partial<ProductInventorySettings>,
): ProductInventorySettings {
  return {
    barcode: "",
    trackInventory: productTracksInventory(type),
    quantity: 0,
    stockStatus: "in_stock",
    allowBackorder: false,
    soldIndividually: false,
    ...existing,
  };
}

export function stockStatusFromDbRow(input: {
  allow_backorder?: boolean | null;
  inventory_qty?: number | null;
  track_inventory?: boolean | null;
  metadata?: Record<string, unknown> | null;
}): StockStatus {
  const metaStatus = input.metadata?.stockStatus;
  if (metaStatus === "in_stock" || metaStatus === "out_of_stock") {
    return metaStatus;
  }
  if (input.track_inventory && input.inventory_qty != null && input.inventory_qty <= 0) {
    return "out_of_stock";
  }
  return "in_stock";
}

export function allowBackorderFromDbRow(input: {
  allow_backorder?: boolean | null;
  metadata?: Record<string, unknown> | null;
}): boolean {
  if (typeof input.metadata?.allowBackorder === "boolean") {
    return input.metadata.allowBackorder;
  }
  if (input.allow_backorder) return true;
  return input.metadata?.stockStatus === "on_backorder";
}

export interface ProductVariant {
  id: string;
  sku: string;
  /** Option name → selected value label (e.g. { Color: "Black", Size: "Medium" }). */
  options: Record<string, string>;
  /** @deprecated Prefer `options`. Kept for older merch rows. */
  size?: string;
  /** @deprecated Prefer `options`. Kept for older merch rows. */
  color?: string;
  /** Unit price in dollars. */
  price: number;
  /** Compare-at price in dollars. */
  compareAtPrice?: number;
  inventory: number;
  /** Shipping weight in ounces. */
  weightOz?: number;
  /** Optional variant image URL. */
  image?: string;
  status: ProductVariantStatus;
  title?: string;
}

/** WooCommerce-style product attributes (Name + Value(s)) for variable products. */
export interface ProductAttribute {
  name: string;
  values: string[];
}

export interface PayWhatYouWant {
  enabled: boolean;
  suggestedAmount: number;
  minimumAmount: number;
}

export interface SeoFields {
  title: string;
  description: string;
  /** When true, search engines should not index this page. */
  noindex?: boolean;
  /** When true, search engines should not follow links on this page. */
  nofollow?: boolean;
}

/** Accordion sections on the storefront product page (max 5). */
export interface ProductContentSection {
  heading: string;
  body: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  /** True when the product uses options and multiple sellable variants. */
  hasVariants?: boolean;
  description: string;
  shortDescription: string;
  price: number;
  sku: string;
  status: ProductStatus;
  categoryId: string;
  featured: boolean;
  images: string[];
  seo: SeoFields;
  contentSections?: ProductContentSection[];
  /** Attribute definitions (Name + Value(s)), WooCommerce-style. */
  attributes?: ProductAttribute[];
  sizes?: string[];
  colors?: string[];
  variants?: ProductVariant[];
  payWhatYouWant?: PayWhatYouWant;
  /** Affiliate / external product URL when type is `external`. */
  externalUrl?: string;
  inventory?: ProductInventorySettings;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Set when moved to trash; permanently removed after 30 days. */
  deletedAt?: string | null;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "publishedAt">;

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  /** Media library id when the image was uploaded/selected from Media. */
  imageMediaId?: string;
  description: string;
  active: boolean;
  productCount: number;
  createdAt: string;
  /** Set when moved to trash; permanently removed after 30 days. */
  deletedAt?: string | null;
}

export type CategoryInput = Omit<Category, "id" | "productCount" | "createdAt">;

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productSlug?: string;
  productName: string;
  sku: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: number;
  image?: string;
}

export interface OrderTimelineEvent {
  id: string;
  title: string;
  description?: string;
  at: string;
}

export interface Order {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: OrderStatus;
  paymentMethod: string;
  billingAddress: Address;
  shippingAddress: Address;
  notes?: string;
  printifyOrderId?: string;
  printifyFulfillmentStatus?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  timeline: OrderTimelineEvent[];
  createdAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  orderCount: number;
  totalSpent: number;
  addresses: Address[];
  notes?: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
  category: string;
  tags: string[];
  status: BlogPostStatus;
  publishedAt?: string;
  seo: SeoFields;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type BlogPostInput = Omit<BlogPost, "id" | "createdAt" | "updatedAt">;

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
}

export interface PrintifyVariant {
  id: string;
  title: string;
  sku: string;
  cost: number;
  sellingPrice: number;
  localVariantId?: string;
}

export interface PrintifyProduct {
  id: string;
  name: string;
  printifyId: string;
  provider: string;
  localProductId?: string;
  localProductName?: string;
  variants: PrintifyVariant[];
  cost: number;
  sellingPrice: number;
  syncStatus: PrintifySyncStatus;
  lastSyncedAt?: string;
}

export interface PrintifyOrder {
  id: string;
  localOrderId: string;
  localOrderNumber: string;
  printifyOrderId: string;
  customerName: string;
  productName: string;
  fulfillmentStatus: string;
  trackingNumber?: string;
  createdAt: string;
}

export interface PrintifySyncLog {
  id: string;
  type: "product" | "order" | "inventory" | "mapping";
  status: "success" | "failed" | "pending";
  message: string;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  mimeType: string;
  size: number;
  createdAt: string;
  /** Backend storage location (Supabase Storage). */
  storeId?: string;
  storageBucket?: string;
  storagePath?: string;
  fileName?: string;
  originalFileName?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Exact dashboard place this file is used / was uploaded from. */
  locationLabel?: string;
  locationHref?: string;
}

/** Where an upload came from in the admin dashboard. */
export type MediaUploadContext = {
  module: "blog" | "product" | "media" | "settings" | "category" | "other";
  area?: "featured" | "body" | "gallery" | "cover" | "logo" | "avatar" | "library" | "image";
  entityId?: string;
  entityTitle?: string;
};

export interface DashboardStats {
  products: number;
  orders: number;
  customers: number;
  blogPosts: number;
  contactSubmissions: number;
  media: number;
  revenue: number;
}

export interface SalesPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface SalesRange {
  from: string;
  to: string;
}

export interface SalesOverview {
  range: SalesRange;
  points: SalesPoint[];
  totals: {
    revenue: number;
    orders: number;
    averageOrder: number;
  };
}

export interface OrderStatusCount {
  status: OrderStatus;
  count: number;
}

export interface TopProduct {
  id: string;
  slug?: string;
  name: string;
  image: string;
  sold: number;
  revenue: number;
}

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

export interface AuthSession {
  user: AdminUser;
}

export interface StoreAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface StoreSettings {
  store: {
    name: string;
    email: string;
    phone: string;
    currency: string;
    timezone: string;
    address: StoreAddress;
    /** Dashboard / sidebar logo URL (can be absolute or site-relative). */
    logoUrl: string;
    tagline: string;
  };
  branding: {
    /** Primary admin chrome color (badges, links, active nav). */
    primaryColor: string;
    /** Sidebar background color (light theme only). */
    sidebarColor: string;
    /** Admin header background color. */
    headerColor: string;
    /** Non-active sidebar/nav text + dropdown arrows. */
    navInactiveColor: string;
    /** Section headings like Management / System. */
    navHeadingColor: string;
    /** Primary button background. */
    buttonBgColor: string;
    /** Primary button text. */
    buttonTextColor: string;
  };
  payments?: {
    paypalEnabled: boolean;
    venmoEnabled: boolean;
    cashOnDeliveryEnabled: boolean;
    mode: "sandbox" | "live";
  };
  email: {
    /** Display name on outgoing store emails. */
    fromName: string;
    /** From address for outgoing store emails. */
    fromEmail: string;
    /** Address that receives customer replies. */
    replyTo: string;
    /** Email staff when a new order is placed. */
    orderNotifications: boolean;
    /** Email staff when the contact form is submitted. */
    contactNotifications: boolean;
    /** Email staff when products are low or out of stock. */
    inventoryNotifications: boolean;
    /** Recipient for inventory alerts. Uses store contact email when empty. */
    inventoryNotificationEmail: string;
    /** Send a low-stock alert when quantity is at or below this number. */
    lowStockThreshold: number;
  };
  /**
   * Storefront spotlight placements.
   * - `null` / missing / `""` → section hidden
   * - product id → that product
   */
  storefront: {
    homeSpotlightProductId: string | null;
    storeSpotlightProductId: string | null;
  };
  /** Site-wide SEO controls. */
  seo: {
    /** When true, ask search engines not to index the site. */
    noindex: boolean;
  };
}

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
