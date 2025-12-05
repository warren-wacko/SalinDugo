// controllers/matchingController.js
import pool from "../db.js";
import {
  COMPATIBLE_RECIPIENTS,
  COMPATIBLE_DONORS,
  haversineDistanceKm,
  URGENCY_WEIGHT,
} from "../utils/matchingHelpers.js";

// GET /api/matching/donor
// Return open requests (hospital requests) that the donor can help with
// server/controllers/matching.js (replace your current function)
export const getMatchesForDonor = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Fetch donor info (for distance + blood type)
    const userRes = await pool.query(
      `SELECT user_id, blood_type, latitude, longitude FROM users WHERE user_id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const donor = userRes.rows[0];

    if (!donor.blood_type)
      return res.status(400).json({ message: "Donor has no blood type set" });

    const compatibleRecipientTypes =
      COMPATIBLE_RECIPIENTS[donor.blood_type] || [];

    // 2️⃣ Group all open requests by hospital
    const q = `
      SELECT 
        h.user_id AS hospital_id,
        h.full_name AS hospital_name,
        h.latitude AS hospital_lat,
        h.longitude AS hospital_lon,
        h.contact_number,
        h.address,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'blood_type', r.blood_type,
            'units_needed', r.units_needed,
            'urgency_level', r.urgency_level
          )
        ) AS blood_type_summary
      FROM requests r
      JOIN users h ON r.hospital_id = h.user_id
      WHERE r.status = 'open'
        AND r.blood_type = ANY($1::text[])
      GROUP BY h.user_id, h.full_name, h.latitude, h.longitude, h.contact_number, h.address
    `;
    const rs = await pool.query(q, [compatibleRecipientTypes]);

    // 3️⃣ Enrich with distance, scoring, and per-type aggregation
    const enriched = rs.rows.map((r) => {
      const distance_km = haversineDistanceKm(
        donor.latitude,
        donor.longitude,
        r.hospital_lat,
        r.hospital_lon
      );

      // aggregate units per blood type
      const summaryMap = {};
      (r.blood_type_summary || []).forEach((b) => {
        if (!summaryMap[b.blood_type]) {
          summaryMap[b.blood_type] = 0;
        }
        summaryMap[b.blood_type] += Number(b.units_needed) || 0;
      });

      const blood_type_summary = Object.entries(summaryMap)
        .filter(([blood_type]) => compatibleRecipientTypes.includes(blood_type))
        .map(([blood_type, units_needed]) => ({ blood_type, units_needed }));

      const total_units_needed = blood_type_summary.reduce(
        (sum, b) => sum + b.units_needed,
        0
      );

      const max_units_needed = Math.max(
        ...blood_type_summary.map((b) => b.units_needed),
        0
      );

      const urgency = (
        r.blood_type_summary?.[0]?.urgency_level || "routine"
      ).toLowerCase();
      const urgencyWeight = URGENCY_WEIGHT[urgency] || URGENCY_WEIGHT.default;

      const score = urgencyWeight - distance_km * 0.1;

      return {
        hospital_id: r.hospital_id,
        hospital_name: r.hospital_name,
        address: r.address,
        contact_number: r.contact_number,
        latitude: r.hospital_lat,
        longitude: r.hospital_lon,
        blood_type_summary,
        total_units_needed,
        max_units_needed,
        urgency_level: urgency,
        distance_km,
        score,
      };
    });

    // 4️⃣ Sort best matches (urgency + distance)
    enriched.sort((a, b) => b.score - a.score);

    res.json({ matches: enriched.slice(0, 50) });
  } catch (err) {
    console.error("getMatchesForDonor error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/matching/recipient
// Return blood centers (hospitals) that have available stock matching recipient's blood type
export const getMatchesForRecipient = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Fetch recipient info
    const userRes = await pool.query(
      `SELECT user_id, blood_type, latitude, longitude FROM users WHERE user_id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const recipient = userRes.rows[0];

    if (!recipient.blood_type)
      return res
        .status(400)
        .json({ message: "Recipient has no blood type set" });

    // Get compatible donor types that can give to this recipient
    const compatibleDonorTypes = COMPATIBLE_DONORS[recipient.blood_type] || [];

    // 2️⃣ Query blood centers with inventory matching compatible blood types
    // 🆕 UPDATED: Changed blood_inventory to blood_stocks
    const q = `
      SELECT 
        h.user_id AS hospital_id,
        h.full_name AS hospital_name,
        h.latitude AS hospital_lat,
        h.longitude AS hospital_lon,
        h.contact_number,
        h.address,
        h.city,
        h.province,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'blood_type', bs.blood_type,
            'units_available', bs.units_available,
            'last_updated', bs.last_updated
          )
        ) AS blood_type_summary
      FROM blood_stocks bs
      JOIN users h ON bs.hospital_id = h.user_id
      WHERE bs.blood_type = ANY($1::text[])
        AND bs.units_available > 0
      GROUP BY h.user_id, h.full_name, h.latitude, h.longitude, h.contact_number, h.address, h.city, h.province
      ORDER BY h.user_id
    `;

    const rs = await pool.query(q, [compatibleDonorTypes]);

    // 3️⃣ Enrich with distance and scoring
    const enriched = rs.rows.map((r) => {
      const distance_km = haversineDistanceKm(
        recipient.latitude,
        recipient.longitude,
        r.hospital_lat,
        r.hospital_lon
      );

      // Aggregate units per blood type
      const summaryMap = {};
      (r.blood_type_summary || []).forEach((b) => {
        if (!summaryMap[b.blood_type]) {
          summaryMap[b.blood_type] = {
            units_available: 0,
            last_updated: null,
          };
        }
        summaryMap[b.blood_type].units_available +=
          Number(b.units_available) || 0;
        // Keep the most recent update date
        if (
          !summaryMap[b.blood_type].last_updated ||
          new Date(b.last_updated) >
            new Date(summaryMap[b.blood_type].last_updated)
        ) {
          summaryMap[b.blood_type].last_updated = b.last_updated;
        }
      });

      const blood_type_summary = Object.entries(summaryMap)
        .filter(([blood_type]) => compatibleDonorTypes.includes(blood_type))
        .map(([blood_type, data]) => ({
          blood_type,
          units_available: data.units_available,
          last_updated: data.last_updated,
        }));

      const total_units_available = blood_type_summary.reduce(
        (sum, b) => sum + b.units_available,
        0
      );

      const max_units_available = Math.max(
        ...blood_type_summary.map((b) => b.units_available),
        0
      );

      // Score: prefer closer blood centers with more stock
      const score = total_units_available * 10 - distance_km * 0.5;

      return {
        hospital_id: r.hospital_id,
        hospital_name: r.hospital_name,
        address: r.address,
        city: r.city,
        province: r.province,
        contact_number: r.contact_number,
        latitude: r.hospital_lat,
        longitude: r.hospital_lon,
        blood_type_summary,
        total_units_available,
        max_units_available,
        distance_km,
        score,
      };
    });

    // 4️⃣ Sort by score (stock availability + distance)
    enriched.sort((a, b) => b.score - a.score);

    res.json({ matches: enriched.slice(0, 50) });
  } catch (err) {
    console.error("getMatchesForRecipient error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
