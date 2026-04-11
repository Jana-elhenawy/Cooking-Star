/* =============================================
   نجمة الطبخ — Cooking Star | Recipe Detail JS
   Phase 2 — Recipe Detail Page Logic
   ============================================= */

document.addEventListener("DOMContentLoaded", () => {
  renderAllRecipes();
  buildJumpNav();
  highlightCurrentHash();
  updateAllFavButtons();
});

// ─── Render All Recipe Cards ───
function renderAllRecipes() {
  const container = document.getElementById("recipes-container");
  if (!container) return;

  container.innerHTML = "";

  RECIPES_DATA.forEach((recipe, index) => {
    const isFav = isFavorite(recipe.id);
    const badgeClass = getCourseBadgeClass(recipe.course);

    const card = document.createElement("div");
    card.className = "recipe-card";
    card.id = recipe.id;
    card.style.animationDelay = `${index * 0.07}s`;

    const ingredientChips = recipe.ingredients.map(ing =>
      `<span class="ingredient-chip">🥄 <strong>${ing.name}</strong> — ${ing.qty}</span>`
    ).join("");

    card.innerHTML = `
      <div class="recipe-card-header">
        <img src="${recipe.image}" alt="${recipe.name}" class="recipe-card-img"
             onerror="this.src='../images/logo.jpg'">
        <div class="recipe-card-meta">
          <div class="recipe-id">${recipe.code}</div>
          <h3>${recipe.name}</h3>
          <div class="recipe-meta-row">
            <span class="course-badge ${badgeClass}">${recipe.course}</span>
            <span class="recipe-meta-tag">⏱ ${recipe.time} min</span>
            <span class="recipe-meta-tag">Difficulty: ${difficultyStars(recipe.difficulty)}</span>
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
        <p>${recipe.description}</p>
      </div>

      <div class="recipe-actions">
        <button class="btn btn-primary fav-btn" data-id="${recipe.id}">
          ${isFav ? "In Favorites" : "Add to Favorites"}
        </button>
        <a href="recipes-list.html" class="btn btn-secondary">
          ← Back to Recipes
        </a>
      </div>
    `;

    container.appendChild(card);
  });

  // Attach favorite button listeners
  document.querySelectorAll(".fav-btn").forEach(btn => {
    btn.addEventListener("click", handleFavToggle);
  });
}

// ─── Build Jump Navigation ───
function buildJumpNav() {
  const nav = document.getElementById("jump-nav");
  if (!nav) return;

  nav.innerHTML = "";
  RECIPES_DATA.forEach(recipe => {
    const a = document.createElement("a");
    a.href = `#${recipe.id}`;
    a.textContent = recipe.name;
    nav.appendChild(a);
  });
}

// ─── Handle Favorite Toggle ───
function handleFavToggle(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;

  if (isFavorite(id)) {
    removeFavorite(id);
    btn.textContent = "Add to Favorites";
    btn.classList.remove("btn-green");
    btn.classList.add("btn-primary");
    showToast(" Removed from favorites!");
  } else {
    addFavorite(id);
    btn.textContent = " In Favorites";
    btn.classList.remove("btn-primary");
    btn.classList.add("btn-green");
    showToast("Added to favorites!");
  }
}

// ─── Highlight current hash on load ───
function highlightCurrentHash() {
  if (!window.location.hash) return;
  const id = window.location.hash.replace("#", "");
  const el = document.getElementById(id);
  if (el) {
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.style.outline = "3px solid var(--pink-accent)";
      el.style.outlineOffset = "4px";
      el.style.borderRadius = "20px";
      setTimeout(() => { el.style.outline = ""; }, 1800);
    }, 300);
  }
}

// ─── Sync fav button states from localStorage ───
function updateAllFavButtons() {
  document.querySelectorAll(".fav-btn").forEach(btn => {
    const id = btn.dataset.id;
    if (isFavorite(id)) {
      btn.textContent = " In Favorites";
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-green");
    }
  });
}
const STARS = ['✦','✧','★','☆','✨','💫','⭐','🌟','🥄','🍕','🍭','🍩', '🍪','🍇','🍓','🍒','🍫','🍴','🍧','🌶️'];
    const container = document.getElementById('glitter-container');
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
    for(let i=0;i<12;i++) setTimeout(spawnStar, i*200);