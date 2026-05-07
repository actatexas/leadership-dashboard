import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "",              icon: "🏠", label: "Executive",        badge: null },
  { to: "sales",         icon: "💰", label: "Sales",            badge: null },
  { to: "client-health", icon: "👥", label: "Client Health",    badge: null },
  { to: "scorecard",     icon: "📊", label: "Client Scorecard", badge: null },
  { to: "mrr-calculator",icon: "🧮", label: "MRR Calculator",   badge: null },
  { to: "operations",    icon: "⚙️",  label: "Operations",      badge: "Soon" },
  { to: "accounting",    icon: "📋", label: "Accounting",       badge: "Soon" },
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
          <img className="brand-logo" style={{width:"36px",height:"36px"}} src="/leadership-dashboard/logo.png" alt="Capstone" />
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
          🚪 Sign Out
        </button>
      </aside>
    </>
  );
}
