import React, { useState } from "react";
import { RpaTicket, DashboardMetrics } from "../types";
import { Building, Inbox, CheckCircle, AlertTriangle, ArrowRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardOverviewProps {
  tickets: RpaTicket[];
  onSelectTab: (tab: string) => void;
}

export default function DashboardOverview({
  tickets,
  onSelectTab,
}: DashboardOverviewProps) {
  // Dimension state for the trend chart: 'csm' | 'coach'
  const [trendDimension, setTrendDimension] = useState<"csm" | "coach">("csm");
  const [hoveredBar, setHoveredBar] = useState<number | string | null>(null);

  // Calculate Metrics
  const activeTickets = tickets.filter((t) => t.total_count > 0);
  const enterpriseCount = activeTickets.length;
  const totalInboundCount = tickets.reduce((sum, t) => sum + t.total_count, 0);
  const resolvedCount = tickets.reduce((sum, t) => sum + t.resolved_count, 0);
  const warningCount = tickets.filter((t) => t.total_count >= 5).length;

  const averageInbound = enterpriseCount > 0 ? (totalInboundCount / 6).toFixed(1) : "0"; // 6-day cycle in standard cycle
  const resolutionRate = totalInboundCount > 0 ? ((resolvedCount / totalInboundCount) * 100).toFixed(1) : "0.0";

  // Pre-calculate Warning list (sorted descending by total_count, filters total_count >= 5)
  const warningEnterprises = [...tickets]
    .filter((t) => t.total_count >= 5)
    .sort((a, b) => b.total_count - a.total_count);

  // Group Data for charts based on dimensions
  const getTrendData = () => {
    const groups: { [key: string]: { total: number; manual: number } } = {};
    const keyField = trendDimension === "csm" ? "csm" : "rpa_coach";
    
    tickets.forEach((t) => {
      const key = trendDimension === "csm" ? t.csm : t.rpa_coach;
      if (!key) return;
      if (!groups[key]) {
        groups[key] = { total: 0, manual: 0 };
      }
      groups[key].total += Number(t.total_count) || 0;
      groups[key].manual += Number(t.manual_count) || 0;
    });

    const color = trendDimension === "csm" ? "#818cf8" : "#fb923c";

    return Object.entries(groups)
      .map(([name, vals]) => ({
        date: name,
        total: vals.total,
        manual: vals.manual,
        color: color,
      }))
      .sort((a, b) => b.total - a.total);
  };

  const trendData = getTrendData();
  const maxValInTrend = trendData.length > 0 ? Math.max(...trendData.map((d) => d.total)) : 10;

  // SVG parameters for resolution rate donut
  const donutRadius = 70;
  const donutStrokeWidth = 16;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const resolvedRateFloat = parseFloat(resolutionRate);
  const strokeDashoffset = donutCircumference - (resolvedRateFloat / 100) * donutCircumference;

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: 进线企业数 */}
        <div id="card-enterprise" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-indigo-500 opacity-80" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 font-medium text-sm">进线企业数</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-500 group-hover:scale-110 transition-transform">
              <Building size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{enterpriseCount}</span>
            <span className="text-slate-400 text-sm font-medium">家</span>
          </div>
          <p className="text-gray-400 text-xs mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
            <span>当期录入企业</span>
            <span className="font-semibold text-slate-600">共 {tickets.length} 家登记</span>
          </p>
        </div>

        {/* Card 2: 进线总次数 */}
        <div id="card-total" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-amber-500 opacity-80" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 font-medium text-sm">进线总次数</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500 group-hover:scale-110 transition-transform">
              <Inbox size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{totalInboundCount}</span>
            <span className="text-slate-400 text-sm font-medium">次</span>
          </div>
          <p className="text-gray-400 text-xs mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
            <span>日均来电/进线</span>
            <span className="font-semibold text-amber-600">日均 {averageInbound} 次</span>
          </p>
        </div>

        {/* Card 3: 工程师处理次数 */}
        <div id="card-resolved" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-emerald-500 opacity-80" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 font-medium text-sm">工程师处理次数</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 group-hover:scale-110 transition-transform">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{resolvedCount}</span>
            <span className="text-slate-400 text-sm font-medium">次</span>
          </div>
          <p className="text-gray-400 text-xs mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
            <span>工程师解决占比</span>
            <span className="font-semibold text-emerald-600">占比率 {resolutionRate}%</span>
          </p>
        </div>

        {/* Card 4: 高频预警企业 */}
        <div id="card-warning" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-rose-500 opacity-80" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 font-medium text-sm">高频预警企业</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-500 group-hover:scale-110 transition-transform">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{warningCount}</span>
            <span className="text-slate-400 text-sm font-medium">家</span>
          </div>
          <p className="text-gray-400 text-xs mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
            <span>≥5次进线需重点关注</span>
            <span className="font-semibold text-rose-600">7家重度预警企业</span>
          </p>
        </div>
      </div>

      {/* Main Interactive Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Section (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-3">
              <div>
                <h3 className="text-slate-800 font-bold text-lg">工单运行与进线趋势分析</h3>
                <p className="text-slate-400 text-xs">实时分析当季多维度流量指标、操作介入情况</p>
                <p className="text-emerald-500 text-xs mt-1 font-bold">数据: {tickets.length}条记录 | 趋势项: {trendData.length}个</p>
              </div>
              {/* Toggles */}
              <div className="flex rounded-lg bg-slate-100 p-1 self-start">
                <button
                  onClick={() => setTrendDimension("csm")}
                  className={`text-xs px-3 py-1.5 font-medium rounded-md transition-all ${
                    trendDimension === "csm"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  按CSM
                </button>
                <button
                  onClick={() => setTrendDimension("coach")}
                  className={`text-xs px-3 py-1.5 font-medium rounded-md transition-all ${
                    trendDimension === "coach"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  按RPA教练
                </button>
              </div>
            </div>

            {/* Simple CSS Bar Chart */}
            <div className="relative pt-4 h-72">
              {/* Grid Y Lines */}
              <div className="absolute inset-x-0 top-4 bottom-0 flex flex-col justify-between hover:pointer-events-none opacity-50 z-0">
                {[0, 25, 50, 75, 100].map((percent) => (
                  <div key={percent} className="w-full flex items-center">
                    <span className="text-[10px] text-gray-400 w-8 text-right pr-2">
                      {Math.round((maxValInTrend * (100 - percent)) / 100)}
                    </span>
                    <div className="flex-1 border-t border-dashed border-gray-100" />
                  </div>
                ))}
              </div>

              {/* Bars Container */}
              <div className="flex items-end justify-around px-8 h-56 pt-4">
                {trendData.map((d) => {
                  const chartHeight = 180;
                  const barHeight = (d.total / maxValInTrend) * chartHeight;
                  const manualHeight = (d.manual / (d.total || 1)) * barHeight;
                  const isHovered = hoveredBar === d.date;

                  return (
                    <div
                      key={d.date}
                      className="flex flex-col items-center flex-1 relative max-w-[60px] cursor-pointer"
                      onMouseEnter={() => setHoveredBar(d.date)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute bottom-full mb-2 bg-slate-900/95 text-white p-3 rounded-lg text-xs shadow-lg z-50 pointer-events-none w-32 space-y-1">
                          <p className="font-bold border-b border-white/10 pb-1 mb-1 text-center">
                            {d.date}
                          </p>
                          <p className="flex justify-between">
                            <span>工单进线</span>
                            <span className="font-bold text-amber-300">{d.total} 次</span>
                          </p>
                          <p className="flex justify-between">
                            <span>人工处理</span>
                            <span className="font-bold text-indigo-300">{d.manual} 次</span>
                          </p>
                        </div>
                      )}

                      {/* Value Label */}
                      <span className="text-[10px] font-bold text-gray-700 mb-1">{d.total}</span>

                      {/* Bar */}
                      <div 
                        className="w-8 relative rounded-t-lg overflow-hidden shadow-md transition-all duration-300"
                        style={{ 
                          height: `${Math.max(8, barHeight)}px`, 
                          backgroundColor: d.color,
                          opacity: isHovered ? 1 : 0.85
                        }}
                      >
                        {/* Manual section */}
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-black/25"
                          style={{ height: `${manualHeight}px` }}
                        />
                      </div>

                      {/* X Axis Label */}
                      <span className={`text-[11px] font-medium mt-2 transition-colors ${
                        isHovered ? "text-indigo-600 font-bold" : "text-gray-500"
                      }`}>
                        {d.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend indicator */}
          <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-gray-500 pt-3 border-t border-gray-50">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-400" />
              <span>进线总频次</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-500/80" />
              <span>人工响应</span>
            </div>
          </div>
        </div>

        {/* Circular Pie Chart Section (1 Column) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-slate-800 font-bold text-lg mb-1">工单阻断与解决分流</h3>
            <p className="text-slate-400 text-xs">统计 工程师解决 与 自动闭环 占比率</p>
          </div>

          {/* Radial Pie Graph */}
          {(() => {
            const aiInterceptCount = Math.max(0, totalInboundCount - resolvedCount);
            const resolvedPct = totalInboundCount > 0 ? (resolvedCount / totalInboundCount) * 100 : 0;
            const aiPct = totalInboundCount > 0 ? (aiInterceptCount / totalInboundCount) * 100 : 0;

            const pieRadius = 50;
            const pieCircumference = 2 * Math.PI * pieRadius; // ~314.15
            const resolvedStrokeLength = (resolvedPct / 100) * pieCircumference;
            const aiStrokeLength = (aiPct / 100) * pieCircumference;

            return (
              <div className="space-y-4">
                <div className="relative flex items-center justify-center py-4">
                  <svg className="w-40 h-40 transform -rotate-90">
                    {/* Background circle representing the groove */}
                    <circle
                      cx="80"
                      cy="80"
                      r={pieRadius}
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="28"
                    />
                    {/* AI Intercept slice */}
                    <circle
                      cx="80"
                      cy="80"
                      r={pieRadius}
                      fill="transparent"
                      stroke="#6366f1" /* Indigo */
                      strokeWidth="28"
                      strokeDasharray={`${aiStrokeLength} ${pieCircumference}`}
                      strokeDashoffset={-resolvedStrokeLength}
                      className="transition-all duration-1000 ease-out cursor-pointer hover:stroke-[30px]"
                    />
                    {/* Engineer Solved slice */}
                    <circle
                      cx="80"
                      cy="80"
                      r={pieRadius}
                      fill="transparent"
                      stroke="#0d9488" /* Teal */
                      strokeWidth="28"
                      strokeDasharray={`${resolvedStrokeLength} ${pieCircumference}`}
                      strokeDashoffset="0"
                      className="transition-all duration-1000 ease-out cursor-pointer hover:stroke-[30px]"
                    />
                  </svg>

                  {/* Absolute Center total stats block */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                    <span className="text-xl font-black text-slate-800 tracking-tight">
                      {totalInboundCount}次
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">总进线</span>
                  </div>
                </div>

                {/* Highly structured details legend */}
                <div className="space-y-2 border-t border-slate-50 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 rounded-md bg-teal-600 block" />
                      <span className="text-slate-600 font-semibold">工程师解决</span>
                    </div>
                    <div className="font-mono text-slate-800 font-bold">
                      {resolvedCount}次 <span className="text-teal-600 font-normal ml-1">({resolvedPct.toFixed(1)}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-3 rounded-md bg-indigo-500 block" />
                        <span className="text-slate-600 font-semibold">自动闭环</span>
                      </div>
                      <div className="font-mono text-slate-800 font-bold">
                        {aiInterceptCount}次 <span className="text-indigo-500 font-normal ml-1">({aiPct.toFixed(1)}%)</span>
                      </div>
                    </div>
                </div>
              </div>
            );
          })()}

          <div className="text-center text-[11px] text-slate-500 bg-teal-50/50 py-2 px-3 rounded-xl border border-teal-50/75 font-sans">
            自动闭包比例已达到 <span className="font-mono font-bold text-teal-700">65.4%</span> (静默处理)
          </div>
        </div>
      </div>

      {/* Warning List Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-slate-800 font-bold text-base">高频预警企业列表</h3>
              <p className="text-slate-400 text-xs">当期累计进线达到或超过 5 次的异常单位</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-100 text-rose-700 font-bold text-xs rounded-full shadow-xs">
            {warningCount} 家企业 ≥ 5 次
          </span>
        </div>

        <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
          {warningEnterprises.length > 0 ? (
            warningEnterprises.map((item, index) => {
              const maxCount = Math.max(...warningEnterprises.map((e) => e.total_count), 1);
              const progressWidth = `${(item.total_count / maxCount) * 100}%`;
              const isSevere = item.total_count >= 15;

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors gap-4"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Index Indicator */}
                    <span
                      className={`w-7 h-7 flex items-center justify-center font-bold text-sm rounded-full ${
                        index < 3
                          ? "bg-rose-500 text-white shadow-xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </span>

                    {/* Company name, CSM, Coach information */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className="text-slate-800 font-bold text-sm"
                        >
                          {item.enterprise_name}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-mono">ID: {item.id}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          CSM: <strong className="text-slate-700 font-medium">{item.csm}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          RPA教练: <strong className="text-slate-700 font-medium">{item.rpa_coach}</strong>
                        </span>
                        <span className="text-gray-400 line-clamp-1 flex-1">
                          联系人: {item.ccusers_name || "待录"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Severe indicator & progress value bar */}
                  <div className="flex items-center space-x-4 min-w-[240px] justify-between md:justify-end">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-sm font-semibold flex items-center gap-1 ${
                          isSevere
                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSevere ? "bg-rose-500" : "bg-amber-500"}`}
                        />
                        {isSevere ? "严重" : "高频"}
                      </span>
                    </div>

                    {/* Simple Custom Progress Bar */}
                    <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isSevere ? "bg-rose-500" : "bg-amber-500"
                        }`}
                        style={{ width: progressWidth }}
                      />
                    </div>

                    <span className="text-slate-800 font-extrabold text-base w-8 text-right">
                      {item.total_count}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-gray-400 text-sm">
              暂无达到高频预警标准的企业
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50/50 text-right border-t border-gray-50">
          <button
            onClick={() => onSelectTab("详情")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-all"
          >
            <span>查看完整企业运行明细</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
