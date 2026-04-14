# Gemini in BigQuery — AI機能・連携 Deep Research レポート（2025〜2026年）

> 調査日：2026年3月9日
> 対象期間：2025年1月1日以降に公開された情報

---

## 1. Gemini in BigQuery の主要機能リスト

### 1-1. AI Query Engine（AIクエリエンジン）

| 項目 | 内容 |
|------|------|
| 機能名 | BigQuery AI Query Engine |
| 状態 | Experimental（実験的提供） |
| 概要 | 従来の構造化データ取得に留まらず、構造化・非構造化データを同時処理。SQL と自然言語プロンプトを単一クエリ内で組み合わせ、LLM呼び出しを BigQuery の実行計画に直接統合。Gemini の言語理解・推論能力をリアルタイムでクエリに注入可能。 |
| 活用例 | 大量のレビューテキスト（非構造化）と売上データ（構造化）を JOIN して、感情ごとの売上影響を一括分析 |

---

### 1-2. マネージド AI 関数（Managed AI Functions）

Google Cloud Next '25（2025年4月）で発表・プレビュー提供開始。

| 関数名 | 用途 | 活用例 |
|--------|------|--------|
| `AI.GENERATE` | テキスト・構造化データの生成（GA） | 商品説明の自動生成、レポート文章の自動要約 |
| `AI.GENERATE_TABLE` | 構造化テーブル形式での出力（GA） | JSON・テーブル形式でLLM出力を取得 |
| `AI.EMBED` | テキスト・画像の埋め込みベクトル生成（GA） | セマンティック検索用ベクトル生成 |
| `AI.SIMILARITY` | テキスト・画像間のコサイン類似度計算（GA） | 類似商品・類似文書の検索 |
| `AI.IF` | 自然言語条件によるフィルタリング・結合 | 「ネガティブなレビューを除外」などの意味的フィルタ |
| `AI.CLASSIFY` | テキスト・画像の自動分類 | 顧客フィードバックをカテゴリ別に自動分類 |
| `AI.SCORE` | 自然言語基準によるスコアリング・ランキング | 「最も関連性が高い製品を上位表示」 |
| `AI.FORECAST` | TimesFM による時系列予測（GA） | 売上・需要の将来予測（再学習不要） |

**パフォーマンス改善：** `AI.IF` / `AI.SCORE` / `AI.CLASSIFY` については最大 **100倍の性能向上** を実現（業界初）。

---

### 1-3. BigQuery Knowledge Engine（ナレッジエンジン）

| 項目 | 内容 |
|------|------|
| 状態 | Preview（プレビュー） |
| 概要 | Gemini がスキーマ関係・テーブル説明・クエリ履歴を解析し、メタデータを自動生成。データ間の関係性をモデル化し、ビジネス用語集の用語推薦も行う。AI活用体験全体の基盤となる。 |
| 活用例 | 初めて触れるデータセットのスキーマを自動解析し、適切なビジネス用語タグを付与してデータカタログを自動整備 |

---

### 1-4. BigQuery Data Canvas（データキャンバス）

| 項目 | 内容 |
|------|------|
| 状態 | GA + 新機能追加（2025年） |
| 概要 | 自然言語プロンプト1つでデータ探索〜可視化までをカバーするAIアシスタントチャット体験。テーブルを選択するとGeminiが自動でプロンプト候補を提示。 |
| 活用例 | 「売上上位10顧客を見せて」と入力するだけでSQLクエリと対応グラフを自動生成 |

---

### 1-5. Data Engineering Agent（データエンジニアリングエージェント）

| 項目 | 内容 |
|------|------|
| 状態 | Preview（一部機能はGA） |
| 概要 | Gemini 搭載の自律型エージェント。自然言語でパイプライン要件を記述するだけでSQLコードを自動生成。既存パイプラインの変更・修正、メタデータ生成、データ品質の異常検知も対応。Dataplex と連携してガバナンスも統合。 |
| 活用例 | ETL移行時に既存スクリプトを100%自動複製し、手動作業を90%削減（実績） |

---

### 1-6. Contribution Analysis（寄与度分析）

| 項目 | 内容 |
|------|------|
| 状態 | GA（2025年） |
| 概要 | ビジネス指標の変化要因を自動特定。最も大きな変化をもたらしたファクターを自動的にピンポイントで特定。 |
| 活用例 | 先月比で売上が急落した際に、地域・商品カテゴリ・チャネルの組み合わせから原因を自動特定 |

---

### 1-7. BigQuery MCP Server（MCPサーバー）

| 項目 | 内容 |
|------|------|
| 状態 | Preview（2026年1月〜、2026年3月17日以降は自動有効化） |
| 概要 | Model Context Protocol (MCP) を使い、VS Code・Cursor・Clineなどの IDE から BigQuery に自然言語でクエリ可能。セマンティック検索により、ベクトル類似度検索も統合。 |
| 活用例 | Gemini CLIから「先月の売上トップ商品を教えて」と入力するだけで、BigQuery へのSQL発行〜結果取得を自動実行 |

---

## 2. 自然言語SQL生成機能（NL2SQL）の詳細

### 2-1. 主な動作フロー

```
ユーザーが自然言語でプロンプト入力
          ↓
BigQuery Knowledge Engine がスキーマ・クエリ履歴を参照
          ↓
Gemini がコンテキストを理解し SQL を生成
          ↓
ユーザーがプレビュー・修正・実行
          ↓
結果を Data Canvas で可視化
```

### 2-2. 利用方法（3つのエントリーポイント）

| 方法 | 説明 |
|------|------|
| **BigQuery クエリエディタ** | エディタ上で自然言語コメントを記述すると Gemini が SQL を自動補完・生成 |
| **Data Canvas チャット** | 「トップ10顧客を売上順で」などの自然言語を入力し、グラフ付きで回答を取得 |
| **Gemini CLI + MCP Toolbox** | IDE・CLI から自然言語でクエリを発行。スキーマ自動発見も対応 |

### 2-3. 精度・品質向上の仕組み

- **Gemini 1.5 Flash の明確化機能：** クエリやスキーマが曖昧な場合、Gemini が自動で確認質問を行い SQL の精度を向上。
- **In-Context Learning：** ビジネス用語集・過去クエリ履歴を元にコンテキスト学習し、組織固有の言葉遣いに対応。
- **BigQuery Knowledge Engine との統合：** スキーマ関係・テーブル説明を動的に解析し、適切なテーブルを自動選択。

---

## 3. 活用ユースケースの要約

### 業種別ユースケース

| 業種 | ユースケース | 成果 |
|------|-------------|------|
| **ホテル・旅行** | Radisson Hotel Group：Geminiファインチューニング＋BigQueryでキャンペーン最適化 | キャンペーン生産性50%向上、収益20%以上増加 |
| **グローバルホテルチェーン** | コンテンツローカライゼーション自動化 | コンテンツ作成時間90%削減、広告収益22%増、ROAS 35%改善 |
| **金融** | Deutsche Bank：AI活用クラウドエンジニア育成（6,000名以上） | 開発者の作業時間40〜50%削減、文書処理精度97% |
| **医療** | 7,000以上の病院でGeminiを活用したトリアージ・受付チャットボット展開 | 医療従事者の負荷軽減、患者対応速度向上 |
| **データエンジニアリング** | ETLパイプライン移行自動化（Data Engineering Agent） | 手動作業90%削減、移行100%自動化 |

### 分析・BI 領域のユースケース

- **マルチステップ分析の自動化：** アナリストが複雑な JOIN クエリを記述不要で、自然言語指示のみでアドホック分析を実行。
- **異常検知と要因分析：** Contribution Analysis により、KPI が急変した際の主要因を自動特定。
- **時系列予測（需要予測・売上予測）：** `AI.FORECAST`（TimesFM）により、モデル再学習なしで数百万件の時系列を単一クエリで予測。
- **非構造化データ分析：** 顧客レビュー・SNS投稿・PDFレポートを構造化データと同時分析。
- **セマンティック検索：** `AI.EMBED` + `AI.SIMILARITY` を使ったベクトル検索により、意味的な類似度でデータ検索。

---

## 参照URL

- [Gemini in BigQuery overview | Google Cloud Documentation](https://docs.cloud.google.com/bigquery/docs/gemini-overview)
- [BigQuery release notes | Google Cloud Documentation](https://docs.cloud.google.com/bigquery/docs/release-notes)
- [New BigQuery gen AI functions for better data analysis | Google Cloud Blog](https://cloud.google.com/blog/products/data-analytics/new-bigquery-gen-ai-functions-for-better-data-analysis)
- [SQL reimagined for the AI era with BigQuery AI functions | Google Cloud Blog](https://cloud.google.com/blog/products/data-analytics/sql-reimagined-for-the-ai-era-with-bigquery-ai-functions)
- [Data analytics innovations at Next'25 | Google Cloud Blog](https://cloud.google.com/blog/products/data-analytics/data-analytics-innovations-at-next25)
- [NL2SQL with BigQuery and Gemini | Google Cloud Blog](https://cloud.google.com/blog/products/data-analytics/nl2sql-with-bigquery-and-gemini)
- [Exploring the Data Engineering Agent in BigQuery | Google Cloud Blog](https://cloud.google.com/blog/products/data-analytics/exploring-the-data-engineering-agent-in-bigquery)
- [TimesFM models in BigQuery and AlloyDB | Google Cloud Blog](https://cloud.google.com/blog/products/data-analytics/timesfm-models-in-bigquery-and-alloydb)
- [Using the fully managed remote BigQuery MCP server | Google Cloud Blog](https://cloud.google.com/blog/products/data-analytics/using-the-fully-managed-remote-bigquery-mcp-server-to-build-data-ai-agents)
- [BigQuery emerges as autonomous data-to-AI platform | Google Cloud Blog](https://cloud.google.com/blog/products/data-analytics/bigquery-emerges-as-autonomous-data-to-ai-platform)
- [Google Cloud Next'25 — BigQuery as a Unified Data and AI Platform | Medium](https://medium.com/google-cloud/google-cloud-next25-bigquery-as-a-unified-data-and-ai-platform-5b2d59b23205)
- [Effortless AI in BigQuery: Meet the New Managed AI Functions | Medium](https://medium.com/google-cloud/effortless-ai-in-bigquery-meet-the-new-managed-ai-functions-fc7d8dcefc61)
