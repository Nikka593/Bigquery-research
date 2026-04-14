"use client";

import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface SceneImageProps {
  messageId: string;
  imageUrl: string | null;
  status: "pending" | "ready" | "failed" | "skipped";
  saved: boolean;
  onRegenerate?: () => void;
  busy?: boolean;
}

export function SceneImage({
  messageId,
  imageUrl,
  status,
  saved,
  onRegenerate,
  busy,
}: SceneImageProps) {
  if (status === "skipped" && !imageUrl) return null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-bg overflow-hidden">
      <div className="relative aspect-[5/7] w-full max-w-sm bg-panelAlt">
        {status === "pending" || busy ? (
          <div className="absolute inset-0 shimmer" />
        ) : null}
        {status === "ready" && imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="scene"
            className="w-full h-full object-cover"
          />
        ) : null}
        {status === "failed" && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-danger px-4 text-center">
            画像生成に失敗しました
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-2 py-2 bg-panel">
        <span className="text-xs text-muted">
          {status === "pending"
            ? "シーン生成中..."
            : status === "ready"
              ? saved
                ? "保存済み"
                : "シーン画像"
              : status === "failed"
                ? "失敗"
                : ""}
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onRegenerate}
            disabled={busy}
            title="新しいシードで再生成"
          >
            <RefreshCw size={14} />
            再生成
          </Button>
          <a
            href={`/api/scene/${messageId}/save`}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-2 h-8 px-3 text-sm rounded-md text-muted hover:text-text hover:bg-panelAlt ${
              status === "ready" ? "" : "pointer-events-none opacity-40"
            }`}
            title="PNGとしてダウンロード"
          >
            <Download size={14} />
            保存
          </a>
        </div>
      </div>
    </div>
  );
}
