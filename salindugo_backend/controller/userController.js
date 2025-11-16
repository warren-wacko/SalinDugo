import pool from "../db.js";

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      contact_number,
      weight,
      height,
      medical_conditions,
      allergies,
      address,
      city,
      province,
      region,
      zip_code,
      latitude,
      longitude,
    } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET 
         contact_number = COALESCE($1, contact_number),
         weight = COALESCE($2, weight),
         height = COALESCE($3, height),
         medical_conditions = COALESCE($4, medical_conditions),
         allergies = COALESCE($5, allergies),
         address = COALESCE($6, address),
         city = COALESCE($7, city),
         province = COALESCE($8, province),
         region = COALESCE($9, region),
         zip_code = COALESCE($10, zip_code),
         latitude = COALESCE($11, latitude),
         longitude = COALESCE($12, longitude),
         profile_completed = TRUE,
         updated_at = NOW()
       WHERE user_id = $13
       RETURNING user_id, full_name, email, blood_type, contact_number, 
                 weight, height, medical_conditions, allergies, address, 
                 city, province, region, zip_code, latitude, longitude, profile_completed, updated_at`,
      [
        contact_number,
        weight,
        height,
        medical_conditions,
        allergies,
        address,
        city,
        province,
        region,
        zip_code,
        latitude,
        longitude,
        id,
      ]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
