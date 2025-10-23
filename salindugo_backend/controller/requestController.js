import pool from "../db.js";

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
    const user_id = req.user.id;
    const role = req.user.role;

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
