import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

function fmt(val) {
  return "$" + Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ClientHealth() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("name");
    setClients(data || []);
    setLoading(false);
  }

  const active = clients.filter((c) => c.status === "active");
  const churned = clients.filter((c) => c.status === "churned");
  const churnRate = clients.length > 0 ? ((churned.length / clients.length) * 100).toFixed(1) : "0.0";

  let filtered = clients;
  if (filter === "active") filtered = active;
  if (filter === "churned") filtered = churned;

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    return Number(b.mrr_amount || 0) - Number(a.mrr_amount || 0);
  });

  function getTenure(startDate) {
    if (!startDate) return "—";
    const start = new Date(startDate);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (months < 1) return "< 1 mo";
    if (months < 12) return months + " mo";
    const yrs = Math.floor(months / 12);
    const rem = months % 12;
    return yrs + "y " + rem + "m";
  }

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page">
      <h2 className="page-title">Client Health</h2>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-blue">
          <div className="metric-label">Active Clients</div>
          <div className="metric-value">{active.length}</div>
        </div>
        <div className="metric-card metric-red">
          <div className="metric-label">Churned Clients</div>
          <div className="metric-value">{churned.length}</div>
        </div>
        <div className="metric-card metric-yellow">
          <div className="metric-label">Churn Rate</div>
          <div className="metric-value">{churnRate}%</div>
        </div>
      </div>

      <div className="table-card">
        <div className="card-header">
          <h3>All Clients</h3>
          <div className="filter-group">
            <button className={"btn-filter" + (filter === "all" ? " active" : "")} onClick={() => setFilter("all")}>All</button>
            <button className={"btn-filter" + (filter === "active" ? " active" : "")} onClick={() => setFilter("active")}>Active</button>
            <button className={"btn-filter" + (filter === "churned" ? " active" : "")} onClick={() => setFilter("churned")}>Churned</button>
            <span className="sort-sep">|</span>
            <button className={"btn-filter" + (sortBy === "name" ? " active" : "")} onClick={() => setSortBy("name")}>Sort: Name</button>
            <button className={"btn-filter" + (sortBy === "mrr" ? " active" : "")} onClick={() => setSortBy("mrr")}>Sort: MRR</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="empty-state">No clients match this filter.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>MRR</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Tenure</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="client-name">{c.name}</td>
                  <td>{fmt(c.mrr_amount)}</td>
                  <td>
                    <span className={"status-badge " + (c.status === "active" ? "badge-green" : "badge-red")}>
                      {c.status === "active" ? "Active" : "Churned"}
                    </span>
                  </td>
                  <td>{c.start_date || "—"}</td>
                  <td>{getTenure(c.start_date)}</td>
                  <td className="notes-cell">{c.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
