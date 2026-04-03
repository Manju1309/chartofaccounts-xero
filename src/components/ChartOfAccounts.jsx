import { useState, useMemo, useRef } from "react";

const ACCOUNT_TYPES = ["Assets","Bank","Current Assets","Fixed Assets","Non-current Assets","Inventory","Equity","Liability","Current Liability","Non-current Liability","Depreciation","Direct Costs","Expense","Overhead","Revenue","Other Income","Sales"];
const TAX_RATES = ["No Tax (0%)","Tax on Purchases (0%)","Tax on Sales (0%)","Tax Exempt (0%)","BAS Excluded","GST on Income","GST on Expenses","15% VAT","20% Standard Rate","Zero Rated Income"];

const INITIAL_ACCOUNTS = [
  { id:1,  code:"090", name:"Bank Account",             desc:"Main operating bank account",                                                               type:"Bank",                  taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:2,  code:"091", name:"Business Savings",         desc:"Business savings account",                                                                  type:"Bank",                  taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:3,  code:"100", name:"Accounts Receivable",      desc:"Outstanding customer invoices the business expects to collect",                             type:"Current Assets",         taxRate:"Tax on Sales (0%)",     ytd:"0.00", status:"active" },
  { id:4,  code:"120", name:"Prepayments",               desc:"Expenses paid in advance",                                                                  type:"Current Assets",         taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:5,  code:"130", name:"Inventory",                 desc:"Stock on hand",                                                                             type:"Inventory",              taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:6,  code:"150", name:"Office Equipment",          desc:"Computers, printers, and office equipment",                                                type:"Fixed Assets",           taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:7,  code:"160", name:"Vehicles",                  desc:"Company-owned vehicles",                                                                    type:"Fixed Assets",           taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:8,  code:"170", name:"Accumulated Depreciation",  desc:"Accumulated depreciation on fixed assets",                                                  type:"Depreciation",           taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:9,  code:"200", name:"Sales",                     desc:"Income from any normal business activity",                                                  type:"Revenue",                taxRate:"Tax on Sales (0%)",     ytd:"0.00", status:"active" },
  { id:10, code:"260", name:"Other Revenue",             desc:"Any other income that does not relate to normal business activities and is not recurring",  type:"Revenue",                taxRate:"Tax on Sales (0%)",     ytd:"0.00", status:"active" },
  { id:11, code:"270", name:"Interest Income",           desc:"Interest income",                                                                           type:"Revenue",                taxRate:"Tax Exempt (0%)",       ytd:"0.00", status:"active" },
  { id:12, code:"310", name:"Cost of Goods Sold",        desc:"Cost of goods sold by the business",                                                        type:"Direct Costs",           taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:13, code:"400", name:"Advertising",               desc:"Expenses incurred for advertising while trying to increase sales",                          type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:14, code:"404", name:"Bank Fees",                 desc:"Fees charged by your bank for transactions regarding your bank account(s)",                 type:"Expense",                taxRate:"Tax Exempt (0%)",       ytd:"0.00", status:"active" },
  { id:15, code:"408", name:"Cleaning",                  desc:"Expenses incurred for cleaning business property",                                          type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:16, code:"412", name:"Consulting & Accounting",   desc:"Expenses incurred for consulting and accounting services",                                  type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:17, code:"416", name:"Depreciation",              desc:"Depreciation on fixed assets",                                                              type:"Expense",                taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:18, code:"420", name:"Entertainment",             desc:"Expenses for business entertainment",                                                       type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:19, code:"424", name:"Freight & Courier",         desc:"Postage, courier and freight costs",                                                        type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:20, code:"428", name:"General Expenses",          desc:"General expenses related to the operation of the business",                                 type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:21, code:"432", name:"Insurance",                 desc:"Premiums paid for business insurance",                                                       type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:22, code:"436", name:"Interest Expense",          desc:"Costs of financing your business",                                                          type:"Expense",                taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:23, code:"440", name:"Legal Expenses",            desc:"Expenses incurred on any legal matters",                                                    type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:24, code:"444", name:"Light, Power, Heating",     desc:"Expenses incurred for lighting, power or heating the business premises",                    type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:25, code:"448", name:"Motor Vehicle Expenses",    desc:"Expenses incurred on the operation of business motor vehicles",                             type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:26, code:"452", name:"Office Expenses",           desc:"Expenses incurred in the operation of a business office",                                   type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:27, code:"456", name:"Printing & Stationery",     desc:"Expenses incurred on printing and stationery",                                              type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:28, code:"460", name:"Purchases",                 desc:"Goods purchased for resale",                                                                type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:29, code:"464", name:"Rent",                      desc:"Rent paid for use of business premises",                                                    type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:30, code:"468", name:"Repairs and Maintenance",   desc:"Expenses incurred on the repair and maintenance of business assets",                        type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:31, code:"472", name:"Salaries",                  desc:"Payment to employees for their services",                                                   type:"Expense",                taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:32, code:"476", name:"Subscriptions",             desc:"Expenses incurred for subscriptions",                                                       type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:33, code:"480", name:"Telephone & Internet",      desc:"Expenses incurred on telephone and internet",                                               type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:34, code:"484", name:"Travel & Accommodation",    desc:"Expenses incurred on travel and accommodation",                                             type:"Expense",                taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:35, code:"490", name:"Wages",                     desc:"Payment to staff members for their services",                                               type:"Expense",                taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:36, code:"800", name:"Accounts Payable",          desc:"Outstanding invoices the business owes to its suppliers",                                   type:"Current Liability",      taxRate:"Tax on Purchases (0%)",ytd:"0.00", status:"active" },
  { id:37, code:"810", name:"GST",                       desc:"The balance of GST collected and paid",                                                     type:"Current Liability",      taxRate:"Tax on Sales (0%)",     ytd:"0.00", status:"active" },
  { id:38, code:"820", name:"Income Tax Payable",        desc:"The balance of income tax owing at the end of the financial year",                          type:"Current Liability",      taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:39, code:"825", name:"Superannuation Payable",    desc:"The balance of superannuation owing at end of the pay period",                              type:"Current Liability",      taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:40, code:"830", name:"Wages Payable",             desc:"The balance of wages owing at the end of the financial year",                               type:"Current Liability",      taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:41, code:"835", name:"Employee Tax Payable",      desc:"Tax deducted from employee salaries payable to the tax authority",                          type:"Current Liability",      taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:42, code:"840", name:"Term Loan",                 desc:"Long-term business loan",                                                                   type:"Non-current Liability",  taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:43, code:"900", name:"Retained Earnings",         desc:"Value of all historical profits and losses",                                                type:"Equity",                 taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:44, code:"910", name:"Owner A Drawings",          desc:"Withdrawals by the owner",                                                                  type:"Equity",                 taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:45, code:"920", name:"Owner A Funds Introduced",  desc:"Funds contributed by the owner",                                                            type:"Equity",                 taxRate:"No Tax (0%)",           ytd:"0.00", status:"active" },
  { id:46, code:"001", name:"Old Bank Account",          desc:"Decommissioned account",                                                                    type:"Bank",                  taxRate:"No Tax (0%)",           ytd:"0.00", status:"archived" },
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

function Modal({ title, onClose, children, width = 500 }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999
    }}>
      <div style={{
        background:"#fff",borderRadius:4,
        boxShadow:"0 8px 40px rgba(0,0,0,.22)",
        width,maxWidth:"95vw",maxHeight:"92vh",overflow:"auto"
      }}>
        <div style={{
          background:"#f5f5f5",borderBottom:"1px solid #ddd",
          padding:"11px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"
        }}>
          <span style={{fontWeight:700,fontSize:15,color:"#1a1a1a"}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#888",lineHeight:1,padding:"0 2px"}}>×</button>
        </div>
        <div style={{padding:"18px 20px 20px"}}>{children}</div>
      </div>
    </div>
  );
}

const iStyle = {
  width:"100%",boxSizing:"border-box",padding:"7px 9px",
  border:"1px solid #bbb",borderRadius:3,fontSize:13,color:"#333",outline:"none"
};
const selStyle = {
  ...iStyle,
  appearance:"none",backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center",backgroundSize:13,
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23555'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E")`,
  paddingRight:26,background:"#fff"
};

function FR({ label, req, children }) {
  return (
    <div style={{marginBottom:13}}>
      <label style={{display:"block",fontSize:12,fontWeight:700,color:"#444",marginBottom:4}}>
        {label}{req && <span style={{color:"#c00",marginLeft:2}}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [activeTab, setActiveTab] = useState("All Accounts");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState("code");
  const [sortDir, setSortDir] = useState("asc");
  const [modal, setModal] = useState(null); // null | "add" | "addbank" | "tax" | "delete"
  const [editAcc, setEditAcc] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", type:"Revenue", taxRate:"Tax on Sales (0%)", description:"" });
  const [newTax, setNewTax] = useState(TAX_RATES[0]);
  const [toast, setToast] = useState(null);
  const nextId = useRef(200);

  const toast$ = (msg, err) => { setToast({msg,err}); setTimeout(()=>setToast(null),3000); };

  const filtered = useMemo(() => {
    const fn = TAB_FILTERS[activeTab];
    let list = accounts.filter(fn);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) || a.code.includes(q) ||
        a.type.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a,b) => {
      let va = a[sortBy]||"", vb = b[sortBy]||"";
      if (sortBy==="code") { va=parseInt(va)||0; vb=parseInt(vb)||0; }
      return sortDir==="asc" ? (va<vb?-1:va>vb?1:0) : (va>vb?-1:va<vb?1:0);
    });
  }, [accounts, activeTab, search, sortBy, sortDir]);

  const selCount = selectedIds.length;
  const allCk = filtered.length>0 && selCount===filtered.length;
  const partCk = selCount>0 && selCount<filtered.length;

  const sortCol = c => { if(sortBy===c) setSortDir(d=>d==="asc"?"desc":"asc"); else{setSortBy(c);setSortDir("asc");} };
  const toggleAll = () => setSelectedIds(allCk ? [] : filtered.map(a=>a.id));
  const toggleOne = id => setSelectedIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const openAdd = () => { setForm({code:"",name:"",type:"Revenue",taxRate:"Tax on Sales (0%)",description:""}); setEditAcc(null); setModal("add"); };
  const openEdit = acc => { setForm({code:acc.code,name:acc.name,type:acc.type,taxRate:acc.taxRate,description:acc.desc}); setEditAcc(acc); setModal("add"); };

  const saveAcc = () => {
    if(!form.name.trim()) return toast$("Account name is required",true);
    if(!form.code.trim()) return toast$("Account code is required",true);
    if(editAcc) {
      setAccounts(p=>p.map(a=>a.id===editAcc.id?{...a,code:form.code,name:form.name,type:form.type,taxRate:form.taxRate,desc:form.description}:a));
      toast$("Account updated");
    } else {
      setAccounts(p=>[...p,{id:++nextId.current,code:form.code,name:form.name,desc:form.description,type:form.type,taxRate:form.taxRate,ytd:"0.00",status:"active"}]);
      toast$("Account added");
    }
    setModal(null);
  };

  const doArchive = () => {
    if(!selCount) return;
    setAccounts(p=>p.map(a=>selectedIds.includes(a.id)?{...a,status:"archived"}:a));
    toast$(`${selCount} account(s) archived`); setSelectedIds([]);
  };

  const doDelete = () => {
    setAccounts(p=>p.filter(a=>!selectedIds.includes(a.id)));
    toast$(`${selCount} account(s) deleted`); setSelectedIds([]); setModal(null);
  };

  const applyTax = () => {
    setAccounts(p=>p.map(a=>selectedIds.includes(a.id)?{...a,taxRate:newTax}:a));
    toast$(`Tax rate updated for ${selCount} account(s)`); setModal(null);
  };

  const exportCSV = () => {
    const csv = [["Code","Name","Type","Tax Rate","YTD"],...filtered.map(a=>[a.code,a.name,a.type,a.taxRate,a.ytd])]
      .map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const el=document.createElement("a"); el.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); el.download="chart_of_accounts.csv"; el.click();
    toast$("Exported");
  };

  const Arrow = ({col}) => sortBy!==col
    ? <span style={{color:"#bbb",fontSize:9,marginLeft:3}}>▲▼</span>
    : <span style={{color:"#1a7cb5",fontSize:9,marginLeft:3}}>{sortDir==="asc"?"▲":"▼"}</span>;

  const TH = ({col,label,right,w}) => (
    <th onClick={()=>sortCol(col)} style={{
      padding:"8px 12px",fontSize:12,fontWeight:700,color:"#1a7cb5",cursor:"pointer",
      background:"#eaf4fb",borderBottom:"2px solid #c6dff0",userSelect:"none",
      textAlign:right?"right":"left",whiteSpace:"nowrap",width:w
    }}>{label}<Arrow col={col}/></th>
  );

  return (
    <div style={{fontFamily:"Arial,Helvetica,sans-serif",background:"#fff",minHeight:"100vh",color:"#333"}}>
      <style>{`
        *{box-sizing:border-box}
        @keyframes toastSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        table{border-collapse:collapse;width:100%}
        tbody tr:hover td{background:#f0f8fd}
        .tb{background:#f5f5f5;border:1px solid #ccc;color:#444;padding:5px 13px;font-size:12px;border-radius:3px;cursor:pointer;font-weight:700;white-space:nowrap;line-height:1.4}
        .tb:hover{background:#e5e5e5;border-color:#aaa}
        .tb:disabled{opacity:.45;cursor:default;pointer-events:none}
        .ab{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;font-size:13px;font-weight:700;border-radius:4px;cursor:pointer;border:1px solid;white-space:nowrap;line-height:1.4;text-decoration:none}
        .ab-blue{background:#1a7cb5;border-color:#1567a0;color:#fff}
        .ab-blue:hover{background:#155f8d}
        .ab-white{background:#fff;border-color:#bbb;color:#444}
        .ab-white:hover{background:#f0f0f0}
        .nlink{color:#1a7cb5;font-weight:700;cursor:pointer;font-size:13px;background:none;border:none;padding:0;text-align:left}
        .nlink:hover{text-decoration:underline}
        @media(max-width:640px){
          .hide-sm{display:none!important}
          .topnav span{font-size:11px!important;padding-bottom:1px!important}
          .action-btns{flex-wrap:wrap!important}
          .toolbar-row{flex-wrap:wrap!important;gap:6px!important}
        }
      `}</style>

      {/* Top nav */}
      <div style={{background:"#1a7cb5",padding:"0 20px",display:"flex",alignItems:"center",height:46,gap:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginRight:28}}>
          <div style={{width:26,height:26,background:"#fff",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:"#1a7cb5",fontWeight:900,fontSize:13}}></span>
          </div>
          <span style={{color:"#fff",fontWeight:800,fontSize:15}}>Chart of Accounts</span>
        </div>
        <div className="topnav" style={{display:"flex",gap:0}}>
          {["Dashboard","Business","Accounting","Projects","Payroll"].map(n=>(
            <span key={n} style={{
              color:n==="Accounting"?"#fff":"rgba(255,255,255,.75)",
              fontSize:13,fontWeight:700,cursor:"pointer",padding:"0 12px",
              borderBottom:n==="Accounting"?"3px solid #fff":"3px solid transparent",
              paddingBottom:2,lineHeight:"43px"
            }}>{n}</span>
          ))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:12,alignItems:"center"}}>
          <span style={{color:"rgba(255,255,255,.8)",fontSize:12,cursor:"pointer"}}>Help</span>
          <div style={{width:28,height:28,background:"rgba(255,255,255,.2)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>JD</div>
        </div>
      </div>

      {/* Page header */}
      <div style={{padding:"16px 24px 0",borderBottom:"1px solid #e0e0e0",background:"#fff"}}>
        <div style={{fontSize:12,color:"#888",marginBottom:2}}>
          <span style={{color:"#1a7cb5",cursor:"pointer"}}>Settings</span>
          <span style={{margin:"0 6px",color:"#ccc"}}>›</span>
        </div>
        <h1 style={{margin:"0 0 14px",fontSize:24,fontWeight:700,color:"#1a1a1a",letterSpacing:"-0.02em"}}>Chart of accounts</h1>

        {/* Action buttons */}
        <div className="action-btns" style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          <button className="ab ab-blue" onClick={openAdd}>
            <span style={{fontSize:17,fontWeight:400,lineHeight:1}}>+</span> Add Account
          </button>
          <button className="ab ab-blue" onClick={()=>setModal("addbank")}>
            <span style={{fontSize:17,fontWeight:400,lineHeight:1}}>+</span> Add Bank Account
          </button>
          <button className="ab ab-white" onClick={()=>window.print()}>
            <span style={{background:"#c00",color:"#fff",fontSize:9,fontWeight:900,padding:"1px 3px",borderRadius:2,letterSpacing:"0.03em"}}>PDF</span>
            Print PDF
          </button>
          <button className="ab ab-white" onClick={()=>toast$("Import feature coming soon")}>Import</button>
          <button className="ab ab-white" onClick={exportCSV}>Export</button>
        </div>

        {/* Category tabs */}
        <div style={{display:"flex",gap:0,overflowX:"auto",borderBottom:"none",marginBottom:"-1px"}}>
          {Object.keys(TAB_FILTERS).map(tab=>(
            <button key={tab} onClick={()=>{setActiveTab(tab);setSelectedIds([]);setSearch("");setSearchInput("");}}
              style={{
                background:"none",border:"none",borderBottom: activeTab===tab?"3px solid #1a7cb5":"3px solid transparent",
                padding:"8px 14px",fontSize:13,fontWeight: activeTab===tab?700:400,
                color: activeTab===tab?"#1a7cb5":"#555",cursor:"pointer",
                whiteSpace:"nowrap",lineHeight:1.4
              }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* What's this link */}
      <div style={{padding:"8px 24px 0",background:"#fff"}}>
        <span style={{color:"#e07000",fontSize:12,fontWeight:700,cursor:"pointer"}}>What's this? 💬</span>
      </div>

      {/* Toolbar */}
      <div style={{padding:"10px 24px 0",background:"#fff"}}>
        <div className="toolbar-row" style={{
          display:"flex",alignItems:"center",gap:4,
          background:"#f5f5f5",border:"1px solid #d5d5d5",
          borderRadius:"4px 4px 0 0",padding:"7px 10px",flexWrap:"wrap"
        }}>
          <button className="tb" disabled={!selCount} onClick={()=>selCount&&setModal("delete")}>Delete</button>
          <button className="tb" disabled={!selCount} onClick={doArchive}>Archive</button>
          <button className="tb" disabled={!selCount} onClick={()=>selCount&&setModal("tax")}>Change Tax Rate</button>
          <span style={{fontSize:12,color:selCount?"#1a7cb5":"#999",marginLeft:6,fontWeight:selCount?700:400}}>
            {selCount?`${selCount} account${selCount>1?"s":""} selected`:"No accounts selected"}
          </span>
          <div style={{flex:1,minWidth:8}}/>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <input
              value={searchInput}
              onChange={e=>setSearchInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")setSearch(searchInput);}}
              style={{
                padding:"5px 9px",border:"1px solid #bbb",borderRadius:3,
                fontSize:13,width:200,outline:"none",color:"#333",background:"#fff"
              }}
            />
            <button onClick={()=>setSearch(searchInput)} style={{
              background:"#fff",border:"1px solid #1a7cb5",color:"#1a7cb5",
              padding:"5px 14px",fontSize:13,fontWeight:700,borderRadius:3,cursor:"pointer"
            }}>Search</button>
            {search&&<button onClick={()=>{setSearch("");setSearchInput("");}} style={{
              background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:12,padding:"4px 4px"
            }}>✕ Clear</button>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{padding:"0 24px 24px",background:"#fff"}}>
        <div style={{overflowX:"auto",border:"1px solid #c6dff0",borderRadius:"0 0 4px 4px"}}>
          <table style={{minWidth:600}}>
            <thead>
              <tr>
                <th style={{
                  padding:"8px 10px",background:"#eaf4fb",borderBottom:"2px solid #c6dff0",
                  width:38,verticalAlign:"middle"
                }}>
                  <input type="checkbox" checked={allCk}
                    ref={el=>{if(el)el.indeterminate=partCk;}}
                    onChange={toggleAll}
                    style={{width:14,height:14,accentColor:"#1a7cb5",cursor:"pointer"}}
                  />
                </th>
                <TH col="code"    label="Code"     w={90}/>
                <TH col="name"    label="Name"/>
                <TH col="type"    label="Type"     w={160}/>
                <TH col="taxRate" label="Tax Rate"  w={190}/>
                <TH col="ytd"     label="YTD"       right w={100}/>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={6} style={{padding:"36px 24px",textAlign:"center",color:"#aaa",fontSize:13}}>
                  {search?`No accounts found for "${search}".`:"No accounts in this category."}
                </td></tr>
              ) : filtered.map(acc=>(
                <tr key={acc.id}>
                  <td style={{padding:"9px 10px",borderBottom:"1px solid #e8edf2",verticalAlign:"top"}}>
                    <input type="checkbox" checked={selectedIds.includes(acc.id)} onChange={()=>toggleOne(acc.id)}
                      style={{width:14,height:14,accentColor:"#1a7cb5",cursor:"pointer",marginTop:2}}/>
                  </td>
                  <td style={{padding:"9px 12px",borderBottom:"1px solid #e8edf2",fontSize:13,color:"#555",verticalAlign:"top"}}>
                    {acc.code}
                  </td>
                  <td style={{padding:"9px 12px",borderBottom:"1px solid #e8edf2",verticalAlign:"top"}}>
                    <button className="nlink" onClick={()=>openEdit(acc)}>{acc.name}</button>
                    {acc.desc&&<div style={{fontSize:12,color:"#888",marginTop:2,lineHeight:1.5}}>{acc.desc}</div>}
                  </td>
                  <td style={{padding:"9px 12px",borderBottom:"1px solid #e8edf2",fontSize:13,color:"#333",verticalAlign:"top"}}>
                    {acc.type}
                  </td>
                  <td style={{padding:"9px 12px",borderBottom:"1px solid #e8edf2",fontSize:13,color:"#333",verticalAlign:"top"}}>
                    {acc.taxRate}
                  </td>
                  <td style={{padding:"9px 12px",borderBottom:"1px solid #e8edf2",fontSize:13,color:"#1a7cb5",fontWeight:600,textAlign:"right",verticalAlign:"top",whiteSpace:"nowrap"}}>
                    {acc.ytd}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length>0&&(
          <div style={{fontSize:12,color:"#aaa",marginTop:6,textAlign:"right"}}>
            {filtered.length} account{filtered.length!==1?"s":""} shown
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal==="add"&&(
        <Modal title={editAcc?"Edit Account":"Add Account"} onClose={()=>setModal(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FR label="Account Code" req><input style={iStyle} value={form.code} maxLength={10} onChange={e=>setForm(p=>({...p,code:e.target.value}))} placeholder="e.g. 200"/></FR>
            <FR label="Account Name" req><input style={iStyle} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Sales"/></FR>
          </div>
          <FR label="Account Type" req>
            <select style={selStyle} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
              {ACCOUNT_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </FR>
          <FR label="Tax Rate">
            <select style={selStyle} value={form.taxRate} onChange={e=>setForm(p=>({...p,taxRate:e.target.value}))}>
              {TAX_RATES.map(t=><option key={t}>{t}</option>)}
            </select>
          </FR>
          <FR label="Description">
            <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3} placeholder="Optional..." style={{...iStyle,resize:"vertical",fontFamily:"inherit"}}/>
          </FR>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,paddingTop:12,borderTop:"1px solid #eee",marginTop:4}}>
            <button className="ab ab-white" onClick={()=>setModal(null)}>Cancel</button>
            <button className="ab ab-blue" onClick={saveAcc}>{editAcc?"Save Changes":"Add Account"}</button>
          </div>
        </Modal>
      )}

      {/* Add Bank Account Modal */}
      {modal==="addbank"&&(
        <Modal title="Add Bank Account" onClose={()=>setModal(null)}>
          <p style={{fontSize:13,color:"#555",margin:"0 0 14px"}}>Connect a bank account to track transactions automatically.</p>
          {[["Account Code","e.g. 092",true],["Bank Name","e.g. National Bank",true],["Account Number","e.g. 00-1234-5678900-00",true],["Account Name","e.g. Business Cheque",true]].map(([l,pl,r])=>(
            <FR key={l} label={l} req={r}><input style={iStyle} placeholder={pl}/></FR>
          ))}
          <FR label="Currency">
            <select style={selStyle}><option>AUD</option><option>USD</option><option>GBP</option><option>EUR</option><option>NZD</option></select>
          </FR>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,paddingTop:12,borderTop:"1px solid #eee",marginTop:4}}>
            <button className="ab ab-white" onClick={()=>setModal(null)}>Cancel</button>
            <button className="ab ab-blue" onClick={()=>{setModal(null);toast$("Bank account added");}}>Add Bank Account</button>
          </div>
        </Modal>
      )}

      {/* Change Tax Rate Modal */}
      {modal==="tax"&&(
        <Modal title="Change Tax Rate" onClose={()=>setModal(null)} width={380}>
          <p style={{fontSize:13,color:"#555",margin:"0 0 14px"}}>
            Apply a new tax rate to <strong>{selCount}</strong> selected account{selCount>1?"s":""}.
          </p>
          <FR label="Tax Rate" req>
            <select style={selStyle} value={newTax} onChange={e=>setNewTax(e.target.value)}>
              {TAX_RATES.map(t=><option key={t}>{t}</option>)}
            </select>
          </FR>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,paddingTop:12,borderTop:"1px solid #eee",marginTop:4}}>
            <button className="ab ab-white" onClick={()=>setModal(null)}>Cancel</button>
            <button className="ab ab-blue" onClick={applyTax}>Apply</button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {modal==="delete"&&(
        <Modal title="Delete Accounts" onClose={()=>setModal(null)} width={400}>
          <p style={{fontSize:14,color:"#333",margin:"0 0 4px"}}>
            Are you sure you want to delete <strong>{selCount} account{selCount>1?"s":""}</strong>?
          </p>
          <p style={{fontSize:12,color:"#888",margin:"0 0 16px"}}>This action cannot be undone. Consider using Archive instead.</p>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,paddingTop:12,borderTop:"1px solid #eee"}}>
            <button className="ab ab-white" onClick={()=>setModal(null)}>Cancel</button>
            <button className="ab" style={{background:"#c00",borderColor:"#a00",color:"#fff"}} onClick={doDelete}>Delete</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast&&(
        <div style={{
          position:"fixed",bottom:22,right:22,zIndex:99999,
          background:toast.err?"#c0392b":"#27ae60",
          color:"#fff",padding:"9px 18px",borderRadius:4,
          fontSize:13,fontWeight:700,boxShadow:"0 4px 18px rgba(0,0,0,.2)",
          animation:"toastSlide .2s ease"
        }}>{toast.msg}</div>
      )}
    </div>
  );
}
