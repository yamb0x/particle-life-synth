import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for merging Tailwind CSS classes
 * Combines clsx for conditional class names with tailwind-merge for conflict resolution
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 * 
 * @example
 * ```ts
 * cn("px-4 py-2", condition && "bg-blue-500", "text-white")
 * cn("bg-red-500", "bg-blue-500") // Returns "bg-blue-500" (conflict resolved)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}