// /recipes/recipes.js
const RECIPES_KEY = 'recipes.v1';

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}
function loadRecipes() {
  return safeParse(localStorage.getItem(RECIPES_KEY) || '[]', []);
}
function saveRecipes(list) {
  try { localStorage.setItem(RECIPES_KEY, JSON.stringify(list)); }
  catch { /* why: Quota exceeded or storage disabled */ }
}

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
  ul.setAttribute('role', 'list');

  data.forEach(r => {
    const li = document.createElement('li');
    li.setAttribute('role', 'listitem');
    li.style.borderBottom = '1px solid #eee';
    li.style.padding = '12px 0';
    li.className = 'recipe-item';

    const title = document.createElement('h3');
    title.className = 'recipe-title';
    title.textContent = r.title;

    const meta = document.createElement('div');
    meta.className = 'recipe-meta';
    const date = new Date(r.createdAt || Date.now());
    meta.textContent = `Angelegt: ${date.toLocaleString('de-CH')}`;

    const desc = document.createElement('div');
    desc.className = 'recipe-desc';
    desc.textContent = r.description || '';

    const ing = document.createElement('div');
    ing.className = 'recipe-ingredients';
    ing.textContent = r.ingredients?.length ? 'Zutaten: ' + r.ingredients.join(', ') : '';

    const actions = document.createElement('div');
    actions.className = 'recipe-actions';

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'button secondary';
    del.textContent = 'Löschen';
    del.addEventListener('click', () => {
      if (!confirm(`„${r.title}“ wirklich löschen?`)) return;
      const next = loadRecipes().filter(x => x.id !== r.id);
      saveRecipes(next);
      renderList();
    });

    actions.append(del);
    li.append(title, meta, desc, ing, actions);
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
    errEl.textContent = '';

    const title = document.getElementById('r-title').value.trim();
    const description = document.getElementById('r-desc').value.trim();
    const ingredients = document.getElementById('r-ing').value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (title.length < 3) { errEl.textContent = 'Titel mindestens 3 Zeichen.'; return; }
    if (!ingredients.length) { errEl.textContent = 'Mindestens eine Zutat angeben.'; return; }

    const list = loadRecipes();
    list.unshift({
      id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random()),
      title, description, ingredients, createdAt: new Date().toISOString()
    });
    saveRecipes(list);
    window.location.href = 'recipes.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderList();
  wireForm();
});
