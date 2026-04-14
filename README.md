# SceneChat — ローカルで動くキャラクター会話 × シーン画像生成

ブラウザでキャラクターと会話しながら、その都度シーンの画像が生成されるWebアプリ。
すべてローカルで動作します（Ollama + ComfyUI + SQLite）。クラウドAPIキー不要。

> このリポジトリの `docs/bigquery-research/` には、過去の BigQuery 調査ドキュメントが残してあります。SceneChat 本体とは無関係です。

## 主な機能

- **キャラクター作成ウィザード** — 手入力 / AI自動補完（1行シードからOllamaが5フィールド埋める）
- **会話** — Ollamaにストリーミングで応答させ、トークン単位で即時表示
- **シーン画像** — 応答ごとにComfyUIで自動生成。気に入らなければ「再生成」、いつでも「保存」でPNGダウンロード
- **永続化** — すべて `data/app.db` (SQLite) と `data/images/` に保存。ブラウザのlocalStorageに依存しないので、セッションをクリアしても過去の会話・キャラはホーム画面から呼び出せます

## アーキテクチャ

```
Browser ── /api/chat ──► Next.js ── HTTP ──► Ollama (LLM)
            /api/scene  (Node runtime)  ── HTTP ──► ComfyUI (SD)
                                       ── SQLite ──► data/app.db
                                       ── FS ──► data/images/*.png
```

詳細な設計は `/root/.claude/plans/merry-toasting-hollerith.md` 参照。

## セットアップ

### 1. 前提

- Node.js 20+
- [Ollama](https://ollama.com/) がローカルで起動 (`ollama serve`)
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) がローカルで起動
  - `python main.py --listen 127.0.0.1 --port 8188`
  - `models/checkpoints/` に SD1.5 / SDXL 等のチェックポイントを配置
- GPU 推奨（CPUでも動くが画像生成は実用速度ではない）

### 2. LLM モデルのダウンロード

日本語が得意なモデルを推奨:

```bash
ollama pull qwen2.5:7b
# あるいは: ollama pull gemma3:12b / hf.co/mradermacher/Llama-3.1-Swallow-8B-Instruct-v0.3-GGUF
```

### 3. アプリのセットアップ

```bash
git clone <this-repo>
cd Bigquery-research          # （リポジトリ名は歴史的経緯。中身はSceneChatです）
npm install
cp .env.local.example .env.local
# 必要に応じて .env.local を編集（特に SD_CHECKPOINT を実在するファイル名に）
npm run db:migrate            # SQLite スキーマを作成
npm run seed                  # サンプルキャラクター「リリィ」を投入（任意）
npm run dev                   # http://localhost:3000
```

### 4. 環境変数

`.env.local`:

```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
COMFYUI_BASE_URL=http://localhost:8188
SD_CHECKPOINT=anything-v5.safetensors  # ComfyUI/models/checkpoints/ にある実ファイル名
SD_WIDTH=640
SD_HEIGHT=896
SD_STEPS=22
SD_CFG=6.5
SD_SAMPLER=euler
SD_SCHEDULER=normal
DB_PATH=./data/app.db
IMAGES_DIR=./data/images
```

## 使い方

1. ホーム (`/`) → 「新しいキャラクターを作る」
2. **AI自動補完** タブで「雨が好きな図書委員の女の子」など1行入れて生成、または **手入力** タブで自分で書く
3. 任意で「ポートレイト試し生成」で見た目を確認
4. 「このキャラで会話を始める」 → チャット画面へ
5. メッセージを送ると、台詞が即ストリームされ、数秒後にシーン画像が差し込まれます
6. 各画像で:
   - **再生成** = 別シードで作り直し
   - **保存** = PNGとしてブラウザにダウンロード
7. ブラウザを閉じても、ホームに戻れば過去の会話が一覧表示され、クリックで再開できます

## 主要ファイル

| Path | 役割 |
|---|---|
| `lib/db/schema.ts`, `lib/db/migrate.ts` | SQLite スキーマと初期化 |
| `lib/ollama.ts` | Ollama HTTP クライアント (stream / json mode) |
| `lib/comfyui.ts` | ComfyUI ワークフロー実行 |
| `lib/workflows/basic-txt2img.json` | ComfyUI から「Save (API Format)」したテンプレ |
| `lib/scene-extractor.ts` | 台詞 → SDプロンプトに変換 (JSON mode) |
| `lib/character-autofill.ts` | シード → キャラカード5フィールド (JSON mode) |
| `lib/scene-pipeline.ts` | scene 抽出 + 画像生成 + DB更新の一連 |
| `app/api/chat/route.ts` | SSE で Ollama をストリーミング |
| `app/api/scene/route.ts` | シーン画像生成エンドポイント |
| `app/api/scene/[id]/regenerate/route.ts` | 別シードで作り直し |
| `app/api/scene/[id]/save/route.ts` | PNG ダウンロード |
| `app/images/[file]/route.ts` | `data/images/` の安全な配信 |
| `components/ChatWindow.tsx` | 会話 UI（ストリーム + 画像ポーリング） |
| `components/CharacterWizard.tsx` | オンボーディング（手入力/自動補完） |

## 動作確認

```bash
# 1. 外部サービスが上がっているか
curl http://localhost:11434/api/tags
curl http://localhost:8188/system_stats

# 2. 起動
npm run dev

# 3. /onboarding でキャラ作成 → /chat/[id] で会話 → 画像が出ること
```

## 既知の制約・スコープ外

- キャラクター一貫性は「ベースプロンプト固定」のみ（IP-Adapter / LoRA / ControlNet 未対応）
- 多キャラ同時登場は未対応
- モバイルレイアウト未最適化
- 音声合成（VOICEVOX 等）未対応

## ライセンス

このリポジトリのライセンスは未指定です（社内/個人検証用途）。
