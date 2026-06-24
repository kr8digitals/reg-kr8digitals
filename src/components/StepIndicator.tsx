export function StepIndicator({ current, total }: { current: number; total: number }) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="mb-8 flex items-center justify-center gap-2 px-6">
      {steps.map((s, idx) => (
        <div key={s} className="flex flex-1 items-center last:flex-none">
          <span
            className={`step-dot ${s === current ? "active" : ""} ${s < current ? "done" : ""}`}
            aria-current={s === current ? "step" : undefined}
          />
          {idx < steps.length - 1 ? <span className={`step-line ${s < current ? "done" : ""}`} /> : null}
        </div>
      ))}
    </div>
  );
}
