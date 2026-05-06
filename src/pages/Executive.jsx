import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function fmt(val) {
  return "$" + Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Executive() {
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [clientsRes, eventsRes] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("mrr_events").select("*, clients(name)").order("event_date", { ascending: true }),
    ]);
    setClients(clientsRes.data || []);
    setEvents(eventsRes.data || []);
    setLoading(false);
  }

  const activeClients = clients.filter((c) => c.status === "active");
  const totalMrr = activeClients.reduce((sum, c) => sum + Number(c.mrr_amount || 0), 0);
  const arr = totalMrr * 12;

  const now = new Date();
  const thisMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const thisMonthEvents = events.filter((e) => (e.event_date || "").startsWith(thisMonth));
  const netChange = thisMonthEvents.reduce((sum, e) => sum + Number(e.mrr_change || 0), 0);

  const monthlyMap = {};
  events.forEach((e) => {
    const month = (e.event_date || "").substring(0, 7);
    if (month) {
      monthlyMap[month] = (monthlyMap[month] || 0) + Number(e.mrr_change || 0);
    }
  });
  const months = Object.keys(monthlyMap).sort();
  let cumulative = 0;
  const chartData = months.map((m) => {
    cumulative += monthlyMap[m];
    return { month: m, mrr: cumulative };
  });

  const recentEvents = [...events].reverse().slice(0, 10);

  const eventTypeLabels = {
    new: "🟢 New",
    expansion: "📈 Expansion",
    contraction: "📉 Contraction",
    churn: "🔴 Churn",
  };

  if (loading) {
    return <div className="page-loading">Loading dashboard...</div>;
  }

  return (
    <div className="page">
      <h2 className="page-title">Executive Overview</h2>

      <div className="metric-grid">
        <div className="metric-card metric-green">
          <div className="metric-label">Total MRR</div>
          <div className="metric-value">{fmt(totalMrr)}</div>
        </div>
        <div className="metric-card metric-blue">
          <div className="metric-label">Active Clients</div>
          <div className="metric-value">{activeClients.length}</div>
        </div>
        <div className={"metric-card " + (netChange >= 0 ? "metric-green" : "metric-red")}>
          <div className="metric-label">Net MRR Change (This Month)</div>
          <div className="metric-value">{netChange >= 0 ? "+" : ""}{fmt(netChange)}</div>
        </div>
        <div className="metric-card metric-purple">
          <div className="metric-label">ARR</div>
          <div className="metric-value">{fmt(arr)}</div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="chart-card">
          <h3>MRR Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v) => "$" + (v / 1000).toFixed(1) + "k"} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                formatter={(value) => [fmt(value), "MRR"]}
              />
              <Area type="monotone" dataKey="mrr" stroke="#22c55e" fill="url(#mrrGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="table-card">
        <h3>Recent Activity</h3>
        {recentEvents.length === 0 ? (
          <p className="empty-state">No activity yet. Head to the Sales page to add your first client.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Client</th>
                <th>MRR Change</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((e) => (
                <tr key={e.id}>
                  <td>{eventTypeLabels[e.event_type] || e.event_type}</td>
                  <td>{e.clients?.name || "—"}</td>
                  <td className={Number(e.mrr_change) >= 0 ? "text-green" : "text-red"}>
                    {Number(e.mrr_change) >= 0 ? "+" : ""}{fmt(e.mrr_change)}
                  </td>
                  <td>{e.event_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
