
import { useState } from "react";

const DEFAULT_REMINDERS = [
  { id:1, days:7,  label:"7 days overdue"  },
  { id:2, days:14, label:"14 days overdue" },
  { id:3, days:21, label:"21 days overdue" },
];

export default function InvoiceRemindersPage({ onNavigate }) {
  const [enabled,       setEnabled]       = useState(false);
  const [reminders,     setReminders]     = useState(DEFAULT_REMINDERS);
  const [incButton,     setIncButton]     = useState(true);
  const [incPDF,        setIncPDF]        = useState(true);
  const [dontSendUnder, setDontSendUnder] = useState(false);
  const [underAmt,      setUnderAmt]      = useState("1.00");
  const [showHelp,      setShowHelp]      = useState(true);
  const [editingId,     setEditingId]     = useState(null);
  const [editDays,      setEditDays]      = useState("");
  const [notify,        setNotify]        = useState(null);

  const toast = msg => { setNotify(msg); setTimeout(()=>setNotify(null),3000); };

  const addReminder = () => {
    const newId = Math.random().toString(36).slice(2);
    setReminders(p=>[...p,{id:newId,days:30,label:"30 days overdue"}]);
  };
  const removeReminder = id => setReminders(p=>p.filter(r=>r.id!==id));
  const startEdit = r => { setEditingId(r.id); setEditDays(String(r.days)); };
  const saveEdit  = id => {
    const d=parseInt(editDays)||7;
    setReminders(p=>p.map(r=>r.id===id?{...r,days:d,label:`${d} days overdue`}:r));
    setEditingId(null);
  };

  const handleSave = () => toast("✓ Invoice reminders saved.");

  const selS = { height:24,border:"1px solid #c5cdd8",borderRadius:3,fontSize:12,color:"#333",background:"#fff",padding:"0 20px 0 6px",outline:"none",appearance:"none",WebkitAppearance:"none",cursor:"pointer",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23888'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 5px center" };

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
          <span style={{color:"#1a6496",cursor:"pointer"}}>Invoice Settings</span>
          <span style={{margin:"0 5px"}}>›</span>
        </p>
        <h1 style={{ margin:0,fontSize:20,fontWeight:700,color:"#222" }}>Invoice Reminders</h1>
      </div>

      <div style={{ padding:"20px",maxWidth:1060 }}>

        {/* Help banner */}
        {showHelp&&(
          <div style={{ background:"#fff",border:"1px solid #dde3ea",borderRadius:4,padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"flex-start",gap:16,position:"relative" }}>
            {/* Illustration placeholder */}
            <div style={{ width:180,height:100,background:"#f0f4f8",borderRadius:4,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32 }}>📋▶📦</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14,fontWeight:700,color:"#222",marginBottom:8 }}>Let us follow up overdue invoices for you.</div>
              <div style={{ fontSize:12,color:"#555",marginBottom:6 }}>Choose the frequency that you would like reminders to be sent.</div>
              <div style={{ fontSize:12,color:"#555" }}>
                Turn off reminders for any customers or invoices you don't want to chase.{" "}
                <span style={{color:"#1a6496",cursor:"pointer",fontWeight:600}}>Learn more</span>
              </div>
            </div>
            <button onClick={()=>setShowHelp(false)}
              style={{ position:"absolute",top:10,right:12,background:"none",border:"none",color:"#888",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
              Hide Help ✕
            </button>
          </div>
        )}

        {/* Main settings card */}
        <div style={{ background:"#fff",border:"1px solid #dde3ea",borderRadius:4,overflow:"hidden" }}>

          {/* Email toggle checkbox */}
          <div style={{ padding:"14px 20px",borderBottom:"1px solid #eef0f3" }}>
            <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:"#333",fontWeight:600 }}>
              <input type="checkbox" checked={enabled} onChange={()=>setEnabled(v=>!v)} style={{cursor:"pointer",width:14,height:14,accentColor:"#1a6496"}}/>
              Email customers when an invoice is...
            </label>
          </div>

          {/* Reminder cards row */}
          <div style={{ padding:"16px 20px",display:"flex",gap:0,alignItems:"stretch",opacity:enabled?1:0.45,pointerEvents:enabled?"auto":"none" }}>
            {reminders.map((r,i)=>(
              <div key={r.id} style={{ display:"flex",alignItems:"center",gap:0 }}>
                {/* Connector line between cards */}
                {i>0&&<div style={{ width:24,height:2,background:"#dde3ea",flexShrink:0 }}/>}
                {/* Card */}
                <div style={{ border:"1px solid #dde3ea",borderRadius:4,padding:"14px 16px",minWidth:120,textAlign:"center",position:"relative",background:"#fafbfc" }}>
                  {/* Delete X */}
                  <button onClick={()=>removeReminder(r.id)}
                    style={{ position:"absolute",top:4,right:6,background:"none",border:"none",color:"#bbb",fontSize:14,cursor:"pointer",lineHeight:1 }}
                    onMouseEnter={e=>e.currentTarget.style.color="#e53e3e"}
                    onMouseLeave={e=>e.currentTarget.style.color="#bbb"}>×</button>
                  <div style={{ fontSize:20,marginBottom:6 }}>✉</div>
                  {editingId===r.id?(
                    <div style={{ display:"flex",flexDirection:"column",gap:4,alignItems:"center" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                        <input value={editDays} onChange={e=>setEditDays(e.target.value)}
                          style={{ width:40,height:22,border:"1px solid #c5cdd8",borderRadius:3,fontSize:12,textAlign:"center",outline:"none" }}/>
                        <span style={{ fontSize:11,color:"#555" }}>days overdue</span>
                      </div>
                      <button onClick={()=>saveEdit(r.id)}
                        style={{ height:22,padding:"0 10px",border:"none",borderRadius:3,background:"#1a6496",color:"#fff",fontSize:11,cursor:"pointer" }}>Save</button>
                    </div>
                  ):(
                    <>
                      <div style={{ fontSize:12,color:"#555",marginBottom:4 }}>{r.label}</div>
                      <button onClick={()=>startEdit(r)} style={{ background:"none",border:"none",color:"#1a6496",fontSize:11,cursor:"pointer",fontWeight:600 }}>Edit</button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Dashed add reminder */}
            <div style={{ display:"flex",alignItems:"center" }}>
              <div style={{ width:24,height:2,background:"#dde3ea",flexShrink:0 }}/>
              <button onClick={addReminder}
                style={{ border:"2px dashed #dde3ea",borderRadius:4,padding:"14px 16px",minWidth:120,textAlign:"center",background:"none",cursor:"pointer",color:"#888",fontSize:12,fontWeight:600 }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#1a6496"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#dde3ea"}>
                + Add reminder
              </button>
            </div>
          </div>

          {/* Options */}
          <div style={{ padding:"12px 20px 16px",borderTop:"1px solid #eef0f3",opacity:enabled?1:0.45,pointerEvents:enabled?"auto":"none" }}>
            <label style={{ display:"flex",alignItems:"center",gap:7,marginBottom:8,cursor:"pointer",fontSize:12,color:"#555" }}>
              <input type="checkbox" checked={incButton} onChange={()=>setIncButton(v=>!v)} style={{cursor:"pointer",accentColor:"#1a6496"}}/>
              Include button to online invoice and detail summary
            </label>
            <label style={{ display:"flex",alignItems:"center",gap:7,marginBottom:8,cursor:"pointer",fontSize:12,color:"#555" }}>
              <input type="checkbox" checked={incPDF} onChange={()=>setIncPDF(v=>!v)} style={{cursor:"pointer",accentColor:"#1a6496"}}/>
              Include a link to the invoice PDF
            </label>
            <label style={{ display:"flex",alignItems:"center",gap:7,marginBottom:10,cursor:"pointer",fontSize:12,color:"#555" }}>
              <input type="checkbox" checked={dontSendUnder} onChange={()=>setDontSendUnder(v=>!v)} style={{cursor:"pointer",accentColor:"#1a6496"}}/>
              Don't send reminders for amounts owing on an invoice under
              <input value={underAmt} onChange={e=>setUnderAmt(e.target.value)}
                style={{ width:60,height:22,border:"1px solid #c5cdd8",borderRadius:3,fontSize:12,padding:"0 6px",outline:"none",textAlign:"right",marginLeft:4 }}/>
            </label>
            <div style={{ fontSize:12,color:"#555",marginTop:4 }}>
              Send replies to <span style={{ fontWeight:600 }}>xyz@gmail.com</span>
            </div>
          </div>

          {/* Footer: Save */}
          <div style={{ background:"#f7f8f9",borderTop:"1px solid #dde3ea",padding:"10px 20px",display:"flex",justifyContent:"flex-end" }}>
            <button onClick={handleSave}
              style={{ height:30,padding:"0 20px",border:"1px solid #bbb",borderRadius:3,background:enabled?"#e8e8e8":"#e0e0e0",color:enabled?"#333":"#999",fontSize:12,fontWeight:600,cursor:"pointer" }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
