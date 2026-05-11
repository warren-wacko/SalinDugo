import express from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import pool from "../db.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const VALID_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const VALID_STATUS = ["open", "matched", "fulfilled", "cancelled"];

/* =====================================================
   ONE-TIME SCHEMA BOOTSTRAP
   Creates import_batches table and adds batch_id to
   requests so each Excel/CSV upload is traceable and
   revertible. Idempotent — safe to run on every boot.
===================================================== */
(async () => {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS import_batches (
        batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hospital_id INT NOT NULL,
        uploaded_by_name VARCHAR(120),
        filename VARCHAR(255),
        row_count INT NOT NULL DEFAULT 0,
        date_min DATE,
        date_max DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      ALTER TABLE requests
      ADD COLUMN IF NOT EXISTS batch_id UUID
        REFERENCES import_batches(batch_id) ON DELETE CASCADE
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_import_batches_hospital_created
      ON import_batches (hospital_id, created_at DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_requests_batch_id
      ON requests (batch_id)
    `);
  } catch (err) {
    console.error("IMPORT SCHEMA BOOTSTRAP FAILED:", err.message);
  }
})();

/* =====================================================
   HELPER: SAFE PARSER (CSV + XLSX + TAB SUPPORT)
===================================================== */
async function parseFile(buffer, mimetype) {
  // ========================
  // CSV / TEXT FILES
  // ========================
  if (mimetype === "text/csv" || mimetype === "application/vnd.ms-excel") {
    const text = buffer.toString();
    const lines = text.split("\n").filter((l) => l.trim());

    // 🔥 detect delimiter automatically
    const delimiter = lines[0].includes("\t") ? "\t" : ",";

    const headers = lines[0].split(delimiter).map((h) => h.trim());

    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter);
      const obj = {};

      headers.forEach((h, idx) => {
        obj[h] = values[idx]?.trim();
      });

      rows.push(obj);
    }

    return rows;
  }

  // ========================
  // XLSX FILES
  // ========================
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new Error("Invalid Excel file format");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("No worksheet found");

  const headers = [];
  const rows = [];

  sheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value).trim();
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const obj = {};
    row.eachCell((cell, colNumber) => {
      obj[headers[colNumber]] = cell.value;
    });

    rows.push(obj);
  });

  return rows;
}

/* =====================================================
   VALIDATION
===================================================== */
function validateFile(req) {
  if (!req.file) throw new Error("No file uploaded");

  const type = req.file.mimetype;

  if (
    !type.includes("sheet") &&
    type !== "text/csv" &&
    type !== "application/vnd.ms-excel"
  ) {
    throw new Error("Invalid file type. Upload CSV or Excel file.");
  }
}

/* =====================================================
   SAFE DATE PARSER
===================================================== */
function parseDate(value) {
  if (typeof value === "number") {
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }

  const d = new Date(value);
  if (isNaN(d)) throw new Error("Invalid date format");

  return d;
}

/* =====================================================
   GET HOSPITAL ID (SAFE)
===================================================== */
function getHospitalId(req) {
  if (!req.user || !req.user.id) {
    throw new Error("Unauthorized: user not found");
  }
  return req.user.id;
}

/* =====================================================
   REQUESTS  — now batch-tracked
===================================================== */
router.post("/requests", upload.single("file"), async (req, res) => {
  const client = await pool.connect();

  try {
    validateFile(req);

    const hospital_id = getHospitalId(req);
    const rows = await parseFile(req.file.buffer, req.file.mimetype);

    if (!rows.length) throw new Error("Empty file");

    const uploaded_by_name = String(req.body?.uploaded_by || "")
      .trim()
      .slice(0, 120) || null;
    const filename = String(req.file.originalname || "").slice(0, 255);

    console.log("START IMPORT:", rows.length, "by", uploaded_by_name);

    await client.query("BEGIN");

    // First pass: parse + validate, collect parsed rows + min/max date
    const parsed = [];
    let dateMin = null;
    let dateMax = null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const request_date = parseDate(row.request_date);

      const blood_type = String(row.blood_type || "")
        .trim()
        .toUpperCase();

      const status = String(row.status || "fulfilled").toLowerCase();

      const raw_units = row.units_needed;

      if (raw_units === undefined || raw_units === null) {
        throw new Error(`Row ${i + 2}: Missing units_needed`);
      }

      const cleaned = String(raw_units).trim();

      if (cleaned === "") {
        throw new Error(`Row ${i + 2}: Empty units_needed`);
      }

      const units_needed = Number(cleaned);

      if (!Number.isFinite(units_needed) || units_needed < 0) {
        throw new Error(`Row ${i + 2}: Invalid units_needed (${raw_units})`);
      }

      if (!VALID_TYPES.includes(blood_type)) {
        throw new Error(`Row ${i + 2}: Invalid blood type (${blood_type})`);
      }

      if (!VALID_STATUS.includes(status)) {
        throw new Error(`Row ${i + 2}: Invalid status (${status})`);
      }

      if (!dateMin || request_date < dateMin) dateMin = request_date;
      if (!dateMax || request_date > dateMax) dateMax = request_date;

      parsed.push({ blood_type, units_needed, request_date, status });
    }

    // Create the batch row first so we can stamp every request with batch_id
    const batchRes = await client.query(
      `INSERT INTO import_batches
       (hospital_id, uploaded_by_name, filename, row_count, date_min, date_max)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING batch_id, created_at`,
      [hospital_id, uploaded_by_name, filename, parsed.length, dateMin, dateMax],
    );
    const batch_id = batchRes.rows[0].batch_id;

    // Bulk insert the request rows (now with batch_id)
    const values = [];
    const placeholders = [];
    let p = 1;

    for (const r of parsed) {
      values.push(
        hospital_id,
        r.blood_type,
        r.units_needed,
        r.request_date,
        r.status,
        batch_id,
      );
      placeholders.push(
        `($${p}, $${p + 1}, $${p + 2}, $${p + 3}, $${p + 4}, $${p + 5})`,
      );
      p += 6;
    }

    await client.query(
      `INSERT INTO requests
       (hospital_id, blood_type, units_needed, request_date, status, batch_id)
       VALUES ${placeholders.join(",")}`,
      values,
    );

    await client.query("COMMIT");

    console.log("IMPORT DONE:", batch_id);

    res.json({
      message: "Requests imported successfully",
      rows_inserted: parsed.length,
      batch_id,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("IMPORT ERROR:", err.message);

    res.status(400).json({
      message: err.message,
    });
  } finally {
    client.release();
  }
});

/* =====================================================
   STOCKS
===================================================== */
router.post("/stocks", upload.single("file"), async (req, res) => {
  const client = await pool.connect();

  try {
    validateFile(req);

    const hospital_id = getHospitalId(req);
    const rows = await parseFile(req.file.buffer, req.file.mimetype);

    await client.query("BEGIN");

    for (const row of rows) {
      const blood_type = String(row.blood_type || "")
        .trim()
        .toUpperCase();
      const units_available = Number(row.units_available);

      if (!VALID_TYPES.includes(blood_type)) {
        throw new Error(`Invalid blood type: ${blood_type}`);
      }

      if (isNaN(units_available)) {
        throw new Error("Invalid units_available");
      }

      await client.query(
        `INSERT INTO blood_stocks (hospital_id, blood_type, units_available)
         VALUES ($1,$2,$3)
         ON CONFLICT (hospital_id, blood_type)
         DO UPDATE SET units_available = EXCLUDED.units_available`,
        [hospital_id, blood_type, units_available],
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Stocks imported successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

/* =====================================================
   INVENTORY HISTORY
===================================================== */
router.post("/inventory-history", upload.single("file"), async (req, res) => {
  const client = await pool.connect();

  try {
    validateFile(req);

    const hospital_id = getHospitalId(req);
    const rows = await parseFile(req.file.buffer, req.file.mimetype);

    await client.query("BEGIN");

    for (const row of rows) {
      const changed_at = parseDate(row.changed_at);
      const blood_type = String(row.blood_type || "")
        .trim()
        .toUpperCase();
      const change = Number(row.change);

      if (!VALID_TYPES.includes(blood_type)) {
        throw new Error(`Invalid blood type: ${blood_type}`);
      }

      if (isNaN(change)) {
        throw new Error("Invalid change value");
      }

      await client.query(
        `INSERT INTO inventory_history
        (hospital_id, blood_type, change, changed_at)
        VALUES ($1,$2,$3,$4)`,
        [hospital_id, blood_type, change, changed_at],
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Inventory history imported successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

/* =====================================================
   AUDIT / TRACE — list, view, revert import batches
===================================================== */

// List all batches for the current hospital
router.get("/batches", async (req, res) => {
  try {
    const hospital_id = getHospitalId(req);
    const result = await pool.query(
      `SELECT batch_id, uploaded_by_name, filename, row_count,
              date_min, date_max, created_at
       FROM import_batches
       WHERE hospital_id = $1
       ORDER BY created_at DESC`,
      [hospital_id],
    );
    res.json({ batches: result.rows });
  } catch (err) {
    console.error("LIST BATCHES ERROR:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// Single batch + sample of its rows
router.get("/batches/:id", async (req, res) => {
  try {
    const hospital_id = getHospitalId(req);
    const { id } = req.params;

    const batchRes = await pool.query(
      `SELECT batch_id, uploaded_by_name, filename, row_count,
              date_min, date_max, created_at
       FROM import_batches
       WHERE batch_id = $1 AND hospital_id = $2`,
      [id, hospital_id],
    );

    if (!batchRes.rows.length) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const rowsRes = await pool.query(
      `SELECT request_id, blood_type, units_needed, request_date, status
       FROM requests
       WHERE batch_id = $1 AND hospital_id = $2
       ORDER BY request_date ASC
       LIMIT 500`,
      [id, hospital_id],
    );

    res.json({ batch: batchRes.rows[0], rows: rowsRes.rows });
  } catch (err) {
    console.error("GET BATCH ERROR:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// Revert (hard delete) a batch — rows cascade
router.delete("/batches/:id", async (req, res) => {
  try {
    const hospital_id = getHospitalId(req);
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM import_batches
       WHERE batch_id = $1 AND hospital_id = $2
       RETURNING batch_id, row_count`,
      [id, hospital_id],
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Batch not found" });
    }

    res.json({
      message: "Batch reverted successfully",
      batch_id: result.rows[0].batch_id,
      rows_removed: result.rows[0].row_count,
    });
  } catch (err) {
    console.error("REVERT BATCH ERROR:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// Today-status: was anything uploaded today, and what was the latest upload?
// The client passes its IANA timezone (e.g. "Asia/Manila") so the date
// comparison happens in the user's local "today", not UTC.
router.get("/today-status", async (req, res) => {
  try {
    const hospital_id = getHospitalId(req);

    // Validate the tz: only allow safe IANA-style characters. Falls back to
    // UTC if missing or malformed. Postgres will throw on an unknown zone,
    // which the catch block handles.
    const rawTz = String(req.query.tz || "UTC");
    const tz = /^[A-Za-z0-9_+\-/]+$/.test(rawTz) ? rawTz : "UTC";

    const todayRes = await pool.query(
      `SELECT batch_id, uploaded_by_name, filename, row_count,
              date_min, date_max, created_at
       FROM import_batches
       WHERE hospital_id = $1
         AND (created_at AT TIME ZONE $2)::date
             = (NOW() AT TIME ZONE $2)::date
       ORDER BY created_at DESC`,
      [hospital_id, tz],
    );

    const latestRes = await pool.query(
      `SELECT batch_id, uploaded_by_name, filename, row_count,
              date_min, date_max, created_at
       FROM import_batches
       WHERE hospital_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [hospital_id],
    );

    res.json({
      uploaded_today: todayRes.rows.length > 0,
      today_batches: todayRes.rows,
      latest_batch: latestRes.rows[0] || null,
    });
  } catch (err) {
    console.error("TODAY STATUS ERROR:", err.message);
    res.status(400).json({ message: err.message });
  }
});

export default router;
