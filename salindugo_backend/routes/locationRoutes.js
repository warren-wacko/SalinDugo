import express from "express";

const router = express.Router();

// Forward Geocoding (text → lat/lng)
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Missing query" });

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&addressdetails=1&limit=5`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "SalinDugo/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Location search error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Reverse Geocoding (lat/lng → address)
router.get("/reverse", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon)
      return res.status(400).json({ message: "Missing coordinates" });

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "SalinDugo/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Location reverse error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
