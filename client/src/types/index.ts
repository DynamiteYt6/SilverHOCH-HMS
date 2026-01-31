export interface User {
  id: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Room {
  id: string;
  number: number;
  type: 'FAN' | 'AC';
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'RESERVED';
  floor: number;
  createdAt: string;
}