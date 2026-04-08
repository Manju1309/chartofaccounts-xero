import { useState, useMemo, useRef } from "react";
import { Button }    from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox }  from "@/components/ui/checkbox";
import { Label }     from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";


const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const YEARS = ["2024","2025","2026","2027"];

function formatMonthYear(iso) {
  // iso = "YYYY-MM-DD"
  const [y, m] = iso.split("-");
  const d  = new Date(parseInt(y), parseInt(m)-1, 1);
  return `1 ${MONTHS[d.getMonth()]} ${y}`;
}
function formatEndMonthYear(iso) {
  const [y, m] = iso.split("-");
  const d = new Date(parseInt(y), parseInt(m), 0); // last day of month
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${y}`;
}
function fmtDate(iso) {
  const [y,m,d] = iso.split("-");
  return `${parseInt(d)} ${MONTHS[parseInt(m)-1]} ${y}`;
}


const SAMPLE_AUDIT = [
  { date:"2026-03-05", account:"Sales (200)",          ref:"INV-001", details:"Acme Corp – Consulting",   gross:"4,500.00",  tax:"675.00",  net:"3,825.00"  },
  { date:"2026-03-08", account:"Sales (200)",          ref:"INV-002", details:"Beta LLC – Software",      gross:"1,200.00",  tax:"180.00",  net:"1,020.00"  },
  { date:"2026-03-12", account:"Cost of Goods (310)",  ref:"BILL-010",details:"Supplier – Parts",         gross:"-890.00",   tax:"-133.50", net:"-756.50"   },
  { date:"2026-03-18", account:"Sales (200)",          ref:"INV-003", details:"Gamma Inc – Retainer",     gross:"8,750.00",  tax:"1,312.50",net:"7,437.50"  },
  { date:"2026-03-22", account:"Advertising (400)",    ref:"BILL-011",details:"Google Ads March",         gross:"-320.00",   tax:"-48.00",  net:"-272.00"   },
  { date:"2026-03-25", account:"Sales (200)",          ref:"INV-004", details:"Delta Co – Annual Plan",   gross:"2,100.00",  tax:"315.00",  net:"1,785.00"  },
  { date:"2026-03-28", account:"Office Expenses (452)",ref:"BILL-012",details:"Stationery & Supplies",    gross:"-156.00",   tax:"-23.40",  net:"-132.60"   },
];


function MonthSelect({ value, onChange, label }) {
  const [y, m] = value.split("-");
  const month  = parseInt(m) - 1;
  const year   = y;

  const setMonth = (newM) => {
    const mm = String(newM + 1).padStart(2,"0");
    const lastDay = new Date(parseInt(year), newM+1, 0).getDate();
    onChange(`${year}-${mm}-01`);
  };
  const setYear = (newY) => {
    const mm = String(month + 1).padStart(2,"0");
    onChange(`${newY}-${mm}-01`);
  };

  const displayLabel = label === "from"
    ? `1 ${MONTHS[month]} ${year}`
    : `${new Date(parseInt(year), month+1, 0).getDate()} ${MONTHS[month]} ${year}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button style={{
          display:"flex", alignItems:"center", gap:4,
          background:"#fff", border:"1px solid #bbb", borderRadius:3,
          padding:"4px 8px", fontSize:13, cursor:"pointer", color:"#333",
          whiteSpace:"nowrap",
        }}>
          {displayLabel}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent style={{ padding:8, minWidth:220 }} align="start">
        {/* Month grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:2, marginBottom:8 }}>
          {MONTHS.map((mn, i) => (
            <button key={mn} onClick={() => setMonth(i)}
              style={{
                padding:"4px 6px", fontSize:12, borderRadius:3, border:"none", cursor:"pointer",
                background: i===month ? "#1a7cb5" : "transparent",
                color: i===month ? "#fff" : "#333",
                fontWeight: i===month ? 700 : 400,
              }}
              onMouseEnter={e=>{ if(i!==month) e.currentTarget.style.background="#f0f0f0"; }}
              onMouseLeave={e=>{ if(i!==month) e.currentTarget.style.background="transparent"; }}>
              {mn}
            </button>
          ))}
        </div>
        <Separator style={{ margin:"4px 0 8px" }}/>
        {/* Year row */}
        <div style={{ display:"flex", gap:4, justifyContent:"center" }}>
          {YEARS.map(yr => (
            <button key={yr} onClick={() => setYear(yr)}
              style={{
                padding:"3px 8px", fontSize:12, borderRadius:3, border:"none", cursor:"pointer",
                background: yr===year ? "#1a7cb5" : "transparent",
                color: yr===year ? "#fff" : "#333",
                fontWeight: yr===year ? 700 : 400,
              }}
              onMouseEnter={e=>{ if(yr!==year) e.currentTarget.style.background="#f0f0f0"; }}
              onMouseLeave={e=>{ if(yr!==year) e.currentTarget.style.background="transparent"; }}>
              {yr}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export default function SalesTaxReportPage({ onNavigate }) {
  const [activeTab,     setActiveTab]     = useState("summary"); // "summary" | "audit"
  const [fromDate,      setFromDate]      = useState("2026-03-01");
  const [toDate,        setToDate]        = useState("2026-03-31");
  const [showByRate,    setShowByRate]    = useState(true);
  const [showByComp,    setShowByComp]    = useState(true);
  const [showByAcct,    setShowByAcct]    = useState(true);
  const [wideView,      setWideView]      = useState(false);
  const [exportOpen,    setExportOpen]    = useState(false);
  const [updated,       setUpdated]       = useState(false);

  
  const [auditSearch,   setAuditSearch]   = useState("");

  const fromLabel = formatMonthYear(fromDate);
  const toLabel   = formatEndMonthYear(toDate);
  const periodLabel = `For the period ${fromLabel} to ${toLabel}`;

  const filteredAudit = useMemo(() => {
    if (!auditSearch.trim()) return SAMPLE_AUDIT;
    const q = auditSearch.toLowerCase();
    return SAMPLE_AUDIT.filter(r =>
      r.account.toLowerCase().includes(q) ||
      r.ref.toLowerCase().includes(q)     ||
      r.details.toLowerCase().includes(q)
    );
  }, [auditSearch]);


  const summary = useMemo(() => {
    const rows = SAMPLE_AUDIT;
    let taxCollected = 0, taxPaid = 0;
    rows.forEach(r => {
      const t = parseFloat(r.tax.replace(/,/g,"")) || 0;
      if (t >= 0) taxCollected += t;
      else taxPaid += Math.abs(t);
    });
    return { taxCollected, taxPaid, net: taxCollected - taxPaid };
  }, []);

  const thBase = {
    padding:"8px 10px", fontSize:12, fontWeight:700, color:"#1a7cb5",
    background:"#eaf4fb", borderBottom:"2px solid #c6dff0",
    whiteSpace:"nowrap", textAlign:"left",
  };

  const doExport = (fmt) => toast.success(`✓ Exporting as ${fmt}…`);
  const doPublish= () => toast.success("✓ Report published.");
  const doPrint  = () => window.print();
  const doUpdate = () => { setUpdated(true); toast.success("✓ Report updated."); setTimeout(()=>setUpdated(false),2000); };

  return (
    <div style={{ fontFamily:"Arial,Helvetica,sans-serif", background:"#fff", minHeight:"calc(100vh - 48px)", color:"#333", fontSize:13 }}>
      <style>{`
        .str-tab-btn { border:1px solid #ccc; background:#f5f5f5; padding:7px 14px; font-size:13px; cursor:pointer; color:#555; font-weight:400; white-space:nowrap; }
        .str-tab-btn:first-child { border-radius:3px 0 0 3px; }
        .str-tab-btn:last-child  { border-radius:0 3px 3px 0; border-left:none; }
        .str-tab-btn.active { background:#fff; color:#1a1a1a; font-weight:700; border-bottom-color:#fff; z-index:1; }
        .str-summary-table { width:100%; border-collapse:collapse; }
        .str-summary-table tr td { padding:6px 10px; border-bottom:1px solid #eee; font-size:13px; }
        .str-summary-table tr td:last-child { text-align:right; color:#333; }
        .str-summary-table tr:last-child td { border-bottom:none; }
        .str-meta-table { width:100%; border-collapse:collapse; max-width:800px; margin:16px auto 0; }
        .str-meta-table td { padding:5px 10px; font-size:13px; border-bottom:1px solid #e8e8e8; }
        .str-meta-table td:last-child { text-align:right; color:#555; }
        .str-section-title { font-size:13px; font-weight:700; background:"#f5f5f5"; padding:6px 10px; border-bottom:1px solid #ddd; color:#333; }
        .str-audit-table { width:100%; border-collapse:collapse; min-width:640px; }
        .str-audit-th { padding:8px 10px; font-size:12px; font-weight:700; color:"#555"; background:#f0f0f0; border-bottom:1px solid #ccc; white-space:nowrap; }
        .str-audit-td { padding:8px 10px; font-size:13px; border-bottom:1px solid #eee; vertical-align:top; }
        .str-footer { background:"#dbeafe"; border-top:"1px solid #c6dff0"; padding:10px 16px; display:flex; align-items:center; justify-content:flex-end; gap:8px; }
        @media(max-width:640px){
          .str-filter-row { flex-wrap:wrap!important; gap:8px!important; }
          .str-period-label { font-size:13px!important; }
          .str-actions-row { flex-wrap:wrap!important; }
        }
        @media print {
          header, .str-no-print { display:none!important; }
        }
      `}</style>

      
      <div style={{ padding:"14px 16px 0", background:"#fff", borderBottom:"1px solid #e0e0e0" }}>
        <p style={{ fontSize:12, color:"#888", marginBottom:3 }}>
          <span style={{ color:"#1a7cb5", cursor:"pointer" }} onClick={()=>onNavigate?.("reporting")}>Reports</span>
          <span style={{ margin:"0 5px", color:"#ccc" }}>›</span>
        </p>
        <h1 style={{ margin:"0 0 14px", fontSize:22, fontWeight:700, color:"#1a1a1a", letterSpacing:"-0.02em" }}>
          Sales Tax Report
        </h1>
      </div>

      
      <div style={{ padding:"12px 16px 0", background:"#fff", borderBottom:"1px solid #e0e0e0", display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex" }} className="str-no-print">
          <button
            className={`str-tab-btn${activeTab==="summary"?" active":""}`}
            onClick={()=>setActiveTab("summary")}>
            Sales Tax Summary
          </button>
          <button
            className={`str-tab-btn${activeTab==="audit"?" active":""}`}
            onClick={()=>setActiveTab("audit")}
            style={{ borderLeft:activeTab==="summary"?"1px solid #ccc":"none" }}>
            Sales Tax Audit Report
          </button>
        </div>
        <button
          onClick={()=>setWideView(v=>!v)}
          style={{ fontSize:12, color:"#1a7cb5", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, marginBottom:4, padding:0 }}
          className="str-no-print">
          Wide view
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a7cb5" strokeWidth="2">
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
          </svg>
        </button>
      </div>

      
      <div style={{ maxWidth: wideView ? "100%" : 980, margin:"0 auto", padding:"0 0 80px" }}>

        
        {activeTab === "summary" && (
          <>
            {/* Filter panel */}
            <div style={{ margin:"16px 16px 0", border:"1px solid #c8dff0", borderRadius:4, background:"#e8f3fb", padding:"14px 16px" }}>
              <div className="str-filter-row" style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:13, color:"#555", fontWeight:600 }}>From:</span>
                  <MonthSelect value={fromDate} onChange={setFromDate} label="from"/>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:13, color:"#555", fontWeight:600 }}>To:</span>
                  <MonthSelect value={toDate} onChange={setToDate} label="to"/>
                </div>
                <Button onClick={doUpdate}
                  style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700, height:30, padding:"0 18px", borderRadius:3 }}
                  className="hover:bg-[#155f8d]">
                  Update
                </Button>
              </div>

              {/* Checkboxes */}
              <div style={{ marginTop:12,  display:"flex", flexDirection:"column", gap:7 }}>
                {[
                  ["rate", showByRate,  setShowByRate,  "Show by Tax Rate"],
                  ["comp", showByComp,  setShowByComp,  "Show by Tax Component"],
                  ["acct", showByAcct,  setShowByAcct,  "Show by Account Type"],
                ].map(([id, val, setter, lbl])=>(
                  <div key={id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Checkbox
                      id={id}
                      checked={val}
                      onCheckedChange={v=>setter(!!v)}
                      style={{ accentColor:"#1a7cb5",width:18, height:18 }}
                      className="border-[#1a7cb5] data-[state=checked]:bg-[#1a7cb5] data-[state=checked]:border-[#1a7cb5] h-4 w-4"
                    />
                    <Label htmlFor={id} style={{ fontSize:13, cursor:"pointer", color:"#333", fontWeight:400 }}>{lbl}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Report output */}
            <div style={{ margin:"24px 16px 0", textAlign:"center" }}>
              <p style={{ fontSize:16, fontWeight:700, color:"#1a1a1a", margin:"0 0 2px" }}>Sales Tax Summary</p>
              <p style={{ fontSize:13, color:"#555", margin:"0 0 2px" }}>Test</p>
              <p style={{ fontSize:13, color:"#555", margin:0 }} className="str-period-label">{periodLabel}</p>
            </div>

            {/* Meta table */}
            <table className="str-meta-table">
              <tbody>
                {[
                //   ["Tax ID Number",     <span style={{ display:"flex", alignItems:"center", gap:6 }}>Not found. <span style={{ color:"#1a7cb5", cursor:"pointer" }}>Enter</span></span>],
                ["Tax ID Number",
  <>
    Not found.{" "}
    <button
      onClick={() => console.log("Enter clicked")}
      style={{ color:"#1a7cb5", cursor:"pointer", background:"none", border:"none", padding:0 }}
    >
      Enter
    </button>
  </>
],
                //   ["Tax Basis",         <span style={{ display:"flex", alignItems:"center", gap:6 }}>Not set. <span style={{ color:"#1a7cb5", cursor:"pointer" }}>Set tax basis</span></span>],
                ["Tax Basis",
  <>
    Not set.{" "}
    <button
      onClick={() => console.log("Set tax basis clicked")}
      style={{ color:"#1a7cb5", cursor:"pointer", background:"none", border:"none", padding:0 }}
    >
      Set tax basis
    </button>
  </>
],
                  ["Tax Period covered","1 Monthly"],
                  ["From",              fromLabel],
                  ["To",                `${new Date(parseInt(toDate.split("-")[0]), parseInt(toDate.split("-")[1]), 0).getDate()} ${MONTHS[parseInt(toDate.split("-")[1])-1]} ${toDate.split("-")[0]}`],
                ].map(([label, val], i) => (
                  <tr key={i}>
                    <td style={{ padding:"5px 10px", fontSize:13, borderBottom:"1px solid #e8e8e8", color:"#333" }}>{label}</td>
                    <td style={{ padding:"5px 10px", fontSize:13, borderBottom:"1px solid #e8e8e8", textAlign:"right", color:"#555" }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Tax breakdown (shown if checkboxes enabled) */}
            {(showByRate || showByComp || showByAcct) && (
              <div style={{ margin:"24px 16px 0" }}>
                {showByRate && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:13, fontWeight:700, background:"#f5f5f5", padding:"6px 10px", borderTop:"1px solid #ddd", borderBottom:"1px solid #ddd", color:"#333" }}>
                      Tax Rate Summary
                    </div>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ background:"#eaf4fb" }}>
                          <th style={{ ...thBase, fontSize:12 }}>Tax Rate</th>
                          <th style={{ ...thBase, fontSize:12, textAlign:"right" }}>Tax on Sales</th>
                          <th style={{ ...thBase, fontSize:12, textAlign:"right" }}>Tax on Purchases</th>
                          <th style={{ ...thBase, fontSize:12, textAlign:"right" }}>Net Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { rate:"15% VAT",          sales:"2,302.50",  purchases:"204.90",  net:"2,097.60" },
                          { rate:"Tax on Sales (0%)", sales:"0.00",      purchases:"0.00",    net:"0.00" },
                        ].map((row,i)=>(
                          <tr key={i} style={{ borderBottom:"1px solid #efefef", background:i%2===0?"#fff":"#fafafa" }}>
                            <td style={{ padding:"7px 10px", fontSize:13 }}>{row.rate}</td>
                            <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", color:"#1a7cb5", fontWeight:600 }}>{row.sales}</td>
                            <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", color:"#1a7cb5", fontWeight:600 }}>({row.purchases})</td>
                            <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700 }}>{row.net}</td>
                          </tr>
                        ))}
                        <tr style={{ background:"#f0f0f0", borderTop:"2px solid #ccc" }}>
                          <td style={{ padding:"7px 10px", fontSize:13, fontWeight:700 }}>Total</td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700 }}>
                            {summary.taxCollected.toLocaleString("en-US",{minimumFractionDigits:2})}
                          </td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700 }}>
                            ({summary.taxPaid.toLocaleString("en-US",{minimumFractionDigits:2})})
                          </td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700, color:"#1a7cb5" }}>
                            {summary.net.toLocaleString("en-US",{minimumFractionDigits:2})}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {showByComp && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:13, fontWeight:700, background:"#f5f5f5", padding:"6px 10px", borderTop:"1px solid #ddd", borderBottom:"1px solid #ddd", color:"#333" }}>
                      Tax Component Summary
                    </div>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ background:"#eaf4fb" }}>
                          <th style={{ ...thBase, fontSize:12 }}>Component</th>
                          <th style={{ ...thBase, fontSize:12, textAlign:"right" }}>Tax Collected</th>
                          <th style={{ ...thBase, fontSize:12, textAlign:"right" }}>Tax Paid</th>
                          <th style={{ ...thBase, fontSize:12, textAlign:"right" }}>Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom:"1px solid #efefef" }}>
                          <td style={{ padding:"7px 10px", fontSize:13 }}>Output Tax</td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", color:"#1a7cb5", fontWeight:600 }}>2,302.50</td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", color:"#1a7cb5", fontWeight:600 }}>0.00</td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700 }}>2,302.50</td>
                        </tr>
                        <tr style={{ borderBottom:"1px solid #efefef", background:"#fafafa" }}>
                          <td style={{ padding:"7px 10px", fontSize:13 }}>Input Tax</td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", color:"#1a7cb5", fontWeight:600 }}>0.00</td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", color:"#1a7cb5", fontWeight:600 }}>204.90</td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700 }}>(204.90)</td>
                        </tr>
                        <tr style={{ background:"#f0f0f0", borderTop:"2px solid #ccc" }}>
                          <td style={{ padding:"7px 10px", fontSize:13, fontWeight:700 }}>Total</td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700 }}>2,302.50</td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700 }}>204.90</td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700, color:"#1a7cb5" }}>2,097.60</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {showByAcct && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:13, fontWeight:700, background:"#f5f5f5", padding:"6px 10px", borderTop:"1px solid #ddd", borderBottom:"1px solid #ddd", color:"#333" }}>
                      Account Type Summary
                    </div>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ background:"#eaf4fb" }}>
                          <th style={{ ...thBase, fontSize:12 }}>Account Type</th>
                          <th style={{ ...thBase, fontSize:12, textAlign:"right" }}>Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { type:"Revenue",      tax:"2,302.50" },
                          { type:"Expense",      tax:"(204.90)" },
                          { type:"Direct Costs", tax:"(133.50)" },
                        ].map((row,i)=>(
                          <tr key={i} style={{ borderBottom:"1px solid #efefef", background:i%2===0?"#fff":"#fafafa" }}>
                            <td style={{ padding:"7px 10px", fontSize:13 }}>{row.type}</td>
                            <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:600,
                              color: row.tax.startsWith("(")?"#dc2626":"#1a7cb5" }}>{row.tax}</td>
                          </tr>
                        ))}
                        <tr style={{ background:"#f0f0f0", borderTop:"2px solid #ccc" }}>
                          <td style={{ padding:"7px 10px", fontSize:13, fontWeight:700 }}>Total</td>
                          <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700, color:"#1a7cb5" }}>2,097.60</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Pagination arrows (Xero style) */}
            <div className="str-no-print" style={{ display:"flex", justifyContent:"space-between", padding:"12px 16px", marginTop:8 }}>
              <button style={{ all:"unset", cursor:"pointer", color:"#1a7cb5", fontSize:20, lineHeight:1, padding:"4px 8px" }}
                onClick={()=>toast.info("Previous period")}>‹</button>
              <button style={{ all:"unset", cursor:"pointer", color:"#1a7cb5", fontSize:20, lineHeight:1, padding:"4px 8px" }}
                onClick={()=>toast.info("Next period")}>›</button>
            </div>
          </>
        )}

        
        {activeTab === "audit" && (
          <>
            {/* Report title */}
            <div style={{ margin:"24px 16px 0", textAlign:"center" }}>
              <p style={{ fontSize:16, fontWeight:700, color:"#1a1a1a", margin:"0 0 2px" }}>Sales Tax Audit Report</p>
              <p style={{ fontSize:13, color:"#555", margin:"0 0 2px" }}>Test</p>
              <p style={{ fontSize:13, color:"#555", margin:0 }}>{periodLabel}</p>
            </div>

            {/* Search */}
            <div className="str-no-print" style={{ padding:"16px 16px 0", display:"flex", justifyContent:"flex-end" }}>
              <input
                value={auditSearch}
                onChange={e=>setAuditSearch(e.target.value)}
                placeholder="Search transactions…"
                style={{ padding:"5px 10px", border:"1px solid #bbb", borderRadius:3, fontSize:12, width:200, outline:"none", color:"#333" }}/>
              {auditSearch && (
                <button onClick={()=>setAuditSearch("")}
                  style={{ all:"unset", cursor:"pointer", color:"#aaa", marginLeft:4, fontSize:16, lineHeight:1 }}>×</button>
              )}
            </div>

            {/* Audit table */}
            <div style={{ margin:"12px 16px 0", overflowX:"auto" }}>
              <table className="str-audit-table">
                <thead>
                  <tr style={{ background:"#f0f0f0", borderBottom:"1px solid #ccc" }}>
                    {["Date","Account","Reference","Details","Gross","Tax","Net"].map((col, i) => (
                      <th key={col}
                        style={{
                          padding:"8px 10px", fontSize:12, fontWeight:700, color:"#444",
                          background:"#f0f0f0", borderBottom:"1px solid #ccc",
                          whiteSpace:"nowrap",
                          textAlign: i >= 4 ? "right" : "left",
                        }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAudit.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding:"48px 24px", textAlign:"center", color:"#aaa", fontSize:13 }}>
                        No transactions found for this period.
                      </td>
                    </tr>
                  ) : filteredAudit.map((row, i) => (
                    <tr key={i} style={{ borderBottom:"1px solid #eee", background: i%2===0?"#fff":"#fafafa" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#f0f8fd"}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#fafafa"}>
                      <td style={{ padding:"8px 10px", fontSize:13, color:"#555", whiteSpace:"nowrap" }}>{fmtDate(row.date)}</td>
                      <td style={{ padding:"8px 10px", fontSize:13 }}>
                        <button style={{ all:"unset", color:"#1a7cb5", cursor:"pointer", fontWeight:600 }}
                          onClick={()=>toast.info(`Opening account: ${row.account}`)}>
                          {row.account}
                        </button>
                      </td>
                      <td style={{ padding:"8px 10px", fontSize:13 }}>
                        <button style={{ all:"unset", color:"#1a7cb5", cursor:"pointer", fontWeight:600 }}
                          onClick={()=>toast.info(`Opening: ${row.ref}`)}>
                          {row.ref}
                        </button>
                      </td>
                      <td style={{ padding:"8px 10px", fontSize:13, color:"#333" }}>{row.details}</td>
                      <td style={{ padding:"8px 10px", fontSize:13, textAlign:"right", whiteSpace:"nowrap",
                        color: row.gross.startsWith("-")?"#dc2626":"#333", fontWeight:600 }}>{row.gross}</td>
                      <td style={{ padding:"8px 10px", fontSize:13, textAlign:"right", whiteSpace:"nowrap",
                        color: row.tax.startsWith("-")?"#dc2626":"#1a7cb5", fontWeight:600 }}>{row.tax}</td>
                      <td style={{ padding:"8px 10px", fontSize:13, textAlign:"right", whiteSpace:"nowrap",
                        color: row.net.startsWith("-")?"#dc2626":"#333", fontWeight:600 }}>{row.net}</td>
                    </tr>
                  ))}
                </tbody>
                {filteredAudit.length > 0 && (
                  <tfoot>
                    <tr style={{ background:"#f0f0f0", borderTop:"2px solid #ccc" }}>
                      <td colSpan={4} style={{ padding:"7px 10px", fontSize:13, fontWeight:700 }}>Total</td>
                      <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700 }}>
                        {filteredAudit.reduce((s,r)=>s+(parseFloat(r.gross.replace(/,/g,""))||0),0).toLocaleString("en-US",{minimumFractionDigits:2})}
                      </td>
                      <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700, color:"#1a7cb5" }}>
                        {filteredAudit.reduce((s,r)=>s+(parseFloat(r.tax.replace(/,/g,""))||0),0).toLocaleString("en-US",{minimumFractionDigits:2})}
                      </td>
                      <td style={{ padding:"7px 10px", fontSize:13, textAlign:"right", fontWeight:700 }}>
                        {filteredAudit.reduce((s,r)=>s+(parseFloat(r.net.replace(/,/g,""))||0),0).toLocaleString("en-US",{minimumFractionDigits:2})}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination arrows */}
            <div className="str-no-print" style={{ display:"flex", justifyContent:"space-between", padding:"12px 16px", marginTop:8 }}>
              <button style={{ all:"unset", cursor:"pointer", color:"#1a7cb5", fontSize:20, lineHeight:1, padding:"4px 8px" }}
                onClick={()=>toast.info("Previous period")}>‹</button>
              <button style={{ all:"unset", cursor:"pointer", color:"#1a7cb5", fontSize:20, lineHeight:1, padding:"4px 8px" }}
                onClick={()=>toast.info("Next period")}>›</button>
            </div>
          </>
        )}
      </div>

     
      <div className="str-no-print"
        style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:50,
          background:"#dbeafe", borderTop:"1px solid #bfdbfe",
          padding:"10px 16px", display:"flex", alignItems:"center",
          justifyContent:"flex-end", gap:8, flexWrap:"wrap",
          boxShadow:"0 -2px 8px rgba(0,0,0,.07)",
        }}>

        {/* Spacer on left for pagination visual */}
        <div style={{ flex:1 }}/>

        {/* Publish */}
        <Button onClick={doPublish}
          style={{ background:"#22c55e", color:"#fff", fontSize:13, fontWeight:700, height:32, padding:"0 18px", borderRadius:4, border:"1px solid #16a34a" }}
          className="hover:bg-[#16a34a]">
          Publish
        </Button>

        {/* Print */}
        <Button onClick={doPrint} variant="outline"
          style={{ background:"#fff", color:"#1a7cb5", fontSize:13, fontWeight:700, height:32, padding:"0 18px", borderRadius:4, border:"1px solid #1a7cb5" }}
          className="hover:bg-blue-50">
          Print
        </Button>

        {/* Export split button */}
        <div style={{ display:"flex" }}>
          <Button
            onClick={()=>doExport("PDF")}
            style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700, height:32, padding:"0 14px", borderRadius:"4px 0 0 4px", borderRight:"1px solid rgba(255,255,255,.3)" }}
            className="hover:bg-[#155f8d]">
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                style={{ background:"#1a7cb5", color:"#fff", height:32, padding:"0 8px", borderRadius:"0 4px 4px 0", minWidth:28 }}
                className="hover:bg-[#155f8d]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ minWidth:160 }}>
              {["PDF","Google Sheets","CSV","Excel"].map(fmt=>(
                <DropdownMenuItem key={fmt} onClick={()=>doExport(fmt)}
                  style={{ fontSize:13, cursor:"pointer", padding:"8px 14px" }}>
                  Export as {fmt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
