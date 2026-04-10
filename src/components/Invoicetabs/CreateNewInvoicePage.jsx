import { useState, useRef, useCallback } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────
const ACCOUNTS = [
  "Sales (200)","Other Revenue (260)","Interest Income (270)",
  "Cost of Goods Sold (310)","Advertising (400)","Bank Fees (404)",
  "Cleaning (408)","Consulting & Accounting (412)","Depreciation (416)",
  "Entertainment (420)","Freight & Courier (424)","General Expenses (428)",
  "Insurance (432)","Interest Expense (436)","Legal Expenses (440)",
  "Office Expenses (452)","Printing & Stationery (456)","Rent (464)",
  "Repairs and Maintenance (468)","Salaries (472)","Wages (490)",
];
const TAX_OPTIONS = [
  { label:"No Tax",          rate:0    },
  { label:"Tax Exempt (0%)", rate:0    },
  { label:"BAS Excluded",    rate:0    },
  { label:"15% VAT",         rate:0.15 },
  { label:"20% Standard",    rate:0.20 },
  { label:"GST (10%)",       rate:0.10 },
];
const CURRENCIES  = ["United Arab Emirates Dirham (AED)","Australian Dollar (AUD)","US Dollar (USD)","British Pound (GBP)","Euro (EUR)"];
const AMOUNTS_ARE = ["Tax exclusive","Tax inclusive","No Tax"];
const BRANDING    = ["Standard","Modern","Classic","Minimal"];

const ALL_COLS = [
  { key:"desc",      label:"Description"  },
  { key:"disc",      label:"Discount"     },
  { key:"account",   label:"Account"      },
  { key:"taxRate",   label:"Tax rate"     },
  { key:"taxAmount", label:"Tax amount"   },
  { key:"project",   label:"Project"      },
];

const emptyRow  = () => ({ id:Math.random().toString(36).slice(2), item:"", desc:"", qty:"", price:"", disc:"", account:"", taxRate:"", project:"" });
const n         = v  => parseFloat(String(v||"0").replace(/,/g,"")) || 0;
const fmt       = v  => isNaN(v)||v===""?"":Number(v).toFixed(2);
const taxRateOf = lbl => (TAX_OPTIONS.find(t=>t.label===lbl)||{rate:0}).rate;

// ── Description cell — collapsed shows one-line truncated, expanded overlays ──
function DescCell({ value, onChange }) {
  const [open, setOpen]   = useState(false);
  const taRef             = useRef(null);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => { taRef.current?.focus(); taRef.current?.select(); }, 0);
  };

  const handleBlur = (e) => {
    // only close if focus leaves the textarea itself
    if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
  };

  return (
    <div style={{ position:"relative", width:"100%", height:"100%" }} onBlur={handleBlur}>
      {/* Collapsed view — one line + ellipsis, click to open */}
      {!open && (
        <div
          onClick={handleOpen}
          title={value||""}
          style={{
            height:"100%", display:"flex", alignItems:"center",
            padding:"0 8px", cursor:"text", fontSize:13, color: value?"#1a1a2e":"#9ca3af",
            overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
            userSelect:"none",
          }}
        >
          {value || ""}
        </div>
      )}

      {/* Expanded textarea — absolutely positioned to overlay rows below */}
      {open && (
        <div
          style={{
            position:"absolute", top:0, left:0, zIndex:500,
            width:"100%", minWidth:260,
            background:"#fff",
            border:"2px solid #1a6496",
            borderRadius:4,
            boxShadow:"0 8px 24px rgba(26,100,150,.18)",
          }}
        >
          <textarea
            ref={taRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={4}
            style={{
              display:"block", width:"100%", minHeight:90,
              border:"none", outline:"none", resize:"vertical",
              fontSize:13, lineHeight:"20px", color:"#1a1a2e",
              padding:"8px", boxSizing:"border-box",
              background:"transparent",
            }}
            onKeyDown={e => { if(e.key==="Escape") setOpen(false); }}
          />
          <div style={{ padding:"4px 8px 6px", display:"flex", justifyContent:"flex-end" }}>
            <button
              onMouseDown={e => { e.preventDefault(); setOpen(false); }}
              style={{ height:22, padding:"0 10px", border:"none", borderRadius:3, background:"#1a6496", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline select ─────────────────────────────────────────────────────────────
function CellSelect({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width:"100%", height:"100%", border:"none", background:"transparent", fontSize:13, color:value?"#1a1a2e":"#9ca3af", cursor:"pointer", outline:"none", padding:"0 6px" }}
      onFocus={e  => e.target.style.outline="1px solid #1a6496"}
      onBlur={e   => e.target.style.outline="none"}>
      <option value="">{placeholder||"—"}</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ── Inline text input (uniform style for all plain cells) ─────────────────────
function CellInput({ value, onChange, align="left", placeholder="" }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width:"100%", height:"100%",
        border:"1px solid transparent", borderRadius:2,
        background:"transparent", fontSize:13, color:"#1a1a2e",
        outline:"none", padding:"0 6px",
        textAlign:align, boxSizing:"border-box",
        lineHeight:"normal", verticalAlign:"middle",
      }}
      onFocus={e  => e.target.style.border="1px solid #1a6496"}
      onBlur={e   => e.target.style.border="1px solid transparent"}
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewInvoicePage({ onNavigate }) {
  const today = new Date().toISOString().slice(0,10);

  const [contact,    setContact]    = useState("");
  const [issueDate,  setIssueDate]  = useState(today);
  const [dueDate,    setDueDate]    = useState("");
  const [invoiceNum, setInvoiceNum] = useState("INV-0001");
  const [reference,  setReference]  = useState("");
  const [branding,   setBranding]   = useState("Standard");
  const [currency,   setCurrency]   = useState("United Arab Emirates Dirham (AED)");
  const [amountsAre, setAmountsAre] = useState("Tax exclusive");

  const [rows,       setRows]       = useState([emptyRow(), emptyRow()]);

  const [visibleCols, setVisibleCols] = useState(() => Object.fromEntries(ALL_COLS.map(c=>[c.key,true])));
  const [colsOpen,    setColsOpen]    = useState(false);
  const [addRowDD,    setAddRowDD]    = useState(false);
  const [approveDD,   setApproveDD]   = useState(false);
  const [saveDD,      setSaveDD]      = useState(false);
  const [notify,      setNotify]      = useState(null);
  const fileRef = useRef(null);

  // drag
  const dragIdx  = useRef(null);
  const [overIdx,  setOverIdx]  = useState(null);
  const [dragging, setDragging] = useState(null);

  const hiddenCount = ALL_COLS.filter(c=>!visibleCols[c.key]).length;
  const vis = key => visibleCols[key];

  // totals
  const totals = (() => {
    let sub=0, tax=0;
    rows.forEach(r=>{
      const q=n(r.qty), p=n(r.price), d=n(r.disc);
      let amt=q*p; if(d>0) amt-=amt*(d/100);
      const rate=taxRateOf(r.taxRate);
      if(amountsAre==="Tax inclusive"&&rate>0){ const tp=amt*rate/(1+rate); sub+=amt-tp; tax+=tp; }
      else if(amountsAre==="Tax exclusive"&&rate>0){ sub+=amt; tax+=amt*rate; }
      else sub+=amt;
    });
    return { sub, tax, total:sub+tax };
  })();

  const lineAmt = r => { const q=n(r.qty),p=n(r.price),d=n(r.disc); let a=q*p; if(d>0)a-=a*(d/100); return fmt(a); };
  const lineTax = r => {
    const q=n(r.qty),p=n(r.price),d=n(r.disc); let a=q*p; if(d>0)a-=a*(d/100);
    const rate=taxRateOf(r.taxRate);
    if(amountsAre==="Tax inclusive"&&rate>0) return fmt(a*rate/(1+rate));
    if(amountsAre==="Tax exclusive"&&rate>0) return fmt(a*rate);
    return "";
  };

  const upd    = (id,f,v) => setRows(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const addRow = ()        => setRows(p=>[...p, emptyRow()]);
  const delRow = id        => setRows(p=>p.length>1?p.filter(r=>r.id!==id):p);

  const toast  = msg => { setNotify(msg); setTimeout(()=>setNotify(null),3000); };
  const save   = ()  => toast("✓ Invoice saved as Draft.");
  const approve= ()  => toast("✓ Invoice approved successfully.");

  // drag handlers
  const handleDragStart = (e,idx) => { dragIdx.current=idx; setDragging(idx); e.dataTransfer.effectAllowed="move"; };
  const handleDragEnter = (e,idx) => { e.preventDefault(); if(dragIdx.current!==idx) setOverIdx(idx); };
  const handleDragOver  = e        => { e.preventDefault(); e.dataTransfer.dropEffect="move"; };
  const handleDrop      = (e,idx) => {
    e.preventDefault();
    const from=dragIdx.current;
    if(from===null||from===idx) return;
    setRows(prev=>{ const next=[...prev]; const [m]=next.splice(from,1); next.splice(idx,0,m); return next; });
    dragIdx.current=null; setOverIdx(null); setDragging(null);
  };
  const handleDragEnd = () => { setDragging(null); setOverIdx(null); dragIdx.current=null; };

  const closeAll = () => { setColsOpen(false); setAddRowDD(false); setApproveDD(false); setSaveDD(false); };

  // ── Shared styles ─────────────────────────────────────────────────────────
  // Row height reduced: 36px (was 44px)
  const ROW_H = 36;

  const TH = {
    padding:"7px 8px", fontSize:12, fontWeight:600, color:"#374151",
    background:"#f9fafb", borderBottom:"1px solid #e5e7eb", borderRight:"1px solid #e5e7eb",
    whiteSpace:"nowrap", textAlign:"left", verticalAlign:"middle",
  };
  // TD: fixed height, overflow visible so desc popup can escape
  const TD = {
    padding:0,
    borderBottom:"1px solid #f0f1f3", borderRight:"1px solid #f0f1f3",
    verticalAlign:"middle", height:ROW_H, overflow:"visible",
    position:"relative",
  };

  const fL = { display:"block", fontSize:11, fontWeight:600, color:"#6b7280", marginBottom:4, textTransform:"uppercase", letterSpacing:.4 };
  const fI = { width:"100%", height:32, border:"1px solid #d1d5db", borderRadius:4, fontSize:13, paddingLeft:28, paddingRight:8, outline:"none", color:"#374151", boxSizing:"border-box" };
  const sS = { width:"100%", height:32, border:"1px solid #d1d5db", borderRadius:4, fontSize:13, padding:"0 28px 0 8px", outline:"none", color:"#374151", background:"#fff", appearance:"none", WebkitAppearance:"none", boxSizing:"border-box",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center" };

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background:"#f3f4f6", minHeight:"100vh", fontSize:13 }}
      onClick={closeAll}>

      {/* Toast */}
      {notify && (
        <div style={{ position:"fixed",top:16,right:16,zIndex:9999,background:"#1d7a3c",color:"#fff",padding:"10px 18px",borderRadius:6,fontSize:13,fontWeight:600,boxShadow:"0 4px 12px rgba(0,0,0,.15)" }}>
          {notify}
        </div>
      )}

      {/* ── Sub-header ───────────────────────────────────────────────────────── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"8px 20px 0" }}>
        <p style={{ margin:"0 0 4px", fontSize:12, color:"#6b7280" }}>
          <span style={{color:"#1a6496",cursor:"pointer"}} onClick={()=>onNavigate?.("sales-overview")}>Sales overview</span>
          <span style={{margin:"0 6px",color:"#9ca3af"}}>›</span>
          <span style={{color:"#1a6496",cursor:"pointer"}} onClick={()=>onNavigate?.("invoices")}>Invoices</span>
        </p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:8, flexWrap:"wrap", gap:8 }}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <h1 style={{margin:0,fontSize:18,fontWeight:700,color:"#111827"}}>New invoice</h1>
            <span style={{background:"#f1f5f9",color:"#64748b",border:"1px solid #e2e8f0",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:3}}>Draft</span>
            <span style={{fontSize:12,color:"#6b7280",marginLeft:4}}>Add a contact to start saving</span>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
            <button style={{height:32,padding:"0 12px",border:"1px solid #d1d5db",borderRadius:4,background:"#fff",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}
              onClick={()=>toast("Preview coming soon.")}>
              <span style={{color:"#1a6496"}}>👁</span> Preview
            </button>
            {/* Save split */}
            <div style={{display:"flex",position:"relative"}}>
              <button onClick={save} style={{height:32,padding:"0 12px",border:"1px solid #d1d5db",borderRadius:"4px 0 0 4px",background:"#fff",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer",borderRight:"1px solid #d1d5db"}}>Save &amp; close</button>
              <button onClick={()=>setSaveDD(v=>!v)} style={{height:32,width:26,border:"1px solid #d1d5db",borderLeft:"none",borderRadius:"0 4px 4px 0",background:"#fff",color:"#374151",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>▾</button>
              {saveDD && (
                <div style={{position:"absolute",top:"calc(100% + 2px)",right:0,zIndex:300,background:"#fff",border:"1px solid #e5e7eb",borderRadius:6,boxShadow:"0 8px 24px rgba(0,0,0,.1)",minWidth:160}}>
                  {["Save","Save as template"].map((l,i)=>(
                    <button key={i} onClick={()=>{setSaveDD(false);save();}} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 14px",fontSize:13,border:"none",background:"none",cursor:"pointer",borderBottom:i===0?"1px solid #f0f0f0":"none"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f5fafd"} onMouseLeave={e=>e.currentTarget.style.background="none"}>{l}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Approve split */}
            <div style={{display:"flex",position:"relative"}}>
              <button onClick={()=>toast("✓ Invoice approved & emailed.")} style={{height:32,padding:"0 12px",border:"none",borderRadius:"4px 0 0 4px",background:"#1a6496",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",borderRight:"1px solid rgba(255,255,255,.3)"}}>Approve &amp; email</button>
              <button onClick={()=>setApproveDD(v=>!v)} style={{height:32,width:26,border:"none",borderLeft:"1px solid rgba(255,255,255,.3)",borderRadius:"0 4px 4px 0",background:"#1a6496",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>▾</button>
              {approveDD && (
                <div style={{position:"absolute",top:"calc(100% + 2px)",right:0,zIndex:300,background:"#fff",border:"1px solid #e5e7eb",borderRadius:6,boxShadow:"0 8px 24px rgba(0,0,0,.1)",minWidth:200}}>
                  {["Approve","Approve & email","Approve & print"].map((l,i)=>(
                    <button key={i} onClick={()=>{setApproveDD(false);approve();}} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 14px",fontSize:13,border:"none",background:"none",cursor:"pointer",borderBottom:i<2?"1px solid #f0f0f0":"none"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f5fafd"} onMouseLeave={e=>e.currentTarget.style.background="none"}>{l}</button>
                  ))}
                </div>
              )}
            </div>
            <button style={{height:32,width:32,border:"1px solid #d1d5db",borderRadius:4,background:"#fff",color:"#374151",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>⋮</button>
          </div>
        </div>
      </div>

      {/* Payments banner */}
      <div style={{ background:"#0d2b4e", color:"#fff", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:14}}>💳</span>
          <div>
            <div style={{fontWeight:700,fontSize:13}}>86% of customers say they prefer to pay via credit and debit card</div>
            <div style={{fontSize:12,opacity:.8}}>Add online payments to your invoices. Get paid up to twice as fast.</div>
          </div>
          <div style={{display:"flex",gap:4,marginLeft:8}}>
            {["VISA","MC","AMEX","APPLE","G"].map(c=>(
              <span key={c} style={{background:"rgba(255,255,255,.15)",borderRadius:3,padding:"2px 6px",fontSize:10,fontWeight:700}}>{c}</span>
            ))}
          </div>
        </div>
        <button style={{height:30,padding:"0 14px",border:"none",borderRadius:4,background:"#1a6496",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}
          onClick={()=>toast("Online payments coming soon.")}>Add online payments</button>
      </div>

      {/* Template banner */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:6, margin:"12px 20px 0", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>Set up invoice template</span>
        <div style={{display:"flex",gap:8}}>
          <button style={{height:30,padding:"0 12px",border:"1px solid #d1d5db",borderRadius:4,background:"#fff",color:"#374151",fontSize:12,fontWeight:600,cursor:"pointer"}}>Skip for now</button>
          <button style={{height:30,padding:"0 14px",border:"none",borderRadius:4,background:"#1a6496",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Add details</button>
          <button style={{height:30,width:30,border:"1px solid #e5e7eb",borderRadius:4,background:"#fff",color:"#9ca3af",fontSize:16,cursor:"pointer"}}>×</button>
        </div>
      </div>

      {/* ── Main card ────────────────────────────────────────────────────────── */}
      <div style={{ margin:"12px 20px 20px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:6 }}>

        {/* Header fields */}
        <div style={{ padding:"16px 20px 12px", display:"grid", gap:"12px 16px", gridTemplateColumns:"repeat(6,1fr)" }}>
          <div style={{gridColumn:"1/3"}}>
            <label style={fL}>Contact</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",fontSize:14}}>👤</span>
              <input value={contact} onChange={e=>setContact(e.target.value)} style={{...fI}}
                onFocus={e=>e.target.style.borderColor="#1a6496"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
            </div>
          </div>
          {[
            { label:"Issue date", icon:"📅", val:issueDate, set:setIssueDate, type:"date" },
            { label:"Due date",   icon:"📅", val:dueDate,   set:setDueDate,   type:"date" },
          ].map(f=>(
            <div key={f.label}>
              <label style={fL}>{f.label}</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",fontSize:13}}>{f.icon}</span>
                <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} style={{...fI}}
                  onFocus={e=>e.target.style.borderColor="#1a6496"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
              </div>
            </div>
          ))}
          <div>
            <label style={fL}>Invoice number</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",fontWeight:700}}>#</span>
              <input value={invoiceNum} onChange={e=>setInvoiceNum(e.target.value)} style={{...fI}}
                onFocus={e=>e.target.style.borderColor="#1a6496"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
            </div>
          </div>
          <div>
            <label style={fL}>Reference</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",fontSize:13}}>📄</span>
              <input value={reference} onChange={e=>setReference(e.target.value)} style={{...fI}}
                onFocus={e=>e.target.style.borderColor="#1a6496"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
            </div>
          </div>
          <div>
            <label style={fL}>Branding theme</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",fontSize:13}}>🎨</span>
              <select value={branding} onChange={e=>setBranding(e.target.value)} style={{...sS,paddingLeft:28}}>
                {BRANDING.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div style={{gridColumn:"1/2"}}>
            <label style={fL}>Online payments</label>
            <button style={{height:32,padding:"0 10px",border:"1px solid #d1d5db",borderRadius:4,background:"#fff",color:"#374151",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
              Set up online payments <span style={{fontSize:10}}>VISA MC</span>
            </button>
          </div>
          <div style={{gridColumn:"2/4"}}>
            <label style={fL}>Currency</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",fontSize:13}}>💱</span>
              <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{...sS,paddingLeft:28}}>
                {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={fL}>Amounts are</label>
            <select value={amountsAre} onChange={e=>setAmountsAre(e.target.value)} style={sS}>
              {AMOUNTS_ARE.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        {/* overflow-x:auto on wrapper; tbody rows use overflow:visible for desc popup */}
        <div >
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700, tableLayout:"fixed" }}>
            <colgroup>
              <col style={{width:32}}/>           {/* drag */}
              <col style={{width:"13%"}}/>          {/* item */}
              {vis("desc")      && <col style={{width:"20%"}}/>}
              <col style={{width:"6%"}}/>           {/* qty */}
              <col style={{width:"8%"}}/>           {/* price */}
              {vis("disc")      && <col style={{width:"6%"}}/>}
              {vis("account")   && <col style={{width:"14%"}}/>}
              {vis("taxRate")   && <col style={{width:"10%"}}/>}
              {vis("taxAmount") && <col style={{width:"8%"}}/>}
              {vis("project")   && <col style={{width:"9%"}}/>}
              <col style={{width:"9%"}}/>           {/* amount */}
              <col style={{width:36}}/>             {/* delete */}
            </colgroup>
            <thead>
              <tr>
                <th style={{...TH, borderRight:"none", padding:"7px 4px"}}></th>
                <th style={TH}>Item</th>
                {vis("desc")      && <th style={TH}>Description</th>}
                <th style={{...TH, textAlign:"right"}}>Qty.</th>
                <th style={{...TH, textAlign:"right"}}>Price</th>
                {vis("disc")      && <th style={{...TH, textAlign:"right"}}>
                  Disc.&nbsp;<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:13,height:13,borderRadius:"50%",border:"1px solid #9ca3af",color:"#9ca3af",fontSize:9,cursor:"help",fontWeight:700}}>i</span>
                </th>}
                {vis("account")   && <th style={TH}>Account</th>}
                {vis("taxRate")   && <th style={TH}>Tax rate</th>}
                {vis("taxAmount") && <th style={{...TH, textAlign:"right"}}>Tax amount</th>}
                {vis("project")   && <th style={TH}>Project</th>}
                <th style={{...TH, textAlign:"right", borderRight:"none"}}>Amount AED</th>
                <th style={{...TH, borderRight:"none"}}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isDragging = dragging===idx;
                const isOver     = overIdx===idx && dragging!==idx;
                return (
                  <tr key={row.id}
                    draggable="true"
                    onDragStart={e=>handleDragStart(e,idx)}
                    onDragEnter={e=>handleDragEnter(e,idx)}
                    onDragOver={handleDragOver}
                    onDrop={e=>handleDrop(e,idx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      background: isDragging?"#e8f4fd": isOver?"#f0f9ff":"#fff",
                      opacity:    isDragging? 0.45:1,
                      boxShadow:  isOver?"inset 0 -3px 0 0 #1a6496":"none",
                      transition: "background .1s, box-shadow .1s",
                    }}
                    onMouseEnter={e=>{ if(!isDragging) e.currentTarget.style.background="#f8fafd"; }}
                    onMouseLeave={e=>{ if(!isDragging) e.currentTarget.style.background="#fff"; }}>

                    {/* Drag handle */}
                    <td style={{...TD, textAlign:"center", userSelect:"none", cursor:"grab", borderRight:"none"}}>
                      <span style={{color:"#c9cbd0", fontSize:15, letterSpacing:-1}}>⠿</span>
                    </td>

                    {/* Item — left-aligned input */}
                    <td style={TD}>
                      <CellInput value={row.item} onChange={v=>upd(row.id,"item",v)} align="left"/>
                    </td>

                    {/* Description — expand on click */}
                    {vis("desc") && (
                      <td style={{...TD, overflow:"visible"}}>
                        <DescCell value={row.desc} onChange={v=>upd(row.id,"desc",v)}
                          />
                      </td>
                    )}

                    {/* Qty — right-aligned */}
                    <td style={{...TD, textAlign:"right"}}>
                      <CellInput value={row.qty} onChange={v=>upd(row.id,"qty",v)} align="right"/>
                    </td>

                    {/* Price — right-aligned */}
                    <td style={{...TD, textAlign:"right"}}>
                      <CellInput value={row.price} onChange={v=>upd(row.id,"price",v)} align="right"/>
                    </td>

                    {/* Discount — right-aligned */}
                    {vis("disc") && (
                      <td style={{...TD, textAlign:"right"}}>
                        <CellInput value={row.disc} onChange={v=>upd(row.id,"disc",v)} align="right"/>
                      </td>
                    )}

                    {/* Account */}
                    {vis("account") && (
                      <td style={TD}>
                        <CellSelect value={row.account} onChange={v=>upd(row.id,"account",v)} options={ACCOUNTS}/>
                      </td>
                    )}

                    {/* Tax rate */}
                    {vis("taxRate") && (
                      <td style={TD}>
                        <CellSelect value={row.taxRate} onChange={v=>upd(row.id,"taxRate",v)} options={TAX_OPTIONS.map(t=>t.label)}/>
                      </td>
                    )}

                    {/* Tax amount — read-only, right-aligned */}
                    {vis("taxAmount") && (
                      <td style={{...TD, textAlign:"right", paddingRight:8, fontSize:13, color:"#374151"}}>
                        {lineTax(row)}
                      </td>
                    )}

                    {/* Project */}
                    {vis("project") && (
                      <td style={TD}>
                        <CellSelect value={row.project} onChange={v=>upd(row.id,"project",v)} options={[]}/>
                      </td>
                    )}

                    {/* Amount — read-only, right-aligned */}
                    <td style={{...TD, textAlign:"right", fontWeight:600, paddingRight:8, borderRight:"none"}}>
                      {lineAmt(row)}
                    </td>

                    {/* Delete */}
                    <td style={{...TD, textAlign:"center", borderRight:"none"}}>
                      <button onClick={()=>delRow(row.id)}
                        style={{background:"none",border:"none",cursor:"pointer",color:"#d1d5db",fontSize:15,padding:"0 4px",lineHeight:1}}
                        onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                        onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}>🗑</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Table footer ─────────────────────────────────────────────────── */}
        <div style={{ padding:"10px 20px 16px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}
          onClick={e=>e.stopPropagation()}>

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {/* Add row split */}
            <div style={{display:"flex",position:"relative"}}>
              <button onClick={addRow} style={{height:30,padding:"0 12px",border:"1px solid #d1d5db",borderRadius:"4px 0 0 4px",background:"#fff",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer",borderRight:"none"}}>Add row</button>
              <button onClick={()=>setAddRowDD(v=>!v)} style={{height:30,width:26,border:"1px solid #d1d5db",borderRadius:"0 4px 4px 0",background:"#fff",color:"#374151",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>▾</button>
              {addRowDD && (
                <div style={{position:"absolute",top:"calc(100% + 2px)",left:0,zIndex:300,background:"#fff",border:"1px solid #e5e7eb",borderRadius:6,boxShadow:"0 8px 24px rgba(0,0,0,.1)",minWidth:180}}>
                  {["Add row","Add subtotal","Add note"].map((l,i)=>(
                    <button key={i} onClick={()=>{setAddRowDD(false);if(l==="Add row")addRow();}} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 14px",fontSize:13,border:"none",background:"none",cursor:"pointer",borderBottom:i<2?"1px solid #f0f0f0":"none"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f5fafd"} onMouseLeave={e=>e.currentTarget.style.background="none"}>{l}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Columns + Files */}
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{position:"relative"}}>
                <button onClick={e=>{e.stopPropagation();setColsOpen(v=>!v);}}
                  style={{height:28,padding:"0 10px",border:"1px solid",borderRadius:4,background:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4,
                    borderColor:colsOpen?"#1a6496":"#d1d5db", color:colsOpen?"#1a6496":"#374151", fontWeight:colsOpen?600:400}}>
                  Columns ({hiddenCount} hidden) ▾
                </button>
                {colsOpen && (
                  <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:400,background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,boxShadow:"0 12px 32px rgba(0,0,0,.15)",width:260,padding:"12px 0 8px"}}
                    onClick={e=>e.stopPropagation()}>
                    <div style={{padding:"0 14px 8px",fontSize:12,fontWeight:700,color:"#374151",borderBottom:"1px solid #f0f0f0",marginBottom:4}}>Show / hide columns</div>
                    <div style={{padding:"4px 14px 8px",fontSize:11,color:"#9ca3af",borderBottom:"1px solid #f5f5f5",marginBottom:4}}>Item, Qty, Price and Amount are always shown</div>
                    {ALL_COLS.map(col=>(
                      <label key={col.key} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 14px",cursor:"pointer",fontSize:13,color:"#374151"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f8fafd"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,borderRadius:3,border:"1.5px solid",flexShrink:0,
                          borderColor:visibleCols[col.key]?"#1a6496":"#d1d5db", background:visibleCols[col.key]?"#1a6496":"#fff", transition:"all .15s"}}>
                          {visibleCols[col.key]&&(
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                        <input type="checkbox" checked={!!visibleCols[col.key]} onChange={()=>setVisibleCols(p=>({...p,[col.key]:!p[col.key]}))} style={{display:"none"}}/>
                        {col.label}
                      </label>
                    ))}
                    <div style={{borderTop:"1px solid #f0f0f0",marginTop:6,padding:"8px 14px 0",display:"flex",gap:10}}>
                      <button onClick={()=>setVisibleCols(Object.fromEntries(ALL_COLS.map(c=>[c.key,true])))} style={{fontSize:12,fontWeight:600,color:"#1a6496",background:"none",border:"none",cursor:"pointer",padding:0}}>Show all</button>
                      <span style={{color:"#e5e7eb"}}>|</span>
                      <button onClick={()=>setVisibleCols(Object.fromEntries(ALL_COLS.map(c=>[c.key,false])))} style={{fontSize:12,fontWeight:600,color:"#6b7280",background:"none",border:"none",cursor:"pointer",padding:0}}>Hide all</button>
                    </div>
                  </div>
                )}
              </div>
              <button style={{height:28,padding:"0 10px",border:"1px solid #d1d5db",borderRadius:4,background:"#fff",color:"#374151",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}
                onClick={()=>fileRef.current?.click()}>📎 Files ▾</button>
              <input ref={fileRef} type="file" style={{display:"none"}} onChange={e=>toast(`📎 ${e.target.files?.[0]?.name} attached`)}/>
            </div>
          </div>

          {/* Totals */}
          <div style={{minWidth:300}}>
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f3f4f6"}}>
              <span style={{color:"#374151",fontSize:13}}>Subtotal</span>
              <span style={{fontSize:13,fontWeight:500}}>{totals.sub===0?"0.00":fmt(totals.sub)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f3f4f6"}}>
              <span style={{color:"#374151",fontSize:13}}>Total tax</span>
              <span style={{fontSize:13,fontWeight:500}}>{totals.tax===0?"0.00":fmt(totals.tax)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 6px",borderTop:"2px solid #e5e7eb"}}>
              <span style={{fontSize:15,fontWeight:700,color:"#111827"}}>Total</span>
              <span style={{fontSize:15,fontWeight:700,color:"#111827"}}>{totals.total===0?"0.00":fmt(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Send via Xero Network */}
        <div style={{borderTop:"1px solid #e5e7eb",padding:"12px 20px",display:"flex",justifyContent:"flex-end"}}>
          <div style={{textAlign:"right"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
              <div style={{width:36,height:20,borderRadius:10,background:"#e5e7eb",position:"relative",cursor:"pointer"}}>
                <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:2,boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
              </div>
              <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>Send via Xero Network</span>
            </div>
            <p style={{fontSize:12,color:"#9ca3af",margin:"3px 0 0"}}>Select a contact to send via Xero Network</p>
          </div>
        </div>
      </div>
    </div>
  );
}
