// fixHooksImports.js
import fs from "fs";
import { glob } from "glob";

const SRC_DIR = "client/src";

glob(`${SRC_DIR}/**/*.{ts,tsx}`).then((files) => {
  let totalChanged = 0;

  files.forEach((file) => {
    let content = fs.readFileSync(file, "utf8");
    let original = content;

    // Corrige uniquement les imports relatifs vers hooks
    content = content.replace(
      /^(\s*import\s.*?from\s+)(['"])(\.{1,2}\/.*?hooks\/.*?)(['"])/gm,
      (match, p1, p2, p3, p4) => {
        // Ne pas toucher si c’est un import commenté
        if (match.trim().startsWith("//")) return match;

        // Garder la partie après "hooks/"
        const hookPath = p3.replace(/^.*hooks\//, "");
        return `${p1}${p2}@/hooks/${hookPath}${p4}`;
      },
    );

    if (content !== original) {
      fs.writeFileSync(file, content, "utf8");
      console.log(`✅ Imports corrigés dans: ${file}`);
      totalChanged++;
    }
  });

  console.log(`🎉 Terminé : ${totalChanged} fichiers corrigés.`);
});
