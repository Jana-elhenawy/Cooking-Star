// signup.js

// Restore draft values on page load
['first-name', 'last-name', 'username', 'email'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const draft = getFormDraft();
    if (draft[id]) el.value = draft[id];
    el.addEventListener('input', () => {
        saveFormDraft({ ...getFormDraft(), [id]: el.value });
    });
});

document.getElementById('signup-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const firstName       = document.getElementById('first-name')?.value.trim() || '';
    const lastName        = document.getElementById('last-name')?.value.trim() || '';
    const username        = document.getElementById('username').value.trim();
    const email           = document.getElementById('email').value.trim();
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const roleInput       = document.querySelector('input[name="role"]:checked');
    const genderInput     = document.querySelector('input[name="gender"]:checked');
    const role            = roleInput  ? roleInput.value  : 'user';
    const gender          = genderInput ? genderInput.value : '';
    const errorEl         = document.getElementById('signup-error');

    // Client-side validation
    if (password !== confirmPassword) {
        errorEl.textContent = '⚠️ Passwords do not match.';
        errorEl.style.display = 'block';
        return;
    }
    if (password.length < 6) {
        errorEl.textContent = '⚠️ Password must be at least 6 characters.';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const res = await apiFetch('/api/signup/', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, role, firstName, lastName, gender }),
        });

        let data;
        try { data = await res.json(); }
        catch { throw new Error('Invalid server response'); }

        if (!res.ok) throw new Error(data.error || 'Signup failed');

        // Persist session and token
        setSession({
            username:  data.username,
            firstName: data.firstName,
            email:     data.email,
            role:      data.role,
            isAdmin:   data.isAdmin,
        });
        setToken(data.token);

        errorEl.style.display = 'none';
        clearFormDraft();

        // FIX: was redirecting to "/admin/" (Django's built-in admin) for admin users.
        //      Now correctly redirects to the app's admin dashboard page.
        if (data.isAdmin) {
            window.location.href = '/admin-dashboard/';
        } else {
            window.location.href = '/user-dashboard/';
        }

    } catch (err) {
        console.error(err);
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
    }
});
