import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("MISSING .env.local");
  process.exit(1);
}

function loadEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*([:=])\s*(.*)$/);
    if (!match) continue;
    let value = match[3].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

const env = loadEnv(envPath);
const token = env.PRINTIFY_API_TOKEN;
const shopIdEnv = env.PRINTIFY_SHOP_ID;

console.log(
  JSON.stringify(
    {
      hasToken: Boolean(token),
      tokenLen: token ? token.length : 0,
      tokenLooksJwt: Boolean(token && token.startsWith("eyJ")),
      hasShopId: Boolean(shopIdEnv),
      shopIdLen: shopIdEnv ? shopIdEnv.length : 0,
    },
    null,
    2,
  ),
);

if (!token) {
  console.error("PRINTIFY_API_TOKEN missing");
  process.exit(1);
}

async function printify(pathname) {
  const res = await fetch(`https://api.printify.com/v1/${pathname}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "garth-heckman-web/0.1 (local mapping)",
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`Printify ${res.status} ${pathname}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return body;
}

function summarizeVariant(v) {
  return {
    id: v.id,
    sku: v.sku,
    title: v.title,
    price: v.price,
    cost: v.cost,
    grams: v.grams,
    is_enabled: v.is_enabled,
    is_available: v.is_available,
    options: v.options,
  };
}

function summarizeProduct(p) {
  return {
    id: p.id,
    title: p.title,
    description: typeof p.description === "string" ? p.description.slice(0, 180) : "",
    visible: p.visible,
    blueprint_id: p.blueprint_id,
    print_provider_id: p.print_provider_id,
    tags: p.tags,
    options: (p.options || []).map((o) => ({
      name: o.name,
      type: o.type,
      values: (o.values || []).map((v) => ({ id: v.id, title: v.title, colors: v.colors })),
    })),
    variantCount: (p.variants || []).length,
    enabledVariants: (p.variants || []).filter((v) => v.is_enabled).length,
    variants: (p.variants || []).map(summarizeVariant),
    images: (p.images || []).slice(0, 8).map((img) => ({
      src: img.src,
      variant_ids: img.variant_ids,
      position: img.position,
      is_default: img.is_default,
    })),
  };
}

const shops = await printify("shops.json");
console.log("\nSHOPS:");
console.log(JSON.stringify(shops, null, 2));

const shopId = shopIdEnv || shops?.[0]?.id;
if (!shopId) {
  console.error("No shop id");
  process.exit(1);
}

const products = await printify(`shops/${shopId}/products.json?limit=50`);
const list = products.data || products;
const summary = {
  shopId,
  shops,
  products: Array.isArray(list) ? list.map(summarizeProduct) : products,
};
const outPath = path.resolve(process.cwd(), "scripts/.printify-inspect.json");
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`Shop ${shopId}: ${Array.isArray(list) ? list.length : "unknown"} products`);
if (Array.isArray(list)) {
  for (const p of list) {
    console.log(`- ${p.title} (${p.id}) variants=${(p.variants || []).length} enabled=${(p.variants || []).filter((v) => v.is_enabled).length}`);
  }
}
