import type { LucideIcon } from "lucide-react";
import {
    AlertTriangle,
    CheckSquare,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    Mail,
    ShieldCheck,
    Users,
    Wifi,
    Zap,
} from "lucide-react";

export interface MarketingFeature {
    title: string;
    description: string;
    icon: LucideIcon;
    accent: string;
    badge: string;
}

export interface FeatureCategory {
    title: string;
    description: string;
    items: string[];
}

export const marketingFeatures: MarketingFeature[] = [
    {
        title: "AI data extraction",
        description: "Extract vendor names, invoice numbers, dates, totals, and line items from PDFs and images without manual typing.",
        icon: Zap,
        accent: "bg-primary-50 text-primary-600",
        badge: "Core AI",
    },
    {
        title: "Duplicate detection",
        description: "Catch exact and fuzzy duplicates before approval using multi-signal matching and confidence scoring.",
        icon: ShieldCheck,
        accent: "bg-red-50 text-red-600",
        badge: "Risk control",
    },
    {
        title: "Gmail import",
        description: "Connect Gmail with OAuth and import invoice attachments directly from the inbox without forwarding rules.",
        icon: Mail,
        accent: "bg-blue-50 text-blue-600",
        badge: "Intake",
    },
    {
        title: "Approval workflow",
        description: "Review, approve, reject, and track invoices in a shared approval queue with clear ownership.",
        icon: CheckSquare,
        accent: "bg-amber-50 text-amber-600",
        badge: "Workflow",
    },
    {
        title: "Team roles",
        description: "Invite teammates and control access with Owner, Admin, Member, and Viewer permissions.",
        icon: Users,
        accent: "bg-violet-50 text-violet-600",
        badge: "Collaboration",
    },
    {
        title: "Exports for accounting",
        description: "Export invoice data to CSV, Excel, PDF, QuickBooks IIF, and Xero-ready CSV formats.",
        icon: Download,
        accent: "bg-green-50 text-green-600",
        badge: "Output",
    },
    {
        title: "Side-by-side review",
        description: "Compare the original invoice file with extracted fields and correct values before final approval.",
        icon: Eye,
        accent: "bg-cyan-50 text-cyan-600",
        badge: "Review",
    },
    {
        title: "Live processing updates",
        description: "See uploads, processing results, duplicate alerts, and approval changes in real time.",
        icon: Wifi,
        accent: "bg-slate-100 text-slate-700",
        badge: "Realtime",
    },
    {
        title: "Line-item capture",
        description: "Capture structured table rows with quantities, unit prices, and subtotals instead of flat OCR text.",
        icon: FileText,
        accent: "bg-emerald-50 text-emerald-600",
        badge: "Structure",
    },
    {
        title: "QuickBooks and Xero import",
        description: "Generate accounting-friendly output so finance teams spend less time reformatting and re-entering data.",
        icon: FileSpreadsheet,
        accent: "bg-lime-50 text-lime-600",
        badge: "Accounting",
    },
    {
        title: "Exception visibility",
        description: "See failed processing, low-confidence fields, and flagged duplicates before they become downstream issues.",
        icon: AlertTriangle,
        accent: "bg-orange-50 text-orange-600",
        badge: "Ops",
    },
];

export const featureCategories: FeatureCategory[] = [
    {
        title: "Capture",
        description: "Bring invoices into the system quickly from files or inboxes.",
        items: [
            "Upload PDF and image invoices",
            "Connect Gmail with secure OAuth",
            "Preview attachments before import",
            "Process now or later",
        ],
    },
    {
        title: "Extract",
        description: "Turn unstructured invoice files into usable accounting data.",
        items: [
            "Vendor, invoice number, date, and totals",
            "Structured line-item extraction",
            "Confidence-aware AI output",
            "Inline corrections before approval",
        ],
    },
    {
        title: "Control",
        description: "Reduce errors and keep finance workflows accountable.",
        items: [
            "Duplicate detection and review",
            "Approval and rejection queue",
            "Role-based permissions",
            "Activity visibility across the workspace",
        ],
    },
    {
        title: "Export",
        description: "Move clean data into the tools your team already uses.",
        items: [
            "CSV, Excel, and PDF exports",
            "QuickBooks IIF output",
            "Xero-ready CSV output",
            "Audit-friendly review flow before export",
        ],
    },
];
