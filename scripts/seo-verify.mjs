import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Reuse this command after adding pages: source contract, full crawl, actual scores.
for (const [script, args] of [['seo-source-check.mjs', []], ['seo-audit.mjs', process.argv.slice(2)]]) {
  const child = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url)), ...args], { stdio: 'inherit', shell: false });
  if (child.error) throw child.error;
  if (child.status !== 0) process.exit(child.status || 1);
}
