import { saveGuide } from "./actions";
import { Field, TextInput, TextArea, Select, FormCard } from "@/components/admin/FormBits";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import GalleryManager from "@/components/admin/GalleryManager";
import { parseList } from "@/lib/format";

const BARANGAYS = ["Alibangsay", "Baay", "Cambaly", "Cardiz", "Dagup", "Suyo", "Tagudtud"];

export default function GuideForm({ g }: { g?: any }) {
  return (
    <form action={saveGuide} className="grid max-w-3xl gap-5">
      {g && <input type="hidden" name="id" value={g.id} />}

      <FormCard title="Guide profile">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <TextInput name="fullName" defaultValue={g?.fullName} required />
          </Field>
          <Field label="Barangay">
            <Select name="barangay" defaultValue={g?.barangay ?? "Alibangsay"}>
              {BARANGAYS.map((b) => <option key={b}>{b}</option>)}
            </Select>
          </Field>
          <Field label="Mobile number" hint="Used for SMS duty notices — kept private, never shown to tourists">
            <TextInput name="mobile" defaultValue={g?.mobile ?? ""} placeholder="09xx xxx xxxx" />
          </Field>
          <Field label="Accreditation no.">
            <TextInput name="accreditationNo" defaultValue={g?.accreditationNo ?? ""} placeholder="BGL-CG-001" />
          </Field>
        </div>
        <Field label="About this guide" hint="Shown as the 'About' section on the public profile — background, experience, what they love showing visitors.">
          <TextArea name="bio" rows={4} defaultValue={g?.bio ?? ""} placeholder="e.g. Born and raised in Alibangsay, Danilo has been guiding treks to Bulalakaw Falls since 2019. He's certified in first aid and loves sharing the folklore behind each waterfall." />
        </Field>
        <Field label="Specialties" hint="Separate with commas, e.g. Rappelling, First aid, Heritage tours">
          <TextInput name="specialties" defaultValue={g ? parseList(g.specialties).join(", ") : ""} />
        </Field>
        <Field label="Full-body photo (portrait)" hint="Portrait 3:4 crop for a standing/full-body photo — preview before saving.">
          <ImageCropUpload name="photoPath" mode="portrait" initial={g?.photoUrl} buttonLabel="Upload full-body photo" />
        </Field>
      </FormCard>

      {g && (
        <FormCard title="Photo gallery (up to 10 photos)">
          <GalleryManager entityType="guide" entityId={g.id} />
        </FormCard>
      )}

      <FormCard title="Duty & rate settings">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Daily rate (₱)" hint="Guide fee charged per duty day">
            <TextInput type="number" name="dailyRate" min={0} step="0.01" defaultValue={g?.dailyRate ?? 600} />
          </Field>
          <Field label="Max group size" hint="Pax one guide can handle">
            <TextInput type="number" name="maxGroupSize" min={1} defaultValue={g?.maxGroupSize ?? 10} />
          </Field>
          <Field label="Years of experience">
            <TextInput type="number" name="yearsExperience" min={0} defaultValue={g?.yearsExperience ?? 0} />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={g?.status ?? "active"}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </Select>
          </Field>
        </div>
      </FormCard>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-green">{g ? "Save changes" : "Add guide"}</button>
        <a href="/admin/guides" className="btn btn-outline">Cancel</a>
      </div>
    </form>
  );
}
