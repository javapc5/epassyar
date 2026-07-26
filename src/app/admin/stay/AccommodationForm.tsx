import { saveAccommodation } from "./actions";
import { Field, TextInput, TextArea, Select, FormCard } from "@/components/admin/FormBits";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import GalleryManager from "@/components/admin/GalleryManager";

const BARANGAYS = ["Alibangsay", "Baay", "Cambaly", "Cardiz", "Dagup", "Suyo", "Tagudtud"];

export default function AccommodationForm({ a }: { a?: any }) {
  return (
    <form action={saveAccommodation} className="grid max-w-3xl gap-5">
      {a && <input type="hidden" name="id" value={a.id} />}

      <FormCard title="Homestay / cottage details">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <TextInput name="name" defaultValue={a?.name} required placeholder="e.g. Cambaly Highland Homestay" />
          </Field>
          <Field label="Type">
            <Select name="type" defaultValue={a?.type ?? "homestay"}>
              <option value="homestay">Homestay</option>
              <option value="cottage">Cottage</option>
              <option value="inn">Inn</option>
            </Select>
          </Field>
          <Field label="Barangay">
            <Select name="barangay" defaultValue={a?.barangay ?? "Cambaly"}>
              {BARANGAYS.map((b) => <option key={b}>{b}</option>)}
            </Select>
          </Field>
          <Field label="Price range" hint="Free text, e.g. ₱500–₱1,200 / night">
            <TextInput name="priceRange" defaultValue={a?.priceRange ?? ""} />
          </Field>
        </div>
        <Field label="Description & services" hint="Rooms, meals, amenities — what the host offers">
          <TextArea name="description" rows={3} defaultValue={a?.description ?? ""} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contact person">
            <TextInput name="contactPerson" defaultValue={a?.contactPerson ?? ""} />
          </Field>
          <Field label="Contact number" hint="Shown publicly — tourists contact hosts directly">
            <TextInput name="contactNumber" defaultValue={a?.contactNumber ?? ""} placeholder="09xx xxx xxxx" />
          </Field>
        </div>
        <Field label="Status">
          <Select name="status" defaultValue={a?.status ?? "active"}>
            <option value="active">Active (listed)</option>
            <option value="inactive">Inactive (hidden)</option>
          </Select>
        </Field>
        <Field label="Cover photo" hint="Crop and preview before saving.">
          <ImageCropUpload name="photoPath" mode="wide" initial={a?.image} />
        </Field>
      </FormCard>

      {a && (
        <FormCard title="Service photos (up to 10) — rooms, meals, amenities">
          <GalleryManager entityType="accommodation" entityId={a.id} />
        </FormCard>
      )}

      <div className="flex gap-2">
        <button type="submit" className="btn btn-green">{a ? "Save changes" : "Add listing"}</button>
        <a href="/admin/stay" className="btn btn-outline">Cancel</a>
      </div>
    </form>
  );
}
