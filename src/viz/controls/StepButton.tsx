export function StepButton({ label, onStep, disabled }: { label: string; onStep(): void; disabled?: boolean }) {
  return (
    <button type="button" className="button" onClick={onStep} disabled={disabled}>
      {label}
    </button>
  );
}
