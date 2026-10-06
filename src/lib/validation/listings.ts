import { z } from "zod";

export const listingFormSchema = z.object({
  itemName: z.string().trim().min(1, "Enter the item name.").max(160),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer.")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  category: z
    .string()
    .trim()
    .max(80, "Category must be 80 characters or fewer.")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  quantity: z.coerce
    .number()
    .positive("Quantity must be greater than zero.")
    .max(999999, "Quantity must be 999999 or lower."),
  unit: z.string().trim().min(1, "Enter the unit.").max(32),
  price: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().min(0, "Price must be zero or greater.").max(999999.99, "Price must be below 1000000.").optional(),
  ),
  expiryDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value))
    .refine(
      (value) => value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Use a valid expiry date in YYYY-MM-DD format.",
    ),
  status: z
    .enum(["active", "sold_out", "expired", "removed"])
    .optional(),
});

export function getFirstValidationError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the listing details and try again.";
}
