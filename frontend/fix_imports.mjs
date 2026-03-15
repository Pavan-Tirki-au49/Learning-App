import fs from "fs";
import path from "path";

function collectFiles(dir) {
  const files = fs.readdirSync(dir);
  const result = [];
  for (const f of files) {
    if (f === 'node_modules' || f === '.next') continue;
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      result.push(...collectFiles(fp));
    } else if (fp.endsWith('.tsx') || fp.endsWith('.ts')) {
      result.push(fp);
    }
  }
  return result;
}

const files = collectFiles(".");

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  // Replace anything like "../../../components" or "../../store" with "@/"
  content = content.replace(/import\s+([\s\S]*?)from\s+['"](?:\.\.\/)+(components|store|lib|styles)(.*?)['"]/g, "import $1from \"@/$2$3\"");
  fs.writeFileSync(file, content);
});
console.log("Imports fixed");
