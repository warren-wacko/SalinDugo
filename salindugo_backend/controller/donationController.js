import pool from "../db.js";

// ==========================================
// POST /api/donations → Record a completed donation
// ==========================================
export const createDonation = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      donor_id,
      hospital_id,
      blood_type,
      donation_type,
      donation_date,
      status,
    } = req.body;
    const { id: sender_id } = req.user; // ✅ Who created this donation record

    if (
      !donor_id ||
      !hospital_id ||
      !blood_type ||
      !donation_type ||
      !donation_date
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await client.query("BEGIN");

    // 💾 Insert donation record
    const donationResult = await client.query(
      `
      INSERT INTO donations (donor_id, hospital_id, blood_type, donation_type, donation_date, status)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'completed'))
      RETURNING *
      `,
      [donor_id, hospital_id, blood_type, donation_type, donation_date, status]
    );

    const donation = donationResult.rows[0];

    // 🧍 Notify the donor
    await client.query(
      `
      INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
      VALUES ($1, $2, $3, $4, 'donation', $5)
      `,
      [
        donor_id,
        sender_id,
        "Donation Completed 🎉",
        `Your donation of ${blood_type} blood on ${donation_date} has been marked as completed.`,
        donation.donation_id,
      ]
    );

    // 🏥 Notify the hospital
    await client.query(
      `
      INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
      VALUES ($1, $2, $3, $4, 'donation', $5)
      `,
      [
        hospital_id,
        sender_id,
        "New Blood Donation Recorded 🩸",
        `A ${blood_type} donation has been recorded by donor ID ${donor_id}.`,
        donation.donation_id,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Donation recorded successfully",
      donation,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating donation:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};

// ==========================================
// GET /api/donations → Get all donations for a user or hospital
// ==========================================
export const getDonations = async (req, res) => {
  try {
    const { id, role } = req.user;
    let result;

    if (role === "hospital") {
      result = await pool.query(
        `
        SELECT d.*, u.full_name AS donor_name
        FROM donations d
        JOIN users u ON d.donor_id = u.user_id
        WHERE d.hospital_id = $1
        ORDER BY donation_date DESC
        `,
        [id]
      );
    } else {
      result = await pool.query(
        `
        SELECT d.*, h.full_name AS hospital_name
        FROM donations d
        JOIN users h ON d.hospital_id = h.user_id
        WHERE d.donor_id = $1
        ORDER BY donation_date DESC
        `,
        [id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching donations:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==========================================
// PATCH /api/donations/:id → Update donation status
// ==========================================
export const updateDonationStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { id: sender_id } = req.user; // ✅ Who updated the donation

    const validStatuses = ["completed", "pending", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await client.query("BEGIN");

    // 🔄 Update donation
    const result = await client.query(
      `UPDATE donations SET status = $1 WHERE donation_id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Donation not found" });
    }

    const donation = result.rows[0];

    // 📨 Notify donor of status update
    await client.query(
      `
      INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
      VALUES ($1, $2, $3, $4, 'donation', $5)
      `,
      [
        donation.donor_id,
        sender_id,
        "Donation Status Updated",
        `Your donation of ${donation.blood_type} blood is now marked as "${status}".`,
        donation.donation_id,
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Donation updated successfully",
      donation,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating donation:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};
