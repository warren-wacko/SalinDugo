import pool from "../db.js";
import { logAudit } from "../utils/auditLogger.js";
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

    await logAudit(sender_id, "create_schedule", "schedule", {
      schedule_id: schedule.schedule_id,
      donor_id,
      hospital_id,
      scheduled_date,
      scheduled_time,
      blood_type,
    });

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
// 🆕 GET /api/schedules/pending/:donor_id → Check pending schedules
// ==========================================
export const getPendingSchedule = async (req, res) => {
  try {
    const { donor_id } = req.params;

    // 🆕 UPDATED: Include hospital location data
    const result = await pool.query(
      `
      SELECT 
        s.*,
        h.full_name AS hospital_name,
        h.address,
        h.latitude,
        h.longitude,
        h.contact_number
      FROM donation_schedules s
      JOIN users h ON s.hospital_id = h.user_id
      WHERE s.donor_id = $1 AND s.status IN ('pending', 'approved')
      LIMIT 1
      `,
      [donor_id]
    );

    if (result.rows.length === 0) {
      return res.json({ hasPending: false, schedule: null });
    }

    res.json({ hasPending: true, schedule: result.rows[0] });
  } catch (err) {
    console.error("Error checking pending schedules:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==========================================
// 🆕 DELETE /api/schedules/:id → Cancel schedule
// ==========================================
export const cancelSchedule = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;

    await client.query("BEGIN");

    // Get the schedule
    const scheduleRes = await client.query(
      `SELECT * FROM donation_schedules WHERE schedule_id = $1`,
      [id]
    );

    if (scheduleRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Schedule not found" });
    }

    const schedule = scheduleRes.rows[0];

    // 🆕 Check if user is donor or hospital
    if (schedule.donor_id !== user_id && schedule.hospital_id !== user_id) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "You do not have permission to cancel this schedule",
      });
    }

    // 🆕 Can only cancel pending or approved schedules
    if (!["pending", "approved"].includes(schedule.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Cannot cancel a ${schedule.status} schedule`,
      });
    }

    // Update status to cancelled
    const updatedRes = await client.query(
      `
      UPDATE donation_schedules
      SET status = 'cancelled', updated_at = NOW()
      WHERE schedule_id = $1
      RETURNING *
      `,
      [id]
    );

    const updatedSchedule = updatedRes.rows[0];

    // 🆕 Notify the other party
    const notificationTitle =
      schedule.donor_id === user_id
        ? "Donation Schedule Cancelled by Donor"
        : "Donation Schedule Cancelled by Hospital";

    const notificationMessage =
      schedule.donor_id === user_id
        ? `Your scheduled ${schedule.blood_type} donation appointment on ${schedule.scheduled_date} has been cancelled by the donor.`
        : `The scheduled ${schedule.blood_type} blood donation on ${schedule.scheduled_date} has been cancelled by the hospital.`;

    const recipientId =
      schedule.donor_id === user_id ? schedule.hospital_id : schedule.donor_id;

    await client.query(
      `
      INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
      VALUES ($1, $2, $3, $4, 'schedule', $5)
      `,
      [recipientId, user_id, notificationTitle, notificationMessage, id]
    );

    await client.query("COMMIT");

    await logAudit(user_id, "cancel_schedule", "schedule", {
      schedule_id: id,
      cancelled_by: user_id,
      donor_id: schedule.donor_id,
      hospital_id: schedule.hospital_id,
      previous_status: schedule.status,
    });

    res.json({
      message: "Schedule cancelled successfully",
      schedule: updatedSchedule,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error cancelling schedule:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
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

      // Add new blood bag (for this donation)
      const bagResult = await client.query(
        `INSERT INTO blood_bags (hospital_id, blood_type, status, created_at, donation_id)
         VALUES ($1, $2, 'available', NOW(), $3)
         RETURNING bag_id`,
        [schedule.hospital_id, schedule.blood_type, donation.donation_id]
      );
      const bagId = bagResult.rows[0].bag_id;

      // Update stock
      const stockRes = await client.query(
        `SELECT units_available FROM blood_stocks WHERE hospital_id=$1 AND blood_type=$2 FOR UPDATE`,
        [schedule.hospital_id, schedule.blood_type]
      );

      let newUnits = 1;
      if (stockRes.rows.length > 0) {
        newUnits = Number(stockRes.rows[0].units_available) + 1;
        await client.query(
          `UPDATE blood_stocks SET units_available=$1, last_updated=NOW()
           WHERE hospital_id=$2 AND blood_type=$3`,
          [newUnits, schedule.hospital_id, schedule.blood_type]
        );
      } else {
        await client.query(
          `INSERT INTO blood_stocks (hospital_id, blood_type, units_available)
           VALUES ($1, $2, $3)`,
          [schedule.hospital_id, schedule.blood_type, newUnits]
        );
      }

      // ✅ Track changes
      await client.query(
        `INSERT INTO inventory_history 
         (hospital_id, blood_type, change, units_after, reason, changed_by, donor_id, bag_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          schedule.hospital_id,
          schedule.blood_type,
          1,
          newUnits,
          `Donation from schedule #${schedule.schedule_id}`,
          sender_id,
          schedule.donor_id,
          bagId,
        ]
      );

      // ✅ Notify donor & hospital (same as before)
      await client.query(
        `
    INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
    VALUES ($1, $2, $3, $4, 'donation', $5)
    `,
        [
          schedule.donor_id,
          sender_id,
          "Donation Completed 🎉",
          `Your ${schedule.blood_type} donation has been completed.`,
          donation.donation_id,
        ]
      );

      await client.query(
        `
    INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
    VALUES ($1, $2, $3, $4, 'donation', $5)
    `,
        [
          schedule.hospital_id,
          sender_id,
          "Blood Donation Added 🩸",
          `A new ${schedule.blood_type} blood donation has been added to inventory.`,
          donation.donation_id,
        ]
      );

      await logAudit(sender_id, "complete_scheduled_donation", "donation", {
        schedule_id: schedule.schedule_id,
        donation_id: donation.donation_id,
        donor_id: schedule.donor_id,
        hospital_id: schedule.hospital_id,
        blood_type: schedule.blood_type,
        bag_id: bagId,
        units_added: 1,
      });
    }

    await client.query("COMMIT");

    await logAudit(sender_id, "update_schedule", "schedule", {
      schedule_id: id,
      new_status: status || schedule.status,
      new_remarks: remarks || schedule.remarks,
    });

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
