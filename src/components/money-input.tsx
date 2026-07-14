"use client";

import { formatNumber } from "@/lib/format";

interface MoneyInputProps {
  value: number;
  onValueChange: (value: number) => void;
  id?: string;
  className?: string;
  placeholder?: string;
}

/**
 * Ô nhập số tiền (VND) có dấu ngăn cách hàng nghìn khi gõ (220.000.000).
 * Dùng type="text" vì input[type=number] không hiển thị được dấu phân tách.
 */
export function MoneyInput({
  value,
  onValueChange,
  id,
  className,
  placeholder = "0",
}: MoneyInputProps) {
  const display = value === 0 ? "" : formatNumber(value);

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      value={display}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onValueChange(digits === "" ? 0 : Number(digits));
      }}
    />
  );
}
