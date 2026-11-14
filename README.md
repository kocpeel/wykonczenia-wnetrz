# Strona firmy od wykończeń wnętrz

Strona lokalnej firmy usługowej z kalkulatorem wyceny: usługi, cennik, standardy wykończenia, sprawdzanie dojazdu po kodzie pocztowym, galeria realizacji, poradnik i formularz zgłoszenia.

To projekt demonstracyjny. Firma Gładko, jej ceny, realizacje i opinie są fikcyjne, a formularze niczego nie wysyłają.

**Demo:** [kocpeel.github.io/wykonczenia-wnetrz](https://kocpeel.github.io/wykonczenia-wnetrz/)

![Strona główna](docs/strona-glowna.png)

## Co potrafi

- Kalkulator kosztu wykończenia: metraż, zakres prac, standard i materiały. Pokazuje przedział cen, cenę za metr, czas prac i rozbicie na pozycje.
- Wycena przechodzi z kalkulatora do formularza zgłoszenia razem z metrażem i zakresem prac.
- Sprawdzanie dojazdu po kodzie pocztowym, także wpisanym bez myślnika.
- Formularz zgłoszenia ze sprawdzaniem danych: telefon, kod pocztowy, metraż i termin oględzin od jutra do 60 dni naprzód, bez niedziel.
- Galeria realizacji z filtrami, podglądem na pełnym ekranie, obsługą strzałkami i linkami do konkretnej realizacji.
- Cennik, pytania i odpowiedzi oraz poradnik z tymi samymi liczbami co kalkulator.
- Widok na telefonie, obsługa z klawiatury i opisy dla czytników ekranu.

## Technologie

| Warstwa | Narzędzia |
|---|---|
| Strona | HTML, CSS i JavaScript w modułach, bez frameworka |
| Budowanie | Własny skrypt w Node.js bez zależności: wspólny szablon, nagłówek, stopka i kalkulator |
| Testy | `node:test` dla kalkulatora i formularza, Playwright w Microsoft Edge dla całej strony |
| Hosting | GitHub Pages, publikacja przez GitHub Actions |

Czcionki Bricolage Grotesque i Inter są hostowane razem ze stroną, więc przeglądarka klienta nie łączy się z serwerami Google.

## Uruchomienie

Potrzebny jest Node.js 22 lub nowszy. Budowanie nie wymaga instalowania pakietów.

```powershell
npm run build
npm start
```

Strona działa wtedy pod adresem <http://localhost:4173>.

## Testy

```powershell
npm test
npm install
npm run e2e
```

- `npm test` sprawdza model wyceny, obszar dojazdu i formularz zgłoszenia, w tym terminy oględzin.
- `npm run e2e` przechodzi w zainstalowanym Microsoft Edge kalkulator, formularz i galerię, sprawdza widok na telefonie i zapisuje zrzuty ekranu w `docs/`.

Na GitHubie testy uruchamiają się przy każdym wypchnięciu kodu, a strona publikuje się potem na GitHub Pages.

## Dostosowanie do innej firmy

Ceny i założenia kalkulatora są w jednym pliku, `src/assets/js/pricing.js`. Każda pozycja ma tam ilość liczoną z metrażu oraz stawki robocizny i materiałów dla trzech standardów. Realizacje są w `src/assets/js/projects.js`.

## Struktura

```text
src/pages/       treść podstron
src/partials/    nagłówek, stopka, kalkulator i inne wspólne fragmenty
src/assets/js/   kalkulator, galeria, formularz i dane
src/assets/css/  wygląd
scripts/         budowanie i lokalny serwer
tests/           testy logiki
e2e/             test w przeglądarce
docs/            zrzuty ekranu
```

## Zdjęcia

Zdjęcia pochodzą z serwisu Unsplash i są używane zgodnie z licencją Unsplash. Nie przedstawiają prawdziwych realizacji. Lista z linkami jest na stronie [Kontakt](https://kocpeel.github.io/wykonczenia-wnetrz/kontakt.html#projekt).
