# OOMS 画面遷移・React アーキテクチャ ガイド

## 📖 概要

このドキュメントは、OOMS（お弁当注文管理システム）における画面遷移の仕組みと、React 移行後のアーキテクチャについて説明します。

## 🔄 画面遷移システム

### 1. 基本アーキテクチャ

OOMS は React Single Page Application（SPA）として構築されており、以下の構造で画面遷移を実現しています：

```
App.tsx (ルートコンポーネント)
├── サイドバーナビゲーション
├── メインコンテンツエリア
└── AppContextProvider (グローバル状態管理)
```

### 2. 画面切り替えメカニズム

#### 状態管理

```typescript
const [activeTab, setActiveTab] = useState("data-entry");
```

- `activeTab`: 現在表示している画面を示す文字列
- 初期値: `"data-entry"` (注文入力画面)

#### 画面レンダリング

```typescript
const renderContent = () => {
  switch (activeTab) {
    case "data-entry":
      return <DataEntryPage />;
    case "daily-list":
      return <DailyListPage />;
    case "staff-master":
      return <StaffMasterPage />;
    case "item-master":
      return <ItemMasterPage />;
    case "weekly-report":
      return <WeeklyReportPage />;
    case "monthly-report":
      return <MonthlyReportPage />;
    case "settings":
      return <SettingsPage />;
    default:
      return <DataEntryPage />;
  }
};
```

### 3. 画面一覧と機能

| タブ ID          | コンポーネント      | 画面名         | 主な機能                       |
| ---------------- | ------------------- | -------------- | ------------------------------ |
| `data-entry`     | `DataEntryPage`     | 注文入力       | 日次弁当注文の入力・編集       |
| `daily-list`     | `DailyListPage`     | 当日リスト     | 当日注文の一覧表示・管理       |
| `staff-master`   | `StaffMasterPage`   | スタッフマスタ | スタッフ情報の登録・編集・削除 |
| `item-master`    | `ItemMasterPage`    | 弁当マスタ     | 弁当メニューの登録・編集・削除 |
| `weekly-report`  | `WeeklyReportPage`  | 週次レポート   | 週単位の注文集計・レポート     |
| `monthly-report` | `MonthlyReportPage` | 月次レポート   | 月単位の注文集計・レポート     |
| `settings`       | `SettingsPage`      | 設定           | アプリケーション設定           |

## 🏗️ React アーキテクチャ

### 1. コンポーネント階層

```
App.tsx
├── AppContextProvider
│   ├── サイドバーナビゲーション
│   └── メインコンテンツ
│       ├── DataEntryPage
│       ├── DailyListPage
│       ├── StaffMasterPage
│       ├── ItemMasterPage
│       ├── WeeklyReportPage
│       ├── MonthlyReportPage
│       └── SettingsPage
```

### 2. グローバル状態管理（AppContext）

#### 管理しているデータ

```typescript
interface AppContextType {
  // マスターデータ
  staff: Staff[];
  items: Item[];
  settings: Settings | null;

  // データ取得・更新関数
  fetchData: () => Promise<void>;
  refreshStaff: () => Promise<void>;
  refreshItems: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}
```

#### 使用方法

```typescript
// 各コンポーネントでの使用例
const context = useContext(AppContext);
if (!context) {
  throw new Error("AppContext must be used within AppContextProvider");
}
const { staff, items, refreshStaff, fetchData } = context;
```

### 3. データフロー

1. **初期化**: `App.tsx`で AppContextProvider が全データを取得
2. **表示**: 各ページコンポーネントが Context からデータを取得・表示
3. **更新**: データ変更時に個別の refresh 関数を呼び出し
4. **同期**: 全コンポーネントで最新データを共有

## 🛡️ 画面遷移の安定性確保

### 1. エラーハンドリング

#### デフォルト画面

```typescript
default:
  return <DataEntryPage />;
```

不正なタブ ID の場合、必ず注文入力画面が表示されます。

#### Context エラー処理

```typescript
if (!context) {
  throw new Error("AppContext must be used within AppContextProvider");
}
```

Context 未初期化時のエラーを早期発見します。

### 2. 型安全性

#### タブ ID の型定義

```typescript
type TabId =
  | "data-entry"
  | "daily-list"
  | "staff-master"
  | "item-master"
  | "weekly-report"
  | "monthly-report"
  | "settings";
```

#### Window.api 型定義

```typescript
// src/global.d.ts
declare global {
  interface Window {
    api: {
      getStaff(): Promise<Staff[]>;
      // ... 他のAPI定義
    };
  }
}
```

### 3. メモリ効率

- **条件付きレンダリング**: 非アクティブなコンポーネントは DOM から除去
- **データキャッシュ**: AppContext でマスターデータをメモリキャッシュ
- **必要時更新**: データ変更時のみ refresh 関数を実行

## 🚀 開発・運用ガイド

### 1. 新しい画面の追加手順

1. **コンポーネント作成**

   ```bash
   src/renderer/components/NewPage.tsx
   ```

2. **タブ ID 追加**

   ```typescript
   // App.tsx
   case "new-page":
     return <NewPage />;
   ```

3. **ナビゲーション追加**
   ```tsx
   <button
     className={activeTab === "new-page" ? "active" : ""}
     onClick={() => setActiveTab("new-page")}
   >
     新画面
   </button>
   ```

### 2. データ状態の追加

1. **型定義追加**

   ```typescript
   // types.ts
   export interface NewData {
     id: number;
     name: string;
   }
   ```

2. **Context 拡張**

   ```typescript
   // AppContext.tsx
   const [newData, setNewData] = useState<NewData[]>([]);
   ```

3. **API 追加**
   ```typescript
   // preload/index.ts
   getNewData: (): Promise<NewData[]> =>
     ipcRenderer.invoke("get-new-data"),
   ```

### 3. デバッグ・トラブルシューティング

#### よくある問題

1. **画面が表示されない**

   - `App.tsx`の switch 文でケースが正しく記載されているか確認
   - コンポーネントのインポート文を確認

2. **データが取得できない**

   - AppContext の`fetchData`が実行されているか確認
   - ブラウザ開発者ツールでネットワークエラーを確認

3. **型エラー**
   - `src/global.d.ts`の型定義を確認
   - tsconfig.json の設定を確認

#### デバッグ手法

1. **React DevTools**: コンポーネント状態・props の確認
2. **Console.log**: データフロー・状態変化の追跡
3. **TypeScript**: `npm run build`での型チェック

### 4. パフォーマンス最適化

#### 推奨パターン

1. **React.memo**: 重いコンポーネントの不要な再レンダリング防止

   ```typescript
   export default React.memo(StaffMasterPage);
   ```

2. **useMemo**: 重い計算のキャッシュ

   ```typescript
   const sortedStaff = useMemo(
     () => staff.sort((a, b) => a.displayOrder - b.displayOrder),
     [staff]
   );
   ```

3. **useCallback**: 関数の最適化
   ```typescript
   const handleStaffUpdate = useCallback((id: number, data: Staff) => {
     // 更新処理
   }, []);
   ```

## 📝 まとめ

OOMS の画面遷移は以下の特徴を持ちます：

- **単純で明確**: タブベースの直感的な画面切り替え
- **安定性**: エラーハンドリング・デフォルト画面による安全性
- **拡張性**: 新画面・機能の追加が容易
- **パフォーマンス**: 効率的なメモリ使用・レンダリング最適化

このアーキテクチャにより、確実で安定した画面遷移を実現しています。

---

**作成日**: 2024 年 12 月 24 日  
**バージョン**: React 移行版 v1.0.0
