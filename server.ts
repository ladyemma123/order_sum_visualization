import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { pool, testConnection, dbConfig } from "./src/config/db";
import { RpaTicket } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const TABLE_NAME = dbConfig.table;

  async function query(sql: string, params?: any[]) {
    const [rows] = await pool.execute(sql, params);
    return rows as any[];
  }

  function mapRowToTicket(row: any): RpaTicket {
    return {
      id: row.id,
      enterprise_name: row.enterprise_name,
      analysis: row.AI_analysis || row.analysis || "暂无分析",
      csm: row.csm || "",
      rpa_coach: row.rpa_coach || "",
      total_count: Number(row.total_count) || 0,
      manual_count: Number(row.manual_count) || 0,
      resolved_count: Number(row.resolved_count) || 0,
      ccusers_name: row.users_name || row.ccusers_name || "未知",
      start_time: row.start_time || "",
      end_time: row.end_time || "",
    };
  }

  app.get("/api/tickets", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let sql = `SELECT * FROM ${TABLE_NAME}`;
      const params: any[] = [];

      if (startDate || endDate) {
        sql += " WHERE";
        if (startDate && typeof startDate === "string") {
          sql += ` start_time >= ?`;
          params.push(startDate);
        }
        if (startDate && endDate) {
          sql += " AND";
        }
        if (endDate && typeof endDate === "string") {
          sql += ` end_time <= ?`;
          params.push(endDate);
        }
      }

      const rows: any[] = await query(sql, params);
      const tickets = rows.map(mapRowToTicket);
      console.log(`📊 API /api/tickets called: startDate=${startDate}, endDate=${endDate}, returned ${tickets.length} records`);
      res.json({ success: true, data: tickets });
    } catch (error: any) {
      console.error(`❌ API /api/tickets error: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/periods", async (req, res) => {
    try {
      const weekRows: any[] = await query(`SELECT DISTINCT start_time, end_time FROM ${TABLE_NAME} ORDER BY start_time`);
      console.log(`📅 weekRows raw:`, JSON.stringify(weekRows));
      
      const weekCycles = weekRows.map(row => ({
        label: `${String(row.start_time).replace(/-/g, ".")} ~ ${String(row.end_time).replace(/-/g, ".")}`,
        startDate: String(row.start_time),
        endDate: String(row.end_time),
      }));

      const monthRows: any[] = await query(`SELECT DISTINCT DATE_FORMAT(start_time, '%Y-%m-01') as start_time, DATE_FORMAT(end_time, '%Y-%m-%d') as end_time FROM ${TABLE_NAME} ORDER BY start_time`);
      console.log(`📅 monthRows raw:`, JSON.stringify(monthRows));
      
      const monthMap: Record<string, { startDate: string; endDate: string }> = {};
      monthRows.forEach(row => {
        const monthKey = String(row.start_time).substring(0, 7);
        if (!monthMap[monthKey] || String(row.end_time) > monthMap[monthKey].endDate) {
          monthMap[monthKey] = {
            startDate: String(row.start_time),
            endDate: String(row.end_time),
          };
        }
      });

      const monthCycles = Object.values(monthMap).map(item => ({
        label: `${item.startDate.replace(/-/g, ".")} ~ ${item.endDate.replace(/-/g, ".")}`,
        startDate: item.startDate,
        endDate: item.endDate,
      }));

      console.log(`📅 API /api/periods called: weekCycles=${weekCycles.length}, monthCycles=${monthCycles.length}`);
      res.json({ success: true, data: { weekCycles, monthCycles } });
    } catch (error: any) {
      console.error(`❌ API /api/periods error: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/tickets", async (req, res) => {
    try {
      const ticket: Partial<RpaTicket> = req.body;
      if (!ticket.enterprise_name) {
        return res.status(400).json({ success: false, error: "Enterprise name is required." });
      }

      const sql = `INSERT INTO ${TABLE_NAME} 
        (enterprise_name, AI_analysis, csm, rpa_coach, total_count, manual_count, resolved_count, users_name, start_time, end_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const [result]: any = await pool.execute(sql, [
        ticket.enterprise_name,
        ticket.analysis || "暂无分析",
        ticket.csm || "徐书",
        ticket.rpa_coach || "沐森",
        Number(ticket.total_count) || 0,
        Number(ticket.manual_count) || 0,
        Number(ticket.resolved_count) || 0,
        ticket.ccusers_name || "未知",
        ticket.start_time || "2026-05-25",
        ticket.end_time || "2026-05-30",
      ]);

      const newTicketRow = await query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [result.insertId]);
      res.status(201).json({ success: true, data: mapRowToTicket(newTicketRow[0]) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates: Partial<RpaTicket> = req.body;

      const existingRows = await query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
      if (!existingRows || (existingRows as any[]).length === 0) {
        return res.status(444).json({ success: false, error: "Ticket not found." });
      }

      const setClause: string[] = [];
      const params: any[] = [];

      if (updates.enterprise_name !== undefined) {
        setClause.push("enterprise_name = ?");
        params.push(updates.enterprise_name);
      }
      if (updates.analysis !== undefined) {
        setClause.push("AI_analysis = ?");
        params.push(updates.analysis);
      }
      if (updates.csm !== undefined) {
        setClause.push("csm = ?");
        params.push(updates.csm);
      }
      if (updates.rpa_coach !== undefined) {
        setClause.push("rpa_coach = ?");
        params.push(updates.rpa_coach);
      }
      if (updates.total_count !== undefined) {
        setClause.push("total_count = ?");
        params.push(Number(updates.total_count));
      }
      if (updates.manual_count !== undefined) {
        setClause.push("manual_count = ?");
        params.push(Number(updates.manual_count));
      }
      if (updates.resolved_count !== undefined) {
        setClause.push("resolved_count = ?");
        params.push(Number(updates.resolved_count));
      }
      if (updates.ccusers_name !== undefined) {
        setClause.push("users_name = ?");
        params.push(updates.ccusers_name);
      }
      if (updates.start_time !== undefined) {
        setClause.push("start_time = ?");
        params.push(updates.start_time);
      }
      if (updates.end_time !== undefined) {
        setClause.push("end_time = ?");
        params.push(updates.end_time);
      }

      if (setClause.length === 0) {
        return res.json({ success: true, data: mapRowToTicket(existingRows[0]) });
      }

      params.push(id);
      await query(`UPDATE ${TABLE_NAME} SET ${setClause.join(", ")} WHERE id = ?`, params);

      const updatedRows = await query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
      res.json({ success: true, data: mapRowToTicket(updatedRows[0]) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingRows = await query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
      if (!existingRows || (existingRows as any[]).length === 0) {
        return res.status(404).json({ success: false, error: "Ticket not found." });
      }

      await query(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
      res.json({ success: true, message: `Ticket ${id} successfully deleted.` });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

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

  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error("数据库连接失败，服务无法启动");
    process.exit(1);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
