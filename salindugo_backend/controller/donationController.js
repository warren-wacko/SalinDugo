import pool from "../db.js";
// ==========================================
// GET /api/donations → Get all donations for a user or hospital
// ==========================================
export const getDonations = async (req, res) => {
  try {
    const { id, role } = req.user;
    let result;

    if (role === "hospital") {
      result = await pool.query(
        `
        SELECT d.*, u.full_name AS donor_name
        FROM donations d
        JOIN users u ON d.donor_id = u.user_id
        WHERE d.hospital_id = $1
        ORDER BY donation_date DESC
        `,
        [id]
      );
    } else {
      result = await pool.query(
        `
        SELECT d.*, h.full_name AS hospital_name
        FROM donations d
        JOIN users h ON d.hospital_id = h.user_id
        WHERE d.donor_id = $1
        ORDER BY donation_date DESC
        `,
        [id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching donations:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
