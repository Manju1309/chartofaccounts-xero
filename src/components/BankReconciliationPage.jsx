import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// ─── Color tokens (Xero exact) ────────────────────────────────────────────────
const C = {
  blue      : "#1a6496",
  blueBg    : "#e8f4fb",
  blueBorder: "#c6dff0",
  blueHover : "#145279",
  green     : "#b2dfdb",   
  greenBdr  : "#80cbc4",
  greenDark : "#00796b",
  okBtn     : "#1a6496",   
  okBtnMatch: "#1a6496",
  border    : "#d8e8f2",
  rowBorder : "#e8eef3",
  headerBg  : "#f7fbff",
  pageBg    : "#eef2f5",
  white     : "#fff",
  red       : "#dc2626",
  gray50    : "#f9fafb",
  gray100   : "#f3f4f6",
  gray200   : "#e5e7eb",
  gray300   : "#d1d5db",
  gray500   : "#6b7280",
  gray700   : "#374151",
  gray900   : "#111827",
  textMuted : "#6b7280",
  textLink  : "#1a6496",
};

// ─── Sample data ──────────────────────────────────────────────────────────────
const STATEMENT_LINES = [
  { id:"sl1", date:"28 Mar 2026", payee:"Gateway Motors",          ref:"",          spent:"411.35", received:"", activeTab:"match",   bankRule:null },
  { id:"sl2", date:"27 Mar 2026", payee:"7-Eleven",                ref:"",          spent:"15.50",  received:"", activeTab:"create",  bankRule:{ name:"7-Eleven", contact:"7-Eleven" } },
  { id:"sl3", date:"22 Mar 2026", payee:"SMART Agency 01950210",   ref:"CBI",       spent:"4500.00",received:"", activeTab:"match",   bankRule:null },
  { id:"sl4", date:"22 Mar 2026", payee:"City Limousines",         ref:"0006-PART", spent:"",   received:"100.00", activeTab:"discuss", bankRule:null },
  { id:"sl5", date:"23 Mar 2026", payee:"Jakaranda Maple Systems", ref:"DEPOSIT ADV",spent:"",  received:"2000.00",activeTab:"create",  bankRule:null },
  { id:"sl6", date:"27 Mar 2026", payee:"Cooper St Bakery",        ref:"Eft",       spent:"15.75",  received:"", activeTab:"create",  bankRule:null },
  { id:"sl7", date:"29 Mar 2026", payee:"ATO PAYG Withholding",    ref:"PAY-2603",  spent:"1200.00",received:"", activeTab:"transfer",bankRule:null },
];

// Suggested matches per statement line
const SUGGESTED_MATCHES = {
  sl1: [{ id:"m1", date:"29 Mar 2026", desc:"Payment: Gateway Motors", ref:"PAY-4411", spent:"411.35", received:"" }],
  sl3: [{ id:"m2", date:"20 Mar 2026", desc:"Invoice: SMART Agency",   ref:"INV-0195", spent:"4500.00",received:"" }],
};

const ALL_MATCH_TX = [
  { id:"t1", date:"7 Feb 2026",  name:"Central Copiers",   ref:"945-OCon",  spent:"163.56",  received:"" },
  { id:"t2", date:"9 Feb 2026",  name:"SMART Agency",      ref:"SM0195",    spent:"4500.00", received:"" },
  { id:"t3", date:"12 Mar 2026", name:"Swanston Security",  ref:"AP",        spent:"59.54",   received:"" },
  { id:"t4", date:"14 Mar 2026", name:"Office Supplies Co", ref:"INV-441",   spent:"88.00",   received:"" },
  { id:"t5", date:"15 Mar 2026", name:"Cloud Services Ltd", ref:"SUB-2026",  spent:"210.00",  received:"" },
];

const ACCOUNTS = [
  "Advertising & Marketing (400)","Bank Fees (404)","Cleaning (408)",
  "Computer & Internet (412)","Consulting & Legal (416)","Cost of Goods Sold (310)",
  "Entertainment (420)","Insurance (432)","Motor Vehicle Expenses (446)",
  "Office Expenses (452)","Office Supplies (453)","Other Income (260)",
  "Printing & Stationery (460)","Rent (464)","Repairs & Maintenance (466)",
  "Salaries & Wages (477)","Sales (200)","Subscriptions (469)",
  "Telephone & Internet (489)","Travel & Accommodation (493)","Utilities (495)","Wages (490)",
];
const TAX_RATES  = ["No Tax (0%)","Tax Exempt (0%)","GST on Expenses (10%)","GST on Income (10%)","BAS Excluded","Input Taxed","Zero Rated"];
const BANK_ACCTS = ["Business Savings Account","PayPal Account","Credit Card - Visa","Petty Cash"];

const n = v => parseFloat(String(v||"0").replace(/,/g,"")) || 0;
const fmt = v => n(v).toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2});

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html,body,#root{ height:100%; }
  body{ font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:13px; color:#333; background:${C.pageBg}; }
  input,select,textarea,button{ font-family:inherit; font-size:13px; }
  input:focus,select:focus,textarea:focus{ outline:2px solid ${C.blue}; outline-offset:-1px; }
  button{ cursor:pointer; }

  /* ── Page skeleton ── */
  .xpage{ display:flex; flex-direction:column; height:100vh; }
  .xpage-hdr{ flex-shrink:0; background:${C.white}; border-bottom:1px solid ${C.gray200}; }
  .xpage-body{ flex:1; min-height:0; }

  /* ── Buttons ── */
  .btn-ok{
    width:36px; height:36px; border-radius:4px; border:none;
    background:${C.okBtn}; color:#fff; font-size:14px; font-weight:700;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; box-shadow:0 2px 6px rgba(26,100,150,.45);
    letter-spacing:.5px;
  }
  .btn-ok:hover{ background:${C.blueHover}; }
  .btn-ok.matched{ background:#388e3c; box-shadow:0 2px 6px rgba(56,142,60,.5); }
  .btn-primary{ height:30px; padding:0 16px; background:${C.gray700}; color:#fff; border:none; border-radius:3px; font-weight:700; }
  .btn-primary:hover{ background:#1f2937; }
  .btn-outline{ height:30px; padding:0 14px; background:#fff; color:${C.gray700}; border:1px solid ${C.gray300}; border-radius:3px; font-weight:600; }
  .btn-outline:hover{ background:${C.gray50}; }
  .btn-link{ background:none; border:none; color:${C.blue}; padding:0; font-size:13px; text-decoration:none; }
  .btn-link:hover{ text-decoration:underline; }
  .btn-xero{ height:30px; padding:0 14px; background:${C.white}; color:${C.blue}; border:1px solid ${C.blue}; border-radius:3px; font-weight:700; font-size:12px; }
  .btn-xero:hover{ background:${C.blueBg}; }

  /* ── Nav tabs ── */
  .nav-tab{ background:none; border:none; border-bottom:3px solid transparent; padding:10px 14px; font-size:13px; color:#555; font-weight:400; white-space:nowrap; }
  .nav-tab:hover:not(.on){ color:#333; }
  .nav-tab.on{ color:${C.blue}; font-weight:700; border-bottom:3px solid ${C.blue}; }

  /* ── Inner tabs (Match/Create/…) ── */
  .inner-tab{ background:none; border:none; border-bottom:2px solid transparent; padding:8px 14px; font-size:13px; color:#555; white-space:nowrap; }
  .inner-tab:hover:not(.on){ color:#333; }
  .inner-tab.on{ color:${C.blue}; font-weight:700; border-bottom:2px solid ${C.blue}; }

  /* ── Form controls ── */
  .xi{ width:100%; height:30px; padding:0 8px; border:1px solid #ccc; border-radius:3px; color:#333; background:#fff; }
  .xi:hover{ border-color:#999; }
  .xs{ width:100%; height:30px; padding:0 26px 0 8px; border:1px solid #ccc; border-radius:3px; color:#333; background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E") no-repeat right 8px center; appearance:none; }
  .xs:hover{ border-color:#999; }
  .xta{ width:100%; padding:8px; border:1px solid #ccc; border-radius:3px; resize:vertical; color:#333; font-size:13px; line-height:1.5; }
  .xta:hover{ border-color:#999; }

  /*
   * ═══════════════════════════════════════════════════════
   *  STATEMENT ROW — 3-column layout (equal left+right)
   *
   *  |─────── LEFT 50% ───────|─ OK (56px) ─|── RIGHT 50% ──|
   *
   *  The trick: use CSS grid on the outer row so both sides
   *  always get exactly 50% of the available space minus the
   *  fixed OK column.
   * ═══════════════════════════════════════════════════════
   */
  .sl-row{
    display:grid;
    /* calc: each half = (100% - 56px OK column) / 2  */
    grid-template-columns: 1fr 56px 1fr;
    align-items:stretch;
    background:#fff;
    border:1px solid ${C.border};
    border-radius:4px;
    margin-bottom:6px;
    overflow:visible;
  }
  .sl-row:hover{ box-shadow:0 1px 8px rgba(0,0,0,.12); }

  /* LEFT panel — fills its grid cell */
  .sl-left{
    min-width:0;
    border-right:1px solid ${C.rowBorder};
    display:flex;
    flex-direction:column;
  }

  /* LEFT inner layout: info on left, Spent/Received columns on right */
  .sl-left-inner{
    display:grid;
    grid-template-columns: 1fr auto auto;
    gap:0;
    flex:1;
    min-width:0;
  }
  .sl-left-info{
    padding:12px 14px;
    min-width:0;
  }
  .sl-amt-col{
    display:flex;
    flex-direction:column;
    justify-content:flex-end;
    padding:12px 14px 12px 8px;
    text-align:right;
    min-width:72px;
    border-left:1px solid ${C.rowBorder};
  }
  .sl-amt-label{
    font-size:11px; color:${C.gray500}; font-weight:400; margin-bottom:3px;
  }
  .sl-amt-val{
    font-size:14px; font-weight:700;
  }

  /* CENTER — OK button column */
  .sl-ok-col{
    display:flex;
    align-items:center;
    justify-content:center;
    background:#f0f7fc;
    border-right:1px solid ${C.rowBorder};
  }

  /* RIGHT panel */
  .sl-right{
    min-width:0;
    display:flex;
    flex-direction:column;
  }

  /* Options row sits above the left inner layout */
  .sl-options-row{
    display:flex;
    justify-content:flex-end;
    padding:8px 10px 0;
  }

  /* ── Matched green card (right panel, Match tab) ── */
  .match-card{
    display:grid;
    /* info | Spent col | Received col — mirrors the left panel */
    grid-template-columns: 1fr 100px 100px;
    border:2px solid #81c784;
    border-radius:3px;
    background:#c8e6c9;
    overflow:hidden;
    margin:8px 10px 10px;
  }
  .match-card-info{
    padding:10px 12px;
    display:flex; align-items:center; gap:10px;
    min-width:0;
  }
  .match-card-amt{
    padding:10px 12px;
    border-left:1px solid #81c784;
    display:flex; flex-direction:column; justify-content:flex-end;
  }
  .mc-label{ font-size:10px; color:#1b5e20; font-weight:600; text-transform:uppercase; letter-spacing:.3px; margin-bottom:3px; }
  .mc-val  { font-size:14px; font-weight:700; color:#1b5e20; }

  /* ── Table ── */
  .xtbl{ width:100%; border-collapse:collapse; font-size:13px; }
  .xtbl th{ background:${C.headerBg}; padding:7px 10px; text-align:left; font-weight:600; font-size:11px; color:${C.blue}; border-bottom:1px solid ${C.blueBorder}; white-space:nowrap; }
  .xtbl td{ padding:7px 10px; border-bottom:1px solid #eef2f5; vertical-align:middle; }
  .xtbl tr:last-child td{ border-bottom:none; }
  .xtbl tr:hover td{ background:#f0f8fd; }
  .xtbl tr.sel td{ background:#e8f4fd; }

  /* ── Bank rule panel ── */
  .rule-panel{ border-left:4px solid ${C.blue}; background:#f7fbff; padding:12px 16px; }
  .rule-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px; }
  .rule-label{ font-size:11px; color:${C.textMuted}; font-weight:600; text-transform:uppercase; letter-spacing:.3px; margin-bottom:4px; }
  .rule-val{ font-size:14px; color:${C.blue}; font-weight:700; }
  .rule-val input{ height:32px; border:1px solid #ccc; border-radius:3px; padding:0 8px; width:100%; font-size:13px; }
  .rule-actions{ display:flex; gap:16px; align-items:center; border-top:1px solid ${C.gray200}; padding-top:8px; }

  /* ── Badge ── */
  .badge{ display:inline-block; padding:2px 7px; border-radius:2px; font-size:11px; font-weight:600; }
  .badge-recon{ background:#e0f2f1; color:#00796b; }
  .badge-unrecon{ background:#fce8e6; color:#b71c1c; }
  .badge-blue{ background:#e8f4fb; color:${C.blue}; }

  /* ── ScrollArea tweaks ── */
  [data-radix-scroll-area-scrollbar]{ background:transparent!important; }
  [data-radix-scroll-area-thumb]{ background:#c9d7e0!important; border-radius:99px!important; }
  [data-radix-scroll-area-thumb]:hover{ background:#a5b8c7!important; }

  /* ══════════════════════════════
     RESPONSIVE BREAKPOINTS
  ══════════════════════════════ */

  /* Tablet: shrink amounts cols a bit */
  @media(max-width:960px){
    .sl-amt-col{ min-width:60px; padding:12px 10px 12px 6px; }
    .inner-tab{ padding:8px 10px; font-size:12px; }
  }

  /* Mobile: stack vertically */
  @media(max-width:680px){
    .sl-row{
      grid-template-columns:1fr !important;
      grid-template-rows:auto auto auto;
    }
    /* LEFT stacks on top */
    .sl-left{
      border-right:none !important;
      border-bottom:1px solid ${C.rowBorder};
    }
    /* OK col becomes a horizontal bar */
    .sl-ok-col{
      border-right:none !important;
      border-bottom:1px solid ${C.rowBorder};
      justify-content:flex-end;
      padding:8px 14px;
      min-height:52px;
      background:#eaf4fb;
    }
    .sl-right{ width:100%; }
    .rule-grid{ grid-template-columns:1fr !important; }
    .match-card{ grid-template-columns:1fr 90px !important; }
    .hdr-btns{ flex-wrap:wrap !important; gap:6px !important; }
    .bal-row{ flex-wrap:wrap !important; gap:16px !important; }
    .hdr-title-row{ flex-direction:column !important; align-items:flex-start !important; gap:8px !important; }
    .hide-mobile{ display:none !important; }
    .col2-form{ grid-template-columns:1fr !important; }
  }
`;

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div style={{
      position:"fixed",top:16,right:16,zIndex:9999,
      background: type==="err" ? "#d0021b" : type==="warn" ? "#f59e0b" : "#388e3c",
      color:"#fff",padding:"10px 18px",borderRadius:4,fontSize:13,fontWeight:600,
      maxWidth:320,boxShadow:"0 4px 12px rgba(0,0,0,.2)"
    }}>{msg}</div>
  );
}

function Chev({ size=10, color="#6b7280" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  );
}

function OptionsMenu({ items, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      <button className="btn-xero" style={{ display:"flex",alignItems:"center",gap:5,height:26,fontSize:12 }}
        onClick={e=>{ e.stopPropagation(); setOpen(v=>!v); }}>
        Options <Chev size={9} color={C.blue}/>
      </button>
      {open && (
        <div style={{ position:"absolute",right:0,top:"calc(100% + 2px)",zIndex:200,
          background:"#fff",border:`1px solid ${C.gray200}`,borderRadius:4,
          boxShadow:"0 6px 20px rgba(0,0,0,.12)",minWidth:180 }}
          onClick={e=>e.stopPropagation()}>
          {items.map((item,i)=>(
            <button key={i} style={{ display:"block",width:"100%",textAlign:"left",
              padding:"9px 14px",fontSize:13,border:"none",background:"none",
              borderBottom: i<items.length-1 ? `1px solid ${C.gray100}` : "none",color:C.gray700 }}
              onMouseEnter={e=>e.currentTarget.style.background=C.blueBg}
              onMouseLeave={e=>e.currentTarget.style.background="none"}
              onClick={()=>{ setOpen(false); onSelect(item); }}>
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MATCH PANEL ──────────────────────────────────────────────────────────────
function MatchPanel({ line, onReconcile }) {
  const suggested = SUGGESTED_MATCHES[line.id] || [];
  const [selected, setSelected]   = useState(suggested.length ? [suggested[0].id] : []);
  const [searchQ,  setSearchQ]    = useState("");
  const [searchAmt,setSearchAmt]  = useState("");
  const [showAll,  setShowAll]    = useState(!suggested.length);
  const [showRcv,  setShowRcv]    = useState(false);

  const lineAmt  = n(line.spent || line.received);
  const filtered = ALL_MATCH_TX.filter(tx => {
    if (!searchQ.trim() && !searchAmt.trim()) return true;
    const qMatch = !searchQ.trim() || tx.name.toLowerCase().includes(searchQ.toLowerCase()) || tx.ref.toLowerCase().includes(searchQ.toLowerCase());
    const aMatch = !searchAmt.trim() || tx.spent.includes(searchAmt) || tx.received.includes(searchAmt);
    return qMatch && aMatch;
  });
  const selTotal = selected.reduce((s,id)=>{
    const tx = ALL_MATCH_TX.find(t=>t.id===id);
    return s + n(tx?.spent || tx?.received || "0");
  }, 0);
  const balanced = Math.abs(lineAmt - selTotal) < 0.005;
  const toggle   = id => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  // If we have auto-suggested match — show the green matched card (Xero style)
  if (!showAll && suggested.length > 0) {
    const m = suggested[0];
    return (
      <div style={{ padding:"8px 0 12px" }}>
        {/*
          Green card mirrors the left panel's column layout exactly:
          [icon + info (flex:1)] | [Spent col 100px] | [Received col 100px]
          The entire right panel width is used — no extra padding on sides.
        */}
        <div className="match-card">
          {/* Info cell */}
          <div className="match-card-info">
            {/* Transfer icon — Xero uses a ⇄ arrows icon */}
            <div style={{
              width:34, height:34, borderRadius:"50%",
              background:"#a5d6a7",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b5e20" strokeWidth="2" strokeLinecap="round">
                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12, color:"#1b5e20", marginBottom:2 }}>{m.date}</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1b5e20", whiteSpace:"nowrap",
                overflow:"hidden", textOverflow:"ellipsis" }}>{m.desc}</div>
            </div>
          </div>

          {/* Spent column */}
          <div className="match-card-amt">
            <div className="mc-label">Spent</div>
            <div className="mc-val" style={{ textAlign:"right" }}>{m.spent || ""}</div>
          </div>

          {/* Received column */}
          <div className="match-card-amt">
            <div className="mc-label">Received</div>
            <div className="mc-val" style={{ textAlign:"right" }}>{m.received || ""}</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:14, alignItems:"center", padding:"8px 10px 0" }}>
          <button className="btn-link" style={{ fontSize:12 }}
            onClick={() => setShowAll(true)}>Find &amp; Match</button>
          <button className="btn-link" style={{ fontSize:12 }}
            onClick={() => setSelected([])}>Remove match</button>
        </div>
      </div>
    );
  }

  // Full search table
  const thSt = { padding:"7px 10px",fontSize:11,fontWeight:700,color:C.blue,
    background:C.headerBg,borderBottom:`1px solid ${C.blueBorder}`,whiteSpace:"nowrap",textAlign:"left" };

  return (
    <div style={{ padding:"10px 14px 14px" }}>
      {/* Section 1 */}
      <div style={{ background:C.headerBg,border:`1px solid ${C.blueBorder}`,borderRadius:4,marginBottom:8 }}>
        <div style={{ padding:"10px 12px 8px",borderBottom:`1px solid ${C.blueBorder}` }}>
          <div style={{ fontSize:13,fontWeight:700,marginBottom:8 }}>1. Find &amp; select matching transactions</div>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
            <label style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.gray700,cursor:"pointer" }}>
              <input type="checkbox" checked={showRcv} onChange={e=>setShowRcv(e.target.checked)}
                style={{ accentColor:C.blue,width:13,height:13 }}/>
              Show Received
            </label>
            <div style={{ marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
              <input className="xi" style={{ width:150,height:26 }} placeholder="Name or reference…"
                value={searchQ} onChange={e=>setSearchQ(e.target.value)} />
              <input className="xi" style={{ width:90,height:26,textAlign:"right" }} placeholder="Amount"
                value={searchAmt} onChange={e=>setSearchAmt(e.target.value)} />
              <button className="btn-xero" style={{ height:26 }} onClick={()=>{}}>Go</button>
              <button className="btn-link" style={{ fontSize:12 }} onClick={()=>{ setSearchQ(""); setSearchAmt(""); }}>
                Clear
              </button>
            </div>
          </div>
        </div>
        <ScrollArea style={{ maxHeight:200 }}>
          <div style={{ overflowX:"auto" }}>
            <table className="xtbl" style={{ minWidth:500 }}>
              <thead>
                <tr>
                  <th style={{ ...thSt,width:32 }}></th>
                  <th style={thSt}>Date</th>
                  <th style={thSt}>Name</th>
                  <th style={thSt}>Reference</th>
                  <th style={{ ...thSt,textAlign:"right" }}>Spent</th>
                  <th style={{ ...thSt,textAlign:"right" }}>Received</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx,i)=>(
                  <tr key={tx.id} className={selected.includes(tx.id)?"sel":""}
                    style={{ cursor:"pointer",background:selected.includes(tx.id)?"#e8f4fd":i%2===0?"#fff":"#fafafa" }}
                    onClick={()=>toggle(tx.id)}>
                    <td style={{ padding:"7px 10px",borderBottom:"1px solid #eef2f5",textAlign:"center" }}>
                      <input type="checkbox" checked={selected.includes(tx.id)} onChange={()=>toggle(tx.id)}
                        style={{ accentColor:C.blue,width:13,height:13 }}
                        onClick={e=>e.stopPropagation()} />
                    </td>
                    <td style={{ padding:"7px 10px",borderBottom:"1px solid #eef2f5",whiteSpace:"nowrap",color:C.gray500,fontSize:12 }}>{tx.date}</td>
                    <td style={{ padding:"7px 10px",borderBottom:"1px solid #eef2f5",fontWeight:600,color:C.blue }}>{tx.name}</td>
                    <td style={{ padding:"7px 10px",borderBottom:"1px solid #eef2f5",color:C.blue,fontSize:12 }}>{tx.ref}</td>
                    <td style={{ padding:"7px 10px",borderBottom:"1px solid #eef2f5",textAlign:"right",fontWeight:600 }}>{tx.spent}</td>
                    <td style={{ padding:"7px 10px",borderBottom:"1px solid #eef2f5",textAlign:"right",fontWeight:600 }}>{tx.received}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="vertical"/>
        </ScrollArea>
        <div style={{ padding:"6px 12px",background:"#f0f6fb",borderTop:`1px solid ${C.blueBorder}`,
          display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <label style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer" }}>
            <input type="checkbox"
              checked={selected.length===filtered.length && filtered.length>0}
              onChange={e=>setSelected(e.target.checked ? filtered.map(t=>t.id) : [])}
              style={{ accentColor:C.blue,width:13,height:13 }}/>
            Select all
          </label>
          <span style={{ fontSize:11,color:C.gray500 }}>Showing {filtered.length} of {ALL_MATCH_TX.length}</span>
        </div>
      </div>

      {/* Section 2 — selected */}
      <div style={{ background:C.headerBg,border:`1px solid ${C.blueBorder}`,borderRadius:4,marginBottom:8,padding:"10px 12px 10px" }}>
        <div style={{ fontSize:13,fontWeight:700,marginBottom:8 }}>2. View selected transactions</div>
        {selected.length === 0 ? (
          <div style={{ padding:"16px 12px",textAlign:"center",color:C.gray500,fontSize:13,
            background:"#fff",border:`1px solid ${C.blueBorder}`,borderRadius:3 }}>
            No transactions selected
          </div>
        ) : (
          <div style={{ border:`1px solid ${C.blueBorder}`,borderRadius:3,overflow:"hidden" }}>
            <table className="xtbl">
              <thead><tr>
                {["Date","Name","Reference","Spent","Received",""].map((h,i)=>(
                  <th key={i} style={{ padding:"7px 10px",fontSize:11,fontWeight:700,color:C.blue,
                    background:C.headerBg,borderBottom:`1px solid ${C.blueBorder}`,
                    textAlign:i>=3&&i<=4?"right":"left",whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {selected.map(id=>{
                  const tx = ALL_MATCH_TX.find(t=>t.id===id);
                  if (!tx) return null;
                  return (
                    <tr key={id}>
                      <td style={{ padding:"7px 10px",fontSize:12,color:C.gray500 }}>{tx.date}</td>
                      <td style={{ padding:"7px 10px",fontWeight:600,color:C.blue }}>{tx.name}</td>
                      <td style={{ padding:"7px 10px",fontSize:12,color:C.blue }}>{tx.ref}</td>
                      <td style={{ padding:"7px 10px",textAlign:"right",fontWeight:600 }}>{tx.spent}</td>
                      <td style={{ padding:"7px 10px",textAlign:"right",fontWeight:600 }}>{tx.received}</td>
                      <td style={{ padding:"7px 6px",textAlign:"center" }}>
                        <button onClick={()=>toggle(id)}
                          style={{ background:"none",border:"none",color:C.gray300,fontSize:18,lineHeight:1 }}
                          onMouseEnter={e=>e.currentTarget.style.color=C.red}
                          onMouseLeave={e=>e.currentTarget.style.color=C.gray300}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3 — balance check */}
      <div style={{ background:C.headerBg,border:`1px solid ${C.blueBorder}`,borderRadius:4,padding:"10px 12px" }}>
        <div style={{ fontSize:13,fontWeight:700,marginBottom:8 }}>3. Totals must match</div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8 }}>
          <div style={{ fontSize:13,color:C.gray700 }}>
            Statement: <strong>{line.spent || line.received}</strong>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:13 }}>Selected total: <strong>{fmt(selTotal)}</strong></span>
            {!balanced && (
              <span style={{ color:C.red,fontSize:12 }}>
                ⚠ Out by: <strong>{fmt(Math.abs(lineAmt-selTotal))}</strong>
              </span>
            )}
            {balanced && selected.length>0 && (
              <span style={{ color:"#388e3c",fontSize:12,fontWeight:600 }}>✓ Balanced</span>
            )}
          </div>
        </div>
        <div style={{ display:"flex",justifyContent:"flex-end",gap:8,marginTop:10 }}>
          <button className="btn-outline" onClick={()=>setSelected([])}>Cancel</button>
          <button className="btn-primary"
            style={{ opacity: balanced&&selected.length>0?1:0.7 }}
            onClick={()=>{ if(balanced&&selected.length>0) onReconcile(); }}>
            Reconcile
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE PANEL ─────────────────────────────────────────────────────────────
function CreatePanel({ line, bankRule, onDismissRule, onReconcile }) {
  const [who,  setWho]  = useState(bankRule?.contact || "");
  const [what, setWhat] = useState("");
  const [why,  setWhy]  = useState("");
  const [tax,  setTax]  = useState("");
  const [contactEdited, setContactEdited] = useState(false);

  if (bankRule && !contactEdited) {
    return (
      <div className="rule-panel">
        <div className="rule-grid">
          <div>
            <div className="rule-label">Apply rule</div>
            <div className="rule-val">{bankRule.name}</div>
          </div>
          <div>
            <div className="rule-label">Contact name</div>
            <div className="rule-val">
              <input defaultValue={bankRule.contact} className="xi"
                style={{ height:32,color:C.blue,fontWeight:700 }}/>
            </div>
          </div>
        </div>
        <div className="rule-actions">
          <button className="btn-link" style={{ fontSize:12 }}>Edit rule</button>
          <button className="btn-link" style={{ fontSize:12 }} onClick={onDismissRule}>Don't apply rule</button>
          <button className="btn-link" style={{ fontSize:12,marginLeft:"auto" }}>View details</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:"12px 14px 14px" }}>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }} className="col2-form">
          <div>
            <div style={{ fontSize:12,fontWeight:600,color:C.gray700,marginBottom:4 }}>Who</div>
            <input className="xi" placeholder="Name of the contact…"
              value={who} onChange={e=>{ setWho(e.target.value); setContactEdited(true); }} />
          </div>
          <div>
            <div style={{ fontSize:12,fontWeight:600,color:C.gray700,marginBottom:4 }}>What</div>
            <select className="xs" value={what} onChange={e=>setWhat(e.target.value)}>
              <option value="">Choose the account…</option>
              {ACCOUNTS.map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div style={{ fontSize:12,fontWeight:600,color:C.gray700,marginBottom:4 }}>Why</div>
          <input className="xi" placeholder="Enter a description…"
            value={why} onChange={e=>setWhy(e.target.value)} />
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }} className="col2-form">
          <div>
            <div style={{ fontSize:12,fontWeight:600,color:C.gray700,marginBottom:4 }}>Region</div>
            <select className="xs">
              <option>-</option><option>AU</option><option>NZ</option><option>UK</option><option>US</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:12,fontWeight:600,color:C.gray700,marginBottom:4 }}>Tax Rate</div>
            <select className="xs" value={tax} onChange={e=>setTax(e.target.value)}>
              <option value="">-</option>
              {TAX_RATES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginTop:2 }}>
          <button className="btn-link" style={{ fontSize:12 }}>Add details</button>
          <button className="btn-link" style={{ fontSize:12 }}>+ Add bank rule</button>
        </div>
      </div>
    </div>
  );
}

// ─── DISCUSS PANEL ────────────────────────────────────────────────────────────
function DiscussPanel({ line, onReconcile, toast }) {
  const [note, setNote] = useState(
    line.id==="sl4" ? "This is for a really old invoice, wasn't sure how to code it." : ""
  );
  return (
    <div style={{ padding:"12px 14px 14px" }}>
      <textarea className="xta" rows={5} value={note} onChange={e=>setNote(e.target.value)}
        placeholder="Add a note or question for your team…"/>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6 }}>
        <span style={{ fontSize:11,color:C.gray500 }}>Ctrl + S at any time to save</span>
        <div style={{ display:"flex",gap:8 }}>
          <button className="btn-outline">Assign to colleague</button>
          <button className="btn-primary" onClick={()=>toast("Note saved.","ok")}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── TRANSFER PANEL ───────────────────────────────────────────────────────────
function TransferPanel({ line, onReconcile }) {
  const [acct, setAcct] = useState("");
  const [ref,  setRef]  = useState("");
  return (
    <div style={{ padding:"12px 14px 14px" }}>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <div>
          <div style={{ fontSize:12,fontWeight:600,color:C.gray700,marginBottom:4 }}>Transfer to account</div>
          <select className="xs" style={{ maxWidth:320 }} value={acct} onChange={e=>setAcct(e.target.value)}>
            <option value="">Select bank account…</option>
            {BANK_ACCTS.map(a=><option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:12,fontWeight:600,color:C.gray700,marginBottom:4 }}>Reference</div>
          <input className="xi" style={{ maxWidth:320 }} placeholder="Enter a reference…"
            value={ref} onChange={e=>setRef(e.target.value)} />
        </div>
        <div style={{ display:"flex",justifyContent:"flex-end",gap:8,marginTop:4 }}>
          <button className="btn-outline">Cancel</button>
          <button className="btn-primary" onClick={()=>{ if(acct) onReconcile(); }}>Reconcile</button>
        </div>
      </div>
    </div>
  );
}

// ─── STATEMENT LINE CARD ──────────────────────────────────────────────────────
function StatementLineCard({ line, compact, onReconcile, toast }) {
  const [activeTab,  setActiveTab]  = useState(line.activeTab);
  const [bankRule,   setBankRule]   = useState(line.bankRule);
  const [reconciled, setReconciled] = useState(false);

  const hasSuggested = !!(SUGGESTED_MATCHES[line.id]?.length);
  // Green OK when on Match tab and there's a suggested match
  const okGreen = activeTab === "match" && hasSuggested;

  const doReconcile = () => {
    setReconciled(true);
    onReconcile(line.id);
    toast(`✓ Reconciled: ${line.payee}`, "ok");
  };

  if (reconciled) return null;

  const TABS = [
    { k:"match",    l:"Match" },
    { k:"create",   l:"Create" },
    { k:"transfer", l:"Transfer" },
    { k:`discuss`,  l:`Discuss${line.id==="sl4" ? " *" : ""}` },
  ];

  return (
    <div className="sl-row">

      {/* ══════════════════════════════════════════
          LEFT PANEL  — bank statement line info
          Layout inside: [info text] [Spent col] [Received col]
          Mirrors the Xero screenshot exactly.
      ══════════════════════════════════════════ */}
      <div className="sl-left">
        {/* Options button row */}
        <div style={{
          display:"flex", justifyContent:"flex-end",
          padding:"8px 10px 0", borderBottom:`1px solid ${C.rowBorder}`
        }}>
          <OptionsMenu
            items={["Edit","Delete","Split transaction","Mark as reconciled","Create bank rule"]}
            onSelect={item => toast(item, "ok")}
          />
        </div>

        {/* Inner 3-column grid: [info | Spent | Received] */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 90px 90px",
          flex:1, minWidth:0
        }}>
          {/* Info: date / payee / ref / more details */}
          <div style={{ padding:"10px 12px 12px" }}>
            <div style={{ fontSize:12, color:C.gray500, marginBottom:2 }}>{line.date}</div>
            <div style={{ fontSize:13, fontWeight:700, marginBottom: line.ref ? 2 : 0 }}>{line.payee}</div>
            {line.ref && (
              <div style={{ fontSize:12, color:C.gray500, marginBottom:4 }}>{line.ref}</div>
            )}
            <button className="btn-link" style={{ fontSize:12, marginTop:6, display:"block" }}
              onClick={() => toast("More details", "ok")}>
              More details
            </button>
          </div>

          {/* Spent column */}
          <div style={{
            borderLeft:`1px solid ${C.rowBorder}`,
            padding:"10px 12px 12px",
            display:"flex", flexDirection:"column", justifyContent:"flex-start"
          }}>
            <div style={{ fontSize:11, color:C.gray500, fontWeight:400, marginBottom:6, textAlign:"right" }}>
              Spent
            </div>
            <div style={{ fontSize:14, fontWeight:700, color: line.spent ? "#1a1a1a" : "transparent", textAlign:"right" }}>
              {line.spent || "0.00"}
            </div>
          </div>

          {/* Received column */}
          <div style={{
            borderLeft:`1px solid ${C.rowBorder}`,
            padding:"10px 12px 12px",
            display:"flex", flexDirection:"column", justifyContent:"flex-start"
          }}>
            <div style={{ fontSize:11, color:C.gray500, fontWeight:400, marginBottom:6, textAlign:"right" }}>
              Received
            </div>
            <div style={{ fontSize:14, fontWeight:700, color: line.received ? "#1a1a1a" : "transparent", textAlign:"right" }}>
              {line.received || "0.00"}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CENTER — OK button (vertically + horizontally centered)
      ══════════════════════════════════════════ */}
      <div className="sl-ok-col">
        <button
          className={`btn-ok${okGreen ? " matched" : ""}`}
          title="Reconcile this transaction"
          onClick={doReconcile}
        >
          OK
        </button>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — Xero action area
          Tabs row: Options (blue link) | Match | Create | Transfer | Discuss | Find & Match
      ══════════════════════════════════════════ */}
      <div className="sl-right">

        {/* Tab bar — mirrors screenshot exactly */}
        <div style={{
          display:"flex", alignItems:"center",
          borderBottom:`1px solid ${C.gray200}`,
          paddingLeft:4, paddingRight:12,
          overflowX:"auto"
        }}>
          {/* Options link on far-left of right panel */}
          <div style={{ paddingRight:8, borderRight:`1px solid ${C.gray200}`, marginRight:4 }}>
            <button className="btn-link"
              style={{ fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:4, padding:"8px 8px" }}>
              <span style={{ color:C.blue }}>Options</span>
              <Chev size={9} color={C.blue}/>
            </button>
          </div>

          {TABS.map(t => (
            <button key={t.k}
              className={`inner-tab${activeTab === t.k ? " on" : ""}`}
              onClick={() => setActiveTab(t.k)}>
              {t.l}
            </button>
          ))}

          <button className="btn-link"
            style={{ marginLeft:"auto", fontSize:13, fontWeight:700, whiteSpace:"nowrap", padding:"8px 4px" }}
            onClick={() => setActiveTab("match")}>
            Find &amp; Match
          </button>
        </div>

        {/* Tab content panels */}
        {activeTab === "match"    && (
          <MatchPanel line={line} onReconcile={doReconcile} />
        )}
        {activeTab === "create"   && (
          <CreatePanel line={line} bankRule={bankRule}
            onDismissRule={() => setBankRule(null)}
            onReconcile={doReconcile} />
        )}
        {activeTab === "transfer" && (
          <TransferPanel line={line} onReconcile={doReconcile} />
        )}
        {activeTab === "discuss"  && (
          <DiscussPanel line={line} onReconcile={doReconcile} toast={toast} />
        )}
      </div>
    </div>
  );
}

// ─── CASH CODING TAB ──────────────────────────────────────────────────────────
function CashCodingTab({ doneIds, setDoneIds, toast }) {
  const active = STATEMENT_LINES.filter(t=>!doneIds.includes(t.id));
  const [rows, setRows] = useState(active.map(t=>({ ...t, selected:false, who:"", what:"", why:"", tax:"" })));
  const upd  = (id,p) => setRows(prev=>prev.map(r=>r.id===id?{...r,...p}:r));
  const sel  = rows.filter(r=>r.selected).length;

  const save = () => {
    const s = rows.filter(r=>r.selected && r.what);
    if (!s.length) { toast("Select rows and choose an account first.","err"); return; }
    setDoneIds(p=>[...p,...s.map(r=>r.id)]);
    toast(`${s.length} transaction${s.length!==1?"s":""} reconciled.`,"ok");
  };

  const filtered = rows.filter(r=>!doneIds.includes(r.id));

  return (
    <div style={{ padding:"14px 16px" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
        marginBottom:12,gap:10,flexWrap:"wrap" }}>
        <p style={{ fontSize:13,color:C.gray700 }}>
          Code multiple transactions quickly, then click <strong>Save &amp; Reconcile Selected</strong>.
        </p>
        <button className="btn-primary" style={{ height:32,padding:"0 16px" }} onClick={save}>
          Save &amp; Reconcile Selected ({sel})
        </button>
      </div>
      <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:4 }}>
        <ScrollArea style={{ width:"100%" }}>
          <table className="xtbl" style={{ minWidth:900 }}>
            <thead>
              <tr>
                <th style={{ width:36,textAlign:"center" }}>
                  <input type="checkbox"
                    onChange={e=>setRows(p=>p.map(r=>({...r,selected:e.target.checked})))} />
                </th>
                <th>Date</th><th>Payee</th><th>Reference</th>
                <th style={{ textAlign:"right",color:C.red }}>Spent</th>
                <th style={{ textAlign:"right",color:"#388e3c" }}>Received</th>
                <th>Who (Contact)</th>
                <th style={{ minWidth:180 }}>What (Account)</th>
                <th>Description</th>
                <th style={{ minWidth:150 }}>Tax Rate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id} style={{ background:r.selected?"#e8f4fd":"#fff" }}>
                  <td style={{ textAlign:"center" }}>
                    <input type="checkbox" checked={!!r.selected}
                      onChange={e=>upd(r.id,{selected:e.target.checked})} />
                  </td>
                  <td style={{ whiteSpace:"nowrap",color:C.gray500 }}>{r.date}</td>
                  <td style={{ fontWeight:600 }}>{r.payee}</td>
                  <td style={{ color:C.gray500 }}>{r.ref}</td>
                  <td style={{ textAlign:"right",color:C.red,fontWeight:600 }}>{r.spent}</td>
                  <td style={{ textAlign:"right",color:"#388e3c",fontWeight:600 }}>{r.received}</td>
                  <td>
                    <input className="xi" style={{ width:120,height:26 }} value={r.who}
                      onChange={e=>upd(r.id,{who:e.target.value})} placeholder="Contact…"/>
                  </td>
                  <td>
                    <select className="xs" style={{ height:26 }} value={r.what}
                      onChange={e=>upd(r.id,{what:e.target.value})}>
                      <option value="">Choose account…</option>
                      {ACCOUNTS.map(a=><option key={a}>{a}</option>)}
                    </select>
                  </td>
                  <td>
                    <input className="xi" style={{ width:130,height:26 }} value={r.why}
                      onChange={e=>upd(r.id,{why:e.target.value})} placeholder="Description…"/>
                  </td>
                  <td>
                    <select className="xs" style={{ height:26 }} value={r.tax}
                      onChange={e=>upd(r.id,{tax:e.target.value})}>
                      <option value="">-</option>
                      {TAX_RATES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><td colSpan={10} style={{ textAlign:"center",padding:24,color:C.gray500 }}>
                  All transactions reconciled.
                </td></tr>
              )}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal"/>
        </ScrollArea>
      </div>
    </div>
  );
}

// ─── BANK STATEMENTS TAB ─────────────────────────────────────────────────────
function BankStatementsTab({ doneIds }) {
  const [q, setQ] = useState("");
  const rows = STATEMENT_LINES.filter(t=>
    !q || t.payee.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div style={{ padding:"14px 16px" }}>
      <div style={{ display:"flex",gap:8,marginBottom:12,flexWrap:"wrap" }}>
        <input className="xi" style={{ maxWidth:320 }} placeholder="Search statement lines…"
          value={q} onChange={e=>setQ(e.target.value)} />
        <div style={{ marginLeft:"auto",display:"flex",gap:8 }}>
          <button className="btn-outline">Import a statement</button>
          <button className="btn-outline">Export</button>
        </div>
      </div>
      <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:4 }}>
        <ScrollArea style={{ width:"100%" }}>
          <table className="xtbl" style={{ minWidth:680 }}>
            <thead>
              <tr>
                <th>Date</th><th>Payee / Description</th><th>Reference</th>
                <th style={{ textAlign:"right" }}>Spent</th>
                <th style={{ textAlign:"right" }}>Received</th>
                <th>Source</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t=>(
                <tr key={t.id}>
                  <td style={{ whiteSpace:"nowrap",color:C.gray500 }}>{t.date}</td>
                  <td style={{ fontWeight:600 }}>{t.payee}</td>
                  <td style={{ color:C.gray500 }}>{t.ref||"—"}</td>
                  <td style={{ textAlign:"right",color:C.red,fontWeight:600 }}>{t.spent}</td>
                  <td style={{ textAlign:"right",color:"#388e3c",fontWeight:600 }}>{t.received}</td>
                  <td style={{ fontSize:12,color:C.gray500 }}>Bank Feed</td>
                  <td>
                    <span className={`badge ${doneIds.includes(t.id)?"badge-recon":"badge-unrecon"}`}>
                      {doneIds.includes(t.id)?"Reconciled":"Unreconciled"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal"/>
        </ScrollArea>
      </div>
    </div>
  );
}

// ─── ACCOUNT TRANSACTIONS TAB ─────────────────────────────────────────────────
function AccountTransactionsTab({ doneIds }) {
  const [typeF, setTypeF] = useState("");
  const [dateF, setDateF] = useState("this-month");
  return (
    <div style={{ padding:"14px 16px" }}>
      <div style={{ display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center" }}>
        <input className="xi" style={{ maxWidth:260 }} placeholder="Search transactions…" />
        <select className="xs" style={{ width:160 }} value={typeF} onChange={e=>setTypeF(e.target.value)}>
          <option value="">All types</option>
          <option value="spend">Spend Money</option>
          <option value="receive">Receive Money</option>
          <option value="transfer">Transfer</option>
        </select>
        <select className="xs" style={{ width:150 }} value={dateF} onChange={e=>setDateF(e.target.value)}>
          <option value="this-month">This month</option>
          <option value="last-month">Last month</option>
          <option value="this-quarter">This quarter</option>
          <option value="this-year">This year</option>
        </select>
        <div style={{ marginLeft:"auto",display:"flex",gap:8 }}>
          <button className="btn-outline">Export CSV</button>
          <button className="btn-outline">Print</button>
        </div>
      </div>
      <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:4 }}>
        <ScrollArea style={{ width:"100%" }}>
          <table className="xtbl" style={{ minWidth:760 }}>
            <thead>
              <tr>
                <th>Date</th><th>Description</th><th>Reference</th><th>Account (What)</th>
                <th style={{ textAlign:"right" }}>Debit</th>
                <th style={{ textAlign:"right" }}>Credit</th>
                <th>Source</th>
                <th style={{ textAlign:"center" }}>Reconciled</th>
              </tr>
            </thead>
            <tbody>
              {STATEMENT_LINES.map(t=>(
                <tr key={t.id}>
                  <td style={{ whiteSpace:"nowrap",color:C.gray500 }}>{t.date}</td>
                  <td style={{ fontWeight:600 }}>{t.payee}</td>
                  <td style={{ color:C.gray500 }}>{t.ref||"—"}</td>
                  <td style={{ color:C.blue }}>—</td>
                  <td style={{ textAlign:"right",color:C.red }}>{t.spent}</td>
                  <td style={{ textAlign:"right",color:"#388e3c" }}>{t.received}</td>
                  <td style={{ fontSize:12,color:C.gray500 }}>Bank Feed</td>
                  <td style={{ textAlign:"center" }}>
                    {doneIds.includes(t.id)
                      ? <span style={{ color:"#388e3c",fontWeight:700,fontSize:15 }}>✓</span>
                      : <span style={{ color:C.gray300 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal"/>
        </ScrollArea>
      </div>
    </div>
  );
}

// ─── RECONCILE PERIOD TAB ─────────────────────────────────────────────────────
function ReconcilePeriodTab({ pendingCount }) {
  const [endDate,  setEndDate]  = useState("2026-03-31");
  const [stmtBal,  setStmtBal]  = useState("8315.64");
  const xBal = 7933.04;
  const diff = parseFloat(stmtBal||0) - xBal;

  return (
    <div style={{ padding:"14px 16px" }}>
      <div style={{ maxWidth:560 }}>
        <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:4,padding:"20px 24px" }}>
          <h2 style={{ fontSize:16,fontWeight:700,marginBottom:8,color:C.gray900 }}>Reconcile for a period</h2>
          <p style={{ fontSize:13,color:C.gray500,marginBottom:20,lineHeight:1.6 }}>
            Mark all transactions up to a specified end date as reconciled. This locks the period and prevents editing of historical records.
          </p>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12,fontWeight:600,color:C.gray700,marginBottom:4 }}>End date</div>
            <input type="date" className="xi" value={endDate}
              onChange={e=>setEndDate(e.target.value)} style={{ width:180 }} />
          </div>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:12,fontWeight:600,color:C.gray700,marginBottom:4 }}>Statement ending balance</div>
            <input type="number" className="xi" value={stmtBal}
              onChange={e=>setStmtBal(e.target.value)} style={{ width:180 }} />
          </div>
          <div style={{ background:C.gray50,border:`1px solid ${C.gray200}`,borderRadius:3,
            padding:"12px 16px",marginBottom:16 }}>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6 }}>
              <span style={{ color:C.gray700 }}>Statement balance</span>
              <span style={{ fontWeight:600 }}>{parseFloat(stmtBal||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:10 }}>
              <span style={{ color:C.gray700 }}>Balance in Xero</span>
              <span style={{ fontWeight:600 }}>{fmt(xBal)}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,
              borderTop:`1px solid ${C.gray200}`,paddingTop:10,fontWeight:700 }}>
              <span>Difference</span>
              <span style={{ color: Math.abs(diff)<0.01 ? "#388e3c" : C.red }}>
                {diff>=0?"+":""}{diff.toLocaleString("en-AU",{minimumFractionDigits:2})}
              </span>
            </div>
          </div>
          {pendingCount>0 && (
            <div style={{ fontSize:12,color:C.red,marginBottom:14,padding:"8px 12px",
              background:"#fce8e6",border:"1px solid #f5c2c7",borderRadius:3 }}>
              ⚠ {pendingCount} transaction{pendingCount!==1?"s":""} still unreconciled in this period.
            </div>
          )}
          <div style={{ display:"flex",gap:8 }}>
            <button className="btn-primary" style={{ height:32,padding:"0 18px" }}>Reconcile Period</button>
            <button className="btn-outline">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────
export default function BankReconciliationPage() {
  const [mainTab,   setMainTab]   = useState("reconcile");
  const [compact,   setCompact]   = useState(false);
  const [search,    setSearch]    = useState("");
  const [banner,    setBanner]    = useState(true);
  const [filterOpen,setFilterOpen]= useState(false);
  const [doneIds,   setDoneIds]   = useState([]);
  const [toast,     setToast]     = useState(null);

  const T = (msg, type="ok") => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3000);
  };

  const reconcileOne = id => setDoneIds(p=>[...p, id]);

  const pending = STATEMENT_LINES.filter(t=>!doneIds.includes(t.id));
  const filtered = pending.filter(t=>
    !search ||
    t.payee.toLowerCase().includes(search.toLowerCase()) ||
    String(t.ref||"").toLowerCase().includes(search.toLowerCase())
  );

  const NAV_TABS = [
    { k:"reconcile",   l:"Reconcile",            badge:pending.length },
    { k:"cashcoding",  l:"Cash coding" },
    { k:"statements",  l:"Bank statements" },
    { k:"account",     l:"Account transactions" },
    { k:"period",      l:"Reconcile period" },
  ];

  return (
    <div className="xpage" onClick={()=>setFilterOpen(false)}>
      <style>{CSS}</style>

      {toast && <Toast msg={toast.msg} type={toast.type}/>}

      {/* ════ FIXED HEADER ════ */}
      <div className="xpage-hdr">
        {/* Account title bar */}
        <div style={{ background:"#fff",borderBottom:`1px solid ${C.gray200}`,padding:"10px 16px 0" }}>
          <div style={{ fontSize:12,color:C.blue,marginBottom:6,cursor:"pointer" }}>Bank Accounts</div>
          <div className="hdr-title-row" style={{ display:"flex",alignItems:"center",
            justifyContent:"space-between",gap:10,marginBottom:10 }}>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ fontWeight:700,fontSize:20 }}>
                Business Bank Account <span style={{ fontWeight:400 }}>090-8007-006543</span>
              </span>
              <button style={{ background:"none",border:"none",color:C.gray700,fontSize:14 }}>▾</button>
            </div>
            <div className="hdr-btns" style={{ display:"flex",alignItems:"center",gap:8 }}>
              <button className="btn-xero" style={{ padding:"7px 16px" }}>Reconciliation Report</button>
              <button className="btn-outline" style={{ display:"flex",alignItems:"center",gap:6 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#374151" strokeWidth="1.3"/>
                  <path d="M8 5v3l2 2" stroke="#374151" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Auto-reconcile
                <span style={{ background:"#1a6496",color:"#fff",borderRadius:2,
                  padding:"1px 8px",fontSize:11,fontWeight:700 }}>ON</span>
              </button>
              <button className="btn-outline">Manage Account ▾</button>
            </div>
          </div>
          <div className="bal-row" style={{ display:"flex",gap:32,paddingBottom:12,alignItems:"flex-end" }}>
            <div>
              <div style={{ fontSize:28,fontWeight:700,letterSpacing:"-0.5px",lineHeight:1 }}>8,315.64</div>
              <div style={{ fontSize:12,color:C.gray500,marginTop:2 }}>Statement Balance</div>
            </div>
            <div>
              <div style={{ fontSize:28,fontWeight:700,letterSpacing:"-0.5px",lineHeight:1 }}>7,933.04</div>
              <div style={{ fontSize:12,color:C.gray500,marginTop:2 }}>
                Balance in Xero —&nbsp;
                <span style={{ color:C.blue,cursor:"pointer",textDecoration:"underline" }}>Different balances?</span>
              </div>
            </div>
            <div style={{ marginLeft:"auto",fontSize:12,color:C.blue,cursor:"pointer",
              textDecoration:"underline",paddingBottom:3 }}>What's this?</div>
          </div>
        </div>

        {/* Auto-recon banner */}
        {banner && (
          <div style={{ background:C.blueBg,borderTop:`1px solid ${C.blueBorder}`,
            padding:"9px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7.5" stroke={C.blue} strokeWidth="1"/>
              <path d="M8 7v5M8 5h.01" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize:12,color:"#1a4a6b",flex:1 }}>
              Auto-reconciliation starts soon — 0 statement lines auto-reconciled so far. We'll start reconciling high-confidence statement lines as soon as the next batch arrives.
            </span>
            <button className="btn-xero" style={{ fontSize:12,padding:"5px 14px",whiteSpace:"nowrap" }}>
              View all Reconciled
            </button>
            <button onClick={()=>setBanner(false)}
              style={{ background:"none",border:"none",fontSize:20,color:C.gray500 }}>×</button>
          </div>
        )}

        {/* Search bar */}
        <div style={{ background:"#fff",borderTop:`1px solid ${C.gray200}`,
          borderBottom:`1px solid ${C.gray200}`,padding:"8px 16px",
          display:"flex",gap:8,alignItems:"center" }}>
          <div style={{ flex:1,position:"relative" }}>
            <span style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",
              color:C.gray500,fontSize:14 }}>🔍</span>
            <input className="xi" style={{ paddingLeft:32 }}
              placeholder="Search for Payee, Amount, Reference, Description, Cheque No., or Analysis Code"
              value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div style={{ position:"relative" }}>
            <button className="btn-outline"
              style={{ display:"flex",alignItems:"center",gap:6 }}
              onClick={e=>{ e.stopPropagation(); setFilterOpen(v=>!v); }}>
              <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                <path d="M0 1h14M3 6h8M5 11h4" stroke={C.gray500} strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Filter
            </button>
            {filterOpen && (
              <div style={{ position:"absolute",top:"calc(100%+4px)",right:0,zIndex:300,
                background:"#fff",border:`1px solid ${C.gray200}`,borderRadius:4,
                boxShadow:"0 6px 20px rgba(0,0,0,.12)",padding:"10px 14px",minWidth:220 }}
                onClick={e=>e.stopPropagation()}>
                <div style={{ fontSize:12,fontWeight:700,marginBottom:8 }}>Filter transactions</div>
                {["Unreconciled only","Show foreign currency","Hide zero amounts"].map((f,i)=>(
                  <label key={i} style={{ display:"flex",alignItems:"center",gap:8,
                    fontSize:12,cursor:"pointer",padding:"5px 0" }}>
                    <input type="checkbox" style={{ accentColor:C.blue,width:13,height:13 }}/>
                    {f}
                  </label>
                ))}
                <div style={{ marginTop:10,display:"flex",justifyContent:"flex-end" }}>
                  <button className="btn-xero" style={{ height:26,padding:"0 14px" }}
                    onClick={()=>setFilterOpen(false)}>Apply</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main nav tabs */}
        <div style={{ background:"#fff",borderBottom:`1px solid ${C.gray200}`,
          display:"flex",alignItems:"center",paddingLeft:4,overflowX:"auto" }}>
          {NAV_TABS.map(t=>(
            <button key={t.k} className={`nav-tab${mainTab===t.k?" on":""}`}
              onClick={()=>setMainTab(t.k)}>
              {t.l}
              {t.badge!=null && (
                <span style={{ marginLeft:5,background:mainTab===t.k?C.blue:C.gray200,
                  color:mainTab===t.k?"#fff":C.gray700,fontSize:10,fontWeight:700,
                  padding:"1px 6px",borderRadius:10 }}>{t.badge}</span>
              )}
            </button>
          ))}
          {mainTab==="reconcile" && (
            <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:8,
              paddingRight:16,flexShrink:0 }}>
              <span style={{ fontSize:12,color:C.gray500,whiteSpace:"nowrap" }}>Compact view</span>
              <div onClick={()=>setCompact(!compact)}
                style={{ width:40,height:22,borderRadius:11,
                  background:compact?C.blue:C.gray300,cursor:"pointer",
                  position:"relative",transition:"background .2s",flexShrink:0 }}>
                <div style={{ width:18,height:18,borderRadius:"50%",background:"#fff",
                  position:"absolute",top:2,left:compact?20:2,transition:"left .2s",
                  boxShadow:"0 1px 3px rgba(0,0,0,.25)" }}/>
              </div>
            </div>
          )}
        </div>

        {/* "What's this?" helper row — only on reconcile tab */}
        {mainTab==="reconcile" && (
          <div style={{ background:C.blueBg,borderBottom:`1px solid ${C.blueBorder}`,
            padding:"5px 16px",display:"flex",alignItems:"center",
            justifyContent:"space-between",flexWrap:"wrap",gap:8 }}>
            <button className="btn-link" style={{ fontSize:12,fontWeight:700 }}>What's this?</button>
            <div style={{ display:"flex",gap:48,fontSize:12,color:C.gray500 }} className="hide-mobile">
              <span>Review your bank statement lines...</span>
              <span>...then match with your transactions in Xero</span>
            </div>
          </div>
        )}
      </div>

      {/* ════ SCROLLABLE BODY ════ */}
      <div className="xpage-body">
        <ScrollArea className="h-full w-full">

          {/* RECONCILE TAB */}
          {mainTab==="reconcile" && (
            <div style={{ padding:"12px 16px 32px" }}>
              {filtered.length===0 ? (
                <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:4,
                  padding:"48px 20px",textAlign:"center" }}>
                  <div style={{ fontSize:36,marginBottom:12 }}>✓</div>
                  <div style={{ fontWeight:700,fontSize:16,marginBottom:6,color:C.gray700 }}>All up to date</div>
                  <div style={{ fontSize:13,color:C.gray500 }}>All transactions have been reconciled.</div>
                </div>
              ) : (
                filtered.map(line=>(
                  <StatementLineCard
                    key={line.id}
                    line={line}
                    compact={compact}
                    onReconcile={reconcileOne}
                    toast={T}
                  />
                ))
              )}
              {doneIds.length>0 && (
                <div style={{ textAlign:"center",padding:"10px 0",fontSize:12,color:C.gray500 }}>
                  {doneIds.length} transaction{doneIds.length!==1?"s":""} reconciled this session
                </div>
              )}
            </div>
          )}

          {mainTab==="cashcoding"  && <CashCodingTab          doneIds={doneIds} setDoneIds={setDoneIds} toast={T}/>}
          {mainTab==="statements"  && <BankStatementsTab       doneIds={doneIds}/>}
          {mainTab==="account"     && <AccountTransactionsTab  doneIds={doneIds}/>}
          {mainTab==="period"      && <ReconcilePeriodTab      pendingCount={pending.length}/>}

          <ScrollBar orientation="vertical"/>
        </ScrollArea>
      </div>
    </div>
  );
}
