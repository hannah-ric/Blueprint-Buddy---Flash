import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // PRD Requirement: Reference Data Lookup Endpoints
  app.get("/api/lookup/materials", (req, res) => {
    res.json([
      { id: "mat_1", name: "Walnut", type: "Hardwood", costPerBdFt: 12.50 },
      { id: "mat_2", name: "White Oak", type: "Hardwood", costPerBdFt: 8.00 },
      { id: "mat_3", name: "Baltic Birch Plywood", type: "Sheet Good", costPerSheet: 85.00 },
      { id: "mat_4", name: "MDF", type: "Sheet Good", costPerSheet: 45.00 }
    ]);
  });

  app.get("/api/lookup/joinery", (req, res) => {
    res.json([
      { id: "join_1", name: "Mortise and Tenon", strength: "High", difficulty: "Hard" },
      { id: "join_2", name: "Dovetail", strength: "High", difficulty: "Hard" },
      { id: "join_3", name: "Pocket Hole", strength: "Medium", difficulty: "Easy" },
      { id: "join_4", name: "Dowels", strength: "Medium", difficulty: "Medium" }
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
