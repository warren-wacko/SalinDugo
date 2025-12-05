import pool from "../db.js";
import bcrypt from "bcryptjs";
import { logAudit } from "../utils/auditLogger.js";
// ======================================================
// GET /api/admin/users → Get all users
// ======================================================
export const adminGetAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT user_id, full_name, email, role, blood_type, region, created_at
      FROM users
      ORDER BY created_at DESC
      `
    );

    res.json({ users: result.rows });
  } catch (err) {
    console.error("Admin Get Users Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================================================
// GET /api/admin/stats → Get donations count + unfulfilled requests
// ======================================================
export const adminGetStats = async (req, res) => {
  try {
    // 1️⃣ Total donations
    const donationRes = await pool.query(`
      SELECT COUNT(*) AS total_donations FROM donations
    `);

    // 2️⃣ Unfulfilled requests (open + matched)
    const requestRes = await pool.query(`
      SELECT COUNT(*) AS unfulfilled_requests
      FROM requests
      WHERE status IN ('open', 'matched')
    `);

    res.json({
      total_donations: Number(donationRes.rows[0].total_donations),
      unfulfilled_requests: Number(requestRes.rows[0].unfulfilled_requests),
    });
  } catch (err) {
    console.error("Admin Get Stats Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================================================
// (Optional) GET /api/admin/dashboard → Combined payload
// ======================================================
export const adminDashboard = async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT COUNT(*) AS total_users FROM users
    `);

    const donations = await pool.query(`
      SELECT COUNT(*) AS total_donations FROM donations
    `);

    const unfulfilled = await pool.query(`
      SELECT COUNT(*) AS unfulfilled_requests
      FROM requests
      WHERE status IN ('open', 'matched')
    `);

    res.json({
      total_users: Number(users.rows[0].total_users),
      total_donations: Number(donations.rows[0].total_donations),
      unfulfilled_requests: Number(unfulfilled.rows[0].unfulfilled_requests),
    });
  } catch (err) {
    console.error("Admin Dashboard Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const adminMonthlyDonations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(donation_date, 'YYYY-MM') AS month,
        COUNT(*) AS count
      FROM donations
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    res.json(result.rows); // ✅ return array directly
  } catch (err) {
    console.error("Monthly donations error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const adminMonthlyRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(request_date, 'YYYY-MM') AS month,
        COUNT(*) AS count
      FROM requests
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    res.json(result.rows); // ✅ return array directly
  } catch (err) {
    console.error("Monthly requests error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const adminRequestBreakdown = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM requests
      GROUP BY status
      ORDER BY 
        CASE 
          WHEN status = 'fulfilled' THEN 1
          WHEN status = 'open' THEN 2
          WHEN status = 'matched' THEN 3
          WHEN status = 'cancelled' THEN 4
          ELSE 5
        END
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Request breakdown error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================================================
// GET /api/admin/hospitals → List all hospitals
// ======================================================
export const adminGetHospitals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        user_id,
        full_name,
        email,
        region,
        created_at,
        is_verified
      FROM users
      WHERE role = 'hospital'
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Admin Get Hospitals Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================================================
// POST /api/admin/hospitals → Create a new hospital account
// ======================================================
export const adminCreateHospital = async (req, res) => {
  try {
    const { full_name, email, password, region } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (full_name, email, password_hash, role, region, is_verified)
      VALUES ($1, $2, $3, 'hospital', $4, true)
      RETURNING user_id, full_name, email, role, region, is_verified, created_at
    `,
      [full_name, email, hashed, region || null]
    );
    await logAudit(req.user.id, "create_hospital", "admin", {
      hospital_id: result.rows[0].user_id,
    });

    res.status(201).json({
      message: "Hospital account created successfully",
      hospital: result.rows[0],
    });
  } catch (err) {
    console.error("Admin Create Hospital Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================================================
// PATCH /api/admin/hospitals/:id/toggle → Toggle verification
// ======================================================
export const adminToggleHospitalVerification = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current value
    const hospital = await pool.query(
      `SELECT is_verified FROM users WHERE user_id = $1 AND role = 'hospital'`,
      [id]
    );

    if (hospital.rows.length === 0) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    const newStatus = !hospital.rows[0].is_verified;

    const result = await pool.query(
      `
      UPDATE users
      SET is_verified = $1
      WHERE user_id = $2
      RETURNING user_id, full_name, email, region, is_verified
    `,
      [newStatus, id]
    );
    await logAudit(req.user.id, "toggle_hospital_verification", "admin", {
      hospital_id: id,
      new_status: newStatus,
    });

    res.json({
      message: newStatus ? "Hospital activated" : "Hospital deactivated",
      hospital: result.rows[0],
    });
  } catch (err) {
    console.error("Toggle Hospital Verification Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================================================
// GET /api/admin/hospitals/:id/stocks → Blood stock summary
// ======================================================
export const adminGetHospitalStock = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        blood_type,
        units_available,
        last_updated
      FROM blood_stocks
      WHERE hospital_id = $1
      ORDER BY blood_type ASC
    `,
      [id]
    );

    res.json({
      hospital_id: id,
      stocks: result.rows,
    });
  } catch (err) {
    console.error("Hospital Stock Summary Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================================================
// GET /api/admin/audit-logs → Fetch audit logs
// Supports filters: user_id, action, action_type, date range
// ======================================================
export const adminGetAuditLogs = async (req, res) => {
  try {
    const { user_id, action, action_type, start_date, end_date } = req.query;

    let query = `
      SELECT 
        al.log_id,
        al.user_id,
        u.full_name,
        u.email,
        u.role,
        al.action,
        al.action_type,
        al.details,
        al.timestamp
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE 1 = 1
    `;

    const params = [];
    let paramIndex = 1;

    if (user_id) {
      query += ` AND al.user_id = $${paramIndex++}`;
      params.push(user_id);
    }

    if (action) {
      query += ` AND al.action ILIKE $${paramIndex++}`;
      params.push(`%${action}%`);
    }

    if (action_type) {
      query += ` AND al.action_type = $${paramIndex++}`;
      params.push(action_type);
    }

    if (start_date) {
      query += ` AND al.timestamp >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND al.timestamp <= $${paramIndex++}`;
      params.push(end_date);
    }

    query += ` ORDER BY al.timestamp DESC`;

    const result = await pool.query(query, params);

    res.json({
      count: result.rows.length,
      logs: result.rows,
    });
  } catch (err) {
    console.error("Admin Get Audit Logs Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================================================
// 📊 ADMIN — HOSPITAL PERFORMANCE SUMMARY
// ======================================================

/* ----------------------------------------------------
   1️⃣ Donations per Hospital
---------------------------------------------------- */
export const adminDonationsPerHospital = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        h.user_id AS hospital_id,
        h.full_name AS hospital_name,
        COUNT(d.donation_id) AS total_donations
      FROM users h
      LEFT JOIN donations d ON d.hospital_id = h.user_id
      WHERE h.role = 'hospital'
      GROUP BY h.user_id, h.full_name
      ORDER BY total_donations DESC;
    `);

    res.json({ hospitals: result.rows });
  } catch (err) {
    console.error("Admin Donations per Hospital Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ----------------------------------------------------
   2️⃣ Requests per Hospital
---------------------------------------------------- */
export const adminRequestsPerHospital = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        h.user_id AS hospital_id,
        h.full_name AS hospital_name,
        COUNT(r.request_id) AS total_requests
      FROM users h
      LEFT JOIN requests r ON r.hospital_id = h.user_id
      WHERE h.role = 'hospital'
      GROUP BY h.user_id, h.full_name
      ORDER BY total_requests DESC;
    `);

    res.json({ hospitals: result.rows });
  } catch (err) {
    console.error("Admin Requests per Hospital Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ----------------------------------------------------
   3️⃣ Hospitals With Low Stock (<5)
---------------------------------------------------- */
export const adminLowStockHospitals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id AS hospital_id,
        u.full_name AS hospital_name,
        bs.blood_type,
        bs.units_available
      FROM users u
      JOIN blood_stocks bs 
        ON bs.hospital_id = u.user_id
      WHERE u.role = 'hospital'
        AND bs.units_available < 5
      ORDER BY u.full_name ASC, bs.blood_type ASC;
    `);

    res.json({ low_stock: result.rows });
  } catch (err) {
    console.error("Low Stock Hospitals Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================================================
// GET /api/admin/stocks/regions → Total stock per region
// ======================================================
export const adminStockByRegion = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.region,
        bs.blood_type,
        SUM(bs.units_available) AS total_units
      FROM blood_stocks bs
      JOIN users u ON u.user_id = bs.hospital_id
      WHERE u.role = 'hospital'
      GROUP BY u.region, bs.blood_type
      ORDER BY u.region ASC, bs.blood_type ASC
    `);

    res.json({ region_stock: result.rows });
  } catch (err) {
    console.error("Stock by Region Error:", err);
    res.status(500).json({
      message: "Server error retrieving stock by region",
      error: err.message,
    });
  }
};
