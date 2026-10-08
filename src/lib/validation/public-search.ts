import { z } from "zod";

const searchTermSchema = z
  .string()
  .trim()
  .max(80, "Search terms must be 80 characters or fewer.")
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const publicSearchSchema = z.object({
  q: searchTermSchema,
  area: searchTermSchema,
});

export type PublicSearchParams = z.infer<typeof publicSearchSchema>;

export const publicSearchPageSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(100_000)
  .default(1);
