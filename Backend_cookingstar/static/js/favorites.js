/* =============================================
   نجمة الطبخ — Cooking Star | Favorites JS
   ============================================= */

document.addEventListener("DOMContentLoaded", async () => {
  await loadFavoritesTable();
  await populateRecipeDropdown();
  setupAddFavoriteForm();
  setupSearch();
});

// ─── Render Favorites Table ───
async function loadFavoritesTable() {
  const tbody      = document.getElementById("fav-tbody");
  const emptyState = document.getElementById("fav-empty");
  if (!tbody) return;

  const favorites = await fetchFavorites();

  tbody.innerHTML = "";

  if (favorites.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    return;
  }
  if (emptyState) emptyState.style.display = "none";

  favorites.forEach(recipe => {
    const badgeClass = getCourseBadgeClass(recipe.course);
    const tr = document.createElement("tr");
    tr.dataset.recipeId = recipe.id;
    tr.innerHTML = `
      <td>
        <img src="${recipe.image || '/static/images/NewLogo.png'}" alt="${recipe.name}"
             onerror="this.src='/static/images/NewLogo.png'">
      </td>
      <td style="font-weight:700; font-size:1rem;">${recipe.name}</td>
      <td><span class="course-badge ${badgeClass}">${recipe.course}</span></td>
      <td style="color:var(--text-mid); font-size:0.88rem; max-width:220px;">${(recipe.description || '').substring(0, 90)}…</td>
      <td>
        <div class="action-btns">
          <a href="/recipe-detail/#${recipe.id}" class="btn btn-primary" style="font-size:0.82rem; padding:8px 16px;">
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

  document.querySelectorAll(".remove-fav-btn").forEach(btn => {
    btn.addEventListener("click", handleRemoveFavorite);
  });
}

// ─── Handle Remove ───
async function handleRemoveFavorite(e) {
  const id  = e.currentTarget.dataset.id;
  const row = document.querySelector(`tr[data-recipe-id="${id}"]`);
  const name = row ? row.querySelector('td:nth-child(2)')?.textContent : 'this recipe';

  if (!confirm(`Remove "${name}" from your favorites?`)) return;

  if (row) row.classList.add("fade-out");
  const ok = await removeFavorite(id);
  if (ok) {
    setTimeout(async () => {
      await loadFavoritesTable();
      showToast("Removed from favorites!");
    }, 400);
  } else {
    if (row) row.classList.remove("fade-out");
    showToast("Could not remove. Please try again.");
  }
}

// ─── Populate the "Add from dropdown" selector ───
async function populateRecipeDropdown() {
  const select = document.getElementById("recipePick");
  if (!select) return;

  const recipes = await fetchRecipes();
  select.innerHTML = '<option value="">— Pick a recipe —</option>';
  recipes.forEach(r => {
    const opt = document.createElement('option');
    opt.value       = r.id;
    opt.textContent = r.name;
    select.appendChild(opt);
  });
}

// ─── Add Favorite Form ───
function setupAddFavoriteForm() {
  const form     = document.getElementById("add-fav-form");
  const select   = document.getElementById("recipePick");
  const errorMsg = document.getElementById("add-fav-error");

  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (errorMsg) errorMsg.textContent = "";

    const selectedId = select ? select.value : '';
    if (!selectedId) {
      if (errorMsg) errorMsg.textContent = "Please select a recipe first!";
      return;
    }

    const alreadyFav = await isFavorite(selectedId);
    if (alreadyFav) {
      if (errorMsg) errorMsg.textContent = "This recipe is already in your favorites!";
      return;
    }

    const ok = await addFavorite(selectedId);
    if (ok) {
      await loadFavoritesTable();
      showToast("Added to favorites!");
      if (select) select.value = "";
    } else {
      if (errorMsg) errorMsg.textContent = "Could not add. Please try again.";
    }
  });
}

// ─── Search Filter ───
function setupSearch() {
  const searchInput = document.getElementById("fav-search");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    document.querySelectorAll("#fav-tbody tr").forEach(row => {
      const name   = row.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
      const course = row.querySelector("td:nth-child(3)")?.textContent.toLowerCase() || "";
      row.style.display = (name.includes(query) || course.includes(query)) ? "" : "none";
    });
  });
}

// ─── Glitter Stars Generator ───
const STARS = ['✦','✧','★','☆','✨','💫','⭐','🌟','🥄','🍕','🍭','🍩','🍪','🍇','🍓','🍒','🍫','🍴','🍧','🌶️'];
const container = document.getElementById('glitter-container');
if (container) {
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
  for (let i = 0; i < 12; i++) setTimeout(spawnStar, i * 200);
}
