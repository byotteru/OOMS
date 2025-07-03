import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleApiError, showApiError, showApiSuccess } from "./apiHelpers";

// Window.apiモックの設定
const mockApi = {
  showErrorDialog: vi.fn(),
  showInfoDialog: vi.fn(),
};

Object.defineProperty(window, "api", {
  value: mockApi,
  writable: true,
});

describe("API Helper Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.showErrorDialog.mockResolvedValue(undefined);
    mockApi.showInfoDialog.mockResolvedValue(undefined);
  });

  describe("handleApiError", () => {
    it("handles Error objects", () => {
      const error = new Error("テストエラー");
      const result = handleApiError(error);

      expect(result).toEqual({
        message: "Unknown error occurred",
        code: "UNKNOWN_ERROR",
        detail: "テストエラー",
      });
    });

    it("handles string errors", () => {
      const error = "エラーメッセージ";
      const result = handleApiError(error);

      expect(result).toEqual({
        message: "Unknown error occurred",
        code: "UNKNOWN_ERROR",
        detail: "エラーメッセージ",
      });
    });

    it("handles ApiError objects", () => {
      const error = {
        code: "TEST_ERROR",
        message: "テストエラー",
      };
      const result = handleApiError(error);

      expect(result).toEqual(error);
    });

    it("handles unknown error types", () => {
      const error = { unknown: "object" };
      const result = handleApiError(error);

      expect(result).toEqual({
        message: "Unknown error occurred",
        code: "UNKNOWN_ERROR",
        detail: "[object Object]",
      });
    });
  });

  describe("showApiError", () => {
    it("shows error dialog with ApiError object", async () => {
      const apiError = {
        message: "テストエラー",
        code: "TEST_ERROR",
      };

      await showApiError(apiError);

      expect(mockApi.showErrorDialog).toHaveBeenCalledWith(
        "エラー",
        "テストエラー"
      );
    });

    it("shows error dialog with detail", async () => {
      const apiError = {
        message: "テストエラー",
        code: "TEST_ERROR",
        detail: "エラーの詳細",
      };

      await showApiError(apiError);

      expect(mockApi.showErrorDialog).toHaveBeenCalledWith(
        "エラー",
        "テストエラー\n詳細: エラーの詳細"
      );
    });
  });

  describe("showApiSuccess", () => {
    it("shows success dialog", async () => {
      await showApiSuccess("成功メッセージ");

      expect(mockApi.showInfoDialog).toHaveBeenCalledWith(
        "成功",
        "成功メッセージ"
      );
    });
  });
});
