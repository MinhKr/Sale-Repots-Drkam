"use client";

import { useEffect, useState } from "react";

/**
 * Lưu tạm state vào localStorage (giai đoạn demo, chưa có DB thật).
 * - Hydration-safe: SSR + lần render đầu dùng `initial`, sau đó nạp từ localStorage.
 * - Persist mỗi khi state đổi (chỉ sau khi đã nạp xong để không ghi đè seed).
 *
 * Đổi STORAGE_VERSION khi cấu trúc dữ liệu thay đổi để bỏ dữ liệu cũ không tương thích.
 */
export const STORAGE_VERSION = "v1";

function fullKey(key: string) {
  return `drkam:${STORAGE_VERSION}:${key}`;
}

export function useLocalStorageState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // Nạp 1 lần khi mount (chỉ client). Đọc localStorage phải làm sau mount để
  // tránh lệch hydration, nên buộc phải setState trong effect ở đây.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(fullKey(key));
      if (raw != null) setState(JSON.parse(raw) as T);
    } catch {
      // bỏ qua lỗi parse / quota
    }
    setHydrated(true);
  }, [key]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Ghi lại sau khi đã nạp
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(fullKey(key), JSON.stringify(state));
    } catch {
      // bỏ qua lỗi quota
    }
  }, [key, state, hydrated]);

  return [state, setState, hydrated] as const;
}

/** Xóa toàn bộ dữ liệu tạm của app (mọi key drkam:vX:*) rồi tải lại trang. */
export function clearAllLocalData() {
  try {
    const prefix = `drkam:${STORAGE_VERSION}:`;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // bỏ qua
  }
}
