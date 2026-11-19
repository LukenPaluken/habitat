export interface Group<T> {
  key: string;
  title: string;
  items: T[];
}

/**
 * Splits a list into groups (the received visits and questions, "agrupadas por
 * propiedad") keeping the order in which each group first shows up.
 */
export function groupBy<T>(
  items: T[],
  keyOf: (item: T) => string,
  titleOf: (item: T) => string
): Group<T>[] {
  const groups = new Map<string, Group<T>>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key) ?? { key, title: titleOf(item), items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()];
}
