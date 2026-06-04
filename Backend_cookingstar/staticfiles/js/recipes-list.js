/* ===================================================================
   recipes-list.js  (fixed)
   - Loads recipes from /api/recipes/ and renders them with the
     proper CSS card structure (image, badge, body, actions).
   - Favorites are persisted to the backend API when the user is
     logged-in (token in localStorage); falls back to localStorage
     for unauthenticated visitors.
   =================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupFilters();
  loadRecipes();
  spawnGlitterStars();
});

/* ── Toast ─────────────────────────────────────────────────────────── */
function showToast(message, duration = 2800) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

/* ── Auth helper ────────────────────────────────────────────────────── */
function _rl_getToken() {
  try { return localStorage.getItem("cookingStar_token") || null; }
  catch (e) { return null; }
}

function _rl_authHeaders() {
  const token = _rl_getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ── Favorites — backend-first, localStorage fallback ──────────────── */
let _rl_favoritedIds = new Set();

async function _rl_loadFavoriteIds() {
  const token = _rl_getToken();
  if (token) {
    try {
      const res = await fetch("/api/favorites/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        _rl_favoritedIds = new Set(data.map((r) => String(r.id)));
        return;
      }
    } catch (e) { /* fall through */ }
  }
  try {
    const local = JSON.parse(localStorage.getItem("cookingStar_favorites") || "[]");
    _rl_favoritedIds = new Set(local.map(String));
  } catch (e) { _rl_favoritedIds = new Set(); }
}

function _rl_isFavorite(id) { return _rl_favoritedIds.has(String(id)); }

async function _rl_addFavorite(id) {
  const token = _rl_getToken();
  if (token) {
    try {
      await fetch("/api/favorites/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe_id: id }),
      });
    } catch (e) {}
  } else {
    try {
      const local = JSON.parse(localStorage.getItem("cookingStar_favorites") || "[]");
      if (!local.includes(String(id))) {
        local.push(String(id));
        localStorage.setItem("cookingStar_favorites", JSON.stringify(local));
      }
    } catch (e) {}
  }
  _rl_favoritedIds.add(String(id));
}

async function _rl_removeFavorite(id) {
  const token = _rl_getToken();
  if (token) {
    try {
      await fetch(`/api/favorites/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {}
  } else {
    try {
      let local = JSON.parse(localStorage.getItem("cookingStar_favorites") || "[]");
      local = local.filter((fid) => String(fid) !== String(id));
      localStorage.setItem("cookingStar_favorites", JSON.stringify(local));
    } catch (e) {}
  }
  _rl_favoritedIds.delete(String(id));
}

/* ── Fav button rendering ───────────────────────────────────────────── */
function markFav(btn) {
  btn.textContent = "❤️ Unfavourite";
  btn.classList.remove("btn-secondary");
  btn.classList.add("btn-danger");
}

function unmarkFav(btn) {
  btn.textContent = "🤍 Add to Fav";
  btn.classList.remove("btn-danger");
  btn.classList.add("btn-secondary");
}

function syncFavButtons() {
  document.querySelectorAll(".fav-btn").forEach((btn) => {
    _rl_isFavorite(btn.dataset.id) ? markFav(btn) : unmarkFav(btn);
  });
}

async function handleFavClick(event) {
  const btn = event.currentTarget;
  const id = btn.dataset.id;
  if (!id) return;
  btn.disabled = true;
  if (_rl_isFavorite(id)) {
    await _rl_removeFavorite(id);
    unmarkFav(btn);
    showToast("Removed from favourites!");
  } else {
    await _rl_addFavorite(id);
    markFav(btn);
    showToast("Added to favourites! ❤️");
  }
  btn.disabled = false;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function difficultyLabel(level) {
  return { 1: "🟢 Easy", 2: "🟡 Medium", 3: "🔴 Hard" }[level] || "";
}

function courseEmoji(course) {
  const map = {
    "main course": "🍗", appetizer: "🥗", dessert: "🍰",
    soup: "🍲", salad: "🥙", breakfast: "🍳", snack: "🍿",
  };
  return map[(course || "").toLowerCase()] || "🍽️";
}

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23ffe0ee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48'%3E%F0%9F%8D%BD%EF%B8%8F%3C/text%3E%3C/svg%3E";

/* ── Card builder ───────────────────────────────────────────────────── */
function buildCard(recipe) {
  const imgSrc = recipe.image_url || PLACEHOLDER_IMG;
  const course = recipe.course || "";
  const emoji = courseEmoji(course);
  const diff = difficultyLabel(recipe.difficulty);
  const time = recipe.time_minutes ? `⏱ ${recipe.time_minutes} min` : "";
  const desc = recipe.description
    ? recipe.description.slice(0, 90) + (recipe.description.length > 90 ? "…" : "")
    : "";

  const card = document.createElement("div");
  card.className = "recipe-card-tile";
  card.dataset.name = (recipe.title || "").toLowerCase();
  card.dataset.course = course;

  card.innerHTML = `
    <div class="recipe-card-img-wrap">
      <img
        src="${imgSrc}"
        alt="${recipe.title}"
        onerror="this.src='${PLACEHOLDER_IMG}'"
        loading="lazy"
      >
      ${course ? `<span class="course-badge badge">${emoji} ${course}</span>` : ""}
    </div>
    <div class="recipe-card-body">
      <div class="recipe-card-title">${recipe.title}</div>
      ${desc ? `<p class="recipe-card-desc">${desc}</p>` : ""}
      <div class="recipe-card-meta">
        ${diff ? `<span class="meta-chip">${diff}</span>` : ""}
        ${time ? `<span class="meta-chip">${time}</span>` : ""}
      </div>
      <div class="recipe-card-actions">
        <a href="/recipe-detail/?id=${recipe.id}" class="btn btn-primary btn-sm">👁 View Recipe</a>
        <button class="fav-btn btn btn-sm btn-secondary" data-id="${recipe.id}">🤍 Add to Fav</button>
      </div>
    </div>
  `;

  card.querySelector(".fav-btn").addEventListener("click", handleFavClick);
  return card;
}

/* ── Search & filter ────────────────────────────────────────────────── */
function setupSearch() {
  const input = document.getElementById("recipe-search");
  if (!input) return;
  input.addEventListener("input", applyFilters);
}

function setupFilters() {
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      applyFilters();
    });
  });
}

function applyFilters() {
  const query = document.getElementById("recipe-search")?.value.toLowerCase().trim() || "";
  const course = document.querySelector(".filter-chip.active")?.dataset.filter || "all";
  const cards = document.querySelectorAll(".recipe-card-tile");
  let visible = 0;

  cards.forEach((card) => {
    const nameMatch = (card.dataset.name || "").includes(query);
    const courseMatch =
      course === "all" ||
      (card.dataset.course || "").toLowerCase() === course.toLowerCase();

    if (nameMatch && courseMatch) {
      card.classList.remove("hidden");
      visible++;
    } else {
      card.classList.add("hidden");
    }
  });

  const noResults = document.getElementById("no-results");
  if (noResults) noResults.style.display = visible === 0 ? "block" : "none";
}

/* ── Main loader ────────────────────────────────────────────────────── */
async function loadRecipes() {
  const grid = document.getElementById("recipes-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:40px;color:#bbb;">
      🍳 Loading recipes…
    </div>`;

  try {
    const [, res] = await Promise.all([
      _rl_loadFavoriteIds(),
      fetch("/api/recipes/", { headers: _rl_authHeaders() }),
    ]);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const recipes = Array.isArray(data)
      ? data
      : Array.isArray(data.results)
        ? data.results
        : [];

    grid.innerHTML = "";

    if (recipes.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;">
          No recipes found in the database yet. 🫙
        </div>`;
      return;
    }

    recipes.forEach((recipe) => grid.appendChild(buildCard(recipe)));
    syncFavButtons();
    applyFilters();

  } catch (err) {
    console.error("Error loading recipes:", err);
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:#e84c3d;">
        ⚠️ Could not load recipes. Please try refreshing the page.
      </div>`;
  }
}

/* ── Glitter ─────────────────────────────────────────────────────────── */
function spawnGlitterStars() {
  const STARS = [
    "✦","✧","★","☆","✨","💫","⭐","🌟",
    "🥄","🍕","🍭","🍩","🍪","🍇","🍓","🍒","🍫","🍴","🍧","🌶️",
  ];
  const container = document.getElementById("glitter-container");
  if (!container) return;

  function spawnOne() {
    const el = document.createElement("div");
    el.className = "glitter-star";
    el.textContent = STARS[Math.floor(Math.random() * STARS.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = 0.6 + Math.random() * 1.4 + "rem";
    el.style.animationDuration = 5 + Math.random() * 8 + "s";
    el.style.animationDelay = Math.random() * 3 + "s";
    const colors = ["#ff5c8a","#ffd700","#ff007f","#ffb347","#ff99bb","#fff176"];
    el.style.color = colors[Math.floor(Math.random() * colors.length)];
    container.appendChild(el);
    setTimeout(() => el.remove(), 14000);
  }

  setInterval(spawnOne, 600);
  for (let i = 0; i < 12; i++) setTimeout(spawnOne, i * 200);
}