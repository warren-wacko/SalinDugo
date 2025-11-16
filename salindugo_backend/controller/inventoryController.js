import pool from "../db.js";

// 📌 Fetch stock for a specific hospital
export const getHospitalStock = async (req, res) => {
  try {
    const hospital_id = req.user.id;

    // Check if hospital already has stock rows
    const existing = await pool.query(
      `SELECT * FROM blood_stocks WHERE hospital_id = $1 ORDER BY blood_type`,
      [hospital_id]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows);
    }

    // ✅ Auto-create 8 standard blood types if none exist
    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const insertQuery = `
      INSERT INTO blood_stocks (hospital_id, blood_type, units_available, last_updated)
      VALUES ${bloodTypes.map((_, i) => `($1, $${i + 2}, 0, NOW())`).join(",")}
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [hospital_id, ...bloodTypes]);

    return res.json(result.rows);
  } catch (err) {
    console.error("getHospitalStock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Update stock for hospital (increase/decrease)
export const updateStock = async (req, res) => {
  try {
    const hospital_id = req.user.id;
    const { blood_type, units_change, reason } = req.body;
    const changed_by = hospital_id;

    if (!blood_type || !units_change)
      return res.status(400).json({ message: "Missing fields" });

    await pool.query("BEGIN");

    const existing = await pool.query(
      `SELECT units_available FROM blood_stocks WHERE hospital_id = $1 AND blood_type = $2`,
      [hospital_id, blood_type]
    );

    let newUnits = units_change;

    if (existing.rows.length > 0) {
      newUnits = existing.rows[0].units_available + Number(units_change);
      if (newUnits < 0) newUnits = 0;

      await pool.query(
        `UPDATE blood_stocks 
         SET units_available = $1, last_updated = NOW()
         WHERE hospital_id = $2 AND blood_type = $3`,
        [newUnits, hospital_id, blood_type]
      );
    } else {
      await pool.query(
        `INSERT INTO blood_stocks (hospital_id, blood_type, units_available)
         VALUES ($1, $2, $3)`,
        [hospital_id, blood_type, newUnits]
      );
    }

    await pool.query(
      `INSERT INTO inventory_history
       (hospital_id, blood_type, change, units_after, reason, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [hospital_id, blood_type, units_change, newUnits, reason, changed_by]
    );

    // ✅ NEW: If stock becomes low, notify hospital
    if (newUnits < 5) {
      await pool.query(
        `INSERT INTO notifications (user_id, message, type)
         VALUES ($1, $2, 'system')`,
        [
          hospital_id,
          `⚠️ Low stock alert: ${blood_type} has only ${newUnits} units left.`,
        ]
      );
    }

    await pool.query("COMMIT");

    res.json({
      message: "Stock updated successfully",
      units_available: newUnits,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("updateStock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Inventory history for hospital
export const getInventoryHistory = async (req, res) => {
  try {
    const hospital_id = req.user.id;

    const history = await pool.query(
      `SELECT * FROM inventory_history
       WHERE hospital_id = $1
       ORDER BY changed_at DESC`,
      [hospital_id]
    );

    res.json({ history: history.rows });
  } catch (err) {
    console.error("getInventoryHistory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const fulfillDonation = async (req, res) => {
  try {
    const hospital_id = req.user.id;
    const { request_id, units_given = 1 } = req.body;

    const reqRes = await pool.query(
      `SELECT blood_type, hospital_id FROM requests WHERE request_id = $1`,
      [request_id]
    );

    if (reqRes.rows.length === 0)
      return res.status(404).json({ message: "Request not found" });

    const request = reqRes.rows[0];
    await pool.query("BEGIN");

    // ✅ Update stock automatically
    await pool.query(
      `INSERT INTO blood_stocks (hospital_id, blood_type, units_available)
       VALUES ($1, $2, $3)
       ON CONFLICT (hospital_id, blood_type)
       DO UPDATE SET 
          units_available = blood_stocks.units_available + EXCLUDED.units_available,
          last_updated = NOW()`,
      [hospital_id, request.blood_type, units_given]
    );

    // ✅ Fulfill request
    await pool.query(
      `UPDATE requests SET status='fulfilled', updated_at = NOW()
       WHERE request_id = $1`,
      [request_id]
    );

    // ✅ History entry
    await pool.query(
      `INSERT INTO inventory_history 
       (hospital_id, blood_type, change, units_after, reason, changed_by)
       SELECT $1, $2, $3, units_available, 'Donation Received', $1
       FROM blood_stocks WHERE hospital_id = $1 AND blood_type = $2`,
      [hospital_id, request.blood_type, units_given]
    );

    // ✅ Notify hospital
    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, 'donation_received')`,
      [
        hospital_id,
        `✅ Donation received: +${units_given} units of ${request.blood_type}`,
      ]
    );

    await pool.query("COMMIT");

    res.json({ message: "Donation fulfilled & inventory updated ✅" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("fulfillDonation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
