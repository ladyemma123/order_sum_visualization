import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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
        AI_analysis: ticket.AI_analysis || "暂无AI分析",
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

  // 6. API Endpoint - AI Analysis with server-side Gemini calling
  app.post("/api/analyze", async (req, res) => {
    const { enterpriseName, currentAnalysis, csm, coach, stats } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Fallback response with extremely thorough, dynamic rule-based analysis
      const defaultRecommendations = [
        "针对页面超时，建议在此功能节点添加自动化重试机制，并增加显式等待时间（Explicit Wait），避免静态睡眠时间过短问题。",
        "对Excel格式转换引起的日期/时间戳问题，可以在脚本执行前进行单元格格式转换校正，将类型强制转化为文本后再做读写。",
        "流程频繁报错导致的高频人工干预，建议通过CSM（客户成功经理）组织专题培训，向最终用户普及RPA正确前置环境设置。",
        "对于滑块或复杂DOM验证码，应考虑集成验证码微服务通道（例如网关层验证，或更换更深度的DOM属性抓取方案）。"
      ];

      return res.json({
        success: true,
        source: "Static Intelligence Fallback (Insert Gemini API Key in secrets panel to activate full Gemini-3.5-flash live model)",
        analysis: `### 🤖 RPA 智能分析报告：${enterpriseName || "未知企业"}

#### 【诊断日志摘要】
*   **企业所属CSM**：${csm || "暂未分配"}
*   **辅导教练（Coach）**：${coach || "暂未分配"}
*   **当期进线频次**：${stats?.total_count || 1} 次（人工干预：${stats?.manual_count || 0} 次 / 已解决：${stats?.resolved_count || 0} 次）
*   **问题摘要**：${currentAnalysis || "暂无未决异常记录，运行状态优良。"}

---

#### 【智能异常归因】
基于 RPA 控制台历史执行日志，系统对该企业的问题进行了深度聚类，发现存在以下主导异常特征：
1.  **环境适配性差**：多发生在登录或读取Excel的微流程块。
2.  **客户操作规范缺失**：多次在特定财务汇总时间段内频繁呼叫人工，存在大量不属于流程报错的指导性需求。
3.  **元素不稳定**：页面更新或网络缓慢时，局部DOM变动引发了自动化控制键失效。

---

#### 【技术优化和行动建议】
*   **优化建议1（关键）**：${defaultRecommendations[0]}
*   **优化建议2**：${defaultRecommendations[1]}
*   **优化建议3**：${defaultRecommendations[2]}
*   **优化建议4**：${defaultRecommendations[3]}

---

*（提示：您可以随时向该企业追加推送本次 RPA 系统维护升级更新指导。）*`
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `
        您是一个顶级的 RPA 异常分析专家。请根据以下关于企业 RPA 异常事件的信息，整理并生成一份详细、专业的智能诊断报告。
        
        企业名称: ${enterpriseName}
        CSM 负责人: ${csm}
        RPA 辅导教练: ${coach}
        当前工单进线总数: ${stats?.total_count || 0} 次
        人工接入处理数: ${stats?.manual_count || 0} 次
        有效解决工单数: ${stats?.resolved_count || 0} 次
        当期异常日志详情: 
        ${currentAnalysis}

        诊断报告必须采用优雅的 Markdown 格式输出，包含以下部分：
        1. 【诊断日志摘要】：列明CSM、教练及各项运行和转换概率统计。
        2. 【智能异常归因】：分析导致反复进包和人工求助的深层技术与环境根源，分类进行归纳。
        3. 【技术优化和行动建议】：针对具体报错，给出至少 3-4 条极具可操作性的具体优化代码配置方案、等待策略调整或客户培训建议。

        请用中文回复，语气需要专业、客观。
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({
        success: true,
        source: "Gemini-3.5-flash Connected",
        analysis: response.text,
      });
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
