/**
 * Upload product PDFs into protected storage and register digital_assets rows.
 *
 * Usage: node scripts/upload-digital-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(
  "/home/vijay/Documents/vijay Projects/All Projects/AI Projects/AI Project Source/Grath Heckman/Files for Garth",
);
const BUCKET = "protected-digital-assets";
const MAX_BYTES = 50 * 1024 * 1024;

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
const storeId = env.NEXT_PUBLIC_STORE_ID || "0001";
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/** @type {Array<{ slug: string; id: string; name: string; sku: string; priceCents: number; file: string; fileLabel: string }>} */
const ASSETS = [
  {
    slug: "burn-this-book",
    id: "f1000000-0000-4000-8000-000000000003",
    name: "Burn This Book",
    sku: "GH-BTB-PDF",
    priceCents: 500,
    file: path.join(ROOT, "BurnThisBook.pdf"),
    fileLabel: "BurnThisBook.pdf",
  },
  {
    slug: "generations-training-deck",
    id: "f1000000-0000-4000-8000-000000000004",
    name: "Generations Training Deck",
    sku: "GH-GEN-DECK",
    priceCents: 0,
    file: path.join(ROOT, "Generations_Training_Deck.pdf"),
    fileLabel: "Generations_Training_Deck.pdf",
  },
  {
    slug: "wtfu-book",
    id: "f1000000-0000-4000-8000-000000000001",
    name: "Wake The Faith Up",
    sku: "GH-WTFU-BOOK",
    priceCents: null,
    file: path.join(ROOT, "WTFU book addition.pdf"),
    fileLabel: "WTFU book addition.pdf",
    /** Existing product — do not overwrite price/type; only attach file. */
    existingOnly: true,
  },
  {
    slug: "365-quotes",
    id: "f1000000-0000-4000-8000-000000000008",
    name: "365 Quotes",
    sku: "GH-365-QUOTES",
    priceCents: 500,
    file: path.join(ROOT, "Triple c", "365-Quotes.pdf"),
    fileLabel: "365-Quotes.pdf",
  },
  {
    slug: "365-day-journal",
    id: "f1000000-0000-4000-8000-000000000009",
    name: "365-Day Journal",
    sku: "GH-365-DAY-JOURNAL",
    priceCents: 500,
    file: path.join(ROOT, "Triple c", "365-Day Journal.pdf"),
    fileLabel: "365-Day Journal.pdf",
  },
  {
    slug: "cancer-terminology",
    id: "f1000000-0000-4000-8000-00000000000a",
    name: "Cancer Terminology",
    sku: "GH-CANCER-TERMINOLOGY",
    priceCents: 500,
    file: path.join(ROOT, "Triple c", "Cancer terminology.pdf"),
    fileLabel: "Cancer terminology.pdf",
  },
  {
    slug: "nourishing-your-body-through-cancer",
    id: "f1000000-0000-4000-8000-00000000000b",
    name: "Nourishing Your Body Through Cancer",
    sku: "GH-NOURISHING-YOUR-BO",
    priceCents: 500,
    file: path.join(ROOT, "Triple c", "Nourishing Your Body Through Cancer.pdf"),
    fileLabel: "Nourishing Your Body Through Cancer.pdf",
  },
  {
    slug: "faith-based-cancer-survival-mindset-manual",
    id: "f1000000-0000-4000-8000-00000000000c",
    name: "The Faith Based Cancer Survival Mindset Manual",
    sku: "GH-FAITH-BASED-CANCER",
    priceCents: 500,
    file: path.join(ROOT, "Triple c", "The Faith Based Cancer Survival Mindset Manual.pdf"),
    fileLabel: "The Faith Based Cancer Survival Mindset Manual.pdf",
  },
];

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`listBuckets: ${error.message}`);
  const existing = (buckets || []).find((b) => b.id === BUCKET || b.name === BUCKET);
  if (existing) {
    console.log(`Bucket ${BUCKET} exists`);
    return;
  }
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["application/pdf"],
  });
  if (createError) throw new Error(`createBucket: ${createError.message}`);
  console.log(`Created bucket ${BUCKET}`);
}

async function ensureProduct(asset) {
  const { data: existing } = await supabase
    .from("products")
    .select("id, slug")
    .eq("store_id", storeId)
    .eq("slug", asset.slug)
    .maybeSingle();

  if (existing) {
    console.log(`Product exists: ${asset.slug} (${existing.id})`);
    return existing.id;
  }

  if (asset.existingOnly) {
    throw new Error(`Expected existing product missing: ${asset.slug}`);
  }

  const row = {
    id: asset.id,
    store_id: storeId,
    name: asset.name,
    slug: asset.slug,
    product_type: "digital",
    status: "active",
    visibility: "visible",
    short_description: "PDF, instant download",
    sku: asset.sku,
    fulfillment: "download",
    price_cents: asset.priceCents,
    track_inventory: false,
    requires_shipping: false,
    is_featured: false,
    published_at: new Date().toISOString(),
    seo_title: `${asset.name} | Garth Heckman`,
    seo_description: `${asset.name} PDF download.`,
    metadata: { admin_type: "digital", source: "digital-asset-upload" },
  };

  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) throw new Error(`insert product ${asset.slug}: ${error.message}`);
  console.log(`Created product: ${asset.slug} (${data.id})`);
  return data.id;
}

async function uploadAsset(productId, asset) {
  if (!fs.existsSync(asset.file)) {
    throw new Error(`File not found: ${asset.file}`);
  }
  const bytes = fs.readFileSync(asset.file);
  if (bytes.length > MAX_BYTES) {
    throw new Error(`File too large (${bytes.length}): ${asset.file}`);
  }

  const storagePath = `${storeId}/downloads/${asset.slug}/${asset.fileLabel}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (uploadError) throw new Error(`upload ${asset.slug}: ${uploadError.message}`);

  const { data: existingAssets } = await supabase
    .from("digital_assets")
    .select("id")
    .eq("store_id", storeId)
    .eq("product_id", productId);

  if (existingAssets?.length) {
    const ids = existingAssets.map((a) => a.id);
    await supabase.from("digital_assets").delete().in("id", ids);
  }

  const { data, error } = await supabase
    .from("digital_assets")
    .insert({
      store_id: storeId,
      product_id: productId,
      file_label: asset.fileLabel,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      file_size_bytes: bytes.length,
      download_limit: 5,
      expires_after_days: 365,
      access_type: "entitlement",
    })
    .select("id, storage_path")
    .single();

  if (error) throw new Error(`digital_assets ${asset.slug}: ${error.message}`);
  console.log(
    `Linked ${asset.fileLabel} → ${asset.slug} (${(bytes.length / (1024 * 1024)).toFixed(1)} MB) id=${data.id}`,
  );
}

async function main() {
  console.log(`Store ${storeId}`);
  await ensureBucket();

  for (const asset of ASSETS) {
    const productId = await ensureProduct(asset);
    await uploadAsset(productId, asset);
  }

  const { data: final } = await supabase
    .from("digital_assets")
    .select("id, file_label, storage_path, product_id")
    .eq("store_id", storeId);
  console.log(`\nDone. ${final?.length || 0} digital assets for store ${storeId}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
