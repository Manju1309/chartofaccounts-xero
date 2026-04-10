
import { useState, useRef } from "react";

const ACCOUNTS = [
  "Sales (200)","Other Revenue (260)","Cost of Goods Sold (310)","Advertising (400)",
  "Bank Fees (404)","General Expenses (428)","Insurance (432)","Rent (464)","Wages (490)",
];
const TAX_OPTIONS = [
  { label:"No Tax", rate:0 },{ label:"Tax Exempt (0%)", rate:0 },
  { label:"15% VAT", rate:0.15 },{ label:"20% Standard", rate:0.20 },{ label:"GST (10%)", rate:0.10 },
];
const MONTHS = ["Day(s)","Week(s)","Month(s)","Year(s)"];
const FOLLOWING = ["of the following month","after the invoice date","of the current month"];

const emptyRow = () => ({ id: Math.random().toString(36).slice(2), item:"", desc:"", qty:"", price:"", disc:"", account:"", tax:"" });
const n   = v => parseFloat(String(v||"0").replace(/,/g,"")) || 0;
const fmt = v => isNaN(v)||v===""?"":Number(v).toFixed(2);
const taxRateOf = label => (TAX_OPTIONS.find(t=>t.label===label)||{rate:0}).rate;

function CellSelect({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ width:"100%",height:26,border:"none",background:"transparent",fontSize:12,color:value?"#333":"#aaa",cursor:"pointer",outline:"none" }}>
      <option value="">{placeholder||""}</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function NewRepeatingInvoicePage({ onNavigate }) {
  const today = new Date().toISOString().slice(0,10);
  const [every,     setEvery]     = useState("1");
  const [period,    setPeriod]    = useState("Month(s)");
  const [invDate,   setInvDate]   = useState(today);
  const [dueAmt,    setDueAmt]    = useState("");
  const [dueWhen,   setDueWhen]   = useState("of the following month");
  const [endDate,   setEndDate]   = useState("");
  const [status,    setStatus]    = useState("draft");
  const [invoiceTo, setInvoiceTo] = useState("");
  const [reference, setReference] = useState("");
  const [branding,  setBranding]  = useState("Standard");
  const [currency,  setCurrency]  = useState("AED United Arab Emirates");
  const [taxMode,   setTaxMode]   = useState("Tax Exclusive");
  const [rows,      setRows]      = useState(Array.from({length:5},emptyRow));
  const [notify,    setNotify]    = useState(null);

  const dragIdx = useRef(null);
  const [overIdx,   setOverIdx]   = useState(null);
  const [dragging,  setDragging]  = useState(null);

  const toast = msg => { setNotify(msg); setTimeout(()=>setNotify(null),3000); };

  const upd    = (id,f,v) => setRows(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const delRow = id        => setRows(p=>p.length>1?p.filter(r=>r.id!==id):p);
  const addRow = ()        => setRows(p=>[...p,emptyRow()]);

  const handleDragStart = (e,idx) => { dragIdx.current=idx; setDragging(idx); e.dataTransfer.effectAllowed="move"; };
  const handleDragEnter = (e,idx) => { e.preventDefault(); if(dragIdx.current!==idx) setOverIdx(idx); };
  const handleDragOver  = e       => { e.preventDefault(); e.dataTransfer.dropEffect="move"; };
  const handleDrop      = (e,idx) => {
    e.preventDefault();
    const from=dragIdx.current;
    if(from===null||from===idx) return;
    setRows(prev=>{ const next=[...prev]; const [m]=next.splice(from,1); next.splice(idx,0,m); return next; });
    dragIdx.current=null; setOverIdx(null); setDragging(null);
  };
  const handleDragEnd = () => { setDragging(null); setOverIdx(null); dragIdx.current=null; };

  const totals = (() => {
    let sub=0,tax=0;
    rows.forEach(r=>{ const a=n(r.qty)*n(r.price); const rate=taxRateOf(r.tax); sub+=a; tax+=a*rate; });
    return {sub,tax,total:sub+tax};
  })();

  const lineAmt = r => fmt(n(r.qty)*n(r.price));

  // styles
  const TH = { padding:"6px 8px",fontSize:11,fontWeight:600,color:"#555",background:"#f0f4f8",borderBottom:"1px solid #cdd5df",borderRight:"1px solid #cdd5df",whiteSpace:"nowrap",textAlign:"left" };
  const TD = { padding:"0 4px",borderBottom:"1px solid #e8ecf0",borderRight:"1px solid #e8ecf0",verticalAlign:"middle",height:36 };
  const inp = { width:"100%",height:26,border:"none",background:"transparent",fontSize:12,color:"#333",outline:"none",padding:"0 3px" };
  const selS = {
    height:26,border:"1px solid #c5cdd8",borderRadius:3,fontSize:12,color:"#333",background:"#fff",
    padding:"0 20px 0 6px",outline:"none",appearance:"none",WebkitAppearance:"none",cursor:"pointer",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23888'/%3E%3C/svg%3E")`,
    backgroundRepeat:"no-repeat",backgroundPosition:"right 5px center",
  };

  return (
    <div style={{ fontFamily:"Arial,Helvetica,sans-serif",background:"#f0f4f8",minHeight:"100vh",fontSize:13 }}>
      {notify&&<div style={{ position:"fixed",top:16,right:16,zIndex:9999,background:"#2e7d32",color:"#fff",padding:"10px 18px",borderRadius:4,fontSize:13,fontWeight:600 }}>{notify}</div>}

      {/* Nav */}
      {/* <div style={{ background:"#1a6496",height:44,display:"flex",alignItems:"center",padding:"0 14px" }}>
        <span style={{ color:"#fff",fontWeight:800,fontSize:17,letterSpacing:-0.5,marginRight:16 }}>xero</span>
        {["Home","Sales","Purchases","Reporting","Payroll","Accounting","Tax","Contacts","Projects"].map(item=>(
          <button key={item} style={{ background:item==="Sales"?"rgba(255,255,255,.18)":"none",border:"none",color:"#fff",fontSize:12,fontWeight:item==="Sales"?700:400,padding:"0 10px",height:44,cursor:"pointer" }}>
            {item}{item==="Sales"&&<span style={{marginLeft:3,fontSize:9}}>▾</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        <div style={{width:28,height:28,borderRadius:"50%",background:"#e91e63",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700}}>MK</div>
      </div> */}

      {/* Breadcrumb + Title */}
      <div style={{ background:"#fff",borderBottom:"1px solid #dde3ea",padding:"10px 20px 12px" }}>
        <p style={{ margin:"0 0 2px",fontSize:11,color:"#999" }}>
          <span style={{color:"#1a6496",cursor:"pointer"}} onClick={()=>onNavigate?.("sales-overview")}>Sales overview</span>
          <span style={{margin:"0 5px"}}>›</span>
          <span style={{color:"#1a6496",cursor:"pointer"}} onClick={()=>onNavigate?.("invoices")}>Invoices</span>
          <span style={{margin:"0 5px"}}>›</span>
        </p>
        <h1 style={{ margin:0,fontSize:18,fontWeight:700,color:"#222" }}>New Repeating Invoice</h1>
      </div>

      <div style={{ padding:"16px 20px" }}>
        <div style={{ background:"#fff",border:"1px solid #cdd5df",borderRadius:4,padding:"16px" }}>

          {/* ── Create section ── */}
          <div style={{ borderBottom:"1px solid #dde3ea",paddingBottom:14,marginBottom:14 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
              <span style={{ fontSize:13,fontWeight:700,color:"#333" }}>Create</span>
              <button style={{ background:"none",border:"1px solid #cdd5df",borderRadius:3,padding:"3px 8px",cursor:"pointer",fontSize:12,color:"#555" }}>📋</button>
            </div>

            {/* Row 1: Repeat every / Invoice Date / Due Date / End Date */}
            <div style={{ display:"flex",gap:16,alignItems:"flex-end",flexWrap:"wrap",marginBottom:12 }}>
              <div>
                <label style={{ display:"block",fontSize:11,color:"#666",marginBottom:3,fontWeight:600 }}>Repeat this transaction every</label>
                <div style={{ display:"flex",gap:4 }}>
                  <input value={every} onChange={e=>setEvery(e.target.value)}
                    style={{ ...selS,width:44,padding:"0 6px",background:"#fff",border:"1px solid #c5cdd8",borderRadius:3,fontSize:12 }}/>
                  <select value={period} onChange={e=>setPeriod(e.target.value)} style={{ ...selS,width:110 }}>
                    {MONTHS.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display:"block",fontSize:11,color:"#666",marginBottom:3,fontWeight:600 }}>Invoice Date</label>
                <div style={{ display:"flex",gap:4,alignItems:"center" }}>
                  <input type="date" value={invDate} onChange={e=>setInvDate(e.target.value)}
                    style={{ ...selS,width:130 }}/>
                  <button style={{ background:"none",border:"1px solid #c5cdd8",borderRadius:3,padding:"3px 7px",cursor:"pointer",fontSize:11,color:"#555" }}>▾</button>
                </div>
              </div>
              <div>
                <label style={{ display:"block",fontSize:11,color:"#666",marginBottom:3,fontWeight:600 }}>Due Date</label>
                <div style={{ display:"flex",gap:4,alignItems:"center" }}>
                  <span style={{ fontSize:12,color:"#555" }}>Due</span>
                  <input value={dueAmt} onChange={e=>setDueAmt(e.target.value)} placeholder=""
                    style={{ ...selS,width:44,padding:"0 6px" }}/>
                  <select value={dueWhen} onChange={e=>setDueWhen(e.target.value)} style={{ ...selS,width:200 }}>
                    {FOLLOWING.map(f=><option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display:"block",fontSize:11,color:"#666",marginBottom:3,fontWeight:600 }}>End Date <span style={{fontWeight:400,color:"#999"}}>(Optional)</span></label>
                <div style={{ display:"flex",gap:4,alignItems:"center" }}>
                  <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}
                    style={{ ...selS,width:130 }}/>
                  <button style={{ background:"none",border:"1px solid #c5cdd8",borderRadius:3,padding:"3px 7px",cursor:"pointer",fontSize:11 }}>▾</button>
                </div>
              </div>
            </div>

            {/* Radio status */}
            <div style={{ display:"flex",gap:20,alignItems:"center",marginBottom:8 }}>
              {[["draft","Save as Draft"],["approve","Approve"],["approve_send","Approve for Sending"]].map(([v,l])=>(
                <label key={v} style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,cursor:"pointer",color:"#444" }}>
                  <input type="radio" name="status" value={v} checked={status===v} onChange={()=>setStatus(v)} style={{cursor:"pointer"}}/>
                  {l}
                </label>
              ))}
              <span style={{ marginLeft:"auto",fontSize:11,color:"#888" }}>Invoice no. and currency rate (when applicable) will be set on invoice creation date.</span>
            </div>
          </div>

          {/* ── Invoice fields ── */}
          <div style={{ display:"grid",gridTemplateColumns:"2fr 1.5fr 1.5fr 1.5fr",gap:"0 16px",marginBottom:12,alignItems:"end" }}>
            <div>
              <label style={{ display:"block",fontSize:11,color:"#666",marginBottom:3,fontWeight:600 }}>Invoice to</label>
              <input value={invoiceTo} onChange={e=>setInvoiceTo(e.target.value)}
                style={{ width:"100%",height:28,border:"1px solid #c5cdd8",borderRadius:3,fontSize:12,padding:"0 8px",outline:"none",boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor="#1a6496"} onBlur={e=>e.target.style.borderColor="#c5cdd8"}/>
            </div>
            <div>
              <label style={{ display:"block",fontSize:11,color:"#666",marginBottom:3,fontWeight:600 }}>Reference</label>
              <input value={reference} onChange={e=>setReference(e.target.value)}
                style={{ width:"100%",height:28,border:"1px solid #c5cdd8",borderRadius:3,fontSize:12,padding:"0 8px",outline:"none",boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor="#1a6496"} onBlur={e=>e.target.style.borderColor="#c5cdd8"}/>
            </div>
            <div>
              <label style={{ display:"block",fontSize:11,color:"#666",marginBottom:3,fontWeight:600 }}>Branding</label>
              <select value={branding} onChange={e=>setBranding(e.target.value)} style={{ ...selS,width:"100%",height:28 }}>
                {["Standard","Modern","Classic"].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:"block",fontSize:11,color:"#666",marginBottom:3,fontWeight:600 }}>Online Payments</label>
              <div style={{ fontSize:12,color:"#555",paddingTop:6 }}>None. <span style={{color:"#1a6496",cursor:"pointer"}}>Get set up now</span></div>
            </div>
          </div>

          {/* Amounts are row */}
          <div style={{ display:"flex",justifyContent:"flex-end",gap:8,alignItems:"center",marginBottom:10 }}>
            <span style={{ fontSize:12,color:"#666" }}>Amounts are:</span>
            <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{ ...selS,width:200,height:26 }}>
              {["AED United Arab Emirates","USD United States","GBP United Kingdom","EUR Euro"].map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={taxMode} onChange={e=>setTaxMode(e.target.value)} style={{ ...selS,width:130,height:26 }}>
              {["Tax Exclusive","Tax Inclusive","No Tax"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>

          {/* ── Table ── */}
          <div style={{ overflowX:"auto",border:"1px solid #cdd5df",borderRadius:3 }}>
            <table style={{ width:"100%",borderCollapse:"collapse",minWidth:700 }}>
              <thead>
                <tr>
                  <th style={{ ...TH,width:24,borderRight:"none",background:"#f0f4f8" }}></th>
                  <th style={{ ...TH,width:"13%" }}>Item</th>
                  <th style={{ ...TH,width:"25%" }}>Description</th>
                  <th style={{ ...TH,width:"6%",textAlign:"right" }}>Qty</th>
                  <th style={{ ...TH,width:"9%",textAlign:"right" }}>Unit Price</th>
                  <th style={{ ...TH,width:"6%",textAlign:"right" }}>Disc %</th>
                  <th style={{ ...TH,width:"14%" }}>Account</th>
                  <th style={{ ...TH,width:"12%",borderRight:"none" }}>Tax Rate</th>
                  <th style={{ ...TH,width:"9%",textAlign:"right",borderRight:"none" }}>Amount AED</th>
                  <th style={{ ...TH,width:28,borderRight:"none" }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row,idx)=>{
                  const isDragging=dragging===idx, isOver=overIdx===idx&&dragging!==idx;
                  return (
                    <tr key={row.id}
                      draggable="true"
                      onDragStart={e=>handleDragStart(e,idx)}
                      onDragEnter={e=>handleDragEnter(e,idx)}
                      onDragOver={handleDragOver}
                      onDrop={e=>handleDrop(e,idx)}
                      onDragEnd={handleDragEnd}
                      style={{ background:isDragging?"#e3f2fd":isOver?"#f0f9ff":"#fff",opacity:isDragging?0.45:1,boxShadow:isOver?"inset 0 -2px 0 #1a6496":"none" }}
                      onMouseEnter={e=>{if(!isDragging)e.currentTarget.style.background="#f7f9fc";}}
                      onMouseLeave={e=>{if(!isDragging)e.currentTarget.style.background="#fff";}}>
                      <td style={{ ...TD,width:24,textAlign:"center",cursor:"grab",borderRight:"none",color:"#bbb",userSelect:"none",padding:"0 3px" }}>⠿</td>
                      <td style={TD}><input value={row.item} onChange={e=>upd(row.id,"item",e.target.value)} style={inp}/></td>
                      <td style={TD}><input value={row.desc} onChange={e=>upd(row.id,"desc",e.target.value)} style={inp}/></td>
                      <td style={{ ...TD,textAlign:"right" }}><input value={row.qty} onChange={e=>upd(row.id,"qty",e.target.value)} style={{ ...inp,textAlign:"right" }}/></td>
                      <td style={{ ...TD,textAlign:"right" }}><input value={row.price} onChange={e=>upd(row.id,"price",e.target.value)} style={{ ...inp,textAlign:"right" }}/></td>
                      <td style={{ ...TD,textAlign:"right" }}><input value={row.disc} onChange={e=>upd(row.id,"disc",e.target.value)} style={{ ...inp,textAlign:"right" }}/></td>
                      <td style={TD}><CellSelect value={row.account} onChange={v=>upd(row.id,"account",v)} options={ACCOUNTS}/></td>
                      <td style={{ ...TD,borderRight:"none" }}><CellSelect value={row.tax} onChange={v=>upd(row.id,"tax",v)} options={TAX_OPTIONS.map(t=>t.label)}/></td>
                      <td style={{ ...TD,textAlign:"right",fontWeight:600,fontSize:12,paddingRight:8,borderRight:"none" }}>{lineAmt(row)}</td>
                      <td style={{ ...TD,textAlign:"center",width:28,borderRight:"none" }}>
                        <button onClick={()=>delRow(row.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:14,lineHeight:1 }}
                          onMouseEnter={e=>e.currentTarget.style.color="#e53e3e"}
                          onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add a new line */}
          <div style={{ marginTop:10,display:"flex" }}>
            <button onClick={addRow} style={{ height:28,padding:"0 12px",border:"1px solid #1a6496",borderRadius:"3px 0 0 3px",background:"#fff",color:"#1a6496",fontSize:12,fontWeight:700,cursor:"pointer",borderRight:"none" }}>
              Add a new line
            </button>
            <button style={{ height:28,width:24,border:"1px solid #1a6496",borderRadius:"0 3px 3px 0",background:"#fff",color:"#1a6496",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10 }}>▾</button>
          </div>

          {/* Totals */}
          <div style={{ display:"flex",justifyContent:"flex-end",marginTop:16 }}>
            <div style={{ width:320 }}>
              <div style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13 }}>
                <span style={{ color:"#555" }}>Subtotal</span>
                <span>{totals.sub===0?"0.00":fmt(totals.sub)}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,borderBottom:"2px solid #333",marginBottom:4 }}>
                <span style={{ color:"#555" }}>Tax</span>
                <span>{totals.tax===0?"0.00":fmt(totals.tax)}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 0" }}>
                <span style={{ fontSize:15,fontWeight:800,letterSpacing:.5 }}>TOTAL</span>
                <span style={{ fontSize:15,fontWeight:800 }}>{totals.total===0?"0.00":fmt(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save / Cancel */}
        <div style={{ background:"#fff",border:"1px solid #cdd5df",borderRadius:4,marginTop:12,padding:"12px 16px",display:"flex",justifyContent:"flex-end",gap:10,alignItems:"center" }}>
          <span style={{ color:"#1a6496",fontSize:12,cursor:"pointer",marginRight:8 }}>Preview placeholders</span>
          <button onClick={()=>toast("✓ Repeating invoice saved.")}
            style={{ height:32,padding:"0 20px",border:"none",borderRadius:3,background:"#7cb342",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Save</button>
          <button onClick={()=>onNavigate?.("invoices")}
            style={{ height:32,padding:"0 16px",border:"1px solid #bbb",borderRadius:3,background:"#e0e0e0",color:"#444",fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button>
        </div>

        {/* History & Notes */}
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:13,fontWeight:700,color:"#333",marginBottom:8 }}>History &amp; Notes</div>
          <button style={{ height:28,padding:"0 14px",border:"1px solid #c5cdd8",borderRadius:3,background:"#fff",color:"#555",fontSize:12,cursor:"pointer" }}>Add Note</button>
        </div>
      </div>
    </div>
  );
}
