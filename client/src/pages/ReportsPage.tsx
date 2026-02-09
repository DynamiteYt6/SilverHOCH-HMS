import Layout from '../components/Layout';

const stats = [
  {
    title: 'Total Revenue',
    value: 1489250,
    delta: '+8.2%',
    deltaNote: 'vs. yesterday',
    deltaClass: 'text-emerald-500'
  },
  {
    title: 'Cash Payments',
    value: 214000,
    delta: '-2.4%',
    deltaNote: 'lower cash flow',
    deltaClass: 'text-rose-400'
  },
  {
    title: 'POS Terminals',
    value: 940250,
    delta: '+14.1%',
    deltaNote: 'card transactions',
    deltaClass: 'text-emerald-500'
  },
  {
    title: 'Bank Transfers',
    value: 335000,
    delta: 'Verified',
    deltaNote: '5 pending',
    deltaClass: 'text-emerald-500'
  }
];

const revenueCategories = [
  { label: 'Rooms', height: '85%' },
  { label: 'F&B', height: '35%' },
  { label: 'Spa', height: '15%' },
  { label: 'Minibar', height: '25%' },
  { label: 'Other', height: '10%' }
];

const ledgerRows = [
  {
    ref: 'TRX-9402',
    description: 'Standard Room - 2 Nights',
    guest: 'Alexander Hamilton',
    room: '304',
    method: 'POS',
    amount: 45000,
    status: 'Paid'
  },
  {
    ref: 'TRX-9403',
    description: 'Minibar Restock',
    guest: 'Sarah Jenkins',
    room: '112',
    method: 'Cash',
    amount: 2450,
    status: 'Paid'
  },
  {
    ref: 'TRX-9404',
    description: 'Deluxe Suite - Deposit',
    guest: 'Marco Verratti',
    room: '501',
    method: 'Transfer',
    amount: 120000,
    status: 'Pending'
  },
  {
    ref: 'TRX-9405',
    description: 'Laundry Service',
    guest: 'Alexander Hamilton',
    room: '304',
    method: 'Folio',
    amount: 3500,
    status: 'Paid'
  },
  {
    ref: 'TRX-9406',
    description: 'Restaurant - Dinner Bill',
    guest: 'Guest Walk-in',
    room: 'N/A',
    method: 'POS',
    amount: 18620,
    status: 'Paid'
  }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount / 100);
};

export default function ReportsPage() {
  return (
    <Layout>
      <div className="px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Business Day Open
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Reports &amp; Daily Reconciliation
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              October 24, 2023 • Close the books and verify today&apos;s financial performance.
            </p>
          </div>
          <button className="flex items-center justify-center rounded-lg h-11 px-5 bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
            <span className="material-symbols-outlined mr-2 text-lg">lock</span>
            End-of-Day Reconciliation
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
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
                <span className={`${stat.deltaClass} text-sm font-bold flex items-center gap-1`}>
                  <span className="material-symbols-outlined text-sm">
                    {stat.delta.startsWith('+')
                      ? 'trending_up'
                      : stat.delta.startsWith('-')
                        ? 'trending_down'
                        : 'check_circle'}
                  </span>
                  {stat.delta}
                </span>
                <span className="text-gray-400 text-xs">{stat.deltaNote}</span>
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
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(1489200)}</span>
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
                    strokeDashoffset="110"
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
                    strokeDashoffset="380"
                    strokeWidth="20"
                  ></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">75%</span>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Digital</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Visa/Master (63%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-300"></span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Transfers (12%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Cash (18%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-600"></span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Other (7%)</span>
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
          <button className="flex items-center justify-center rounded-lg h-10 bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 transition-colors border border-blue-600/20 px-4 font-bold text-sm">
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
                {ledgerRows.map((row) => (
                  <tr key={row.ref} className="text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-700 dark:text-gray-300">{row.ref}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.description}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{row.guest}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{row.room}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <span className="material-symbols-outlined text-[16px]">
                          {row.method === 'POS'
                            ? 'credit_card'
                            : row.method === 'Cash'
                              ? 'payments'
                              : row.method === 'Transfer'
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
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-[#282e39]/30">
            <p className="text-xs text-gray-500 dark:text-gray-400">Showing 5 of 142 transactions</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-bold rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111318] hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <button className="px-3 py-1 text-xs font-bold rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111318] hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
