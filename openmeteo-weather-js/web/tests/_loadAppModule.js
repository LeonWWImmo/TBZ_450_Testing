import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function importTestableApp(originalPath) {
  const cleanPath = path.resolve(originalPath.replace(/^\/([A-Za-z]:)/, "$1"));
  const src = fs.readFileSync(cleanPath, "utf-8");

  const names = [
    "setStatus",
    "parseNum",
    "paramsFromUI",
    "syncToURL",
    "syncFromURL",
    "buildURL",
    "fetchJSON",
    "weatherIcon",
    "weatherText",
    "setWeatherBackground",
    "renderTable",
    "renderChart",
    "loadForecast",
    "geolocate",
  ];

  const tmpBase = path.join(process.cwd(), ".cache", "tests", "tmp");
  fs.mkdirSync(tmpBase, { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(tmpBase, "app-"));
  const tmpFile = path.join(tmpDir, "app.testable.js");

  fs.writeFileSync(tmpFile, src + `\n\nexport { ${names.join(",")} };\n`);

  const url = pathToFileURL(tmpFile).href;
  return import(url);
}
