import { initAreaCheck } from './area.js';
import { initCalculator } from './calc.js';
import { PROJECTS, projectCard } from './projects.js';
import { initPage } from './ui.js';

initPage();
const calculator = initCalculator();
initAreaCheck();

document.getElementById('realizacje-lista').innerHTML = PROJECTS.slice(0, 3).map((project) => projectCard(project)).join('');

for (const button of document.querySelectorAll('[data-standard]')) {
  button.addEventListener('click', () => calculator?.setStandard(button.dataset.standard));
}
