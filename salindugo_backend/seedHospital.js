// seedHospitals.js
import bcrypt from "bcrypt";
import pool from "./db.js";

const seedHospitals = async () => {
  try {
    const hospitals = [
      {
        full_name: "Red Cross Dumaguete",
        email: "redcross@dumaguete.org",
        password: "hospital123",
        contact_number: "0354210001",
        address: "Dumaguete City, Negros Oriental",
        region: "Region VII",
        city: "Dumaguete",
        barangay: "Poblacion",
        latitude: 9.3075,
        longitude: 123.3054,
      },
      {
        full_name: "Silliman Medical Center",
        email: "silliman@hospital.org",
        password: "hospital123",
        contact_number: "0354228888",
        address: "Silliman Ave, Dumaguete City",
        region: "Region VII",
        city: "Dumaguete",
        barangay: "Bagacay",
        latitude: 9.3083,
        longitude: 123.3070,
      },
      {
        full_name: "Negros Oriental Provincial Hospital",
        email: "nophi@hospital.org",
        password: "hospital123",
        contact_number: "0352250000",
        address: "Capitol Area, Dumaguete City",
        region: "Region VII",
        city: "Dumaguete",
        barangay: "Taclobo",
        latitude: 9.3121,
        longitude: 123.3089,
      },
    ];

    for (const hospital of hospitals) {
      const hashedPassword = await bcrypt.hash(hospital.password, 10);

      await pool.query(
        `
        INSERT INTO Users 
          (full_name, email, password_hash, role, contact_number, address, region, city, barangay, latitude, longitude, is_verified)
        VALUES
          ($1, $2, $3, 'hospital', $4, $5, $6, $7, $8, $9, $10, true)
        ON CONFLICT (email) DO NOTHING;
        `,
        [
          hospital.full_name,
          hospital.email,
          hashedPassword,
          hospital.contact_number,
          hospital.address,
          hospital.region,
          hospital.city,
          hospital.barangay,
          hospital.latitude,
          hospital.longitude,
        ]
      );
    }

    console.log("✅ Hospital accounts seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding hospitals:", err);
    process.exit(1);
  }
};

seedHospitals();
