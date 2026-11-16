export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

export interface PaginationParams {
  page: number;
  limit: number;
}

// What services/repositories return for any paginated listing. The controller
// turns it into the HTTP envelope `{ data, meta }`.
export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export function offsetOf({ page, limit }: PaginationParams): number {
  return (page - 1) * limit;
}

export function totalPagesOf(total: number, limit: number): number {
  return Math.ceil(total / limit);
}
