export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange(v: boolean): void;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="viz-switch" disabled={disabled} onClick={() => onChange(!checked)}>
      <span className="viz-switch-knob" aria-hidden="true" />
      {label}
    </button>
  );
}
