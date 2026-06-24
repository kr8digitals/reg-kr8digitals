import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <div className="alert-error fade-in" role="alert">
      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-destructive" />
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function SuccessAlert({ children }: { children: ReactNode }) {
  return (
    <div className="alert-success fade-in" role="status">
      <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-cyan" />
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
