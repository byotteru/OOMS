// APIエラーオブジェクトの型定義
export interface ApiError {
  code: string;
  message: string;
  detail?: string;
}

// API呼び出し用のヘルパー関数
export const handleApiError = (error: unknown): ApiError => {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error
  ) {
    return error as ApiError;
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "Unknown error occurred",
    detail: error instanceof Error ? error.message : String(error),
  };
};

// エラーダイアログ表示用のヘルパー関数
export const showApiError = async (error: ApiError | unknown) => {
  const apiError =
    error instanceof Error ? handleApiError(error) : (error as ApiError);

  try {
    await window.api.showErrorDialog(
      "エラー",
      `${apiError.message}${
        apiError.detail ? `\n詳細: ${apiError.detail}` : ""
      }`
    );
  } catch (dialogError) {
    console.error("Error showing dialog:", dialogError);
    // フォールバック: ブラウザアラート
    alert(`エラー: ${apiError.message}`);
  }
};

// 成功ダイアログ表示用のヘルパー関数
export const showApiSuccess = async (message: string) => {
  try {
    await window.api.showInfoDialog("成功", message);
  } catch (dialogError) {
    console.error("Error showing dialog:", dialogError);
    // フォールバック: ブラウザアラート
    alert(`成功: ${message}`);
  }
};
