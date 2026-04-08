import { useState, useMemo, useRef } from "react";
import { Button }     from "@/components/ui/button";
import { Input }      from "@/components/ui/input";
import { Label }      from "@/components/ui/label";
import { Textarea }   from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { toast }     from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCOUNT_TYPES = [
  "Assets","Bank","Current Assets","Fixed Assets","Non-current Assets",
  "Inventory","Equity","Liability","Current Liability","Non-current Liability",
  "Depreciation","Direct Costs","Expense","Overhead","Revenue","Other Income","Sales",
];
const TAX_RATES = [
  "No Tax (0%)","Tax on Purchases (0%)","Tax on Sales (0%)","Tax Exempt (0%)",
  "BAS Excluded","GST on Income","GST on Expenses","15% VAT",
  "20% Standard Rate","Zero Rated Income",
];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const INITIAL_ACCOUNTS = [
  { id:1,  code:"090", name:"Bank Account",            desc:"Main operating bank account",                                                              type:"Bank",                 taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:2,  code:"091", name:"Business Savings",        desc:"Business savings account",                                                                 type:"Bank",                 taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:3,  code:"100", name:"Accounts Receivable",     desc:"Outstanding customer invoices the business expects to collect",                            type:"Current Assets",        taxRate:"Tax on Sales (0%)",     ytd:"0.00", status:"active" },
  { id:4,  code:"120", name:"Prepayments",              desc:"Expenses paid in advance",                                                                 type:"Current Assets",        taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:5,  code:"130", name:"Inventory",                desc:"Stock on hand",                                                                            type:"Inventory",             taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:6,  code:"150", name:"Office Equipment",         desc:"Computers, printers, and office equipment",                                               type:"Fixed Assets",          taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:7,  code:"160", name:"Vehicles",                 desc:"Company-owned vehicles",                                                                   type:"Fixed Assets",          taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:8,  code:"170", name:"Accumulated Depreciation", desc:"Accumulated depreciation on fixed assets",                                                 type:"Depreciation",          taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:9,  code:"200", name:"Sales",                    desc:"Income from any normal business activity",                                                 type:"Revenue",               taxRate:"Tax on Sales (0%)",     ytd:"0.00", status:"active" },
  { id:10, code:"260", name:"Other Revenue",            desc:"Any other income that does not relate to normal business activities and is not recurring", type:"Revenue",               taxRate:"Tax on Sales (0%)",     ytd:"0.00", status:"active" },
  { id:11, code:"270", name:"Interest Income",          desc:"Interest income",                                                                          type:"Revenue",               taxRate:"Tax Exempt (0%)",       ytd:"0.00", status:"active" },
  { id:12, code:"310", name:"Cost of Goods Sold",       desc:"Cost of goods sold by the business",                                                       type:"Direct Costs",          taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:13, code:"400", name:"Advertising",              desc:"Expenses incurred for advertising while trying to increase sales",                         type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:14, code:"404", name:"Bank Fees",                desc:"Fees charged by your bank for transactions regarding your bank account(s)",                type:"Expense",               taxRate:"Tax Exempt (0%)",       ytd:"0.00", status:"active" },
  { id:15, code:"408", name:"Cleaning",                 desc:"Expenses incurred for cleaning business property",                                         type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:16, code:"412", name:"Consulting & Accounting",  desc:"Expenses incurred for consulting and accounting services",                                 type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:17, code:"416", name:"Depreciation",             desc:"Depreciation on fixed assets",                                                             type:"Expense",               taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:18, code:"420", name:"Entertainment",            desc:"Expenses for business entertainment",                                                      type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:19, code:"424", name:"Freight & Courier",        desc:"Postage, courier and freight costs",                                                       type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:20, code:"428", name:"General Expenses",         desc:"General expenses related to the operation of the business",                                type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:21, code:"432", name:"Insurance",                desc:"Premiums paid for business insurance",                                                      type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:22, code:"436", name:"Interest Expense",         desc:"Costs of financing your business",                                                         type:"Expense",               taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:23, code:"440", name:"Legal Expenses",           desc:"Expenses incurred on any legal matters",                                                   type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:24, code:"444", name:"Light, Power, Heating",    desc:"Expenses incurred for lighting, power or heating the business premises",                   type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:25, code:"448", name:"Motor Vehicle Expenses",   desc:"Expenses incurred on the operation of business motor vehicles",                            type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:26, code:"452", name:"Office Expenses",          desc:"Expenses incurred in the operation of a business office",                                  type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:27, code:"456", name:"Printing & Stationery",    desc:"Expenses incurred on printing and stationery",                                             type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:28, code:"460", name:"Purchases",                desc:"Goods purchased for resale",                                                               type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:29, code:"464", name:"Rent",                     desc:"Rent paid for use of business premises",                                                   type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:30, code:"468", name:"Repairs and Maintenance",  desc:"Expenses incurred on the repair and maintenance of business assets",                       type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:31, code:"472", name:"Salaries",                 desc:"Payment to employees for their services",                                                  type:"Expense",               taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:32, code:"476", name:"Subscriptions",            desc:"Expenses incurred for subscriptions",                                                      type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:33, code:"480", name:"Telephone & Internet",     desc:"Expenses incurred on telephone and internet",                                              type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:34, code:"484", name:"Travel & Accommodation",   desc:"Expenses incurred on travel and accommodation",                                            type:"Expense",               taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:35, code:"490", name:"Wages",                    desc:"Payment to staff members for their services",                                              type:"Expense",               taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:36, code:"800", name:"Accounts Payable",         desc:"Outstanding invoices the business owes to its suppliers",                                  type:"Current Liability",     taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:37, code:"810", name:"GST",                      desc:"The balance of GST collected and paid",                                                    type:"Current Liability",     taxRate:"Tax on Sales (0%)",     ytd:"0.00", status:"active" },
  { id:38, code:"820", name:"Income Tax Payable",       desc:"The balance of income tax owing at the end of the financial year",                         type:"Current Liability",     taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:39, code:"825", name:"Superannuation Payable",   desc:"The balance of superannuation owing at end of the pay period",                             type:"Current Liability",     taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:40, code:"830", name:"Wages Payable",            desc:"The balance of wages owing at the end of the financial year",                              type:"Current Liability",     taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:41, code:"835", name:"Employee Tax Payable",     desc:"Tax deducted from employee salaries payable to the tax authority",                         type:"Current Liability",     taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:42, code:"840", name:"Term Loan",                desc:"Long-term business loan",                                                                  type:"Non-current Liability", taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:43, code:"900", name:"Retained Earnings",        desc:"Value of all historical profits and losses",                                               type:"Equity",                taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:44, code:"910", name:"Owner A Drawings",         desc:"Withdrawals by the owner",                                                                 type:"Equity",                taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:45, code:"920", name:"Owner A Funds Introduced", desc:"Funds contributed by the owner",                                                           type:"Equity",                taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:46, code:"001", name:"Old Bank Account",         desc:"Decommissioned account",                                                                   type:"Bank",                 taxRate:"No Tax (0%)",           ytd:"0.00", status:"archived" },
];

const TAB_FILTERS = {
  "All Accounts": a => a.status === "active",
  "Assets":       a => a.status === "active" && ["Bank","Current Assets","Fixed Assets","Non-current Assets","Inventory","Depreciation"].includes(a.type),
  "Liabilities":  a => a.status === "active" && ["Current Liability","Non-current Liability"].includes(a.type),
  "Equity":       a => a.status === "active" && a.type === "Equity",
  "Expenses":     a => a.status === "active" && ["Expense","Direct Costs","Overhead"].includes(a.type),
  "Revenue":      a => a.status === "active" && ["Revenue","Other Income","Sales"].includes(a.type),
  "Archive":      a => a.status === "archived",
};
const TABS = Object.keys(TAB_FILTERS);

function FR({ label, req, children }) {
  return (
    <div className="mb-4">
      <Label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 4 }}>
        {label}{req && <span style={{ color: "#c00", marginLeft: 2 }}>*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function ChartOfAccountsPage({ onNavigate }) {
  const [accounts,    setAccounts]    = useState(INITIAL_ACCOUNTS);
  const [activeTab,   setActiveTab]   = useState("All Accounts");
  const [searchInput, setSearchInput] = useState("");
  const [search,      setSearch]      = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy,      setSortBy]      = useState("code");
  const [sortDir,     setSortDir]     = useState("asc");
  const [modal,       setModal]       = useState(null);   // "add" | "addbank" | "tax"
  const [editAcc,     setEditAcc]     = useState(null);
  const [newTax,      setNewTax]      = useState(TAX_RATES[0]);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(25);
  const [form, setForm] = useState({ code:"", name:"", type:"Revenue", taxRate:"Tax on Sales (0%)", description:"" });
  const nextId = useRef(200);

  const filtered = useMemo(() => {
    const fn = TAB_FILTERS[activeTab] || (() => true);
    let list = accounts.filter(fn);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) || a.code.includes(q) ||
        a.type.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let va = a[sortBy] || "", vb = b[sortBy] || "";
      if (sortBy === "code") { va = parseInt(va) || 0; vb = parseInt(vb) || 0; }
      return sortDir === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
  }, [accounts, activeTab, search, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(currentPage, totalPages);
  const pageStart  = (safePage - 1) * pageSize;
  const pageEnd    = Math.min(pageStart + pageSize, filtered.length);
  const paginated  = filtered.slice(pageStart, pageEnd);
  const resetPage  = () => setCurrentPage(1);
  const goToPage   = p => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  const selCount  = selectedIds.length;
  const pageIds   = paginated.map(a => a.id);
  const allPageCk = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
  const partPageCk= pageIds.some(id => selectedIds.includes(id)) && !allPageCk;

  const sortCol       = c => { resetPage(); if (sortBy === c) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortBy(c); setSortDir("asc"); } };
  const togglePageAll = () => { if (allPageCk) setSelectedIds(p => p.filter(id => !pageIds.includes(id))); else setSelectedIds(p => [...new Set([...p, ...pageIds])]); };
  const toggleOne     = id => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const switchTab     = t  => { setActiveTab(t); setSelectedIds([]); setSearch(""); setSearchInput(""); resetPage(); };

  const openAdd  = () => { setForm({ code:"", name:"", type:"Revenue", taxRate:"Tax on Sales (0%)", description:"" }); setEditAcc(null); setModal("add"); };
  const openEdit = a  => { setForm({ code: a.code, name: a.name, type: a.type, taxRate: a.taxRate, description: a.desc }); setEditAcc(a); setModal("add"); };

  const saveAcc = () => {
    if (!form.name.trim()) return toast.error("Account name is required.");
    if (!form.code.trim()) return toast.error("Account code is required.");
    if (editAcc) {
      setAccounts(p => p.map(a => a.id === editAcc.id ? { ...a, code: form.code, name: form.name, type: form.type, taxRate: form.taxRate, desc: form.description } : a));
      toast.success("✓ Account updated successfully.");
    } else {
      setAccounts(p => [...p, { id: ++nextId.current, code: form.code, name: form.name, desc: form.description, type: form.type, taxRate: form.taxRate, ytd: "0.00", status: "active" }]);
      toast.success("✓ Account added successfully.");
    }
    setModal(null);
  };

  const doArchive = () => {
    if (!selCount) return;
    setAccounts(p => p.map(a => selectedIds.includes(a.id) ? { ...a, status: "archived" } : a));
    toast.success(`✓ ${selCount} account${selCount > 1 ? "s have" : " has"} been archived.`);
    setSelectedIds([]);
  };

  const doDelete = () => {
    const count = selCount;
    setAccounts(p => p.filter(a => !selectedIds.includes(a.id)));
    setSelectedIds([]); setDeleteOpen(false); resetPage();
    toast.success(`✓ ${count} account${count > 1 ? "s have" : " has"} been deleted.`);
  };

  const applyTax = () => {
    setAccounts(p => p.map(a => selectedIds.includes(a.id) ? { ...a, taxRate: newTax } : a));
    toast.success(`✓ Tax rate updated for ${selCount} account${selCount > 1 ? "s" : ""}.`);
    setModal(null);
  };

  const exportCSV = () => {
    const csv = [["Code","Name","Type","Tax Rate","YTD"], ...filtered.map(a => [a.code,a.name,a.type,a.taxRate,a.ytd])]
      .map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const el = document.createElement("a");
    el.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    el.download = "chart_of_accounts.csv"; el.click();
    toast.success("✓ CSV exported successfully.");
  };

  const getPageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 4)            return [1,2,3,4,5,"…",totalPages];
    if (safePage >= totalPages-3) return [1,"…",totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    return [1,"…",safePage-1,safePage,safePage+1,"…",totalPages];
  };

  const Arrow = ({ col }) => sortBy !== col
    ? <span style={{ color:"#ccc", fontSize:9, marginLeft:3 }}>▲▼</span>
    : <span style={{ color:"#1a7cb5", fontSize:9, marginLeft:3 }}>{sortDir==="asc"?"▲":"▼"}</span>;

  const inputCls       = "h-8 text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-1 focus-visible:ring-[#1a7cb5] focus-visible:ring-offset-0";
  const selTriggerCls  = "h-8 text-[12px] border-[#ccc] rounded-[3px] focus:ring-1 focus:ring-[#1a7cb5] focus:ring-offset-0";

  const S = {
    toolBtn: d => ({ background:d?"#f0f0f0":"#fff", border:"1px solid #bbb", color:d?"#bbb":"#333", padding:"4px 10px", fontSize:12, fontWeight:700, borderRadius:3, cursor:d?"default":"pointer", whiteSpace:"nowrap", lineHeight:"1.6" }),
    th:      r => ({ padding:"8px 10px", fontSize:12, fontWeight:700, color:"#1a7cb5", cursor:"pointer", background:"#eaf4fb", borderBottom:"2px solid #c6dff0", userSelect:"none", whiteSpace:"nowrap", textAlign:r?"right":"left" }),
    td:        { padding:"9px 10px", fontSize:13, verticalAlign:"top", borderBottom:"1px solid #ebebeb" },
    nameLink:  { color:"#1a7cb5", fontWeight:700, fontSize:13, background:"none", border:"none", padding:0, cursor:"pointer", textAlign:"left" },
    pageBtn: (a,d) => ({ minWidth:30, height:28, padding:"0 6px", fontSize:12, fontWeight:a?700:400, border:"1px solid", borderColor:a?"#1a7cb5":"#ddd", background:a?"#1a7cb5":"#fff", color:a?"#fff":d?"#ccc":"#444", borderRadius:3, cursor:d?"default":"pointer", lineHeight:1 }),
  };

  return (
    <div style={{ fontFamily:"Arial,Helvetica,sans-serif", background:"#fff", minHeight:"calc(100vh - 48px)", color:"#333", fontSize:13 }}>
      <style>{`
        .coa-tab-scroll::-webkit-scrollbar { display:none; }
        .coa-page-size-sel { padding:3px 22px 3px 7px; font-size:12px; border:1px solid #ccc; border-radius:3px; background:#fff; cursor:pointer; outline:none; appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23666'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 4px center; background-size:13px; }
        @media(max-width:640px){
          .coa-hide-mobile { display:none !important; }
          .coa-mobile-card { display:block !important; }
          .coa-desktop-table { display:none !important; }
        }
        .coa-mobile-card { display:none; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ padding:"14px 16px 0", background:"#fff", borderBottom:"1px solid #e0e0e0" }}>
        <p style={{ fontSize:12, color:"#888", marginBottom:3 }}>
          <span style={{ color:"#1a7cb5", cursor:"pointer" }}>Settings</span>
          <span style={{ margin:"0 5px", color:"#ccc" }}>›</span>
        </p>
        <h1 style={{ margin:"0 0 12px", fontSize:22, fontWeight:700, color:"#1a1a1a", letterSpacing:"-0.02em" }}>Chart of accounts</h1>

        {/* Action buttons */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
          <Button onClick={openAdd} style={{ background:"#1a7cb5", borderColor:"#1567a0", color:"#fff", fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:4 }} className="hover:bg-[#155f8d]">
            <span style={{ fontSize:16, fontWeight:400, marginRight:4 }}>+</span>Add Account
          </Button>
          <Button onClick={() => setModal("addbank")} style={{ background:"#1a7cb5", borderColor:"#1567a0", color:"#fff", fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:4 }} className="hover:bg-[#155f8d]">
            <span style={{ fontSize:16, fontWeight:400, marginRight:4 }}>+</span>Add Bank Account
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="hover:bg-gray-50 coa-hide-mobile"
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:4, borderColor:"#bbb", color:"#444" }}>
            <span style={{ background:"#c00", color:"#fff", fontSize:9, fontWeight:900, padding:"1px 3px", borderRadius:2, marginRight:5 }}>PDF</span>Print PDF
          </Button>
          <Button variant="outline" onClick={() => toast.info("Import feature coming soon.")} className="hover:bg-gray-50 coa-hide-mobile"
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:4, borderColor:"#bbb", color:"#444" }}>Import</Button>
          <Button variant="outline" onClick={exportCSV} className="hover:bg-gray-50"
            style={{ fontSize:13, fontWeight:700, height:32, padding:"0 12px", borderRadius:4, borderColor:"#bbb", color:"#444" }}>Export</Button>
        </div>

        {/* Category tabs */}
        <div className="coa-tab-scroll" style={{ display:"flex", overflowX:"auto", gap:0, scrollbarWidth:"none" }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => switchTab(tab)} style={{
              background:"none", border:"none", padding:"9px 12px", fontSize:13,
              fontWeight:activeTab===tab?700:400, cursor:"pointer",
              color:activeTab===tab?"#1a7cb5":"#555",
              borderBottom:activeTab===tab?"3px solid #1a7cb5":"3px solid transparent",
              whiteSpace:"nowrap", flexShrink:0,
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* What's this */}
      <div style={{ padding:"7px 16px 0" }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span style={{ color:"#e07000", fontSize:12, fontWeight:700, cursor:"pointer" }}>What's this? 💬</span>
          </TooltipTrigger>
          <TooltipContent style={{ maxWidth:280, fontSize:12 }}>
            The chart of accounts is a list of all the accounts used to record financial transactions for your organisation.
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Toolbar */}
      <div style={{ padding:"10px 16px 0" }}>
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:6, background:"#f5f5f5", border:"1px solid #ccc", borderRadius:"4px 4px 0 0", padding:"7px 10px" }}>
          <button style={S.toolBtn(!selCount)} disabled={!selCount} onClick={() => selCount && setDeleteOpen(true)}>Delete</button>
          <button style={S.toolBtn(!selCount)} disabled={!selCount} onClick={doArchive}>Archive</button>
          <button style={S.toolBtn(!selCount)} disabled={!selCount} onClick={() => selCount && setModal("tax")} className="coa-hide-mobile">Change Tax Rate</button>
          <span style={{ fontSize:12, color:selCount?"#1a7cb5":"#999", marginLeft:4, fontWeight:selCount?600:400 }}>
            {selCount ? `${selCount} selected` : "No accounts selected"}
          </span>
          <div style={{ flex:1 }} />
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter") { setSearch(searchInput); resetPage(); } }}
              placeholder="Search accounts..." className={inputCls} style={{ width:180 }} />
            <button style={{ background:"#fff", border:"1px solid #1a7cb5", color:"#1a7cb5", padding:"4px 12px", fontSize:12, fontWeight:700, borderRadius:3, cursor:"pointer" }}
              onClick={() => { setSearch(searchInput); resetPage(); }}>Search</button>
            {search && (
              <button onClick={() => { setSearch(""); setSearchInput(""); resetPage(); }}
                style={{ background:"none", border:"none", color:"#888", cursor:"pointer", fontSize:12 }}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding:"0 16px 24px" }}>

        {/* Desktop table */}
        <div className="coa-desktop-table">
          <ScrollArea style={{ width:"100%", border:"1px solid #c6dff0", borderTop:"none", borderRadius:"0 0 4px 4px" }}>
            <Table style={{ minWidth:620, borderCollapse:"collapse" }}>
              <TableHeader>
                <TableRow style={{ background:"#eaf4fb" }} className="hover:bg-[#eaf4fb]">
                  <TableHead style={{ ...S.th(false), width:40, padding:"8px 10px" }}>
                    <input type="checkbox" checked={allPageCk}
                      ref={el => { if (el) el.indeterminate = partPageCk; }}
                      onChange={togglePageAll}
                      style={{ width:14, height:14, accentColor:"#1a7cb5", cursor:"pointer" }} />
                  </TableHead>
                  {[["code","Code"],["name","Name"],["type","Type"],["taxRate","Tax Rate"]].map(([k,l]) => (
                    <TableHead key={k} style={S.th(false)} onClick={() => sortCol(k)}>{l}<Arrow col={k}/></TableHead>
                  ))}
                  <TableHead style={S.th(true)} onClick={() => sortCol("ytd")}>YTD<Arrow col="ytd"/></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} style={{ padding:"40px 24px", textAlign:"center", color:"#aaa", fontSize:13 }}>
                      {search ? `No accounts found for "${search}".` : "No accounts in this category."}
                    </TableCell>
                  </TableRow>
                ) : paginated.map(acc => (
                  <TableRow key={acc.id}
                    style={{ background:selectedIds.includes(acc.id)?"#f0f7ff":"#fff" }}
                    className="hover:bg-[#f0f8fd]">
                    <TableCell style={{ ...S.td, width:40, padding:"9px 10px" }}>
                      <input type="checkbox" checked={selectedIds.includes(acc.id)} onChange={() => toggleOne(acc.id)}
                        style={{ width:14, height:14, accentColor:"#1a7cb5", cursor:"pointer" }} />
                    </TableCell>
                    <TableCell style={{ ...S.td, color:"#555", width:80 }}>{acc.code}</TableCell>
                    <TableCell style={S.td}>
                      <button style={S.nameLink} onClick={() => openEdit(acc)}>{acc.name}</button>
                      {acc.desc && <p style={{ fontSize:12, color:"#888", margin:"2px 0 0", lineHeight:1.4 }}>{acc.desc}</p>}
                    </TableCell>
                    <TableCell style={S.td}>{acc.type}</TableCell>
                    <TableCell style={S.td}>{acc.taxRate}</TableCell>
                    <TableCell style={{ ...S.td, textAlign:"right", color:"#1a7cb5", fontWeight:600, whiteSpace:"nowrap" }}>{acc.ytd}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Mobile card list */}
        <div className="coa-mobile-card" style={{ border:"1px solid #c6dff0", borderTop:"none", borderRadius:"0 0 4px 4px" }}>
          {paginated.length === 0 ? (
            <div style={{ padding:"32px 16px", textAlign:"center", color:"#aaa", fontSize:13 }}>
              {search ? `No accounts found for "${search}".` : "No accounts in this category."}
            </div>
          ) : paginated.map((acc, i) => (
            <div key={acc.id} style={{
              padding:"12px 14px",
              borderBottom: i < paginated.length - 1 ? "1px solid #ebebeb" : "none",
              background: selectedIds.includes(acc.id) ? "#f0f7ff" : "#fff",
              display:"flex", alignItems:"flex-start", gap:10,
            }}>
              <input type="checkbox" checked={selectedIds.includes(acc.id)} onChange={() => toggleOne(acc.id)}
                style={{ width:14, height:14, accentColor:"#1a7cb5", cursor:"pointer", marginTop:3, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                  <button style={S.nameLink} onClick={() => openEdit(acc)}>{acc.name}</button>
                  <span style={{ fontSize:12, color:"#1a7cb5", fontWeight:600 }}>{acc.ytd}</span>
                </div>
                {acc.desc && <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{acc.desc}</div>}
                <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 12px", marginTop:6 }}>
                  <span style={{ fontSize:11, color:"#555" }}><span style={{ color:"#999" }}>Code: </span>{acc.code}</span>
                  <span style={{ fontSize:11, color:"#555" }}><span style={{ color:"#999" }}>Type: </span>{acc.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:10, marginTop:10, padding:"0 2px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:12, color:"#888" }}>
                Showing <strong style={{ color:"#444" }}>{pageStart+1}–{pageEnd}</strong> of <strong style={{ color:"#444" }}>{filtered.length}</strong> accounts
              </span>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:12, color:"#888" }}>Rows:</span>
                <select className="coa-page-size-sel" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); resetPage(); }}>
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
              <button style={S.pageBtn(false, safePage===1)} disabled={safePage===1} onClick={() => goToPage(safePage-1)}>‹</button>
              {getPageNums().map((p, i) =>
                p === "…"
                  ? <span key={`d${i}`} style={{ fontSize:12, color:"#aaa", padding:"0 2px" }}>…</span>
                  : <button key={p} style={S.pageBtn(p===safePage,false)} onClick={() => goToPage(p)}>{p}</button>
              )}
              <button style={S.pageBtn(false, safePage===totalPages)} disabled={safePage===totalPages} onClick={() => goToPage(safePage+1)}>›</button>
              <span className="coa-hide-mobile" style={{ fontSize:12, color:"#888", marginLeft:4 }}>Go to:</span>
              <input className="coa-hide-mobile" type="number" min={1} max={totalPages} defaultValue={safePage} key={safePage}
                onKeyDown={e => { if (e.key==="Enter") goToPage(Number(e.target.value)); }}
                style={{ width:44, height:28, border:"1px solid #ccc", borderRadius:3, textAlign:"center", fontSize:12, outline:"none", padding:"0 4px" }} />
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Add / Edit Account */}
      <Dialog open={modal==="add"} onOpenChange={o => !o && setModal(null)}>
        <DialogContent showCloseButton={false} style={{ maxWidth:520, width:"92vw", padding:0, borderRadius:8 }}>
          <DialogHeader style={{ background:"#f5f5f5", padding:"14px 18px", borderBottom:"1px solid #ddd", borderRadius:"8px 8px 0 0", position:"relative" }}>
            <DialogTitle style={{ fontSize:15, fontWeight:700, color:"#1a1a1a" }}>{editAcc?"Edit Account":"Add Account"}</DialogTitle>
            <button onClick={() => setModal(null)} style={{ position:"absolute", right:14, top:12, border:"none", background:"none", fontSize:18, cursor:"pointer", color:"#666" }}>✕</button>
          </DialogHeader>
          <div style={{ padding:20, display:"flex", flexDirection:"column", gap:14, maxHeight:"70vh", overflowY:"auto" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <FR label="Account Code" req>
                <Input value={form.code} maxLength={10} placeholder="e.g. 200" onChange={e => setForm(p => ({ ...p, code:e.target.value }))} className={inputCls} />
              </FR>
              <FR label="Account Name" req>
                <Input value={form.name} placeholder="e.g. Sales" onChange={e => setForm(p => ({ ...p, name:e.target.value }))} className={inputCls} />
              </FR>
            </div>
            <FR label="Account Type" req>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type:v }))}>
                <SelectTrigger className={selTriggerCls}><SelectValue /></SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className="max-h-60 z-[200]">
                  {ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t} className="text-[12px] py-1.5">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FR>
            <FR label="Tax Rate">
              <Select value={form.taxRate} onValueChange={v => setForm(p => ({ ...p, taxRate:v }))}>
                <SelectTrigger className={selTriggerCls}><SelectValue /></SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className="max-h-60 z-[200]">
                  {TAX_RATES.map(t => <SelectItem key={t} value={t} className="text-[12px] py-1.5">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FR>
            <FR label="Description">
              <Textarea value={form.description} placeholder="Optional description..." rows={3}
                onChange={e => setForm(p => ({ ...p, description:e.target.value }))}
                style={{ fontSize:13, borderColor:"#ccc", borderRadius:3, resize:"vertical" }} />
            </FR>
          </div>
          <Separator />
          <DialogFooter style={{ padding:"14px 20px", display:"flex", justifyContent:"flex-end", gap:10, flexWrap:"wrap" }}>
            <Button variant="outline" onClick={() => setModal(null)} style={{ fontSize:13, fontWeight:700, borderColor:"#bbb", color:"#555", height:32, borderRadius:4 }}>Cancel</Button>
            <Button onClick={saveAcc} style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700, height:32, borderRadius:4 }} className="hover:bg-[#155f8d]">
              {editAcc?"Save Changes":"Add Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bank Account */}
      <Dialog open={modal==="addbank"} onOpenChange={o => !o && setModal(null)}>
        <DialogContent showCloseButton={false} style={{ maxWidth:520, width:"92vw", padding:0, borderRadius:8 }}>
          <DialogHeader style={{ background:"#f5f5f5", padding:"14px 18px", borderBottom:"1px solid #ddd", borderRadius:"8px 8px 0 0", position:"relative" }}>
            <DialogTitle style={{ fontSize:15, fontWeight:700 }}>Add Bank Account</DialogTitle>
            <button onClick={() => setModal(null)} style={{ position:"absolute", right:14, top:12, border:"none", background:"none", fontSize:18, cursor:"pointer", color:"#666" }}>✕</button>
          </DialogHeader>
          <div style={{ padding:20, display:"flex", flexDirection:"column", gap:14, maxHeight:"70vh", overflowY:"auto" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <FR label="Account Code" req><Input placeholder="e.g. 092" className={inputCls} /></FR>
              <FR label="Bank Name"    req><Input placeholder="e.g. National Bank" className={inputCls} /></FR>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <FR label="Account Number" req><Input placeholder="e.g. 00-1234-5678900-00" className={inputCls} /></FR>
              <FR label="Account Name"   req><Input placeholder="e.g. Business Cheque" className={inputCls} /></FR>
            </div>
            <FR label="Currency">
              <Select defaultValue="AUD">
                <SelectTrigger className={selTriggerCls}><SelectValue /></SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className="max-h-60 z-[200]">
                  {["AUD","USD","GBP","EUR","NZD"].map(c => <SelectItem key={c} value={c} className="text-[12px] py-1.5">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FR>
          </div>
          <Separator />
          <DialogFooter style={{ padding:"14px 20px", display:"flex", justifyContent:"flex-end", gap:10 }}>
            <Button variant="outline" onClick={() => setModal(null)} style={{ fontSize:13, fontWeight:700, borderColor:"#bbb", color:"#555", height:32, borderRadius:4 }}>Cancel</Button>
            <Button onClick={() => { setModal(null); toast.success("✓ Bank account added successfully."); }}
              style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700, height:32, borderRadius:4 }} className="hover:bg-[#155f8d]">
              Add Bank Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Tax Rate */}
      <Dialog open={modal==="tax"} onOpenChange={o => !o && setModal(null)}>
        <DialogContent showCloseButton={false} style={{ maxWidth:400, width:"92vw", padding:0, borderRadius:8 }}>
          <DialogHeader style={{ background:"#f5f5f5", padding:"14px 18px", borderBottom:"1px solid #ddd", borderRadius:"8px 8px 0 0", position:"relative" }}>
            <DialogTitle style={{ fontSize:15, fontWeight:700 }}>Change Tax Rate</DialogTitle>
            <button onClick={() => setModal(null)} style={{ position:"absolute", right:14, top:12, border:"none", background:"none", fontSize:18, cursor:"pointer", color:"#666" }}>✕</button>
          </DialogHeader>
          <div style={{ padding:20, display:"flex", flexDirection:"column", gap:14 }}>
            <p style={{ fontSize:13, color:"#555", margin:0 }}>Apply a new tax rate to <strong>{selCount}</strong> selected account{selCount>1?"s":""}.</p>
            <FR label="New Tax Rate" req>
              <Select value={newTax} onValueChange={setNewTax}>
                <SelectTrigger className={selTriggerCls}><SelectValue /></SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className="max-h-60 z-[200]">
                  {TAX_RATES.map(t => <SelectItem key={t} value={t} className="text-[12px] py-1.5">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FR>
          </div>
          <Separator />
          <DialogFooter style={{ padding:"14px 20px", display:"flex", justifyContent:"flex-end", gap:10 }}>
            <Button variant="outline" onClick={() => setModal(null)} style={{ fontSize:13, fontWeight:700, borderColor:"#bbb", color:"#555", height:32, borderRadius:4 }}>Cancel</Button>
            <Button onClick={applyTax} style={{ background:"#1a7cb5", color:"#fff", fontSize:13, fontWeight:700, height:32, borderRadius:4 }} className="hover:bg-[#155f8d]">Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent style={{ maxWidth:420, width:"90vw", padding:0 }}>
          <AlertDialogHeader style={{ background:"#f5f5f5", padding:"12px 18px", borderBottom:"1px solid #ddd", borderRadius:"8px 8px 0 0" }}>
            <AlertDialogTitle style={{ fontSize:15, fontWeight:700, color:"#1a1a1a" }}>Delete Accounts</AlertDialogTitle>
          </AlertDialogHeader>
          <div style={{ padding:"16px 20px 8px" }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                </svg>
              </div>
              <AlertDialogDescription style={{ fontSize:13, color:"#333", margin:0 }}>
                You are about to permanently delete <strong>{selCount} account{selCount>1?"s":""}</strong>.
                This action <strong style={{ color:"#c00" }}>cannot be undone</strong>.
                Consider using <em>Archive</em> to retain your records.
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter style={{ padding:"12px 20px 16px", gap:8, justifyContent:"flex-end", display:"flex" }}>
            <AlertDialogCancel style={{ fontSize:13, fontWeight:700, borderColor:"#bbb", color:"#555", height:32, borderRadius:4 }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}
              style={{ background:"#c00", borderColor:"#a00", color:"#fff", fontSize:13, fontWeight:700, height:32, borderRadius:4 }}
              className="hover:bg-red-700">Yes, Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
