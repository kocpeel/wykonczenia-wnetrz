// Validation of the visit request form. Dates are handled as UTC midnights, so the result does not depend on time zones.
import { AREA_MAX, AREA_MIN } from './pricing.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^(\+48)?\d{9}$/;
const POSTAL = /^\d{2}-\d{3}$/;
const DAY = 24 * 60 * 60 * 1000;
export const BOOKING_DAYS = 60;

function startOfDay(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIso(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!match) return null;
  const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(time).toISOString().slice(0, 10) === value ? time : null;
}

const iso = (time) => new Date(time).toISOString().slice(0, 10);

// The visit can be booked from tomorrow up to 60 days ahead, Monday to Saturday.
export function visitLimits(today = new Date()) {
  const start = startOfDay(today);
  return { min: iso(start + DAY), max: iso(start + BOOKING_DAYS * DAY) };
}

export function formatVisitDate(value) {
  const time = parseIso(value);
  if (time === null) return '';
  return new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(time);
}

export function validateContact(values, today = new Date()) {
  const text = (name) => String(values[name] ?? '').trim();
  const errors = {};
  if (text('name').length < 2) errors.name = 'Podaj imię, żebyśmy wiedzieli, jak się zwracać.';
  if (!PHONE.test(text('phone').replace(/[\s-]/g, ''))) errors.phone = 'Podaj 9 cyfr numeru telefonu.';
  if (text('email') && !EMAIL.test(text('email'))) errors.email = 'Ten adres e-mail wygląda na niepełny.';
  if (!POSTAL.test(text('postal'))) errors.postal = 'Wpisz kod pocztowy w formacie 00-000.';
  if (text('area')) {
    const area = Number(text('area').replace(',', '.'));
    if (!Number.isFinite(area) || area < AREA_MIN || area > AREA_MAX) errors.area = `Podaj metraż od ${AREA_MIN} do ${AREA_MAX} m².`;
  }
  if (text('visit')) {
    const time = parseIso(text('visit'));
    const { min, max } = visitLimits(today);
    if (time === null) errors.visit = 'Wybierz datę z kalendarza.';
    else if (time < parseIso(min) || time > parseIso(max)) errors.visit = `Wybierz dzień od jutra do ${BOOKING_DAYS} dni naprzód.`;
    else if (new Date(time).getUTCDay() === 0) errors.visit = 'W niedziele nie przyjeżdżamy. Wybierz inny dzień.';
  }
  if (!values.consent) errors.consent = 'Potrzebujemy zgody, żeby oddzwonić w sprawie wyceny.';
  return errors;
}
