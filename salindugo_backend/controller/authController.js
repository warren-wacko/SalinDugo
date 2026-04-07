import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import pool from "../db.js";
import sendEmail from "../utils/email.js"; // NodeMailer helper
import crypto from "crypto"; // Node.js built-in
import { logAudit } from "../utils/auditLogger.js";

// =========================
// Register User
// =========================
export const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      full_name,
      email,
      password,
      role,
      blood_type,
      date_of_birth,
      contact_number,
      gender,
      civil_status,
      title,
      age,
    } = req.body;

    console.log("REGISTER PAYLOAD:", req.body);

    // check if email exists
    const userExists = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
    const newUser = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, blood_type, date_of_birth, contact_number, gender, civil_status, title, age) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING user_id, email, role, full_name, blood_type, date_of_birth, contact_number, gender, civil_status, title, age`,
      [
        full_name,
        email,
        hashedPassword,
        role || "user",
        blood_type,
        date_of_birth,
        contact_number,
        gender || null,
        civil_status || null,
        title || null,
        age || null,
      ],
    );

    // generate tokens
    const accessToken = jwt.sign(
      { id: newUser.rows[0].user_id, role: newUser.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const refreshToken = jwt.sign(
      { id: newUser.rows[0].user_id },
      process.env.JWT_REFRESH,
      { expiresIn: "7d" },
    );

    // store refresh token in Refresh_Tokens table
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + interval '7 days')",
      [newUser.rows[0].user_id, refreshToken],
    );

    await logAudit(newUser.rows[0].user_id, "register_account", "security", {
      email,
    });

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: {
        id: newUser.rows[0].user_id,
        role: newUser.rows[0].role,
        email: newUser.rows[0].email,
        full_name: newUser.rows[0].full_name,
        blood_type: newUser.rows[0].blood_type,
        date_of_birth: newUser.rows[0].date_of_birth,
        contact_number: newUser.rows[0].contact_number,
        gender: newUser.rows[0].gender,
        civil_status: newUser.rows[0].civil_status,
        title: newUser.rows[0].title,
        age: newUser.rows[0].age,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// =========================
// Login User
// =========================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM Users WHERE email=$1", [
      email,
    ]);
    if (user.rows.length === 0)
      return res.status(400).json({ message: "Invalid credentials" });

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash,
    );
    if (!validPassword)
      return res.status(400).json({ message: "Invalid credentials" });

    // generate tokens
    const accessToken = jwt.sign(
      {
        id: user.rows[0].user_id,
        role: user.rows[0].role,
        region: user.rows[0].region, // <-- ADD THIS
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const refreshToken = jwt.sign(
      {
        id: user.rows[0].user_id,
        role: user.rows[0].role,
        region: user.rows[0].region, // <-- ADD THIS TOO
      },
      process.env.JWT_REFRESH,
      { expiresIn: "7d" },
    );

    // store refresh token
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + interval '7 days')",
      [user.rows[0].user_id, refreshToken],
    );

    await logAudit(user.rows[0].user_id, "login_success", "security", {
      email,
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.rows[0].user_id,
        role: user.rows[0].role,
        email: user.rows[0].email,
        full_name: user.rows[0].full_name,
        blood_type: user.rows[0].blood_type,
        date_of_birth: user.rows[0].date_of_birth,
        city: user.rows[0].city,
        province: user.rows[0].province,
        contact_number: user.rows[0].contact_number,
        last_donation_date: user.rows[0].last_donation_date,
        profile_completed: user.rows[0].profile_completed,
        age: user.rows[0].age,
        title: user.rows[0].title,
        region: user.rows[0].region,
        created_at: user.rows[0].created_at,
      },
    });
  } catch (err) {
    const safeEmail = req.body?.email || "unknown";

    await logAudit(null, "login_failed", "security", { email: safeEmail });

    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// =========================
// Logout User
// =========================
export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(400);

    await pool.query(
      "UPDATE refresh_tokens SET revoked=true WHERE token_hash=$1",
      [refreshToken],
    );
    await logAudit(req.user.id, "logout", "security");

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// =========================
// Refresh Token
// =========================
export const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);

    // 🔍 Check if refresh token exists in DB
    const tokenRecord = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token_hash=$1 AND revoked=false AND expires_at > NOW()",
      [refreshToken],
    );

    if (tokenRecord.rows.length === 0) return res.sendStatus(403);

    // 🔍 Validate the refresh token signature
    jwt.verify(refreshToken, process.env.JWT_REFRESH, (err, decoded) => {
      if (err) return res.sendStatus(403);

      // ❗ decoded MUST contain BOTH id and role
      const accessToken = jwt.sign(
        { id: decoded.id, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      res.json({ accessToken });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Both current and new passwords are required" });
  }

  try {
    const userRes = await pool.query(
      "SELECT password_hash FROM users WHERE user_id = $1",
      [userId],
    );

    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2",
      [hashedPassword, userId],
    );
    await logAudit(userId, "change_password", "security", { userId });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600 * 1000);

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [token, expiry, email],
    );

    /*  fixed the correct key */
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await sendEmail(
      email,
      "Password Reset",
      `
      Click this link to reset your password: ${resetLink}
      The link expires in 1 hour.
    `,
    );
    await logAudit(
      userRes.rows[0].user_id,
      "request_password_reset",
      "security",
      { email },
    );

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // 1️⃣ Find user by token and check expiry
    const userRes = await pool.query(
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token],
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = userRes.rows[0];

    // 2️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3️⃣ Update user's password and clear reset token/expiry
    await pool.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() WHERE user_id = $2",
      [hashedPassword, user.user_id],
    );
    await logAudit(user.user_id, "reset_password", "security");

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
