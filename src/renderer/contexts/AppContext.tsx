/*C:\Users\byott\Documents\OOMS\src\renderer\contexts\AppContext.tsx*/

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { handleApiError, showApiError } from "../utils/apiHelpers";

// 型定義（database.tsから参照）
export interface Staff {
  id: number;
  name: string;
  is_active: number;
  display_order?: number;
}

// User型（APIから取得するデータの型）
export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  is_active: number;
  display_order?: number;
}

export interface Item {
  id: number;
  name: string;
  price: number;
  is_active: number;
  display_order?: number;
  options?: ItemOption[];
}

export interface ItemOption {
  id: number;
  item_id: number;
  name: string;
  price_adjustment: number;
}

export interface Settings {
  garden_name?: string;
  garden_address?: string;
  supplier_name?: string;
  supplier_address?: string;
  supplier_phone?: string;
  // キャメルケースでもアクセス可能
  gardenName?: string;
  gardenAddress?: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  [key: string]: string | undefined;
}

// Context の型定義
interface AppContextType {
  staffList: Staff[];
  itemList: Item[];
  settings: Settings | null;
  isLoading: boolean;
  fetchInitialData: () => Promise<void>;
  refreshStaff: () => Promise<void>;
  refreshItems: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

// デフォルト値
const defaultSettings: Settings = {
  garden_name: "",
  garden_address: "",
  supplier_name: "",
  supplier_address: "",
  supplier_phone: "",
};

// Context の作成
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider コンポーネント
interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({
  children,
}) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [itemList, setItemList] = useState<Item[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // スタッフデータの取得（usersテーブルから取得）
  const refreshStaff = useCallback(async () => {
    console.log("🔄 AppContext.refreshStaff開始...");
    try {
      // getStaff() の代わりに getUsers() を使用
      console.log("📡 window.api.getUsers()呼び出し...");
      const users: User[] = await window.api.getUsers();
      console.log("✅ getUsers()成功 - 取得ユーザー数:", users.length);

      // 表示用に必要なフィールドのみ抽出
      const staffData: Staff[] = users
        .filter((user: User) => user.is_active)
        .map((user: User) => ({
          id: user.id,
          name: user.name,
          is_active: user.is_active,
          display_order: user.display_order || 999,
        }))
        .sort((a, b) => a.display_order - b.display_order);

      console.log("🔍 フィルタリング後のスタッフ数:", staffData.length);
      console.log(
        "📋 スタッフリスト:",
        staffData.map((s) => ({ id: s.id, name: s.name }))
      );

      setStaffList(Array.isArray(staffData) ? staffData : []);
      console.log("✅ AppContext.refreshStaff完了");
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("❌ スタッフデータの取得に失敗しました:", apiError);
      setStaffList([]); // エラー時は空配列をセット
      await showApiError(apiError);
    }
  }, []);

  // 弁当データの取得
  const refreshItems = useCallback(async () => {
    try {
      const items = await window.api.getItems();
      setItemList(Array.isArray(items) ? items : []);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("弁当データの取得に失敗しました:", apiError);
      setItemList([]); // エラー時は空配列をセット
      await showApiError(apiError);
    }
  }, []);

  // 設定データの取得
  const refreshSettings = useCallback(async () => {
    try {
      const settingsData = await window.api.getSettings();
      setSettings(settingsData);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("設定データの取得に失敗しました:", apiError);
      await showApiError(apiError);
    }
  }, []);

  // 全データの一括取得（設計書通りの関数名に変更）
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([refreshStaff(), refreshItems(), refreshSettings()]);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("初期データの取得に失敗しました:", apiError);
      await showApiError(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchInitialData();
  }, []);

  const contextValue: AppContextType = {
    staffList,
    itemList,
    settings,
    isLoading,
    fetchInitialData,
    refreshStaff,
    refreshItems,
    refreshSettings,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

// カスタムフック
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};
