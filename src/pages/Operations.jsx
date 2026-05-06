export default function Operations() {
  return (
    <div className="page">
      <h2 className="page-title">Operations</h2>

      <div className="coming-soon-card">
        <div className="coming-soon-icon">{"⚙️"}</div>
        <h3>Coming Soon</h3>
        <p>This page will connect to BrightGauge and ConnectWise to display operational KPIs in real time.</p>

        <div className="feature-checklist">
          <h4>Planned Features</h4>
          <ul>
            <li><span className="check">{"☐"}</span> Ticket volume and trends</li>
            <li><span className="check">{"☐"}</span> SLA performance metrics</li>
            <li><span className="check">{"☐"}</span> Client satisfaction scores (CSAT)</li>
            <li><span className="check">{"☐"}</span> Technician utilization rates</li>
            <li><span className="check">{"☐"}</span> Open vs resolved ticket ratio</li>
            <li><span className="check">{"☐"}</span> BrightGauge dashboard integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
