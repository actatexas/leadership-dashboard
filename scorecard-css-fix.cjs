const fs = require("fs");
const css = `
.grade-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
}
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

.expand-row td {
  background: #0f172a !important;
  padding: 1rem !important;
}
.expand-content { animation: fadeIn 0.2s ease; }

.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #1e293b;
  border-radius: 6px;
  border: 1px solid #334155;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.82rem;
}
.tool-item:hover { border-color: #3b82f6; }
.tool-item.adopted {
  background: #16a34a15;
  border-color: #22c55e55;
}

.tool-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.tool-item.adopted .tool-checkbox {
  background: #22c55e;
  border-color: #22c55e;
}

.tool-check-mark { color: #fff; font-size: 0.7rem; opacity: 0; }
.tool-item.adopted .tool-check-mark { opacity: 1; }

.tool-label { color: #cbd5e1; }
.tool-item.adopted .tool-label { color: #22c55e; }

.expand-notes { margin-top: 0.75rem; }
.expand-notes textarea {
  width: 100%;
  padding: 0.6rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #f8fafc;
  font-size: 0.85rem;
  resize: vertical;
  min-height: 60px;
  outline: none;
}
.expand-notes textarea:focus { border-color: #3b82f6; }

.opportunity-section { margin-top: 1.5rem; }

.opp-card {
  background: #1e293b;
  border-radius: 10px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  border-left: 4px solid #334155;
}
.opp-card.opp-upsell { border-left-color: #3b82f6; }
.opp-card.opp-risk { border-left-color: #ef4444; }

.opp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.opp-header h4 { font-size: 0.95rem; color: #f8fafc; }

.opp-list { display: flex; flex-direction: column; gap: 0.5rem; }

.opp-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5rem 0.75rem;
  background: #0f172a;
  border-radius: 6px;
  font-size: 0.85rem;
  flex-wrap: wrap;
}
.opp-item .opp-client { font-weight: 600; color: #f8fafc; }
.opp-item .opp-detail { color: #94a3b8; font-size: 0.8rem; }

.missing-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.25rem;
  width: 100%;
}
.missing-tool-tag {
  background: #334155;
  color: #94a3b8;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.72rem;
}

.search-input {
  padding: 0.45rem 0.75rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #f8fafc;
  font-size: 0.85rem;
  outline: none;
  min-width: 180px;
}
.search-input:focus { border-color: #3b82f6; }
.search-input::placeholder { color: #475569; }

.scorecard-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.expand-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: all 0.15s;
  font-family: monospace;
}
.expand-btn:hover { background: #334155; color: #e2e8f0; }

@media (max-width: 768px) {
  .tool-grid { grid-template-columns: repeat(2, 1fr); }
  .scorecard-controls { flex-direction: column; align-items: stretch; }
}

@media (max-width: 480px) {
  .tool-grid { grid-template-columns: 1fr; }
}
`;

fs.writeFileSync("src/scorecard-styles.css", css, "utf8");
console.log("Done! scorecard-styles.css regenerated.");