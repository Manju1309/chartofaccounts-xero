import { useState, useMemo, useRef, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

import ChartOfAccountsPage   from "@/components/ChartOfAccountsPage";
import InvoicesPage           from "@/components/InvoicesPage";
import NewInvoicePage         from "@/components/NewInvoicePage";
import TrialBalancePage       from "@/components/TrialBalancePage";
import SalesTaxReportPage from "@/components/SalesTaxReportPage";
import {
  NewRepeatingInvoicePage,
  NewCreditNotePage,
  SendStatementsPage,
  ImportInvoicesPage,
  ExportInvoicesPage,
  InvoiceRemindersPage,
} from "@/components/InvoiceSubPages";

// ─── Nav menu definitions ────────────────────────────────────────────────────
const NAV_MENUS = [
  { label: "Home", page: "home" },
  {
    label: "Sales",
    items: [
      { label: "Sales overview",      page: "sales-overview" },
      { label: "Invoices",            page: "invoices" },
      { label: "Online payments",     page: "online-payments" },
      { label: "Customers",           page: "customers" },
      { label: "Products & Services", page: "products-services" },
      { label: "Quotes",              page: "quotes" },
    ],
  },
  {
    label: "Purchases",
    items: [
      { label: "Purchases Overview", page: "purchases-overview" },
      { label: "Bills",              page: "bills" },
      { label: "Purchase Orders",    page: "purchase-orders" },
      { label: "Suppliers",          page: "suppliers" },
      { label: "Expense Claims",     page: "expense-claims" },
    ],
  },
  {
    label: "Reporting",
    items: [
      { label: "Trial Balance",    page: "trial-balance" },
      { label: "Profit & Loss",    page: "profit-loss" },
      { label: "Balance Sheet",    page: "balance-sheet" },
      { label: "Cash Flow",        page: "cash-flow" },
      { label: "Aged Receivables", page: "aged-receivables" },
      { label: "Aged Payables",    page: "aged-payables" },
      { label: "Budget Manager",   page: "budget-manager" },
      { label: "Sales Tax Report", page: "sales-tax-report" },
    ],
  },
  {
    label: "Payroll",
    items: [
      { label: "Pay Runs", page: "pay-runs" },
    ],
  },
  {
    label: "Accounting",
    items: [
      { label: "Chart of Accounts",    page: "chart-of-accounts" },
      { label: "Bank Accounts",        page: "bank-accounts" },
      { label: "Bank rules",           page: "bank-rules" },
      { label: "Accounting settings",  page: "accounting-settings" },
      { label: "Fixed Assets",         page: "fixed-assets" },
    ],
  },
  {
    label: "Tax",
    items: [
      { label: "Sales tax report", page: "sales-tax-report" },
      { label: "Tax Settings",     page: "tax-settings" },
    ],
  },
  {
    label: "Contacts",
    items: [
      { label: "All Contacts", page: "all-contacts" },
      { label: "Customers",    page: "contacts-customers" },
      { label: "Suppliers",    page: "contacts-suppliers" },
    ],
  },
  {
    label: "Projects",
    items: [
      { label: "All Projects",       page: "all-projects" },
      { label: "Time Entries",       page: "time-entries" },
      { label: "Staff time overview",page: "staff-time" },
      { label: "Project settings",   page: "project-settings" },
    ],
  },
];

// ─── Chevron icon ────────────────────────────────────────────────────────────
function ChevronDown({ size = 10, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ─── Desktop nav dropdown item ────────────────────────────────────────────────
function DesktopNavItem({ menu, isActive, index, openMenu, setOpenMenu, onNavigate }) {
  const ref    = useRef(null);
  const isOpen = openMenu === index;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, setOpenMenu]);

  const toggle = (e) => {
    e.stopPropagation();
    if (!menu.items) { onNavigate(menu.page || "home"); return; }
    setOpenMenu(prev => prev === index ? null : index);
  };

  return (
    <div ref={ref} style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
      <button
        onClick={toggle}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#fff", fontSize: 13, fontWeight: isActive ? 700 : 500,
          padding: "0 11px", height: "100%",
          borderBottom: isActive
            ? "3px solid #fff"
            : isOpen ? "3px solid rgba(255,255,255,.45)" : "3px solid transparent",
          display: "flex", alignItems: "center", gap: 5,
          whiteSpace: "nowrap", outline: "none",
          opacity: isActive ? 1 : 0.85, transition: "opacity .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.opacity = "0.85"; }}
      >
        {menu.label}
        {menu.items && (
          <span style={{
            display: "inline-flex", alignItems: "center",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .18s ease",
          }}>
            <ChevronDown size={9} color="#fff" />
          </span>
        )}
      </button>

      {isOpen && menu.items && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", top: "calc(100% + 1px)", left: 0, zIndex: 9999,
            background: "#fff", borderRadius: "0 0 8px 8px",
            boxShadow: "0 12px 36px rgba(0,0,0,.18)",
            minWidth: 220, border: "1px solid #e0e0e0",
            borderTop: "3px solid #1a7cb5",
            animation: "ddFadeIn .15s ease",
          }}
        >
          {menu.items.map((item, i) => (
            <button
              key={i}
              onClick={() => { setOpenMenu(null); onNavigate(item.page); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "10px 16px", background: "transparent",
                border: "none", cursor: "pointer",
                borderBottom: i < menu.items.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f5fafd"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{item.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Placeholder for unbuilt pages ───────────────────────────────────────────
const PAGE_META = {
  "home":              { title: "Home",               breadcrumb: null },
  "sales-overview":    { title: "Sales Overview",     breadcrumb: null },
  "online-payments":   { title: "Online Payments",    breadcrumb: "Sales overview" },
  "customers":         { title: "Customers",          breadcrumb: "Sales overview" },
  "products-services": { title: "Products & Services",breadcrumb: "Sales overview" },
  "quotes":            { title: "Quotes",             breadcrumb: "Sales overview" },
  "purchases-overview":{ title: "Purchases Overview", breadcrumb: null },
  "bills":             { title: "Bills",              breadcrumb: "Purchases Overview" },
  "purchase-orders":   { title: "Purchase Orders",    breadcrumb: "Purchases Overview" },
  "suppliers":         { title: "Suppliers",          breadcrumb: "Purchases Overview" },
  "expense-claims":    { title: "Expense Claims",     breadcrumb: "Purchases Overview" },
  "profit-loss":       { title: "Profit & Loss",      breadcrumb: "Reporting" },
  "balance-sheet":     { title: "Balance Sheet",      breadcrumb: "Reporting" },
  "cash-flow":         { title: "Cash Flow",          breadcrumb: "Reporting" },
  "aged-receivables":  { title: "Aged Receivables",   breadcrumb: "Reporting" },
  "aged-payables":     { title: "Aged Payables",      breadcrumb: "Reporting" },
  "budget-manager":    { title: "Budget Manager",     breadcrumb: "Reporting" },
  "pay-runs":          { title: "Pay Runs",           breadcrumb: "Payroll" },
  "bank-accounts":     { title: "Bank Accounts",      breadcrumb: "Accounting" },
  "bank-rules":        { title: "Bank Rules",         breadcrumb: "Accounting" },
  "accounting-settings":{ title: "Accounting Settings",breadcrumb: "Accounting" },
  "fixed-assets":      { title: "Fixed Assets",       breadcrumb: "Accounting" },
  "sales-tax-report":  { title: "Sales Tax Report",   breadcrumb: "Tax" },
  "tax-settings":      { title: "Tax Settings",       breadcrumb: "Tax" },
  "all-contacts":      { title: "All Contacts",       breadcrumb: "Contacts" },
  "contacts-customers":{ title: "Customers",          breadcrumb: "Contacts" },
  "contacts-suppliers":{ title: "Suppliers",          breadcrumb: "Contacts" },
  "all-projects":      { title: "All Projects",       breadcrumb: "Projects" },
  "time-entries":      { title: "Time Entries",       breadcrumb: "Projects" },
  "staff-time":        { title: "Staff Time Overview",breadcrumb: "Projects" },
  "project-settings":  { title: "Project Settings",  breadcrumb: "Projects" },
};

function PlaceholderPage({ page }) {
  const cfg = PAGE_META[page] || { title: page, breadcrumb: null };
  return (
    <div style={{ padding: "20px 24px", fontFamily: "Arial,Helvetica,sans-serif" }}>
      {cfg.breadcrumb && (
        <p style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
          <span style={{ color: "#1a7cb5" }}>{cfg.breadcrumb}</span>
          <span style={{ margin: "0 5px", color: "#ccc" }}>›</span>
        </p>
      )}
      <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>{cfg.title}</h1>
      <div style={{
        border: "1px solid #e0e0e0", borderRadius: 8, padding: "56px 32px",
        textAlign: "center", background: "#fafafa",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#888", margin: "0 0 6px" }}>{cfg.title}</p>
        <p style={{ fontSize: 13, color: "#bbb", margin: 0 }}>This page is ready to be built out.</p>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentPage,    setCurrentPage]    = useState("chart-of-accounts");
  const [openMenu,       setOpenMenu]       = useState(null);
  const [mobileNavOpen,  setMobileNavOpen]  = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);

  // Close mobile nav on navigate
  const navigate = (page) => {
    setCurrentPage(page);
    setMobileNavOpen(false);
    setOpenMenu(null);
    window.scrollTo(0, 0);
  };

  // Which top-level nav tab is active
  const activeMenuIndex = useMemo(() => {
    // Pages that belong to "Sales" group (including sub-pages)
    const salesPages = ["invoices","new-invoice","new-repeating-invoice","new-credit-note",
      "send-statements","import-invoices","export-invoices","invoice-reminders",
      "sales-overview","online-payments","customers","products-services","quotes"];
    if (salesPages.includes(currentPage)) return 1;

     const reportingPages = ["trial-balance","profit-loss","balance-sheet","cash-flow",
      "aged-receivables","aged-payables","budget-manager","sales-tax-report"];
    if (reportingPages.includes(currentPage)) return 3;


    return NAV_MENUS.findIndex(m =>
      m.items && m.items.some(i => i.page === currentPage)
    );
  }, [currentPage]);

  // ─── Page renderer ──────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (currentPage) {
      case "chart-of-accounts":      return <ChartOfAccountsPage   onNavigate={navigate} />;
      case "invoices":               return <InvoicesPage           onNavigate={navigate} />;
      case "new-invoice":            return <NewInvoicePage         onNavigate={navigate} />;
      case "new-repeating-invoice":  return <NewRepeatingInvoicePage onNavigate={navigate} />;
      case "new-credit-note":        return <NewCreditNotePage      onNavigate={navigate} />;
      case "send-statements":        return <SendStatementsPage     onNavigate={navigate} />;
      case "import-invoices":        return <ImportInvoicesPage     onNavigate={navigate} />;
      case "export-invoices":        return <ExportInvoicesPage     onNavigate={navigate} />;
      case "invoice-reminders":      return <InvoiceRemindersPage   onNavigate={navigate} />;
      case "trial-balance":          return <TrialBalancePage       onNavigate={navigate} />;
      case "sales-tax-report":       return <SalesTaxReportPage     onNavigate={navigate} />;
      default:                       return <PlaceholderPage page={currentPage} />;
    }
  };

  return (
    <TooltipProvider>
      <div style={{ fontFamily: "Arial,Helvetica,sans-serif", background: "#fff", minHeight: "100vh" }}>
        <style>{`
          @keyframes ddFadeIn {
            from { opacity:0; transform:translateY(-6px); }
            to   { opacity:1; transform:translateY(0); }
          }
          @keyframes slideDown {
            from { opacity:0; max-height:0; }
            to   { opacity:1; max-height:500px; }
          }
          .page-size-sel {
            padding:3px 22px 3px 7px; font-size:12px; border:1px solid #ccc;
            border-radius:3px; background:#fff; cursor:pointer; outline:none;
            appearance:none;
            background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23666'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E");
            background-repeat:no-repeat; background-position:right 4px center; background-size:13px;
          }
          .mob-menu-section { border-bottom:1px solid rgba(255,255,255,.12); }
          .mob-menu-toggle  {
            width:100%; background:none; border:none; cursor:pointer;
            padding:12px 20px; display:flex; align-items:center;
            justify-content:space-between; color:#fff; font-size:14px;
            font-weight:500; text-align:left;
          }
          .mob-menu-toggle.active-menu { background:rgba(255,255,255,.1); font-weight:700; }
          .mob-sub-item {
            display:block; width:100%; padding:9px 20px 9px 36px;
            background:none; border:none; text-align:left;
            color:rgba(255,255,255,.85); font-size:13px; cursor:pointer;
            border-bottom:1px solid rgba(255,255,255,.06);
          }
          .mob-sub-item:hover, .mob-sub-item.active-sub {
            background:rgba(255,255,255,.1); color:#fff;
          }
          .mob-sub-item.active-sub { font-weight:700; }
          @media(max-width:768px) {
            .hide-mobile  { display:none !important; }
            .desktop-nav  { display:none !important; }
            .mob-hamburger{ display:flex !important; }
          }
          @media(min-width:769px) {
            .mob-hamburger{ display:none !important; }
          }
        `}</style>

        {/* ══════════════════════════════════════════════════
            NAVBAR  – rendered once, shared by ALL pages
        ══════════════════════════════════════════════════ */}
        <header style={{
          background: "#1a7cb5", height: 48,
          display: "flex", alignItems: "center",
          padding: "0 16px", position: "sticky", top: 0, zIndex: 200,
          boxShadow: "0 2px 6px rgba(0,0,0,.18)", overflow: "visible",
        }}>
          {/* Logo */}
          <div
            onClick={() => navigate("chart-of-accounts")}
            style={{
              width: 30, height: 30, background: "#fff", borderRadius: 4,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginRight: 8, cursor: "pointer",
            }}
          >
            <span style={{ color: "#1a7cb5", fontWeight: 900, fontSize: 14 }}>A</span>
          </div>
          <span
            onClick={() => navigate("chart-of-accounts")}
            style={{ color: "#fff", fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", marginRight: 12, cursor: "pointer" }}
          >
            Accounts
          </span>

          {/* Desktop nav */}
          <nav
            className="desktop-nav"
            style={{ display: "flex", height: "100%", flex: 1, overflow: "visible" }}
          >
            {NAV_MENUS.map((menu, i) => (
              <DesktopNavItem
                key={i}
                index={i}
                menu={menu}
                isActive={i === activeMenuIndex}
                openMenu={openMenu}
                setOpenMenu={setOpenMenu}
                onNavigate={navigate}
              />
            ))}
          </nav>

          {/* Right side */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span className="hide-mobile" style={{ color: "rgba(255,255,255,.7)", fontSize: 12, cursor: "pointer" }}>Help</span>
            <div style={{
              width: 30, height: 30, background: "rgba(255,255,255,.2)",
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#fff", fontSize: 12,
              fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}>JD</div>

            {/* Hamburger */}
            <button
              className="mob-hamburger"
              onClick={() => setMobileNavOpen(o => !o)}
              style={{
                background: "none", border: "none", color: "#fff",
                cursor: "pointer", padding: 4, display: "none",
                alignItems: "center",
              }}
            >
              {mobileNavOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════
            MOBILE DRAWER
        ══════════════════════════════════════════════════ */}
        {mobileNavOpen && (
          <div style={{
            background: "#1567a0",
            borderTop: "1px solid rgba(255,255,255,.15)",
            maxHeight: "80vh", overflowY: "auto",
            position: "sticky", top: 48, zIndex: 199,
          }}>
            {NAV_MENUS.map((menu, i) => (
              <div key={i} className="mob-menu-section">
                <button
                  className={`mob-menu-toggle${i === activeMenuIndex ? " active-menu" : ""}`}
                  onClick={() => {
                    if (!menu.items) { navigate(menu.page || "home"); return; }
                    setMobileExpanded(mobileExpanded === i ? null : i);
                  }}
                >
                  <span>{menu.label}</span>
                  {menu.items && (
                    <span style={{
                      transform: mobileExpanded === i ? "rotate(180deg)" : "none",
                      transition: "transform .2s", opacity: .7,
                    }}>
                      <ChevronDown size={12} color="#fff" />
                    </span>
                  )}
                </button>
                {mobileExpanded === i && menu.items && (
                  <div style={{ animation: "slideDown .2s ease" }}>
                    {menu.items.map((item, j) => (
                      <button
                        key={j}
                        className={`mob-sub-item${item.page === currentPage ? " active-sub" : ""}`}
                        onClick={() => navigate(item.page)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div style={{ padding: "12px 20px", display: "flex", gap: 16, borderTop: "1px solid rgba(255,255,255,.15)" }}>
              <button style={{ background: "none", border: "none", color: "rgba(255,255,255,.7)", fontSize: 13, cursor: "pointer" }}>Help</button>
              <button style={{ background: "none", border: "none", color: "rgba(255,255,255,.7)", fontSize: 13, cursor: "pointer" }}>Settings</button>
              <button style={{ background: "none", border: "none", color: "rgba(255,255,255,.7)", fontSize: 13, cursor: "pointer" }}>Sign out</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            PAGE CONTENT
        ══════════════════════════════════════════════════ */}
        <main>
          {renderPage()}
        </main>

        <Toaster />
      </div>
    </TooltipProvider>
  );
}
