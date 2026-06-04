/* =============================================
   نجمة الطبخ — Cooking Star | shared.js
   Central auth system, API helpers, and all page logic
   =============================================

   localStorage Keys still used (for session only — NOT for recipes):
   ─────────────────────────────────────────────
   cookingStar_session        → current logged-in user object
   cookingStar_token          → Bearer token string
   cookingStar_recent_searches→ array of search strings
   cookingStar_recently_viewed→ array of recipe IDs (max 10)
   cookingStar_form_draft     → object { filter, search, etc. }

   NOTE: Recipes and Favorites are now stored in the DATABASE,
   not in localStorage. All recipe read/write goes through the API.
   ============================================= */


/* ═══════════════════════════════════════════
   1. TOKEN / SESSION
═══════════════════════════════════════════ */
function getToken() {
  return localStorage.getItem('cookingStar_token');
}

function setToken(token) {
  localStorage.setItem('cookingStar_token', token);
}

function clearToken() {
  localStorage.removeItem('cookingStar_token');
}

function getSession() {
  try { return JSON.parse(localStorage.getItem('cookingStar_session')); } catch { return null; }
}

function setSession(user) {
  localStorage.setItem('cookingStar_session', JSON.stringify({
    email:     user.email,
    username:  user.username,
    firstName: user.firstName,
    role:      user.role,
    isAdmin:   user.role === 'admin' || user.isAdmin === true,
  }));
}

function clearSession() {
  localStorage.removeItem('cookingStar_session');
}


/* ═══════════════════════════════════════════
   2. API FETCH HELPER
═══════════════════════════════════════════ */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(path, { ...options, headers });
  return res;
}


/* ═══════════════════════════════════════════
   3. RECIPE API (replaces localStorage CRUD)
═══════════════════════════════════════════ */

/**
 * Fetch all recipes from the database.
 * Returns an array of recipe objects compatible with the rest of the JS.
 */
async function fetchRecipes() {
  try {
    const res = await apiFetch('/api/recipes/');
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(_normalizeRecipe);
  } catch {
    return [];
  }
}

/**
 * Fetch a single recipe by its numeric database ID.
 */
async function fetchRecipeById(id) {
  try {
    const res = await apiFetch(`/api/recipes/${id}/`);
    if (!res.ok) return null;
    return _normalizeRecipe(await res.json());
  } catch {
    return null;
  }
}

/**
 * Create a new recipe.
 * @param {object} recipeData  { name, course, description, instructions, time, difficulty, ingredients[] }
 * @param {File|null} imageFile  optional File object
 */
async function createRecipe(recipeData, imageFile = null) {
  if (imageFile) {
    // Use FormData when uploading a file
    const token = getToken();
    const form = new FormData();
    Object.entries(recipeData).forEach(([k, v]) =>
      form.append(k, typeof v === 'object' ? JSON.stringify(v) : v)
    );
    form.append('image', imageFile);
    const res = await fetch('/api/recipes/', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    return res;
  }
  return apiFetch('/api/recipes/', {
    method: 'POST',
    body: JSON.stringify(recipeData),
  });
}

/**
 * Update an existing recipe.
 */
async function updateRecipe(id, recipeData, imageFile = null) {
  if (imageFile) {
    const token = getToken();
    const form = new FormData();
    Object.entries(recipeData).forEach(([k, v]) =>
      form.append(k, typeof v === 'object' ? JSON.stringify(v) : v)
    );
    form.append('image', imageFile);
    return fetch(`/api/recipes/${id}/`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  }
  return apiFetch(`/api/recipes/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(recipeData),
  });
}

/**
 * Delete a recipe.
 */
async function deleteRecipe(id) {
  return apiFetch(`/api/recipes/${id}/`, { method: 'DELETE' });
}

/**
 * Search recipes by query and optional course filter.
 * Returns normalized recipe array.
 */
async function searchRecipesAPI(query, courseFilter = '') {
  try {
    const params = new URLSearchParams();
    if (query)        params.append('search', query);
    if (courseFilter) params.append('course', courseFilter);
    const res = await apiFetch(`/api/recipes/?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(_normalizeRecipe);
  } catch {
    return [];
  }
}

/**
 * Normalize API response to the shape the rest of the JS uses.
 * The API uses 'name', 'course', 'time', etc. — this ensures consistency.
 */
function _normalizeRecipe(r) {
  return {
    id:           r.id,
    name:         r.title || r.name || '',          // serializer returns 'title'
    course:       r.course || 'Main Course',
    description:  r.description || '',
    instructions: r.instructions || '',
    ingredients:  r.ingredients_list || [],
    image:        r.image_url || r.image || '',
    time:         r.time_minutes || r.time || 30,   // serializer returns 'time_minutes'
    difficulty:   r.difficulty || 2,
  };
}


/* ═══════════════════════════════════════════
   4. FAVORITES API
═══════════════════════════════════════════ */

// Cache favorite IDs locally so we don't hit the API on every heart render
let _favIds = null;

async function _loadFavIds() {
  if (_favIds !== null) return _favIds;
  try {
    const res = await apiFetch('/api/favorites/');
    if (!res.ok) { _favIds = []; return _favIds; }
    const data = await res.json();
    // GET /api/favorites/ returns an array of recipe objects
    _favIds = data.map(r => Number(r.id));
  } catch {
    _favIds = [];
  }
  return _favIds;
}

async function isFavorite(id) {
  const ids = await _loadFavIds();
  return ids.includes(Number(id));
}

async function addFavorite(id) {
  const res = await apiFetch('/api/favorites/', {
    method: 'POST',
    body: JSON.stringify({ recipe_id: id }),
  });
  if (res.ok && _favIds !== null && !_favIds.includes(Number(id))) {
    _favIds.push(Number(id));
  }
  return res.ok;
}

async function removeFavorite(id) {
  const res = await apiFetch(`/api/favorites/${id}/`, { method: 'DELETE' });
  if ((res.ok || res.status === 204) && _favIds !== null) {
    _favIds = _favIds.filter(fid => fid !== Number(id));
  }
  return res.ok || res.status === 204;
}

async function fetchFavorites() {
  try {
    const res = await apiFetch('/api/favorites/');
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(_normalizeRecipe);
  } catch {
    return [];
  }
}


/* ═══════════════════════════════════════════
   5. AUTH GUARDS
═══════════════════════════════════════════ */

/**
 * Verify the stored token is still valid by calling /api/me/.
 * If the server says it's invalid, clear local session and redirect to login.
 * Returns the session object if valid, null otherwise.
 */
async function requireLogin(redirectIfAdmin) {
  const s = getSession();
  if (!s) {
    window.location.href = '/login/';
    return null;
  }

  // Verify token is still valid on the server
  const token = getToken();
  if (token) {
    try {
      const res = await apiFetch('/api/me/');
      if (!res.ok) {
        // Token rejected by server — clear stale session
        clearSession();
        clearToken();
        window.location.href = '/login/';
        return null;
      }
    } catch {
      // Network error — allow offline-ish experience with local session
    }
  }

  if (redirectIfAdmin && s.isAdmin) {
    window.location.href = '/admin-dashboard/';
    return null;
  }

  return s;
}

async function requireAdmin() {
  const s = getSession();
  if (!s || !s.isAdmin) {
    window.location.href = '/login/';
    return null;
  }

  const token = getToken();
  if (token) {
    try {
      const res = await apiFetch('/api/me/');
      if (!res.ok) {
        clearSession();
        clearToken();
        window.location.href = '/login/';
        return null;
      }
    } catch {}
  }

  return s;
}

async function logoutUser() {
  const token = getToken();
  if (token) {
    try {
      await apiFetch('/api/logout/', { method: 'POST' });
    } catch (err) {
      console.warn('Logout API error:', err);
    }
  }
  clearSession();
  clearToken();
}


/* ═══════════════════════════════════════════
   6. RECENTLY VIEWED (still uses localStorage — not sensitive)
═══════════════════════════════════════════ */
function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem('cookingStar_recently_viewed')) || []; } catch { return []; }
}

function trackView(id) {
  let viewed = getRecentlyViewed().filter(v => v !== id);
  viewed.unshift(id);
  viewed = viewed.slice(0, 10);
  localStorage.setItem('cookingStar_recently_viewed', JSON.stringify(viewed));
}


/* ═══════════════════════════════════════════
   7. RECENT SEARCHES
═══════════════════════════════════════════ */
function searchGetRecent() {
  try { return JSON.parse(localStorage.getItem('cookingStar_recent_searches')) || []; } catch { return []; }
}

function searchSaveRecent(term) {
  if (!term.trim()) return;
  let r = searchGetRecent().filter(x => x !== term);
  r.unshift(term);
  localStorage.setItem('cookingStar_recent_searches', JSON.stringify(r.slice(0, 6)));
}


/* ═══════════════════════════════════════════
   8. FORM DRAFT
═══════════════════════════════════════════ */
function saveFormDraft(data) {
  try { localStorage.setItem('cookingStar_form_draft', JSON.stringify(data)); } catch {}
}

function getFormDraft() {
  try { return JSON.parse(localStorage.getItem('cookingStar_form_draft')) || {}; } catch { return {}; }
}

function clearFormDraft() {
  localStorage.removeItem('cookingStar_form_draft');
}


/* ═══════════════════════════════════════════
   9. DYNAMIC NAVBAR
═══════════════════════════════════════════ */
function buildNavbar() {
  const nav = document.querySelector('.nav-links');
  if (!nav) return;

  const page = window.location.pathname;
  const session = getSession();

  // Index page always shows guest links regardless of session
  if (page === '/' || page === '/index/' || page === '/login/' || page === '/signup/') {
    nav.innerHTML = `
      <a href="/">Home</a>
      <a href="/login/">Login</a>
      <a href="/signup/">Sign Up</a>
    `;
    return;
  }

  if (!session) {
    nav.innerHTML = `
      <a href="/">Home</a>
      <a href="/login/">Login</a>
      <a href="/signup/">Sign Up</a>
    `;
  } else if (session.isAdmin) {
    nav.innerHTML = `
      <a href="/admin-dashboard/">Home</a>
      <a href="/add-recipe/">Add Recipe</a>
      <a href="/manage-recipes/">Manage</a>
      <a href="/profile/">Profile</a>
      <a href="#" class="logout" id="nav-logout">Logout</a>
    `;
  } else {
    nav.innerHTML = `
      <a href="/user-dashboard/">Home</a>
      <a href="/search/">Search</a>
      <a href="/favorites/">Favorites</a>
      <a href="/profile/">Profile</a>
      <a href="#" class="logout" id="nav-logout">Logout</a>
    `;
  }
}

document.addEventListener('DOMContentLoaded', buildNavbar);

document.addEventListener('click', async function (e) {
  const btn = e.target.closest('#nav-logout');
  if (!btn) return;

  e.preventDefault();
  btn.style.pointerEvents = 'none';
  btn.textContent = 'Logging out…';

  await logoutUser();

  showToast('Logged out successfully 👋');
  setTimeout(() => { window.location.href = '/login/'; }, 800);
});


/* ═══════════════════════════════════════════
   10. TOAST
═══════════════════════════════════════════ */
function showToast(message, duration = 2800) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}


/* ═══════════════════════════════════════════
   11. HELPERS
═══════════════════════════════════════════ */
function getCourseBadgeClass(course) {
  if (!course) return 'badge-main';
  const c = course.toLowerCase();
  if (c.includes('appetizer')) return 'badge-appetizer';
  if (c.includes('dessert'))   return 'badge-dessert';
  return 'badge-main';
}

function difficultyStars(level) {
  const labels  = ['', 'Easy', 'Medium', 'Advanced', 'Hard', 'Expert'];
  const colours = ['', '#5abf4e', '#f5a623', '#e84c3d', '#c5357f', '#7a3050'];
  return `<span style="color:${colours[level] || '#f5a623'};font-weight:800;font-size:0.78rem;">${labels[level] || 'Medium'}</span>`;
}


/* ═══════════════════════════════════════════
   12. USER DASHBOARD
   Now fetches recipes from the API instead of localStorage.
═══════════════════════════════════════════ */
let dashFilter = 'all';
let dashSearch = '';
let _dashRecipes = null;   // cached for the current page load

async function dashRenderRecipes() {
  const grid = document.getElementById('recipes-grid');
  if (!grid) return;

  // Load recipes from API on first render
  if (_dashRecipes === null) {
    _dashRecipes = await fetchRecipes();
  }

  const noResultsEl = document.getElementById('no-results');
  const search = dashSearch.toLowerCase().trim();

  // Restore form draft
  const draft = getFormDraft();
  if (draft.dashFilter && dashFilter === 'all') dashFilter = draft.dashFilter;
  if (draft.dashSearch && !dashSearch) {
    dashSearch = draft.dashSearch;
    const inp = document.getElementById('dashboard-search');
    if (inp) inp.value = dashSearch;
  }

  const filtered = _dashRecipes.filter(r => {
    const matchFilter = dashFilter === 'all' || r.course === dashFilter;
    const matchSearch = !search ||
      r.name.toLowerCase().includes(search) ||
      r.course.toLowerCase().includes(search) ||
      (Array.isArray(r.ingredients) && r.ingredients.some(i => i.name && i.name.toLowerCase().includes(search)));
    return matchFilter && matchSearch;
  });

  // Load fav IDs for heart rendering
  const favIds = await _loadFavIds();

  const statShown = document.getElementById('stat-shown');
  const statTotal = document.getElementById('stat-total');
  const statFavs  = document.getElementById('stat-favs');
  if (statShown) statShown.textContent = filtered.length;
  if (statTotal) statTotal.textContent = _dashRecipes.length;
  if (statFavs)  statFavs.textContent  = favIds.length;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (noResultsEl) noResultsEl.style.display = 'block';
    return;
  }
  if (noResultsEl) noResultsEl.style.display = 'none';

  grid.innerHTML = filtered.map((r, i) => {
    const fav = favIds.includes(Number(r.id));
    const badgeClass = getCourseBadgeClass(r.course);
    const imgSrc = r.image || '/static/images/NewLogo.png';
    return `
      <div class="recipe-tile" style="animation-delay:${i * 0.07}s">
        <img src="${imgSrc}" alt="${r.name}" onerror="this.src='/static/images/NewLogo.png'">
        <div class="recipe-tile-body">
          <h4>${r.name}</h4>
          <div class="recipe-tile-meta">
            <span class="course-badge ${badgeClass}">${r.course}</span>
            <span>${r.time} min</span>
            <span>${difficultyStars(r.difficulty)}</span>
          </div>
          <div class="tile-actions">
            <a href="/recipe-detail/#${r.id}" class="btn-view" onclick="trackView('${r.id}')">👁 View</a>
            <a href="#" class="btn-fav ${fav ? 'favorited' : ''}" id="fav-${r.id}"
               onclick="dashToggleFav(event,'${r.id}')">
              ${fav ? '❤️ Saved' : '🤍 Save'}
            </a>
          </div>
        </div>
      </div>`;
  }).join('');
}

function dashFilterRecipes(filter, btn) {
  dashFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  saveFormDraft({ ...getFormDraft(), dashFilter: filter });
  dashRenderRecipes();
}

function dashApplySearch() {
  const input = document.getElementById('dashboard-search');
  if (input) {
    dashSearch = input.value;
    saveFormDraft({ ...getFormDraft(), dashSearch: dashSearch });
  }
  dashRenderRecipes();
}

async function dashToggleFav(e, id) {
  e.preventDefault();
  const btn = document.getElementById('fav-' + id);
  const numId = Number(id);
  const currently = _favIds !== null && _favIds.includes(numId);

  if (currently) {
    const ok = await removeFavorite(id);
    if (ok) {
      btn.innerHTML = '🤍 Save';
      btn.classList.remove('favorited');
      showToast('Removed from favorites');
    }
  } else {
    const ok = await addFavorite(id);
    if (ok) {
      btn.innerHTML = '❤️ Saved';
      btn.classList.add('favorited');
      showToast('Added to favorites ❤️');
    }
  }

  const statFavs = document.getElementById('stat-favs');
  if (statFavs && _favIds) statFavs.textContent = _favIds.length;
}

async function initDashboard() {
  const searchInput = document.getElementById('dashboard-search');
  if (!searchInput) return;
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') dashApplySearch();
  });
  const draft = getFormDraft();
  if (draft.dashSearch) {
    searchInput.value = draft.dashSearch;
    dashSearch = draft.dashSearch;
  }
  if (draft.dashFilter) {
    dashFilter = draft.dashFilter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(draft.dashFilter) ||
        (draft.dashFilter === 'all' && btn.textContent.includes('All')));
    });
  }
  await dashRenderRecipes();
}


/* ═══════════════════════════════════════════
   13. SEARCH PAGE
   Now queries the backend API instead of localStorage.
═══════════════════════════════════════════ */
let searchCurrentResults = [];

function searchRenderRecentTags() {
  const r = searchGetRecent();
  const wrap = document.getElementById('recent-searches-wrap');
  const tags = document.getElementById('recent-tags');
  if (!wrap || !tags) return;
  if (r.length === 0) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  tags.innerHTML = r.map(t =>
    `<span class="recent-tag" onclick="searchUseRecent('${t}')">${t}</span>`
  ).join('');
}

function searchUseRecent(term) {
  const input = document.getElementById('search-input');
  if (input) input.value = term;
  runSearch();
}

async function runSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  const raw   = input.value.trim();
  const stypeEl = document.querySelector('input[name="stype"]:checked');
  const stype = stypeEl ? stypeEl.value : 'dish';

  const defaultState     = document.getElementById('default-state');
  const resultsHeader    = document.getElementById('results-header');
  const resultsContainer = document.getElementById('results-container');
  const noResults        = document.getElementById('no-results');

  if (defaultState) defaultState.style.display = 'none';

  if (!raw) {
    if (resultsHeader)    resultsHeader.style.display    = 'none';
    if (resultsContainer) resultsContainer.innerHTML     = '';
    if (noResults)        noResults.style.display        = 'none';
    if (defaultState)     defaultState.style.display     = 'block';
    return;
  }

  searchSaveRecent(raw);
  searchRenderRecentTags();
  saveFormDraft({ ...getFormDraft(), lastSearch: raw, lastStype: stype });

  // Map frontend stype to backend query params
  const courseFilter = stype === 'course' ? raw : '';
  const textQuery    = stype !== 'course' ? raw : '';

  const results = await searchRecipesAPI(textQuery, courseFilter);

  // Client-side stype refinement for ingredient searches
  searchCurrentResults = results.filter(r => {
    if (stype === 'ingredient') {
      return Array.isArray(r.ingredients) &&
        r.ingredients.some(i => i.name && i.name.toLowerCase().includes(raw.toLowerCase()));
    }
    return true;
  }).map(r => ({ ...r, matchType: stype }));

  sortAndRender();
}

async function sortAndRender() {
  const sortEl = document.getElementById('sort-select');
  const sort   = sortEl ? sortEl.value : 'default';
  let sorted   = [...searchCurrentResults];

  if (sort === 'name')       sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'time')  sorted.sort((a, b) => a.time - b.time);
  else if (sort === 'difficulty') sorted.sort((a, b) => a.difficulty - b.difficulty);

  const container   = document.getElementById('results-container');
  const noResults   = document.getElementById('no-results');
  const header      = document.getElementById('results-header');
  const resultCount = document.getElementById('result-count');

  if (resultCount) resultCount.textContent = sorted.length;
  if (header)      header.style.display    = 'flex';

  if (sorted.length === 0) {
    if (container) container.innerHTML = '';
    if (noResults) noResults.style.display = 'block';
    return;
  }
  if (noResults) noResults.style.display = 'none';

  const favIds = await _loadFavIds();

  container.innerHTML = sorted.map((r, i) => {
    const fav = favIds.includes(Number(r.id));
    const badgeClass = getCourseBadgeClass(r.course);
    const imgSrc = r.image || '/static/images/NewLogo.png';
    const matchLabel = r.matchType === 'ingredient' ? '🧂 Ingredient Match'
                     : r.matchType === 'course'     ? '📋 Course Match'
                     :                                '🍽️ Name Match';
    return `
      <div class="result-card" style="animation-delay:${i * 0.07}s">
        <img src="${imgSrc}" alt="${r.name}" onerror="this.src='/static/images/NewLogo.png'">
        <div class="result-card-body">
          <div class="result-card-title">${r.name}</div>
          <div class="result-card-meta">
            <span class="course-badge ${badgeClass}">${r.course}</span>
            <span>${r.time} min</span>
            <span>${difficultyStars(r.difficulty)}</span>
            <span class="match-badge">${matchLabel}</span>
          </div>
          <div class="result-card-desc">${r.description}</div>
          <div class="result-card-actions">
            <a href="/recipe-detail/#${r.id}" class="btn-view" onclick="trackView('${r.id}')">👁 View Recipe</a>
            <a href="#" class="btn-fav ${fav ? 'favorited' : ''}" id="fav-${r.id}"
               onclick="searchToggleFav(event,'${r.id}')">
              ${fav ? '❤️ Saved' : '🤍 Save'}
            </a>
          </div>
        </div>
      </div>`;
  }).join('');
}

function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  searchCurrentResults = [];
  const container     = document.getElementById('results-container');
  const resultsHeader = document.getElementById('results-header');
  const noResults     = document.getElementById('no-results');
  const defaultState  = document.getElementById('default-state');
  if (container)     container.innerHTML         = '';
  if (resultsHeader) resultsHeader.style.display = 'none';
  if (noResults)     noResults.style.display     = 'none';
  if (defaultState)  defaultState.style.display  = 'block';
  saveFormDraft({ ...getFormDraft(), lastSearch: '', lastStype: 'dish' });
}

async function searchToggleFav(e, id) {
  e.preventDefault();
  const btn = document.getElementById('fav-' + id);
  const currently = _favIds !== null && _favIds.includes(Number(id));
  if (currently) {
    await removeFavorite(id);
    btn.innerHTML = '🤍 Save';
    btn.classList.remove('favorited');
    showToast('Removed from favorites');
  } else {
    await addFavorite(id);
    btn.innerHTML = '❤️ Saved';
    btn.classList.add('favorited');
    showToast('Added to favorites ❤️');
  }
}

async function initSearchPage() {
  const input = document.getElementById('search-input');
  if (!input) return;

  const draft = getFormDraft();
  if (draft.lastSearch) {
    input.value = draft.lastSearch;
    if (draft.lastStype) {
      const radio = document.querySelector(`input[name="stype"][value="${draft.lastStype}"]`);
      if (radio) radio.checked = true;
    }
    await runSearch();
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') runSearch();
  });
  input.addEventListener('input', () => {
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(runSearch, 350);
  });

  const urlQ = new URLSearchParams(window.location.search).get('search');
  if (urlQ) { input.value = urlQ; await runSearch(); }

  searchRenderRecentTags();
}

/* ═══════════════════════════════════════════
   14. PROFILE API HELPERS
═══════════════════════════════════════════ */

/**
 * Fetch the logged-in user's profile from the server.
 * Returns { username, firstName, lastName, email, gender, role, isAdmin } or null.
 */
async function fetchProfile() {
  try {
    const res = await apiFetch('/api/profile/');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * PATCH the logged-in user's profile.
 * @param {object} data  { firstName?, lastName?, username?, email?, gender? }
 * Returns { ok: bool, message?: string, error?: string, data?: object }
 */
async function updateProfile(data) {
  try {
    const res = await apiFetch('/api/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || 'Update failed' };
    return { ok: true, message: json.message, data: json };
  } catch (err) {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}

/**
 * POST to change the logged-in user's password.
 * @param {object} data  { currentPassword, newPassword, confirmPassword }
 * Returns { ok: bool, message?: string, error?: string }
 */
async function changePassword(data) {
  try {
    const res = await apiFetch('/api/change-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error || 'Password change failed' };
    return { ok: true, message: json.message };
  } catch (err) {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}