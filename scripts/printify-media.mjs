import fs from "node:fs";
import path from "node:path";

function loadEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*([:=])\s*(.*)$/);
    if (!match) continue;
    let value = match[3].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

const env = loadEnv(path.resolve(process.cwd(), ".env.local"));
const token = env.PRINTIFY_API_TOKEN;
const shopId = env.PRINTIFY_SHOP_ID || "28272515";
if (!token) {
  console.error("PRINTIFY_API_TOKEN missing");
  process.exit(1);
}

async function printify(pathname) {
  const res = await fetch(`https://api.printify.com/v1/${pathname}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "garth-heckman-web/0.1 (media sync)",
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${pathname}: ${JSON.stringify(body)}`);
  return body;
}

function optionLookup(product) {
  const byId = new Map();
  for (const o of product.options || []) {
    for (const v of o.values || []) byId.set(v.id, { group: o.name, title: v.title });
  }
  return byId;
}

function variantLabel(product, variant) {
  const byId = optionLookup(product);
  return (variant.options || [])
    .map((id) => byId.get(id)?.title)
    .filter(Boolean)
    .join(" / ");
}

const ids = [
  "6a81c32700177bb8ff0d06c4",
  "6a81c07e42e8d58d9209fbfc",
  "6a81bf8042e8d58d9209f92e",
];

const out = [];
for (const id of ids) {
  const p = await printify(`shops/${shopId}/products/${id}.json`);
  const byId = optionLookup(p);
  out.push({
    id: p.id,
    title: p.title,
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      title: v.title || variantLabel(p, v),
      price: v.price,
      enabled: v.is_enabled,
      options: (v.options || []).map((oid) => byId.get(oid)),
    })),
    images: (p.images || []).map((img) => ({
      src: img.src,
      position: img.position,
      is_default: img.is_default,
      variant_ids: img.variant_ids,
    })),
  });
}

const dest = path.resolve(process.cwd(), "scripts/.printify-media.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log("wrote", dest);
for (const p of out) {
  const enabled = p.variants.filter((v) => v.enabled);
  console.log(p.title, "images", p.images.length, "enabled", enabled.length);
  console.log("  default", p.images.find((i) => i.is_default)?.src);
  console.log(
    "  prices",
    [...new Set(p.variants.filter((v) => v.enabled).map((v) => v.price))],
  );
}
