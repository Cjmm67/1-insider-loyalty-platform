import { useState, useEffect, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// ─── Supabase ───
const SUPA_URL = "https://tobtmtshxgpkkucsaxyk.supabase.co";
const SUPA_KEY = "sb_publishable_M_yQLmU_5yc0yTccm4F_oA_xWKyTqx9";
const supaFetch = async (path, opts = {}) => {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", Prefer: opts.prefer || "return=representation" },
    method: opts.method || "GET", body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
};

// ─── Claude API ───
const askClaude = async (system, user) => {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages: [{ role: "user", content: user }] }),
  });
  const d = await r.json();
  return d.content?.map(b => b.text || "").join("\n") || "No response";
};

// ─── Brand Tokens ───
const C = { gold: "#C5A258", dark: "#111", bg: "#FAF8F5", text: "#1A1A1A", muted: "#888", lmuted: "#999" };
const TIER = {
  silver: { hex: "#A8A8A8", bg: "#F7F7F7", txt: "#666", grad: "linear-gradient(135deg,#e8e8e8,#d0d0d0)" },
  gold: { hex: "#C5A258", bg: "#FDF8EE", txt: "#8B6914", grad: "linear-gradient(135deg,#C5A258,#D4B978 50%,#A88B3A)" },
  platinum: { hex: "#5C5C5C", bg: "#2D2D2D", txt: "#fff", grad: "linear-gradient(135deg,#3a3a3a,#1a1a1a 50%,#4a4a4a)" },
  corporate: { hex: "#1A3A5C", bg: "#E8EFF5", txt: "#1A3A5C", grad: "linear-gradient(135deg,#1A3A5C,#2A5A8C)" },
  staff: { hex: "#2E7D32", bg: "#E8F5E9", txt: "#2E7D32", grad: "linear-gradient(135deg,#2E7D32,#4CAF50)" },
};
const CAT_CLR = { "Cafés": "#7B9E6B", Restaurants: "#B85C38", Bars: "#6B4E8B", Wines: "#8B2252" };
const FONT = { h: "'Playfair Display',Georgia,serif", b: "'DM Sans',system-ui,sans-serif", m: "'JetBrains Mono',monospace" };

// ─── Venues ───
const VENUES = [
  {id:"oumi",name:"Oumi",category:"Restaurants",location:"CapitaSpring Lvl 51",stamps:false,points:true},
  {id:"kaarla",name:"Kaarla",category:"Restaurants",location:"CapitaSpring Lvl 51",stamps:false,points:true},
  {id:"solluna",name:"Sol & Luna",category:"Restaurants",location:"CapitaSpring Lvl 51",stamps:false,points:true},
  {id:"camille",name:"Camille",category:"Restaurants",location:"CapitaSpring Lvl 51",stamps:false,points:true},
  {id:"fire",name:"FIRE",category:"Restaurants",location:"One Fullerton",stamps:false,points:true},
  {id:"monti",name:"Monti",category:"Restaurants",location:"Fullerton Pavilion",stamps:false,points:true},
  {id:"flnt",name:"FLNT",category:"Restaurants",location:"CapitaSpring Lvl 51",stamps:false,points:true},
  {id:"botanico",name:"Botanico",category:"Restaurants",location:"Singapore Botanic Gardens",stamps:false,points:true},
  {id:"mimi",name:"Mimi",category:"Restaurants",location:"Clarke Quay",stamps:false,points:true},
  {id:"una",name:"UNA",category:"Restaurants",location:"Rochester Commons",stamps:false,points:true},
  {id:"yang",name:"Yang",category:"Restaurants",location:"1-Altitude",stamps:false,points:true},
  {id:"zorba",name:"Zorba",category:"Restaurants",location:"The Summerhouse",stamps:false,points:true},
  {id:"alfaro",name:"1-Alfaro",category:"Restaurants",location:"Raffles Place",stamps:false,points:true},
  {id:"coast",name:"1-Altitude Coast",category:"Bars",location:"One Fullerton Rooftop",stamps:false,points:true},
  {id:"arden",name:"1-Arden Bar",category:"Bars",location:"CapitaSpring",stamps:false,points:true},
  {id:"1918",name:"1918 Heritage Bar",category:"Bars",location:"The Riverhouse",stamps:false,points:true},
  {id:"solora",name:"Sol & Ora",category:"Bars",location:"CapitaSpring",stamps:false,points:true},
  {id:"pixies",name:"Pixies",category:"Bars",location:"Portfolio",stamps:false,points:true},
  {id:"wsbar",name:"Wildseed Bar",category:"Bars",location:"The Summerhouse",stamps:false,points:true},
  {id:"wscafe-fh",name:"Wildseed Café @ 1-Flowerhill",category:"Cafés",location:"1-Flowerhill",stamps:true,points:false},
  {id:"wscafe-sh",name:"Wildseed Café @ The Summerhouse",category:"Cafés",location:"The Summerhouse",stamps:true,points:false},
  {id:"wscafe-am",name:"Wildseed Café @ The Alkaff Mansion",category:"Cafés",location:"The Alkaff Mansion",stamps:true,points:false},
  {id:"wscafe-bg",name:"Wildseed Café @ Singapore Botanic Gardens",category:"Cafés",location:"Singapore Botanic Gardens",stamps:true,points:false},
  {id:"melaka",name:"1-Altitude Melaka",category:"Bars",location:"Melaka, Malaysia",stamps:false,points:true},
];
const CAFE_OUTLETS = VENUES.filter(v => v.stamps);

// ─── Stamp Milestones ───
const STAMPS = [
  {s:1},{s:2},
  {s:3,reward:"1-for-1 main lunch set",auto:false},
  {s:4},
  {s:5,reward:"Complimentary cake of the day",auto:false},
  {s:6,reward:"1-for-1 pasta",auto:false},
  {s:7},
  {s:8,reward:"20% off dine-in",auto:true},
  {s:9},
  {s:10,reward:"Mixed Berry Croffle",auto:true},
];

// ─── Tier Data ───
const TIERS_DATA = [
  {id:"silver",name:"Silver",fee:0,paid:false,earn:"$1 = 1 pt",bday:"10%",vouchers:"1×$10 welcome",nonStop:false,benefits:["Base earn rate","10% birthday discount","1×$10 welcome voucher","Café stamps","Gift cards","Monthly acquisition bonus"]},
  {id:"gold",name:"Paid Gold",fee:40,paid:true,earn:"$1 = 1.5 pts",bday:"15%",vouchers:"10×$20 dining",nonStop:true,benefits:["Enhanced earn rate","15% birthday discount","10×$20 Non-Stop Hits","Priority reservations","Exclusive events","Café stamps"]},
  {id:"platinum",name:"Paid Platinum",fee:80,paid:true,earn:"$1 = 2 pts",bday:"20%",vouchers:"10×$25 dining",nonStop:true,benefits:["Premium earn rate","20% birthday discount","10×$25 Non-Stop Hits","VIP reservations","Concierge","Chef's table"]},
  {id:"corporate",name:"Corporate",fee:null,paid:true,earn:"$1 = 1.5 pts",bday:"15%",vouchers:"10×$20 dining",nonStop:true,benefits:["Corporate earn rate","15% birthday discount","10×$20 Non-Stop Hits","Bulk gift cards","Event coordination","Dedicated account mgr"]},
  {id:"staff",name:"Staff",fee:0,paid:false,earn:"$1 = 1 pt",bday:"TBC",vouchers:"TBC",nonStop:false,benefits:["Staff dining vouchers","Birthday reward TBC","Internal events","Staff-only promos"]},
];

// ─── Eber Limitations ───
const LIMITATIONS = [
  {id:"L01",text:"No tier benefits on purchase page",fix:"AI-generated benefits page outside purchase flow",sev:"medium"},
  {id:"L02",text:"No auto-renewal",fix:"Gmail MCP reminders at 30d/7d/1d",sev:"high"},
  {id:"L03",text:"Mobile OTP only (no email)",fix:"Raise as dev request with Eber",sev:"medium"},
  {id:"L04",text:"Cannot exclude promo items from points",fix:"Manual backend rule updates per promotion",sev:"high"},
  {id:"L05",text:"Cannot auto-switch redemption rates",fix:"Manual backend update at end of launch period",sev:"low"},
  {id:"L06",text:"No calendar-year expiry on 2nd+ voucher sets",fix:"Annual set creation in Staging each November",sev:"medium"},
  {id:"L07",text:"Cannot track voucher reclaim count",fix:"AI Voucher Lifecycle Tracker",sev:"low"},
  {id:"L08",text:"No auto-refill vouchers",fix:"Members claim from Discover tab; nudge campaigns",sev:"medium"},
  {id:"L09",text:"Cannot auto-issue 3rd/5th/6th stamp rewards",fix:"Discover tab manual claim; clear T&C",sev:"medium"},
  {id:"L10",text:"Stamp back-door re-triggering",fix:"Time-based restriction (2 months) from AI analyser",sev:"high"},
  {id:"L11",text:"No mobile video background",fix:"Static fallback; text-free video for desktop",sev:"low"},
];

// ─── Decision Items ───
const INIT_DECISIONS = [
  {id:1,title:"Email OTP request to Eber",status:"open",note:"Remove mobile dependency"},
  {id:2,title:"Direct Agilysys-Eber POS integration",status:"open",note:"Enable item-level data for promo exclusion"},
  {id:3,title:"Staff tier brief to Eber",status:"open",note:"Mechanics must be provided before config"},
  {id:4,title:"Bar applicability for dining vouchers",status:"open",note:"Reconfirm with operations"},
  {id:5,title:"Points validity confirmation",status:"open",note:"Confirm before launch"},
  {id:6,title:"Stamp reward usage validity (30 days?)",status:"open",note:"Confirm before Eber config"},
];

// ─── Checklist Items ───
const CHECKLISTS = {
  "Pre-Launch": [
    "All 5 tiers configured in Eber Staging",
    "Points earn rates set (launch: $1=10pts)",
    "Welcome vouchers configured per tier",
    "Dining voucher sets created for Gold/Platinum/Corporate",
    "Stamp programme configured for 4 café outlets",
    "Member portal revamp tested in Staging",
    "Stripe payment links tested (Gold $40, Platinum $80)",
    "Sign off from Finance on P&L treatment",
    "Migrate Staging → Production",
  ],
  "Annual Voucher Lifecycle": [
    "November: Create next year's voucher set in Staging",
    "December: Test → migrate to Production",
    "1 January: Verify new set auto-issues",
    "Ongoing: Monitor manual claims from Discover tab",
    "31 December: Confirm unused vouchers forfeited",
  ],
  "Per-Promotion": [
    "Update Eber points rules to EXCLUDE promo transactions BEFORE start",
    "Update Eber stamp rules for café outlets if applicable",
    "Set Google Calendar reminder to REVERT rules after end",
    "Verify no overlapping promotions",
    "Document in Promotion Calendar",
  ],
};

// ─── Voucher Lifecycle ───
const VOUCHER_LIFECYCLE = [
  {month:"November",action:"Create next year's voucher set in Staging",icon:"📋"},
  {month:"December",action:"Test → migrate to Production",icon:"🧪"},
  {month:"1 January",action:"New set auto-issues to active paid members",icon:"🎉"},
  {month:"Ongoing",action:"Members manually claim refills from Discover tab",icon:"🔄"},
  {month:"31 December",action:"Unused vouchers forfeited",icon:"⏰"},
];

// ─── System Prompts ───
const SYS_STAMP = `You are a loyalty programme analyst for 1-Group Singapore's 1-Insider 3.0 café stamp programme.\nContext:\n- 1 stamp per $10 spent at Wildseed Café outlets (4 locations)\n- 10-stamp card cycle with 2-month loop restart\n- Rewards at stamps 3, 5, 6 (manual claim), 8, 10 (auto-issued)\n- Burn mechanic: stamps deducted on claim\n- BACK-DOOR ISSUE: Eber cannot prevent re-triggering when stamps remain unclaimed\n- WORKAROUND: Time-based claim restriction (e.g., once per 2 months)\nAnalyse café spending patterns and recommend the optimal time restriction. Be concise and data-driven.`;

const SYS_RENEWAL = `You are a premium hospitality communications writer for 1-Group Singapore's 1-Insider programme.\nWrite a membership renewal reminder email. Tone: warm, premium, never desperate.\nInclude: Personal greeting, current tier and benefits they'll lose, usage stats, one-tap renewal link [RENEWAL_LINK], urgency appropriate to timing.\nKeep under 150 words. Premium hospitality tone. Sign off from "The 1-Insider Team".`;

const SYS_CAMPAIGN = `You are a loyalty campaign architect for 1-Group Singapore's 1-Insider 3.0 on Eber.\nContext: 25 venues, 5 tiers, base earn rates Silver 1×/Gold 1.5×/Platinum 2×.\nCRITICAL: Eber cannot auto-exclude promo items — manual backend rule updates required.\nWhen designing: define objective, specify Eber rules to update BEFORE launch, set REVERT DATE, estimate ROI, provide per-promotion checklist.\nAlways flag Eber limitations.`;

const SYS_REWARD = `You are a reward design specialist for 1-Group Singapore's 1-Insider 3.0.\nContext: 25 venues, points redemption base 100pts=$10.\nMargin protection: never flat % discounts; prefer experiences. Cost target 3-8% revenue.\nPresent 3 options: Conservative, Premium, Experience-based. Each with name, points cost, business cost, perceived value ratio, venue feasibility.`;

const SYS_COMPLAINT = `You are a senior member services specialist for 1-Group Singapore's 1-Insider 3.0.\nWhen handling complaints: identify category, check Agilysys→SevenRooms→Eber pipeline, determine if Eber limitation or operational error, propose resolution, draft response script.\nKey: one mobile=one account, birthday=% not voucher, points expire 12mo, stamps=café only.`;

// ─── Styles ───
const s = {
  app: { fontFamily: FONT.b, background: C.bg, color: C.text, minHeight: "100vh" },
  header: { background: C.dark, padding: "0 24px", display: "flex", alignItems: "center", height: 56, gap: 16 },
  logo: { fontFamily: FONT.h, color: C.gold, fontSize: 18, fontWeight: 700, letterSpacing: 1 },
  nav: { display: "flex", gap: 2, padding: "0 24px", background: "#fff", borderBottom: "1px solid #eee", overflowX: "auto" },
  tab: (a) => ({ padding: "12px 16px", fontSize: 12.5, fontWeight: a ? 600 : 400, color: a ? C.gold : C.muted, borderBottom: a ? `2px solid ${C.gold}` : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s" }),
  page: { padding: 24, maxWidth: 1200, margin: "0 auto" },
  card: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 8px rgba(0,0,0,.04)", marginBottom: 16 },
  kpi: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 8px rgba(0,0,0,.04)", flex: 1, minWidth: 180 },
  kpiVal: { fontFamily: FONT.h, fontSize: 28, fontWeight: 700, color: C.text },
  kpiLabel: { fontSize: 11, color: C.lmuted, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 4 },
  badge: (tier) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: TIER[tier]?.bg || "#eee", color: TIER[tier]?.txt || "#666" }),
  btn: { background: C.gold, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT.b },
  btnSm: { background: C.gold, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT.b },
  btnOutline: { background: "transparent", color: C.gold, border: `1.5px solid ${C.gold}`, borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT.b },
  input: { border: "1px solid #ddd", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: FONT.b, width: "100%", boxSizing: "border-box", outline: "none" },
  bannerRed: { background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#B71C1C", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, lineHeight: 1.5 },
  bannerGreen: { background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#1B5E20", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, lineHeight: 1.5 },
  bannerAmber: { background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#5D4037", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, lineHeight: 1.5 },
  h2: { fontFamily: FONT.h, fontSize: 22, fontWeight: 600, marginBottom: 16, color: C.text },
  h3: { fontFamily: FONT.h, fontSize: 16, fontWeight: 600, marginBottom: 12, color: C.text },
  mono: { fontFamily: FONT.m, fontSize: 12 },
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modalInner: { background: "#fff", borderRadius: 16, padding: 28, maxWidth: 600, width: "90%", maxHeight: "80vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.2)" },
  aiPanel: { background: "linear-gradient(135deg,#111,#1a180f)", borderRadius: 12, padding: 24, color: "#fff", marginTop: 16 },
  aiBadge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 10, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", background: "rgba(197,162,88,.2)", color: C.gold },
};

// ─── Shared Comps ───
const Spinner = () => <div style={{ width: 20, height: 20, border: "2px solid #ddd", borderTopColor: C.gold, borderRadius: "50%", animation: "spin .6s linear infinite" }} />;

const TABS = ["Overview", "Members", "Vouchers", "Stamps", "Tiers", "Promotions", "Decisions", "Renewals", "Staff", "Checklist"];

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState(0);
  const [members, setMembers] = useState([]);
  const [transactions, setTxns] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, t, r, c] = await Promise.all([
        supaFetch("members?order=id.asc"),
        supaFetch("transactions?order=created_at.desc&limit=50"),
        supaFetch("rewards?order=id.asc"),
        supaFetch("campaigns?order=id.asc"),
      ]);
      if (Array.isArray(m)) setMembers(m);
      if (Array.isArray(t)) setTxns(t);
      if (Array.isArray(r)) setRewards(r);
      if (Array.isArray(c)) setCampaigns(c);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={s.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width:6px; height:6px } ::-webkit-scrollbar-thumb { background:#ccc; border-radius:3px }
      `}</style>
      <div style={s.header}>
        <div style={s.logo}>✦ 1-INSIDER</div>
        <div style={{ fontSize: 12, color: "#666" }}>Admin Dashboard</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {loading && <Spinner />}
          <button onClick={load} style={{ ...s.btnSm, background: "transparent", border: "1px solid #444", color: "#aaa", fontSize: 10 }}>↻ Refresh</button>
        </div>
      </div>
      <div style={s.nav}>
        {TABS.map((t, i) => <div key={i} style={s.tab(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>
      <div style={s.page}>
        {tab === 0 && <Overview members={members} transactions={transactions} campaigns={campaigns} />}
        {tab === 1 && <Members members={members} transactions={transactions} reload={load} />}
        {tab === 2 && <Vouchers />}
        {tab === 3 && <StampsTab />}
        {tab === 4 && <TiersTab members={members} />}
        {tab === 5 && <Promotions campaigns={campaigns} reload={load} />}
        {tab === 6 && <Decisions />}
        {tab === 7 && <Renewals members={members} />}
        {tab === 8 && <StaffTab members={members} />}
        {tab === 9 && <ChecklistTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 1: OVERVIEW
// ═══════════════════════════════════════════════
function Overview({ members, transactions, campaigns }) {
  const totalPts = members.reduce((a, m) => a + (m.points || 0), 0);
  const totalSpend = members.reduce((a, m) => a + parseFloat(m.total_spend || 0), 0);
  const activeCamp = campaigns.filter(c => c.status === "active").length;
  const redeemTxns = transactions.filter(t => t.type === "redeem");
  const tierCounts = ["silver", "gold", "platinum", "corporate", "staff"].map(t => ({
    name: t.charAt(0).toUpperCase() + t.slice(1), value: members.filter(m => m.tier === t).length, fill: TIER[t]?.hex
  }));

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Platform Overview</h2>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          { label: "Total Members", val: members.length, accent: C.gold },
          { label: "Active Campaigns", val: activeCamp, accent: "#2196F3" },
          { label: "Points in Circulation", val: totalPts.toLocaleString(), accent: "#4CAF50" },
          { label: "Total Spend (SGD)", val: `$${totalSpend.toLocaleString()}`, accent: "#B85C38" },
          { label: "Redemptions", val: redeemTxns.length, accent: "#6B4E8B" },
        ].map((k, i) => (
          <div key={i} style={s.kpi}>
            <div style={s.kpiLabel}>{k.label}</div>
            <div style={{ ...s.kpiVal, color: k.accent }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={s.card}>
          <h3 style={s.h3}>Tier Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={tierCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {tierCounts.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {tierCounts.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.fill }} />
                {t.name}: {t.value}
              </div>
            ))}
          </div>
        </div>
        <div style={s.card}>
          <h3 style={s.h3}>Recent Transactions</h3>
          <div style={{ maxHeight: 250, overflow: "auto" }}>
            {transactions.slice(0, 10).map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 12 }}>
                <div>
                  <span style={s.mono}>{t.member_id}</span>
                  <span style={{ color: C.muted, marginLeft: 8 }}>{t.venue || t.reward_name}</span>
                </div>
                <div style={{ fontWeight: 600, color: t.points > 0 ? "#4CAF50" : "#D32F2F" }}>
                  {t.points > 0 ? "+" : ""}{t.points} pts
                </div>
              </div>
            ))}
            {transactions.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>No transactions yet</div>}
          </div>
        </div>
      </div>

      <h3 style={s.h3}>Eber Platform Status</h3>
      {LIMITATIONS.filter(l => l.sev === "high").map((l, i) => (
        <div key={i} style={s.bannerRed}>
          <span>🚫</span>
          <div><strong>{l.id}:</strong> {l.text}<br /><span style={{ color: "#666", fontSize: 11 }}>Workaround: {l.fix}</span></div>
        </div>
      ))}
      <div style={s.bannerGreen}>
        <span>✅</span>
        <div><strong>Active Workarounds:</strong> Gmail MCP renewal reminders, AI Voucher Lifecycle Tracker, Time-based stamp restriction, Per-promotion rule checklists</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 2: MEMBERS
// ═══════════════════════════════════════════════
function Members({ members, transactions, reload }) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = members.filter(m => {
    const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.id?.toLowerCase().includes(search.toLowerCase()) || m.mobile?.includes(search);
    const matchTier = tierFilter === "all" || m.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const memberTxns = selected ? transactions.filter(t => t.member_id === selected.id) : [];

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={s.h2}>Members ({members.length})</h2>
        <button onClick={reload} style={s.btnSm}>↻ Refresh</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input style={{ ...s.input, maxWidth: 300 }} placeholder="Search name, ID, mobile…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...s.input, maxWidth: 150 }} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
          <option value="all">All Tiers</option>
          {["silver","gold","platinum","corporate","staff"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
      </div>
      <div style={{ ...s.card, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: "#fafafa", textAlign: "left" }}>
              {["ID","Name","Mobile","Tier","Points","Spend","Visits","Stamps",""].map((h,i) => (
                <th key={i} style={{ padding: "10px 12px", fontWeight: 600, color: C.lmuted, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #eee" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} style={{ borderBottom: "1px solid #f5f5f5", cursor: "pointer" }} onClick={() => setSelected(m)}>
                <td style={{ padding: "10px 12px", ...s.mono }}>{m.id}</td>
                <td style={{ padding: "10px 12px", fontWeight: 500 }}>{m.name}</td>
                <td style={{ padding: "10px 12px", ...s.mono, color: C.muted }}>{m.mobile}</td>
                <td style={{ padding: "10px 12px" }}><span style={s.badge(m.tier)}>{m.tier}</span></td>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{(m.points||0).toLocaleString()}</td>
                <td style={{ padding: "10px 12px" }}>${parseFloat(m.total_spend||0).toLocaleString()}</td>
                <td style={{ padding: "10px 12px" }}>{m.visits||0}</td>
                <td style={{ padding: "10px 12px" }}>{m.stamps||0}/10</td>
                <td style={{ padding: "10px 12px" }}><span style={{ color: C.gold, fontSize: 11 }}>View →</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 20, color: C.muted, textAlign: "center" }}>No members found</div>}
      </div>

      {selected && (
        <div style={s.modal} onClick={() => setSelected(null)}>
          <div style={s.modalInner} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: FONT.h, fontSize: 20, fontWeight: 600 }}>{selected.name}</div>
                <div style={{ ...s.mono, color: C.muted, marginTop: 2 }}>{selected.id} · {selected.mobile}</div>
              </div>
              <span style={s.badge(selected.tier)}>{selected.tier}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { l: "Points", v: (selected.points||0).toLocaleString() },
                { l: "Total Spend", v: `$${parseFloat(selected.total_spend||0).toLocaleString()}` },
                { l: "Visits", v: selected.visits||0 },
                { l: "Stamps", v: `${selected.stamps||0}/10` },
              ].map((k,i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 8, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: C.lmuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.l}</div>
                  <div style={{ fontFamily: FONT.h, fontSize: 18, fontWeight: 600 }}>{k.v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Email: {selected.email || "—"} · Birthday: Month {selected.birthday_month || "—"} · Favourite: {selected.favourite_venue || "—"}</div>
            <h3 style={{ ...s.h3, marginTop: 16 }}>Transaction History</h3>
            <div style={{ maxHeight: 200, overflow: "auto" }}>
              {memberTxns.map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0", fontSize: 12 }}>
                  <div>{t.type === "redeem" ? `Redeemed: ${t.reward_name}` : t.venue} <span style={{ color: "#aaa" }}>· {new Date(t.created_at).toLocaleDateString()}</span></div>
                  <div style={{ fontWeight: 600, color: t.points > 0 ? "#4CAF50" : "#D32F2F" }}>{t.points > 0 ? "+" : ""}{t.points}</div>
                </div>
              ))}
              {memberTxns.length === 0 && <div style={{ color: C.muted }}>No transactions</div>}
            </div>
            <button style={{ ...s.btn, marginTop: 16, width: "100%" }} onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 3: VOUCHERS
// ═══════════════════════════════════════════════
function Vouchers() {
  const vouchers = [
    { type: "Welcome", tiers: "All tiers", trigger: "Signup", values: "Silver: $10 (min $20 spend) · Gold/Plat/Corp: $10", auto: true },
    { type: "Dining (Non-Stop Hits)", tiers: "Gold, Platinum, Corporate", trigger: "Signup + refill", values: "Gold: 10×$20 ($200) · Plat: 10×$25 ($250) · Corp: 10×$20 ($200)", auto: true },
    { type: "Points Redemption", tiers: "All (excl Staff)", trigger: "Member redeems points", values: "100pts=$10 · 150pts=$15 · 250pts=$25 (base rate)", auto: false },
    { type: "Birthday Discount", tiers: "All", trigger: "Birthday month", values: "Silver 10% · Gold 15% · Plat 20% · Corp 15% (% off total bill, NOT voucher)", auto: true },
  ];

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Voucher Management</h2>
      <div style={s.bannerAmber}><span>⚠️</span><div><strong>P&L Treatment:</strong> Voucher redemption = revenue (ENT-voucher line), NOT COGS discount. Finance team must note this for reporting.</div></div>

      <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
        {vouchers.map((v, i) => (
          <div key={i} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ ...s.h3, margin: 0 }}>{v.type}</h3>
              <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 10, background: v.auto ? "#E8F5E9" : "#E3F2FD", color: v.auto ? "#2E7D32" : "#1565C0", fontWeight: 600 }}>
                {v.auto ? "Auto-issue" : "Manual"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}><strong>Tiers:</strong> {v.tiers}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}><strong>Trigger:</strong> {v.trigger}</div>
            <div style={{ fontSize: 12, color: C.text }}><strong>Values:</strong> {v.values}</div>
          </div>
        ))}
      </div>

      <h3 style={s.h3}>Non-Stop Hits Mechanics</h3>
      <div style={s.card}>
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
          Paid tier members (Gold, Platinum, Corporate) receive unlimited dining voucher refills. When a member fully uses their voucher set, a new set becomes available for <strong>manual claim via the Discover tab</strong>. First set follows calendar-year expiry; subsequent sets do not.
        </div>
        <div style={{ ...s.bannerRed, marginTop: 12 }}><span>🚫</span><div><strong>L06:</strong> Cannot apply calendar-year expiry to 2nd+ manually-claimed voucher sets.<br /><strong>L08:</strong> No auto-refill — members must manually claim from Discover tab.</div></div>
      </div>

      <h3 style={s.h3}>Annual Voucher Lifecycle</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {VOUCHER_LIFECYCLE.map((l, i) => (
          <div key={i} style={{ ...s.card, flex: "1 1 180px", textAlign: "center", minWidth: 160 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{l.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{l.month}</div>
            <div style={{ fontSize: 11.5, color: C.muted }}>{l.action}</div>
          </div>
        ))}
      </div>

      <h3 style={{ ...s.h3, marginTop: 24 }}>Stacking Rules</h3>
      <div style={s.card}>
        {[
          { combo: "Cash voucher + Points voucher", ok: true },
          { combo: "Cash voucher + Cash voucher", ok: false },
          { combo: "Points voucher + Points voucher", ok: false },
          { combo: "Any voucher + Birthday discount", ok: false },
          { combo: "Any voucher + Active promotion", ok: false },
          { combo: "Stamp rewards + Stamp rewards", ok: true },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f5f5f5", fontSize: 12.5 }}>
            <span style={{ fontSize: 14 }}>{r.ok ? "✅" : "❌"}</span> {r.combo}
          </div>
        ))}
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Max per check: 1 cash voucher + 1 points voucher</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 4: STAMPS
// ═══════════════════════════════════════════════
function StampsTab() {
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const runAnalyser = async () => {
    setAiLoading(true);
    setAiResult("");
    try {
      const res = await askClaude(SYS_STAMP, "Analyse typical café spending patterns at Wildseed Café outlets. Average check $18-25, regulars visit 2-3x/month. Recommend optimal time-based restriction window to prevent stamp back-door abuse. Consider the balance between preventing abuse and not penalising genuine frequent visitors.");
      setAiResult(res);
    } catch { setAiResult("Error — please try again."); }
    setAiLoading(false);
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Café Stamp Programme</h2>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>$10 spent = 1 stamp · Café outlets only · 10-stamp card cycle · All tiers</div>

      <div style={s.bannerRed}><span>🚫</span><div><strong>Back-door Issue (L10/L11):</strong> When a member retains unclaimed stamps, the same reward can re-trigger. Multi-transaction splits ($30 across 2 txns) can trigger the same reward twice. Eber cannot natively prevent this.</div></div>
      <div style={s.bannerGreen}><span>✅</span><div><strong>Workaround:</strong> Time-based claim limit (e.g., once per 2 months) as proxy for card cycle restriction. Use AI Stamp Card Analyser to calibrate.</div></div>

      <h3 style={s.h3}>Stamp Card Milestones</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {STAMPS.map((st, i) => (
          <div key={i} style={{
            width: 90, height: 90, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: st.reward ? (st.auto ? "#E8F5E9" : "#FFF8E1") : "#f5f5f5",
            border: st.reward ? (st.auto ? "2px solid #4CAF50" : "2px solid #FFB300") : "2px solid #e0e0e0",
          }}>
            <div style={{ fontFamily: FONT.h, fontSize: 20, fontWeight: 700 }}>{st.s}</div>
            {st.reward && (
              <>
                <div style={{ fontSize: 8, textAlign: "center", padding: "0 4px", color: st.auto ? "#2E7D32" : "#F57F17", fontWeight: 600, marginTop: 2 }}>
                  {st.auto ? "AUTO" : "MANUAL"}
                </div>
                <div style={{ fontSize: 7.5, textAlign: "center", padding: "0 4px", color: "#666", marginTop: 1 }}>{st.reward.slice(0, 25)}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <h3 style={s.h3}>Burn Mechanic</h3>
      <div style={{ ...s.card, fontSize: 13 }}>
        Stamps are deducted upon reward claim. Example: 7 stamps earned → 3rd-stamp reward claimed → 3 stamps burned → 4 stamps remain. Stamps continue accumulating if a milestone is reached but not yet claimed.
      </div>

      <h3 style={s.h3}>Café Outlets</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {CAFE_OUTLETS.map((o, i) => (
          <div key={i} style={{ ...s.card, display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
            <span style={{ fontSize: 20 }}>☕</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{o.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{o.location}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.aiPanel}>
        <div style={s.aiBadge}>✦ AI STAMP CARD ANALYSER</div>
        <p style={{ fontSize: 13, color: "#ccc", margin: "12px 0" }}>Analyse café spending patterns to calibrate the optimal time-based restriction window for the back-door workaround.</p>
        <button onClick={runAnalyser} disabled={aiLoading} style={{ ...s.btn, opacity: aiLoading ? 0.5 : 1 }}>
          {aiLoading ? "Analysing…" : "Run Analysis"}
        </button>
        {aiResult && <pre style={{ marginTop: 16, fontSize: 12, lineHeight: 1.6, color: "#eee", whiteSpace: "pre-wrap", fontFamily: FONT.b }}>{aiResult}</pre>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 5: TIERS
// ═══════════════════════════════════════════════
function TiersTab({ members }) {
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Membership Tiers</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {TIERS_DATA.map(t => {
          const count = members.filter(m => m.tier === t.id).length;
          const tier = TIER[t.id];
          const isPlat = t.id === "platinum";
          return (
            <div key={t.id} style={{ background: tier.grad, borderRadius: 16, padding: 24, color: isPlat || t.id === "corporate" || t.id === "staff" ? "#fff" : C.text, position: "relative" }}>
              {t.paid && <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "3px 10px", fontSize: 10, fontWeight: 600 }}>
                {t.fee ? `$${t.fee}/yr via Stripe` : "By Invite"}
              </div>}
              <div style={{ fontFamily: FONT.h, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 16 }}>{count} member{count !== 1 ? "s" : ""}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, opacity: .7 }}>Earn Rate</div><div style={{ fontWeight: 600, fontSize: 13 }}>{t.earn}</div></div>
                <div><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, opacity: .7 }}>Birthday</div><div style={{ fontWeight: 600, fontSize: 13 }}>{t.bday}</div></div>
                <div><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, opacity: .7 }}>Vouchers</div><div style={{ fontWeight: 600, fontSize: 13 }}>{t.vouchers}</div></div>
              </div>
              <div style={{ fontSize: 11.5, lineHeight: 1.8, opacity: 0.9 }}>
                {t.benefits.map((b, i) => <div key={i}>• {b}</div>)}
              </div>
              {t.nonStop && <div style={{ marginTop: 12, background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600 }}>🔄 Non-Stop Hits Active</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 6: PROMOTIONS
// ═══════════════════════════════════════════════
function Promotions({ campaigns, reload }) {
  const [showForm, setShowForm] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [prompt, setPrompt] = useState("");

  const runCampaignAI = async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    try { setAiResult(await askClaude(SYS_CAMPAIGN, prompt)); } catch { setAiResult("Error"); }
    setAiLoading(false);
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={s.h2}>Promotions & Campaigns</h2>
      </div>

      <div style={s.bannerAmber}><span>⚠️</span><div><strong>CRITICAL:</strong> Eber cannot auto-exclude promotional items from points accrual. You MUST update backend rules BEFORE every promotion starts, and REVERT after it ends.</div></div>

      <h3 style={s.h3}>Per-Promotion Checklist</h3>
      <div style={{ ...s.card, marginBottom: 24 }}>
        {["Update Eber points rules to EXCLUDE promo transactions BEFORE start", "Update stamp rules for café outlets if applicable", "Set Google Calendar reminder to REVERT rules after end", "Verify no overlapping promotions", "Document in Promotion Calendar"].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 12.5, borderBottom: "1px solid #f5f5f5" }}>
            <span style={{ fontSize: 14 }}>☐</span> {item}
          </div>
        ))}
      </div>

      <h3 style={s.h3}>Campaigns from Supabase</h3>
      {campaigns.length > 0 ? campaigns.map((c, i) => (
        <div key={i} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{c.type} · {c.start_date} → {c.end_date}</div>
          </div>
          <span style={s.badge(c.status === "active" ? "gold" : "silver")}>{c.status}</span>
        </div>
      )) : <div style={{ color: C.muted, fontSize: 13 }}>No campaigns in database</div>}

      <div style={{ ...s.aiPanel, marginTop: 24 }}>
        <div style={s.aiBadge}>✦ AI CAMPAIGN BUILDER</div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe your campaign idea (e.g., 'Mother's Day double points at all restaurants')…" style={{ width: "100%", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, padding: 12, color: "#fff", fontSize: 13, fontFamily: FONT.b, minHeight: 60, marginTop: 12, resize: "vertical" }} />
        <button onClick={runCampaignAI} disabled={aiLoading} style={{ ...s.btn, marginTop: 8, opacity: aiLoading ? 0.5 : 1 }}>
          {aiLoading ? "Designing…" : "Design Campaign"}
        </button>
        {aiResult && <pre style={{ marginTop: 16, fontSize: 12, lineHeight: 1.6, color: "#eee", whiteSpace: "pre-wrap", fontFamily: FONT.b }}>{aiResult}</pre>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 7: DECISIONS
// ═══════════════════════════════════════════════
function Decisions() {
  const [items, setItems] = useState(INIT_DECISIONS);

  const toggle = (id) => setItems(prev => prev.map(d => d.id === id ? { ...d, status: d.status === "open" ? "resolved" : "open" } : d));

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Decision Log</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: C.muted }}>Open: {items.filter(d=>d.status==="open").length}</span>
        <span style={{ fontSize: 12, color: "#4CAF50" }}>Resolved: {items.filter(d=>d.status==="resolved").length}</span>
      </div>
      {items.map(d => (
        <div key={d.id} style={{ ...s.card, display: "flex", alignItems: "center", gap: 16, opacity: d.status === "resolved" ? 0.5 : 1 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.status === "open" ? "#FF9800" : "#4CAF50", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, textDecoration: d.status === "resolved" ? "line-through" : "none" }}>{d.title}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{d.note}</div>
          </div>
          <button style={s.btnSm} onClick={() => toggle(d.id)}>
            {d.status === "open" ? "Resolve" : "Reopen"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 8: RENEWALS
// ═══════════════════════════════════════════════
function Renewals({ members }) {
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMember, setAiMember] = useState(null);

  const paidMembers = members.filter(m => m.membership_expiry).sort((a, b) => new Date(a.membership_expiry) - new Date(b.membership_expiry));

  const daysUntil = (d) => { const diff = (new Date(d) - new Date()) / (1000*60*60*24); return Math.ceil(diff); };

  const urgencyColor = (days) => days < 0 ? "#D32F2F" : days <= 7 ? "#D32F2F" : days <= 30 ? "#FF9800" : "#4CAF50";

  const genReminder = async (member) => {
    setAiMember(member);
    setAiLoading(true);
    const days = daysUntil(member.membership_expiry);
    const timing = days <= 1 ? "1 day" : days <= 7 ? "7 days" : "30 days";
    try {
      setAiResult(await askClaude(SYS_RENEWAL, `Write a ${timing}-before-expiry renewal reminder for: Name: ${member.name}, Tier: ${member.tier}, Points: ${member.points}, Visits: ${member.visits}. Expiry: ${member.membership_expiry}.`));
    } catch { setAiResult("Error"); }
    setAiLoading(false);
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Renewal Management</h2>
      <div style={s.bannerRed}><span>🚫</span><div><strong>L02:</strong> Eber does not support auto-renewal. Manual reminder workflow required (Gmail MCP at 30d/7d/1d).</div></div>

      {paidMembers.length > 0 ? paidMembers.map(m => {
        const days = daysUntil(m.membership_expiry);
        return (
          <div key={m.id} style={{ ...s.card, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: urgencyColor(days), flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name} <span style={s.badge(m.tier)}>{m.tier}</span></div>
              <div style={{ fontSize: 11, color: C.muted }}>{m.id} · Expires: {new Date(m.membership_expiry).toLocaleDateString()}</div>
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: urgencyColor(days) }}>
              {days < 0 ? "EXPIRED" : `${days}d left`}
            </div>
            <button style={s.btnSm} onClick={() => genReminder(m)}>AI Reminder</button>
          </div>
        );
      }) : <div style={{ color: C.muted }}>No paid members with expiry dates found</div>}

      {aiResult && (
        <div style={{ ...s.aiPanel, marginTop: 24 }}>
          <div style={s.aiBadge}>✦ AI RENEWAL REMINDER</div>
          {aiMember && <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>For: {aiMember.name} ({aiMember.tier})</div>}
          <pre style={{ marginTop: 12, fontSize: 12, lineHeight: 1.6, color: "#eee", whiteSpace: "pre-wrap", fontFamily: FONT.b }}>{aiResult}</pre>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 9: STAFF
// ═══════════════════════════════════════════════
function StaffTab({ members }) {
  const staff = members.filter(m => m.tier === "staff");
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Staff Management</h2>
      <div style={s.bannerAmber}><span>⚠️</span><div><strong>Dual-Account Warning:</strong> Eber enforces one mobile number = one account. Staff cannot hold a personal and staff account on the same number. Use an alternate mobile for the staff tier.</div></div>
      <div style={s.bannerRed}><span>🚫</span><div><strong>Restriction:</strong> Staff tier mechanics must be provided to Eber before config can begin. Not part of original programme scope — requires separate brief.</div></div>

      <h3 style={s.h3}>Staff Members ({staff.length})</h3>
      {staff.length > 0 ? staff.map(m => (
        <div key={m.id} style={{ ...s.card, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: TIER.staff.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>{(m.name||"S")[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
            <div style={{ ...s.mono, fontSize: 11, color: C.muted }}>{m.id} · {m.mobile}</div>
          </div>
          <span style={s.badge("staff")}>Staff</span>
        </div>
      )) : <div style={{ color: C.muted, fontSize: 13 }}>No staff members registered yet</div>}

      <h3 style={{ ...s.h3, marginTop: 24 }}>Onboarding SOP</h3>
      <div style={s.card}>
        {["Confirm staff member uses an alternate mobile number (not their personal 1-Insider number)", "Create account in Eber under Staff tier", "Issue staff-specific vouchers (details TBC)", "Brief staff on stamp programme (shared with customer tiers)", "Confirm birthday reward mechanics with management before Eber config"].map((step, i) => (
          <div key={i} style={{ padding: "6px 0", fontSize: 12.5, borderBottom: "1px solid #f5f5f5" }}>{i + 1}. {step}</div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 10: CHECKLIST
// ═══════════════════════════════════════════════
function ChecklistTab() {
  const [checks, setChecks] = useState(() => {
    const init = {};
    Object.entries(CHECKLISTS).forEach(([cat, items]) => {
      items.forEach((_, i) => { init[`${cat}-${i}`] = false; });
    });
    return init;
  });

  const toggle = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Operational Checklists</h2>
      {Object.entries(CHECKLISTS).map(([cat, items]) => {
        const done = items.filter((_, i) => checks[`${cat}-${i}`]).length;
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={s.h3}>{cat}</h3>
              <span style={{ fontSize: 11, color: done === items.length ? "#4CAF50" : C.muted }}>{done}/{items.length} complete</span>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,.04)" }}>
              {/* progress bar */}
              <div style={{ height: 3, background: "#f0f0f0" }}>
                <div style={{ height: 3, background: C.gold, width: `${(done/items.length)*100}%`, transition: "width .3s" }} />
              </div>
              {items.map((item, i) => {
                const key = `${cat}-${i}`;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #f5f5f5", cursor: "pointer", fontSize: 12.5 }} onClick={() => toggle(key)}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: checks[key] ? "none" : "1.5px solid #ccc", background: checks[key] ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, flexShrink: 0 }}>
                      {checks[key] && "✓"}
                    </div>
                    <span style={{ textDecoration: checks[key] ? "line-through" : "none", color: checks[key] ? C.muted : C.text }}>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
