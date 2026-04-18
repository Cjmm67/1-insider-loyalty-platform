import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const SUPA_URL = "https://tobtmtshxgpkkucsaxyk.supabase.co";
const SUPA_KEY = "sb_publishable_M_yQLmU_5yc0yTccm4F_oA_xWKyTqx9";
const supaFetch = async (path, opts = {}) => {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", Prefer: opts.prefer || "return=representation" },
    method: opts.method || "GET", body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
};
const askClaude = async (system, user) => {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages: [{ role: "user", content: user }] }),
  });
  const d = await r.json();
  return d.content?.map(b => b.text || "").join("\n") || "No response";
};

const C = { gold: "#C5A258", dark: "#111", bg: "#FAF8F5", text: "#1A1A1A", muted: "#888", lmuted: "#999" };
const TIER = {
  silver: { hex: "#A8A8A8", bg: "#F7F7F7", txt: "#666", grad: "linear-gradient(135deg,#e8e8e8,#d0d0d0)" },
  gold: { hex: "#C5A258", bg: "#FDF8EE", txt: "#8B6914", grad: "linear-gradient(135deg,#C5A258,#D4B978 50%,#A88B3A)" },
  platinum: { hex: "#5C5C5C", bg: "#2D2D2D", txt: "#fff", grad: "linear-gradient(135deg,#3a3a3a,#1a1a1a 50%,#4a4a4a)" },
  corporate: { hex: "#1A3A5C", bg: "#E8EFF5", txt: "#1A3A5C", grad: "linear-gradient(135deg,#1A3A5C,#2A5A8C)" },
  staff: { hex: "#2E7D32", bg: "#E8F5E9", txt: "#2E7D32", grad: "linear-gradient(135deg,#2E7D32,#4CAF50)" },
};
const FONT = { h: "'Playfair Display',Georgia,serif", b: "'DM Sans',system-ui,sans-serif", m: "'JetBrains Mono',monospace" };

const TIERS_DATA = [
  {id:"silver",name:"Silver",fee:0,paid:false,earn:"$1 = 1 pt",bday:"10%",vouchers:"1×$10 welcome",nonStop:false,vValue:10,benefits:["Base earn rate","10% birthday discount","1×$10 welcome voucher","Café stamps","Gift cards"]},
  {id:"gold",name:"Paid Gold",fee:40,paid:true,earn:"$1 = 1.5 pts",bday:"15%",vouchers:"10×$20 dining",nonStop:true,vValue:20,benefits:["Enhanced earn rate","15% birthday discount","10×$20 Non-Stop Hits","Priority reservations","Exclusive events"]},
  {id:"platinum",name:"Paid Platinum",fee:80,paid:true,earn:"$1 = 2 pts",bday:"20%",vouchers:"10×$25 dining",nonStop:true,vValue:25,benefits:["Premium earn rate","20% birthday discount","10×$25 Non-Stop Hits","VIP reservations","Concierge","Chef's table"]},
  {id:"corporate",name:"Corporate",fee:null,paid:true,earn:"$1 = 1.5 pts",bday:"15%",vouchers:"10×$20 dining",nonStop:true,vValue:20,benefits:["Corporate earn rate","15% birthday discount","10×$20 Non-Stop Hits","Bulk gift cards","Dedicated account mgr"]},
  {id:"staff",name:"Staff",fee:0,paid:false,earn:"$1 = 1 pt",bday:"TBC",vouchers:"TBC",nonStop:false,vValue:0,benefits:["Staff dining vouchers","Internal events","Staff promos"]},
];

const STAMPS_MILESTONES = [
  {s:1},{s:2},{s:3,reward:"1-for-1 lunch set",auto:false},{s:4},{s:5,reward:"Cake of the day",auto:false},
  {s:6,reward:"1-for-1 pasta",auto:false},{s:7},{s:8,reward:"20% off dine-in",auto:true},{s:9},{s:10,reward:"Mixed Berry Croffle",auto:true},
];

const CAFE_OUTLETS = [
  {id:"wscafe-fh",name:"Wildseed Café @ 1-Flowerhill",location:"1-Flowerhill"},
  {id:"wscafe-sh",name:"Wildseed Café @ The Summerhouse",location:"The Summerhouse"},
  {id:"wscafe-am",name:"Wildseed Café @ The Alkaff Mansion",location:"The Alkaff Mansion"},
  {id:"wscafe-bg",name:"Wildseed Café @ Botanic Gardens",location:"Singapore Botanic Gardens"},
];

const LIMITATIONS = [
  {id:"L01",text:"No tier benefits on purchase page",fix:"AI-generated benefits page",sev:"medium"},
  {id:"L02",text:"No auto-renewal",fix:"Gmail MCP reminders at 30d/7d/1d",sev:"high"},
  {id:"L04",text:"Cannot exclude promo items from points",fix:"Manual backend rule updates per promotion",sev:"high"},
  {id:"L10",text:"Stamp back-door re-triggering",fix:"Time-based restriction (2 months)",sev:"high"},
];

const VOUCHER_LIFECYCLE = [
  {month:"November",action:"Create next year's voucher set in Staging",icon:"📋"},
  {month:"December",action:"Test → migrate to Production",icon:"🧪"},
  {month:"1 January",action:"New set auto-issues to active paid members",icon:"🎉"},
  {month:"Ongoing",action:"Members manually claim refills",icon:"🔄"},
  {month:"31 December",action:"Unused vouchers forfeited",icon:"⏰"},
];

const INIT_DECISIONS = [
  {id:1,title:"Email OTP request to Eber",status:"open",note:"Remove mobile dependency"},
  {id:2,title:"Direct Agilysys-Eber POS integration",status:"open",note:"Enable item-level data for promo exclusion"},
  {id:3,title:"Staff tier brief to Eber",status:"open",note:"Mechanics must be provided before config"},
  {id:4,title:"Bar applicability for dining vouchers",status:"open",note:"Reconfirm with operations"},
];

const CHECKLISTS = {
  "Pre-Launch": ["All 5 tiers configured in Eber Staging","Points earn rates set (launch: $1=10pts)","Welcome vouchers configured per tier","Dining voucher sets created for Gold/Plat/Corp","Stamp programme configured for 4 café outlets","Member portal revamp tested","Stripe payment links tested","Finance sign off on P&L","Migrate Staging → Production"],
  "Annual Voucher Lifecycle": ["November: Create next year's voucher set in Staging","December: Test → migrate to Production","1 January: Verify new set auto-issues","Ongoing: Monitor manual claims","31 December: Confirm unused vouchers forfeited"],
  "Per-Promotion": ["Update Eber points rules to EXCLUDE promo txns BEFORE start","Update stamp rules for café outlets if applicable","Set Calendar reminder to REVERT rules after end","Verify no overlapping promotions","Document in Promotion Calendar"],
};

const SYS_STAMP = "You are a loyalty programme analyst for 1-Group Singapore's 1-Insider 3.0 café stamp programme.\n- 1 stamp per $10 spent at Wildseed Café outlets (4 locations)\n- 10-stamp card cycle with 2-month loop restart\n- Rewards at stamps 3,5,6 (manual), 8,10 (auto)\n- Burn mechanic: stamps deducted on claim\n- BACK-DOOR ISSUE: Eber cannot prevent re-triggering\nAnalyse and recommend optimal time restriction. Be concise.";
const SYS_CAMPAIGN = "You are a loyalty campaign architect for 1-Group Singapore. 25 venues, 5 tiers. CRITICAL: Eber cannot auto-exclude promo items. When designing: define objective, specify rules to update BEFORE launch, set REVERT DATE, estimate ROI. Always flag Eber limitations.";
const SYS_RENEWAL = "You are a premium hospitality writer for 1-Group. Write a membership renewal reminder. Warm, premium, never desperate. Include greeting, benefits they'll lose, usage stats, [RENEWAL_LINK]. Under 150 words. Sign off from The 1-Insider Team.";

const s = {
  app: { fontFamily: FONT.b, background: C.bg, color: C.text, minHeight: "100vh" },
  header: { background: C.dark, padding: "0 24px", display: "flex", alignItems: "center", height: 56, gap: 16 },
  logo: { fontFamily: FONT.h, color: C.gold, fontSize: 18, fontWeight: 700, letterSpacing: 1 },
  nav: { display: "flex", gap: 2, padding: "0 24px", background: "#fff", borderBottom: "1px solid #eee", overflowX: "auto" },
  tab: (a) => ({ padding: "12px 16px", fontSize: 12.5, fontWeight: a ? 600 : 400, color: a ? C.gold : C.muted, borderBottom: a ? "2px solid " + C.gold : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap" }),
  page: { padding: 24, maxWidth: 1200, margin: "0 auto" },
  card: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 8px rgba(0,0,0,.04)", marginBottom: 16 },
  kpi: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 8px rgba(0,0,0,.04)", flex: 1, minWidth: 160 },
  kpiVal: { fontFamily: FONT.h, fontSize: 28, fontWeight: 700 },
  kpiLabel: { fontSize: 11, color: C.lmuted, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 4 },
  badge: (t) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: TIER[t]?.bg || "#eee", color: TIER[t]?.txt || "#666" }),
  btn: { background: C.gold, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT.b },
  btnSm: { background: C.gold, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT.b },
  btnDanger: { background: "#D32F2F", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT.b },
  btnSuccess: { background: "#4CAF50", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT.b },
  input: { border: "1px solid #ddd", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: FONT.b, width: "100%", boxSizing: "border-box", outline: "none" },
  bannerRed: { background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#B71C1C", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, lineHeight: 1.5 },
  bannerGreen: { background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#1B5E20", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, lineHeight: 1.5 },
  bannerAmber: { background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#5D4037", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, lineHeight: 1.5 },
  h2: { fontFamily: FONT.h, fontSize: 22, fontWeight: 600, marginBottom: 16 },
  h3: { fontFamily: FONT.h, fontSize: 16, fontWeight: 600, marginBottom: 12 },
  mono: { fontFamily: FONT.m, fontSize: 12 },
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modalInner: { background: "#fff", borderRadius: 16, padding: 28, maxWidth: 700, width: "92%", maxHeight: "85vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.2)" },
  aiPanel: { background: "linear-gradient(135deg,#111,#1a180f)", borderRadius: 12, padding: 24, color: "#fff", marginTop: 16 },
  aiBadge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 10, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", background: "rgba(197,162,88,.2)", color: C.gold },
};

const Spinner = () => <div style={{ width: 20, height: 20, border: "2px solid #ddd", borderTopColor: C.gold, borderRadius: "50%", animation: "spin .6s linear infinite" }} />;
const TABS = ["Overview","Members","Vouchers","Stamps","Tiers","Promotions","Decisions","Renewals","Staff","Stores","Checklist"];

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
      const [m,t,r,c] = await Promise.all([
        supaFetch("members?order=id.asc"),
        supaFetch("transactions?order=created_at.desc&limit=50"),
        supaFetch("rewards?order=id.asc"),
        supaFetch("campaigns?order=id.asc"),
      ]);
      if (Array.isArray(m)) setMembers(m);
      if (Array.isArray(t)) setTxns(t);
      if (Array.isArray(r)) setRewards(r);
      if (Array.isArray(c)) setCampaigns(c);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Demo reset: Ctrl+Shift+R resets Sophia to test defaults before page reloads
  useEffect(() => {
    var DEMO = { points: 5000, stamps: 10, vouchers_remaining: 10, voucher_sets_used: 1 };
    var handleKey = function(e) {
      if (e.ctrlKey && e.shiftKey && e.key === "R") {
        e.preventDefault();
        fetch(SUPA_URL + "/rest/v1/members?id=eq.M0001", {
          method: "PATCH",
          headers: { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(DEMO),
        }).then(function() { window.location.reload(); });
      }
    };
    window.addEventListener("keydown", handleKey);
    return function() { window.removeEventListener("keydown", handleKey); };
  }, []);

  return (
    <div style={s.app}>
      <style>{
        "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');" +
        "@keyframes spin { to { transform:rotate(360deg) } }" +
        "@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }" +
        "* { box-sizing:border-box; margin:0; padding:0 }" +
        "::-webkit-scrollbar { width:6px; height:6px } ::-webkit-scrollbar-thumb { background:#ccc; border-radius:3px }"
      }</style>
      <div style={s.header}>
        <div style={s.logo}>✦ 1-INSIDER</div>
        <div style={{ fontSize: 12, color: "#666" }}>Admin Dashboard</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {loading && <Spinner />}
          <button onClick={load} style={{ ...s.btnSm, background: "transparent", border: "1px solid #444", color: "#aaa", fontSize: 10 }}>↻ Refresh</button>
        </div>
      </div>
      <div style={s.nav}>
        {TABS.map((t,i) => <div key={i} style={s.tab(tab===i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>
      <div style={s.page}>
        {tab===0 && <Overview members={members} transactions={transactions} campaigns={campaigns} />}
        {tab===1 && <Members members={members} transactions={transactions} reload={load} />}
        {tab===2 && <Vouchers />}
        {tab===3 && <StampsTab />}
        {tab===4 && <TiersTab members={members} />}
        {tab===5 && <Promotions campaigns={campaigns} />}
        {tab===6 && <Decisions />}
        {tab===7 && <Renewals members={members} />}
        {tab===8 && <StaffTab members={members} />}
        {tab===9 && <StoresTab />}
        {tab===10 && <ChecklistTab />}
      </div>
    </div>
  );
}

// ─── OVERVIEW ───
function Overview({ members, transactions, campaigns }) {
  const totalPts = members.reduce((a,m) => a + (m.points||0), 0);
  const totalSpend = members.reduce((a,m) => a + parseFloat(m.total_spend||0), 0);
  const tierCounts = ["silver","gold","platinum","corporate","staff"].map(t => ({ name: t[0].toUpperCase()+t.slice(1), value: members.filter(m => m.tier===t).length, fill: TIER[t]?.hex }));
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Platform Overview</h2>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        {[{l:"Total Members",v:members.length,c:C.gold},{l:"Active Campaigns",v:campaigns.filter(c=>c.status==="active").length,c:"#2196F3"},{l:"Points in Circulation",v:totalPts.toLocaleString(),c:"#4CAF50"},{l:"Total Spend (SGD)",v:"$"+totalSpend.toLocaleString(),c:"#B85C38"},{l:"Redemptions",v:transactions.filter(t=>t.type==="redeem").length,c:"#6B4E8B"}].map((k,i) => (
          <div key={i} style={s.kpi}><div style={s.kpiLabel}>{k.l}</div><div style={{...s.kpiVal,color:k.c}}>{k.v}</div></div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={s.card}>
          <h3 style={s.h3}>Tier Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={tierCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {tierCounts.map((e,i) => <Cell key={i} fill={e.fill} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {tierCounts.map((t,i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: t.fill }} />{t.name}: {t.value}</div>)}
          </div>
        </div>
        <div style={s.card}>
          <h3 style={s.h3}>Recent Transactions</h3>
          <div style={{ maxHeight: 230, overflow: "auto" }}>
            {transactions.slice(0,10).map((t,i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 12 }}>
                <div><span style={s.mono}>{t.member_id}</span> <span style={{ color: C.muted, marginLeft: 8 }}>{t.reward_name || t.venue}</span></div>
                <div style={{ fontWeight: 600, color: t.points > 0 ? "#4CAF50" : t.points < 0 ? "#D32F2F" : C.muted }}>{t.points > 0 ? "+":""}{t.points} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <h3 style={s.h3}>Eber Platform Status</h3>
      {LIMITATIONS.filter(l => l.sev==="high").map((l,i) => <div key={i} style={s.bannerRed}><span>🚫</span><div><strong>{l.id}:</strong> {l.text}<br /><span style={{ color: "#666", fontSize: 11 }}>Workaround: {l.fix}</span></div></div>)}
      <div style={s.bannerGreen}><span>✅</span><div><strong>Active:</strong> Gmail MCP renewals, AI Voucher Tracker, Time-based stamp restriction, Per-promotion checklists</div></div>
      <div style={s.bannerAmber}><span>⚠️</span><div><strong>Demo Mode:</strong> Stamp depletion and voucher usage managed via Admin Dashboard until Agilysys/SevenRooms POS integration is live.</div></div>
    </div>
  );
}

// ─── MEMBERS (with stamp/voucher management) ───
function Members({ members, transactions, reload }) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [actionMsg, setActionMsg] = useState("");

  const filtered = members.filter(m => {
    const ms = !search || (m.name||"").toLowerCase().includes(search.toLowerCase()) || (m.id||"").toLowerCase().includes(search.toLowerCase()) || (m.mobile||"").includes(search);
    return ms && (tierFilter === "all" || m.tier === tierFilter);
  });

  const memberTxns = selected ? transactions.filter(t => t.member_id === selected.id) : [];
  const tierData = selected ? TIERS_DATA.find(t => t.id === selected.tier) : null;

  const flash = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(""), 3000); };

  // ── Admin Actions ──
  const deductStamp = async () => {
    if (!selected || (selected.stamps||0) <= 0) return;
    var newStamps = (selected.stamps||0) - 1;
    await supaFetch("members?id=eq." + selected.id, { method: "PATCH", body: { stamps: newStamps } });
    await supaFetch("transactions", { method: "POST", body: { member_id: selected.id, venue: "Wildseed Café", amount: 10, points: 0, type: "adjust", reward_name: "Stamp used (admin)", note: "Stamps: " + (selected.stamps||0) + " → " + newStamps } });
    flash("1 stamp deducted → " + newStamps + " remaining");
    reload();
    setSelected(prev => prev ? {...prev, stamps: newStamps} : null);
  };

  const addStamp = async () => {
    if (!selected) return;
    var newStamps = (selected.stamps||0) + 1;
    await supaFetch("members?id=eq." + selected.id, { method: "PATCH", body: { stamps: newStamps } });
    await supaFetch("transactions", { method: "POST", body: { member_id: selected.id, venue: "Wildseed Café", amount: 10, points: 0, type: "earn", reward_name: "Stamp earned (admin)", note: "Stamps: " + (selected.stamps||0) + " → " + newStamps } });
    flash("1 stamp added → " + newStamps + " total");
    reload();
    setSelected(prev => prev ? {...prev, stamps: newStamps} : null);
  };

  const useVoucher = async () => {
    if (!selected || !tierData || (selected.vouchers_remaining||0) <= 0) return;
    var newV = (selected.vouchers_remaining||0) - 1;
    await supaFetch("members?id=eq." + selected.id, { method: "PATCH", body: { vouchers_remaining: newV } });
    await supaFetch("transactions", { method: "POST", body: { member_id: selected.id, venue: "1-Insider Vouchers", amount: tierData.vValue, points: 0, type: "redeem", reward_name: "$" + tierData.vValue + " Dining Voucher (Non-Stop Hits)", note: "Vouchers: " + (selected.vouchers_remaining||0) + " → " + newV } });
    flash("$" + tierData.vValue + " voucher used → " + newV + " remaining");
    reload();
    setSelected(prev => prev ? {...prev, vouchers_remaining: newV} : null);
  };

  const refillVouchers = async () => {
    if (!selected || !tierData?.nonStop) return;
    await supaFetch("members?id=eq." + selected.id, { method: "PATCH", body: { vouchers_remaining: 10, voucher_sets_used: (selected.voucher_sets_used||0) + 1 } });
    await supaFetch("transactions", { method: "POST", body: { member_id: selected.id, venue: "1-Insider Vouchers", amount: 0, points: 0, type: "adjust", reward_name: "Non-Stop Hits — New set issued (admin)", note: "Set #" + ((selected.voucher_sets_used||0) + 1) } });
    flash("Non-Stop Hits refilled → 10 vouchers");
    reload();
    setSelected(prev => prev ? {...prev, vouchers_remaining: 10, voucher_sets_used: (prev.voucher_sets_used||0)+1} : null);
  };

  const claimStampReward = async (milestone) => {
    if (!selected || (selected.stamps||0) < milestone.s) return;
    var newStamps = Math.max(0, (selected.stamps||0) - milestone.s);
    await supaFetch("members?id=eq." + selected.id, { method: "PATCH", body: { stamps: newStamps } });
    await supaFetch("transactions", { method: "POST", body: { member_id: selected.id, venue: "Wildseed Café", amount: 0, points: 0, type: "redeem", reward_name: "Stamp Reward: " + milestone.reward, note: milestone.s + " stamps burned → " + newStamps + " remaining" } });
    flash("Stamp reward claimed: " + milestone.reward + " (" + milestone.s + " stamps burned)");
    reload();
    setSelected(prev => prev ? {...prev, stamps: newStamps} : null);
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={s.h2}>Members ({members.length})</h2>
        <button onClick={reload} style={s.btnSm}>↻ Refresh</button>
      </div>
      <div style={s.bannerAmber}><span>⚠️</span><div><strong>Demo Mode:</strong> Use member detail panel to manually process stamp earnings, stamp reward claims, and Non-Stop Hits voucher usage. All actions sync to the Member Portal in real-time via Supabase.</div></div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input style={{ ...s.input, maxWidth: 300 }} placeholder="Search name, ID, mobile…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...s.input, maxWidth: 150 }} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
          <option value="all">All Tiers</option>
          {["silver","gold","platinum","corporate","staff"].map(t => <option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}
        </select>
      </div>
      <div style={{ ...s.card, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead><tr style={{ background: "#fafafa", textAlign: "left" }}>
            {["ID","Name","Tier","Points","Stamps","Vouchers","Visits",""].map((h,i) => (
              <th key={i} style={{ padding: "10px 12px", fontWeight: 600, color: C.lmuted, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #eee" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} style={{ borderBottom: "1px solid #f5f5f5", cursor: "pointer" }} onClick={() => setSelected(m)}>
                <td style={{ padding: "10px 12px", ...s.mono }}>{m.id}</td>
                <td style={{ padding: "10px 12px", fontWeight: 500 }}>{m.name}</td>
                <td style={{ padding: "10px 12px" }}><span style={s.badge(m.tier)}>{m.tier}</span></td>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{(m.points||0).toLocaleString()}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: (m.stamps||0) > 0 ? "#4CAF50" : C.muted }}>{m.stamps||0}/10</td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: (m.vouchers_remaining||0) > 0 ? C.gold : C.muted }}>{m.vouchers_remaining||0}</td>
                <td style={{ padding: "10px 12px" }}>{m.visits||0}</td>
                <td style={{ padding: "10px 12px" }}><span style={{ color: C.gold, fontSize: 11 }}>Manage →</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MEMBER MANAGEMENT MODAL ── */}
      {selected && (
        <div style={s.modal} onClick={() => { setSelected(null); setActionMsg(""); }}>
          <div style={s.modalInner} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: FONT.h, fontSize: 20, fontWeight: 600 }}>{selected.name}</div>
                <div style={{ ...s.mono, color: C.muted, marginTop: 2 }}>{selected.id} · {selected.mobile}</div>
              </div>
              <span style={s.badge(selected.tier)}>{selected.tier}</span>
            </div>

            {/* Action feedback */}
            {actionMsg && <div style={s.bannerGreen}><span>✅</span><div>{actionMsg}</div></div>}

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[{l:"Points",v:(selected.points||0).toLocaleString()},{l:"Total Spend",v:"$"+parseFloat(selected.total_spend||0).toLocaleString()},{l:"Visits",v:selected.visits||0},{l:"Sets Used",v:selected.voucher_sets_used||0}].map((k,i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 8, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: C.lmuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{k.l}</div>
                  <div style={{ fontFamily: FONT.h, fontSize: 16, fontWeight: 600 }}>{k.v}</div>
                </div>
              ))}
            </div>

            {/* ── STAMP MANAGEMENT ── */}
            <div style={{ background: "#FFFDE7", border: "1px solid #FFF176", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ ...s.h3, margin: 0 }}>☕ Café Stamps</h3>
                <div style={{ fontFamily: FONT.h, fontSize: 22, fontWeight: 700, color: C.gold }}>{selected.stamps||0}<span style={{ fontSize: 12, color: C.muted }}>/10</span></div>
              </div>
              {/* Stamp visual */}
              <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                {STAMPS_MILESTONES.map((st,i) => {
                  var filled = i < (selected.stamps||0);
                  return (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700,
                      background: filled ? (st.reward ? C.gold : "#333") : (st.reward ? "#FFF8E1" : "#f0f0f0"),
                      color: filled ? "#fff" : (st.reward ? "#F57F17" : "#ccc"),
                      border: st.reward ? "2px solid " + (st.auto ? "#4CAF50" : "#FFB300") : "1px solid #ddd",
                    }}>{st.s}</div>
                  );
                })}
              </div>
              {/* Stamp actions */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={addStamp} style={s.btnSuccess}>+ Add Stamp</button>
                <button onClick={deductStamp} disabled={(selected.stamps||0)<=0} style={{ ...s.btnDanger, opacity: (selected.stamps||0)>0 ? 1 : 0.4 }}>− Remove Stamp</button>
              </div>
              {/* Claimable stamp rewards */}
              {STAMPS_MILESTONES.filter(st => st.reward && (selected.stamps||0) >= st.s).length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 6 }}>Claimable Rewards (burns stamps):</div>
                  {STAMPS_MILESTONES.filter(st => st.reward && (selected.stamps||0) >= st.s).map((st,i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f5f5f5", fontSize: 12 }}>
                      <div><strong>Stamp {st.s}:</strong> {st.reward} <span style={{ color: C.muted }}>· burns {st.s} stamps</span></div>
                      <button onClick={() => claimStampReward(st)} style={s.btnSm}>Claim</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── VOUCHER MANAGEMENT ── */}
            {tierData && tierData.vValue > 0 && (
              <div style={{ background: "#FDF8EE", border: "1px solid " + C.gold + "44", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ ...s.h3, margin: 0 }}>🎟️ {tierData.nonStop ? "Non-Stop Hits" : "Dining"} Vouchers</h3>
                  <div style={{ fontFamily: FONT.h, fontSize: 22, fontWeight: 700, color: C.gold }}>{selected.vouchers_remaining||0}<span style={{ fontSize: 12, color: C.muted }}> × ${tierData.vValue}</span></div>
                </div>
                {/* Voucher dots */}
                <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                  {Array.from({length: 10}).map((_,i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700,
                      background: i < (selected.vouchers_remaining||0) ? C.gold : "rgba(197,162,88,.15)", color: i < (selected.vouchers_remaining||0) ? "#fff" : "#ccc",
                    }}>$</div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={useVoucher} disabled={(selected.vouchers_remaining||0)<=0} style={{ ...s.btnDanger, opacity: (selected.vouchers_remaining||0)>0 ? 1 : 0.4 }}>
                    Use ${tierData.vValue} Voucher
                  </button>
                  {tierData.nonStop && (
                    <button onClick={refillVouchers} disabled={(selected.vouchers_remaining||0)>0} style={{ ...s.btnSuccess, opacity: (selected.vouchers_remaining||0)===0 ? 1 : 0.4 }}>
                      🔄 Refill (Non-Stop Hits)
                    </button>
                  )}
                </div>
                {tierData.nonStop && <div style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>Non-Stop Hits: unlimited refills when set is fully used. Sets claimed: {selected.voucher_sets_used||0}</div>}
              </div>
            )}

            {/* Transaction History */}
            <h3 style={s.h3}>Transaction History</h3>
            <div style={{ maxHeight: 180, overflow: "auto" }}>
              {memberTxns.map((t,i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0", fontSize: 12 }}>
                  <div>{t.reward_name || t.venue} <span style={{ color: "#aaa" }}>· {new Date(t.created_at).toLocaleDateString()}</span>{t.note && <span style={{ color: "#aaa" }}> · {t.note}</span>}</div>
                  <div style={{ fontWeight: 600, color: t.points > 0 ? "#4CAF50" : t.points < 0 ? "#D32F2F" : C.muted }}>{t.points !== 0 ? (t.points > 0 ? "+" : "") + t.points + " pts" : "—"}</div>
                </div>
              ))}
              {memberTxns.length === 0 && <div style={{ color: C.muted }}>No transactions</div>}
            </div>
            <button style={{ ...s.btn, marginTop: 16, width: "100%" }} onClick={() => { setSelected(null); setActionMsg(""); }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VOUCHERS ───
function Vouchers() {
  const vouchers = [
    { type: "Welcome", tiers: "All tiers", trigger: "Signup", values: "Silver: $10 (min $20) · Gold/Plat/Corp: $10", auto: true },
    { type: "Dining (Non-Stop Hits)", tiers: "Gold, Platinum, Corporate", trigger: "Signup + refill", values: "Gold: 10×$20 · Plat: 10×$25 · Corp: 10×$20", auto: true },
    { type: "Points Redemption", tiers: "All (excl Staff)", trigger: "Member redeems points", values: "100pts=$10 · 150pts=$15 · 250pts=$25", auto: false },
    { type: "Birthday Discount", tiers: "All", trigger: "Birthday month", values: "Silver 10% · Gold 15% · Plat 20% (% off bill, NOT voucher)", auto: true },
  ];
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Voucher Management</h2>
      <div style={s.bannerAmber}><span>⚠️</span><div><strong>P&L:</strong> Voucher redemption = revenue (ENT-voucher), NOT COGS discount.</div></div>
      {vouchers.map((v,i) => (
        <div key={i} style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ ...s.h3, margin: 0 }}>{v.type}</h3>
            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 10, background: v.auto ? "#E8F5E9" : "#E3F2FD", color: v.auto ? "#2E7D32" : "#1565C0", fontWeight: 600 }}>{v.auto ? "Auto" : "Manual"}</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted }}><strong>Tiers:</strong> {v.tiers} · <strong>Trigger:</strong> {v.trigger}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}><strong>Values:</strong> {v.values}</div>
        </div>
      ))}
      <h3 style={s.h3}>Annual Lifecycle</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {VOUCHER_LIFECYCLE.map((l,i) => (
          <div key={i} style={{ ...s.card, flex: "1 1 160px", textAlign: "center", minWidth: 140 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{l.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{l.month}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{l.action}</div>
          </div>
        ))}
      </div>
      <h3 style={{ ...s.h3, marginTop: 20 }}>Stacking Rules</h3>
      <div style={s.card}>
        {[{c:"Cash voucher + Points voucher",ok:true},{c:"Cash + Cash voucher",ok:false},{c:"Points + Points voucher",ok:false},{c:"Any voucher + Birthday discount",ok:false},{c:"Any voucher + Active promotion",ok:false},{c:"Stamp rewards + Stamp rewards",ok:true}].map((r,i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f5f5f5", fontSize: 12.5 }}>{r.ok ? "✅" : "❌"} {r.c}</div>
        ))}
      </div>
    </div>
  );
}

// ─── STAMPS ───
function StampsTab() {
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Café Stamp Programme</h2>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>$10 = 1 stamp · Café outlets only · 10-stamp cycle · All tiers</div>
      <div style={s.bannerRed}><span>🚫</span><div><strong>Back-door Issue:</strong> Unclaimed stamps can re-trigger the same reward. Multi-txn splits ($30 across 2 txns) trigger twice.</div></div>
      <div style={s.bannerGreen}><span>✅</span><div><strong>Workaround:</strong> Time-based claim limit (2 months). Admin manages stamps manually until POS integration.</div></div>
      <h3 style={s.h3}>Milestones</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {STAMPS_MILESTONES.map((st,i) => (
          <div key={i} style={{ width: 85, height: 85, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: st.reward ? (st.auto ? "#E8F5E9" : "#FFF8E1") : "#f5f5f5", border: st.reward ? "2px solid " + (st.auto ? "#4CAF50" : "#FFB300") : "2px solid #e0e0e0" }}>
            <div style={{ fontFamily: FONT.h, fontSize: 20, fontWeight: 700 }}>{st.s}</div>
            {st.reward && <div style={{ fontSize: 7, textAlign: "center", padding: "0 4px", color: st.auto ? "#2E7D32" : "#F57F17", fontWeight: 600, marginTop: 2 }}>{st.auto ? "AUTO" : "MANUAL"}</div>}
            {st.reward && <div style={{ fontSize: 7, textAlign: "center", padding: "0 4px", color: "#666" }}>{(st.reward||"").slice(0,22)}</div>}
          </div>
        ))}
      </div>
      <h3 style={s.h3}>Café Outlets</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {CAFE_OUTLETS.map((o,i) => (
          <div key={i} style={{ ...s.card, display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
            <span style={{ fontSize: 20 }}>☕</span>
            <div><div style={{ fontWeight: 600, fontSize: 13 }}>{o.name}</div><div style={{ fontSize: 11, color: C.muted }}>{o.location}</div></div>
          </div>
        ))}
      </div>
      <div style={s.aiPanel}>
        <div style={s.aiBadge}>✦ AI STAMP CARD ANALYSER</div>
        <p style={{ fontSize: 13, color: "#ccc", margin: "12px 0" }}>Analyse café spending patterns to calibrate the time-based restriction window.</p>
        <button onClick={async () => { setAiLoading(true); setAiResult(await askClaude(SYS_STAMP, "Analyse typical Wildseed Café spending: avg check $18-25, regulars 2-3x/month. Recommend optimal restriction window.")); setAiLoading(false); }} disabled={aiLoading} style={{ ...s.btn, opacity: aiLoading ? 0.5 : 1 }}>{aiLoading ? "Analysing…" : "Run Analysis"}</button>
        {aiResult && <pre style={{ marginTop: 16, fontSize: 12, lineHeight: 1.6, color: "#eee", whiteSpace: "pre-wrap", fontFamily: FONT.b }}>{aiResult}</pre>}
      </div>
    </div>
  );
}

// ─── TIERS ───
function TiersTab({ members }) {
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Membership Tiers</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {TIERS_DATA.map(t => {
          var count = members.filter(m => m.tier===t.id).length;
          var tier = TIER[t.id]; var dark = ["platinum","corporate","staff"].includes(t.id);
          return (
            <div key={t.id} style={{ background: tier.grad, borderRadius: 16, padding: 24, color: dark ? "#fff" : C.text, position: "relative" }}>
              {t.paid && <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "3px 10px", fontSize: 10, fontWeight: 600 }}>{t.fee ? "$"+t.fee+"/yr" : "Invite"}</div>}
              <div style={{ fontFamily: FONT.h, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 16 }}>{count} member{count!==1?"s":""}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[{l:"Earn",v:t.earn},{l:"Birthday",v:t.bday},{l:"Vouchers",v:t.vouchers}].map((k,i) => (
                  <div key={i}><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, opacity: .7 }}>{k.l}</div><div style={{ fontWeight: 600, fontSize: 13 }}>{k.v}</div></div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, lineHeight: 1.8, opacity: 0.9 }}>{t.benefits.map((b,i) => <div key={i}>• {b}</div>)}</div>
              {t.nonStop && <div style={{ marginTop: 12, background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600 }}>🔄 Non-Stop Hits</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PROMOTIONS ───
function Promotions({ campaigns }) {
  const [aiResult, setAiResult] = useState(""); const [aiLoading, setAiLoading] = useState(false); const [prompt, setPrompt] = useState("");
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Promotions</h2>
      <div style={s.bannerAmber}><span>⚠️</span><div><strong>CRITICAL:</strong> Eber cannot auto-exclude promo items. Update rules BEFORE every promotion, REVERT after.</div></div>
      <h3 style={s.h3}>Per-Promotion Checklist</h3>
      <div style={s.card}>
        {["Update Eber points rules BEFORE start","Update stamp rules if applicable","Set Calendar reminder to REVERT","Verify no overlapping promotions","Document in calendar"].map((item,i) => (
          <div key={i} style={{ padding: "6px 0", fontSize: 12.5, borderBottom: "1px solid #f5f5f5" }}>☐ {item}</div>
        ))}
      </div>
      <h3 style={s.h3}>Campaigns</h3>
      {campaigns.length > 0 ? campaigns.map((c,i) => (
        <div key={i} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 11, color: C.muted }}>{c.type} · {c.start_date} → {c.end_date}</div></div>
          <span style={s.badge(c.status==="active" ? "gold" : "silver")}>{c.status}</span>
        </div>
      )) : <div style={{ color: C.muted }}>No campaigns</div>}
      <div style={s.aiPanel}>
        <div style={s.aiBadge}>✦ AI CAMPAIGN BUILDER</div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe your campaign…" style={{ width: "100%", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, padding: 12, color: "#fff", fontSize: 13, fontFamily: FONT.b, minHeight: 60, marginTop: 12, resize: "vertical" }} />
        <button onClick={async () => { if(!prompt.trim()) return; setAiLoading(true); setAiResult(await askClaude(SYS_CAMPAIGN, prompt)); setAiLoading(false); }} disabled={aiLoading} style={{ ...s.btn, marginTop: 8, opacity: aiLoading ? 0.5 : 1 }}>{aiLoading ? "Designing…" : "Design Campaign"}</button>
        {aiResult && <pre style={{ marginTop: 16, fontSize: 12, lineHeight: 1.6, color: "#eee", whiteSpace: "pre-wrap", fontFamily: FONT.b }}>{aiResult}</pre>}
      </div>
    </div>
  );
}

// ─── DECISIONS ───
function Decisions() {
  const [items, setItems] = useState(INIT_DECISIONS);
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Decision Log</h2>
      {items.map(d => (
        <div key={d.id} style={{ ...s.card, display: "flex", alignItems: "center", gap: 16, opacity: d.status==="resolved" ? 0.5 : 1 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.status==="open" ? "#FF9800" : "#4CAF50" }} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13, textDecoration: d.status==="resolved" ? "line-through" : "none" }}>{d.title}</div><div style={{ fontSize: 11, color: C.muted }}>{d.note}</div></div>
          <button style={s.btnSm} onClick={() => setItems(p => p.map(i => i.id===d.id ? {...i, status: i.status==="open"?"resolved":"open"} : i))}>{d.status==="open" ? "Resolve" : "Reopen"}</button>
        </div>
      ))}
    </div>
  );
}

// ─── RENEWALS ───
function Renewals({ members }) {
  const [aiResult, setAiResult] = useState(""); const [aiLoading, setAiLoading] = useState(false); const [aiMem, setAiMem] = useState(null);
  const paid = members.filter(m => m.membership_expiry).sort((a,b) => new Date(a.membership_expiry)-new Date(b.membership_expiry));
  const daysUntil = d => Math.ceil((new Date(d)-new Date())/(86400000));
  const urg = d => d < 0 ? "#D32F2F" : d <= 7 ? "#D32F2F" : d <= 30 ? "#FF9800" : "#4CAF50";
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Renewals</h2>
      <div style={s.bannerRed}><span>🚫</span><div><strong>L02:</strong> No auto-renewal. Manual reminders required.</div></div>
      {paid.map(m => { var d = daysUntil(m.membership_expiry); return (
        <div key={m.id} style={{ ...s.card, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: urg(d) }} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{m.name} <span style={s.badge(m.tier)}>{m.tier}</span></div><div style={{ fontSize: 11, color: C.muted }}>Expires: {new Date(m.membership_expiry).toLocaleDateString()}</div></div>
          <div style={{ fontWeight: 600, color: urg(d) }}>{d < 0 ? "EXPIRED" : d + "d"}</div>
          <button style={s.btnSm} onClick={async () => { setAiMem(m); setAiLoading(true); setAiResult(await askClaude(SYS_RENEWAL, "Name: "+m.name+", Tier: "+m.tier+", Points: "+m.points+", Visits: "+m.visits+". "+( d<=1?"1 day":"30 days")+" before expiry.")); setAiLoading(false); }}>AI Reminder</button>
        </div>
      ); })}
      {aiResult && <div style={s.aiPanel}><div style={s.aiBadge}>✦ RENEWAL REMINDER</div>{aiMem && <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>For: {aiMem.name}</div>}<pre style={{ marginTop: 12, fontSize: 12, lineHeight: 1.6, color: "#eee", whiteSpace: "pre-wrap", fontFamily: FONT.b }}>{aiResult}</pre></div>}
    </div>
  );
}

// ─── STAFF ───
function StaffTab({ members }) {
  var staff = members.filter(m => m.tier==="staff");
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Staff ({staff.length})</h2>
      <div style={s.bannerAmber}><span>⚠️</span><div><strong>Dual-Account:</strong> One mobile = one account. Staff must use alternate number.</div></div>
      {staff.length > 0 ? staff.map(m => (
        <div key={m.id} style={{ ...s.card, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: TIER.staff.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600 }}>{(m.name||"S")[0]}</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{m.name}</div><div style={{ ...s.mono, color: C.muted }}>{m.id} · {m.mobile}</div></div>
          <span style={s.badge("staff")}>Staff</span>
        </div>
      )) : <div style={{ color: C.muted }}>No staff members yet</div>}
    </div>
  );
}

// ─── CHECKLIST ───
function ChecklistTab() {
  const [checks, setChecks] = useState(() => { var o = {}; Object.entries(CHECKLISTS).forEach(([c,items]) => items.forEach((_,i) => { o[c+"-"+i] = false; })); return o; });
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Checklists</h2>
      {Object.entries(CHECKLISTS).map(([cat,items]) => {
        var done = items.filter((_,i) => checks[cat+"-"+i]).length;
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 style={s.h3}>{cat}</h3>
              <span style={{ fontSize: 11, color: done===items.length ? "#4CAF50" : C.muted }}>{done}/{items.length}</span>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,.04)" }}>
              <div style={{ height: 3, background: "#f0f0f0" }}><div style={{ height: 3, background: C.gold, width: (done/items.length*100)+"%" }} /></div>
              {items.map((item,i) => {
                var k = cat+"-"+i;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #f5f5f5", cursor: "pointer", fontSize: 12.5 }} onClick={() => setChecks(p => ({...p,[k]:!p[k]}))}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: checks[k] ? "none" : "1.5px solid #ccc", background: checks[k] ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, flexShrink: 0 }}>{checks[k] && "✓"}</div>
                    <span style={{ textDecoration: checks[k] ? "line-through" : "none", color: checks[k] ? C.muted : C.text }}>{item}</span>
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

// ─── U23 STORES ───
function StoresTab() {
  const [stores, setStores] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: "all", status: "all", eligibility: "all" });
  const [modal, setModal] = useState(null); // { mode: 'edit'|'create', store: {...} } | null
  const [grantingAccess, setGrantingAccess] = useState(null);
  const [currentAdminId, setCurrentAdminId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, ad] = await Promise.all([
        supaFetch("stores?order=category.asc&order=name.asc"),
        supaFetch("admin_users?order=role.asc"),
      ]);
      if (Array.isArray(st)) setStores(st);
      if (Array.isArray(ad)) {
        setAdmins(ad);
        const sa = ad.find(a => a.role === "super_admin");
        if (sa) setCurrentAdminId(sa.id);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const logAudit = async (entityType, entityId, action, before, after, reason) => {
    if (!currentAdminId) return;
    try {
      await supaFetch("audit_log", {
        method: "POST",
        body: {
          admin_user_id: currentAdminId,
          entity_type: entityType,
          entity_id: String(entityId),
          action,
          before_value: before,
          after_value: after,
          reason,
        },
      });
    } catch (e) { console.error("Audit log failed:", e); }
  };

  const filtered = stores.filter(st => {
    if (filters.category !== "all" && st.category !== filters.category) return false;
    if (filters.status !== "all" && st.status !== filters.status) return false;
    if (filters.eligibility === "points" && !st.points_eligible) return false;
    if (filters.eligibility === "stamps" && !st.stamps_eligible) return false;
    return true;
  });

  const blank = () => ({ id: "", name: "", address: "", category: "Restaurants", cuisine: "", location: "", points_eligible: true, stamps_eligible: false, sevenrooms_venue_id: "", agilysys_outlet_id: "", booking_url: "", featured: false, status: "active" });

  const saveStore = async () => {
    if (!modal) return;
    const data = modal.store;
    if (!data.name?.trim()) { alert("Name is required"); return; }
    if (!data.category) { alert("Category is required"); return; }

    if (modal.mode === "create") {
      if (!data.id?.trim()) { alert("Store ID is required (e.g. 'oumi', 'wscafe-fh')"); return; }
      if (!/^[a-z0-9-]+$/.test(data.id)) { alert("Store ID must be lowercase letters, digits, or hyphens only"); return; }
      if (stores.some(st => st.id === data.id)) { alert(`Store ID '${data.id}' already exists`); return; }
      const body = { ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const r = await supaFetch("stores", { method: "POST", body });
      if (Array.isArray(r) && r[0]) await logAudit("store", data.id, "create", null, r[0], null);
    } else {
      const before = stores.find(st => st.id === data.id);
      const after = { ...data, updated_at: new Date().toISOString() };
      delete after.created_at;
      await supaFetch(`stores?id=eq.${data.id}`, { method: "PATCH", body: after });
      await logAudit("store", data.id, "update", before, after, null);
    }
    setModal(null);
    load();
  };

  const toggleStatus = async (store) => {
    const newStatus = store.status === "active" ? "inactive" : "active";
    const warnText = newStatus === "inactive"
      ? `Deactivate ${store.name}?\n\nThis will hide it from Member Portal Explore Outlets, Reservations, and Promotion venue selectors. Active vouchers tied to this store remain valid.`
      : `Activate ${store.name}?`;
    if (!window.confirm(warnText)) return;
    await supaFetch(`stores?id=eq.${store.id}`, { method: "PATCH", body: { status: newStatus, updated_at: new Date().toISOString() } });
    await logAudit("store", store.id, "update", { status: store.status }, { status: newStatus }, `Status toggled to ${newStatus}`);
    load();
  };

  const grantAccess = async (adminId) => {
    const admin = admins.find(a => a.id === adminId);
    if (!admin || !grantingAccess) return;
    const current = admin.venue_scope || [];
    if (current.includes(grantingAccess.id)) { alert(`${admin.name} already has access.`); return; }
    const newScope = [...current, grantingAccess.id];
    await supaFetch(`admin_users?id=eq.${adminId}`, { method: "PATCH", body: { venue_scope: newScope } });
    await logAudit("admin_user", adminId, "grant_venue_access", { venue_scope: current }, { venue_scope: newScope }, `Granted access to ${grantingAccess.name}`);
    setGrantingAccess(null);
    load();
  };

  const revokeAccess = async (admin, storeId, storeName) => {
    if (!window.confirm(`Revoke ${admin.name}'s access to ${storeName}?`)) return;
    const current = admin.venue_scope || [];
    const newScope = current.filter(v => v !== storeId);
    await supaFetch(`admin_users?id=eq.${admin.id}`, { method: "PATCH", body: { venue_scope: newScope } });
    await logAudit("admin_user", admin.id, "revoke_venue_access", { venue_scope: current }, { venue_scope: newScope }, `Revoked access to ${storeName}`);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ ...s.h2, marginBottom: 0 }}>Stores</h2>
        <button onClick={() => setModal({ mode: "create", store: blank() })} style={s.btn}>+ New Store</button>
      </div>

      <div style={s.bannerGreen}>
        <span>✅</span>
        <div>
          <strong>Single source of truth for all venues.</strong> Changes here reflect on Admin Overview, Member Portal Explore Outlets (U04), Reservations (U12), and Promotion venue selectors (U21). Remember to sync SevenRooms and Agilysys outlet IDs where applicable.
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={s.kpi}><div style={s.kpiLabel}>Total Stores</div><div style={s.kpiVal}>{stores.length}</div></div>
        <div style={s.kpi}><div style={s.kpiLabel}>Active</div><div style={s.kpiVal}>{stores.filter(x => x.status === "active").length}</div></div>
        <div style={s.kpi}><div style={s.kpiLabel}>Restaurants</div><div style={s.kpiVal}>{stores.filter(x => x.category === "Restaurants").length}</div></div>
        <div style={s.kpi}><div style={s.kpiLabel}>Bars</div><div style={s.kpiVal}>{stores.filter(x => x.category === "Bars").length}</div></div>
        <div style={s.kpi}><div style={s.kpiLabel}>Cafés</div><div style={s.kpiVal}>{stores.filter(x => x.category === "Cafés").length}</div></div>
      </div>

      <div style={{ ...s.card, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2 }}>Filters</span>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} style={{ ...s.input, width: "auto", padding: "8px 12px" }}>
          <option value="all">All categories</option>
          <option value="Restaurants">Restaurants</option>
          <option value="Bars">Bars</option>
          <option value="Cafés">Cafés</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ ...s.input, width: "auto", padding: "8px 12px" }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={filters.eligibility} onChange={(e) => setFilters({ ...filters, eligibility: e.target.value })} style={{ ...s.input, width: "auto", padding: "8px 12px" }}>
          <option value="all">All eligibility</option>
          <option value="points">Points eligible</option>
          <option value="stamps">Stamps eligible</option>
        </select>
        <div style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>{filtered.length} of {stores.length} shown</div>
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.lmuted }}>No stores match the current filters.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 1100 }}>
              <thead>
                <tr style={{ textAlign: "left", color: C.lmuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                  <th style={{ padding: "10px 8px" }}>Name</th>
                  <th style={{ padding: "10px 8px" }}>Category</th>
                  <th style={{ padding: "10px 8px" }}>Location</th>
                  <th style={{ padding: "10px 8px", textAlign: "center" }}>Points</th>
                  <th style={{ padding: "10px 8px", textAlign: "center" }}>Stamps</th>
                  <th style={{ padding: "10px 8px" }}>SR ID</th>
                  <th style={{ padding: "10px 8px" }}>POS ID</th>
                  <th style={{ padding: "10px 8px" }}>Status</th>
                  <th style={{ padding: "10px 8px" }}>Admins</th>
                  <th style={{ padding: "10px 8px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(store => {
                  const storeAdmins = admins.filter(a => (a.venue_scope || []).includes(store.id));
                  return (
                    <tr key={store.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "10px 8px", fontWeight: 500 }}>
                        {store.featured && <span style={{ color: C.gold, marginRight: 4 }}>★</span>}
                        {store.name}
                        <div style={{ ...s.mono, fontSize: 10, color: C.lmuted }}>{store.id}</div>
                      </td>
                      <td style={{ padding: "10px 8px", color: C.muted }}>{store.category}</td>
                      <td style={{ padding: "10px 8px", color: C.muted, fontSize: 11.5 }}>{store.location}</td>
                      <td style={{ padding: "10px 8px", textAlign: "center", color: store.points_eligible ? "#2E7D32" : C.lmuted }}>{store.points_eligible ? "✓" : "—"}</td>
                      <td style={{ padding: "10px 8px", textAlign: "center", color: store.stamps_eligible ? "#2E7D32" : C.lmuted }}>{store.stamps_eligible ? "✓" : "—"}</td>
                      <td style={{ padding: "10px 8px", ...s.mono, fontSize: 10.5, color: store.sevenrooms_venue_id ? C.text : C.lmuted }}>{store.sevenrooms_venue_id || "—"}</td>
                      <td style={{ padding: "10px 8px", ...s.mono, fontSize: 10.5, color: store.agilysys_outlet_id ? C.text : C.lmuted }}>{store.agilysys_outlet_id || "—"}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: store.status === "active" ? "#E8F5E9" : "#FFEBEE", color: store.status === "active" ? "#2E7D32" : "#B71C1C" }}>
                          {store.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11 }}>
                        {storeAdmins.length === 0 ? <span style={{ color: C.lmuted }}>—</span> : storeAdmins.map(a => (
                          <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f5f5f5", borderRadius: 10, padding: "2px 8px", marginRight: 3, marginBottom: 2, fontSize: 10.5 }}>
                            <span>{a.name.split(" ")[0]}</span>
                            <span onClick={() => revokeAccess(a, store.id, store.name)} style={{ cursor: "pointer", color: "#D32F2F", fontWeight: 700 }} title={`Revoke ${a.name}'s access`}>×</span>
                          </span>
                        ))}
                      </td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                        <button onClick={() => setModal({ mode: "edit", store: { ...store } })} style={s.btnSm}>Edit</button>
                        {" "}
                        <button onClick={() => setGrantingAccess(store)} style={{ ...s.btnSm, background: "#555" }}>+ Admin</button>
                        {" "}
                        <button onClick={() => toggleStatus(store)} style={store.status === "active" ? s.btnDanger : s.btnSuccess}>
                          {store.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create modal */}
      {modal && (
        <div style={s.modal} onClick={() => setModal(null)}>
          <div style={s.modalInner} onClick={(e) => e.stopPropagation()}>
            <div style={s.h3}>{modal.mode === "create" ? "New Store" : `Edit: ${modal.store.name}`}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Store ID</label>
                <input style={{ ...s.input, marginTop: 4, background: modal.mode === "edit" ? "#f5f5f5" : "#fff" }} value={modal.store.id || ""} onChange={(e) => setModal({ ...modal, store: { ...modal.store, id: e.target.value } })} readOnly={modal.mode === "edit"} placeholder="e.g. oumi, wscafe-fh" />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Category</label>
                <select style={{ ...s.input, marginTop: 4 }} value={modal.store.category || "Restaurants"} onChange={(e) => setModal({ ...modal, store: { ...modal.store, category: e.target.value } })}>
                  <option>Restaurants</option>
                  <option>Bars</option>
                  <option>Cafés</option>
                </select>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Name</label>
                <input style={{ ...s.input, marginTop: 4 }} value={modal.store.name || ""} onChange={(e) => setModal({ ...modal, store: { ...modal.store, name: e.target.value } })} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Address</label>
                <input style={{ ...s.input, marginTop: 4 }} value={modal.store.address || ""} onChange={(e) => setModal({ ...modal, store: { ...modal.store, address: e.target.value } })} />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Cuisine</label>
                <input style={{ ...s.input, marginTop: 4 }} value={modal.store.cuisine || ""} onChange={(e) => setModal({ ...modal, store: { ...modal.store, cuisine: e.target.value } })} />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Location</label>
                <input style={{ ...s.input, marginTop: 4 }} value={modal.store.location || ""} onChange={(e) => setModal({ ...modal, store: { ...modal.store, location: e.target.value } })} />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>SevenRooms Venue ID</label>
                <input style={{ ...s.input, marginTop: 4, ...s.mono }} value={modal.store.sevenrooms_venue_id || ""} onChange={(e) => setModal({ ...modal, store: { ...modal.store, sevenrooms_venue_id: e.target.value } })} />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Agilysys Outlet ID</label>
                <input style={{ ...s.input, marginTop: 4, ...s.mono }} value={modal.store.agilysys_outlet_id || ""} onChange={(e) => setModal({ ...modal, store: { ...modal.store, agilysys_outlet_id: e.target.value } })} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Booking URL</label>
                <input style={{ ...s.input, marginTop: 4 }} value={modal.store.booking_url || ""} onChange={(e) => setModal({ ...modal, store: { ...modal.store, booking_url: e.target.value } })} placeholder="https://..." />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, paddingTop: 16 }}>
                <input type="checkbox" checked={!!modal.store.points_eligible} onChange={(e) => setModal({ ...modal, store: { ...modal.store, points_eligible: e.target.checked } })} /> Points eligible
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, paddingTop: 16 }}>
                <input type="checkbox" checked={!!modal.store.stamps_eligible} onChange={(e) => setModal({ ...modal, store: { ...modal.store, stamps_eligible: e.target.checked } })} /> Stamps eligible
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={!!modal.store.featured} onChange={(e) => setModal({ ...modal, store: { ...modal.store, featured: e.target.checked } })} /> Featured
              </label>
            </div>
            <div style={{ ...s.bannerAmber, marginTop: 16 }}>
              <span>⚠️</span>
              <div>Remember to mirror any outlet ID or eligibility changes in SevenRooms and Agilysys. This page is the 1-Insider source of truth, not those systems.</div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => setModal(null)} style={{ ...s.btnSm, background: "#eee", color: "#555" }}>Cancel</button>
              <button onClick={saveStore} style={s.btn}>{modal.mode === "create" ? "Create store" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Grant access modal */}
      {grantingAccess && (
        <div style={s.modal} onClick={() => setGrantingAccess(null)}>
          <div style={{ ...s.modalInner, maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.h3}>Grant admin access</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
              Scope an admin to <strong style={{ color: C.text }}>{grantingAccess.name}</strong>. The admin&apos;s <code style={s.mono}>venue_scope</code> will be updated and audit-logged.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {admins.filter(a => !(a.venue_scope || []).includes(grantingAccess.id)).length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: C.lmuted, fontSize: 13 }}>All admins already have access to this store.</div>
              ) : admins.filter(a => !(a.venue_scope || []).includes(grantingAccess.id)).map(a => (
                <div key={a.id} onClick={() => grantAccess(a.id)} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f9f9f9"} onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, ...s.mono }}>{a.email} · {a.role.replace("_"," ")}</div>
                  </div>
                  <div style={{ fontSize: 11, color: C.lmuted }}>{(a.venue_scope || []).length} scoped</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setGrantingAccess(null)} style={{ ...s.btnSm, background: "#eee", color: "#555" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
