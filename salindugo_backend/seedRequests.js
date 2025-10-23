// seedRequests.js
import pool from "./db.js";

const seedRequests = async () => {
  try {
    console.log("🧹 Clearing existing requests...");
    await pool.query("DELETE FROM requests");

    console.log("🌱 Inserting mock request data...");
    await pool.query(`
      INSERT INTO requests (requester_id, hospital_id, blood_type, urgency_level, units_needed, status, request_date)
      VALUES
        (1, 2, 'O+', 'routine', 2, 'open', NOW() - INTERVAL '2 days'),
        (1, 2, 'A+', 'emergency', 3, 'open', NOW() - INTERVAL '1 day'),
        (2, 3, 'B-', 'emergency', 1, 'matched', NOW() - INTERVAL '3 days'),
        (3, 4, 'AB+', 'routine', 2, 'fulfilled', NOW() - INTERVAL '5 days'),
        (4, 3, 'O-', 'emergency', 4, 'cancelled', NOW() - INTERVAL '6 hours'),
        (2, 2, 'A-', 'routine', 1, 'open', NOW() - INTERVAL '4 hours')
    `);

    console.log("✅ Requests table seeded successfully!");
  } catch (err) {
    console.error("❌ Error seeding requests:", err);
  } finally {
    await pool.end();
  }
};

seedRequests();
