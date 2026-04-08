import { useState, useRef, useEffect } from "react";
import { Button }   from "@/components/ui/button";
import { Switch }   from "@/components/ui/switch";
import { Label }    from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast }    from "sonner";

// ─── Static sample data (mirrors Xero account structure) ─────────────────────
const ACCOUNT_DATA = [
  { code:"090", name:"Bank Account",             type:"Bank",               debit:12500.00, credit:0,        compare:8200.00  },
  { code:"091", name:"Business Savings",         type:"Bank",               debit:5000.00,  credit:0,        compare:5000.00  },
  { code:"100", name:"Accounts Receivable",      type:"Current Assets",     debit:18750.00, credit:0,        compare:14200.00 },
  { code:"130", name:"Inventory",                type:"Inventory",          debit:3200.00,  credit:0,        compare:2800.00  },
  { code:"150", name:"Office Equipment",         type:"Fixed Assets",       debit:8500.00,  credit:0,        compare:8500.00  },
  { code:"170", name:"Accumulated Depreciation", type:"Depreciation",       debit:0,        credit:1700.00,  compare:-1200.00 },
  { code:"200", name:"Sales",                    type:"Revenue",            debit:0,        credit:48200.00, compare:-39800.00},
  { code:"260", name:"Other Revenue",            type:"Revenue",            debit:0,        credit:1200.00,  compare:-900.00  },
  { code:"310", name:"Cost of Goods Sold",       type:"Direct Costs",       debit:22100.00, credit:0,        compare:18500.00 },
  { code:"400", name:"Advertising",              type:"Expense",            debit:1400.00,  credit:0,        compare:1100.00  },
  { code:"404", name:"Bank Fees",                type:"Expense",            debit:240.00,   credit:0,        compare:190.00   },
  { code:"412", name:"Consulting & Accounting",  type:"Expense",            debit:3200.00,  credit:0,        compare:2800.00  },
  { code:"416", name:"Depreciation",             type:"Expense",            debit:500.00,   credit:0,        compare:400.00   },
  { code:"432", name:"Insurance",                type:"Expense",            debit:1800.00,  credit:0,        compare:1600.00  },
  { code:"452", name:"Office Expenses",          type:"Expense",            debit:620.00,   credit:0,        compare:540.00   },
  { code:"464", name:"Rent",                     type:"Expense",            debit:12000.00, credit:0,        compare:12000.00 },
  { code:"472", name:"Salaries",                 type:"Expense",            debit:28000.00, credit:0,        compare:24000.00 },
  { code:"480", name:"Telephone & Internet",     type:"Expense",            debit:840.00,   credit:0,        compare:720.00   },
  { code:"800", name:"Accounts Payable",         type:"Current Liability",  debit:0,        credit:9400.00,  compare:-7200.00 },
  { code:"810", name:"GST",                      type:"Current Liability",  debit:0,        credit:2100.00,  compare:-1800.00 },
  { code:"820", name:"Income Tax Payable",       type:"Current Liability",  debit:0,        credit:4200.00,  compare:-3500.00 },
  { code:"840", name:"Term Loan",                type:"Non-current Liability",debit:0,      credit:15000.00, compare:-15000.00},
  { code:"900", name:"Retained Earnings",        type:"Equity",             debit:0,        credit:36050.00, compare:-29650.00},
  { code:"910", name:"Owner A Drawings",         type:"Equity",             debit:2500.00,  credit:0,        compare:2000.00  },
];

// Column sets
const ALL_COLUMNS = [
  { key:"debit",   label:"Debit - Year to date"  },
  { key:"credit",  label:"Credit - Year to date" },
  { key:"compare", label:"31 Dec 2024"            },
];

const COMPARE_OPTIONS = [
  "Compare with 1 year",
  "Compare with 2 years",
  "Compare with 3 years",
  "No comparison",
];

const GROUPING_OPTIONS = [
  "None",
  "Account Type",
  "Tax Rate",
];

const DATE_PRESETS = [
  "End of last financial year",
  "End of last month",
  "End of last quarter",
  "Today",
  "Custom",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(v) {
  if (v === 0) return "-";
  const abs = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `(${abs})` : abs;
}

function ChevronDown({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ─── Custom dropdown (no Radix, so it doesn't interfere with layout) ─────────
function NativeDropdown({ label, value, options, onChange, width = 200 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, minWidth: width }}>
      {label && (
        <span style={{ fontSize:11, color:"#666", fontWeight:500 }}>{label}</span>
      )}
      <div style={{ position:"relative" }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            appearance:"none", width:"100%", height:36,
            border:"1px solid #d1d5db", borderRadius:6,
            padding:"0 32px 0 10px", fontSize:13, color:"#1a1a1a",
            background:"#fff", cursor:"pointer", outline:"none",
            fontFamily:"inherit",
          }}
          onFocus={e => { e.target.style.borderColor = "#1a7cb5"; e.target.style.boxShadow = "0 0 0 2px rgba(26,124,181,.15)"; }}
          onBlur={e  => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#666" }}>
          <ChevronDown size={12} />
        </span>
      </div>
    </div>
  );
}

// ─── Columns multi-select dropdown ──────────────────────────────────────────
function ColumnsDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = key => {
    onChange(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const label = selected.length === ALL_COLUMNS.length
    ? `${selected.length} columns selected`
    : selected.length === 0
      ? "No columns"
      : `${selected.length} column${selected.length > 1 ? "s" : ""} selected`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, minWidth:190 }} ref={ref}>
      <span style={{ fontSize:11, color:"#666", fontWeight:500 }}>Columns</span>
      <div style={{ position:"relative" }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width:"100%", height:36, border:"1px solid #d1d5db",
            borderRadius:6, padding:"0 32px 0 10px", fontSize:13,
            color:"#1a1a1a", background:"#fff", cursor:"pointer",
            textAlign:"left", outline:"none", fontFamily:"inherit",
            borderColor: open ? "#1a7cb5" : "#d1d5db",
            boxShadow: open ? "0 0 0 2px rgba(26,124,181,.15)" : "none",
            transition:"border-color .15s, box-shadow .15s",
          }}
        >
          {label}
        </button>
        <span style={{ position:"absolute", right:9, top:"50%", transform:`translateY(-50%) rotate(${open?"180deg":"0deg"})`, pointerEvents:"none", color:"#666", transition:"transform .18s" }}>
          <ChevronDown size={12} />
        </span>

        {open && (
          <div style={{
            position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:999,
            background:"#fff", border:"1px solid #e0e0e0", borderRadius:8,
            boxShadow:"0 8px 24px rgba(0,0,0,.12)", minWidth:220, padding:"6px 0",
          }}>
            {ALL_COLUMNS.map(col => (
              <label key={col.key}
                style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"8px 14px", cursor:"pointer", fontSize:13,
                  color:"#1a1a1a",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f5fafd"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(col.key)}
                  onChange={() => toggle(col.key)}
                  style={{ width:14, height:14, accentColor:"#1a7cb5", cursor:"pointer", flexShrink:0 }}
                />
                {col.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── More dropdown ────────────────────────────────────────────────────────────
function MoreDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = ["Print", "Export to PDF", "Export to Excel", "Schedule email", "Add to watchlist"];

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          height:36, border:"1px solid #d1d5db", borderRadius:6,
          padding:"0 12px", fontSize:13, color:"#1a1a1a",
          background:"#fff", cursor:"pointer", display:"flex",
          alignItems:"center", gap:6, outline:"none", fontFamily:"inherit",
          borderColor: open ? "#1a7cb5" : "#d1d5db",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
      >
        <span style={{ fontSize:18, lineHeight:1, letterSpacing:1, color:"#444" }}>⋯</span>
        More
      </button>
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 4px)", right:0, zIndex:999,
          background:"#fff", border:"1px solid #e0e0e0", borderRadius:8,
          boxShadow:"0 8px 24px rgba(0,0,0,.12)", minWidth:180, padding:"6px 0",
        }}>
          {items.map((item, i) => (
            <button key={i}
              onClick={() => { setOpen(false); toast.info(`${item} — coming soon.`); }}
              style={{
                display:"block", width:"100%", textAlign:"left",
                padding:"9px 16px", fontSize:13, border:"none",
                background:"none", cursor:"pointer", color:"#1a1a1a",
                borderBottom: i < items.length - 1 ? "1px solid #f5f5f5" : "none",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f5fafd"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Export dropdown ─────────────────────────────────────────────────────────
function ExportDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative", display:"flex" }}>
      <button
        onClick={() => toast.info("Exporting CSV…")}
        style={{
          height:32, border:"1px solid #d1d5db", borderRadius:"6px 0 0 6px",
          padding:"0 12px", fontSize:13, color:"#1a1a1a",
          background:"#fff", cursor:"pointer", outline:"none",
          borderRight:"none", fontFamily:"inherit",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
      >
        Export
      </button>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          height:32, border:"1px solid #d1d5db", borderRadius:"0 6px 6px 0",
          padding:"0 8px", fontSize:13, color:"#1a1a1a",
          background:"#fff", cursor:"pointer", outline:"none", fontFamily:"inherit",
          display:"flex", alignItems:"center",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
      >
        <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{
          position:"absolute", bottom:"calc(100% + 4px)", right:0, zIndex:999,
          background:"#fff", border:"1px solid #e0e0e0", borderRadius:8,
          boxShadow:"0 -8px 24px rgba(0,0,0,.10)", minWidth:160, padding:"6px 0",
        }}>
          {["Export to PDF","Export to Excel","Export to Google Sheets"].map((item, i) => (
            <button key={i}
              onClick={() => { setOpen(false); toast.info(`${item} — coming soon.`); }}
              style={{
                display:"block", width:"100%", textAlign:"left",
                padding:"9px 16px", fontSize:13, border:"none",
                background:"none", cursor:"pointer", color:"#1a1a1a",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f5fafd"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Insert content dropdown ──────────────────────────────────────────────────
function InsertContentDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = ["Text block", "Image", "Page break"];

  return (
    <div ref={ref} style={{ position:"relative", display:"flex" }}>
      <button
        onClick={() => toast.info("Insert content — coming soon.")}
        style={{
          height:32, border:"1px solid #d1d5db", borderRadius:"6px 0 0 6px",
          padding:"0 12px", fontSize:13, color:"#1a1a1a",
          background:"#fff", cursor:"pointer", outline:"none",
          borderRight:"none", fontFamily:"inherit",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
      >
        Insert content
      </button>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          height:32, border:"1px solid #d1d5db", borderRadius:"0 6px 6px 0",
          padding:"0 8px", color:"#1a1a1a",
          background:"#fff", cursor:"pointer", outline:"none", fontFamily:"inherit",
          display:"flex", alignItems:"center",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
      >
        <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{
          position:"absolute", bottom:"calc(100% + 4px)", left:0, zIndex:999,
          background:"#fff", border:"1px solid #e0e0e0", borderRadius:8,
          boxShadow:"0 -8px 24px rgba(0,0,0,.10)", minWidth:160, padding:"6px 0",
        }}>
          {items.map((item, i) => (
            <button key={i}
              onClick={() => { setOpen(false); toast.info(`${item} — coming soon.`); }}
              style={{
                display:"block", width:"100%", textAlign:"left",
                padding:"9px 16px", fontSize:13, border:"none",
                background:"none", cursor:"pointer", color:"#1a1a1a",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f5fafd"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Date dropdown ────────────────────────────────────────────────────────────
function DateDropdown({ dateLabel, setDateLabel, customDate, setCustomDate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const DATE_MAP = {
    "End of last financial year": "31 Dec 2025",
    "End of last month":          "31 Mar 2026",
    "End of last quarter":        "31 Mar 2026",
    "Today":                       new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }),
    "Custom":                      customDate,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }} ref={ref}>
      <span style={{ fontSize:11, color:"#666", fontWeight:500 }}>
        Date: <span style={{ color:"#1a1a1a" }}>{dateLabel}</span>
      </span>
      <div style={{ position:"relative", display:"flex" }}>
        {/* Date value box */}
        <div style={{
          height:36, border:"1px solid #d1d5db", borderRadius:"6px 0 0 6px",
          padding:"0 12px", fontSize:13, color:"#1a1a1a",
          background:"#fff", display:"flex", alignItems:"center",
          minWidth:140, borderRight:"none",
        }}>
          {DATE_MAP[dateLabel] || customDate}
        </div>
        {/* Chevron trigger */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            height:36, border:"1px solid #d1d5db", borderRadius:"0 6px 6px 0",
            padding:"0 10px", background:"#fff", cursor:"pointer",
            display:"flex", alignItems:"center", outline:"none",
            borderColor: open ? "#1a7cb5" : "#d1d5db",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
        >
          <ChevronDown size={12} />
        </button>

        {open && (
          <div style={{
            position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:999,
            background:"#fff", border:"1px solid #e0e0e0", borderRadius:8,
            boxShadow:"0 8px 24px rgba(0,0,0,.12)", minWidth:240, padding:"6px 0",
          }}>
            {DATE_PRESETS.map((preset, i) => (
              <button key={i}
                onClick={() => { setDateLabel(preset); if (preset !== "Custom") setOpen(false); }}
                style={{
                  display:"block", width:"100%", textAlign:"left",
                  padding:"9px 16px", fontSize:13, border:"none",
                  background: dateLabel === preset ? "#f0f7ff" : "none",
                  cursor:"pointer", color:"#1a1a1a", fontWeight: dateLabel===preset?600:400,
                }}
                onMouseEnter={e => { if (dateLabel!==preset) e.currentTarget.style.background="#f5fafd"; }}
                onMouseLeave={e => { if (dateLabel!==preset) e.currentTarget.style.background="none"; }}
              >
                {preset}
                {preset !== "Custom" && (
                  <span style={{ fontSize:11, color:"#999", marginLeft:8 }}>{DATE_MAP[preset]}</span>
                )}
              </button>
            ))}
            {dateLabel === "Custom" && (
              <div style={{ padding:"8px 16px", borderTop:"1px solid #f0f0f0" }}>
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  style={{
                    width:"100%", height:32, border:"1px solid #d1d5db",
                    borderRadius:4, padding:"0 8px", fontSize:13,
                    outline:"none", fontFamily:"inherit",
                  }}
                />
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    marginTop:8, width:"100%", height:30, background:"#1a7cb5",
                    color:"#fff", border:"none", borderRadius:4,
                    fontSize:12, fontWeight:700, cursor:"pointer",
                  }}
                >Apply</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function TrialBalancePage({ onNavigate }) {
  const [dateLabel,    setDateLabel]    = useState("End of last financial year");
  const [customDate,   setCustomDate]   = useState("2025-12-31");
  const [compareWith,  setCompareWith]  = useState("Compare with 1 year");
  const [grouping,     setGrouping]     = useState("None");
  const [selectedCols, setSelectedCols] = useState(["debit","credit","compare"]);
  const [compactView,  setCompactView]  = useState(true);
  const [hasData,      setHasData]      = useState(true);    // toggle to see empty state
  const [isFavourite,  setIsFavourite]  = useState(false);
  const [isUpdating,   setIsUpdating]   = useState(false);

  // ── Derived: which compare column label to show ───────────────────────────
  const compareColLabel = compareWith === "No comparison" ? null : "31 Dec 2024";

  // ── Filtered columns based on selection + compare ─────────────────────────
  const visibleCols = ALL_COLUMNS.filter(c => {
    if (!selectedCols.includes(c.key)) return false;
    if (c.key === "compare" && compareWith === "No comparison") return false;
    return true;
  });

  // ── Grouping ──────────────────────────────────────────────────────────────
  const groupedData = (() => {
    if (!hasData) return [];
    if (grouping === "None") {
      return [{ group: null, rows: ACCOUNT_DATA }];
    }
    // Group by account type
    const groups = {};
    ACCOUNT_DATA.forEach(row => {
      const key = row.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    return Object.entries(groups).map(([g, rows]) => ({ group: g, rows }));
  })();

  // ── Totals ────────────────────────────────────────────────────────────────
  const totals = ACCOUNT_DATA.reduce(
    (acc, r) => ({ debit: acc.debit + r.debit, credit: acc.credit + r.credit, compare: acc.compare + r.compare }),
    { debit: 0, credit: 0, compare: 0 }
  );

  const handleUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 600);
    toast.success("Report updated.");
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const thSt = {
    padding: compactView ? "6px 12px" : "10px 12px",
    fontSize: 12, fontWeight: 600, color: "#374151",
    textAlign: "left", borderBottom: "1px solid #e5e7eb",
    background: "#fff", whiteSpace: "nowrap",
  };
  const tdSt = {
    padding: compactView ? "4px 12px" : "8px 12px",
    fontSize: 13, color: "#1a1a1a",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "top",
  };
  const numTdSt = { ...tdSt, textAlign: "right", fontVariantNumeric: "tabular-nums" };
  const totalThSt = {
    padding: compactView ? "7px 12px" : "11px 12px",
    fontSize: 13, fontWeight: 700, color: "#111",
    borderTop: "2px solid #d1d5db", background: "#f9fafb",
    textAlign: "right", whiteSpace: "nowrap",
  };

  return (
    <div style={{
      fontFamily: "Arial,Helvetica,sans-serif",
      background: "#f3f4f6",
      minHeight: "calc(100vh - 48px)",
      display: "flex", flexDirection: "column",
      fontSize: 13, color: "#333",
    }}>
      <style>{`
        .tb-hide-mobile { }
        @media(max-width:768px) {
          .tb-hide-mobile { display:none !important; }
          .tb-filter-bar  { flex-wrap:wrap !important; }
          .tb-filter-bar > * { flex:1 1 160px !important; }
        }
        .tb-report-card { background:#fff; border-radius:8px; border:1px solid #e5e7eb; overflow:hidden; }
        .tb-th-link { color:#1a7cb5; cursor:pointer; background:none; border:none; padding:0; font-size:12px; font-weight:600; font-family:inherit; }
        .tb-th-link:hover { text-decoration:underline; }
        .tb-row-hover:hover td { background:#f8fafc; }
        .tb-star-btn { background:none; border:none; cursor:pointer; color:#d1d5db; font-size:20px; padding:0; line-height:1; transition:color .15s; }
        .tb-star-btn:hover { color:#f59e0b; }
        .tb-star-btn.active { color:#f59e0b; }
      `}</style>

      {/* ── Sub-header (breadcrumb + title + star) ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "10px 24px 12px", display: "flex",
        alignItems: "flex-start", justifyContent: "space-between",
        gap: 12, flexWrap: "wrap",
      }}>
        <div>
          <p style={{ fontSize: 12, color: "#1a7cb5", margin: "0 0 2px", cursor: "pointer" }}
            onClick={() => onNavigate && onNavigate("reporting")}>
            Reports
          </p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "-0.02em" }}>
            Trial Balance
          </h1>
        </div>
        <button
          className={`tb-star-btn${isFavourite ? " active" : ""}`}
          onClick={() => { setIsFavourite(f => !f); toast.success(isFavourite ? "Removed from watchlist." : "Added to watchlist."); }}
          title={isFavourite ? "Remove from watchlist" : "Add to watchlist"}
        >
          {isFavourite ? "★" : "☆"}
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}>
        <div className="tb-filter-bar" style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          {/* Date */}
          <DateDropdown
            dateLabel={dateLabel} setDateLabel={setDateLabel}
            customDate={customDate} setCustomDate={setCustomDate}
          />

          {/* Columns multi-select */}
          <ColumnsDropdown selected={selectedCols} onChange={setSelectedCols} />

          {/* Compare with */}
          <NativeDropdown
            label="Compare with"
            value={compareWith}
            options={COMPARE_OPTIONS}
            onChange={setCompareWith}
            width={190}
          />

          {/* Grouping */}
          <NativeDropdown
            label="Grouping/Summarising"
            value={grouping}
            options={GROUPING_OPTIONS}
            onChange={setGrouping}
            width={190}
          />

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* More + Update */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <MoreDropdown />
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              style={{
                background: "#1a7cb5", color: "#fff", fontSize: 13,
                fontWeight: 700, height: 36, padding: "0 20px",
                borderRadius: 6,
              }}
              className="hover:bg-[#155f8d]"
            >
              {isUpdating ? "Updating…" : "Update"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Report area ── */}
      <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        <div className="tb-report-card" style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Report title bar */}
          <div style={{
            padding: "16px 20px", display: "flex",
            alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid #e5e7eb", flexWrap: "wrap", gap: 8,
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Trial Balance</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>My Organisation</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>As at 31 December 2025</div>
            </div>
            <button
              onClick={() => toast.info("Reorder columns — coming soon.")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 600, color: "#1a7cb5",
                background: "none", border: "none", cursor: "pointer",
                padding: "4px 8px", borderRadius: 4,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0f7ff"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {/* Column reorder icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18"/><path d="M8 3l4-3 4 3M8 21l4 3 4-3"/>
              </svg>
              Reorder columns
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            {hasData ? (
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
                <thead>
                  <tr>
                    <th style={{ ...thSt, width: 90 }}>Account Code</th>
                    <th style={{ ...thSt }}>
                      <button className="tb-th-link">Account</button>
                    </th>
                    <th style={{ ...thSt }} className="tb-hide-mobile">Account Type</th>
                    {visibleCols.map(col => (
                      <th key={col.key} style={{ ...thSt, textAlign: "right" }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupedData.map(({ group, rows }, gi) => (
                    <>
                      {/* Group header */}
                      {group && (
                        <tr key={`g-${gi}`}>
                          <td colSpan={3 + visibleCols.length} style={{
                            ...tdSt,
                            fontWeight: 700, color: "#111",
                            background: "#f9fafb",
                            padding: compactView ? "5px 12px" : "9px 12px",
                            fontSize: 12, textTransform: "uppercase",
                            letterSpacing: "0.04em", color: "#6b7280",
                          }}>
                            {group}
                          </td>
                        </tr>
                      )}
                      {/* Data rows */}
                      {rows.map((row, ri) => (
                        <tr key={`${gi}-${ri}`} className="tb-row-hover">
                          <td style={{ ...tdSt, color: "#6b7280", fontSize: 12 }}>{row.code}</td>
                          <td style={tdSt}>
                            <button
                              className="tb-th-link"
                              style={{ fontSize: 13, fontWeight: 400 }}
                              onClick={() => toast.info(`Opening account: ${row.name}`)}
                            >
                              {row.name}
                            </button>
                          </td>
                          <td style={{ ...tdSt, color: "#6b7280", fontSize: 12 }} className="tb-hide-mobile">{row.type}</td>
                          {visibleCols.map(col => (
                            <td key={col.key} style={{
                              ...numTdSt,
                              color: row[col.key] < 0 ? "#dc2626" : "#1a1a1a",
                            }}>
                              {fmt(row[col.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {/* Group subtotal */}
                      {group && (
                        <tr key={`gt-${gi}`} style={{ background: "#f9fafb" }}>
                          <td colSpan={3} style={{ ...tdSt, fontWeight: 700, fontSize: 12, color: "#374151", borderTop: "1px solid #e5e7eb" }}>
                            Total {group}
                          </td>
                          {visibleCols.map(col => {
                            const sum = rows.reduce((s, r) => s + r[col.key], 0);
                            return (
                              <td key={col.key} style={{ ...numTdSt, fontWeight: 700, borderTop: "1px solid #e5e7eb", color: sum < 0 ? "#dc2626" : "#1a1a1a" }}>
                                {fmt(sum)}
                              </td>
                            );
                          })}
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
                {/* Grand total footer */}
                <tfoot>
                  <tr style={{ background: "#f9fafb" }}>
                    <td colSpan={3} style={{ ...totalThSt, textAlign: "left" }}>Total</td>
                    {visibleCols.map(col => (
                      <td key={col.key} style={{ ...totalThSt, color: totals[col.key] < 0 ? "#dc2626" : "#111" }}>
                        {fmt(totals[col.key])}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            ) : (
              /* Empty state */
              <div style={{ padding: "80px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 16, color: "#d1d5db" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto", display: "block" }}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
                  </svg>
                </div>
                <p style={{ fontSize: 15, color: "#9ca3af", margin: 0 }}>Nothing to show here</p>
              </div>
            )}
          </div>

          {/* Toggle data for demo */}
          <div style={{ padding: "8px 16px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setHasData(d => !d)}
              style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Toggle empty state (demo)
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          STICKY BOTTOM BAR  (exact Xero layout)
      ══════════════════════════════════════════════════ */}
      <div style={{
        position: "sticky", bottom: 0, zIndex: 100,
        background: "#fff", borderTop: "1px solid #e5e7eb",
        padding: "0 24px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        height: 52, flexShrink: 0,
        boxShadow: "0 -2px 8px rgba(0,0,0,.06)",
      }}>
        {/* Left: Insert content + Compact view */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <InsertContentDropdown />

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />

          {/* Compact view toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Switch
              id="compact-view"
              checked={compactView}
              onCheckedChange={setCompactView}
              style={{ transform: "scale(0.85)" }}
            />
            <Label
              htmlFor="compact-view"
              style={{ fontSize: 13, color: "#374151", cursor: "pointer", userSelect: "none" }}
            >
              Compact view
            </Label>
          </div>
        </div>

        {/* Right: Save as custom + Export */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => toast.success("✓ Saved as custom report.")}
            style={{
              height: 32, border: "1px solid #d1d5db", borderRadius: 6,
              padding: "0 14px", fontSize: 13, color: "#374151",
              background: "#fff", cursor: "pointer", outline: "none",
              fontFamily: "inherit", fontWeight: 500,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            Save as custom
          </button>
          <ExportDropdown />
        </div>
      </div>
    </div>
  );
}
