// Cost model behind the estimate calculator. Prices are gross amounts in złoty with 8% VAT,
// the rate for renovation work in flats. Pure functions only, so they run in node:test too.

export const AREA_MIN = 15;
export const AREA_MAX = 250;

export const STANDARDS = {
  podstawowy: { label: 'Podstawowy', note: 'Sprawdzone materiały w rozsądnej cenie' },
  standard: { label: 'Standard', note: 'Najczęściej wybierany' },
  premium: { label: 'Premium', note: 'Deska, duże formaty płytek, armatura z wyższej półki' },
};

export const SCOPES = [
  { id: 'sciany', label: 'Gładzie i malowanie', note: 'ściany i sufity' },
  { id: 'podlogi', label: 'Podłogi', note: 'panele albo deska' },
  { id: 'lazienka', label: 'Łazienka pod klucz', note: 'płytki i biały montaż' },
  { id: 'kuchnia', label: 'Kuchnia', note: 'montaż zabudowy i płytki' },
  { id: 'drzwi', label: 'Drzwi wewnętrzne', note: 'z ościeżnicami' },
  { id: 'elektryka', label: 'Elektryka', note: 'osprzęt i oświetlenie' },
];

const LEVEL = { podstawowy: 0, standard: 1, premium: 2 };

// Quantities are derived from the floor area: walls and ceilings are about 3.5 m² per m² of floor,
// floors cover about 85% of it (the rest is tiled), and there is one electrical point per 1.5 m².
const MODEL = {
  przygotowanie: { label: 'Zabezpieczenie i sprzątanie', unit: 'm²', quantity: (area) => area, labor: [6, 6, 6], materials: [2, 2, 2] },
  sciany: { label: 'Gładzie i malowanie ścian i sufitów', unit: 'm² ścian', quantity: (area) => area * 3.5, labor: [64, 64, 64], materials: [8, 12, 20] },
  podlogi: { label: 'Podłogi', unit: 'm²', quantity: (area) => area * 0.85, labor: [45, 45, 85], materials: [50, 90, 220] },
  lazienka: { label: 'Łazienka pod klucz', unit: 'szt.', quantity: (area) => (area > 70 ? 2 : 1), labor: [14000, 14000, 14000], materials: [8000, 14000, 26000] },
  kuchnia: { label: 'Kuchnia', unit: 'szt.', quantity: () => 1, labor: [3000, 3000, 3000], materials: [1200, 2500, 5000] },
  drzwi: { label: 'Drzwi wewnętrzne', unit: 'szt.', quantity: (area) => Math.max(2, Math.round(area / 12)), labor: [450, 450, 450], materials: [900, 1500, 2800] },
  elektryka: { label: 'Elektryka', unit: 'pkt', quantity: (area) => Math.round(area / 1.5), labor: [120, 120, 120], materials: [25, 45, 90] },
};

const WEEKS = {
  sciany: (area) => area / 30,
  podlogi: (area) => area / 60,
  lazienka: (area) => (area > 70 ? 4 : 2.5),
  kuchnia: () => 1,
  drzwi: () => 0.5,
  elektryka: (area) => area / 80,
};

const roundTo = (value, step) => Math.round(value / step) * step;

export function clampArea(area) {
  return Math.min(AREA_MAX, Math.max(AREA_MIN, Math.round(Number(area) || AREA_MIN)));
}

export function estimate({ area, scopes = [], standard = 'standard', materials = true }) {
  const m2 = clampArea(area);
  const level = LEVEL[standard] ?? LEVEL.standard;
  const chosen = SCOPES.map((scope) => scope.id).filter((id) => scopes.includes(id));
  if (chosen.length === 0) {
    return { area: m2, items: [], labor: 0, materials: 0, total: 0, from: 0, to: 0, weeks: 0, perM2: 0 };
  }
  const items = ['przygotowanie', ...chosen].map((id) => {
    const model = MODEL[id];
    const quantity = model.quantity(m2);
    const labor = Math.round(quantity * model.labor[level]);
    const material = materials ? Math.round(quantity * model.materials[level]) : 0;
    return { id, label: model.label, quantity: Math.round(quantity * 10) / 10, unit: model.unit, labor, materials: material, total: labor + material };
  });
  const labor = items.reduce((sum, item) => sum + item.labor, 0);
  const materialsTotal = items.reduce((sum, item) => sum + item.materials, 0);
  const total = labor + materialsTotal;
  return {
    area: m2,
    items,
    labor,
    materials: materialsTotal,
    total,
    from: roundTo(total * 0.9, 100),
    to: roundTo(total * 1.15, 100),
    weeks: Math.max(1, Math.ceil(chosen.reduce((weeks, id) => weeks + WEEKS[id](m2), 0))),
    perM2: Math.round(total / m2),
  };
}

// "53012" and " 53-012 " both become "53-012"; anything else is returned trimmed for validation to reject.
export function normalizePostal(value) {
  const text = String(value ?? '').trim();
  return /^\d{5}$/.test(text) ? `${text.slice(0, 2)}-${text.slice(2)}` : text;
}

// Service area by Polish postal code: Wrocław is 50–54, the county around it 55, the rest of Lower Silesia 56–59.
export function serviceArea(code) {
  const clean = String(code ?? '').trim();
  if (!/^\d{2}-\d{3}$/.test(clean)) return { status: 'invalid', title: 'Sprawdź kod', message: 'Wpisz kod pocztowy w formacie 00-000.' };
  const prefix = Number(clean.slice(0, 2));
  if (prefix >= 50 && prefix <= 54) {
    return { status: 'free', title: 'Wrocław', message: 'Oględziny i dojazd są bezpłatne.' };
  }
  if (prefix === 55) {
    return { status: 'near', title: 'Okolice Wrocławia', message: 'Oględziny kosztują 100 zł i odliczamy je od ceny w umowie. Dojazd w trakcie prac jest bezpłatny.' };
  }
  if (prefix >= 56 && prefix <= 59) {
    return { status: 'far', title: 'Dolny Śląsk', message: 'Przyjeżdżamy przy zleceniach od 40 m². Dojazd liczymy 2 zł za kilometr w jedną stronę.' };
  }
  return { status: 'outside', title: 'Poza naszym obszarem', message: 'Tam nie dojeżdżamy, ale chętnie polecimy sprawdzoną ekipę z Twojej okolicy.' };
}
