const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

// Serve static files from out/renderer
app.use(express.static(path.join(__dirname, "..", "out", "renderer")));

// Mock API endpoints
app.get("/api/staff", (req, res) => {
  res.json([
    { id: 1, name: "スタッフA", is_active: 1, display_order: 1 },
    { id: 2, name: "スタッフB", is_active: 1, display_order: 2 },
    { id: 3, name: "スタッフC", is_active: 1, display_order: 3 },
  ]);
});

app.get("/api/items", (req, res) => {
  res.json([
    {
      id: 1,
      name: "テスト弁当1",
      price: 500,
      is_active: 1,
      display_order: 1,
      options: [],
    },
    {
      id: 2,
      name: "テスト弁当2",
      price: 600,
      is_active: 1,
      display_order: 2,
      options: [],
    },
  ]);
});

app.get("/api/settings", (req, res) => {
  res.json({
    garden_name: "テスト保育園",
    garden_address: "〒000-0000 テスト県テスト市",
    supplier_name: "テスト業者",
    supplier_address: "〒000-0000 テスト県テスト市",
    supplier_phone: "000-0000-0000",
  });
});

app.post("/api/orders", (req, res) => {
  res.json({ success: true, message: "注文を保存しました" });
});

// Fallback to index.html for SPA routes
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "out", "renderer", "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});