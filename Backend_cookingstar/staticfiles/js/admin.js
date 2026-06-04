// admin.js
// FIX: was reading stats from localStorage — only showed current browser's data,
//      not real database counts. Now fetches from the backend API.

async function updateAdminStats() {
    try {
        // Fetch recipe count + user count from the dedicated stats endpoint
        const res = await apiFetch('/api/recipes/stats/');
        if (res.ok) {
            const data = await res.json();
            const recipesCell = document.getElementById('total-recipes');
            const usersCell   = document.getElementById('total-users');
            const pendingCell = document.getElementById('pending-recipes');
            if (recipesCell) recipesCell.textContent = data.total_recipes;
            if (usersCell)   usersCell.textContent   = data.total_users;
            if (pendingCell) pendingCell.textContent  = 0;
        } else if (res.status === 403) {
            console.warn('Admin stats: not authorized — redirecting to login');
            window.location.href = '/login/';
        }
    } catch (e) {
        console.error('Could not load admin stats:', e);
    }
}

async function loadUserTable() {
    try {
        const res = await apiFetch('/api/users/');
        if (!res.ok) return;
        const users = await res.json();

        // Cache for other uses
        localStorage.setItem('cookingStar_users_cache', JSON.stringify(users));

        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td>${u.is_staff ? '👑 Admin' : 'User'}</td>
                <td>${new Date(u.date_joined).toLocaleDateString()}</td>`;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Could not load user table:', e);
    }
}

async function loadRecipeTable() {
    try {
        const res = await apiFetch('/api/recipes/');
        if (!res.ok) return;
        const recipes = await res.json();
        const tbody = document.getElementById('recipes-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        recipes.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.id}</td>
                <td>${r.title}</td>
                <td>${r.author_name || '—'}</td>
                <td>${r.course || '—'}</td>
                <td>
                  <button onclick="adminDeleteRecipe(${r.id})" class="btn btn-danger btn-sm">Delete</button>
                </td>`;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Could not load recipe table:', e);
    }
}

async function adminDeleteRecipe(id) {
    if (!confirm('Delete this recipe?')) return;
    const res = await apiFetch(`/api/recipes/${id}/`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
        showToast('Recipe deleted.');
        loadRecipeTable();
        updateAdminStats();
    } else {
        showToast('Could not delete recipe.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Guard: redirect non-admins away from this page
    const session = getSession();
    if (!session || !session.isAdmin) {
        window.location.href = '/login/';
        return;
    }

    await updateAdminStats();
    await loadUserTable();
    await loadRecipeTable();
});
