import pool from "../db.js";

// ==========================================
// GET /api/notifications → Get user’s notifications
// ==========================================
export const getNotifications = async (req, res) => {
  try {
    const { id } = req.user; // current user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    // 1️⃣ Count total notifications for current user
    const totalCountResult = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1`,
      [id],
    );
    const totalCount = parseInt(totalCountResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // 2️⃣ Fetch notifications (with sender info)
    const notificationsResult = await pool.query(
      `
      SELECT 
        n.notification_id,
        n.title,
        n.message,
        n.type,
        n.is_read,
        n.related_id,
        n.created_at,
        -- Receiver info
        u.full_name AS receiver_name,
        u.role AS receiver_role,
        -- Sender info
        s.full_name AS sender_name,
        s.role AS sender_role
      FROM notifications n
      JOIN users u ON n.user_id = u.user_id
      LEFT JOIN users s ON n.sender_id = s.user_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [id, limit, offset],
    );

    res.json({
      notifications: notificationsResult.rows,
      pagination: { page, limit, totalCount, totalPages },
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==========================================
// PATCH /api/notifications/:id/read → Mark as read
// ==========================================
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE notification_id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, userId],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Notification not found" });

    res.json({
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating notification:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `
      UPDATE notifications
        SET is_read = true
        WHERE user_id = $1
        RETURNING *
        `,
      [userId],
    );

    res.json({
      message: "All notifications marked as read",
      updatedCount: result.rows.length,
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==========================================
// POST /api/notifications/forecast-alerts → Insert forecast alerts (deduped per day)
// ==========================================
export const createForecastAlerts = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { alerts } = req.body;

    if (!Array.isArray(alerts) || alerts.length === 0) {
      return res.json({ inserted: 0 });
    }

    let inserted = 0;

    for (const { title, message, type } of alerts) {
      if (!title || !message || !type) continue;

      // Skip if this alert type was already sent today for this user
      const existing = await pool.query(
        `SELECT 1 FROM notifications
         WHERE user_id = $1 AND type = $2 AND DATE(created_at) = CURRENT_DATE
         LIMIT 1`,
        [userId, type],
      );
      if (existing.rows.length > 0) continue;

      await pool.query(
        `INSERT INTO notifications (user_id, sender_id, title, message, type, related_id)
         VALUES ($1, $2, $3, $4, 'system', NULL)`,
        [userId, userId, title, message],
      );
      inserted++;
    }

    res.json({ inserted });
  } catch (err) {
    console.error("Error creating forecast alerts:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==========================================
// DELETE /api/notifications/:id → Delete notification
// ==========================================
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `
      DELETE FROM notifications
      WHERE notification_id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, userId],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Notification not found" });

    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
