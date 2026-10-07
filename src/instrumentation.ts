import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : undefined;

  console.error("Request failed", {
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    ...(digest ? { digest } : {}),
  });
};
