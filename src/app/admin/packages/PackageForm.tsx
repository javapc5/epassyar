import { savePackage } from "./actions";
import { Field, TextInput, TextArea, Select, FormCard } from "@/components/admin/FormBits";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import { parseList } from "@/lib/format";

export default function PackageForm({ p, destinations }: { p?: any; destinations: { id: number; name: string; barangay: string }[] }) {
  const selectedIds: number[] = p?.destinations?.map((pd: any) => pd.destinationId) ?? [];
  const inclusions = p ? (parseList(p.inclusions) as any[]) : [];
  const included = inclusions.filter((i: any) => i.included).map((i: any) => i.label).join("\n");
  const excluded = inclusions.filter((i: any) => !i.included).map((i: any) => i.label).join("\n");

  return (
    <form action={savePackage} className="grid max-w-3xl gap-5">
      {p && <input type="hidden" name="id" value={p.id} />}

      <FormCard title="Package details">
        <Field label="Package name">
          <TextInput name="name" defaultValue={p?.name} required placeholder="e.g. Falls Hopping Adventure" />
        </Field>
        <Field label="Description">
          <TextArea name="description" rows={3} defaultValue={p?.description ?? ""} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Duration label" hint="Shown on the card badge">
            <TextInput name="durationLabel" defaultValue={p?.durationLabel ?? "Full day · 8 hrs"} />
          </Field>
          <Field label="Duration (days)">
            <TextInput type="number" name="durationDays" min={1} defaultValue={p?.durationDays ?? 1} />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={p?.status ?? "active"}>
              <option value="active">Active</option>
              <option value="inactive">Inactive (hidden)</option>
            </Select>
          </Field>
        </div>
        <Field label="Cover photo" hint="Crop and preview how it looks on the package card before saving.">
          <ImageCropUpload name="photoPath" mode="wide" initial={p?.mainImage} />
        </Field>
      </FormCard>

      <FormCard title="Destinations included (visit order follows selection order below)">
        <div className="grid gap-2 sm:grid-cols-2">
          {destinations.map((d) => (
            <label key={d.id} className="flex items-center gap-2 rounded-btn border border-line px-3 py-2 text-sm">
              <input type="checkbox" name="destinationIds" value={d.id} defaultChecked={selectedIds.includes(d.id)} className="h-4 w-4 accent-brand-700" />
              <span className="font-semibold">{d.name}</span>
              <span className="text-xs text-ink-600">· {d.barangay}</span>
            </label>
          ))}
        </div>
        <Field label="Day plan (optional)">
          <TextArea name="itineraryNotes" rows={2} defaultValue={p?.itineraryNotes ?? ""} placeholder="7:00 AM assembly · site 1 · lunch · site 2 · return" />
        </Field>
      </FormCard>

      <FormCard title="Pricing & capacity">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Price per pax (₱)">
            <TextInput type="number" name="pricePerPax" min={0} step="0.01" defaultValue={p?.pricePerPax ?? 0} required />
          </Field>
          <Field label="Min pax">
            <TextInput type="number" name="minPax" min={1} defaultValue={p?.minPax ?? 2} />
          </Field>
          <Field label="Max pax per date">
            <TextInput type="number" name="maxPax" min={1} defaultValue={p?.maxPax ?? 20} />
          </Field>
        </div>
      </FormCard>

      <FormCard title="Inclusions & exclusions (one per line)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Included">
            <TextArea name="inclusions" rows={4} defaultValue={included} placeholder={"Accredited tour guide\nEntrance fees\nTourist insurance"} />
          </Field>
          <Field label="Not included">
            <TextArea name="exclusions" rows={4} defaultValue={excluded} placeholder={"Meals\nPersonal expenses"} />
          </Field>
        </div>
      </FormCard>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-green">{p ? "Save changes" : "Create package"}</button>
        <a href="/admin/packages" className="btn btn-outline">Cancel</a>
      </div>
    </form>
  );
}
