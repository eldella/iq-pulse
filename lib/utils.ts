import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes, resolving conflicts (last one wins) via twMerge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
