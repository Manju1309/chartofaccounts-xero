import { useState, useRef } from "react";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Textarea }  from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea }from "@/components/ui/scroll-area";
import { Badge }     from "@/components/ui/badge";
import { Switch }    from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// ── Shared data ───────────────────────────────────────────────────────────────
const ACCOUNTS = [
  "Sales (200)","Other Revenue (260)","Interest Income (270)",
  "Cost of Goods Sold (310)","Advertising (400)","Bank Fees (404)",
  "Consulting & Accounting (412)","General Expenses (428)",
  "Insurance (432)","Office Expenses (452)","Rent (464)","Salaries (472)","Wages (490)",
];
const TAX_OPTS = [
  { label:"No Tax (0%)",        rate:0    },
  { label:"Tax on Sales (0%)",  rate:0    },
  { label:"Tax Exempt (0%)",    rate:0    },
  { label:"15% VAT",            rate:0.15 },
  { label:"20% Standard Rate",  rate:0.20 },
  { label:"GST on Income (10%)",rate:0.10 },
];
const CURRENCIES = ["AED","AUD","USD","GBP","EUR","NZD","SGD","CAD"];
const TRACKING   = ["— None —","North","South","East","West","Online","In-Store"];

const emptyRow = () => ({
  id: Math.random().toString(36).slice(2),
  item:"", desc:"", qty:"1", price:"", discount:"",
  account:"", tax:"No Tax (0%)",
});

const n    = v => parseFloat(String(v||"0").replace(/,/g,"")) || 0;
const fmtN = v => isNaN(v) ? "0.00" : Number(v).toFixed(2);
const tRate= lbl => (TAX_OPTS.find(t=>t.label===lbl)||{rate:0}).rate;


// ── Shared helpers ────────────────────────────────────────────────────────────
function FL({ children, req }) {
  return (
    <Label className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide">
      {children}{req&&<span className="text-red-500 ml-0.5 normal-case">*</span>}
    </Label>
  );
}

/** Compute sub, taxGroups, taxTotal, total from rows */
function calcTotals(rows, amountsAre="Tax Exclusive") {
  let sub = 0;
  const taxGroups = {};
  rows.forEach(r => {
    const qty=n(r.qty), price=n(r.price), dis=n(r.discount);
    let lineAmt = qty*price;
    if (dis>0) lineAmt -= lineAmt*(dis/100);
    const rate = tRate(r.tax);
    if (amountsAre==="Tax Inclusive" && rate>0) {
      const tp = lineAmt*rate/(1+rate);
      sub += lineAmt - tp;
      taxGroups[r.tax] = (taxGroups[r.tax]||0)+tp;
    } else if (amountsAre==="Tax Exclusive" && rate>0) {
      sub += lineAmt;
      taxGroups[r.tax] = (taxGroups[r.tax]||0)+lineAmt*rate;
    } else {
      sub += lineAmt;
    }
  });
  const taxTotal = Object.values(taxGroups).reduce((a,b)=>a+b,0);
  return { sub, taxGroups, taxTotal, total: sub+taxTotal };
}

function lineAmt(row) {
  const q=n(row.qty), p=n(row.price), d=n(row.discount);
  let a=q*p; if(d>0) a-=a*(d/100);
  return fmtN(a);
}

/** Reusable line-item table */
function LineTable({ rows, setRows, currency="AED", amountsAre="Tax Exclusive", showDiscount=false, showTracking=false }) {
  const upd = (id,f,v)=>setRows(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const del = id=>setRows(p=>p.length>1?p.filter(r=>r.id!==id):p);
  const add = ()=>setRows(p=>[...p,emptyRow()]);
  const tots = calcTotals(rows, amountsAre);

//   const TH = { padding:"7px 7px", fontSize:11, fontWeight:700, color:"#1a7cb5", background:"#eaf4fb", borderBottom:"2px solid #c6dff0", whiteSpace:"nowrap", verticalAlign:"bottom" };
//   const TD = { padding:"4px 5px", borderBottom:"1px solid #f0f2f5", verticalAlign:"middle" };

const TH = {
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 700,
  color: "#1a7cb5",
  background: "#eaf4fb",
  borderBottom: "2px solid #c6dff0",
  textAlign: "left",
};

const TD = {
  padding: "8px 10px",
  borderBottom: "1px solid #edf2f7",
  fontSize: 13,
};

  return (
    <div>
      {/* <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth: showTracking ? 1020 : (showDiscount ? 860 : 760) }}>
          <thead>
            <tr>
              <th style={{ ...TH, width:"15%" }}>Item</th>
              <th style={{ ...TH, width:"20%" }}>Description</th>
              <th style={{ ...TH, width:"6%", textAlign:"right" }}>Qty</th>
              <th style={{ ...TH, width:"9%", textAlign:"right" }}>Price</th>
              {showDiscount && <th style={{ ...TH, width:"6%", textAlign:"right" }}>Disc %</th>}
              <th style={{ ...TH, width:"14%" }}>Account</th>
              <th style={{ ...TH, width:"13%" }}>Tax Rate</th>
              {showTracking && <>
                <th style={{ ...TH, width:"9%" }}>Tracking 1</th>
                <th style={{ ...TH, width:"9%" }}>Tracking 2</th>
              </>}
              <th style={{ ...TH, width:"9%", textAlign:"right" }}>Amount</th>
              <th style={{ ...TH, width:"3%" }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row,idx)=>(
              <tr key={row.id} style={{ background:idx%2===0?"#fff":"#fafbfc" }}
                onMouseEnter={e=>e.currentTarget.style.background="#f0f8fd"}
                onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#fafbfc"}>
                <td style={TD}><Input value={row.item} onChange={e=>upd(row.id,"item",e.target.value)} placeholder="Search items…" className="h-7 text-[12px] border-gray-200 rounded-sm"/></td>
                <td style={TD}><Input value={row.desc} onChange={e=>upd(row.id,"desc",e.target.value)} placeholder="Description" className="h-7 text-[12px] border-gray-200 rounded-sm"/></td>
                <td style={TD}><Input value={row.qty}  onChange={e=>upd(row.id,"qty",e.target.value)}  className="h-7 text-[12px] border-gray-200 rounded-sm text-right"/></td>
                <td style={TD}><Input value={row.price} onChange={e=>upd(row.id,"price",e.target.value)} placeholder="0.00" className="h-7 text-[12px] border-gray-200 rounded-sm text-right"/></td>
                {showDiscount&&<td style={TD}><Input value={row.discount} onChange={e=>upd(row.id,"discount",e.target.value)} placeholder="0" className="h-7 text-[12px] border-gray-200 rounded-sm text-right"/></td>}
                <td style={TD}>
                  <Select value={row.account} onValueChange={v=>upd(row.id,"account",v)}>
                    <SelectTrigger className="h-7 text-[11px] border-gray-200 rounded-sm"><SelectValue placeholder="Account"/></SelectTrigger>
                    <SelectContent className="max-h-48">{ACCOUNTS.map(a=><SelectItem key={a} value={a} className="text-[12px] py-1">{a}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td style={TD}>
                  <Select value={row.tax} onValueChange={v=>upd(row.id,"tax",v)}>
                    <SelectTrigger className="h-7 text-[11px] border-gray-200 rounded-sm"><SelectValue/></SelectTrigger>
                    <SelectContent>{TAX_OPTS.map(t=><SelectItem key={t.label} value={t.label} className="text-[12px] py-1">{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                {showTracking&&<>
                  <td style={TD}><Select value={row.tracking1||""} onValueChange={v=>upd(row.id,"tracking1",v)}><SelectTrigger className="h-7 text-[11px] border-gray-200 rounded-sm"><SelectValue placeholder="—"/></SelectTrigger><SelectContent>{TRACKING.map(c=><SelectItem key={c} value={c} className="text-[12px] py-1">{c}</SelectItem>)}</SelectContent></Select></td>
                  <td style={TD}><Select value={row.tracking2||""} onValueChange={v=>upd(row.id,"tracking2",v)}><SelectTrigger className="h-7 text-[11px] border-gray-200 rounded-sm"><SelectValue placeholder="—"/></SelectTrigger><SelectContent>{TRACKING.map(c=><SelectItem key={c} value={c} className="text-[12px] py-1">{c}</SelectItem>)}</SelectContent></Select></td>
                </>}
                <td style={{ ...TD, textAlign:"right", fontWeight:600, fontSize:12, whiteSpace:"nowrap", paddingRight:6 }}>{currency} {lineAmt(row)}</td>
                <td style={{ ...TD, textAlign:"center", paddingLeft:2 }}>
                  <button onClick={()=>del(row.id)} style={{ all:"unset", cursor:"pointer", color:"#d1d5db", fontSize:15, lineHeight:1 }}
                    onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                    onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> */}

      <div style={{ overflowX: "auto" }}>
  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
    <thead>
      <tr>
        <th style={{ ...TH, width: "15%" }}>Item</th>
        <th style={{ ...TH, width: "25%" }}>Description</th>
        <th style={{ ...TH, textAlign: "right" }}>Qty</th>
        <th style={{ ...TH, textAlign: "right" }}>Unit Price</th>
        {showDiscount && (
          <th style={{ ...TH, textAlign: "right" }}>Disc %</th>
        )}
        <th style={TH}>Account</th>
        <th style={TH}>Tax Rate</th>
        <th style={{ ...TH, textAlign: "right" }}>Amount</th>
        <th style={{ ...TH, width: 40 }}></th>
      </tr>
    </thead>

    <tbody>
      {rows.map((row, idx) => (
        <tr
          key={row.id}
          style={{
            background: idx % 2 === 0 ? "#fff" : "#fafbfc",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#f0f8fd")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background =
              idx % 2 === 0 ? "#fff" : "#fafbfc")
          }
        >
          {/* Item */}
          <td style={TD}>
            <Input
              value={row.item}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, item: e.target.value } : r
                  )
                )
              }
              placeholder="Search item"
              className="h-8 border-none shadow-none text-sm"
            />
          </td>

          {/* Description */}
          <td style={TD}>
            <Input
              value={row.desc}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, desc: e.target.value } : r
                  )
                )
              }
              placeholder="Description"
              className="h-8 border-none shadow-none text-sm"
            />
          </td>

          {/* Qty */}
          <td style={{ ...TD, textAlign: "right" }}>
            <Input
              value={row.qty}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, qty: e.target.value } : r
                  )
                )
              }
              className="h-8 border-none shadow-none text-sm text-right"
            />
          </td>

          {/* Price */}
          <td style={{ ...TD, textAlign: "right" }}>
            <Input
              value={row.price}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, price: e.target.value } : r
                  )
                )
              }
              placeholder="0.00"
              className="h-8 border-none shadow-none text-sm text-right"
            />
          </td>

          {/* Discount */}
          {showDiscount && (
            <td style={{ ...TD, textAlign: "right" }}>
              <Input
                value={row.discount}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r) =>
                      r.id === row.id
                        ? { ...r, discount: e.target.value }
                        : r
                    )
                  )
                }
                className="h-8 border-none shadow-none text-sm text-right"
              />
            </td>
          )}

          {/* Account */}
          <td style={TD}>
            <Select
              value={row.account}
              onValueChange={(val) =>
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, account: val } : r
                  )
                )
              }
            >
              <SelectTrigger className="h-8 border-none shadow-none text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNTS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </td>

          {/* Tax */}
          <td style={TD}>
            <Select
              value={row.tax}
              onValueChange={(val) =>
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, tax: val } : r
                  )
                )
              }
            >
              <SelectTrigger className="h-8 border-none shadow-none text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_OPTS.map((t) => (
                  <SelectItem key={t.label} value={t.label}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </td>

          {/* Amount */}
          <td
            style={{
              ...TD,
              textAlign: "right",
              fontWeight: 600,
            }}
          >
            {currency} {lineAmt(row)}
          </td>

          {/* Delete */}
          <td style={{ ...TD, textAlign: "center" }}>
            <button
              onClick={() =>
                setRows((prev) =>
                  prev.length > 1
                    ? prev.filter((r) => r.id !== row.id)
                    : prev
                )
              }
              style={{
                all: "unset",
                cursor: "pointer",
                color: "#d1d5db",
                fontSize: 16,
              }}
            >
              ×
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {/* Add + totals */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginTop:10, flexWrap:"wrap", gap:12 }}>
        <Button variant="outline" onClick={add}
          style={{ fontSize:12, fontWeight:700, height:28, padding:"0 12px", borderRadius:3, borderColor:"#1a7cb5", color:"#1a7cb5" }}>
          + Add Line
        </Button>
        <div style={{ minWidth:260, fontSize:13 }}>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #f0f0f0" }}>
            <span style={{ color:"#64748b" }}>Subtotal</span>
            <span style={{ fontWeight:600 }}>{currency} {fmtN(tots.sub)}</span>
          </div>
          {Object.entries(tots.taxGroups).filter(([,v])=>v>0).map(([lbl,amt])=>(
            <div key={lbl} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #f0f0f0" }}>
              <span style={{ color:"#64748b" }}>{lbl}</span>
              <span style={{ fontWeight:600, color:"#374151" }}>{currency} {fmtN(amt)}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 0 3px", borderTop:"2px solid #e2e8f0", marginTop:2 }}>
            <span style={{ fontWeight:700, fontSize:14 }}>Total</span>
            <span style={{ fontWeight:800, fontSize:15, color:"#1a7cb5" }}>{currency} {fmtN(tots.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Page wrapper shared by all sub-pages */
function PageShell({ title, crumbs=[], onNavigate, children }) {
  return (
    <TooltipProvider>
      <div style={{ fontFamily:"Arial,Helvetica,sans-serif", background:"#f4f6f8", minHeight:"calc(100vh - 48px)", fontSize:13, color:"#333" }}>
        <ScrollArea style={{ height:"calc(100vh - 48px)" }}>
          <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"10px 16px 14px" }}>
            <p style={{ fontSize:12, color:"#94a3b8", margin:"0 0 4px", display:"flex", flexWrap:"wrap", gap:"0 4px" }}>
              <button style={{ all:"unset", color:"#1a7cb5", cursor:"pointer", fontSize:12 }} onClick={()=>onNavigate?.("sales-overview")}>Sales</button>
              {crumbs.map((c,i)=>(
                <span key={i} style={{ display:"flex", gap:4, alignItems:"center" }}>
                  <span style={{ color:"#cbd5e1" }}>›</span>
                  <button style={{ all:"unset", color:"#1a7cb5", cursor:"pointer", fontSize:12 }} onClick={()=>onNavigate?.(c.page)}>{c.label}</button>
                </span>
              ))}
              <span style={{ color:"#cbd5e1" }}>›</span>
              <span>{title}</span>
            </p>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#0f172a" }}>{title}</h1>
          </div>
          <div style={{ padding:16 }}>{children}</div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

function Card({ children, style }) {
  return <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden", ...style }}>{children}</div>;
}
function CardBody({ children, style }) {
  return <div style={{ padding:"14px 16px", ...style }}>{children}</div>;
}
function CardFoot({ children }) {
  return (
    <>
      <Separator/>
      <div style={{ padding:"10px 16px", display:"flex", justifyContent:"flex-end", gap:8 }}>
        {children}
      </div>
    </>
  );
}
function CancelBtn({ onNavigate }) {
  return (
    <Button variant="outline" onClick={()=>onNavigate?.("invoices")}
      style={{ fontSize:13, fontWeight:700, height:30, borderRadius:4, borderColor:"#d1d5db", color:"#374151" }}>Cancel</Button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 1. NEW REPEATING INVOICE
// ════════════════════════════════════════════════════════════════════════════
export function NewRepeatingInvoicePage({ onNavigate }) {
  const [contact,     setContact]     = useState("");
  const [reference,   setReference]   = useState("");
  const [currency,    setCurrency]    = useState("AED");
  const [amountsAre,  setAmountsAre]  = useState("Tax Exclusive");
  const [startDate,   setStartDate]   = useState(new Date().toISOString().slice(0,10));
  const [endDate,     setEndDate]     = useState("");
  const [frequency,   setFrequency]   = useState("Monthly");
  const [dueDay,      setDueDay]      = useState("30");
  const [invoiceRef,  setInvoiceRef]  = useState("REP-001");
  const [approveAuto, setApproveAuto] = useState(false);
  const [sendAuto,    setSendAuto]    = useState(false);
  const [emailTo,     setEmailTo]     = useState("");
  const [rows,        setRows]        = useState([emptyRow()]);
  const [showDiscount,setShowDiscount]= useState(false);
  const [showTracking,setShowTracking]= useState(false);
  const [notes,       setNotes]       = useState("");
  const [terms,       setTerms]       = useState("");

  const tots = calcTotals(rows, amountsAre);

  return (
    <PageShell title="New Repeating Invoice" crumbs={[{label:"Invoices",page:"invoices"}]} onNavigate={onNavigate}>
      <style>{`
        .rep-top-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(min-width:640px){.rep-top-grid{grid-template-columns:repeat(3,1fr)}}
        @media(min-width:1024px){.rep-top-grid{grid-template-columns:2fr 1fr 1fr 1fr}}
        .rep-sched-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(min-width:640px){.rep-sched-grid{grid-template-columns:repeat(4,1fr)}}
        .rep-notes-grid{display:grid;grid-template-columns:1fr;gap:12px}
        @media(min-width:768px){.rep-notes-grid{grid-template-columns:1fr 1fr}}
      `}</style>

      {/* Info */}
      <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#1e40af", display:"flex", gap:8 }}>
        <span style={{ fontSize:15, flexShrink:0 }}>ℹ️</span>
        <span>Repeating invoices are automatically created on the schedule you define. You can choose to auto-approve and auto-send them.</span>
      </div>

      <Card>
        <CardBody>
          {/* ── Schedule ── */}
          <div style={{ marginBottom:14, paddingBottom:12, borderBottom:"1px solid #f0f2f5" }}>
            <p style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Schedule</p>
            <div className="rep-sched-grid">
              <div>
                <FL req>Repeat</FL>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="h-8 text-[13px] border-gray-300 rounded-sm"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {["Daily","Weekly","Fortnightly","Monthly","Every 2 Months","Quarterly","Every 6 Months","Annually"].map(f=>(
                      <SelectItem key={f} value={f} className="text-[13px]">{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FL req>Start Date</FL>
                <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
              </div>
              <div>
                <FL>End Date</FL>
                <Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
              </div>
              <div>
                <FL>Due (days after issue)</FL>
                <Input value={dueDay} onChange={e=>setDueDay(e.target.value)} placeholder="30" className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
              </div>
            </div>

            {/* Auto-options */}
            <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" }}>
              {[
                { id:"aa", label:"Auto-approve", sub:"Approve automatically on creation", val:approveAuto, set:setApproveAuto, dis:false },
                { id:"as", label:"Auto-send", sub:"Email automatically when approved", val:sendAuto, set:setSendAuto, dis:!approveAuto },
              ].map(o=>(
                <div key={o.id} style={{ flex:"1 1 200px", display:"flex", alignItems:"center", gap:10, border:"1px solid #e2e8f0", borderRadius:6, padding:"10px 14px", opacity:o.dis?0.5:1 }}>
                  <Switch id={o.id} checked={o.val} disabled={o.dis} onCheckedChange={v=>{ o.set(v); if(o.id==="aa"&&!v){setSendAuto(false);} }}/>
                  <div>
                    <Label htmlFor={o.id} style={{ fontSize:13, fontWeight:600, cursor:o.dis?"default":"pointer" }}>{o.label}</Label>
                    <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{o.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            {sendAuto && (
              <div style={{ marginTop:10 }}>
                <FL>Send to email</FL>
                <Input value={emailTo} onChange={e=>setEmailTo(e.target.value)} placeholder="e.g. accounts@client.com" className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0" style={{ maxWidth:320 }}/>
              </div>
            )}
          </div>

          {/* ── Invoice header ── */}
          <div style={{ marginBottom:14, paddingBottom:12, borderBottom:"1px solid #f0f2f5" }}>
            <p style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Invoice Details</p>
            <div className="rep-top-grid">
              <div style={{ gridColumn:"span 2" }}>
                <FL req>Contact</FL>
                <Input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Search contact…" className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
              </div>
              <div>
                <FL>Reference</FL>
                <Input value={reference} onChange={e=>setReference(e.target.value)} placeholder="e.g. PO-1234" className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
              </div>
              <div>
                <FL>Currency</FL>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-8 text-[13px] border-gray-300 rounded-sm"><SelectValue/></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c=><SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <FL>Amounts Are</FL>
                <Select value={amountsAre} onValueChange={setAmountsAre}>
                  <SelectTrigger className="h-8 text-[13px] border-gray-300 rounded-sm"><SelectValue/></SelectTrigger>
                  <SelectContent>{["Tax Exclusive","Tax Inclusive","No Tax"].map(o=><SelectItem key={o} value={o} className="text-[13px]">{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Line items ── */}
          <div style={{ marginBottom:14, paddingBottom:12, borderBottom:"1px solid #f0f2f5" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, flexWrap:"wrap", gap:6 }}>
              <p style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>Line Items</p>
              <div style={{ display:"flex", gap:6 }}>
                <Button variant="outline" size="sm" onClick={()=>setShowDiscount(d=>!d)}
                  style={{ fontSize:11, fontWeight:600, height:26, padding:"0 8px", borderRadius:3, borderColor:showDiscount?"#1a7cb5":"#d1d5db", color:showDiscount?"#1a7cb5":"#64748b" }}>
                  {showDiscount?"Hide":"Add"} Discount
                </Button>
                <Button variant="outline" size="sm" onClick={()=>setShowTracking(v=>!v)}
                  style={{ fontSize:11, fontWeight:600, height:26, padding:"0 8px", borderRadius:3, borderColor:showTracking?"#1a7cb5":"#d1d5db", color:showTracking?"#1a7cb5":"#64748b" }}>
                  {showTracking?"Hide":"Add"} Tracking
                </Button>
              </div>
            </div>
            <LineTable rows={rows} setRows={setRows} currency={currency} amountsAre={amountsAre} showDiscount={showDiscount} showTracking={showTracking}/>
          </div>

          {/* ── Notes / Terms ── */}
          <div className="rep-notes-grid">
            <div>
              <FL>Notes to Customer</FL>
              <Textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Thank you for your business." className="text-[13px] border-gray-300 rounded-sm resize-none focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
            </div>
            <div>
              <FL>Terms &amp; Conditions</FL>
              <Textarea value={terms} onChange={e=>setTerms(e.target.value)} rows={3} placeholder="e.g. Payment due within 30 days." className="text-[13px] border-gray-300 rounded-sm resize-none focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
            </div>
          </div>
        </CardBody>
        <CardFoot>
          <CancelBtn onNavigate={onNavigate}/>
          <Button onClick={()=>{ if(!contact.trim()) return toast.error("Contact is required."); toast.success("✓ Repeating invoice saved."); onNavigate?.("invoices"); }}
            style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700, height:30, borderRadius:4 }} className="hover:bg-[#155f8d]">Save</Button>
        </CardFoot>
      </Card>
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. NEW CREDIT NOTE
// ════════════════════════════════════════════════════════════════════════════
export function NewCreditNotePage({ onNavigate }) {
  const [contact,    setContact]    = useState("");
  const [date,       setDate]       = useState(new Date().toISOString().slice(0,10));
  const [creditNum,  setCreditNum]  = useState("CN-0001");
  const [reference,  setReference]  = useState("");
  const [currency,   setCurrency]   = useState("AED");
  const [amountsAre, setAmountsAre] = useState("Tax Exclusive");
  const [rows,       setRows]       = useState([emptyRow()]);
  const [showDiscount,setShowDiscount]=useState(false);
  const [notes,      setNotes]      = useState("");

  const tots = calcTotals(rows, amountsAre);

  return (
    <PageShell title="New Credit Note" crumbs={[{label:"Invoices",page:"invoices"}]} onNavigate={onNavigate}>
      <style>{`
        .cn-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(min-width:640px){.cn-grid{grid-template-columns:repeat(3,1fr)}}
        @media(min-width:1024px){.cn-grid{grid-template-columns:1fr 1fr 1fr 1fr 1fr}}
      `}</style>

      <div style={{ background:"#fefce8", border:"1px solid #fde68a", borderRadius:6, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#92400e", display:"flex", gap:8 }}>
        <span style={{ flexShrink:0 }}>⚠️</span>
        <span>A credit note reduces the amount owed. It will be allocated against outstanding invoices for this contact, or held as credit.</span>
      </div>

      <Card>
        <CardBody>
          <div className="cn-grid" style={{ marginBottom:14 }}>
            <div style={{ gridColumn:"span 2" }}>
              <FL req>Contact</FL>
              <Input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Search contact…" className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
            </div>
            <div>
              <FL req>Date</FL>
              <Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
            </div>
            <div>
              <FL>Credit Note #</FL>
              <Input value={creditNum} onChange={e=>setCreditNum(e.target.value)} className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
            </div>
            <div>
              <FL>Reference</FL>
              <Input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Orig invoice #" className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
            </div>
            <div>
              <FL>Currency</FL>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-8 text-[13px] border-gray-300 rounded-sm"><SelectValue/></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c=><SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <FL>Amounts Are</FL>
              <Select value={amountsAre} onValueChange={setAmountsAre}>
                <SelectTrigger className="h-8 text-[13px] border-gray-300 rounded-sm"><SelectValue/></SelectTrigger>
                <SelectContent>{["Tax Exclusive","Tax Inclusive","No Tax"].map(o=><SelectItem key={o} value={o} className="text-[13px]">{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="mb-3"/>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <p style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>Line Items</p>
            <Button variant="outline" size="sm" onClick={()=>setShowDiscount(d=>!d)}
              style={{ fontSize:11, fontWeight:600, height:26, padding:"0 8px", borderRadius:3, borderColor:showDiscount?"#1a7cb5":"#d1d5db", color:showDiscount?"#1a7cb5":"#64748b" }}>
              {showDiscount?"Hide":"Add"} Discount
            </Button>
          </div>
          <LineTable rows={rows} setRows={setRows} currency={currency} amountsAre={amountsAre} showDiscount={showDiscount}/>

          <div style={{ marginTop:14 }}>
            <FL>Notes to Customer</FL>
            <Textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Optional note…" className="text-[13px] border-gray-300 rounded-sm resize-none focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
          </div>
        </CardBody>
        <CardFoot>
          <CancelBtn onNavigate={onNavigate}/>
          <Button onClick={()=>{ if(!contact.trim()) return toast.error("Contact is required."); toast.success("✓ Credit note saved."); onNavigate?.("invoices"); }}
            style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700, height:30, borderRadius:4 }} className="hover:bg-[#155f8d]">Save Credit Note</Button>
        </CardFoot>
      </Card>
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. SEND STATEMENTS
// ════════════════════════════════════════════════════════════════════════════
const CONTACTS_SAMPLE = [
  { id:1, name:"Acme Corp",   email:"accounts@acme.com",    balance:"4,500.00", outstanding:2, overdue:1 },
  { id:2, name:"Beta LLC",    email:"billing@betallc.com",  balance:"1,200.00", outstanding:1, overdue:0 },
  { id:3, name:"Gamma Inc",   email:"pay@gammainc.com",     balance:"0.00",     outstanding:0, overdue:0 },
  { id:4, name:"Delta Co",    email:"finance@deltaco.com",  balance:"320.00",   outstanding:1, overdue:1 },
  { id:5, name:"Echo Ltd",    email:"accounts@echoltd.com", balance:"2,100.00", outstanding:1, overdue:0 },
  { id:6, name:"Foxtrot AG",  email:"ap@foxtrotag.com",     balance:"9,850.00", outstanding:3, overdue:2 },
];

export function SendStatementsPage({ onNavigate }) {
  const [selIds,   setSelIds]   = useState([]);
  const [statType, setStatType] = useState("outstanding");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState(new Date().toISOString().slice(0,10));
  const [showBal,  setShowBal]  = useState(true);
  const [message,  setMessage]  = useState("Please find your account statement attached.\n\nIf you have any queries, please don't hesitate to contact us.\n\nThank you for your business.");
  const [sending,  setSending]  = useState(false);
  const [subject,  setSubject]  = useState("Your account statement from [Company Name]");

  const allCk  = selIds.length === CONTACTS_SAMPLE.length;
  const partCk = selIds.length > 0 && !allCk;
  const toggleAll = ()=>setSelIds(allCk?[]:CONTACTS_SAMPLE.map(c=>c.id));
  const toggleOne = id=>setSelIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const doSend = () => {
    if (!selIds.length) return toast.error("Select at least one contact.");
    setSending(true);
    setTimeout(()=>{ setSending(false); toast.success(`✓ Statements sent to ${selIds.length} contact${selIds.length>1?"s":""}.`); onNavigate?.("invoices"); }, 900);
  };

  const TH = { padding:"8px 10px", fontSize:11, fontWeight:700, color:"#1a7cb5", background:"#eaf4fb", borderBottom:"2px solid #c6dff0", whiteSpace:"nowrap" };

  return (
    <PageShell title="Send Statements" crumbs={[{label:"Invoices",page:"invoices"}]} onNavigate={onNavigate}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Options */}
        <Card>
          <CardBody>
            <p style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Statement Options</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:12 }}>
              <div>
                <FL>Statement Type</FL>
                <Select value={statType} onValueChange={setStatType}>
                  <SelectTrigger className="h-8 text-[13px] border-gray-300 rounded-sm"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outstanding" className="text-[13px]">Outstanding Invoices</SelectItem>
                    <SelectItem value="activity"    className="text-[13px]">Activity Statement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {statType==="activity" && <>
                <div>
                  <FL>From Date</FL>
                  <Input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
                </div>
                <div>
                  <FL>To Date</FL>
                  <Input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
                </div>
              </>}
              <div style={{ display:"flex", alignItems:"center", gap:8, paddingTop:20 }}>
                <Switch id="showbal" checked={showBal} onCheckedChange={setShowBal}/>
                <Label htmlFor="showbal" style={{ fontSize:12, cursor:"pointer" }}>Show outstanding balance</Label>
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <FL>Email Subject</FL>
              <Input value={subject} onChange={e=>setSubject(e.target.value)} className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
            </div>
            <div>
              <FL>Email Message</FL>
              <Textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} className="text-[13px] border-gray-300 rounded-sm resize-y focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
            </div>
          </CardBody>
        </Card>

        {/* Contact table */}
        <Card>
          <div style={{ padding:"10px 14px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>Select Contacts</span>
            {selIds.length>0 && (
              <Badge style={{ background:"#dbeafe", color:"#1e40af", border:"1px solid #bfdbfe", fontSize:11, fontWeight:700, padding:"2px 8px" }}>
                {selIds.length} selected
              </Badge>
            )}
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width:40, padding:"8px 10px" }}>
                    <input type="checkbox" checked={allCk} ref={el=>{if(el)el.indeterminate=partCk;}} onChange={toggleAll}
                      style={{ width:14, height:14, accentColor:"#1a7cb5", cursor:"pointer" }}/>
                  </th>
                  <th style={TH}>Contact</th>
                  <th style={TH}>Email</th>
                  <th style={{ ...TH, textAlign:"right" }}>Balance</th>
                  <th style={{ ...TH, textAlign:"center" }}>Invoices</th>
                  <th style={{ ...TH, textAlign:"center" }}>Overdue</th>
                </tr>
              </thead>
              <tbody>
                {CONTACTS_SAMPLE.map(c=>(
                  <tr key={c.id} style={{ background:selIds.includes(c.id)?"#f0f7ff":"#fff", borderBottom:"1px solid #f0f0f0" }}
                    onMouseEnter={e=>{ if(!selIds.includes(c.id)) e.currentTarget.style.background="#f0f8fd"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=selIds.includes(c.id)?"#f0f7ff":"#fff"; }}>
                    <td style={{ padding:"9px 10px" }}>
                      <input type="checkbox" checked={selIds.includes(c.id)} onChange={()=>toggleOne(c.id)}
                        style={{ width:14, height:14, accentColor:"#1a7cb5", cursor:"pointer" }}/>
                    </td>
                    <td style={{ padding:"9px 10px", fontSize:13, fontWeight:600, color:"#1a7cb5" }}>{c.name}</td>
                    <td style={{ padding:"9px 10px", fontSize:12, color:"#64748b" }}>{c.email}</td>
                    <td style={{ padding:"9px 10px", fontSize:13, fontWeight:600, textAlign:"right", color:c.balance==="0.00"?"#94a3b8":"#0f172a" }}>
                      {c.balance==="0.00"?"—":"$"+c.balance}
                    </td>
                    <td style={{ padding:"9px 10px", textAlign:"center", fontSize:12, color:"#374151" }}>{c.outstanding||"—"}</td>
                    <td style={{ padding:"9px 10px", textAlign:"center" }}>
                      {c.overdue>0
                        ? <span style={{ fontSize:11, fontWeight:700, background:"#fee2e2", color:"#dc2626", padding:"1px 7px", borderRadius:3 }}>{c.overdue} overdue</span>
                        : <span style={{ fontSize:12, color:"#94a3b8" }}>—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CardFoot>
            <CancelBtn onNavigate={onNavigate}/>
            <Button onClick={doSend} disabled={sending||!selIds.length}
              style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700, height:30, borderRadius:4 }} className="hover:bg-[#155f8d]">
              {sending?"Sending…":`Send Statement${selIds.length!==1?"s":""}`}
            </Button>
          </CardFoot>
        </Card>
      </div>
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. IMPORT INVOICES
// ════════════════════════════════════════════════════════════════════════════
export function ImportInvoicesPage({ onNavigate }) {
  const [file,       setFile]       = useState(null);
  const [dragging,   setDragging]   = useState(false);
  const [importType, setImportType] = useState("invoices");
  const [step,       setStep]       = useState(1); // 1=upload, 2=preview, 3=done
  const fileRef = useRef(null);

  const handleDrop = e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) setFile(f);
    else toast.error("Please upload a .csv file.");
  };

  const doImport = () => {
    toast.success(`✓ Importing ${file.name}…`);
    setTimeout(()=>onNavigate?.("invoices"), 1000);
  };

  return (
    <PageShell title="Import" crumbs={[{label:"Invoices",page:"invoices"}]} onNavigate={onNavigate}>
      <Card style={{ maxWidth:680 }}>
        <CardBody>
          <div style={{ marginBottom:16 }}>
            <FL req>What would you like to import?</FL>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger className="h-8 text-[13px] border-gray-300 rounded-sm" style={{ maxWidth:280 }}><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="invoices"    className="text-[13px]">Sales Invoices</SelectItem>
                <SelectItem value="creditnotes" className="text-[13px]">Credit Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-4"/>

          <p style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:10 }}>Upload CSV File</p>

          {/* Drop zone */}
          <div
            onDragOver={e=>{e.preventDefault();setDragging(true);}}
            onDragLeave={()=>setDragging(false)}
            onDrop={handleDrop}
            onClick={()=>fileRef.current?.click()}
            style={{ border:`2px dashed ${dragging?"#1a7cb5":"#d1d5db"}`, borderRadius:8, padding:"32px 20px", textAlign:"center", cursor:"pointer", background:dragging?"#eff6ff":"#f8fafc", transition:"all .15s" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
            <p style={{ fontSize:13, fontWeight:600, color:"#374151", margin:"0 0 4px" }}>
              {file ? file.name : "Drag & drop your CSV here, or click to browse"}
            </p>
            <p style={{ fontSize:12, color:"#9ca3af", margin:0 }}>CSV files only · Max 5 MB</p>
            <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }}
              onChange={e=>{ if(e.target.files[0]) setFile(e.target.files[0]); }}/>
          </div>

          {file && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10, padding:"8px 12px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:6 }}>
              <span>✅</span>
              <span style={{ fontSize:13, fontWeight:600, color:"#065f46" }}>{file.name}</span>
              <span style={{ fontSize:11, color:"#94a3b8" }}>({(file.size/1024).toFixed(1)} KB)</span>
              <button onClick={e=>{e.stopPropagation();setFile(null);}} style={{ all:"unset", marginLeft:"auto", cursor:"pointer", color:"#94a3b8", fontSize:16 }}>×</button>
            </div>
          )}

          <Separator className="my-4"/>

          {/* Template */}
          <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:6, padding:"12px 14px", fontSize:12 }}>
            <p style={{ fontWeight:700, color:"#374151", margin:"0 0 4px" }}>📋 Need a template?</p>
            <p style={{ color:"#64748b", margin:"0 0 8px" }}>Download our CSV template with the required column headings for {importType==="invoices"?"sales invoices":"credit notes"}.</p>
            <Button variant="outline" size="sm" onClick={()=>toast.info("Template download coming soon.")}
              style={{ fontSize:12, fontWeight:700, height:28, borderRadius:3, borderColor:"#1a7cb5", color:"#1a7cb5" }}>
              Download Template
            </Button>
          </div>
        </CardBody>
        <CardFoot>
          <CancelBtn onNavigate={onNavigate}/>
          <Button onClick={doImport} disabled={!file}
            style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700, height:30, borderRadius:4 }} className="hover:bg-[#155f8d]">Import</Button>
        </CardFoot>
      </Card>
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 5. EXPORT INVOICES
// ════════════════════════════════════════════════════════════════════════════
export function ExportInvoicesPage({ onNavigate }) {
  const [format,     setFormat]     = useState("csv");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState(new Date().toISOString().slice(0,10));
  const [statuses,   setStatuses]   = useState(["Draft","Awaiting Approval","Awaiting Payment","Paid"]);
  const [exporting,  setExporting]  = useState(false);

  const STATUS_LIST = ["Draft","Awaiting Approval","Awaiting Payment","Paid","Repeating","Voided"];
  const toggleStatus = s => setStatuses(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);

  const doExport = () => {
    if (!statuses.length) return toast.error("Select at least one status.");
    setExporting(true);
    setTimeout(()=>{ setExporting(false); toast.success(`✓ Invoices exported as ${format.toUpperCase()}.`); }, 800);
  };

  return (
    <PageShell title="Export Invoices" crumbs={[{label:"Invoices",page:"invoices"}]} onNavigate={onNavigate}>
      <Card style={{ maxWidth:560 }}>
        <CardBody>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            <div>
              <FL>Export Format</FL>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-8 text-[13px] border-gray-300 rounded-sm"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv"  className="text-[13px]">CSV</SelectItem>
                  <SelectItem value="pdf"  className="text-[13px]">PDF</SelectItem>
                  <SelectItem value="xlsx" className="text-[13px]">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div/>
            <div>
              <FL>Date From</FL>
              <Input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
            </div>
            <div>
              <FL>Date To</FL>
              <Input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
            </div>
          </div>

          <div style={{ marginBottom:4 }}>
            <FL>Include Statuses</FL>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
              {STATUS_LIST.map(s=>(
                <button key={s} onClick={()=>toggleStatus(s)}
                  style={{ padding:"4px 12px", fontSize:12, fontWeight:600, borderRadius:20, border:"1px solid", cursor:"pointer",
                    background:statuses.includes(s)?"#1a7cb5":"#fff",
                    borderColor:statuses.includes(s)?"#1a7cb5":"#d1d5db",
                    color:statuses.includes(s)?"#fff":"#374151",
                    transition:"all .12s" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
        <CardFoot>
          <CancelBtn onNavigate={onNavigate}/>
          <Button onClick={doExport} disabled={exporting}
            style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700, height:30, borderRadius:4 }} className="hover:bg-[#155f8d]">
            {exporting?"Exporting…":`Export ${format.toUpperCase()}`}
          </Button>
        </CardFoot>
      </Card>
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 6. INVOICE REMINDERS
// ════════════════════════════════════════════════════════════════════════════
const DEFAULT_REMINDERS = [
  { id:1, timing:"before", days:7,  name:"Due soon – 7 days",   enabled:false, subject:"Reminder: Invoice {invoice_number} due in 7 days", body:"Hi {contact},\n\nThis is a friendly reminder that invoice {invoice_number} for {amount} is due on {due_date} — just 7 days away.\n\nPlease ensure payment is made by the due date.\n\nThank you!" },
  { id:2, timing:"before", days:3,  name:"Due soon – 3 days",   enabled:false, subject:"Reminder: Invoice {invoice_number} due in 3 days", body:"Hi {contact},\n\nInvoice {invoice_number} for {amount} is due in 3 days on {due_date}. Please arrange payment.\n\nThank you!" },
  { id:3, timing:"after",  days:1,  name:"Overdue – day 1",     enabled:false, subject:"Invoice {invoice_number} is now overdue",          body:"Hi {contact},\n\nInvoice {invoice_number} for {amount} was due on {due_date} and is now overdue.\n\nPlease arrange payment as soon as possible.\n\nThank you." },
  { id:4, timing:"after",  days:7,  name:"Overdue – 7 days",    enabled:false, subject:"Invoice {invoice_number} overdue by 7 days",       body:"Hi {contact},\n\nInvoice {invoice_number} for {amount} is now 7 days overdue.\n\nPlease contact us if you have any questions about this invoice.\n\nThank you." },
  { id:5, timing:"after",  days:14, name:"Overdue – 14 days",   enabled:false, subject:"Action required – Invoice {invoice_number} overdue", body:"Hi {contact},\n\nInvoice {invoice_number} for {amount} is now 14 days overdue.\n\nPlease arrange payment immediately or contact us to discuss.\n\nThank you." },
];

export function InvoiceRemindersPage({ onNavigate }) {
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);
  const [globalOn,  setGlobalOn]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [saved,     setSaved]     = useState(false);

  const upd = (id,f,v) => setReminders(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const activeCount = reminders.filter(r=>r.enabled).length;

  const doSave = () => {
    setSaved(true);
    toast.success(`✓ Reminder settings saved. ${globalOn?`${activeCount} reminder${activeCount!==1?"s":""} active.`:""}`);
    setTimeout(()=>setSaved(false), 2500);
  };

  return (
    <PageShell title="Invoice Reminders" crumbs={[{label:"Invoices",page:"invoices"}]} onNavigate={onNavigate}>

      {/* Global toggle */}
      <Card style={{ marginBottom:14 }}>
        <CardBody style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:8, background:globalOn?"#dbeafe":"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🔔</div>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0 }}>Invoice Reminders</p>
              <p style={{ fontSize:12, color:"#64748b", margin:"2px 0 0" }}>
                {globalOn
                  ? `Reminders are ON — ${activeCount} reminder${activeCount!==1?"s":""} currently active`
                  : "Automatically remind customers of unpaid invoices. Turn on to get started."}
              </p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:globalOn?"#059669":"#94a3b8" }}>{globalOn?"ON":"OFF"}</span>
            <Switch checked={globalOn} onCheckedChange={v=>{ setGlobalOn(v); if(!v) setReminders(p=>p.map(r=>({...r,enabled:false}))); }}/>
          </div>
        </CardBody>
      </Card>

      {/* Reminder cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
        {/* Before due */}
        <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", margin:"4px 0" }}>Before Due Date</p>
        {reminders.filter(r=>r.timing==="before").map(rem=>(
          <ReminderCard key={rem.id} rem={rem} globalOn={globalOn} editId={editId} setEditId={setEditId} upd={upd}/>
        ))}
        <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", margin:"10px 0 4px" }}>After Due Date (Overdue)</p>
        {reminders.filter(r=>r.timing==="after").map(rem=>(
          <ReminderCard key={rem.id} rem={rem} globalOn={globalOn} editId={editId} setEditId={setEditId} upd={upd}/>
        ))}
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
        <CancelBtn onNavigate={onNavigate}/>
        <Button onClick={doSave}
          style={{ background:saved?"#059669":"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700, height:30, borderRadius:4, transition:"background .3s" }} className="hover:bg-[#155f8d]">
          {saved?"✓ Saved":"Save Settings"}
        </Button>
      </div>
    </PageShell>
  );
}

function ReminderCard({ rem, globalOn, editId, setEditId, upd }) {
  const isEdit = editId === rem.id;
  return (
    <div style={{ background:"#fff", border:`1px solid ${rem.enabled?"#bfdbfe":"#e2e8f0"}`, borderRadius:8, overflow:"hidden", opacity:globalOn?1:0.5, transition:"opacity .2s, border-color .2s" }}>
      <div style={{ padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Switch checked={rem.enabled} disabled={!globalOn} onCheckedChange={v=>upd(rem.id,"enabled",v)}/>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:"#0f172a", margin:0 }}>{rem.name}</p>
            <p style={{ fontSize:11, color:"#94a3b8", margin:"1px 0 0" }}>
              {rem.timing==="before"?`${rem.days} days before due date`:`${rem.days} day${rem.days!==1?"s":""} after due date`}
            </p>
          </div>
          {rem.enabled && <Badge style={{ background:"#dcfce7", color:"#166534", border:"1px solid #bbf7d0", fontSize:10, fontWeight:700, padding:"1px 7px" }}>Active</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={()=>setEditId(isEdit?null:rem.id)} disabled={!globalOn}
          style={{ fontSize:11, fontWeight:600, height:26, padding:"0 10px", borderRadius:3, borderColor:"#d1d5db", color:"#374151" }}>
          {isEdit?"Close":"Edit Template"}
        </Button>
      </div>
      {isEdit && (
        <div style={{ borderTop:"1px solid #f0f2f5", padding:"12px 14px", background:"#fafafa" }}>
          <div style={{ marginBottom:8 }}>
            <Label className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide">Email Subject</Label>
            <Input value={rem.subject} onChange={e=>upd(rem.id,"subject",e.target.value)} className="h-8 text-[13px] border-gray-300 rounded-sm focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
          </div>
          <div>
            <Label className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide">Email Body</Label>
            <Textarea value={rem.body} onChange={e=>upd(rem.id,"body",e.target.value)} rows={5}
              className="text-[12px] border-gray-300 rounded-sm resize-y focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0"/>
          </div>
          <p style={{ fontSize:11, color:"#94a3b8", marginTop:6 }}>
            Variables: <code style={{ fontSize:10, background:"#f0f2f5", padding:"1px 4px", borderRadius:3 }}>{`{contact}`}</code>{" "}
            <code style={{ fontSize:10, background:"#f0f2f5", padding:"1px 4px", borderRadius:3 }}>{`{invoice_number}`}</code>{" "}
            <code style={{ fontSize:10, background:"#f0f2f5", padding:"1px 4px", borderRadius:3 }}>{`{amount}`}</code>{" "}
            <code style={{ fontSize:10, background:"#f0f2f5", padding:"1px 4px", borderRadius:3 }}>{`{due_date}`}</code>
          </p>
        </div>
      )}
    </div>
  );
}
