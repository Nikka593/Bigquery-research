import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-text">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>,
): React.ReactElement {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={cn(
        "w-full h-10 rounded-md bg-panel border border-border px-3 text-text",
        "placeholder:text-muted focus:outline-none focus:border-accent",
        className,
      )}
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
): React.ReactElement {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={cn(
        "w-full min-h-[88px] rounded-md bg-panel border border-border px-3 py-2 text-text",
        "placeholder:text-muted focus:outline-none focus:border-accent resize-y",
        className,
      )}
    />
  );
}
