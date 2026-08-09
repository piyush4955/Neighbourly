import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'password123';

/**
 * 25 Fake Users scattered around San Francisco, CA (Center: 37.7749, -122.4194)
 */
const SEED_USERS = [
  { name: 'Alex Rivera', email: 'alex.rivera@example.com', bio: 'DIY enthusiast & woodworker in SoMa', lat: 37.7785, lng: -122.3996 },
  { name: 'Brenda Chen', email: 'brenda.chen@example.com', bio: 'Urban gardener in Mission District', lat: 37.7599, lng: -122.4148 },
  { name: 'Carlos Mendez', email: 'carlos.mendez@example.com', bio: 'Home renovator in Potrero Hill', lat: 37.7587, lng: -122.3997 },
  { name: 'Diana Prince', email: 'diana.prince@example.com', bio: 'Craftsman in Castro', lat: 37.7609, lng: -122.4350 },
  { name: 'Ethan Hunt', email: 'ethan.hunt@example.com', bio: 'Mechanic & gearhead in Haight-Ashbury', lat: 37.7699, lng: -122.4469 },
  { name: 'Fiona Gallagher', email: 'fiona.g@example.com', bio: 'Handyman in Sunset District', lat: 37.7534, lng: -122.4942 },
  { name: 'George Miller', email: 'george.m@example.com', bio: 'Maker & welder in Richmond District', lat: 37.7799, lng: -122.4842 },
  { name: 'Hannah Abbott', email: 'hannah.a@example.com', bio: 'Landscape designer in Marina District', lat: 37.8030, lng: -122.4360 },
  { name: 'Ian Malcolm', email: 'ian.m@example.com', bio: 'Electronics engineer in Nob Hill', lat: 37.7932, lng: -122.4145 },
  { name: 'Julia Roberts', email: 'julia.r@example.com', bio: 'Painter & restorer in Pacific Heights', lat: 37.7925, lng: -122.4382 },
  { name: 'Kevin Flynn', email: 'kevin.f@example.com', bio: 'Woodworking hobbyist in Bernal Heights', lat: 37.7441, lng: -122.4150 },
  { name: 'Laura Croft', email: 'laura.c@example.com', bio: 'Restoration expert in Excelsior', lat: 37.7247, lng: -122.4283 },
  { name: 'Marcus Brody', email: 'marcus.b@example.com', bio: 'Antique tool collector in North Beach', lat: 37.8003, lng: -122.4102 },
  { name: 'Nina Williams', email: 'nina.w@example.com', bio: 'Bicycle mechanic in Hayes Valley', lat: 37.7766, lng: -122.4243 },
  { name: 'Oscar Isaac', email: 'oscar.i@example.com', bio: 'Plumbing & pipefitting in Chinatown', lat: 37.7941, lng: -122.4078 },
  { name: 'Pamela Beesly', email: 'pamela.b@example.com', bio: 'Artist & sculptor in Dogpatch', lat: 37.7602, lng: -122.3887 },
  { name: 'Quentin Tarantino', email: 'quentin.t@example.com', bio: 'Prop builder in Bayview', lat: 37.7297, lng: -122.3929 },
  { name: 'Rachel Green', email: 'rachel.g@example.com', bio: 'Interior decorator in Russian Hill', lat: 37.8018, lng: -122.4198 },
  { name: 'Steve Rogers', email: 'steve.r@example.com', bio: 'General contractor in Daly City', lat: 37.6879, lng: -122.4702 },
  { name: 'Tony Stark', email: 'tony.s@example.com', bio: 'High-tech fabrication enthusiast in Berkeley', lat: 37.8715, lng: -122.2730 },
  { name: 'Uma Thurman', email: 'uma.t@example.com', bio: 'Permaculture gardener in Oakland', lat: 37.8044, lng: -122.2711 },
  { name: 'Victor Von', email: 'victor.v@example.com', bio: 'Heavy equipment owner in Alameda', lat: 37.7652, lng: -122.2416 },
  { name: 'Wanda Maximoff', email: 'wanda.m@example.com', bio: 'Home improver in Sausalito', lat: 37.8590, lng: -122.4853 },
  { name: 'Xavier Charles', email: 'xavier.c@example.com', bio: 'Community shop lead in South SF', lat: 37.6547, lng: -122.4077 },
  { name: 'Yolanda Adams', email: 'yolanda.a@example.com', bio: 'Quilter & seamstress in Twin Peaks', lat: 37.7544, lng: -122.4477 }
];

/**
 * 38 Varied Tool Listings
 */
const SEED_LISTINGS = [
  { title: 'DeWalt 20V Cordless Drill Kit', description: 'Includes drill, 2Ah battery, charger, and carrying bag. Great for light home projects.', category: 'Power Tools', userIndex: 0 },
  { title: 'Ryobi 10-Inch Compound Miter Saw', description: 'Precision cross-cutting miter saw. Perfect for baseboards and trim work.', category: 'Power Tools', userIndex: 0 },
  { title: 'Honda 21-Inch Self-Propelled Lawn Mower', description: 'Gas powered lawn mower with bagger and mulch plug. Runs smooth.', category: 'Gardening', userIndex: 1 },
  { title: 'Stihl Gas Hedge Trimmer', description: 'Heavy duty 24-inch dual reciprocating blade hedge trimmer.', category: 'Gardening', userIndex: 1 },
  { title: 'Bosch Rotary Hammer Drill (SDS-Plus)', description: 'For drilling into concrete, brick, and masonry. Includes 1/2 inch drill bit set.', category: 'Power Tools', userIndex: 2 },
  { title: 'Husky 200-Piece Mechanics Tool Set', description: 'Complete socket and wrench set in heavy duty plastic carrying case.', category: 'Hand Tools', userIndex: 2 },
  { title: 'Little Giant 22-Foot Multi-Task Ladder', description: 'Convertible aluminum extension ladder. Stepladder, extension, and scaffold configurations.', category: 'Ladders & Scaffolding', userIndex: 3 },
  { title: 'Graco Magnum Airless Paint Sprayer', description: 'Ideal for painting fences, decks, and exterior siding quickly.', category: 'Painting', userIndex: 3 },
  { title: 'Milwaukee M18 Fuel Cordless Circular Saw', description: '7-1/4 inch circular saw with 5.0Ah high capacity battery.', category: 'Power Tools', userIndex: 4 },
  { title: 'Torque Wrench 1/2 Inch Drive', description: 'Click type torque wrench (20-150 ft-lbs). Essential for wheel lug nuts and engine work.', category: 'Hand Tools', userIndex: 4 },
  { title: 'Karcher 2000 PSI Electric Pressure Washer', description: 'Great for cleaning driveways, patio furniture, and car detailing.', category: 'Gardening', userIndex: 5 },
  { title: 'Fiskars Post Hole Digger & Tamper Bar', description: 'Steel post hole digger for installing fence posts and footings.', category: 'Gardening', userIndex: 5 },
  { title: 'Makita Variable Speed Angle Grinder', description: '4-1/2 inch angle grinder with cutting, grinding, and wire brush wheels included.', category: 'Power Tools', userIndex: 6 },
  { title: 'Lincoln Electric MIG Welder 140A', description: '120V wire feed MIG welder with gas regulator for shield gas.', category: 'Power Tools', userIndex: 6 },
  { title: 'EGO 56V Cordless Leaf Blower', description: 'Turbo blower with 650 CFM air volume. Super powerful and quiet.', category: 'Gardening', userIndex: 7 },
  { title: 'Wheelbarrow 6 Cu. Ft. Heavy Duty Steel', description: 'Dual wheel steel wheelbarrow for hauling soil, gravel, and mulch.', category: 'Gardening', userIndex: 7 },
  { title: 'Weller Digital Soldering Station', description: '70W soldering iron with adjustable temperature control and brass sponge cleaner.', category: 'Electronics & Crafts', userIndex: 8 },
  { title: 'Rigid Digital Oscilloscope 100MHz', description: 'Dual channel digital storage oscilloscope for circuit testing.', category: 'Electronics & Crafts', userIndex: 8 },
  { title: 'Wagner Heat Gun Dual Temperature', description: 'Great for stripping paint, shrinking tubing, and thawing frozen pipes.', category: 'Painting', userIndex: 9 },
  { title: 'Drywall T-Square & Utility Knife Set', description: '48-inch aluminum drywall T-square with snap-off utility knives.', category: 'Hand Tools', userIndex: 9 },
  { title: 'Porter-Cable Random Orbit Sander', description: '5-inch random orbit palm sander with dust bag and assortment of sandpaper disks.', category: 'Power Tools', userIndex: 10 },
  { title: 'Wood Lathe 12-Inch Swing', description: 'Benchtop woodturning lathe for bowls, pen turning, and spindles.', category: 'Power Tools', userIndex: 10 },
  { title: 'Bostitch Pancake Air Compressor & Brad Nailer', description: '6-gallon 150 PSI air compressor with 18-gauge brad nailer kit.', category: 'Power Tools', userIndex: 11 },
  { title: 'Tile Saw Wet Cutter 7-Inch', description: 'Tabletop wet tile saw for ceramic, porcelain, and stone tiles.', category: 'Power Tools', userIndex: 11 },
  { title: 'Stanley Hand Plane #4', description: 'Classic cast iron bench hand plane for smoothing and squaring wood boards.', category: 'Hand Tools', userIndex: 12 },
  { title: 'Park Tool Bike Repair Stand', description: 'Professional folding bicycle work stand with clamping arm.', category: 'Hand Tools', userIndex: 13 },
  { title: 'Chain Whip & Cassette Lockring Tool', description: 'Bike drivetrain maintenance tools for replacing rear cassettes.', category: 'Hand Tools', userIndex: 13 },
  { title: 'RIDGID Heavy-Duty Pipe Wrench Set', description: 'Includes 12-inch, 14-inch, and 18-inch cast iron pipe wrenches.', category: 'Hand Tools', userIndex: 14 },
  { title: 'Singer Heavy Duty Sewing Machine', description: 'Handles denim, canvas, and leather easily. Includes assorted presser feet.', category: 'Electronics & Crafts', userIndex: 15 },
  { title: 'Sawyer Water Filter & Camping Gear Set', description: 'Squeeze water filtration system and folding camping shovel.', category: 'Gardening', userIndex: 16 },
  { title: 'Werner 8-Foot Fiberglass Stepladder', description: 'Type IA 300 lb duty rating fiberglass ladder for electrical and high work.', category: 'Ladders & Scaffolding', userIndex: 17 },
  { title: 'Generac 3300W Portable Generator', description: 'Gas-powered generator with low oil shutoff. Great backup power source.', category: 'Power Tools', userIndex: 18 },
  { title: '3D Printer Creality Ender 3 V2', description: 'FDM 3D printer with glass bed. Pre-tuned and ready for PLA printing.', category: 'Electronics & Crafts', userIndex: 19 },
  { title: 'Earthworm Compost Bin & Aerator Tool', description: 'Tiered worm composting bin for household organic waste processing.', category: 'Gardening', userIndex: 20 },
  { title: 'Engine Hoist 2-Ton Folding Cherry Picker', description: 'Hydraulic engine crane for pulling car engines and heavy machinery.', category: 'Heavy Equipment', userIndex: 21 },
  { title: 'Stihl Chainsaw 18-Inch Gas Powered', description: 'Powerful chainsaw for tree trimming, firewood cutting, and limb clearing.', category: 'Power Tools', userIndex: 22 },
  { title: 'Tractor 3-Point Hitch Rotary Tiller Attachment', description: 'Heavy duty soil tiller for garden bed prep.', category: 'Heavy Equipment', userIndex: 23 },
  { title: 'Janome Computerized Embroidery Machine', description: 'Includes 100 built-in embroidery designs and USB import capability.', category: 'Electronics & Crafts', userIndex: 24 }
];

async function main() {
  console.log('🌱 Starting Neighborly database seed...');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // 1. Clean existing seed data (optional: preserve manual users if needed, or clear listings/users)
  console.log('🧹 Cleaning existing listings and users...');
  await prisma.review.deleteMany();
  await prisma.request.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  // 2. Insert 25 Fake Users with PostGIS geography point locations
  console.log('👥 Inserting 25 San Francisco Bay Area seed users...');
  const createdUserIds = [];

  for (const userData of SEED_USERS) {
    const result = await prisma.$queryRaw`
      INSERT INTO "users" (id, email, password, name, bio, approx_location, created_at, avg_rating)
      VALUES (
        gen_random_uuid()::text,
        ${userData.email},
        ${hashedPassword},
        ${userData.name},
        ${userData.bio},
        ST_SetSRID(ST_MakePoint(${userData.lng}, ${userData.lat}), 4326)::geography,
        NOW(),
        ${Math.round((3.8 + Math.random() * 1.2) * 10) / 10}
      )
      RETURNING id;
    `;
    createdUserIds.push(result[0].id);
  }

  console.log(`✅ Created ${createdUserIds.length} users with PostGIS geography locations.`);

  // 3. Insert 38 Tool Listings
  console.log('🛠️ Inserting 38 tool listings...');
  let listingCount = 0;

  for (const listingData of SEED_LISTINGS) {
    const ownerId = createdUserIds[listingData.userIndex % createdUserIds.length];

    await prisma.listing.create({
      data: {
        ownerId,
        type: 'TOOL',
        title: listingData.title,
        description: listingData.description,
        category: listingData.category,
        isActive: true
      }
    });
    listingCount++;
  }

  console.log(`✅ Created ${listingCount} tool listings.`);
  console.log('\n🎉 Neighborly database seed completed successfully!');
  console.log(`💡 All seed users created with default password: "${DEFAULT_PASSWORD}"`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
