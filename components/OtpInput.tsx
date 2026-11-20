"use client";

import { useRef } from "react";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";
import { OTP_LENGTH } from "@/helper/constants";

interface OtpInputProps {
  value: string;
  disabled?: boolean;
  hasError?: boolean;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
}

export default function OtpInput({
  value,
  disabled = false,
  hasError = false,
  onChange,
  onComplete,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");

  const update = (next: string) => {
    onChange(next);
    if (next.length === OTP_LENGTH) onComplete?.(next);
  };

  const focusBox = (index: number) => {
    refs.current[Math.min(Math.max(index, 0), OTP_LENGTH - 1)]?.focus();
  };

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    let typed = e.target.value.replace(/\D/g, "");
    if (!typed) return;

    // ঘরে আগে থেকে digit থাকলে পুরনোটা বাদ দিয়ে নতুনটা নাও
    if (digits[index] && typed.length > 1) {
      typed = typed.replace(digits[index], "");
    }

    // autofill হলে একসাথে একাধিক digit আসে
    if (typed.length > 1) {
      const next = (value.slice(0, index) + typed).slice(0, OTP_LENGTH);
      update(next);
      focusBox(next.length);
      return;
    }

    update((value.slice(0, index) + typed + value.slice(index + 1)).slice(0, OTP_LENGTH));
    focusBox(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        update(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        update(value.slice(0, index - 1) + value.slice(index));
        focusBox(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      focusBox(index - 1);
    } else if (e.key === "ArrowRight") {
      focusBox(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    update(pasted);
    focusBox(pasted.length);
  };

  // ফাঁকা ঘর রেখে পরের ঘরে যেতে দেবে না
  const handleFocus = (index: number) => {
    const firstEmpty = Math.min(value.length, OTP_LENGTH - 1);
    if (index > firstEmpty) focusBox(firstEmpty);
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`OTP digit ${i + 1}`}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(i)}
          className={`h-12 w-full min-w-0 rounded-xl border-2 bg-white text-center text-xl font-bold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:opacity-60 sm:h-14 ${
            hasError ? "border-red-400" : digit ? "border-teal-400" : "border-slate-200"
          }`}
        />
      ))}
    </div>
  );
}