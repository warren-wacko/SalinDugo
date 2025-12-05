import cron from "node-cron";
import pool from "../db.js";

// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("⏳ Checking for expired blood bags...");

  try {
    const result = await pool.query(`
      UPDATE blood_bags
      SET status = 'expired'
      WHERE status = 'available'
      AND expiration_date <= NOW()
      RETURNING bag_id, blood_type, hospital_id;
    `);

    if (result.rowCount > 0) {
      console.log(`🧪 Expired ${result.rowCount} blood bags.`);
    }
  } catch (err) {
    console.error("❌ Error expiring blood bags:", err);
  }
});
