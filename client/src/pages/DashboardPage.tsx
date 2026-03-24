import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import type { Room } from '../types';

interface DashboardStats {
  totalRooms: number;
  occupied: number;
  available: number;
  cleaning: number;
}

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    occupied: 0,
    available: 0,
    cleaning: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState(1);

  // Fetch rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/api/rooms');
        const roomsData = response.data;
        setRooms(roomsData);

        // Calculate stats
        const statsData = {
          totalRooms: roomsData.length,
          occupied: roomsData.filter((r: Room) => r.status === 'OCCUPIED').length,
          available: roomsData.filter((r: Room) => r.status === 'AVAILABLE').length,
          cleaning: roomsData.filter((r: Room) => r.status === 'CLEANING').length,
        };
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Filter rooms by selected floor
  const filteredRooms = rooms.filter(room => room.floor === selectedFloor);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
      case 'OCCUPIED':
        return 'border-red-500 bg-red-50 dark:bg-red-500/10';
      case 'CLEANING':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-500/10';
      case 'RESERVED':
        return 'border-blue-600 bg-blue-50 dark:bg-blue-500/10';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'OCCUPIED':
        return 'text-red-600 dark:text-red-400';
      case 'CLEANING':
        return 'text-amber-600 dark:text-amber-400';
      case 'RESERVED':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'OCCUPIED':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'CLEANING':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'RESERVED':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Rooms */}
        <div className="bg-white dark:bg-[#1a2130] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Rooms</p>
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRooms}</p>
            <p className="text-emerald-500 text-sm font-bold mb-1">+0%</p>
          </div>
        </div>

        {/* Occupied */}
        <div className="bg-white dark:bg-[#1a2130] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Occupied</p>
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.occupied}</p>
            <p className="text-emerald-500 text-sm font-bold mb-1">
              {stats.totalRooms > 0 ? `${Math.round((stats.occupied / stats.totalRooms) * 100)}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white dark:bg-[#1a2130] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Available</p>
            <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.available}</p>
            <p className="text-emerald-500 text-sm font-bold mb-1">
              {stats.totalRooms > 0 ? `${Math.round((stats.available / stats.totalRooms) * 100)}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Cleaning */}
        <div className="bg-white dark:bg-[#1a2130] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Cleaning</p>
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.cleaning}</p>
            <p className="text-gray-400 text-sm font-bold mb-1">
              {stats.totalRooms > 0 ? `${Math.round((stats.cleaning / stats.totalRooms) * 100)}%` : '0%'}
            </p>
          </div>
        </div>
      </div>

      {/* Room Status Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Real-time Room Status</h2>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase">Available</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-xs font-bold text-red-600 dark:text-red-500 uppercase">Occupied</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase">Cleaning</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase">Reserved</span>
          </div>
        </div>
      </div>

      {/* Floor Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          <button
            onClick={() => setSelectedFloor(1)}
            className={`py-4 border-b-2 transition-colors ${
              selectedFloor === 1
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
            } text-sm font-bold`}
          >
            Floor 1
          </button>
          <button
            onClick={() => setSelectedFloor(2)}
            className={`py-4 border-b-2 transition-colors ${
              selectedFloor === 2
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
            } text-sm font-bold`}
          >
            Floor 2
          </button>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className={`${getStatusColor(room.status)} border-l-4 rounded-lg p-4 shadow-sm border-t border-r border-b border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{room.number}</h3>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold rounded uppercase text-gray-700 dark:text-gray-300">
                {room.type}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {room.type === 'AC' ? 'Deluxe Room' : 'Standard Room'}
            </p>
            <div className={`flex items-center gap-2 ${getStatusTextColor(room.status)}`}>
              {getStatusIcon(room.status)}
              <span className="text-xs font-bold">{room.status}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No rooms on this floor</p>
        </div>
      )}
    </Layout>
  );
}
