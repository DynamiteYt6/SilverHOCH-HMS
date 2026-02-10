import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'FRONT_DESK' | 'DRINKS_SELLER';

interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  FRONT_DESK: 'Front Desk',
  DRINKS_SELLER: 'Drinks Seller'
};

const roleTone: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  ADMIN: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
  FRONT_DESK: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  DRINKS_SELLER: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
};

export default function UsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: '' as UserRole | ''
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<StaffUser[]>('/api/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery =
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.username.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      await api.post('/api/users', newUser);
      setShowModal(false);
      setNewUser({ name: '', username: '', password: '', role: '' });
      await fetchUsers();
    } catch (err: any) {
      console.error('Failed to create user:', err);
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggleStatus = async (user: StaffUser) => {
    try {
      setError(null);
      const response = await api.patch<StaffUser>(`/api/users/${user.id}`, {
        isActive: !user.isActive
      });
      setUsers((prev) => prev.map((item) => (item.id === user.id ? response.data : item)));
    } catch (err: any) {
      console.error('Failed to update user status:', err);
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (user: StaffUser) => {
    const newPassword = window.prompt(`Enter a new password for ${user.name}:`);
    if (!newPassword) return;
    try {
      setError(null);
      await api.patch(`/api/users/${user.id}/password`, { newPassword });
      alert('Password updated successfully.');
    } catch (err: any) {
      console.error('Failed to reset password:', err);
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <Layout>
      <div className="px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <p className="text-gray-900 dark:text-white text-3xl font-black tracking-tight">Staff Directory</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Manage system access, roles, and security permissions for all hotel employees.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">person_add</span>
            Add New User
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-[#181e2a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-gray-400">search</span>
                <input
                  className="w-full bg-gray-50 dark:bg-[#101622] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg pl-12 pr-4 py-3 focus:ring-blue-600 focus:border-blue-600 placeholder:text-gray-400"
                  placeholder="Search staff by name or username..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0">
              <select
                className="bg-gray-50 dark:bg-[#101622] border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-lg text-gray-700 dark:text-white text-sm font-semibold"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as UserRole | 'ALL')}
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="FRONT_DESK">Front Desk</option>
                <option value="DRINKS_SELLER">Drinks Seller</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#181e2a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#101622]/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No users match your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#101622]/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                            {user.name
                              .split(' ')
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{user.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        @{user.username}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${roleTone[user.role]}`}
                        >
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                          <span className={`text-sm font-semibold ${user.isActive ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-2 text-gray-400 hover:text-amber-500 transition-colors"
                            title="Reset Password"
                          >
                            <span className="material-symbols-outlined text-lg">key</span>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <span className="material-symbols-outlined text-lg">power_settings_new</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#111318] w-full max-w-xl rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-white">Add New Staff Member</h2>
                <p className="text-gray-400 text-sm">Enter details to create a new internal user account.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-white text-sm font-medium">Full Name</span>
                  <input
                    className="w-full rounded-lg text-white border border-gray-700 bg-[#1c1f27] h-12 px-4 text-sm"
                    placeholder="e.g., John Doe"
                    value={newUser.name}
                    onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-white text-sm font-medium">Username</span>
                  <input
                    className="w-full rounded-lg text-white border border-gray-700 bg-[#1c1f27] h-12 px-4 text-sm"
                    placeholder="e.g., jdoe_silver"
                    value={newUser.username}
                    onChange={(event) => setNewUser({ ...newUser, username: event.target.value })}
                  />
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-white text-sm font-medium">Access Role</span>
                <select
                  className="w-full rounded-lg text-white border border-gray-700 bg-[#1c1f27] h-12 px-4 text-sm"
                  value={newUser.role}
                  onChange={(event) => setNewUser({ ...newUser, role: event.target.value as UserRole })}
                >
                  <option value="" disabled>
                    Select a role...
                  </option>
                  <option value="SUPER_ADMIN">Super Admin - Full system access</option>
                  <option value="ADMIN">Admin - Manage users and reports</option>
                  <option value="FRONT_DESK">Front Desk - Room bookings</option>
                  <option value="DRINKS_SELLER">Drinks Seller - Sales access</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-white text-sm font-medium">Temporary Password</span>
                <input
                  className="w-full rounded-lg text-white border border-gray-700 bg-[#1c1f27] h-12 px-4 text-sm"
                  placeholder="Enter password"
                  type="password"
                  value={newUser.password}
                  onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
