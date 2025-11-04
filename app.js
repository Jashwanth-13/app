(function app() {
  const user = requireAuth();

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    store.remove('ff:user');
    window.location.href = 'login.html';
  });

  // To‑Do
  const todoForm = document.getElementById('todoForm');
  const todoList = document.getElementById('todoList');
  const todos = store.get(ff:${user.id}:todos, []);

  function renderTodos() {
    todoList.innerHTML = '';
    const sorted = [...todos].sort((a,b) => {
      const p = { high:3, medium:2, low:1 };
      return (p[b.priority]-p[a.priority]) || (a.done - b.done);
    });
    sorted.forEach(t => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div>${t.title} ${t.priority === 'high' ? '🔥' : t.priority === 'low' ? '🌿' : '⚪'}</div>
          <div class="meta">${t.done ? 'Done' : 'Pending'} • Created ${new Date(t.created).toLocaleString()}</div>
        </div>
        <div class="actions">
          <button class="btn btn-outline" data-action="toggle" data-id="${t.id}">${t.done?'Undo':'Done'}</button>
          <button class="btn btn-outline" data-action="delete" data-id="${t.id}">Delete</button>
        </div>`;
      todoList.appendChild(li);
    });
    updateTaskProgress();
  }

  todoForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(todoForm);
    const title = fd.get('title').trim();
    const priority = fd.get('priority');
    todos.push({ id: uid('t'), title, priority, done:false, created: time.now() });
    store.set(ff:${user.id}:todos, todos);
    todoForm.reset();
    renderTodos();
  });

  todoList?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const t = todos.find(x => x.id === id);
    if (!t) return;
    if (btn.dataset.action === 'toggle') t.done = !t.done;
    if (btn.dataset.action === 'delete') todos.splice(todos.indexOf(t),1);
    store.set(ff:${user.id}:todos, todos);
    renderTodos();
  });

  // Pomodoro
  let pomTimer = null, secondsLeft = 25*60, mode = 'work', cycles = store.get(ff:${user.id}:pom:cycles, 0);
  const pomMinutes = document.getElementById('pomMinutes');
  const pomSeconds = document.getElementById('pomSeconds');
  const pomStart = document.getElementById('pomStart');
  const pomPause = document.getElementById('pomPause');
  const pomReset = document.getElementById('pomReset');
  const pomMode = document.getElementById('pomMode');
  const pomCycles = document.getElementById('pomCycles');
  const focusMinutes = document.getElementById('focusMinutes');

  function setMode(m) {
    mode = m;
    secondsLeft = m === 'work' ? 25*60 : m === 'short' ? 5*60 : 15*60;
    updatePomDisplay();
  }
  function updatePomDisplay() {
    pomMinutes.textContent = String(Math.floor(secondsLeft/60)).padStart(2,'0');
    pomSeconds.textContent = String(secondsLeft%60).padStart(2,'0');
  }
  function tick() {
    secondsLeft--;
    updatePomDisplay();
    if (mode === 'work') {
      const total = store.get(ff:${user.id}:focusMin, 0) + 1/60;
      store.set(ff:${user.id}:focusMin, total);
      updateFocusStats();
    }
    if (secondsLeft <= 0) {
      clearInterval(pomTimer); pomTimer = null;
      if (mode === 'work') {
        cycles++; store.set(ff:${user.id}:pom:cycles, cycles);
        notify.push('Pomodoro complete', 'Time for a short break.');
      } else {
        notify.push('Break over', 'Ready for your next focus sprint?');
      }
      pomCycles.textContent = cycles;
    }
  }
  function updateFocusStats() {
    const min = Math.floor(store.get(ff:${user.id}:focusMin, 0) * 60) / 60; // normalizing float
    focusMinutes.textContent = Math.floor(min);
    updateFocusMeter(Math.floor(min));
  }

  pomStart?.addEventListener('click', async () => {
    if (pomTimer) return;
    await notify.ensurePermission();
    pomTimer = setInterval(tick, 1000);
  });
  pomPause?.addEventListener('click', () => { clearInterval(pomTimer); pomTimer = null; });
  pomReset?.addEventListener('click', () => { clearInterval(pomTimer); pomTimer = null; setMode(mode); });
  pomMode?.addEventListener('change', () => setMode(pomMode.value));
  setMode('work'); pomCycles.textContent = cycles; updateFocusStats();

  // Class schedule
  const classForm = document.getElementById('classForm');
  const classList = document.getElementById('classList');
  const classes = store.get(ff:${user.id}:classes, []);

  function renderClasses() {
    classList.innerHTML = '';
    const byDay = {Mon:[],Tue:[],Wed:[],Thu:[],Fri:[],Sat:[],Sun:[]};
    classes.forEach(c => (byDay[c.day] ??= []).push(c));
    const sorted = classes.sort((a,b)=>a.day.localeCompare(b.day) || a.start.localeCompare(b.start));
    sorted.forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div>${c.course} — ${c.day} ${c.start}–${c.end}</div>
          <div class="meta">Added ${new Date(c.created).toLocaleString()}</div>
        </div>
        <div class="actions">
          <button class="btn btn-outline" data-action="delete" data-id="${c.id}">Remove</button>
        </div>`;
      classList.appendChild(li);
    });
  }

  classForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(classForm);
    const course = fd.get('course').trim();
    const day = fd.get('day').trim();
    const start = fd.get('start'); const end = fd.get('end');
    // Basic conflict detection
    const conflict = classes.some(c => c.day === day && !(end <= c.start || start >= c.end));
    if (conflict) { alert('Time conflict with existing class.'); return; }
    classes.push({ id: uid('c'), course, day, start, end, created: time.now() });
    store.set(ff:${user.id}:classes, classes);
    classForm.reset();
    renderClasses();
  });

  classList?.addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); if (!btn) return;
    if (btn.dataset.action === 'delete') {
      const id = btn.dataset.id;
      const idx = classes.findIndex(x => x.id === id);
      if (idx >= 0) classes.splice(idx,1);
      store.set(ff:${user.id}:classes, classes);
      renderClasses();
    }
  });

  // Assignments & deadlines
  const assignForm = document.getElementById('assignForm');
  const assignList = document.getElementById('assignList');
  const assigns = store.get(ff:${user.id}:assigns, []);

  function renderAssigns() {
    assignList.innerHTML = '';
    const sorted = [...assigns].sort((a,b)=> new Date(a.due) - new Date(b.due));
    const now = new Date();
    sorted.forEach(a => {
      const d = new Date(a.due);
      const days = Math.ceil((d - now) / (1000*60*60*24));
      const dueSoon = days <= 3;
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div>${a.title} — ${a.subject}</div>
          <div class="meta">Due ${d.toDateString()} (${days} days)</div>
        </div>
        <div class="actions">
          <button class="btn ${dueSoon ? 'btn-primary' : 'btn-outline'}" data-action="nudge" data-id="${a.id}">Nudge</button>
          <button class="btn btn-outline" data-action="delete" data-id="${a.id}">Remove</button>
        </div>`;
      assignList.appendChild(li);
    });
    updateDeadlineProgress();
  }

  assignForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(assignForm);
    const title = fd.get('title').trim();
    const due = fd.get('due');
    const subject = fd.get('subject');
    assigns.push({ id: uid('a'), title, due, subject, created: time.now() });
    store.set(ff:${user.id}:assigns, assigns);
    assignForm.reset();
    renderAssigns();
  });

  assignList?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const id = btn.dataset.id;
    const a = assigns.find(x => x.id === id);
    if (!a) return;
    if (btn.dataset.action === 'delete') {
      assigns.splice(assigns.indexOf(a),1);
      store.set(ff:${user.id}:assigns, assigns);
      renderAssigns();
    }
    if (btn.dataset.action === 'nudge') {
      await notify.ensurePermission();
      notify.push('Time to start', Begin "${a.title}" — ${a.subject}, due soon.);
    }
  });

  // Progress dashboard meters
  const taskMeter = document.getElementById('taskMeter');
  const tasksDone = document.getElementById('tasksDone');
  const tasksTotal = document.getElementById('tasksTotal');
  const deadlineMeter = document.getElementById('deadlineMeter');
  const upcomingCount = document.getElementById('upcomingCount');
  const focusMeter = document.getElementById('focusMeter');
  const focusTotal = document.getElementById('focusTotal');

  function updateTaskProgress() {
    const total = todos.length;
    const done = todos.filter(t=>t.done).length;
    tasksTotal.textContent = total;
    tasksDone.textContent = done;
    const pct = total ? Math.round((done/total)*100) : 0;
    taskMeter.style.width = ${pct}%;
  }
  function updateDeadlineProgress() {
    const now = new Date();
    const upcoming = assigns.filter(a => (new Date(a.due) - now)/(1000*60*60*24) <= 7);
    upcomingCount.textContent = upcoming.length;
    const pct = Math.min(100, Math.round((upcoming.length / Math.max(assigns.length,1))*100));
    deadlineMeter.style.width = ${pct}%;
  }
  function updateFocusMeter(min) {
    const pct = Math.min(100, Math.round((min / 120) * 100)); // target 2h focus/day
    focusMeter.style.width = ${pct}%;
    focusTotal.textContent = min;
  }

  // Motivation & tips
  const tipsList = document.getElementById('tipsList');
  const videoList = document.getElementById('videoList');

  const sampleTips = [
    'Break tasks into 25‑minute sprints. Reward yourself after each.',
    'Write the next action, not the vague goal.',
    'Start with the hardest 10 minutes — momentum follows.',
    'Schedule your day the night before to reduce decision fatigue.',
    'Protect sleep: focus thrives on rest.'
  ];
  const sampleVideos = [
    { title: 'How to study effectively — evidence based', url: 'https://www.youtube.com/watch?v=E7CwqNHn_Ns' },
    { title: 'Pomodoro deep focus music (no ads)', url: 'https://www.youtube.com/watch?v=5qap5aO4i9A' },
    { title: 'Atomic Habits summary', url: 'https://www.youtube.com/watch?v=PZ7lDrwYdZc' }
  ];

  function renderTips() {
    tipsList.innerHTML = '';
    sampleTips.forEach(t => {
      const div = document.createElement('div');
      div.className = 'tip';
      div.textContent = • ${t};
      tipsList.appendChild(div);
    });
  }
  function renderVideos() {
    videoList.innerHTML = '';
    sampleVideos.forEach(v => {
      const div = document.createElement('div');
      div.className = 'video-item';
      div.innerHTML = <a href="${v.url}" target="_blank" rel="noopener">${v.title}</a>;
      videoList.appendChild(div);
    });
  }

  // Initialize
  renderTodos();
  renderClasses();
  renderAssigns();
  renderTips();
  renderVideos();
})();
