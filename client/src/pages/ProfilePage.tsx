import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'FRONT_DESK' | 'DRINKS_SELLER';

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  FRONT_DESK: 'Front Desk',
  DRINKS_SELLER: 'Drinks Seller',
};

const ROLE_COLORS: Record<UserRole, { badge: string; dot: string }> = {
  SUPER_ADMIN: { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30', dot: 'bg-purple-400' },
  ADMIN:       { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',   dot: 'bg-blue-400' },
  FRONT_DESK:  { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  DRINKS_SELLER: { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' },
};

type StatusMsg = { type: 'success' | 'error'; text: string } | null;

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  hint,
  error,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  error?: boolean;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white
          outline-none transition-colors
          focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
          ${error
            ? 'border-red-400 dark:border-red-500'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
      />
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<StatusMsg>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);

  const [form, setForm] = useState({
    name: user?.name ?? '',
    username: user?.username ?? '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatarUrl: user?.avatarUrl ?? '',
  });

  // Load persisted extras from localStorage
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: user.name ?? prev.name,
      username: user.username ?? prev.username,
      avatarUrl: user.avatarUrl ?? prev.avatarUrl,
    }));
    setAvatarPreview(user.avatarUrl ?? null);

    try {
      const stored = localStorage.getItem('profileExtras');
      if (stored) {
        const parsed = JSON.parse(stored) as { email?: string; phone?: string; avatarUrl?: string };
        setForm((prev) => ({
          ...prev,
          email: parsed.email ?? '',
          phone: parsed.phone ?? '',
          avatarUrl: user.avatarUrl ?? parsed.avatarUrl ?? prev.avatarUrl,
        }));
        setAvatarPreview(user.avatarUrl ?? parsed.avatarUrl ?? null);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', text: 'Please choose a valid image file.' });
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatus({ type: 'error', text: 'Image must be 2MB or smaller.' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setAvatarPreview(result);
      setForm((prev) => ({ ...prev, avatarUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setStatus(null);

    if (form.newPassword) {
      if (!form.currentPassword) {
        setStatus({ type: 'error', text: 'Enter your current password to set a new one.' });
        return;
      }
      if (form.newPassword.length < 6) {
        setStatus({ type: 'error', text: 'New password must be at least 6 characters.' });
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setStatus({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
    }

    try {
      setIsSaving(true);
      const response = await api.patch('/api/users/me', {
        name: form.name.trim(),
        username: form.username.trim(),
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      });

      updateUser({
        ...user,
        name: response.data.name,
        username: response.data.username,
        avatarUrl: form.avatarUrl || null,
      });

      localStorage.setItem(
        'profileExtras',
        JSON.stringify({ email: form.email, phone: form.phone, avatarUrl: form.avatarUrl })
      );

      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setStatus({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      setStatus({ type: 'error', text: err.response?.data?.message ?? 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const role = user?.role as UserRole | undefined;
  const roleColor = role ? ROLE_COLORS[role] : null;
  const roleLabel = role ? ROLE_LABELS[role] : user?.role ?? '';
  const initials = (form.name || user?.name || 'U').charAt(0).toUpperCase();
  const passwordMismatch = !!form.confirmPassword && form.newPassword !== form.confirmPassword;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-6 px-2 sm:px-0">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Update your name, username, photo and password
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">

          {/* Status banner */}
          {status && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${
              status.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/20'
            }`}>
              {status.type === 'success' ? (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {status.text}
            </div>
          )}

          {/* Identity card */}
          <div className="bg-white dark:bg-[#141b27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">

            {/* Avatar row */}
            <div className="flex items-center gap-5 mb-7 pb-6 border-b border-gray-100 dark:border-gray-800">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-black overflow-hidden shadow-lg shadow-blue-500/20">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/50 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Change
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xl font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
                {roleColor && (
                  <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-bold border ${roleColor.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot}`} />
                    {roleLabel}
                  </span>
                )}
              </div>

              {/* Photo buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Photo
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => { setAvatarPreview(null); setForm((p) => ({ ...p, avatarUrl: '' })); }}
                    className="px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Remove
                  </button>
                )}
                <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center">Max 2 MB</p>
              </div>
            </div>

            {/* Personal info fields */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <InputField label="Full Name" value={form.name} onChange={set('name')} required placeholder="Your full name" />
              <InputField label="Username" value={form.username} onChange={set('username')} required placeholder="your_username" autoComplete="username" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@email.com"
                hint="Saved on this device only"
                autoComplete="email"
              />
              <InputField
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+234 ..."
                hint="Saved on this device only"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Change password */}
          <div className="bg-white dark:bg-[#141b27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Change Password</h2>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Leave blank to keep your current password.</p>

            <div className="space-y-4">
              <InputField
                label="Current Password"
                type="password"
                value={form.currentPassword}
                onChange={set('currentPassword')}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="New Password"
                  type="password"
                  value={form.newPassword}
                  onChange={set('newPassword')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  hint="Min. 6 characters"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword')(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none transition-colors focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 ${
                      passwordMismatch
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  />
                  {passwordMismatch && (
                    <p className="text-xs text-red-500">Passwords don't match</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account info (read-only) */}
          <div className="bg-white dark:bg-[#141b27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Account Details</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Role</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{roleLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Status</p>
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Active
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">User ID</p>
                <p className="font-mono text-xs text-gray-500 dark:text-gray-500 truncate" title={user?.id}>{user?.id}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Changes to name and username are saved to the server.
              <br />Email and phone are saved on this device only.
            </p>
            <button
              type="submit"
              disabled={isSaving || passwordMismatch}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}