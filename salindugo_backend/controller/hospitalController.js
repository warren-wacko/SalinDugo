import pool from "../db.js";

export const getHospitals = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, full_name, city, province FROM users WHERE role = 'hospital' AND is_verified = true ORDER BY full_name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch hospitals" });
  }
};