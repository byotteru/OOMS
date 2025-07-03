import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AppContextProvider, useAppContext } from "./AppContext";
import { mockStaff, mockItems, mockSettings } from "../../test/testUtils";

// Window.apiモックの設定
const mockApi = {
  getUsers: vi.fn(), // getStaffの代わりにgetUsersを使用
  getStaff: vi.fn(), // 後方互換性のため残す
  getItems: vi.fn(),
  getSettings: vi.fn(),
};

Object.defineProperty(window, "api", {
  value: mockApi,
  writable: true,
});

describe("AppContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // usersテーブル用のモックデータ（email、role_idなどを含む）
    const mockUsers = [
      {
        id: 1,
        name: "テストスタッフ1",
        email: "staff1@ooms.local",
        role_id: 2,
        is_active: 1,
        display_order: 1,
      },
      {
        id: 2,
        name: "テストスタッフ2",
        email: "staff2@ooms.local",
        role_id: 2,
        is_active: 1,
        display_order: 2,
      },
    ];
    mockApi.getUsers.mockResolvedValue(mockUsers); // getUsersを使用
    mockApi.getStaff.mockResolvedValue(mockStaff); // 後方互換性
    mockApi.getItems.mockResolvedValue(mockItems);
    mockApi.getSettings.mockResolvedValue(mockSettings);
  });

  it("provides initial state", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppContextProvider>{children}</AppContextProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    expect(result.current.staffList).toEqual([]);
    expect(result.current.itemList).toEqual([]);
    expect(result.current.settings).toEqual({
      garden_name: "",
      garden_address: "",
      supplier_name: "",
      supplier_address: "",
      supplier_phone: "",
    });
    expect(result.current.isLoading).toBe(true); // 初期状態ではloadingがtrue
  });

  it("fetches initial data on mount", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppContextProvider>{children}</AppContextProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    // 初期データ取得を待つ
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockApi.getUsers).toHaveBeenCalled(); // getStaffの代わりにgetUsers
    expect(mockApi.getItems).toHaveBeenCalled();
    expect(mockApi.getSettings).toHaveBeenCalled();
  });

  it("refreshStaff updates staffList", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppContextProvider>{children}</AppContextProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    await act(async () => {
      await result.current.refreshStaff();
    });

    expect(mockApi.getUsers).toHaveBeenCalled(); // getStaffの代わりにgetUsers
  });

  it("refreshItems updates itemList", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppContextProvider>{children}</AppContextProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    await act(async () => {
      await result.current.refreshItems();
    });

    expect(mockApi.getItems).toHaveBeenCalled();
  });

  it("refreshSettings updates settings", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppContextProvider>{children}</AppContextProvider>
    );

    const { result } = renderHook(() => useAppContext(), { wrapper });

    await act(async () => {
      await result.current.refreshSettings();
    });

    expect(mockApi.getSettings).toHaveBeenCalled();
  });

  it("throws error when used outside provider", () => {
    expect(() => {
      renderHook(() => useAppContext());
    }).toThrow("useAppContext must be used within an AppContextProvider");
  });
});
