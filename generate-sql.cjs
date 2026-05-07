const fs = require("fs");

const tools = JSON.stringify({
  automate: false, sentinel_one: false, easydmarc: false, axcient: false,
  password_rotation: false, connectbooster: false, lifecycle_insights: false,
  pii_protect: false, exclaimer: false, actifile: false, web_filtering: false,
  myglue: false, blackpoint: false, network_backups: false
});

const clients = [
  ["CEG",1,2540.55,3,0.435,3,2],["TELA",2,13463.53,16,0.39,4,4],
  ["MUA",1,3226.44,4,0.275,2,2],["MESH",1,2304,3,0.148,3,3],
  ["RLT",1,4578.6,6,0.588,4,2],["HM",1,2250,3,0.669,3,2],
  ["IATSE",2,9443.5,13,0.701,4,2],["MBBQ",1,2154,3,0.115,3,3],
  ["CAFE",1,7123,10,0.658,4,3],["SCR",1,4066.5,6,0.716,3,2],
  ["IE2",3,28202,43,0.754,4,4],["WRH",4,39337.5,61,0.703,4,4],
  ["OFS",2,8142.15,13,0.403,4,4],["VPS",1,1872,3,0.859,3,1],
  ["NFC",3,21783.7,35,0.733,4,4],["IKY",2,9294,15,0.556,4,4],
  ["MPSC",1,6119.7,10,0.743,4,4],["CTM",4,39084,64,0.616,4,4],
  ["HSB",1,3606,6,0.251,4,2],["SGEC",1,4193.5,7,0.7,3,3],
  ["FRC",2,10730,18,0.378,4,4],["MDI",1,2782.5,5,0.587,2,1],
  ["BVA",1,2085.48,4,0.776,3,3],["PEC",1,5610.6,11,0.52,4,4],
  ["FIM",1,6069,12,0.464,4,4],["RCN",3,17518.5,35,0.78,4,3],
  ["ZDI",1,2497.2,5,-0.5,3,3],["EAS",1,3960,8,0,3,2],
  ["YXA",1,4887.6,10,0.621,3,3],["CDS",1,1460.25,3,0.487,3,2],
  ["EWM",2,11084.34,23,0.647,3,4],["TWP",2,9013.5,20,0.751,4,3],
  ["DFD",1,3845.7,9,0.689,3,3],["BRG",1,2045,5,0.406,4,2],
  ["AVSI",1,4751.62,12,0.312,3,3],["GSC",2,13799.7,35,0.733,4,3],
  ["PDH",2,8638.5,23,0.411,3,3],["SmithCo",1,1500,4,0.904,2,1],
  ["RJF",1,2956.26,8,0.477,3,2],["SMT",3,20307,55,0.757,3,4],
  ["TMSI",1,2212.2,6,0.681,3,2],["HEW",1,3314.07,9,0.178,3,3],
  ["TV",1,3576,10,0.512,3,3],["BEN",1,1767.14,5,0.434,3,2],
  ["BGC",1,3488.45,10,0.654,3,2],["JCH",1,964.08,3,0.744,3,2],
  ["TEI",5,67146.4,209,0.581,2,4],["PR",1,5379,17,0.446,3,3],
  ["APA",3,15856.78,59,0.478,3,3],["ESC",1,3814.95,15,0.17,3,2],
  ["DNCL",2,11503.5,58,0.471,3,3],["SSR",1,487.8,3,0,3,1],
  ["OWS",2,10933.5,134,0.433,3,3]
];

function grade(margin, stack, tcp) {
  const ms = Math.max(0, Math.min(1, margin)) * 100;
  const ss = (stack / 4) * 100;
  const ts = (tcp / 4) * 100;
  const c = ms * 0.4 + ss * 0.3 + ts * 0.3;
  if (c >= 70) return "A";
  if (c >= 50) return "B";
  if (c >= 30) return "C";
  return "D";
}

let sql = `CREATE TABLE client_scorecards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_code TEXT NOT NULL UNIQUE,
  revenue_tier INT CHECK (revenue_tier BETWEEN 1 AND 5),
  quarterly_revenue DECIMAL(12,2) DEFAULT 0,
  seats INT DEFAULT 0,
  margin_health DECIMAL(5,4) DEFAULT 0,
  tcp_fit INT CHECK (tcp_fit BETWEEN 1 AND 4),
  tools_adopted JSONB DEFAULT '{}',
  notes TEXT,
  overall_grade TEXT CHECK (overall_grade IN ('A', 'B', 'C', 'D')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE client_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view scorecards" ON client_scorecards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert scorecards" ON client_scorecards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update scorecards" ON client_scorecards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete scorecards" ON client_scorecards FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_scorecards_grade ON client_scorecards(overall_grade);
CREATE INDEX idx_scorecards_code ON client_scorecards(client_code);

`;

clients.forEach(function(r) {
  const g = grade(r[4], r[5], r[6]);
  sql += "INSERT INTO client_scorecards (client_code, revenue_tier, quarterly_revenue, seats, margin_health, tcp_fit, tools_adopted, overall_grade) VALUES ('" + r[0] + "', " + r[1] + ", " + r[2] + ", " + r[3] + ", " + r[4] + ", " + r[6] + ", '" + tools + "', '" + g + "');\n";
});

fs.writeFileSync("scorecard-migration.sql", sql);
console.log("Done! Created scorecard-migration.sql with " + clients.length + " clients");