// Estimate calculator (the "kalkulator" partial on the home and price list pages).
import { escapeHtml } from './html.js';
import { formatZl } from './money.js';
import { STANDARDS, clampArea, estimate } from './pricing.js';

const quantity = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });

export function readCalculator(form) {
  const data = new FormData(form);
  return {
    area: clampArea(data.get('area')),
    scopes: data.getAll('scope').map(String),
    standard: STANDARDS[data.get('standard')] ? String(data.get('standard')) : 'standard',
    materials: form.elements.materials.checked,
  };
}

// The contact form reads these parameters and attaches the estimate to the request.
export function contactLink(input) {
  const params = new URLSearchParams({
    metraz: String(input.area),
    zakres: input.scopes.join(','),
    standard: input.standard,
    materialy: input.materials ? '1' : '0',
  });
  return `kontakt.html?${params}#formularz`;
}

export function initCalculator() {
  const form = document.getElementById('kalkulator-form');
  if (!form) return null;
  const result = document.getElementById('kalkulator-wynik');
  const slider = document.getElementById('metraz-suwak');
  const number = form.elements.area;
  const note = document.getElementById('standard-note');

  const render = () => {
    const input = readCalculator(form);
    note.textContent = STANDARDS[input.standard].note;
    const wasOpen = result.querySelector('details')?.open ?? false;
    const estimateResult = estimate(input);
    if (!estimateResult.total) {
      result.innerHTML = '<h3>Szacunkowy koszt</h3><p class="calc-empty">Zaznacz przynajmniej jeden zakres prac, żeby zobaczyć wycenę.</p>';
      return;
    }
    const { area, from, to, perM2, weeks, items, labor, materials } = estimateResult;
    result.innerHTML = `
      <h3>Szacunkowy koszt dla ${area} m²</h3>
      <p class="calc-range"><span class="calc-from">${formatZl(from)}</span> – <span class="calc-to">${formatZl(to)}</span><small>ok. ${formatZl(perM2)} za m², brutto z 8% VAT</small></p>
      <dl class="calc-meta">
        <div><dt>Czas prac</dt><dd>ok. ${weeks} tyg.</dd></div>
        <div><dt>Materiały</dt><dd>${input.materials ? formatZl(materials) : 'kupujesz sam'}</dd></div>
      </dl>
      <details class="calc-breakdown"${wasOpen ? ' open' : ''}>
        <summary>Z czego to wynika</summary>
        <table>
          <thead><tr><th scope="col">Pozycja</th><th scope="col">Kwota</th></tr></thead>
          <tbody>
            ${items.map((item) => `<tr><td>${escapeHtml(item.label)} <span class="calc-qty">(${quantity.format(item.quantity)} ${item.unit})</span></td><td>${formatZl(item.total)}</td></tr>`).join('')}
            <tr><td>w tym robocizna</td><td>${formatZl(labor)}</td></tr>
          </tbody>
        </table>
      </details>
      <p class="calc-note">To szacunek z cennika. Wiążącą cenę podajemy po bezpłatnych oględzinach i zapisujemy ją w umowie.</p>
      <a class="btn btn-accent btn-block" href="${contactLink(input)}">Umów oględziny z tą wyceną</a>`;
  };

  slider.addEventListener('input', () => {
    number.value = slider.value;
    render();
  });
  number.addEventListener('input', () => {
    if (number.value !== '') slider.value = String(clampArea(number.value));
    render();
  });
  number.addEventListener('change', () => {
    number.value = String(clampArea(number.value));
    slider.value = number.value;
    render();
  });
  form.addEventListener('change', render);
  form.addEventListener('submit', (event) => event.preventDefault());
  render();

  return {
    setStandard(value) {
      const radio = form.querySelector(`input[name="standard"][value="${CSS.escape(value)}"]`);
      if (!radio) return;
      radio.checked = true;
      render();
      document.getElementById('kalkulator').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      radio.focus({ preventScroll: true });
    },
  };
}
