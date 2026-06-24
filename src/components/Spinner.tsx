export function Spinner({ large = false }: { large?: boolean }) {
  return <span className={`kr8-spinner${large ? " lg" : ""}`} role="status" aria-label="Loading" />;
}

export function FullSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <Spinner large />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
}
