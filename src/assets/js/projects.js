// Fictional finished projects shown on the home page and in the gallery.
import { escapeHtml } from './html.js';

export const CATEGORIES = { salony: 'Salony', lazienki: 'Łazienki', kuchnie: 'Kuchnie' };

export const PROJECTS = [
  {
    id: 'oltaszyn-kuchnia',
    title: 'Kuchnia z wyspą',
    district: 'Ołtaszyn',
    category: 'kuchnie',
    area: '22 m²',
    weeks: 3,
    scope: 'montaż zabudowy z wyspą, płytki wielkoformatowe, oświetlenie',
    image: 'kuchnia-3',
    height: 450,
    alt: 'Kuchnia z wyspą, marmurowym blatem i hokerami',
    description: 'Wyspa z blatem z konglomeratu, płytki 120×280 cm na ścianie i podświetlenie szafek. Zabudowę zamówili klienci, my przygotowaliśmy instalacje i wszystko zamontowaliśmy.',
  },
  {
    id: 'oporow-lazienka',
    title: 'Łazienka z wanną wolnostojącą',
    district: 'Oporów',
    category: 'lazienki',
    area: '9 m²',
    weeks: 4,
    scope: 'łazienka pod klucz, ogrzewanie podłogowe, dwie umywalki',
    image: 'lazienka-3',
    height: 533,
    alt: 'Łazienka z wanną wolnostojącą, dwiema umywalkami i drewnianą szafką',
    description: 'Z jednej ciasnej łazienki i schowka powstało 9 m² z wanną wolnostojącą. Ogrzewanie podłogowe sterowane z telefonu i odpływ liniowy przy prysznicu.',
  },
  {
    id: 'krzyki-salon',
    title: 'Minimalistyczny salon',
    district: 'Krzyki',
    category: 'salony',
    area: '64 m²',
    weeks: 7,
    scope: 'gładzie, malowanie, podłogi, oświetlenie liniowe',
    image: 'salon-1',
    height: 500,
    alt: 'Szary minimalistyczny salon z dużym oknem i niską sofą',
    description: 'Całe mieszkanie od stanu deweloperskiego. Oddaliśmy je po 7 tygodniach, dzień przed terminem z umowy.',
  },
  {
    id: 'psie-pole-lazienka',
    title: 'Łazienka w drewnie i kamieniu',
    district: 'Psie Pole',
    category: 'lazienki',
    area: '5,5 m²',
    weeks: 3,
    scope: 'łazienka pod klucz, zabudowa stelaża, lustro z oświetleniem',
    image: 'lazienka-1',
    height: 1200,
    alt: 'Łazienka z kamiennymi płytkami i drewnianą szafką pod umywalką',
    description: 'Płytki imitujące trawertyn, ciepłe drewno i czarna armatura. Prysznic bez brodzika, z odpływem w ścianie.',
  },
  {
    id: 'nadodrze-salon',
    title: 'Jasny salon z dębową podłogą',
    district: 'Nadodrze',
    category: 'salony',
    area: '38 m²',
    weeks: 4,
    scope: 'gładzie, malowanie, deska warstwowa',
    image: 'salon-2',
    height: 445,
    alt: 'Jasny salon z białą sofą, lampami wiszącymi i dębową podłogą',
    description: 'Odświeżenie mieszkania pod wynajem: nowe gładzie, ciepła biel na ścianach i deska dębowa w całym mieszkaniu.',
  },
  {
    id: 'biskupin-kuchnia',
    title: 'Kuchnia w grafitach',
    district: 'Biskupin',
    category: 'kuchnie',
    area: '11 m²',
    weeks: 2,
    scope: 'montaż zabudowy, płytki nad blatem, oświetlenie',
    image: 'kuchnia-1',
    height: 1067,
    alt: 'Kuchnia z grafitowymi szafkami, otwartymi półkami i białymi płytkami',
    description: 'Grafitowe fronty, otwarte półki z dębu i klasyczne płytki cegiełki. Nowe gniazdka nad blatem i oświetlenie pod szafkami.',
  },
  {
    id: 'srodmiescie-lazienka',
    title: 'Łazienka z marmurem',
    district: 'Śródmieście',
    category: 'lazienki',
    area: '4 m²',
    weeks: 3,
    scope: 'płytki 60×120, prysznic walk-in, szafka z blatem',
    image: 'lazienka-2',
    height: 533,
    alt: 'Mała łazienka z marmurowymi płytkami, okrągłym lustrem i rośliną',
    description: 'Małą łazienkę w kamienicy optycznie powiększyły płytki w dużym formacie i jedno okrągłe lustro.',
  },
  {
    id: 'kielczow-kuchnia',
    title: 'Kuchnia otwarta na ogród',
    district: 'Kiełczów',
    category: 'kuchnie',
    area: '18 m²',
    weeks: 3,
    scope: 'montaż zabudowy z wyspą, podłoga, malowanie',
    image: 'kuchnia-2',
    height: 1200,
    alt: 'Jasna kuchnia z wyspą i przeszklonymi drzwiami do ogrodu',
    description: 'Kuchnia w domu pod Wrocławiem, z wyjściem na taras. Podłoga z płytek drewnopodobnych przechodzi płynnie na zewnątrz.',
  },
];

export function findProject(id) {
  return PROJECTS.find((project) => project.id === id) ?? null;
}

export function projectCard(project, href = `realizacje.html#${project.id}`) {
  return `<a class="project" href="${href}" data-project="${project.id}">
    <span class="project-tag">${CATEGORIES[project.category]}</span>
    <img src="assets/img/${project.image}-800.webp" width="800" height="${project.height}" alt="${escapeHtml(project.alt)}" loading="lazy">
    <div class="project-body">
      <h3>${escapeHtml(project.title)}</h3>
      <span>${escapeHtml(project.district)}</span>
      <p>${project.area} · ${project.weeks} tyg. · ${escapeHtml(project.scope)}</p>
    </div>
  </a>`;
}
