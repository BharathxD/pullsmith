import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const validateInput = (value: string, name: string) => {
  if (!value?.trim()) {
    throw new Error(`${name} cannot be empty`);
  }
};
