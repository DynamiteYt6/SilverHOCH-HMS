import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Room } from '../types';

type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'RESERVED';
type RoomType = 'FAN' | 'AC';

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    number: '',
    floor: '',
    type: 'FAN' as RoomType,
  });

  const canAddRoom = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get<Room[]>('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoomError(null);

    const parsedNumber = Number(newRoom.number);
    const parsedFloor = Number(newRoom.floor);

    if (!Number.isInteger(parsedNumber) || parsedNumber < 1) {
      setRoomError('Room number must be a positive integer.');
      return;
    }

    if (!Number.isInteger(parsedFloor) || parsedFloor < 0) {
      setRoomError('Floor must be 0 or greater.');
      return;
    }

    try {
      setIsCreatingRoom(true);
      const response = await api.post<Room>('/api/rooms', {
        number: parsedNumber,
        floor: parsedFloor,
        type: newRoom.type,
      });

      setRooms((prev) => [...prev, response.data].sort((a, b) => (a.floor - b.floor) || (a.number - b.number)));
      setIsAddRoomOpen(false);
      setNewRoom({ number: '', floor: '', type: 'FAN' });
    } catch (err: any) {
      setRoomError(err.response?.data?.message || 'Failed to add room.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Delete this room? This action cannot be undone.')) return;

    try {
      await api.delete(`/api/rooms/${roomId}`);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const updateRoomStatus = async (roomId: string, newStatus: RoomStatus) => {
    setUpdatingRoomId(roomId);
    try {
      await api.patch(`/api/rooms/${roomId}/status`, { status: newStatus });
      setRooms(rooms.map(room => room.id === roomId ? { ...room, status: newStatus } : room));
    } catch (error) {
      console.error('Failed to update room status:', error);
      alert('Failed to update room status');
    } finally {
      setUpdatingRoomId(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-500';
      case 'OCCUPIED':
        return 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-500';
      case 'CLEANING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-500';
      case 'RESERVED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-500';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading rooms...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage room status and availability</p>
        </div>
        {canAddRoom ? (
          <button
            onClick={() => {
              setRoomError(null);
              setIsAddRoomOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Room
          </button>
        ) : (
          <span className="text-xs font-semibold px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            Only super admin can add rooms
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a2130] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Rooms</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{rooms.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2130] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Available</p>
          <p className="text-2xl font-bold text-emerald-600">{rooms.filter(r => r.status === 'AVAILABLE').length}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2130] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Occupied</p>
          <p className="text-2xl font-bold text-red-600">{rooms.filter(r => r.status === 'OCCUPIED').length}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2130] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cleaning</p>
          <p className="text-2xl font-bold text-amber-600">{rooms.filter(r => r.status === 'CLEANING').length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a2130] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Room Number</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Floor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">{room.number}</div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Room {room.number}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{room.type === 'AC' ? 'Deluxe Room' : 'Standard Room'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-white font-medium">Floor {room.floor}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">{room.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusBadgeColor(room.status)}`}>{room.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <select
                        value={room.status}
                        onChange={(e) => updateRoomStatus(room.id, e.target.value as RoomStatus)}
                        disabled={updatingRoomId === room.id}
                        className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="OCCUPIED">Occupied</option>
                        <option value="CLEANING">Cleaning</option>
                        <option value="RESERVED">Reserved</option>
                      </select>
                      {canAddRoom && (
                        <button
                          onClick={() => deleteRoom(room.id)}
                          className="text-red-600 hover:text-red-700 text-xs font-bold"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No rooms found</p>
          </div>
        )}
      </div>

      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1a2130] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add New Room</h2>
            {roomError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{roomError}</p>}
            <form onSubmit={createRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Room Number</label>
                <input
                  type="number"
                  min={1}
                  value={newRoom.number}
                  onChange={(e) => setNewRoom((prev) => ({ ...prev, number: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Floor</label>
                <input
                  type="number"
                  min={0}
                  value={newRoom.floor}
                  onChange={(e) => setNewRoom((prev) => ({ ...prev, floor: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Room Type</label>
                <select
                  value={newRoom.type}
                  onChange={(e) => setNewRoom((prev) => ({ ...prev, type: e.target.value as RoomType }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                >
                  <option value="FAN">FAN</option>
                  <option value="AC">AC</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRoom}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50"
                >
                  {isCreatingRoom ? 'Adding...' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
