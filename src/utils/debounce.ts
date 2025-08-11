// utils/debounce.ts
import { debounce, DebouncedFunc } from 'lodash';

/**
 * Generic debounce utility for use in hooks or event handlers.
 * @param fn The function to debounce
 * @param wait Delay in milliseconds
 * @returns Debounced function with cancel/flush
 */
export function createDebouncedFn<T extends (...args: any[]) => any>(
  fn: T,
  wait = 300
): DebouncedFunc<T> {
  return debounce(fn, wait);
}
