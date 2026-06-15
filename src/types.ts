export interface RpaTicket {
  id: number;
  enterprise_name: string;
  AI_analysis: string;
  csm: string;
  rpa_coach: string;
  total_count: number;
  manual_count: number;
  resolved_count: number;
  ccusers_name: string;
  start_time: string; // YYYY-MM-DD
  end_time: string;   // YYYY-MM-DD
  level?: "严重" | "高频" | "正常";
}

export interface DateCycle {
  label: string;
  startDate: string;
  endDate: string;
}

export interface DashboardMetrics {
  enterpriseCount: number;
  totalInboundCount: number;
  resolvedCount: number;
  warningCount: number;
  averageInbound: number;
  resolutionRate: number;
}

export interface InboundTrendData {
  date: string;
  total: number;
  manual: number;
  resolved: number;
}
