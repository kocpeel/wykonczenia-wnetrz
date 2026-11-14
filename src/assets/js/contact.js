// Visit request form: prefilled from the calculator, validated in the browser, never sent anywhere (demo).
import { areaMessage } from './area.js';
import { formatVisitDate, validateContact, visitLimits } from './contact-core.js';
import { escapeHtml } from './html.js';
import { formatZl } from './money.js';
import { SCOPES, STANDARDS, estimate } from './pricing.js';
import { initPage } from './ui.js';

initPage();

const form = document.getElementById('zgloszenie');
const FIELDS = ['name', 'phone', 'email', 'postal', 'area', 'visit', 'consent'];
const params = new URLSearchParams(location.search);

const limits = visitLimits(new Date());
form.elements.visit.min = limits.min;
form.elements.visit.max = limits.max;

// Prefill from the calculator link: kontakt.html?metraz=50&zakres=sciany,podlogi&standard=standard&materialy=1
if (params.has('metraz')) {
  const scopes = (params.get('zakres') ?? '').split(',').filter((id) => SCOPES.some((scope) => scope.id === id));
  const standard = STANDARDS[params.get('standard')] ? params.get('standard') : 'standard';
  const materials = params.get('materialy') !== '0';
  const result = estimate({ area: params.get('metraz'), scopes, standard, materials });
  if (result.total) {
    form.elements.area.value = String(result.area);
    for (const box of form.querySelectorAll('input[name="scope"]')) box.checked = scopes.includes(box.value);
    const summary = `${result.area} m², w standardzie „${STANDARDS[standard].label}”, ${materials ? 'z materiałami' : 'bez materiałów'}: ${formatZl(result.from)} – ${formatZl(result.to)}`;
    form.elements.estimate.value = summary;
    const note = document.getElementById('wycena');
    note.innerHTML = `<strong>Dołączymy wycenę z kalkulatora.</strong> ${escapeHtml(summary)}, ok. ${result.weeks} tyg. prac.`;
    note.classList.add('is-visible');
  }
}

function showError(name, message) {
  const field = document.getElementById(`f-${name}`);
  const error = document.getElementById(`f-${name}-error`);
  if (!field || !error) return;
  error.textContent = message;
  field.setAttribute('aria-invalid', String(Boolean(message)));
}

for (const name of FIELDS) {
  form.elements[name].addEventListener('input', () => showError(name, ''));
}

const areaHint = document.getElementById('f-postal-hint');
form.elements.postal.addEventListener('change', () => {
  const result = areaMessage(form.elements.postal.value);
  areaHint.innerHTML = result.status === 'invalid' ? 'Sprawdzimy, czy do Ciebie dojedziemy.' : result.html;
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  values.consent = form.elements.consent.checked;
  const errors = validateContact(values, new Date());
  for (const name of FIELDS) showError(name, errors[name] ?? '');
  const first = FIELDS.find((name) => errors[name]);
  if (first) {
    document.getElementById(`f-${first}`).focus();
    return;
  }
  const name = String(values.name).trim().split(/\s+/)[0];
  const visit = values.visit ? ` Zaproponowany termin oględzin to ${formatVisitDate(values.visit)}.` : '';
  document.getElementById('formularz').innerHTML = `<div class="success">
    <div class="success-icon"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
    <h2 id="dziekujemy" tabindex="-1">Dziękujemy, ${escapeHtml(name)}!</h2>
    <p>Oddzwonimy w ciągu jednego dnia roboczego, żeby potwierdzić szczegóły.${escapeHtml(visit)}</p>
    <p class="demo-note">To wersja demonstracyjna: zgłoszenie nie zostało nigdzie wysłane.</p>
    <p><a class="btn btn-dark" href="realizacje.html">Zobacz nasze realizacje</a></p>
  </div>`;
  document.getElementById('dziekujemy').focus();
});
