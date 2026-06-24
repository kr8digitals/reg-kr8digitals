import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function PageShell({
  children,
  logoSize = 92,
  maxWidth = "max-w-xl",
}: {
  children: ReactNode;
  logoSize?: number;
  maxWidth?: string;
}) {
  return (
    <div className="bg-space w-full">
      <div className="mx-auto flex min-h-dvh w-full flex-col items-center px-4 py-8 sm:py-12">
        <div className="mb-6 flex justify-center">
          <Logo size={logoSize} />
        </div>
        <div className={`w-full ${maxWidth} fade-in`}>{children}</div>
      </div>
    </div>
  );
}
