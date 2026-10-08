import "server-only";

import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function matchesCronSecret(request: Request, secret: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const expected = "Bearer " + secret;
  const authorizationBuffer = Buffer.from(authorization);
  const expectedBuffer = Buffer.from(expected);

  if (authorizationBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(authorizationBuffer, expectedBuffer);
}

export async function GET(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("Listing expiry cron is missing server configuration.");
    return Response.json(
      { error: "Expiry job is not configured." },
      { status: 503 },
    );
  }

  if (!matchesCronSecret(request, cronSecret)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Listing expiry cron is missing server configuration.");
    return Response.json(
      { error: "Expiry job is not configured." },
      { status: 503 },
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: expiredCount, error } = await supabase.rpc(
    "expire_active_listings",
  );

  if (error) {
    console.error("Listing expiry cron failed:", error.code);
    return Response.json(
      { error: "Expiry job failed." },
      { status: 500 },
    );
  }

  return Response.json({ expiredCount });
}
