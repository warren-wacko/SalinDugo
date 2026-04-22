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
      full_name,
      contact_number,
      weight,
      height,
      medical_conditions,
      allergies,
      address,
      barangay,
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

    console.log("REQ BODY:", req.body);
    console.log("FULL NAME BACKEND:", full_name, typeof full_name);

    const result = await pool.query(
      `UPDATE users 
        SET 
          full_name         = COALESCE(NULLIF($1, '')::text, full_name),
          contact_number    = COALESCE(NULLIF($2, '')::text, contact_number),

          weight            = COALESCE(NULLIF($3, '')::numeric, weight),
          height            = COALESCE(NULLIF($4, '')::numeric, height),
          medical_conditions = COALESCE(NULLIF($5, '')::text, medical_conditions),
          allergies         = COALESCE(NULLIF($6, '')::text, allergies),

          address           = COALESCE(NULLIF($7, '')::text, address),
          barangay          = COALESCE(NULLIF($8, '')::text, barangay), 
          city              = COALESCE(NULLIF($9, '')::text, city),
          province          = COALESCE(NULLIF($10, '')::text, province),
          region            = COALESCE(NULLIF($11, '')::text, region),
          zip_code          = COALESCE(NULLIF($12, '')::text, zip_code),

          latitude          = COALESCE(NULLIF($13, '')::numeric, latitude),
          longitude         = COALESCE(NULLIF($14, '')::numeric, longitude),

          title             = COALESCE(NULLIF($16, '')::text, title),
          civil_status      = COALESCE(NULLIF($17, '')::text, civil_status),
          age               = COALESCE(NULLIF($18, '')::numeric, age),

          profile_completed = TRUE,
          updated_at        = NOW()
        WHERE user_id = $15
        RETURNING *`,
      [
        full_name, // $1
        contact_number, // $2
        weight, // $3
        height, // $4
        medical_conditions, // $5
        allergies, // $6
        address, // $7
        barangay, // $8
        city, // $9
        province, // $10
        region, // $11
        zip_code, // $12
        latitude, // $13
        longitude, // $14
        id, // $15 (WHERE)
        title, // $16
        civil_status, // $17
        age, // $18
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
