import { saveProduct } from "./actions";
import { Field, TextInput, TextArea, Select, FormCard } from "@/components/admin/FormBits";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import GalleryManager from "@/components/admin/GalleryManager";

const UNITS = ["pcs", "kilo", "bundle", "pack", "bottle"];

export default function ProductForm({ p }: { p?: any }) {
  return (
    <form action={saveProduct} className="grid max-w-3xl gap-5">
      {p && <input type="hidden" name="id" value={p.id} />}

      <FormCard title="Basic information">
        <Field label="Product name">
          <TextInput name="name" defaultValue={p?.name} required placeholder="e.g. Quality Softbrooms" />
        </Field>
        <Field label="Category" hint="e.g. Handicraft, Beverage, Food, Produce, Souvenir">
          <TextInput name="category" defaultValue={p?.category ?? ""} placeholder="e.g. Handicraft" />
        </Field>
        <Field label="Description">
          <TextArea name="description" rows={3} defaultValue={p?.description ?? ""} placeholder="What is it, and what makes it worth buying?" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Producer" hint="Farmer or cooperative name shown to tourists">
            <TextInput name="producer" defaultValue={p?.producer ?? ""} placeholder="e.g. Local Farmers" />
          </Field>
          <Field label="Supplier mobile" hint="Contact the office can call to source it — not shown publicly">
            <TextInput name="supplierMobile" defaultValue={p?.supplierMobile ?? ""} placeholder="09XXXXXXXXX" />
          </Field>
        </div>
        <Field label="Where to buy" hint="Leave blank to default to our pickup point">
          <TextInput name="whereToBuy" defaultValue={p?.whereToBuy ?? ""} placeholder="e.g. ePassyar pickup point" />
        </Field>
        <Field label="Cover photo" hint="Crop and preview how it looks on desktop and mobile cards before saving.">
          <ImageCropUpload name="photoPath" mode="wide" initial={p?.image} />
        </Field>
      </FormCard>

      {p && (
        <FormCard title="Photo gallery (up to 10 photos)">
          <GalleryManager entityType="product" entityId={p.id} />
        </FormCard>
      )}

      <FormCard title="Pricing & unit">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Sold by (unit)">
            <Select name="unit" defaultValue={p?.unit ?? "pcs"}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </Field>
          <Field label="Price per unit (₱)" hint="Shown to the tourist">
            <TextInput type="number" name="price" min={0} step="0.01" defaultValue={p?.price ?? 0} />
          </Field>
          <Field label="Cost price (₱)" hint="What the office pays the farmer — not shown publicly">
            <TextInput type="number" name="costPrice" min={0} step="0.01" defaultValue={p?.costPrice ?? 0} />
          </Field>
        </div>
      </FormCard>

      <FormCard title="Availability">
        <Field label="Availability mode">
          <Select name="availabilityMode" defaultValue={p?.availabilityMode ?? "in_stock"}>
            <option value="always">Always — office always has it, no counting</option>
            <option value="in_stock">In stock — counts down from Stock quantity</option>
            <option value="made_to_order">Made to order — needs Lead time before pickup</option>
            <option value="unavailable">Unavailable — temporarily off</option>
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Stock quantity" hint="Used when mode = In stock">
            <TextInput type="number" name="stockQty" min={0} step="1" defaultValue={p?.stockQty ?? 0} />
          </Field>
          <Field label="Lead time (days)" hint="Used when mode = Made to order">
            <TextInput type="number" name="leadTimeDays" min={0} step="1" defaultValue={p?.leadTimeDays ?? 0} />
          </Field>
        </div>
      </FormCard>

      <FormCard title="Showcase">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="isFeatured" defaultChecked={p?.isFeatured ?? false} className="h-4 w-4 accent-brand-700" />
            Show in the &quot;Trending in Bagulin&quot; strip
          </label>
          <Field label="Featured rank" hint="Lower sorts first within the strip">
            <TextInput type="number" name="featuredRank" defaultValue={p?.featuredRank ?? 0} />
          </Field>
        </div>
        <Field label="Status">
          <Select name="status" defaultValue={p?.status ?? "available"}>
            <option value="available">Available (shown on site)</option>
            <option value="archived">Archived (hidden from site)</option>
          </Select>
        </Field>
      </FormCard>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-green">{p ? "Save changes" : "Add product"}</button>
        <a href="/admin/products" className="btn btn-outline">Cancel</a>
      </div>
    </form>
  );
}
