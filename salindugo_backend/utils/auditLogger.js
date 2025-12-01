import pool from "../db.js";

export async function logAudit(
  userId,
  action,
  actionType = null,
  details = {}
) {
  try {
    await pool.query(
      `
      INSERT INTO audit_logs (user_id, action, action_type, details)
      VALUES ($1, $2, $3, $4)
      `,
      [userId, action, actionType, details]
    );
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
