import { useState, useEffect, useCallback, createContext, useContext, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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

const C_CLASSIC = { gold: "#C5A258", dark: "#111", bg: "#FAF8F5", text: "#1A1A1A", muted: "#888", lmuted: "#999" };
const TIER_CLASSIC = {
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

// ─── V2 DARK TOKENS (private-club theme) ─────────────────────────────────
// Activated when URL has ?classic=1 is absent. Preserves every Phase 2
// behaviour — only colour tokens swap. Classic path unchanged.
const C_V2 = {
  gold: "#F5D7A6",   // Soft luxury gold — reads on dark backgrounds
  dark: "#0B0D14",   // Near-black header bar
  bg: "#0F111A",     // Deep navy page background
  text: "#F2F3F5",   // Off-white body text
  muted: "#8C91A0",  // Cool-grey secondary
  lmuted: "#666D7C", // Cool-grey tertiary (uppercase labels)
};
const TIER_V2 = {
  silver:    { hex: "#A8A8A8", bg: "#1F2230", txt: "#D0D4DE", grad: "linear-gradient(135deg,#e8e8e8,#d0d0d0)" },
  gold:      { hex: "#F5D7A6", bg: "#2B2416", txt: "#F5D7A6", grad: "linear-gradient(135deg,#C5A258,#D4B978 50%,#A88B3A)" },
  platinum:  { hex: "#8C91A0", bg: "#1A1D27", txt: "#F2F3F5", grad: "linear-gradient(135deg,#3a3a3a,#1a1a1a 50%,#4a4a4a)" },
  corporate: { hex: "#7FA3C9", bg: "#1A2331", txt: "#B3CEFF", grad: "linear-gradient(135deg,#1A3A5C,#2A5A8C)" },
  staff:     { hex: "#81C784", bg: "#1C2A1F", txt: "#A5D6A7", grad: "linear-gradient(135deg,#2E7D32,#4CAF50)" },
};

const V2_EXTRA = {
  card:        "#1A1D27",
  elevated:    "#23263A",
  divider:     "rgba(242, 243, 245, 0.08)",
  dividerH:    "rgba(242, 243, 245, 0.14)",
  goldSoft:    "#FBE8C9",
  goldBorder:  "rgba(245, 215, 166, 0.35)",
  textOnGold:  "#1A1D27",
};

// Build a complete style object from the active token set. Signature identical
// for classic and V2 — this is where dark-theme surfaces, borders, and
// banner variants diverge.
function buildStyles(C, TIER, isV2) {
  if (isV2) {
    return {
      app: { fontFamily: FONT.b, background: C.bg, color: C.text, minHeight: "100vh" },
      header: { background: C.dark, padding: "0 24px", display: "flex", alignItems: "center", height: 56, gap: 16, borderBottom: "1px solid " + V2_EXTRA.divider },
      logo: { fontFamily: FONT.h, color: C.gold, fontSize: 18, fontWeight: 700, letterSpacing: 1 },
      nav: { display: "flex", gap: 2, padding: "0 24px", background: "rgba(26, 29, 39, 0.88)", backdropFilter: "blur(16px) saturate(120%)", WebkitBackdropFilter: "blur(16px) saturate(120%)", borderBottom: "1px solid " + V2_EXTRA.divider, overflowX: "auto" },
      tab: (a) => ({ padding: "12px 16px", fontSize: 12.5, fontWeight: a ? 600 : 400, color: a ? C.gold : C.muted, borderBottom: a ? "2px solid " + C.gold : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap" }),
      page: { padding: 24, maxWidth: 1200, margin: "0 auto" },
      card: { background: V2_EXTRA.card, borderRadius: 12, padding: 20, boxShadow: "inset 0 1px 0 rgba(242,243,245,0.04), 0 8px 24px rgba(0,0,0,0.25)", marginBottom: 16, border: "1px solid " + V2_EXTRA.divider },
      kpi: { background: V2_EXTRA.card, borderRadius: 12, padding: 20, boxShadow: "inset 0 1px 0 rgba(242,243,245,0.04), 0 8px 24px rgba(0,0,0,0.25)", flex: 1, minWidth: 160, border: "1px solid " + V2_EXTRA.divider },
      kpiVal: { fontFamily: FONT.h, fontSize: 28, fontWeight: 700, color: C.text },
      kpiLabel: { fontSize: 11, color: C.lmuted, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 4 },
      badge: (t) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: TIER[t]?.bg || V2_EXTRA.elevated, color: TIER[t]?.txt || C.muted, border: "1px solid " + V2_EXTRA.divider }),
      btn: { background: C.gold, color: V2_EXTRA.textOnGold, border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT.b, boxShadow: "0 4px 14px rgba(245, 215, 166, 0.2)" },
      btnSm: { background: C.gold, color: V2_EXTRA.textOnGold, border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT.b },
      btnDanger: { background: "#E57373", color: "#1A1D27", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT.b },
      btnSuccess: { background: "#81C784", color: "#1A1D27", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT.b },
      input: { border: "1px solid " + V2_EXTRA.dividerH, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: FONT.b, width: "100%", boxSizing: "border-box", outline: "none", background: V2_EXTRA.elevated, color: C.text },
      bannerRed: { background: "rgba(239, 154, 154, 0.08)", border: "1px solid rgba(239, 154, 154, 0.35)", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#FFB4B4", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, lineHeight: 1.5 },
      bannerGreen: { background: "rgba(165, 214, 167, 0.08)", border: "1px solid rgba(165, 214, 167, 0.35)", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#A5D6A7", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, lineHeight: 1.5 },
      bannerAmber: { background: "rgba(255, 224, 130, 0.08)", border: "1px solid rgba(255, 224, 130, 0.35)", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#FFD180", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, lineHeight: 1.5 },
      h2: { fontFamily: FONT.h, fontSize: 22, fontWeight: 600, marginBottom: 16, color: C.text, letterSpacing: "-0.01em" },
      h3: { fontFamily: FONT.h, fontSize: 16, fontWeight: 600, marginBottom: 12, color: C.text, letterSpacing: "-0.01em" },
      mono: { fontFamily: FONT.m, fontSize: 12, color: C.text },
      modal: { position: "fixed", inset: 0, background: "rgba(11, 13, 20, 0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
      modalInner: { background: V2_EXTRA.card, borderRadius: 16, padding: 28, maxWidth: 700, width: "92%", maxHeight: "85vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.6)", border: "1px solid " + V2_EXTRA.dividerH, color: C.text },
      aiPanel: { background: "linear-gradient(135deg,#0B0D14,#1A1D27)", borderRadius: 12, padding: 24, color: C.text, marginTop: 16, border: "1px solid " + V2_EXTRA.goldBorder },
      aiBadge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 10, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", background: "rgba(245,215,166,.14)", color: C.gold, border: "1px solid " + V2_EXTRA.goldBorder },
    };
  }
  return {
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
}

// Theme context — every sub-component reads C, s, TIER from here.
const ThemeCtx = createContext({
  C: C_CLASSIC,
  TIER: TIER_CLASSIC,
  s: buildStyles(C_CLASSIC, TIER_CLASSIC, false),
  isV2: false,
});

// Back-compat shims — any code path that didn't get a context read falls back
// to the classic palette. Removed once every function is context-aware.
const C = C_CLASSIC;
const TIER = TIER_CLASSIC;
const s = buildStyles(C_CLASSIC, TIER_CLASSIC, false);

function useClassicMode() {
  const [classic, setClassic] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("classic") === "1";
  });
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      setClassic(params.get("classic") === "1");
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
  return classic;
}

const Spinner = () => <div style={{ width: 20, height: 20, border: "2px solid #ddd", borderTopColor: C.gold, borderRadius: "50%", animation: "spin .6s linear infinite" }} />;
const TABS = ["Overview","Members","Vouchers","Stamps","Tiers","Promotions","Decisions","Renewals","Admin Users","Stores","Checklist"];

export default function App() {
  const classic = useClassicMode();
  const theme = useMemo(() => {
    const C = classic ? C_CLASSIC : C_V2;
    const TIER = classic ? TIER_CLASSIC : TIER_V2;
    return { C, TIER, s: buildStyles(C, TIER, !classic), isV2: !classic };
  }, [classic]);
  // Alias for this function body — so every existing s/C/TIER reference
  // below picks up the active theme without touching any Phase 2 logic.
  const { s, C, TIER } = theme;

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
    <ThemeCtx.Provider value={theme}>
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
        <div style={{ fontSize: 12, color: classic ? "#666" : "#8C91A0" }}>Admin Dashboard</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {loading && <Spinner />}
          <a
            href={classic ? "?" : "?classic=1"}
            style={{
              padding: "4px 10px", borderRadius: 9999,
              border: "1px solid " + (classic ? "#444" : "rgba(245,215,166,0.35)"),
              color: classic ? "#aaa" : "#F5D7A6",
              fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase",
              textDecoration: "none", fontFamily: FONT.b, cursor: "pointer",
              background: classic ? "transparent" : "rgba(245,215,166,0.08)",
            }}
          >
            {classic ? "Classic" : "V2 · Private Club"}
          </a>
          <button onClick={load} style={{ ...s.btnSm, background: "transparent", border: "1px solid " + (classic ? "#444" : "rgba(242,243,245,0.14)"), color: classic ? "#aaa" : "#8C91A0", fontSize: 10 }}>↻ Refresh</button>
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
        {tab===8 && <AdminUsersTab members={members} />}
        {tab===9 && <StoresTab />}
        {tab===10 && <ChecklistTab />}
      </div>
    </div>
    </ThemeCtx.Provider>
  );
}

// ─── OVERVIEW ───
function Overview({ members, transactions, campaigns }) {
  const { s, C, TIER, isV2 } = useContext(ThemeCtx);
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
              {tierCounts.map((e,i) => <Cell key={i} fill={e.fill} stroke="none" />)}
            </Pie><Tooltip contentStyle={isV2 ? { background: "#1A1D27", border: "1px solid rgba(242,243,245,0.14)", borderRadius: 8, color: "#F2F3F5", fontSize: 12, fontFamily: FONT.b } : undefined} itemStyle={isV2 ? { color: "#F2F3F5" } : undefined} labelStyle={isV2 ? { color: "#F5D7A6", fontWeight: 600 } : undefined} /></PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {tierCounts.map((t,i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.text }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: t.fill }} />{t.name}: {t.value}</div>)}
          </div>
        </div>
        <div style={s.card}>
          <h3 style={s.h3}>Recent Transactions</h3>
          <div style={{ maxHeight: 230, overflow: "auto" }}>
            {transactions.slice(0,10).map((t,i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + (isV2 ? "rgba(242,243,245,0.08)" : "#f0f0f0"), fontSize: 12 }}>
                <div><span style={s.mono}>{t.member_id}</span> <span style={{ color: C.muted, marginLeft: 8 }}>{t.reward_name || t.venue}</span></div>
                <div style={{ fontWeight: 600, color: t.points > 0 ? (isV2 ? "#A5D6A7" : "#4CAF50") : t.points < 0 ? (isV2 ? "#FFB4B4" : "#D32F2F") : C.muted }}>{t.points > 0 ? "+":""}{t.points} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* U15: Redemptions by Venue */}
      <RedemptionsByVenue />

      <h3 style={s.h3}>Eber Platform Status</h3>
      {LIMITATIONS.filter(l => l.sev==="high").map((l,i) => <div key={i} style={s.bannerRed}><span>🚫</span><div><strong>{l.id}:</strong> {l.text}<br /><span style={{ color: "#666", fontSize: 11 }}>Workaround: {l.fix}</span></div></div>)}
      <div style={s.bannerGreen}><span>✅</span><div><strong>Active:</strong> Gmail MCP renewals, AI Voucher Tracker, Time-based stamp restriction, Per-promotion checklists</div></div>
      <div style={s.bannerAmber}><span>⚠️</span><div><strong>Demo Mode:</strong> Stamp depletion and voucher usage managed via Admin Dashboard until Agilysys/SevenRooms POS integration is live.</div></div>
    </div>
  );
}

// ─── U15 REDEMPTIONS BY VENUE ───
function RedemptionsByVenue() {
  const { s, C, TIER, isV2 } = useContext(ThemeCtx);
  const [txns, setTxns] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30"); // "7" | "30" | "90" | "ytd" | "all"
  const [metric, setMetric] = useState("count"); // "count" | "value"
  const [sortKey, setSortKey] = useState("value"); // for the table
  const [sortDir, setSortDir] = useState("desc");
  const [includePseudo, setIncludePseudo] = useState(false); // "1-Insider Vouchers" etc.

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Compute cutoff inline so the callback identity is keyed on dateRange only
      let cutoffIso = null;
      if (dateRange === "ytd") {
        cutoffIso = new Date(new Date().getFullYear(), 0, 1).toISOString();
      } else if (dateRange !== "all") {
        const days = parseInt(dateRange, 10);
        const d = new Date();
        d.setDate(d.getDate() - days);
        cutoffIso = d.toISOString();
      }
      let path = "transactions?type=eq.redeem&order=created_at.desc";
      if (cutoffIso) path += `&created_at=gte.${cutoffIso}`;
      const [t, st] = await Promise.all([
        supaFetch(path),
        supaFetch("stores?select=id,name,category&order=name.asc"),
      ]);
      if (Array.isArray(t)) setTxns(t);
      if (Array.isArray(st)) setStores(st);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [dateRange]);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  // Resolve venue label for each transaction — prefer store lookup by venue_id, fallback to string
  const storeById = Object.fromEntries(stores.map(st => [st.id, st.name]));
  const PSEUDO_VENUES = new Set(["1-Insider Vouchers", "1-Insider Rewards", "1-Insider Points"]);

  const aggregated = (() => {
    const bucket = {};
    for (const t of txns) {
      const label = (t.venue_id && storeById[t.venue_id]) || t.venue || "Unknown";
      if (!includePseudo && PSEUDO_VENUES.has(label)) continue;
      if (!bucket[label]) bucket[label] = { venue: label, count: 0, value: 0, points: 0 };
      bucket[label].count += 1;
      bucket[label].value += parseFloat(t.amount || 0);
      bucket[label].points += Math.abs(parseInt(t.points || 0, 10));
    }
    return Object.values(bucket);
  })();

  // Sort for table
  const sortedTable = [...aggregated].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === "asc" ? av - bv : bv - av;
  });

  // Top 10 for chart — sort by the active metric
  const chartData = [...aggregated].sort((a, b) => (b[metric] || 0) - (a[metric] || 0)).slice(0, 10);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortIndicator = (key) => sortKey === key ? (sortDir === "desc" ? " ▼" : " ▲") : "";

  const exportCSV = () => {
    const header = ["Venue", "Redemption Count", "Total Value (SGD)", "Points Redeemed"];
    const rows = sortedTable.map(r => [r.venue, r.count, r.value.toFixed(2), r.points]);
    const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redemptions-by-venue-${dateRange}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Totals for summary
  const totalCount = aggregated.reduce((a, r) => a + r.count, 0);
  const totalValue = aggregated.reduce((a, r) => a + r.value, 0);
  const venueCount = aggregated.length;

  const fmtCurrency = (n) => "$" + n.toLocaleString("en-SG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ ...s.card, marginBottom: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ ...s.h3, margin: 0 }}>Redemptions by Venue</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Date range */}
            <div style={{ display: "flex", gap: 1, background: "#f5f5f5", borderRadius: 8, padding: 2 }}>
              {[
                { id: "7",   label: "7d" },
                { id: "30",  label: "30d" },
                { id: "90",  label: "90d" },
                { id: "ytd", label: "YTD" },
                { id: "all", label: "All" },
              ].map(opt => (
                <button key={opt.id} onClick={() => setDateRange(opt.id)}
                  style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer",
                           background: dateRange === opt.id ? "#fff" : "transparent",
                           color: dateRange === opt.id ? C.gold : C.muted,
                           boxShadow: dateRange === opt.id ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Metric toggle */}
            <div style={{ display: "flex", gap: 1, background: "#f5f5f5", borderRadius: 8, padding: 2 }}>
              {[{ id: "count", label: "By Count" }, { id: "value", label: "By Value" }].map(opt => (
                <button key={opt.id} onClick={() => setMetric(opt.id)}
                  style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer",
                           background: metric === opt.id ? "#fff" : "transparent",
                           color: metric === opt.id ? C.gold : C.muted,
                           boxShadow: metric === opt.id ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} style={{ ...s.btnSm, background: "#555" }} disabled={aggregated.length === 0}>⇣ CSV</button>
          </div>
        </div>

        {/* Summary line */}
        <div style={{ display: "flex", gap: 24, marginBottom: 16, fontSize: 12, color: C.muted, flexWrap: "wrap" }}>
          <div><strong style={{ color: C.text, ...s.kpiVal, fontSize: 18 }}>{totalCount.toLocaleString()}</strong><span style={{ marginLeft: 6 }}>redemptions</span></div>
          <div><strong style={{ color: C.text, ...s.kpiVal, fontSize: 18 }}>{fmtCurrency(totalValue)}</strong><span style={{ marginLeft: 6 }}>value</span></div>
          <div><strong style={{ color: C.text, ...s.kpiVal, fontSize: 18 }}>{venueCount}</strong><span style={{ marginLeft: 6 }}>venues</span></div>
          <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
            <input type="checkbox" checked={includePseudo} onChange={e => setIncludePseudo(e.target.checked)} />
            Include issuance pseudo-venues (1-Insider Vouchers / Rewards)
          </label>
        </div>

        {/* Historical data reality banner */}
        <div style={{ ...s.bannerAmber, marginBottom: 16 }}>
          <span>ℹ️</span>
          <div>
            <strong>Venue attribution reality:</strong> current redemption transactions carry a free-text <code style={s.mono}>venue</code> string, not a structured <code style={s.mono}>venue_id</code>.
            Post-U10 (QR voucher redemption) and post-U04/U12 (portal venue links), redemptions will link to the <code style={s.mono}>stores</code> table directly and this widget will become outlet-accurate. Today it reflects what Phase 1 wrote.
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
        ) : aggregated.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.lmuted, fontSize: 13 }}>
            No redemptions in this window. Try a wider date range or enable pseudo-venues.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
            {/* Left: bar chart — top 10 */}
            <div>
              <div style={{ fontSize: 11, color: C.lmuted, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 8 }}>
                Top {Math.min(10, chartData.length)} by {metric === "count" ? "Redemption Count" : "Total Value"}
              </div>
              <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 32)}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isV2 ? "rgba(242,243,245,0.08)" : "#eee"} horizontal={false} />
                  <XAxis type="number" stroke={isV2 ? "#8C91A0" : "#999"} tick={{ fill: isV2 ? "#8C91A0" : "#999", fontSize: 10 }} tickFormatter={(v) => metric === "value" ? fmtCurrency(v) : v} />
                  <YAxis type="category" dataKey="venue" stroke={isV2 ? "#8C91A0" : "#999"} tick={{ fill: isV2 ? "#F2F3F5" : "#333", fontSize: 10 }} width={140} />
                  <Tooltip
                    formatter={(value) => [metric === "value" ? fmtCurrency(value) : value.toLocaleString(), metric === "count" ? "Redemptions" : "Value"]}
                    contentStyle={isV2 ? { background: "#1A1D27", border: "1px solid rgba(242,243,245,0.14)", borderRadius: 8, color: "#F2F3F5", fontSize: 12, fontFamily: FONT.b } : { borderRadius: 8, border: "1px solid #ddd", fontSize: 12 }}
                    itemStyle={isV2 ? { color: "#F2F3F5" } : undefined}
                    labelStyle={isV2 ? { color: "#F5D7A6", fontWeight: 600 } : undefined}
                    cursor={{ fill: isV2 ? "rgba(245,215,166,0.08)" : "rgba(0,0,0,0.04)" }}
                  />
                  <Bar dataKey={metric} fill={C.gold} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Right: sortable table — all venues */}
            <div style={{ maxHeight: Math.max(240, chartData.length * 32) + 40, overflowY: "auto", border: "1px solid " + (isV2 ? "rgba(242,243,245,0.08)" : "#eee"), borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                <thead style={{ position: "sticky", top: 0, background: isV2 ? "#23263A" : "#fafafa", zIndex: 1 }}>
                  <tr style={{ textAlign: "left", color: C.lmuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                    <th onClick={() => toggleSort("venue")} style={{ padding: "10px 8px", cursor: "pointer", borderBottom: "1px solid " + (isV2 ? "rgba(242,243,245,0.08)" : "#eee") }}>
                      Venue{sortIndicator("venue")}
                    </th>
                    <th onClick={() => toggleSort("count")} style={{ padding: "10px 8px", cursor: "pointer", textAlign: "right", borderBottom: "1px solid " + (isV2 ? "rgba(242,243,245,0.08)" : "#eee") }}>
                      Count{sortIndicator("count")}
                    </th>
                    <th onClick={() => toggleSort("value")} style={{ padding: "10px 8px", cursor: "pointer", textAlign: "right", borderBottom: "1px solid " + (isV2 ? "rgba(242,243,245,0.08)" : "#eee") }}>
                      Value{sortIndicator("value")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTable.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid " + (isV2 ? "rgba(242,243,245,0.04)" : "#f5f5f5") }}>
                      <td style={{ padding: "8px", fontWeight: 500, color: C.text }}>
                        {PSEUDO_VENUES.has(r.venue) && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 6, background: isV2 ? "rgba(69, 39, 160, 0.25)" : "#EDE7F6", color: isV2 ? "#C5B4E8" : "#4527A0", marginRight: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>sys</span>}
                        {r.venue}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", fontWeight: 600, color: C.text }}>{r.count}</td>
                      <td style={{ padding: "8px", textAlign: "right", ...s.mono, color: r.value > 0 ? C.text : C.lmuted }}>{r.value > 0 ? fmtCurrency(r.value) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MEMBERS (with stamp/voucher management + U17 profile editing) ───
function Members({ members, transactions, reload }) {
  const { s, C, TIER } = useContext(ThemeCtx);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [actionMsg, setActionMsg] = useState("");

  // U17 state
  const [editingProfile, setEditingProfile] = useState(null); // working copy of member while editing
  const [tierDowngradeConfirm, setTierDowngradeConfirm] = useState(null); // { fromTier, toTier, reason }
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [u17Stores, setU17Stores] = useState([]);
  const [u17CurrentAdminId, setU17CurrentAdminId] = useState(null);

  // U16 state — individual voucher records
  const [memberVouchers, setMemberVouchers] = useState([]);
  const [u16AddModal, setU16AddModal] = useState(null); // voucher draft
  const [u16RemoveConfirm, setU16RemoveConfirm] = useState(null); // { voucher, reason }
  const [u16InProgress, setU16InProgress] = useState(false);
  const [u16Catalogue, setU16Catalogue] = useState([]);

  const filtered = members.filter(m => {
    const ms = !search || (m.name||"").toLowerCase().includes(search.toLowerCase()) || (m.id||"").toLowerCase().includes(search.toLowerCase()) || (m.mobile||"").includes(search);
    return ms && (tierFilter === "all" || m.tier === tierFilter);
  });

  const memberTxns = selected ? transactions.filter(t => t.member_id === selected.id) : [];
  const tierData = selected ? TIERS_DATA.find(t => t.id === selected.tier) : null;

  const flash = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(""), 3000); };

  // U17: lazy-load stores + super admin for attribution when edit modal first opens
  useEffect(() => {
    if (editingProfile && u17Stores.length === 0) {
      (async () => {
        const [st, ad] = await Promise.all([
          supaFetch("stores?select=id,name&status=eq.active&order=name.asc"),
          supaFetch("admin_users?role=eq.super_admin&limit=1"),
        ]);
        if (Array.isArray(st)) setU17Stores(st);
        if (Array.isArray(ad) && ad[0]) setU17CurrentAdminId(ad[0].id);
      })();
    }
  }, [editingProfile, u17Stores.length]);

  const u17LogAudit = async (memberId, action, before, after, reason) => {
    if (!u17CurrentAdminId) { console.warn("Audit log skipped — no admin attribution available"); return; }
    try {
      await supaFetch("audit_log", {
        method: "POST",
        body: {
          admin_user_id: u17CurrentAdminId,
          entity_type: "member",
          entity_id: String(memberId),
          action, before_value: before, after_value: after, reason,
        },
      });
    } catch (e) { console.error("Audit log failed:", e); }
  };

  // U16: fetch individual voucher records when a member is selected; lazy-load catalogue and admin attribution on first open
  useEffect(() => {
    if (!selected) { setMemberVouchers([]); return; }
    (async () => {
      const calls = [supaFetch(`vouchers?member_id=eq.${selected.id}&order=issued_at.desc`)];
      if (u16Catalogue.length === 0) calls.push(supaFetch("voucher_catalogue?active=eq.true&order=name.asc"));
      if (!u17CurrentAdminId) calls.push(supaFetch("admin_users?role=eq.super_admin&limit=1"));
      const results = await Promise.all(calls);
      if (Array.isArray(results[0])) setMemberVouchers(results[0]);
      let idx = 1;
      if (u16Catalogue.length === 0) { if (Array.isArray(results[idx])) setU16Catalogue(results[idx]); idx++; }
      if (!u17CurrentAdminId) { if (Array.isArray(results[idx]) && results[idx][0]) setU17CurrentAdminId(results[idx][0].id); }
    })();
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const u16LogAudit = async (action, voucher, reason) => {
    if (!u17CurrentAdminId) { console.warn("Audit log skipped — no admin attribution"); return null; }
    try {
      const r = await supaFetch("audit_log", {
        method: "POST",
        body: {
          admin_user_id: u17CurrentAdminId,
          entity_type: "voucher",
          entity_id: String(voucher.id),
          action,
          before_value: action === "remove_voucher" ? voucher : null,
          after_value: action === "add_voucher" ? voucher : (action === "remove_voucher" ? { ...voucher, status: "removed", removed_reason: reason } : null),
          reason,
        },
      });
      return Array.isArray(r) && r[0] ? r[0].id : null;
    } catch (e) { console.error("Audit log failed:", e); return null; }
  };

  const u16AddVoucher = async () => {
    if (!u16AddModal || !selected) return;
    const { source, catalogue_id, type, value, reason, notes } = u16AddModal;
    if (!type) { alert("Voucher type is required"); return; }
    if (!value || value <= 0) { alert("Value must be greater than 0"); return; }
    if (!reason) { alert("Reason code is required"); return; }
    setU16InProgress(true);
    try {
      // Insert voucher
      const body = {
        member_id: selected.id,
        catalogue_id: source === "catalogue" ? catalogue_id : null,
        type,
        value: parseFloat(value),
        status: "active",
        source: "manual_admin_add",
      };
      const r = await supaFetch("vouchers", { method: "POST", body });
      if (!Array.isArray(r) || !r[0]) throw new Error("Insert failed");
      const created = r[0];
      const fullReason = notes ? `${reason} — ${notes}` : reason;
      const auditId = await u16LogAudit("add_voucher", created, fullReason);
      if (auditId) {
        await supaFetch(`vouchers?id=eq.${created.id}`, { method: "PATCH", body: { audit_log_id: auditId } });
      }
      flash(`$${value} ${type} voucher added to ${selected.name}'s wallet — audit logged`);
      setU16AddModal(null);
      // Refresh voucher list
      const fresh = await supaFetch(`vouchers?member_id=eq.${selected.id}&order=issued_at.desc`);
      if (Array.isArray(fresh)) setMemberVouchers(fresh);
    } catch (e) {
      console.error("Add voucher failed:", e);
      alert("Add failed. Check console. Nothing written to Supabase.");
    }
    setU16InProgress(false);
  };

  const u16RemoveVoucher = async () => {
    if (!u16RemoveConfirm || !selected) return;
    const { voucher, reason, notes } = u16RemoveConfirm;
    if (!reason) { alert("Reason code is required"); return; }
    setU16InProgress(true);
    try {
      const fullReason = notes ? `${reason} — ${notes}` : reason;
      await supaFetch(`vouchers?id=eq.${voucher.id}`, {
        method: "PATCH",
        body: { status: "removed", removed_reason: fullReason },
      });
      await u16LogAudit("remove_voucher", voucher, fullReason);
      flash(`Voucher #${String(voucher.id).slice(0,8)} removed — audit logged`);
      setU16RemoveConfirm(null);
      const fresh = await supaFetch(`vouchers?member_id=eq.${selected.id}&order=issued_at.desc`);
      if (Array.isArray(fresh)) setMemberVouchers(fresh);
    } catch (e) {
      console.error("Remove voucher failed:", e);
      alert("Remove failed. Check console.");
    }
    setU16InProgress(false);
  };

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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setEditingProfile({ ...selected })} style={{ ...s.btnSm, background: "#555" }}>✎ Edit Profile</button>
                <span style={s.badge(selected.tier)}>{selected.tier}</span>
              </div>
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

            {/* ── U16: INDIVIDUAL VOUCHER RECORDS ── */}
            <div style={{ background: "#F9F5EC", border: "1px solid " + C.gold + "33", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ ...s.h3, margin: 0 }}>📋 Voucher Records</h3>
                <button onClick={() => setU16AddModal({ source: "custom", catalogue_id: null, type: "dining", value: 20, reason: "", notes: "" })} style={s.btnSm}>+ Add Voucher</button>
              </div>
              <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 10 }}>
                Individual voucher events — the foundation for the U10 QR redemption flow. Writes to the <code style={s.mono}>vouchers</code> table with full audit attribution. Runs parallel to the Non-Stop Hits counter above until U10 unifies them.
              </div>
              {memberVouchers.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: C.lmuted, fontSize: 12, background: "#fff", borderRadius: 8 }}>
                  No voucher records yet. Use &quot;+ Add Voucher&quot; to create one (e.g. to replace an accidentally consumed voucher, issue a goodwill voucher, or correct a Non-Stop Hits error).
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: C.lmuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, background: "#fafafa" }}>
                        <th style={{ padding: "8px 10px" }}>Type</th>
                        <th style={{ padding: "8px 10px" }}>Value</th>
                        <th style={{ padding: "8px 10px" }}>Status</th>
                        <th style={{ padding: "8px 10px" }}>Source</th>
                        <th style={{ padding: "8px 10px" }}>Issued</th>
                        <th style={{ padding: "8px 10px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberVouchers.map(v => {
                        const statusColours = {
                          active:        { bg: "#E8F5E9", fg: "#2E7D32" },
                          pending_scan:  { bg: "#FFF8E1", fg: "#5D4037" },
                          consumed:      { bg: "#E3F2FD", fg: "#1565C0" },
                          expired:       { bg: "#F7F7F7", fg: "#666" },
                          returned:      { bg: "#F7F7F7", fg: "#666" },
                          removed:       { bg: "#FFEBEE", fg: "#B71C1C" },
                        };
                        const sc = statusColours[v.status] || { bg: "#eee", fg: "#666" };
                        const canRemove = v.status === "active" || v.status === "pending_scan";
                        return (
                          <tr key={v.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                            <td style={{ padding: "8px 10px", fontWeight: 500, textTransform: "capitalize" }}>{v.type}</td>
                            <td style={{ padding: "8px 10px", ...s.mono, fontWeight: 600 }}>${parseFloat(v.value || 0).toFixed(2)}</td>
                            <td style={{ padding: "8px 10px" }}>
                              <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.fg }}>{v.status}</span>
                            </td>
                            <td style={{ padding: "8px 10px", fontSize: 10.5, color: C.muted }}>{(v.source || "").replace(/_/g, " ")}</td>
                            <td style={{ padding: "8px 10px", fontSize: 10.5, color: C.muted, whiteSpace: "nowrap" }}>{v.issued_at ? new Date(v.issued_at).toLocaleDateString("en-SG", { day: "2-digit", month: "short" }) : "—"}</td>
                            <td style={{ padding: "8px 10px" }}>
                              {canRemove ? (
                                <button onClick={() => setU16RemoveConfirm({ voucher: v, reason: "", notes: "" })} style={{ ...s.btnSm, background: "#eee", color: "#D32F2F", padding: "4px 10px", fontSize: 10.5 }}>Remove</button>
                              ) : v.removed_reason ? (
                                <span style={{ fontSize: 10, color: C.lmuted, fontStyle: "italic" }} title={v.removed_reason}>{v.removed_reason.slice(0, 30)}{v.removed_reason.length > 30 ? "…" : ""}</span>
                              ) : (
                                <span style={{ fontSize: 10, color: C.lmuted }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

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

      {/* ── U17: EDIT PROFILE MODAL ── */}
      {editingProfile && selected && (
        <div style={{ ...s.modal, zIndex: 1001 }} onClick={() => !saveInProgress && setEditingProfile(null)}>
          <div style={{ ...s.modalInner, maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={s.h3}>Edit Profile: {selected.name}</div>
                <div style={{ ...s.mono, color: C.muted, fontSize: 11, marginTop: 2 }}>{selected.id}</div>
              </div>
              <span style={s.badge(selected.tier)}>{selected.tier}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
              {/* Left: editable fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Name</label>
                  <input style={{ ...s.input, marginTop: 4 }} value={editingProfile.name || ""} onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Mobile</label>
                  <input style={{ ...s.input, marginTop: 4, ...s.mono }} value={editingProfile.mobile || ""} onChange={e => setEditingProfile({ ...editingProfile, mobile: e.target.value })} placeholder="+65 XXXX XXXX" />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Email</label>
                  <input style={{ ...s.input, marginTop: 4 }} type="email" value={editingProfile.email || ""} onChange={e => setEditingProfile({ ...editingProfile, email: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Birthday Month</label>
                  <select style={{ ...s.input, marginTop: 4 }} value={editingProfile.birthday_month || ""} onChange={e => setEditingProfile({ ...editingProfile, birthday_month: e.target.value ? parseInt(e.target.value) : null })}>
                    <option value="">—</option>
                    {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Category Preference</label>
                  <select style={{ ...s.input, marginTop: 4 }} value={editingProfile.category_pref || ""} onChange={e => setEditingProfile({ ...editingProfile, category_pref: e.target.value || null })}>
                    <option value="">—</option>
                    <option value="cafes">Cafés</option>
                    <option value="restaurants">Restaurants</option>
                    <option value="bars">Bars</option>
                    <option value="wines">Wines</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Favourite Venue</label>
                  <select style={{ ...s.input, marginTop: 4 }} value={editingProfile.favourite_venue || ""} onChange={e => setEditingProfile({ ...editingProfile, favourite_venue: e.target.value || null })}>
                    <option value="">—</option>
                    {u17Stores.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Tier</label>
                  <select style={{ ...s.input, marginTop: 4 }} value={editingProfile.tier || "silver"} onChange={e => setEditingProfile({ ...editingProfile, tier: e.target.value })}>
                    {["silver","gold","platinum","corporate","staff"].map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Membership Expiry</label>
                  <input style={{ ...s.input, marginTop: 4 }} type="date" value={editingProfile.membership_expiry ? editingProfile.membership_expiry.slice(0,10) : ""} onChange={e => setEditingProfile({ ...editingProfile, membership_expiry: e.target.value ? e.target.value + "T00:00:00Z" : null })} disabled={!["gold","platinum","corporate"].includes(editingProfile.tier)} />
                  {!["gold","platinum","corporate"].includes(editingProfile.tier) && <div style={{ fontSize: 10, color: C.lmuted, marginTop: 4 }}>Disabled for {editingProfile.tier} tier (no expiry)</div>}
                </div>
              </div>

              {/* Right: warnings panel (dynamic based on diffs) */}
              <div style={{ background: "#FAFAFA", borderRadius: 10, padding: 14, border: "1px solid #eee" }}>
                <div style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Warnings</div>
                {(() => {
                  const warnings = [];
                  if (editingProfile.mobile !== selected.mobile) {
                    warnings.push({ icon: "⚠️", text: "Mobile number change. Eber restriction: one mobile = one account. Confirm the member does not already have an account on the new number." });
                  }
                  if (editingProfile.email !== selected.email && selected.email) {
                    warnings.push({ icon: "ℹ️", text: "Email change. Email is not used for OTP (Eber L03 — mobile only). Email OTP is an open dev request with Eber." });
                  }
                  if (editingProfile.tier !== selected.tier) {
                    const tierRank = { silver: 0, staff: 0, corporate: 1, gold: 1, platinum: 2 };
                    if (tierRank[editingProfile.tier] < tierRank[selected.tier]) {
                      warnings.push({ icon: "🚫", text: `Downgrade from ${selected.tier} to ${editingProfile.tier}. This will trigger a confirmation modal with impact breakdown before save.` });
                    } else {
                      warnings.push({ icon: "⚠️", text: `Tier change: ${selected.tier} → ${editingProfile.tier}. Matching Eber backend configuration required.` });
                    }
                  }
                  if (warnings.length === 0) {
                    return <div style={{ fontSize: 11.5, color: C.lmuted, fontStyle: "italic" }}>No warnings. Changes will write to Supabase with an audit_log entry.</div>;
                  }
                  return warnings.map((w, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 11.5, color: C.text, lineHeight: 1.5, marginBottom: 10, paddingBottom: 10, borderBottom: i < warnings.length - 1 ? "1px solid #eee" : "none" }}>
                      <span style={{ flexShrink: 0 }}>{w.icon}</span>
                      <span>{w.text}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div style={{ ...s.bannerAmber, marginTop: 16 }}>
              <span>⚠️</span>
              <div>Remember to sync any tier or mobile change to the Eber backend. This dashboard is 1-Insider&apos;s source of truth — not Eber&apos;s.</div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setEditingProfile(null)} disabled={saveInProgress} style={{ ...s.btnSm, background: "#eee", color: "#555", opacity: saveInProgress ? 0.5 : 1 }}>Cancel</button>
              <button
                disabled={saveInProgress}
                onClick={async () => {
                  // Validation
                  if (!editingProfile.name?.trim()) { alert("Name is required"); return; }
                  if (editingProfile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingProfile.email)) { alert("Email format invalid"); return; }
                  if (editingProfile.mobile && !/^\+65/.test(editingProfile.mobile.replace(/\s+/g, ""))) {
                    if (!window.confirm(`Mobile '${editingProfile.mobile}' doesn't start with +65. Save anyway?`)) return;
                  }
                  if (editingProfile.birthday_month && (editingProfile.birthday_month < 1 || editingProfile.birthday_month > 12)) { alert("Birthday month must be 1–12"); return; }

                  // Collision checks
                  if (editingProfile.email && editingProfile.email !== selected.email) {
                    const collision = members.find(m => m.id !== selected.id && m.email === editingProfile.email);
                    if (collision) { alert(`Email already used by ${collision.name} (${collision.id})`); return; }
                  }
                  if (editingProfile.mobile && editingProfile.mobile !== selected.mobile) {
                    const collision = members.find(m => m.id !== selected.id && m.mobile === editingProfile.mobile);
                    if (collision) { alert(`Mobile already used by ${collision.name} (${collision.id})`); return; }
                  }

                  // Tier downgrade intercept
                  const tierRank = { silver: 0, staff: 0, corporate: 1, gold: 1, platinum: 2 };
                  if (editingProfile.tier !== selected.tier && tierRank[editingProfile.tier] < tierRank[selected.tier]) {
                    setTierDowngradeConfirm({ fromTier: selected.tier, toTier: editingProfile.tier, reason: "" });
                    return;
                  }

                  // Direct save (no downgrade)
                  await performProfileSave(null);
                }}
                style={s.btn}
              >{saveInProgress ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── U17: TIER DOWNGRADE CONFIRMATION ── */}
      {tierDowngradeConfirm && selected && editingProfile && (
        <div style={{ ...s.modal, zIndex: 1002 }} onClick={() => !saveInProgress && setTierDowngradeConfirm(null)}>
          <div style={{ ...s.modalInner, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={s.h3}>Confirm tier downgrade</div>
            {(() => {
              const fromData = TIERS_DATA.find(t => t.id === tierDowngradeConfirm.fromTier);
              const toData = TIERS_DATA.find(t => t.id === tierDowngradeConfirm.toTier);
              const impacts = [];
              if (fromData && toData) {
                if (fromData.earn !== toData.earn) impacts.push(`Earn rate: ${fromData.earn} → ${toData.earn}`);
                if (fromData.bday !== toData.bday) impacts.push(`Birthday discount: ${fromData.bday} → ${toData.bday}`);
                if (fromData.vouchers !== toData.vouchers) impacts.push(`Vouchers: ${fromData.vouchers} → ${toData.vouchers}`);
                if (fromData.nonStop && !toData.nonStop) impacts.push("Non-Stop Hits: enabled → disabled");
              }
              return (
                <>
                  <div style={{ fontSize: 13, color: C.text, marginBottom: 12 }}>
                    Downgrading <strong>{selected.name}</strong> from <span style={s.badge(tierDowngradeConfirm.fromTier)}>{tierDowngradeConfirm.fromTier}</span> to <span style={s.badge(tierDowngradeConfirm.toTier)}>{tierDowngradeConfirm.toTier}</span>.
                  </div>
                  <div style={{ background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#B71C1C", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Impact</div>
                    {impacts.length === 0 ? (
                      <div style={{ fontSize: 12, color: C.muted }}>No mechanical differences between these tiers.</div>
                    ) : (
                      <ul style={{ paddingLeft: 18, fontSize: 12, color: "#B71C1C", margin: 0 }}>
                        {impacts.map((imp, i) => <li key={i} style={{ marginBottom: 3 }}>{imp}</li>)}
                      </ul>
                    )}
                  </div>
                </>
              );
            })()}
            <div>
              <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Reason (required)</label>
              <input style={{ ...s.input, marginTop: 4 }} value={tierDowngradeConfirm.reason} onChange={e => setTierDowngradeConfirm({ ...tierDowngradeConfirm, reason: e.target.value })} placeholder="e.g. Member requested, Lapsed payment, Correction of error…" />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setTierDowngradeConfirm(null)} disabled={saveInProgress} style={{ ...s.btnSm, background: "#eee", color: "#555", opacity: saveInProgress ? 0.5 : 1 }}>Cancel</button>
              <button
                disabled={saveInProgress || !tierDowngradeConfirm.reason?.trim()}
                onClick={async () => {
                  await performProfileSave(tierDowngradeConfirm.reason);
                }}
                style={{ ...s.btn, background: "#D32F2F", opacity: (!tierDowngradeConfirm.reason?.trim() || saveInProgress) ? 0.5 : 1 }}
              >
                {saveInProgress ? "Saving…" : `Confirm downgrade to ${tierDowngradeConfirm.toTier}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── U16: ADD VOUCHER MODAL ── */}
      {u16AddModal && selected && (
        <div style={{ ...s.modal, zIndex: 1001 }} onClick={() => !u16InProgress && setU16AddModal(null)}>
          <div style={{ ...s.modalInner, maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={s.h3}>Add Voucher to {selected.name}</div>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 16 }}>
              Creates a new voucher record tied to this member. Every add is audit-logged.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Source</label>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <label style={{ flex: 1, border: "1px solid " + (u16AddModal.source === "custom" ? C.gold : "#ddd"), borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, background: u16AddModal.source === "custom" ? "#FDF8EE" : "#fff" }}>
                    <input type="radio" checked={u16AddModal.source === "custom"} onChange={() => setU16AddModal({ ...u16AddModal, source: "custom", catalogue_id: null })} />
                    Custom voucher
                  </label>
                  <label style={{ flex: 1, border: "1px solid " + (u16AddModal.source === "catalogue" ? C.gold : "#ddd"), borderRadius: 8, padding: "8px 12px", cursor: u16Catalogue.length > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, fontSize: 12, background: u16AddModal.source === "catalogue" ? "#FDF8EE" : "#fff", opacity: u16Catalogue.length > 0 ? 1 : 0.5 }}>
                    <input type="radio" checked={u16AddModal.source === "catalogue"} disabled={u16Catalogue.length === 0} onChange={() => setU16AddModal({ ...u16AddModal, source: "catalogue" })} />
                    From catalogue ({u16Catalogue.length})
                  </label>
                </div>
                {u16Catalogue.length === 0 && <div style={{ fontSize: 10, color: C.lmuted, marginTop: 4 }}>Catalogue is empty. Use the Voucher Management tab to add reusable templates (U18, not yet built).</div>}
              </div>

              {u16AddModal.source === "catalogue" && (
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Catalogue entry</label>
                  <select style={{ ...s.input, marginTop: 4 }} value={u16AddModal.catalogue_id || ""} onChange={e => {
                    const id = e.target.value;
                    const entry = u16Catalogue.find(c => c.id === id);
                    setU16AddModal({ ...u16AddModal, catalogue_id: id, type: entry?.type || "dining", value: entry?.value || 0 });
                  }}>
                    <option value="">Select…</option>
                    {u16Catalogue.map(c => <option key={c.id} value={c.id}>{c.name} · {c.type} · ${c.value}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Type</label>
                <select style={{ ...s.input, marginTop: 4 }} value={u16AddModal.type} disabled={u16AddModal.source === "catalogue"} onChange={e => setU16AddModal({ ...u16AddModal, type: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="dining">Dining</option>
                  <option value="points">Points</option>
                  <option value="tactical">Tactical</option>
                  <option value="welcome">Welcome</option>
                  <option value="birthday">Birthday</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Value ($)</label>
                <input type="number" step="0.01" min="0" style={{ ...s.input, marginTop: 4 }} disabled={u16AddModal.source === "catalogue"} value={u16AddModal.value} onChange={e => setU16AddModal({ ...u16AddModal, value: e.target.value })} />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Reason (required)</label>
                <select style={{ ...s.input, marginTop: 4 }} value={u16AddModal.reason} onChange={e => setU16AddModal({ ...u16AddModal, reason: e.target.value })}>
                  <option value="">Select…</option>
                  <option value="Accidental claim correction">Accidental claim correction</option>
                  <option value="Goodwill">Goodwill</option>
                  <option value="Error correction">Error correction</option>
                  <option value="Staff comp">Staff comp</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Notes (optional)</label>
                <input style={{ ...s.input, marginTop: 4 }} value={u16AddModal.notes} onChange={e => setU16AddModal({ ...u16AddModal, notes: e.target.value })} placeholder="Additional context for the audit trail" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setU16AddModal(null)} disabled={u16InProgress} style={{ ...s.btnSm, background: "#eee", color: "#555", opacity: u16InProgress ? 0.5 : 1 }}>Cancel</button>
              <button onClick={u16AddVoucher} disabled={u16InProgress || !u16AddModal.reason || !u16AddModal.type || !(u16AddModal.value > 0)} style={{ ...s.btn, opacity: (u16InProgress || !u16AddModal.reason || !u16AddModal.type || !(u16AddModal.value > 0)) ? 0.5 : 1 }}>
                {u16InProgress ? "Adding…" : "Add voucher"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── U16: REMOVE VOUCHER CONFIRM MODAL ── */}
      {u16RemoveConfirm && selected && (
        <div style={{ ...s.modal, zIndex: 1001 }} onClick={() => !u16InProgress && setU16RemoveConfirm(null)}>
          <div style={{ ...s.modalInner, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={s.h3}>Remove voucher</div>
            <div style={{ background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: "#B71C1C", marginBottom: 4 }}>You are soft-deleting:</div>
              <div style={{ color: C.text }}>
                <strong style={{ textTransform: "capitalize" }}>{u16RemoveConfirm.voucher.type}</strong> voucher · <strong>${parseFloat(u16RemoveConfirm.voucher.value).toFixed(2)}</strong>
              </div>
              <div style={{ fontSize: 10.5, color: C.muted, ...s.mono, marginTop: 4 }}>#{String(u16RemoveConfirm.voucher.id).slice(0,8)}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                This returns the voucher to status=removed and preserves it in the audit log. It will no longer appear in the member&apos;s active wallet.
              </div>
            </div>
            <div>
              <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Reason (required)</label>
              <select style={{ ...s.input, marginTop: 4 }} value={u16RemoveConfirm.reason} onChange={e => setU16RemoveConfirm({ ...u16RemoveConfirm, reason: e.target.value })}>
                <option value="">Select…</option>
                <option value="Issued in error">Issued in error</option>
                <option value="Duplicate">Duplicate</option>
                <option value="Member request">Member request</option>
                <option value="Fraud prevention">Fraud prevention</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Notes (optional)</label>
              <input style={{ ...s.input, marginTop: 4 }} value={u16RemoveConfirm.notes} onChange={e => setU16RemoveConfirm({ ...u16RemoveConfirm, notes: e.target.value })} placeholder="Additional context for the audit trail" />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setU16RemoveConfirm(null)} disabled={u16InProgress} style={{ ...s.btnSm, background: "#eee", color: "#555", opacity: u16InProgress ? 0.5 : 1 }}>Cancel</button>
              <button onClick={u16RemoveVoucher} disabled={u16InProgress || !u16RemoveConfirm.reason} style={{ ...s.btn, background: "#D32F2F", opacity: (u16InProgress || !u16RemoveConfirm.reason) ? 0.5 : 1 }}>
                {u16InProgress ? "Removing…" : "Confirm remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // U17: profile save executor (called from main Save or after downgrade confirm)
  async function performProfileSave(reason) {
    if (!selected || !editingProfile) return;
    setSaveInProgress(true);
    try {
      // Compute diff — only changed fields written
      const EDITABLE = ["name", "mobile", "email", "birthday_month", "category_pref", "favourite_venue", "tier", "membership_expiry"];
      const before = {};
      const after = {};
      const patch = {};
      for (const k of EDITABLE) {
        const b = selected[k] ?? null;
        const a = editingProfile[k] ?? null;
        if (JSON.stringify(b) !== JSON.stringify(a)) {
          before[k] = b;
          after[k] = a;
          patch[k] = a;
        }
      }
      if (Object.keys(patch).length === 0) {
        flash("No changes to save");
        setSaveInProgress(false);
        setEditingProfile(null);
        setTierDowngradeConfirm(null);
        return;
      }

      await supaFetch(`members?id=eq.${selected.id}`, { method: "PATCH", body: patch });
      await u17LogAudit(selected.id, "update", before, after, reason);

      const changedCount = Object.keys(patch).length;
      flash(`Profile updated (${changedCount} ${changedCount === 1 ? "field" : "fields"} changed) — audit logged`);
      reload();
      setSelected(prev => prev ? { ...prev, ...patch } : null);
      setEditingProfile(null);
      setTierDowngradeConfirm(null);
    } catch (e) {
      console.error("Profile save failed:", e);
      alert("Save failed. Changes preserved locally — try again.");
    }
    setSaveInProgress(false);
  }
}

// ─── U18 VOUCHERS (Catalogue CRUD + Phase 1 reference) ───
function Vouchers() {
  const { s, C, TIER } = useContext(ThemeCtx);
  // Phase 1 hard-coded reference (preserved — this is the loyalty programme spec, not catalogue data)
  const voucherReference = [
    { type: "Welcome", tiers: "All tiers", trigger: "Signup", values: "Silver: $10 (min $20) · Gold/Plat/Corp: $10", auto: true },
    { type: "Dining (Non-Stop Hits)", tiers: "Gold, Platinum, Corporate", trigger: "Signup + refill", values: "Gold: 10×$20 · Plat: 10×$25 · Corp: 10×$20", auto: true },
    { type: "Points Redemption", tiers: "All (excl Staff)", trigger: "Member redeems points", values: "100pts=$10 · 150pts=$15 · 250pts=$25", auto: false },
    { type: "Birthday Discount", tiers: "All", trigger: "Birthday month", values: "Silver 10% · Gold 15% · Plat 20% (% off bill, NOT voucher)", auto: true },
  ];

  // U18 state
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', entry: {...} }
  const [inProgress, setInProgress] = useState(false);
  const [filter, setFilter] = useState({ type: "all", active: "all" });

  const blank = () => ({
    name: "", type: "dining", value: 20,
    tier_eligibility: ["gold","platinum","corporate"],
    validity_start: "", validity_end: "",
    stacking_rules: { cash_with_points: true, with_promotion: false, with_birthday: false },
    min_spend: 0,
    auto_issue_trigger: null,
    active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        supaFetch("voucher_catalogue?order=created_at.desc"),
        supaFetch("admin_users?role=eq.super_admin&limit=1"),
      ]);
      if (Array.isArray(c)) setCatalogue(c);
      if (Array.isArray(a) && a[0]) setCurrentAdminId(a[0].id);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const logAudit = async (entryId, action, before, after, reason) => {
    if (!currentAdminId) return;
    try {
      await supaFetch("audit_log", {
        method: "POST",
        body: {
          admin_user_id: currentAdminId,
          entity_type: "voucher_catalogue",
          entity_id: String(entryId),
          action, before_value: before, after_value: after, reason,
        },
      });
    } catch (e) { console.error("Audit log failed:", e); }
  };

  const saveEntry = async () => {
    if (!modal) return;
    const e = modal.entry;
    if (!e.name?.trim()) { alert("Name is required"); return; }
    if (!e.type) { alert("Type is required"); return; }
    if (e.value == null || e.value < 0) { alert("Value must be 0 or greater"); return; }
    if (!e.tier_eligibility || e.tier_eligibility.length === 0) { alert("At least one tier must be eligible"); return; }

    setInProgress(true);
    try {
      const body = {
        name: e.name.trim(),
        type: e.type,
        value: parseFloat(e.value),
        tier_eligibility: e.tier_eligibility,
        validity_start: e.validity_start || null,
        validity_end: e.validity_end || null,
        stacking_rules: e.stacking_rules,
        min_spend: parseFloat(e.min_spend || 0),
        auto_issue_trigger: e.auto_issue_trigger || null,
        active: e.active,
      };

      if (modal.mode === "create") {
        const r = await supaFetch("voucher_catalogue", { method: "POST", body });
        if (Array.isArray(r) && r[0]) await logAudit(r[0].id, "create", null, r[0], null);
      } else {
        const before = catalogue.find(c => c.id === e.id);
        const after = { ...body, updated_at: new Date().toISOString() };
        await supaFetch(`voucher_catalogue?id=eq.${e.id}`, { method: "PATCH", body: after });
        await logAudit(e.id, "update", before, { ...before, ...body }, null);
      }
      setModal(null);
      load();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed. Check console.");
    }
    setInProgress(false);
  };

  const toggleActive = async (entry) => {
    const newActive = !entry.active;
    const verb = newActive ? "Activate" : "Deactivate";
    if (!window.confirm(`${verb} "${entry.name}"?\n\n${newActive ? "Will reappear in the Add Voucher catalogue picker." : "Will be hidden from future voucher issuance flows. Existing vouchers of this type remain valid."}`)) return;
    await supaFetch(`voucher_catalogue?id=eq.${entry.id}`, { method: "PATCH", body: { active: newActive, updated_at: new Date().toISOString() } });
    await logAudit(entry.id, "update", { active: entry.active }, { active: newActive }, newActive ? "Activated" : "Deactivated");
    load();
  };

  const duplicateForNextYear = async (entry) => {
    if (!entry.validity_end) { alert("Cannot duplicate: this entry has no validity end date."); return; }
    const rollForward = (d) => {
      if (!d) return null;
      const nd = new Date(d);
      nd.setFullYear(nd.getFullYear() + 1);
      return nd.toISOString().slice(0, 10);
    };
    const newEntry = {
      ...entry,
      name: `${entry.name} (next year)`,
      validity_start: rollForward(entry.validity_start),
      validity_end: rollForward(entry.validity_end),
      active: false, // Start inactive — Nov/Dec annual workflow per Phase 1
    };
    delete newEntry.id;
    delete newEntry.created_at;
    delete newEntry.updated_at;
    if (!window.confirm(`Duplicate "${entry.name}" for next year?\n\nNew validity: ${newEntry.validity_start} → ${newEntry.validity_end}\n\nNew entry created as INACTIVE (per Phase 1 Nov/Dec workflow — test in Staging before activation).`)) return;
    const r = await supaFetch("voucher_catalogue", { method: "POST", body: newEntry });
    if (Array.isArray(r) && r[0]) await logAudit(r[0].id, "create", null, r[0], `Duplicated from ${entry.id} for next-year annual lifecycle`);
    load();
  };

  // Filter catalogue
  const filtered = catalogue.filter(c => {
    if (filter.type !== "all" && c.type !== filter.type) return false;
    if (filter.active === "active" && !c.active) return false;
    if (filter.active === "inactive" && c.active) return false;
    return true;
  });

  const typeColours = {
    cash:      { bg: "#E8F5E9", fg: "#2E7D32" },
    dining:    { bg: "#FDF8EE", fg: "#8B6914" },
    points:    { bg: "#E3F2FD", fg: "#1565C0" },
    tactical:  { bg: "#EDE7F6", fg: "#4527A0" },
    welcome:   { bg: "#FFF8E1", fg: "#5D4037" },
    birthday:  { bg: "#FCE4EC", fg: "#880E4F" },
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ ...s.h2, marginBottom: 0 }}>Voucher Management</h2>
        <button onClick={() => setModal({ mode: "create", entry: blank() })} style={s.btn}>+ New Voucher Template</button>
      </div>

      <div style={s.bannerGreen}>
        <span>✅</span>
        <div>
          <strong>Voucher catalogue drives the U16 Add Voucher picker.</strong> Templates added here populate the &ldquo;From catalogue&rdquo; option on every member&apos;s voucher panel. Use this for reusable voucher types (welcome, dining, tactical, seasonal).
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...s.card, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2 }}>Filters</span>
        <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })} style={{ ...s.input, width: "auto", padding: "8px 12px" }}>
          <option value="all">All types</option>
          <option value="cash">Cash</option>
          <option value="dining">Dining</option>
          <option value="points">Points</option>
          <option value="tactical">Tactical</option>
          <option value="welcome">Welcome</option>
          <option value="birthday">Birthday</option>
        </select>
        <select value={filter.active} onChange={e => setFilter({ ...filter, active: e.target.value })} style={{ ...s.input, width: "auto", padding: "8px 12px" }}>
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <div style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>{filtered.length} of {catalogue.length} shown</div>
      </div>

      {/* Catalogue table */}
      <div style={s.card}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.lmuted, fontSize: 13 }}>
            {catalogue.length === 0 ? (
              <>
                <div style={{ marginBottom: 8 }}>No voucher templates yet.</div>
                <div style={{ fontSize: 11 }}>Click <strong>+ New Voucher Template</strong> to add your first reusable voucher type (e.g. &ldquo;Gold $20 Dining 2026&rdquo;, &ldquo;Mother&apos;s Day Tactical Comp&rdquo;).</div>
              </>
            ) : "No entries match the current filters."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 1100 }}>
              <thead>
                <tr style={{ textAlign: "left", color: C.lmuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                  <th style={{ padding: "10px 8px" }}>Name</th>
                  <th style={{ padding: "10px 8px" }}>Type</th>
                  <th style={{ padding: "10px 8px", textAlign: "right" }}>Value</th>
                  <th style={{ padding: "10px 8px" }}>Tiers</th>
                  <th style={{ padding: "10px 8px" }}>Validity</th>
                  <th style={{ padding: "10px 8px" }}>Trigger</th>
                  <th style={{ padding: "10px 8px", textAlign: "center" }}>Min spend</th>
                  <th style={{ padding: "10px 8px" }}>Status</th>
                  <th style={{ padding: "10px 8px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const tc = typeColours[c.type] || { bg: "#eee", fg: "#666" };
                  return (
                    <tr key={c.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "10px 8px", fontWeight: 500 }}>{c.name}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 600, background: tc.bg, color: tc.fg, textTransform: "capitalize" }}>{c.type}</span>
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "right", ...s.mono, fontWeight: 600 }}>${parseFloat(c.value || 0).toFixed(2)}</td>
                      <td style={{ padding: "10px 8px", fontSize: 11 }}>{(c.tier_eligibility || []).map(t => t[0].toUpperCase() + t.slice(1)).join(", ")}</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, color: C.muted }}>
                        {c.validity_start && c.validity_end ? `${c.validity_start} → ${c.validity_end}` : <span style={{ color: C.lmuted }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 8px", fontSize: 11 }}>{c.auto_issue_trigger ? <span style={{ background: "#E8F5E9", color: "#2E7D32", padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 600 }}>{c.auto_issue_trigger}</span> : <span style={{ color: C.lmuted }}>manual</span>}</td>
                      <td style={{ padding: "10px 8px", textAlign: "center", fontSize: 11, color: C.muted }}>{parseFloat(c.min_spend || 0) > 0 ? `$${c.min_spend}` : "—"}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: c.active ? "#E8F5E9" : "#FFEBEE", color: c.active ? "#2E7D32" : "#B71C1C" }}>
                          {c.active ? "active" : "inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                        <button onClick={() => setModal({ mode: "edit", entry: { ...c } })} style={s.btnSm}>Edit</button>
                        {" "}
                        {c.validity_end && <><button onClick={() => duplicateForNextYear(c)} style={{ ...s.btnSm, background: "#555" }} title="Duplicate for next year (Nov/Dec annual lifecycle)">+1yr</button>{" "}</>}
                        <button onClick={() => toggleActive(c)} style={c.active ? s.btnDanger : s.btnSuccess}>{c.active ? "Deactivate" : "Activate"}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={s.bannerAmber}>
        <span>⚠️</span>
        <div><strong>P&amp;L:</strong> Voucher redemption = revenue (ENT-voucher line), NOT a COGS discount. Finance team reads this through Insights &gt; eStore &gt; Sales Transactions.</div>
      </div>

      {/* Phase 1 reference: Voucher types (hard-coded programme spec) */}
      <h3 style={{ ...s.h3, marginTop: 24 }}>Voucher Types (programme reference)</h3>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>The 4 core voucher types defined by the 1-Insider 3.0 loyalty spec. Use the catalogue above to create specific templates that implement these types.</div>
      {voucherReference.map((v, i) => (
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
        {VOUCHER_LIFECYCLE.map((l, i) => (
          <div key={i} style={{ ...s.card, flex: "1 1 160px", textAlign: "center", minWidth: 140 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{l.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{l.month}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{l.action}</div>
          </div>
        ))}
      </div>

      <h3 style={{ ...s.h3, marginTop: 20 }}>Stacking Rules</h3>
      <div style={s.card}>
        {[{ c: "Cash voucher + Points voucher", ok: true }, { c: "Cash + Cash voucher", ok: false }, { c: "Points + Points voucher", ok: false }, { c: "Any voucher + Birthday discount", ok: false }, { c: "Any voucher + Active promotion", ok: false }, { c: "Stamp rewards + Stamp rewards", ok: true }].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f5f5f5", fontSize: 12.5 }}>{r.ok ? "✅" : "❌"} {r.c}</div>
        ))}
      </div>

      {/* ─── Create/Edit modal ─── */}
      {modal && (
        <div style={s.modal} onClick={() => !inProgress && setModal(null)}>
          <div style={{ ...s.modalInner, maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div style={s.h3}>{modal.mode === "create" ? "New Voucher Template" : `Edit: ${modal.entry.name}`}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Name</label>
                <input style={{ ...s.input, marginTop: 4 }} value={modal.entry.name} onChange={e => setModal({ ...modal, entry: { ...modal.entry, name: e.target.value } })} placeholder="e.g. Gold $20 Dining 2026" />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Type</label>
                <select style={{ ...s.input, marginTop: 4 }} value={modal.entry.type} onChange={e => setModal({ ...modal, entry: { ...modal.entry, type: e.target.value } })}>
                  <option value="cash">Cash</option>
                  <option value="dining">Dining</option>
                  <option value="points">Points</option>
                  <option value="tactical">Tactical</option>
                  <option value="welcome">Welcome</option>
                  <option value="birthday">Birthday</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Value ($)</label>
                <input type="number" step="0.01" min="0" style={{ ...s.input, marginTop: 4, ...s.mono }} value={modal.entry.value} onChange={e => setModal({ ...modal, entry: { ...modal.entry, value: e.target.value } })} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Eligible tiers</label>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {["silver","gold","platinum","corporate","staff"].map(t => {
                    const checked = (modal.entry.tier_eligibility || []).includes(t);
                    return (
                      <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid " + (checked ? C.gold : "#ddd"), borderRadius: 8, background: checked ? "#FDF8EE" : "#fff", cursor: "pointer", fontSize: 12 }}>
                        <input type="checkbox" checked={checked}
                          onChange={e => {
                            const cur = modal.entry.tier_eligibility || [];
                            const next = e.target.checked ? [...cur, t] : cur.filter(x => x !== t);
                            setModal({ ...modal, entry: { ...modal.entry, tier_eligibility: next } });
                          }} />
                        {t[0].toUpperCase() + t.slice(1)}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Validity start</label>
                <input type="date" style={{ ...s.input, marginTop: 4 }} value={modal.entry.validity_start || ""} onChange={e => setModal({ ...modal, entry: { ...modal.entry, validity_start: e.target.value } })} />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Validity end</label>
                <input type="date" style={{ ...s.input, marginTop: 4 }} value={modal.entry.validity_end || ""} onChange={e => setModal({ ...modal, entry: { ...modal.entry, validity_end: e.target.value } })} min={modal.entry.validity_start || ""} />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Auto-issue trigger</label>
                <select style={{ ...s.input, marginTop: 4 }} value={modal.entry.auto_issue_trigger || ""} onChange={e => setModal({ ...modal, entry: { ...modal.entry, auto_issue_trigger: e.target.value || null } })}>
                  <option value="">Manual only</option>
                  <option value="signup">Signup</option>
                  <option value="renewal">Renewal</option>
                  <option value="birthday">Birthday month</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Min spend ($, optional)</label>
                <input type="number" step="0.01" min="0" style={{ ...s.input, marginTop: 4, ...s.mono }} value={modal.entry.min_spend || 0} onChange={e => setModal({ ...modal, entry: { ...modal.entry, min_spend: e.target.value } })} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Stacking rules</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
                  {[
                    { key: "cash_with_points", label: "Stack with points voucher" },
                    { key: "with_promotion", label: "Stack with promotion" },
                    { key: "with_birthday", label: "Stack with birthday discount" },
                  ].map(r => (
                    <label key={r.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>
                      <input type="checkbox" checked={!!(modal.entry.stacking_rules || {})[r.key]} onChange={e => setModal({ ...modal, entry: { ...modal.entry, stacking_rules: { ...(modal.entry.stacking_rules || {}), [r.key]: e.target.checked } } })} />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={modal.entry.active} onChange={e => setModal({ ...modal, entry: { ...modal.entry, active: e.target.checked } })} />
                  Active (appears in Add Voucher catalogue picker)
                </label>
              </div>
            </div>

            <div style={{ ...s.bannerAmber, marginTop: 16 }}>
              <span>⚠️</span>
              <div>If this template is meant to auto-issue (signup/renewal/birthday), remember to configure the matching trigger in Eber backend. This admin panel records intent; Eber executes.</div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setModal(null)} disabled={inProgress} style={{ ...s.btnSm, background: "#eee", color: "#555", opacity: inProgress ? 0.5 : 1 }}>Cancel</button>
              <button onClick={saveEntry} disabled={inProgress || !modal.entry.name?.trim() || (modal.entry.tier_eligibility || []).length === 0} style={{ ...s.btn, opacity: (inProgress || !modal.entry.name?.trim() || (modal.entry.tier_eligibility || []).length === 0) ? 0.5 : 1 }}>
                {inProgress ? "Saving…" : (modal.mode === "create" ? "Create template" : "Save changes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── U19 STAMPS ───
function StampsTab() {
  const { s, C, TIER } = useContext(ThemeCtx);
  // Phase 1 AI assistant state (preserved)
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // U19 state
  const [config, setConfig] = useState(null);
  const [configId, setConfigId] = useState(null);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inProgress, setInProgress] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [draft, setDraft] = useState(null); // shadow copy for unsaved edits

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        supaFetch("stamp_config?select=*&limit=1"),
        supaFetch("admin_users?role=eq.super_admin&limit=1"),
      ]);
      if (Array.isArray(c) && c[0]) {
        setConfig(c[0]);
        setDraft({
          cycle_length: c[0].cycle_length,
          restriction_window_days: c[0].restriction_window_days,
          milestones: [...(c[0].milestones || [])].map(m => ({ ...m })),
        });
        setConfigId(c[0].id);
      }
      if (Array.isArray(a) && a[0]) setCurrentAdminId(a[0].id);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const logAudit = async (action, before, after, reason) => {
    if (!currentAdminId || !configId) return;
    try {
      await supaFetch("audit_log", {
        method: "POST",
        body: {
          admin_user_id: currentAdminId,
          entity_type: "stamp_config",
          entity_id: String(configId),
          action, before_value: before, after_value: after, reason,
        },
      });
    } catch (e) { console.error("Audit log failed:", e); }
  };

  const saveConfig = async () => {
    if (!draft || !configId) return;
    // Validation
    if (!draft.cycle_length || draft.cycle_length < 3 || draft.cycle_length > 20) { alert("Cycle length must be between 3 and 20"); return; }
    if (!draft.restriction_window_days || draft.restriction_window_days < 0) { alert("Restriction window must be 0 or positive"); return; }

    // Sanity check milestones
    const sortedMs = [...draft.milestones].sort((a, b) => a.stamp - b.stamp);
    for (const m of sortedMs) {
      if (!m.stamp || m.stamp < 1 || m.stamp > draft.cycle_length) { alert(`Milestone stamp number ${m.stamp} is out of cycle range (1 to ${draft.cycle_length})`); return; }
      if (!m.reward?.trim()) { alert(`Milestone at stamp ${m.stamp} is missing a reward description`); return; }
    }

    setInProgress(true);
    try {
      const before = { cycle_length: config.cycle_length, restriction_window_days: config.restriction_window_days, milestones: config.milestones };
      const after = { cycle_length: draft.cycle_length, restriction_window_days: draft.restriction_window_days, milestones: sortedMs };
      await supaFetch(`stamp_config?id=eq.${configId}`, { method: "PATCH", body: after });
      await logAudit("update", before, after, null);
      setSaveMsg("Saved — stamp programme config updated");
      setTimeout(() => setSaveMsg(""), 3500);
      load();
    } catch (e) {
      console.error("Save failed:", e);
      alert("Save failed. Check console.");
    }
    setInProgress(false);
  };

  const addMilestone = () => {
    if (!draft) return;
    const existingStamps = draft.milestones.map(m => m.stamp);
    let nextStamp = 1;
    while (existingStamps.includes(nextStamp) && nextStamp <= draft.cycle_length) nextStamp++;
    if (nextStamp > draft.cycle_length) { alert(`All ${draft.cycle_length} stamp positions already have milestones. Increase cycle length or remove one first.`); return; }
    setDraft({ ...draft, milestones: [...draft.milestones, { stamp: nextStamp, reward: "New reward", auto_issue: false }] });
  };

  const removeMilestone = (idx) => {
    if (!draft) return;
    setDraft({ ...draft, milestones: draft.milestones.filter((_, i) => i !== idx) });
  };

  const updateMilestone = (idx, field, value) => {
    if (!draft) return;
    const updated = [...draft.milestones];
    updated[idx] = { ...updated[idx], [field]: value };
    setDraft({ ...draft, milestones: updated });
  };

  const hasUnsavedChanges = draft && config && (
    draft.cycle_length !== config.cycle_length ||
    draft.restriction_window_days !== config.restriction_window_days ||
    JSON.stringify(draft.milestones) !== JSON.stringify(config.milestones)
  );

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={s.h2}>Café Stamp Programme</h2>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>$10 = 1 stamp · Café outlets only · All tiers</div>

      {/* Always-on Eber limitation banners */}
      <div style={s.bannerRed}><span>🚫</span><div><strong>Eber L09:</strong> Only stamps 8 and 10 can truly auto-issue via Eber. Any other milestone marked auto-issue here will actually surface via the Discover tab as a manual claim.</div></div>
      <div style={s.bannerRed}><span>🚫</span><div><strong>Eber L10 Back-door:</strong> Unclaimed stamps can re-trigger the same reward. Multi-txn splits ($30 across 2 txns) trigger twice. The restriction window below is the workaround.</div></div>
      <div style={s.bannerGreen}><span>✅</span><div><strong>Workaround active:</strong> time-based claim limit enforced below. Admin manages stamps manually until Agilysys/Eber POS integration lands.</div></div>

      {/* ─── U19 Editable config ─── */}
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ ...s.h3, margin: 0 }}>Programme Configuration</h3>
          {hasUnsavedChanges && <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 8, background: "#FFF8E1", color: "#5D4037", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>Unsaved changes</span>}
        </div>

        {saveMsg && <div style={{ ...s.bannerGreen, marginBottom: 12 }}><span>✅</span><div>{saveMsg}</div></div>}

        {loading || !draft ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Cycle length</label>
                <input type="number" min="3" max="20" style={{ ...s.input, marginTop: 4 }} value={draft.cycle_length} onChange={e => setDraft({ ...draft, cycle_length: parseInt(e.target.value, 10) || 0 })} />
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Total stamps on a card. Default 10.</div>
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Restriction window (days)</label>
                <input type="number" min="0" max="365" style={{ ...s.input, marginTop: 4 }} value={draft.restriction_window_days} onChange={e => setDraft({ ...draft, restriction_window_days: parseInt(e.target.value, 10) || 0 })} />
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>How long between claims of the same reward. Calibrated via AI Stamp Card Analyser.</div>
              </div>
            </div>

            {/* Milestones editor */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.lmuted, textTransform: "uppercase", letterSpacing: 1.2 }}>Milestones ({draft.milestones.length})</div>
              <button onClick={addMilestone} style={{ ...s.btnSm, background: "#555", fontSize: 10, padding: "4px 10px" }}>+ Add milestone</button>
            </div>
            {draft.milestones.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: C.lmuted, fontSize: 12, background: "#fafafa", borderRadius: 8 }}>No milestones defined.</div>
            ) : (
              <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: C.lmuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, background: "#fafafa" }}>
                      <th style={{ padding: "8px 10px", width: 80 }}>Stamp</th>
                      <th style={{ padding: "8px 10px" }}>Reward</th>
                      <th style={{ padding: "8px 10px", width: 150 }}>Auto-issue</th>
                      <th style={{ padding: "8px 10px", width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.milestones.map((m, idx) => {
                      // Eber L09 warn: auto-issue only works on 8 and 10
                      const autoIssueBlocked = m.auto_issue && m.stamp !== 8 && m.stamp !== 10;
                      return (
                        <tr key={idx} style={{ borderTop: "1px solid #eee" }}>
                          <td style={{ padding: "8px 10px" }}>
                            <input type="number" min="1" max={draft.cycle_length} style={{ ...s.input, padding: "6px 8px", fontSize: 12, width: 60 }} value={m.stamp} onChange={e => updateMilestone(idx, "stamp", parseInt(e.target.value, 10) || 0)} />
                          </td>
                          <td style={{ padding: "8px 10px" }}>
                            <input style={{ ...s.input, padding: "6px 10px", fontSize: 12 }} value={m.reward || ""} onChange={e => updateMilestone(idx, "reward", e.target.value)} placeholder="Reward description" />
                          </td>
                          <td style={{ padding: "8px 10px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                              <input type="checkbox" checked={!!m.auto_issue} onChange={e => updateMilestone(idx, "auto_issue", e.target.checked)} />
                              Auto-issue
                            </label>
                            {autoIssueBlocked && <div style={{ fontSize: 9.5, color: "#B71C1C", marginTop: 2 }}>⚠ Eber L09: won&apos;t actually auto-issue</div>}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>
                            <button onClick={() => removeMilestone(idx)} style={{ background: "none", border: "none", color: "#D32F2F", cursor: "pointer", fontSize: 14 }} title="Remove">×</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => { setDraft({ cycle_length: config.cycle_length, restriction_window_days: config.restriction_window_days, milestones: [...(config.milestones || [])].map(m => ({ ...m })) }); }} style={{ ...s.btnSm, background: "#eee", color: "#555" }} disabled={!hasUnsavedChanges || inProgress}>Discard changes</button>
              <button onClick={saveConfig} disabled={!hasUnsavedChanges || inProgress} style={{ ...s.btn, opacity: (!hasUnsavedChanges || inProgress) ? 0.4 : 1 }}>
                {inProgress ? "Saving…" : "Save configuration"}
              </button>
            </div>
          </>
        )}
      </div>

      <div style={s.bannerAmber}>
        <span>⚠️</span>
        <div>Config changes here are the source of truth for the Admin dashboard and Member portal UIs, but Eber backend milestone/stamp rules must be updated separately. Mismatched config will cause rewards to mis-fire or not fire.</div>
      </div>

      {/* ─── Preserved reference: visual milestone grid from Phase 1 ─── */}
      <h3 style={s.h3}>Milestones (visual reference)</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {(draft?.milestones || config?.milestones || []).slice().sort((a, b) => a.stamp - b.stamp).map((m, i) => (
          <div key={i} style={{ width: 85, height: 85, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: m.reward ? (m.auto_issue ? "#E8F5E9" : "#FFF8E1") : "#f5f5f5", border: m.reward ? "2px solid " + (m.auto_issue ? "#4CAF50" : "#FFB300") : "2px solid #e0e0e0" }}>
            <div style={{ fontFamily: FONT.h, fontSize: 20, fontWeight: 700 }}>{m.stamp}</div>
            {m.reward && <div style={{ fontSize: 7, textAlign: "center", padding: "0 4px", color: m.auto_issue ? "#2E7D32" : "#F57F17", fontWeight: 600, marginTop: 2 }}>{m.auto_issue ? "AUTO" : "MANUAL"}</div>}
            {m.reward && <div style={{ fontSize: 7, textAlign: "center", padding: "0 4px", color: "#666" }}>{(m.reward || "").slice(0, 22)}</div>}
          </div>
        ))}
      </div>

      <h3 style={s.h3}>Café Outlets</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {CAFE_OUTLETS.map((o, i) => (
          <div key={i} style={{ ...s.card, display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
            <span style={{ fontSize: 20 }}>☕</span>
            <div><div style={{ fontWeight: 600, fontSize: 13 }}>{o.name}</div><div style={{ fontSize: 11, color: C.muted }}>{o.location}</div></div>
          </div>
        ))}
      </div>

      <div style={s.aiPanel}>
        <div style={s.aiBadge}>✦ AI STAMP CARD ANALYSER</div>
        <p style={{ fontSize: 13, color: "#ccc", margin: "12px 0" }}>Analyse café spending patterns to calibrate the time-based restriction window above.</p>
        <button onClick={async () => { setAiLoading(true); setAiResult(await askClaude(SYS_STAMP, "Analyse typical Wildseed Café spending: avg check $18-25, regulars 2-3x/month. Recommend optimal restriction window.")); setAiLoading(false); }} disabled={aiLoading} style={{ ...s.btn, opacity: aiLoading ? 0.5 : 1 }}>{aiLoading ? "Analysing…" : "Run Analysis"}</button>
        {aiResult && <pre style={{ marginTop: 16, fontSize: 12, lineHeight: 1.6, color: "#eee", whiteSpace: "pre-wrap", fontFamily: FONT.b }}>{aiResult}</pre>}
      </div>
    </div>
  );
}

// ─── U20 TIERS ───
function TiersTab({ members }) {
  const { s, C, TIER } = useContext(ThemeCtx);
  const [tiersData, setTiersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // tier being edited
  const [newBenefit, setNewBenefit] = useState("");
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [inProgress, setInProgress] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, a] = await Promise.all([
        supaFetch("tiers?select=*&order=annual_fee.asc"),
        supaFetch("admin_users?role=eq.super_admin&limit=1"),
      ]);
      if (Array.isArray(t)) setTiersData(t);
      if (Array.isArray(a) && a[0]) setCurrentAdminId(a[0].id);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const logAudit = async (tierId, before, after, reason) => {
    if (!currentAdminId) return;
    try {
      await supaFetch("audit_log", {
        method: "POST",
        body: {
          admin_user_id: currentAdminId,
          entity_type: "tier",
          entity_id: String(tierId),
          action: "update",
          before_value: before,
          after_value: after,
          reason,
        },
      });
    } catch (e) { console.error("Audit log failed:", e); }
  };

  const saveTier = async () => {
    if (!editing) return;
    // Validation
    if (!editing.name?.trim()) { alert("Name is required"); return; }
    if (editing.annual_fee == null || editing.annual_fee < 0) { alert("Annual fee must be 0 or positive"); return; }
    if (!editing.earn_multiplier || editing.earn_multiplier <= 0) { alert("Earn multiplier must be greater than 0"); return; }
    if (editing.birthday_discount_pct == null || editing.birthday_discount_pct < 0 || editing.birthday_discount_pct > 100) { alert("Birthday discount must be 0–100"); return; }
    if (editing.voucher_count == null || editing.voucher_count < 0) { alert("Voucher count must be 0 or positive"); return; }
    if (editing.voucher_value == null || editing.voucher_value < 0) { alert("Voucher value must be 0 or positive"); return; }

    setInProgress(true);
    try {
      const before = tiersData.find(t => t.id === editing.id);
      const body = {
        name: editing.name.trim(),
        annual_fee: parseFloat(editing.annual_fee),
        earn_multiplier: parseFloat(editing.earn_multiplier),
        birthday_discount_pct: parseFloat(editing.birthday_discount_pct),
        voucher_count: parseInt(editing.voucher_count, 10),
        voucher_value: parseFloat(editing.voucher_value),
        non_stop_hits: !!editing.non_stop_hits,
        benefits: editing.benefits,
      };
      await supaFetch(`tiers?id=eq.${editing.id}`, { method: "PATCH", body });
      await logAudit(editing.id, before, { ...before, ...body }, null);
      setSaveMsg(`${editing.name} tier updated — remember to sync Eber backend`);
      setTimeout(() => setSaveMsg(""), 4000);
      setEditing(null);
      load();
    } catch (e) {
      console.error("Save failed:", e);
      alert("Save failed. Check console.");
    }
    setInProgress(false);
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
        <h2 style={{ ...s.h2, marginBottom: 0 }}>Membership Tiers</h2>
        <div style={{ fontSize: 11, color: C.muted }}>Click a tier to edit</div>
      </div>

      {saveMsg && <div style={s.bannerGreen}><span>✅</span><div>{saveMsg}</div></div>}

      <div style={s.bannerAmber}>
        <span>⚠️</span>
        <div><strong>Eber sync required:</strong> changes here update the 1-Insider source of truth, but the Eber backend tier configuration (earn multiplier rules, voucher triggers, birthday discount mechanics) must be updated separately. This panel records intent; Eber executes.</div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {tiersData.map(t => {
            const count = members.filter(m => m.tier === t.id).length;
            const tierTheme = TIER[t.id] || TIER.silver;
            const dark = ["platinum", "corporate", "staff"].includes(t.id);
            return (
              <div key={t.id}
                onClick={() => setEditing({ ...t, benefits: [...(t.benefits || [])] })}
                style={{
                  background: tierTheme.grad,
                  borderRadius: 16, padding: 24,
                  color: dark ? "#fff" : C.text,
                  position: "relative",
                  cursor: "pointer",
                  transition: "transform .15s, box-shadow .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6, alignItems: "center" }}>
                  {t.annual_fee > 0 && <div style={{ background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "3px 10px", fontSize: 10, fontWeight: 600 }}>${t.annual_fee}/yr</div>}
                  <div style={{ background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 600 }}>✎ Edit</div>
                </div>
                <div style={{ fontFamily: FONT.h, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 16 }}>{count} member{count !== 1 ? "s" : ""}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, opacity: .7 }}>Earn</div><div style={{ fontWeight: 600, fontSize: 13 }}>{t.earn_multiplier}×</div></div>
                  <div><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, opacity: .7 }}>Birthday</div><div style={{ fontWeight: 600, fontSize: 13 }}>{t.birthday_discount_pct}%</div></div>
                  <div><div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, opacity: .7 }}>Vouchers</div><div style={{ fontWeight: 600, fontSize: 13 }}>{t.voucher_count}×${t.voucher_value}</div></div>
                </div>
                <div style={{ fontSize: 11.5, lineHeight: 1.8, opacity: 0.9 }}>
                  {(t.benefits || []).slice(0, 5).map((b, i) => <div key={i}>• {b}</div>)}
                  {(t.benefits || []).length > 5 && <div style={{ opacity: 0.6, fontSize: 10.5 }}>+{(t.benefits || []).length - 5} more</div>}
                </div>
                {t.non_stop_hits && <div style={{ marginTop: 12, background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>🔄 Non-Stop Hits enabled</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── U20 Edit Modal ─── */}
      {editing && (
        <div style={s.modal} onClick={() => !inProgress && setEditing(null)}>
          <div style={{ ...s.modalInner, maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={s.h3}>Edit tier: {editing.name}</div>
              <span style={s.badge(editing.id)}>{editing.id}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Display name</label>
                <input style={{ ...s.input, marginTop: 4 }} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Annual fee (SGD)</label>
                <input type="number" step="1" min="0" style={{ ...s.input, marginTop: 4, ...s.mono }} value={editing.annual_fee || 0} onChange={e => setEditing({ ...editing, annual_fee: e.target.value })} />
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>0 for free tiers (Silver/Staff)</div>
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Earn multiplier</label>
                <input type="number" step="0.1" min="0" style={{ ...s.input, marginTop: 4, ...s.mono }} value={editing.earn_multiplier || 0} onChange={e => setEditing({ ...editing, earn_multiplier: e.target.value })} />
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>$1 = {editing.earn_multiplier || 0} pts</div>
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Birthday discount %</label>
                <input type="number" step="1" min="0" max="100" style={{ ...s.input, marginTop: 4, ...s.mono }} value={editing.birthday_discount_pct || 0} onChange={e => setEditing({ ...editing, birthday_discount_pct: e.target.value })} />
              </div>
              <div />
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Voucher count (per set)</label>
                <input type="number" step="1" min="0" style={{ ...s.input, marginTop: 4, ...s.mono }} value={editing.voucher_count || 0} onChange={e => setEditing({ ...editing, voucher_count: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Voucher value (SGD each)</label>
                <input type="number" step="1" min="0" style={{ ...s.input, marginTop: 4, ...s.mono }} value={editing.voucher_value || 0} onChange={e => setEditing({ ...editing, voucher_value: e.target.value })} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!editing.non_stop_hits} onChange={e => setEditing({ ...editing, non_stop_hits: e.target.checked })} />
                  <span>Non-Stop Hits enabled (unlimited voucher refill via Discover tab)</span>
                </label>
              </div>

              {/* Benefits editor */}
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Benefits ({(editing.benefits || []).length})</label>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <input style={{ ...s.input, flex: 1 }} value={newBenefit} onChange={e => setNewBenefit(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newBenefit.trim()) { setEditing({ ...editing, benefits: [...(editing.benefits || []), newBenefit.trim()] }); setNewBenefit(""); } }} placeholder="Type a benefit and press Enter" />
                  <button onClick={() => { if (newBenefit.trim()) { setEditing({ ...editing, benefits: [...(editing.benefits || []), newBenefit.trim()] }); setNewBenefit(""); } }} style={{ ...s.btnSm, padding: "0 14px" }}>+ Add</button>
                </div>
                {(editing.benefits || []).length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                    {editing.benefits.map((b, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fafafa", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
                        <span style={{ color: C.gold }}>✦</span>
                        <span style={{ flex: 1 }}>{b}</span>
                        <span onClick={() => setEditing({ ...editing, benefits: editing.benefits.filter((_, j) => j !== i) })} style={{ cursor: "pointer", color: "#D32F2F", fontSize: 14, fontWeight: 600 }}>×</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ ...s.bannerRed, marginTop: 16 }}>
              <span>🚫</span>
              <div><strong>Mechanical changes require Eber sync.</strong> Updating earn multiplier, voucher mechanics, or Non-Stop Hits here will NOT automatically propagate to Eber. Update Eber backend separately before considering this change live.</div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setEditing(null)} disabled={inProgress} style={{ ...s.btnSm, background: "#eee", color: "#555", opacity: inProgress ? 0.5 : 1 }}>Cancel</button>
              <button onClick={saveTier} disabled={inProgress} style={{ ...s.btn, opacity: inProgress ? 0.5 : 1 }}>
                {inProgress ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── U21 PROMOTIONS ───
function Promotions({ campaigns }) {
  const { s, C, TIER } = useContext(ThemeCtx);
  // AI assistant state (preserved from Phase 1)
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [prompt, setPrompt] = useState("");

  // U21 state
  const [promotions, setPromotions] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("active"); // 'active' | 'upcoming' | 'completed' | 'create'
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [inProgress, setInProgress] = useState(false);

  const blankDraft = () => ({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    venues: [],
    tiers: ["silver","gold","platinum","corporate"],
    mechanic_type: "double_points",
    mechanic_config: { multiplier: 2, cap: 500, bonus_points: 100, min_spend: 50, comp_item: "", discount_pct: 10 },
    excluded_items: [],
    checklist_ack: { eber_points: false, eber_stamps: false, calendar_set: false, no_overlap: false, documented: false },
  });
  const [draft, setDraft] = useState(blankDraft());
  const [newExclusion, setNewExclusion] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, st, ad] = await Promise.all([
        supaFetch("promotions?order=start_date.desc"),
        supaFetch("stores?select=id,name,category,status&order=name.asc"),
        supaFetch("admin_users?role=eq.super_admin&limit=1"),
      ]);
      if (Array.isArray(pr)) setPromotions(pr);
      if (Array.isArray(st)) setStores(st);
      if (Array.isArray(ad) && ad[0]) setCurrentAdminId(ad[0].id);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const logAudit = async (promotionId, action, before, after, reason) => {
    if (!currentAdminId) return;
    try {
      await supaFetch("audit_log", {
        method: "POST",
        body: {
          admin_user_id: currentAdminId,
          entity_type: "promotion",
          entity_id: String(promotionId),
          action, before_value: before, after_value: after, reason,
        },
      });
    } catch (e) { console.error("Audit log failed:", e); }
  };

  // Filter promotions by status derived from dates + status
  const today = new Date().toISOString().slice(0, 10);
  const active = promotions.filter(p => p.status === "active" && p.start_date <= today && p.end_date >= today);
  const upcoming = promotions.filter(p => (p.status === "draft" || p.status === "active") && p.start_date > today);
  const completed = promotions.filter(p => p.status === "completed" || (p.status !== "cancelled" && p.end_date < today));

  const visible = activeView === "active" ? active : activeView === "upcoming" ? upcoming : activeView === "completed" ? completed : [];

  // Auto-compute revert reminder as end_date + 1
  const computeRevertDate = (endDate) => {
    if (!endDate) return null;
    const d = new Date(endDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  const daysBetween = (d1, d2) => {
    const ms = new Date(d2).getTime() - new Date(d1).getTime();
    return Math.round(ms / 86400000);
  };

  const savePromotion = async () => {
    // Validation
    if (!draft.name?.trim()) { alert("Name is required"); return; }
    if (!draft.start_date || !draft.end_date) { alert("Start and end dates are required"); return; }
    if (draft.end_date < draft.start_date) { alert("End date must be on or after start date"); return; }
    if (draft.start_date < today) { alert("Start date cannot be in the past"); return; }
    if (draft.venues.length === 0) { alert("At least one venue must be selected"); return; }
    if (draft.tiers.length === 0) { alert("At least one tier must be selected"); return; }
    const unchecked = Object.entries(draft.checklist_ack).filter(([, v]) => !v).map(([k]) => k);
    if (unchecked.length > 0) { alert(`Per-promotion checklist is incomplete. ${unchecked.length} item(s) remaining.`); return; }

    // Overlap warning (soft)
    const overlap = promotions.find(p => p.status !== "cancelled" && p.status !== "completed" &&
      draft.venues.some(v => (p.venues || []).includes(v)) &&
      !(draft.end_date < p.start_date || draft.start_date > p.end_date));
    if (overlap) {
      if (!window.confirm(`⚠️ Overlapping promotion detected:\n\n"${overlap.name}" (${overlap.start_date} → ${overlap.end_date}) covers some of the same venues in the same date range.\n\nSave anyway?`)) return;
    }

    setInProgress(true);
    try {
      const body = {
        name: draft.name.trim(),
        description: draft.description?.trim() || null,
        start_date: draft.start_date,
        end_date: draft.end_date,
        venues: draft.venues,
        tiers: draft.tiers,
        mechanic_type: draft.mechanic_type,
        mechanic_config: draft.mechanic_config,
        excluded_items: draft.excluded_items,
        revert_reminder_date: computeRevertDate(draft.end_date),
        checklist_ack: draft.checklist_ack,
        status: draft.start_date <= today ? "active" : "draft",
        created_by: currentAdminId,
      };
      const r = await supaFetch("promotions", { method: "POST", body });
      if (Array.isArray(r) && r[0]) {
        await logAudit(r[0].id, "create", null, r[0], `Created with ${draft.excluded_items.length} exclusion${draft.excluded_items.length === 1 ? "" : "s"}`);
      }
      setDraft(blankDraft());
      setActiveView(draft.start_date <= today ? "active" : "upcoming");
      load();
    } catch (e) {
      console.error("Save promotion failed:", e);
      alert("Save failed. Check console.");
    }
    setInProgress(false);
  };

  const cancelPromotion = async (p) => {
    const reason = window.prompt(`Cancel "${p.name}"?\n\nThis sets status=cancelled and preserves the record. Enter reason:`);
    if (!reason) return;
    await supaFetch(`promotions?id=eq.${p.id}`, { method: "PATCH", body: { status: "cancelled" } });
    await logAudit(p.id, "cancel", { status: p.status }, { status: "cancelled" }, reason);
    load();
  };

  const activateDraft = async (p) => {
    if (!window.confirm(`Activate "${p.name}" now?\n\nThis sets status=active. Remember to have Eber backend rules updated first.`)) return;
    await supaFetch(`promotions?id=eq.${p.id}`, { method: "PATCH", body: { status: "active" } });
    await logAudit(p.id, "activate", { status: p.status }, { status: "active" }, "Admin activation");
    load();
  };

  // Generate .ics calendar event string for revert reminder
  const generateICS = (p) => {
    const revertDate = p.revert_reminder_date || computeRevertDate(p.end_date);
    if (!revertDate) return "";
    const formatDate = (d) => d.replace(/-/g, "") + "T090000";
    const uid = `promo-revert-${p.id}@1-insider`;
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//1-Insider//Promotion Revert//EN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART:${formatDate(revertDate)}`,
      `DTEND:${formatDate(revertDate)}`,
      `SUMMARY:REVERT Eber rules: ${p.name}`,
      `DESCRIPTION:Promotion "${p.name}" ended ${p.end_date}. Manual Eber rule revert required per L04. Excluded items: ${(p.excluded_items || []).join(", ") || "none"}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    return ics;
  };

  const downloadICS = (p) => {
    const blob = new Blob([generateICS(p)], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promo-revert-${p.name.replace(/\W/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const checklistComplete = Object.values(draft.checklist_ack).every(Boolean);

  // ── Helper: promotion card ──
  const PromotionCard = ({ p }) => {
    const daysUntilRevert = p.revert_reminder_date ? daysBetween(today, p.revert_reminder_date) : null;
    const isActive = p.status === "active";
    const isDraft = p.status === "draft";
    const statusColour = {
      active: { bg: "#E8F5E9", fg: "#2E7D32" },
      draft: { bg: "#FFF8E1", fg: "#5D4037" },
      completed: { bg: "#E3F2FD", fg: "#1565C0" },
      cancelled: { bg: "#F7F7F7", fg: "#666" },
    }[p.status] || { bg: "#eee", fg: "#666" };

    return (
      <div style={{ ...s.card, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT.h, fontSize: 16, fontWeight: 600 }}>{p.name}</div>
            {p.description && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{p.description}</div>}
          </div>
          <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: statusColour.bg, color: statusColour.fg, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 0.8 }}>
            {p.status}
          </span>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.muted, marginBottom: 10, flexWrap: "wrap" }}>
          <span><strong style={{ color: C.text }}>📅</strong> {p.start_date} → {p.end_date}</span>
          <span><strong style={{ color: C.text }}>🔧</strong> {(p.mechanic_type || "").replace(/_/g, " ")}</span>
          <span><strong style={{ color: C.text }}>🏛️</strong> {(p.venues || []).length} venue{(p.venues || []).length === 1 ? "" : "s"}</span>
          <span><strong style={{ color: C.text }}>👥</strong> {(p.tiers || []).length} tier{(p.tiers || []).length === 1 ? "" : "s"}</span>
          {(p.excluded_items || []).length > 0 && <span><strong style={{ color: "#B71C1C" }}>🚫</strong> {p.excluded_items.length} excluded item{p.excluded_items.length === 1 ? "" : "s"}</span>}
        </div>

        {/* Venue chips */}
        {(p.venues || []).length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {p.venues.slice(0, 8).map(vId => {
              const store = stores.find(st => st.id === vId);
              return (
                <span key={vId} style={{ display: "inline-block", background: "#f5f5f5", borderRadius: 10, padding: "2px 8px", fontSize: 10.5, marginRight: 4, marginBottom: 3 }}>
                  {store?.name || vId}
                </span>
              );
            })}
            {p.venues.length > 8 && <span style={{ fontSize: 10.5, color: C.muted, marginLeft: 4 }}>+{p.venues.length - 8} more</span>}
          </div>
        )}

        {/* Exclusions */}
        {(p.excluded_items || []).length > 0 && (
          <div style={{ background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: 8, padding: 8, marginBottom: 10, fontSize: 11 }}>
            <div style={{ fontWeight: 600, color: "#B71C1C", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8, fontSize: 9.5 }}>🚫 Excluded from points accrual (Eber L04)</div>
            <div style={{ color: C.text }}>{p.excluded_items.join(" · ")}</div>
          </div>
        )}

        {/* Revert reminder */}
        {(isActive || isDraft) && p.revert_reminder_date && (
          <div style={{ ...s.bannerAmber, marginBottom: 10, padding: "10px 12px" }}>
            <span>⚠️</span>
            <div style={{ flex: 1 }}>
              <div><strong>Revert Eber rules on {p.revert_reminder_date}</strong>{daysUntilRevert !== null && daysUntilRevert > 0 && <span style={{ color: C.muted }}> · in {daysUntilRevert} day{daysUntilRevert === 1 ? "" : "s"}</span>}{daysUntilRevert !== null && daysUntilRevert < 0 && <span style={{ color: "#B71C1C", fontWeight: 600 }}> · OVERDUE by {Math.abs(daysUntilRevert)} day{Math.abs(daysUntilRevert) === 1 ? "" : "s"}</span>}</div>
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>Manual backend update required per Eber L04. Download .ics for Calendar/Gmail MCP reminder.</div>
            </div>
            <button onClick={() => downloadICS(p)} style={{ ...s.btnSm, padding: "4px 10px", fontSize: 10, background: "#555" }}>⇣ .ics</button>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {isDraft && <button onClick={() => activateDraft(p)} style={s.btnSuccess}>Activate now</button>}
          {(isActive || isDraft) && <button onClick={() => cancelPromotion(p)} style={{ ...s.btnSm, background: "#eee", color: "#D32F2F" }}>Cancel</button>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ ...s.h2, marginBottom: 0 }}>Promotions</h2>
        {activeView !== "create" && <button onClick={() => { setDraft(blankDraft()); setActiveView("create"); }} style={s.btn}>+ New Promotion</button>}
      </div>

      {/* Always-on Eber L04 banner */}
      <div style={s.bannerRed}>
        <span>🚫</span>
        <div>
          <strong>Eber L04 — promotional items cannot be auto-excluded from points accrual.</strong> Every promotion here requires a manual Eber backend rule update BEFORE start date, and a REVERT after end date. This page records the intent and surfaces the revert reminder — it does NOT update Eber for you.
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #eee" }}>
        {[
          { id: "active", label: `Active (${active.length})` },
          { id: "upcoming", label: `Upcoming (${upcoming.length})` },
          { id: "completed", label: `Completed (${completed.length})` },
          ...(activeView === "create" ? [{ id: "create", label: "+ Creating new…" }] : []),
        ].map(v => (
          <div key={v.id} onClick={() => setActiveView(v.id)}
            style={{ padding: "10px 16px", fontSize: 12.5, fontWeight: activeView === v.id ? 600 : 400, color: activeView === v.id ? C.gold : C.muted, borderBottom: activeView === v.id ? "2px solid " + C.gold : "2px solid transparent", cursor: "pointer", marginBottom: -1 }}>
            {v.label}
          </div>
        ))}
      </div>

      {/* ─── CREATE VIEW ─── */}
      {activeView === "create" ? (
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ ...s.h3, margin: 0 }}>New Promotion</h3>
            <button onClick={() => setActiveView("active")} style={{ ...s.btnSm, background: "#eee", color: "#555" }}>Cancel</button>
          </div>

          {/* Step 1: Basics */}
          <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.gold, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Step 1 · Basics</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Name</label>
                <input style={{ ...s.input, marginTop: 4 }} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Mother's Day Double Points" />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Description</label>
                <input style={{ ...s.input, marginTop: 4 }} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Optional short description for internal reference" />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Start date</label>
                <input type="date" style={{ ...s.input, marginTop: 4 }} value={draft.start_date} onChange={e => setDraft({ ...draft, start_date: e.target.value })} min={today} />
              </div>
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>End date</label>
                <input type="date" style={{ ...s.input, marginTop: 4 }} value={draft.end_date} onChange={e => setDraft({ ...draft, end_date: e.target.value })} min={draft.start_date || today} />
                {draft.end_date && <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Revert reminder: <strong>{computeRevertDate(draft.end_date)}</strong></div>}
              </div>
            </div>
          </div>

          {/* Step 2: Targeting */}
          <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.gold, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Step 2 · Targeting</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, alignSelf: "center" }}>Venues ({draft.venues.length}):</span>
              <button onClick={() => setDraft({ ...draft, venues: stores.filter(st => st.status === "active").map(st => st.id) })} style={{ ...s.btnSm, background: "#555", padding: "4px 10px", fontSize: 10 }}>All active</button>
              <button onClick={() => setDraft({ ...draft, venues: stores.filter(st => st.category === "Cafés" && st.status === "active").map(st => st.id) })} style={{ ...s.btnSm, background: "#555", padding: "4px 10px", fontSize: 10 }}>Cafés only</button>
              <button onClick={() => setDraft({ ...draft, venues: stores.filter(st => st.category === "Bars" && st.status === "active").map(st => st.id) })} style={{ ...s.btnSm, background: "#555", padding: "4px 10px", fontSize: 10 }}>Bars only</button>
              <button onClick={() => setDraft({ ...draft, venues: stores.filter(st => st.category === "Restaurants" && st.status === "active").map(st => st.id) })} style={{ ...s.btnSm, background: "#555", padding: "4px 10px", fontSize: 10 }}>Restaurants only</button>
              <button onClick={() => setDraft({ ...draft, venues: [] })} style={{ ...s.btnSm, background: "#eee", color: "#555", padding: "4px 10px", fontSize: 10 }}>Clear</button>
            </div>
            <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #eee", borderRadius: 8, padding: 8, background: "#fafafa" }}>
              {stores.map(st => (
                <label key={st.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", fontSize: 12, cursor: "pointer", opacity: st.status === "active" ? 1 : 0.5 }}>
                  <input type="checkbox"
                    checked={draft.venues.includes(st.id)}
                    disabled={st.status !== "active"}
                    onChange={e => setDraft({ ...draft, venues: e.target.checked ? [...draft.venues, st.id] : draft.venues.filter(v => v !== st.id) })} />
                  <span>{st.name}</span>
                  <span style={{ color: C.muted, fontSize: 10.5 }}>· {st.category}</span>
                  {st.status !== "active" && <span style={{ color: "#B71C1C", fontSize: 10 }}>inactive</span>}
                </label>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Eligible tiers</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                {["silver","gold","platinum","corporate","staff"].map(t => (
                  <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid " + (draft.tiers.includes(t) ? C.gold : "#ddd"), borderRadius: 8, background: draft.tiers.includes(t) ? "#FDF8EE" : "#fff", cursor: "pointer", fontSize: 12 }}>
                    <input type="checkbox" checked={draft.tiers.includes(t)}
                      onChange={e => setDraft({ ...draft, tiers: e.target.checked ? [...draft.tiers, t] : draft.tiers.filter(x => x !== t) })} />
                    {t[0].toUpperCase() + t.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3: Mechanic */}
          <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.gold, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Step 3 · Mechanic</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { id: "double_points", label: "Double Points" },
                { id: "bonus", label: "Bonus Points" },
                { id: "comp_item", label: "Comp Item" },
                { id: "discount", label: "% Discount" },
                { id: "custom", label: "Custom" },
              ].map(m => (
                <label key={m.id} style={{ border: "1px solid " + (draft.mechanic_type === m.id ? C.gold : "#ddd"), borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 11.5, textAlign: "center", background: draft.mechanic_type === m.id ? "#FDF8EE" : "#fff" }}>
                  <input type="radio" style={{ display: "none" }} checked={draft.mechanic_type === m.id} onChange={() => setDraft({ ...draft, mechanic_type: m.id })} />
                  {m.label}
                </label>
              ))}
            </div>

            {/* Mechanic-specific config */}
            {draft.mechanic_type === "double_points" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Multiplier</label>
                  <input type="number" step="0.1" min="1" style={{ ...s.input, marginTop: 4 }} value={draft.mechanic_config.multiplier} onChange={e => setDraft({ ...draft, mechanic_config: { ...draft.mechanic_config, multiplier: parseFloat(e.target.value) } })} />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Cap per txn (points)</label>
                  <input type="number" min="0" style={{ ...s.input, marginTop: 4 }} value={draft.mechanic_config.cap} onChange={e => setDraft({ ...draft, mechanic_config: { ...draft.mechanic_config, cap: parseInt(e.target.value, 10) } })} />
                </div>
              </div>
            )}
            {draft.mechanic_type === "bonus" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Bonus points</label>
                  <input type="number" min="0" style={{ ...s.input, marginTop: 4 }} value={draft.mechanic_config.bonus_points} onChange={e => setDraft({ ...draft, mechanic_config: { ...draft.mechanic_config, bonus_points: parseInt(e.target.value, 10) } })} />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Min spend ($)</label>
                  <input type="number" min="0" style={{ ...s.input, marginTop: 4 }} value={draft.mechanic_config.min_spend} onChange={e => setDraft({ ...draft, mechanic_config: { ...draft.mechanic_config, min_spend: parseFloat(e.target.value) } })} />
                </div>
              </div>
            )}
            {draft.mechanic_type === "comp_item" && (
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Comp item name</label>
                <input style={{ ...s.input, marginTop: 4 }} value={draft.mechanic_config.comp_item} onChange={e => setDraft({ ...draft, mechanic_config: { ...draft.mechanic_config, comp_item: e.target.value } })} placeholder="e.g. Complimentary glass of Champagne" />
              </div>
            )}
            {draft.mechanic_type === "discount" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Discount %</label>
                  <input type="number" min="0" max="100" style={{ ...s.input, marginTop: 4 }} value={draft.mechanic_config.discount_pct} onChange={e => setDraft({ ...draft, mechanic_config: { ...draft.mechanic_config, discount_pct: parseFloat(e.target.value) } })} />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Min spend ($)</label>
                  <input type="number" min="0" style={{ ...s.input, marginTop: 4 }} value={draft.mechanic_config.min_spend} onChange={e => setDraft({ ...draft, mechanic_config: { ...draft.mechanic_config, min_spend: parseFloat(e.target.value) } })} />
                </div>
              </div>
            )}
            {draft.mechanic_type === "custom" && (
              <div>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Custom description</label>
                <textarea style={{ ...s.input, marginTop: 4, minHeight: 60, fontFamily: FONT.b }} value={draft.mechanic_config.custom_desc || ""} onChange={e => setDraft({ ...draft, mechanic_config: { ...draft.mechanic_config, custom_desc: e.target.value } })} placeholder="Describe the mechanic in ops-readable language" />
              </div>
            )}
          </div>

          {/* Step 4: Exclusions */}
          <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.gold, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Step 4 · Exclusions (Eber L04 workaround)</div>
            <div style={s.bannerRed}>
              <span>🚫</span>
              <div>
                <strong>Items listed here will NOT earn points during this promotion.</strong> Because Eber cannot auto-exclude, you must also update the Eber backend rules to match — that&apos;s what the checklist in Step 5 enforces. This list is the source of truth for ops.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input style={{ ...s.input, flex: 1 }} value={newExclusion} onChange={e => setNewExclusion(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newExclusion.trim()) { setDraft({ ...draft, excluded_items: [...draft.excluded_items, newExclusion.trim()] }); setNewExclusion(""); } }} placeholder="Type an item name (e.g. Signature Oumi Omakase) and press Enter" />
              <button onClick={() => { if (newExclusion.trim()) { setDraft({ ...draft, excluded_items: [...draft.excluded_items, newExclusion.trim()] }); setNewExclusion(""); } }} style={s.btnSm}>+ Add</button>
            </div>
            {draft.excluded_items.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {draft.excluded_items.map((item, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFEBEE", color: "#B71C1C", borderRadius: 10, padding: "4px 10px", fontSize: 11.5 }}>
                    {item}
                    <span onClick={() => setDraft({ ...draft, excluded_items: draft.excluded_items.filter((_, j) => j !== i) })} style={{ cursor: "pointer", fontWeight: 700 }}>×</span>
                  </span>
                ))}
              </div>
            )}
            {draft.excluded_items.length === 0 && <div style={{ fontSize: 11, color: C.lmuted, marginTop: 8, fontStyle: "italic" }}>No exclusions yet. If your promotion includes comp items or % discounts, list them here so points are not double-earned.</div>}
          </div>

          {/* Step 5: Checklist */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.gold, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Step 5 · Per-Promotion Checklist (required to save)</div>
            <div style={{ background: "#FFFDE7", border: "1px solid #FFF176", borderRadius: 8, padding: 12 }}>
              {[
                { id: "eber_points", label: "Eber backend points rules updated to match this promotion" },
                { id: "eber_stamps", label: "Eber backend stamp rules updated (if any café venues selected)" },
                { id: "calendar_set", label: "Revert-date calendar reminder set (download .ics after save)" },
                { id: "no_overlap", label: "Checked against overlapping promotions on same venues" },
                { id: "documented", label: "Documented in Promotion Calendar / ops handbook" },
              ].map(item => (
                <label key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0", fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={draft.checklist_ack[item.id]} onChange={e => setDraft({ ...draft, checklist_ack: { ...draft.checklist_ack, [item.id]: e.target.checked } })} style={{ marginTop: 2 }} />
                  <span style={{ textDecoration: draft.checklist_ack[item.id] ? "line-through" : "none", color: draft.checklist_ack[item.id] ? C.muted : C.text }}>{item.label}</span>
                </label>
              ))}
              <div style={{ marginTop: 10, fontSize: 11, color: checklistComplete ? "#2E7D32" : C.muted, fontWeight: 600 }}>
                {Object.values(draft.checklist_ack).filter(Boolean).length} / 5 checked {checklistComplete && "✓"}
              </div>
            </div>
          </div>

          {/* Save */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid #eee", paddingTop: 16 }}>
            <button onClick={() => setActiveView("active")} style={{ ...s.btnSm, background: "#eee", color: "#555" }} disabled={inProgress}>Cancel</button>
            <button onClick={savePromotion} disabled={inProgress || !checklistComplete || !draft.name?.trim() || !draft.start_date || !draft.end_date || draft.venues.length === 0 || draft.tiers.length === 0} style={{ ...s.btn, opacity: (inProgress || !checklistComplete || !draft.name?.trim() || !draft.start_date || !draft.end_date || draft.venues.length === 0 || draft.tiers.length === 0) ? 0.4 : 1 }}>
              {inProgress ? "Saving…" : "Save promotion"}
            </button>
          </div>
        </div>
      ) : (
        /* ─── LIST VIEWS ─── */
        <div>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
          ) : visible.length === 0 ? (
            <div style={{ ...s.card, padding: 40, textAlign: "center", color: C.lmuted }}>
              No {activeView} promotions. {activeView === "active" && "Create a new promotion to get started."}
            </div>
          ) : (
            visible.map(p => <PromotionCard key={p.id} p={p} />)
          )}
        </div>
      )}

      {/* ─── Phase 1 campaigns (preserved) ─── */}
      {activeView !== "create" && campaigns.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={s.h3}>Email Campaigns (Phase 1)</h3>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Separate from promotions above. Channel-based member outreach.</div>
          {campaigns.map((c, i) => (
            <div key={i} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 11, color: C.muted }}>{c.segment || c.channel} · {c.start_date} → {c.end_date}</div></div>
              <span style={s.badge(c.status === "active" ? "gold" : "silver")}>{c.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── AI Assistant (preserved from Phase 1) ─── */}
      {activeView !== "create" && (
        <div style={s.aiPanel}>
          <div style={s.aiBadge}>✦ AI PROMOTION DESIGN ASSISTANT</div>
          <div style={{ fontSize: 11, color: "#ccc", marginTop: 6 }}>Describe a promotion idea and Claude will flag Eber limitations, suggest exclusion rules, and outline the per-promotion checklist.</div>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. Mother's Day 2x points at all Cafés + restaurants, comp dessert…" style={{ width: "100%", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, padding: 12, color: "#fff", fontSize: 13, fontFamily: FONT.b, minHeight: 60, marginTop: 12, resize: "vertical" }} />
          <button onClick={async () => { if (!prompt.trim()) return; setAiLoading(true); setAiResult(await askClaude(SYS_CAMPAIGN, prompt)); setAiLoading(false); }} disabled={aiLoading} style={{ ...s.btn, marginTop: 8, opacity: aiLoading ? 0.5 : 1 }}>{aiLoading ? "Designing…" : "Ask Claude"}</button>
          {aiResult && <pre style={{ marginTop: 16, fontSize: 12, lineHeight: 1.6, color: "#eee", whiteSpace: "pre-wrap", fontFamily: FONT.b }}>{aiResult}</pre>}
        </div>
      )}
    </div>
  );
}

// ─── DECISIONS ───
function Decisions() {
  const { s, C, TIER } = useContext(ThemeCtx);
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
  const { s, C, TIER } = useContext(ThemeCtx);
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

// ─── U22 ADMIN USERS & PERMISSIONS (formerly Staff tab) ───
const ROLE_LABELS = {
  super_admin: "Super Admin",
  venue_manager: "Venue Manager",
  finance: "Finance",
  marketing: "Marketing",
  viewer: "Viewer",
};

const ROLE_COLORS = {
  super_admin:   { bg: "#FDF8EE", fg: "#8B6914" },
  venue_manager: { bg: "#E8F5E9", fg: "#2E7D32" },
  finance:       { bg: "#E8EFF5", fg: "#1A3A5C" },
  marketing:     { bg: "#EDE7F6", fg: "#4527A0" },
  viewer:        { bg: "#F7F7F7", fg: "#666" },
};

const PERMISSIONS_MATRIX = [
  { area: "Stores (CRUD)",            super_admin: "✓",    venue_manager: "Scoped", finance: "View",  marketing: "View",  viewer: "View" },
  { area: "Members (edit profile)",   super_admin: "✓",    venue_manager: "—",      finance: "—",     marketing: "—",     viewer: "View" },
  { area: "Vouchers (add/remove)",    super_admin: "✓",    venue_manager: "Scoped", finance: "—",     marketing: "—",     viewer: "View" },
  { area: "Voucher catalogue",        super_admin: "✓",    venue_manager: "—",      finance: "✓",     marketing: "✓",     viewer: "View" },
  { area: "Tiers config",             super_admin: "✓",    venue_manager: "—",      finance: "—",     marketing: "—",     viewer: "View" },
  { area: "Stamps config",            super_admin: "✓",    venue_manager: "—",      finance: "—",     marketing: "✓",     viewer: "View" },
  { area: "Promotions builder",       super_admin: "✓",    venue_manager: "Scoped", finance: "—",     marketing: "✓",     viewer: "View" },
  { area: "Admin users",              super_admin: "✓",    venue_manager: "—",      finance: "—",     marketing: "—",     viewer: "—" },
  { area: "Audit log",                super_admin: "✓",    venue_manager: "Scoped", finance: "✓",     marketing: "View",  viewer: "—" },
  { area: "Financial reports",        super_admin: "✓",    venue_manager: "—",      finance: "✓",     marketing: "View",  viewer: "—" },
];

function AdminUsersTab({ members }) {
  const { s, C, TIER } = useContext(ThemeCtx);
  const [admins, setAdmins] = useState([]);
  const [stores, setStores] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("users"); // 'users' | 'permissions' | 'audit' | 'staff'
  const [inviteModal, setInviteModal] = useState(null);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [auditFilter, setAuditFilter] = useState({ entityType: "all", action: "all", adminId: "all" });

  const staff = members.filter(m => m.tier === "staff");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ad, st, al] = await Promise.all([
        supaFetch("admin_users?order=role.asc"),
        supaFetch("stores?select=id,name&order=name.asc"),
        supaFetch("audit_log?order=created_at.desc&limit=100"),
      ]);
      if (Array.isArray(ad)) {
        setAdmins(ad);
        const sa = ad.find(a => a.role === "super_admin");
        if (sa) setCurrentAdminId(sa.id);
      }
      if (Array.isArray(st)) setStores(st);
      if (Array.isArray(al)) setAuditLog(al);
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
          action, before_value: before, after_value: after, reason,
        },
      });
    } catch (e) { console.error("Audit log failed:", e); }
  };

  const inviteAdmin = async () => {
    if (!inviteModal) return;
    const { name, email, role, venue_scope } = inviteModal;
    if (!name?.trim()) { alert("Name is required"); return; }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert("Valid email is required"); return; }
    if (admins.some(a => a.email.toLowerCase() === email.toLowerCase())) { alert(`An admin with email '${email}' already exists`); return; }

    const body = {
      name, email, role,
      venue_scope: venue_scope || [],
      status: "active",
      invited_by: currentAdminId || null,
    };
    const r = await supaFetch("admin_users", { method: "POST", body });
    if (Array.isArray(r) && r[0]) {
      await logAudit("admin_user", r[0].id, "create", null, r[0], `Invited as ${ROLE_LABELS[role]}`);
    }
    setInviteModal(null);
    load();
  };

  const toggleAdminStatus = async (admin) => {
    const newStatus = admin.status === "active" ? "inactive" : "active";
    const verb = newStatus === "inactive" ? "Deactivate" : "Reactivate";
    if (!window.confirm(`${verb} ${admin.name}?\n\nThey will ${newStatus === "inactive" ? "no longer be able to sign in or be attributed to new actions" : "regain access"}.\n\nAudit history is preserved.`)) return;
    await supaFetch(`admin_users?id=eq.${admin.id}`, { method: "PATCH", body: { status: newStatus } });
    await logAudit("admin_user", admin.id, "update", { status: admin.status }, { status: newStatus }, `Status toggled to ${newStatus}`);
    load();
  };

  const removeFromScope = async (admin, storeId) => {
    const storeName = stores.find(st => st.id === storeId)?.name || storeId;
    if (!window.confirm(`Revoke ${admin.name}'s access to ${storeName}?`)) return;
    const current = admin.venue_scope || [];
    const newScope = current.filter(v => v !== storeId);
    await supaFetch(`admin_users?id=eq.${admin.id}`, { method: "PATCH", body: { venue_scope: newScope } });
    await logAudit("admin_user", admin.id, "revoke_venue_access", { venue_scope: current }, { venue_scope: newScope }, `Revoked access to ${storeName}`);
    load();
  };

  // ─── Audit filter helpers ───
  const filteredAudit = auditLog.filter(e => {
    if (auditFilter.entityType !== "all" && e.entity_type !== auditFilter.entityType) return false;
    if (auditFilter.action !== "all" && e.action !== auditFilter.action) return false;
    if (auditFilter.adminId !== "all" && e.admin_user_id !== auditFilter.adminId) return false;
    return true;
  });

  const adminName = (id) => admins.find(a => a.id === id)?.name || "Unknown";
  const uniqueActions = [...new Set(auditLog.map(e => e.action))].sort();
  const uniqueEntities = [...new Set(auditLog.map(e => e.entity_type))].sort();

  const fmtDateTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("en-SG", { day: "2-digit", month: "short" }) + " · " + d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ ...s.h2, marginBottom: 0 }}>Admin Users & Permissions</h2>
        {activeView === "users" && <button onClick={() => setInviteModal({ name: "", email: "", role: "viewer", venue_scope: [] })} style={s.btn}>+ Invite Admin</button>}
      </div>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #eee" }}>
        {[
          { id: "users",       label: `Admins (${admins.length})` },
          { id: "permissions", label: "Permissions Matrix" },
          { id: "audit",       label: `Audit Log (${auditLog.length})` },
          { id: "staff",       label: `Staff Tier (${staff.length})` },
        ].map(v => (
          <div key={v.id} onClick={() => setActiveView(v.id)}
            style={{ padding: "10px 16px", fontSize: 12.5, fontWeight: activeView === v.id ? 600 : 400, color: activeView === v.id ? C.gold : C.muted, borderBottom: activeView === v.id ? "2px solid " + C.gold : "2px solid transparent", cursor: "pointer", marginBottom: -1 }}>
            {v.label}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
      ) : (
        <>
          {/* ─── VIEW: Admin users table ─── */}
          {activeView === "users" && (
            <>
              <div style={s.bannerGreen}>
                <span>✅</span>
                <div>
                  <strong>5 demo admins seeded.</strong> Permissions apply platform-wide except for Venue Managers whose access is scoped to the stores in their <code style={s.mono}>venue_scope</code> array (see U23 Stores → Grant Admin Access).
                </div>
              </div>

              <div style={s.card}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 900 }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: C.lmuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                        <th style={{ padding: "10px 8px" }}>Name</th>
                        <th style={{ padding: "10px 8px" }}>Email</th>
                        <th style={{ padding: "10px 8px" }}>Role</th>
                        <th style={{ padding: "10px 8px" }}>Venue Scope</th>
                        <th style={{ padding: "10px 8px" }}>Status</th>
                        <th style={{ padding: "10px 8px" }}>Last Active</th>
                        <th style={{ padding: "10px 8px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map(a => {
                        const roleColour = ROLE_COLORS[a.role] || { bg: "#eee", fg: "#666" };
                        const scope = a.venue_scope || [];
                        return (
                          <tr key={a.id} style={{ borderTop: "1px solid #eee" }}>
                            <td style={{ padding: "10px 8px", fontWeight: 500 }}>
                              {a.name}
                              {a.id === currentAdminId && <span style={{ marginLeft: 6, fontSize: 9.5, padding: "1px 6px", borderRadius: 8, background: C.gold, color: "#fff", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>You</span>}
                            </td>
                            <td style={{ padding: "10px 8px", ...s.mono, fontSize: 11.5, color: C.muted }}>{a.email}</td>
                            <td style={{ padding: "10px 8px" }}>
                              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: roleColour.bg, color: roleColour.fg }}>
                                {ROLE_LABELS[a.role] || a.role}
                              </span>
                            </td>
                            <td style={{ padding: "10px 8px", fontSize: 11 }}>
                              {scope.length === 0 ? (
                                <span style={{ color: C.lmuted }}>{a.role === "venue_manager" ? "— (unscoped)" : "All venues"}</span>
                              ) : scope.map(storeId => {
                                const storeName = stores.find(st => st.id === storeId)?.name || storeId;
                                return (
                                  <span key={storeId} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f5f5f5", borderRadius: 10, padding: "2px 8px", marginRight: 3, marginBottom: 2, fontSize: 10.5 }}>
                                    <span>{storeName}</span>
                                    <span onClick={() => removeFromScope(a, storeId)} style={{ cursor: "pointer", color: "#D32F2F", fontWeight: 700 }} title="Revoke access">×</span>
                                  </span>
                                );
                              })}
                            </td>
                            <td style={{ padding: "10px 8px" }}>
                              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: a.status === "active" ? "#E8F5E9" : "#FFEBEE", color: a.status === "active" ? "#2E7D32" : "#B71C1C" }}>
                                {a.status}
                              </span>
                            </td>
                            <td style={{ padding: "10px 8px", fontSize: 11, color: C.muted }}>{a.last_active_at ? fmtDateTime(a.last_active_at) : "—"}</td>
                            <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                              <button onClick={() => toggleAdminStatus(a)} style={a.status === "active" ? s.btnDanger : s.btnSuccess}>
                                {a.status === "active" ? "Deactivate" : "Reactivate"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ─── VIEW: Permissions matrix (read-only reference) ─── */}
          {activeView === "permissions" && (
            <>
              <div style={s.bannerAmber}>
                <span>⚠️</span>
                <div>
                  <strong>Reference only.</strong> This matrix documents what each role is permitted to do in the dashboard. Actual enforcement lives in Supabase Row Level Security and UI gating — to change what a role can do, change both.
                </div>
              </div>

              <div style={s.card}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: C.lmuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                        <th style={{ padding: "10px 8px", textAlign: "left" }}>Area</th>
                        {Object.keys(ROLE_LABELS).map(r => (
                          <th key={r} style={{ padding: "10px 8px", textAlign: "center" }}>{ROLE_LABELS[r]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERMISSIONS_MATRIX.map((row, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                          <td style={{ padding: "10px 8px", fontWeight: 500 }}>{row.area}</td>
                          {Object.keys(ROLE_LABELS).map(r => {
                            const val = row[r];
                            const colour = val === "✓" ? "#2E7D32" : val === "Scoped" ? "#C5A258" : val === "View" ? "#888" : "#ccc";
                            const weight = val === "—" ? 400 : 600;
                            return (
                              <td key={r} style={{ padding: "10px 8px", textAlign: "center", color: colour, fontWeight: weight, fontSize: 12 }}>{val}</td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 16, borderTop: "1px solid #eee", fontSize: 11, color: C.muted, flexWrap: "wrap" }}>
                  <span><strong style={{ color: "#2E7D32" }}>✓</strong> Full access</span>
                  <span><strong style={{ color: "#C5A258" }}>Scoped</strong> Access limited to assigned venues</span>
                  <span><strong style={{ color: "#888" }}>View</strong> Read-only</span>
                  <span><strong style={{ color: "#ccc" }}>—</strong> No access</span>
                </div>
              </div>
            </>
          )}

          {/* ─── VIEW: Audit log ─── */}
          {activeView === "audit" && (
            <>
              <div style={s.bannerGreen}>
                <span>✅</span>
                <div>
                  <strong>Full platform audit trail.</strong> Every admin-side mutation (create/update/delete on members, stores, vouchers, tiers, promotions, admin users) is recorded here with before/after values. Immutable — deletions are soft only.
                </div>
              </div>

              <div style={{ ...s.card, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2 }}>Filters</span>
                <select value={auditFilter.entityType} onChange={(e) => setAuditFilter({ ...auditFilter, entityType: e.target.value })} style={{ ...s.input, width: "auto", padding: "8px 12px" }}>
                  <option value="all">All entities</option>
                  {uniqueEntities.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <select value={auditFilter.action} onChange={(e) => setAuditFilter({ ...auditFilter, action: e.target.value })} style={{ ...s.input, width: "auto", padding: "8px 12px" }}>
                  <option value="all">All actions</option>
                  {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={auditFilter.adminId} onChange={(e) => setAuditFilter({ ...auditFilter, adminId: e.target.value })} style={{ ...s.input, width: "auto", padding: "8px 12px" }}>
                  <option value="all">All admins</option>
                  {admins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <div style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>{filteredAudit.length} of {auditLog.length} shown</div>
              </div>

              <div style={s.card}>
                {filteredAudit.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: C.lmuted, fontSize: 13 }}>
                    {auditLog.length === 0
                      ? "No audit entries yet. Mutations on stores, members, vouchers, tiers, promotions, or admin users will appear here."
                      : "No entries match the current filters."}
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: C.lmuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                          <th style={{ padding: "10px 8px" }}>When</th>
                          <th style={{ padding: "10px 8px" }}>Admin</th>
                          <th style={{ padding: "10px 8px" }}>Entity</th>
                          <th style={{ padding: "10px 8px" }}>Action</th>
                          <th style={{ padding: "10px 8px" }}>ID</th>
                          <th style={{ padding: "10px 8px" }}>Change Summary</th>
                          <th style={{ padding: "10px 8px" }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAudit.map(e => {
                          const before = e.before_value || {};
                          const after = e.after_value || {};
                          const beforeKeys = Object.keys(before);
                          const afterKeys = Object.keys(after);
                          const allKeys = [...new Set([...beforeKeys, ...afterKeys])];
                          const diffKeys = allKeys.filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
                          const summary = e.action === "create" ? `Created (${afterKeys.length} fields)` :
                                          e.action === "delete" ? `Deleted` :
                                          diffKeys.length === 0 ? "—" :
                                          diffKeys.slice(0, 3).join(", ") + (diffKeys.length > 3 ? ` +${diffKeys.length - 3} more` : "");
                          return (
                            <tr key={e.id} style={{ borderTop: "1px solid #eee" }}>
                              <td style={{ padding: "8px", fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{fmtDateTime(e.created_at)}</td>
                              <td style={{ padding: "8px", fontSize: 11.5 }}>{e.admin_user_id ? adminName(e.admin_user_id) : <span style={{ color: C.lmuted }}>system</span>}</td>
                              <td style={{ padding: "8px", fontSize: 11.5 }}>
                                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 600, background: "#f5f5f5", color: C.text }}>
                                  {e.entity_type}
                                </span>
                              </td>
                              <td style={{ padding: "8px", ...s.mono, fontSize: 10.5 }}>{e.action}</td>
                              <td style={{ padding: "8px", ...s.mono, fontSize: 10.5, color: C.muted }}>{e.entity_id}</td>
                              <td style={{ padding: "8px", fontSize: 11.5, color: C.muted, maxWidth: 260 }}>{summary}</td>
                              <td style={{ padding: "8px", fontSize: 11, color: C.muted, fontStyle: e.reason ? "normal" : "italic" }}>{e.reason || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ─── VIEW: Staff tier members (preserved from old StaffTab) ─── */}
          {activeView === "staff" && (
            <>
              <div style={s.bannerAmber}>
                <span>⚠️</span>
                <div>
                  <strong>Dual-Account SOP:</strong> One mobile = one account (Eber restriction). Staff with a personal 1-Insider account must use an alternate mobile number for their Staff tier account.
                </div>
              </div>

              <div style={{ marginBottom: 12, fontSize: 13, color: C.muted }}>
                <strong style={{ color: C.text }}>Staff tier is distinct from admin access.</strong> Admin users (above) sign into the Admin Dashboard. Staff tier members are loyalty members who happen to be 1-Group employees — they sign into the Member Portal like any other member.
              </div>

              {staff.length > 0 ? staff.map(m => (
                <div key={m.id} style={{ ...s.card, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: TIER.staff.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600 }}>{(m.name || "S")[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div style={{ ...s.mono, color: C.muted, fontSize: 11 }}>{m.id} · {m.mobile}</div>
                  </div>
                  <span style={s.badge("staff")}>Staff</span>
                </div>
              )) : (
                <div style={{ ...s.card, padding: 40, textAlign: "center", color: C.lmuted }}>No staff tier members yet.</div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Invite Admin modal ─── */}
      {inviteModal && (
        <div style={s.modal} onClick={() => setInviteModal(null)}>
          <div style={{ ...s.modalInner, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.h3}>Invite Admin</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
              In production this would trigger a signup email. For now the admin is created immediately in Supabase and can be granted access via the Stores tab.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Name</label>
                <input style={{ ...s.input, marginTop: 4 }} value={inviteModal.name} onChange={(e) => setInviteModal({ ...inviteModal, name: e.target.value })} placeholder="Full name" />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Email</label>
                <input style={{ ...s.input, marginTop: 4 }} value={inviteModal.email} onChange={(e) => setInviteModal({ ...inviteModal, email: e.target.value })} placeholder="person@1-group.sg" type="email" />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Role</label>
                <select style={{ ...s.input, marginTop: 4 }} value={inviteModal.role} onChange={(e) => setInviteModal({ ...inviteModal, role: e.target.value, venue_scope: e.target.value === "venue_manager" ? inviteModal.venue_scope : [] })}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {inviteModal.role === "venue_manager" && (
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 10.5, color: C.lmuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Venue scope (venue managers only)</label>
                  <div style={{ marginTop: 6, maxHeight: 160, overflowY: "auto", border: "1px solid #ddd", borderRadius: 8, padding: 8 }}>
                    {stores.map(st => (
                      <label key={st.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", fontSize: 12, cursor: "pointer" }}>
                        <input type="checkbox"
                          checked={(inviteModal.venue_scope || []).includes(st.id)}
                          onChange={(e) => {
                            const cur = inviteModal.venue_scope || [];
                            const next = e.target.checked ? [...cur, st.id] : cur.filter(v => v !== st.id);
                            setInviteModal({ ...inviteModal, venue_scope: next });
                          }} />
                        {st.name}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.lmuted, marginTop: 4 }}>Leave empty for unscoped (not recommended for venue managers).</div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setInviteModal(null)} style={{ ...s.btnSm, background: "#eee", color: "#555" }}>Cancel</button>
              <button onClick={inviteAdmin} style={s.btn}>Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CHECKLIST ───
function ChecklistTab() {
  const { s, C, TIER } = useContext(ThemeCtx);
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
  const { s, C, TIER } = useContext(ThemeCtx);
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
