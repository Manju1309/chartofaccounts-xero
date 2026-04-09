
import { useState, useRef } from "react";

const ACCOUNTS = [
  "Sales (200)","Other Revenue (260)","Cost of Goods Sold (310)","Advertising (400)",
  "Bank Fees (404)","General Expenses (428)","Insurance (432)","Rent (464)","Wages (490)",
];
const TAX_OPTIONS = [
  { label:"No Tax", rate:0 },{ label:"Tax Exempt (0%)", rate:0 },
  { label:"15% VAT", rate:0.15 },{ label:"20% Standard", rate:0.20 },{ label:"GST (10%)", rate:0.10 },
];
const CURRENCIES = ["United Arab Emirates Dirham","Australian Dollar (AUD)","US Dollar (USD)","British Pound (GBP)","Euro (EUR)"];
const ALL_COLS = [
  { key:"desc",      label:"Description"  },
  { key:"disc",      label:"Discount"     },
  { key:"account",   label:"Account"      },
  { key:"taxRate",   label:"Tax rate"     },
  { key:"taxAmount", label:"Tax amount"   },
  { key:"project",   label:"Project"      },
];

const emptyRow = () => ({ id:Math.random().toString(36).slice(2), item:"", desc:"", qty:"", price:"", disc:"", account:"", taxRate:"", project:"" });
const n   = v => parseFloat(String(v||"0").replace(/,/g,"")) || 0;
const fmt = v => isNaN(v)||v===""?"":Number(v).toFixed(2);
const taxRateOf = label => (TAX_OPTIONS.find(t=>t.label===label)||{rate:0}).rate;

function CellSelect({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ width:"100%",height:28,border:"none",background:"transparent",fontSize:13,color:value?"#333":"#aaa",cursor:"pointer",outline:"none",padding:"0 2px" }}>
      <option value="">{placeholder||"—"}</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function NewCreditNotePage({ onNavigate }) {
  const today = new Date().toISOString().slice(0,10);
  const [contact,    setContact]    = useState("");
  const [issueDate,  setIssueDate]  = useState(today);
  const [creditNum,  setCreditNum]  = useState("CN-0001");
  const [reference,  setReference]  = useState("");
  const [branding,   setBranding]   = useState("Standard");
  const [currency,   setCurrency]   = useState("United Arab Emirates Dirham");
  const [taxMode,    setTaxMode]    = useState("Tax exclusive");
  const [rows,       setRows]       = useState([emptyRow()]);
  const [visibleCols,setVisibleCols]= useState(() => Object.fromEntries(ALL_COLS.map(c=>[c.key,true])));
  const [colsOpen,   setColsOpen]   = useState(false);
  const [addRowDD,   setAddRowDD]   = useState(false);
  const [saveDD,     setSaveDD]     = useState(false);
  const [approveDD,  setApproveDD]  = useState(false);
  const [notify,     setNotify]     = useState(null);
  const fileRef = useRef(null);

  const dragIdx  = useRef(null);
  const [overIdx, setOverIdx]   = useState(null);
  const [dragging,setDragging]  = useState(null);

  const hiddenCount = ALL_COLS.filter(c=>!visibleCols[c.key]).length;
  const vis = key => visibleCols[key];

  const toast = msg => { setNotify(msg); setTimeout(()=>setNotify(null),3000); };
  const upd    = (id,f,v) => setRows(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const delRow = id        => setRows(p=>p.length>1?p.filter(r=>r.id!==id):p);
  const addRow = ()        => setRows(p=>[...p,emptyRow()]);

  const handleDragStart = (e,idx) => { dragIdx.current=idx; setDragging(idx); e.dataTransfer.effectAllowed="move"; };
  const handleDragEnter = (e,idx) => { e.preventDefault(); if(dragIdx.current!==idx) setOverIdx(idx); };
  const handleDragOver  = e       => { e.preventDefault(); };
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
    rows.forEach(r=>{
      const a=n(r.qty)*n(r.price); let amt=a; const d=n(r.disc); if(d>0)amt-=amt*(d/100);
      const rate=taxRateOf(r.taxRate);
      if(taxMode==="Tax inclusive"&&rate>0){const tp=amt*rate/(1+rate);sub+=amt-tp;tax+=tp;}
      else if(taxMode==="Tax exclusive"&&rate>0){sub+=amt;tax+=amt*rate;}
      else sub+=amt;
    });
    return {sub,tax,total:sub+tax};
  })();

  const lineAmt = r => { const q=n(r.qty),p=n(r.price),d=n(r.disc); let a=q*p; if(d>0)a-=a*(d/100); return fmt(a); };
  const lineTax = r => {
    const q=n(r.qty),p=n(r.price),d=n(r.disc); let a=q*p; if(d>0)a-=a*(d/100);
    const rate=taxRateOf(r.taxRate);
    if(taxMode==="Tax inclusive"&&rate>0) return fmt(a*rate/(1+rate));
    if(taxMode==="Tax exclusive"&&rate>0) return fmt(a*rate);
    return "";
  };

  const TH = { padding:"8px 10px",fontSize:12,fontWeight:600,color:"#374151",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",borderRight:"1px solid #e5e7eb",whiteSpace:"nowrap",textAlign:"left",verticalAlign:"bottom" };
  const TD = { padding:"0 4px",borderBottom:"1px solid #f0f1f3",borderRight:"1px solid #f0f1f3",verticalAlign:"middle",height:44 };
  const inp = { width:"100%",height:28,border:"none",background:"transparent",fontSize:13,color:"#1a1a2e",outline:"none",padding:"0 4px" };
  const fL  = { display:"block",fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:4,textTransform:"uppercase",letterSpacing:.4 };
  const fI  = { width:"100%",height:32,border:"1px solid #d1d5db",borderRadius:4,fontSize:13,paddingLeft:28,paddingRight:8,outline:"none",color:"#374151",boxSizing:"border-box" };
  const sS  = { width:"100%",height:32,border:"1px solid #d1d5db",borderRadius:4,fontSize:13,padding:"0 28px 0 8px",outline:"none",color:"#374151",background:"#fff",appearance:"none",WebkitAppearance:"none",boxSizing:"border-box",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center" };

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:"#f3f4f6",minHeight:"100vh",fontSize:13 }}
      onClick={()=>{setColsOpen(false);setAddRowDD(false);setSaveDD(false);setApproveDD(false);}}>

      {notify&&<div style={{ position:"fixed",top:16,right:16,zIndex:9999,background:"#1d7a3c",color:"#fff",padding:"10px 18px",borderRadius:6,fontSize:13,fontWeight:600 }}>{notify}</div>}

      {/* Nav */}
      {/* <div style={{ background:"#1a6496",height:48,display:"flex",alignItems:"center",padding:"0 16px" }}>
        <span style={{ color:"#fff",fontWeight:800,fontSize:18,letterSpacing:-0.5,marginRight:20 }}>xero</span>
        {["Home","Sales","Purchases","Reporting","Payroll","Accounting","Tax","Contacts","Projects"].map(item=>(
          <button key={item} style={{ background:item==="Sales"?"rgba(255,255,255,.18)":"none",border:"none",color:"#fff",fontSize:13,fontWeight:item==="Sales"?700:400,padding:"0 12px",height:48,cursor:"pointer" }}>
            {item}{item==="Sales"&&<span style={{marginLeft:3,fontSize:10}}>▾</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        <div style={{width:32,height:32,borderRadius:"50%",background:"#e91e63",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700}}>MK</div>
      </div> */}

      {/* Sub-header */}
      <div style={{ background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"8px 20px 0" }}>
        <p style={{ margin:"0 0 4px",fontSize:12,color:"#6b7280" }}>
          <span style={{color:"#1a6496",cursor:"pointer"}} onClick={()=>onNavigate?.("sales-overview")}>Sales overview</span>
          <span style={{margin:"0 6px",color:"#9ca3af"}}>›</span>
          <span style={{color:"#1a6496",cursor:"pointer"}} onClick={()=>onNavigate?.("invoices")}>Invoices</span>
        </p>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:8,flexWrap:"wrap",gap:8 }}>
          <h1 style={{ margin:0,fontSize:18,fontWeight:700,color:"#111827" }}>New credit note</h1>
          <div style={{ display:"flex",gap:6,alignItems:"center" }} onClick={e=>e.stopPropagation()}>
            {/* Save split */}
            <div style={{ display:"flex",position:"relative" }}>
              <button onClick={()=>toast("✓ Credit note saved.")} style={{ height:32,padding:"0 14px",border:"1px solid #d1d5db",borderRadius:"4px 0 0 4px",background:"#fff",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer",borderRight:"1px solid #d1d5db" }}>Save</button>
              <button onClick={()=>setSaveDD(v=>!v)} style={{ height:32,width:26,border:"1px solid #d1d5db",borderLeft:"none",borderRadius:"0 4px 4px 0",background:"#fff",color:"#374151",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>▾</button>
              {saveDD&&(
                <div style={{ position:"absolute",top:"calc(100%+2px)",right:0,zIndex:300,background:"#fff",border:"1px solid #e5e7eb",borderRadius:6,boxShadow:"0 8px 24px rgba(0,0,0,.1)",minWidth:150 }}>
                  {["Save","Save & close"].map((l,i)=>(
                    <button key={i} onClick={()=>{setSaveDD(false);toast("✓ Saved.");}} style={{ display:"block",width:"100%",textAlign:"left",padding:"9px 14px",fontSize:13,border:"none",background:"none",cursor:"pointer",borderBottom:i===0?"1px solid #f0f0f0":"none" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#f5fafd"} onMouseLeave={e=>e.currentTarget.style.background="none"}>{l}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Approve split */}
            <div style={{ display:"flex",position:"relative" }}>
              <button onClick={()=>toast("✓ Credit note approved.")} style={{ height:32,padding:"0 14px",border:"none",borderRadius:"4px 0 0 4px",background:"#1a6496",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",borderRight:"1px solid rgba(255,255,255,.3)" }}>Approve</button>
              <button onClick={()=>setApproveDD(v=>!v)} style={{ height:32,width:26,border:"none",borderLeft:"1px solid rgba(255,255,255,.3)",borderRadius:"0 4px 4px 0",background:"#1a6496",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>▾</button>
              {approveDD&&(
                <div style={{ position:"absolute",top:"calc(100%+2px)",right:0,zIndex:300,background:"#fff",border:"1px solid #e5e7eb",borderRadius:6,boxShadow:"0 8px 24px rgba(0,0,0,.1)",minWidth:180 }}>
                  {["Approve","Approve & email"].map((l,i)=>(
                    <button key={i} onClick={()=>{setApproveDD(false);toast("✓ Approved.");}} style={{ display:"block",width:"100%",textAlign:"left",padding:"9px 14px",fontSize:13,border:"none",background:"none",cursor:"pointer",borderBottom:i===0?"1px solid #f0f0f0":"none" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#f5fafd"} onMouseLeave={e=>e.currentTarget.style.background="none"}>{l}</button>
                  ))}
                </div>
              )}
            </div>
            <button style={{ height:32,width:32,border:"1px solid #d1d5db",borderRadius:4,background:"#fff",color:"#374151",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>⋮</button>
          </div>
        </div>
      </div>

      {/* Yellow accent bar (Xero style for credit note) */}
      <div style={{ margin:"16px 20px",background:"#fff",border:"1px solid #e5e7eb",borderLeft:"4px solid #f59e0b",borderRadius:4 }}>

        {/* Header fields */}
        <div style={{ padding:"16px 20px 0",display:"grid",gridTemplateColumns:"2fr 1.5fr 1.5fr 1.5fr 1.5fr 1.5fr",gap:"0 16px",marginBottom:12 }}>
          {/* Contact */}
          <div style={{marginBottom:12}}>
            <label style={fL}>Contact</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af"}}>👤</span>
              <input value={contact} onChange={e=>setContact(e.target.value)} style={{...fI}}
                onFocus={e=>e.target.style.borderColor="#1a6496"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
            </div>
          </div>
          {/* Issue date */}
          <div style={{marginBottom:12}}>
            <label style={fL}>Issue date</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",fontSize:13}}>📅</span>
              <input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} style={{...fI}}
                onFocus={e=>e.target.style.borderColor="#1a6496"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
            </div>
          </div>
          {/* Credit note number */}
          <div style={{marginBottom:12}}>
            <label style={fL}>Credit note number</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",fontWeight:700}}>#</span>
              <input value={creditNum} onChange={e=>setCreditNum(e.target.value)} style={{...fI}}
                onFocus={e=>e.target.style.borderColor="#1a6496"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
            </div>
          </div>
          {/* Reference */}
          <div style={{marginBottom:12}}>
            <label style={fL}>Reference</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",fontSize:13}}>📄</span>
              <input value={reference} onChange={e=>setReference(e.target.value)} style={{...fI}}
                onFocus={e=>e.target.style.borderColor="#1a6496"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
            </div>
          </div>
          {/* Branding */}
          <div style={{marginBottom:12}}>
            <label style={fL}>Branding theme</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af"}}>🎨</span>
              <select value={branding} onChange={e=>setBranding(e.target.value)} style={{...sS,paddingLeft:28}}>
                {["Standard","Modern","Classic"].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          {/* Currency */}
          <div style={{marginBottom:12}}>
            <label style={fL}>Currency</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#9ca3af"}}>💱</span>
              <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{...sS,paddingLeft:28}}>
                {CURRENCIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tax row */}
        <div style={{ padding:"0 20px 12px" }}>
          <label style={fL}>Tax</label>
          <select value={taxMode} onChange={e=>setTaxMode(e.target.value)} style={{ ...sS,width:200 }}>
            {["Tax exclusive","Tax inclusive","No Tax"].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX:"auto",borderTop:"1px solid #e5e7eb" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",minWidth:700 }}>
            <thead>
              <tr>
                <th style={{...TH,width:32,padding:"8px 6px",borderRight:"none"}}></th>
                <th style={{...TH,width:"14%"}}>Item</th>
                {vis("desc")      && <th style={{...TH,width:"22%"}}>Description</th>}
                <th style={{...TH,width:"6%",textAlign:"right"}}>Qty.</th>
                <th style={{...TH,width:"8%",textAlign:"right"}}>Price</th>
                {vis("disc")      && <th style={{...TH,width:"6%",textAlign:"right"}}>Disc.</th>}
                {vis("account")   && <th style={{...TH,width:"13%"}}>Account</th>}
                {vis("taxRate")   && <th style={{...TH,width:"11%"}}>Tax rate</th>}
                {vis("taxAmount") && <th style={{...TH,width:"8%",textAlign:"right"}}>Tax amount</th>}
                {vis("project")   && <th style={{...TH,width:"9%"}}>Project</th>}
                <th style={{...TH,width:"10%",textAlign:"right",borderRight:"none"}}>Amount</th>
                <th style={{...TH,width:36,borderRight:"none"}}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row,idx)=>{
                const isDragging=dragging===idx,isOver=overIdx===idx&&dragging!==idx;
                return (
                  <tr key={row.id}
                    draggable="true"
                    onDragStart={e=>handleDragStart(e,idx)}
                    onDragEnter={e=>handleDragEnter(e,idx)}
                    onDragOver={handleDragOver}
                    onDrop={e=>handleDrop(e,idx)}
                    onDragEnd={handleDragEnd}
                    style={{ background:isDragging?"#e8f4fd":isOver?"#f0f9ff":"#fff",opacity:isDragging?0.45:1,boxShadow:isOver?"inset 0 -3px 0 0 #1a6496":"none" }}
                    onMouseEnter={e=>{if(!isDragging)e.currentTarget.style.background="#f8fafd";}}
                    onMouseLeave={e=>{if(!isDragging)e.currentTarget.style.background="#fff";}}>
                    <td style={{...TD,width:32,textAlign:"center",cursor:"grab",borderRight:"none",color:"#ccc",userSelect:"none",padding:"0 4px"}}>⠿</td>
                    <td style={TD}><input value={row.item} onChange={e=>upd(row.id,"item",e.target.value)} style={inp}/></td>
                    {vis("desc")&&<td style={TD}><input value={row.desc} onChange={e=>upd(row.id,"desc",e.target.value)} style={inp}/></td>}
                    <td style={{...TD,textAlign:"right"}}><input value={row.qty} onChange={e=>upd(row.id,"qty",e.target.value)} style={{...inp,textAlign:"right"}}/></td>
                    <td style={{...TD,textAlign:"right"}}><input value={row.price} onChange={e=>upd(row.id,"price",e.target.value)} style={{...inp,textAlign:"right"}}/></td>
                    {vis("disc")&&<td style={{...TD,textAlign:"right"}}><input value={row.disc} onChange={e=>upd(row.id,"disc",e.target.value)} style={{...inp,textAlign:"right"}}/></td>}
                    {vis("account")&&<td style={TD}><CellSelect value={row.account} onChange={v=>upd(row.id,"account",v)} options={ACCOUNTS}/></td>}
                    {vis("taxRate")&&<td style={TD}><CellSelect value={row.taxRate} onChange={v=>upd(row.id,"taxRate",v)} options={TAX_OPTIONS.map(t=>t.label)}/></td>}
                    {vis("taxAmount")&&<td style={{...TD,textAlign:"right",paddingRight:8,fontSize:13}}>{lineTax(row)}</td>}
                    {vis("project")&&<td style={TD}><CellSelect value={row.project} onChange={v=>upd(row.id,"project",v)} options={[]}/></td>}
                    <td style={{...TD,textAlign:"right",fontWeight:600,paddingRight:8,borderRight:"none"}}>{lineAmt(row)}</td>
                    <td style={{...TD,textAlign:"center",width:36,borderRight:"none"}}>
                      <button onClick={()=>delRow(row.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#d1d5db",fontSize:16,padding:"0 4px"}}
                        onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}>🗑</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding:"10px 20px 16px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12 }} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {/* Add row */}
            <div style={{display:"flex",position:"relative"}}>
              <button onClick={addRow} style={{height:30,padding:"0 12px",border:"1px solid #d1d5db",borderRadius:"4px 0 0 4px",background:"#fff",color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer",borderRight:"none"}}>Add row</button>
              <button onClick={()=>setAddRowDD(v=>!v)} style={{height:30,width:26,border:"1px solid #d1d5db",borderRadius:"0 4px 4px 0",background:"#fff",color:"#374151",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>▾</button>
              {addRowDD&&(
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
                  style={{height:28,padding:"0 10px",border:"1px solid",borderRadius:4,background:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4,borderColor:colsOpen?"#1a6496":"#d1d5db",color:colsOpen?"#1a6496":"#374151"}}>
                  Columns ({hiddenCount} hidden) ▾
                </button>
                {colsOpen&&(
                  <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:400,background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,boxShadow:"0 12px 32px rgba(0,0,0,.15)",width:240,padding:"12px 0 8px"}} onClick={e=>e.stopPropagation()}>
                    <div style={{padding:"0 14px 8px",fontSize:12,fontWeight:700,color:"#374151",borderBottom:"1px solid #f0f0f0",marginBottom:4}}>Show / hide columns</div>
                    <div style={{padding:"4px 14px 8px",fontSize:11,color:"#9ca3af",borderBottom:"1px solid #f5f5f5",marginBottom:4}}>Item, Qty, Price and Amount are always shown</div>
                    {ALL_COLS.map(col=>(
                      <label key={col.key} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 14px",cursor:"pointer",fontSize:13,color:"#374151"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f8fafd"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,borderRadius:3,border:"1.5px solid",flexShrink:0,borderColor:visibleCols[col.key]?"#1a6496":"#d1d5db",background:visibleCols[col.key]?"#1a6496":"#fff",transition:"all .15s"}}>
                          {visibleCols[col.key]&&<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #e5e7eb"}}>
              <span style={{color:"#374151",fontSize:13}}>Total tax</span>
              <span style={{fontSize:13,fontWeight:500}}>{totals.tax===0?"0.00":fmt(totals.tax)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 6px",borderTop:"2px solid #e5e7eb"}}>
              <span style={{fontSize:15,fontWeight:700,color:"#111827"}}>Total</span>
              <span style={{fontSize:15,fontWeight:700,color:"#111827"}}>{totals.total===0?"0.00":fmt(totals.total)}</span>
            </div>
          </div>
        </div>
        <div style={{borderTop:"1px solid #e5e7eb",padding:"10px 20px",textAlign:"center"}}>
          <span style={{color:"#1a6496",fontSize:13,cursor:"pointer",fontWeight:600}}>Switch back to older version</span>
        </div>
      </div>
    </div>
  );
}
