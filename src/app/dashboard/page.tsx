"use client";

import { Suspense, useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import PaymentGuard from "@/components/PaymentGuard";
import { useOrg } from "@/lib/org-context";
import { api } from "@/services/api";
import { useInvoiceSocket } from "@/hooks/useInvoiceSocket";
import { toast } from "sonner";
import type {
    DashboardData,
    MonthlyTrendPoint,
    StatusBreakdownItem,
} from "@/types/dashboard";
import type { Invoice } from "@/types/invoice";
import {
    TrendingUp, TrendingDown, Minus,
    FileText, CheckCircle2, Clock, XCircle, Copy,
    BarChart3, Loader2,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
}

function fmtCount(n: number): string {
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

// ─── Trend Chart ─────────────────────────────────────────────────────────────

type TrendMetric = "total_amount" | "approved_amount" | "count";

function TrendChart({ data, metric }: { data: MonthlyTrendPoint[]; metric: TrendMetric }) {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; point: MonthlyTrendPoint } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const W = 700, H = 200, PL = 56, PR = 16, PT = 16, PB = 40;
    const innerW = W - PL - PR;
    const innerH = H - PT - PB;

    const values = data.map((d) => (metric === "count" ? d.count : metric === "total_amount" ? d.total_amount : d.approved_amount));
    const maxVal = Math.max(...values, 1);
    const minVal = 0;

    const xOf = (i: number) => PL + (i / (data.length - 1 || 1)) * innerW;
    const yOf = (v: number) => PT + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

    function buildPath(pts: [number, number][]): string {
        if (pts.length === 0) return "";
        let d = `M ${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1];
            const [x1, y1] = pts[i];
            const cx = (x0 + x1) / 2;
            d += ` C ${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
        }
        return d;
    }

    const points: [number, number][] = data.map((d, i) => [xOf(i), yOf(values[i])]);
    const linePath = buildPath(points);
    const areaPath = points.length > 0
        ? `${linePath} L ${points[points.length - 1][0]} ${PT + innerH} L ${points[0][0]} ${PT + innerH} Z`
        : "";

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
        const v = minVal + t * (maxVal - minVal);
        return { y: PT + innerH - t * innerH, label: metric === "count" ? Math.round(v).toString() : fmt(v) };
    });

    function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const scaleX = W / rect.width;
        const mx = (e.clientX - rect.left) * scaleX;
        const idx = Math.round(((mx - PL) / innerW) * (data.length - 1));
        const clamped = Math.max(0, Math.min(data.length - 1, idx));
        setTooltip({ x: xOf(clamped), y: yOf(values[clamped]), point: data[clamped] });
    }

    return (
        <div className="relative">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTooltip(null)}
            >
                <defs>
                    <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Y-axis grid lines */}
                {yTicks.map((t, i) => (
                    <g key={i}>
                        <line x1={PL} y1={t.y} x2={W - PR} y2={t.y} stroke="#e4e4e7" strokeWidth="1" />
                        <text x={PL - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="#71717a">{t.label}</text>
                    </g>
                ))}

                {/* X-axis labels */}
                {data.map((d, i) => {
                    const skip = data.length > 8 ? (i % 2 !== 0) : false;
                    if (skip) return null;
                    return (
                        <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#71717a">
                            {d.label.split(" ")[0]}
                        </text>
                    );
                })}

                {/* Area fill */}
                {areaPath && <path d={areaPath} fill="url(#area-grad)" />}

                {/* Line */}
                {linePath && (
                    <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                )}

                {/* Dots */}
                {points.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                ))}

                {/* Tooltip crosshair */}
                {tooltip && (
                    <>
                        <line x1={tooltip.x} y1={PT} x2={tooltip.x} y2={PT + innerH} stroke="#d4d4d8" strokeWidth="1" strokeDasharray="4 2" />
                        <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="#6366f1" stroke="#fff" strokeWidth="2" />
                    </>
                )}
            </svg>

            {/* Floating tooltip */}
            {tooltip && (() => {
                const pct = W > 0 ? tooltip.x / W : 0;
                return (
                    <div
                        className={`absolute top-2 pointer-events-none bg-white border border-slate-200 rounded-lg p-2.5 text-xs shadow-lg z-10 ${pct > 0.7 ? "right-2" : "left-1/2 -translate-x-1/2"}`}
                        style={{ maxWidth: 160 }}
                    >
                        <p className="text-slate-600 font-medium mb-1">{tooltip.point.label}</p>
                        <p className="text-slate-900 font-semibold">{metric === "count" ? `${tooltip.point.count} invoices` : metric === "total_amount" ? fmt(tooltip.point.total_amount) : fmt(tooltip.point.approved_amount)}</p>
                        <p className="text-slate-500 mt-0.5">{tooltip.point.count} invoice{tooltip.point.count !== 1 ? "s" : ""}</p>
                    </div>
                );
            })()}
        </div>
    );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ data }: { data: StatusBreakdownItem[] }) {
    const [hovered, setHovered] = useState<string | null>(null);

    const total = data.reduce((s, d) => s + d.count, 0);
    if (total === 0) return (
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
    );

    const R = 70, r = 45, CX = 100, CY = 100;
    let angle = -Math.PI / 2;

    const arcs = data.map((item) => {
        const slice = (item.count / total) * 2 * Math.PI;
        const x1 = CX + R * Math.cos(angle);
        const y1 = CY + R * Math.sin(angle);
        angle += slice;
        const x2 = CX + R * Math.cos(angle);
        const y2 = CY + R * Math.sin(angle);
        const ix1 = CX + r * Math.cos(angle - slice);
        const iy1 = CY + r * Math.sin(angle - slice);
        const ix2 = CX + r * Math.cos(angle);
        const iy2 = CY + r * Math.sin(angle);
        const large = slice > Math.PI ? 1 : 0;
        return {
            ...item,
            path: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`,
        };
    });

    const hItem = hovered ? data.find((d) => d.status === hovered) : null;

    return (
        <div className="flex items-center gap-6">
            <svg viewBox="0 0 200 200" className="w-40 h-40 shrink-0">
                {arcs.map((arc) => (
                    <path
                        key={arc.status}
                        d={arc.path}
                        fill={arc.color}
                        opacity={hovered && hovered !== arc.status ? 0.35 : 1}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="transition-opacity duration-150 cursor-pointer"
                        onMouseEnter={() => setHovered(arc.status)}
                        onMouseLeave={() => setHovered(null)}
                    />
                ))}
                {/* Center label */}
                <text x={CX} y={CY - 8} textAnchor="middle" fontSize="22" fontWeight="700" fill="#0a0a0b">
                    {hItem ? hItem.count : total}
                </text>
                <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9" fill="#71717a">
                    {hItem ? hItem.label : "total"}
                </text>
            </svg>

            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                {data.map((item) => (
                    <div
                        key={item.status}
                        className={`flex items-center gap-2 cursor-pointer transition-opacity ${hovered && hovered !== item.status ? "opacity-40" : ""}`}
                        onMouseEnter={() => setHovered(item.status)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
                        <span className="text-xs text-slate-500 truncate flex-1">{item.label}</span>
                        <span className="text-xs font-semibold text-slate-900 ml-auto shrink-0">{item.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
    title: string;
    value: string;
    pct: number | null;
    icon: React.ReactNode;
    iconBg: string;
    href?: string;
}

function MetricCard({ title, value, pct, icon, iconBg, href }: MetricCardProps) {
    const inner = (
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:bg-slate-50 transition-all duration-150 group">
            <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1.5 font-heading">{value}</p>
            {pct !== null ? (
                <div className={`flex items-center gap-1 text-[11px] font-medium ${pct > 0 ? "text-green-600" : pct < 0 ? "text-red-600" : "text-slate-400"}`}>
                    {pct > 0 ? <TrendingUp size={11} /> : pct < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                    <span>{Math.abs(pct)}% vs last period</span>
                </div>
            ) : (
                <p className="text-[11px] text-slate-400">No prior data</p>
            )}
        </div>
    );

    return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Range = "7d" | "30d" | "90d";
const RANGES: { label: string; value: Range }[] = [
    { label: "7 days",  value: "7d" },
    { label: "30 days", value: "30d" },
    { label: "90 days", value: "90d" },
];

export default function DashboardPage() {
    return (
        <Suspense>
            <PaymentGuard>
                <DashboardInner />
            </PaymentGuard>
        </Suspense>
    );
}

function DashboardInner() {
    const searchParams = useSearchParams();
    const [range, setRange] = useState<Range>("30d");
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trendMetric, setTrendMetric] = useState<TrendMetric>("total_amount");
    const { org: currentOrg } = useOrg();
    const demoToastShown = useRef(false);

    const rangeRef = useRef(range);
    rangeRef.current = range;

    const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchDashboard = useCallback((r: Range, silent = false) => {
        if (!silent) { setLoading(true); setError(null); }
        api.get<DashboardData>(`/api/invoices/dashboard/?range=${r}`)
            .then((res) => setData(res.data))
            .catch((err) => {
                if (!silent) {
                    const msg = err.response?.data?.detail ?? "Failed to load dashboard.";
                    setError(msg);
                }
            })
            .finally(() => { if (!silent) setLoading(false); });
    }, []);

    useEffect(() => {
        fetchDashboard(range);
    }, [range, fetchDashboard]);

    useEffect(() => {
        if (searchParams.get("demo") !== "1" || demoToastShown.current) return;
        demoToastShown.current = true;
        toast.info("You're viewing a demo workspace with sample invoices.", {
            description: currentOrg?.name
                ? `${currentOrg.name} is preloaded for exploration.`
                : "This workspace is preloaded for exploration.",
        });
        window.history.replaceState({}, "", "/dashboard");
    }, [searchParams, currentOrg]);

    function scheduleRefresh() {
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => {
            fetchDashboard(rangeRef.current, true);
        }, 800);
    }

    useEffect(() => () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); }, []);

    useInvoiceSocket((updated: Invoice) => {
        switch (updated.status) {
            case "UPLOADED":
                toast.info(`New invoice detected: "${updated.original_filename}"`, {
                    description: "Queued for AI extraction.",
                });
                break;
            case "PROCESSED":
                toast.success(`Invoice processed: "${updated.original_filename}"`);
                break;
            case "PROCESSING_FAILED":
                toast.error(`Processing failed: "${updated.original_filename}"`);
                break;
            case "APPROVED":
                toast.success(`Invoice approved: "${updated.original_filename}"`);
                break;
        }
        scheduleRefresh();
    });

    if (loading && !data) {
        return (
            <div className="flex-1 flex min-h-0">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <AppHeader title="Dashboard" />
                    <main className="flex-1 space-y-6 p-4 pb-24 md:p-6 md:pb-6">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                                    <div className="h-2.5 bg-slate-100 rounded w-2/3 mb-4" />
                                    <div className="h-6 bg-slate-100 rounded w-1/2 mb-2" />
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const s = data?.summary;

    return (
        <div className="flex-1 flex min-h-0">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <AppHeader title="Dashboard" />

                <main className="flex-1 overflow-y-auto space-y-6 p-4 pb-24 md:p-6 md:pb-6">

                    {/* ── Range selector ── */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <p className="text-[13px] text-slate-500">
                            {s ? `${fmtCount(s.all_time_total)} invoices all time` : "Loading…"}
                        </p>
                        <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-1">
                            {RANGES.map((r) => (
                                <button
                                    key={r.value}
                                    onClick={() => setRange(r.value)}
                                    className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                                        range === r.value
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Error state ── */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* ── Skeleton / loading ── */}
                    {loading && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                                    <div className="h-2.5 bg-slate-100 rounded w-2/3 mb-4" />
                                    <div className="h-6 bg-slate-100 rounded w-1/2 mb-2" />
                                    <div className="h-2 bg-slate-100 rounded w-3/4" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && data && (
                        <>
                            {/* ── Metric cards ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                <MetricCard
                                    title="Total Revenue"
                                    value={fmt(s!.total_amount)}
                                    pct={s!.pct_change_amount}
                                    icon={<TrendingUp size={16} className="text-primary-600" />}
                                    iconBg="bg-primary-50"
                                />
                                <MetricCard
                                    title="Total Invoices"
                                    value={fmtCount(s!.total_invoices)}
                                    pct={s!.pct_change_invoices}
                                    icon={<FileText size={16} className="text-blue-600" />}
                                    iconBg="bg-blue-50"
                                />
                                <MetricCard
                                    title="Approved"
                                    value={fmt(s!.approved_amount)}
                                    pct={s!.pct_change_approved}
                                    icon={<CheckCircle2 size={16} className="text-green-600" />}
                                    iconBg="bg-green-50"
                                    href="/invoices?status=APPROVED"
                                />
                                <MetricCard
                                    title="Pending Review"
                                    value={fmtCount(s!.pending_review_count)}
                                    pct={null}
                                    icon={<Clock size={16} className="text-orange-600" />}
                                    iconBg="bg-orange-50"
                                    href="/invoices?status=PENDING_REVIEW"
                                />
                                <MetricCard
                                    title="Failed"
                                    value={fmtCount(s!.failed_count)}
                                    pct={null}
                                    icon={<XCircle size={16} className="text-red-600" />}
                                    iconBg="bg-red-50"
                                    href="/invoices?status=PROCESSING_FAILED"
                                />
                                <MetricCard
                                    title="Duplicates"
                                    value={fmtCount(s!.duplicates_flagged)}
                                    pct={null}
                                    icon={<Copy size={16} className="text-amber-600" />}
                                    iconBg="bg-amber-50"
                                    href="/invoices?duplicates=true"
                                />
                            </div>

                            {/* ── Charts row ── */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                {/* Trend chart */}
                                <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 size={14} className="text-slate-400" />
                                            <h2 className="text-[13px] font-semibold text-slate-900">Revenue Trend</h2>
                                        </div>
                                        <div className="flex gap-0.5 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                                            {(["total_amount", "approved_amount", "count"] as TrendMetric[]).map((m) => (
                                                <button
                                                    key={m}
                                                    onClick={() => setTrendMetric(m)}
                                                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                                                        trendMetric === m
                                                            ? "bg-white text-slate-900 shadow-sm"
                                                            : "text-slate-500 hover:text-slate-700"
                                                    }`}
                                                >
                                                    {m === "total_amount" ? "Total" : m === "approved_amount" ? "Approved" : "Count"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <TrendChart data={data.monthly_trend} metric={trendMetric} />
                                </div>

                                {/* Donut chart */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <h2 className="text-[13px] font-semibold text-slate-900 mb-4">Status Breakdown</h2>
                                    <DonutChart data={data.status_breakdown} />
                                </div>
                            </div>

                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
