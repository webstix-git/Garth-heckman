import type { StoreSettings } from "@/types";

export const mockSettings: StoreSettings = {
  store: {
    name: "Garth Heckman",
    email: "hello@garthheckman.example",
    phone: "+1 (555) 010-2000",
    currency: "USD",
    timezone: "America/Chicago",
    address: {
      line1: "1200 W 7th Street",
      line2: "Suite 400",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90017",
      country: "United States",
    },
    logoUrl: "/images/gh-logo.png",
    tagline: "Admin Portal",
  },
  branding: {
    primaryColor: "#5c3758",
    sidebarColor: "#f7f7f7",
    headerColor: "#000000",
    navInactiveColor: "#52525b",
    navHeadingColor: "#71717a",
    buttonBgColor: "#5c3758",
    buttonTextColor: "#ffffff",
  },
  email: {
    fromName: "Garth Heckman",
    fromEmail: "orders@garthheckman.example",
    replyTo: "hello@garthheckman.example",
    orderNotifications: true,
    contactNotifications: true,
    inventoryNotifications: true,
    inventoryNotificationEmail: "",
    lowStockThreshold: 5,
  },
  storefront: {
    homeSpotlightProductId: null,
    storeSpotlightProductId: null,
  },
  seo: {
    noindex: false,
  },
};
