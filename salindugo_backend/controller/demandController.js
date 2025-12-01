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
