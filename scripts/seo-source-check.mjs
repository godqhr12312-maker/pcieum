import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));
const PRIVATE_PAGES = new Set(["/join", "/mypage", "/write", "/admin"]);
const FACTORIES = new Set(["createPageMetadata", "createPostMetadata"]);
const METADATA_EXPORTS = new Set(["generateMetadata", "metadata"]);
const REGISTRY_ORIGIN = "https://seo-check.invalid";

function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, child => visit(child, callback));
}

function parse(file, text) {
  const kind = { ".tsx": ts.ScriptKind.TSX, ".jsx": ts.ScriptKind.JSX, ".js": ts.ScriptKind.JS }[extname(file)] ?? ts.ScriptKind.TS;
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
}

function importedFrom(moduleName, expected, file, root) {
  if (typeof moduleName !== "string") return false;
  const target = moduleName.startsWith("@/") ? resolve(root, moduleName.slice(2))
    : moduleName.startsWith(".") ? resolve(dirname(file), moduleName) : "";
  return target.replace(/\.(?:[cm]?[jt]sx?)$/, "") === resolve(root, expected);
}

function exported(node) {
  return !!node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

function importBindings(source, target, file, root) {
  const named = new Map();
  const namespaces = new Set();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !importedFrom(statement.moduleSpecifier.text, target, file, root) || statement.importClause?.isTypeOnly) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const item of bindings.elements) if (!item.isTypeOnly) named.set(item.name.text, (item.propertyName || item.name).text);
    } else if (bindings && ts.isNamespaceImport(bindings)) namespaces.add(bindings.name.text);
  }
  return { named, namespaces };
}

function usesImportedCall(node, imports, allowed, declarations = new Map(), seen = new Set()) {
  let found = false;
  visit(node, child => {
    if (found || !ts.isCallExpression(child)) return;
    const callee = child.expression;
    if (ts.isIdentifier(callee)) {
      if (allowed.has(imports.named.get(callee.text))) found = true;
      else if (!seen.has(callee.text) && declarations.has(callee.text)) {
        seen.add(callee.text);
        const declaration = declarations.get(callee.text);
        if (ts.isIdentifier(declaration) && allowed.has(imports.named.get(declaration.text))) found = true;
        else if (usesImportedCall(declaration, imports, allowed, declarations, seen)) found = true;
      }
    } else if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)
      && imports.namespaces.has(callee.expression.text) && allowed.has(callee.name.text)) found = true;
  });
  return found;
}

export function routeFromPage(file, root = PROJECT_ROOT) {
  const segments = relative(join(root, "app"), dirname(file)).split(/[\\/]/).filter(Boolean)
    .filter(segment => !/^\([^/]+\)$/.test(segment) && !segment.startsWith("@"));
  return { path: `/${segments.join("/")}`, dynamic: segments.some(segment => segment.includes("[")) };
}

export function inspectPageSource(file, text, root, publicPaths) {
  const source = parse(file, text);
  const name = relative(root, file).replaceAll("\\", "/");
  const errors = source.parseDiagnostics.map(diagnostic => `${name}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
  const declarations = new Map();
  const exportedNames = [];
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      declarations.set(statement.name.text, statement);
      if (exported(statement) && METADATA_EXPORTS.has(statement.name.text)) exportedNames.push(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const item of statement.declarationList.declarations) {
        if (!ts.isIdentifier(item.name) || !item.initializer) continue;
        declarations.set(item.name.text, item.initializer);
        if (exported(statement) && METADATA_EXPORTS.has(item.name.text)) exportedNames.push(item.name.text);
      }
    } else if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const item of statement.exportClause.elements) {
        if (METADATA_EXPORTS.has(item.name.text) && !statement.moduleSpecifier) exportedNames.push((item.propertyName || item.name).text);
      }
    }
  }
  if (exportedNames.length !== 1) errors.push(`${name}: export exactly one generateMetadata() or metadata value.`);
  const factories = importBindings(source, "lib/seo", file, root);
  const hasFactoryImport = [...factories.named.values()].some(value => FACTORIES.has(value)) || factories.namespaces.size > 0;
  if (!hasFactoryImport) errors.push(`${name}: import createPageMetadata or createPostMetadata from lib/seo.`);
  for (const exportedName of exportedNames) {
    const metadata = declarations.get(exportedName);
    if (!metadata || !usesImportedCall(metadata, factories, FACTORIES, declarations)) errors.push(`${name}: the metadata export must call the shared SEO factory (directly or through a local helper).`);
  }
  const route = routeFromPage(file, root);
  if (!route.dynamic && !PRIVATE_PAGES.has(route.path) && !publicPaths.has(route.path)) errors.push(`${name}: register public route ${route.path} in lib/seo-routes.ts PUBLIC_PAGES.`);
  return { errors, ...route };
}

export function validateRegistry(pages) {
  const errors = [];
  if (!Array.isArray(pages) || !pages.length) return ["lib/seo-routes.ts: PUBLIC_PAGES must be a nonempty array."];
  const paths = new Map();
  const titles = new Map();
  const descriptions = new Map();
  const normalizeText = value => value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("en-US");
  for (const [index, page] of pages.entries()) {
    const label = `PUBLIC_PAGES[${index}] (${page?.path || "missing path"})`;
    for (const field of ["title", "description"]) {
      const value = page?.[field];
      if (typeof value !== "string" || !value.trim()) { errors.push(`${label}: ${field} is required.`); continue; }
      const normalized = normalizeText(value);
      const seen = field === "title" ? titles : descriptions;
      if (seen.has(normalized)) errors.push(`${label}: duplicate ${field} also used by ${seen.get(normalized)}.`);
      else seen.set(normalized, page.path);
    }
    const path = page?.path;
    if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || /[\\\s\u0000-\u001f\u007f]/.test(path)) {
      errors.push(`${label}: path must be a canonical site-relative URL without whitespace or control characters.`); continue;
    }
    try {
      const url = new URL(path, REGISTRY_ORIGIN);
      const decoded = decodeURIComponent(url.pathname);
      if (url.origin !== REGISTRY_ORIGIN || url.hash || decoded.includes("[") || /[\\\u0000-\u001f\u007f]/.test(decoded)
        || PRIVATE_PAGES.has(url.pathname) || /^\/(?:api|signin-with-chatgpt|signout-with-chatgpt|callback)(?:\/|$)/i.test(decoded)
        || url.pathname + url.search !== path || (url.pathname.length > 1 && url.pathname.endsWith("/"))) errors.push(`${label}: path is not a public canonical URL.`);
      const keys = [...url.searchParams.keys()];
      if (new Set(keys).size !== keys.length) errors.push(`${label}: canonical query keys must not repeat.`);
      url.searchParams.sort();
      const key = url.pathname + url.search;
      if (paths.has(key)) errors.push(`${label}: duplicate canonical path also used by ${paths.get(key)}.`);
      else paths.set(key, path);
    } catch { errors.push(`${label}: malformed canonical URL.`); }
  }
  return errors;
}

async function pageFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith("_") && !entry.name.startsWith(".")) files.push(...await pageFiles(join(directory, entry.name)));
    else if (entry.isFile() && /^page\.(?:tsx?|jsx?)$/.test(entry.name)) files.push(join(directory, entry.name));
  }
  return files.sort();
}

async function inspectSitemap(root, hasDynamicPages) {
  const file = join(root, "app", "sitemap.xml", "route.ts");
  let text;
  try { text = await readFile(file, "utf8"); } catch { return ["app/sitemap.xml/route.ts: public sitemap route is required."]; }
  const source = parse(file, text);
  const registry = importBindings(source, "lib/seo-routes", file, root);
  const errors = [];
  const bindings = new Set([...registry.named].filter(([, name]) => name === "PUBLIC_PAGES").map(([name]) => name));
  let usesRegistry = false;
  visit(source, node => {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && bindings.has(node.expression.text)) usesRegistry = true;
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && registry.namespaces.has(node.expression.text) && node.name.text === "PUBLIC_PAGES") usesRegistry = true;
  });
  if (!usesRegistry) errors.push("app/sitemap.xml/route.ts: collect public URLs from PUBLIC_PAGES so new registered pages enter the sitemap.");
  if (hasDynamicPages) {
    const config = importBindings(source, "lib/config", file, root);
    const store = importBindings(source, "lib/store", file, root);
    let selectsActivePosts = false;
    visit(source, node => {
      if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && /\bFROM\s+posts\b/i.test(node.text) && /\bstatus\s*=\s*'ACTIVE'/i.test(node.text)) selectsActivePosts = true;
    });
    if (!usesImportedCall(source, config, new Set(["postUrl"])) || !usesImportedCall(source, store, new Set(["database"])) || !selectsActivePosts) {
      errors.push("app/sitemap.xml/route.ts: dynamic post routes must collect persisted ACTIVE posts with database() and postUrl(); also run seo:check -- --fixture.");
    }
  }
  return errors;
}

export async function checkProject(root = PROJECT_ROOT) {
  const errors = [];
  const registryFile = join(root, "lib", "seo-routes.ts");
  const registryText = await readFile(registryFile, "utf8");
  const registryAst = parse(registryFile, registryText);
  if (registryAst.statements.some(node => ts.isImportDeclaration(node) || ts.isExportDeclaration(node) && node.moduleSpecifier)) throw new Error("lib/seo-routes.ts must remain a standalone registry without imports.");
  const compiled = ts.transpileModule(registryText, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }, reportDiagnostics: true });
  for (const diagnostic of compiled.diagnostics || []) if (diagnostic.category === ts.DiagnosticCategory.Error) errors.push(ts.flattenDiagnosticMessageText(diagnostic.messageText, " "));
  const registry = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString("base64")}`);
  errors.push(...validateRegistry(registry.PUBLIC_PAGES));
  const publicPaths = new Set((Array.isArray(registry.PUBLIC_PAGES) ? registry.PUBLIC_PAGES : []).map(page => page?.path));
  const files = await pageFiles(join(root, "app"));
  if (!files.length) errors.push("app/: no page source files found.");
  const results = await Promise.all(files.map(async file => inspectPageSource(file, await readFile(file, "utf8"), root, publicPaths)));
  for (const result of results) errors.push(...result.errors);
  const dynamicCount = results.filter(result => result.dynamic).length;
  errors.push(...await inspectSitemap(root, dynamicCount > 0));
  return { errors, pages: files.length, dynamicPages: dynamicCount, publicRoutes: publicPaths.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const report = await checkProject();
    if (report.errors.length) {
      console.error(`SEO source check failed (${report.errors.length}):\n${report.errors.map(error => `- ${error}`).join("\n")}`);
      process.exitCode = 1;
    } else {
      console.log(`SEO source check passed: ${report.pages} page sources, ${report.publicRoutes} public canonical routes, ${report.dynamicPages} dynamic page source(s).`);
      console.log("Dynamic URLs and intentional noindex pages are verified by seo:check; use --fixture to verify newly created posts.");
    }
  } catch (error) {
    console.error(`SEO source check failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
