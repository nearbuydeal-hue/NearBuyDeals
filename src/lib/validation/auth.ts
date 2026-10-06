import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number.")
  .max(32, "Phone numbers must be 32 characters or fewer.")
  .regex(/^\+?[0-9(). -]+$/, "Enter a valid phone number.")
  .refine(
    (value) => {
      const digitCount = value.replace(/\D/g, "").length;
      return digitCount >= 7 && digitCount <= 15;
    },
    "Enter a phone number with 7 to 15 digits.",
  );

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const shopOwnerSignupSchema = z.strictObject({
  fullName: z.string().trim().min(1, "Enter your full name.").max(120),
  email: emailSchema,
  password: z
    .string()
    .min(12, "Use a password with at least 12 characters.")
    .max(72, "Password must be 72 characters or fewer."),
  shopName: z.string().trim().min(1, "Enter your shop name.").max(120),
  shopType: z.enum(["pharmacy", "grocery", "restaurant"], {
    error: "Select a shop type.",
  }),
  phone: phoneSchema,
  whatsapp: phoneSchema,
  address: z.string().trim().min(1, "Enter the shop address.").max(300),
  area: z.string().trim().min(1, "Enter the area.").max(120),
  city: z.string().trim().min(1, "Enter the city.").max(120),
});

export const shopDetailsSchema = shopOwnerSignupSchema.omit({
  email: true,
  password: true,
});

export const shopOnboardingMetadataSchema = shopDetailsSchema;

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(72),
});

export type ShopOwnerSignup = z.output<typeof shopOwnerSignupSchema>;
export type ShopDetails = z.output<typeof shopDetailsSchema>;

export function parseShopOwnerSignupMetadata(
  value: unknown,
): ShopDetails | null {
  const parsed = shopOnboardingMetadataSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function getFirstValidationError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the information and try again.";
}
