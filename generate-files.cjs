const fs = require("fs");

// === File 1: src/pages/ClientScorecard.jsx ===
const scorecard = `import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const TOOLS = [
  { key: "automate", label: "Automate" },
  { key: "sentinel_one", label: "Sentinel One" },
  { key: "easydmarc", label: "EasyDMARC" },
  { key: "axcient", label: "Axcient" },
  { key: "password_rotation", label: "Password Rotation Tool" },
  { key: "connectbooster", label: "ConnectBooster" },
  { key: "lifecycle_insights", label: "LifeCycle Insights" },
  { key: "pii_protect", label: "PII Protect" },
  { key: "exclaimer", label: "Exclaimer" },
  { key: "actifile", label: "Actifile" },
  { key: "web_filtering", label: "Anywhere Web Content Filtering" },
  { key: "myglue", label: "MyGlue" },
  { key: "blackpoint", label: "BlackPoint Cyber" },
  { key: "network_backups", label: "Network Mapping & Device Backups" },
];

function fmt(val) {
  return "$" + Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(val) {
  return (Number(val || 0) * 100).toFixed(1) + "%";
}

function getAdoptedCount(tools) {
  return Object.values(tools || {}).filter(Boolean).length;
}

function calculateGrade(marginHealth, toolsAdopted, tcpFit) {
  const marginScore = Math.max(0, Math.min(1, Number(marginHealth || 0))) * 100;
  const adoptedCount = getAdoptedCount(toolsAdopted);
  const stackScore = (adoptedCount / TOOLS.length) * 100;
  const tcpScore = ((Number(tcpFit) || 1) / 4) * 100;
  const composite = marginScore * 0.4 + stackScore * 0.3 + tcpScore * 0.3;
  if (composite >= 70) return "A";
  if (composite >= 50) return "B";
  if (composite >= 30) return "C";
  return "D";
}

function revPerSeatPerMonth(quarterly, seats) {
  if (!seats || seats === 0) return 0;
  return Number(quarterly || 0) / Number(seats) / 3;
}

export default function ClientScorecard() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("client_code");
  const [sortDir, setSortDir] = useState("asc");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    setLoading(true);
    const { data } = await supabase.from("client_scorecards").select("*").order("client_code");
    setClients(data || []);
    setLoading(false);
  }

  async function toggleTool(client, toolKey) {
    const tools = { ...(client.tools_adopted || {}) };
    tools[toolKey] = !tools[toolKey];
    const newGrade = calculateGrade(client.margin_health, tools, client.tcp_fit);
    await supabase.from("client_scorecards")
      .update({ tools_adopted: tools, overall_grade: newGrade, updated_at: new Date().toISOString() })
      .eq("id", client.id);
    setClients(prev => prev.map(c =>
      c.id === client.id ? { ...c, tools_adopted: tools, overall_grade: newGrade } : c
    ));
  }

  async function updateNotes(client, notes) {
    await supabase.from("client_scorecards")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", client.id);
    setClients(prev => prev.map(c =>
      c.id === client.id ? { ...c, notes } : c
    ));
  }

  let filtered = clients;
  if (gradeFilter !== "all") filtered = filtered.filter(c => c.overall_grade === gradeFilter);
  if (search) filtered = filtered.filter(c => c.client_code.toLowerCase().includes(search.toLowerCase()));

  filtered = [...filtered].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case "client_code": aVal = a.client_code; bVal = b.client_code; break;
      case "quarterly_revenue": aVal = Number(a.quarterly_revenue); bVal = Number(b.quarterly_revenue); break;
      case "margin_health": aVal = Number(a.margin_health); bVal = Number(b.margin_health); break;
      case "stack": aVal = getAdoptedCount(a.tools_adopted); bVal = getAdoptedCount(b.tools_adopted); break;
      case "grade": aVal = a.overall_grade; bVal = b.overall_grade; break;
      default: aVal = a.client_code; bVal = b.client_code;
    }
    if (typeof aVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  const gradeCount = { A: 0, B: 0, C: 0, D: 0 };
  let totalMargin = 0, totalStack = 0;
  clients.forEach(c => {
    gradeCount[c.overall_grade] = (gradeCount[c.overall_grade] || 0) + 1;
    totalMargin += Number(c.margin_health || 0);
    totalStack += getAdoptedCount(c.tools_adopted);
  });
  const avgMargin = clients.length > 0 ? totalMargin / clients.length : 0;
  const avgStack = clients.length > 0 ? totalStack / clients.length : 0;

  const upsellClients = clients.filter(c => {
    const margin = Number(c.margin_health || 0);
    const stackPct = getAdoptedCount(c.tools_adopted) / TOOLS.length;
    return margin > 0.4 && stackPct < 0.7;
  });

  const atRiskClients = clients.filter(c => Number(c.margin_health || 0) < 0.15);

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  function sortArrow(col) {
    if (sortBy !== col) return "";
    return sortDir === "asc" ? " \\u25B2" : " \\u25BC";
  }

  if (loading) return <div className="page-loading">Loading scorecards...</div>;

  return (
    <div className="page">
      <h2 className="page-title">Client Scorecard</h2>
      <p className="page-subtitle">Profitability, tool adoption, and target client fit at a glance.</p>

      <div className="metric-grid">
        <div className="metric-card metric-blue">
          <div className="metric-label">Total Clients</div>
          <div className="metric-value">{clients.length}</div>
        </div>
        <div className="metric-card metric-green">
          <div className="metric-label">Avg Margin</div>
          <div className="metric-value">{(avgMargin * 100).toFixed(1)}%</div>
        </div>
        <div className="metric-card metric-purple">
          <div className="metric-label">Avg Stack Adoption</div>
          <div className="metric-value">{avgStack.toFixed(1)} / {TOOLS.length}</div>
        </div>
        <div className="metric-card metric-yellow">
          <div className="metric-label">Grade Distribution</div>
          <div className="metric-value" style={{ fontSize: "0.95rem", display: "flex", gap: "0.5rem" }}>
            <span className="grade-badge grade-A">A:{gradeCount.A}</span>
            <span className="grade-badge grade-B">B:{gradeCount.B}</span>
            <span className="grade-badge grade-C">C:{gradeCount.C}</span>
            <span className="grade-badge grade-D">D:{gradeCount.D}</span>
          </div>
        </div>
      </div>

      <div className="scorecard-controls">
        <div className="grade-filters">
          {["all", "A", "B", "C", "D"].map(g => (
            <button key={g} className={"btn-filter" + (gradeFilter === g ? " active" : "")} onClick={() => setGradeFilter(g)}>
              {g === "all" ? "All" : "Grade " + g}
            </button>
          ))}
        </div>
        <input className="search-input" type="text" placeholder="Search client code..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th onClick={() => handleSort("grade")} style={{ cursor: "pointer" }}>Grade{sortArrow("grade")}</th>
                <th onClick={() => handleSort("client_code")} style={{ cursor: "pointer" }}>Client{sortArrow("client_code")}</th>
                <th>Tier</th>
                <th onClick={() => handleSort("quarterly_revenue")} style={{ cursor: "pointer" }}>Qtr Revenue{sortArrow("quarterly_revenue")}</th>
                <th>Seats</th>
                <th>Rev/Seat/Mo</th>
                <th onClick={() => handleSort("margin_health")} style={{ cursor: "pointer" }}>Margin{sortArrow("margin_health")}</th>
                <th onClick={() => handleSort("stack")} style={{ cursor: "pointer" }}>Stack{sortArrow("stack")}</th>
                <th>TCP Fit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const adopted = getAdoptedCount(c.tools_adopted);
                const stackPct = (adopted / TOOLS.length) * 100;
                const margin = Number(c.margin_health || 0);
                const marginClass = margin >= 0.5 ? "margin-green" : margin >= 0.2 ? "margin-yellow" : "margin-red";
                const barClass = stackPct >= 70 ? "bar-green" : stackPct >= 40 ? "bar-yellow" : "bar-red";
                const isExpanded = expandedId === c.id;
                const rpm = revPerSeatPerMonth(c.quarterly_revenue, c.seats);
                return (
                  <><tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                      <td><button className="expand-btn">{isExpanded ? "\\u25BC" : "\\u25B6"}</button></td>
                      <td><span className={"grade-badge grade-" + c.overall_grade}>{c.overall_grade}</span></td>
                      <td className="client-name">{c.client_code}</td>
                      <td>{c.revenue_tier}</td>
                      <td>{fmt(c.quarterly_revenue)}</td>
                      <td>{c.seats}</td>
                      <td>{fmt(rpm)}</td>
                      <td className={marginClass}>{pct(margin)}</td>
                      <td>
                        <div className="stack-bar-container">
                          <div className="stack-bar"><div className={"stack-bar-fill " + barClass} style={{ width: stackPct + "%" }}></div></div>
                          <span className="stack-text">{adopted}/{TOOLS.length}</span>
                        </div>
                      </td>
                      <td>
                        <div className="tcp-dots">
                          {[1,2,3,4].map(n => (<div key={n} className={"tcp-dot" + (n <= (c.tcp_fit || 0) ? " filled" : "")}></div>))}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={c.id + "-expand"} className="expand-row">
                        <td colSpan={10}>
                          <div className="expand-content">
                            <h4 style={{ color: "#cbd5e1", marginBottom: "0.75rem" }}>{c.client_code} \\u2014 Tool Adoption</h4>
                            <div className="tool-grid">
                              {TOOLS.map(t => {
                                const isAdopted = c.tools_adopted?.[t.key] || false;
                                return (
                                  <div key={t.key} className={"tool-item" + (isAdopted ? " adopted" : "")} onClick={(e) => { e.stopPropagation(); toggleTool(c, t.key); }}>
                                    <div className="tool-checkbox"><span className="tool-check-mark">\\u2713</span></div>
                                    <span className="tool-label">{t.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="expand-notes">
                              <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Notes</label>
                              <textarea defaultValue={c.notes || ""} placeholder="Add notes about this client..." onBlur={(e) => updateNotes(c, e.target.value)} onClick={(e) => e.stopPropagation()} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {upsellClients.length > 0 && (
        <div className="opportunity-section">
          <div className="opp-card opp-upsell">
            <div className="opp-header">
              <h4>\\uD83D\\uDCC8 Upsell Opportunities</h4>
              <span className="stack-text">High margin + low stack adoption</span>
            </div>
            <div className="opp-list">
              {upsellClients.map(c => {
                const missingTools = TOOLS.filter(t => !c.tools_adopted?.[t.key]);
                return (
                  <div key={c.id} className="opp-item">
                    <div>
                      <span className="opp-client">{c.client_code}</span>
                      <span className="opp-detail"> \\u2014 Margin: {pct(c.margin_health)}, Stack: {getAdoptedCount(c.tools_adopted)}/{TOOLS.length}</span>
                      <div className="missing-tools">
                        {missingTools.map(t => (<span key={t.key} className="missing-tool-tag">{t.label}</span>))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {atRiskClients.length > 0 && (
        <div className="opportunity-section">
          <div className="opp-card opp-risk">
            <div className="opp-header">
              <h4>\\u26A0\\uFE0F At-Risk Clients</h4>
              <span className="stack-text">Margin below 15%</span>
            </div>
            <div className="opp-list">
              {atRiskClients.map(c => (
                <div key={c.id} className="opp-item">
                  <span className="opp-client">{c.client_code}</span>
                  <span className="opp-detail">Margin: {pct(c.margin_health)} | Rev: {fmt(c.quarterly_revenue)} | {c.seats} seats</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// === File 2: src/components/Sidebar.jsx ===
const sidebar = `import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "",              icon: "\\uD83C\\uDFE0", label: "Executive",        badge: null },
  { to: "sales",         icon: "\\uD83D\\uDCB0", label: "Sales",            badge: null },
  { to: "client-health", icon: "\\uD83D\\uDC65", label: "Client Health",    badge: null },
  { to: "scorecard",     icon: "\\uD83D\\uDCCA", label: "Client Scorecard", badge: null },
  { to: "mrr-calculator",icon: "\\uD83E\\uDDEE", label: "MRR Calculator",   badge: null },
  { to: "operations",    icon: "\\u2699\\uFE0F",  label: "Operations",      badge: "Soon" },
  { to: "accounting",    icon: "\\uD83D\\uDCCB", label: "Accounting",       badge: "Soon" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={"sidebar" + (isOpen ? " sidebar-open" : "")}>
        <div className="sidebar-brand">
          <span className="brand-icon">\\uD83D\\uDCCA</span>
          <div>
            <div className="brand-name">CAPSTONE WORKS</div>
            <div className="brand-sub">Leadership Dashboard</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ""}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " nav-link-active" : "")
              }
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-signout" onClick={handleSignOut}>
          \\uD83D\\uDEAA Sign Out
        </button>
      </aside>
    </>
  );
}
`;

// === File 3: src/App.jsx ===
const app = `import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Executive from "./pages/Executive";
import Sales from "./pages/Sales";
import ClientHealth from "./pages/ClientHealth";
import ClientScorecard from "./pages/ClientScorecard";
import MRRCalculator from "./pages/MRRCalculator";
import Operations from "./pages/Operations";
import Accounting from "./pages/Accounting";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Executive />} />
            <Route path="sales" element={<Sales />} />
            <Route path="client-health" element={<ClientHealth />} />
            <Route path="scorecard" element={<ClientScorecard />} />
            <Route path="mrr-calculator" element={<MRRCalculator />} />
            <Route path="operations" element={<Operations />} />
            <Route path="accounting" element={<Accounting />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
`;

// === File 4: src/scorecard-styles.css ===
const css = `.grade-badge { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; }
.grade-A { background: #16a34a33; color: #22c55e; }
.grade-B { background: #3b82f633; color: #60a5fa; }
.grade-C { background: #f59e0b33; color: #f59e0b; }
.grade-D { background: #ef444433; color: #ef4444; }
.grade-filters { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.stack-bar-container { display: flex; align-items: center; gap: 0.5rem; }
.stack-bar { flex: 1; height: 6px; background: #334155; border-radius: 3px; overflow: hidden; min-width: 60px; }
.stack-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
.stack-bar-fill.bar-green { background: #22c55e; }
.stack-bar-fill.bar-yellow { background: #f59e0b; }
.stack-bar-fill.bar-red { background: #ef4444; }
.stack-text { font-size: 0.78rem; color: #94a3b8; white-space: nowrap; }
.margin-green { color: #22c55e; }
.margin-yellow { color: #f59e0b; }
.margin-red { color: #ef4444; }
.tcp-dots { display: flex; gap: 3px; }
.tcp-dot { width: 8px; height: 8px; border-radius: 50%; background: #334155; }
.tcp-dot.filled { background: #3b82f6; }
.expand-row td { background: #0f172a !important; padding: 1rem !important; }
.expand-content { animation: fadeIn 0.2s ease; }
.tool-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
.tool-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: #1e293b; border-radius: 6px; border: 1px solid #334155; cursor: pointer; transition: all 0.15s; font-size: 0.82rem; }
.tool-item:hover { border-color: #3b82f6; }
.tool-item.adopted { background: #16a34a15; border-color: #22c55e55; }
.tool-checkbox { width: 18px; height: 18px; border-radius: 4px; border: 2px solid #475569; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
.tool-item.adopted .tool-checkbox { background: #22c55e; border-color: #22c55e; }
.tool-check-mark { color: #fff; font-size: 0.7rem; opacity: 0; }
.tool-item.adopted .tool-check-mark { opacity: 1; }
.tool-label { color: #cbd5e1; }
.tool-item.adopted .tool-label { color: #22c55e; }
.expand-notes { margin-top: 0.75rem; }
.expand-notes textarea { width: 100%; padding: 0.6rem; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-size: 0.85rem; resize: vertical; min-height: 60px; outline: none; }
.expand-notes textarea:focus { border-color: #3b82f6; }
.opportunity-section { margin-top: 1.5rem; }
.opp-card { background: #1e293b; border-radius: 10px; padding: 1.25rem; margin-bottom: 1rem; border-left: 4px solid #334155; }
.opp-card.opp-upsell { border-left-color: #3b82f6; }
.opp-card.opp-risk { border-left-color: #ef4444; }
.opp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.opp-header h4 { font-size: 0.95rem; color: #f8fafc; }
.opp-list { display: flex; flex-direction: column; gap: 0.5rem; }
.opp-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: #0f172a; border-radius: 6px; font-size: 0.85rem; }
.opp-item .opp-client { font-weight: 600; color: #f8fafc; }
.opp-item .opp-detail { color: #94a3b8; font-size: 0.8rem; }
.missing-tools { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.25rem; }
.missing-tool-tag { background: #334155; color: #94a3b8; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.72rem; }
.search-input { padding: 0.45rem 0.75rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-size: 0.85rem; outline: none; min-width: 180px; }
.search-input:focus { border-color: #3b82f6; }
.search-input::placeholder { color: #475569; }
.scorecard-controls { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
.expand-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1rem; padding: 0.2rem 0.4rem; border-radius: 4px; transition: all 0.15s; }
.expand-btn:hover { background: #334155; color: #e2e8f0; }
@media (max-width: 768px) { .tool-grid { grid-template-columns: repeat(2, 1fr); } .scorecard-controls { flex-direction: column; align-items: stretch; } }
@media (max-width: 480px) { .tool-grid { grid-template-columns: 1fr; } }
`;

// Write all files
fs.writeFileSync("src/pages/ClientScorecard.jsx", scorecard);
fs.writeFileSync("src/components/Sidebar.jsx", sidebar);
fs.writeFileSync("src/App.jsx", app);
fs.writeFileSync("src/scorecard-styles.css", css);

console.log("All 4 files created:");
console.log("  src/pages/ClientScorecard.jsx");
console.log("  src/components/Sidebar.jsx (updated)");
console.log("  src/App.jsx (updated)");
console.log("  src/scorecard-styles.css");
console.log("\nNext: add this line to src/main.jsx after the existing CSS import:");
console.log('  import "./scorecard-styles.css";');