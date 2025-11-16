import pool from "../db.js";
import { checkLowStockAndNotify } from "../utils/inventoryHelpers.js";
// ==========================================
// POST /api/requests → Create new request
// ==========================================
export const createRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const { blood_type, units_needed, urgency_level, hospital_id } = req.body;
    const user_id = req.user.id; // requester (sender)

    if (!blood_type || !units_needed || !urgency_level || !hospital_id) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled." });
    }

    await client.query("BEGIN");

    // 1️⃣ Create request
    const result = await client.query(
      `
      INSERT INTO requests (requester_id, hospital_id, blood_type, urgency_level, units_needed, status)
      VALUES ($1, $2, $3, $4, $5, 'open')
      RETURNING *
      `,
      [user_id, hospital_id, blood_type, urgency_level, units_needed]
    );

    const request = result.rows[0];

    // 2️⃣ Notify the hospital (receiver)
    await client.query(
      `
      INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
      VALUES ($1, $2, $3, $4, 'request', $5)
      `,
      [
        hospital_id,
        user_id,
        "New Blood Request 🩸",
        `A user has requested ${units_needed} unit(s) of ${blood_type} blood with ${urgency_level} urgency.`,
        request.request_id,
      ]
    );

    // 3️⃣ Notify requester (self confirmation)
    await client.query(
      `
      INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
      VALUES ($1, $2, $3, $4, 'request', $5)
      `,
      [
        user_id,
        hospital_id,
        "Request Submitted ✅",
        `Your blood request for ${blood_type} (${units_needed} unit/s) has been sent to the hospital.`,
        request.request_id,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Blood request created successfully.",
      request,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};

// ==========================================
// GET /api/requests/:id → Get single request
// ==========================================
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM requests WHERE request_id = $1",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Request not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==========================================
// GET /api/requests → Get all user requests
// ==========================================
export const getUserRequests = async (req, res) => {
  try {
    const { id, role } = req.user;

    let result;
    if (role === "hospital") {
      result = await pool.query(
        `
        SELECT 
          r.*, 
          u.full_name AS requester_name,
          h.full_name AS hospital_name
        FROM requests r
        JOIN users u ON r.requester_id = u.user_id
        JOIN users h ON r.hospital_id = h.user_id
        WHERE r.hospital_id = $1
        ORDER BY r.request_date DESC
        `,
        [id]
      );
    } else {
      result = await pool.query(
        `
        SELECT 
          r.*, 
          h.full_name AS hospital_name
        FROM requests r
        JOIN users h ON r.hospital_id = h.user_id
        WHERE r.requester_id = $1
        ORDER BY r.request_date DESC
        `,
        [id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==========================================
// PATCH /api/requests/:id → Update or cancel
// ==========================================
export const updateRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, units_needed, urgency_level } = req.body;

    const validStatuses = ["open", "matched", "fulfilled", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE requests
      SET 
        status = COALESCE($1, status),
        units_needed = COALESCE($2, units_needed),
        urgency_level = COALESCE($3, urgency_level),
        request_date = NOW()
      WHERE request_id = $4
      RETURNING *
      `,
      [status, units_needed, urgency_level, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Request not found or not authorized" });
    }

    const request = result.rows[0];

    // 📨 Send notifications
    if (status === "fulfilled") {
      // notify requester that hospital fulfilled request
      await client.query(
        `
        INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
        VALUES ($1, $2, $3, $4, 'request', $5)
        `,
        [
          request.requester_id,
          request.hospital_id,
          "Request Fulfilled ✅",
          `Your ${request.blood_type} blood request has been fulfilled by the hospital.`,
          request.request_id,
        ]
      );
    } else if (status === "cancelled") {
      await client.query(
        `
        INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
        VALUES ($1, $2, $3, $4, 'request', $5)
        `,
        [
          request.hospital_id,
          request.requester_id,
          "Request Cancelled ❌",
          `A blood request for ${request.blood_type} has been cancelled.`,
          request.request_id,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Request updated successfully",
      request,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};

// ==========================================
// PATCH /api/requests/:id/fulfill → Fulfill blood request & deduct units
// ==========================================
// ✅ Enhanced Fulfill Request — Safe & Validated
export const fulfillRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const hospital_id = req.user.id;

    await client.query("BEGIN");

    // ✅ 1️⃣ Fetch request
    const requestRes = await client.query(
      `SELECT * FROM requests WHERE request_id = $1`,
      [id]
    );
    if (requestRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requestRes.rows[0];

    // ✅ Only Hospital Assigned Can Fulfill
    if (request.hospital_id !== hospital_id) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message:
          "Unauthorized: Cannot fulfill request not assigned to your hospital.",
      });
    }

    // ✅ Prevent double fulfillment
    if (request.status === "fulfilled") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "This request is already fulfilled." });
    }

    // ✅ Prevent fulfilling cancelled/invalid requests
    if (
      ["cancelled", "matched"].includes(request.status) === false &&
      request.status !== "open"
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Cannot fulfill request with status "${request.status}".`,
      });
    }

    // ✅ 2️⃣ Check stock
    const stockRes = await client.query(
      `SELECT units_available 
       FROM blood_stocks 
       WHERE hospital_id = $1 AND blood_type = $2`,
      [hospital_id, request.blood_type]
    );

    let currentStock =
      stockRes.rows.length > 0 ? stockRes.rows[0].units_available : 0;

    // ✅ Create stock row if missing
    if (stockRes.rows.length === 0) {
      await client.query(
        `INSERT INTO blood_stocks (hospital_id, blood_type, units_available, last_updated)
         VALUES ($1, $2, $3, NOW())`,
        [hospital_id, request.blood_type, currentStock]
      );
    }

    if (currentStock === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "No stock available",
      });
    }

    if (currentStock < request.units_needed) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Insufficient stock: Need ${request.units_needed}, only ${currentStock} available`,
      });
    }

    const updatedStock = Math.max(0, currentStock - request.units_needed);

    // ✅ 3️⃣ Reduce stock
    await client.query(
      `UPDATE blood_stocks 
       SET units_available = $1, last_updated = NOW()
       WHERE hospital_id = $2 AND blood_type = $3`,
      [updatedStock, hospital_id, request.blood_type]
    );

    // ✅ 4️⃣ Log history
    await client.query(
      `INSERT INTO inventory_history 
       (hospital_id, blood_type, change, units_after, reason, changed_by)
       VALUES ($1, $2, $3, $4, 'request_fulfilled', $5)`,
      [
        hospital_id,
        request.blood_type,
        -request.units_needed,
        updatedStock,
        hospital_id,
      ]
    );

    // ✅ 5️⃣ Mark request fulfilled
    await client.query(
      `UPDATE requests
       SET status = 'fulfilled', request_date = NOW()
       WHERE request_id = $1`,
      [id]
    );

    // ✅ 6️⃣ Notify requester
    await client.query(
      `INSERT INTO notifications 
       (user_id, sender_id, title, message, type, related_id)
       VALUES ($1, $2, 'Request Fulfilled ✅',
       'Your request has been successfully fulfilled by the hospital.',
       'request', $3)`,
      [request.requester_id, hospital_id, id]
    );

    await checkLowStockAndNotify(hospital_id, request.blood_type);

    await client.query("COMMIT");

    return res.json({
      message: "Request fulfilled successfully ✅",
      updated_stock: updatedStock,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("fulfillRequest error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};
