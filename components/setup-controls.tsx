"use client";

import { CheckIcon } from "./art";

type Option<T extends string> = [T, string];

export function optionsOf<T extends string>(labels: Record<T, string>): Option<T>[] {
  return Object.entries(labels) as Option<T>[];
}

interface ChoiceProps<T extends string> {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  // Plain mode's look: a white list, or a segmented bar for short answers. Hero always uses chips.
  layout?: "list" | "segments";
}

export function Choice<T extends string>({ options, value, onChange, label, layout = "list" }: ChoiceProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={`choices choices-${layout}`}>
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          className="choice"
          onClick={() => onChange(key)}
        >
          <span>{text}</span>
          {layout === "list" && value === key && (
            <span className="choice-tick">
              <CheckIcon />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface MultiProps<T extends string> {
  options: Option<T>[];
  value: T[];
  onToggle: (value: T) => void;
  label: string;
}

export function MultiChoice<T extends string>({ options, value, onToggle, label }: MultiProps<T>) {
  return (
    <div role="group" aria-label={label} className="choices choices-multi">
      {options.map(([key, text]) => {
        const on = value.includes(key);
        return (
          <button key={key} type="button" role="checkbox" aria-checked={on} className="choice" onClick={() => onToggle(key)}>
            <span className="choice-radio">{on && <CheckIcon size={12} />}</span>
            <span>{text}</span>
          </button>
        );
      })}
    </div>
  );
}

interface StepperProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}

export function Stepper({ value, min, max, unit, onChange }: StepperProps) {
  return (
    <div className="stepper">
      <button type="button" className="stepper-btn minus" aria-label={`Fewer ${unit}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <div className="stepper-value" aria-live="polite">
        <strong>{value}</strong>
        <span>{unit}</span>
      </div>
      <button type="button" className="stepper-btn plus" aria-label={`More ${unit}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

export function PetRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="pet">
      <span className="pet-name">{label}</span>
      <div className="pet-control">
        <button type="button" aria-label={`Fewer: ${label}`} disabled={value <= 0} onClick={() => onChange(value - 1)}>
          −
        </button>
        <strong aria-live="polite">{value}</strong>
        <button type="button" className="plus" aria-label={`More: ${label}`} disabled={value >= 10} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="field-label">{children}</p>;
}
