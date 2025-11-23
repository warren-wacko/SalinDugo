import pool from "../db.js";

export const checkLowStockAndNotify = async (hospital_id, blood_type) => {
  const threshold = 3; // 🩸 Low stock level

  const stockResult = await pool.query(
    `SELECT units_available FROM blood_stocks WHERE hospital_id = $1 AND blood_type = $2`,
    [hospital_id, blood_type]
  );

  if (stockResult.rows.length === 0) return; // No stock entry yet

  const currentUnits = stockResult.rows[0].units_available;

  if (currentUnits > threshold) return; // ✅ Above safe level → no alert

  // 🚫 Avoid duplicate low-stock alerts
  const recentAlert = await pool.query(
    `
    SELECT notification_id FROM notifications
    WHERE user_id = $1 AND type = 'system'
      AND message LIKE '%' || $2 || '%'
      AND created_at >= NOW() - INTERVAL '1 day'
    LIMIT 1
    `,
    [hospital_id, blood_type]
  );

  if (recentAlert.rows.length > 0) return;

  await pool.query(
    `
    INSERT INTO notifications
    (user_id, sender_id, title, message, type, related_id)
    VALUES ($1, $2, $3, $4, 'general', NULL)
    `,
    [
      hospital_id,
      hospital_id,
      "⚠ Low Blood Stock Alert",
      `Blood stock for ${blood_type} is critically low (${currentUnits} unit/s remaining).`,
    ]
  );
};
