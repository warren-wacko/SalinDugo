import bcrypt from "bcrypt";
import pool from "./db.js";

const seedMockData = async () => {
  try {
    console.log("🔄 Resetting tables...");
    await pool.query(`
      TRUNCATE TABLE notifications, inventory_history, donations, requests, blood_stocks, users 
      RESTART IDENTITY CASCADE;
    `);

    const hashedPassword = await bcrypt.hash("password123", 10);

    console.log("🏥 Inserting hospitals...");
    const hospitals = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, gender, date_of_birth, latitude, longitude)
       VALUES 
       ('Philippine General Hospital', 'pgh.manila@gmail.com', $1, 'hospital', 'Male', '2000-01-01', 14.5734, 120.9930),
       ('Cebu Doctors Hospital', 'cebu.docs@gmail.com', $1, 'hospital', 'Male', '2000-01-01', 10.3100, 123.8910),
       ('Southern Philippines Medical Center', 'spmc@gmail.com', $1, 'hospital', 'Male', '2000-01-01', 7.0731, 125.6131),
       ('Red Cross Dumaguete', 'rc.dgte@gmail.com', $1, 'hospital', 'Male', '2000-01-01', 9.3070, 123.3054)
       RETURNING user_id`,
      [hashedPassword]
    );

    const [PGH, CEBU, DAVAO, DUMAG] = hospitals.rows.map((h) => h.user_id);

    console.log("🩸 Inserting donors...");
    const donors = await pool.query(
      `INSERT INTO users (
    full_name, email, password_hash, role, gender, blood_type, date_of_birth, 
    address, city, region, province, zip_code,
    latitude, longitude
  ) VALUES
    ('Ana Reyes', 'ana.reyes@gmail.com', $1, 'user', 'Female', 'AB+', '1998-11-12',
     'Sampaloc, Manila', 'Manila', 'NCR', 'Metro Manila', '1008', 14.5743, 120.9951),

    ('Mark Rivera', 'mark.riv@gmail.com', $1, 'user', 'Male', 'A+', '1996-09-22',
     'Capitol Site', 'Cebu City', 'Region VII', 'Cebu', '6000', 10.3098, 123.8900),

    ('Jenny Uy', 'jenny.uy@gmail.com', $1, 'user', 'Female', 'AB+', '1999-02-18',
     'Buhangin', 'Davao City', 'Region XI', 'Davao del Sur', '8000', 7.0721, 125.6142),

    ('Juan Dela Cruz', 'juan.dgte@gmail.com', $1, 'user', 'Male', 'AB+', '1997-06-30',
     'Bagacay', 'Dumaguete City', 'Region VII', 'Negros Oriental', '6200', 9.3062, 123.3060),

    ('Liza Cortez', 'liza.cortez@gmail.com', $1, 'user', 'Female', 'O+', '1995-07-14',
     'Baguio City Center', 'Baguio City', 'CAR', 'Benguet', '2600', 16.4023, 120.5960),

    ('Patrick Santos', 'patrick.s@gmail.com', $1, 'user', 'Male', 'O+', '1994-12-07',
     'Tarlac Proper', 'Tarlac City', 'Region III', 'Tarlac', '2300', 15.4880, 120.9737),

    ('Karla Mendoza', 'karla.m@gmail.com', $1, 'user', 'Female', 'AB+', '1993-10-01',
     'Borongan Center', 'Borongan City', 'Region VIII', 'Eastern Samar', '6800', 11.2400, 125.0030),

    ('Robert Lim', 'robert.lim@gmail.com', $1, 'user', 'Male', 'O+', '1990-03-18',
     'Zamboanga City Center', 'Zamboanga City', 'Region IX', 'Zamboanga del Sur', '7000', 6.9214, 122.0790),

    ('Shiela Villar', 'shiela.v@gmail.com', $1, 'user', 'Female', 'A+', '1992-04-22',
     'Malaybalay City Center', 'Malaybalay City', 'Region X', 'Bukidnon', '8700', 8.2280, 124.2452),

    ('Aaron Tan', 'aaron.tan@gmail.com', $1, 'user', 'Male', 'AB+', '1996-01-19',
     'Calamba Proper', 'Calamba City', 'Region IV-A', 'Laguna', '4027', 13.7650, 121.0600)
  RETURNING user_id`,
      [hashedPassword]
    );

    console.log("📦 Inserting blood stock...");
    await pool.query(
      `INSERT INTO blood_stocks (hospital_id, blood_type, units_available) VALUES
        (${PGH},'O+',12),(${PGH},'A+',7),(${PGH},'B+',4),(${PGH},'AB+',2),
        (${CEBU},'O+',6),(${CEBU},'A+',2),(${CEBU},'B+',1),(${CEBU},'AB+',0),
        (${DAVAO},'O+',3),(${DAVAO},'A+',1),(${DAVAO},'B+',0),(${DAVAO},'AB+',1),
        (${DUMAG},'O+',1),(${DUMAG},'A+',0),(${DUMAG},'B+',0),(${DUMAG},'AB+',0)`
    );

    console.log("🆘 Adding blood requests...");
    await pool.query(
      `INSERT INTO requests (requester_id, hospital_id, blood_type, urgency_level, units_needed, status)
       VALUES
       (${PGH},${PGH},'O+','emergency',4,'open'),
       (${CEBU},${CEBU},'A+','routine',3,'open'),
       (${DAVAO},${DAVAO},'AB+','emergency',2,'open'),
       (${DUMAG},${DUMAG},'O+','routine',2,'open')`
    );

    console.log("🩸 Adding donations...");
    await pool.query(
      `INSERT INTO donations (donor_id, hospital_id, blood_type, donation_type, donation_date, status)
       VALUES
       (5,${PGH},'O+','whole_blood','2025-01-12','completed'),
       (6,${CEBU},'A+','whole_blood','2025-02-01','completed'),
       (7,${DAVAO},'O+','whole_blood','2025-01-20','completed'),
       (8,${DUMAG},'O+','whole_blood','2025-02-10','completed'),
       (9,${PGH},'A+','whole_blood','2025-11-08','pending'),
       (10,${CEBU},'O+','whole_blood','2025-11-10','pending'),
       (11,${DAVAO},'B+','whole_blood','2025-11-15','pending'),
       (12,${DUMAG},'O+','whole_blood','2025-11-22','pending')`
    );

    console.log("📖 Creating inventory history records...");
    await pool.query(`
      INSERT INTO inventory_history (hospital_id, blood_type, change, units_after, reason, changed_by)
      SELECT d.hospital_id, d.blood_type, +1, bs.units_available + 1,
      'Donation Received', d.hospital_id
      FROM donations d
      JOIN blood_stocks bs 
        ON d.hospital_id = bs.hospital_id 
       AND d.blood_type = bs.blood_type
      WHERE d.status = 'completed';
    `);

    console.log("✅ Mock data seeding completed!");
    process.exit();
  } catch (err) {
    console.error("❌ Seeder error:", err);
    process.exit(1);
  }
};

seedMockData();
