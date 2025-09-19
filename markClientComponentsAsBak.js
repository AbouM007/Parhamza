// markClientComponentsAsBak.js
import fs from "fs";
import path from "path";

const targetDir = "components/client-components";

function markAsBak(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    if (fs.lstatSync(filePath).isDirectory()) {
      markAsBak(filePath); // récursif pour les sous-dossiers
    } else {
      if (!filePath.endsWith(".bak")) {
        const bakPath = filePath + ".bak";
        fs.renameSync(filePath, bakPath);
        console.log(`✅ Renommé: ${filePath} → ${bakPath}`);
      }
    }
  });
}

if (fs.existsSync(targetDir)) {
  markAsBak(targetDir);
  console.log(
    "🎉 Tous les fichiers de components/client-components/ ont été renommés en .bak !",
  );
} else {
  console.log("⚠️ Dossier components/client-components/ introuvable");
}
