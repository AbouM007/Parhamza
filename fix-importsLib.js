import fs from "fs";
import path from "path";

const replacements = [
  { from: "../lib/", to: "@/lib/" },
  { from: "../utils/", to: "@/utils/" },
  { from: "../types", to: "@/types" },
];

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, callback);
    } else {
      callback(filepath);
    }
  });
}

walk("client/src", (file) => {
  if (file.endsWith(".ts") || file.endsWith(".tsx")) {
    let content = fs.readFileSync(file, "utf8");
    let updated = content;
    replacements.forEach(({ from, to }) => {
      updated = updated.replaceAll(from, to);
    });
    if (updated !== content) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(`✅ Fixed imports in ${file}`);
    }
  }
});
