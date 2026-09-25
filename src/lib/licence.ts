export const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
] as const;

// Health Canada licence classes under the Cannabis Regulations that may buy from another licence holder.
export const LICENCE_TYPES = [
  "Standard cultivation",
  "Micro-cultivation",
  "Nursery",
  "Standard processing",
  "Micro-processing",
  "Sale for medical purposes",
] as const;

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const LICENCE_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
