import React from "react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

function fmt(val) {
  return "$" + Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function Sales() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editAction, setEditAction] = useState(null);

  const [newName, setNewName] = useState("");
  const [newMrr, setNewMrr] = useState("");
  const [newDate, setNewDate] = useState(today());
  const [newNotes, setNewNotes] = useState("");

  const [editMrr, setEditMrr] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [cRes, eRes] = await Promise.all([
      supabase.from("clients").select("*").order("name"),
      supabase.from("mrr_events").select("*").order("event_date", { ascending: false }),
    ]);
    setClients(cRes.data || []);
    setEvents(eRes.data || []);
    setLoading(false);
  }

  const activeClients = clients.filter((c) => c.status === "active");
  const totalMrr = activeClients.reduce((s, c) => s + Number(c.mrr_amount || 0), 0);

  const now = new Date();
  const thisMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const monthEvents = events.filter((e) => (e.event_date || "").startsWith(thisMonth));
  const newMrrMonth = monthEvents.filter((e) => e.event_type === "new" || e.event_type === "expansion").reduce((s, e) => s + Number(e.mrr_change || 0), 0);
  const churnedMrrMonth = monthEvents.filter((e) => e.event_type === "churn" || e.event_type === "contraction").reduce((s, e) => s + Math.abs(Number(e.mrr_change || 0)), 0);
  const netChange = newMrrMonth - churnedMrrMonth;

  async function handleAddClient(e) {
    e.preventDefault();
    const mrrVal = parseFloat(newMrr);
    if (!newName.trim() || isNaN(mrrVal) || mrrVal <= 0) return;

    const { data: client, error: cErr } = await supabase
      .from("clients")
      .insert({ name: newName.trim(), mrr_amount: mrrVal, status: "active", start_date: newDate, notes: newNotes, created_by: user.id })
      .select()
      .single();

    if (cErr) { alert("Error: " + cErr.message); return; }

    await supabase.from("mrr_events").insert({
      client_id: client.id,
      event_type: "new",
      mrr_change: mrrVal,
      event_date: newDate,
      notes: "New client signed",
      created_by: user.id,
    });

    setNewName(""); setNewMrr(""); setNewDate(today()); setNewNotes("");
    setShowAddForm(false);
    fetchData();
  }

  async function handleExpand(client) {
    const newMrrVal = parseFloat(editMrr);
    if (isNaN(newMrrVal) || newMrrVal <= Number(client.mrr_amount)) {
      alert("New MRR must be greater than current MRR");
      return;
    }
    const diff = newMrrVal - Number(client.mrr_amount);

    await supabase.from("clients").update({ mrr_amount: newMrrVal }).eq("id", client.id);
    await supabase.from("mrr_events").insert({
      client_id: client.id,
      event_type: "expansion",
      mrr_change: diff,
      event_date: today(),
      notes: editNotes || "MRR expansion",
      created_by: user.id,
    });

    setEditingClient(null); setEditAction(null); setEditMrr(""); setEditNotes("");
    fetchData();
  }

  async function handleContract(client) {
    const newMrrVal = parseFloat(editMrr);
    if (isNaN(newMrrVal) || newMrrVal >= Number(client.mrr_amount) || newMrrVal < 0) {
      alert("New MRR must be less than current MRR and non-negative");
      return;
    }
    const diff = newMrrVal - Number(client.mrr_amount);

    await supabase.from("clients").update({ mrr_amount: newMrrVal }).eq("id", client.id);
    await supabase.from("mrr_events").insert({
      client_id: client.id,
      event_type: "contraction",
      mrr_change: diff,
      event_date: today(),
      notes: editNotes || "MRR contraction",
      created_by: user.id,
    });

    setEditingClient(null); setEditAction(null); setEditMrr(""); setEditNotes("");
    fetchData();
  }

  async function handleChurn(client) {
    if (!window.confirm("Are you sure you want to mark " + client.name + " as churned?")) return;

    await supabase.from("clients").update({ status: "churned", churn_date: today(), mrr_amount: 0 }).eq("id", client.id);
    await supabase.from("mrr_events").insert({
      client_id: client.id,
      event_type: "churn",
      mrr_change: -Number(client.mrr_amount),
      event_date: today(),
      notes: "Client churned",
      created_by: user.id,
    });

    setEditingClient(null); setEditAction(null);
    fetchData();
  }

  function startEdit(client, action) {
    setEditingClient(client.id);
    setEditAction(action);
    setEditMrr("");
    setEditNotes("");
  }

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page">
      <h2 className="page-title">Sales & MRR Tracking</h2>

      <div className="metric-grid">
        <div className="metric-card metric-green">
          <div className="metric-label">Total Active MRR</div>
          <div className="metric-value">{fmt(totalMrr)}</div>
        </div>
        <div className="metric-card metric-blue">
          <div className="metric-label">New MRR This Month</div>
          <div className="metric-value">+{fmt(newMrrMonth)}</div>
        </div>
        <div className="metric-card metric-red">
          <div className="metric-label">Lost MRR This Month</div>
          <div className="metric-value">-{fmt(churnedMrrMonth)}</div>
        </div>
        <div className={"metric-card " + (netChange >= 0 ? "metric-green" : "metric-red")}>
          <div className="metric-label">Net Change</div>
          <div className="metric-value">{netChange >= 0 ? "+" : ""}{fmt(netChange)}</div>
        </div>
      </div>

      <div className="table-card">
        <div className="card-header">
          <h3>Active Clients</h3>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "+ Add Client"}
          </button>
        </div>

        {showAddForm && (
          <form className="inline-form" onSubmit={handleAddClient}>
            <div className="form-row">
              <div className="form-group">
                <label>Client Name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Company name" required />
              </div>
              <div className="form-group">
                <label>Monthly MRR</label>
                <input type="number" step="any" min="0" value={newMrr} onChange={(e) => setNewMrr(e.target.value)} placeholder="2500" required />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Deal notes..." rows={2}></textarea>
            </div>
            <button className="btn btn-primary" type="submit">Save Client</button>
          </form>
        )}

        {activeClients.length === 0 ? (
          <p className="empty-state">No active clients yet. Click "+ Add Client" to get started.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>MRR</th>
                <th>Start Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeClients.map((c) => (
                <React.Fragment key={c.id}>
                  <tr>
                    <td className="client-name">{c.name}</td>
                    <td>{fmt(c.mrr_amount)}</td>
                    <td>{c.start_date}</td>
                    <td className="action-cell">
                      <button className="btn-sm btn-expand" onClick={() => startEdit(c, "expand")} title="Expand MRR">{"📈"}</button>
                      <button className="btn-sm btn-contract" onClick={() => startEdit(c, "contract")} title="Contract MRR">{"📉"}</button>
                      <button className="btn-sm btn-churn" onClick={() => handleChurn(c)} title="Mark as Churned">{"❌"}</button>
                    </td>
                  </tr>
                  {editingClient === c.id && (
                    <tr className="edit-row">
                      <td colSpan={4}>
                        <div className="inline-edit-form">
                          <label>{editAction === "expand" ? "New MRR (higher)" : "New MRR (lower)"}</label>
                          <div className="edit-row-inputs">
                            <input type="number" step="any" min="0" value={editMrr} onChange={(e) => setEditMrr(e.target.value)} placeholder={"Current: " + fmt(c.mrr_amount)} />
                            <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes..." />
                            <button
                              className={"btn btn-sm " + (editAction === "expand" ? "btn-primary" : "btn-warning")}
                              onClick={() => editAction === "expand" ? handleExpand(c) : handleContract(c)}
                            >
                              Save
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={() => { setEditingClient(null); setEditAction(null); }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
