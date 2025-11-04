// Simple storage and helpers
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(key); }
};

const notify = {
  async ensurePermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const p = await Notification.requestPermission();
    return p === 'granted';
  },
  push(title, body) {
    if (!('Notification' in window)) { alert(${title}\n${body}); return; }
    if (Notification.permission !== 'granted') { alert(${title}\n${body}); return; }
    new Notification(title, { body });
  }
};

const time = {
  now() { return Date.now(); },
  min(ms) { return Math.floor(ms / 60000); },
  hhmm(totalMin) {
    const h = Math.floor(totalMin / 60), m = totalMin % 60;
    return ${h}h ${m}m;
  }
};

function requireAuth(redirect = 'login.html') {
  const user = store.get('ff:user', null);
  if (!user) window.location.href = redirect;
  return user;
}

function uid(prefix='id') {
  return ${prefix}_${Math.random().toString(36).slice(2,9)};
}
