import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const TOOLS = [
  { key: "automate", label: "Automate" },
  { key: "sentinel_one", label: "Sentinel One" },
  { key: "easydmarc", label: "EasyDMARC" },
  { key: "axcient", label: "Axcient" },
  { key: "password_rotation", label: "QuickPass" },
  { key: "connectbooster", label: "ConnectBooster" },
  { key: "lifecycle_insights", label: "LifeCycle Insights" },
  { key: "pii_protect", label: "PII Protect" },
  { key: "exclaimer", label: "Exclaimer" },
  { key: "actifile", label: "Actifile" },
  { key: "managed_firewall", label: "Capstone Managed Firewall" },
  { key: "managed_switch", label: "Capstone Managed Switch" },
  { key: "managed_aps", label: "Capstone Managed APs" },
  { key: "myglue", label: "MyGlue" },
  { key: "blackpoint", label: "BlackPoint Cyber" },
  { key: "connectsecure", label: "ConnectSecure" },
];

function fmt(val) {
  return "$" + Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pct(val) { return (Number(val || 0) * 100).toFixed(1) + "%"; }
function getAdoptedCount(tools) { return Object.values(tools || {}).filter(Boolean).length; }

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

function getRevenueTier(quarterlyRevenue) {
  var rev = Number(quarterlyRevenue || 0);
  if (rev >= 45000) return 4;
  if (rev >= 30000) return 3;
  if (rev >= 15000) return 2;
  return 1;
}

function revPerSeatPerMonth(q, s) { return (!s || s === 0) ? 0 : Number(q || 0) / Number(s) / 3; }

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
    var result = await supabase.from("client_scorecards").select("*").order("client_code");
    var rows = result.data || [];
    for (var i = 0; i < rows.length; i++) {
      var c = rows[i];
      var correctGrade = calculateGrade(c.margin_health, c.tools_adopted, c.tcp_fit);
      var correctTier = getRevenueTier(c.quarterly_revenue);
      if (c.overall_grade !== correctGrade || c.revenue_tier !== correctTier) {
        await supabase.from("client_scorecards")
          .update({ overall_grade: correctGrade, revenue_tier: correctTier })
          .eq("id", c.id);
        rows[i].overall_grade = correctGrade;
        rows[i].revenue_tier = correctTier;
      }
    }
    setClients(rows);
    setLoading(false);
  }

  async function toggleTool(client, toolKey) {
    const tools = { ...(client.tools_adopted || {}) };
    tools[toolKey] = !tools[toolKey];
    const newGrade = calculateGrade(client.margin_health, tools, client.tcp_fit);
    await supabase.from("client_scorecards")
      .update({ tools_adopted: tools, overall_grade: newGrade, updated_at: new Date().toISOString() })
      .eq("id", client.id);
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, tools_adopted: tools, overall_grade: newGrade } : c));
  }

  async function updateNotes(client, notes) {
    await supabase.from("client_scorecards")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", client.id);
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, notes } : c));
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
    return sortDir === "asc" ? " [asc]" : " [desc]";
  }

  if (loading) return <div className="page-loading">Loading scorecards...</div>;

  return (
    <div className="page">
      <h2 className="page-title">Client Scorecard</h2>
      <p className="page-subtitle">Profitability, tool adoption, and target client fit at a glance.</p>

      <div className="metric-grid">
        <div className="metric-card metric-blue"><div className="metric-label">Total Clients</div><div className="metric-value">{clients.length}</div></div>
        <div className="metric-card metric-green"><div className="metric-label">Avg Margin</div><div className="metric-value">{(avgMargin * 100).toFixed(1)}%</div></div>
        <div className="metric-card metric-purple"><div className="metric-label">Avg Stack Adoption</div><div className="metric-value">{avgStack.toFixed(1)} / {TOOLS.length}</div></div>
        <div className="metric-card metric-yellow"><div className="metric-label">Grade Distribution</div>
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
            <thead><tr>
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
            </tr></thead>
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
                      <td><button className="expand-btn">{isExpanded ? "[-]" : "[+]"}</button></td>
                      <td><span className={"grade-badge grade-" + c.overall_grade}>{c.overall_grade}</span></td>
                      <td className="client-name">{c.client_code}</td>
                      <td>T{getRevenueTier(c.quarterly_revenue)}</td>
                      <td>{fmt(c.quarterly_revenue)}</td>
                      <td>{c.seats}</td>
                      <td>{fmt(rpm)}</td>
                      <td className={marginClass}>{pct(margin)}</td>
                      <td><div className="stack-bar-container"><div className="stack-bar"><div className={"stack-bar-fill " + barClass} style={{ width: stackPct + "%" }}></div></div><span className="stack-text">{adopted}/{TOOLS.length}</span></div></td>
                      <td><div className="tcp-dots">{[1,2,3,4].map(n => (<div key={n} className={"tcp-dot" + (n <= (c.tcp_fit || 0) ? " filled" : "")}></div>))}</div></td>
                    </tr>
                    {isExpanded && (
                      <tr key={c.id + "-expand"} className="expand-row">
                        <td colSpan={10}>
                          <div className="expand-content">
                            <h4 style={{ color: "#cbd5e1", marginBottom: "0.75rem" }}>{c.client_code} - Tool Adoption</h4>
                            <div className="tool-grid">
                              {TOOLS.map(t => {
                                const isAdopted = c.tools_adopted?.[t.key] || false;
                                return (
                                  <div key={t.key} className={"tool-item" + (isAdopted ? " adopted" : "")} onClick={(e) => { e.stopPropagation(); toggleTool(c, t.key); }}>
                                    <div className="tool-checkbox"><span className="tool-check-mark">X</span></div>
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
              <h4>Upsell Opportunities</h4>
              <span className="stack-text">High margin + low stack adoption</span>
            </div>
            <div className="opp-list">
              {upsellClients.map(c => {
                const missingTools = TOOLS.filter(t => !c.tools_adopted?.[t.key]);
                return (
                  <div key={c.id} className="opp-item">
                    <div>
                      <span className="opp-client">{c.client_code}</span>
                      <span className="opp-detail"> - Margin: {pct(c.margin_health)}, Stack: {getAdoptedCount(c.tools_adopted)}/{TOOLS.length}</span>
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
              <h4>At-Risk Clients</h4>
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