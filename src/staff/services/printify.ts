import { createId, delay, matchesSearch, nowIso } from "@/services/delay";
import type { PrintifyOrder, PrintifyProduct, PrintifySyncLog } from "@/types";

/** No seeded Printify mocks — sync from Printify API later. */
let products: PrintifyProduct[] = [];
const orders: PrintifyOrder[] = [];
let logs: PrintifySyncLog[] = [];

export async function listPrintifyProducts(search?: string): Promise<PrintifyProduct[]> {
  await delay();
  return products.filter((p) =>
    matchesSearch(`${p.name} ${p.printifyId} ${p.provider} ${p.localProductName ?? ""}`, search),
  );
}

export async function getPrintifyProduct(id: string): Promise<PrintifyProduct | null> {
  await delay();
  return products.find((p) => p.id === id) ?? null;
}

export async function mapPrintifyProduct(
  printifyProductId: string,
  localProductId: string,
  localProductName: string,
  variantMap: Record<string, string | undefined>,
): Promise<PrintifyProduct> {
  await delay();
  const index = products.findIndex((p) => p.id === printifyProductId);
  if (index === -1) throw new Error("Printify product not found");
  const current = products[index];
  const next: PrintifyProduct = {
    ...current,
    localProductId,
    localProductName,
    syncStatus: "synced",
    lastSyncedAt: nowIso(),
    variants: current.variants.map((v) => ({
      ...v,
      localVariantId: variantMap[v.id],
    })),
  };
  products = products.map((p, i) => (i === index ? next : p));
  logs = [
    {
      id: createId("log"),
      type: "mapping",
      status: "success",
      message: `Mapped ${next.name} → ${localProductName}`,
      createdAt: nowIso(),
    },
    ...logs,
  ];
  return next;
}

export async function syncPrintifyProduct(id: string): Promise<PrintifyProduct> {
  await delay(600);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Printify product not found");
  const next: PrintifyProduct = {
    ...products[index],
    syncStatus: products[index].syncStatus === "failed" ? "synced" : "synced",
    lastSyncedAt: nowIso(),
  };
  products = products.map((p, i) => (i === index ? next : p));
  logs = [
    {
      id: createId("log"),
      type: "product",
      status: "success",
      message: `Synced ${next.name}`,
      createdAt: nowIso(),
    },
    ...logs,
  ];
  return next;
}

export async function listPrintifyOrders(search?: string): Promise<PrintifyOrder[]> {
  await delay();
  return orders.filter((o) =>
    matchesSearch(
      `${o.localOrderNumber} ${o.printifyOrderId} ${o.customerName} ${o.productName}`,
      search,
    ),
  );
}

export async function listPrintifyLogs(): Promise<PrintifySyncLog[]> {
  await delay();
  return [...logs];
}
