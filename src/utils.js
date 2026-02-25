import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitário para mesclar classes do Tailwind CSS de forma inteligente.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
