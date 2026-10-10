import { parseOptions, reportSeoCheck, runSeoCheck } from "./seo-check.mjs";

// Same assertions as the recursive regression checker, limited to sitemap and required routes.
// Use seo-check.mjs for recursive navigation/pagination coverage.
try {
  const options = { ...parseOptions(), smoke: true };
  reportSeoCheck(await runSeoCheck(options), options.json);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
