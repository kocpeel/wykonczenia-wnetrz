// "Czy do Ciebie dojedziemy?" postal code check.
import { normalizePostal, serviceArea } from './pricing.js';

export function areaMessage(code) {
  const result = serviceArea(normalizePostal(code));
  return { ...result, html: `<strong>${result.title}</strong> ${result.message}` };
}

export function initAreaCheck() {
  const form = document.getElementById('dojazd-form');
  if (!form) return;
  const output = document.getElementById('dojazd-wynik');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.elements.postal;
    const result = areaMessage(input.value);
    output.dataset.status = result.status;
    output.innerHTML = result.html;
    input.setAttribute('aria-invalid', String(result.status === 'invalid'));
    if (result.status !== 'invalid') input.value = normalizePostal(input.value);
  });
}
