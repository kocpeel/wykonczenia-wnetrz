// Gallery of finished projects: category filters and a lightbox built on <dialog>.
import { escapeHtml } from './html.js';
import { CATEGORIES, PROJECTS, findProject, projectCard } from './projects.js';
import { initPage } from './ui.js';

initPage();

const list = document.getElementById('galeria');
const count = document.getElementById('galeria-liczba');
const dialog = document.getElementById('podglad');
const filterButtons = [...document.querySelectorAll('[data-category]')];
let visible = PROJECTS;
let current = null;

function plural(n) {
  if (n === 1) return 'realizacja';
  return n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'realizacje' : 'realizacji';
}

function showCategory(category) {
  const known = category in CATEGORIES ? category : 'wszystkie';
  for (const button of filterButtons) button.setAttribute('aria-pressed', String(button.dataset.category === known));
  visible = known === 'wszystkie' ? PROJECTS : PROJECTS.filter((project) => project.category === known);
  list.innerHTML = visible.map((project) => projectCard(project, `#${project.id}`)).join('');
  count.textContent = `${visible.length} ${plural(visible.length)}`;
  const url = new URL(location.href);
  if (known === 'wszystkie') url.searchParams.delete('kategoria');
  else url.searchParams.set('kategoria', known);
  history.replaceState(null, '', url);
}

function open(project) {
  current = project;
  dialog.querySelector('img').src = `assets/img/${project.image}-1600.webp`;
  dialog.querySelector('img').alt = project.alt;
  dialog.querySelector('.lightbox-text').innerHTML = `
    <span class="eyebrow">${CATEGORIES[project.category]} · ${escapeHtml(project.district)}</span>
    <h2 id="podglad-tytul">${escapeHtml(project.title)}</h2>
    <p>${escapeHtml(project.description)}</p>
    <dl class="spec">
      <dt>Dzielnica</dt><dd>${escapeHtml(project.district)}</dd>
      <dt>Powierzchnia</dt><dd>${project.area}</dd>
      <dt>Czas prac</dt><dd>${project.weeks} tyg.</dd>
      <dt>Zakres</dt><dd>${escapeHtml(project.scope)}</dd>
    </dl>
    <div class="lightbox-nav">
      <button class="icon-btn" type="button" data-move="-1" aria-label="Poprzednia realizacja"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 5 8 12l7 7"/></svg></button>
      <button class="icon-btn" type="button" data-move="1" aria-label="Następna realizacja"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m9 5 7 7-7 7"/></svg></button>
      <a class="btn btn-accent btn-sm" href="kontakt.html#formularz">Chcę podobnie</a>
    </div>`;
  if (!dialog.open) dialog.showModal();
  history.replaceState(null, '', `${location.pathname}${location.search}#${project.id}`);
}

function move(step) {
  const index = visible.indexOf(current);
  open(visible[(index + step + visible.length) % visible.length]);
}

list.addEventListener('click', (event) => {
  const card = event.target.closest('[data-project]');
  if (!card) return;
  event.preventDefault();
  open(findProject(card.dataset.project));
});

for (const button of filterButtons) {
  button.addEventListener('click', () => showCategory(button.dataset.category));
}

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
  const step = event.target.closest('[data-move]');
  if (step) move(Number(step.dataset.move));
});
dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') move(1);
  if (event.key === 'ArrowLeft') move(-1);
});
dialog.addEventListener('close', () => {
  history.replaceState(null, '', `${location.pathname}${location.search}`);
  const card = current && list.querySelector(`[data-project="${current.id}"]`);
  card?.focus();
});

// A link such as realizacje.html#krzyki-salon opens that project, also when only the hash changes.
function openFromHash() {
  const linked = findProject(location.hash.slice(1));
  if (!linked) return;
  if (!visible.includes(linked)) showCategory('wszystkie');
  open(linked);
}

showCategory(new URLSearchParams(location.search).get('kategoria') ?? 'wszystkie');
openFromHash();
window.addEventListener('hashchange', openFromHash);
