
import { useState, useRef } from "react";

export default function ImportInvoicesPage({ onNavigate }) {
  const [file,        setFile]        = useState(null);
  const [addrUpdate,  setAddrUpdate]  = useState("no");
  const [taxMode,     setTaxMode]     = useState("exclusive");
  const [importing,   setImporting]   = useState(false);
  const [notify,      setNotify]      = useState(null);
  const fileRef = useRef(null);

  const toast = msg => { setNotify(msg); setTimeout(()=>setNotify(null),3500); };

  const handleImport = () => {
    if (!file) { toast("⚠ Please select a file to import."); return; }
    setImporting(true);
    setTimeout(()=>{ setImporting(false); toast("✓ Import started successfully."); },1200);
  };

  return (
    <div style={{ fontFamily:"Arial,Helvetica,sans-serif",background:"#eef0f3",minHeight:"100vh",fontSize:13 }}>
      {notify&&<div style={{ position:"fixed",top:16,right:16,zIndex:9999,background:notify.startsWith("⚠")?"#b45309":"#1d7a3c",color:"#fff",padding:"10px 18px",borderRadius:4,fontSize:13,fontWeight:600 }}>{notify}</div>}

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
        <h1 style={{ margin:0,fontSize:20,fontWeight:700,color:"#222" }}>Import your sales invoices</h1>
      </div>

      <div style={{ padding:"20px",maxWidth:680 }}>
        <div style={{ background:"#dde8f0",border:"1px solid #bccfdd",borderRadius:4,padding:"20px 24px" }}>

          {/* Title */}
          <h2 style={{ margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#222" }}>Import your invoices</h2>
          <p style={{ margin:"0 0 16px",fontSize:12,color:"#555" }}>
            To import invoices from another system please follow the steps below...
          </p>

          {/* Step 1 */}
          <div style={{ borderTop:"1px solid #bccfdd",paddingTop:14,marginBottom:14 }}>
            <h3 style={{ margin:"0 0 8px",fontSize:13,fontWeight:700,color:"#222" }}>Step 1. Download our invoices template file</h3>
            <p style={{ margin:"0 0 10px",fontSize:12,color:"#555",lineHeight:1.6 }}>
              Start by downloading our invoices CSV (Comma Separated Values) template file. This file has the correct column headings Xero needs to import your invoice data.
            </p>
            <button style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#1a6496",fontSize:12,fontWeight:700,cursor:"pointer",padding:0 }}
              onClick={()=>toast("Downloading template...")}>
              <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,background:"#1a6496",borderRadius:2,color:"#fff",fontSize:10,fontWeight:700 }}>📊</span>
              Download template file
            </button>
          </div>

          {/* Step 2 */}
          <div style={{ borderTop:"1px solid #bccfdd",paddingTop:14,marginBottom:14 }}>
            <h3 style={{ margin:"0 0 8px",fontSize:13,fontWeight:700,color:"#222" }}>Step 2. Copy your invoices into the template</h3>
            <p style={{ margin:"0 0 8px",fontSize:12,color:"#555",lineHeight:1.6 }}>
              Export your invoices from your old system as a comma separated list. Using Excel or another spreadsheet editor, copy and paste your invoices from the exported file into the Xero template. Make sure the invoice data you copy matches the column headings provided in the template.
            </p>
            <p style={{ margin:"0 0 4px",fontSize:12,color:"#c53030",fontWeight:700 }}>
              IMPORTANT: Do not change the column headings provided in the Xero template. These need to be unchanged for the import to work in the next step.
            </p>
            <p style={{ margin:0,fontSize:12,color:"#c53030" }}>
              Dates must be in the format 25/12/2026 or 25 Dec 2026.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{ borderTop:"1px solid #bccfdd",paddingTop:14 }}>
            <h3 style={{ margin:"0 0 14px",fontSize:13,fontWeight:700,color:"#222" }}>Step 3. Import the updated template file</h3>

            {/* File select */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"#333",marginBottom:8 }}>Select the file to import</div>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <button onClick={()=>fileRef.current?.click()}
                  style={{ height:28,padding:"0 14px",border:"1px solid #bbb",borderRadius:3,background:"#e8e8e8",fontSize:12,color:"#333",cursor:"pointer",fontWeight:600 }}>Browse</button>
                <span style={{ fontSize:12,color:"#888" }}>{file?file.name:"No file selected"}</span>
                <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}}
                  onChange={e=>setFile(e.target.files?.[0]||null)}/>
              </div>
              <p style={{ margin:"8px 0 0",fontSize:11,color:"#777" }}>
                The file you import must be a CSV (Comma Separated Values) file. The name of your file should end with either <strong>.csv</strong> or <strong>.txt</strong>.
              </p>
            </div>

            {/* Address question */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"#333",marginBottom:8 }}>Would you like to update contact address details?</div>
              {[["no","No, ignore all address details"],["yes","Yes, update contacts with imported address details"]].map(([v,l])=>(
                <label key={v} style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5,cursor:"pointer",fontSize:12,color:"#444" }}>
                  <input type="radio" name="addr" value={v} checked={addrUpdate===v} onChange={()=>setAddrUpdate(v)} style={{cursor:"pointer",accentColor:"#1a6496"}}/>
                  {l}
                </label>
              ))}
            </div>

            {/* Tax question */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"#333",marginBottom:8 }}>Is the UnitAmount field tax inclusive or exclusive?</div>
              {[["exclusive","Tax Exclusive"],["inclusive","Tax Inclusive"]].map(([v,l])=>(
                <label key={v} style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5,cursor:"pointer",fontSize:12,color:"#444" }}>
                  <input type="radio" name="tax" value={v} checked={taxMode===v} onChange={()=>setTaxMode(v)} style={{cursor:"pointer",accentColor:"#1a6496"}}/>
                  {l}
                </label>
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display:"flex",justifyContent:"flex-end",gap:10,paddingTop:12,borderTop:"1px solid #bccfdd" }}>
              <button onClick={handleImport} disabled={importing}
                style={{ height:30,padding:"0 20px",border:"none",borderRadius:3,background:importing?"#7aa8c4":"#4ea8d2",color:"#fff",fontSize:12,fontWeight:700,cursor:importing?"not-allowed":"pointer" }}>
                {importing?"Importing...":"Import"}
              </button>
              <button onClick={()=>onNavigate?.("invoices")}
                style={{ height:30,padding:"0 16px",border:"1px solid #bbb",borderRadius:3,background:"#e0e0e0",color:"#555",fontSize:12,fontWeight:600,cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
