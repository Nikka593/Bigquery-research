# KenkoLab Daily - 自動化システム セットアップガイド

## 必要なもの

1. **Anthropic API キー**（Claude APIアクセス）
   - https://console.anthropic.com で取得
   - モデル：claude-opus-4-6

2. **X (Twitter) Developer API**（Basic以上のプランが必要）
   - https://developer.x.com で申請
   - 必要な権限：Read + Write

## セットアップ手順

```bash
# 1. Python 3.11+ がインストールされていることを確認
python --version

# 2. 依存パッケージのインストール
pip install -r requirements.txt

# 3. 環境変数の設定
cp .env.example .env
# .envファイルを開いて、APIキーを入力

# 4. テスト（ドライラン）
python scheduler.py --preview

# 5. 内容を確認したら本番投稿
# .env の DRY_RUN=false に変更してから：
python scheduler.py --post-now
```

## 使い方（3パターン）

### A. 完全自動モード（推奨：慣れてから）
```bash
# サーバー or PC を起動したまま実行
TZ=Asia/Tokyo python scheduler.py

# または systemd/cron で自動起動設定
```

### B. 毎朝レビューモード（推奨：最初の2週間）
```bash
# 毎朝6時に実行してレビュー・承認
python manual_post.py

# 本番投稿する場合
python manual_post.py --live
```

### C. プレビューのみ
```bash
# 投稿内容を確認するだけ（何も投稿しない）
python scheduler.py --preview
```

## ファイル構成

```
03_automation/
├── .env.example        # 環境変数テンプレート
├── requirements.txt    # Python依存パッケージ
├── research_fetcher.py # Claude APIで研究収集・ツイート生成
├── twitter_poster.py   # X APIで投稿
├── scheduler.py        # スケジューラー（メインエントリーポイント）
├── manual_post.py      # 手動レビュー・承認ツール
└── README.md           # このファイル
```

## 注意事項

- `DRY_RUN=true` の間は実際の投稿は行われません
- X API の無料プランでは投稿できません（Basic プラン: $100/月が必要）
- 1日3投稿はX APIのレート制限内に収まります
- 誤情報防止のため、最初の2週間は手動レビューモードを推奨

## トラブルシューティング

**Claude API エラーの場合：**
```bash
# APIキーの確認
echo $ANTHROPIC_API_KEY
```

**Twitter API エラーの場合：**
- Developer Portal でアプリの権限を確認（Read + Write が必要）
- Access Token を再生成してみる

**投稿内容が気に入らない場合：**
- `manual_post.py` の `[r]egenerate` オプションで再生成
- または `research_fetcher.py` の `TWEET_GENERATION_PROMPT` を調整
