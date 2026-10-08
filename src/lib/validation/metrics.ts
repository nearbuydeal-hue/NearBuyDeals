import { z } from "zod";

export const metricsPeriodSchema = z.enum(["7d", "30d", "all"]);

const metricCount = z.number().int().nonnegative();
const moneyAmount = z.number().nonnegative();

export const shopMetricsSchema = z.object({
  totalListings: metricCount,
  activeListings: metricCount,
  soldOutListings: metricCount,
  expiredListings: metricCount,
  removedListings: metricCount,
  customerContacts: metricCount,
  phoneContacts: metricCount,
  whatsappContacts: metricCount,
  notifyRequests: metricCount,
  listingsMarkedSold: metricCount,
  reportedMoneySaved: moneyAmount,
});

const adminShopTypeMetricsSchema = z.object({
  shops: metricCount,
  listings: metricCount,
  activeListings: metricCount,
  soldOutListings: metricCount,
  expiredListings: metricCount,
  removedListings: metricCount,
  phoneContacts: metricCount,
  whatsappContacts: metricCount,
  notifyRequests: metricCount,
  listingsMarkedSold: metricCount,
  reportedMoneySaved: moneyAmount,
});

export const adminMetricsSchema = z.object({
  shops: z.object({
    total: metricCount,
    pending: metricCount,
    approved: metricCount,
    rejected: metricCount,
    suspended: metricCount,
  }),
  listings: z.object({
    total: metricCount,
    active: metricCount,
    soldOut: metricCount,
    expired: metricCount,
    removed: metricCount,
  }),
  customerDemand: z.object({
    phoneContacts: metricCount,
    whatsappContacts: metricCount,
    totalContacts: metricCount,
    notifyRequests: metricCount,
    searches: metricCount,
  }),
  outcomes: z.object({
    listingsMarkedSold: metricCount,
    reportedMoneySaved: moneyAmount,
  }),
  byShopType: z.object({
    pharmacy: adminShopTypeMetricsSchema,
    grocery: adminShopTypeMetricsSchema,
    restaurant: adminShopTypeMetricsSchema,
  }),
});

export type MetricsPeriod = z.infer<typeof metricsPeriodSchema>;
export type ShopMetrics = z.infer<typeof shopMetricsSchema>;
export type AdminMetrics = z.infer<typeof adminMetricsSchema>;

export const shopContactSchema = z.object({
  shopId: z.uuid(),
  listingId: z.uuid().nullable(),
  contactType: z.enum(["phone", "whatsapp"]),
});
