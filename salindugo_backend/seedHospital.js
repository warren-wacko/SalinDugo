// seed.js – LARGE STATIC SEED, NO FAKER, NO RUNTIME RANDOMNESS
import dotenv from "dotenv";
dotenv.config();
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

// Blood types
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ============================
// BLOOD CENTERS (10)
// ============================
const BLOOD_CENTERS = [
  {
    name: "Metro Manila Blood Center",
    email: "metromanila@bloodcenter.org",
    password: "Center123!",
    region: "NCR",
    city: "Quezon City",
    barangay: "Bgy. Central",
    address: "123 QC Ave., Quezon City",
    latitude: 14.65,
    longitude: 121.03,
  },
  {
    name: "Luzon Regional Blood Bank",
    email: "luzonregional@bloodbank.org",
    password: "Center123!",
    region: "NCR",
    city: "Manila",
    barangay: "Sampaloc",
    address: "45 Sampaloc St., Manila",
    latitude: 14.6091,
    longitude: 120.9914,
  },
  {
    name: "South Luzon LifeBlood Center",
    email: "southluzon@lifeblood.org",
    password: "Center123!",
    region: "Region IV-A",
    city: "Calamba",
    barangay: "Real",
    address: "88 Calamba Road, Calamba",
    latitude: 14.217,
    longitude: 121.1653,
  },
  {
    name: "North Luzon Blood Services",
    email: "northluzon@bloodservices.org",
    password: "Center123!",
    region: "Region I",
    city: "Dagupan",
    barangay: "Poblacion",
    address: "12 Perez Blvd., Dagupan",
    latitude: 16.043,
    longitude: 120.333,
  },
  {
    name: "Visayas Blood Service Center",
    email: "visayas@bloodcenter.org",
    password: "Center123!",
    region: "Region VII",
    city: "Cebu City",
    barangay: "Lahug",
    address: "55 Mango Ave., Cebu City",
    latitude: 10.3157,
    longitude: 123.8854,
  },
  {
    name: "Western Visayas Blood Bank",
    email: "westvisayas@bloodbank.org",
    password: "Center123!",
    region: "Region VI",
    city: "Iloilo City",
    barangay: "Jaro",
    address: "27 Delgado St., Iloilo City",
    latitude: 10.7202,
    longitude: 122.5621,
  },
  {
    name: "Eastern Visayas Lifeline Center",
    email: "eastvisayas@lifeline.org",
    password: "Center123!",
    region: "Region VIII",
    city: "Tacloban",
    barangay: "Sagkahan",
    address: "18 Real St., Tacloban",
    latitude: 11.2433,
    longitude: 125.0047,
  },
  {
    name: "Mindanao Lifesave Blood Center",
    email: "mindanao@bloodcenter.org",
    password: "Center123!",
    region: "Region XI",
    city: "Davao City",
    barangay: "Buhangin",
    address: "102 Roxas Ave., Davao City",
    latitude: 7.1907,
    longitude: 125.4553,
  },
  {
    name: "Northern Mindanao Blood Center",
    email: "northmindanao@bloodcenter.org",
    password: "Center123!",
    region: "Region X",
    city: "Cagayan de Oro",
    barangay: "Lapasan",
    address: "71 Apolinar Velez St., Cagayan de Oro",
    latitude: 8.4542,
    longitude: 124.6319,
  },
  {
    name: "Zamboanga Peninsula Blood Bank",
    email: "zamboanga@bloodbank.org",
    password: "Center123!",
    region: "Region IX",
    city: "Zamboanga City",
    barangay: "Tetuan",
    address: "33 Veterans Ave., Zamboanga City",
    latitude: 6.9214,
    longitude: 122.079,
  },
];

// ============================
// DONORS (20)
// ============================
const DONORS = [
  {
    name: "Juan Dela Cruz",
    email: "juan@example.com",
    blood: "O+",
    gender: "Male",
    age: 28,
    address: "45 Mabini St.",
    region: "NCR",
    city: "Manila",
    barangay: "Ermita",
    latitude: 14.586,
    longitude: 120.9842,
  },
  {
    name: "Maria Santos",
    email: "maria@example.com",
    blood: "A+",
    gender: "Female",
    age: 32,
    address: "12 Katipunan Ave.",
    region: "NCR",
    city: "Quezon City",
    barangay: "Loyola Heights",
    latitude: 14.6395,
    longitude: 121.0747,
  },
  {
    name: "Pedro Reyes",
    email: "pedro@example.com",
    blood: "B-",
    gender: "Male",
    age: 41,
    address: "88 Bonifacio St.",
    region: "NCR",
    city: "Pasig",
    barangay: "Kapitolyo",
    latitude: 14.5737,
    longitude: 121.0639,
  },
  {
    name: "Ana Mendoza",
    email: "ana@example.com",
    blood: "AB+",
    gender: "Female",
    age: 25,
    address: "19 M.H. Del Pilar St.",
    region: "NCR",
    city: "Manila",
    barangay: "Malate",
    latitude: 14.5699,
    longitude: 120.9844,
  },
  {
    name: "Luis Garcia",
    email: "luis@example.com",
    blood: "O-",
    gender: "Male",
    age: 30,
    address: "78 Mabuhay St.",
    region: "NCR",
    city: "Makati",
    barangay: "Poblacion",
    latitude: 14.5613,
    longitude: 121.0309,
  },
  {
    name: "Carla Ramos",
    email: "carla@example.com",
    blood: "A-",
    gender: "Female",
    age: 27,
    address: "23 Pineapple St.",
    region: "NCR",
    city: "Quezon City",
    barangay: "Tandang Sora",
    latitude: 14.693,
    longitude: 121.0492,
  },
  {
    name: "Mark Antonio",
    email: "mark@example.com",
    blood: "B+",
    gender: "Male",
    age: 35,
    address: "94 Laurel St.",
    region: "NCR",
    city: "Taguig",
    barangay: "Bagumbayan",
    latitude: 14.5355,
    longitude: 121.0561,
  },
  {
    name: "Julia Torres",
    email: "julia@example.com",
    blood: "AB-",
    gender: "Female",
    age: 29,
    address: "11 Santolan Rd.",
    region: "NCR",
    city: "San Juan",
    barangay: "Greenhills",
    latitude: 14.602,
    longitude: 121.0341,
  },
  {
    name: "Rico Bautista",
    email: "rico@example.com",
    blood: "O+",
    gender: "Male",
    age: 33,
    address: "63 C. Raymundo Ave.",
    region: "NCR",
    city: "Pasig",
    barangay: "Maybunga",
    latitude: 14.5764,
    longitude: 121.0855,
  },
  {
    name: "Ella Navarro",
    email: "ella@example.com",
    blood: "A+",
    gender: "Female",
    age: 26,
    address: "132 Legarda St.",
    region: "NCR",
    city: "Manila",
    barangay: "Sampaloc",
    latitude: 14.6057,
    longitude: 120.9896,
  },
  {
    name: "Francis Cruz",
    email: "francis@example.com",
    blood: "B-",
    gender: "Male",
    age: 40,
    address: "21 F. Blumentritt St.",
    region: "NCR",
    city: "Manila",
    barangay: "Sta. Cruz",
    latitude: 14.62,
    longitude: 120.9869,
  },
  {
    name: "Nicole Reyes",
    email: "nicole@example.com",
    blood: "AB+",
    gender: "Female",
    age: 22,
    address: "77 Lantana St.",
    region: "NCR",
    city: "Quezon City",
    barangay: "Cubao",
    latitude: 14.6203,
    longitude: 121.0514,
  },
  {
    name: "Gabriel Flores",
    email: "gabriel@example.com",
    blood: "O-",
    gender: "Male",
    age: 38,
    address: "54 Ayala Ave.",
    region: "NCR",
    city: "Makati",
    barangay: "San Lorenzo",
    latitude: 14.5535,
    longitude: 121.0234,
  },
  {
    name: "Sofia Aguilar",
    email: "sofia@example.com",
    blood: "A-",
    gender: "Female",
    age: 24,
    address: "84 Mindanao Ave.",
    region: "NCR",
    city: "Quezon City",
    barangay: "Project 6",
    latitude: 14.6815,
    longitude: 121.0307,
  },
  {
    name: "Jorge Salazar",
    email: "jorge@example.com",
    blood: "B+",
    gender: "Male",
    age: 36,
    address: "25 Marcos Hwy.",
    region: "NCR",
    city: "Marikina",
    barangay: "Sto. Niño",
    latitude: 14.6336,
    longitude: 121.0998,
  },
  {
    name: "Lea Vergara",
    email: "lea@example.com",
    blood: "AB-",
    gender: "Female",
    age: 31,
    address: "129 Ortigas Ave.",
    region: "NCR",
    city: "Pasig",
    barangay: "Ortigas Center",
    latitude: 14.5832,
    longitude: 121.0625,
  },
  {
    name: "Adrian Ortega",
    email: "adrian@example.com",
    blood: "O+",
    gender: "Male",
    age: 28,
    address: "09 Barangka St.",
    region: "NCR",
    city: "Mandaluyong",
    barangay: "Barangka Ilaya",
    latitude: 14.5761,
    longitude: 121.0409,
  },
  {
    name: "Tina Velasco",
    email: "tina@example.com",
    blood: "A+",
    gender: "Female",
    age: 34,
    address: "66 España Blvd.",
    region: "NCR",
    city: "Manila",
    barangay: "Sampaloc",
    latitude: 14.6064,
    longitude: 120.9901,
  },
  {
    name: "Kevin Lim",
    email: "kevin@example.com",
    blood: "B-",
    gender: "Male",
    age: 23,
    address: "17 Annapolis St.",
    region: "NCR",
    city: "San Juan",
    barangay: "Little Baguio",
    latitude: 14.6018,
    longitude: 121.045,
  },
  {
    name: "Hannah Diaz",
    email: "hannah@example.com",
    blood: "AB+",
    gender: "Female",
    age: 27,
    address: "45 V. Luna Ext.",
    region: "NCR",
    city: "Quezon City",
    barangay: "Sikatuna Village",
    latitude: 14.6339,
    longitude: 121.0433,
  },
];

// ============================
// SEED FUNCTION
// ============================
const seed = async () => {
  const client = await pool.connect();
  const passwordHash = await bcrypt.hash("Password123!", 10);

  try {
    console.log("🌟 Starting SEED...");
    await client.query("BEGIN");

    // ------------------------
    // 1. INSERT BLOOD CENTERS (HOSPITAL USERS)
    // ------------------------
    const hospitals = [];
    for (let i = 0; i < BLOOD_CENTERS.length; i++) {
      const h = BLOOD_CENTERS[i];
      const hashed = await bcrypt.hash(h.password, 10);

      const res = await client.query(
        `INSERT INTO users (
          full_name,
          email,
          password_hash,
          role,
          region,
          city,
          barangay,
          address,
          latitude,
          longitude,
          gender,
          age
        )
        VALUES ($1,$2,$3,'hospital',$4,$5,$6,$7,$8,$9,'Male',35)
        RETURNING user_id`,
        [
          h.name,
          h.email,
          hashed,
          h.region,
          h.city,
          h.barangay,
          h.address,
          h.latitude,
          h.longitude,
        ]
      );

      hospitals.push(res.rows[0].user_id);
    }

    console.log("✔ Inserted Blood Centers =", hospitals.length);

    // ------------------------
    // 2. INSERT DONORS (USER ROLE)
    // ------------------------
    const donors = [];
    for (let d of DONORS) {
      const res = await client.query(
        `INSERT INTO users (
          full_name,
          email,
          password_hash,
          role,
          blood_type,
          gender,
          age,
          region,
          city,
          barangay,
          address,
          latitude,
          longitude
        )
        VALUES ($1,$2,$3,'user',$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING user_id`,
        [
          d.name,
          d.email,
          passwordHash, // same password for all donors
          d.blood,
          d.gender,
          d.age,
          d.region,
          d.city,
          d.barangay,
          d.address,
          d.latitude,
          d.longitude,
        ]
      );
      donors.push(res.rows[0].user_id);
    }

    console.log("✔ Inserted Donors =", donors.length);

    // ------------------------
    // 3. BASELINE BLOOD STOCKS (DETERMINISTIC RANDOM <15)
    // ------------------------
    // key: `${hospitalId}-${bloodType}` -> { stockId, units }
    const stockMap = new Map();
    const baselineDate = new Date().toISOString();

    for (let hi = 0; hi < hospitals.length; hi++) {
      const hospitalId = hospitals[hi];

      for (let bi = 0; bi < BLOOD_TYPES.length; bi++) {
        const bt = BLOOD_TYPES[bi];

        // deterministic pseudo-random 2..14
        const units = ((hi + 1 + (bi + 1) * 7) % 13) + 2; // always 2..14, reproducible

        const res = await client.query(
          `INSERT INTO blood_stocks (hospital_id, blood_type, units_available, last_updated)
           VALUES ($1,$2,$3,$4)
           RETURNING stock_id`,
          [hospitalId, bt, units, baselineDate]
        );

        stockMap.set(`${hospitalId}-${bt}`, {
          stockId: res.rows[0].stock_id,
          units,
        });
      }
    }

    console.log("✔ Inserted baseline Blood Stocks for all centers");

    // ------------------------
    // 4. DONATION SCHEDULES (SAMPLE 10)
    // ------------------------
    const SCHEDULE_EVENTS = [
      {
        donorIndex: 0,
        hospitalIndex: 0,
        date: "2024-11-03",
        time: "09:00",
        bloodType: "O+",
        status: "completed",
      },
      {
        donorIndex: 1,
        hospitalIndex: 1,
        date: "2024-11-06",
        time: "14:00",
        bloodType: "A+",
        status: "completed",
      },
      {
        donorIndex: 2,
        hospitalIndex: 2,
        date: "2024-11-09",
        time: "09:00",
        bloodType: "B-",
        status: "completed",
      },
      {
        donorIndex: 3,
        hospitalIndex: 3,
        date: "2024-11-14",
        time: "10:00",
        bloodType: "AB+",
        status: "completed",
      },
      {
        donorIndex: 4,
        hospitalIndex: 4,
        date: "2024-11-19",
        time: "13:30",
        bloodType: "O-",
        status: "completed",
      },
      {
        donorIndex: 5,
        hospitalIndex: 5,
        date: "2024-12-01",
        time: "09:30",
        bloodType: "A-",
        status: "approved",
      },
      {
        donorIndex: 6,
        hospitalIndex: 6,
        date: "2024-12-04",
        time: "14:30",
        bloodType: "B+",
        status: "approved",
      },
      {
        donorIndex: 7,
        hospitalIndex: 7,
        date: "2024-12-09",
        time: "09:00",
        bloodType: "AB-",
        status: "pending",
      },
      {
        donorIndex: 8,
        hospitalIndex: 8,
        date: "2024-12-14",
        time: "10:30",
        bloodType: "O+",
        status: "pending",
      },
      {
        donorIndex: 9,
        hospitalIndex: 9,
        date: "2024-12-19",
        time: "15:00",
        bloodType: "A+",
        status: "pending",
      },
    ];

    for (const s of SCHEDULE_EVENTS) {
      await client.query(
        `INSERT INTO donation_schedules (
          donor_id,
          hospital_id,
          scheduled_date,
          scheduled_time,
          blood_type,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          donors[s.donorIndex],
          hospitals[s.hospitalIndex],
          s.date,
          s.time,
          s.bloodType,
          s.status,
        ]
      );
    }

    console.log("✔ Inserted Donation Schedules =", SCHEDULE_EVENTS.length);

    // ------------------------
    // 5. DONATIONS + BLOOD BAGS + INVENTORY (DONATION SIDE)
    // ------------------------
    const DONATION_EVENTS = [
      // NOVEMBER 2024
      {
        donorIndex: 0,
        hospitalIndex: 0,
        bloodType: "O+",
        date: "2024-11-05",
        units: 1,
        type: "whole_blood",
      },
      {
        donorIndex: 1,
        hospitalIndex: 1,
        bloodType: "A+",
        date: "2024-11-07",
        units: 1,
        type: "whole_blood",
      },
      {
        donorIndex: 2,
        hospitalIndex: 2,
        bloodType: "B-",
        date: "2024-11-10",
        units: 2,
        type: "double_red_cells",
      },
      {
        donorIndex: 3,
        hospitalIndex: 3,
        bloodType: "AB+",
        date: "2024-11-15",
        units: 1,
        type: "plasma",
      },
      {
        donorIndex: 4,
        hospitalIndex: 4,
        bloodType: "O-",
        date: "2024-11-20",
        units: 1,
        type: "whole_blood",
      },
      // DECEMBER 2024
      {
        donorIndex: 5,
        hospitalIndex: 5,
        bloodType: "A-",
        date: "2024-12-02",
        units: 1,
        type: "whole_blood",
      },
      {
        donorIndex: 6,
        hospitalIndex: 6,
        bloodType: "B+",
        date: "2024-12-05",
        units: 2,
        type: "whole_blood",
      },
      {
        donorIndex: 7,
        hospitalIndex: 7,
        bloodType: "AB-",
        date: "2024-12-10",
        units: 1,
        type: "platelets",
      },
      {
        donorIndex: 8,
        hospitalIndex: 8,
        bloodType: "O+",
        date: "2024-12-15",
        units: 1,
        type: "whole_blood",
      },
      {
        donorIndex: 9,
        hospitalIndex: 9,
        bloodType: "A+",
        date: "2024-12-20",
        units: 1,
        type: "plasma",
      },
      // JANUARY 2025
      {
        donorIndex: 10,
        hospitalIndex: 0,
        bloodType: "B-",
        date: "2025-01-05",
        units: 1,
        type: "whole_blood",
      },
      {
        donorIndex: 11,
        hospitalIndex: 1,
        bloodType: "AB+",
        date: "2025-01-08",
        units: 2,
        type: "platelets",
      },
      {
        donorIndex: 12,
        hospitalIndex: 2,
        bloodType: "O-",
        date: "2025-01-12",
        units: 1,
        type: "whole_blood",
      },
      {
        donorIndex: 13,
        hospitalIndex: 3,
        bloodType: "A-",
        date: "2025-01-18",
        units: 1,
        type: "whole_blood",
      },
      {
        donorIndex: 14,
        hospitalIndex: 4,
        bloodType: "B+",
        date: "2025-01-22",
        units: 2,
        type: "double_red_cells",
      },
      // FEBRUARY 2025
      {
        donorIndex: 15,
        hospitalIndex: 5,
        bloodType: "AB-",
        date: "2025-02-01",
        units: 1,
        type: "whole_blood",
      },
      {
        donorIndex: 16,
        hospitalIndex: 6,
        bloodType: "O+",
        date: "2025-02-03",
        units: 1,
        type: "whole_blood",
      },
      {
        donorIndex: 17,
        hospitalIndex: 7,
        bloodType: "A+",
        date: "2025-02-08",
        units: 1,
        type: "plasma",
      },
      {
        donorIndex: 18,
        hospitalIndex: 8,
        bloodType: "B-",
        date: "2025-02-15",
        units: 1,
        type: "whole_blood",
      },
      {
        donorIndex: 19,
        hospitalIndex: 9,
        bloodType: "AB+",
        date: "2025-02-20",
        units: 2,
        type: "platelets",
      },
    ];

    const availableBagsMap = new Map(); // key: `${hospitalId}-${bloodType}` -> [bagId, ...]
    let totalBagsInserted = 0;

    for (const evt of DONATION_EVENTS) {
      const donorId = donors[evt.donorIndex];
      const hospitalId = hospitals[evt.hospitalIndex];
      const stockKey = `${hospitalId}-${evt.bloodType}`;
      const stockInfo = stockMap.get(stockKey);

      if (!stockInfo) {
        console.warn("No stock row for", stockKey, "when inserting donation");
        continue;
      }

      // Insert donation
      const donationRes = await client.query(
        `INSERT INTO donations (
          donor_id,
          hospital_id,
          blood_type,
          donation_type,
          donation_date,
          status,
          units
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING donation_id`,
        [
          donorId,
          hospitalId,
          evt.bloodType,
          evt.type,
          evt.date,
          "completed",
          evt.units,
        ]
      );

      const donationId = donationRes.rows[0].donation_id;

      // Create 1 bag per unit
      const eventBags = [];
      for (let i = 0; i < evt.units; i++) {
        const bagRes = await client.query(
          `INSERT INTO blood_bags (
            donation_id,
            hospital_id,
            blood_type,
            status,
            created_at,
            updated_at
          )
          VALUES ($1,$2,$3,'available',$4,$4)
          RETURNING bag_id`,
          [donationId, hospitalId, evt.bloodType, `${evt.date}T09:00:00+08`]
        );

        const bagId = bagRes.rows[0].bag_id;
        eventBags.push(bagId);
        totalBagsInserted++;

        const availKey = `${hospitalId}-${evt.bloodType}`;
        if (!availableBagsMap.has(availKey)) {
          availableBagsMap.set(availKey, []);
        }
        availableBagsMap.get(availKey).push(bagId);
      }

      // Update stock units
      const newUnits = stockInfo.units + evt.units;
      stockInfo.units = newUnits;
      stockMap.set(stockKey, stockInfo);

      await client.query(
        `UPDATE blood_stocks
         SET units_available = $1,
             last_updated    = $2
         WHERE stock_id = $3`,
        [newUnits, `${evt.date}T10:00:00+08`, stockInfo.stockId]
      );

      // Inventory history – donation event (use first bag for reference)
      const firstBagId = eventBags[0] ?? null;

      await client.query(
        `INSERT INTO inventory_history (
          hospital_id,
          blood_type,
          change,
          units_after,
          reason,
          changed_by,
          changed_at,
          donor_id,
          recipient_id,
          stock_id,
          bag_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          hospitalId,
          evt.bloodType,
          evt.units,
          newUnits,
          `Donation received (${evt.type})`,
          hospitalId, // changed_by = hospital (staff)
          `${evt.date}T10:05:00+08`,
          donorId,
          null,
          stockInfo.stockId,
          firstBagId,
        ]
      );
    }

    console.log("✔ Inserted Donations =", DONATION_EVENTS.length);
    console.log("✔ Inserted Blood Bags =", totalBagsInserted);

    // ------------------------
    // 6. REQUESTS + INVENTORY (REQUEST SIDE, FULLY REALISTIC)
    // ------------------------
    const REQUEST_EVENTS = [
      {
        requesterIndex: 0,
        hospitalIndex: 0,
        bloodType: "O+",
        units: 1,
        urgency: "emergency",
        status: "fulfilled",
        date: "2024-12-01T08:30:00+08",
      },
      {
        requesterIndex: 1,
        hospitalIndex: 1,
        bloodType: "A+",
        units: 1,
        urgency: "routine",
        status: "open",
        date: "2024-12-03T09:15:00+08",
      },
      {
        requesterIndex: 2,
        hospitalIndex: 2,
        bloodType: "B-",
        units: 1,
        urgency: "emergency",
        status: "fulfilled",
        date: "2024-12-12T11:00:00+08",
      },
      {
        requesterIndex: 3,
        hospitalIndex: 3,
        bloodType: "AB+",
        units: 2,
        urgency: "emergency",
        status: "matched",
        date: "2025-01-05T14:00:00+08",
      },
      {
        requesterIndex: 4,
        hospitalIndex: 4,
        bloodType: "O-",
        units: 1,
        urgency: "routine",
        status: "cancelled",
        date: "2025-01-10T10:00:00+08",
      },
      {
        requesterIndex: 5,
        hospitalIndex: 5,
        bloodType: "A-",
        units: 1,
        urgency: "routine",
        status: "fulfilled",
        date: "2025-01-20T09:45:00+08",
      },
      {
        requesterIndex: 6,
        hospitalIndex: 6,
        bloodType: "B+",
        units: 2,
        urgency: "emergency",
        status: "fulfilled",
        date: "2025-02-05T13:20:00+08",
      },
      {
        requesterIndex: 7,
        hospitalIndex: 7,
        bloodType: "AB-",
        units: 1,
        urgency: "routine",
        status: "open",
        date: "2025-02-12T15:30:00+08",
      },
    ];

    let fulfilledCount = 0;
    let matchedCount = 0;
    let openCount = 0;
    let cancelledCount = 0;

    for (const req of REQUEST_EVENTS) {
      const requesterId = donors[req.requesterIndex];
      const hospitalId = hospitals[req.hospitalIndex];

      // Insert request with initial status
      const reqRes = await client.query(
        `INSERT INTO requests (
          requester_id,
          hospital_id,
          blood_type,
          urgency_level,
          units_needed,
          request_date,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING request_id`,
        [
          requesterId,
          hospitalId,
          req.bloodType,
          req.urgency,
          req.units,
          req.date,
          req.status,
        ]
      );

      const requestId = reqRes.rows[0].request_id;

      // Keep counters
      if (req.status === "open") openCount++;
      if (req.status === "cancelled") cancelledCount++;

      // If request is "fulfilled", try to actually fulfill it
      if (req.status === "fulfilled") {
        const stockKey = `${hospitalId}-${req.bloodType}`;
        const stockInfo = stockMap.get(stockKey);
        const availKey = `${hospitalId}-${req.bloodType}`;
        const bagList = availableBagsMap.get(availKey) || [];

        if (!stockInfo || stockInfo.units <= 0 || bagList.length === 0) {
          // Not enough stock to realistically fulfill -> downgrade to "open"
          await client.query(
            `UPDATE requests SET status = 'open' WHERE request_id = $1`,
            [requestId]
          );
          openCount++;
          continue;
        }

        // Use up to req.units bags, but not more than we have
        const unitsBefore = stockInfo.units;
        let unitsUsed = Math.min(req.units, unitsBefore, bagList.length);

        const usedBagIds = [];
        for (let i = 0; i < unitsUsed; i++) {
          const bagIdUsed = bagList.shift();
          if (!bagIdUsed) break;

          usedBagIds.push(bagIdUsed);
          await client.query(
            `UPDATE blood_bags
             SET status = 'used',
                 updated_at = $2
             WHERE bag_id = $1`,
            [bagIdUsed, req.date]
          );
        }

        // If nothing actually used, then treat as open
        if (usedBagIds.length === 0) {
          await client.query(
            `UPDATE requests SET status = 'open' WHERE request_id = $1`,
            [requestId]
          );
          openCount++;
          continue;
        }

        unitsUsed = usedBagIds.length;
        const newUnits = unitsBefore - unitsUsed;

        stockInfo.units = newUnits;
        stockMap.set(stockKey, stockInfo);

        await client.query(
          `UPDATE blood_stocks
           SET units_available = $1,
               last_updated    = $2
           WHERE stock_id = $3`,
          [newUnits, req.date, stockInfo.stockId]
        );

        // Inventory history for fulfillment (link first bag + recipient)
        await client.query(
          `INSERT INTO inventory_history (
            hospital_id,
            blood_type,
            change,
            units_after,
            reason,
            changed_by,
            changed_at,
            donor_id,
            recipient_id,
            stock_id,
            bag_id
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            hospitalId,
            req.bloodType,
            -unitsUsed,
            newUnits,
            `Request fulfilled (request_id=${requestId}, units=${unitsUsed})`,
            hospitalId,
            req.date,
            null,
            requesterId,
            stockInfo.stockId,
            usedBagIds[0], // reference one used bag
          ]
        );

        fulfilledCount++;
      }

      // "matched" requests: log a non-quantity inventory marker
      if (req.status === "matched") {
        const stockKey = `${hospitalId}-${req.bloodType}`;
        const stockInfo = stockMap.get(stockKey);

        await client.query(
          `INSERT INTO inventory_history (
            hospital_id,
            blood_type,
            change,
            units_after,
            reason,
            changed_by,
            changed_at,
            donor_id,
            recipient_id,
            stock_id,
            bag_id
          )
          VALUES ($1,$2,0,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            hospitalId,
            req.bloodType,
            stockInfo ? stockInfo.units : null,
            `Request matched (reserved ${req.units} unit/s, not yet released)`,
            hospitalId,
            req.date,
            null,
            requesterId,
            stockInfo ? stockInfo.stockId : null,
            null,
          ]
        );

        matchedCount++;
      }
    }

    console.log("✔ Inserted Requests =", REQUEST_EVENTS.length);
    console.log(
      `   ↳ fulfilled=${fulfilledCount}, matched=${matchedCount}, open=${openCount}, cancelled=${cancelledCount}`
    );

    // ------------------------
    // 7. EXTRA INVENTORY EVENTS (EXPIRED / ADJUSTMENTS)
    // ------------------------
    const EXTRA_EVENTS = [
      {
        hospitalIndex: 0,
        bloodType: "O+",
        change: -1,
        reason: "Unit expired (O+)",
        date: "2025-02-25T09:00:00+08",
      },
      {
        hospitalIndex: 3,
        bloodType: "AB+",
        change: -1,
        reason: "Unit discarded due to testing",
        date: "2025-02-26T10:30:00+08",
      },
      {
        hospitalIndex: 5,
        bloodType: "A-",
        change: +1,
        reason: "Stock adjustment after recount",
        date: "2025-02-27T11:15:00+08",
      },
    ];

    for (const ev of EXTRA_EVENTS) {
      const hospitalId = hospitals[ev.hospitalIndex];
      const stockKey = `${hospitalId}-${ev.bloodType}`;
      const stockInfo = stockMap.get(stockKey);

      if (!stockInfo) continue;

      let newUnits = stockInfo.units + ev.change;
      if (newUnits < 0) newUnits = 0; // enforce non-negative

      stockInfo.units = newUnits;
      stockMap.set(stockKey, stockInfo);

      await client.query(
        `UPDATE blood_stocks
         SET units_available = $1,
             last_updated    = $2
         WHERE stock_id = $3`,
        [newUnits, ev.date, stockInfo.stockId]
      );

      await client.query(
        `INSERT INTO inventory_history (
          hospital_id,
          blood_type,
          change,
          units_after,
          reason,
          changed_by,
          changed_at,
          donor_id,
          recipient_id,
          stock_id,
          bag_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          hospitalId,
          ev.bloodType,
          ev.change,
          newUnits,
          ev.reason,
          hospitalId,
          ev.date,
          null,
          null,
          stockInfo.stockId,
          null,
        ]
      );
    }

    console.log("✔ Inserted extra inventory events =", EXTRA_EVENTS.length);

    await client.query("COMMIT");
    console.log("🎉 DONE! Seed completed successfully!");
  } catch (err) {
    console.error("❌ Seeding error:", err);
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Error during ROLLBACK:", rollbackErr);
    }
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
