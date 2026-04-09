
import { useState } from "react";

const STATEMENT_TYPES = ["Activity","Outstanding","Invoices"];

const SAMPLE_DATA = [
  { id:1, name:"Acme Corp", accountNo:"ACC-001", email:"billing@acme.com", address:"123 Main St, Dubai, UAE", balance:4250.00, overdue:1200.00 },
  { id:2, name:"Blue Ocean LLC", accountNo:"ACC-002", email:"accounts@blueocean.ae", address:"456 Sheikh Zayed Rd, Dubai", balance:8750.50, overdue:0 },
  { id:3, name:"Desert Traders", accountNo:"ACC-003", email:"finance@deserttraders.com", address:"789 Business Bay, Dubai", balance:0, overdue:0 },
  { id:4, name:"Gulf Supplies Co", accountNo:"ACC-004", email:"gulfsupp@example.com", address:"321 Deira, Dubai, UAE", balance:15000.00, overdue:15000.00 },
  { id:5, name:"Horizon Services", accountNo:"ACC-005", email:"info@horizonsvc.ae", address:"654 JLT, Dubai, UAE", balance:3300.75, overdue:0 },
];

const fmt2 = v => Number(v).toFixed(2);

export default function StatementsPage({ onNavigate }) {
  const [stmtType,  setStmtType]  = useState("Activity");
  const [dateFrom,  setDateFrom]  = useState("2026-03-01");
  const [dateTo,    setDateTo]    = useState("2026-03-31");
  const [filterBy,  setFilterBy]  = useState("");
  const [selected,  setSelected]  = useState([]);
  const [data,      setData]      = useState(SAMPLE_DATA);
  const [sortField, setSortField] = useState("overdue");
  const [sortDir,   setSortDir]   = useState("desc");
  const [notify,    setNotify]    = useState(null);
  const [updated,   setUpdated]   = useState(false);

  const toast = msg => { setNotify(msg); setTimeout(()=>setNotify(null),3000); };

  const toggleAll = () => {
    if(selected.length===data.length) setSelected([]);
    else setSelected(data.map(r=>r.id));
  };
  const toggleRow = id => setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const handleSort = field => {
    if(sortField===field) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const filtered = data
    .filter(r=>!filterBy||r.name.toLowerCase().includes(filterBy.toLowerCase())||r.email.toLowerCase().includes(filterBy.toLowerCase())||r.accountNo.toLowerCase().includes(filterBy.toLowerCase()))
    .sort((a,b)=>{
      const va=a[sortField]??0, vb=b[sortField]??0;
      const cmp=typeof va==="string"?va.localeCompare(vb):va-vb;
      return sortDir==="asc"?cmp:-cmp;
    });

  const selS = { height:26,border:"1px solid #c5cdd8",borderRadius:3,fontSize:12,color:"#333",background:"#fff",padding:"0 22px 0 6px",outline:"none",appearance:"none",WebkitAppearance:"none",cursor:"pointer",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23888'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 5px center" };
  const TH  = { padding:"8px 10px",fontSize:12,fontWeight:600,color:"#1a6496",background:"#f0f4f8",borderBottom:"1px solid #cdd5df",borderRight:"1px solid #cdd5df",whiteSpace:"nowrap",cursor:"pointer",userSelect:"none",textAlign:"left" };
  const TD  = { padding:"8px 10px",fontSize:12,color:"#333",borderBottom:"1px solid #e8ecf0",borderRight:"1px solid #e8ecf0",verticalAlign:"middle" };

  return (
    <div style={{ fontFamily:"Arial,Helvetica,sans-serif",background:"#eef0f3",minHeight:"100vh",fontSize:13 }}>
      {notify&&<div style={{ position:"fixed",top:16,right:16,zIndex:9999,background:"#1d7a3c",color:"#fff",padding:"10px 18px",borderRadius:4,fontSize:13,fontWeight:600 }}>{notify}</div>}

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
        </p>
        <h1 style={{ margin:0,fontSize:20,fontWeight:700,color:"#222" }}>Statements</h1>
      </div>

      <div style={{ padding:"16px 20px" }}>
        {/* What's this */}
        <div style={{ marginBottom:12 }}>
          <span style={{ color:"#e8a000",fontSize:12,fontWeight:600,cursor:"pointer" }}>What's this? 💬</span>
        </div>

        {/* Filter card */}
        <div style={{ background:"#dde8f0",border:"1px solid #bccfdd",borderRadius:4,padding:"14px 16px",marginBottom:16 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
            <div>
              <span style={{ fontSize:12,fontWeight:700,color:"#333",marginRight:8 }}>Statement Type</span>
              <select value={stmtType} onChange={e=>setStmtType(e.target.value)} style={{ ...selS,width:120 }}>
                {STATEMENT_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <span style={{ fontSize:12,color:"#555" }}>between</span>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
              style={{ ...selS,padding:"0 8px",width:120 }}/>
            <span style={{ fontSize:12,color:"#555" }}>and</span>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
              style={{ ...selS,padding:"0 8px",width:120 }}/>
            <span style={{ fontSize:12,color:"#555" }}>Filter by</span>
            <input value={filterBy} onChange={e=>setFilterBy(e.target.value)}
              placeholder="Contact, account no., email or postal address"
              style={{ height:26,border:"1px solid #c5cdd8",borderRadius:3,fontSize:12,padding:"0 8px",outline:"none",width:280 }}
              onFocus={e=>e.target.style.borderColor="#1a6496"} onBlur={e=>e.target.style.borderColor="#c5cdd8"}/>
            <button onClick={()=>{ setUpdated(true); toast("Statements updated."); }}
              style={{ height:28,padding:"0 18px",border:"none",borderRadius:3,background:"#4ea8d2",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Update</button>
          </div>
        </div>

        {/* Print / Email bar */}
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"6px 0",borderBottom:"1px solid #dde3ea" }}>
          <button style={{ height:26,padding:"0 12px",border:"1px solid #bbb",borderRadius:3,background:"#f5f5f5",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:"#444" }}
            onClick={()=>toast("Printing...")}>
            📄 Print
          </button>
          <button style={{ height:26,padding:"0 12px",border:"1px solid #bbb",borderRadius:3,background:"#f5f5f5",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:"#444" }}
            onClick={()=>toast(selected.length===0?"Please select contacts first.":"Emailing...")}>
            ✉ Email
          </button>
          <span style={{ fontSize:12,color:"#888",marginLeft:4 }}>
            {selected.length===0?"No items selected":`${selected.length} item${selected.length>1?"s":""} selected`}
          </span>
        </div>

        {/* Table */}
        <div style={{ background:"#fff",border:"1px solid #cdd5df",borderRadius:4,overflow:"hidden" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={{ ...TH,width:36,borderRight:"1px solid #cdd5df",padding:"8px 10px" }}>
                  <input type="checkbox" checked={selected.length===filtered.length&&filtered.length>0}
                    onChange={toggleAll} style={{cursor:"pointer"}}/>
                </th>
                {[
                  {key:"name",          label:"Name"},
                  {key:"accountNo",     label:"Account No."},
                  {key:"email",         label:"Email"},
                  {key:"address",       label:"Address"},
                  {key:"balance",       label:"Outstanding Balance"},
                  {key:"overdue",       label:"Overdue"},
                ].map(col=>(
                  <th key={col.key} style={{ ...TH, borderRight: col.key==="overdue"?"none":"1px solid #cdd5df",
                    background: col.key==="overdue"?"#4ea8d2":"#f0f4f8", color: col.key==="overdue"?"#fff":"#1a6496" }}
                    onClick={()=>handleSort(col.key)}>
                    {col.key===sortField&&<span style={{marginRight:4}}>{sortDir==="asc"?"▲":"▼"}</span>}
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0?(
                <tr><td colSpan={7} style={{ padding:"24px",textAlign:"center",color:"#999",fontSize:13,borderBottom:"1px solid #e8ecf0" }}>No statements found.</td></tr>
              ):filtered.map((row,idx)=>(
                <tr key={row.id}
                  style={{ background:idx%2===0?"#fff":"#fafbfc" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#f0f7fd"}
                  onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#fafbfc"}>
                  <td style={{ ...TD,textAlign:"center",borderRight:"1px solid #e8ecf0" }}>
                    <input type="checkbox" checked={selected.includes(row.id)} onChange={()=>toggleRow(row.id)} style={{cursor:"pointer"}}/>
                  </td>
                  <td style={{ ...TD,color:"#1a6496",fontWeight:600,cursor:"pointer" }} onClick={()=>toast(`Opening ${row.name}`)}>{row.name}</td>
                  <td style={TD}>{row.accountNo}</td>
                  <td style={{ ...TD,color:"#1a6496" }}>{row.email}</td>
                  <td style={TD}>{row.address}</td>
                  <td style={{ ...TD,textAlign:"right",fontWeight:600 }}>{fmt2(row.balance)}</td>
                  <td style={{ ...TD,textAlign:"right",fontWeight:600,borderRight:"none",color:row.overdue>0?"#c53030":"#333" }}>{fmt2(row.overdue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
