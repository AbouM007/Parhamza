// fixImportsContexts.js
import fs from "fs";
import path from "path";

const projectRoot = "./client/src";

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // Regex qui cible les imports relatifs vers contexts
  content = content.replace(
    /from\s+["'](\.{1,2}\/)+contexts\/([^"']+)["']/g,
    (match, p1, p2) => {
      return `from "@/contexts/${p2}"`;
    },
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Imports corrigés dans: ${filePath}`);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && fullPath.match(/\.(ts|tsx)$/)) {
      fixImportsInFile(fullPath);
    }
  }
}

walk(projectRoot);
console.log("🎉 Tous les imports relatifs vers contexts ont été corrigés !");
