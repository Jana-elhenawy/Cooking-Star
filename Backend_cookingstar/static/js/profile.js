/* =============================================
   نجمة الطبخ — Cooking Star | profile.js
   Handles the user profile page: load, edit, save, password change.
   ============================================= */


/* ── Helpers ─────────────────────────────────────────────────── */

/**
 * Show a success or error message in the given element pair.
 * @param {string} errorId   - ID of the error <div>
 * @param {string} successId - ID of the success <div>
 * @param {string} text      - Message text (empty string clears both)
 * @param {boolean} isError
 */
function showMsg(errorId, successId, text, isError = false) {
  const errEl = document.getElementById(errorId);
  const okEl  = document.getElementById(successId);
  if (errEl) { errEl.textContent  = isError ? text : ''; errEl.style.display  = (isError && text) ? 'block' : 'none'; }
  if (okEl)  { okEl.textContent   = isError ? '' : text;  okEl.style.display   = (!isError && text) ? 'block' : 'none'; }
}

/**
 * Toggle a button's disabled state and swap its label while a request runs.
 * @param {HTMLButtonElement} btn
 * @param {boolean} loading
 */
function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.orig = btn.textContent;
    btn.textContent  = 'Saving…';
  } else {
    btn.textContent = btn.dataset.orig || btn.textContent;
  }
}


/* ── Populate form from API ──────────────────────────────────── */

async function loadProfile() {
  const data = await fetchProfile();

  if (!data) {
    // Token is invalid — clear session and redirect
    clearSession();
    clearToken();
    window.location.href = '/login/';
    return;
  }

  // FIX: use the actual HTML element IDs
  const setValue = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  setValue('firstName', data.firstName);
  setValue('lastName',  data.lastName);
  setValue('username',  data.username);
  setValue('email',     data.email);

  // FIX: gender is a <select>, not radio buttons
  const genderSel = document.getElementById('gender');
  if (genderSel) genderSel.value = data.gender || '';

  // FIX: update the avatar section using the correct element IDs
  const displayName  = document.getElementById('profile-display-name');
  const displayEmail = document.getElementById('profile-display-email');
  if (displayName)  displayName.textContent  = data.firstName || data.username || 'User';
  if (displayEmail) displayEmail.textContent = data.email || '';

  // Update avatar emoji based on gender
  const avatar = document.getElementById('profile-avatar');
  if (avatar) {
    if (data.gender === 'M') avatar.textContent = '👨‍🍳';
    else if (data.gender === 'F') avatar.textContent = '👩‍🍳';
    else avatar.textContent = '🍳';
  }
}


/* ── Section 1: Save Personal Info ──────────────────────────── */

async function savePersonalInfo(btn) {
  // FIX: button is passed as `this` (an element), not an ID string
  showMsg('info-error', 'info-success', '');

  const firstName = (document.getElementById('firstName')?.value || '').trim();
  const lastName  = (document.getElementById('lastName')?.value  || '').trim();
  const gender    = document.getElementById('gender')?.value || '';  // FIX: read from <select>

  setLoading(btn, true);

  const result = await updateProfile({ firstName, lastName, gender });

  setLoading(btn, false);

  if (!result.ok) {
    showMsg('info-error', 'info-success', result.error, true);
    return;
  }

  // Update session so navbar reflects new name immediately
  const session = getSession();
  if (session) {
    setSession({ ...session, firstName: result.data.firstName });
    buildNavbar();
  }

  // Refresh avatar display name
  const displayName = document.getElementById('profile-display-name');
  if (displayName) displayName.textContent = result.data.firstName || result.data.username || 'User';

  // Update avatar emoji
  const avatar = document.getElementById('profile-avatar');
  if (avatar) {
    if (gender === 'M') avatar.textContent = '👨‍🍳';
    else if (gender === 'F') avatar.textContent = '👩‍🍳';
    else avatar.textContent = '🍳';
  }

  showMsg('info-error', 'info-success', '✅ Personal info saved!');
}


/* ── Section 2: Save Account Settings ───────────────────────── */

async function saveAccountSettings(btn) {
  showMsg('account-error', 'account-success', '');

  const username = (document.getElementById('username')?.value || '').trim();
  const email    = (document.getElementById('email')?.value    || '').trim();

  // Client-side validation
  if (!username) {
    showMsg('account-error', 'account-success', 'Username is required', true);
    return;
  }
  if (username.length < 3) {
    showMsg('account-error', 'account-success', 'Username must be at least 3 characters', true);
    return;
  }
  if (!email) {
    showMsg('account-error', 'account-success', 'Email is required', true);
    return;
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    showMsg('account-error', 'account-success', 'Please enter a valid email address', true);
    return;
  }

  setLoading(btn, true);

  const result = await updateProfile({ username, email });

  setLoading(btn, false);

  if (!result.ok) {
    showMsg('account-error', 'account-success', result.error, true);
    return;
  }

  // Update session
  const session = getSession();
  if (session) {
    setSession({ ...session, username: result.data.username, email: result.data.email });
    buildNavbar();
  }

  const displayEmail = document.getElementById('profile-display-email');
  if (displayEmail) displayEmail.textContent = result.data.email || '';

  showMsg('account-error', 'account-success', '✅ Account settings saved!');
}


/* ── Section 3: Change Password ─────────────────────────────── */

async function savePassword(btn) {
  // FIX: use the actual HTML password field IDs
  showMsg('password-error', 'password-success', '');

  const currentPw = document.getElementById('currentPassword')?.value || '';
  const newPw     = document.getElementById('newPassword')?.value     || '';
  const confirmPw = document.getElementById('confirmPassword')?.value || '';

  if (!currentPw || !newPw || !confirmPw) {
    showMsg('password-error', 'password-success', 'All password fields are required', true);
    return;
  }
  if (newPw.length < 6) {
    showMsg('password-error', 'password-success', 'New password must be at least 6 characters', true);
    return;
  }
  if (newPw !== confirmPw) {
    showMsg('password-error', 'password-success', 'New passwords do not match', true);
    return;
  }
  if (currentPw === newPw) {
    showMsg('password-error', 'password-success', 'New password must differ from current password', true);
    return;
  }

  setLoading(btn, true);

  const result = await changePassword({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw });

  setLoading(btn, false);

  if (!result.ok) {
    showMsg('password-error', 'password-success', result.error, true);
    return;
  }

  showMsg('password-error', 'password-success', '✅ Password changed! Redirecting to login…');

  // Clear session — all tokens were invalidated server-side
  await logoutUser();
  setTimeout(() => { window.location.href = '/login/'; }, 2000);
}


/* ── Init ────────────────────────────────────────────────────── */

async function initProfilePage() {
  // Auth guard — redirect guests to login
  const session = await requireLogin();
  if (!session) return;

  await loadProfile();
}

document.addEventListener('DOMContentLoaded', initProfilePage);