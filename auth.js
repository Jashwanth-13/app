(function auth() {
  // Tab switch
  const tabs = document.querySelectorAll('.tab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const forgotForm = document.getElementById('forgotForm');

  function switchTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    loginForm.classList.toggle('hidden', name !== 'login');
    signupForm.classList.toggle('hidden', name !== 'signup');
    forgotForm.classList.toggle('hidden', name !== 'forgot');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const map = {
      login: ['Welcome back', 'Log in to continue'],
      signup: ['Join FocusFlow', 'Create your account'],
      forgot: ['Reset password', 'We’ll send a link']
    };
    title.textContent = map[name][0];
    subtitle.textContent = map[name][1];
    history.replaceState(null, '', #${name});
  }

  tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  if (location.hash === '#signup') switchTab('signup');
  else if (location.hash === '#forgot') switchTab('forgot');
  else switchTab('login');

  // Mock database in localStorage
  const users = store.get('ff:users', {});

  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(signupForm);
    const name = form.get('name').trim();
    const email = form.get('email').trim().toLowerCase();
    const password = form.get('password');
    if (users[email]) { alert('Account already exists. Try login.'); return; }
    users[email] = { id: uid('u'), name, email, password, created: time.now() };
    store.set('ff:users', users);
    store.set('ff:user', { id: users[email].id, name, email });
    window.location.href = 'dashboard.html';
  });

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(loginForm);
    const email = form.get('email').trim().toLowerCase();
    const password = form.get('password');
    const u = users[email];
    if (!u || u.password !== password) { alert('Invalid credentials'); return; }
    store.set('ff:user', { id: u.id, name: u.name, email: u.email });
    window.location.href = 'dashboard.html';
  });

  forgotForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = new FormData(forgotForm).get('email').trim().toLowerCase();
    const u = users[email];
    if (!u) { alert('No account found for this email.'); return; }
    alert('Reset link sent (demo). In production, send an email.');
  });

  document.getElementById('googleLogin')?.addEventListener('click', async () => {
    alert('Google OAuth demo — connect real backend to proceed.');
  });
})();
