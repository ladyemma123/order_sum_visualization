import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initialRpaTickets } from "./src/mockData";
import { RpaTicket } from "./src/types";

// In-Memory Cloud Database
let database: RpaTicket[] = [...initialRpaTickets];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. API Endpoint - Get all tickets (supports date filtering)
  app.get("/api/tickets", (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let data = [...database];

      if (startDate && typeof startDate === "string") {
        data = data.filter((t) => t.start_time >= startDate);
      }
      if (endDate && typeof endDate === "string") {
        data = data.filter((t) => t.end_time <= endDate);
      }

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 2. API Endpoint - Create a new ticket
  app.post("/api/tickets", (req, res) => {
    try {
      const ticket: Partial<RpaTicket> = req.body;
      if (!ticket.enterprise_name) {
        return res.status(400).json({ success: false, error: "Enterprise name is required." });
      }

      const newId = database.length > 0 ? Math.max(...database.map((t) => t.id)) + 1 : 1;
      const newTicket: RpaTicket = {
        id: newId,
        enterprise_name: ticket.enterprise_name,
        analysis: ticket.analysis || "暂无分析",
        csm: ticket.csm || "徐书",
        rpa_coach: ticket.rpa_coach || "沐森",
        total_count: Number(ticket.total_count) || 0,
        manual_count: Number(ticket.manual_count) || 0,
        resolved_count: Number(ticket.resolved_count) || 0,
        ccusers_name: ticket.ccusers_name || "未知",
        start_time: ticket.start_time || "2026-05-25",
        end_time: ticket.end_time || "2026-05-30",
      };

      database.push(newTicket);
      res.status(201).json({ success: true, data: newTicket });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 3. API Endpoint - Update ticket
  app.put("/api/tickets/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates: Partial<RpaTicket> = req.body;

      const idx = database.findIndex((t) => t.id === id);
      if (idx === -1) {
        return res.status(444).json({ success: false, error: "Ticket not found." });
      }

      database[idx] = {
        ...database[idx],
        ...updates,
        total_count: updates.total_count !== undefined ? Number(updates.total_count) : database[idx].total_count,
        manual_count: updates.manual_count !== undefined ? Number(updates.manual_count) : database[idx].manual_count,
        resolved_count: updates.resolved_count !== undefined ? Number(updates.resolved_count) : database[idx].resolved_count,
      };

      res.json({ success: true, data: database[idx] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 4. API Endpoint - Delete ticket
  app.delete("/api/tickets/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const index = database.findIndex((t) => t.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Ticket not found." });
      }
      database.splice(index, 1);
      res.json({ success: true, message: `Ticket ${id} successfully deleted.` });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 5. API Endpoint - Reset Database to original sheets data
  app.post("/api/tickets/reset", (req, res) => {
    try {
      database = [...initialRpaTickets];
      res.json({ success: true, data: database });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
