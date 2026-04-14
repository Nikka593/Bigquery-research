import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatRelative(unixSec: number): string {
  const ms = Date.now() - unixSec * 1000;
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}日前`;
  return new Date(unixSec * 1000).toLocaleDateString("ja-JP");
}
