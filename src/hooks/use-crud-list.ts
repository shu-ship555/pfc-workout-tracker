import { useState } from "react";

/**
 * id を持つリストに対する CRUD 操作を共通化するフック。
 * add（先頭に追加）、update（id で置換）、remove（id で除外）を提供する。
 */
export function useCrudList<T extends { id: string }>(initial: T[] = []) {
  const [items, setItems] = useState<T[]>(initial);

  return {
    items,
    setItems,
    add:    (item: T) => setItems((prev) => [item, ...prev]),
    update: (item: T) => setItems((prev) => prev.map((p) => (p.id === item.id ? item : p))),
    remove: (id: string) => setItems((prev) => prev.filter((p) => p.id !== id)),
  };
}
