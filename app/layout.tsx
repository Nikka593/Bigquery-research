import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SceneChat",
  description:
    "ローカルで動くキャラクター会話 × シーン画像生成。Ollama + ComfyUI。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <header className="border-b border-border bg-panel/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold tracking-wide text-text">
              SceneChat
            </Link>
            <nav className="flex gap-4 text-sm text-muted">
              <Link href="/" className="hover:text-text">
                ホーム
              </Link>
              <Link href="/onboarding" className="hover:text-text">
                新しいキャラ
              </Link>
              <Link href="/characters" className="hover:text-text">
                キャラ一覧
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
