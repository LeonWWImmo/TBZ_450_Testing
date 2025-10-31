// recipes.js
const RECIPES_KEY = 'recipes.v1';

function loadRecipes() {
  try { return JSON.parse(localStorage.getItem(RECIPES_KEY) || '[]'); }
  catch { return []; }
}
function saveRecipes(list) { localStorage.setItem(RECIPES_KEY, JSON.stringify(list)); }

function renderList() {
  const listEl = document.getElementById('recipe-list');
  if (!listEl) return;
  const data = loadRecipes();
  listEl.innerHTML = '';
  if (!data.length) {
    const p = document.createElement('p');
    p.textContent = 'Noch keine Rezepte. Lege gleich eines an!';
    listEl.appendChild(p);
    return;
  }
  const ul = document.createElement('ul');
  ul.style.listStyle = 'none';
  ul.style.padding = '0';
  data.forEach(r => {
    const li = document.createElement('li');
    li.style.borderBottom = '1px solid #eee';
    li.style.padding = '12px 0';
    const title = document.createElement('strong'); title.textContent = r.title;
    const desc = document.createElement('div'); desc.style.opacity='.8'; desc.textContent = r.description || '';
    const ing = document.createElement('div'); ing.style.fontSize='13px'; ing.style.marginTop='6px';
    ing.textContent = r.ingredients?.length ? 'Zutaten: ' + r.ingredients.join(', ') : '';
    li.append(title, desc, ing);
    ul.appendChild(li);
  });
  listEl.appendChild(ul);
}

function wireForm() {
  const form = document.getElementById('recipe-form');
  if (!form) return;
  const errEl = document.getElementById('recipe-error');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('r-title').value.trim();
    const description = document.getElementById('r-desc').value.trim();
    const ingredients = document.getElementById('r-ing').value.split(',').map(s=>s.trim()).filter(Boolean);
    if (title.length < 3) { errEl.textContent = 'Titel mindestens 3 Zeichen'; return; }
    if (!ingredients.length) { errEl.textContent = 'Mindestens eine Zutat angeben'; return; }
    const list = loadRecipes();
    list.unshift({ id: crypto.randomUUID(), title, description, ingredients, createdAt: new Date().toISOString() });
    saveRecipes(list);
    window.location.href = 'recipes.html';
  });
}

document.addEventListener('DOMContentLoaded', () => { renderList(); wireForm(); });
