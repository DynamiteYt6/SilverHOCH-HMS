import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'hotel' | 'system'>('profile');
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatarUrl: user?.avatarUrl || '',
  });

  // Hotel settings state
  const [hotelData, setHotelData] = useState({
    hotelName: 'Silver HOCH Hotel',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    currency: 'NGN',
    taxRate: '7.5',
  });

  // Pricing settings state
  const [pricing, setPricing] = useState({
    fanOvernightPrice: '10000',
    fanShortStayPrice: '4000',
    acOvernightPrice: '20000',
    acShortStayPrice: '10000',
  });

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem('profileExtras');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<typeof profileData>;
        setProfileData((prev) => ({
          ...prev,
          ...parsed,
          name: user.name || prev.name,
          username: user.username || parsed.username || prev.username,
          avatarUrl: user.avatarUrl || parsed.avatarUrl || prev.avatarUrl || '',
        }));
        setAvatarPreview(user.avatarUrl || parsed.avatarUrl || null);
      } catch {
        // ignore malformed local data
      }
    } else {
      setProfileData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        username: user.username || prev.username,
        avatarUrl: user.avatarUrl || prev.avatarUrl || '',
      }));
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/api/settings');
        const data = response.data;
        setHotelData((prev) => ({ ...prev, ...(data.hotel || {}) }));
        if (data.pricing) {
          setPricing({
            fanOvernightPrice: String(data.pricing.fanOvernightPrice ?? pricing.fanOvernightPrice),
            fanShortStayPrice: String(data.pricing.fanShortStayPrice ?? pricing.fanShortStayPrice),
            acOvernightPrice: String(data.pricing.acOvernightPrice ?? pricing.acOvernightPrice),
            acShortStayPrice: String(data.pricing.acShortStayPrice ?? pricing.acShortStayPrice),
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileStatus(null);

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setProfileStatus('New password and confirm password do not match.');
      return;
    }

    try {
      const response = await api.patch('/api/users/me', {
        name: profileData.name,
        username: profileData.username,
        currentPassword: profileData.currentPassword || undefined,
        newPassword: profileData.newPassword || undefined,
      });

      updateUser({
        ...user,
        name: response.data.name,
        username: response.data.username,
        avatarUrl: profileData.avatarUrl || null,
      });

      localStorage.setItem(
        'profileExtras',
        JSON.stringify({
          username: response.data.username || profileData.username,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          avatarUrl: profileData.avatarUrl,
        })
      );
      setProfileData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setProfileStatus('Profile updated successfully.');
    } catch (err: any) {
      console.error('Profile update failed:', err);
      setProfileStatus(err.response?.data?.message || 'Failed to update profile.');
    }
  };


  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSizeInBytes = 2 * 1024 * 1024;
    if (!file.type.startsWith('image/')) {
      setProfileStatus('Please choose a valid image file.');
      event.target.value = '';
      return;
    }

    if (file.size > maxSizeInBytes) {
      setProfileStatus('Image must be 2MB or smaller.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setAvatarPreview(result);
      setProfileData((prev) => ({ ...prev, avatarUrl: result }));
      setProfileStatus('Avatar selected. Click “Save Changes” to apply it.');
    };
    reader.onerror = () => {
      setProfileStatus('Failed to read image file. Please try another one.');
    };
    reader.readAsDataURL(file);
  };

  const handleHotelUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSettingsStatus(null);
      const response = await api.patch('/api/settings', {
        hotel: hotelData,
      });
      setHotelData((prev) => ({ ...prev, ...(response.data.hotel || {}) }));
      setSettingsStatus('Hotel information saved successfully.');
    } catch (err: any) {
      console.error('Failed to save hotel settings:', err);
      setSettingsStatus(err.response?.data?.message || 'Failed to save hotel settings.');
    }
  };

  const handlePricingUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSettingsStatus(null);
      const response = await api.patch('/api/settings', {
        pricing: {
          fanOvernightPrice: Number(pricing.fanOvernightPrice),
          fanShortStayPrice: Number(pricing.fanShortStayPrice),
          acOvernightPrice: Number(pricing.acOvernightPrice),
          acShortStayPrice: Number(pricing.acShortStayPrice),
        }
      });
      if (response.data.pricing) {
        setPricing({
          fanOvernightPrice: String(response.data.pricing.fanOvernightPrice),
          fanShortStayPrice: String(response.data.pricing.fanShortStayPrice),
          acOvernightPrice: String(response.data.pricing.acOvernightPrice),
          acShortStayPrice: String(response.data.pricing.acShortStayPrice),
        });
      }
      setSettingsStatus('Pricing settings saved successfully.');
    } catch (err: any) {
      console.error('Failed to save pricing settings:', err);
      setSettingsStatus(err.response?.data?.message || 'Failed to save pricing settings.');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and hotel preferences</p>
        </div>

        {settingsStatus && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-100 dark:border-blue-500/30 text-center">
            {settingsStatus}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex flex-wrap justify-center gap-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
            } text-sm font-bold flex items-center gap-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>
          <button
            onClick={() => setActiveTab('hotel')}
            className={`py-4 border-b-2 transition-colors ${
              activeTab === 'hotel'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
            } text-sm font-bold flex items-center gap-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Hotel
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-4 border-b-2 transition-colors ${
              activeTab === 'system'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
            } text-sm font-bold flex items-center gap-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            System
          </button>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-[#1a2130] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h2>
            {profileStatus && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-100 dark:border-blue-500/30">
                {profileStatus}
              </div>
            )}
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={`${profileData.name || 'User'} avatar`} className="w-full h-full object-cover" />
                  ) : (
                    (profileData.name || user?.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    Change Photo
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarPreview(null);
                        setProfileData((prev) => ({ ...prev, avatarUrl: '' }));
                        setProfileStatus('Avatar removed. Click “Save Changes” to apply it.');
                      }}
                      className="ml-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">JPG, GIF, PNG or WEBP. Max size of 2MB</p>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State</label>
                  <input
                    type="text"
                    value={profileData.state}
                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Password Change */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                      <input
                        type="password"
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
          </div>
        )}

        {/* Hotel Tab */}
        {activeTab === 'hotel' && (
          <div className="max-w-3xl mx-auto space-y-6">
          {/* Hotel Information */}
          <div className="bg-white dark:bg-[#1a2130] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Hotel Information</h2>
            <form onSubmit={handleHotelUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Hotel Name</label>
                <input
                  type="text"
                  value={hotelData.hotelName}
                  onChange={(e) => setHotelData({ ...hotelData, hotelName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
                <input
                  type="text"
                  value={hotelData.address}
                  onChange={(e) => setHotelData({ ...hotelData, address: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    value={hotelData.city}
                    onChange={(e) => setHotelData({ ...hotelData, city: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State</label>
                  <input
                    type="text"
                    value={hotelData.state}
                    onChange={(e) => setHotelData({ ...hotelData, state: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={hotelData.phone}
                    onChange={(e) => setHotelData({ ...hotelData, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={hotelData.email}
                    onChange={(e) => setHotelData({ ...hotelData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Room Pricing */}
          <div className="bg-white dark:bg-[#1a2130] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Room Pricing</h2>
            <form onSubmit={handlePricingUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fan Room - Overnight (₦)</label>
                  <input
                    type="number"
                    value={pricing.fanOvernightPrice}
                    onChange={(e) => setPricing({ ...pricing, fanOvernightPrice: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fan Room - Short Stay (₦)</label>
                  <input
                    type="number"
                    value={pricing.fanShortStayPrice}
                    onChange={(e) => setPricing({ ...pricing, fanShortStayPrice: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">AC Room - Overnight (₦)</label>
                  <input
                    type="number"
                    value={pricing.acOvernightPrice}
                    onChange={(e) => setPricing({ ...pricing, acOvernightPrice: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">AC Room - Short Stay (₦)</label>
                  <input
                    type="number"
                    value={pricing.acShortStayPrice}
                    onChange={(e) => setPricing({ ...pricing, acShortStayPrice: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Check-in/Check-out Times */}
          <div className="bg-white dark:bg-[#1a2130] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Check-in & Check-out</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Check-in Time</label>
                <input
                  type="time"
                  value={hotelData.checkInTime}
                  onChange={(e) => setHotelData({ ...hotelData, checkInTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Check-out Time</label>
                <input
                  type="time"
                  value={hotelData.checkOutTime}
                  onChange={(e) => setHotelData({ ...hotelData, checkOutTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>
          </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="max-w-3xl mx-auto space-y-6">
          {/* Backup & Restore */}
          <div className="bg-white dark:bg-[#1a2130] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Backup & Restore</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Database Backup</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last backup: Never</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Backup Now
                </button>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white dark:bg-[#1a2130] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">System Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">Version</span>
                <span className="font-semibold text-gray-900 dark:text-white">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                <span className="font-semibold text-gray-900 dark:text-white">Jan 29, 2024</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">License</span>
                <span className="font-semibold text-gray-900 dark:text-white">Proprietary</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border-2 border-red-200 dark:border-red-900/50 p-6">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Clear All Data</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete all bookings, sales, and reports</p>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">
                  Clear Data
                </button>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
