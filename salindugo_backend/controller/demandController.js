import pool from "../db.js";
import { spawn } from "child_process";

export const getDemandForecast = async (req, res) => {
  try {
    const days = parseInt(req.query.days || "30", 10);

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const region = req.user.region;
    const hospitalId = req.user.id;

    // 1) Fetch aggregated regional history
    const historyResult = await pool.query(
      `SELECT date, SUM(requests) AS requests
FROM demand_history
WHERE hospital_id = $1
  AND requests > 0   -- <--- REMOVE ZERO DAYS
GROUP BY date
ORDER BY date ASC;
`,
      [hospitalId]
    );

    const history = historyResult.rows;
    if (history.length < 60) {
      return res.json({ error: "Not enough data" });
    }

    // 2) Prepare payload
    const payload = JSON.stringify({
      region,
      days,
      history,
    });

    // 3) Spawn Python
    const py = spawn("python", ["./ml_engine/predict.py"]);
    let output = "";
    let errorOutput = "";

    py.stdout.on("data", (data) => (output += data.toString()));
    py.stderr.on("data", (data) => (errorOutput += data.toString()));

    py.stdin.write(payload);
    py.stdin.end();

    py.on("close", () => {
      if (errorOutput) {
        console.error("PYTHON ERROR:", errorOutput);
        return res.json({ error: "Python error" });
      }

      return res.json(JSON.parse(output));
    });
  } catch (err) {
    console.error("Forecast Error:", err);
    res.status(500).json({ error: "Failed to forecast" });
  }
};

export const getAdminDemandForecast = async (req, res) => {
  try {
    const { region, days, history } = req.body;

    if (!region || !days || !history) {
      return res.status(400).json({
        message: "Missing required fields: region, days, history",
      });
    }

    // 🔥 MAP UI REGION → ACTUAL MODEL FILE
    const REGION_MODEL_MAP = {
      NCR: "NCR",
      "Region 3": "Region_III",
      "Region III": "Region_III",
      "REGION III": "Region_III",

      "Region 4-A": "Region_IV-A",
      "Region IV-A": "Region_IV-A",

      "Region 6": "Region_VI",
      "Region VI": "Region_VI",

      "Region 7": "Region_VII",
      "Region VII": "Region_VII",
    };

    const modelFile = REGION_MODEL_MAP[region];

    if (!modelFile) {
      return res.status(400).json({
        message: `No ML model found for region: ${region}`,
      });
    }

    // Pass corrected model filename to Python
    const pyInput = {
      region: modelFile, // Python script expects the filename now
      days,
      history,
    };

    // Spawn Python process
    const py = spawn("python", ["./ml_engine/predict.py"]);

    let output = "";
    let error = "";

    py.stdout.on("data", (data) => {
      output += data.toString();
    });

    py.stderr.on("data", (data) => {
      error += data.toString();
    });

    py.on("close", (code) => {
      if (code !== 0) {
        console.error("Python Error:", error);
        return res.status(500).json({
          message: "Prediction script failed",
          error,
        });
      }

      try {
        const json = JSON.parse(output);
        return res.json(json);
      } catch (err) {
        return res.status(500).json({
          message: "Invalid JSON returned from Python script",
          details: err.message,
        });
      }
    });

    // Send input to Python
    py.stdin.write(JSON.stringify(pyInput));
    py.stdin.end();
  } catch (error) {
    console.error("Forecast controller error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
