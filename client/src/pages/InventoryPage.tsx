import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import type { InventoryItem, Sale, PaymentMethod } from '../types';

export default function InventoryPage() {
  // Data states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sale form states
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);

  // Fetch inventory and sales data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [inventoryRes, salesRes] = await Promise.all([
          api.get<InventoryItem[]>('/inventory'),
          api.get<Sale[]>('/inventory/sales')
        ]);
        
        setInventory(inventoryRes.data);
        setSales(salesRes.data);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.response?.data?.message || 'Failed to load inventory data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle sale processing
  const handleProcessSale = async () => {
    if (!selectedItem || quantity < 1) return;

    try {
      setIsProcessingSale(true);
      setError(null);

      await api.post('/inventory/sale', {
        itemId: selectedItem.id,
        quantity,
        paymentMethod
      });

      // Reset form and show success
      setSaleSuccess(true);
      setSelectedItem(null);
      setQuantity(1);
      
      // Refresh data
      const [inventoryRes, salesRes] = await Promise.all([
        api.get<InventoryItem[]>('/inventory'),
        api.get<Sale[]>('/inventory/sales')
      ]);
      
      setInventory(inventoryRes.data);
      setSales(salesRes.data);

      // Hide success message after 3 seconds
      setTimeout(() => setSaleSuccess(false), 3000);
    } catch (err: any) {
      console.error('Sale failed:', err);
      setError(err.response?.data?.message || 'Failed to process sale');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Select item from grid
  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setSaleSuccess(false);
    setError(null);
  };

  // Calculate totals
  const subtotal = selectedItem ? selectedItem.price * quantity : 0;
  const tax = 0;
  const total = subtotal + tax;

  // Filter items based on search
  const filteredItems = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format currency (Nigerian Naira)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount / 100);
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get stock status badge
  const getStockBadge = (qty: number) => {
    if (qty <= 5) {
      return (
        <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-xs font-bold uppercase">
          Critical
        </span>
      );
    } else if (qty <= 10) {
      return (
        <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-bold uppercase">
          Restock Soon
        </span>
      );
    }
    return (
      <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-bold uppercase">
        Stable
      </span>
    );
  };

  // Get stock status color for trend
  const getStockStatus = (qty: number) => {
    if (qty <= 5) return 'text-rose-500';
    if (qty <= 10) return 'text-rose-500';
    return 'text-emerald-500';
  };

  // Get stock trend icon
  const getStockTrend = (qty: number) => {
    if (qty <= 5) return 'error';
    if (qty <= 10) return 'trending_down';
    return 'check_circle';
  };

  // Get stock trend text
  const getStockTrendText = (qty: number) => {
    if (qty <= 5) return 'Reorder immediate threshold reached';
    if (qty <= 10) return '-15% from yesterday';
    return 'Sufficient stock levels';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#101622]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading inventory...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message */}
      {saleSuccess && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          Sale recorded successfully!
        </div>
      )}

      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div className="flex min-w-72 flex-col gap-1">
          <h1 className="text-4xl font-bold leading-tight tracking-[-0.033em] text-gray-900 dark:text-white">Inventory & Sales Hub</h1>
          <p className="text-gray-500 dark:text-[#9da6b9] text-base font-normal">Monitor essential stock and manage counter sales.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex h-10 items-center justify-center rounded-lg px-4 bg-gray-100 dark:bg-[#282e39] font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3b4354] transition-colors">
            <span className="material-symbols-outlined mr-2 text-base">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      <div className="mb-8">
        <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.015em] mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <span className="material-symbols-outlined text-amber-500">warning</span>
          Low Stock Alerts
        </h2>
        <div className="flex flex-wrap gap-4">
          {/* Drinks Category */}
          <div className="flex min-w-[280px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-[#3b4354] bg-white dark:bg-[#101622]/50 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-gray-500 dark:text-[#9da6b9] text-sm font-medium uppercase tracking-wider">Drinks Category</p>
              {getStockBadge(inventory.filter(i => i.category === 'DRINK').reduce((sum, item) => sum + item.quantity, 0))}
            </div>
            <p className="tracking-light text-3xl font-bold leading-tight text-gray-900 dark:text-white">
              {inventory.filter(i => i.category === 'DRINK').reduce((sum, item) => sum + item.quantity, 0)} units left
            </p>
            <div className={`flex items-center gap-2 text-sm font-semibold ${getStockStatus(inventory.filter(i => i.category === 'DRINK').reduce((sum, item) => sum + item.quantity, 0))}`}>
              <span className="material-symbols-outlined text-sm">{getStockTrend(inventory.filter(i => i.category === 'DRINK').reduce((sum, item) => sum + item.quantity, 0))}</span>
              {getStockTrendText(inventory.filter(i => i.category === 'DRINK').reduce((sum, item) => sum + item.quantity, 0))}
            </div>
          </div>

          {/* Condoms & Essentials */}
          <div className="flex min-w-[280px] flex-1 flex-col gap-2 rounded-xl p-6 border-2 border-rose-500/30 bg-rose-50/10 dark:bg-rose-900/10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 -mr-10 -mt-10 rounded-full"></div>
            <div className="flex justify-between items-start">
              <p className="text-gray-500 dark:text-[#9da6b9] text-sm font-medium uppercase tracking-wider">Condoms & Essentials</p>
              {getStockBadge(inventory.filter(i => i.category === 'CONDOM').reduce((sum, item) => sum + item.quantity, 0))}
            </div>
            <p className="tracking-light text-3xl font-bold leading-tight text-gray-900 dark:text-white">
              {inventory.filter(i => i.category === 'CONDOM').reduce((sum, item) => sum + item.quantity, 0)} units left
            </p>
            <p className="text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              Reorder immediate threshold reached
            </p>
          </div>

          {/* Toiletries */}
          <div className="flex min-w-[280px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-[#3b4354] bg-white dark:bg-[#101622]/50 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-gray-500 dark:text-[#9da6b9] text-sm font-medium uppercase tracking-wider">Toiletries</p>
              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-bold uppercase">Stable</span>
            </div>
            <p className="tracking-light text-3xl font-bold leading-tight text-gray-900 dark:text-white">
              {inventory.reduce((sum, item) => sum + item.quantity, 0)} units
            </p>
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-semibold">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Sufficient stock levels
            </div>
          </div>
        </div>
      </div>

      {/* New Sale Interface */}
      <div className="mb-10 p-6 rounded-xl border border-gray-200 dark:border-[#3b4354] bg-white dark:bg-[#101622] shadow-md">
        <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] mb-6 text-gray-900 dark:text-white">Process New Sale</h2>
        <div className="grid grid-cols-12 gap-8">
          {/* Left: Search & Select */}
          <div className="col-span-8 flex flex-col gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-3 text-gray-400">search</span>
              <input 
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 dark:border-[#3b4354] bg-gray-50 dark:bg-[#111318] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400" 
                placeholder="Search item by name or barcode (e.g. 'Heineken', 'Durex')..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Quick Grid Items */}
            <div className="grid grid-cols-4 gap-3">
              {filteredItems.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`flex flex-col items-center p-3 border rounded-lg transition-all group ${
                    selectedItem?.id === item.id
                      ? 'border-blue-600 bg-blue-600/5'
                      : 'border-gray-200 dark:border-[#3b4354] hover:border-blue-600'
                  }`}
                >
                  <div className="w-full aspect-square bg-gray-100 dark:bg-[#282e39] rounded mb-2 flex items-center justify-center overflow-hidden">
                    <span className="material-symbols-outlined text-4xl text-gray-400">
                      {item.category === 'DRINK' ? 'local_bar' : 'sanitizer'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-center text-gray-900 dark:text-white">{item.name}</span>
                  <span className="text-blue-600 text-xs font-bold mt-1">{formatCurrency(item.price)}</span>
                </button>
              ))}
            </div>

            {/* Available Items List */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-[#9da6b9] mb-2">All Items</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      selectedItem?.id === item.id
                        ? 'bg-blue-600/10 border border-blue-600'
                        : 'hover:bg-gray-100 dark:hover:bg-[#282e39]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-lg text-gray-400">
                        {item.category === 'DRINK' ? 'local_bar' : 'sanitizer'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                      <span className="text-xs text-gray-500 dark:text-[#9da6b9]">({item.quantity} left)</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">{formatCurrency(item.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Transaction Details */}
          <div className="col-span-4 flex flex-col border-l border-gray-200 dark:border-[#3b4354] pl-8">
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9] mb-1 block">Quantity</label>
                <div className="flex items-center">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 border border-gray-200 dark:border-[#3b4354] flex items-center justify-center rounded-l hover:bg-gray-50 dark:hover:bg-[#282e39] transition-colors text-gray-600 dark:text-gray-400"
                  >
                    -
                  </button>
                  <input 
                    className="w-full h-10 border-y border-x-0 border-gray-200 dark:border-[#3b4354] bg-transparent text-center focus:ring-0 text-gray-900 dark:text-white font-semibold" 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                  />
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 border border-gray-200 dark:border-[#3b4354] flex items-center justify-center rounded-r hover:bg-gray-50 dark:hover:bg-[#282e39] transition-colors text-gray-600 dark:text-gray-400"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#9da6b9] mb-1 block">Payment Method</label>
                <select 
                  className="w-full rounded-lg border border-gray-200 dark:border-[#3b4354] bg-gray-50 dark:bg-[#111318] h-10 px-3 focus:ring-1 focus:ring-blue-600 outline-none text-gray-900 dark:text-white"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <option value="CASH">Cash</option>
                  <option value="POS">Credit Card</option>
                  <option value="TRANSFER">Mobile Money</option>
                </select>
              </div>
              <div className="bg-gray-50 dark:bg-[#111318] p-4 rounded-lg border border-gray-200 dark:border-[#3b4354]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">Tax (0%)</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(tax)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-[#282e39] pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleProcessSale}
              disabled={!selectedItem || quantity < 1 || isProcessingSale}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">point_of_sale</span>
              {isProcessingSale ? 'Processing...' : 'RECORD SALE'}
            </button>
          </div>
        </div>
      </div>

      {/* Today's Sales Table */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.015em] text-gray-900 dark:text-white">Today&apos;s Sales Log</h2>
          <span className="text-xs bg-gray-100 dark:bg-[#282e39] px-3 py-1 rounded-full text-gray-500 font-medium">Total Volume: {sales.length} Transactions</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#3b4354]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#1c222d] border-b border-gray-200 dark:border-[#3b4354]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#9da6b9]">Time</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#9da6b9]">Item Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#9da6b9]">Qty</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#9da6b9]">Total Price</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#9da6b9]">Payment</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#9da6b9]">Seller</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-[#9da6b9]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#282e39] bg-white dark:bg-[#101622]/30">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-[#9da6b9]">
                    No sales recorded today. Start processing transactions above.
                  </td>
                </tr>
              ) : (
                sales.slice(0, 10).map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">{formatTime(sale.createdAt)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{sale.item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{sale.quantity}</td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">{formatCurrency(sale.totalPrice)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${sale.paymentMethod === 'CASH' ? 'bg-emerald-500' : sale.paymentMethod === 'POS' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {sale.paymentMethod === 'CASH' ? 'Cash' : sale.paymentMethod === 'POS' ? 'Credit Card' : 'Mobile Money'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{sale.soldBy.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-gray-400 hover:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined text-lg">print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {sales.length > 10 && (
          <div className="flex justify-center mt-4">
            <button className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              Load more transactions
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          </div>
        )}
      </div>

      {/* Material Symbols CSS */}
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>
    </Layout>
  );
}

