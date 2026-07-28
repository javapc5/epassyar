import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { promisify } from "util";

const db = new PrismaClient();

const scryptAsync = promisify(crypto.scrypt) as (
  password: string,
  salt: string,
  keylen: number,
  options: crypto.ScryptOptions,
) => Promise<Buffer>;

/**
 * Mirrors hashPassword() in src/lib/auth.ts. Duplicated rather than imported
 * because the seed runs through tsx outside the Next.js module graph (the "@/"
 * alias is not resolvable here). Keep the parameters in sync with SCRYPT_OPTS.
 */
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const opts: crypto.ScryptOptions = { N: 32768, r: 8, p: 3, maxmem: 96 * 1024 * 1024 };
  const hash = (await scryptAsync(password, salt, 32, opts)).toString("hex");
  return `scrypt2:${salt}:${hash}`;
}

/**
 * Seed passwords come from the environment. When a variable is missing we mint a
 * random one and print it once — so a seeded database never contains a password
 * that is guessable from this repository.
 */
const generated: string[] = [];
function seedPassword(envVar: string, label: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv && fromEnv.length >= 12) return fromEnv;
  if (fromEnv) {
    throw new Error(`${envVar} is too short — use at least 12 characters.`);
  }
  const password = crypto.randomBytes(12).toString("base64url");
  generated.push(`  ${label}: ${password}`);
  return password;
}

async function main() {
  console.log("Seeding Bagulin Smart Tourism database...");

  // Wipe (dev only) — order matters for FKs
  await db.bookingFee.deleteMany();
  await db.bookingDestination.deleteMany();
  await db.guideAssignment.deleteMany();
  await db.bookingStatusLog.deleteMany();
  await db.payment.deleteMany();
  await db.qrPass.deleteMany();
  await db.smsLog.deleteMany();
  await db.booking.deleteMany();
  await db.packageDestination.deleteMany();
  await db.tourPackage.deleteMany();
  await db.guideAvailability.deleteMany();
  await db.guideCertification.deleteMany();
  await db.tourGuide.deleteMany();
  await db.destinationClosure.deleteMany();
  await db.destination.deleteMany();
  await db.feeSetting.deleteMany();
  await db.transportRoute.deleteMany();
  await db.localProduct.deleteMany();
  await db.accommodation.deleteMany();
  await db.user.deleteMany();
  await db.municipality.deleteMany();

  const bagulin = await db.municipality.create({
    data: {
      name: "Bagulin",
      province: "La Union",
      tagline: "Highlands of La Union",
      contactNumber: "(072) 000-0000",
      email: "tourism@bagulin.gov.ph",
      address: "Municipal Tourism Office, Bagulin, La Union",
      gcashName: "Bagulin Tourism Office",
      gcashNumber: "0917-000-0000",
    },
  });

  // Admin + staff accounts. Passwords are scrypt-hashed; set SEED_ADMIN_PASSWORD
  // and SEED_CASHIER_PASSWORD to choose them, otherwise random ones are printed.
  const adminPassword = seedPassword("SEED_ADMIN_PASSWORD", "admin@bagulin.gov.ph");
  const cashierPassword = seedPassword("SEED_CASHIER_PASSWORD", "cashier@bagulin.gov.ph");

  await db.user.createMany({
    data: [
      {
        municipalityId: bagulin.id,
        fullName: "Tourism Administrator",
        email: "admin@bagulin.gov.ph",
        mobile: "09170000001",
        passwordHash: await hashPassword(adminPassword),
        role: "TOURISM_ADMIN",
      },
      {
        municipalityId: bagulin.id,
        fullName: "Treasury Cashier",
        email: "cashier@bagulin.gov.ph",
        mobile: "09170000002",
        passwordHash: await hashPassword(cashierPassword),
        role: "STAFF",
      },
    ],
  });

  // Fee settings (placeholder amounts — set per municipal ordinance)
  await db.feeSetting.createMany({
    data: [
      { municipalityId: bagulin.id, feeCode: "ENVIRONMENTAL", label: "Environmental Fee", calcType: "per_pax", amount: 30 },
      { municipalityId: bagulin.id, feeCode: "INSURANCE", label: "Tourist Insurance", calcType: "per_pax", amount: 25 },
      { municipalityId: bagulin.id, feeCode: "RESERVATION", label: "Reservation Fee", calcType: "percent_of_total", amount: 20 },
    ],
  });

  // Transport routes
  await db.transportRoute.createMany({
    data: [
      { municipalityId: bagulin.id, routeName: "Town Proper ↔ Brgy. Suyo", vehicleType: "Habal-habal", feePerPax: 50 },
      { municipalityId: bagulin.id, routeName: "Town Proper ↔ Brgy. Alibangsay", vehicleType: "Habal-habal", feePerPax: 60 },
      { municipalityId: bagulin.id, routeName: "Town Proper ↔ Brgy. Cambaly", vehicleType: "Van", feePerTrip: 1500, maxPaxPerTrip: 10 },
    ],
  });

  // Destinations (real, officially declared)
  const destData = [
    {
      name: "Kudlap Burial Cave", barangay: "Cambaly", category: "Heritage Cave",
      description: "Features ancient artifacts, declared as a National Cultural Treasure, and preserves the rich cultural heritage of the municipality.",
      activities: ["Cultural tour", "Heritage exploration", "Historical sightseeing"],
      difficulty: "moderate", guideRequired: true, dailyCapacity: 30, entranceFee: 20, mainImage: "kudlap-cave",
    },
    {
      name: "Kudal People's Park", barangay: "Tagudtud", category: "Park",
      description: 'Known as the "Little Baguio" of Bagulin. Offers visitors cool pine breezes and overlooking views of the West Philippine Sea.',
      activities: ["Sightseeing", "Photography", "Relaxation"],
      difficulty: "easy", guideRequired: false, dailyCapacity: 100, entranceFee: 20, mainImage: "kudal-park",
    },
    {
      name: "Tiluniang Falls", barangay: "Cardiz", category: "Waterfall",
      description: "Offers a great picnic area and enjoyable dips in its rushing clear waters and natural pools.",
      activities: ["Swimming", "Picnic", "Nature trekking"],
      difficulty: "easy", guideRequired: true, dailyCapacity: 60, entranceFee: 20, mainImage: "tiluniang-falls",
    },
    {
      name: "Picao Hanging Footbridge", barangay: "Suyo", category: "Landmark",
      description: "The longest hanging footbridge in La Union — approximately 211.30 m long, 1.30 m wide, standing 5 m above the Bagulin River.",
      activities: ["Sightseeing", "Photography", "Walking tour"],
      difficulty: "easy", guideRequired: false, dailyCapacity: 80, entranceFee: 20, mainImage: "picao-bridge",
    },
    {
      name: "Loslosi Falls", barangay: "Suyo", category: "Waterfall",
      description: "Majestic waterfalls with multiple cascades and natural pools suitable for swimming and picnics.",
      activities: ["Swimming", "Picnic", "Nature exploration"],
      difficulty: "easy", guideRequired: true, dailyCapacity: 60, entranceFee: 20, mainImage: "loslosi-falls",
    },
    {
      name: "Bulalakaw Falls", barangay: "Alibangsay", category: "Waterfall",
      description: "Crystal-clear waterfalls that entice visitors to swim. Requires approximately 15–20 minutes of trekking.",
      activities: ["Trekking", "Swimming", "Photography"],
      trekkingDuration: "15-20 minutes", difficulty: "moderate", guideRequired: true, dailyCapacity: 50, entranceFee: 20, mainImage: "bulalakaw-falls",
    },
    {
      name: "Kudlap Viewdeck", barangay: "Cambaly", category: "Viewpoint",
      description: "Panoramic views of mountains, rice terraces, boyboy (tiger grass) farms, and neighboring municipalities.",
      activities: ["Viewing", "Photography", "Sightseeing"],
      difficulty: "easy", guideRequired: false, dailyCapacity: 80, entranceFee: 20, mainImage: "kudlap-viewdeck",
    },
    {
      name: "Kapandagan Falls", barangay: "Cardiz", category: "Adventure Waterfall",
      description: "Requires approximately 40 minutes of trekking with rappelling assistance from trained tour guides. Crystal-clear waters and scenic waterfalls.",
      activities: ["Trekking", "Rappelling", "Swimming", "Adventure tourism"],
      trekkingDuration: "40 minutes", difficulty: "challenging", guideRequired: true, dailyCapacity: 30, entranceFee: 30, mainImage: "kapandagan-falls",
    },
  ];

  const destinations: Record<string, number> = {};
  for (const d of destData) {
    const created = await db.destination.create({
      data: {
        municipalityId: bagulin.id,
        name: d.name,
        barangay: d.barangay,
        category: d.category,
        description: d.description,
        activities: JSON.stringify(d.activities),
        trekkingDuration: d.trekkingDuration ?? null,
        difficulty: d.difficulty,
        guideRequired: d.guideRequired,
        dailyCapacity: d.dailyCapacity,
        entranceFee: d.entranceFee,
        environmentalFee: 0, // use municipal default
        mainImage: d.mainImage,
      },
    });
    destinations[d.name] = created.id;
  }

  // Tour guides (22 accredited community guides)
  const guideData: [string, string][] = [
    ["Dwaynver B. Abangley", "Tagudtud"],
    ["Jerald Tuaban", "Cardiz"],
    ["Danilo Pulmano", "Alibangsay"],
    ["Ofelia Rodriguez", "Cardiz"],
    ["Greg Galate", "Cardiz"],
    ["Elmer Atimpao", "Cardiz"],
    ["Eliazer Simeon", "Baay"],
    ["Jasmin S. Fernandez", "Baay"],
    ["Joen Compas", "Tagudtud"],
    ["Joneflord D. Flores", "Alibangsay"],
    ["Venus A. Dangpilen", "Suyo"],
    ["Edison Edzel D. Caluza", "Suyo"],
    ["Hazel B. Villano", "Cambaly"],
    ["May Ann Galate", "Cardiz"],
    ["Erma E. Soriano", "Suyo"],
    ["Mildred Caluza", "Suyo"],
    ["Cristian Munar", "Alibangsay"],
    ["Prescila Calis", "Cardiz"],
    ["Dionie Lubrica", "Suyo"],
    ["Yolanda S. Ofo-ob", "Cambaly"],
    ["Dexter B. Batatas", "Cambaly"],
    ["Jayson L. Alos", "Suyo"],
  ];

  // Give a few guides sample specialties/ratings so profiles look alive
  const enrich: Record<string, { specialties: string[]; years: number; rating: number; count: number }> = {
    "Danilo Pulmano": { specialties: ["Waterfall treks", "First aid"], years: 6, rating: 4.9, count: 41 },
    "Jerald Tuaban": { specialties: ["Rappelling", "Adventure", "First aid"], years: 8, rating: 4.8, count: 37 },
    "Hazel B. Villano": { specialties: ["Heritage & cave tours"], years: 5, rating: 4.9, count: 28 },
    "Venus A. Dangpilen": { specialties: ["River & bridge tours"], years: 4, rating: 4.7, count: 22 },
    "Joneflord D. Flores": { specialties: ["Waterfall treks", "Photography"], years: 5, rating: 4.8, count: 25 },
  };

  for (const [name, brgy] of guideData) {
    const e = enrich[name];
    await db.tourGuide.create({
      data: {
        municipalityId: bagulin.id,
        fullName: name,
        barangay: brgy,
        specialties: JSON.stringify(e?.specialties ?? []),
        yearsExperience: e?.years ?? 2,
        ratingAvg: e?.rating ?? 0,
        ratingCount: e?.count ?? 0,
        dailyRate: 600,
        accreditationNo: "BGL-CG-" + String(Object.keys(destinations).length).padStart(3, "0"),
      },
    });
  }

  // Official tour packages (built from real destinations)
  const packages = [
    {
      name: "Falls Hopping Adventure", slug: "falls-hopping-adventure",
      description: "A full day chasing Bagulin's clearest waters — three waterfalls, natural pools, and picnic stops, led by an accredited guide.",
      durationDays: 1, durationLabel: "Full day · 8 hrs", pricePerPax: 1250, minPax: 2, maxPax: 20,
      mainImage: "pkg-falls", dests: ["Tiluniang Falls", "Loslosi Falls", "Bulalakaw Falls"],
      inclusions: [
        { label: "Accredited tour guide", included: true },
        { label: "Entrance fees", included: true },
        { label: "Tourist insurance", included: true },
        { label: "Habal-habal transport", included: true },
        { label: "Meals", included: false },
      ],
      itineraryNotes: "7:00 AM assembly · Tiluniang Falls · lunch · Loslosi Falls · Bulalakaw Falls trek · 4:00 PM return.",
    },
    {
      name: "Heritage & Highlands Tour", slug: "heritage-highlands-tour",
      description: "Discover Bagulin's cultural soul at a National Cultural Treasure, then breathe the pine-cooled air of the 'Little Baguio' viewdeck and park.",
      durationDays: 1, durationLabel: "Half day · 4 hrs", pricePerPax: 950, minPax: 2, maxPax: 25,
      mainImage: "pkg-heritage", dests: ["Kudlap Burial Cave", "Kudlap Viewdeck", "Kudal People's Park"],
      inclusions: [
        { label: "Heritage guide", included: true },
        { label: "Entrance fees", included: true },
        { label: "Tourist insurance", included: true },
        { label: "Transport", included: false },
      ],
      itineraryNotes: "8:00 AM Kudlap Burial Cave · Kudlap Viewdeck photo stop · Kudal People's Park · 12:00 NN end.",
    },
    {
      name: "Bridge & Rappel Extreme", slug: "bridge-rappel-extreme",
      description: "For thrill-seekers: cross the longest hanging footbridge in La Union, then trek and rappel into Kapandagan Falls with certified guides.",
      durationDays: 1, durationLabel: "Adventure · 6 hrs", pricePerPax: 1600, minPax: 2, maxPax: 12,
      mainImage: "pkg-adventure", dests: ["Picao Hanging Footbridge", "Kapandagan Falls"],
      inclusions: [
        { label: "Rappel-certified guide", included: true },
        { label: "Rappelling gear", included: true },
        { label: "Entrance fees", included: true },
        { label: "Tourist insurance", included: true },
        { label: "Meals", included: false },
      ],
      itineraryNotes: "7:00 AM Picao Hanging Footbridge · trek to Kapandagan · rappelling · swim · 1:00 PM return.",
    },
  ];

  for (const p of packages) {
    const created = await db.tourPackage.create({
      data: {
        municipalityId: bagulin.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        durationDays: p.durationDays,
        durationLabel: p.durationLabel,
        pricePerPax: p.pricePerPax,
        minPax: p.minPax,
        maxPax: p.maxPax,
        mainImage: p.mainImage,
        itineraryNotes: p.itineraryNotes,
        inclusions: JSON.stringify(p.inclusions),
      },
    });
    let order = 1;
    for (const dn of p.dests) {
      await db.packageDestination.create({
        data: { packageId: created.id, destinationId: destinations[dn], visitOrder: order++ },
      });
    }
  }

  // Local products (showcase, non-bookable)
  await db.localProduct.createMany({
    data: [
      { municipalityId: bagulin.id, name: "Quality Softbrooms", category: "Handicraft", description: "Main product of the municipality. Made from locally planted and harvested raw materials and handcrafted by local farmers.", producer: "Local Farmers", image: "prod-softbroom" },
      { municipalityId: bagulin.id, name: "Bugnay Wine", category: "Beverage", description: "Bagulin's locally produced wine made from bugnay berries harvested within the municipality.", producer: "Local Producers", image: "prod-bugnay" },
      { municipalityId: bagulin.id, name: "Organic Turmeric-Ginger Tea / Powder", category: "Food", description: "Produced by Bagulin Multi-Purpose Cooperative in partnership with LGU Bagulin, DTI, and BFAD. Made from locally produced turmeric and ginger.", producer: "Bagulin Multi-Purpose Cooperative", image: "prod-tea" },
      { municipalityId: bagulin.id, name: "Ube Wine", category: "Beverage", description: "Bagulin's locally produced wine made from locally harvested ube. Supports local farmers and the local economy.", producer: "Local Farmers", image: "prod-ube" },
    ],
  });

  // Accommodations (recommendations only)
  await db.accommodation.createMany({
    data: [
      { municipalityId: bagulin.id, name: "Cambaly Highland Homestay", type: "homestay", barangay: "Cambaly", description: "Family-run homestay near Kudlap Viewdeck with home-cooked highland meals.", contactPerson: "Brgy. Tourism Focal", contactNumber: "0917-000-0000", priceRange: "₱500–₱1,200 / night", image: "acc-homestay" },
      { municipalityId: bagulin.id, name: "Suyo Riverside Cottages", type: "cottage", barangay: "Suyo", description: "Open-air cottages for day rentals near Picao Hanging Footbridge.", contactPerson: "Brgy. Tourism Focal", contactNumber: "0917-000-0000", priceRange: "₱300–₱800 / day", image: "acc-cottage" },
    ],
  });

  const guideCount = await db.tourGuide.count();
  const destCount = await db.destination.count();
  console.log(`Seeded: ${destCount} destinations, ${guideCount} guides, 3 packages, 4 products, 2 accommodations.`);

  if (generated.length > 0) {
    console.log("\n─── Generated staff passwords — copy them now, they are not stored anywhere ───");
    console.log(generated.join("\n"));
    console.log("Set SEED_ADMIN_PASSWORD / SEED_CASHIER_PASSWORD to choose your own instead.\n");
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
