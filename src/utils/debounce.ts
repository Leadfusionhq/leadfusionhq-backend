import { debounce, DebouncedFunc } from 'lodash';
import { SafeValue } from '@/types/types';

export function createDebouncedFn<T extends (...args: SafeValue[]) => unknown>(
  fn: T,
  wait = 300
): DebouncedFunc<T> {
  return debounce(fn, wait);
}
