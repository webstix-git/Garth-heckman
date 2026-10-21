"use client";

export async function downloadAdminExport(resource: "products" | "orders" | "customers") {
  const response = await fetch(`/api/store/export/${resource}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Export failed");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${resource}-export.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
