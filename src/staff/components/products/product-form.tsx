"use client";

import {
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { ImageUploader } from "@/components/shared/image-uploader";
import { PageHeader } from "@/components/shared/page-header";
import { SimpleRichTextEditor } from "@/components/shared/simple-rich-text-editor";
import { SeoGooglePreview } from "@/components/shared/seo-google-preview";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify, formatCurrency } from "@/lib/format";
import {
  cartesianCombos,
  comboMatchKey,
  comboTitle,
  resolveVariantOptions,
} from "@/lib/product-variant-matrix";
import { withFilledContentSections } from "@/lib/product-content-sections";
import { buildProductSeo, SEO_DESC_MAX, SEO_TITLE_MAX } from "@/lib/product-seo";
import { cn } from "@/lib/utils";
import { createId } from "@/services/delay";
import { createProduct, updateProduct } from "@/services/products";
import type {
  Category,
  Product,
  ProductAttribute,
  ProductContentSection,
  ProductInput,
  ProductInventorySettings,
  ProductStatus,
  ProductType,
  ProductVariant,
  StockStatus,
} from "@/types";
import {
  adminProductTypeOptions,
  defaultProductInventory,
  PRODUCT_TYPE_LABELS,
  STOCK_STATUSES,
  STOCK_STATUS_LABELS,
  deriveTrackedStockStatus,
  normalizeProductType,
} from "@/types";

function InventoryToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium leading-snug text-foreground">{label}</p>
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
    </div>
  );
}

function InventoryPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("py-1", className)}>{children}</div>;
}

function InventoryInset({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("py-1", className)}>{children}</div>;
}

const OZ_PER_LB = 16;

function ouncesToPounds(ounces: number): number {
  return Math.round((ounces / OZ_PER_LB) * 100) / 100;
}

function poundsToOunces(pounds: number): number {
  return Math.round(pounds * OZ_PER_LB * 100) / 100;
}

function AttributeValueTags({
  options,
  selected,
  onChange,
  mode = "multi",
}: {
  options: string[];
  selected: string | string[];
  onChange: (next: string | string[]) => void;
  mode?: "multi" | "single";
}) {
  const selectedSet =
    mode === "single"
      ? new Set(typeof selected === "string" && selected ? [selected] : [])
      : new Set(Array.isArray(selected) ? selected : []);

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">No values yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2" role={mode === "single" ? "radiogroup" : "group"}>
      {options.map((value) => {
        const isSelected = selectedSet.has(value);
        return (
          <button
            key={value}
            type="button"
            role={mode === "single" ? "radio" : "checkbox"}
            aria-checked={isSelected}
            data-selected={isSelected}
            className="attribute-value-tag"
            onClick={() => {
              if (mode === "single") {
                onChange(value);
                return;
              }
              const current = Array.isArray(selected) ? selected : [];
              onChange(
                isSelected ? current.filter((item) => item !== value) : [...current, value],
              );
            }}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}

function parseAttributeValues(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[|,]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function formatAttributeValues(values: string[]): string {
  return values.join(" | ");
}

function EditableAttributeValues({
  id,
  selected,
  onChange,
}: {
  id?: string;
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Input
        id={id}
        key={formatAttributeValues(selected)}
        defaultValue={formatAttributeValues(selected)}
        placeholder="Small | Medium | Large"
        onBlur={(e) => onChange(parseAttributeValues(e.target.value))}
      />
      <p className="text-xs text-muted-foreground">
        Separate values with <span className="font-medium">|</span>
      </p>
    </div>
  );
}

const RESERVED_ATTRIBUTE_NAMES = new Set(["size", "color"]);

function normalizeFormAttributes(attributes?: ProductAttribute[]): ProductAttribute[] {
  return (attributes ?? [])
    .map((attr) => ({
      name: attr.name || "",
      values: [...(attr.values ?? [])],
    }))
    .filter((attr) => !RESERVED_ATTRIBUTE_NAMES.has(attr.name.trim().toLowerCase()));
}

function variantFieldsFromOptions(
  options: Record<string, string>,
  names: string[],
): Pick<ProductVariant, "size" | "color"> {
  return {
    size: names[0] ? options[names[0]] : undefined,
    color: names[1] ? options[names[1]] : undefined,
  };
}

const emptyProduct = (categoryId: string): ProductInput => ({
  name: "",
  slug: "",
  type: "physical",
  description: "",
  shortDescription: "",
  price: 0,
  sku: "",
  status: "draft",
  categoryId,
  featured: false,
  images: [],
  seo: { title: "", description: "" },
  contentSections: [
    { heading: "Description", body: "" },
    { heading: "Details", body: "" },
    { heading: "Download & access", body: "" },
  ],
  inventory: defaultProductInventory("physical"),
});

function toInput(product: Product): ProductInput {
  const filled = withFilledContentSections(product);
  const { id: _id, createdAt: _c, updatedAt: _u, publishedAt: _p, ...rest } = filled;
  void _id;
  void _c;
  void _u;
  void _p;
  return {
    ...rest,
    type: normalizeProductType(rest.type),
    contentSections: rest.contentSections ?? [],
    attributes: normalizeFormAttributes(rest.attributes),
    variants: (rest.variants ?? []).map((variant) => {
      const options =
        variant.options && Object.keys(variant.options).length ? variant.options : {};
      return {
        ...variant,
        options,
        status: variant.status || "active",
        title: variant.title || comboTitle(options),
      };
    }),
    hasVariants:
      Boolean(rest.hasVariants) ||
      Boolean(rest.attributes?.some((attribute) => attribute.values.length)) ||
      Boolean(rest.variants?.length),
    inventory: defaultProductInventory(normalizeProductType(rest.type), rest.inventory),
  };
}

interface ProductFormProps {
  product?: Product;
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductInput>(
    product ? toInput(product) : emptyProduct(categories[0]?.id ?? ""),
  );
  const [savingAs, setSavingAs] = useState<ProductStatus | null>(null);
  const [expandedSectionIndex, setExpandedSectionIndex] = useState<number | null>(null);
  const [expandedAttributeIndex, setExpandedAttributeIndex] = useState<number | null>(null);
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);
  const seoTouched = useRef({
    title: false,
    description: false,
  });
  const categorySelectItems = categories.map((c) => ({ value: c.id, label: c.name }));
  const productTypeOptions = useMemo(
    () => adminProductTypeOptions(normalizeProductType(form.type)),
    [form.type],
  );
  const typeSelectItems = productTypeOptions.map((item) => ({
    value: item,
    label: PRODUCT_TYPE_LABELS[item],
  }));

  const supportsVariants = Boolean(form.hasVariants);
  const isDonation = Boolean(form.payWhatYouWant?.enabled);
  const isExternal = form.type === "external";
  const saving = savingAs !== null;
  const savedStatus = product?.status ?? form.status;
  const variantsSectionRef = useRef<HTMLDivElement>(null);
  const wasSupportsVariants = useRef(supportsVariants);

  useEffect(() => {
    if (supportsVariants && !wasSupportsVariants.current) {
      variantsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    wasSupportsVariants.current = supportsVariants;
  }, [supportsVariants]);

  function applyProductType(nextType: ProductType) {
    patch({
      type: nextType,
      payWhatYouWant: nextType === "digital" ? form.payWhatYouWant : undefined,
      externalUrl: nextType === "external" ? form.externalUrl ?? "" : undefined,
    });
  }

  function setHasVariants(checked: boolean) {
    patch({
      hasVariants: checked,
      attributes: checked ? normalizeFormAttributes(form.attributes) : undefined,
      variants: checked ? form.variants ?? [] : undefined,
      sizes: undefined,
      colors: undefined,
    });
  }

  const attributes = supportsVariants ? normalizeFormAttributes(form.attributes) : [];

  function setAttributes(next: ProductAttribute[]) {
    patch({
      attributes: normalizeFormAttributes(next),
      sizes: undefined,
      colors: undefined,
    });
  }

  function updateAttribute(index: number, partial: Partial<ProductAttribute>) {
    if (
      partial.name &&
      RESERVED_ATTRIBUTE_NAMES.has(partial.name.trim().toLowerCase())
    ) {
      toast.error("Use a custom attribute name — Size and Color are not supported.");
      return;
    }
    const next = attributes.map((attr, i) => (i === index ? { ...attr, ...partial } : attr));
    setAttributes(next);
  }

  function addAttribute() {
    const nextIndex = attributes.length;
    setAttributes([...attributes, { name: "", values: [] }]);
    setExpandedAttributeIndex(nextIndex);
  }

  function removeAttribute(index: number) {
    setAttributes(attributes.filter((_, i) => i !== index));
    setExpandedAttributeIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      if (current > index) return current - 1;
      return current;
    });
  }

  function seoSourceFromForm(source: ProductInput): ProductInput {
    const descriptionSection = (source.contentSections ?? []).find(
      (section) => section.heading.trim().toLowerCase() === "description",
    );
    return {
      ...source,
      description: descriptionSection?.body?.trim() || source.description,
    };
  }

  function generatedSeo(source: ProductInput) {
    const input = seoSourceFromForm(source);
    return buildProductSeo({
      name: input.name,
      type: input.type,
      shortDescription: input.shortDescription,
      description: input.description,
      categoryName: categories.find((item) => item.id === input.categoryId)?.name,
      price: input.price,
    });
  }

  function withAutoSeo(next: ProductInput, fromSeoField?: boolean): ProductInput {
    if (fromSeoField) return next;
    const generated = generatedSeo(next);
    return {
      ...next,
      seo: {
        title: seoTouched.current.title ? next.seo.title : generated.title || next.seo.title,
        description: seoTouched.current.description
          ? next.seo.description
          : generated.description || next.seo.description,
        noindex: next.seo.noindex,
        nofollow: next.seo.nofollow,
      },
    };
  }

  function patch(partial: Partial<ProductInput>, fromSeoField = false) {
    setForm((current) => withAutoSeo({ ...current, ...partial }, fromSeoField));
  }

  function patchInventory(partial: Partial<ProductInventorySettings>) {
    setForm((current) => {
      const type = normalizeProductType(current.type);
      const hasVariantMatrix =
        Boolean(current.hasVariants) ||
        Boolean(current.attributes?.some((attribute) => attribute.values.length)) ||
        Boolean(current.variants?.length);
      let next = defaultProductInventory(type, { ...current.inventory, ...partial });

      const userPickedStatus = partial.stockStatus !== undefined;
      const shouldAutoDeriveStatus =
        next.trackInventory &&
        !hasVariantMatrix &&
        !userPickedStatus &&
        (partial.quantity !== undefined ||
          partial.allowBackorder !== undefined ||
          partial.trackInventory !== undefined);

      if (shouldAutoDeriveStatus) {
        next = {
          ...next,
          stockStatus: deriveTrackedStockStatus(next.quantity, next.allowBackorder),
        };
      }

      return withAutoSeo({ ...current, inventory: next });
    });
  }

  const inventory = useMemo(
    () => defaultProductInventory(normalizeProductType(form.type), form.inventory),
    [form.inventory, form.type],
  );

  const seoPreview = useMemo(() => {
    const generated = generatedSeo(form);
    return {
      title: form.seo.title.trim() || generated.title || form.name,
      description: form.seo.description.trim() || generated.description,
      path: `/product/${form.slug || slugify(form.name) || "product"}`,
    };
  }, [
    form.name,
    form.slug,
    form.type,
    form.shortDescription,
    form.description,
    form.contentSections,
    form.categoryId,
    form.price,
    form.seo.title,
    form.seo.description,
    categories,
  ]);

  function onName(name: string) {
    patch({
      name,
      slug: product ? form.slug : slugify(name),
    });
  }

  async function save(nextStatus: ProductStatus) {
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error("Name and SKU are required.");
      return;
    }
    setSavingAs(nextStatus);
    try {
      const descriptionSection = (form.contentSections ?? []).find(
        (section) => section.heading.trim().toLowerCase() === "description",
      );
      const generated = generatedSeo(form);
      const payload = {
        ...form,
        attributes: normalizeFormAttributes(form.attributes),
        sizes: undefined,
        colors: undefined,
        // Long description lives in the Description page section — keep DB field in sync.
        description: descriptionSection?.body?.trim() || form.description,
        status: nextStatus,
        ...(isDonation
          ? {
              payWhatYouWant: {
                enabled: true,
                suggestedAmount: form.price,
                minimumAmount: form.price,
              },
            }
          : {}),
        seo: {
          title: form.seo.title.trim() || generated.title,
          description: form.seo.description.trim() || generated.description,
          noindex: Boolean(form.seo.noindex),
          nofollow: Boolean(form.seo.nofollow),
        },
      };
      if (product) {
        const updated = await updateProduct(product.id, payload);
        toast.success(
          nextStatus === "active"
            ? product.status === "active"
              ? "Product updated"
              : "Product published"
            : nextStatus === "archived"
              ? "Product archived"
              : "Saved as draft",
        );
        router.push(`/admin/products/${updated.slug}/edit`);
      } else {
        const created = await createProduct(payload);
        toast.success(nextStatus === "active" ? "Product published" : "Saved as draft");
        router.push(`/admin/products/${created.slug}/edit`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSavingAs(null);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void save(savedStatus === "active" ? "active" : "draft");
  }

  const attributeNames = attributes.map((attr) => attr.name.trim()).filter(Boolean);

  function variantOptions(variant: ProductVariant): Record<string, string> {
    return resolveVariantOptions(variant, attributeNames);
  }

  function addVariant() {
    const combos = cartesianCombos(attributes);
    const existingKeys = new Set(
      (form.variants ?? []).map((v) => comboMatchKey(variantOptions(v))),
    );
    const options =
      combos.find((combo) => !existingKeys.has(comboMatchKey(combo))) ||
      Object.fromEntries(
        attributes
          .filter((a) => a.name.trim())
          .map((a) => [a.name.trim(), a.values[0] || ""]),
      );
    if (!Object.keys(options).length) {
      toast.error("Add attribute names and values first.");
      return;
    }
    if (existingKeys.has(comboMatchKey(options))) {
      toast.error("That combination already exists.");
      return;
    }
    const variant: ProductVariant = {
      id: createId("var"),
      sku: `${form.sku || "SKU"}-NEW`,
      options,
      ...variantFieldsFromOptions(options, attributeNames),
      price: form.price,
      inventory: 0,
      status: "active",
      title: comboTitle(options),
    };
    patch({ variants: [...(form.variants ?? []), variant] });
    setExpandedVariantId(variant.id);
  }

  function generateVariations() {
    const combos = cartesianCombos(attributes);
    if (!combos.length) {
      toast.error("Add attributes with at least one value each.");
      return;
    }

    const kept: ProductVariant[] = [];
    const existingKeys = new Set<string>();
    for (const variant of form.variants ?? []) {
      const key = comboMatchKey(variantOptions(variant));
      if (!key || existingKeys.has(key)) continue;
      existingKeys.add(key);
      kept.push(variant);
    }

    const added: ProductVariant[] = [];
    for (const options of combos) {
      const key = comboMatchKey(options);
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      added.push({
        id: createId("var"),
        sku: `${form.sku || "SKU"}-${kept.length + added.length + 1}`,
        options,
        ...variantFieldsFromOptions(options, attributeNames),
        price: form.price,
        inventory: 0,
        status: "active" as const,
        title: comboTitle(options),
      });
    }

    if (!added.length) {
      toast.message("All variations already exist — nothing new to generate.");
      return;
    }

    const next = [...kept, ...added];
    patch({ variants: next });
    setExpandedVariantId(added[0]?.id ?? null);
    toast.success(
      `Added ${added.length} variation${added.length === 1 ? "" : "s"} (${kept.length} already existed)`,
    );
  }

  function updateVariant(id: string, partial: Partial<ProductVariant>) {
    patch({
      variants: (form.variants ?? []).map((v) => {
        if (v.id !== id) return v;
        const merged = { ...v, ...partial };
        if (partial.options) {
          Object.assign(merged, variantFieldsFromOptions(partial.options, attributeNames));
          merged.title = comboTitle(partial.options);
        }
        return merged;
      }),
    });
  }

  return (
    <div className="admin-page-shell">
    <form className="space-y-6" onSubmit={onSubmit}>
      <PageHeader
        title={product ? "Edit product" : "Create product"}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void save("draft")}
            >
              {savingAs === "draft" ? <Loader2 className="size-4 animate-spin" /> : null}
              Save as draft
            </Button>
            <Button type="button" disabled={saving} onClick={() => void save("active")}>
              {savingAs === "active" ? <Loader2 className="size-4 animate-spin" /> : null}
              {product?.status === "active" ? "Update" : "Publish"}
            </Button>
          </>
        }
      />

      <div className="product-editor-grid grid items-start gap-5 lg:gap-6">
        <div className="product-editor-column space-y-5">
          <SectionCard
            title="Product"
            className="admin-surface-card"
          >
            <div className="grid gap-4">
              <FormField label="Name" htmlFor="name" required>
                <Input id="name" value={form.name} onChange={(e) => onName(e.target.value)} />
              </FormField>
              <FormField label="Slug" htmlFor="slug">
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => patch({ slug: slugify(e.target.value) })}
                />
              </FormField>
              <FormField label="Short description">
                <SimpleRichTextEditor
                  value={form.shortDescription}
                  onChange={(shortDescription) => patch({ shortDescription })}
                  placeholder="Short pitch shown under the title on the product page…"
                  minHeight={280}
                />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard
            title="Product page sections"
            className="admin-surface-card"
            action={
              (form.contentSections?.length ?? 0) < 5 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const nextIndex = form.contentSections?.length ?? 0;
                    patch({
                      contentSections: [
                        ...(form.contentSections ?? []),
                        { heading: "", body: "" } satisfies ProductContentSection,
                      ],
                    });
                    setExpandedSectionIndex(nextIndex);
                  }}
                >
                  <Plus /> Add section
                </Button>
              ) : null
            }
          >
            <div className="grid gap-4">
              {(form.contentSections ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No custom sections yet.</p>
              ) : null}
              {(form.contentSections ?? []).map((section, index) => {
                const isOpen = expandedSectionIndex === index;
                const sectionLabel = section.heading.trim() || `Section ${index + 1}`;
                return (
                  <div
                    key={index}
                    className="overflow-hidden rounded-lg border border-[#dedee1] bg-white"
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-3 text-left hover:bg-[#f6f6f7]"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setExpandedSectionIndex((current) =>
                            current === index ? null : index,
                          )
                        }
                      >
                        <span className="truncate text-sm font-medium">{sectionLabel}</span>
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="mr-1 shrink-0"
                        aria-label={`Remove ${sectionLabel}`}
                        onClick={() => {
                          patch({
                            contentSections: (form.contentSections ?? []).filter(
                              (_, i) => i !== index,
                            ),
                          });
                          setExpandedSectionIndex((current) => {
                            if (current === null) return null;
                            if (current === index) return null;
                            if (current > index) return current - 1;
                            return current;
                          });
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    {isOpen ? (
                      <div className="grid gap-3 border-t border-[#e1e1e3] bg-[#fafafa] p-3">
                        <FormField label="Heading" htmlFor={`section-heading-${index}`}>
                          <Input
                            id={`section-heading-${index}`}
                            placeholder="e.g. Description"
                            value={section.heading}
                            onChange={(e) => {
                              const next = [...(form.contentSections ?? [])];
                              next[index] = { ...next[index], heading: e.target.value };
                              patch({ contentSections: next });
                            }}
                          />
                        </FormField>
                        <FormField label="Content">
                          <SimpleRichTextEditor
                            value={section.body}
                            onChange={(body) => {
                              const next = [...(form.contentSections ?? [])];
                              next[index] = { ...next[index], body };
                              patch({ contentSections: next });
                            }}
                            placeholder="Section content…"
                            minHeight={224}
                          />
                        </FormField>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Inventory"
            className="admin-surface-card"
            contentClassName="pt-4"
          >
            <div className="divide-y divide-[#ececee]">
              <InventoryPanel className="py-4">
                <InventoryToggleRow
                  label="Track stock quantity"
                  description="Monitor units on hand and control sell-out behavior"
                  checked={inventory.trackInventory}
                  onCheckedChange={(checked) => patchInventory({ trackInventory: checked })}
                />
              </InventoryPanel>

              {inventory.trackInventory ? (
                <InventoryPanel className="py-4 pl-3 sm:pl-4">
                  <div className="space-y-4">
                    {!supportsVariants ? (
                      <InventoryInset>
                        <FormField label="Quantity on hand" htmlFor="stock-quantity">
                          <Input
                            id="stock-quantity"
                            type="number"
                            min={0}
                            step={1}
                            className="admin-field-input h-11 max-w-[11rem] bg-white text-base font-medium text-foreground tabular-nums"
                            value={inventory.quantity ?? 0}
                            onChange={(e) =>
                              patchInventory({
                                quantity: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                              })
                            }
                          />
                        </FormField>
                      </InventoryInset>
                    ) : (
                      <InventoryInset>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Quantities are managed per variant in the{" "}
                          <span className="font-medium text-foreground">Attributes</span> section
                          below.
                        </p>
                      </InventoryInset>
                    )}

                    <InventoryInset>
                      <InventoryToggleRow
                        label="Continue selling when out of stock"
                        description="Allow purchases after inventory reaches zero"
                        checked={inventory.allowBackorder}
                        onCheckedChange={(checked) => patchInventory({ allowBackorder: checked })}
                      />
                    </InventoryInset>
                  </div>
                </InventoryPanel>
              ) : null}

              <InventoryPanel className={cn("py-4", inventory.trackInventory && "pl-3 sm:pl-4")}>
                <FormField label="Availability">
                  <div
                    className="inventory-availability grid gap-2 sm:grid-cols-2"
                    role="radiogroup"
                    aria-label="Availability"
                  >
                    {STOCK_STATUSES.map((status) => {
                      const selected = inventory.stockStatus === status;
                      return (
                        <div
                          key={status}
                          role="radio"
                          tabIndex={0}
                          aria-checked={selected}
                          data-selected={selected ? "true" : "false"}
                          data-status={status}
                          onClick={() => patchInventory({ stockStatus: status })}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              patchInventory({ stockStatus: status });
                            }
                          }}
                          className="inventory-availability-option"
                        >
                          {STOCK_STATUS_LABELS[status]}
                        </div>
                      );
                    })}
                  </div>
                </FormField>
              </InventoryPanel>

              <InventoryPanel className="py-4">
                <InventoryToggleRow
                  label="Sold individually"
                  description="Customers can only purchase one per order"
                  checked={inventory.soldIndividually}
                  onCheckedChange={(checked) => patchInventory({ soldIndividually: checked })}
                />
              </InventoryPanel>
            </div>
          </SectionCard>

          {supportsVariants ? (
            <div ref={variantsSectionRef}>
              <SectionCard
                title="Attributes"
                className="admin-surface-card"
                action={
                  <Button type="button" size="sm" variant="outline" onClick={addAttribute}>
                    <Plus /> Add attribute
                  </Button>
                }
              >
                <div className="space-y-5">
                  <div className="grid gap-3">
                    {attributes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attributes yet.</p>
                    ) : null}
                    {attributes.map((attr, index) => {
                      const isOpen = expandedAttributeIndex === index;
                      const attributeLabel = attr.name.trim() || `Attribute ${index + 1}`;
                      return (
                        <div
                          key={index}
                          className="overflow-hidden rounded-lg border border-[#dedee1] bg-white"
                        >
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 flex-col items-start gap-1.5 px-3 py-3 text-left hover:bg-[#f6f6f7]"
                              aria-expanded={isOpen}
                              onClick={() =>
                                setExpandedAttributeIndex((current) =>
                                  current === index ? null : index,
                                )
                              }
                            >
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="truncate text-sm font-medium">{attributeLabel}</span>
                                <ChevronDown
                                  className={cn(
                                    "size-4 shrink-0 text-muted-foreground transition-transform",
                                    isOpen && "rotate-180",
                                  )}
                                />
                              </div>
                              {!isOpen && attr.values.length > 0 ? (
                                <span className="text-xs text-muted-foreground">
                                  {formatAttributeValues(attr.values)}
                                </span>
                              ) : null}
                            </button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="mr-1 shrink-0"
                              aria-label={`Remove ${attributeLabel}`}
                              onClick={() => removeAttribute(index)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                          {isOpen ? (
                            <div className="border-t border-[#e1e1e3] bg-[#fafafa] p-3">
                              <div className="grid gap-3 sm:grid-cols-[minmax(0,9rem)_1fr] sm:items-end">
                                <FormField label="Name" htmlFor={`attribute-name-${index}`}>
                                  <Input
                                    id={`attribute-name-${index}`}
                                    placeholder="e.g. size, color"
                                    value={attr.name}
                                    onChange={(e) => updateAttribute(index, { name: e.target.value })}
                                  />
                                </FormField>
                                <FormField label="Values" htmlFor={`attribute-values-${index}`}>
                                  <EditableAttributeValues
                                    id={`attribute-values-${index}`}
                                    selected={attr.values}
                                    onChange={(values) => updateAttribute(index, { values })}
                                  />
                                </FormField>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3 border-t border-[#e8e8ea] pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        Variations
                        {(form.variants ?? []).length > 0 ? (
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            ({(form.variants ?? []).length})
                          </span>
                        ) : null}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={generateVariations}>
                          Generate all
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={addVariant}>
                          <Plus /> Add one
                        </Button>
                      </div>
                    </div>

                    {(form.variants ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No variations yet.</p>
                    ) : (
                      <div className="grid gap-3">
                        {(form.variants ?? []).map((variant) => {
                          const options = variantOptions(variant);
                          const enabled = (variant.status || "active") === "active";
                          const isOpen = expandedVariantId === variant.id;
                          const variationLabel =
                            variant.title || comboTitle(options) || "Variation";
                          return (
                            <div
                              key={variant.id}
                              className="overflow-hidden rounded-lg border border-[#dedee1] bg-white"
                            >
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="flex min-w-0 flex-1 flex-col items-start gap-1 px-3 py-3 text-left hover:bg-[#f6f6f7]"
                                  aria-expanded={isOpen}
                                  onClick={() =>
                                    setExpandedVariantId((current) =>
                                      current === variant.id ? null : variant.id,
                                    )
                                  }
                                >
                                  <div className="flex w-full items-center justify-between gap-2">
                                    <span
                                      className={cn(
                                        "truncate text-sm font-medium",
                                        !enabled && "text-muted-foreground line-through",
                                      )}
                                    >
                                      {variationLabel}
                                    </span>
                                    <ChevronDown
                                      className={cn(
                                        "size-4 shrink-0 text-muted-foreground transition-transform",
                                        isOpen && "rotate-180",
                                      )}
                                    />
                                  </div>
                                  {!isOpen ? (
                                    <span className="text-xs text-muted-foreground">
                                      {formatCurrency(variant.price)}
                                      {inventory.trackInventory
                                        ? ` · ${variant.inventory} in stock`
                                        : null}
                                      {!enabled ? " · Disabled" : null}
                                    </span>
                                  ) : null}
                                </button>
                                <label className="mr-1 flex shrink-0 items-center gap-1.5 px-1">
                                  <Switch
                                    checked={enabled}
                                    onCheckedChange={(checked) =>
                                      updateVariant(variant.id, {
                                        status: checked ? "active" : "inactive",
                                      })
                                    }
                                  />
                                  <span className="sr-only">Enabled</span>
                                </label>
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  className="mr-1 shrink-0"
                                  aria-label={`Remove ${variationLabel}`}
                                  onClick={() => {
                                    patch({
                                      variants: (form.variants ?? []).filter(
                                        (v) => v.id !== variant.id,
                                      ),
                                    });
                                    setExpandedVariantId((current) =>
                                      current === variant.id ? null : current,
                                    );
                                  }}
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                              {isOpen ? (
                                <div className="space-y-4 border-t border-[#e1e1e3] bg-[#fafafa] p-3">
                                  {attributes.filter((attr) => attr.name.trim()).length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                      {attributes
                                        .filter((attr) => attr.name.trim())
                                        .map((attr) => {
                                          const name = attr.name.trim();
                                          return (
                                            <FormField key={name} label={name}>
                                              <AttributeValueTags
                                                mode="single"
                                                options={attr.values}
                                                selected={options[name] || ""}
                                                onChange={(value) => {
                                                  const nextValue = String(value);
                                                  const nextOptions = {
                                                    ...options,
                                                    [name]: nextValue,
                                                  };
                                                  const key = comboMatchKey(nextOptions);
                                                  const duplicate = (form.variants ?? []).some(
                                                    (v) =>
                                                      v.id !== variant.id &&
                                                      comboMatchKey(variantOptions(v)) === key,
                                                  );
                                                  if (duplicate) {
                                                    toast.error("That combination already exists.");
                                                    return;
                                                  }
                                                  updateVariant(variant.id, {
                                                    options: nextOptions,
                                                  });
                                                }}
                                              />
                                            </FormField>
                                          );
                                        })}
                                    </div>
                                  ) : null}
                                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <FormField label="SKU">
                                      <Input
                                        value={variant.sku}
                                        onChange={(e) =>
                                          updateVariant(variant.id, { sku: e.target.value })
                                        }
                                      />
                                    </FormField>
                                    <FormField label="Price">
                                      <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={variant.price}
                                        onChange={(e) =>
                                          updateVariant(variant.id, {
                                            price: Number(e.target.value),
                                          })
                                        }
                                      />
                                    </FormField>
                                    <FormField label="Compare-at price">
                                      <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={variant.compareAtPrice ?? ""}
                                        onChange={(e) =>
                                          updateVariant(variant.id, {
                                            compareAtPrice: e.target.value
                                              ? Number(e.target.value)
                                              : undefined,
                                          })
                                        }
                                      />
                                    </FormField>
                                    <FormField label="Stock">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={variant.inventory}
                                        onChange={(e) =>
                                          updateVariant(variant.id, {
                                            inventory: Number(e.target.value),
                                          })
                                        }
                                      />
                                    </FormField>
                                    <FormField label="Weight (lbs)">
                                      <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={
                                          variant.weightOz != null
                                            ? ouncesToPounds(variant.weightOz)
                                            : ""
                                        }
                                        onChange={(e) =>
                                          updateVariant(variant.id, {
                                            weightOz: e.target.value
                                              ? poundsToOunces(Number(e.target.value))
                                              : undefined,
                                          })
                                        }
                                      />
                                    </FormField>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : null}

          <SectionCard
            title="SEO"
            className="admin-surface-card"
          >
            <div className="grid gap-4">
              <SeoGooglePreview
                title={seoPreview.title}
                description={seoPreview.description}
                path={seoPreview.path}
              />
              <FormField
                label="SEO title"
                htmlFor="seo-title"
                hint={`${form.seo.title.length}/${SEO_TITLE_MAX} recommended`}
              >
                <Input
                  id="seo-title"
                  placeholder="Generated from the product name"
                  value={form.seo.title}
                  onChange={(e) => {
                    seoTouched.current.title = true;
                    patch({ seo: { ...form.seo, title: e.target.value } }, true);
                  }}
                />
              </FormField>
              <FormField
                label="SEO description"
                htmlFor="seo-desc"
                hint={`${form.seo.description.length}/${SEO_DESC_MAX} recommended`}
              >
                <Textarea
                  id="seo-desc"
                  rows={3}
                  placeholder="Generated from the product details"
                  value={form.seo.description}
                  onChange={(e) => {
                    seoTouched.current.description = true;
                    patch({ seo: { ...form.seo, description: e.target.value } }, true);
                  }}
                />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Noindex" hint="Ask search engines not to index this product">
                  <div className="flex h-9 items-center">
                    <Switch
                      checked={Boolean(form.seo.noindex)}
                      onCheckedChange={(checked) =>
                        patch({ seo: { ...form.seo, noindex: checked } }, true)
                      }
                    />
                  </div>
                </FormField>
                <FormField label="Nofollow" hint="Ask search engines not to follow links here">
                  <div className="flex h-9 items-center">
                    <Switch
                      checked={Boolean(form.seo.nofollow)}
                      onCheckedChange={(checked) =>
                        patch({ seo: { ...form.seo, nofollow: checked } }, true)
                      }
                    />
                  </div>
                </FormField>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="product-editor-column space-y-5">
          <SectionCard
            title="Organization"
            className="admin-surface-card"
          >
            <div className="grid gap-4">
              <FormField label="Status">
                <div className="rounded-lg border bg-muted/30 px-3 py-3">
                  <StatusBadge status={savedStatus === "active" ? "published" : savedStatus} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {savedStatus === "active"
                      ? "Live on the store"
                      : savedStatus === "archived"
                        ? "Hidden from the store"
                        : "Not visible on the store"}
                  </p>
                </div>
                {product && savedStatus !== "archived" ? (
                  <button
                    type="button"
                    disabled={saving}
                    className="mt-1 text-left text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
                    onClick={() => void save("archived")}
                  >
                    Archive this product
                  </button>
                ) : null}
              </FormField>
              <FormField label="Type">
                <Select
                  value={form.type}
                  items={typeSelectItems}
                  onValueChange={(value) => {
                    if (value == null) return;
                    applyProductType(normalizeProductType(String(value)));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type">
                      {(selected) =>
                        typeSelectItems.find((item) => item.value === selected)?.label ??
                        "Select type"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {productTypeOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {PRODUCT_TYPE_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                label="This product has options"
                hint="Turn this on for choices such as size or color."
              >
                <div className="flex h-9 items-center">
                  <Switch checked={supportsVariants} onCheckedChange={setHasVariants} />
                </div>
              </FormField>
              {isExternal ? (
                <FormField label="External URL" htmlFor="external-url" hint="Affiliate or off-site product link">
                  <Input
                    id="external-url"
                    type="url"
                    placeholder="https://"
                    value={form.externalUrl ?? ""}
                    onChange={(e) => patch({ externalUrl: e.target.value })}
                  />
                </FormField>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Category" className="admin-surface-card">
            <FormField label="Category" className="[&_label]:sr-only">
              <Select
                value={form.categoryId}
                items={categorySelectItems}
                onValueChange={(value) => {
                  if (value) patch({ categoryId: String(value) });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category">
                    {(selected) =>
                      categorySelectItems.find((item) => item.value === selected)?.label ??
                      "Select category"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </SectionCard>

          <SectionCard title="SKU" className="admin-surface-card">
            <FormField label="SKU" htmlFor="sku" required className="[&_label]:sr-only">
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => patch({ sku: e.target.value })}
              />
            </FormField>
          </SectionCard>

          <SectionCard title="Price" className="admin-surface-card">
            <FormField label="Price" htmlFor="price" className="[&_label]:sr-only">
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => {
                  const price = Number(e.target.value);
                  if (isDonation) {
                    patch({
                      price,
                      payWhatYouWant: {
                        enabled: true,
                        suggestedAmount: price,
                        minimumAmount: price,
                      },
                    });
                    return;
                  }
                  patch({ price });
                }}
              />
            </FormField>
          </SectionCard>

          <SectionCard title="Images" className="admin-surface-card">
            <div className="grid gap-4">
              <FormField
                label="Product image"
                hint="Main listing image."
              >
                <ImageUploader
                  value={form.images[0] ? [form.images[0]] : []}
                  max={1}
                  onChange={(urls) => {
                    const gallery = form.images.slice(1);
                    patch({ images: urls[0] ? [urls[0], ...gallery] : gallery });
                  }}
                  uploadContext={{
                    module: "product",
                    area: "cover",
                    entityId: product?.slug || form.slug || undefined,
                    entityTitle: form.name || product?.name || "New product",
                  }}
                />
              </FormField>
              <FormField
                label="Product gallery"
                hint="Extra product-page slides. Max 20MB per image."
              >
                <ImageUploader
                  value={form.images.slice(1)}
                  max={8}
                  onChange={(gallery) => {
                    const primary = form.images[0];
                    patch({ images: primary ? [primary, ...gallery] : gallery });
                  }}
                  uploadContext={{
                    module: "product",
                    area: "gallery",
                    entityId: product?.slug || form.slug || undefined,
                    entityTitle: form.name || product?.name || "New product",
                  }}
                />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Featured" className="admin-surface-card">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-3">
              <span className="text-sm font-medium">Featured product</span>
              <Switch
                checked={form.featured}
                onCheckedChange={(checked) => patch({ featured: checked })}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </form>
    </div>
  );
}
