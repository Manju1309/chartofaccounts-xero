import { useState, useMemo, useRef, useEffect } from "react";
import { Button }      from "@/components/ui/button";
import { Input }       from "@/components/ui/input";
import { ScrollArea }  from "@/components/ui/scroll-area";
import { toast }       from "sonner";

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE_BILLS = [
  { id:"BILL-001", supplier:"Office Depot",      date:"05 Apr 2026", due:"19 Apr 2026", planned:"",           amount:1240.00,  amountDue:1240.00,  status:"Awaiting Payment", ref:"PO-0011" },
  { id:"BILL-002", supplier:"AWS",               date:"01 Apr 2026", due:"15 Apr 2026", planned:"12 Apr 2026",amount:3800.00,  amountDue:3800.00,  status:"Awaiting Approval",ref:"" },
  { id:"BILL-003", supplier:"Telstra",           date:"28 Mar 2026", due:"11 Apr 2026", planned:"",           amount:420.00,   amountDue:0.00,     status:"Paid",             ref:"INV-5501" },
  { id:"BILL-004", supplier:"WeWork",            date:"01 Mar 2026", due:"01 Apr 2026", planned:"",           amount:8500.00,  amountDue:8500.00,  status:"Overdue",          ref:"" },
  { id:"BILL-005", supplier:"Adobe Systems",     date:"15 Mar 2026", due:"29 Mar 2026", planned:"",           amount:624.00,   amountDue:0.00,     status:"Paid",             ref:"ADO-9923" },
  { id:"BILL-006", supplier:"Google Workspace",  date:"10 Mar 2026", due:"24 Mar 2026", planned:"",           amount:360.00,   amountDue:360.00,   status:"Awaiting Payment", ref:"" },
  { id:"BILL-007", supplier:"FedEx",             date:"20 Mar 2026", due:"03 Apr 2026", planned:"05 Apr 2026",amount:185.50,   amountDue:185.50,   status:"Awaiting Payment", ref:"FDX-0042" },
  { id:"BILL-008", supplier:"Legal & Co",        date:"18 Feb 2026", due:"04 Mar 2026", planned:"",           amount:4200.00,  amountDue:4200.00,  status:"Overdue",          ref:"" },
  { id:"BILL-009", supplier:"Cleaning Pro",      date:"01 Apr 2026", due:"15 Apr 2026", planned:"",           amount:550.00,   amountDue:550.00,   status:"Draft",            ref:"" },
  { id:"BILL-010", supplier:"Dell Technologies", date:"22 Mar 2026", due:"05 Apr 2026", planned:"",           amount:12400.00, amountDue:12400.00, status:"Repeating",        ref:"DELL-881" },
];

const BILL_TABS = ["All", "Draft", "Awaiting Approval", "Awaiting Payment", "Overdue", "Paid", "Repeating"];

function StatusBadge({ status }) {
  const map = {
    "Draft":              { bg:"#f3f4f6", color:"#6b7280", border:"#e5e7eb" },
    "Awaiting Approval":  { bg:"#fef9c3", color:"#92400e", border:"#fde68a" },
    "Awaiting Payment":   { bg:"#dbeafe", color:"#1e40af", border:"#bfdbfe" },
    "Overdue":            { bg:"#fee2e2", color:"#991b1b", border:"#fecaca" },
    "Paid":               { bg:"#d1fae5", color:"#065f46", border:"#a7f3d0" },
    "Repeating":          { bg:"#ede9fe", color:"#5b21b6", border:"#ddd6fe" },
  };
  const s = map[status] || { bg:"#f3f4f6", color:"#555", border:"#ddd" };
  return (
    <span style={{
      fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:4,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      whiteSpace:"nowrap", display:"inline-block",
    }}>{status}</span>
  );
}

function ChevronDown({ size=11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  );
}

function fmt(v) {
  return v.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
}

// ─── New Bill split-button dropdown ──────────────────────────────────────────
function NewBillDropdown({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const options = [
    { label:"New Bill",             page:"new-bill" },
    { label:"New Repeating Bill",   page:"new-repeating-bill" },
    { label:"New Credit Note",      page:"new-bill-credit-note" },
    { label:"Upload Bill",          page:"upload-bill" },
    { label:"Import from CSV",      page:"import-bills-csv" },
  ];

  return (
    <div ref={ref} style={{ position:"relative", display:"flex" }}>
      <Button
        onClick={() => onNavigate("new-bill")}
        style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700,
          height:32, padding:"0 12px", borderRadius:"4px 0 0 4px",
          borderRight:"1px solid rgba(255,255,255,.3)" }}
        className="hover:bg-[#155f8d]"
      >
        New Bill
      </Button>
      <Button
        onClick={() => setOpen(o=>!o)}
        style={{ background:"#1a7cb5", color:"#fff", height:32, padding:"0 9px",
          borderRadius:"0 4px 4px 0", minWidth:28, display:"flex", alignItems:"center" }}
        className="hover:bg-[#155f8d]"
      >
        <ChevronDown size={10} />
      </Button>

      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 3px)", left:0, zIndex:1000,
          background:"#fff", border:"1px solid #e0e0e0", borderRadius:6,
          boxShadow:"0 8px 28px rgba(0,0,0,.14)", minWidth:220,
          animation:"ddFadeIn .15s ease",
        }}>
          {options.map((opt, i) => (
            <button key={i}
              onClick={() => { setOpen(false); onNavigate(opt.page); }}
              style={{
                display:"flex", alignItems:"center", width:"100%",
                textAlign:"left", padding:"10px 16px", fontSize:13,
                border:"none", background:"none", cursor:"pointer",
                color:"#1a1a1a", fontFamily:"inherit",
                borderBottom: i < options.length-1 ? "1px solid #f3f4f6" : "none",
              }}
              onMouseEnter={e=>e.currentTarget.style.background="#f5fafd"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Batch actions bar ────────────────────────────────────────────────────────
function BatchBar({ count, onApprove, onVoid, onDelete }) {
  if (count === 0) return null;
  return (
    <div style={{
      background:"#1a7cb5", color:"#fff", padding:"8px 16px",
      display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
      fontSize:13,
    }}>
      <span style={{ fontWeight:600 }}>{count} bill{count>1?"s":""} selected</span>
      <div style={{ width:1, height:18, background:"rgba(255,255,255,.3)" }}/>
      {[
        { label:"Approve", fn:onApprove },
        { label:"Void",    fn:onVoid },
        { label:"Delete",  fn:onDelete },
      ].map(btn => (
        <button key={btn.label} onClick={btn.fn}
          style={{ background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.3)",
            color:"#fff", padding:"4px 12px", borderRadius:4, fontSize:12, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit" }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.25)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.15)"}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function BillsPage({ onNavigate }) {
  const [activeTab,   setActiveTab]   = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [sortBy,      setSortBy]      = useState("date");
  const [sortDir,     setSortDir]     = useState("desc");

  const tabCounts = useMemo(() => {
    const c = {};
    BILL_TABS.forEach(t => {
      c[t] = t==="All" ? SAMPLE_BILLS.length : SAMPLE_BILLS.filter(b=>b.status===t).length;
    });
    return c;
  }, []);

  const filtered = useMemo(() => {
    let list = activeTab==="All" ? SAMPLE_BILLS : SAMPLE_BILLS.filter(b=>b.status===activeTab);
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      list = list.filter(b =>
        b.supplier.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.ref.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a,b) => {
      let va = a[sortBy]||"", vb = b[sortBy]||"";
      if (sortBy==="amount"||sortBy==="amountDue") return sortDir==="asc" ? va-vb : vb-va;
      return sortDir==="asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [activeTab, searchInput, sortBy, sortDir]);

  const allCk  = filtered.length>0 && filtered.every(b=>selectedIds.includes(b.id));
  const partCk = filtered.some(b=>selectedIds.includes(b.id)) && !allCk;
  const toggleAll = () => allCk
    ? setSelectedIds(p=>p.filter(id=>!filtered.map(b=>b.id).includes(id)))
    : setSelectedIds(p=>[...new Set([...p,...filtered.map(b=>b.id)])]);
  const toggleOne = id => setSelectedIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const sortCol = col => {
    if (sortBy===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const SortArrow = ({ col }) => (
    <span style={{ marginLeft:4, fontSize:9, color: sortBy===col?"#1a7cb5":"#ccc" }}>
      {sortBy===col ? (sortDir==="asc"?"▲":"▼") : "▲▼"}
    </span>
  );

  const totalAmount    = filtered.reduce((s,b)=>s+b.amount,0);
  const totalAmountDue = filtered.reduce((s,b)=>s+b.amountDue,0);

  const thSt = (right=false) => ({
    padding:"9px 12px", fontSize:12, fontWeight:700, color:"#1a7cb5",
    background:"#eaf4fb", borderBottom:"2px solid #c6dff0",
    whiteSpace:"nowrap", cursor:"pointer", userSelect:"none",
    textAlign: right?"right":"left",
  });
  const tdSt = { padding:"10px 12px", fontSize:13, borderBottom:"1px solid #f0f0f0", verticalAlign:"middle" };

  return (
    <div style={{ fontFamily:"Arial,Helvetica,sans-serif", background:"#fff",
      minHeight:"calc(100vh - 48px)", color:"#333", fontSize:13 }}>
      <style>{`
        @keyframes ddFadeIn { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
        .bills-tab-scroll::-webkit-scrollbar{display:none}
        .bill-row-hover:hover td{background:#f8fafc!important}
        @media(max-width:768px){
          .bills-hide-md{display:none!important}
          .bills-btn-group{flex-wrap:wrap!important}
        }
        @media(max-width:520px){
          .bills-hide-sm{display:none!important}
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ padding:"14px 16px 0", background:"#fff", borderBottom:"1px solid #e0e0e0" }}>
        <p style={{ fontSize:12, color:"#888", margin:"0 0 3px" }}>
          <span style={{ color:"#1a7cb5", cursor:"pointer" }}
            onClick={()=>onNavigate("purchases-overview")}>Purchases overview</span>
          <span style={{ margin:"0 5px", color:"#ccc" }}>›</span>
        </p>
        <h1 style={{ margin:"0 0 14px", fontSize:22, fontWeight:700, color:"#1a1a1a", letterSpacing:"-0.02em" }}>
          Bills
        </h1>

        {/* Action buttons */}
        <div className="bills-btn-group"
          style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14, alignItems:"center" }}>
          <NewBillDropdown onNavigate={onNavigate}/>

          <Button variant="outline" onClick={()=>onNavigate("upload-bill")}
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px",
              borderRadius:4, borderColor:"#bbb", color:"#444" }}
            className="hover:bg-gray-50 bills-hide-md">
            Upload Bill
          </Button>

          <Button variant="outline" onClick={()=>onNavigate("import-bills-csv")}
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px",
              borderRadius:4, borderColor:"#bbb", color:"#444" }}
            className="hover:bg-gray-50 bills-hide-md">
            Import
          </Button>

          <Button variant="outline"
            onClick={()=>{ const csv=[["ID","Supplier","Date","Due","Amount","Status"],...filtered.map(b=>[b.id,b.supplier,b.date,b.due,b.amount,b.status])].map(r=>r.join(",")).join("\n"); const a=document.createElement("a");a.href="data:text/csv,"+encodeURIComponent(csv);a.download="bills.csv";a.click(); toast.success("✓ Exported."); }}
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px",
              borderRadius:4, borderColor:"#bbb", color:"#444" }}
            className="hover:bg-gray-50">
            Export
          </Button>
        </div>

        {/* Summary tiles — Xero style */}
        <div style={{ display:"flex", gap:0, marginBottom:0, overflowX:"auto", scrollbarWidth:"none" }}>
          {[
            { label:"Draft",             value: SAMPLE_BILLS.filter(b=>b.status==="Draft").reduce((s,b)=>s+b.amountDue,0),           color:"#6b7280", tab:"Draft" },
            { label:"Awaiting Approval", value: SAMPLE_BILLS.filter(b=>b.status==="Awaiting Approval").reduce((s,b)=>s+b.amountDue,0), color:"#92400e", tab:"Awaiting Approval" },
            { label:"Awaiting Payment",  value: SAMPLE_BILLS.filter(b=>b.status==="Awaiting Payment").reduce((s,b)=>s+b.amountDue,0),  color:"#1e40af", tab:"Awaiting Payment" },
            { label:"Overdue",           value: SAMPLE_BILLS.filter(b=>b.status==="Overdue").reduce((s,b)=>s+b.amountDue,0),           color:"#991b1b", tab:"Overdue" },
          ].map(tile => (
            <button key={tile.tab} onClick={()=>setActiveTab(tile.tab)}
              style={{
                flex:"1 1 120px", minWidth:120, padding:"10px 12px",
                background: activeTab===tile.tab?"#f0f7ff":"#fafafa",
                border:"none", borderRight:"1px solid #e5e7eb",
                borderBottom: activeTab===tile.tab?"3px solid #1a7cb5":"3px solid transparent",
                cursor:"pointer", textAlign:"left", transition:"background .12s",
              }}
              onMouseEnter={e=>{ if(activeTab!==tile.tab) e.currentTarget.style.background="#f5fafd"; }}
              onMouseLeave={e=>{ if(activeTab!==tile.tab) e.currentTarget.style.background="#fafafa"; }}
            >
              <div style={{ fontSize:11, color:"#888", fontWeight:500, marginBottom:3 }}>{tile.label}</div>
              <div style={{ fontSize:15, fontWeight:700, color:tile.color }}>
                ${fmt(tile.value)}
              </div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="bills-tab-scroll"
          style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none", marginTop:0 }}>
          {BILL_TABS.map(tab => {
            const cnt = tabCounts[tab]||0;
            const isActive = activeTab===tab;
            return (
              <button key={tab}
                onClick={()=>{ setActiveTab(tab); setSelectedIds([]); }}
                style={{
                  background:"none", border:"none", padding:"9px 14px", fontSize:13,
                  fontWeight:isActive?700:400, cursor:"pointer",
                  color:isActive?"#1a7cb5":"#555",
                  borderBottom:isActive?"3px solid #1a7cb5":"3px solid transparent",
                  whiteSpace:"nowrap", flexShrink:0,
                  display:"flex", alignItems:"center", gap:5,
                }}
              >
                {tab}
                {tab!=="All" && tab!=="Paid" && tab!=="Repeating" && cnt>0 && (
                  <span style={{ fontSize:11, color:"#999", fontWeight:400 }}>({cnt})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch actions */}
      <BatchBar
        count={selectedIds.length}
        onApprove={()=>{ toast.success(`✓ ${selectedIds.length} bill(s) approved.`); setSelectedIds([]); }}
        onVoid={()=>{ toast.success(`✓ ${selectedIds.length} bill(s) voided.`); setSelectedIds([]); }}
        onDelete={()=>{ toast.success(`✓ ${selectedIds.length} bill(s) deleted.`); setSelectedIds([]); }}
      />

      {/* Search + table wrapper */}
      <ScrollArea style={{ height:"calc(100vh - 330px)", minHeight:300 }}>
        {/* Search bar */}
        <div style={{ padding:"10px 16px", display:"flex", alignItems:"center",
          justifyContent:"space-between", gap:8, flexWrap:"wrap",
          background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>
          <span style={{ fontSize:12, color:"#888" }}>
            {filtered.length} bill{filtered.length!==1?"s":""}
            {selectedIds.length>0 && (
              <span style={{ marginLeft:8, color:"#1a7cb5", fontWeight:600 }}>
                · {selectedIds.length} selected
              </span>
            )}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
              placeholder="Search bills…"
              style={{ height:32, fontSize:13, width:220, borderRadius:4, borderColor:"#d1d5db" }}
            />
            {searchInput && (
              <button onClick={()=>setSearchInput("")}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"#888", fontSize:16, padding:"0 2px" }}>✕</button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ padding:"0 16px 32px" }}>
          <div style={{ border:"1px solid #c6dff0", borderTop:"none",
            borderRadius:"0 0 6px 6px", overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:640 }}>
              <thead>
                <tr>
                  <th style={{ ...thSt(), width:40, cursor:"default" }}>
                    <input type="checkbox" checked={allCk}
                      ref={el=>{if(el)el.indeterminate=partCk;}}
                      onChange={toggleAll}
                      style={{ width:14, height:14, accentColor:"#1a7cb5", cursor:"pointer" }}/>
                  </th>
                  <th style={thSt()} onClick={()=>sortCol("date")}>
                    Date<SortArrow col="date"/>
                  </th>
                  <th style={thSt()} onClick={()=>sortCol("id")} className="bills-hide-sm">
                    Bill No.<SortArrow col="id"/>
                  </th>
                  <th style={thSt()} onClick={()=>sortCol("ref")} className="bills-hide-md">
                    Reference<SortArrow col="ref"/>
                  </th>
                  <th style={thSt()} onClick={()=>sortCol("supplier")}>
                    Supplier<SortArrow col="supplier"/>
                  </th>
                  <th style={thSt()} onClick={()=>sortCol("due")} className="bills-hide-sm">
                    Due Date<SortArrow col="due"/>
                  </th>
                  <th style={thSt()} onClick={()=>sortCol("planned")} className="bills-hide-md">
                    Planned Date<SortArrow col="planned"/>
                  </th>
                  <th style={{ ...thSt(true) }} onClick={()=>sortCol("amount")} className="bills-hide-sm">
                    Amount<SortArrow col="amount"/>
                  </th>
                  <th style={{ ...thSt(true) }} onClick={()=>sortCol("amountDue")}>
                    Amount Due<SortArrow col="amountDue"/>
                  </th>
                  <th style={thSt()}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr>
                    <td colSpan={10}
                      style={{ padding:"56px 24px", textAlign:"center",
                        color:"#aaa", fontSize:13 }}>
                      There are no items to display.{" "}
                      {activeTab!=="All" && (
                        <button onClick={()=>setActiveTab("All")}
                          style={{ color:"#1a7cb5", background:"none", border:"none",
                            cursor:"pointer", fontSize:13, fontWeight:600 }}>
                          View all bills
                        </button>
                      )}
                    </td>
                  </tr>
                ) : filtered.map(bill => (
                  <tr key={bill.id} className="bill-row-hover"
                    style={{ background:selectedIds.includes(bill.id)?"#f0f7ff":"#fff" }}>
                    <td style={{ ...tdSt, width:40 }}>
                      <input type="checkbox" checked={selectedIds.includes(bill.id)}
                        onChange={()=>toggleOne(bill.id)}
                        style={{ width:14, height:14, accentColor:"#1a7cb5", cursor:"pointer" }}/>
                    </td>
                    <td style={{ ...tdSt, color:"#555", whiteSpace:"nowrap" }}>{bill.date}</td>
                    <td style={{ ...tdSt }} className="bills-hide-sm">
                      <button style={{ color:"#1a7cb5", fontWeight:700, background:"none",
                        border:"none", padding:0, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}
                        onClick={()=>onNavigate("new-bill")}>
                        {bill.id}
                      </button>
                    </td>
                    <td style={{ ...tdSt, color:"#555" }} className="bills-hide-md">
                      {bill.ref||"—"}
                    </td>
                    <td style={tdSt}>
                      <button style={{ color:"#1a7cb5", fontWeight:600, background:"none",
                        border:"none", padding:0, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}
                        onClick={()=>toast.info(`Opening supplier: ${bill.supplier}`)}>
                        {bill.supplier}
                      </button>
                    </td>
                    <td style={{ ...tdSt, color: bill.status==="Overdue"?"#dc2626":"#555",
                      whiteSpace:"nowrap" }} className="bills-hide-sm">
                      {bill.due}
                      {bill.status==="Overdue" && (
                        <span style={{ marginLeft:6, fontSize:10, fontWeight:700,
                          color:"#dc2626" }}>OVERDUE</span>
                      )}
                    </td>
                    <td style={{ ...tdSt, color:"#555" }} className="bills-hide-md">
                      {bill.planned ? (
                        <button style={{ color:"#1a7cb5", background:"none", border:"none",
                          cursor:"pointer", fontSize:13, fontFamily:"inherit", padding:0 }}
                          onClick={()=>toast.info("Edit planned date")}>
                          {bill.planned}
                        </button>
                      ) : (
                        <button style={{ color:"#aaa", background:"none", border:"none",
                          cursor:"pointer", fontSize:12, fontFamily:"inherit", padding:0 }}
                          onClick={()=>toast.info("Set planned date")}>
                          + Set date
                        </button>
                      )}
                    </td>
                    <td style={{ ...tdSt, textAlign:"right", color:"#1a1a1a",
                      fontWeight:500, whiteSpace:"nowrap" }} className="bills-hide-sm">
                      ${fmt(bill.amount)}
                    </td>
                    <td style={{ ...tdSt, textAlign:"right", fontWeight:700,
                      color: bill.amountDue>0?"#1a7cb5":"#6b7280", whiteSpace:"nowrap" }}>
                      ${fmt(bill.amountDue)}
                    </td>
                    <td style={tdSt}>
                      <StatusBadge status={bill.status}/>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Totals row */}
              {filtered.length>0 && (
                <tfoot>
                  <tr style={{ background:"#f9fafb" }}>
                    <td colSpan={7} style={{ padding:"9px 12px", fontSize:12,
                      fontWeight:700, color:"#374151",
                      borderTop:"2px solid #d1d5db" }}/>
                    <td style={{ padding:"9px 12px", fontSize:13, fontWeight:700,
                      textAlign:"right", borderTop:"2px solid #d1d5db",
                      color:"#1a1a1a", whiteSpace:"nowrap" }}
                      className="bills-hide-sm">
                      ${fmt(totalAmount)}
                    </td>
                    <td style={{ padding:"9px 12px", fontSize:13, fontWeight:700,
                      textAlign:"right", borderTop:"2px solid #d1d5db",
                      color:"#1a7cb5", whiteSpace:"nowrap" }}>
                      ${fmt(totalAmountDue)}
                    </td>
                    <td style={{ borderTop:"2px solid #d1d5db" }}/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Count summary */}
          {filtered.length>0 && (
            <div style={{ display:"flex", justifyContent:"space-between",
              padding:"8px 2px", flexWrap:"wrap", gap:8 }}>
              <span style={{ fontSize:12, color:"#888" }}>
                Showing <strong style={{ color:"#444" }}>{filtered.length}</strong> bill{filtered.length!==1?"s":""}
              </span>
              <span style={{ fontSize:12, color:"#888" }}>
                Total due: <strong style={{ color:"#1a7cb5" }}>${fmt(totalAmountDue)}</strong>
              </span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
