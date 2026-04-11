/* =============================================
   نجمة الطبخ — Cooking Star | Favorites JS
   Phase 2 — Favorites Page Logic
   ============================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadFavoritesTable();
  setupAddFavoriteForm();
  setupSearch();
});

// ─── Render Favorites Table ───
function loadFavoritesTable() {
  const tbody = document.getElementById("fav-tbody");
  const emptyState = document.getElementById("fav-empty");
  const favIds = getFavorites();

  tbody.innerHTML = "";

  if (favIds.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  favIds.forEach(id => {
    const recipe = getRecipeById(id);
    if (!recipe) return;

    const badgeClass = getCourseBadgeClass(recipe.course);
    const tr = document.createElement("tr");
    tr.dataset.recipeId = recipe.id;
    tr.innerHTML = `
      <td>
        <img src="${recipe.image}" alt="${recipe.name}" onerror="this.src='lll.jpeg'">
      </td>
      <td style="font-weight:700; font-size:1rem;">${recipe.name}</td>
      <td><span class="course-badge ${badgeClass}">${recipe.course}</span></td>
      <td style="color:var(--text-mid); font-size:0.88rem; max-width:220px;">${recipe.description.substring(0, 90)}…</td>
      <td>
        <div class="action-btns">
          <a href="recipe-detail.html#${recipe.id}" class="btn btn-primary" style="font-size:0.82rem; padding:8px 16px;">
             View
          </a>
          <button class="btn btn-danger remove-fav-btn" data-id="${recipe.id}" style="font-size:0.82rem; padding:8px 16px;">
             Remove
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach remove listeners
  document.querySelectorAll(".remove-fav-btn").forEach(btn => {
    btn.addEventListener("click", handleRemoveFavorite);
  });
}

// ─── Handle Remove ───
function handleRemoveFavorite(e) {
  const id = e.currentTarget.dataset.id;
  const row = document.querySelector(`tr[data-recipe-id="${id}"]`);

  if (!confirm(`Remove "${getRecipeById(id)?.name}" from your favorites?`)) return;

  if (row) {
    row.classList.add("fade-out");
    setTimeout(() => {
      removeFavorite(id);
      loadFavoritesTable();
      showToast(" Removed from favorites!");
    }, 400);
  }
}

// ─── Add Favorite Form ───
function setupAddFavoriteForm() {
  const form = document.getElementById("add-fav-form");
  const select = document.getElementById("recipePick");
  const errorMsg = document.getElementById("add-fav-error");

  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    errorMsg.textContent = "";

    const selectedId = select.value;
    if (!selectedId) {
      errorMsg.textContent = "Please select a recipe first!";
      return;
    }

    if (isFavorite(selectedId)) {
      errorMsg.textContent = "This recipe is already in your favorites!";
      return;
    }

    addFavorite(selectedId);
    loadFavoritesTable();
    showToast(" Added to favorites!");
    select.value = "";
  });
}

// ─── Search Filter ───
function setupSearch() {
  const searchInput = document.getElementById("fav-search");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    const rows = document.querySelectorAll("#fav-tbody tr");

    rows.forEach(row => {
      const name = row.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
      const course = row.querySelector("td:nth-child(3)")?.textContent.toLowerCase() || "";
      row.style.display = (name.includes(query) || course.includes(query)) ? "" : "none";
    });
  });
}
    // ─── Glitter Stars Generator ───
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