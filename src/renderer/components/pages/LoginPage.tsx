import React, { useState } from "react";
import Button from "../ui/Button";
import LoadingIndicator from "../ui/LoadingIndicator";

interface LoginPageProps {
  onLogin: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await window.api.login(email, password);
      onLogin(user);
    } catch (error: any) {
      console.error("ログインエラー:", error);
      if (error.code === "AUTH_FAILED") {
        setError("メールアドレスまたはパスワードが正しくありません");
      } else {
        setError("ログインに失敗しました。しばらくしてから再度お試しください");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="login-form">
          <LoadingIndicator message="認証中..." />
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <h1 className="login-title">🍱 OOMS</h1>
          <p className="login-subtitle">お弁当注文管理システム</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isLoading}
            className="login-button"
          >
            ログイン
          </Button>
        </form>

        <div className="login-footer">
          <p className="text-muted">
            デフォルトアカウント: admin@example.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
