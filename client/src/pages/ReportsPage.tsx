import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = 'CASH' | 'POS' | 'TRANSFER';
type ReportTab = 'daily' | 'inventory';

interface ReportBooking {
  id: string;
  room: { number: number };
  price: number;
  note?: string | null;
  createdAt: string;
  payment?: { amount: number; method: PaymentMethod; status: 'PAID' | 'PENDING' } | null;
}

interface ReportSale {
  id: string;
  item: { name: string; category: 'DRINK' | 'CONDOM' };
  quantity: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

interface DailyReport {
  date: string;
  summary: {
    totalRevenue: number;
    roomRevenue: number;
    salesRevenue: number;
    bookingsCount: number;
    salesCount: number;
  };
  paymentBreakdown: Record<PaymentMethod, number>;
  salesByCategory: Record<'DRINK' | 'CONDOM', number>;
  bookings: ReportBooking[];
  sales: ReportSale[];
  isLocked: boolean;
  confirmedBy?: { id: string; name: string; role: string } | null;
}

interface InventoryReportItem {
  id: string;
  name: string;
  category: 'DRINK' | 'CONDOM';
  currentStock: number;
  price: number;
  imageUrl?: string | null;
  totalQtySold: number;
  totalRevenue: number;
  transactionCount: number;
  isLowStock: boolean;
  isCritical: boolean;
}

interface InventoryReport {
  summary: {
    totalItems: number;
    lowStockCount: number;
    criticalCount: number;
    outOfStockCount: number;
    totalInventoryValue: number;
    totalAllTimeRevenue: number;
  };
  items: InventoryReportItem[];
  bestSellers: InventoryReportItem[];
  lowStockItems: InventoryReportItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (amount: number) => {
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  note,
  icon,
  tone,
}: {
  title: string;
  value: string;
  note: string;
  icon: string;
  tone: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111318]/50">
      <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold leading-tight break-all text-gray-900 dark:text-white">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className={`${tone} text-sm font-bold flex items-center gap-1`}>
          <span className="material-symbols-outlined text-sm">{icon}</span>
          {note}
        </span>
      </div>
    </div>
  );
}

function StockBar({ current, sold }: { current: number; sold: number }) {
  const total = current + sold;
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  const color =
    current === 0
      ? 'bg-red-500'
      : current <= 5
      ? 'bg-rose-500'
      : current <= 10
      ? 'bg-amber-500'
      : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('daily');

  // ── Daily report state
  const [reportDate] = useState(() => new Date());
  const [report, setReport] = useState<DailyReport | null>(null);
  const [isDailyLoading, setIsDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // ── Inventory report state
  const [invReport, setInvReport] = useState<InventoryReport | null>(null);
  const [isInvLoading, setIsInvLoading] = useState(false);
  const [invError, setInvError] = useState<string | null>(null);
  const [invSearch, setInvSearch] = useState('');
  const [invSort, setInvSort] = useState<'name' | 'stock' | 'revenue' | 'sold'>('revenue');
  const [invCategory, setInvCategory] = useState<'ALL' | 'DRINK' | 'CONDOM'>('ALL');

  // ── Load daily report
  useEffect(() => {
    const fetch = async () => {
      try {
        setIsDailyLoading(true);
        setDailyError(null);
        const res = await api.get<DailyReport>('/api/reports/daily', {
          params: { date: reportDate.toISOString() },
        });
        setReport(res.data);
        setCurrentPage(1);
      } catch (err: any) {
        setDailyError(err.response?.data?.message || 'Failed to load report data');
      } finally {
        setIsDailyLoading(false);
      }
    };
    fetch();
  }, [reportDate]);

  // ── Load inventory report (lazy – only when tab is opened)
  useEffect(() => {
    if (activeTab !== 'inventory' || invReport) return;
    const fetch = async () => {
      try {
        setIsInvLoading(true);
        setInvError(null);
        const res = await api.get<InventoryReport>('/api/reports/inventory');
        setInvReport(res.data);
      } catch (err: any) {
        setInvError(err.response?.data?.message || 'Failed to load inventory report');
      } finally {
        setIsInvLoading(false);
      }
    };
    fetch();
  }, [activeTab, invReport]);

  // ── Lock day
  const handleLockDay = async () => {
    if (!report || report.isLocked) return;
    try {
      setIsLocking(true);
      setDailyError(null);
      await api.post('/api/reports/lock-day', { date: reportDate.toISOString() });
      const res = await api.get<DailyReport>('/api/reports/daily', {
        params: { date: reportDate.toISOString() },
      });
      setReport(res.data);
    } catch (err: any) {
      setDailyError(err.response?.data?.message || 'Failed to lock business day');
    } finally {
      setIsLocking(false);
    }
  };

  // ── Daily totals
  const totals = useMemo(() => {
    const totalRevenue = report?.summary.totalRevenue ?? 0;
    const cash = report?.paymentBreakdown.CASH ?? 0;
    const pos = report?.paymentBreakdown.POS ?? 0;
    const transfer = report?.paymentBreakdown.TRANSFER ?? 0;
    const totalPayments = cash + pos + transfer;
    return { totalRevenue, cash, pos, transfer, totalPayments };
  }, [report]);

  const revenueCategories = useMemo(() => {
    const values = [
      { label: 'Rooms', value: report?.summary.roomRevenue ?? 0 },
      { label: 'Drinks', value: report?.salesByCategory.DRINK ?? 0 },
      { label: 'Condoms', value: report?.salesByCategory.CONDOM ?? 0 },
    ];
    const maxValue = Math.max(1, ...values.map((i) => i.value));
    return values.map((i) => ({ ...i, height: `${Math.max(10, Math.round((i.value / maxValue) * 100))}%` }));
  }, [report]);

  const parseBookingMeta = (note?: string | null) => {
    if (!note) return null;
    try {
      const parsed = JSON.parse(note);
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };

  const ledgerRows = useMemo(() => {
    const bookingRows = (report?.bookings ?? []).map((booking) => {
      const meta = parseBookingMeta(booking.note);
      const guestName = typeof meta?.guestName === 'string' && meta.guestName.trim() ? meta.guestName.trim() : 'Walk-in Guest';
      const nights = typeof meta?.nights === 'number' ? meta.nights : 1;
      const bookingType = typeof meta?.bookingType === 'string' ? meta.bookingType : 'NORMAL';
      const noteText = typeof meta?.notes === 'string' ? meta.notes.trim() : '';
      return {
        ref: booking.id.slice(0, 8).toUpperCase(),
        description: bookingType === 'COMPLIMENTARY' ? 'Complimentary Room Booking' : 'Room Booking',
        guest: noteText ? `${guestName} • ${noteText}` : guestName,
        room: booking.room.number.toString(),
        method: booking.payment?.method ?? 'Folio',
        amount: booking.payment?.amount ?? booking.price,
        status: booking.payment?.status === 'PAID' ? 'Paid' : 'Pending',
        createdAt: booking.createdAt,
        nights,
      };
    });
    const salesRows = (report?.sales ?? []).map((sale) => ({
      ref: sale.id.slice(0, 8).toUpperCase(),
      description: sale.item.name,
      guest: 'Inventory Sale',
      room: 'N/A',
      method: sale.paymentMethod,
      amount: sale.totalPrice,
      status: 'Paid',
      createdAt: sale.createdAt,
      nights: null,
    }));
    return [...bookingRows, ...salesRows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [report]);

  const totalPages = Math.max(1, Math.ceil(ledgerRows.length / pageSize));
  const paginatedRows = ledgerRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const formattedDate = reportDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const digitalShare = totals.totalPayments ? Math.round(((totals.pos + totals.transfer) / totals.totalPayments) * 100) : 0;
  const cashShare = totals.totalPayments ? Math.round((totals.cash / totals.totalPayments) * 100) : 0;
  const digitalStroke = 440 - (440 * digitalShare) / 100;
  const cashStroke = 440 - (440 * cashShare) / 100;

  const handleExportCsv = () => {
    const headers = ['Ref', 'Description', 'Guest/Entity', 'Room', 'Method', 'Amount', 'Status', 'Date'];
    const rows = ledgerRows.map((row) => [
      row.ref, row.description, row.guest, row.room, row.method,
      row.amount.toString(), row.status, new Date(row.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows]
      .map((cols) => cols.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transaction-ledger-${reportDate.toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Inventory table filtered + sorted
  const filteredInvItems = useMemo(() => {
    if (!invReport) return [];
    return invReport.items
      .filter((i) => {
        const matchSearch = i.name.toLowerCase().includes(invSearch.toLowerCase());
        const matchCat = invCategory === 'ALL' || i.category === invCategory;
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        if (invSort === 'name') return a.name.localeCompare(b.name);
        if (invSort === 'stock') return a.currentStock - b.currentStock;
        if (invSort === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (invSort === 'sold') return b.totalQtySold - a.totalQtySold;
        return 0;
      });
  }, [invReport, invSearch, invSort, invCategory]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="px-6 py-6">

        {/* ── Tab Switcher ── */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl w-fit mb-8 border border-gray-200 dark:border-gray-700">
          {(
            [
              { key: 'daily', label: 'Daily Reconciliation', icon: 'today' },
              { key: 'inventory', label: 'Inventory Report', icon: 'inventory_2' },
            ] as { key: ReportTab; label: string; icon: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-[#111318] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════
            TAB 1 — DAILY RECONCILIATION
        ════════════════════════════════════════ */}
        {activeTab === 'daily' && (
          <>
            {dailyError && (
              <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/50 text-rose-600 dark:text-rose-400 rounded-lg">
                {dailyError}
              </div>
            )}

            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${report?.isLocked ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    {report?.isLocked ? 'Business Day Locked' : 'Business Day Open'}
                  </span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                  Reports &amp; Daily Reconciliation
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {formattedDate} • Close the books and verify today&apos;s financial performance.
                </p>
              </div>
              <button
                onClick={handleLockDay}
                disabled={isLocking || report?.isLocked}
                className="flex items-center justify-center rounded-lg h-11 px-5 bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined mr-2 text-lg">{report?.isLocked ? 'lock' : 'lock_open'}</span>
                {report?.isLocked ? 'Business Day Locked' : isLocking ? 'Locking...' : 'End-of-Day Reconciliation'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { title: 'Total Revenue', value: totals.totalRevenue, note: `${report?.summary.bookingsCount ?? 0} bookings`, icon: 'trending_up', tone: 'text-emerald-500' },
                { title: 'Cash Payments', value: totals.cash, note: `${cashShare}% of payments`, icon: 'payments', tone: 'text-blue-500' },
                { title: 'POS Terminals', value: totals.pos, note: `${totals.totalPayments ? Math.round((totals.pos / totals.totalPayments) * 100) : 0}% volume`, icon: 'credit_card', tone: 'text-emerald-500' },
                { title: 'Bank Transfers', value: totals.transfer, note: `${totals.totalPayments ? Math.round((totals.transfer / totals.totalPayments) * 100) : 0}% volume`, icon: 'account_balance', tone: 'text-emerald-500' },
              ].map((stat) => (
                <div key={stat.title} className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111318]/50">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-bold leading-tight break-all text-gray-900 dark:text-white">{fmt(stat.value)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`${stat.tone} text-sm font-bold flex items-center gap-1`}>
                      <span className="material-symbols-outlined text-sm">{stat.icon}</span>
                      {stat.note}
                    </span>
                    <span className="text-gray-400 text-xs">{stat.title === 'Total Revenue' ? `${report?.summary.salesCount ?? 0} sales` : 'Updated today'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-[#111318]/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Revenue by Category</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Today&apos;s breakdown by department</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{fmt(report?.summary.totalRevenue ?? 0)}</span>
                </div>
                <div className="grid min-h-[200px] grid-flow-col gap-6 grid-rows-[1fr_auto] items-end justify-items-center mt-4">
                  {revenueCategories.map((item) => (
                    <div key={item.label} className="contents">
                      <div className="bg-blue-600/20 border-t-2 border-blue-600 w-full rounded-t" style={{ height: item.height }} />
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-[#111318]/50">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">Payment Method Distribution</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Volume share by type</p>
                </div>
                <div className="flex min-h-[200px] flex-col justify-center gap-6 py-4">
                  <div className="relative flex justify-center items-center">
                    <svg className="w-40 h-40 -rotate-90">
                      <circle className="text-gray-100 dark:text-gray-800" cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="20" />
                      <circle className="text-blue-600" cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeDasharray="440" strokeDashoffset={digitalStroke} strokeWidth="20" />
                      <circle className="text-blue-300" cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeDasharray="440" strokeDashoffset={cashStroke} strokeWidth="20" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-gray-900 dark:text-white">{digitalShare}%</span>
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Digital</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600" /><span className="font-medium text-gray-700 dark:text-gray-300">POS ({totals.totalPayments ? Math.round((totals.pos / totals.totalPayments) * 100) : 0}%)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-300" /><span className="font-medium text-gray-700 dark:text-gray-300">Transfers ({totals.totalPayments ? Math.round((totals.transfer / totals.totalPayments) * 100) : 0}%)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-400" /><span className="font-medium text-gray-700 dark:text-gray-300">Cash ({cashShare}%)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-600" /><span className="font-medium text-gray-700 dark:text-gray-300">Other ({totals.totalPayments ? Math.max(0, 100 - digitalShare - cashShare) : 0}%)</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ledger */}
            <div className="bg-white dark:bg-[#111318]/50 rounded-t-xl border-x border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Transaction Ledger</h3>
                <div className="flex gap-1">
                  {['filter_list', 'calendar_today', 'print'].map((icon) => (
                    <button key={icon} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-base">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleExportCsv} className="flex items-center justify-center rounded-lg h-10 bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 transition-colors border border-blue-600/20 px-4 font-bold text-sm">
                <span className="material-symbols-outlined mr-2 text-[20px]">download</span>
                Export to Excel
              </button>
            </div>
            <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-b-xl bg-white dark:bg-[#111318]/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#282e39]/30 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Ref #</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Guest / Entity</th>
                      <th className="px-6 py-4">Room</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {isDailyLoading ? (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading report data...</td></tr>
                    ) : ledgerRows.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No transactions recorded for this business day.</td></tr>
                    ) : (
                      paginatedRows.map((row) => (
                        <tr key={`${row.ref}-${row.createdAt}`} className="text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-700 dark:text-gray-300">{row.ref}</td>
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.description}{row.nights && row.nights > 1 ? ` (${row.nights} nights)` : ''}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{row.guest}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{row.room}</td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                              <span className="material-symbols-outlined text-[16px]">
                                {row.method === 'POS' ? 'credit_card' : row.method === 'CASH' ? 'payments' : row.method === 'TRANSFER' ? 'account_balance' : 'room_service'}
                              </span>
                              {row.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{fmt(row.amount)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${row.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{row.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-[#282e39]/30">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {ledgerRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, ledgerRows.length)} of {ledgerRows.length} transactions
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-xs font-bold rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111318] hover:bg-gray-50 dark:hover:bg-[#1f2937] transition-colors text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-3 py-1 text-xs font-bold rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111318] hover:bg-gray-50 dark:hover:bg-[#1f2937] transition-colors text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════
            TAB 2 — INVENTORY REPORT
        ════════════════════════════════════════ */}
        {activeTab === 'inventory' && (
          <>
            {invError && (
              <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/50 text-rose-600 dark:text-rose-400 rounded-lg">{invError}</div>
            )}

            {isInvLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading inventory report…</p>
                </div>
              </div>
            ) : invReport ? (
              <>
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Inventory Report</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    All-time stock levels, sales performance and revenue per item.
                  </p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                  <StatCard title="Total Items" value={String(invReport.summary.totalItems)} note="In catalogue" icon="inventory_2" tone="text-blue-500" />
                  <StatCard title="Low Stock" value={String(invReport.summary.lowStockCount)} note="≤ 10 units left" icon="warning" tone="text-amber-500" />
                  <StatCard title="Critical" value={String(invReport.summary.criticalCount)} note="≤ 5 units left" icon="error" tone="text-rose-500" />
                  <StatCard title="Out of Stock" value={String(invReport.summary.outOfStockCount)} note="Need restocking" icon="remove_shopping_cart" tone="text-red-500" />
                  <StatCard title="Stock Value" value={fmt(invReport.summary.totalInventoryValue)} note="Current inventory" icon="account_balance_wallet" tone="text-emerald-500" />
                  <StatCard title="All-time Revenue" value={fmt(invReport.summary.totalAllTimeRevenue)} note="From all sales" icon="trending_up" tone="text-emerald-500" />
                </div>

                {/* Two-column: best sellers + low stock alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                  {/* Best sellers */}
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111318]/50 p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="material-symbols-outlined text-amber-500">workspace_premium</span>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top 5 Best Sellers</h2>
                      <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">All time · by qty sold</span>
                    </div>
                    {invReport.bestSellers.length === 0 ? (
                      <p className="text-sm text-gray-400 py-6 text-center">No sales recorded yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {invReport.bestSellers.map((item, idx) => (
                          <div key={item.id} className="flex items-center gap-4">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              idx === 0 ? 'bg-amber-500 text-white' :
                              idx === 1 ? 'bg-gray-400 text-white' :
                              idx === 2 ? 'bg-amber-700 text-white' :
                              'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 ml-2 shrink-0">{item.totalQtySold} sold</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${invReport.bestSellers[0].totalQtySold > 0 ? Math.round((item.totalQtySold / invReport.bestSellers[0].totalQtySold) * 100) : 0}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{fmt(item.totalRevenue)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Low stock alerts */}
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111318]/50 p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="material-symbols-outlined text-rose-500">notification_important</span>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Low Stock Alerts</h2>
                      <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">Needs attention</span>
                    </div>
                    {invReport.lowStockItems.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-6 text-center">
                        <span className="material-symbols-outlined text-emerald-500 text-4xl">check_circle</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">All items are well stocked!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {invReport.lowStockItems.map((item) => (
                          <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                            item.currentStock === 0
                              ? 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-500/5'
                              : item.isCritical
                              ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-500/5'
                              : 'border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-500/5'
                          }`}>
                            <span className={`material-symbols-outlined text-base shrink-0 ${
                              item.currentStock === 0 ? 'text-red-500' : item.isCritical ? 'text-rose-500' : 'text-amber-500'
                            }`}>
                              {item.currentStock === 0 ? 'remove_shopping_cart' : 'warning'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.category}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-sm font-black ${item.currentStock === 0 ? 'text-red-500' : item.isCritical ? 'text-rose-500' : 'text-amber-600'}`}>
                                {item.currentStock === 0 ? 'Out of stock' : `${item.currentStock} left`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Full inventory table */}
                <div className="bg-white dark:bg-[#111318]/50 rounded-t-xl border-x border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">All Inventory Items</h3>
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                      <input
                        className="pl-8 pr-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 w-44"
                        placeholder="Search items…"
                        value={invSearch}
                        onChange={(e) => setInvSearch(e.target.value)}
                      />
                    </div>
                    {/* Category filter */}
                    <select
                      value={invCategory}
                      onChange={(e) => setInvCategory(e.target.value as 'ALL' | 'DRINK' | 'CONDOM')}
                      className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="DRINK">Drinks</option>
                      <option value="CONDOM">Condoms</option>
                    </select>
                    {/* Sort */}
                    <select
                      value={invSort}
                      onChange={(e) => setInvSort(e.target.value as 'name' | 'stock' | 'revenue' | 'sold')}
                      className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="revenue">Sort: Revenue</option>
                      <option value="sold">Sort: Qty Sold</option>
                      <option value="stock">Sort: Stock (low first)</option>
                      <option value="name">Sort: Name</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-b-xl bg-white dark:bg-[#111318]/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-[#282e39]/30 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Item</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Unit Price</th>
                          <th className="px-6 py-4">Current Stock</th>
                          <th className="px-6 py-4">Stock Level</th>
                          <th className="px-6 py-4">Total Sold</th>
                          <th className="px-6 py-4 text-right">All-time Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredInvItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                              No items match your search.
                            </td>
                          </tr>
                        ) : (
                          filteredInvItems.map((item) => (
                            <tr key={item.id} className="text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{item.name}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  item.category === 'DRINK' ? 'bg-blue-500/10 text-blue-500' : 'bg-pink-500/10 text-pink-500'
                                }`}>{item.category}</span>
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{fmt(item.price)}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${
                                    item.currentStock === 0 ? 'text-red-500' :
                                    item.isCritical ? 'text-rose-500' :
                                    item.isLowStock ? 'text-amber-500' :
                                    'text-emerald-600 dark:text-emerald-400'
                                  }`}>{item.currentStock}</span>
                                  {item.currentStock === 0 && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500 text-white">OUT</span>
                                  )}
                                  {item.isCritical && item.currentStock > 0 && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white">CRITICAL</span>
                                  )}
                                  {item.isLowStock && !item.isCritical && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white">LOW</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 min-w-[140px]">
                                <StockBar current={item.currentStock} sold={item.totalQtySold} />
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.totalQtySold}</td>
                              <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{fmt(item.totalRevenue)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 dark:bg-[#282e39]/30 text-xs text-gray-400 dark:text-gray-500">
                    Showing {filteredInvItems.length} of {invReport.items.length} items
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </Layout>
  );
}