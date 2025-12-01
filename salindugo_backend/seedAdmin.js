import pool from "./db.js";
import bcrypt from "bcrypt";

const createAdminSeed = async () => {
  try {
    const name = "Super Admin";
    const email = "admin1@salindugo.com";
    const password = "Admin123!";
    const role = "admin";

    // Check if admin already exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows.length > 0) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [name, email, hashedPassword, role]
    );

    console.log("Admin created!");
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin seed:", err);
    process.exit(1);
  }
};

createAdminSeed();
