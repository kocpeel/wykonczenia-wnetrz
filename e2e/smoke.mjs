// Browser test of the main paths in installed Microsoft Edge. Also saves screenshots to docs/.
// Run after `npm run build`. Another Chromium browser can be used with BROWSER_CHANNEL=chrome.
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

import { startServer } from '../scripts/serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, 'docs');
await mkdir(docs, { recursive: true });

const server = await startServer({ root: join(root, 'dist') });
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'msedge', headless: true });
const problems = [];
const text = async (locator) => (await locator.textContent()).replace(/\s+/g, ' ').trim();
const check = (condition, message) => {
  if (!condition) problems.push(message);
};

function watch(page) {
  page.on('pageerror', (error) => problems.push(`błąd JavaScript: ${error.message}`));
  page.on('console', (message) => {
    // The deliberate visit to a missing page logs its 404 status; anything else is a real problem.
    if (message.type() === 'error' && !page.url().includes('nie-ma-takiej-strony')) problems.push(`konsola: ${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    if (!request.url().startsWith('data:')) problems.push(`nie wczytano: ${request.url()}`);
  });
}

async function noSideScroll(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 0, `${label}: strona przewija się w bok o ${overflow}px`);
}

async function loadLazyImages(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((done) => setTimeout(done, 60));
    }
    await Promise.all([...document.images].map((image) => (image.complete ? null : new Promise((done) => { image.onload = image.onerror = done; }))));
  });
}

async function shot(target, name, { fullPage = false, scroll = true } = {}) {
  const page = 'page' in target ? target.page() : target;
  if (fullPage) await loadLazyImages(page);
  if (scroll) await page.evaluate(() => window.scrollTo(0, 0));
  if (!scroll && target !== page) await target.evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 110));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  // Full-page shots are photo-heavy, so they are saved as JPEG to stay small enough to upload anywhere.
  const options = fullPage ? { path: join(docs, `${name}.jpg`), fullPage, type: 'jpeg', quality: 82 } : { path: join(docs, `${name}.png`) };
  await target.screenshot(options);
}

// A valid visit date: tomorrow, or the day after when tomorrow is a Sunday.
function visitDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part) => String(part).padStart(2, '0')).join('-');
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1360, height: 900 }, locale: 'pl-PL' });
  const page = await desktop.newPage();
  watch(page);

  // Home page: calculator, standards, postal code check and latest projects.
  await page.goto(base);
  await page.locator('.calc-from').waitFor();
  check((await text(page.locator('.calc-from'))) === '59 600 zł', 'kalkulator: zły szacunek dla 50 m²');
  check((await text(page.locator('.calc-to'))) === '76 100 zł', 'kalkulator: zła górna granica dla 50 m²');
  check(await page.locator('#realizacje-lista .project').count() === 3, 'strona główna: brak 3 realizacji');
  await noSideScroll(page, 'strona główna');
  await shot(page, 'strona-glowna');
  await shot(page, 'strona-glowna-cala', { fullPage: true });

  await page.getByRole('button', { name: 'Policz w tym standardzie' }).last().click();
  check((await text(page.locator('.calc-from'))) === '86 400 zł', 'kalkulator: przycisk standardu premium nie działa');
  await page.getByRole('radio', { name: 'Standard', exact: true }).check();
  await page.getByLabel('Metraż mieszkania', { exact: true }).fill('35');
  await page.locator('label.toggle-card', { hasText: 'Łazienka pod klucz' }).click();
  await page.getByRole('switch', { name: /Z materiałami/ }).uncheck();
  check((await text(page.locator('.calc-meta dd').last())) === 'kupujesz sam', 'kalkulator: wyłączenie materiałów nie działa');
  await page.getByText('Z czego to wynika').click();
  check(await page.locator('.calc-breakdown tbody tr').count() === 7, 'kalkulator: rozbicie powinno mieć 7 wierszy');
  await page.getByRole('switch', { name: /Z materiałami/ }).check();
  await page.locator('label.toggle-card', { hasText: 'Łazienka pod klucz' }).click();
  await page.getByLabel('Metraż mieszkania', { exact: true }).fill('50');
  await page.locator('.calc').scrollIntoViewIfNeeded();
  await shot(page.locator('.calc'), 'kalkulator', { scroll: false });

  await page.getByLabel('Kod pocztowy', { exact: true }).fill('55080');
  await page.getByRole('button', { name: 'Sprawdź' }).click();
  check((await text(page.locator('#dojazd-wynik'))).startsWith('Okolice Wrocławia'), 'dojazd: kod 55-080 to okolice');
  check((await page.getByLabel('Kod pocztowy', { exact: true }).inputValue()) === '55-080', 'dojazd: kod bez myślnika nie został poprawiony');
  await page.getByLabel('Kod pocztowy', { exact: true }).fill('00-950');
  await page.getByRole('button', { name: 'Sprawdź' }).click();
  check((await text(page.locator('#dojazd-wynik'))).startsWith('Poza naszym obszarem'), 'dojazd: Warszawa jest poza obszarem');

  // From the calculator to the contact form with the estimate attached.
  await page.getByRole('link', { name: 'Umów oględziny z tą wyceną' }).click();
  await page.waitForURL(/kontakt\.html\?metraz=50/);
  await page.locator('#wycena.is-visible').waitFor();
  check((await text(page.locator('#wycena'))).includes('59 600 zł – 76 100 zł'), 'kontakt: brak wyceny z kalkulatora');
  check((await page.locator('#f-area').inputValue()) === '50', 'kontakt: metraż nie przeszedł z kalkulatora');
  check(await page.locator('input[name="scope"]:checked').count() === 6, 'kontakt: zakres nie przeszedł z kalkulatora');
  await page.getByRole('button', { name: 'Wyślij zgłoszenie' }).click();
  check(await page.locator('[aria-invalid="true"]').count() === 4, 'kontakt: pusty formularz powinien pokazać 4 błędy');
  await page.getByLabel('Imię').fill('Jan');
  await page.getByLabel('Telefon').fill('600 000 000');
  await page.getByLabel('Kod pocztowy').fill('53-012');
  await page.getByLabel('Kod pocztowy').blur();
  check((await text(page.locator('#f-postal-hint'))).startsWith('Wrocław'), 'kontakt: brak informacji o dojeździe');
  await page.getByLabel(/Termin oględzin/).fill(visitDate());
  await page.getByLabel(/Zgadzam się na kontakt/).check();
  await shot(page, 'kontakt');
  await page.getByRole('button', { name: 'Wyślij zgłoszenie' }).click();
  await page.getByRole('heading', { name: 'Dziękujemy, Jan!' }).waitFor();

  // Gallery: filters, lightbox, keyboard and deep links.
  await page.goto(`${base}realizacje.html`);
  await page.locator('#galeria .project').first().waitFor();
  check(await page.locator('#galeria .project').count() === 8, 'realizacje: powinno być 8 realizacji');
  await page.getByRole('button', { name: 'Łazienki' }).click();
  check(await page.locator('#galeria .project').count() === 3, 'realizacje: filtr Łazienki');
  check(page.url().includes('kategoria=lazienki'), 'realizacje: filtr nie trafił do adresu');
  await page.getByRole('button', { name: 'Wszystkie' }).click();
  await shot(page, 'realizacje');
  await page.locator('#galeria .project').first().click();
  await page.locator('#podglad[open]').waitFor();
  const firstTitle = await text(page.locator('#podglad-tytul'));
  await page.keyboard.press('ArrowRight');
  check((await text(page.locator('#podglad-tytul'))) !== firstTitle, 'podgląd: strzałka nie przechodzi dalej');
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(docs, 'podglad-realizacji.png') });
  await page.keyboard.press('Escape');
  check(!(await page.locator('#podglad').evaluate((dialog) => dialog.open)), 'podgląd: Escape nie zamyka');
  await page.goto(`${base}realizacje.html#krzyki-salon`);
  await page.locator('#podglad[open]').waitFor();
  check((await text(page.locator('#podglad-tytul'))) === 'Minimalistyczny salon', 'podgląd: link z kotwicą nie otwiera realizacji');

  for (const path of ['cennik.html', 'poradnik.html', 'nie-ma-takiej-strony.html']) {
    await page.goto(`${base}${path}`);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await noSideScroll(page, path);
  }
  await page.goto(`${base}cennik.html`);
  await shot(page, 'cennik');
  await desktop.close();

  // Phone width.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pl-PL', isMobile: true, hasTouch: true });
  const mobile = await phone.newPage();
  watch(mobile);
  await mobile.goto(base);
  await mobile.locator('.calc-from').waitFor();
  await noSideScroll(mobile, 'telefon: strona główna');
  await shot(mobile, 'telefon-strona-glowna');
  await mobile.getByRole('button', { name: 'Otwórz menu' }).click();
  check(await mobile.getByRole('navigation', { name: 'Główne menu' }).getByRole('link', { name: 'Cennik' }).isVisible(), 'telefon: menu się nie otwiera');
  await mobile.getByRole('button', { name: 'Zamknij menu' }).click();
  await mobile.locator('.calc').scrollIntoViewIfNeeded();
  await shot(mobile.locator('.calc'), 'telefon-kalkulator', { scroll: false });
  for (const path of ['realizacje.html', 'kontakt.html', 'cennik.html', 'poradnik.html']) {
    await mobile.goto(`${base}${path}`);
    await mobile.getByRole('heading', { level: 1 }).waitFor();
    await noSideScroll(mobile, `telefon: ${path}`);
  }
  await phone.close();
} catch (error) {
  problems.push(`test przerwany: ${error.message.split('\n').slice(0, 3).join(' | ')}`);
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  console.error(`Problemy (${problems.length}):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('Test w przeglądarce przeszedł. Zrzuty ekranu są w docs/.');
