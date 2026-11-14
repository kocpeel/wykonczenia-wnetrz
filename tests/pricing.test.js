import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AREA_MAX, AREA_MIN, SCOPES, clampArea, estimate, normalizePostal, serviceArea } from '../src/assets/js/pricing.js';
import { formatZl } from '../src/assets/js/money.js';

const ALL = SCOPES.map((scope) => scope.id);

describe('kalkulator wyceny', () => {
  it('liczy mieszkanie 50 m² pod klucz w standardzie', () => {
    const result = estimate({ area: 50, scopes: ALL, standard: 'standard', materials: true });
    assert.equal(result.labor, 36173);
    assert.equal(result.materials, 30010);
    assert.equal(result.total, 66183);
    assert.equal(result.from, 59600);
    assert.equal(result.to, 76100);
    assert.equal(result.weeks, 8);
    assert.equal(result.perM2, 1324);
  });

  it('bez materiałów liczy samą robociznę', () => {
    const result = estimate({ area: 50, scopes: ALL, standard: 'premium', materials: false });
    assert.equal(result.materials, 0);
    assert.equal(result.total, result.labor);
    assert.ok(result.items.every((item) => item.total === item.labor));
  });

  it('premium jest droższy od standardu, a standard od wersji podstawowej', () => {
    const [basic, standard, premium] = ['podstawowy', 'standard', 'premium']
      .map((level) => estimate({ area: 60, scopes: ALL, standard: level }).total);
    assert.ok(basic < standard && standard < premium);
  });

  it('w dużym mieszkaniu liczy dwie łazienki', () => {
    const small = estimate({ area: 70, scopes: ['lazienka'] }).items.find((item) => item.id === 'lazienka');
    const large = estimate({ area: 71, scopes: ['lazienka'] }).items.find((item) => item.id === 'lazienka');
    assert.equal(small.quantity, 1);
    assert.equal(large.quantity, 2);
  });

  it('pomija nieznany zakres i zwraca zero bez wybranych prac', () => {
    assert.equal(estimate({ area: 40, scopes: ['basen'] }).total, 0);
    assert.equal(estimate({ area: 40, scopes: [] }).weeks, 0);
  });

  it('pilnuje zakresu metrażu', () => {
    assert.equal(clampArea(3), AREA_MIN);
    assert.equal(clampArea(9000), AREA_MAX);
    assert.equal(clampArea('47.6'), 48);
    assert.equal(clampArea('abc'), AREA_MIN);
  });
});

describe('obszar dojazdu', () => {
  it('rozpoznaje Wrocław, okolice, region i resztę kraju', () => {
    assert.equal(serviceArea('50-001').status, 'free');
    assert.equal(serviceArea('54-130').status, 'free');
    assert.equal(serviceArea('55-080').status, 'near');
    assert.equal(serviceArea('58-300').status, 'far');
    assert.equal(serviceArea('00-950').status, 'outside');
    assert.equal(serviceArea('30-001').status, 'outside');
  });

  it('poprawia kod wpisany bez myślnika', () => {
    assert.equal(normalizePostal('53012'), '53-012');
    assert.equal(normalizePostal(' 53-012 '), '53-012');
    assert.equal(normalizePostal('5301'), '5301');
  });

  it('odrzuca kod w złym formacie', () => {
    assert.equal(serviceArea('50001').status, 'invalid');
    assert.equal(serviceArea(' 50-001 ').status, 'free');
    assert.equal(serviceArea(undefined).status, 'invalid');
  });
});

describe('kwoty', () => {
  it('formatuje złote po polsku', () => {
    assert.equal(formatZl(59600).replace(/\s/g, ' '), '59 600 zł');
  });
});
