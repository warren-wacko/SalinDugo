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
   REQUESTS
===================================================== */
router.post("/requests", upload.single("file"), async (req, res) => {
  const client = await pool.connect();

  try {
    validateFile(req);

    const hospital_id = getHospitalId(req);
    const rows = await parseFile(req.file.buffer, req.file.mimetype);

    if (!rows.length) throw new Error("Empty file");

    console.log("START IMPORT:", rows.length);

    await client.query("BEGIN");

    const values = [];
    const placeholders = [];

    let paramIndex = 1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // =========================
      // SAFE PARSING
      // =========================
      const request_date = parseDate(row.request_date);

      const blood_type = String(row.blood_type || "")
        .trim()
        .toUpperCase();

      const status = String(row.status || "fulfilled").toLowerCase();

      // =========================
      // STRICT units_needed FIX
      // =========================
      const raw_units = row.units_needed;

      if (raw_units === undefined || raw_units === null) {
        throw new Error(`Row ${i + 2}: Missing units_needed`);
      }

      const cleaned = String(raw_units).trim();

      if (cleaned === "") {
        throw new Error(`Row ${i + 2}: Empty units_needed`);
      }

      const units_needed = Number(cleaned);

      // ✅ allow 0 for forecasting
      if (!Number.isFinite(units_needed) || units_needed < 0) {
        throw new Error(`Row ${i + 2}: Invalid units_needed (${raw_units})`);
      }

      // =========================
      // VALIDATIONS
      // =========================
      if (!VALID_TYPES.includes(blood_type)) {
        throw new Error(`Row ${i + 2}: Invalid blood type (${blood_type})`);
      }

      if (!VALID_STATUS.includes(status)) {
        throw new Error(`Row ${i + 2}: Invalid status (${status})`);
      }

      // =========================
      // BUILD BULK INSERT
      // =========================
      values.push(hospital_id, blood_type, units_needed, request_date, status);

      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`,
      );

      paramIndex += 5;
    }

    // =========================
    // BULK INSERT (FAST)
    // =========================
    await client.query(
      `INSERT INTO requests 
       (hospital_id, blood_type, units_needed, request_date, status)
       VALUES ${placeholders.join(",")}`,
      values,
    );

    await client.query("COMMIT");

    console.log("IMPORT DONE");

    res.json({
      message: "Requests imported successfully",
      rows_inserted: rows.length,
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

export default router;
