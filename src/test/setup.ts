/**
 * テスト共通セットアップファイル
 * bcryptのモック設定を統一
 */
import { vi } from "vitest";

// bcryptモックの統一設定
vi.mock("bcrypt", () => ({
  hashSync: vi.fn(
    (password: string, _saltRounds: number) => `hashed_${password}`
  ),
  compareSync: vi.fn(
    (password: string, hash: string) => hash === `hashed_${password}`
  ),
  hash: vi.fn((password: string, _saltRounds: number) =>
    Promise.resolve(`hashed_${password}`)
  ),
  compare: vi.fn((password: string, hash: string) =>
    Promise.resolve(hash === `hashed_${password}`)
  ),
}));
