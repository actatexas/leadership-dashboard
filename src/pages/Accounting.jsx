export default function Accounting() {
  return (
    <div className="page">
      <h2 className="page-title">Accounting & AR</h2>

      <div className="coming-soon-card">
        <div className="coming-soon-icon">{"📋"}</div>
        <h3>Coming Soon</h3>
        <p>This page will connect to QuickBooks to display financial data and accounts receivable in real time.</p>

        <div className="feature-checklist">
          <h4>Planned Features</h4>
          <ul>
            <li><span className="check">{"☐"}</span> AR aging breakdown (30/60/90 days)</li>
            <li><span className="check">{"☐"}</span> Revenue tracking by month</li>
            <li><span className="check">{"☐"}</span> Collections status and follow-ups</li>
            <li><span className="check">{"☐"}</span> Past-due account alerts</li>
            <li><span className="check">{"☐"}</span> Invoice status tracking</li>
            <li><span className="check">{"☐"}</span> QuickBooks sync status</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
