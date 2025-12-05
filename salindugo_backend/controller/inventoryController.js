import pool from "../db.js";
import { logAudit } from "../utils/auditLogger.js";

// 📌 Fetch stock for a specific hospital
export const getHospitalStock = async (req, res) => {
  try {
    const hospital_id = req.user.id;

    // Query existing stock with bag IDs
    const existing = await pool.query(
      `
      SELECT bs.*,
             COALESCE(
               ARRAY_AGG(bb.bag_id) FILTER (WHERE bb.bag_id IS NOT NULL),
               '{}'
             ) AS bag_ids
      FROM blood_stocks bs
      LEFT JOIN blood_bags bb 
             ON bb.hospital_id = bs.hospital_id 
             AND bb.blood_type = bs.blood_type
      WHERE bs.hospital_id = $1
      GROUP BY bs.stock_id
      ORDER BY bs.blood_type
      `,
      [hospital_id]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows);
    }

    // Auto-create 8 standard blood types if none exist
    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const insertQuery = `
      INSERT INTO blood_stocks (hospital_id, blood_type, units_available, last_updated)
      VALUES ${bloodTypes.map((_, i) => `($1, $${i + 2}, 0, NOW())`).join(",")}
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [hospital_id, ...bloodTypes]);

    // Include bag_ids (empty arrays since no bags yet)
    const stocksWithBags = result.rows.map((row) => ({ ...row, bag_ids: [] }));

    return res.json(stocksWithBags);
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

    await logAudit(hospital_id, "update_stock", "inventory", {
      blood_type,
      units_change,
      units_after: newUnits,
      reason,
    });

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
      `
      SELECT 
        ih.*,
        bb.status AS bag_status,
        bb.created_at AS bag_created_at
      FROM inventory_history ih
      LEFT JOIN blood_bags bb
        ON ih.bag_id = bb.bag_id
      WHERE ih.hospital_id = $1
      ORDER BY ih.changed_at DESC
      `,
      [hospital_id]
    );

    res.json({ history: history.rows });
  } catch (err) {
    console.error("getInventoryHistory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStockHistoryByBloodType = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const hospital_id = req.user.id;
    const { bloodType } = req.params;

    if (!bloodType)
      return res.status(400).json({ message: "Blood type is required" });

    const history = await pool.query(
      `
      SELECT changed_at, change
      FROM inventory_history
      WHERE hospital_id = $1
        AND blood_type = $2
      ORDER BY changed_at ASC
      `,
      [hospital_id, bloodType]
    );

    const formattedHistory = history.rows.map((row) => ({
      date: row.changed_at
        ? new Date(row.changed_at).toISOString()
        : new Date().toISOString(),
      units: row.change ?? 0,
    }));

    res.json(formattedHistory);
  } catch (err) {
    console.error("getStockHistoryByBloodType error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------
// 📌 Create walk-in donor + donation + update inventory
// ----------------------------------------------------
import bcrypt from "bcryptjs";

export const createWalkInDonation = async (req, res) => {
  const client = await pool.connect();
  try {
    const hospital_id = req.user.id;
    const {
      full_name,
      age,
      gender,
      blood_type,
      units,
      contact_number,
      address,
      date_of_birth,
      middle_initial,
      title,
      role = "user",
      civil_status,
    } = req.body;

    if (!full_name || !blood_type || !units) {
      return res.status(400).json({
        message: "Missing required fields (name, blood type, units).",
      });
    }

    await client.query("BEGIN");

    // 🔹 Auto-generate email & password
    const email =
      full_name.toLowerCase().replace(/\s+/g, "") +
      Math.floor(Math.random() * 1000) +
      "@example.com"; // e.g., johndoe123@example.com
    const plainPassword = Math.random().toString(36).slice(-8); // 8-char password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 🔹 Create walk-in donor user
    const donorRes = await client.query(
      `INSERT INTO users 
        (full_name, email, password_hash, age, gender, blood_type, role, is_walk_in, created_by_hospital,
         contact_number, address, date_of_birth, middle_initial, title, civil_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,$10,$11,$12,$13,$14)
       RETURNING user_id`,
      [
        full_name,
        email,
        hashedPassword,
        age || null,
        gender || null,
        blood_type,
        role,
        hospital_id,
        contact_number || null,
        address || null,
        date_of_birth || null,
        middle_initial || null,
        title || null,
        civil_status,
      ]
    );

    const donor_id = donorRes.rows[0].user_id;

    // 🔹 Insert donation record
    const donationRes = await client.query(
      `INSERT INTO donations 
         (donor_id, hospital_id, blood_type, donation_type, donation_date, status, units)
       VALUES ($1, $2, $3, 'whole_blood', NOW(), 'completed', $4)
       RETURNING donation_id`,
      [donor_id, hospital_id, blood_type, units]
    );

    const donation_id = donationRes.rows[0].donation_id;

    const bagIds = [];
    for (let i = 0; i < units; i++) {
      const bagRes = await client.query(
        `INSERT INTO blood_bags (
        donation_id,
        hospital_id,
        blood_type,
        status,
        created_at,
        expiration_date
     ) VALUES (
        $1, $2, $3, 'available', NOW(), NOW() + INTERVAL '35 days'
     )
     RETURNING bag_id`,
        [donation_id, hospital_id, blood_type]
      );
      bagIds.push(bagRes.rows[0].bag_id);
    }

    // 🔹 Update blood stocks
    const stockRes = await client.query(
      `INSERT INTO blood_stocks (hospital_id, blood_type, units_available)
       VALUES ($1, $2, $3)
       ON CONFLICT (hospital_id, blood_type)
       DO UPDATE SET 
         units_available = blood_stocks.units_available + EXCLUDED.units_available,
         last_updated = NOW()
       RETURNING units_available`,
      [hospital_id, blood_type, units]
    );

    const new_units_after = stockRes.rows[0].units_available;

    // 🔹 Insert inventory history with donor_id
    for (const bag_id of bagIds) {
      await client.query(
        `INSERT INTO inventory_history
         (hospital_id, blood_type, change, units_after, reason, changed_by, donor_id, bag_id)
       VALUES ($1, $2, $3, $4, 'Walk-in Donation', $5, $6, $7)`,
        [
          hospital_id,
          blood_type,
          units,
          new_units_after,
          req.user.id,
          donor_id,
          bag_id,
        ]
      );
    }

    // 🔹 Low stock notification
    if (new_units_after < 5) {
      await client.query(
        `INSERT INTO notifications (user_id, message, type)
         VALUES ($1, $2, 'system')`,
        [
          hospital_id,
          `⚠️ Low stock alert: ${blood_type} has only ${new_units_after} units left.`,
        ]
      );
    }

    await client.query("COMMIT");

    await logAudit(hospital_id, "create_walk_in_donation", "inventory", {
      donor_id,
      donation_id,
      bag_ids: bagIds,
      blood_type,
      units_added: units,
      units_after: new_units_after,
    });

    res.json({
      message: "Walk-in donation recorded successfully",
      donation_id: donationRes.rows[0].donation_id,
      donor_id,
      bag_ids: bagIds,
      email, // return credentials to hospital
      password: plainPassword,
      units_available: new_units_after,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createWalkInDonation error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
