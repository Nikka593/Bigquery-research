"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

type Mode = "manual" | "autofill";

interface FormState {
  name: string;
  persona: string;
  speakingStyle: string;
  appearanceText: string;
  basePrompt: string;
}

const EMPTY: FormState = {
  name: "",
  persona: "",
  speakingStyle: "",
  appearanceText: "",
  basePrompt: "",
};

export function CharacterWizard() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("autofill");
  const [seed, setSeed] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [autoLoading, setAutoLoading] = useState(false);
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [portraitPath, setPortraitPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<FormState>) =>
    setForm((p) => ({ ...p, ...patch }));

  const runAutofill = async () => {
    if (!seed.trim()) return;
    setError(null);
    setAutoLoading(true);
    try {
      const res = await fetch("/api/characters/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed }),
      });
      if (!res.ok) throw new Error(`autofill failed: ${res.status}`);
      const data = (await res.json()) as FormState;
      setForm(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "自動補完に失敗しました");
    } finally {
      setAutoLoading(false);
    }
  };

  const tryPortrait = async () => {
    if (!form.basePrompt.trim()) {
      setError("先にビジュアルタグ (basePrompt) を入力してください");
      return;
    }
    setError(null);
    setPortraitLoading(true);
    try {
      const res = await fetch("/api/characters/portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basePrompt: form.basePrompt }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `portrait failed: ${res.status}`);
      }
      const data = (await res.json()) as {
        imageUrl: string;
        imagePath: string;
      };
      setPortraitUrl(data.imageUrl);
      setPortraitPath(data.imagePath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ポートレイト生成に失敗");
    } finally {
      setPortraitLoading(false);
    }
  };

  const startChat = async () => {
    if (!form.name.trim()) {
      setError("名前は必須です");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const charRes = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          portraitPath: portraitPath ?? undefined,
        }),
      });
      if (!charRes.ok) throw new Error(`character create failed`);
      const character = (await charRes.json()) as { id: string };

      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      });
      if (!convRes.ok) throw new Error(`conversation create failed`);
      const conversation = (await convRes.json()) as { id: string };

      router.push(`/chat/${conversation.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-panel p-4">
        <div className="text-sm text-muted mb-2">作成方法</div>
        <div className="flex gap-2">
          <Button
            variant={mode === "autofill" ? "primary" : "secondary"}
            onClick={() => setMode("autofill")}
            size="sm"
          >
            <Sparkles size={14} />
            AI自動補完
          </Button>
          <Button
            variant={mode === "manual" ? "primary" : "secondary"}
            onClick={() => setMode("manual")}
            size="sm"
          >
            手入力
          </Button>
        </div>
        {mode === "autofill" && (
          <div className="mt-4 space-y-3">
            <Field
              label="シード (1行)"
              hint="例: 雨が好きな図書委員の女の子"
            >
              <Input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="人物像を1行で..."
              />
            </Field>
            <Button onClick={runAutofill} disabled={autoLoading || !seed.trim()}>
              {autoLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              {autoLoading ? "生成中..." : "AIで埋める"}
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-panel p-4 space-y-4">
        <div className="text-sm text-muted">
          フィールドはいつでも編集できます。AI補完の結果も自由に書き換えてください。
        </div>
        <Field label="名前">
          <Input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="リリィ"
          />
        </Field>
        <Field label="性格・背景 (persona)" hint="日本語で自由記述">
          <Textarea
            value={form.persona}
            onChange={(e) => update({ persona: e.target.value })}
            placeholder="図書委員。物静かで本と紅茶が好き..."
          />
        </Field>
        <Field label="話し方 (speakingStyle)">
          <Textarea
            value={form.speakingStyle}
            onChange={(e) => update({ speakingStyle: e.target.value })}
            placeholder="一人称『わたし』。落ち着いた敬語混じり。"
          />
        </Field>
        <Field label="見た目メモ (日本語)">
          <Textarea
            value={form.appearanceText}
            onChange={(e) => update({ appearanceText: e.target.value })}
            placeholder="銀色のロングヘア、青い瞳、紺色のセーラー服..."
          />
        </Field>
        <Field
          label="ビジュアルタグ (Stable Diffusion)"
          hint="英語タグ。シーン画像生成で毎回先頭に付きます。"
        >
          <Textarea
            value={form.basePrompt}
            onChange={(e) => update({ basePrompt: e.target.value })}
            placeholder="1girl, silver long hair, blue eyes, navy sailor uniform"
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border bg-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">ポートレイト試し生成 (任意)</div>
            <div className="text-xs text-muted">
              基本ビジュアルが意図通りか確認できます。スキップしてもOK。
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={tryPortrait}
            disabled={portraitLoading}
          >
            {portraitLoading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Camera size={14} />
            )}
            {portraitLoading ? "生成中..." : portraitUrl ? "再生成" : "生成"}
          </Button>
        </div>
        {portraitLoading && (
          <div className="aspect-[3/4] w-48 rounded-md border border-border shimmer" />
        )}
        {portraitUrl && !portraitLoading && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portraitUrl}
            alt="portrait"
            className="w-48 rounded-md border border-border"
          />
        )}
      </div>

      {error && (
        <div className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={startChat} disabled={submitting || !form.name.trim()}>
          {submitting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : null}
          このキャラで会話を始める
        </Button>
      </div>
    </div>
  );
}
