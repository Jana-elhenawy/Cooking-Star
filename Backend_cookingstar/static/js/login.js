document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email      = document.getElementById('email').value.trim();
    const password   = document.getElementById('password').value;
    const errorEl    = document.getElementById('login-error');

    errorEl.style.display = 'none';

    if (!email || !password) {
        errorEl.textContent = '⚠️ Please enter your email and password.';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const res = await apiFetch('/api/login/', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        let data;
        try { data = await res.json(); }
        catch { throw new Error('Invalid server response'); }

        if (!res.ok) throw new Error(data.error || 'Login failed');

        // Check selected role matches actual role from database
        const selectedRole = document.querySelector('input[name="role"]:checked').value;

        if (selectedRole === 'admin' && !data.isAdmin) {
            errorEl.textContent = '⚠️ These credentials do not belong to an admin account.';
            errorEl.style.display = 'block';
            return;
        }

        if (selectedRole === 'user' && data.isAdmin) {
            errorEl.textContent = '⚠️ These credentials belong to an admin account. Please select Admin.';
            errorEl.style.display = 'block';
            return;
        }

        // Role matches — save session and redirect
        setSession({
            username:  data.username,
            firstName: data.firstName,
            email:     data.email,
            role:      data.role,
            isAdmin:   data.isAdmin,
        });
        setToken(data.token);

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