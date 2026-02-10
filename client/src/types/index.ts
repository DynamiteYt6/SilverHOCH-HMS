export interface User {
  id: string;
  name: string;
  username?: string;
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

export interface InventoryItem {
  id: string;
  name: string;
  category: 'DRINK' | 'CONDOM';
  quantity: number;
  price: number;
  imageUrl?: string | null;
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'POS' | 'TRANSFER';

export interface Sale {
  id: string;
  item: InventoryItem;
  itemId: string;
  quantity: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  soldBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
}
