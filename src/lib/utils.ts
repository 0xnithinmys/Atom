import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const THRUST_AREAS = [
  "Revenue Growth",
  "Customer Experience",
  "Operations Excellence",
  "People & Culture",
  "Innovation & Technology",
  "Sustainability & ESG",
  "Market Expansion",
  "Product Development",
  "Brand & Marketing",
  "Finance & Cost Optimization",
];

export function computeScore(
  uomType: string,
  target: number,
  actual: number,
  targetDate?: Date,
  actualDate?: Date
) {
  if (target <= 0) return 0;
  if (uomType === "MIN") return Math.max(0, Math.min(150, (actual / target) * 100));
  if (uomType === "MAX") return Math.max(0, Math.min(150, (target / Math.max(actual, 0.0001)) * 100));
  if (uomType === "ZERO") {
    if (actual <= 0) return 100;
    return Math.max(0, 100 - actual * 10);
  }
  if (uomType === "TIMELINE") {
    if (!targetDate || !actualDate) return 0;
    return actualDate <= targetDate ? 100 : 70;
  }
  return 0;
}
