import { useState, useEffect, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import { createClient } from '@supabase/supabase-js';

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const supabase = createClient(
  'https://tobtmtshxgpkkucsaxyk.supabase.co',
  'sb_publishable_M_yQLmU_5yc0yTccm4F_oA_xWKyTqx9'
);

const db = {
  async getMembers() {
    const { data } = await supabase.from('members').select('*').order('id');
    return (data || []).map(r => ({ id:r.id, name:r.name, mobile:r.mobile, email:r.email, tier:r.tier, points:r.points, totalSpend:Number(r.total_spend), categoryPref:r.category_pref, birthdayMonth:r.birthday_month, signupDate:r.signup_date, lastVisit:r.last_visit, visits:r.visits, favouriteVenue:r.favourite_venue }));
  },
  async getRewards() {
    const { data } = await supabase.from('rewards').select('*').order('name');
    return (data || []).map(r => ({ id:r.id, name:r.name, desc:r.description, category:r.category, tiers:r.tiers, venues:r.venues, cost:Number(r.cost), pointsCost:r.points_cost, active:r.active, redemptions:r.redemptions }));
  },
  async getTiers() {
    const { data } = await supabase.from('tiers').select('*').order('threshold');
    return (data || []).map(r => ({ id:r.id, name:r.name, hex:r.hex, bg:r.bg, threshold:r.threshold, earn:Number(r.earn), benefits:r.benefits }));
  },
  async getCampaigns() {
    const { data } = await supabase.from('campaigns').select('*').order('start_date', { ascending: false });
    return (data || []).map(r => ({ id:r.id, name:r.name, segment:r.segment, offer:r.offer, channel:r.channel, start:r.start_date, end:r.end_date, status:r.status, metrics:r.metrics }));
  },
  async getGiftCards() {
    const { data } = await supabase.from('gift_cards').select('*').order('created_at', { ascending: false });
    return (data || []).map(r => ({ id:r.id, code:r.code, denom:Number(r.denomination), balance:Number(r.balance), purchaser:r.purchaser, recipient:r.recipient, status:r.status, created:r.created_at }));
  },
  async updateTier(id, updates) {
    const u = {};
    if (updates.threshold !== undefined) u.threshold = updates.threshold;
    if (updates.earn !== undefined) u.earn = updates.earn;
    await supabase.from('tiers').update(u).eq('id', id);
  },
  async updateMember(id, updates) {
    const u = {};
    if (updates.points !== undefined) u.points = updates.points;
    if (updates.tier !== undefined) u.tier = updates.tier;
    if (updates.totalSpend !== undefined) u.total_spend = updates.totalSpend;
    await supabase.from('members').update(u).eq('id', id);
  },
};

// ─── DATA ────────────────────────────────────────────────────────────────────
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
  { id:"1918", name:"1918 Heritage Bar", cat:"Bars", loc:"The Riverhouse" },
  { id:"solora", name:"Sol & Ora", cat:"Bars", loc:"CapitaSpring" },
  { id:"pixies", name:"Pixies", cat:"Bars", loc:"Portfolio" },
  { id:"wsbar", name:"Wildseed Bar", cat:"Bars", loc:"The Summerhouse" },
  { id:"wscafe", name:"Wildseed Cafe", cat:"Cafés", loc:"The Summerhouse" },
  { id:"wsbg", name:"Wildseed Bar & Grill", cat:"Cafés", loc:"The Summerhouse" },
  { id:"ilg", name:"Il Giardino", cat:"Cafés", loc:"Botanic Gardens" },
  { id:"melaka", name:"1-Altitude Melaka", cat:"Bars", loc:"Melaka, Malaysia" },
];

const TIERS_DEFAULT = [
  { id:"silver", name:"Silver", hex:"#C0C0C0", bg:"#F5F5F5", threshold:0, earn:1.0, benefits:["Base earn rate","Birthday dessert/drink","Monthly category rewards","Gift card access"] },
  { id:"gold", name:"Gold", hex:"#C5A258", bg:"#FDF8EE", threshold:3000, earn:1.5, benefits:["Enhanced earn rate (1.5×)","Priority reservations","Upgraded birthday rewards","Exclusive event access","Complimentary welcome drink"] },
  { id:"platinum", name:"Platinum", hex:"#6B6B6B", bg:"#2D2D2D", threshold:8000, earn:2.0, benefits:["Premium earn rate (2×)","VIP reservations","Premium birthday experience","Concierge service","Partner benefits","Chef's table access"] },
];

const CATEGORIES = [
  { id:"cafes", name:"Cafés", icon:"☕", color:"#7B9E6B", desc:"Brunches, bakes & laid-back catchups" },
  { id:"restaurants", name:"Restaurants", icon:"🍽️", color:"#B85C38", desc:"Sky-high dining to elegant dinners" },
  { id:"bars", name:"Bars", icon:"🍸", color:"#6B4E8B", desc:"Cocktails, nightcaps & everything in between" },
  { id:"wines", name:"Wines", icon:"🍷", color:"#8B2252", desc:"Swirl, sip & savour curated vintages" },
];

const genId = () => Math.random().toString(36).slice(2,10);
const fmtDate = d => new Date(d).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'});
const fmtNum = n => new Intl.NumberFormat('en-SG').format(n);
const fmtCur = n => `SGD $${new Intl.NumberFormat('en-SG',{minimumFractionDigits:2}).format(n)}`;

// ─── SEED DATA now lives in Supabase (schema.sql) ───────────────────────────

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily:"'Cormorant Garamond', Georgia, serif", background:"#F5F0E8", minHeight:"100vh", color:"#1A1A1A" },
  header: { background:"#1A1A1A", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:64, position:"sticky", top:0, zIndex:100 },
  logo: { color:"#C5A258", fontSize:22, fontWeight:600, letterSpacing:2, fontFamily:"'Cormorant Garamond', Georgia, serif" },
  logoSub: { color:"#999", fontSize:11, letterSpacing:3, textTransform:"uppercase", fontFamily:"'DM Sans', sans-serif", marginLeft:12 },
  nav: { display:"flex", gap:0, height:"100%" },
  navBtn: (active) => ({ background:"none", border:"none", color:active?"#C5A258":"#888", padding:"0 18px", cursor:"pointer", fontSize:12.5, letterSpacing:0.8, textTransform:"uppercase", fontFamily:"'DM Sans', sans-serif", fontWeight:active?600:400, borderBottom:active?"2px solid #C5A258":"2px solid transparent", height:"100%", display:"flex", alignItems:"center", transition:"all 0.2s" }),
  main: { maxWidth:1360, margin:"0 auto", padding:"28px 32px" },
  card: { background:"#fff", borderRadius:10, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:20 },
  cardTitle: { fontSize:17, fontWeight:600, marginBottom:16, fontFamily:"'Cormorant Garamond', Georgia, serif", color:"#1A1A1A", letterSpacing:0.5 },
  grid: (cols) => ({ display:"grid", gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:16 }),
  stat: { background:"#fff", borderRadius:10, padding:"20px 24px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" },
  statLabel: { fontSize:11, color:"#888", textTransform:"uppercase", letterSpacing:1.2, fontFamily:"'DM Sans', sans-serif", marginBottom:6 },
  statVal: { fontSize:28, fontWeight:600, fontFamily:"'Cormorant Garamond', Georgia, serif" },
  statDelta: (pos) => ({ fontSize:12, color:pos?"#4CAF50":"#F44336", fontFamily:"'DM Sans', sans-serif", marginTop:4 }),
  tierBadge: (tier) => ({ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600, letterSpacing:0.8, textTransform:"uppercase", fontFamily:"'DM Sans', sans-serif", background: tier==='platinum'?"#2D2D2D":tier==='gold'?"#FDF8EE":"#F5F5F5", color: tier==='platinum'?"#fff":tier==='gold'?"#8B6914":"#666", border: tier==='gold'?"1px solid #E8D5A8":"1px solid transparent" }),
  tierDot: (tier) => ({ width:8, height:8, borderRadius:"50%", background: tier==='platinum'?"#8C8C8C":tier==='gold'?"#C5A258":"#C0C0C0" }),
  catBadge: (cat) => { const c = CATEGORIES.find(x=>x.id===cat); return { display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:14, fontSize:11, fontFamily:"'DM Sans', sans-serif", background:c?c.color+"18":"#eee", color:c?c.color:"#666", fontWeight:500 }; },
  btn: (variant="primary") => ({ padding:"8px 20px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12.5, fontWeight:600, fontFamily:"'DM Sans', sans-serif", letterSpacing:0.5, transition:"all 0.2s", ...(variant==="primary"?{background:"#1A1A1A",color:"#C5A258"}:variant==="gold"?{background:"#C5A258",color:"#fff"}:variant==="ghost"?{background:"transparent",color:"#1A1A1A",border:"1px solid #ddd"}:{background:"#f5f5f5",color:"#333"}) }),
  input: { padding:"8px 14px", borderRadius:6, border:"1px solid #ddd", fontSize:13, fontFamily:"'DM Sans', sans-serif", outline:"none", width:"100%", boxSizing:"border-box" },
  select: { padding:"8px 14px", borderRadius:6, border:"1px solid #ddd", fontSize:13, fontFamily:"'DM Sans', sans-serif", outline:"none", background:"#fff", cursor:"pointer" },
  table: { width:"100%", borderCollapse:"collapse", fontSize:13, fontFamily:"'DM Sans', sans-serif" },
  th: { textAlign:"left", padding:"10px 14px", borderBottom:"2px solid #eee", fontSize:11, textTransform:"uppercase", letterSpacing:1, color:"#888", fontWeight:600 },
  td: { padding:"10px 14px", borderBottom:"1px solid #f5f5f5", verticalAlign:"middle" },
  tag: (color="#eee",textColor="#333") => ({ display:"inline-block", padding:"2px 8px", borderRadius:10, fontSize:10.5, fontWeight:500, background:color, color:textColor, fontFamily:"'DM Sans', sans-serif" }),
  modal: { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(4px)" },
  modalContent: { background:"#fff", borderRadius:12, padding:32, maxWidth:560, width:"90%", maxHeight:"85vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.2)" },
  aiGlow: { background:"linear-gradient(135deg, #1A1A1A 0%, #2a2318 100%)", borderRadius:10, padding:24, color:"#fff", position:"relative", overflow:"hidden" },
  aiLabel: { display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:12, fontSize:10, fontWeight:600, letterSpacing:1.2, textTransform:"uppercase", background:"rgba(197,162,88,0.2)", color:"#C5A258", fontFamily:"'DM Sans', sans-serif", marginBottom:12 },
  statusDot: (status) => ({ width:8, height:8, borderRadius:"50%", display:"inline-block", background: status==='active'?"#4CAF50":status==='scheduled'?"#2196F3":status==='completed'?"#9E9E9E":"#FF9800" }),
  emptyState: { textAlign:"center", padding:"48px 24px", color:"#999" },
  body: { fontFamily:"'DM Sans', sans-serif", fontSize:13, color:"#444" },
};

// ─── STORAGE: now using Supabase (see db object above) ───────────────────────

// ─── MAIN APP ────────────────────────────────────────────────────────────────
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
  const [modal, setModal] = useState(null);
  const [searchQ, setSearchQ] = useState("");

  // ─── INIT: Load from Supabase ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setMembers(await db.getMembers());
      setRewards(await db.getRewards());
      setCampaigns(await db.getCampaigns());
      setGiftCards(await db.getGiftCards());
      const t = await db.getTiers();
      if (t.length > 0) setTiers(t);
      setLoading(false);
    })();
  }, []);

  // ─── AI CALL ───────────────────────────────────────────────────────────────
  const callAI = async (prompt, systemPrompt) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt || "You are a luxury hospitality loyalty programme architect for 1-Group Singapore. Respond in valid JSON only when asked for JSON, otherwise respond naturally. Be concise, specific, and actionable.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "No response";
      setAiResult(text);
      setAiLoading(false);
      return text;
    } catch (e) {
      const err = `Error: ${e.message}`;
      setAiResult(err);
      setAiLoading(false);
      return err;
    }
  };

  // ─── COMPUTED STATS ────────────────────────────────────────────────────────
  const stats = {
    totalMembers: members.length,
    silver: members.filter(m=>m.tier==='silver').length,
    gold: members.filter(m=>m.tier==='gold').length,
    platinum: members.filter(m=>m.tier==='platinum').length,
    totalPoints: members.reduce((s,m)=>s+m.points,0),
    totalSpend: members.reduce((s,m)=>s+m.totalSpend,0),
    avgSpend: members.length ? Math.round(members.reduce((s,m)=>s+m.totalSpend,0)/members.length) : 0,
    totalRedemptions: rewards.reduce((s,r)=>s+r.redemptions,0),
    activeRewards: rewards.filter(r=>r.active).length,
    activeCampaigns: campaigns.filter(c=>c.status==='active').length,
    giftCardValue: giftCards.reduce((s,g)=>s+g.balance,0),
  };

  const tierData = [
    { name:"Silver", value:stats.silver, color:"#C0C0C0" },
    { name:"Gold", value:stats.gold, color:"#C5A258" },
    { name:"Platinum", value:stats.platinum, color:"#6B6B6B" },
  ];

  const venueData = VENUES.slice(0,10).map(v => ({
    name: v.name.length > 12 ? v.name.slice(0,12)+'…' : v.name,
    members: Math.floor(Math.random()*80+10),
    revenue: Math.floor(Math.random()*50000+5000),
  }));

  const monthlyData = ["Jan","Feb","Mar","Apr"].map(m => ({
    month: m,
    signups: Math.floor(Math.random()*60+20),
    visits: Math.floor(Math.random()*400+100),
    redemptions: Math.floor(Math.random()*80+20),
    revenue: Math.floor(Math.random()*100000+30000),
  }));

  const catPopularity = CATEGORIES.map(c => ({
    name: c.name,
    value: members.filter(m=>m.categoryPref===c.id).length,
    color: c.color,
  }));

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

  const filteredMembers = members.filter(m =>
    !searchQ || m.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    m.mobile.includes(searchQ) || m.id.toLowerCase().includes(searchQ.toLowerCase())
  );

  if (loading) return (
    <div style={{...S.app, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", flexDirection:"column", gap:16}}>
      <div style={{fontSize:32, color:"#C5A258", fontFamily:"'Cormorant Garamond', Georgia, serif", fontWeight:600, letterSpacing:3}}>1-INSIDER</div>
      <div style={{width:40,height:40,border:"3px solid #eee",borderTopColor:"#C5A258",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .fade-in{animation:fadeIn 0.4s ease}
        .hover-lift:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.1)!important}
        input:focus,select:focus{border-color:#C5A258!important;box-shadow:0 0 0 3px rgba(197,162,88,0.1)}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
        button:hover{opacity:0.85}
      `}</style>

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <header style={S.header}>
        <div style={{display:"flex",alignItems:"center"}}>
          <span style={S.logo}>1-INSIDER</span>
          <span style={S.logoSub}>Loyalty Platform</span>
        </div>
        <nav style={S.nav}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={S.navBtn(tab===t.id)}>
              <span style={{marginRight:5,fontSize:9}}>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ─── BODY ───────────────────────────────────────────────────────── */}
      <main style={S.main} className="fade-in">
        {tab === "overview" && <OverviewTab stats={stats} tierData={tierData} monthlyData={monthlyData} catPopularity={catPopularity} venueData={venueData} members={members} setTab={setTab} />}
        {tab === "members" && <MembersTab members={filteredMembers} searchQ={searchQ} setSearchQ={setSearchQ} selectedMember={selectedMember} setSelectedMember={setSelectedMember} setModal={setModal} tiers={tiers} />}
        {tab === "rewards" && <RewardsTab rewards={rewards} setRewards={setRewards} callAI={callAI} aiLoading={aiLoading} aiResult={aiResult} setAiResult={setAiResult} />}
        {tab === "tiers" && <TiersTab tiers={tiers} setTiers={setTiers} stats={stats} tierData={tierData} />}
        {tab === "analytics" && <AnalyticsTab stats={stats} tierData={tierData} monthlyData={monthlyData} catPopularity={catPopularity} venueData={venueData} members={members} rewards={rewards} />}
        {tab === "campaigns" && <CampaignsTab campaigns={campaigns} setCampaigns={setCampaigns} callAI={callAI} aiLoading={aiLoading} aiResult={aiResult} setAiResult={setAiResult} />}
        {tab === "giftcards" && <GiftCardsTab giftCards={giftCards} setGiftCards={setGiftCards} />}
        {tab === "integrations" && <IntegrationsTab />}
      </main>

      {/* ─── MODAL ──────────────────────────────────────────────────────── */}
      {modal && (
        <div style={S.modal} onClick={()=>setModal(null)}>
          <div style={S.modalContent} onClick={e=>e.stopPropagation()}>
            {modal}
            <div style={{marginTop:20,textAlign:"right"}}>
              <button style={S.btn("ghost")} onClick={()=>setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ stats, tierData, monthlyData, catPopularity, venueData, members, setTab }) {
  return (
    <div className="fade-in">
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:28,fontWeight:600,fontFamily:"'Cormorant Garamond', Georgia, serif",margin:0,color:"#1A1A1A"}}>Programme Overview</h1>
        <p style={{...S.body,color:"#888",margin:"4px 0 0"}}>1-Insider membership performance at a glance</p>
      </div>

      {/* KPI CARDS */}
      <div style={S.grid(5)}>
        {[
          { label:"Total Members", val:fmtNum(stats.totalMembers), delta:"+12% MoM", pos:true },
          { label:"Active Points", val:fmtNum(stats.totalPoints), delta:"$"+fmtNum(Math.round(stats.totalPoints*0.03))+" liability", pos:null },
          { label:"Total Revenue", val:fmtCur(stats.totalSpend), delta:"+18% YoY", pos:true },
          { label:"Redemptions", val:fmtNum(stats.totalRedemptions), delta:"72% rate", pos:true },
          { label:"Active Campaigns", val:stats.activeCampaigns, delta:"Currently running", pos:null },
        ].map((k,i) => (
          <div key={i} style={{...S.stat,transition:"all 0.2s"}} className="hover-lift">
            <div style={S.statLabel}>{k.label}</div>
            <div style={{...S.statVal,color:i===0?"#1A1A1A":"#1A1A1A"}}>{k.val}</div>
            {k.delta && <div style={{fontSize:12,color:k.pos?"#4CAF50":k.pos===false?"#F44336":"#888",fontFamily:"'DM Sans',sans-serif",marginTop:4}}>{k.delta}</div>}
          </div>
        ))}
      </div>

      {/* CHARTS ROW */}
      <div style={{...S.grid(3),marginTop:20}}>
        <div style={S.card}>
          <div style={S.cardTitle}>Tier Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={tierData} cx="50%" cy="50%" outerRadius={75} innerRadius={45} dataKey="value" stroke="none" paddingAngle={3}>
                {tierData.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v)=>`${v} members`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:8}}>
            {tierData.map((t,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontFamily:"'DM Sans',sans-serif",color:"#666"}}>
                <div style={{width:10,height:10,borderRadius:2,background:t.color}} /> {t.name} ({t.value})
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Category Popularity</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={catPopularity} cx="50%" cy="50%" outerRadius={75} innerRadius={45} dataKey="value" stroke="none" paddingAngle={3}>
                {catPopularity.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v)=>`${v} members`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:8,flexWrap:"wrap"}}>
            {catPopularity.map((c,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,fontFamily:"'DM Sans',sans-serif",color:"#666"}}>
                <div style={{width:10,height:10,borderRadius:2,background:c.color}} /> {c.name}
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Monthly Signups</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs><linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C5A258" stopOpacity={0.3}/><stop offset="100%" stopColor="#C5A258" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif"}} />
              <YAxis tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif"}} />
              <Tooltip />
              <Area type="monotone" dataKey="signups" stroke="#C5A258" fill="url(#gGold)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* VENUE PERFORMANCE + RECENT MEMBERS */}
      <div style={{...S.grid(2),marginTop:20}}>
        <div style={S.card}>
          <div style={S.cardTitle}>Venue Engagement</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={venueData} layout="vertical" margin={{left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{fontSize:10,fontFamily:"'DM Sans',sans-serif"}} />
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif"}} width={90} />
              <Tooltip />
              <Bar dataKey="members" fill="#C5A258" radius={[0,4,4,0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={S.cardTitle}>Recent Members</div>
            <button style={S.btn("ghost")} onClick={()=>setTab("members")}>View All →</button>
          </div>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Member</th><th style={S.th}>Tier</th><th style={S.th}>Points</th><th style={S.th}>Last Visit</th>
            </tr></thead>
            <tbody>
              {members.slice(0,6).map(m => (
                <tr key={m.id}>
                  <td style={S.td}><div style={{fontWeight:500}}>{m.name}</div><div style={{fontSize:11,color:"#999"}}>{m.id}</div></td>
                  <td style={S.td}><span style={S.tierBadge(m.tier)}><span style={S.tierDot(m.tier)} />{m.tier}</span></td>
                  <td style={S.td}>{fmtNum(m.points)}</td>
                  <td style={{...S.td,fontSize:12,color:"#888"}}>{fmtDate(m.lastVisit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════
function MembersTab({ members, searchQ, setSearchQ, selectedMember, setSelectedMember, setModal, tiers }) {
  const [filterTier, setFilterTier] = useState("all");
  const filtered = members.filter(m => filterTier === "all" || m.tier === filterTier);

  return (
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:600,fontFamily:"'Cormorant Garamond', Georgia, serif",margin:0}}>Member Manager</h1>
          <p style={{...S.body,color:"#888",margin:"4px 0 0"}}>{fmtNum(members.length)} members across all tiers</p>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <input style={{...S.input,width:260}} placeholder="Search by name, mobile, or ID…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} />
          <select style={S.select} value={filterTier} onChange={e=>setFilterTier(e.target.value)}>
            <option value="all">All Tiers</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
      </div>

      {/* MEMBER TABLE */}
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Member</th><th style={S.th}>Mobile</th><th style={S.th}>Tier</th><th style={S.th}>Points</th><th style={S.th}>Total Spend</th><th style={S.th}>Category</th><th style={S.th}>Visits</th><th style={S.th}>Last Visit</th><th style={S.th}></th>
          </tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} style={{cursor:"pointer"}} onClick={()=>setSelectedMember(m)}>
                <td style={S.td}><div style={{fontWeight:500}}>{m.name}</div><div style={{fontSize:11,color:"#999"}}>{m.id}</div></td>
                <td style={{...S.td,fontSize:12}}>{m.mobile}</td>
                <td style={S.td}><span style={S.tierBadge(m.tier)}><span style={S.tierDot(m.tier)} />{m.tier}</span></td>
                <td style={{...S.td,fontWeight:600}}>{fmtNum(m.points)}</td>
                <td style={S.td}>{fmtCur(m.totalSpend)}</td>
                <td style={S.td}><span style={S.catBadge(m.categoryPref)}>{CATEGORIES.find(c=>c.id===m.categoryPref)?.icon} {CATEGORIES.find(c=>c.id===m.categoryPref)?.name}</span></td>
                <td style={{...S.td,textAlign:"center"}}>{m.visits}</td>
                <td style={{...S.td,fontSize:12,color:"#888"}}>{fmtDate(m.lastVisit)}</td>
                <td style={S.td}><button style={{...S.btn("ghost"),padding:"4px 10px",fontSize:11}} onClick={(e)=>{e.stopPropagation();setSelectedMember(m)}}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MEMBER DETAIL PANEL */}
      {selectedMember && (
        <div style={S.modal} onClick={()=>setSelectedMember(null)}>
          <div style={{...S.modalContent,maxWidth:640}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <h2 style={{fontFamily:"'Cormorant Garamond', Georgia, serif",fontSize:24,margin:0}}>{selectedMember.name}</h2>
                <p style={{...S.body,color:"#888",margin:"4px 0"}}>{selectedMember.id} · {selectedMember.mobile}</p>
              </div>
              <span style={S.tierBadge(selectedMember.tier)}><span style={S.tierDot(selectedMember.tier)} />{selectedMember.tier}</span>
            </div>
            <div style={{...S.grid(3),marginTop:20}}>
              <div style={{background:"#F5F0E8",borderRadius:8,padding:16,textAlign:"center"}}>
                <div style={S.statLabel}>Points Balance</div>
                <div style={{fontSize:28,fontWeight:700,color:"#C5A258",fontFamily:"'Cormorant Garamond', Georgia, serif"}}>{fmtNum(selectedMember.points)}</div>
              </div>
              <div style={{background:"#F5F0E8",borderRadius:8,padding:16,textAlign:"center"}}>
                <div style={S.statLabel}>Total Spend</div>
                <div style={{fontSize:20,fontWeight:600,fontFamily:"'Cormorant Garamond', Georgia, serif"}}>{fmtCur(selectedMember.totalSpend)}</div>
              </div>
              <div style={{background:"#F5F0E8",borderRadius:8,padding:16,textAlign:"center"}}>
                <div style={S.statLabel}>Visits</div>
                <div style={{fontSize:28,fontWeight:700,fontFamily:"'Cormorant Garamond', Georgia, serif"}}>{selectedMember.visits}</div>
              </div>
            </div>
            <div style={{...S.grid(2),marginTop:16}}>
              <div><span style={{...S.statLabel,display:"block",marginBottom:4}}>Preferred Category</span><span style={S.catBadge(selectedMember.categoryPref)}>{CATEGORIES.find(c=>c.id===selectedMember.categoryPref)?.icon} {CATEGORIES.find(c=>c.id===selectedMember.categoryPref)?.name}</span></div>
              <div><span style={{...S.statLabel,display:"block",marginBottom:4}}>Favourite Venue</span><span style={{...S.body,fontWeight:500}}>{VENUES.find(v=>v.id===selectedMember.favouriteVenue)?.name}</span></div>
              <div><span style={{...S.statLabel,display:"block",marginBottom:4}}>Birthday Month</span><span style={S.body}>{new Date(2025,selectedMember.birthdayMonth-1).toLocaleString('en',{month:'long'})}</span></div>
              <div><span style={{...S.statLabel,display:"block",marginBottom:4}}>Member Since</span><span style={S.body}>{fmtDate(selectedMember.signupDate)}</span></div>
            </div>
            <div style={{marginTop:20,display:"flex",gap:8}}>
              <button style={S.btn("primary")}>Adjust Points</button>
              <button style={S.btn("gold")}>Send Reward</button>
              <button style={S.btn("ghost")}>View Activity</button>
            </div>
            <div style={{marginTop:16,textAlign:"right"}}><button style={S.btn("ghost")} onClick={()=>setSelectedMember(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: REWARDS
// ═══════════════════════════════════════════════════════════════════════════════
function RewardsTab({ rewards, setRewards, callAI, aiLoading, aiResult, setAiResult }) {
  const [designTier, setDesignTier] = useState("gold");
  const [designCat, setDesignCat] = useState("restaurants");
  const [designVenue, setDesignVenue] = useState("all");

  const handleAIDesign = () => {
    const venue = designVenue === "all" ? "all 1-Group venues" : VENUES.find(v=>v.id===designVenue)?.name;
    callAI(
      `Design 3 creative loyalty rewards for ${designTier.toUpperCase()} tier members in the ${CATEGORIES.find(c=>c.id===designCat)?.name} category at ${venue}. Budget per redemption: SGD $20-80. Format as JSON array with fields: name, description, terms, cost_per_redemption, perceived_value, projected_monthly_redemptions. Make rewards feel exclusive and aspirational, not discount-driven. Focus on experiences unique to 1-Group Singapore's premium dining portfolio.`,
      "You are a luxury hospitality loyalty reward architect for 1-Group Singapore. Respond ONLY with valid JSON — no markdown, no explanation, just the JSON array."
    );
  };

  return (
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:600,fontFamily:"'Cormorant Garamond', Georgia, serif",margin:0}}>Reward Designer</h1>
          <p style={{...S.body,color:"#888",margin:"4px 0 0"}}>{rewards.length} rewards in catalogue · {rewards.filter(r=>r.active).length} active</p>
        </div>
      </div>

      {/* AI REWARD DESIGNER */}
      <div style={S.aiGlow}>
        <div style={{position:"absolute",top:0,right:0,width:200,height:200,background:"radial-gradient(circle,rgba(197,162,88,0.15) 0%,transparent 70%)",borderRadius:"50%"}} />
        <div style={S.aiLabel}>✦ AI Reward Designer</div>
        <p style={{fontSize:14,fontFamily:"'DM Sans',sans-serif",color:"#ccc",margin:"0 0 16px",maxWidth:600}}>Generate bespoke loyalty rewards powered by AI. Select tier, category, and venue to create exclusive experiences.</p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div>
            <label style={{fontSize:10,color:"#888",display:"block",marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Tier</label>
            <select style={{...S.select,background:"#333",color:"#fff",border:"1px solid #555"}} value={designTier} onChange={e=>setDesignTier(e.target.value)}>
              <option value="silver">Silver</option><option value="gold">Gold</option><option value="platinum">Platinum</option>
            </select>
          </div>
          <div>
            <label style={{fontSize:10,color:"#888",display:"block",marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Category</label>
            <select style={{...S.select,background:"#333",color:"#fff",border:"1px solid #555"}} value={designCat} onChange={e=>setDesignCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:10,color:"#888",display:"block",marginBottom:4,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Venue</label>
            <select style={{...S.select,background:"#333",color:"#fff",border:"1px solid #555",minWidth:160}} value={designVenue} onChange={e=>setDesignVenue(e.target.value)}>
              <option value="all">All Venues</option>
              {VENUES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <button style={{...S.btn("gold"),padding:"10px 24px"}} onClick={handleAIDesign} disabled={aiLoading}>
            {aiLoading ? "✦ Designing…" : "✦ Generate Rewards"}
          </button>
        </div>
        {aiLoading && <div style={{marginTop:16,color:"#C5A258",fontSize:13,fontFamily:"'DM Sans',sans-serif",animation:"pulse 1.5s infinite"}}>AI is crafting bespoke rewards…</div>}
        {aiResult && !aiLoading && (
          <div style={{marginTop:16,background:"rgba(255,255,255,0.06)",borderRadius:8,padding:16,maxHeight:300,overflowY:"auto"}}>
            <pre style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:"#ddd",whiteSpace:"pre-wrap",margin:0,lineHeight:1.6}}>{aiResult}</pre>
            <button style={{...S.btn("ghost"),color:"#888",marginTop:8,fontSize:11}} onClick={()=>setAiResult(null)}>Clear</button>
          </div>
        )}
      </div>

      {/* REWARDS CATALOGUE */}
      <div style={{...S.card,marginTop:20}}>
        <div style={S.cardTitle}>Reward Catalogue</div>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Reward</th><th style={S.th}>Category</th><th style={S.th}>Tiers</th><th style={S.th}>Cost</th><th style={S.th}>Points Cost</th><th style={S.th}>Redemptions</th><th style={S.th}>Status</th>
          </tr></thead>
          <tbody>
            {rewards.map(r => (
              <tr key={r.id}>
                <td style={S.td}><div style={{fontWeight:500}}>{r.name}</div><div style={{fontSize:11,color:"#999",maxWidth:240}}>{r.desc}</div></td>
                <td style={S.td}><span style={S.catBadge(r.category)}>{CATEGORIES.find(c=>c.id===r.category)?.icon} {CATEGORIES.find(c=>c.id===r.category)?.name}</span></td>
                <td style={S.td}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{r.tiers.map(t => <span key={t} style={S.tierBadge(t)}>{t}</span>)}</div></td>
                <td style={S.td}>{r.cost > 0 ? fmtCur(r.cost) : "—"}</td>
                <td style={{...S.td,fontWeight:500}}>{r.pointsCost > 0 ? fmtNum(r.pointsCost)+" pts" : "Free"}</td>
                <td style={{...S.td,fontWeight:600}}>{r.redemptions}</td>
                <td style={S.td}><span style={S.tag(r.active?"#E8F5E9":"#FFEBEE",r.active?"#2E7D32":"#C62828")}>{r.active?"Active":"Inactive"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: TIERS
// ═══════════════════════════════════════════════════════════════════════════════
function TiersTab({ tiers, setTiers, stats, tierData }) {
  const [editing, setEditing] = useState(null);

  return (
    <div className="fade-in">
      <h1 style={{fontSize:28,fontWeight:600,fontFamily:"'Cormorant Garamond', Georgia, serif",margin:"0 0 4px"}}>Tier Configuration</h1>
      <p style={{...S.body,color:"#888",margin:"0 0 24px"}}>Define qualification thresholds, earn multipliers, and benefits for each tier</p>

      <div style={S.grid(3)}>
        {tiers.map(tier => (
          <div key={tier.id} style={{...S.card,borderTop:`4px solid ${tier.hex}`,position:"relative"}} className="hover-lift">
            <div style={{position:"absolute",top:16,right:16}}>
              <span style={S.tierBadge(tier.id)}>{tierData.find(t=>t.name===tier.name)?.value || 0} members</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:48,height:48,borderRadius:8,background:tier.id==='platinum'?tier.bg:'linear-gradient(135deg,'+tier.hex+'22,'+tier.hex+'44)',display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:tier.hex,boxShadow:`0 0 12px ${tier.hex}44`}} />
              </div>
              <div>
                <h3 style={{fontFamily:"'Cormorant Garamond', Georgia, serif",fontSize:22,margin:0,color:tier.id==='platinum'?"#1A1A1A":"#1A1A1A"}}>{tier.name}</h3>
                <div style={{fontSize:12,color:"#888",fontFamily:"'DM Sans',sans-serif"}}>{tier.id==='silver'?"Free entry":"SGD $"+fmtNum(tier.threshold)+" annual spend"}</div>
              </div>
            </div>

            <div style={{...S.grid(2),marginBottom:16}}>
              <div style={{background:"#fafafa",borderRadius:6,padding:12,textAlign:"center"}}>
                <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,fontFamily:"'DM Sans',sans-serif"}}>Earn Rate</div>
                <div style={{fontSize:24,fontWeight:700,color:"#C5A258",fontFamily:"'Cormorant Garamond', Georgia, serif"}}>{tier.earn}×</div>
              </div>
              <div style={{background:"#fafafa",borderRadius:6,padding:12,textAlign:"center"}}>
                <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,fontFamily:"'DM Sans',sans-serif"}}>Threshold</div>
                <div style={{fontSize:18,fontWeight:600,fontFamily:"'Cormorant Garamond', Georgia, serif"}}>{tier.threshold===0?"Free":"$"+fmtNum(tier.threshold)}</div>
              </div>
            </div>

            <div style={{fontSize:12,fontFamily:"'DM Sans',sans-serif",color:"#888",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Benefits</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {tier.benefits.map((b,i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:"#444"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:tier.hex,flexShrink:0}} />
                  {b}
                </div>
              ))}
            </div>

            <button style={{...S.btn("ghost"),marginTop:16,width:"100%"}} onClick={()=>setEditing(tier.id===editing?null:tier.id)}>
              {editing===tier.id?"Close Editor":"Edit Tier"}
            </button>

            {editing===tier.id && (
              <div style={{marginTop:12,padding:12,background:"#fafafa",borderRadius:8}}>
                <label style={{fontSize:10,display:"block",marginBottom:4,color:"#888",fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Spend Threshold (SGD)</label>
                <input type="number" style={{...S.input,marginBottom:8}} value={tier.threshold} onChange={e=>{const v=[...tiers];const idx=v.findIndex(t=>t.id===tier.id);v[idx]={...v[idx],threshold:+e.target.value};setTiers(v);db.updateTier(tier.id,{threshold:+e.target.value});}} />
                <label style={{fontSize:10,display:"block",marginBottom:4,color:"#888",fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Earn Multiplier</label>
                <input type="number" step="0.1" style={S.input} value={tier.earn} onChange={e=>{const v=[...tiers];const idx=v.findIndex(t=>t.id===tier.id);v[idx]={...v[idx],earn:+e.target.value};setTiers(v);db.updateTier(tier.id,{earn:+e.target.value});}} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* TIER MIGRATION DIAGRAM */}
      <div style={{...S.card,marginTop:20}}>
        <div style={S.cardTitle}>Tier Migration Flow</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"24px 0"}}>
          {tiers.map((t,i) => (
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{textAlign:"center"}}>
                <div style={{width:80,height:80,borderRadius:"50%",background:t.id==='platinum'?t.bg:`linear-gradient(135deg,${t.hex}33,${t.hex}66)`,display:"flex",alignItems:"center",justifyContent:"center",border:`3px solid ${t.hex}`,margin:"0 auto"}}>
                  <div style={{fontFamily:"'Cormorant Garamond', Georgia, serif",fontWeight:700,fontSize:18,color:t.id==='platinum'?"#fff":"#1A1A1A"}}>{t.name.charAt(0)}</div>
                </div>
                <div style={{fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:600,marginTop:6}}>{t.name}</div>
                <div style={{fontSize:10,color:"#888",fontFamily:"'DM Sans',sans-serif"}}>{t.threshold===0?"Free entry":"$"+fmtNum(t.threshold)+"/yr"}</div>
              </div>
              {i < tiers.length - 1 && <div style={{fontSize:20,color:"#C5A258",padding:"0 8px"}}>→</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════
function AnalyticsTab({ stats, tierData, monthlyData, catPopularity, venueData, members, rewards }) {
  return (
    <div className="fade-in">
      <h1 style={{fontSize:28,fontWeight:600,fontFamily:"'Cormorant Garamond', Georgia, serif",margin:"0 0 4px"}}>Analytics Dashboard</h1>
      <p style={{...S.body,color:"#888",margin:"0 0 24px"}}>Programme performance, engagement, and financial insights</p>

      {/* TOP KPIs */}
      <div style={S.grid(4)}>
        {[
          { label:"Earn/Burn Ratio", val:"2.3:1", sub:"Healthy range" },
          { label:"Cross-Venue Rate", val:"34%", sub:"Members visiting 2+ venues" },
          { label:"Birthday Redemption", val:"68%", sub:"Above target (60-75%)" },
          { label:"Breakage Rate", val:"28%", sub:"$"+fmtNum(Math.round(stats.totalPoints*0.28*0.03))+" unredeemed value" },
        ].map((k,i) => (
          <div key={i} style={S.stat} className="hover-lift">
            <div style={S.statLabel}>{k.label}</div>
            <div style={{fontSize:24,fontWeight:700,fontFamily:"'Cormorant Garamond', Georgia, serif",color:"#C5A258"}}>{k.val}</div>
            <div style={{fontSize:11,color:"#888",fontFamily:"'DM Sans',sans-serif",marginTop:2}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* REVENUE + VISITS */}
      <div style={{...S.grid(2),marginTop:20}}>
        <div style={S.card}>
          <div style={S.cardTitle}>Revenue Trend</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C5A258" stopOpacity={0.3}/><stop offset="100%" stopColor="#C5A258" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif"}} />
              <YAxis tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif"}} tickFormatter={v=>"$"+Math.round(v/1000)+"K"} />
              <Tooltip formatter={v=>fmtCur(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#C5A258" fill="url(#gRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Visits vs Redemptions</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif"}} />
              <YAxis tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif"}} />
              <Tooltip />
              <Legend wrapperStyle={{fontSize:11,fontFamily:"'DM Sans',sans-serif"}} />
              <Bar dataKey="visits" fill="#1A1A1A" radius={[4,4,0,0]} barSize={18} name="Visits" />
              <Bar dataKey="redemptions" fill="#C5A258" radius={[4,4,0,0]} barSize={18} name="Redemptions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOP REWARDS + VENUE MAP */}
      <div style={{...S.grid(2),marginTop:20}}>
        <div style={S.card}>
          <div style={S.cardTitle}>Top Rewards by Redemption</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rewards.sort((a,b)=>b.redemptions-a.redemptions).slice(0,6).map(r=>({name:r.name.length>20?r.name.slice(0,20)+'…':r.name,redemptions:r.redemptions}))} layout="vertical" margin={{left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{fontSize:10,fontFamily:"'DM Sans',sans-serif"}} />
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fontFamily:"'DM Sans',sans-serif"}} width={130} />
              <Tooltip />
              <Bar dataKey="redemptions" fill="#B85C38" radius={[0,4,4,0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Financial Summary</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
            {[
              { label:"Total Points Outstanding", val:fmtNum(stats.totalPoints)+" pts", sub:"Liability: "+fmtCur(stats.totalPoints*0.03) },
              { label:"Average Spend per Member", val:fmtCur(stats.avgSpend), sub:"Target: SGD $800+" },
              { label:"Cost of Rewards (est.)", val:"4.2% of revenue", sub:"Within 3-8% target range" },
              { label:"Incremental Visit Uplift", val:"+19%", sub:"Target: +15-25%" },
              { label:"Gift Card Outstanding", val:fmtCur(stats.giftCardValue), sub:"Active gift cards" },
            ].map((item,i) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<4?"1px solid #f0f0f0":"none"}}>
                <div>
                  <div style={{fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{item.label}</div>
                  <div style={{fontSize:11,color:"#888",fontFamily:"'DM Sans',sans-serif"}}>{item.sub}</div>
                </div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:"'Cormorant Garamond', Georgia, serif",color:"#1A1A1A"}}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════════
function CampaignsTab({ campaigns, setCampaigns, callAI, aiLoading, aiResult, setAiResult }) {
  const [showBuilder, setShowBuilder] = useState(false);

  const handleAICampaign = () => {
    callAI(
      `Design a targeted loyalty campaign for 1-Insider members. Context: We have 30 members across Silver/Gold/Platinum tiers, 4 lifestyle categories (Cafés, Restaurants, Bars, Wines), and 23 venues. Suggest: 1) Campaign name, 2) Target segment description, 3) Offer, 4) Channel (Email/SMS/Both), 5) Duration, 6) Expected ROI. Focus on re-engaging lapsed members or driving cross-venue visits.`,
      "You are a CRM campaign strategist for 1-Group Singapore's 1-Insider loyalty programme. Be specific about venues, tiers, and Singapore F&B context. Respond concisely."
    );
  };

  return (
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:600,fontFamily:"'Cormorant Garamond', Georgia, serif",margin:0}}>Campaign Builder</h1>
          <p style={{...S.body,color:"#888",margin:"4px 0 0"}}>{campaigns.length} campaigns · {campaigns.filter(c=>c.status==='active').length} active</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={S.btn("gold")} onClick={handleAICampaign} disabled={aiLoading}>{aiLoading?"✦ Generating…":"✦ AI Campaign Idea"}</button>
          <button style={S.btn("primary")} onClick={()=>setShowBuilder(!showBuilder)}>+ New Campaign</button>
        </div>
      </div>

      {aiResult && !aiLoading && (
        <div style={{...S.aiGlow,marginBottom:20}}>
          <div style={S.aiLabel}>✦ AI Campaign Suggestion</div>
          <pre style={{fontSize:13,fontFamily:"'DM Sans',sans-serif",color:"#ddd",whiteSpace:"pre-wrap",margin:0,lineHeight:1.7}}>{aiResult}</pre>
          <button style={{...S.btn("ghost"),color:"#888",marginTop:12,fontSize:11}} onClick={()=>setAiResult(null)}>Dismiss</button>
        </div>
      )}

      {/* CAMPAIGNS TABLE */}
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Campaign</th><th style={S.th}>Segment</th><th style={S.th}>Offer</th><th style={S.th}>Channel</th><th style={S.th}>Period</th><th style={S.th}>Status</th><th style={S.th}>Sent</th><th style={S.th}>Opened</th><th style={S.th}>Redeemed</th>
          </tr></thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id}>
                <td style={{...S.td,fontWeight:500}}>{c.name}</td>
                <td style={{...S.td,fontSize:12}}>{c.segment}</td>
                <td style={{...S.td,fontSize:12,maxWidth:180}}>{c.offer}</td>
                <td style={S.td}><span style={S.tag("#EDE7F6","#4527A0")}>{c.channel}</span></td>
                <td style={{...S.td,fontSize:11,color:"#888"}}>{fmtDate(c.start)} – {fmtDate(c.end)}</td>
                <td style={S.td}>
                  <span style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>
                    <span style={S.statusDot(c.status)} /> {c.status}
                  </span>
                </td>
                <td style={{...S.td,fontWeight:500}}>{c.metrics.sent}</td>
                <td style={S.td}>{c.metrics.opened} {c.metrics.sent>0&&<span style={{fontSize:10,color:"#888"}}>({Math.round(c.metrics.opened/c.metrics.sent*100)}%)</span>}</td>
                <td style={{...S.td,fontWeight:600,color:"#C5A258"}}>{c.metrics.redeemed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: GIFT CARDS
// ═══════════════════════════════════════════════════════════════════════════════
function GiftCardsTab({ giftCards, setGiftCards }) {
  const totalValue = giftCards.reduce((s,g)=>s+g.denom,0);
  const outstanding = giftCards.reduce((s,g)=>s+g.balance,0);

  return (
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:600,fontFamily:"'Cormorant Garamond', Georgia, serif",margin:0}}>Gift Cards</h1>
          <p style={{...S.body,color:"#888",margin:"4px 0 0"}}>{giftCards.length} cards issued · {fmtCur(outstanding)} outstanding</p>
        </div>
        <button style={S.btn("primary")}>+ Issue Gift Card</button>
      </div>

      <div style={S.grid(3)}>
        <div style={S.stat} className="hover-lift">
          <div style={S.statLabel}>Total Issued Value</div>
          <div style={S.statVal}>{fmtCur(totalValue)}</div>
        </div>
        <div style={S.stat} className="hover-lift">
          <div style={S.statLabel}>Outstanding Balance</div>
          <div style={{...S.statVal,color:"#C5A258"}}>{fmtCur(outstanding)}</div>
        </div>
        <div style={S.stat} className="hover-lift">
          <div style={S.statLabel}>Redemption Rate</div>
          <div style={S.statVal}>{totalValue>0?Math.round((1-outstanding/totalValue)*100):0}%</div>
        </div>
      </div>

      <div style={{...S.card,marginTop:20}}>
        <div style={S.cardTitle}>Gift Card Ledger</div>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Code</th><th style={S.th}>Denomination</th><th style={S.th}>Balance</th><th style={S.th}>Purchaser</th><th style={S.th}>Recipient</th><th style={S.th}>Status</th><th style={S.th}>Created</th>
          </tr></thead>
          <tbody>
            {giftCards.map(g => (
              <tr key={g.id}>
                <td style={{...S.td,fontFamily:"'JetBrains Mono',monospace",fontSize:12,letterSpacing:0.5}}>{g.code}</td>
                <td style={{...S.td,fontWeight:500}}>{fmtCur(g.denom)}</td>
                <td style={{...S.td,fontWeight:600,color:g.balance>0?"#4CAF50":"#999"}}>{fmtCur(g.balance)}</td>
                <td style={S.td}>{g.purchaser}</td>
                <td style={S.td}>{g.recipient}</td>
                <td style={S.td}><span style={S.tag(g.status==='active'?"#E8F5E9":g.status==='redeemed'?"#F5F5F5":"#FFF3E0",g.status==='active'?"#2E7D32":g.status==='redeemed'?"#666":"#E65100")}>{g.status}</span></td>
                <td style={{...S.td,fontSize:12,color:"#888"}}>{fmtDate(g.created)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: INTEGRATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function IntegrationsTab() {
  const integrations = [
    { name:"SevenRooms CRM", desc:"Guest profiles, reservations, perks, and tags", status:"connected", lastSync:"2 min ago", icon:"🔗", stats:{synced:2847,pending:3,errors:0} },
    { name:"Agilysys POS", desc:"Real-time transaction data and points accrual", status:"connected", lastSync:"Live", icon:"💳", stats:{synced:12483,pending:0,errors:0} },
    { name:"Gmail (MCP)", desc:"Member communications and campaign emails", status:"connected", lastSync:"5 min ago", icon:"✉️", stats:{synced:890,pending:12,errors:0} },
    { name:"Google Calendar (MCP)", desc:"Member events and campaign scheduling", status:"connected", lastSync:"1 hr ago", icon:"📅", stats:{synced:24,pending:0,errors:0} },
  ];

  const webhookLog = [
    { event:"check.closed", venue:"Oumi", time:"2 min ago", status:"processed", member:"M0024" },
    { event:"reservation.completed", venue:"Camille", time:"8 min ago", status:"processed", member:"M0016" },
    { event:"payment.processed", venue:"1-Arden Bar", time:"12 min ago", status:"processed", member:"M0003" },
    { event:"guest.tagged", venue:"Sol & Luna", time:"18 min ago", status:"processed", member:"M0027" },
    { event:"feedback.submitted", venue:"Monti", time:"25 min ago", status:"processed", member:"M0009" },
    { event:"check.closed", venue:"FIRE", time:"31 min ago", status:"pending", member:"M0015" },
  ];

  return (
    <div className="fade-in">
      <h1 style={{fontSize:28,fontWeight:600,fontFamily:"'Cormorant Garamond', Georgia, serif",margin:"0 0 4px"}}>Integration Monitor</h1>
      <p style={{...S.body,color:"#888",margin:"0 0 24px"}}>System health and data pipeline status</p>

      {/* INTEGRATION CARDS */}
      <div style={S.grid(2)}>
        {integrations.map((int,i) => (
          <div key={i} style={{...S.card,borderLeft:"4px solid #4CAF50"}} className="hover-lift">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{fontSize:28}}>{int.icon}</div>
                <div>
                  <div style={{fontWeight:600,fontSize:15,fontFamily:"'DM Sans',sans-serif"}}>{int.name}</div>
                  <div style={{fontSize:12,color:"#888",fontFamily:"'DM Sans',sans-serif"}}>{int.desc}</div>
                </div>
              </div>
              <span style={S.tag("#E8F5E9","#2E7D32")}>● Connected</span>
            </div>
            <div style={{...S.grid(3),marginTop:16}}>
              <div style={{textAlign:"center",background:"#fafafa",borderRadius:6,padding:8}}>
                <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,fontFamily:"'DM Sans',sans-serif"}}>Synced</div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:"'Cormorant Garamond', Georgia, serif"}}>{fmtNum(int.stats.synced)}</div>
              </div>
              <div style={{textAlign:"center",background:"#fafafa",borderRadius:6,padding:8}}>
                <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,fontFamily:"'DM Sans',sans-serif"}}>Pending</div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:"'Cormorant Garamond', Georgia, serif",color:int.stats.pending>0?"#FF9800":"#4CAF50"}}>{int.stats.pending}</div>
              </div>
              <div style={{textAlign:"center",background:"#fafafa",borderRadius:6,padding:8}}>
                <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,fontFamily:"'DM Sans',sans-serif"}}>Errors</div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:"'Cormorant Garamond', Georgia, serif",color:int.stats.errors>0?"#F44336":"#4CAF50"}}>{int.stats.errors}</div>
              </div>
            </div>
            <div style={{fontSize:11,color:"#888",fontFamily:"'DM Sans',sans-serif",marginTop:10}}>Last sync: {int.lastSync}</div>
          </div>
        ))}
      </div>

      {/* WEBHOOK LOG */}
      <div style={{...S.card,marginTop:20}}>
        <div style={S.cardTitle}>Webhook Event Log</div>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Event</th><th style={S.th}>Venue</th><th style={S.th}>Member</th><th style={S.th}>Status</th><th style={S.th}>Time</th>
          </tr></thead>
          <tbody>
            {webhookLog.map((w,i) => (
              <tr key={i}>
                <td style={{...S.td,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>{w.event}</td>
                <td style={S.td}>{w.venue}</td>
                <td style={{...S.td,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>{w.member}</td>
                <td style={S.td}><span style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontFamily:"'DM Sans',sans-serif"}}><span style={S.statusDot(w.status==='processed'?'active':'scheduled')} /> {w.status}</span></td>
                <td style={{...S.td,fontSize:12,color:"#888"}}>{w.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VENUE POS STATUS */}
      <div style={{...S.card,marginTop:20}}>
        <div style={S.cardTitle}>Venue POS Connection Status</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
          {VENUES.map(v => (
            <div key={v.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#fafafa",borderRadius:6,fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#4CAF50"}} />
              {v.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

