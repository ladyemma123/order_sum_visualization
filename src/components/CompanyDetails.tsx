import React, { useState, useMemo } from "react";
import { RpaTicket } from "../types";
import { Search, Filter, ShieldAlert, BadgeInfo, CheckCircle, ChevronDown, ChevronUp, Cpu, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CompanyDetailsProps {
  tickets: RpaTicket[];
  onAnalyzeCompany: (company: RpaTicket) => void;
}

export default function CompanyDetails({ tickets, onAnalyzeCompany }: CompanyDetailsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCsm, setSelectedCsm] = useState("all");
  const [selectedCoach, setSelectedCoach] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Extract unique values for filter dropdowns
  const csms = useMemo(() => {
    const list = new Set(tickets.map((t) => t.csm).filter(Boolean));
    return ["all", ...Array.from(list)];
  }, [tickets]);

  const coaches = useMemo(() => {
    const list = new Set(tickets.map((t) => t.rpa_coach).filter(Boolean));
    return ["all", ...Array.from(list)];
  }, [tickets]);

  // Apply filters to tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch = t.enterprise_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.ccusers_name && t.ccusers_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchCsm = selectedCsm === "all" || t.csm === selectedCsm;
      const matchCoach = selectedCoach === "all" || t.rpa_coach === selectedCoach;
      
      // Compute warning level on-the-fly dynamically to keep real-time updates intact!
      const level = t.total_count >= 15 ? "严重" : t.total_count >= 5 ? "高频" : "正常";
      const matchLevel = selectedLevel === "all" || level === selectedLevel;

      return matchSearch && matchCsm && matchCoach && matchLevel;
    }).sort((a, b) => b.total_count - a.total_count); // Descending by inbound total
  }, [tickets, searchTerm, selectedCsm, selectedCoach, selectedLevel]);

  const toggleExpand = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
        <h3 className="text-slate-800 font-bold text-base mb-2">企业运行明细筛查栏</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quick Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="搜寻企业名称 / 联系人..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs text-slate-700 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Filter CSM */}
          <div className="relative">
            <select
              value={selectedCsm}
              onChange={(e) => setSelectedCsm(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-xs text-slate-700 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="all">📞 CSM：全部负责人</option>
              {csms.map((csm) => (
                <option key={csm} value={csm}>
                  CSM负责人: {csm === "all" ? "全部" : csm}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 text-[10px]">▼</span>
          </div>

          {/* Filter Coach */}
          <div className="relative">
            <select
              value={selectedCoach}
              onChange={(e) => setSelectedCoach(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-xs text-slate-700 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="all">👨‍💻 RPA教练：全部主管</option>
              {coaches.map((coach) => (
                <option key={coach} value={coach}>
                  RPA教练: {coach === "all" ? "全部" : coach}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 text-[10px]">▼</span>
          </div>

          {/* Filter Level */}
          <div className="relative">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-xs text-slate-700 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="all">🚨 预警级别：全部评级</option>
              <option value="严重">🛑 严重 (≥15 次)</option>
              <option value="高频">⚡ 高频 (5~14 次)</option>
              <option value="正常">🟢 正常 (0~4 次)</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 text-[10px]">▼</span>
          </div>
        </div>
      </div>

      {/* Grid List Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50/60 text-slate-500 font-semibold text-xs border-b border-gray-100 uppercase tracking-wider">
                <th className="py-4 px-6 w-16">ID</th>
                <th className="py-4 px-6 min-w-[220px]">企业名称</th>
                <th className="py-4 px-4 text-center">CSM</th>
                <th className="py-4 px-4 text-center">RPA教练</th>
                <th className="py-4 px-4 text-center">进线总数</th>
                <th className="py-4 px-4 text-center">人工介入</th>
                <th className="py-4 px-4 text-center">有效解决</th>
                <th className="py-4 px-6 text-center">预警等级</th>
                <th className="py-4 px-6 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs text-slate-700">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => {
                  const level = t.total_count >= 15 ? "严重" : t.total_count >= 5 ? "高频" : "正常";
                  const isExp = expandedRow === t.id;

                  return (
                    <React.Fragment key={t.id}>
                      <tr className={`hover:bg-slate-50/40 transition-colors ${isExp ? "bg-indigo-50/10 font-medium" : ""}`}>
                        <td className="py-4 px-6 font-mono text-gray-400">{t.id}</td>
                        <td className="py-4 px-6">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => toggleExpand(t.id)}>
                              {t.enterprise_name}
                            </span>
                            <div className="text-[10px] text-gray-400 flex items-center space-x-2">
                              <span>期次: {t.start_time} 至 {t.end_time}</span>
                              {t.ccusers_name && (
                                <>
                                  <span className="text-gray-200">|</span>
                                  <span>联系人: {t.ccusers_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-medium pr-2 text-slate-700">{t.csm}</td>
                        <td className="py-4 px-4 text-center font-medium pr-2 text-slate-700">{t.rpa_coach}</td>
                        <td className="py-4 px-4 text-center font-bold text-slate-800 text-sm">{t.total_count}</td>
                        <td className="py-4 px-4 text-center text-gray-500 font-medium">{t.manual_count}</td>
                        <td className="py-4 px-4 text-center text-teal-600 font-semibold">{t.resolved_count}</td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                                level === "严重"
                                  ? "bg-rose-100 text-rose-700 shadow-xs"
                                  : level === "高频"
                                  ? "bg-amber-100 text-amber-700 shadow-xs"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              <span className={`w-1 h-1 rounded-full ${level === "严重" ? "bg-rose-500" : level === "高频" ? "bg-amber-500" : "bg-emerald-500"}`} />
                              {level}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => toggleExpand(t.id)}
                            className="p-1 px-2 hover:bg-slate-100 rounded-md transition-all text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 text-[11px]"
                          >
                            <span>{isExp ? "合上" : "详情"}</span>
                            {isExp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Section */}
                      <AnimatePresence>
                        {isExp && (
                          <tr>
                            <td colSpan={9} className="bg-slate-50/50 p-6 border-y border-slate-100">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {/* Left: Raw log text block */}
                                  <div className="lg:col-span-2 space-y-3">
                                    <h4 className="text-slate-800 font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
                                      <ShieldAlert size={14} className="text-amber-500" />
                                      RPA 系统运行日志及分析摘要
                                    </h4>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 font-mono text-slate-600 text-xs leading-relaxed whitespace-pre-wrap max-h-[180px] overflow-y-auto shadow-inner bg-slate-50/20">
                                      {t.AI_analysis || "暂无未决异常记录。流程在历史周期内运行异常平稳正常，没有触发任何人工转移标记。"}
                                    </div>
                                  </div>

                                  {/* Right: AI Actions Panel */}
                                  <div className="bg-white p-5 rounded-xl border border-gray-100 flex flex-col justify-between shadow-xs">
                                    <div className="space-y-2">
                                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-xs text-[10px] inline-flex items-center gap-1.5">
                                        <Cpu size={12} />
                                        <span>AI COGNITIVE ANALYSIS</span>
                                      </span>
                                      <h4 className="text-slate-800 font-bold text-sm">Gemini 智能异常根因分析</h4>
                                      <p className="text-slate-400 text-xs leading-relaxed">
                                        调取当期日志及人工响应记录，基于自动化控制流程特征，由 Gemini 运行深度神经网络，给出一键异常合并、等待修复等诊断报告。
                                      </p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 mt-4 flex items-center justify-between">
                                      <div className="text-[11px] text-gray-400">
                                        当前异常累计：<span className="font-extrabold text-slate-700">{t.total_count}</span>
                                      </div>
                                      <button
                                        onClick={() => onAnalyzeCompany(t)}
                                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
                                      >
                                        <Cpu size={13} />
                                        <span>一键诊断深究</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    抱歉，没有找到匹配筛选条件的企业记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50/40 text-slate-400 text-[11px] border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            当前展示符合过滤条件的：<strong className="text-slate-700">{filteredTickets.length}</strong> / {tickets.length} 家企业
          </span>
          <span>筛选机制工作正常 &amp; 并具备自动实时排序</span>
        </div>
      </div>
    </div>
  );
}
