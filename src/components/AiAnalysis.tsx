import React, { useState, useEffect } from "react";
import { RpaTicket } from "../types";
import { Cpu, Send, RefreshCw, HelpCircle, FileText, Bot, AlertTriangle, Sparkles, Wand2 } from "lucide-react";
import { motion } from "motion/react";

interface AiAnalysisProps {
  tickets: RpaTicket[];
  preSelectedCompany: RpaTicket | null;
}

export default function AiAnalysis({ tickets, preSelectedCompany }: AiAnalysisProps) {
  // Select which company to analyze (defaults to first high-frequency warning company if none selected)
  const sortedWarning = [...tickets]
    .filter((t) => t.total_count >= 5)
    .sort((a, b) => b.total_count - a.total_count);

  const defaultSelection = preSelectedCompany || (sortedWarning.length > 0 ? sortedWarning[0] : tickets[0]);

  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(defaultSelection?.id || 0);
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string>("");
  const [sourceInfo, setSourceInfo] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");

  useEffect(() => {
    if (preSelectedCompany) {
      setSelectedCompanyId(preSelectedCompany.id);
    }
  }, [preSelectedCompany]);

  const currentCompany = tickets.find((t) => t.id === selectedCompanyId) || defaultSelection;

  const handleRunAnalysis = async () => {
    if (!currentCompany) return;
    setLoading(true);
    setErrorText("");
    setReport("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterpriseName: currentCompany.enterprise_name,
          currentAnalysis: currentCompany.AI_analysis,
          csm: currentCompany.csm,
          coach: currentCompany.rpa_coach,
          stats: {
            total_count: currentCompany.total_count,
            manual_count: currentCompany.manual_count,
            resolved_count: currentCompany.resolved_count,
          },
          additionalPrompt: customPrompt || undefined,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setReport(resData.analysis);
        setSourceInfo(resData.source || "");
      } else {
        setErrorText(resData.error || "RPA 诊断服务请求失败，请稍后重试。");
      }
    } catch (err: any) {
      setErrorText(err.message || "后端连接发生错误。 请核实网络并确保 Node 服务在运行。");
    } finally {
      setLoading(false);
    }
  };

  // Simple, robust text renderer to compile markdown headers, bold, bullet points into React safely on React 19
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");

    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-slate-800 mt-5 mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
            <Sparkles size={14} className="text-indigo-500" />
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("#### ")) {
        return (
          <h5 key={idx} className="text-xs font-bold text-indigo-700 mt-4 mb-2 flex items-center gap-1">
            <span>↳</span>
            {line.replace("#### ", "")}
          </h5>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-base font-bold text-slate-900 mt-6 mb-3 border-l-3 border-indigo-600 pl-2 uppercase">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-lg font-extrabold text-slate-900 mt-6 mb-4 border-b pb-2">
            {line.replace("# ", "")}
          </h2>
        );
      }

      // Horizontal line
      if (line.trim() === "---") {
        return <hr key={idx} className="my-4 border-gray-100" />;
      }

      // Bullet List item
      if (line.startsWith("* ") || line.startsWith("- ")) {
        const cleaned = line.substring(2);
        return (
          <li key={idx} className="ml-5 list-disc text-slate-600 leading-relaxed text-xs mb-2">
            {renderBoldText(cleaned)}
          </li>
        );
      }

      // Ordered list item
      if (/^\d+\.\s+/.test(line)) {
        const match = line.match(/^(\d+)\.\s+(.*)/);
        if (match) {
          const num = match[1];
          const content = match[2];
          return (
            <div key={idx} className="ml-2 flex items-start space-x-2 text-xs text-slate-600 leading-relaxed mb-3">
              <span className="font-bold text-indigo-600 font-mono">{num}.</span>
              <span className="flex-1">{renderBoldText(content)}</span>
            </div>
          );
        }
      }

      // Normal Line
      return (
        <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-2 whitespace-normal break-words">
          {renderBoldText(line)}
        </p>
      );
    });
  };

  // Render text containing custom bold strings **like this**
  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    if (parts.length === 1) return text;

    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <strong key={i} className="font-bold text-slate-800 bg-indigo-50/50 px-1 rounded-sm">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Parameters Panel */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-6 flex flex-col justify-between">
        <div className="space-y-5">
          <div className="border-b border-gray-50 pb-4">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-xs text-[10px] inline-flex items-center gap-1.5 uppercase">
              <Bot size={11} />
              <span>Diagnostic Core</span>
            </span>
            <h3 className="text-slate-800 font-extrabold text-base mt-2">RPA 智能诊断控制台</h3>
            <p className="text-slate-400 text-xs mt-1">选择企业来即时载入历史日志并自动诊断出最优可执行技术方案</p>
          </div>

          {/* Select Enterprise */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">选择诊断企业单位</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
              className="w-full pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-xs text-slate-700 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-medium"
            >
              {tickets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.enterprise_name} ({t.total_count}次进线)
                </option>
              ))}
            </select>
          </div>

          {/* Current Selection Stats Card */}
          {currentCompany && (
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wide">Enterprise Summary</span>
                {currentCompany.total_count >= 5 && (
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-bold rounded-sm">
                    ⚠️ 故障高频单位
                  </span>
                )}
              </div>
              <p className="text-slate-800 font-bold text-xs line-clamp-1">{currentCompany.enterprise_name}</p>

              <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-[11px] pt-2 border-t border-slate-100">
                <div>
                  <span className="text-gray-400 block">CSM 负责人</span>
                  <strong className="text-slate-700 font-semibold">{currentCompany.csm}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">RPA 教练</span>
                  <strong className="text-slate-700 font-semibold">{currentCompany.rpa_coach}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">当期来电/进线</span>
                  <strong className="text-slate-700 font-semibold">{currentCompany.total_count} 次</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">工单已结解决</span>
                  <strong className="text-teal-600 font-semibold">{currentCompany.resolved_count} 个</strong>
                </div>
              </div>
            </div>
          )}

          {/* Prompt Tuning */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-slate-600">附加诊断引导短语 (可选)</label>
              <span className="text-[10px] text-gray-400">支持中文定制</span>
            </div>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="例如：提示建议重点分析环境超时；或者：要求推荐一个自动化滑块识别方案..."
              className="w-full border border-gray-200 rounded-xl p-3 text-xs text-slate-700 placeholder-gray-400 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans min-h-[90px]"
            />
          </div>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={loading || !currentCompany}
          className={`w-full py-3 h-11 flex items-center justify-center gap-2 font-bold text-sm text-white rounded-xl shadow-md cursor-pointer transition-all ${
            loading
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-slate-900 active:scale-98"
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin" size={16} />
              <span>正在调取并编译深度 AI 诊断...</span>
            </>
          ) : (
            <>
              <Cpu size={16} />
              <span>执行 AI 智能诊断分析</span>
            </>
          )}
        </button>
      </div>

      {/* Results Workspace (2 Columns) */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between min-h-[480px]">
        {/* Header */}
        <div className="border-b border-gray-50 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-slate-800 font-bold text-base flex items-center gap-1.5">
              <FileText size={18} className="text-indigo-500" />
              <span>RPA 智能诊断工作报告</span>
            </h3>
            <p className="text-slate-400 text-xs">通过深度逻辑分析、自动给出代码优化建议与执行指导</p>
          </div>
          {sourceInfo && (
            <span className="px-3 py-1 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-lg border border-teal-100">
              {sourceInfo}
            </span>
          )}
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-1 py-6 overflow-y-auto max-h-[450px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center p-12">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <Cpu size={24} className="text-indigo-600 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-slate-800 font-bold text-sm">Gemini 正在深度阅览异常日志...</h4>
                <p className="text-slate-400 text-xs max-w-sm">
                  分析引擎正在对该企业的历史进程行为树、Excel 数据转换节点以及超时拦截日志（共 {currentCompany?.total_count} 次故障）进行神经网络特征聚类归纳。
                </p>
              </div>
            </div>
          ) : errorText ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-rose-50/30 rounded-xl border border-dashed border-rose-100">
              <AlertTriangle size={36} className="text-rose-500 mb-3" />
              <h4 className="text-slate-800 font-bold text-sm">诊断进程服务异常</h4>
              <p className="text-rose-600 text-xs max-w-md mt-2 leading-relaxed bg-white p-3 rounded-lg border">
                {errorText}
              </p>
            </div>
          ) : report ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-sm max-w-none text-slate-700 space-y-1"
            >
              {renderMarkdown(report)}
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400 space-y-3">
              <div className="p-4 bg-slate-50 rounded-full text-slate-400">
                <Wand2 size={36} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-slate-700 font-bold text-sm">就绪：等待智能解析请求</h4>
                <p className="text-slate-400 text-xs max-w-md leading-relaxed">
                  请在左侧控制台确认被检企业主干及引导条件，点击 **“执行 AI 智能诊断分析”**。我们将自动调取云端存储的 RPA 时序日志流，实时反馈高质量的可操作技术报告。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Report Footer */}
        <div className="border-t border-gray-50 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>
            诊断分析协议：<strong className="text-slate-700 font-medium">Gemini-3.5-flash standard-abac v2.1</strong>
          </span>
          <span>© RPA 工单看板智能核查引擎</span>
        </div>
      </div>
    </div>
  );
}
