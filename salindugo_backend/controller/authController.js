import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import pool from "../db.js";

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
    } = req.body;

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
      "INSERT INTO users (full_name, email, password_hash, role, blood_type, date_of_birth, contact_number, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING user_id, email, role, full_name, blood_type, date_of_birth, contact_number, gender",
      [
        full_name,
        email,
        hashedPassword,
        role || "user",
        blood_type,
        date_of_birth,
        contact_number,
        gender || null,
      ]
    );

    // generate tokens
    const accessToken = jwt.sign(
      { id: newUser.rows[0].user_id, role: newUser.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: newUser.rows[0].user_id },
      process.env.JWT_REFRESH,
      { expiresIn: "7d" }
    );

    // store refresh token in Refresh_Tokens table
    await pool.query(
      "INSERT INTO Refresh_Tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + interval '7 days')",
      [newUser.rows[0].user_id, refreshToken]
    );

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
      user.rows[0].password_hash
    );
    if (!validPassword)
      return res.status(400).json({ message: "Invalid credentials" });

    // generate tokens
    const accessToken = jwt.sign(
      { id: user.rows[0].user_id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.rows[0].user_id, role: user.rows[0].role },
      process.env.JWT_REFRESH,
      { expiresIn: "7d" }
    );

    // store refresh token
    await pool.query(
      "INSERT INTO Refresh_Tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + interval '7 days')",
      [user.rows[0].user_id, refreshToken]
    );

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
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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
      "UPDATE Refresh_Tokens SET revoked=true WHERE token_hash=$1",
      [refreshToken]
    );

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
      [refreshToken]
    );

    if (tokenRecord.rows.length === 0) return res.sendStatus(403);

    // 🔍 Validate the refresh token signature
    jwt.verify(refreshToken, process.env.JWT_REFRESH, (err, decoded) => {
      if (err) return res.sendStatus(403);

      // ❗ decoded MUST contain BOTH id and role
      const accessToken = jwt.sign(
        { id: decoded.id, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
