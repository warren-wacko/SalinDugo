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
      title,
      civil_status,
      age,
    } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET 
         contact_number    = COALESCE(NULLIF($1, '')::text, contact_number),

         weight            = COALESCE(NULLIF($2, '')::numeric, weight),
         height            = COALESCE(NULLIF($3, '')::numeric, height),
         medical_conditions = COALESCE(NULLIF($4, '')::text, medical_conditions),
         allergies         = COALESCE(NULLIF($5, '')::text, allergies),

         address           = COALESCE(NULLIF($6, '')::text, address),
         city              = COALESCE(NULLIF($7, '')::text, city),
         province          = COALESCE(NULLIF($8, '')::text, province),
         region            = COALESCE(NULLIF($9, '')::text, region),
         zip_code          = COALESCE(NULLIF($10, '')::text, zip_code),

         latitude          = COALESCE(NULLIF($11, '')::numeric, latitude),
         longitude         = COALESCE(NULLIF($12, '')::numeric, longitude),

         title             = COALESCE(NULLIF($14, '')::text, title),
         civil_status      = COALESCE(NULLIF($15, '')::text, civil_status),
         age               = COALESCE(NULLIF($16, '')::numeric, age),

         profile_completed = TRUE,
         updated_at = NOW()
       WHERE user_id = $13
       RETURNING *`,
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
        title,
        civil_status,
        age,
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
