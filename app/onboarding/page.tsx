import Link from "next/link";
import { CharacterWizard } from "@/components/CharacterWizard";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-text">
          ← ホーム
        </Link>
        <h1 className="text-xl font-semibold mt-1">新しいキャラクターを作る</h1>
        <p className="text-sm text-muted">
          手入力で作るか、1行のシードからAIに補完させるかを選べます。
          あとから編集も可能です。
        </p>
      </div>
      <CharacterWizard />
    </div>
  );
}
