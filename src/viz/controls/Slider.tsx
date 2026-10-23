import { useId } from 'react';

export interface SliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange(v: number): void;
  format?(v: number): string;
  disabled?: boolean;
}

export function Slider({ label, min, max, step, value, onChange, format = String, disabled }: SliderProps) {
  const id = useId();
  return (
    <div className="viz-slider">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output htmlFor={id}>{format(value)}</output>
    </div>
  );
}
