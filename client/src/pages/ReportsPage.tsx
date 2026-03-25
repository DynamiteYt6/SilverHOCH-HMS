import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

type PaymentMethod = 'CASH' | 'POS' | 'TRANSFER';

interface ReportBooking {
  id: string;
  room: {
    number: number;
  };
  price: number;
  note?: string | null;
  createdAt: string;
  payment?: {
    amount: number;
    method: PaymentMethod;
    status: 'PAID' | 'PENDING';
  } | null;
}

interface ReportSale {
  id: string;
  item: {
    name: string;
    category: 'DRINK' | 'CONDOM';
  };
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
  confirmedBy?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

export default function ReportsPage() {
  const [reportDate] = useState(() => new Date());
  const [report, setReport] = useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<DailyReport>('/api/reports/daily', {
          params: { date: reportDate.toISOString() }
        });
        setReport(response.data);
        setCurrentPage(1);
      } catch (err: any) {
        console.error('Failed to load report:', err);
        setError(err.response?.data?.message || 'Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [reportDate]);

  const handleLockDay = async () => {
    if (!report || report.isLocked) return;
    try {
      setIsLocking(true);
      setError(null);
      await api.post('/api/reports/lock-day', { date: reportDate.toISOString() });
      const response = await api.get<DailyReport>('/api/reports/daily', {
        params: { date: reportDate.toISOString() }
      });
      setReport(response.data);
    } catch (err: any) {
      console.error('Failed to lock business day:', err);
      setError(err.response?.data?.message || 'Failed to lock business day');
    } finally {
      setIsLocking(false);
    }
  };

  const totals = useMemo(() => {
    const totalRevenue = report?.summary.totalRevenue ?? 0;
    const cash = report?.paymentBreakdown.CASH ?? 0;
    const pos = report?.paymentBreakdown.POS ?? 0;
    const transfer = report?.paymentBreakdown.TRANSFER ?? 0;
    const totalPayments = cash + pos + transfer;

    return {
      totalRevenue,
      cash,
      pos,
      transfer,
      totalPayments
    };
  }, [report]);

  const revenueCategories = useMemo(() => {
    const values = [
      { label: 'Rooms', value: report?.summary.roomRevenue ?? 0 },
      { label: 'Drinks', value: report?.salesByCategory.DRINK ?? 0 },
      { label: 'Condoms', value: report?.salesByCategory.CONDOM ?? 0 }
    ];
    const maxValue = Math.max(1, ...values.map(item => item.value));
    return values.map(item => ({
      ...item,
      height: `${Math.max(10, Math.round((item.value / maxValue) * 100))}%`
    }));
  }, [report]);


  const parseBookingMeta = (note?: string | null) => {
    if (!note) return null;
    try {
      const parsed = JSON.parse(note);
      return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  };

  const ledgerRows = useMemo(() => {
    const bookingRows = (report?.bookings ?? []).map(booking => {
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

    const salesRows = (report?.sales ?? []).map(sale => ({
      ref: sale.id.slice(0, 8).toUpperCase(),
      description: sale.item.name,
      guest: 'Inventory Sale',
      room: 'N/A',
      method: sale.paymentMethod,
      amount: sale.totalPrice,
      status: 'Paid',
      createdAt: sale.createdAt,
      nights: null
    }));

    return [...bookingRows, ...salesRows].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [report]);

  const totalPages = Math.max(1, Math.ceil(ledgerRows.length / pageSize));
  const paginatedRows = ledgerRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formattedDate = reportDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const digitalShare = totals.totalPayments
    ? Math.round(((totals.pos + totals.transfer) / totals.totalPayments) * 100)
    : 0;
  const cashShare = totals.totalPayments
    ? Math.round((totals.cash / totals.totalPayments) * 100)
    : 0;
  const digitalStroke = 440 - (440 * digitalShare) / 100;
  const cashStroke = 440 - (440 * cashShare) / 100;

  const handleExportCsv = () => {
    const headers = ['Ref', 'Description', 'Guest/Entity', 'Room', 'Method', 'Amount', 'Status', 'Date'];
    const rows = ledgerRows.map((row) => [
      row.ref,
      row.description,
      row.guest,
      row.room,
      row.method,
      row.amount.toString(),
      row.status,
      new Date(row.createdAt).toISOString(),
    ]);

    const csv = [headers, ...rows]
      .map((cols) => cols.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
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

  return (
    <Layout>
      <div className="px-6 py-6">
        {error && (
          <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/50 text-rose-600 dark:text-rose-400 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  report?.isLocked
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'bg-emerald-500/20 text-emerald-500'
                }`}
              >
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
            <span className="material-symbols-outlined mr-2 text-lg">
              {report?.isLocked ? 'lock' : 'lock_open'}
            </span>
            {report?.isLocked ? 'Business Day Locked' : isLocking ? 'Locking...' : 'End-of-Day Reconciliation'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              title: 'Total Revenue',
              value: totals.totalRevenue,
              note: `${report?.summary.bookingsCount ?? 0} bookings`,
              icon: 'trending_up',
              tone: 'text-emerald-500'
            },
            {
              title: 'Cash Payments',
              value: totals.cash,
              note: `${cashShare}% of payments`,
              icon: 'payments',
              tone: 'text-blue-500'
            },
            {
              title: 'POS Terminals',
              value: totals.pos,
              note: `${totals.totalPayments ? Math.round((totals.pos / totals.totalPayments) * 100) : 0}% volume`,
              icon: 'credit_card',
              tone: 'text-emerald-500'
            },
            {
              title: 'Bank Transfers',
              value: totals.transfer,
              note: `${totals.totalPayments ? Math.round((totals.transfer / totals.totalPayments) * 100) : 0}% volume`,
              icon: 'account_balance',
              tone: 'text-emerald-500'
            }
          ].map((stat) => (
            <div
              key={stat.title}
              className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111318]/50"
            >
              <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                {stat.title}
              </p>
              <p className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                {formatCurrency(stat.value)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`${stat.tone} text-sm font-bold flex items-center gap-1`}>
                  <span className="material-symbols-outlined text-sm">{stat.icon}</span>
                  {stat.note}
                </span>
                <span className="text-gray-400 text-xs">
                  {stat.title === 'Total Revenue'
                    ? `${report?.summary.salesCount ?? 0} sales`
                    : 'Updated today'}
                </span>
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
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(report?.summary.totalRevenue ?? 0)}
              </span>
            </div>
            <div className="grid min-h-[200px] grid-flow-col gap-6 grid-rows-[1fr_auto] items-end justify-items-center mt-4">
              {revenueCategories.map((item) => (
                <div key={item.label} className="contents">
                  <div
                    className="bg-blue-600/20 border-t-2 border-blue-600 w-full rounded-t"
                    style={{ height: item.height }}
                  ></div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                    {item.label}
                  </p>
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
                  <circle
                    className="text-gray-100 dark:text-gray-800"
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="20"
                  ></circle>
                  <circle
                    className="text-blue-600"
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="currentColor"
                    strokeDasharray="440"
                    strokeDashoffset={digitalStroke}
                    strokeWidth="20"
                  ></circle>
                  <circle
                    className="text-blue-300"
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="currentColor"
                    strokeDasharray="440"
                    strokeDashoffset={cashStroke}
                    strokeWidth="20"
                  ></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{digitalShare}%</span>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Digital</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    POS ({totals.totalPayments ? Math.round((totals.pos / totals.totalPayments) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-300"></span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Transfers ({totals.totalPayments ? Math.round((totals.transfer / totals.totalPayments) * 100) : 0}
                    %)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Cash ({cashShare}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-600"></span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Other ({totals.totalPayments ? Math.max(0, 100 - digitalShare - cashShare) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111318]/50 rounded-t-xl border-x border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Transaction Ledger</h3>
            <div className="flex gap-1">
              {['filter_list', 'calendar_today', 'print'].map((icon) => (
                <button
                  key={icon}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
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
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading report data...
                    </td>
                  </tr>
                ) : ledgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No transactions recorded for this business day.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={`${row.ref}-${row.createdAt}`} className="text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-700 dark:text-gray-300">{row.ref}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.description}{row.nights && row.nights > 1 ? ` (${row.nights} nights)` : ""}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{row.guest}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{row.room}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <span className="material-symbols-outlined text-[16px]">
                            {row.method === 'POS'
                              ? 'credit_card'
                              : row.method === 'CASH'
                                ? 'payments'
                                : row.method === 'TRANSFER'
                                  ? 'account_balance'
                                  : 'room_service'}
                          </span>
                          {row.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            row.status === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-[#282e39]/30">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {ledgerRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, ledgerRows.length)} of {ledgerRows.length} transactions
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-bold rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111318] hover:bg-gray-50 dark:hover:bg-[#1f2937] transition-colors text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-xs font-bold rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111318] hover:bg-gray-50 dark:hover:bg-[#1f2937] transition-colors text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
