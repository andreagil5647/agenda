/** Small pure edits on cached lists of resources, shared by the optimistic mutations. */

interface Identified {
  id: string;
}

export function withItem<TItem>(items: TItem[], item: TItem): TItem[] {
  return [...items, item];
}

export function withoutItem<TItem extends Identified>(items: TItem[], id: string): TItem[] {
  return items.filter((item) => item.id !== id);
}

/** Swaps in `replacement` for the item with `id`, which may be a provisional one. */
export function withReplaced<TItem extends Identified>(
  items: TItem[],
  id: string,
  replacement: TItem,
): TItem[] {
  return items.map((item) => (item.id === id ? replacement : item));
}

export function withChanges<TItem extends Identified>(
  items: TItem[],
  id: string,
  changes: Partial<TItem>,
): TItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...changes } : item));
}
