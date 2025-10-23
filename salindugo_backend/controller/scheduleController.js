import pool from "../db.js";

// ==========================================
// POST /api/schedules → Create donation schedule
// ==========================================
export const createSchedule = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      donor_id,
      hospital_id,
      scheduled_date,
      scheduled_time,
      blood_type,
    } = req.body;
    const { id: sender_id } = req.user; // ✅ The user performing the action

    if (!donor_id || !hospital_id || !scheduled_date || !blood_type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await client.query("BEGIN");

    // 🩸 Create the schedule
    const result = await client.query(
      `
      INSERT INTO donation_schedules (donor_id, hospital_id, scheduled_date, scheduled_time, blood_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [donor_id, hospital_id, scheduled_date, scheduled_time, blood_type]
    );

    const schedule = result.rows[0];

    // 🏥 Notify the hospital
    await client.query(
      `
      INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
      VALUES ($1, $2, $3, $4, 'schedule', $5)
      `,
      [
        hospital_id, // recipient
        sender_id, // sender (the logged-in user)
        "New Donation Schedule 📅",
        `A donor has scheduled a ${blood_type} blood donation on ${scheduled_date}.`,
        schedule.schedule_id,
      ]
    );

    // 🧍 Notify the donor
    await client.query(
      `
      INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
      VALUES ($1, $2, $3, $4, 'schedule', $5)
      `,
      [
        donor_id, // recipient
        sender_id, // sender (the logged-in user)
        "Donation Schedule Submitted",
        `Your donation appointment for ${blood_type} blood on ${scheduled_date} has been sent for approval.`,
        schedule.schedule_id,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Donation schedule created successfully",
      schedule,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating schedule:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};

// ==========================================
// GET /api/schedules → Get schedules for donor or hospital
// ==========================================
export const getSchedules = async (req, res) => {
  try {
    const { id, role } = req.user;
    let result;

    if (role === "hospital") {
      result = await pool.query(
        `
        SELECT s.*, u.full_name AS donor_name
        FROM donation_schedules s
        JOIN users u ON s.donor_id = u.user_id
        WHERE s.hospital_id = $1
        ORDER BY s.scheduled_date DESC
        `,
        [id]
      );
    } else {
      result = await pool.query(
        `
        SELECT s.*, h.full_name AS hospital_name
        FROM donation_schedules s
        JOIN users h ON s.hospital_id = h.user_id
        WHERE s.donor_id = $1
        ORDER BY s.scheduled_date DESC
        `,
        [id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching schedules:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==========================================
// PATCH /api/schedules/:id → Update schedule status or remarks
// ==========================================
export const updateSchedule = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const { id: sender_id } = req.user; // ✅ who is performing the action

    const validStatuses = [
      "pending",
      "approved",
      "rejected",
      "completed",
      "cancelled",
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await client.query("BEGIN");

    // 1️⃣ Update schedule
    const result = await client.query(
      `
      UPDATE donation_schedules
      SET status = COALESCE($1, status),
          remarks = COALESCE($2, remarks),
          updated_at = NOW()
      WHERE schedule_id = $3
      RETURNING *
      `,
      [status, remarks, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Schedule not found" });
    }

    const schedule = result.rows[0];

    // 2️⃣ Notify donor about status change
    if (status && ["approved", "rejected", "cancelled"].includes(status)) {
      await client.query(
        `
        INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
        VALUES ($1, $2, $3, $4, 'schedule', $5)
        `,
        [
          schedule.donor_id,
          sender_id,
          `Schedule ${
            status === "approved"
              ? "Approved ✅"
              : status === "rejected"
              ? "Rejected ❌"
              : "Cancelled 🛑"
          }`,
          `Your donation schedule on ${schedule.scheduled_date} has been ${status}.`,
          schedule.schedule_id,
        ]
      );
    }

    // 3️⃣ If schedule completed → create a donation record
    if (status === "completed") {
      const donationResult = await client.query(
        `
        INSERT INTO donations (donor_id, hospital_id, blood_type, donation_type, donation_date, status)
        VALUES ($1, $2, $3, 'whole_blood', NOW(), 'completed')
        RETURNING *
        `,
        [schedule.donor_id, schedule.hospital_id, schedule.blood_type]
      );

      const donation = donationResult.rows[0];

      // Notify donor
      await client.query(
        `
        INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
        VALUES ($1, $2, $3, $4, 'donation', $5)
        `,
        [
          schedule.donor_id,
          sender_id,
          "Donation Completed 🎉",
          `Your ${schedule.blood_type} donation has been marked as completed.`,
          donation.donation_id,
        ]
      );

      // Notify hospital
      await client.query(
        `
        INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
        VALUES ($1, $2, $3, $4, 'donation', $5)
        `,
        [
          schedule.hospital_id,
          sender_id,
          "New Donation Recorded 🩸",
          `A ${schedule.blood_type} blood donation has been completed by donor ID ${schedule.donor_id}.`,
          donation.donation_id,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Schedule updated successfully",
      schedule,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating schedule:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};
