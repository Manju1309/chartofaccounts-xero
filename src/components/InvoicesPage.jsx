import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { toast }  from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const INVOICE_TABS = ["All", "Draft", "Awaiting Approval", "Awaiting Payment", "Paid", "Repeating"];

const SAMPLE_INVOICES = [
  { id:"INV-001", contact:"Acme Corp",  date:"07 Apr 2026", due:"21 Apr 2026", amount:"$4,500.00", status:"Awaiting Payment", ref:"PO-1234" },
  { id:"INV-002", contact:"Beta LLC",   date:"01 Apr 2026", due:"15 Apr 2026", amount:"$1,200.00", status:"Draft",            ref:"" },
  { id:"INV-003", contact:"Gamma Inc",  date:"28 Mar 2026", due:"11 Apr 2026", amount:"$8,750.00", status:"Paid",             ref:"PO-5678" },
  { id:"INV-004", contact:"Delta Co",   date:"25 Mar 2026", due:"08 Apr 2026", amount:"$320.00",   status:"Awaiting Approval",ref:"" },
  { id:"INV-005", contact:"Echo Ltd",   date:"15 Mar 2026", due:"29 Mar 2026", amount:"$2,100.00", status:"Paid",             ref:"PO-9012" },
];

function StatusBadge({ status }) {
  const map = {
    "Draft":              { bg:"#f3f4f6", color:"#6b7280", border:"#e5e7eb" },
    "Awaiting Approval":  { bg:"#fef9c3", color:"#92400e", border:"#fde68a" },
    "Awaiting Payment":   { bg:"#dbeafe", color:"#1e40af", border:"#bfdbfe" },
    "Paid":               { bg:"#d1fae5", color:"#065f46", border:"#a7f3d0" },
    "Repeating":          { bg:"#ede9fe", color:"#5b21b6", border:"#ddd6fe" },
  };
  const s = map[status] || { bg:"#f3f4f6", color:"#555", border:"#ddd" };
  return (
    <span style={{
      fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:3,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:"nowrap",
    }}>
      {status}
    </span>
  );
}

function ChevronDown({ size = 10, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function InvoicesPage({ onNavigate }) {
  const [activeTab,             setActiveTab]             = useState("All");
  const [showNewInvoiceDropdown,setShowNewInvoiceDropdown]= useState(false);
  const [remindersOn,           setRemindersOn]           = useState(false);
  const [selectedIds,           setSelectedIds]           = useState([]);
  const [searchInput,           setSearchInput]           = useState("");
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setShowNewInvoiceDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const tabCounts = useMemo(() => {
    const counts = {};
    INVOICE_TABS.forEach(t => {
      counts[t] = t === "All"
        ? SAMPLE_INVOICES.length
        : SAMPLE_INVOICES.filter(i => i.status === t).length;
    });
    return counts;
  }, []);

  const filtered = useMemo(() => {
    let list = activeTab === "All"
      ? SAMPLE_INVOICES
      : SAMPLE_INVOICES.filter(i => i.status === activeTab);
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      list = list.filter(i =>
        i.id.toLowerCase().includes(q) ||
        i.contact.toLowerCase().includes(q) ||
        i.ref.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, searchInput]);

  const allChecked  = filtered.length > 0 && filtered.every(i => selectedIds.includes(i.id));
  const partChecked = filtered.some(i => selectedIds.includes(i.id)) && !allChecked;
  const toggleAll   = () => {
    if (allChecked) setSelectedIds(p => p.filter(id => !filtered.map(i => i.id).includes(id)));
    else            setSelectedIds(p => [...new Set([...p, ...filtered.map(i => i.id)])]);
  };
  const toggleOne   = id => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const total = filtered.reduce((sum, i) => sum + parseFloat(i.amount.replace(/[$,]/g, "")), 0);

  const inputCls = "h-8 text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0";
  const thSt     = { padding:"8px 10px", fontSize:12, fontWeight:700, color:"#1a7cb5", background:"#eaf4fb", borderBottom:"2px solid #c6dff0", whiteSpace:"nowrap" };

  return (
    <div style={{ fontFamily:"Arial,Helvetica,sans-serif", background:"#fff", minHeight:"calc(100vh - 48px)", color:"#333", fontSize:13 }}>
      <style>{`
        .inv-tab-scroll::-webkit-scrollbar { display:none; }
        @media(max-width:640px) {
          .inv-hide-mobile { display:none !important; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ padding:"14px 16px 0", background:"#fff", borderBottom:"1px solid #e0e0e0" }}>
        <p style={{ fontSize:12, color:"#888", marginBottom:3 }}>
          <span style={{ color:"#1a7cb5", cursor:"pointer" }} onClick={() => onNavigate("sales-overview")}>Sales overview</span>
          <span style={{ margin:"0 5px", color:"#ccc" }}>›</span>
        </p>
        <h1 style={{ margin:"0 0 12px", fontSize:22, fontWeight:700, color:"#1a1a1a", letterSpacing:"-0.02em" }}>Invoices</h1>

        {/* Action buttons */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>

          {/* New Invoice split button */}
          <div ref={dropRef} style={{ position:"relative", display:"flex" }}>
            <Button
              onClick={() => onNavigate("new-invoice")}
              style={{ background:"#1a7cb5", borderColor:"#1567a0", color:"#fff", fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:"4px 0 0 4px", borderRight:"1px solid rgba(255,255,255,.3)" }}
              className="hover:bg-[#155f8d]"
            >
              New Invoice
            </Button>
            <Button
              onClick={() => setShowNewInvoiceDropdown(o => !o)}
              style={{ background:"#1a7cb5", borderColor:"#1567a0", color:"#fff", height:32, padding:"0 8px", borderRadius:"0 4px 4px 0", minWidth:28 }}
              className="hover:bg-[#155f8d]"
            >
              <ChevronDown size={10} color="#fff" />
            </Button>
            {showNewInvoiceDropdown && (
              <div style={{
                position:"absolute", top:"calc(100% + 2px)", left:0, zIndex:999,
                background:"#fff", border:"1px solid #e0e0e0", borderRadius:4,
                boxShadow:"0 8px 24px rgba(0,0,0,.12)", minWidth:200,
              }}>
                {[
                  { label:"New Invoice",           action:() => onNavigate("new-invoice") },
                  { label:"New Repeating Invoice", action:() => onNavigate("new-repeating-invoice") },
                ].map((item, i) => (
                  <button key={i}
                    onClick={() => { setShowNewInvoiceDropdown(false); item.action(); }}
                    style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 14px", fontSize:13, border:"none", background:"none", cursor:"pointer", borderBottom: i === 0 ? "1px solid #f0f0f0" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5fafd"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" onClick={() => onNavigate("new-repeating-invoice")}
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:4, borderColor:"#bbb", color:"#444" }}
            className="hover:bg-gray-50 inv-hide-mobile">
            New Repeating Invoice
          </Button>

          <Button variant="outline" onClick={() => onNavigate("new-credit-note")}
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:4, borderColor:"#bbb", color:"#444" }}
            className="hover:bg-gray-50">
            New Credit Note
          </Button>

          {/* <Button variant="outline" onClick={() => onNavigate("send-statements")}
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:4, borderColor:"#bbb", color:"#444" }}
            className="hover:bg-gray-50 inv-hide-mobile">
            Send Statements
          </Button> */}

          <Button variant="outline" onClick={() => onNavigate("statements")}
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:4, borderColor:"#bbb", color:"#444" }}
            className="hover:bg-gray-50 inv-hide-mobile">
            Send Statements
          </Button>

          <Button variant="outline" onClick={() => onNavigate("import-invoices")}
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:4, borderColor:"#bbb", color:"#444" }}
            className="hover:bg-gray-50 inv-hide-mobile">
            Import
          </Button>

          <Button variant="outline" onClick={() => onNavigate("export-invoices")}
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:4, borderColor:"#bbb", color:"#444" }}
            className="hover:bg-gray-50">
            Export
          </Button>

          {/* Invoice Reminders toggle */}
          <button
            onClick={() => onNavigate("invoice-reminders")}
            style={{
              display:"flex", alignItems:"center", gap:6,
              border:"1px solid #bbb", borderRadius:4, padding:"0 10px", height:32,
              background:"#fff", fontSize:13, color:"#444", cursor:"pointer",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            <span style={{ width:8, height:8, borderRadius:"50%", background: remindersOn ? "#22c55e" : "#aaa", display:"inline-block", flexShrink:0 }} />
            Invoice Reminders: {remindersOn ? "On" : "Off"}
          </button>
        </div>

        {/* Status tabs */}
        <div className="inv-tab-scroll" style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none" }}>
          {INVOICE_TABS.map(tab => {
            const count    = tabCounts[tab] || 0;
            const isActive = activeTab === tab;
            return (
              <button key={tab}
                onClick={() => { setActiveTab(tab); setSelectedIds([]); }}
                style={{
                  background:"none", border:"none", padding:"9px 12px", fontSize:13,
                  fontWeight:isActive?700:400, cursor:"pointer",
                  color:isActive?"#1a7cb5":"#555",
                  borderBottom:isActive?"3px solid #1a7cb5":"3px solid transparent",
                  whiteSpace:"nowrap", flexShrink:0,
                  display:"flex", alignItems:"center", gap:5,
                }}
              >
                {tab}
                {tab !== "All" && tab !== "Paid" && tab !== "Repeating" && count > 0 && (
                  <span style={{ fontSize:11, color:"#999", fontWeight:400 }}>({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar + search */}
      <div style={{ padding:"10px 16px 0" }}>
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:6, background:"#f5f5f5", border:"1px solid #ccc", borderRadius:"4px 4px 0 0", padding:"7px 10px" }}>
          <span style={{ fontSize:12, color:selectedIds.length?"#1a7cb5":"#888", fontWeight:selectedIds.length?600:400 }}>
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : "No invoices selected"}
          </span>
          <div style={{ flex:1 }} />
          <Input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search invoices..."
            className={inputCls}
            style={{ width:200 }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ padding:"0 16px 24px" }}>
        <div style={{ border:"1px solid #c6dff0", borderTop:"none", borderRadius:"0 0 4px 4px", overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:640 }}>
            <thead>
              <tr>
                <th style={{ ...thSt, width:40 }}>
                  <input type="checkbox" checked={allChecked}
                    ref={el => { if (el) el.indeterminate = partChecked; }}
                    onChange={toggleAll}
                    style={{ width:14, height:14, accentColor:"#1a7cb5", cursor:"pointer" }} />
                </th>
                <th style={thSt}>Date</th>
                <th style={thSt}>Number</th>
                <th style={{ ...thSt }} className="inv-hide-mobile">Reference</th>
                <th style={thSt}>Contact</th>
                <th style={{ ...thSt }} className="inv-hide-mobile">Due Date</th>
                <th style={{ ...thSt, textAlign:"right" }}>Amount Due</th>
                <th style={thSt}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding:"48px 24px", textAlign:"center", color:"#aaa", fontSize:13 }}>
                    There are no items to display.{" "}
                    <span style={{ color:"#1a7cb5", cursor:"pointer", fontWeight:600 }}>Show deleted &amp; voided items</span>
                  </td>
                </tr>
              ) : filtered.map(inv => (
                <tr
                  key={inv.id}
                  style={{ background:selectedIds.includes(inv.id)?"#f0f7ff":"#fff" }}
                  onMouseEnter={e => { if (!selectedIds.includes(inv.id)) e.currentTarget.style.background = "#f0f8fd"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selectedIds.includes(inv.id)?"#f0f7ff":"#fff"; }}
                >
                  <td style={{ padding:"10px 10px", width:40, borderBottom:"1px solid #ebebeb" }}>
                    <input type="checkbox" checked={selectedIds.includes(inv.id)} onChange={() => toggleOne(inv.id)}
                      style={{ width:14, height:14, accentColor:"#1a7cb5", cursor:"pointer" }} />
                  </td>
                  <td style={{ padding:"10px 10px", fontSize:13, color:"#555", borderBottom:"1px solid #ebebeb" }}>{inv.date}</td>
                  <td style={{ padding:"10px 10px", fontSize:13, borderBottom:"1px solid #ebebeb" }}>
                    <button style={{ color:"#1a7cb5", fontWeight:700, background:"none", border:"none", padding:0, cursor:"pointer", fontSize:13 }}
                      onClick={() => toast.info(`Opening ${inv.id}`)}>
                      {inv.id}
                    </button>
                  </td>
                  <td style={{ padding:"10px 10px", fontSize:13, color:"#555", borderBottom:"1px solid #ebebeb" }} className="inv-hide-mobile">
                    {inv.ref || "—"}
                  </td>
                  <td style={{ padding:"10px 10px", fontSize:13, borderBottom:"1px solid #ebebeb" }}>
                    <button style={{ color:"#1a7cb5", fontWeight:600, background:"none", border:"none", padding:0, cursor:"pointer", fontSize:13 }}
                      onClick={() => toast.info(`Opening contact: ${inv.contact}`)}>
                      {inv.contact}
                    </button>
                  </td>
                  <td style={{ padding:"10px 10px", fontSize:13, color:"#555", borderBottom:"1px solid #ebebeb" }} className="inv-hide-mobile">
                    {inv.due}
                  </td>
                  <td style={{ padding:"10px 10px", fontSize:13, textAlign:"right", fontWeight:600, color:"#1a7cb5", borderBottom:"1px solid #ebebeb", whiteSpace:"nowrap" }}>
                    {inv.amount}
                  </td>
                  <td style={{ padding:"10px 10px", borderBottom:"1px solid #ebebeb" }}>
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {filtered.length > 0 && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 2px", flexWrap:"wrap", gap:8 }}>
            <span style={{ fontSize:12, color:"#888" }}>
              Showing <strong style={{ color:"#444" }}>{filtered.length}</strong> invoice{filtered.length !== 1 ? "s" : ""}
            </span>
            <span style={{ fontSize:12, color:"#888" }}>
              Total: <strong style={{ color:"#1a7cb5" }}>
                {total.toLocaleString("en-US", { style:"currency", currency:"USD" })}
              </strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
