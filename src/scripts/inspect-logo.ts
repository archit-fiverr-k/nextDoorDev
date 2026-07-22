import fs from "fs";
import path from "path";

const publicAssets = path.join(process.cwd(), "public", "assets");
const files = fs.readdirSync(publicAssets);

console.log("Assets directory contents:");
files.forEach((file) => {
  if (file.includes("logo") || file.includes("header") || file.includes("icon")) {
    const stats = fs.statSync(path.join(publicAssets, file));
    console.log(`- ${file} (${stats.size} bytes)`);
  }
});
