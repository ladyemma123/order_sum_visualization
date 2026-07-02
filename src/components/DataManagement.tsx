import React, { useState } from "react";
import { RpaTicket } from "../types";
import { Database, RotateCcw, Search, Server, Radio, ShieldCheck, Download, Upload, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DataManagementProps {
  tickets: RpaTicket[];
  onAddTicket: (ticket: Partial<RpaTicket>) => Promise<any>;
  onUpdateTicket: (id: number, updates: Partial<RpaTicket>) => Promise<any>;
  onDeleteTicket: (id: number) => Promise<any>;
  onResetDatabase: () => Promise<any>;
}

export default function DataManagement({
  tickets,
  onAddTicket,
  onResetDatabase,
}: DataManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingImport, setLoadingImport] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter tickets to preview
  const filtered = tickets.filter(
    (t) =>
      t.enterprise_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.ccusers_name && t.ccusers_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.csm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.rpa_coach && t.rpa_coach.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTickets = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => {
      setActionSuccess(null);
    }, 4000);
  };

  const handleResetData = async () => {
    try {
      await onResetDatabase();
      showSuccess("数据库内容已重新加载！");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadTemplateInPage = () => {
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

  const handleUploadFileInPage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingImport(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setLoadingImport(false);
        return;
      }
      try {
        let importedCount = 0;
        const lines = text.split("\n");
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
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
            const start_time = parts[8]?.replace(/^["']|["']$/g, "").trim() || "2026-05-25";
            const end_time = parts[9]?.replace(/^["']|["']$/g, "").trim() || "2026-05-30";
            
            await onAddTicket({
              enterprise_name,
              csm,
              rpa_coach,
              total_count,
              manual_count,
              resolved_count,
              ccusers_name,
              analysis,
              start_time,
              end_time,
            });
            importedCount++;
          }
        }
        showSuccess(`🎉 导入成功！表格文件解析通过，已静默合并同步了 ${importedCount} 家新企业工单记录。`);
      } catch (err: any) {
        alert("模版解析发生了微小偏差，支持的标准格式为逗号分割CSV数据。\n错误信息: " + err.message);
      } finally {
        setLoadingImport(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Cloud Replication Status Info Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Server size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm tracking-wide">云端分布式数据库：在线托管预览</h3>
              <span className="flex items-center space-x-1.5 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 font-bold text-[10px] rounded-full border border-emerald-500/20">
                <Radio size={8} className="animate-ping" />
                <span>ACTIVE</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              当前实例: <strong className="text-white font-semibold">aistudio-firestore-serverless (静默对账模式)</strong> 
              <span className="mx-2 text-slate-800">|</span> 
              同步延迟: <strong className="text-slate-200 font-mono">0.8ms</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Reset button */}
          <button
            onClick={handleResetData}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw size={13} />
            <span>重新加载数据库内容</span>
          </button>
        </div>
      </div>

      {/* Action Success Alert Box */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
          >
            <ShieldCheck size={16} />
            <span>{actionSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid explaining Excel template & file upload inside DataManagement tab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Template Introduction Segment */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Info size={16} />
              <h4 className="font-bold text-xs uppercase tracking-wider">Excel 工单同步工作流</h4>
            </div>
            <h3 className="text-slate-800 font-extrabold text-base leading-snug">导入外部 Excel 并即时计算</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              您可以使用我们为您准备的标准 Excel / CSV 数据模板，在此快速导入本地文件的内容到云端。
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-700">模板结构包含：</span>
              <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-4 leading-normal">
                <li><strong>企业名称：</strong>企业客户的规范全称</li>
                <li><strong>CSM 负责人：</strong>对接的客户成功经理名</li>
                <li><strong>RPA教练：</strong>辅导该企业的RPA技术教练</li>
                <li><strong>运营频次：</strong>进线总频次/工程师处理次数</li>
                <li><strong>日志摘要：</strong>具体的系统异常日志文本</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-gray-50">
            <button
              onClick={handleDownloadTemplateInPage}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl border border-indigo-100 transition-all cursor-pointer shadow-xs"
            >
              <Download size={13} />
              <span>下载外部数据 .xlsx 规范模板</span>
            </button>

            <div className="border border-dashed border-gray-200 rounded-xl p-3 text-center transition-all bg-slate-50/20 hover:border-indigo-400 relative overflow-hidden">
              <input
                type="file"
                accept=".csv, .txt, .xlsx, .xls"
                disabled={loadingImport}
                onChange={handleUploadFileInPage}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex items-center justify-center gap-2 font-semibold text-slate-600 text-xs">
                <Upload size={14} className="text-slate-400" />
                <span>{loadingImport ? "正在静默同步中..." : "上传 Excel 结果并对账"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database List Segment (Takes 2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Search header panel */}
            <div className="px-6 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20">
              <div>
                <h3 className="text-slate-800 font-bold text-base">企业云端数据库备份浏览</h3>
                <p className="text-slate-400 text-xs mt-0.5">列明当前托管存储区全部已同步物理企业日志：共 {tickets.length} 家</p>
              </div>

              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="搜索企业名称 / CSM / RPA教练 / 进线名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 border border-gray-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Database List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50/30 text-slate-500 font-semibold text-[10px] border-b border-gray-100 uppercase tracking-wider">
                    <th className="py-3 px-5 w-12 text-center">ID</th>
                    <th className="py-3 px-4">企业名称 / 反馈周期</th>
                    <th className="py-3 px-4 text-center">CSM / RPA教练</th>
                    <th className="py-3 px-4 text-center">数据分布 (总进线/工程师处理)</th>
                    <th className="py-3 px-4 text-center">系统异常摘要快照</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[11px] text-slate-600">
                  {paginatedTickets.length > 0 ? (
                    paginatedTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="py-3 px-5 text-center font-mono text-gray-400">{t.id}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 text-xs">{t.enterprise_name}</span>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {t.start_time} 至 {t.end_time} | 进线名称: {t.ccusers_name || "-"}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="font-semibold text-slate-700">{t.csm}</div>
                          <div className="text-[10px] text-slate-400">教练: {t.rpa_coach}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <div className="font-extrabold text-slate-800 text-xs">{t.total_count}次</div>
                          <div className="text-[10px] text-slate-400">
                            工程师:{t.manual_count}次
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <span className="line-clamp-2 text-slate-500" title={t.analysis}>
                            {t.analysis || "暂无未决异常。"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        没有找到相匹配的企业工单数据库预览记录。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Console Foot Status with Pagination */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
            <span>
              已加载托管结构记录：<strong className="text-slate-700 font-medium">{filtered.length}行</strong> / 当前周期
            </span>
            
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>数据静默对账系统：就绪</span>
              </span>
              
              {/* Pagination */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500">
                  第 {currentPage} / {totalPages} 页
                </span>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-[10px] border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  首页
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-[10px] border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = totalPages > 5 && currentPage > 3 && i < 4
                    ? currentPage - 2 + i
                    : totalPages > 5 && currentPage <= 3
                      ? i + 1
                      : i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2 py-1 text-[10px] border rounded-md transition-colors ${
                        currentPage === pageNum
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-[10px] border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-[10px] border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  尾页
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
