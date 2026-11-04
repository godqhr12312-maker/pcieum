import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import { withHttpPolicy, openPublicHtmlCache, type HtmlCacheStorage } from "../lib/http-policy";
import { PUBLIC_PAGES } from "../lib/seo-routes";
import { MEMBER_FEATURES_ENABLED } from "../lib/member-features";

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return withHttpPolicy(request, (renderRequest) =>
      runWithConnectorBinding(binding, () => handler.fetch(renderRequest, env, ctx)), {
      development: import.meta.env.DEV,
      siteOrigin: env.SITE_URL || "https://pcieum.com",
      publicPaths: PUBLIC_PAGES.map(page => page.path),
      memberFeaturesEnabled: MEMBER_FEATURES_ENABLED,
      hasRequestCapabilities: Boolean(binding),
      buildId: process.env.__VINEXT_BUILD_ID,
      cache: import.meta.env.DEV ? undefined : await openPublicHtmlCache(caches as unknown as HtmlCacheStorage),
      waitUntil: (task) => ctx.waitUntil(task),
    });
  },
};
