// TypeScript定義の追加
import { Staff, Item, ItemOption, Settings } from "./contexts/AppContext";

// main/database.tsと完全に統一された型定義
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  role_id: number;
  is_active: number;
  display_order?: number;
}

export interface Role {
  id: number;
  name: string;
}

export interface Order {
  id: number;
  order_date: string;
  user_id: number;
  status: string;
  locked_at?: string;
  locked_by_user_id?: number;
  created_at: string;
}

export interface OrderDetail {
  id: number;
  order_id: number;
  item_id: number;
  quantity: number;
  remarks?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  target_entity: string;
  target_id?: number;
  details?: string;
  created_at: string;
}

export interface OrderView {
  id: number;
  order_date: string;
  user_name: string;
  item_name: string;
  quantity: number;
  price: number;
  total_price: number;
  remarks?: string;
  options?: string[];
  status: string;
}

export interface NewOrder {
  order_date: string;
  user_id: number;
  items: {
    item_id: number;
    quantity: number;
    remarks?: string;
    option_ids?: number[];
  }[];
}

export interface WeeklyReport {
  week_start: string;
  week_end: string;
  startDate: string; // フォーマット用
  endDate: string; // フォーマット用
  items: {
    [itemName: string]: {
      [day: string]: number;
    };
  };
  totals: {
    [day: string]: number;
  };
  totalSummary: {
    item_name: string;
    total_quantity: number;
  }[];
  days: {
    date: string;
    items: {
      item_name: string;
      quantity: number;
    }[];
  }[];
}

export interface MonthlyReport {
  month: string;
  staff_totals: {
    staff_name: string;
    total_amount: number;
  }[];
  grand_total: number;
  is_locked: boolean;
  locked_at?: string;
  locked_by?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface WeeklyOrderData {
  staff_id: number;
  order_date: string; // YYYY-MM-DD format
  item_id: number;
  quantity: number;
  status?: string; // 'open', 'locked'
}
