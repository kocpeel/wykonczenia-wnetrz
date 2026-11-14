// Zero-dependency static build: wraps every page in the layout, inlines partials and copies assets.
//
// A page starts with a front matter block:
//   ---
//   title: Page title
//   description: Meta description
//   page: shop
//   script: shop
//   ---
// Templates may use {{field}}, {{> partial}} and {{nav:key}} (adds aria-current to the active link).
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const out = join(root, process.argv[2] ?? 'dist');

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const partials = Object.fromEntries(
  readdirSync(join(src, 'partials')).map((file) => [file.replace(/\.html$/, ''), read(join(src, 'partials', file))]),
);
const layout = read(join(src, 'layout.html'));

function parsePage(file, text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error(`${file}: brak nagłówka z tytułem i opisem`);
  const meta = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon > 0) meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return { meta, body: text.slice(match[0].length) };
}

function render(template, meta, file) {
  return template
    .replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
      if (!(name in partials)) throw new Error(`${file}: nie ma partiala ${name}`);
      return render(partials[name], meta, file);
    })
    .replace(/\{\{nav:([\w-]+)\}\}/g, (_, key) => (meta.nav === key ? ' aria-current="page"' : ''))
    .replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in meta)) throw new Error(`${file}: brak pola ${key}`);
      return meta[key];
    });
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(src, 'assets'), join(out, 'assets'), { recursive: true });

const pages = readdirSync(join(src, 'pages')).filter((file) => file.endsWith('.html'));
for (const file of pages) {
  const { meta, body } = parsePage(file, read(join(src, 'pages', file)));
  const content = render(body, meta, file);
  writeFileSync(join(out, file), render(layout, { nav: '', ...meta, content }, file));
}
console.log(`Zbudowano ${pages.length} stron w ${out}`);
