import { useState, useEffect, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from "recharts";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
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
  { id:"wscafe-fh", name:"Wildseed Café @ 1-Flowerhill", cat:"Cafés", loc:"1-Flowerhill" },
  { id:"wscafe-sh", name:"Wildseed Café @ The Summerhouse", cat:"Cafés", loc:"The Summerhouse" },
  { id:"wscafe-am", name:"Wildseed Café @ The Alkaff Mansion", cat:"Cafés", loc:"The Alkaff Mansion" },
  { id:"wscafe-bg", name:"Wildseed Café @ SBG", cat:"Cafés", loc:"Singapore Botanic Gardens" },
  { id:"melaka", name:"1-Altitude Melaka", cat:"Bars", loc:"Melaka, Malaysia" },
];

const CAFE_OUTLETS = VENUES.filter(v => v.cat === "Cafés");

const TIERS = [
  { id:"silver", name:"Silver", hex:"#A8A8A8", bg:"#F7F7F7", threshold:0, earn:1.0, paid:false, benefits:["Base earn rate (1pt/$1)","Birthday dessert or drink","Welcome voucher on signup","Café stamp card","Gift card access"], desc:"Free entry" },
  { id:"gold", name:"Gold", hex:"#C5A258", bg:"#FDF8EE", threshold:0, earn:1.5, paid:true, benefits:["Enhanced earn rate (1.5×)","Priority reservations","Upgraded birthday rewards","Exclusive event access","Unlimited dining vouchers (calendar-year)","Welcome voucher on signup"], desc:"Paid annual" },
  { id:"platinum", name:"Platinum", hex:"#5C5C5C", bg:"#2D2D2D", threshold:0, earn:2.0, paid:true, benefits:["Premium earn rate (2×)","VIP reservations","Premium birthday experience","Concierge service","Unlimited dining vouchers (calendar-year)","Partner benefits","Chef's table access"], desc:"Paid annual" },
  { id:"corporate", name:"Corporate", hex:"#1A3A5C", bg:"#E8EFF5", threshold:0, earn:1.5, paid:true, benefits:["Corporate earn rate (1.5×)","Unlimited dining vouchers (calendar-year)","Bulk gift cards","Event coordination","Dedicated account manager"], desc:"Corporate plan" },
  { id:"staff", name:"Staff", hex:"#2E7D32", bg:"#E8F5E9", threshold:0, earn:1.0, paid:false, benefits:["Staff dining vouchers","Birthday reward","Internal event access","Staff-only promotions"], desc:"Internal" },
];

const CATEGORIES = [
  { id:"cafes", name:"Cafés", icon:"☕", color:"#7B9E6B" },
  { id:"restaurants", name:"Restaurants", icon:"🍽️", color:"#B85C38" },
  { id:"bars", name:"Bars", icon:"🍸", color:"#6B4E8B" },
  { id:"wines", name:"Wines", icon:"🍷", color:"#8B2252" },
];

const STAMP_THRESHOLDS = [
  { stamp:3, autoIssue:false, label:"Manual claim (Discover tab)" },
  { stamp:5, autoIssue:false, label:"Manual claim (Discover tab)" },
  { stamp:6, autoIssue:false, label:"Manual claim (Discover tab)" },
  { stamp:8, autoIssue:true, label:"Auto-issued" },
  { stamp:10, autoIssue:true, label:"Auto-issued" },
];

const genId = () => Math.random().toString(36).slice(2,10);
const fmtDate = d => new Date(d).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'});
const fmtNum = n => new Intl.NumberFormat('en-SG').format(n);
const fmtCur = n => `$${new Intl.NumberFormat('en-SG',{minimumFractionDigits:2}).format(n)}`;

// ─── SEED DATA ──────────────────────────────────────────────────────────────
const seedMembers = () => {
  const names=["Sophia Chen","Marcus Tan","Priya Sharma","James Lim","Aiko Yamamoto","David Ng","Rachel Lee","Benjamin Koh","Mei Ling Wong","Arjun Patel","Sarah Teo","Kevin Chong","Yuki Sato","Daniel Chua","Amanda Goh","Ryan Ong","Michelle Foo","Ethan Yeo","Nicole Tan","Chris Wee","Jessica Ang","Patrick Loh","Vivian Sim","Alex Ho","Catherine Tay","Derek Soh","Emily Chew","Fabian Lim","Grace Tan","Henry Seah"];
  const tierMap=["silver","silver","silver","silver","silver","silver","silver","silver","silver","silver","silver","silver","silver","silver","silver","gold","gold","gold","gold","gold","gold","gold","gold","platinum","platinum","platinum","platinum","corporate","corporate","staff"];
  const cats=["cafes","restaurants","bars","wines"];
  return names.map((name,i)=>({
    id:`M${String(i+1).padStart(4,'0')}`, name,
    mobile:`+65 9${String(Math.floor(Math.random()*9e6+1e6))}`,
    tier:tierMap[i],
    points:tierMap[i]==='platinum'?Math.floor(Math.random()*5000+3000):tierMap[i]==='gold'?Math.floor(Math.random()*3000+1000):Math.floor(Math.random()*1500+100),
    totalSpend:tierMap[i]==='platinum'?Math.floor(Math.random()*20000+8000):tierMap[i]==='gold'?Math.floor(Math.random()*8000+3000):Math.floor(Math.random()*3000+200),
    categoryPref:cats[i%4], birthdayMonth:(i%12)+1,
    signupDate:new Date(2024,Math.floor(Math.random()*12),Math.floor(Math.random()*28)+1).toISOString(),
    lastVisit:new Date(2025,Math.floor(Math.random()*4),Math.floor(Math.random()*28)+1).toISOString(),
    visits:Math.floor(Math.random()*40+2),
    favouriteVenue:VENUES[i%VENUES.length].id,
    email:`${name.toLowerCase().replace(' ','.')}@email.com`,
    stamps:tierMap[i]==='silver'||tierMap[i]==='gold'?Math.floor(Math.random()*10):0,
    voucherSetsUsed:tierMap[i]==='gold'||tierMap[i]==='platinum'?Math.floor(Math.random()*4+1):0,
    membershipExpiry:tierMap[i]==='gold'||tierMap[i]==='platinum'||tierMap[i]==='corporate'?new Date(2026,Math.floor(Math.random()*12),Math.floor(Math.random()*28)+1).toISOString():null,
    renewalStatus:null,
  }));
};

const seedDecisions = () => [
  { id:genId(), decision:"Bar applicability for dining vouchers", status:"OPEN", owner:"Brendon", notes:"WSB check size reference shared — awaiting confirmation", created:"2026-03-15" },
  { id:genId(), decision:"Staff tier full mechanics", status:"OPEN", owner:"Marketing", notes:"Must share with Eber before config can begin", created:"2026-03-20" },
  { id:genId(), decision:"Stamp card time-restriction duration", status:"OPEN", owner:"Marketing", notes:"Pending café spend data analysis to determine optimal window", created:"2026-03-22" },
  { id:genId(), decision:"Automated membership renewal", status:"CLOSED", owner:"Eber", notes:"Rejected — risk of refund requests. Using manual renewal flow with reminders.", created:"2026-02-10" },
];

const seedPromotions = () => [
  { id:genId(), name:"Easter Double Points", start:"2026-04-03", end:"2026-04-06", outlets:["all"], type:"double_points", exclusionApplied:true, revertDate:"2026-04-07", status:"completed" },
  { id:genId(), name:"Mother's Day Bonus", start:"2026-05-10", end:"2026-05-11", outlets:["oumi","camille","solluna","kaarla"], type:"bonus_500pts", exclusionApplied:false, revertDate:"2026-05-12", status:"upcoming" },
  { id:genId(), name:"Café Launch Week", start:"2026-06-01", end:"2026-06-07", outlets:["wscafe-fh","wscafe-sh","wscafe-am","wscafe-bg"], type:"triple_stamps", exclusionApplied:false, revertDate:"2026-06-08", status:"draft" },
];

const seedVouchers = () => [
  { id:genId(), name:"Welcome $10 Voucher", type:"welcome", tiers:["silver","gold","platinum","corporate","staff"], autoIssue:true, trigger:"signup", value:10, validity:"30 days", stackable:false, status:"active" },
  { id:genId(), name:"Gold Dining $20 Voucher", type:"dining", tiers:["gold"], autoIssue:true, trigger:"first_set", value:20, validity:"Calendar year", stackable:false, status:"active", unlimitedClaim:true },
  { id:genId(), name:"Platinum Dining $30 Voucher", type:"dining", tiers:["platinum"], autoIssue:true, trigger:"first_set", value:30, validity:"Calendar year", stackable:false, status:"active", unlimitedClaim:true },
  { id:genId(), name:"Corporate Dining $25 Voucher", type:"dining", tiers:["corporate"], autoIssue:true, trigger:"first_set", value:25, validity:"Calendar year", stackable:false, status:"active", unlimitedClaim:true },
  { id:genId(), name:"Points Reward $15 Voucher", type:"points_reward", tiers:["silver","gold","platinum"], autoIssue:false, trigger:"500pts", value:15, validity:"60 days", stackable:false, status:"active" },
  { id:genId(), name:"Birthday $25 Voucher", type:"birthday", tiers:["gold","platinum"], autoIssue:true, trigger:"birthday_month", value:25, validity:"Birthday month", stackable:false, status:"active" },
];

const seedStaffRegistry = () => [
  { name:"Ahmad bin Ismail", personalMobile:"+65 91234567", staffMobile:"+65 91234567", tier:"staff", status:"active", notes:"Converted from Silver" },
  { name:"Lisa Tan", personalMobile:"+65 98765432", staffMobile:"+65 81112222", tier:"staff", status:"active", notes:"Uses separate staff number" },
  { name:"Raj Kumar", personalMobile:null, staffMobile:"+65 90001111", tier:"staff", status:"active", notes:"No prior personal account" },
];

// ─── TYPOGRAPHY & STYLES ────────────────────────────────────────────────────
const font = {
  h: "'Playfair Display', Georgia, serif",
  b: "'DM Sans', system-ui, sans-serif",
  m: "'JetBrains Mono', monospace",
};

const S = {
  app: { fontFamily:font.b, background:"#FAF8F5", minHeight:"100vh", color:"#1A1A1A", fontSize:13 },
  header: { background:"#111", padding:"0 28px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:100 },
  logo: { color:"#C5A258", fontSize:22, fontWeight:700, letterSpacing:2.5, fontFamily:font.h },
  badge: { fontSize:9, letterSpacing:1.5, textTransform:"uppercase", color:"#666", marginLeft:12 },
  nav: { display:"flex", gap:0, height:"100%", overflowX:"auto" },
  navBtn: a => ({ background:"none", border:"none", color:a?"#C5A258":"#777", padding:"0 14px", cursor:"pointer", fontSize:11, letterSpacing:.6, textTransform:"uppercase", fontFamily:font.b, fontWeight:a?600:400, borderBottom:a?"2px solid #C5A258":"2px solid transparent", height:"100%", display:"flex", alignItems:"center", transition:"all .2s", whiteSpace:"nowrap" }),
  main: { maxWidth:1440, margin:"0 auto", padding:"28px 32px" },
  card: { background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 8px rgba(0,0,0,.04)", marginBottom:18, border:"1px solid rgba(0,0,0,.04)" },
  cardT: { fontSize:15, fontWeight:600, marginBottom:14, fontFamily:font.h, letterSpacing:.3, color:"#1A1A1A" },
  grid: c => ({ display:"grid", gridTemplateColumns:`repeat(${c},1fr)`, gap:16 }),
  stat: { background:"#fff", borderRadius:12, padding:"20px 24px", boxShadow:"0 1px 8px rgba(0,0,0,.04)", border:"1px solid rgba(0,0,0,.04)", transition:"all .2s" },
  statL: { fontSize:10, color:"#999", textTransform:"uppercase", letterSpacing:1.2, marginBottom:5, fontWeight:500 },
  statV: { fontSize:28, fontWeight:700, fontFamily:font.h, color:"#1A1A1A" },
  tier: t => ({ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:16, fontSize:10, fontWeight:600, letterSpacing:.6, textTransform:"uppercase", background:t==='platinum'?"#2D2D2D":t==='gold'?"#FDF8EE":t==='corporate'?"#E8EFF5":t==='staff'?"#E8F5E9":"#F5F5F5", color:t==='platinum'?"#fff":t==='gold'?"#8B6914":t==='corporate'?"#1A3A5C":t==='staff'?"#2E7D32":"#666" }),
  dot: t => ({ width:7, height:7, borderRadius:"50%", background:TIERS.find(x=>x.id===t)?.hex||"#ccc" }),
  btn: (v="primary") => ({ padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:font.b, letterSpacing:.4, transition:"all .2s", ...(v==="primary"?{background:"#111",color:"#C5A258"}:v==="gold"?{background:"#C5A258",color:"#fff"}:v==="danger"?{background:"#D32F2F",color:"#fff"}:v==="success"?{background:"#2E7D32",color:"#fff"}:{background:"transparent",color:"#333",border:"1px solid #ddd"}) }),
  input: { padding:"8px 14px", borderRadius:8, border:"1px solid #ddd", fontSize:12, fontFamily:font.b, outline:"none", width:"100%", boxSizing:"border-box" },
  select: { padding:"8px 14px", borderRadius:8, border:"1px solid #ddd", fontSize:12, fontFamily:font.b, outline:"none", background:"#fff", cursor:"pointer" },
  table: { width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:font.b },
  th: { textAlign:"left", padding:"10px 14px", borderBottom:"2px solid #eee", fontSize:10, textTransform:"uppercase", letterSpacing:1, color:"#999", fontWeight:600 },
  td: { padding:"10px 14px", borderBottom:"1px solid #f5f5f5" },
  tag: (bg,fg) => ({ display:"inline-block", padding:"2px 9px", borderRadius:10, fontSize:10, fontWeight:500, background:bg, color:fg }),
  modal: { position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(4px)" },
  modalC: { background:"#fff", borderRadius:16, padding:32, maxWidth:620, width:"92%", maxHeight:"85vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.2)" },
  ai: { background:"linear-gradient(135deg,#111 0%,#1a180f 100%)", borderRadius:12, padding:24, color:"#fff", position:"relative", overflow:"hidden" },
  aiL: { display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:10, fontSize:9.5, fontWeight:600, letterSpacing:1.2, textTransform:"uppercase", background:"rgba(197,162,88,.2)", color:"#C5A258", marginBottom:12 },
  sDot: s => ({ width:7, height:7, borderRadius:"50%", display:"inline-block", background:s==='active'||s==='completed'?"#4CAF50":s==='upcoming'?"#2196F3":s==='draft'?"#FF9800":"#999" }),
  warn: { background:"#FFF8E1", border:"1px solid #FFE082", borderRadius:10, padding:"14px 18px", fontSize:12, color:"#5D4037", display:"flex", gap:10, alignItems:"flex-start", marginBottom:16, lineHeight:1.5 },
  limit: { background:"#FFEBEE", border:"1px solid #EF9A9A", borderRadius:10, padding:"14px 18px", fontSize:12, color:"#B71C1C", display:"flex", gap:10, alignItems:"flex-start", marginBottom:16, lineHeight:1.5 },
  ok: { background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:10, padding:"14px 18px", fontSize:12, color:"#1B5E20", display:"flex", gap:10, alignItems:"flex-start", marginBottom:16, lineHeight:1.5 },
};

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const store = {
  async get(k){ try{ const r=await window.storage.get(k); return r?JSON.parse(r.value):null }catch{ return null }},
  async set(k,v){ try{ await window.storage.set(k,JSON.stringify(v)); return true }catch{ return false }},
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function OneInsiderPlatform() {
  const [tab,setTab]=useState("overview");
  const [members,setMembers]=useState([]);
  const [decisions,setDecisions]=useState([]);
  const [promotions,setPromotions]=useState([]);
  const [vouchers,setVouchers]=useState([]);
  const [staffReg,setStaffReg]=useState([]);
  const [loading,setLoading]=useState(true);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const [selectedMember,setSelectedMember]=useState(null);
  const [searchQ,setSearchQ]=useState("");

  useEffect(()=>{(async()=>{
    let m=await store.get("eber-members"); if(!m||!m.length){m=seedMembers();await store.set("eber-members",m)} setMembers(m);
    let d=await store.get("eber-decisions"); if(!d||!d.length){d=seedDecisions();await store.set("eber-decisions",d)} setDecisions(d);
    let p=await store.get("eber-promotions"); if(!p||!p.length){p=seedPromotions();await store.set("eber-promotions",p)} setPromotions(p);
    let v=await store.get("eber-vouchers"); if(!v||!v.length){v=seedVouchers();await store.set("eber-vouchers",v)} setVouchers(v);
    let s=await store.get("eber-staff"); if(!s||!s.length){s=seedStaffRegistry();await store.set("eber-staff",s)} setStaffReg(s);
    setLoading(false);
  })()},[]);

  const callAI = async (prompt, sys) => {
    setAiLoading(true); setAiResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:sys||"You are a loyalty programme architect for 1-Group Singapore's 1-Insider 3.0 on the Eber platform. Be concise, actionable, and data-driven.", messages:[{role:"user",content:prompt}] })
      });
      const data=await res.json();
      const text=data.content?.map(b=>b.text||"").join("\n")||"No response";
      setAiResult(text); setAiLoading(false); return text;
    } catch(e){ const err=`Error: ${e.message}`; setAiResult(err); setAiLoading(false); return err; }
  };

  const stats = {
    total:members.length,
    silver:members.filter(m=>m.tier==='silver').length,
    gold:members.filter(m=>m.tier==='gold').length,
    platinum:members.filter(m=>m.tier==='platinum').length,
    corporate:members.filter(m=>m.tier==='corporate').length,
    staff:members.filter(m=>m.tier==='staff').length,
    totalPts:members.reduce((s,m)=>s+m.points,0),
    totalSpend:members.reduce((s,m)=>s+m.totalSpend,0),
    avgSpend:members.length?Math.round(members.reduce((s,m)=>s+m.totalSpend,0)/members.length):0,
    openDecisions:decisions.filter(d=>d.status==='OPEN').length,
    upcomingPromos:promotions.filter(p=>p.status==='upcoming').length,
    paidMembers:members.filter(m=>['gold','platinum','corporate'].includes(m.tier)).length,
    renewalsDue:members.filter(m=>m.membershipExpiry&&new Date(m.membershipExpiry)<new Date(Date.now()+30*864e5)).length,
  };

  const tierData = TIERS.filter(t=>t.id!=='staff').map(t=>({ name:t.name, value:members.filter(m=>m.tier===t.id).length, color:t.hex }));

  const TABS = [
    {id:"overview",label:"Overview",icon:"◆"},
    {id:"members",label:"Members",icon:"♟"},
    {id:"vouchers",label:"Vouchers",icon:"◈"},
    {id:"stamps",label:"Stamps",icon:"●"},
    {id:"tiers",label:"Tiers",icon:"▲"},
    {id:"promotions",label:"Promos",icon:"◉"},
    {id:"decisions",label:"Decisions",icon:"⚑"},
    {id:"renewals",label:"Renewals",icon:"↻"},
    {id:"staff",label:"Staff",icon:"★"},
    {id:"checklist",label:"Checklist",icon:"☐"},
  ];

  if(loading) return (
    <div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",flexDirection:"column",gap:16}}>
      <div style={{fontSize:30,color:"#C5A258",fontFamily:font.h,fontWeight:700,letterSpacing:3}}>1-INSIDER</div>
      <div style={{fontSize:10,color:"#888",letterSpacing:2.5,textTransform:"uppercase"}}>Admin · Eber Platform · 3.0</div>
      <div style={{width:38,height:38,border:"3px solid #eee",borderTopColor:"#C5A258",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .fade{animation:fadeIn .3s ease}
        .lift:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)!important}
        input:focus,select:focus{border-color:#C5A258!important;box-shadow:0 0 0 3px rgba(197,162,88,.12)}
        button:hover{opacity:.88}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
        table tr:hover{background:#FDFBF7}
      `}</style>

      <header style={S.header}>
        <div style={{display:"flex",alignItems:"center"}}>
          <span style={S.logo}>1-INSIDER</span>
          <span style={S.badge}>3.0 · Eber · Admin</span>
        </div>
        <nav style={S.nav}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={S.navBtn(tab===t.id)}>
            <span style={{marginRight:5,fontSize:9,opacity:.7}}>{t.icon}</span>{t.label}
          </button>)}
        </nav>
      </header>

      <main style={S.main} className="fade">
        {tab==="overview"&&<OverviewTab stats={stats} tierData={tierData} members={members} decisions={decisions} promotions={promotions} setTab={setTab}/>}
        {tab==="members"&&<MembersTab members={members} searchQ={searchQ} setSearchQ={setSearchQ} selectedMember={selectedMember} setSelectedMember={setSelectedMember}/>}
        {tab==="vouchers"&&<VouchersTab vouchers={vouchers} members={members}/>}
        {tab==="stamps"&&<StampsTab members={members} callAI={callAI} aiLoading={aiLoading} aiResult={aiResult} setAiResult={setAiResult}/>}
        {tab==="tiers"&&<TiersTab members={members} tierData={tierData}/>}
        {tab==="promotions"&&<PromotionsTab promotions={promotions} setPromotions={setPromotions}/>}
        {tab==="decisions"&&<DecisionsTab decisions={decisions} setDecisions={setDecisions}/>}
        {tab==="renewals"&&<RenewalsTab members={members}/>}
        {tab==="staff"&&<StaffTab staffReg={staffReg}/>}
        {tab==="checklist"&&<ChecklistTab decisions={decisions} promotions={promotions}/>}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({stats,tierData,members,decisions,promotions,setTab}){
  const monthlyData=["Jan","Feb","Mar","Apr","May","Jun"].map(m=>({month:m,signups:Math.floor(Math.random()*60+20),revenue:Math.floor(Math.random()*120000+30000)}));
  return <div className="fade">
    <div style={{marginBottom:28}}>
      <h1 style={{fontSize:28,fontWeight:700,fontFamily:font.h,margin:0}}>Programme Overview</h1>
      <p style={{color:"#888",margin:"4px 0 0",fontSize:12}}>1-Insider 3.0 · Eber Platform · {fmtNum(stats.total)} members across {VENUES.length} venues</p>
    </div>

    {stats.openDecisions>0&&<div style={S.warn}>⚠️ <div><strong>{stats.openDecisions} open decision{stats.openDecisions>1?'s':''}</strong> requiring resolution before full programme launch. <button style={{...S.btn("ghost"),padding:"3px 10px",fontSize:10,marginLeft:8}} onClick={()=>setTab("decisions")}>View Decisions →</button></div></div>}

    <div style={S.grid(5)}>
      {[
        {l:"Total Members",v:fmtNum(stats.total),d:`${stats.paidMembers} paid tier`,c:null},
        {l:"Active Points",v:fmtNum(stats.totalPts),d:fmtCur(stats.totalPts*.03)+" liability",c:null},
        {l:"Total Revenue",v:fmtCur(stats.totalSpend),d:"+18% YoY",c:"#4CAF50"},
        {l:"Renewals Due (30d)",v:stats.renewalsDue,d:"Manual flow required",c:stats.renewalsDue>0?"#FF9800":null},
        {l:"Upcoming Promos",v:stats.upcomingPromos,d:"Check exclusion rules",c:stats.upcomingPromos>0?"#2196F3":null},
      ].map((k,i)=><div key={i} style={S.stat} className="lift">
        <div style={S.statL}>{k.l}</div>
        <div style={S.statV}>{k.v}</div>
        <div style={{fontSize:11,color:k.c||"#888",marginTop:4}}>{k.d}</div>
      </div>)}
    </div>

    <div style={{...S.grid(3),marginTop:18}}>
      <div style={S.card}>
        <div style={S.cardT}>Tier Distribution</div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart><Pie data={tierData} cx="50%" cy="50%" outerRadius={75} innerRadius={45} dataKey="value" stroke="none" paddingAngle={3}>{tierData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip formatter={v=>`${v} members`}/></PieChart>
        </ResponsiveContainer>
        <div style={{display:"flex",justifyContent:"center",gap:14,marginTop:8,flexWrap:"wrap"}}>
          {tierData.map((t,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#666"}}><div style={{width:10,height:10,borderRadius:3,background:t.color}}/>{t.name} ({t.value})</div>)}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardT}>Monthly Signups</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyData}>
            <defs><linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C5A258" stopOpacity={.3}/><stop offset="100%" stopColor="#C5A258" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="month" tick={{fontSize:10}} stroke="#ccc"/>
            <YAxis tick={{fontSize:10}} stroke="#ccc"/>
            <Tooltip/>
            <Area type="monotone" dataKey="signups" stroke="#C5A258" fill="url(#gGold)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={S.card}>
        <div style={S.cardT}>Eber Platform Status</div>
        {[
          {n:"Eber Portal",s:"Live",ok:true},
          {n:"Stripe (JEPL)",s:"Connected",ok:true},
          {n:"SevenRooms CRM",s:"Synced",ok:true},
          {n:"Agilysys POS",s:"All venues online",ok:true},
          {n:"Staging Env",s:"Available",ok:true},
        ].map((x,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<4?"1px solid #f5f5f5":"none"}}>
          <span style={{fontSize:12}}>{x.n}</span>
          <span style={{...S.tag(x.ok?"#E8F5E9":"#FFEBEE",x.ok?"#2E7D32":"#C62828"),fontSize:10}}>● {x.s}</span>
        </div>)}
        <div style={{marginTop:14,padding:12,background:"#F5F0E8",borderRadius:8,fontSize:11,color:"#5D4037",lineHeight:1.5}}>
          <strong>Browser-first advantage:</strong> No app download required. Members access 1-Insider via any browser — zero friction onboarding.
        </div>
      </div>
    </div>

    <div style={{...S.grid(2),marginTop:4}}>
      <div style={S.card}>
        <div style={S.cardT}>Revenue by Month</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="month" tick={{fontSize:10}} stroke="#ccc"/>
            <YAxis tick={{fontSize:10}} stroke="#ccc" tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
            <Tooltip formatter={v=>fmtCur(v)}/>
            <Bar dataKey="revenue" fill="#C5A258" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <div style={S.cardT}>Quick Actions</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {label:"Members",icon:"♟",tab:"members"},
            {label:"Vouchers",icon:"◈",tab:"vouchers"},
            {label:"Promotions",icon:"◉",tab:"promotions"},
            {label:"Renewals",icon:"↻",tab:"renewals"},
            {label:"Decisions",icon:"⚑",tab:"decisions"},
            {label:"Checklist",icon:"☐",tab:"checklist"},
          ].map(q=><button key={q.tab} onClick={()=>setTab(q.tab)} style={{...S.btn("ghost"),padding:"14px 16px",display:"flex",alignItems:"center",gap:8,justifyContent:"flex-start",borderRadius:10}}>
            <span style={{fontSize:16,opacity:.6}}>{q.icon}</span><span>{q.label}</span>
          </button>)}
        </div>
      </div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════
function MembersTab({members,searchQ,setSearchQ,selectedMember,setSelectedMember}){
  const [filterTier,setFilterTier]=useState("all");
  const filtered=members.filter(m=>(filterTier==="all"||m.tier===filterTier)&&(!searchQ||m.name.toLowerCase().includes(searchQ.toLowerCase())||m.mobile.includes(searchQ)||m.id.toLowerCase().includes(searchQ.toLowerCase())));
  return <div className="fade">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
      <div>
        <h1 style={{fontSize:28,fontWeight:700,fontFamily:font.h,margin:0}}>Members</h1>
        <p style={{color:"#888",margin:"4px 0 0",fontSize:12}}>{fmtNum(members.length)} total · 1 mobile = 1 account (Eber restriction)</p>
      </div>
      <div style={{display:"flex",gap:10}}>
        <input style={{...S.input,width:240}} placeholder="Search name, mobile, ID…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
        <select style={S.select} value={filterTier} onChange={e=>setFilterTier(e.target.value)}>
          <option value="all">All Tiers</option>
          {TIERS.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
    </div>

    <div style={S.card}>
      <table style={S.table}><thead><tr>
        <th style={S.th}>Member</th><th style={S.th}>Mobile</th><th style={S.th}>Tier</th><th style={S.th}>Points</th><th style={S.th}>Spend</th><th style={S.th}>Stamps</th><th style={S.th}>Visits</th><th style={S.th}>Expiry</th><th style={S.th}></th>
      </tr></thead><tbody>
        {filtered.map(m=><tr key={m.id} style={{cursor:"pointer"}} onClick={()=>setSelectedMember(m)}>
          <td style={S.td}><div style={{fontWeight:500}}>{m.name}</div><div style={{fontSize:10,color:"#999"}}>{m.id}</div></td>
          <td style={{...S.td,fontSize:11,fontFamily:font.m}}>{m.mobile}</td>
          <td style={S.td}><span style={S.tier(m.tier)}><span style={S.dot(m.tier)}/>{m.tier}</span></td>
          <td style={{...S.td,fontWeight:600,color:"#C5A258"}}>{fmtNum(m.points)}</td>
          <td style={S.td}>{fmtCur(m.totalSpend)}</td>
          <td style={{...S.td,textAlign:"center"}}>{m.stamps>0?m.stamps:"—"}</td>
          <td style={{...S.td,textAlign:"center"}}>{m.visits}</td>
          <td style={{...S.td,fontSize:11,color:m.membershipExpiry?"#888":"#ccc"}}>{m.membershipExpiry?fmtDate(m.membershipExpiry):"Free"}</td>
          <td style={S.td}><button style={{...S.btn("ghost"),padding:"4px 10px",fontSize:10}}>View</button></td>
        </tr>)}
      </tbody></table>
      {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13}}>No members found</div>}
    </div>

    {selectedMember&&<div style={S.modal} onClick={()=>setSelectedMember(null)}>
      <div style={S.modalC} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <h2 style={{fontFamily:font.h,fontSize:24,margin:0}}>{selectedMember.name}</h2>
            <p style={{color:"#888",margin:"4px 0",fontSize:12}}>{selectedMember.id} · {selectedMember.mobile} · {selectedMember.email}</p>
          </div>
          <span style={S.tier(selectedMember.tier)}><span style={S.dot(selectedMember.tier)}/>{selectedMember.tier}</span>
        </div>
        <div style={{...S.grid(3),marginTop:18}}>
          {[
            {l:"Points",v:fmtNum(selectedMember.points),c:"#C5A258"},
            {l:"Total Spend",v:fmtCur(selectedMember.totalSpend),c:"#1A1A1A"},
            {l:"Visits",v:selectedMember.visits,c:"#1A1A1A"},
          ].map((x,i)=><div key={i} style={{background:"#FAF8F5",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={S.statL}>{x.l}</div>
            <div style={{fontSize:26,fontWeight:700,color:x.c,fontFamily:font.h}}>{x.v}</div>
          </div>)}
        </div>
        <div style={{...S.grid(2),marginTop:14,fontSize:12}}>
          <div><span style={{...S.statL,display:"block",marginBottom:4}}>Category Pref</span>{CATEGORIES.find(c=>c.id===selectedMember.categoryPref)?.icon} {CATEGORIES.find(c=>c.id===selectedMember.categoryPref)?.name}</div>
          <div><span style={{...S.statL,display:"block",marginBottom:4}}>Favourite Venue</span>{VENUES.find(v=>v.id===selectedMember.favouriteVenue)?.name}</div>
          <div><span style={{...S.statL,display:"block",marginBottom:4}}>Birthday Month</span>{new Date(2026,selectedMember.birthdayMonth-1).toLocaleString('en',{month:'long'})}</div>
          <div><span style={{...S.statL,display:"block",marginBottom:4}}>Café Stamps</span>{selectedMember.stamps} stamp{selectedMember.stamps!==1?'s':''}</div>
          {selectedMember.membershipExpiry&&<div><span style={{...S.statL,display:"block",marginBottom:4}}>Membership Expiry</span>{fmtDate(selectedMember.membershipExpiry)}</div>}
          <div><span style={{...S.statL,display:"block",marginBottom:4}}>Voucher Sets Used</span>{selectedMember.voucherSetsUsed}</div>
        </div>
        <div style={{marginTop:18,display:"flex",gap:8}}>
          <button style={S.btn("primary")}>Adjust Points</button>
          <button style={S.btn("gold")}>Send Voucher</button>
          <button style={S.btn("ghost")}>View Activity</button>
        </div>
        <div style={{marginTop:16,textAlign:"right"}}><button style={S.btn("ghost")} onClick={()=>setSelectedMember(null)}>Close</button></div>
      </div>
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: VOUCHERS
// ═══════════════════════════════════════════════════════════════════════════════
function VouchersTab({vouchers,members}){
  return <div className="fade">
    <h1 style={{fontSize:28,fontWeight:700,fontFamily:font.h,margin:"0 0 4px"}}>Vouchers & Gift Cards</h1>
    <p style={{color:"#888",margin:"0 0 22px",fontSize:12}}>Eber voucher lifecycle management</p>

    <div style={S.limit}>🚫 <div><strong>Eber Limitation:</strong> Calendar-year expiry only works for the 1st auto-issued voucher set. Subsequent sets require manual claim from Discover tab. Auto-refill is not tracked.</div></div>
    <div style={S.ok}>✅ <div><strong>AI Workaround Active:</strong> Voucher Lifecycle Tracker monitors claim frequency. Gmail MCP nudges sent when a set is fully used. Annual creation reminders set in Google Calendar.</div></div>

    <div style={S.card}>
      <div style={S.cardT}>Voucher Configuration</div>
      <table style={S.table}><thead><tr>
        <th style={S.th}>Voucher</th><th style={S.th}>Type</th><th style={S.th}>Tiers</th><th style={S.th}>Value</th><th style={S.th}>Trigger</th><th style={S.th}>Validity</th><th style={S.th}>Stackable</th><th style={S.th}>Status</th>
      </tr></thead><tbody>
        {vouchers.map(v=><tr key={v.id}>
          <td style={{...S.td,fontWeight:500}}>{v.name}</td>
          <td style={S.td}><span style={S.tag("#EDE7F6","#4527A0")}>{v.type}</span></td>
          <td style={S.td}><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{v.tiers.map(t=><span key={t} style={S.tier(t)}>{t}</span>)}</div></td>
          <td style={{...S.td,fontWeight:600}}>{fmtCur(v.value)}</td>
          <td style={{...S.td,fontSize:11}}>{v.trigger}</td>
          <td style={{...S.td,fontSize:11}}>{v.validity}</td>
          <td style={S.td}>{v.stackable?"Yes":"No"}</td>
          <td style={S.td}><span style={S.tag(v.status==='active'?"#E8F5E9":"#F5F5F5",v.status==='active'?"#2E7D32":"#666")}>{v.status}</span></td>
        </tr>)}
      </tbody></table>
    </div>

    <div style={S.grid(2)}>
      <div style={S.card}>
        <div style={S.cardT}>Eber Voucher Rules</div>
        {[
          {r:"1 redemption per check (dining + points voucher)",ok:true},
          {r:"Not stackable with other promotions",ok:true},
          {r:"Silver tier NOT entitled to unlimited dining vouchers",ok:true},
          {r:"Unused vouchers forfeited when new year's set claimed",ok:true},
          {r:"Voucher redemption = revenue (ENT-voucher in P&L)",ok:true},
          {r:"Bar applicability — PENDING confirmation from Brendon",ok:false},
        ].map((x,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<5?"1px solid #f5f5f5":"none",fontSize:12}}>
          <span style={{color:x.ok?"#4CAF50":"#FF9800",fontSize:14}}>{x.ok?"✓":"⚠"}</span>{x.r}
        </div>)}
      </div>
      <div style={S.card}>
        <div style={S.cardT}>Annual Voucher Set Lifecycle</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[
            {step:"November",desc:"Create next year's voucher set in Staging",icon:"📋"},
            {step:"December",desc:"Test → migrate to Production",icon:"🧪"},
            {step:"1 January",desc:"New set auto-issues to active paid members",icon:"🎉"},
            {step:"Ongoing",desc:"Members manually claim refills from Discover tab",icon:"🔄"},
            {step:"31 December",desc:"Unused vouchers from current year forfeited",icon:"⏰"},
          ].map((x,i)=><div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:12,background:"#FAF8F5",borderRadius:8}}>
            <span style={{fontSize:20}}>{x.icon}</span>
            <div><div style={{fontWeight:600,fontSize:12}}>{x.step}</div><div style={{fontSize:11,color:"#666"}}>{x.desc}</div></div>
          </div>)}
        </div>
      </div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: STAMPS
// ═══════════════════════════════════════════════════════════════════════════════
function StampsTab({members,callAI,aiLoading,aiResult,setAiResult}){
  const cafeMembers = members.filter(m=>m.stamps>0);
  const stampDist = [1,2,3,4,5,6,7,8,9,10].map(s=>({stamp:`${s}`,count:cafeMembers.filter(m=>m.stamps>=s).length}));

  return <div className="fade">
    <h1 style={{fontSize:28,fontWeight:700,fontFamily:font.h,margin:"0 0 4px"}}>Café Stamp Programme</h1>
    <p style={{color:"#888",margin:"0 0 22px",fontSize:12}}>1 stamp per $10 spent · Café outlets only</p>

    <div style={S.limit}>🚫 <div><strong>Eber Limitation — "Back-door" Issue:</strong> Rewards at 3rd, 5th, 6th stamps require manual member claim. Eber cannot prevent re-triggering when stamps remain unclaimed. Multi-transaction splits ($30 across 2 txns) trigger rewards twice.</div></div>
    <div style={S.ok}>✅ <div><strong>AI Workaround:</strong> Time-based restriction (e.g. once per 2 months) recommended. Use AI Stamp Card Analyser below to calibrate optimal window from café spend data.</div></div>

    <div style={S.grid(2)}>
      <div style={S.card}>
        <div style={S.cardT}>Stamp Thresholds</div>
        <table style={S.table}><thead><tr><th style={S.th}>Stamp</th><th style={S.th}>Issuance</th><th style={S.th}>Notes</th></tr></thead><tbody>
          {STAMP_THRESHOLDS.map(t=><tr key={t.stamp}>
            <td style={{...S.td,fontWeight:700,fontSize:20,fontFamily:font.h,color:"#C5A258"}}>{t.stamp}</td>
            <td style={S.td}><span style={S.tag(t.autoIssue?"#E8F5E9":"#FFF8E1",t.autoIssue?"#2E7D32":"#5D4037")}>{t.autoIssue?"Auto":"Manual"}</span></td>
            <td style={{...S.td,fontSize:11,color:"#666"}}>{t.label}</td>
          </tr>)}
        </tbody></table>
      </div>
      <div style={S.card}>
        <div style={S.cardT}>Participating Outlets</div>
        {CAFE_OUTLETS.map(v=><div key={v.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #f5f5f5"}}>
          <div style={{width:9,height:9,borderRadius:"50%",background:"#7B9E6B"}}/>
          <div><div style={{fontWeight:500,fontSize:12}}>{v.name}</div><div style={{fontSize:10,color:"#888"}}>{v.loc}</div></div>
        </div>)}
      </div>
    </div>

    <div style={S.card}>
      <div style={S.cardT}>Stamp Distribution</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={stampDist}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
          <XAxis dataKey="stamp" tick={{fontSize:10}} stroke="#ccc"/>
          <YAxis tick={{fontSize:10}} stroke="#ccc"/>
          <Tooltip/>
          <Bar dataKey="count" fill="#7B9E6B" radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={{...S.ai,marginTop:6}}>
      <div style={S.aiL}>✦ AI Stamp Card Analyser</div>
      <p style={{fontSize:12,color:"#bbb",margin:"0 0 14px",maxWidth:580}}>Analyse café spending patterns to determine the optimal time-based restriction window for the back-door issue workaround.</p>
      <button style={S.btn("gold")} onClick={()=>callAI("Analyse typical café stamp card cycle for 1-Group's Wildseed Café outlets. Assumptions: average café visit spend $18-25, average visits 2-3 per month per regular. Calculate: 1) Average days to complete a 10-stamp card, 2) Recommended time restriction window to prevent back-door re-triggering, 3) What % of members would be affected by a 2-month vs 3-month restriction. Present as a concise analysis with a clear recommendation.")} disabled={aiLoading}>
        {aiLoading?"✦ Analysing…":"✦ Run Analysis"}
      </button>
      {aiResult&&!aiLoading&&<div style={{marginTop:16,background:"rgba(255,255,255,.06)",borderRadius:10,padding:16,maxHeight:260,overflowY:"auto"}}>
        <pre style={{fontSize:11,fontFamily:font.m,color:"#ddd",whiteSpace:"pre-wrap",margin:0,lineHeight:1.6}}>{aiResult}</pre>
        <button style={{...S.btn("ghost"),color:"#777",marginTop:10,fontSize:10}} onClick={()=>setAiResult(null)}>Clear</button>
      </div>}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: TIERS
// ═══════════════════════════════════════════════════════════════════════════════
function TiersTab({members,tierData}){
  return <div className="fade">
    <h1 style={{fontSize:28,fontWeight:700,fontFamily:font.h,margin:"0 0 4px"}}>Tier Configuration</h1>
    <p style={{color:"#888",margin:"0 0 22px",fontSize:12}}>Silver (free) · Gold, Platinum, Corporate (paid via Stripe) · Staff (internal)</p>

    <div style={S.warn}>⚠️ <div><strong>Eber Limitation:</strong> No automated renewal. No tier benefits on purchase page. No native cross-tier upgrade gating. Workarounds active for all three.</div></div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14}}>
      {TIERS.map(t=>{
        const count=members.filter(m=>m.tier===t.id).length;
        return <div key={t.id} style={{...S.card,borderTop:`4px solid ${t.hex}`,padding:20}} className="lift">
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:40,height:40,borderRadius:10,background:t.id==='platinum'?t.bg:`${t.hex}22`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:t.hex}}/>
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:17,fontFamily:font.h}}>{t.name}</div>
              <div style={{fontSize:10,color:"#888"}}>{t.desc}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <div style={{flex:1,background:"#fafafa",borderRadius:8,padding:10,textAlign:"center"}}>
              <div style={{fontSize:9,color:"#999",textTransform:"uppercase",letterSpacing:1}}>Members</div>
              <div style={{fontSize:22,fontWeight:700,fontFamily:font.h}}>{count}</div>
            </div>
            <div style={{flex:1,background:"#fafafa",borderRadius:8,padding:10,textAlign:"center"}}>
              <div style={{fontSize:9,color:"#999",textTransform:"uppercase",letterSpacing:1}}>Earn Rate</div>
              <div style={{fontSize:22,fontWeight:700,fontFamily:font.h,color:"#C5A258"}}>{t.earn}×</div>
            </div>
          </div>
          <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Benefits</div>
          {t.benefits.map((b,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:11,color:"#444",marginBottom:5}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:t.hex,flexShrink:0}}/>{b}
          </div>)}
          {t.paid&&<div style={{marginTop:12,padding:8,background:"#FFF8E1",borderRadius:6,fontSize:10,color:"#5D4037",textAlign:"center"}}>💳 Paid via Stripe · Manual renewal</div>}
        </div>;
      })}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PROMOTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function PromotionsTab({promotions,setPromotions}){
  return <div className="fade">
    <h1 style={{fontSize:28,fontWeight:700,fontFamily:font.h,margin:"0 0 4px"}}>Promotion Calendar</h1>
    <p style={{color:"#888",margin:"0 0 22px",fontSize:12}}>Track promotions and Eber points/stamp rule exclusions</p>

    <div style={S.limit}>🚫 <div><strong>Eber Limitation:</strong> Promotional transactions are NOT automatically excluded from points accrual. Points and stamp rules must be manually updated in Eber backend BEFORE each promotion starts, and REVERTED after it ends.</div></div>

    <div style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={S.cardT}>Promotions</div>
        <button style={S.btn("primary")}>+ Add Promotion</button>
      </div>
      <table style={S.table}><thead><tr>
        <th style={S.th}>Promotion</th><th style={S.th}>Period</th><th style={S.th}>Outlets</th><th style={S.th}>Type</th><th style={S.th}>Exclusion</th><th style={S.th}>Revert Date</th><th style={S.th}>Status</th>
      </tr></thead><tbody>
        {promotions.map(p=><tr key={p.id}>
          <td style={{...S.td,fontWeight:500}}>{p.name}</td>
          <td style={{...S.td,fontSize:11}}>{fmtDate(p.start)} – {fmtDate(p.end)}</td>
          <td style={{...S.td,fontSize:11}}>{p.outlets[0]==='all'?'All venues':p.outlets.length+' outlets'}</td>
          <td style={S.td}><span style={S.tag("#EDE7F6","#4527A0")}>{p.type.replace(/_/g,' ')}</span></td>
          <td style={S.td}>{p.exclusionApplied?<span style={S.tag("#E8F5E9","#2E7D32")}>✓ Applied</span>:<span style={S.tag("#FFEBEE","#C62828")}>✗ Missing</span>}</td>
          <td style={{...S.td,fontSize:11,fontFamily:font.m}}>{fmtDate(p.revertDate)}</td>
          <td style={S.td}><span style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}><span style={S.sDot(p.status)}/>{p.status}</span></td>
        </tr>)}
      </tbody></table>
    </div>

    <div style={S.card}>
      <div style={S.cardT}>Per-Promotion Checklist</div>
      {[
        "Update Eber points rules to exclude promotional transactions BEFORE promotion starts",
        "Update Eber stamp rules to exclude at café outlets if applicable",
        "Set Google Calendar reminder to REVERT rules after promotion ends",
        "Verify no overlapping promotions with conflicting rules",
        "Document promotion in the Promotion Calendar",
      ].map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<4?"1px solid #f5f5f5":"none",fontSize:12}}>
        <span style={{width:18,height:18,border:"2px solid #ddd",borderRadius:4,flexShrink:0}}/>
        {c}
      </div>)}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: DECISIONS
// ═══════════════════════════════════════════════════════════════════════════════
function DecisionsTab({decisions,setDecisions}){
  const resolve = (id) => {
    const updated = decisions.map(d=>d.id===id?{...d,status:"CLOSED",notes:d.notes+" [Resolved]"}:d);
    setDecisions(updated);
    store.set("eber-decisions",updated);
  };
  return <div className="fade">
    <h1 style={{fontSize:28,fontWeight:700,fontFamily:font.h,margin:"0 0 4px"}}>Decision Log</h1>
    <p style={{color:"#888",margin:"0 0 22px",fontSize:12}}>Track open decisions that must be resolved before full programme launch</p>

    <div style={{...S.grid(2)}}>
      <div style={{...S.stat,textAlign:"center"}} className="lift">
        <div style={S.statL}>Open</div>
        <div style={{...S.statV,color:"#FF9800"}}>{decisions.filter(d=>d.status==='OPEN').length}</div>
      </div>
      <div style={{...S.stat,textAlign:"center"}} className="lift">
        <div style={S.statL}>Closed</div>
        <div style={{...S.statV,color:"#4CAF50"}}>{decisions.filter(d=>d.status==='CLOSED').length}</div>
      </div>
    </div>

    <div style={{marginTop:18}}>
      {decisions.map(d=><div key={d.id} style={{...S.card,borderLeft:`4px solid ${d.status==='OPEN'?"#FF9800":"#4CAF50"}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontWeight:600,fontSize:15}}>{d.decision}</div>
            <div style={{fontSize:11,color:"#888",marginTop:4}}>Owner: {d.owner} · Created: {fmtDate(d.created)}</div>
          </div>
          <span style={S.tag(d.status==='OPEN'?"#FFF3E0":"#E8F5E9",d.status==='OPEN'?"#E65100":"#2E7D32")}>{d.status}</span>
        </div>
        <p style={{fontSize:12,color:"#555",margin:"10px 0 0",lineHeight:1.6}}>{d.notes}</p>
        {d.status==='OPEN'&&<button style={{...S.btn("success"),marginTop:12,fontSize:11}} onClick={()=>resolve(d.id)}>Mark Resolved</button>}
      </div>)}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: RENEWALS
// ═══════════════════════════════════════════════════════════════════════════════
function RenewalsTab({members}){
  const paid = members.filter(m=>m.membershipExpiry).sort((a,b)=>new Date(a.membershipExpiry)-new Date(b.membershipExpiry));
  const now = Date.now();
  const getUrgency = exp => { const d=(new Date(exp)-now)/(864e5); return d<0?"expired":d<7?"critical":d<30?"soon":"ok"; };
  return <div className="fade">
    <h1 style={{fontSize:28,fontWeight:700,fontFamily:font.h,margin:"0 0 4px"}}>Renewal Tracker</h1>
    <p style={{color:"#888",margin:"0 0 22px",fontSize:12}}>Manual renewal flow — Eber does not support auto-renewal</p>

    <div style={S.limit}>🚫 <div><strong>Eber Limitation:</strong> Automated membership renewal is NOT supported due to refund risk. All renewals must be manual.</div></div>
    <div style={S.ok}>✅ <div><strong>AI Workaround Active:</strong> Gmail MCP reminders triggered at 30-day, 7-day, and 1-day intervals before expiry. One-tap renewal link included.</div></div>

    <div style={S.card}>
      <table style={S.table}><thead><tr>
        <th style={S.th}>Member</th><th style={S.th}>Tier</th><th style={S.th}>Expiry</th><th style={S.th}>Days Left</th><th style={S.th}>Urgency</th><th style={S.th}>Reminder</th>
      </tr></thead><tbody>
        {paid.map(m=>{
          const days=Math.ceil((new Date(m.membershipExpiry)-now)/(864e5));
          const u=getUrgency(m.membershipExpiry);
          return <tr key={m.id}>
            <td style={S.td}><div style={{fontWeight:500}}>{m.name}</div><div style={{fontSize:10,color:"#999"}}>{m.id}</div></td>
            <td style={S.td}><span style={S.tier(m.tier)}>{m.tier}</span></td>
            <td style={{...S.td,fontSize:11}}>{fmtDate(m.membershipExpiry)}</td>
            <td style={{...S.td,fontWeight:600,color:u==='expired'?"#D32F2F":u==='critical'?"#D32F2F":u==='soon'?"#FF9800":"#4CAF50"}}>{days<0?`${Math.abs(days)}d overdue`:`${days}d`}</td>
            <td style={S.td}><span style={S.tag(u==='expired'?"#FFEBEE":u==='critical'?"#FFEBEE":u==='soon'?"#FFF3E0":"#E8F5E9",u==='expired'||u==='critical'?"#C62828":u==='soon'?"#E65100":"#2E7D32")}>{u}</span></td>
            <td style={S.td}><button style={{...S.btn("gold"),padding:"4px 12px",fontSize:10}}>Send Reminder</button></td>
          </tr>;
        })}
      </tbody></table>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: STAFF
// ═══════════════════════════════════════════════════════════════════════════════
function StaffTab({staffReg}){
  return <div className="fade">
    <h1 style={{fontSize:28,fontWeight:700,fontFamily:font.h,margin:"0 0 4px"}}>Staff Registry</h1>
    <p style={{color:"#888",margin:"0 0 22px",fontSize:12}}>Staff tier onboarding and dual-account tracking</p>

    <div style={S.limit}>🚫 <div><strong>Eber Limitation:</strong> One mobile number = one account. Staff cannot hold both a personal and staff membership on the same number. This is a platform-level restriction and cannot be overridden.</div></div>

    <div style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={S.cardT}>Staff Members</div>
        <button style={S.btn("primary")}>+ Onboard Staff</button>
      </div>
      <table style={S.table}><thead><tr>
        <th style={S.th}>Name</th><th style={S.th}>Personal Mobile</th><th style={S.th}>Staff Mobile</th><th style={S.th}>Status</th><th style={S.th}>Notes</th>
      </tr></thead><tbody>
        {staffReg.map((s,i)=><tr key={i}>
          <td style={{...S.td,fontWeight:500}}>{s.name}</td>
          <td style={{...S.td,fontSize:11,fontFamily:font.m}}>{s.personalMobile||"—"}</td>
          <td style={{...S.td,fontSize:11,fontFamily:font.m}}>{s.staffMobile}</td>
          <td style={S.td}><span style={S.tag("#E8F5E9","#2E7D32")}>{s.status}</span></td>
          <td style={{...S.td,fontSize:11,color:"#666"}}>{s.notes}</td>
        </tr>)}
      </tbody></table>
    </div>

    <div style={S.card}>
      <div style={S.cardT}>Staff Onboarding SOP</div>
      {[
        {step:1,title:"Check existing registration",desc:"Search Eber for the staff member's personal mobile number"},
        {step:2,title:"If found — offer options",desc:"(a) Convert existing account to Staff tier, OR (b) Register with an alternate mobile number"},
        {step:3,title:"If not found — register directly",desc:"Create new Staff tier account using the staff member's chosen mobile number"},
        {step:4,title:"Record in Staff Registry",desc:"Log both personal and staff mobile numbers for HR/ops reference"},
        {step:5,title:"Issue Staff benefits",desc:"Configure staff-specific vouchers and internal event access"},
      ].map(x=><div key={x.step} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"12px 0",borderBottom:x.step<5?"1px solid #f5f5f5":"none"}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:"#E8F5E9",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#2E7D32",flexShrink:0}}>{x.step}</div>
        <div><div style={{fontWeight:600,fontSize:13}}>{x.title}</div><div style={{fontSize:11,color:"#666",marginTop:2}}>{x.desc}</div></div>
      </div>)}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════════
function ChecklistTab({decisions,promotions}){
  const openD = decisions.filter(d=>d.status==='OPEN').length;
  const pendingExcl = promotions.filter(p=>p.status==='upcoming'&&!p.exclusionApplied).length;

  const sections = [
    { title:"Pre-Launch Checklist", items:[
      {t:"All tier definitions configured in Staging",done:true},
      {t:"Member card artwork supplied at 1200×758px",done:true},
      {t:"Points rules set (earn rates, exclusions, expiry = 12 months)",done:true},
      {t:"Welcome vouchers configured for all tiers",done:true},
      {t:"Dining voucher sets created with calendar-year expiry",done:true},
      {t:"Stamp card configured for café outlets (exact store names)",done:true},
      {t:"Discover tab visibility dates set (launch vs. regular)",done:false},
      {t:"Stripe connected to JEPL account and tested",done:true},
      {t:`Staff tier mechanics confirmed (${openD>0?'BLOCKED — '+openD+' open decisions':'Done'})`,done:openD===0},
      {t:"Bar voucher applicability confirmed with Brendon",done:!decisions.some(d=>d.decision.includes("Bar")&&d.status==='OPEN')},
      {t:"Staging tested end-to-end → Production sign-off",done:false},
    ]},
    { title:"Annual Recurring Tasks", items:[
      {t:"November: Create next year's voucher set in Staging",done:false},
      {t:"December: Test and migrate voucher set to Production",done:false},
      {t:"January: Verify launch voucher visibility (Jan only)",done:false},
      {t:"February: Verify regular voucher visibility (permanent)",done:false},
      {t:"Quarterly: Review stamp card time-restriction effectiveness",done:false},
      {t:"Monthly: Generate voucher refill nudge campaigns",done:false},
    ]},
    { title:"Per-Promotion Tasks", warn:pendingExcl>0?`${pendingExcl} upcoming promotion(s) missing exclusion rules`:null, items:[
      {t:"Update Eber points rules BEFORE promotion starts",done:false},
      {t:"Update Eber stamp rules for café outlets if applicable",done:false},
      {t:"Set Google Calendar reminder to REVERT rules after",done:false},
      {t:"Verify no overlapping promotions",done:false},
      {t:"Document promotion in the Promotion Calendar",done:false},
    ]},
  ];

  return <div className="fade">
    <h1 style={{fontSize:28,fontWeight:700,fontFamily:font.h,margin:"0 0 4px"}}>Operational Checklists</h1>
    <p style={{color:"#888",margin:"0 0 22px",fontSize:12}}>Eber platform operational requirements and recurring tasks</p>

    {sections.map((sec,si)=><div key={si} style={S.card}>
      <div style={S.cardT}>{sec.title}</div>
      {sec.warn&&<div style={S.warn}>⚠️ <div>{sec.warn}</div></div>}
      {sec.items.map((item,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:i<sec.items.length-1?"1px solid #f5f5f5":"none"}}>
        <div style={{width:20,height:20,borderRadius:5,border:item.done?"none":"2px solid #ddd",background:item.done?"#4CAF50":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {item.done&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
        </div>
        <span style={{fontSize:12,color:item.done?"#999":"#333",textDecoration:item.done?"line-through":"none"}}>{item.t}</span>
      </div>)}
    </div>)}
  </div>;
}
