import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import type { InventoryItem, Sale, PaymentMethod } from '../types';

interface CartItem {
  item: InventoryItem;
  quantity: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cart for multiple items
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [inventoryRes, salesRes] = await Promise.all([
          api.get<InventoryItem[]>('/api/inventory'),
          api.get<Sale[]>('/api/inventory/sales')
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

  // Add item to cart
  const addToCart = (item: InventoryItem) => {
    const existingItem = cart.find(ci => ci.item.id === item.id);
    if (existingItem) {
      setCart(cart.map(ci => 
        ci.item.id === item.id 
          ? { ...ci, quantity: ci.quantity + 1 }
          : ci
      ));
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  // Remove from cart
  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(ci => ci.item.id !== itemId));
  };

  // Update cart quantity
  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(ci =>
        ci.item.id === itemId ? { ...ci, quantity } : ci
      ));
    }
  };

  // Process sale
  const handleProcessSale = async () => {
    if (cart.length === 0) return;

    try {
      setIsProcessingSale(true);
      setError(null);

      // Process each item in cart
      for (const cartItem of cart) {
        await api.post('/api/inventory/sale', {
          itemId: cartItem.item.id,
          quantity: cartItem.quantity,
          paymentMethod
        });
      }

      setSaleSuccess(true);
      setCart([]);
      
      // Refresh data
      const [inventoryRes, salesRes] = await Promise.all([
        api.get<InventoryItem[]>('/api/inventory'),
        api.get<Sale[]>('/api/inventory/sales')
      ]);
      
      setInventory(inventoryRes.data);
      setSales(salesRes.data);

      setTimeout(() => setSaleSuccess(false), 3000);
    } catch (err: any) {
      console.error('Sale failed:', err);
      setError(err.response?.data?.message || 'Failed to process sale');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0);
  const tax = 0;
  const total = subtotal + tax;

  const filteredItems = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStockBadge = (qty: number) => {
    if (qty <= 5) {
      return (
        <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-xs font-bold">
          Critical
        </span>
      );
    } else if (qty <= 10) {
      return (
        <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-xs font-bold">
          Low
        </span>
      );
    }
    return (
      <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-xs font-bold">
        In Stock
      </span>
    );
  };

  // Get item image
  const getItemImage = (item: InventoryItem) => {
    if (item.imageUrl) {
      if (item.imageUrl.startsWith('http')) {
        return item.imageUrl;
      }
      const baseUrl = api.defaults.baseURL ?? window.location.origin;
      return `${baseUrl}${item.imageUrl}`;
    }
    // Placeholder images based on category
    const imageMap: Record<string, string> = {
      DRINK: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=200&h=200&fit=crop',
      CONDOM: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop',
      SNACK: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200&h=200&fit=crop',
    };
    return imageMap[item.category] || 'https://images.unsplash.com/photo-1580913428023-ec4dc7e4f7f4?w=200&h=200&fit=crop';
  };

  const handleImageUpload = async (itemId: string, file?: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller.');
      return;
    }

    try {
      setUploadingItemId(itemId);
      setError(null);

      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const response = await api.post<InventoryItem>(`/api/inventory/${itemId}/image`, {
        imageData,
        fileName: file.name
      });

      const updatedItem = response.data;
      setInventory(prev =>
        prev.map(item => (item.id === updatedItem.id ? updatedItem : item))
      );
      setCart(prev =>
        prev.map(ci => (ci.item.id === updatedItem.id ? { ...ci, item: updatedItem } : ci))
      );
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingItemId(null);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
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
      <style>{`
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
      `}</style>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {saleSuccess && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Sale recorded successfully!
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory & Sales</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage stock and process sales</p>
        </div>
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>

      {/* Sale Interface */}
      <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a2130] overflow-hidden">
        <div className="grid grid-cols-12 gap-0">
          {/* Items Selection */}
          <div className="col-span-8 p-4 border-r border-gray-200 dark:border-gray-800">
            <div className="relative mb-4">
              <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-gray-900 dark:text-white text-sm" 
                placeholder="Search items..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="flex flex-col p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-600 hover:shadow-md transition-all group bg-white dark:bg-gray-800"
                >
                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded mb-2 overflow-hidden">
                    <img 
                      src={getItemImage(item)} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white text-center mb-1">{item.name}</span>
                  <span className="text-blue-600 text-xs font-bold text-center">{formatCurrency(item.price)}</span>
                  <div className="mt-1 flex justify-center">
                    {getStockBadge(item.quantity)}
                  </div>
                  <div
                    className="mt-2 flex justify-center"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <label className="cursor-pointer text-[10px] font-semibold text-blue-600 hover:text-blue-700">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          event.stopPropagation();
                          const file = event.target.files?.[0];
                          handleImageUpload(item.id, file);
                          event.currentTarget.value = '';
                        }}
                        disabled={uploadingItemId === item.id}
                      />
                      {uploadingItemId === item.id ? 'Uploading...' : 'Upload image'}
                    </label>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="col-span-4 p-4 flex flex-col">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">Cart ({cart.length})</h3>
            
            <div className="flex-1 space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-2 mb-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Cart is empty
                </div>
              ) : (
                cart.map((ci) => (
                  <div key={ci.item.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <img 
                      src={getItemImage(ci.item)} 
                      alt={ci.item.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{ci.item.name}</p>
                      <p className="text-xs text-blue-600">{formatCurrency(ci.item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white">{ci.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(ci.item.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Payment</label>
                <select 
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-9 px-3 text-sm focus:ring-1 focus:ring-blue-600 outline-none text-gray-900 dark:text-white"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <option value="CASH">Cash</option>
                  <option value="POS">POS</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(tax)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <button 
                onClick={handleProcessSale}
                disabled={cart.length === 0 || isProcessingSale}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {isProcessingSale ? 'Processing...' : 'Process Sale'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Sales */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a2130] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Today's Sales</h2>
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-semibold">
            {sales.length} transactions
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400">Time</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400">Item</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400">Total</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400">Seller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No sales recorded today
                  </td>
                </tr>
              ) : (
                sales.slice(0, 10).map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatTime(sale.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{sale.item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{sale.quantity}</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600">{formatCurrency(sale.totalPrice)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        sale.paymentMethod === 'CASH' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        sale.paymentMethod === 'POS' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{sale.soldBy.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
