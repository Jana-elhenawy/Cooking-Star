/* =============================================
   Cooking Star | Recipe Detail JS
   Phase 2 — Recipe Detail Page Logic (API Integrated)
   ============================================= */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Force setup storage functions to avoid conflicts with shared.js
  setupFavoritesFunctions();

  // 2. Execute remaining rendering and UI functions
  await fetchAndRenderRecipes();
  highlightCurrentHash();
  updateAllFavButtons();
  spawnGlitterStars();
});

// --- Setup Local Storage & Toast Functions ---
function setupFavoritesFunctions() {

  // Toast function (feedback message)
  window.showToast = function(message, duration = 2800) {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
  };

  // Favorites functions (Forced to override any existing ones)
  window.isFavorite = function(id) {
    try {
      const favs = JSON.parse(localStorage.getItem("cookingStar_favorites") || "[]");
      // Convert all items to String before checking to avoid type mismatch (e.g. 3 vs "3")
      return favs.map(String).includes(String(id));
    } catch(e) { return false; }
  };

  window.addFavorite = function(id) {
    let favs = JSON.parse(localStorage.getItem("cookingStar_favorites") || "[]");
    favs = favs.map(String); // Unify array type
    if (!favs.includes(String(id))) {
      favs.push(String(id));
      localStorage.setItem("cookingStar_favorites", JSON.stringify(favs));
      return true;
    }
    return false;
  };

  window.removeFavorite = function(id) {
    let favs = JSON.parse(localStorage.getItem("cookingStar_favorites") || "[]");
    // Filter based on String type to delete the correct item
    favs = favs.filter(fid => String(fid) !== String(id));
    localStorage.setItem("cookingStar_favorites", JSON.stringify(favs));
  };
}

// --- Helper: Get CSRF Token from cookies (required for Django POST/DELETE requests) ---
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    document.cookie.split(';').forEach(cookie => {
      const c = cookie.trim();
      if (c.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(c.slice(name.length + 1));
      }
    });
  }
  return cookieValue;
}

// --- Fetch from Django API & Render ---
async function fetchAndRenderRecipes() {
  const container = document.getElementById("recipes-container");
  const nav = document.getElementById("jump-nav");

  if (!container) return;

  container.innerHTML = "<p style='text-align:center;'>Loading recipes from database...</p>";

  try {
    const response = await apiFetch('/api/recipes/');
    if (!response.ok) throw new Error("Network response was not ok");

    const recipesData = await response.json();

    container.innerHTML = "";
    if (nav) nav.innerHTML = "";

    if (recipesData.length === 0) {
      container.innerHTML = "<p style='text-align:center;'>No recipes found.</p>";
      return;
    }

    recipesData.forEach((recipe, index) => {
      const id = recipe.id;
      const title = recipe.title || recipe.name || "Unnamed Recipe";
      const course = recipe.course || "Main Course";
      const image = recipe.image || "/static/images/default.jpg";
      const time = recipe.time || "30";
      const difficulty = recipe.difficulty || 3;
      const description = recipe.description || recipe.instructions || "No instructions provided.";

      let ingredientChips = "";

      // Use ingredients_list (API field name) with fallback to ingredients
      let rawIngredients = recipe.ingredients_list || recipe.ingredients || [];

      // If it arrived as a JSON string e.g. '["flour","sugar"]', parse it
      if (typeof rawIngredients === 'string') {
        try { rawIngredients = JSON.parse(rawIngredients); } catch { rawIngredients = [rawIngredients]; }
      }

      if (Array.isArray(rawIngredients) && rawIngredients.length > 0) {
        ingredientChips = rawIngredients.map(ing =>
        `<span class="ingredient-chip">🥄 <strong>${ing.name || ing}</strong>${ing.qty ? ' — ' + ing.qty : ''}</span>`
        ).join("");
      } else {
        ingredientChips = `<span class="ingredient-chip">🥄 Ingredients not listed yet.</span>`;
      }

      // Build Jump Navigation
      if (nav) {
        const a = document.createElement("a");
        a.href = `#${id}`;
        a.textContent = title;
        nav.appendChild(a);
      }

      // Check Favorite Status directly using the newly defined function
      const isFav = window.isFavorite(id);

      let badgeClass = "badge-main";
      if (course.toLowerCase() === "appetizer") badgeClass = "badge-appetizer";
      if (course.toLowerCase() === "dessert") badgeClass = "badge-dessert";

      const starsStr = typeof window.difficultyStars === 'function' ? window.difficultyStars(difficulty) : '⭐'.repeat(difficulty);

      const card = document.createElement("div");
      card.className = "recipe-card";
      card.id = id;
      card.style.animationDelay = `${index * 0.07}s`;

      // Set initial button class based on favorite state
      const btnClass = isFav ? "btn-green" : "btn-primary";
      const btnText = isFav ? "⭐ In Favorites" : "Add to Favorites";

      card.innerHTML = `
        <div class="recipe-card-header">
          <img src="${image}" alt="${title}" class="recipe-card-img" onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src='/static/images/NewLogo.png';}">
          <div class="recipe-card-meta">
            <div class="recipe-id">#${id}</div>
            <h3>${title}</h3>
            <div class="recipe-meta-row">
              <span class="course-badge ${badgeClass}">${course}</span>
              <span class="recipe-meta-tag">⏱ ${time} min</span>
              <span class="recipe-meta-tag">Difficulty: ${starsStr}</span>
            </div>
          </div>
        </div>

        <div class="recipe-ingredients">
          <h4>🧂 Ingredients</h4>
          <div class="ingredients-grid">
            ${ingredientChips}
          </div>
        </div>

        <div class="recipe-description">
          <h4>📋 Instructions</h4>
          <p>${description}</p>
        </div>

        <div class="recipe-actions">
          <button class="btn ${btnClass} fav-btn" data-id="${id}">
            ${btnText}
          </button>
          <a href="/user-dashboard/" class="btn btn-secondary">
            ← Back to Recipes
          </a>
        </div>
      `;

      container.appendChild(card);
    });

    // Bind click events to Favorite buttons after cards are rendered
    document.querySelectorAll(".fav-btn").forEach(btn => {
      btn.addEventListener("click", handleFavToggle);
    });

  } catch (error) {
    console.error("Error fetching recipes:", error);
    container.innerHTML = "<p style='text-align:center; color:red;'>Error loading recipes from the database.</p>";
  }
}

// --- Handle Favorite Toggle (saves to both API and localStorage) ---
async function handleFavToggle(e) {
  e.preventDefault();
  const btn = e.currentTarget;
  const id = btn.dataset.id;

  // Disable button while request is in flight
  btn.disabled = true;

  if (window.isFavorite(id)) {
    // --- Remove from favorites ---
    const res = await apiFetch(`/api/favorites/${id}/`, { method: 'DELETE' });

    if (!res.ok && res.status !== 204) {
      window.showToast("Something went wrong. Please try again.");
      btn.disabled = false;
      return;
    }

    window.removeFavorite(id);
    btn.textContent = "Add to Favorites";
    btn.classList.remove("btn-green");
    btn.classList.add("btn-primary");
    window.showToast("Removed from favorites!");

  } else {
    // --- Add to favorites ---
    const res = await apiFetch('/api/favorites/', {
      method: 'POST',
      body: JSON.stringify({ recipe_id: id }),
    });

    if (!res.ok) {
      window.showToast("Something went wrong. Please try again.");
      btn.disabled = false;
      return;
    }

    window.addFavorite(id);
    btn.textContent = "⭐ In Favorites";
    btn.classList.remove("btn-primary");
    btn.classList.add("btn-green");
    window.showToast("Added to favorites!");
  }

  btn.disabled = false;
}

// --- Highlight Current Hash ---
function highlightCurrentHash() {
  if (!window.location.hash) return;
  const id = window.location.hash.replace("#", "");
  const el = document.getElementById(id);

  if (el) {
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.style.outline = "3px solid var(--pink-accent, #ff007f)";
      el.style.outlineOffset = "4px";
      el.style.borderRadius = "20px";
      setTimeout(() => { el.style.outline = ""; }, 1800);
    }, 300);
  }
}

// --- Sync Favorite Buttons ---
function updateAllFavButtons() {
  document.querySelectorAll(".fav-btn").forEach(btn => {
    const id = btn.dataset.id;
    if (window.isFavorite(id)) {
      btn.textContent = "⭐ In Favorites";
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-green");
    }
  });
}

// --- Glitter Stars Animation ---
function spawnGlitterStars() {
  const STARS = ['✦','✧','★','☆','✨','💫','⭐','🌟','🥄','🍕','🍭','🍩', '🍪','🍇','🍓','🍒','🍫','🍴','🍧','🌶️'];
  const container = document.getElementById('glitter-container');
  if (!container) return;

  function spawnStar() {
    const el = document.createElement('div');
    el.className = 'glitter-star';
    el.textContent = STARS[Math.floor(Math.random() * STARS.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (0.6 + Math.random() * 1.4) + 'rem';
    el.style.animationDuration = (5 + Math.random() * 8) + 's';
    el.style.animationDelay = (Math.random() * 3) + 's';
    el.style.color = ['#ff5c8a','#ffd700','#ff007f','#ffb347','#ff99bb','#fff176'][Math.floor(Math.random()*6)];
    container.appendChild(el);
    setTimeout(() => el.remove(), 14000);
  }

  setInterval(spawnStar, 600);
  for(let i=0; i<12; i++) setTimeout(spawnStar, i*200);
}