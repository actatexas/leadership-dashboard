import { useState } from "react";

function formatCurrency(value) {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MRRCalculator() {
  const [mrrInput, setMrrInput] = useState("");
  const [results, setResults] = useState(null);

  function calculate(e) {
    e.preventDefault();
    const mrr = parseFloat(mrrInput);
    if (isNaN(mrr) || mrr <= 0) return;

    const months = 12;
    let cumulativeMrr = 0;
    let cumulativeRevenue = 0;
    const rows = [];

    for (let month = 1; month <= months; month++) {
      cumulativeMrr += mrr;
      const monthlyRevenue = cumulativeMrr;
      cumulativeRevenue += monthlyRevenue;
      rows.push({ month, newMrr: mrr, cumulativeMrr, monthlyRevenue, cumulativeRevenue });
    }

    const naiveTotal = mrr * months;
    const formulaTotal = mrr * ((months * (months + 1)) / 2);

    setResults({ mrr, rows, endingMrr: cumulativeMrr, naiveTotal, actualTotal: cumulativeRevenue, extra: cumulativeRevenue - naiveTotal, formulaTotal });
  }

  function reset() { setMrrInput(""); setResults(null); }

  return (
    <div className="page">
      <h2 className="page-title">MRR Revenue Calculator</h2>
      <p className="page-subtitle">See the real annual revenue impact of consistently adding monthly recurring revenue.</p>

      <div className="table-card">
        {!results ? (
          <form onSubmit={calculate}>
            <label className="form-label-muted">Enter the MRR you add with each new client:</label>
            <div className="calc-input-group">
              <div className="input-wrapper">
                <span className="prefix">$</span>
                <input className="mrr-input" type="number" step="any" min="0" placeholder="e.g. 2500" value={mrrInput} onChange={(e) => setMrrInput(e.target.value)} autoFocus />
              </div>
              <button className="btn btn-primary" type="submit">Calculate</button>
            </div>
          </form>
        ) : (
          <div className="results-section">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>New MRR</th>
                    <th>Cumul. MRR</th>
                    <th>Revenue</th>
                    <th>Cumul. Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row) => (
                    <tr key={row.month}>
                      <td style={{ textAlign: "center" }}>{row.month}</td>
                      <td>{formatCurrency(row.newMrr)}</td>
                      <td>{formatCurrency(row.cumulativeMrr)}</td>
                      <td>{formatCurrency(row.monthlyRevenue)}</td>
                      <td>{formatCurrency(row.cumulativeRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="summary-box">
              <h3>Summary</h3>
              <div className="summary-row"><span className="label">Monthly MRR per client</span><span className="value">{formatCurrency(results.mrr)}</span></div>
              <div className="summary-row"><span className="label">Clients signed</span><span className="value">12</span></div>
              <div className="summary-row"><span className="label">Ending MRR</span><span className="value">{formatCurrency(results.endingMrr)}</span></div>
              <div className="summary-divider"></div>
              <div className="summary-row"><span className="label">Naive estimate (12 × MRR)</span><span className="value">{formatCurrency(results.naiveTotal)}</span></div>
              <div className="summary-row highlight"><span className="label">Actual Total Annual Revenue</span><span className="value">{formatCurrency(results.actualTotal)}</span></div>
              <div className="summary-row extra"><span className="label">Extra from compounding</span><span className="value">+{formatCurrency(results.extra)}</span></div>
              <div className="formula-section">
                {"Total = MRR × n(n+1) / 2"}<br />
                {"Total = " + formatCurrency(results.mrr) + " × (12 × 13 / 2)"}<br />
                {"Total = " + formatCurrency(results.mrr) + " × 78"}<br />
                <span className="formula-highlight">{"Total = " + formatCurrency(results.formulaTotal)}</span>
              </div>
            </div>

            <div className="result-actions">
              <button className="btn btn-secondary" onClick={reset}>Start Over</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
