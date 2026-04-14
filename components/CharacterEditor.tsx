"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

export interface CharacterEditorProps {
  initial: {
    id: string;
    name: string;
    persona: string;
    speakingStyle: string;
    appearanceText: string;
    basePrompt: string;
    negativePrompt: string;
    portraitPath: string | null;
  };
}

export function CharacterEditor({ initial }: CharacterEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial.name,
    persona: initial.persona,
    speakingStyle: initial.speakingStyle,
    appearanceText: initial.appearanceText,
    basePrompt: initial.basePrompt,
    negativePrompt: initial.negativePrompt,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<typeof form>) =>
    setForm((p) => ({ ...p, ...patch }));

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/characters/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`save failed: ${res.status}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失敗");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("このキャラクターと関連する会話を全て削除します。よいですか？"))
      return;
    await fetch(`/api/characters/${initial.id}`, { method: "DELETE" });
    router.push("/characters");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-panel p-4 space-y-4">
        <Field label="名前">
          <Input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </Field>
        <Field label="性格・背景 (persona)">
          <Textarea
            value={form.persona}
            onChange={(e) => update({ persona: e.target.value })}
          />
        </Field>
        <Field label="話し方">
          <Textarea
            value={form.speakingStyle}
            onChange={(e) => update({ speakingStyle: e.target.value })}
          />
        </Field>
        <Field label="見た目メモ (日本語)">
          <Textarea
            value={form.appearanceText}
            onChange={(e) => update({ appearanceText: e.target.value })}
          />
        </Field>
        <Field
          label="ビジュアルタグ (Stable Diffusion)"
          hint="シーン画像で毎回先頭に付きます"
        >
          <Textarea
            value={form.basePrompt}
            onChange={(e) => update({ basePrompt: e.target.value })}
          />
        </Field>
        <Field label="ネガティブプロンプト">
          <Textarea
            value={form.negativePrompt}
            onChange={(e) => update({ negativePrompt: e.target.value })}
          />
        </Field>
      </div>

      {error && (
        <div className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="danger" onClick={remove}>
          <Trash2 size={14} />
          削除
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={16} /> : null}
          保存
        </Button>
      </div>
    </div>
  );
}
