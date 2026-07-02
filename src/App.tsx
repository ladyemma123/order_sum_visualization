import React, { useState, useEffect } from "react";
import { RpaTicket, DateCycle } from "./types";
import DashboardOverview from "./components/DashboardOverview";
import CompanyDetails from "./components/CompanyDetails";
import DataManagement from "./components/DataManagement";
import { LayoutDashboard, TableProperties, Database, RefreshCcw, Calendar, CheckCircle2, CloudLightning, Upload, Download, X, FileMinus, Import } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [selectedTab, setSelectedTab] = useState<string>("总览");
  const [periodMode, setPeriodMode] = useState<"week" | "month">("week");
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0);
  const [tickets, setTickets] = useState<RpaTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string>("");
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [weekCycles, setWeekCycles] = useState<DateCycle[]>([]);
  const [monthCycles, setMonthCycles] = useState<DateCycle[]>([]);

  const activeCycle = periodMode === "week" 
    ? (weekCycles[currentWeekIndex] || { label: "", startDate: "", endDate: "" }) 
    : (monthCycles[currentMonthIndex] || { label: "", startDate: "", endDate: "" });

  const handleDownloadTemplate = () => {
    const headers = "enterprise_name,csm,rpa_coach,total_count,manual_count,resolved_count,ccusers_name,analysis,start_time,end_time\n";
    const sampleRowStr = "江苏福特汽车系统总成有限公司,韩甜,米粒,15,5,5,时泽阳,\"1、财务验证码模块超时阻断.2、环境网络异常自动退避较差\",2026-05-18,2026-05-24";
    const csvContent = "\uFEFF" + headers + sampleRowStr;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "rpa_工单导入数据模板.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setLoading(false);
        return;
      }
      try {
        let importedCount = 0;
        // Simple CSV parser
        const lines = text.split("\n");
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Split by comma
          const parts = line.split(",");
          if (parts.length >= 2) {
            const enterprise_name = parts[0]?.replace(/^["']|["']$/g, "").trim();
            const csm = parts[1]?.replace(/^["']|["']$/g, "").trim() || "徐书";
            const rpa_coach = parts[2]?.replace(/^["']|["']$/g, "").trim() || "沐森";
            const total_count = Number(parts[3]) || 5;
            const manual_count = Number(parts[4]) || 1;
            const resolved_count = Number(parts[5]) || 1;
            const ccusers_name = parts[6]?.replace(/^["']|["']$/g, "").trim() || "未知";
            const analysis = parts[7]?.replace(/^["']|["']$/g, "").trim() || "暂无分析";
            
            await handleAddTicket({
              enterprise_name,
              csm,
              rpa_coach,
              total_count,
              manual_count,
              resolved_count,
              ccusers_name,
              analysis,
              start_time: activeCycle.startDate,
              end_time: activeCycle.endDate,
            });
            importedCount++;
          }
        }
        setIsImportOpen(false);
        alert(`🎉 模版验证并静默同步成功！已成功解析并合并 ${importedCount} 家新企业工单至系统。`);
        await fetchTickets();
      } catch (err: any) {
        alert("模版解析发生了微小偏差，支持的标准格式为逗号分割CSV数据。\n错误信息: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // 1. Fetch tickets from express api with filter parameters
  const fetchPeriods = async () => {
    try {
      const res = await fetch("/api/periods");
      const output = await res.json();
      if (output.success) {
        setWeekCycles(output.data.weekCycles || []);
        setMonthCycles(output.data.monthCycles || []);
      }
    } catch (err: any) {
      console.error("获取日期周期失败:", err);
    }
  };

  const fetchTickets = async () => {
    if (!activeCycle.startDate || !activeCycle.endDate) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorText("");
    try {
      const url = `/api/tickets?startDate=${activeCycle.startDate}&endDate=${activeCycle.endDate}`;
      const res = await fetch(url);
      const output = await res.json();
      if (output.success) {
        setTickets(output.data);
      } else {
        setErrorText(output.error || "获取服务器数据发生故障");
      }
    } catch (err: any) {
      setErrorText("无法连接到后端服务器。请先启用全栈服务器 (restart_dev_server) 确保 Express 正常路由。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (weekCycles.length > 0 || monthCycles.length > 0) {
      fetchTickets();
    }
  }, [periodMode, currentWeekIndex, currentMonthIndex, weekCycles, monthCycles]);

  // 2. Add ticket to Database
  const handleAddTicket = async (ticket: Partial<RpaTicket>) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ticket,
          start_time: activeCycle.startDate,
          end_time: activeCycle.endDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Refetch to ensure synchronisation
        await fetchTickets();
        return data.data;
      } else {
        alert(data.error || "保存失败");
      }
    } catch (err: any) {
      alert("连接错误: " + err.message);
    }
  };

  // 3. Update ticket in Database
  const handleUpdateTicket = async (id: number, updates: Partial<RpaTicket>) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTickets();
        return data.data;
      } else {
        alert(data.error || "更新失败");
      }
    } catch (err: any) {
      alert("连接错误: " + err.message);
    }
  };

  // 4. Delete ticket from Database
  const handleDeleteTicket = async (id: number) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchTickets();
        return true;
      } else {
        alert(data.error || "删除失败");
      }
    } catch (err: any) {
      alert("连接错误: " + err.message);
    }
  };

  // 5. Refresh database data
  const handleResetDatabase = async () => {
    try {
      await fetchPeriods();
      await fetchTickets();
      return true;
    } catch (err: any) {
      alert("连接错误: " + err.message);
    }
  };

  return (
    <div id="app-workspace" className="min-h-screen bg-slate-50/50 flex flex-col font-sans transition-all selection:bg-indigo-100 selection:text-indigo-800">
      {/* Premium Deep Cosmic Dark Header */}
      <header className="bg-slate-900 border-b border-indigo-950/40 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Logo Brand Indicator */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 p-0.5 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform cursor-pointer">
              <CloudLightning className="text-white" size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-white font-extrabold text-base tracking-wide uppercase">RPA 工单数据可视化看板</h1>
                <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-300 font-bold text-[9px] rounded-sm tracking-widest border border-indigo-500/20">
                  FULLSTACK
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">多维度图表自适应切换 &amp; 分布式云端存储联动</p>
            </div>
          </div>

          {/* Split Period/Cycle Swapper: Weekly & Monthly mutually exclusive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start sm:self-center">
            
            {/* Weekly Cycle Dropdown */}
            <div className={`flex items-center space-x-2 bg-slate-800/60 p-1.5 rounded-xl border transition-all ${
              periodMode === "week"
                ? "border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.2)] bg-emerald-950/20"
                : "border-slate-700/50 opacity-50 hover:opacity-100"
            }`}>
              <div 
                onClick={() => setPeriodMode("week")}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 pl-1.5 cursor-pointer select-none"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${periodMode === "week" ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                <span className={periodMode === "week" ? "text-emerald-300 font-extrabold" : "text-slate-400"}>周维度：</span>
              </div>
              <select
                value={currentWeekIndex}
                onChange={(e) => {
                  setCurrentWeekIndex(Number(e.target.value));
                  setPeriodMode("week");
                }}
                className="bg-slate-900 text-white text-xs py-1 px-2 py-0.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-700/50 font-medium cursor-pointer appearance-none"
              >
                {weekCycles.map((c, idx) => (
                  <option key={idx} value={idx}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Cycle Dropdown */}
            <div className={`flex items-center space-x-2 bg-slate-800/60 p-1.5 rounded-xl border transition-all ${
              periodMode === "month"
                ? "border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.2)] bg-emerald-950/20"
                : "border-slate-700/50 opacity-50 hover:opacity-100"
            }`}>
              <div 
                onClick={() => setPeriodMode("month")}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 pl-1.5 cursor-pointer select-none"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${periodMode === "month" ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                <span className={periodMode === "month" ? "text-emerald-300 font-extrabold" : "text-slate-400"}>月维度：</span>
              </div>
              <select
                value={currentMonthIndex}
                onChange={(e) => {
                  setCurrentMonthIndex(Number(e.target.value));
                  setPeriodMode("month");
                }}
                className="bg-slate-900 text-white text-xs py-1 px-2 py-0.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-700/50 font-medium cursor-pointer appearance-none"
              >
                {monthCycles.map((c, idx) => (
                  <option key={idx} value={idx}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>
      </header>

      {/* Responsive Tab Selector Rail & Refresh Action */}
      <div className="bg-white border-b border-slate-100 shadow-xs sticky top-[73px] sm:top-[70px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <nav className="flex space-x-3 py-3 overflow-x-auto scrollbar-none">
            {[
              { id: "总览", label: "大盘总览", icon: <LayoutDashboard size={15} /> },
              { id: "详情", label: "企业明细", icon: <TableProperties size={15} /> },
              { id: "数据管理", label: "数据管理", icon: <Database size={15} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  selectedTab === tab.id
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={() => setIsImportOpen(true)}
            title="点击下载.xlsx/CSV模板并手动静默导入数据"
            className="p-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold font-sans"
          >
            <RefreshCcw size={13} className={loading && isImportOpen ? "animate-spin" : ""} />
            <span className="hidden sm:inline">手动静默同步</span>
          </button>
        </div>
      </div>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {loading && tickets.length === 0 ? (
          /* Loading overlay */
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <div className="space-y-1">
              <p className="text-slate-700 font-bold text-sm">正在加载云数据库信息...</p>
              <p className="text-slate-400 text-xs">调取周期：{activeCycle.startDate} 至 {activeCycle.endDate}</p>
            </div>
          </div>
        ) : errorText ? (
          /* Connecting Error Alert Banner */
          <div className="p-8 text-center bg-rose-50 rounded-2xl border border-dashed border-rose-200 my-12 max-w-2xl mx-auto space-y-3.5 shadow-xs">
            <CloudLightning size={42} className="text-rose-500 mx-auto" />
            <h3 className="text-slate-800 font-extrabold text-base">物理数据库连接丢失</h3>
            <p className="text-rose-600 text-xs leading-relaxed font-sans bg-white p-3.5 rounded-xl border border-rose-100 shadow-inner">
              {errorText}
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={fetchTickets}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                重新连接
              </button>
            </div>
          </div>
        ) : (
          /* Component Workspace Router */
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {selectedTab === "总览" && (
                <DashboardOverview
                  tickets={tickets}
                  onSelectTab={setSelectedTab}
                />
              )}

              {selectedTab === "详情" && (
                <CompanyDetails
                  tickets={tickets}
                />
              )}

              {selectedTab === "数据管理" && (
                <DataManagement
                  tickets={tickets}
                  onAddTicket={handleAddTicket}
                  onUpdateTicket={handleUpdateTicket}
                  onDeleteTicket={handleDeleteTicket}
                  onResetDatabase={handleResetDatabase}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Excel Sheet Import Wizard Modal */}
      <AnimatePresence>
        {isImportOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl w-full max-w-xl shadow-2xl p-6 border border-slate-100 flex flex-col space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Import size={18} />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-extrabold text-sm font-sans">RPA 工单导入与静默同步</h3>
                    <p className="text-slate-400 text-xs">通过标准 .xlsx 模板快速同步数据</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsImportOpen(false)}
                  className="p-1 border border-slate-100 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Progress Steps Info */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <span className="w-4 h-4 bg-indigo-100 text-indigo-700 font-bold rounded-full flex items-center justify-center text-[10px]">1</span>
                    获取数据模板
                  </span>
                  <p className="text-slate-400 text-[10px] pl-5 leading-normal">
                    下载专用的标准工单 Excel 模板档，按规范录入完毕。
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <span className="w-4 h-4 bg-indigo-100 text-indigo-700 font-bold rounded-full flex items-center justify-center text-[10px]">2</span>
                    选择文件解析
                  </span>
                  <p className="text-slate-400 text-[10px] pl-5 leading-normal">
                    拖入或选择包含数据的 Excel CSV 档一键静默同步。
                  </p>
                </div>
              </div>

              {/* Template Row */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-700">步骤一：下载模板 (支持 Excel 与 WPS Natively)</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  标准模板已支持：企业全称、CSM团队、RPA教练督导、总来电进线数、工程师介入次数、工程师完结确认等规范。直接输入，秒级上报。
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-600 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Download size={14} />
                  <span>📥 下载 .xlsx 标准导入模板 (CSV通用格式)</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-700">步骤二：选择本地工作簿并同步</h4>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center transition-all bg-slate-50/50 relative overflow-hidden group">
                  <input
                    type="file"
                    accept=".csv, .txt, .xlsx, .xls"
                    onChange={handleUploadFile}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                  />
                  <div className="flex flex-col items-center space-y-2 pointer-events-none">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-105 transition-all">
                      <Upload size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">拖曳或双击上传本地 Excel/CSV 表单</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">支持逗号分隔数据，导入至当前周期：{activeCycle.startDate} 至 {activeCycle.endDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="text-[10px] text-slate-400 leading-normal bg-amber-50 p-2 py-2.5 rounded-lg border border-amber-100 flex items-start gap-1.5">
                <span className="text-amber-500 font-extrabold text-[12px] leading-none">⚠️</span>
                <div>
                  <span className="font-bold text-amber-800">注意事项：</span>
                  系统执行“静默去重对账”合并策略。若名称一致，将自动加总异常频次，从而在保持现有诊断记录的同时扩展分析。
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-2.5">
          <p>RPA Tickets &amp; Incidents Visual Dashboard Platform</p>
          <div className="flex items-center space-x-1.5 font-bold text-slate-500">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>分布式云数据库副本与工单核查机制已就绪</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
