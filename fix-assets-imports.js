import fs from "fs";
import path from "path";

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
    let updated = content.replace(/@assets\//g, "@/assets/");
    if (updated !== content) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(`✅ Fixed imports in ${file}`);
    }
  }
});
