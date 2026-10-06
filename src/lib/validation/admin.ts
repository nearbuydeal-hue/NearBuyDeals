import { z } from "zod";

export const shopApprovalFilterSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const shopModerationSchema = z.object({
  shopId: z.uuid(),
  status: z.enum(["approved", "rejected", "suspended"]),
});

export type ShopApprovalFilter = z.infer<typeof shopApprovalFilterSchema>;
