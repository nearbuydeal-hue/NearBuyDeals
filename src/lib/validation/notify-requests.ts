import { z } from "zod";

export const notifyRequestSchema = z
  .object({
    listingId: z.uuid(),
    contactMethod: z.enum(["whatsapp", "email"]),
    contactValue: z.string().trim().min(1).max(320),
    website: z.string().max(0).optional(),
  })
  .superRefine((value, context) => {
    if (value.contactMethod === "email" && !z.email().safeParse(value.contactValue).success) {
      context.addIssue({
        code: "custom",
        path: ["contactValue"],
        message: "Enter a valid email address.",
      });
    }

    if (
      value.contactMethod === "whatsapp" &&
      (!/^\+?[0-9().\s-]+$/.test(value.contactValue) ||
        value.contactValue.replace(/\D/g, "").length < 7 ||
        value.contactValue.replace(/\D/g, "").length > 15)
    ) {
      context.addIssue({
        code: "custom",
        path: ["contactValue"],
        message: "Enter a WhatsApp number with 7 to 15 digits.",
      });
    }
  });

export type NotifyRequestActionState = {
  error?: string;
  success?: string;
};
