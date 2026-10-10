declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_USER_IDS?: string;
    SITE_URL?: string;
    SEARCH_INDEXING?: string;
  }
}
