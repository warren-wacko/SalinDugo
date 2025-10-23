// cron/reactivateDonors.js
import cron from "node-cron";
import pool from "../db.js";

// This runs every day at midnight (00:00)
cron.schedule("0 0 * * *", async () => {
  try {
    await pool.query("SELECT reactivate_donors();");
    console.log("✅ Donor reactivation job completed at midnight");
  } catch (err) {
    console.error("❌ Donor reactivation failed:", err.message);
  }
});
