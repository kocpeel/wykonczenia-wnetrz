import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisitDate, validateContact, visitLimits } from '../src/assets/js/contact-core.js';

// Saturday, 14 November 2026: tomorrow is a Sunday.
const today = new Date(2026, 10, 14, 15, 30);
const good = { name: 'Jan', phone: '+48 600 000 000', email: '', postal: '53-012', area: '52', visit: '2026-11-16', consent: 'on' };

describe('formularz oględzin', () => {
  it('przyjmuje poprawne dane, a e-mail i metraż są opcjonalne', () => {
    assert.deepEqual(validateContact(good, today), {});
    assert.deepEqual(validateContact({ ...good, area: '', visit: '' }, today), {});
  });

  it('wskazuje każde błędne pole', () => {
    const errors = validateContact({ name: 'J', phone: '12345', email: 'jan@', postal: '53012', area: '5', visit: '', consent: '' }, today);
    assert.deepEqual(Object.keys(errors).sort(), ['area', 'consent', 'email', 'name', 'phone', 'postal']);
  });

  it('termin oględzin: od jutra, do 60 dni, bez niedziel', () => {
    assert.deepEqual(visitLimits(today), { min: '2026-11-15', max: '2027-01-13' });
    assert.match(validateContact({ ...good, visit: '2026-11-14' }, today).visit, /od jutra/);
    assert.match(validateContact({ ...good, visit: '2026-11-15' }, today).visit, /niedziele/);
    assert.match(validateContact({ ...good, visit: '2027-01-14' }, today).visit, /60 dni/);
    assert.match(validateContact({ ...good, visit: '2026-02-30' }, today).visit, /kalendarza/);
    assert.equal(validateContact({ ...good, visit: '2027-01-13' }, today).visit, undefined);
  });

  it('podaje termin po polsku', () => {
    assert.equal(formatVisitDate('2026-11-16'), 'poniedziałek, 16 listopada');
    assert.equal(formatVisitDate('zła data'), '');
  });
});
