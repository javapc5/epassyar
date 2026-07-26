import { saveDestination } from "./actions";
import { Field, TextInput, TextArea, Select, FormCard } from "@/components/admin/FormBits";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import GalleryManager from "@/components/admin/GalleryManager";
import { parseList } from "@/lib/format";

const BARANGAYS = ["Alibangsay", "Baay", "Cambaly", "Cardiz", "Dagup", "Suyo", "Tagudtud"];
const CATEGORIES = ["Waterfall", "Adventure Waterfall", "Heritage Cave", "Viewpoint", "Landmark", "Park", "Attraction"];

export default function DestinationForm({ d }: { d?: any }) {
  return (
    <form action={saveDestination} className="grid max-w-3xl gap-5">
      {d && <input type="hidden" name="id" value={d.id} />}

      <FormCard title="Basic information">
        <Field label="Destination name">
          <TextInput name="name" defaultValue={d?.name} required placeholder="e.g. Bulalakaw Falls" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Barangay">
            <Select name="barangay" defaultValue={d?.barangay ?? "Alibangsay"}>
              {BARANGAYS.map((b) => <option key={b}>{b}</option>)}
            </Select>
          </Field>
          <Field label="Category">
            <Select name="category" defaultValue={d?.category ?? "Waterfall"}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Description">
          <TextArea name="description" rows={3} defaultValue={d?.description ?? ""} placeholder="What makes this destination special?" />
        </Field>
        <Field label="Activities" hint="Separate with commas, e.g. Swimming, Trekking, Photography">
          <TextInput name="activities" defaultValue={d ? parseList(d.activities).join(", ") : ""} />
        </Field>
        <Field label="Cover photo" hint="Crop and preview how it looks on desktop and mobile cards before saving.">
          <ImageCropUpload name="photoPath" mode="wide" initial={d?.mainImage} />
        </Field>
      </FormCard>

      {d && (
        <FormCard title="Photo gallery (up to 10 photos)">
          <GalleryManager entityType="destination" entityId={d.id} />
        </FormCard>
      )}

      <FormCard title="Visit details">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Difficulty">
            <Select name="difficulty" defaultValue={d?.difficulty ?? "easy"}>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="challenging">Challenging</option>
            </Select>
          </Field>
          <Field label="Trek duration" hint="Leave blank if none">
            <TextInput name="trekkingDuration" defaultValue={d?.trekkingDuration ?? ""} placeholder="e.g. 15-20 minutes" />
          </Field>
          <Field label="Daily capacity (pax)">
            <TextInput type="number" name="dailyCapacity" min={1} defaultValue={d?.dailyCapacity ?? 50} />
          </Field>
          <Field label="Opens">
            <TextInput type="time" name="openTime" defaultValue={d?.openTime ?? "07:00"} />
          </Field>
          <Field label="Closes">
            <TextInput type="time" name="closeTime" defaultValue={d?.closeTime ?? "17:00"} />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={d?.status ?? "active"}>
              <option value="active">Active (bookable)</option>
              <option value="inactive">Inactive (hidden)</option>
              <option value="maintenance">Maintenance (closed)</option>
            </Select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="guideRequired" defaultChecked={d?.guideRequired ?? false} className="h-4 w-4 accent-brand-700" />
          Accredited guide required at this destination
        </label>
      </FormCard>

      <FormCard title="Fees (₱)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Entrance fee per pax" hint="0 = free entrance">
            <TextInput type="number" name="entranceFee" min={0} step="0.01" defaultValue={d?.entranceFee ?? 0} />
          </Field>
          <Field label="Environmental fee override per pax" hint="0 = use the municipal default (Settings page)">
            <TextInput type="number" name="environmentalFee" min={0} step="0.01" defaultValue={d?.environmentalFee ?? 0} />
          </Field>
        </div>
      </FormCard>

      <FormCard title="Visitor guidance (optional)">
        <Field label="What to bring">
          <TextArea name="whatToBring" rows={2} defaultValue={d?.whatToBring ?? ""} placeholder="e.g. Water, extra clothes, aqua shoes" />
        </Field>
        <Field label="Safety notes">
          <TextArea name="safetyNotes" rows={2} defaultValue={d?.safetyNotes ?? ""} placeholder="e.g. Slippery rocks near the basin; follow your guide" />
        </Field>
      </FormCard>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-green">{d ? "Save changes" : "Add destination"}</button>
        <a href="/admin/destinations" className="btn btn-outline">Cancel</a>
      </div>
    </form>
  );
}
