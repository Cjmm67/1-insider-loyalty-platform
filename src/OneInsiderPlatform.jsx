import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend,
  AreaChart, Area
} from "recharts";

/* ═══════════════════════════════════════════════════════════════════════════════
   1-INSIDER LOYALTY PLATFORM
   AI-Powered Programme Management for 1-Group Singapore
   ═══════════════════════════════════════════════════════════════════════════════ */

// ─── VENUE DATA (All 23 1-Group venues) ─────────────────────────────────────
const VENUES = [
  { id:"oumi", name:"Oumi", cat:"Restaurants", loc:"CapitaSpring Lvl 51", cuisine:"Modern Japanese Omakase" },
  { id:"kaarla", name:"Kaarla", cat:"Restaurants", loc:"CapitaSpring Lvl 51", cuisine:"Modern Australian" },
  { id:"solluna", name:"Sol & Luna", cat:"Restaurants", loc:"CapitaSpring Lvl 51", cuisine:"Mediterranean" },
  { id:"camille", name:"Camille", cat:"Restaurants", loc:"CapitaSpring Lvl 51", cuisine:"French" },
  { id:"fire", name:"FIRE", cat:"Restaurants", loc:"One Fullerton", cuisine:"Modern Grill" },
  { id:"monti", name:"Monti", cat:"Restaurants", loc:"Fullerton Pavilion", cuisine:"Italian" },
  { id:"flnt", name:"FLNT", cat:"Restaurants", loc:"CapitaSpring Lvl 51", cuisine:"Flint-fired Contemporary" },
  { id:"botanico", name:"Botanico", cat:"Restaurants", loc:"Botanic Gardens", cuisine:"Modern European" },
  { id:"mimi", name:"Mimi", cat:"Restaurants", loc:"Clarke Quay", cuisine:"Pan-Asian" },
  { id:"una", name:"UNA", cat:"Restaurants", loc:"Rochester Commons", cuisine:"Italian" },
  { id:"yang", name:"Yang", cat:"Restaurants", loc:"1-Altitude", cuisine:"Contemporary Asian" },
  { id:"zorba", name:"Zorba", cat:"Restaurants", loc:"The Summerhouse", cuisine:"Greek" },
  { id:"alfaro", name:"1-Alfaro", cat:"Restaurants", loc:"Raffles Place", cuisine:"Spanish" },
  { id:"coast", name:"1-Altitude Coast", cat:"Bars", loc:"One Fullerton Rooftop" },
  { id:"arden", name:"1-Arden Bar", cat:"Bars", loc:"CapitaSpring" },
  { id:"bar1918", name:"1918 Heritage Bar", cat:"Bars", loc:"The Riverhouse" },
  { id:"solora", name:"Sol & Ora", cat:"Bars", loc:"CapitaSpring" },
  { id:"pixies", name:"Pixies", cat:"Bars", loc:"Portfolio" },
  { id:"wsbar", name:"Wildseed Bar", cat:"Bars", loc:"The Summerhouse" },
  { id:"wscafe", name:"Wildseed Cafe", cat:"Cafés", loc:"The Summerhouse" },
  { id:"wsbg", name:"Wildseed Bar & Grill", cat:"Cafés", loc:"The Summerhouse" },
  { id:"ilg", name:"Il Giardino", cat:"Cafés", loc:"Botanic Gardens" },
  { id:"melaka", name:"1-Altitude Melaka", cat:"Bars", loc:"Melaka, Malaysia" },
];

const TIERS_DEFAULT = [
  { id:"silver", name:"Silver", hex:"#C0C0C0", bg:"#F5F5F5", txtColor:"#555", threshold:0, earn:1.0, benefits:["Base earn rate (1×)","Birthday dessert or drink","Monthly category rewards","Gift card access","Digital membership card"] },
  { id:"gold", name:"Gold", hex:"#C5A258", bg:"#FDF8EE", txtColor:"#8B6914", threshold:3000, earn:1.5, benefits:["Enhanced earn rate (1.5×)","Priority reservations","Upgraded birthday rewards","Exclusive event access","Complimentary welcome drink","Seasonal tasting invitations"] },
  { id:"platinum", name:"Platinum", hex:"#8C8C8C", bg:"#2D2D2D", txtColor:"#FFFFFF", threshold:8000, earn:2.0, benefits:["Premium earn rate (2×)","VIP reservations","Premium birthday experience","Concierge service","Partner benefits","Chef's table access","Complimentary valet parking","Annual appreciation dinner"] },
];

const CATEGORIES = [
  { id:"cafes", name:"Cafés", icon:"☕", color:"#7B9E6B", desc:"Brunches, bakes & laid-back catchups" },
  { id:"restaurants", name:"Restaurants", icon:"🍽️", color:"#B85C38", desc:"Sky-high dining to elegant dinners" },
  { id:"bars", name:"Bars", icon:"🍸", color:"#6B4E8B", desc:"Cocktails, nightcaps & everything in between" },
  { id:"wines", name:"Wines", icon:"🍷", color:"#8B2252", desc:"Swirl, sip & savour curated vintages" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 10);
const fmtDate = d => new Date(d).toLocaleDateString("en-SG", { day:"numeric", month:"short", year:"numeric" });
const fmtNum = n => new Intl.NumberFormat("en-SG").format(n);
const fmtCur = n => `SGD $${new Intl.NumberFormat("en-SG", { minimumFractionDigits:2, maximumFractionDigits:2 }).format(n)}`;
const monthName = m => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1];

// ─── SEED DATA ───────────────────────────────────────────────────────────────
const seedMembers = () => {
  const names = [
    "Sophia Chen","Marcus Tan","Priya Sharma","James Lim","Aiko Yamamoto",
    "David Ng","Rachel Lee","Benjamin Koh","Mei Ling Wong","Arjun Patel",
    "Sarah Teo","Kevin Chong","Yuki Sato","Daniel Chua","Amanda Goh",
    "Ryan Ong","Michelle Foo","Ethan Yeo","Nicole Tan","Chris Wee",
    "Jessica Ang","Patrick Loh","Vivian Sim","Alex Ho","Catherine Tay",
    "Derek Soh","Emily Chew","Fabian Lim","Grace Tan","Henry Seah"
  ];
  const tierAssign = [
    "silver","silver","silver","silver","silver","silver","silver","silver",
    "silver","silver","silver","silver","silver","silver","silver",
    "gold","gold","gold","gold","gold","gold","gold","gold",
    "platinum","platinum","platinum","platinum","platinum","platinum","platinum"
  ];
  const cats = ["cafes","restaurants","bars","wines"];
  return names.map((name, i) => {
    const tier = tierAssign[i];
    const pts = tier === "platinum" ? Math.floor(Math.random()*5000+3000) : tier === "gold" ? Math.floor(Math.random()*3000+1000) : Math.floor(Math.random()*1500+100);
    const spend = tier === "platinum" ? Math.floor(Math.random()*20000+8000) : tier === "gold" ? Math.floor(Math.random()*8000+3000) : Math.floor(Math.random()*3000+200);
    return {
      id: `M${String(i + 1).padStart(4, "0")}`,
      name,
      mobile: `+65 9${String(Math.floor(Math.random()*9000000+1000000))}`,
      tier,
      points: pts,
      totalSpend: spend,
      categoryPref: cats[i % 4],
      birthdayMonth: (i % 12) + 1,
      signupDate: new Date(2024, Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1).toISOString(),
      lastVisit: new Date(2025, Math.floor(Math.random()*4), Math.floor(Math.random()*28)+1).toISOString(),
      visits: tier === "platinum" ? Math.floor(Math.random()*30+15) : tier === "gold" ? Math.floor(Math.random()*20+8) : Math.floor(Math.random()*12+2),
      favouriteVenue: VENUES[i % VENUES.length].id,
      email: `${name.toLowerCase().replace(/ /g, ".")}@email.com`,
    };
  });
};

const seedRewards = () => [
  { id:genId(), name:"Complimentary Dessert", desc:"Choice of any dessert on the menu", category:"restaurants", tiers:["silver","gold","platinum"], venues:["all"], cost:18, pointsCost:500, active:true, redemptions:142 },
  { id:genId(), name:"Signature Cocktail", desc:"One complimentary signature cocktail at any bar", category:"bars", tiers:["silver","gold","platinum"], venues:["all"], cost:24, pointsCost:600, active:true, redemptions:98 },
  { id:genId(), name:"Wine Flight Experience", desc:"Curated 3-glass wine tasting flight", category:"wines", tiers:["gold","platinum"], venues:["solluna","camille","flnt"], cost:45, pointsCost:1200, active:true, redemptions:34 },
  { id:genId(), name:"Chef's Table Priority", desc:"Priority booking for chef's table at Oumi", category:"restaurants", tiers:["platinum"], venues:["oumi"], cost:0, pointsCost:0, active:true, redemptions:12 },
  { id:genId(), name:"Brunch Upgrade", desc:"Complimentary upgrade to premium brunch set", category:"cafes", tiers:["gold","platinum"], venues:["wscafe","ilg","wsbg"], cost:22, pointsCost:800, active:true, redemptions:67 },
  { id:genId(), name:"Birthday Omakase Upgrade", desc:"Upgrade to premium omakase course during birthday month", category:"restaurants", tiers:["platinum"], venues:["oumi"], cost:85, pointsCost:0, active:true, redemptions:8 },
  { id:genId(), name:"Double Points Weekend", desc:"Earn 2× points on all weekend dining", category:"restaurants", tiers:["silver","gold","platinum"], venues:["all"], cost:0, pointsCost:0, active:true, redemptions:0 },
  { id:genId(), name:"Rooftop Sunset Package", desc:"Complimentary cheese board with 2 drinks at sunset", category:"bars", tiers:["gold","platinum"], venues:["coast"], cost:55, pointsCost:1500, active:true, redemptions:23 },
];

const seedCampaigns = () => [
  { id:genId(), name:"Spring Re-engagement", segment:"Lapsed 60+ days", offer:"500 bonus points on next visit", channel:"Email", start:"2025-03-01", end:"2025-03-31", status:"completed", metrics:{ sent:420, opened:189, redeemed:47 } },
  { id:genId(), name:"Gold Tier Push", segment:"Silver members near $2,500 spend", offer:"Double points for 2 weeks", channel:"Email + SMS", start:"2025-04-01", end:"2025-04-14", status:"active", metrics:{ sent:156, opened:98, redeemed:23 } },
  { id:genId(), name:"Wine Month Spotlight", segment:"Wine category preference members", offer:"Exclusive wine pairing dinner at Sol & Luna", channel:"Email", start:"2025-04-15", end:"2025-04-30", status:"scheduled", metrics:{ sent:0, opened:0, redeemed:0 } },
];

const seedGiftCards = () => [
  { id:genId(), code:"1G-A8K2-M4P9", denom:100, balance:100, purchaser:"Corporate", recipient:"Walk-in Guest", status:"active", created:"2025-03-15" },
  { id:genId(), code:"1G-B3N7-Q2X5", denom:250, balance:125, purchaser:"Sophia Chen", recipient:"Rachel Lee", status:"active", created:"2025-02-20" },
  { id:genId(), code:"1G-C9R1-J6L8", denom:500, balance:0, purchaser:"Corporate Event", recipient:"VIP Guest", status:"redeemed", created:"2025-01-10" },
  { id:genId(), code:"1G-D5T4-W8Y3", denom:50, balance:50, purchaser:"Walk-in", recipient:"Self", status:"active", created:"2025-04-01" },
];

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const store = {
  async get(key) { try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; } },
  async set(key, val) { try { await window.storage.set(key, JSON.stringify(val)); return true; } catch { return false; } },
};

// ─── CSS KEYFRAMES ───────────────────────────────────────────────────────────
const CSS = `
@keyframes spin { to { transform: rotate(360deg) } }
@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
@keyframes shimmer { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
@keyframes glow { 0%,100% { box-shadow:0 0 20px rgba(197,162,88,0.15) } 50% { box-shadow:0 0 40px rgba(197,162,88,0.3) } }
.fadeUp { animation: fadeUp 0.5s ease both }
.fadeUp1 { animation: fadeUp 0.5s ease 0.05s both }
.fadeUp2 { animation: fadeUp 0.5s ease 0.1s both }
.fadeUp3 { animation: fadeUp 0.5s ease 0.15s both }
.fadeUp4 { animation: fadeUp 0.5s ease 0.2s both }
.hoverLift { transition: all 0.25s ease }
.hoverLift:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.1)!important }
input:focus, select:focus { border-color:#C5A258!important; box-shadow:0 0 0 3px rgba(197,162,88,0.12)!important; outline:none }
button { transition: all 0.2s ease }
button:hover { opacity:0.88 }
button:active { transform:scale(0.97) }
::-webkit-scrollbar { width:5px }
::-webkit-scrollbar-thumb { background:#ccc; border-radius:3px }
::-webkit-scrollbar-thumb:hover { background:#aaa }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function OneInsiderPlatform() {
  const [tab, setTab] = useState("overview");
  const [members, setMembers] = useState([]);
  const [tiers, setTiers] = useState(TIERS_DEFAULT);
  const [rewards, setRewards] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQ, setSearchQ] = useState("");

  // ─── INIT: Load from storage or seed ────────────────────────────────────
  useEffect(() => {
    (async () => {
      let m = await store.get("1i-members");
      if (!m?.length) { m = seedMembers(); await store.set("1i-members", m); }
      setMembers(m);

      let r = await store.get("1i-rewards");
      if (!r?.length) { r = seedRewards(); await store.set("1i-rewards", r); }
      setRewards(r);

      let c = await store.get("1i-campaigns");
      if (!c?.length) { c = seedCampaigns(); await store.set("1i-campaigns", c); }
      setCampaigns(c);

      let g = await store.get("1i-giftcards");
      if (!g?.length) { g = seedGiftCards(); await store.set("1i-giftcards", g); }
      setGiftCards(g);

      let t = await store.get("1i-tiers");
      if (t?.length) setTiers(t);

      setLoading(false);
    })();
  }, []);

  // ─── AI CALL ────────────────────────────────────────────────────────────
  const callAI = useCallback(async (prompt, systemPrompt) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt || "You are a luxury hospitality loyalty programme architect for 1-Group Singapore. Be concise, specific, and actionable.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "No response received.";
      setAiResult(text);
      return text;
    } catch (e) {
      const err = `Error: ${e.message}`;
      setAiResult(err);
      return err;
    } finally {
      setAiLoading(false);
    }
  }, []);

  // ─── COMPUTED STATS ─────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    totalMembers: members.length,
    silver: members.filter(m => m.tier === "silver").length,
    gold: members.filter(m => m.tier === "gold").length,
    platinum: members.filter(m => m.tier === "platinum").length,
    totalPoints: members.reduce((s, m) => s + m.points, 0),
    totalSpend: members.reduce((s, m) => s + m.totalSpend, 0),
    avgSpend: members.length ? Math.round(members.reduce((s, m) => s + m.totalSpend, 0) / members.length) : 0,
    totalRedemptions: rewards.reduce((s, r) => s + r.redemptions, 0),
    activeRewards: rewards.filter(r => r.active).length,
    activeCampaigns: campaigns.filter(c => c.status === "active").length,
    giftCardValue: giftCards.reduce((s, g) => s + g.balance, 0),
    totalVisits: members.reduce((s, m) => s + m.visits, 0),
  }), [members, rewards, campaigns, giftCards]);

  const tierData = useMemo(() => [
    { name:"Silver", value:stats.silver, color:"#C0C0C0" },
    { name:"Gold", value:stats.gold, color:"#C5A258" },
    { name:"Platinum", value:stats.platinum, color:"#6B6B6B" },
  ], [stats]);

  const catPopularity = useMemo(() =>
    CATEGORIES.map(c => ({
      name: c.name, value: members.filter(m => m.categoryPref === c.id).length, color: c.color,
    }))
  , [members]);

  const monthlyData = useMemo(() =>
    ["Jan","Feb","Mar","Apr","May","Jun"].map((m, i) => ({
      month: m,
      signups: Math.floor(Math.random()*50 + 15 + i * 5),
      visits: Math.floor(Math.random()*300 + 80 + i * 30),
      redemptions: Math.floor(Math.random()*60 + 15 + i * 8),
      revenue: Math.floor(Math.random()*80000 + 25000 + i * 12000),
    }))
  , []);

  const venueEngagement = useMemo(() =>
    VENUES.slice(0, 12).map(v => ({
      name: v.name.length > 14 ? v.name.slice(0, 13) + "…" : v.name,
      members: Math.floor(Math.random() * 60 + 8),
    }))
  , []);

  const TABS = [
    { id:"overview", label:"Overview", icon:"◆" },
    { id:"members", label:"Members", icon:"♟" },
    { id:"rewards", label:"Rewards", icon:"★" },
    { id:"tiers", label:"Tiers", icon:"▲" },
    { id:"analytics", label:"Analytics", icon:"◈" },
    { id:"campaigns", label:"Campaigns", icon:"◉" },
    { id:"giftcards", label:"Gift Cards", icon:"▣" },
    { id:"integrations", label:"Integrations", icon:"⬡" },
  ];

  // ─── LOADING SCREEN ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", background:"#1A1A1A", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:20 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:38, color:"#C5A258", fontWeight:600, letterSpacing:6 }}>1-INSIDER</div>
      <div style={{ fontSize:12, color:"#666", letterSpacing:4, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Loyalty Platform</div>
      <div style={{ width:44, height:44, border:"3px solid #333", borderTopColor:"#C5A258", borderRadius:"50%", animation:"spin 0.8s linear infinite", marginTop:12 }} />
    </div>
  );

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", background:"#F5F0E8", minHeight:"100vh", color:"#1A1A1A" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{CSS}</style>

      {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
      <header style={{ background:"#1A1A1A", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", position:"sticky", top:0, zIndex:100, borderBottom:"1px solid #2a2a2a" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
          <span style={{ color:"#C5A258", fontSize:21, fontWeight:700, letterSpacing:3 }}>1-INSIDER</span>
          <span style={{ color:"#555", fontSize:10.5, letterSpacing:3.5, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Loyalty Platform</span>
        </div>
        <nav style={{ display:"flex", height:"100%" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background:"none", border:"none", color: tab === t.id ? "#C5A258" : "#666",
                padding:"0 15px", cursor:"pointer", fontSize:11.5, letterSpacing:0.6,
                textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif",
                fontWeight: tab === t.id ? 600 : 400,
                borderBottom: tab === t.id ? "2px solid #C5A258" : "2px solid transparent",
                height:"100%", display:"flex", alignItems:"center", gap:5,
              }}
            >
              <span style={{ fontSize:8.5 }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ═══ CONTENT ══════════════════════════════════════════════════════ */}
      <main style={{ maxWidth:1380, margin:"0 auto", padding:"24px 28px 48px" }}>
        {tab === "overview" && <OverviewTab stats={stats} tierData={tierData} monthlyData={monthlyData} catPopularity={catPopularity} venueEngagement={venueEngagement} members={members} setTab={setTab} />}
        {tab === "members" && <MembersTab members={members} searchQ={searchQ} setSearchQ={setSearchQ} selectedMember={selectedMember} setSelectedMember={setSelectedMember} />}
        {tab === "rewards" && <RewardsTab rewards={rewards} setRewards={setRewards} callAI={callAI} aiLoading={aiLoading} aiResult={aiResult} setAiResult={setAiResult} />}
        {tab === "tiers" && <TiersTab tiers={tiers} setTiers={setTiers} stats={stats} tierData={tierData} />}
        {tab === "analytics" && <AnalyticsTab stats={stats} tierData={tierData} monthlyData={monthlyData} catPopularity={catPopularity} venueEngagement={venueEngagement} members={members} rewards={rewards} />}
        {tab === "campaigns" && <CampaignsTab campaigns={campaigns} setCampaigns={setCampaigns} callAI={callAI} aiLoading={aiLoading} aiResult={aiResult} setAiResult={setAiResult} />}
        {tab === "giftcards" && <GiftCardsTab giftCards={giftCards} setGiftCards={setGiftCards} />}
        {tab === "integrations" && <IntegrationsTab />}
      </main>

      {/* ═══ MEMBER DETAIL MODAL ══════════════════════════════════════════ */}
      {selectedMember && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(6px)" }} onClick={() => setSelectedMember(null)}>
          <div className="fadeUp" style={{ background:"#fff", borderRadius:14, padding:32, maxWidth:660, width:"92%", maxHeight:"88vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
            <MemberDetail member={selectedMember} onClose={() => setSelectedMember(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SHARED UI COMPONENTS ────────────────────────────────────────────────────
const Card = ({ children, style, className = "" }) => (
  <div className={`hoverLift ${className}`} style={{ background:"#fff", borderRadius:10, padding:22, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ title, sub }) => (
  <div style={{ marginBottom:24 }}>
    <h1 style={{ fontSize:27, fontWeight:600, fontFamily:"'Cormorant Garamond',Georgia,serif", margin:0, color:"#1A1A1A", letterSpacing:0.3 }}>{title}</h1>
    {sub && <p style={{ fontSize:13, color:"#888", margin:"5px 0 0", fontFamily:"'DM Sans',sans-serif" }}>{sub}</p>}
  </div>
);

const TierBadge = ({ tier }) => {
  const bg = tier === "platinum" ? "#2D2D2D" : tier === "gold" ? "#FDF8EE" : "#F5F5F5";
  const color = tier === "platinum" ? "#fff" : tier === "gold" ? "#8B6914" : "#666";
  const dotColor = tier === "platinum" ? "#8C8C8C" : tier === "gold" ? "#C5A258" : "#C0C0C0";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 11px", borderRadius:16, fontSize:10.5, fontWeight:600, letterSpacing:0.7, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", background:bg, color, border: tier === "gold" ? "1px solid #E8D5A8" : "1px solid transparent" }}>
      <span style={{ width:7, height:7, borderRadius:"50%", background:dotColor }} />
      {tier}
    </span>
  );
};

const CatBadge = ({ catId }) => {
  const c = CATEGORIES.find(x => x.id === catId);
  if (!c) return null;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:12, fontSize:11, fontFamily:"'DM Sans',sans-serif", background:c.color + "15", color:c.color, fontWeight:500 }}>
      {c.icon} {c.name}
    </span>
  );
};

const Btn = ({ children, variant = "primary", style: s, ...rest }) => {
  const styles = {
    primary: { background:"#1A1A1A", color:"#C5A258" },
    gold: { background:"#C5A258", color:"#fff" },
    ghost: { background:"transparent", color:"#1A1A1A", border:"1px solid #ddd" },
    muted: { background:"#f3f3f3", color:"#555" },
  };
  return (
    <button style={{ padding:"8px 18px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", letterSpacing:0.4, ...styles[variant], ...s }} {...rest}>
      {children}
    </button>
  );
};

const StatusTag = ({ status }) => {
  const map = { active:["#E8F5E9","#2E7D32"], completed:["#F5F5F5","#666"], scheduled:["#E3F2FD","#1565C0"], inactive:["#FFEBEE","#C62828"], redeemed:["#F5F5F5","#555"], expired:["#FFF3E0","#E65100"] };
  const [bg, color] = map[status] || ["#eee","#666"];
  return <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:10, fontSize:10.5, fontWeight:500, background:bg, color, fontFamily:"'DM Sans',sans-serif" }}>{status}</span>;
};

const KpiCard = ({ label, value, sub, subColor, delay = 0 }) => (
  <Card className={`fadeUp${delay}`}>
    <div style={{ fontSize:10.5, color:"#888", textTransform:"uppercase", letterSpacing:1.2, fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:27, fontWeight:600, fontFamily:"'Cormorant Garamond',Georgia,serif" }}>{value}</div>
    {sub && <div style={{ fontSize:11.5, color:subColor || "#888", fontFamily:"'DM Sans',sans-serif", marginTop:4 }}>{sub}</div>}
  </Card>
);

const TH = ({ children, style: s }) => (
  <th style={{ textAlign:"left", padding:"10px 12px", borderBottom:"2px solid #eee", fontSize:10.5, textTransform:"uppercase", letterSpacing:1, color:"#999", fontWeight:600, fontFamily:"'DM Sans',sans-serif", ...s }}>{children}</th>
);

const TD = ({ children, style: s }) => (
  <td style={{ padding:"10px 12px", borderBottom:"1px solid #f5f5f5", verticalAlign:"middle", fontSize:13, fontFamily:"'DM Sans',sans-serif", ...s }}>{children}</td>
);

// ─── MEMBER DETAIL MODAL CONTENT ─────────────────────────────────────────────
function MemberDetail({ member: m, onClose }) {
  const venue = VENUES.find(v => v.id === m.favouriteVenue);
  const cat = CATEGORIES.find(c => c.id === m.categoryPref);
  return (
    <>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:26, margin:0, fontWeight:600 }}>{m.name}</h2>
          <p style={{ fontSize:13, color:"#888", margin:"4px 0 0", fontFamily:"'DM Sans',sans-serif" }}>{m.id} · {m.mobile} · {m.email}</p>
        </div>
        <TierBadge tier={m.tier} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginTop:22 }}>
        {[
          { label:"Points Balance", val:fmtNum(m.points), color:"#C5A258" },
          { label:"Total Spend", val:fmtCur(m.totalSpend) },
          { label:"Visits", val:m.visits },
        ].map((s, i) => (
          <div key={i} style={{ background:"#F5F0E8", borderRadius:8, padding:16, textAlign:"center" }}>
            <div style={{ fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:s.label === "Total Spend" ? 19 : 26, fontWeight:700, fontFamily:"'Cormorant Garamond',Georgia,serif", color:s.color || "#1A1A1A" }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:18 }}>
        <div><span style={{ fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif", display:"block", marginBottom:4 }}>Preferred Category</span>{cat && <CatBadge catId={cat.id} />}</div>
        <div><span style={{ fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif", display:"block", marginBottom:4 }}>Favourite Venue</span><span style={{ fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif" }}>{venue?.name}</span></div>
        <div><span style={{ fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif", display:"block", marginBottom:4 }}>Birthday Month</span><span style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{new Date(2025, m.birthdayMonth - 1).toLocaleString("en", { month:"long" })}</span></div>
        <div><span style={{ fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif", display:"block", marginBottom:4 }}>Member Since</span><span style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{fmtDate(m.signupDate)}</span></div>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:22 }}>
        <Btn variant="primary">Adjust Points</Btn>
        <Btn variant="gold">Send Reward</Btn>
        <Btn variant="ghost">View Activity</Btn>
      </div>
      <div style={{ marginTop:16, textAlign:"right" }}><Btn variant="ghost" onClick={onClose}>Close</Btn></div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ stats, tierData, monthlyData, catPopularity, venueEngagement, members, setTab }) {
  return (
    <div>
      <SectionTitle title="Programme Overview" sub="1-Insider membership performance at a glance" />

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14 }}>
        <KpiCard label="Total Members" value={fmtNum(stats.totalMembers)} sub="+12% MoM" subColor="#4CAF50" delay={0} />
        <KpiCard label="Active Points" value={fmtNum(stats.totalPoints)} sub={`${fmtCur(stats.totalPoints * 0.03)} liability`} delay={1} />
        <KpiCard label="Total Revenue" value={fmtCur(stats.totalSpend)} sub="+18% YoY" subColor="#4CAF50" delay={2} />
        <KpiCard label="Redemptions" value={fmtNum(stats.totalRedemptions)} sub="72% redemption rate" subColor="#4CAF50" delay={3} />
        <KpiCard label="Active Campaigns" value={stats.activeCampaigns} sub="Currently running" delay={4} />
      </div>

      {/* CHART ROW */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginTop:18 }}>
        <Card className="fadeUp1">
          <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Tier Distribution</div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart><Pie data={tierData} cx="50%" cy="50%" outerRadius={72} innerRadius={42} dataKey="value" stroke="none" paddingAngle={3}>{tierData.map((e,i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={v => `${v} members`} contentStyle={{ fontSize:12, fontFamily:"'DM Sans',sans-serif", borderRadius:6 }} /></PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", justifyContent:"center", gap:14, marginTop:6 }}>
            {tierData.map((t,i) => <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, fontFamily:"'DM Sans',sans-serif", color:"#666" }}><div style={{ width:10, height:10, borderRadius:2, background:t.color }} />{t.name} ({t.value})</div>)}
          </div>
        </Card>

        <Card className="fadeUp2">
          <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Category Popularity</div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart><Pie data={catPopularity} cx="50%" cy="50%" outerRadius={72} innerRadius={42} dataKey="value" stroke="none" paddingAngle={3}>{catPopularity.map((e,i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={v => `${v} members`} contentStyle={{ fontSize:12, fontFamily:"'DM Sans',sans-serif", borderRadius:6 }} /></PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", justifyContent:"center", gap:10, marginTop:6, flexWrap:"wrap" }}>
            {catPopularity.map((c,i) => <div key={i} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontFamily:"'DM Sans',sans-serif", color:"#666" }}><div style={{ width:10, height:10, borderRadius:2, background:c.color }} />{c.name}</div>)}
          </div>
        </Card>

        <Card className="fadeUp3">
          <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Monthly Signups</div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={monthlyData}>
              <defs><linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C5A258" stopOpacity={0.3} /><stop offset="100%" stopColor="#C5A258" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize:11, fontFamily:"'DM Sans',sans-serif" }} />
              <YAxis tick={{ fontSize:11, fontFamily:"'DM Sans',sans-serif" }} />
              <Tooltip contentStyle={{ fontSize:12, fontFamily:"'DM Sans',sans-serif", borderRadius:6 }} />
              <Area type="monotone" dataKey="signups" stroke="#C5A258" fill="url(#gGold)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:18 }}>
        <Card className="fadeUp2">
          <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Venue Engagement</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={venueEngagement} layout="vertical" margin={{ left:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize:10, fontFamily:"'DM Sans',sans-serif" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:11, fontFamily:"'DM Sans',sans-serif" }} width={95} />
              <Tooltip contentStyle={{ fontSize:12, fontFamily:"'DM Sans',sans-serif", borderRadius:6 }} />
              <Bar dataKey="members" fill="#C5A258" radius={[0,4,4,0]} barSize={13} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="fadeUp3">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:16, fontWeight:600 }}>Recent Members</div>
            <Btn variant="ghost" style={{ padding:"4px 12px", fontSize:11 }} onClick={() => setTab("members")}>View All →</Btn>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><TH>Member</TH><TH>Tier</TH><TH>Points</TH><TH>Last Visit</TH></tr></thead>
            <tbody>
              {members.slice(0, 7).map(m => (
                <tr key={m.id}>
                  <TD><div style={{ fontWeight:500 }}>{m.name}</div><div style={{ fontSize:11, color:"#999" }}>{m.id}</div></TD>
                  <TD><TierBadge tier={m.tier} /></TD>
                  <TD style={{ fontWeight:600 }}>{fmtNum(m.points)}</TD>
                  <TD style={{ fontSize:12, color:"#888" }}>{fmtDate(m.lastVisit)}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════
function MembersTab({ members, searchQ, setSearchQ, selectedMember, setSelectedMember }) {
  const [filterTier, setFilterTier] = useState("all");
  const filtered = members.filter(m =>
    (filterTier === "all" || m.tier === filterTier) &&
    (!searchQ || m.name.toLowerCase().includes(searchQ.toLowerCase()) || m.mobile.includes(searchQ) || m.id.toLowerCase().includes(searchQ.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <SectionTitle title="Member Manager" sub={`${fmtNum(members.length)} members across all tiers`} />
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <input style={{ padding:"8px 14px", borderRadius:6, border:"1px solid #ddd", fontSize:13, fontFamily:"'DM Sans',sans-serif", width:260, boxSizing:"border-box" }} placeholder="Search name, mobile, or ID…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          <select style={{ padding:"8px 14px", borderRadius:6, border:"1px solid #ddd", fontSize:13, fontFamily:"'DM Sans',sans-serif", background:"#fff", cursor:"pointer" }} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
            <option value="all">All Tiers</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
      </div>
      <Card style={{ padding:0, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#fafafa" }}>
              <TH>Member</TH><TH>Mobile</TH><TH>Tier</TH><TH>Points</TH><TH>Total Spend</TH><TH>Category</TH><TH style={{ textAlign:"center" }}>Visits</TH><TH>Last Visit</TH><TH></TH>
            </tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ cursor:"pointer" }} onClick={() => setSelectedMember(m)} onMouseEnter={e => e.currentTarget.style.background="#fafaf8"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <TD><div style={{ fontWeight:500 }}>{m.name}</div><div style={{ fontSize:11, color:"#aaa" }}>{m.id}</div></TD>
                  <TD style={{ fontSize:12 }}>{m.mobile}</TD>
                  <TD><TierBadge tier={m.tier} /></TD>
                  <TD style={{ fontWeight:600 }}>{fmtNum(m.points)}</TD>
                  <TD>{fmtCur(m.totalSpend)}</TD>
                  <TD><CatBadge catId={m.categoryPref} /></TD>
                  <TD style={{ textAlign:"center" }}>{m.visits}</TD>
                  <TD style={{ fontSize:12, color:"#888" }}>{fmtDate(m.lastVisit)}</TD>
                  <TD><Btn variant="ghost" style={{ padding:"3px 10px", fontSize:10.5 }} onClick={e => { e.stopPropagation(); setSelectedMember(m); }}>View</Btn></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: REWARDS
// ═══════════════════════════════════════════════════════════════════════════════
function RewardsTab({ rewards, setRewards, callAI, aiLoading, aiResult, setAiResult }) {
  const [designTier, setDesignTier] = useState("gold");
  const [designCat, setDesignCat] = useState("restaurants");
  const [designVenue, setDesignVenue] = useState("all");

  const handleAIDesign = () => {
    const venue = designVenue === "all" ? "all 1-Group venues" : VENUES.find(v => v.id === designVenue)?.name;
    const cat = CATEGORIES.find(c => c.id === designCat)?.name;
    callAI(
      `Design 3 creative loyalty rewards for ${designTier.toUpperCase()} tier members in the ${cat} category at ${venue}. Budget per redemption: SGD $20-80. Format as JSON array with fields: name, description, terms, cost_per_redemption, perceived_value, projected_monthly_redemptions. Make rewards feel exclusive and aspirational, not discount-driven. Focus on experiences unique to 1-Group Singapore's premium dining portfolio.`,
      "You are a luxury hospitality loyalty reward architect for 1-Group Singapore. Respond ONLY with valid JSON — no markdown fences, no explanation, just the JSON array."
    );
  };

  const selStyle = { padding:"8px 14px", borderRadius:6, border:"1px solid #444", fontSize:12.5, fontFamily:"'DM Sans',sans-serif", background:"#333", color:"#fff", cursor:"pointer" };

  return (
    <div>
      <SectionTitle title="Reward Designer" sub={`${rewards.length} rewards in catalogue · ${rewards.filter(r => r.active).length} active`} />

      {/* AI DESIGNER PANEL */}
      <div style={{ background:"linear-gradient(135deg,#1A1A1A 0%,#28221a 100%)", borderRadius:12, padding:28, color:"#fff", position:"relative", overflow:"hidden", animation:"glow 4s ease infinite" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, background:"radial-gradient(circle,rgba(197,162,88,0.12) 0%,transparent 70%)", borderRadius:"50%" }} />
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:12, fontSize:10, fontWeight:600, letterSpacing:1.2, textTransform:"uppercase", background:"rgba(197,162,88,0.18)", color:"#C5A258", fontFamily:"'DM Sans',sans-serif", marginBottom:14 }}>✦ AI Reward Designer</div>
        <p style={{ fontSize:13.5, fontFamily:"'DM Sans',sans-serif", color:"#aaa", margin:"0 0 18px", maxWidth:640, lineHeight:1.6 }}>Generate bespoke loyalty rewards powered by Claude. Select tier, category, and venue to create exclusive experiences for 1-Insider members.</p>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end" }}>
          <div>
            <label style={{ fontSize:9.5, color:"#777", display:"block", marginBottom:4, fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase", letterSpacing:1.2 }}>Tier</label>
            <select style={selStyle} value={designTier} onChange={e => setDesignTier(e.target.value)}>
              <option value="silver">Silver</option><option value="gold">Gold</option><option value="platinum">Platinum</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:9.5, color:"#777", display:"block", marginBottom:4, fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase", letterSpacing:1.2 }}>Category</label>
            <select style={selStyle} value={designCat} onChange={e => setDesignCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:9.5, color:"#777", display:"block", marginBottom:4, fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase", letterSpacing:1.2 }}>Venue</label>
            <select style={{ ...selStyle, minWidth:170 }} value={designVenue} onChange={e => setDesignVenue(e.target.value)}>
              <option value="all">All Venues</option>
              {VENUES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <Btn variant="gold" style={{ padding:"10px 26px" }} onClick={handleAIDesign} disabled={aiLoading}>
            {aiLoading ? "✦ Designing…" : "✦ Generate Rewards"}
          </Btn>
        </div>
        {aiLoading && <div style={{ marginTop:16, color:"#C5A258", fontSize:13, fontFamily:"'DM Sans',sans-serif", animation:"pulse 1.5s infinite" }}>AI is crafting bespoke rewards for 1-Insider…</div>}
        {aiResult && !aiLoading && (
          <div style={{ marginTop:18, background:"rgba(255,255,255,0.05)", borderRadius:8, padding:18, maxHeight:320, overflowY:"auto", border:"1px solid rgba(255,255,255,0.06)" }}>
            <pre style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace", color:"#ccc", whiteSpace:"pre-wrap", margin:0, lineHeight:1.7 }}>{aiResult}</pre>
            <Btn variant="ghost" style={{ color:"#777", marginTop:10, fontSize:10.5, borderColor:"#444" }} onClick={() => setAiResult(null)}>Clear</Btn>
          </div>
        )}
      </div>

      {/* REWARD CATALOGUE */}
      <Card style={{ marginTop:20, padding:0, overflow:"hidden" }}>
        <div style={{ padding:"18px 22px 0", fontSize:16, fontWeight:600 }}>Reward Catalogue</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", marginTop:14 }}>
            <thead><tr style={{ background:"#fafafa" }}>
              <TH>Reward</TH><TH>Category</TH><TH>Tiers</TH><TH>Cost</TH><TH>Points</TH><TH style={{ textAlign:"center" }}>Redemptions</TH><TH>Status</TH>
            </tr></thead>
            <tbody>
              {rewards.map(r => (
                <tr key={r.id}>
                  <TD><div style={{ fontWeight:500 }}>{r.name}</div><div style={{ fontSize:11, color:"#999", maxWidth:220 }}>{r.desc}</div></TD>
                  <TD><CatBadge catId={r.category} /></TD>
                  <TD><div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>{r.tiers.map(t => <TierBadge key={t} tier={t} />)}</div></TD>
                  <TD>{r.cost > 0 ? fmtCur(r.cost) : "—"}</TD>
                  <TD style={{ fontWeight:500 }}>{r.pointsCost > 0 ? `${fmtNum(r.pointsCost)} pts` : "Free"}</TD>
                  <TD style={{ fontWeight:600, textAlign:"center" }}>{r.redemptions}</TD>
                  <TD><StatusTag status={r.active ? "active" : "inactive"} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4: TIERS
// ═══════════════════════════════════════════════════════════════════════════════
function TiersTab({ tiers, setTiers, stats, tierData }) {
  const [editing, setEditing] = useState(null);

  const updateTier = (id, field, value) => {
    const updated = tiers.map(t => t.id === id ? { ...t, [field]: value } : t);
    setTiers(updated);
    store.set("1i-tiers", updated);
  };

  return (
    <div>
      <SectionTitle title="Tier Configuration" sub="Define qualification thresholds, earn multipliers, and benefits" />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {tiers.map((tier, idx) => (
          <Card key={tier.id} className={`fadeUp${idx}`} style={{ borderTop:`4px solid ${tier.hex}`, position:"relative" }}>
            <div style={{ position:"absolute", top:16, right:16 }}><TierBadge tier={tier.id} /></div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <div style={{ width:52, height:52, borderRadius:10, background: tier.id === "platinum" ? tier.bg : `linear-gradient(135deg,${tier.hex}22,${tier.hex}55)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:tier.hex, boxShadow:`0 0 14px ${tier.hex}44` }} />
              </div>
              <div>
                <h3 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:24, margin:0 }}>{tier.name}</h3>
                <div style={{ fontSize:12, color:"#888", fontFamily:"'DM Sans',sans-serif" }}>{tier.threshold === 0 ? "Free entry" : `SGD $${fmtNum(tier.threshold)} annual spend`}</div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
              <div style={{ background:"#fafafa", borderRadius:6, padding:12, textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif" }}>Earn Rate</div>
                <div style={{ fontSize:26, fontWeight:700, color:"#C5A258", fontFamily:"'Cormorant Garamond',Georgia,serif" }}>{tier.earn}×</div>
              </div>
              <div style={{ background:"#fafafa", borderRadius:6, padding:12, textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif" }}>Members</div>
                <div style={{ fontSize:26, fontWeight:700, fontFamily:"'Cormorant Garamond',Georgia,serif" }}>{tierData.find(t => t.name === tier.name)?.value || 0}</div>
              </div>
            </div>
            <div style={{ fontSize:10.5, fontFamily:"'DM Sans',sans-serif", color:"#888", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Benefits</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {tier.benefits.map((b, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12.5, fontFamily:"'DM Sans',sans-serif", color:"#444" }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:tier.hex, flexShrink:0 }} />{b}
                </div>
              ))}
            </div>
            <Btn variant="ghost" style={{ marginTop:16, width:"100%" }} onClick={() => setEditing(editing === tier.id ? null : tier.id)}>
              {editing === tier.id ? "Close Editor" : "Edit Tier"}
            </Btn>
            {editing === tier.id && (
              <div style={{ marginTop:12, padding:14, background:"#fafafa", borderRadius:8 }}>
                <label style={{ fontSize:10, display:"block", marginBottom:4, color:"#888", fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase", letterSpacing:1 }}>Spend Threshold (SGD)</label>
                <input type="number" style={{ padding:"8px 12px", borderRadius:6, border:"1px solid #ddd", fontSize:13, fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box", marginBottom:10 }} value={tier.threshold} onChange={e => updateTier(tier.id, "threshold", +e.target.value)} />
                <label style={{ fontSize:10, display:"block", marginBottom:4, color:"#888", fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase", letterSpacing:1 }}>Earn Multiplier</label>
                <input type="number" step="0.1" style={{ padding:"8px 12px", borderRadius:6, border:"1px solid #ddd", fontSize:13, fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box" }} value={tier.earn} onChange={e => updateTier(tier.id, "earn", +e.target.value)} />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* TIER MIGRATION FLOW */}
      <Card style={{ marginTop:20 }}>
        <div style={{ fontSize:16, fontWeight:600, marginBottom:18 }}>Tier Migration Flow</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, padding:"28px 0" }}>
          {tiers.map((t, i) => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ width:88, height:88, borderRadius:"50%", background: t.id === "platinum" ? t.bg : `linear-gradient(135deg,${t.hex}30,${t.hex}60)`, display:"flex", alignItems:"center", justifyContent:"center", border:`3px solid ${t.hex}`, margin:"0 auto" }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontWeight:700, fontSize:20, color: t.id === "platinum" ? "#fff" : "#1A1A1A" }}>{t.name.charAt(0)}</div>
                </div>
                <div style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600, marginTop:8 }}>{t.name}</div>
                <div style={{ fontSize:10.5, color:"#888", fontFamily:"'DM Sans',sans-serif" }}>{t.threshold === 0 ? "Free entry" : `$${fmtNum(t.threshold)}/yr`}</div>
                <div style={{ fontSize:10.5, color:"#C5A258", fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{t.earn}× earn</div>
              </div>
              {i < tiers.length - 1 && <div style={{ fontSize:22, color:"#C5A258", padding:"0 4px", marginBottom:30 }}>→</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5: ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════
function AnalyticsTab({ stats, tierData, monthlyData, catPopularity, venueEngagement, members, rewards }) {
  return (
    <div>
      <SectionTitle title="Analytics Dashboard" sub="Programme performance, engagement, and financial insights" />

      {/* TOP KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { label:"Earn / Burn Ratio", val:"2.3 : 1", sub:"Healthy range (2-3:1)" },
          { label:"Cross-Venue Rate", val:"34%", sub:"Members visiting 2+ venues" },
          { label:"Birthday Redemption", val:"68%", sub:"Above target (60-75%)" },
          { label:"Breakage Rate", val:"28%", sub:`${fmtCur(stats.totalPoints * 0.28 * 0.03)} unredeemed` },
        ].map((k, i) => (
          <Card key={i} className={`fadeUp${i}`}>
            <div style={{ fontSize:10.5, color:"#888", textTransform:"uppercase", letterSpacing:1.2, fontFamily:"'DM Sans',sans-serif", marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:24, fontWeight:700, fontFamily:"'Cormorant Garamond',Georgia,serif", color:"#C5A258" }}>{k.val}</div>
            <div style={{ fontSize:11, color:"#888", fontFamily:"'DM Sans',sans-serif", marginTop:3 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* CHARTS */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:18 }}>
        <Card>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Revenue Trend</div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={monthlyData}>
              <defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C5A258" stopOpacity={0.3} /><stop offset="100%" stopColor="#C5A258" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize:11, fontFamily:"'DM Sans',sans-serif" }} />
              <YAxis tick={{ fontSize:11, fontFamily:"'DM Sans',sans-serif" }} tickFormatter={v => "$" + Math.round(v / 1000) + "K"} />
              <Tooltip formatter={v => fmtCur(v)} contentStyle={{ fontSize:12, fontFamily:"'DM Sans',sans-serif", borderRadius:6 }} />
              <Area type="monotone" dataKey="revenue" stroke="#C5A258" fill="url(#gRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Visits vs Redemptions</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize:11, fontFamily:"'DM Sans',sans-serif" }} />
              <YAxis tick={{ fontSize:11, fontFamily:"'DM Sans',sans-serif" }} />
              <Tooltip contentStyle={{ fontSize:12, fontFamily:"'DM Sans',sans-serif", borderRadius:6 }} />
              <Legend wrapperStyle={{ fontSize:11, fontFamily:"'DM Sans',sans-serif" }} />
              <Bar dataKey="visits" fill="#1A1A1A" radius={[4,4,0,0]} barSize={16} name="Visits" />
              <Bar dataKey="redemptions" fill="#C5A258" radius={[4,4,0,0]} barSize={16} name="Redemptions" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:18 }}>
        <Card>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Top Rewards by Redemption</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...rewards].sort((a, b) => b.redemptions - a.redemptions).slice(0, 6).map(r => ({ name: r.name.length > 22 ? r.name.slice(0, 21) + "…" : r.name, redemptions: r.redemptions }))} layout="vertical" margin={{ left:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize:10, fontFamily:"'DM Sans',sans-serif" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:11, fontFamily:"'DM Sans',sans-serif" }} width={140} />
              <Tooltip contentStyle={{ fontSize:12, fontFamily:"'DM Sans',sans-serif", borderRadius:6 }} />
              <Bar dataKey="redemptions" fill="#B85C38" radius={[0,4,4,0]} barSize={13} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Financial Summary</div>
          {[
            { label:"Total Points Outstanding", val:`${fmtNum(stats.totalPoints)} pts`, sub:`Liability: ${fmtCur(stats.totalPoints * 0.03)}` },
            { label:"Average Spend per Member", val:fmtCur(stats.avgSpend), sub:"Target: SGD $800+" },
            { label:"Cost of Rewards (est.)", val:"4.2% of revenue", sub:"Within 3-8% target" },
            { label:"Incremental Visit Uplift", val:"+19%", sub:"Target: +15-25%" },
            { label:"Gift Card Outstanding", val:fmtCur(stats.giftCardValue), sub:"Active gift cards" },
          ].map((item, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom: i < 4 ? "1px solid #f0f0f0" : "none" }}>
              <div>
                <div style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{item.label}</div>
                <div style={{ fontSize:11, color:"#888", fontFamily:"'DM Sans',sans-serif" }}>{item.sub}</div>
              </div>
              <div style={{ fontSize:18, fontWeight:700, fontFamily:"'Cormorant Garamond',Georgia,serif" }}>{item.val}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6: CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════════
function CampaignsTab({ campaigns, setCampaigns, callAI, aiLoading, aiResult, setAiResult }) {
  const handleAICampaign = () => {
    callAI(
      `Design a targeted loyalty campaign for 1-Insider members. Context: 30 members across Silver (15), Gold (8), Platinum (7), 4 lifestyle categories (Cafés, Restaurants, Bars, Wines), 23 venues. Suggest: 1) Campaign name, 2) Target segment, 3) Offer, 4) Channel (Email/SMS/Both), 5) Duration, 6) Expected ROI and key metrics. Focus on driving cross-venue visits or re-engaging lapsed members. Be specific about 1-Group venues.`,
      "You are a CRM campaign strategist for 1-Group Singapore's 1-Insider loyalty programme. Be concise and specific about venues, tiers, and Singapore F&B context."
    );
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <SectionTitle title="Campaign Builder" sub={`${campaigns.length} campaigns · ${campaigns.filter(c => c.status === "active").length} active`} />
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="gold" onClick={handleAICampaign} disabled={aiLoading}>{aiLoading ? "✦ Generating…" : "✦ AI Campaign Idea"}</Btn>
          <Btn variant="primary">+ New Campaign</Btn>
        </div>
      </div>

      {aiResult && !aiLoading && (
        <div style={{ background:"linear-gradient(135deg,#1A1A1A 0%,#28221a 100%)", borderRadius:12, padding:24, color:"#fff", marginBottom:20, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-30, right:-30, width:160, height:160, background:"radial-gradient(circle,rgba(197,162,88,0.1) 0%,transparent 70%)", borderRadius:"50%" }} />
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:12, fontSize:10, fontWeight:600, letterSpacing:1.2, textTransform:"uppercase", background:"rgba(197,162,88,0.18)", color:"#C5A258", fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>✦ AI Campaign Suggestion</div>
          <pre style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#ccc", whiteSpace:"pre-wrap", margin:0, lineHeight:1.7 }}>{aiResult}</pre>
          <Btn variant="ghost" style={{ color:"#777", marginTop:14, fontSize:10.5, borderColor:"#444" }} onClick={() => setAiResult(null)}>Dismiss</Btn>
        </div>
      )}

      <Card style={{ padding:0, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#fafafa" }}>
              <TH>Campaign</TH><TH>Segment</TH><TH>Offer</TH><TH>Channel</TH><TH>Period</TH><TH>Status</TH><TH style={{ textAlign:"center" }}>Sent</TH><TH style={{ textAlign:"center" }}>Opened</TH><TH style={{ textAlign:"center" }}>Redeemed</TH>
            </tr></thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id}>
                  <TD style={{ fontWeight:500 }}>{c.name}</TD>
                  <TD style={{ fontSize:12 }}>{c.segment}</TD>
                  <TD style={{ fontSize:12, maxWidth:190 }}>{c.offer}</TD>
                  <TD><span style={{ display:"inline-block", padding:"2px 9px", borderRadius:10, fontSize:10.5, fontWeight:500, background:"#EDE7F6", color:"#4527A0", fontFamily:"'DM Sans',sans-serif" }}>{c.channel}</span></TD>
                  <TD style={{ fontSize:11, color:"#888" }}>{fmtDate(c.start)} – {fmtDate(c.end)}</TD>
                  <TD><StatusTag status={c.status} /></TD>
                  <TD style={{ textAlign:"center", fontWeight:500 }}>{c.metrics.sent}</TD>
                  <TD style={{ textAlign:"center" }}>{c.metrics.opened} {c.metrics.sent > 0 && <span style={{ fontSize:10, color:"#888" }}>({Math.round(c.metrics.opened / c.metrics.sent * 100)}%)</span>}</TD>
                  <TD style={{ textAlign:"center", fontWeight:600, color:"#C5A258" }}>{c.metrics.redeemed}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 7: GIFT CARDS
// ═══════════════════════════════════════════════════════════════════════════════
function GiftCardsTab({ giftCards, setGiftCards }) {
  const totalVal = giftCards.reduce((s, g) => s + g.denom, 0);
  const outstanding = giftCards.reduce((s, g) => s + g.balance, 0);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <SectionTitle title="Gift Cards" sub={`${giftCards.length} cards issued · ${fmtCur(outstanding)} outstanding`} />
        <Btn variant="primary">+ Issue Gift Card</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        <KpiCard label="Total Issued Value" value={fmtCur(totalVal)} delay={0} />
        <KpiCard label="Outstanding Balance" value={fmtCur(outstanding)} delay={1} />
        <KpiCard label="Redemption Rate" value={`${totalVal > 0 ? Math.round((1 - outstanding / totalVal) * 100) : 0}%`} delay={2} />
      </div>

      <Card style={{ marginTop:20, padding:0, overflow:"hidden" }}>
        <div style={{ padding:"18px 22px 0", fontSize:16, fontWeight:600 }}>Gift Card Ledger</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", marginTop:14 }}>
            <thead><tr style={{ background:"#fafafa" }}>
              <TH>Code</TH><TH>Denomination</TH><TH>Balance</TH><TH>Purchaser</TH><TH>Recipient</TH><TH>Status</TH><TH>Created</TH>
            </tr></thead>
            <tbody>
              {giftCards.map(g => (
                <tr key={g.id}>
                  <TD style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, letterSpacing:0.5 }}>{g.code}</TD>
                  <TD style={{ fontWeight:500 }}>{fmtCur(g.denom)}</TD>
                  <TD style={{ fontWeight:600, color: g.balance > 0 ? "#4CAF50" : "#999" }}>{fmtCur(g.balance)}</TD>
                  <TD>{g.purchaser}</TD>
                  <TD>{g.recipient}</TD>
                  <TD><StatusTag status={g.status} /></TD>
                  <TD style={{ fontSize:12, color:"#888" }}>{fmtDate(g.created)}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 8: INTEGRATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function IntegrationsTab() {
  const integrations = [
    { name:"SevenRooms CRM", desc:"Guest profiles, reservations, perks & tags", status:"connected", lastSync:"2 min ago", icon:"🔗", synced:2847, pending:3, errors:0 },
    { name:"Agilysys InfoGenesis POS", desc:"Real-time transactions & points accrual", status:"connected", lastSync:"Live", icon:"💳", synced:12483, pending:0, errors:0 },
    { name:"Gmail (MCP)", desc:"Member communications & campaign emails", status:"connected", lastSync:"5 min ago", icon:"✉️", synced:890, pending:12, errors:0 },
    { name:"Google Calendar (MCP)", desc:"Member events & campaign scheduling", status:"connected", lastSync:"1 hr ago", icon:"📅", synced:24, pending:0, errors:0 },
  ];

  const webhookLog = [
    { event:"check.closed", venue:"Oumi", time:"2 min ago", status:"processed", member:"M0024" },
    { event:"reservation.completed", venue:"Camille", time:"8 min ago", status:"processed", member:"M0016" },
    { event:"payment.processed", venue:"1-Arden Bar", time:"12 min ago", status:"processed", member:"M0003" },
    { event:"guest.tagged", venue:"Sol & Luna", time:"18 min ago", status:"processed", member:"M0027" },
    { event:"feedback.submitted", venue:"Monti", time:"25 min ago", status:"processed", member:"M0009" },
    { event:"check.closed", venue:"FIRE", time:"31 min ago", status:"pending", member:"M0015" },
    { event:"reservation.created", venue:"Botanico", time:"38 min ago", status:"processed", member:"M0022" },
    { event:"giftcard.redeemed", venue:"Kaarla", time:"45 min ago", status:"processed", member:"M0001" },
  ];

  return (
    <div>
      <SectionTitle title="Integration Monitor" sub="System health and data pipeline status" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {integrations.map((int, i) => (
          <Card key={i} className={`fadeUp${i}`} style={{ borderLeft:"4px solid #4CAF50" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ fontSize:28 }}>{int.icon}</div>
                <div>
                  <div style={{ fontWeight:600, fontSize:14.5, fontFamily:"'DM Sans',sans-serif" }}>{int.name}</div>
                  <div style={{ fontSize:12, color:"#888", fontFamily:"'DM Sans',sans-serif" }}>{int.desc}</div>
                </div>
              </div>
              <StatusTag status="active" />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:16 }}>
              {[
                { label:"Synced", val:fmtNum(int.synced), color: null },
                { label:"Pending", val:int.pending, color: int.pending > 0 ? "#FF9800" : "#4CAF50" },
                { label:"Errors", val:int.errors, color: int.errors > 0 ? "#F44336" : "#4CAF50" },
              ].map((s, j) => (
                <div key={j} style={{ textAlign:"center", background:"#fafafa", borderRadius:6, padding:10 }}>
                  <div style={{ fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif" }}>{s.label}</div>
                  <div style={{ fontSize:18, fontWeight:700, fontFamily:"'Cormorant Garamond',Georgia,serif", color:s.color || "#1A1A1A" }}>{s.val}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:"#888", fontFamily:"'DM Sans',sans-serif", marginTop:10 }}>Last sync: {int.lastSync}</div>
          </Card>
        ))}
      </div>

      {/* WEBHOOK LOG */}
      <Card style={{ marginTop:20, padding:0, overflow:"hidden" }}>
        <div style={{ padding:"18px 22px 0", fontSize:16, fontWeight:600 }}>Webhook Event Log</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", marginTop:14 }}>
            <thead><tr style={{ background:"#fafafa" }}>
              <TH>Event</TH><TH>Venue</TH><TH>Member</TH><TH>Status</TH><TH>Time</TH>
            </tr></thead>
            <tbody>
              {webhookLog.map((w, i) => (
                <tr key={i}>
                  <TD style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>{w.event}</TD>
                  <TD>{w.venue}</TD>
                  <TD style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>{w.member}</TD>
                  <TD>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background: w.status === "processed" ? "#4CAF50" : "#FF9800" }} />{w.status}
                    </span>
                  </TD>
                  <TD style={{ fontSize:12, color:"#888" }}>{w.time}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* VENUE POS GRID */}
      <Card style={{ marginTop:20 }}>
        <div style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>Venue POS Connection Status</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {VENUES.map(v => (
            <div key={v.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"#fafafa", borderRadius:6, fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#4CAF50" }} />{v.name}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
