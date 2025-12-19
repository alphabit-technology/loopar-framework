
import { fileManage } from "../file-manage.js";
import fs from 'fs'
import path from "pathe";
import { fileURLToPath } from "url";
const tailwindClasses = {};
import { loopar } from "../loopar.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getCss =  () => {
  try {
    return fs.readFileSync(path.resolve(__dirname, "./tailwind.css"), "utf8");
  } catch (err) {
    console.error("Unable to read tailwin base css", err);
  }
}

export async function setTailwindTemp(toElement, classes) {
  toElement && (tailwindClasses[toElement] = classes);
  let colector = "";

  const filterSpecialChars = (str) => {
    return str.replace(/[^a-zA-Z0-9:/ -]/g, '');
  };

  for (const [element, classes] of Object.entries(tailwindClasses)) {
    colector += `<div className="${filterSpecialChars(classes)}"/>`;
  }

  const fn = `
  export function Tailwind() {
    return (
      <div style={{display:"none"}}>${colector}</div>
    );
  }`

  await fileManage.makeFile('app/auto', 'tailwind', fn, 'jsx', true);
}

export async function generatedBaseCss(tenantId) {
  if(fs.existsSync(path.join(loopar.pathRoot, 'sites', tenantId, 'theme.css'))) {
    return;
  }

  await fileManage.makeFile(path.join('sites', tenantId), 'theme', getCss(), 'css');
} 

export async function tailwinInit(tenantId) {
  await generatedBaseCss(tenantId);
  await setTailwindTemp();
}