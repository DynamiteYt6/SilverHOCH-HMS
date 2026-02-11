import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import type { Room } from '../types';

interface Booking {
  id: string;
  room: Room;
  stayType: 'OVERNIGHT' | 'SHORT_STAY';
  bookingType?: 'NORMAL' | 'COMPLIMENTARY';
  checkIn: string;
  checkOut: string | null;
  price: number;
  note?: string | null;
  payment: {
    id?: string;
    method: 'CASH' | 'POS' | 'TRANSFER';
    status: 'PAID' | 'PENDING';
  };
  createdBy: {
    name: string;
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchParams] = useSearchParams();
  const [pricingSettings, setPricingSettings] = useState({
    fanOvernightPrice: 10000,
    fanShortStayPrice: 4000,
    acOvernightPrice: 20000,
    acShortStayPrice: 10000,
  });
  
  // Form state
  const [formData, setFormData] = useState({
    roomId: '',
    stayType: 'OVERNIGHT' as 'OVERNIGHT' | 'SHORT_STAY',
    paymentMethod: 'CASH' as 'CASH' | 'POS' | 'TRANSFER',
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guestAddress: '',
    nights: 1,
    bookingType: 'NORMAL' as 'NORMAL' | 'COMPLIMENTARY',
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchRooms();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (searchParams.get('quick') === '1') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings');
      if (response.data?.pricing) {
        setPricingSettings(response.data.pricing);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await api.get('/api/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/api/bookings', formData);
      
      // Refresh data
      await fetchBookings();
      await fetchRooms();
      
      // Reset form and close modal
      setFormData({
        roomId: '',
        stayType: 'OVERNIGHT',
        paymentMethod: 'CASH',
        guestName: '',
        guestPhone: '',
        guestEmail: '',
        guestAddress: '',
        nights: 1,
        bookingType: 'NORMAL',
        note: '',
      });
      setShowCreateModal(false);
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      alert(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handlePaymentStatusChange = async (booking: Booking, status: 'PAID' | 'PENDING') => {
    if (!booking.payment?.id || booking.payment.status === status) return;

    try {
      await api.patch(`/api/payments/${booking.payment.id}/status`, { status });
      await fetchBookings();
    } catch (error: any) {
      console.error('Failed to update payment status:', error);
      alert(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const parseGuestInfo = (note?: string | null) => {
    if (!note) return null;
    try {
      const parsed = JSON.parse(note);
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  };

  const handleCheckout = async (bookingId: string) => {
    if (!confirm('Are you sure you want to checkout this booking?')) return;

    try {
      await api.patch(`/api/bookings/${bookingId}/checkout`);
      await fetchBookings();
      await fetchRooms();
      alert('Checkout successful!');
    } catch (error) {
      console.error('Failed to checkout:', error);
      alert('Failed to checkout');
    }
  };

  const getAvailableRooms = () => {
    return rooms.filter(room => room.status === 'AVAILABLE');
  };

  const getPrice = () => {
    const selectedRoom = rooms.find(r => r.id === formData.roomId);
    if (!selectedRoom) return 0;

    if (selectedRoom.type === 'FAN') {
      return formData.stayType === 'OVERNIGHT' ? pricingSettings.fanOvernightPrice : pricingSettings.fanShortStayPrice;
    }
    return formData.stayType === 'OVERNIGHT' ? pricingSettings.acOvernightPrice : pricingSettings.acShortStayPrice;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'PAID'
      ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-500'
      : 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-500';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bookings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage room reservations and check-ins</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a2130] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookings.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2130] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-blue-600">{bookings.filter(b => !b.checkOut).length}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2130] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Checked Out</p>
          <p className="text-2xl font-bold text-gray-600">{bookings.filter(b => b.checkOut).length}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2130] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Revenue Today</p>
          <p className="text-2xl font-bold text-green-600">
            ₦{bookings.reduce((sum, b) => sum + b.price, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-[#1a2130] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stay Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {booking.room.number}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Room {booking.room.number}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{booking.room.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                      booking.stayType === 'SHORT_STAY'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-500'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-500'
                    }`}>
                      {booking.stayType === 'SHORT_STAY'
                        ? 'Short Stay'
                        : `Overnight${parseGuestInfo(booking.note)?.nights > 1 ? ` (${parseGuestInfo(booking.note)?.nights} nights)` : ''}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(booking.checkIn)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {booking.checkOut ? formatDate(booking.checkOut) : (
                      <span className="text-amber-600 dark:text-amber-500 font-medium">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                    {booking.bookingType === 'COMPLIMENTARY' ? 'Complimentary' : `₦${booking.price.toLocaleString()}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <select
                        value={booking.payment?.status ?? 'PENDING'}
                        onChange={(e) => handlePaymentStatusChange(booking, e.target.value as 'PAID' | 'PENDING')}
                        disabled={!booking.payment?.id}
                        className={`px-2 py-1 text-xs leading-5 font-bold rounded-full focus:outline-none ${getStatusColor(booking.payment?.status ?? 'PENDING')} disabled:opacity-60`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                      </select>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{booking.payment?.method ?? 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="space-y-1">
                      {!booking.checkOut && (
                        <button
                          onClick={() => handleCheckout(booking.id)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 font-bold"
                        >
                          Check Out
                        </button>
                      )}
                      {parseGuestInfo(booking.note)?.guestName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Guest: {parseGuestInfo(booking.note)?.guestName}</p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No bookings found</p>
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a2130] rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Booking</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-84px)]">
              {/* Room Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select Room
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  required
                >
                  <option value="">Choose a room...</option>
                  {getAvailableRooms().map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.number} - {room.type} (Floor {room.floor})
                    </option>
                  ))}
                </select>
                {getAvailableRooms().length === 0 && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-500">No available rooms</p>
                )}
              </div>

              {/* Stay Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Stay Type</label>
                <select
                  value={formData.stayType}
                  onChange={(e) => setFormData({ ...formData, stayType: e.target.value as 'OVERNIGHT' | 'SHORT_STAY' })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                >
                  <option value="OVERNIGHT">Overnight</option>
                  <option value="SHORT_STAY">Short Stay (90 mins)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Booking Type</label>
                  <select
                    value={formData.bookingType}
                    onChange={(e) => setFormData({ ...formData, bookingType: e.target.value as 'NORMAL' | 'COMPLIMENTARY' })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="COMPLIMENTARY">Complimentary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nights</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.nights}
                    onChange={(e) => setFormData({ ...formData, nights: Number(e.target.value || 1) })}
                    disabled={formData.stayType !== 'OVERNIGHT'}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Guest Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Guest Phone (Optional)</label>
                  <input
                    type="text"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Guest Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.guestEmail}
                    onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Guest Address (Optional)</label>
                  <input
                    type="text"
                    value={formData.guestAddress}
                    onChange={(e) => setFormData({ ...formData, guestAddress: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['CASH', 'POS', 'TRANSFER'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: method as 'CASH' | 'POS' | 'TRANSFER' })}
                      disabled={formData.bookingType === 'COMPLIMENTARY'}
                      className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition-colors disabled:opacity-50 ${
                        formData.paymentMethod === method
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-600'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Display */}
              {formData.roomId && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount</span>
                    <span className="text-2xl font-black text-blue-600">{formData.bookingType === 'COMPLIMENTARY' ? 'Complimentary' : `₦${(formData.stayType === 'OVERNIGHT' ? getPrice() * formData.nights : getPrice()).toLocaleString()}`}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.roomId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm Booking
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}