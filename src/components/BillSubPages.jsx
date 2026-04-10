import { useState, useRef, useEffect } from "react";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Textarea }  from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea }from "@/components/ui/scroll-area";
import { Switch }    from "@/components/ui/switch";
import { Badge }     from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// ─── Shared constants ─────────────────────────────────────────────────────────
const EXPENSE_ACCOUNTS = [
  "Advertising","Bank Fees","Cleaning","Consulting & Accounting",
  "Depreciation","Entertainment","Freight & Courier","General Expenses",
  "Insurance","Interest Expense","Legal Expenses","Light, Power, Heating",
  "Motor Vehicle Expenses","Office Expenses","Printing & Stationery",
  "Purchases","Rent","Repairs and Maintenance","Salaries",
  "Subscriptions","Telephone & Internet","Travel & Accommodation","Wages",
];
const TAX_OPTIONS = [
  "No Tax (0%)","Tax on Purchases (0%)","Tax Exempt (0%)",
  "15% VAT","20% Standard Rate",
];
const CURRENCIES = ["AED","AUD","USD","GBP","EUR","NZD","SGD","CAD"];
const PAYMENT_TERMS = ["Due on Receipt","7 Days","14 Days","30 Days","60 Days","End of Month"];
const REPEAT_FREQ   = ["Daily","Weekly","Fortnightly","Monthly","Every 2 Months","Quarterly","Every 6 Months","Annually"];

const emptyRow = () => ({
  id: Math.random().toString(36).slice(2),
  desc:"", qty:"1", price:"", account:"", tax:TAX_OPTIONS[0],
});

const num  = v => parseFloat((v||"0").toString().replace(/,/g,""))||0;
const fmt  = v => isNaN(v) ? "0.00" : Number(v).toFixed(2);

// ─── Shared helpers ───────────────────────────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <Label style={{ fontSize:12, fontWeight:600, color:"#444", display:"block", marginBottom:4 }}>
      {children}{required && <span style={{ color:"#c00", marginLeft:2 }}>*</span>}
    </Label>
  );
}

function ChevronDown({ size=10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  );
}

const inputSm = "h-8 text-[13px] border-gray-300 rounded focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0";
const selSm   = "h-8 text-[13px] border-gray-300 rounded focus:ring-1 focus:ring-[#1a7cb5]";

// ─── Page shell ───────────────────────────────────────────────────────────────
function PageShell({ title, breadcrumbs, children, onNavigate, topActions }) {
  return (
    <div style={{ fontFamily:"Arial,Helvetica,sans-serif", background:"#f5f7f9",
      minHeight:"calc(100vh - 48px)", fontSize:13, color:"#333" }}>
      <style>{`
        @keyframes ddFadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        .bill-line-td{padding:5px 6px;border-bottom:1px solid #f0f0f0;vertical-align:top}
        .bill-line-row:hover td{background:#f8fafc}
        @media(max-width:640px){
          .bill-form-grid-2{grid-template-columns:1fr!important}
          .bill-form-grid-3{grid-template-columns:1fr 1fr!important}
          .bill-actions-row{flex-wrap:wrap!important;gap:6px!important}
        }
      `}</style>

      <ScrollArea style={{ height:"calc(100vh - 48px)" }}>
        {/* Sub-header */}
        <div style={{ background:"#fff", borderBottom:"1px solid #e0e0e0", padding:"12px 20px 0" }}>
          <p style={{ fontSize:12, color:"#888", margin:"0 0 3px" }}>
            {breadcrumbs.map((bc, i) => (
              <span key={i}>
                {bc.page
                  ? <span style={{ color:"#1a7cb5", cursor:"pointer" }}
                      onClick={()=>onNavigate(bc.page)}>{bc.label}</span>
                  : <span>{bc.label}</span>
                }
                {i < breadcrumbs.length-1 && <span style={{ margin:"0 5px", color:"#ccc" }}>›</span>}
              </span>
            ))}
          </p>

          <div className="bill-actions-row"
            style={{ display:"flex", alignItems:"flex-start",
              justifyContent:"space-between", gap:10, marginBottom:10, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1a1a1a" }}>{title}</h1>
              <Badge style={{ background:"#f3f4f6", color:"#6b7280",
                border:"1px solid #e5e7eb", fontSize:11, fontWeight:700, padding:"2px 8px" }}>
                Draft
              </Badge>
            </div>
            {topActions}
          </div>
        </div>

        <div style={{ padding:16 }}>{children}</div>
      </ScrollArea>
    </div>
  );
}

// ─── Line items table ─────────────────────────────────────────────────────────
function LineItemsTable({ rows, setRows, currency = "AED" }) {
  const updateRow = (id,f,v) => setRows(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const addRow    = ()=>setRows(p=>[...p,emptyRow()]);
  const delRow    = id=>setRows(p=>p.length>1?p.filter(r=>r.id!==id):p);
  const lineAmt   = r=>fmt(num(r.qty)*num(r.price));

  const thSt = { padding:"8px 8px", fontSize:11, fontWeight:700, color:"#1a7cb5",
    background:"#eaf4fb", borderBottom:"2px solid #c6dff0", whiteSpace:"nowrap" };

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", minWidth:640 }}>
        <thead>
          <tr>
            <th style={{ ...thSt, width:"28%" }}>Description</th>
            <th style={{ ...thSt, width:"8%"  }}>Qty</th>
            <th style={{ ...thSt, width:"12%" }}>Unit Price</th>
            <th style={{ ...thSt, width:"20%" }}>Account</th>
            <th style={{ ...thSt, width:"16%" }}>Tax Rate</th>
            <th style={{ ...thSt, width:"12%", textAlign:"right" }}>Amount</th>
            <th style={{ ...thSt, width:"4%"  }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="bill-line-row">
              <td className="bill-line-td">
                <Input value={row.desc} onChange={e=>updateRow(row.id,"desc",e.target.value)}
                  placeholder="Description" className="h-7 text-[12px] border-gray-200"/>
              </td>
              <td className="bill-line-td">
                <Input value={row.qty} onChange={e=>updateRow(row.id,"qty",e.target.value)}
                  className="h-7 text-[12px] border-gray-200 text-right" style={{ minWidth:50 }}/>
              </td>
              <td className="bill-line-td">
                <Input value={row.price} onChange={e=>updateRow(row.id,"price",e.target.value)}
                  placeholder="0.00" className="h-7 text-[12px] border-gray-200 text-right" style={{ minWidth:80 }}/>
              </td>
              <td className="bill-line-td">
                <Select value={row.account} onValueChange={v=>updateRow(row.id,"account",v)}>
                  <SelectTrigger className="h-7 text-[12px] border-gray-200" style={{ minWidth:110 }}>
                    <SelectValue placeholder="Select…"/>
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {EXPENSE_ACCOUNTS.map(a=><SelectItem key={a} value={a} className="text-[12px]">{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>
              <td className="bill-line-td">
                <Select value={row.tax} onValueChange={v=>updateRow(row.id,"tax",v)}>
                  <SelectTrigger className="h-7 text-[12px] border-gray-200" style={{ minWidth:110 }}>
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_OPTIONS.map(t=><SelectItem key={t} value={t} className="text-[12px]">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>
              <td className="bill-line-td" style={{ textAlign:"right", fontWeight:600,
                color:"#1a1a1a", whiteSpace:"nowrap", paddingRight:10 }}>
                {currency} {lineAmt(row)}
              </td>
              <td className="bill-line-td" style={{ textAlign:"center" }}>
                <button onClick={()=>delRow(row.id)}
                  style={{ background:"none", border:"none", cursor:"pointer",
                    color:"#ccc", fontSize:18, lineHeight:1, padding:0 }}
                  onMouseEnter={e=>e.currentTarget.style.color="#c00"}
                  onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding:"8px 0" }}>
        <Button variant="outline" onClick={addRow}
          style={{ fontSize:12, fontWeight:700, height:30, padding:"0 12px",
            borderRadius:3, borderColor:"#1a7cb5", color:"#1a7cb5" }}>
          + Add Line
        </Button>
      </div>
    </div>
  );
}

// ─── Totals block ─────────────────────────────────────────────────────────────
function TotalsBlock({ rows, currency }) {
  const subtotal = rows.reduce((s,r)=>s+num(r.qty)*num(r.price),0);
  const tax      = rows.reduce((s,r)=>{
    const rate = r.tax.startsWith("15%")?0.15:r.tax.startsWith("20%")?0.20:0;
    return s+num(r.qty)*num(r.price)*rate;
  },0);
  const total = subtotal+tax;

  return (
    <div style={{ minWidth:240, fontSize:13 }}>
      {[
        { label:"Subtotal",   val:subtotal, bold:false },
        { label:"Tax",        val:tax,      bold:false },
      ].map(row=>(
        <div key={row.label} style={{ display:"flex", justifyContent:"space-between",
          padding:"5px 0", borderBottom:"1px solid #f0f0f0" }}>
          <span style={{ color:"#666" }}>{row.label}</span>
          <span style={{ fontWeight:600 }}>{currency} {fmt(row.val)}</span>
        </div>
      ))}
      <div style={{ display:"flex", justifyContent:"space-between",
        padding:"8px 0 4px", borderTop:"2px solid #e0e0e0", marginTop:2 }}>
        <span style={{ fontWeight:700, fontSize:15 }}>Total</span>
        <span style={{ fontWeight:800, fontSize:15, color:"#1a7cb5" }}>{currency} {fmt(total)}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between",
        padding:"4px 0", borderTop:"1px solid #f0f0f0" }}>
        <span style={{ color:"#1a7cb5", fontWeight:700 }}>Amount Due</span>
        <span style={{ color:"#1a7cb5", fontWeight:800 }}>{currency} {fmt(total)}</span>
      </div>
    </div>
  );
}

// ─── Bottom action bar ────────────────────────────────────────────────────────
function BottomBar({ onDiscard, onSave, onApprove, isSaving, saveLabel="Save Draft" }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 16px", display:"flex", alignItems:"center",
      justifyContent:"space-between", flexWrap:"wrap", gap:8, marginTop:12 }}>
      <Button variant="outline" onClick={onDiscard}
        style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px",
          borderRadius:4, borderColor:"#bbb", color:"#c00" }}>
        Discard
      </Button>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <Button variant="outline" onClick={()=>onSave(true)}
          style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px",
            borderRadius:4, borderColor:"#bbb", color:"#444" }}>
          Save &amp; Close
        </Button>
        <Button onClick={()=>onSave(false)} disabled={isSaving}
          style={{ background:"#1a7cb5", color:"#fff", fontSize:13,
            fontWeight:700, height:32, padding:"0 12px", borderRadius:4 }}
          className="hover:bg-[#155f8d]">
          {isSaving?"Saving…":saveLabel}
        </Button>
        {onApprove && (
          <Button onClick={onApprove}
            style={{ background:"#1a7cb5", color:"#fff", fontSize:13,
              fontWeight:700, height:32, padding:"0 12px", borderRadius:4 }}
            className="hover:bg-[#155f8d]">
            Approve
          </Button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. NEW BILL PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function NewBillPage({ onNavigate }) {
  const [supplier,   setSupplier]   = useState("");
  const [billDate,   setBillDate]   = useState(new Date().toISOString().slice(0,10));
  const [dueDate,    setDueDate]    = useState("");
  const [billNum,    setBillNum]    = useState("BILL-0011");
  const [reference,  setReference]  = useState("");
  const [currency,   setCurrency]   = useState("AED");
  const [amountsAre, setAmountsAre] = useState("Tax Exclusive");
  const [terms,      setTerms]      = useState("30 Days");
  const [rows,       setRows]       = useState([emptyRow()]);
  const [notes,      setNotes]      = useState("");
  const [attachFile, setAttachFile] = useState(null);
  const [discardOpen,setDiscardOpen]= useState(false);
  const [isSaving,   setIsSaving]   = useState(false);
  const [activeTab,  setActiveTab]  = useState("details");
  const fileRef = useRef(null);

  const save = (andClose=false) => {
    if (!supplier.trim()) return toast.error("Supplier is required.");
    setIsSaving(true);
    setTimeout(()=>{
      setIsSaving(false);
      toast.success("✓ Bill saved as draft.");
      if(andClose) onNavigate("bills");
    },500);
  };
  const approve = ()=>{
    if(!supplier.trim()) return toast.error("Supplier is required.");
    toast.success("✓ Bill approved.");
    onNavigate("bills");
  };

  const topActions = (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
      <Button variant="outline" onClick={()=>toast.info("Preview — coming soon.")}
        style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px",
          borderRadius:4, borderColor:"#bbb", color:"#444" }}>Preview</Button>
      <Button variant="outline" onClick={()=>save(false)} disabled={isSaving}
        style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px",
          borderRadius:4, borderColor:"#bbb", color:"#444" }}>
        {isSaving?"Saving…":"Save Draft"}
      </Button>
      {/* Approve split button */}
      <div style={{ display:"flex" }}>
        <Button onClick={approve}
          style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700,
            height:32, padding:"0 12px", borderRadius:"4px 0 0 4px",
            borderRight:"1px solid rgba(255,255,255,.3)" }}
          className="hover:bg-[#155f8d]">Approve</Button>
        <Button onClick={()=>toast.info("Approve & Email — coming soon.")}
          style={{ background:"#1a7cb5", color:"#fff", height:32, padding:"0 9px",
            borderRadius:"0 4px 4px 0" }}
          className="hover:bg-[#155f8d]">
          <ChevronDown size={10}/>
        </Button>
      </div>
      <Button variant="outline" onClick={()=>setDiscardOpen(true)}
        style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px",
          borderRadius:4, borderColor:"#bbb", color:"#c00" }}>Discard</Button>
    </div>
  );

  return (
    <PageShell
      title="New Bill"
      breadcrumbs={[
        {label:"Purchases",   page:"purchases-overview"},
        {label:"Bills",       page:"bills"},
        {label:"New Bill"},
      ]}
      onNavigate={onNavigate}
      topActions={topActions}
    >
      {/* Tabs */}
      <div style={{ display:"flex", gap:0, background:"#fff", marginBottom:16,
        borderBottom:"1px solid #e0e0e0", marginTop:-8 }}>
        {["details","history"].map(t=>(
          <button key={t}
            onClick={()=>setActiveTab(t)}
            style={{ padding:"9px 16px", fontSize:13, fontWeight:activeTab===t?700:400,
              cursor:"pointer", border:"none", background:"none",
              color:activeTab===t?"#1a7cb5":"#555",
              borderBottom:activeTab===t?"3px solid #1a7cb5":"3px solid transparent" }}>
            {t==="details"?"Details":"History & Notes"}
          </button>
        ))}
      </div>

      {activeTab==="details" ? (
        <>
          {/* Main card */}
          <div style={{ background:"#fff", border:"1px solid #e2e8f0",
            borderRadius:8, overflow:"hidden", marginBottom:0 }}>
            <div style={{ padding:16 }}>

              {/* Top fields */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)",
                gap:12, marginBottom:12 }} className="bill-form-grid-2">
                <div style={{ gridColumn:"span 2" }}>
                  <FieldLabel required>Supplier</FieldLabel>
                  <Input value={supplier} onChange={e=>setSupplier(e.target.value)}
                    placeholder="Search or enter supplier…" className={inputSm}/>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
                gap:12, marginBottom:12 }} className="bill-form-grid-3">
                <div>
                  <FieldLabel>Date</FieldLabel>
                  <Input type="date" value={billDate} onChange={e=>setBillDate(e.target.value)} className={inputSm}/>
                </div>
                <div>
                  <FieldLabel>Due Date</FieldLabel>
                  <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className={inputSm}/>
                </div>
                <div>
                  <FieldLabel>Payment Terms</FieldLabel>
                  <Select value={terms} onValueChange={setTerms}>
                    <SelectTrigger className={selSm}><SelectValue/></SelectTrigger>
                    <SelectContent>{PAYMENT_TERMS.map(t=><SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Bill Number</FieldLabel>
                  <Input value={billNum} onChange={e=>setBillNum(e.target.value)} className={inputSm}/>
                </div>
                <div>
                  <FieldLabel>Reference</FieldLabel>
                  <Input value={reference} onChange={e=>setReference(e.target.value)} placeholder="e.g. PO-0011" className={inputSm}/>
                </div>
                <div>
                  <FieldLabel>Currency</FieldLabel>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className={selSm}><SelectValue/></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c=><SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Amounts Are</FieldLabel>
                  <Select value={amountsAre} onValueChange={setAmountsAre}>
                    <SelectTrigger className={selSm}><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {["Tax Exclusive","Tax Inclusive","No Tax"].map(o=><SelectItem key={o} value={o} className="text-[13px]">{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-3"/>

              {/* Line items */}
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", marginBottom:8 }}>
                  Line Items
                </div>
                <LineItemsTable rows={rows} setRows={setRows} currency={currency}/>
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
                  <TotalsBlock rows={rows} currency={currency}/>
                </div>
              </div>

              <Separator className="my-3"/>

              {/* Notes + Attachment */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}
                className="bill-form-grid-2">
                <div>
                  <FieldLabel>Notes</FieldLabel>
                  <Textarea value={notes} onChange={e=>setNotes(e.target.value)}
                    placeholder="Internal notes…" rows={3}
                    className="text-[13px] border-gray-300 resize-none rounded focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
                </div>
                <div>
                  <FieldLabel>Attach Bill</FieldLabel>
                  <div
                    onClick={()=>fileRef.current?.click()}
                    style={{
                      border:"2px dashed #d1d5db", borderRadius:6,
                      padding:"20px 16px", textAlign:"center", cursor:"pointer",
                      background:"#fafafa", transition:"all .15s",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#1a7cb5"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#d1d5db"}
                    onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="#1a7cb5";}}
                    onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)setAttachFile(f);}}
                  >
                    {attachFile ? (
                      <div style={{ fontSize:13, color:"#065f46", fontWeight:600 }}>
                        📎 {attachFile.name}
                        <button onClick={ev=>{ev.stopPropagation();setAttachFile(null);}}
                          style={{ marginLeft:8, color:"#aaa", background:"none",
                            border:"none", cursor:"pointer", fontSize:16 }}>×</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize:28, marginBottom:6 }}>📂</div>
                        <div style={{ fontSize:12, color:"#6b7280" }}>Drag &amp; drop or click to attach</div>
                        <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>PDF, PNG, JPG up to 10MB</div>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg"
                      style={{ display:"none" }}
                      onChange={e=>{if(e.target.files[0])setAttachFile(e.target.files[0]);}}/>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <BottomBar
            onDiscard={()=>setDiscardOpen(true)}
            onSave={save}
            onApprove={approve}
            isSaving={isSaving}
          />
        </>
      ) : (
        /* History tab */
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:20 }}>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:"#eaf4fb",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, fontSize:12, fontWeight:700, color:"#1a7cb5" }}>JD</div>
            <div>
              <div style={{ fontSize:13 }}>Bill created as Draft</div>
              <div style={{ fontSize:11, color:"#aaa", marginTop:2 }}>
                {new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
              </div>
            </div>
          </div>
          <Separator className="my-4"/>
          <FieldLabel>Add a Note</FieldLabel>
          <Textarea placeholder="Add a note…" rows={3}
            className="text-[13px] border-gray-300 rounded focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0 resize-none"/>
          <Button style={{ marginTop:8, background:"#1a7cb5", color:"#fff",
            fontSize:12, fontWeight:700, height:28, borderRadius:4 }}
            className="hover:bg-[#155f8d]"
            onClick={()=>toast.success("Note added.")}>Add Note</Button>
        </div>
      )}

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent style={{ maxWidth:400, width:"90vw" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontSize:15, fontWeight:700 }}>Discard bill?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontSize:13, color:"#555" }}>
              All unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontSize:13, fontWeight:700 }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={()=>onNavigate("bills")}
              style={{ background:"#c00", color:"#fff", fontSize:13, fontWeight:700, borderRadius:4 }}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. NEW REPEATING BILL
// ══════════════════════════════════════════════════════════════════════════════
export function NewRepeatingBillPage({ onNavigate }) {
  const [supplier,    setSupplier]    = useState("");
  const [reference,   setReference]   = useState("");
  const [currency,    setCurrency]    = useState("AED");
  const [frequency,   setFrequency]   = useState("Monthly");
  const [startDate,   setStartDate]   = useState(new Date().toISOString().slice(0,10));
  const [endDate,     setEndDate]     = useState("");
  const [dueAfter,    setDueAfter]    = useState("30");
  const [autoApprove, setAutoApprove] = useState(false);
  const [rows,        setRows]        = useState([emptyRow()]);

  const sub = rows.reduce((s,r)=>s+num(r.qty)*num(r.price),0);

  return (
    <PageShell
      title="New Repeating Bill"
      breadcrumbs={[
        {label:"Purchases", page:"purchases-overview"},
        {label:"Bills",     page:"bills"},
        {label:"New Repeating Bill"},
      ]}
      onNavigate={onNavigate}
      topActions={
        <div style={{ display:"flex", gap:6 }}>
          <Button variant="outline" onClick={()=>onNavigate("bills")}
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px",
              borderRadius:4, borderColor:"#bbb", color:"#555" }}>Cancel</Button>
          <Button
            onClick={()=>{ if(!supplier.trim()) return toast.error("Supplier is required."); toast.success("✓ Repeating bill saved."); onNavigate("bills"); }}
            style={{ background:"#1a7cb5", color:"#fff", fontSize:13,
              fontWeight:700, height:32, padding:"0 12px", borderRadius:4 }}
            className="hover:bg-[#155f8d]">Save</Button>
        </div>
      }
    >
      {/* Info banner */}
      <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6,
        padding:"10px 14px", marginBottom:14, fontSize:12, color:"#1e40af",
        display:"flex", gap:8 }}>
        <span>ℹ️</span>
        <span>Repeating bills are created automatically on your schedule. Enable auto-approve to post them without manual review.</span>
      </div>

      <div style={{ background:"#fff", border:"1px solid #e2e8f0",
        borderRadius:8, overflow:"hidden" }}>
        <div style={{ padding:16 }}>

          {/* Schedule */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10, paddingBottom:6,
              borderBottom:"1px solid #f0f0f0" }}>Schedule</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}
              className="bill-form-grid-2">
              <div>
                <FieldLabel required>Repeats</FieldLabel>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className={selSm}><SelectValue/></SelectTrigger>
                  <SelectContent>{REPEAT_FREQ.map(f=><SelectItem key={f} value={f} className="text-[13px]">{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel required>Start Date</FieldLabel>
                <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className={inputSm}/>
              </div>
              <div>
                <FieldLabel>End Date</FieldLabel>
                <Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className={inputSm}/>
              </div>
              <div>
                <FieldLabel>Due (days after issue)</FieldLabel>
                <Input value={dueAfter} onChange={e=>setDueAfter(e.target.value)} className={inputSm} placeholder="30"/>
              </div>
            </div>

            {/* Auto-approve */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:14,
              padding:"12px 14px", border:"1px solid #e2e8f0", borderRadius:6,
              background:"#fafafa", maxWidth:400 }}>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} id="auto-appr"/>
              <div>
                <Label htmlFor="auto-appr" style={{ fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  Auto-approve
                </Label>
                <p style={{ fontSize:11, color:"#888", margin:0 }}>
                  Automatically approve each bill when created
                </p>
              </div>
            </div>
          </div>

          <Separator/>

          {/* Bill details */}
          <div style={{ marginTop:14, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Bill Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}
              className="bill-form-grid-2">
              <div style={{ gridColumn:"span 2" }}>
                <FieldLabel required>Supplier</FieldLabel>
                <Input value={supplier} onChange={e=>setSupplier(e.target.value)}
                  placeholder="Search supplier…" className={inputSm}/>
              </div>
              <div>
                <FieldLabel>Reference</FieldLabel>
                <Input value={reference} onChange={e=>setReference(e.target.value)} className={inputSm}/>
              </div>
              <div>
                <FieldLabel>Currency</FieldLabel>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className={selSm}><SelectValue/></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c=><SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator/>

          {/* Line items */}
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Line Items</div>
            <LineItemsTable rows={rows} setRows={setRows} currency={currency}/>
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
              <div style={{ minWidth:220, fontSize:13 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  padding:"7px 0", borderTop:"2px solid #e0e0e0" }}>
                  <span style={{ fontWeight:700 }}>Total</span>
                  <span style={{ fontWeight:800, color:"#1a7cb5" }}>{currency} {fmt(sub)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. NEW CREDIT NOTE (Bills)
// ══════════════════════════════════════════════════════════════════════════════
export function NewCreditNoteBillPage({ onNavigate }) {
  const [supplier,   setSupplier]   = useState("");
  const [date,       setDate]       = useState(new Date().toISOString().slice(0,10));
  const [creditNum,  setCreditNum]  = useState("CN-BILL-0001");
  const [reference,  setReference]  = useState("");
  const [currency,   setCurrency]   = useState("AED");
  const [amountsAre, setAmountsAre] = useState("Tax Exclusive");
  const [rows,       setRows]       = useState([emptyRow()]);
  const [notes,      setNotes]      = useState("");
  const [discardOpen,setDiscardOpen]= useState(false);

  const sub = rows.reduce((s,r)=>s+num(r.qty)*num(r.price),0);

  return (
    <PageShell
      title="New Credit Note"
      breadcrumbs={[
        {label:"Purchases", page:"purchases-overview"},
        {label:"Bills",     page:"bills"},
        {label:"New Credit Note"},
      ]}
      onNavigate={onNavigate}
      topActions={
        <div style={{ display:"flex", gap:6 }}>
          <Button variant="outline" onClick={()=>setDiscardOpen(true)}
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px",
              borderRadius:4, borderColor:"#bbb", color:"#c00" }}>Discard</Button>
          <Button
            onClick={()=>{ if(!supplier.trim()) return toast.error("Supplier is required."); toast.success("✓ Credit note saved."); onNavigate("bills"); }}
            style={{ background:"#1a7cb5", color:"#fff", fontSize:13,
              fontWeight:700, height:32, padding:"0 12px", borderRadius:4 }}
            className="hover:bg-[#155f8d]">Save Credit Note</Button>
        </div>
      }
    >
      {/* Info banner */}
      <div style={{ background:"#fefce8", border:"1px solid #fde68a", borderRadius:6,
        padding:"10px 14px", marginBottom:14, fontSize:12, color:"#92400e",
        display:"flex", gap:8 }}>
        <span>⚠️</span>
        <span>A credit note reduces the amount you owe to a supplier. It will be allocated against outstanding bills.</span>
      </div>

      <div style={{ background:"#fff", border:"1px solid #e2e8f0",
        borderRadius:8, overflow:"hidden" }}>
        <div style={{ padding:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:14 }}
            className="bill-form-grid-3">
            <div style={{ gridColumn:"span 2" }}>
              <FieldLabel required>Supplier</FieldLabel>
              <Input value={supplier} onChange={e=>setSupplier(e.target.value)}
                placeholder="Search supplier…" className={inputSm}/>
            </div>
            <div>
              <FieldLabel required>Date</FieldLabel>
              <Input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inputSm}/>
            </div>
            <div>
              <FieldLabel>Credit Note #</FieldLabel>
              <Input value={creditNum} onChange={e=>setCreditNum(e.target.value)} className={inputSm}/>
            </div>
            <div>
              <FieldLabel>Reference</FieldLabel>
              <Input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Bill ref" className={inputSm}/>
            </div>
            <div>
              <FieldLabel>Currency</FieldLabel>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className={selSm}><SelectValue/></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c=><SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Amounts Are</FieldLabel>
              <Select value={amountsAre} onValueChange={setAmountsAre}>
                <SelectTrigger className={selSm}><SelectValue/></SelectTrigger>
                <SelectContent>
                  {["Tax Exclusive","Tax Inclusive","No Tax"].map(o=><SelectItem key={o} value={o} className="text-[13px]">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-3"/>

          <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Line Items</div>
          <LineItemsTable rows={rows} setRows={setRows} currency={currency}/>

          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
            <div style={{ minWidth:220, fontSize:13 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                padding:"7px 0", borderTop:"2px solid #e0e0e0" }}>
                <span style={{ fontWeight:700 }}>Credit Total</span>
                <span style={{ fontWeight:800, color:"#1a7cb5" }}>{currency} {fmt(sub)}</span>
              </div>
            </div>
          </div>

          <Separator className="my-3"/>

          <FieldLabel>Notes</FieldLabel>
          <Textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
            placeholder="Optional note to supplier"
            className="text-[13px] border-gray-300 rounded resize-none focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
        </div>
      </div>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent style={{ maxWidth:400, width:"90vw" }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard credit note?</AlertDialogTitle>
            <AlertDialogDescription>All unsaved changes will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={()=>onNavigate("bills")}
              style={{ background:"#c00", color:"#fff" }}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. UPLOAD BILL
// ══════════════════════════════════════════════════════════════════════════════
export function UploadBillPage({ onNavigate }) {
  const [files,     setFiles]     = useState([]);
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const addFiles = newFiles => {
    const arr = Array.from(newFiles).map(f=>({
      id:Math.random().toString(36).slice(2), file:f,
      status:"ready", preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    setFiles(p=>[...p,...arr]);
  };

  const removeFile = id => setFiles(p=>p.filter(f=>f.id!==id));

  const handleUpload = () => {
    if (!files.length) return toast.error("Please select at least one file.");
    setUploading(true);
    setFiles(p=>p.map(f=>({...f,status:"uploading"})));
    setTimeout(()=>{
      setUploading(false);
      setFiles(p=>p.map(f=>({...f,status:"done"})));
      toast.success(`✓ ${files.length} bill${files.length>1?"s":""} uploaded successfully.`);
      setTimeout(()=>onNavigate("bills"),1200);
    },1200);
  };

  const fileSizeLabel = bytes => {
    if (bytes<1024) return bytes+"B";
    if (bytes<1024*1024) return (bytes/1024).toFixed(1)+"KB";
    return (bytes/(1024*1024)).toFixed(1)+"MB";
  };

  return (
    <PageShell
      title="Upload Bill"
      breadcrumbs={[
        {label:"Purchases", page:"purchases-overview"},
        {label:"Bills",     page:"bills"},
        {label:"Upload Bill"},
      ]}
      onNavigate={onNavigate}
      topActions={null}
    >
      <div style={{ maxWidth:700 }}>
        {/* Drop zone */}
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}}
          onClick={()=>fileRef.current?.click()}
          style={{
            border:`2px dashed ${dragging?"#1a7cb5":"#d1d5db"}`,
            borderRadius:10, padding:"40px 24px", textAlign:"center",
            cursor:"pointer", background:dragging?"#eff6ff":"#fff",
            transition:"all .15s", marginBottom:16,
          }}
        >
          <div style={{ fontSize:40, marginBottom:10 }}>📄</div>
          <div style={{ fontSize:15, fontWeight:600, color:"#374151", marginBottom:4 }}>
            Drag &amp; drop your bills here, or click to browse
          </div>
          <div style={{ fontSize:12, color:"#9ca3af" }}>
            PDF, PNG, JPG, HEIC supported · Max 10MB per file
          </div>
          <input ref={fileRef} type="file" multiple
            accept=".pdf,.png,.jpg,.jpeg,.heic"
            style={{ display:"none" }}
            onChange={e=>{ if(e.target.files?.length) addFiles(e.target.files); }}/>
        </div>

        {/* File list */}
        {files.length>0 && (
          <div style={{ background:"#fff", border:"1px solid #e2e8f0",
            borderRadius:8, overflow:"hidden", marginBottom:16 }}>
            {files.map((item,i)=>(
              <div key={item.id} style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"10px 16px",
                borderBottom: i<files.length-1?"1px solid #f0f0f0":"none",
                background: item.status==="done"?"#f0fdf4":
                            item.status==="uploading"?"#fffbeb":"#fff",
              }}>
                {/* Icon/thumb */}
                <div style={{ width:36, height:36, flexShrink:0, borderRadius:4,
                  background:"#f3f4f6", display:"flex", alignItems:"center",
                  justifyContent:"center", overflow:"hidden" }}>
                  {item.preview
                    ? <img src={item.preview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <span style={{ fontSize:18 }}>📄</span>
                  }
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1a1a1a",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {item.file.name}
                  </div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{fileSizeLabel(item.file.size)}</div>
                </div>
                {/* Status */}
                <div style={{ flexShrink:0 }}>
                  {item.status==="done" && <span style={{ fontSize:12, color:"#065f46", fontWeight:700 }}>✓ Uploaded</span>}
                  {item.status==="uploading" && (
                    <span style={{ fontSize:12, color:"#92400e", fontWeight:700 }}>Uploading…</span>
                  )}
                  {item.status==="ready" && (
                    <button onClick={e=>{e.stopPropagation();removeFile(item.id);}}
                      style={{ background:"none", border:"none", cursor:"pointer",
                        color:"#9ca3af", fontSize:18, padding:0 }}
                      onMouseEnter={e=>e.currentTarget.style.color="#c00"}
                      onMouseLeave={e=>e.currentTarget.style.color="#9ca3af"}>×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0",
          borderRadius:6, padding:"12px 16px", marginBottom:16,
          fontSize:12, color:"#555" }}>
          <div style={{ fontWeight:700, marginBottom:4 }}>💡 How it works</div>
          <ul style={{ margin:0, paddingLeft:16, lineHeight:1.8 }}>
            <li>Upload your bill documents (PDF or image)</li>
            <li>Xero will extract the key details automatically</li>
            <li>Review and approve the extracted bill</li>
          </ul>
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
          <Button variant="outline" onClick={()=>onNavigate("bills")}
            style={{ fontSize:13, fontWeight:700, height:32,
              borderRadius:4, borderColor:"#bbb", color:"#555" }}>Cancel</Button>
          <Button onClick={handleUpload} disabled={uploading||!files.length}
            style={{ background:"#1a7cb5", color:"#fff", fontSize:13,
              fontWeight:700, height:32, padding:"0 20px", borderRadius:4 }}
            className="hover:bg-[#155f8d]">
            {uploading ? "Uploading…" : `Upload ${files.length>0?files.length+" ":""}Bill${files.length!==1?"s":""}`}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. IMPORT BILLS FROM CSV
// ══════════════════════════════════════════════════════════════════════════════
const CSV_COLUMNS = [
  { key:"SupplierName",  label:"SupplierName",  required:true  },
  { key:"InvoiceNumber", label:"InvoiceNumber", required:true  },
  { key:"InvoiceDate",   label:"InvoiceDate",   required:true  },
  { key:"DueDate",       label:"DueDate",        required:false },
  { key:"Description",   label:"Description",   required:false },
  { key:"Quantity",      label:"Quantity",       required:false },
  { key:"UnitAmount",    label:"UnitAmount",    required:true  },
  { key:"AccountCode",   label:"AccountCode",   required:false },
  { key:"TaxType",       label:"TaxType",       required:false },
  { key:"Currency",      label:"Currency",      required:false },
  { key:"Reference",     label:"Reference",     required:false },
];

export function ImportBillsCSVPage({ onNavigate }) {
  const [file,       setFile]       = useState(null);
  const [dragging,   setDragging]   = useState(false);
  const [importing,  setImporting]  = useState(false);
  const [step,       setStep]       = useState(1); // 1=upload, 2=preview
  const fileRef = useRef(null);

  const handleDrop = e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) setFile(f);
    else toast.error("Please upload a .csv file.");
  };

  const handleImport = () => {
    if (!file) return;
    setImporting(true);
    setTimeout(()=>{
      setImporting(false);
      toast.success(`✓ Bills imported from ${file.name}`);
      onNavigate("bills");
    },1000);
  };

  const downloadTemplate = () => {
    const header = CSV_COLUMNS.map(c=>c.label).join(",");
    const sample = "Office Depot,INV-001,2026-04-01,2026-04-15,Office supplies,1,250.00,452,No Tax (0%),AED,PO-001";
    const csv = header+"\n"+sample;
    const a = document.createElement("a");
    a.href = "data:text/csv,"+encodeURIComponent(csv);
    a.download = "bills_import_template.csv"; a.click();
    toast.success("Template downloaded.");
  };

  return (
    <PageShell
      title="Import Bills"
      breadcrumbs={[
        {label:"Purchases", page:"purchases-overview"},
        {label:"Bills",     page:"bills"},
        {label:"Import from CSV"},
      ]}
      onNavigate={onNavigate}
      topActions={null}
    >
      {/* Step indicator */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
        {[{n:1,label:"Upload File"},{n:2,label:"Review & Import"}].map((s,i)=>(
          <div key={s.n} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{
              width:28, height:28, borderRadius:"50%", display:"flex",
              alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700,
              background: step===s.n?"#1a7cb5":step>s.n?"#d1fae5":"#f3f4f6",
              color: step===s.n?"#fff":step>s.n?"#065f46":"#6b7280",
              border: `2px solid ${step===s.n?"#1a7cb5":step>s.n?"#a7f3d0":"#e5e7eb"}`,
            }}>
              {step>s.n ? "✓" : s.n}
            </div>
            <span style={{ fontSize:13, fontWeight:step===s.n?600:400,
              color:step===s.n?"#1a7cb5":"#6b7280" }}>{s.label}</span>
            {i<1 && <span style={{ color:"#d1d5db", fontSize:16 }}>→</span>}
          </div>
        ))}
      </div>

      <div style={{ maxWidth:680 }}>
        {step===1 ? (
          <>
            {/* Upload step */}
            <div style={{ background:"#fff", border:"1px solid #e2e8f0",
              borderRadius:8, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>
                Upload your CSV file
              </div>

              <div
                onDragOver={e=>{e.preventDefault();setDragging(true);}}
                onDragLeave={()=>setDragging(false)}
                onDrop={handleDrop}
                onClick={()=>fileRef.current?.click()}
                style={{
                  border:`2px dashed ${dragging?"#1a7cb5":"#d1d5db"}`,
                  borderRadius:8, padding:"32px 20px", textAlign:"center",
                  cursor:"pointer", background:dragging?"#eff6ff":"#fafafa",
                  transition:"all .15s", marginBottom:14,
                }}
              >
                <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:4 }}>
                  {file ? file.name : "Drag & drop your CSV here, or click to browse"}
                </div>
                <div style={{ fontSize:12, color:"#9ca3af" }}>.csv files only</div>
                <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }}
                  onChange={e=>{ if(e.target.files[0]) setFile(e.target.files[0]); }}/>
              </div>

              {file && (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
                  background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:6 }}>
                  <span style={{ fontSize:14 }}>✅</span>
                  <span style={{ fontSize:13, color:"#065f46", fontWeight:600 }}>{file.name}</span>
                  <span style={{ fontSize:12, color:"#aaa" }}>({(file.size/1024).toFixed(1)} KB)</span>
                  <button onClick={e=>{e.stopPropagation();setFile(null);}}
                    style={{ marginLeft:"auto", background:"none", border:"none",
                      cursor:"pointer", color:"#aaa", fontSize:18 }}>×</button>
                </div>
              )}
            </div>

            {/* Column reference */}
            <div style={{ background:"#fff", border:"1px solid #e2e8f0",
              borderRadius:8, overflow:"hidden", marginBottom:16 }}>
              <div style={{ padding:"12px 16px", borderBottom:"1px solid #f0f0f0",
                display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ fontSize:13, fontWeight:700 }}>Required CSV columns</div>
                <Button variant="outline"
                  onClick={downloadTemplate}
                  style={{ fontSize:12, fontWeight:700, height:28, padding:"0 10px",
                    borderRadius:4, borderColor:"#1a7cb5", color:"#1a7cb5" }}>
                  Download Template
                </Button>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#eaf4fb" }}>
                      <th style={{ padding:"8px 14px", fontSize:12, fontWeight:700,
                        color:"#1a7cb5", textAlign:"left", borderBottom:"1px solid #c6dff0" }}>
                        Column Name
                      </th>
                      <th style={{ padding:"8px 14px", fontSize:12, fontWeight:700,
                        color:"#1a7cb5", textAlign:"left", borderBottom:"1px solid #c6dff0" }}>
                        Required
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CSV_COLUMNS.map((col,i)=>(
                      <tr key={col.key} style={{ borderBottom:"1px solid #f5f5f5",
                        background:i%2===0?"#fff":"#fafafa" }}>
                        <td style={{ padding:"7px 14px", fontSize:13, fontFamily:"monospace",
                          color:"#374151" }}>{col.label}</td>
                        <td style={{ padding:"7px 14px", fontSize:12 }}>
                          {col.required
                            ? <span style={{ color:"#dc2626", fontWeight:700 }}>Required</span>
                            : <span style={{ color:"#9ca3af" }}>Optional</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <Button variant="outline" onClick={()=>onNavigate("bills")}
                style={{ fontSize:13, fontWeight:700, height:32,
                  borderRadius:4, borderColor:"#bbb", color:"#555" }}>Cancel</Button>
              <Button onClick={()=>{ if(!file) return toast.error("Please select a CSV file."); setStep(2); }}
                style={{ background:"#1a7cb5", color:"#fff", fontSize:13,
                  fontWeight:700, height:32, padding:"0 20px", borderRadius:4 }}
                className="hover:bg-[#155f8d]">
                Next: Review
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Review step */}
            <div style={{ background:"#fff", border:"1px solid #e2e8f0",
              borderRadius:8, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>Review import</div>
              <div style={{ fontSize:13, color:"#555", marginBottom:16 }}>
                File: <strong>{file?.name}</strong>
              </div>

              {/* Mock preview rows */}
              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0",
                borderRadius:6, padding:"10px 14px", marginBottom:12,
                fontSize:13, color:"#065f46", display:"flex", gap:8 }}>
                <span>✅</span>
                <span><strong>1 bill</strong> ready to import. No errors found.</span>
              </div>

              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background:"#eaf4fb" }}>
                      {["Supplier","Invoice No.","Date","Due Date","Amount","Status"].map(h=>(
                        <th key={h} style={{ padding:"7px 10px", fontWeight:700,
                          color:"#1a7cb5", textAlign:"left",
                          borderBottom:"2px solid #c6dff0", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {["Office Depot","INV-001","01 Apr 2026","15 Apr 2026","AED 250.00","Ready"].map((v,i)=>(
                        <td key={i} style={{ padding:"8px 10px", borderBottom:"1px solid #f0f0f0",
                          color: v==="Ready"?"#065f46":"#333",
                          fontWeight: v==="Ready"?700:400 }}>{v}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
              <Button variant="outline" onClick={()=>setStep(1)}
                style={{ fontSize:13, fontWeight:700, height:32,
                  borderRadius:4, borderColor:"#bbb", color:"#555" }}>← Back</Button>
              <div style={{ display:"flex", gap:8 }}>
                <Button variant="outline" onClick={()=>onNavigate("bills")}
                  style={{ fontSize:13, fontWeight:700, height:32,
                    borderRadius:4, borderColor:"#bbb", color:"#555" }}>Cancel</Button>
                <Button onClick={handleImport} disabled={importing}
                  style={{ background:"#1a7cb5", color:"#fff", fontSize:13,
                    fontWeight:700, height:32, padding:"0 20px", borderRadius:4 }}
                  className="hover:bg-[#155f8d]">
                  {importing?"Importing…":"Import Bills"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
