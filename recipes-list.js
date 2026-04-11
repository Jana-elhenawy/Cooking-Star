document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.showToast !== 'function') {
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
  }
  if (typeof window.isFavorite !== 'function') {
    window.isFavorite = function(id) {
      try {
        const favs = JSON.parse(localStorage.getItem("cookingStar_favorites") || "[]");
        return favs.includes(id);
      } catch(e) { return false; }
    };
    window.addFavorite = function(id) {
      const favs = JSON.parse(localStorage.getItem("cookingStar_favorites") || "[]");
      if (!favs.includes(id)) {
        favs.push(id);
        localStorage.setItem("cookingStar_favorites", JSON.stringify(favs));
        return true;
      }
      return false;
    };
    window.removeFavorite = function(id) {
      let favs = JSON.parse(localStorage.getItem("cookingStar_favorites") || "[]");
      favs = favs.filter(fid => fid !== id);
      localStorage.setItem("cookingStar_favorites", JSON.stringify(favs));
    };
  }
  
  syncFavButtons();
  setupSearch();
  setupFilters();
  spawnGlitterStars();
});

function syncFavButtons() {
  document.querySelectorAll(".fav-btn").forEach(btn => {
    const recipeId = btn.dataset.id;
    if (typeof window.isFavorite === "function" && window.isFavorite(recipeId)) {
      markFav(btn);
    } else {
      unmarkFav(btn);
    }
    btn.removeEventListener("click", handleFavClick);
    btn.addEventListener("click", handleFavClick);
  });
}

function handleFavClick(event) {
  const btn = event.currentTarget;
  toggleFav(btn);
}

function toggleFav(btn) {
  const id = btn.dataset.id;
  if (!id) return;
  
  if (typeof window.isFavorite === "function" && window.isFavorite(id)) {
    if (typeof window.removeFavorite === "function") {
      window.removeFavorite(id);
    }
    unmarkFav(btn);
    if (typeof window.showToast === "function") {
      window.showToast("Removed from favourites!");
    }
  } else {
    if (typeof window.addFavorite === "function") {
      window.addFavorite(id);
    }
    markFav(btn);
    if (typeof window.showToast === "function") {
      window.showToast("Added to favourites!");
    }
  }
}

function markFav(btn) {
  btn.textContent = "Remove from fav";
  btn.classList.remove("btn-secondary");
  btn.classList.add("btn-danger");
}

function unmarkFav(btn) {
  btn.textContent = "Add to Fav";
  btn.classList.remove("btn-danger");
  btn.classList.add("btn-secondary");
}

function setupSearch() {
  const input = document.getElementById("recipe-search");
  if (!input) return;
  input.addEventListener("input", applyFilters);
}

function setupFilters() {
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
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

  cards.forEach(card => {
    const nameAttr = card.dataset.name || "";
    const nameMatch = nameAttr.includes(query);
    const cardCourse = card.dataset.course || "";
    const courseMatch = course === "all" || cardCourse === course;
    const show = nameMatch && courseMatch;
    card.classList.toggle("hidden", !show);
    if (show) visible++;
  });

  const noResultsDiv = document.getElementById("no-results");
  if (noResultsDiv) {
    noResultsDiv.style.display = visible === 0 ? "block" : "none";
  }
}

function spawnGlitterStars() {
  const STARS = ['✦','✧','★','☆','✨','💫','⭐','🌟','🥄','🍕','🍭','🍩','🍪','🍇','🍓','🍒','🍫','🍴','🍧','🌶️'];
  const container = document.getElementById('glitter-container');
  if (!container) return;

  function spawnOne() {
    const el = document.createElement('div');
    el.className = 'glitter-star';
    el.textContent = STARS[Math.floor(Math.random() * STARS.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (0.6 + Math.random() * 1.4) + 'rem';
    el.style.animationDuration = (5 + Math.random() * 8) + 's';
    el.style.animationDelay = (Math.random() * 3) + 's';
    const colors = ['#ff5c8a','#ffd700','#ff007f','#ffb347','#ff99bb','#fff176'];
    el.style.color = colors[Math.floor(Math.random() * colors.length)];
    container.appendChild(el);
    setTimeout(() => el.remove(), 14000);
  }

  setInterval(spawnOne, 600);
  for (let i = 0; i < 12; i++) setTimeout(spawnOne, i * 200);
}