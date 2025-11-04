
// Date display on dashboard
const dateEl = document.getElementById('dateDisplay');
if (dateEl) {
  const now = new Date();
  dateEl.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}

// Pomodoro timer (dashboard)
let timerInterval = null;
let remaining = 25 * 60;
const display = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startTimer');
const pauseBtn = document.getElementById('pauseTimer');
const resetBtn = document.getElementById('resetTimer');

function renderTimer() {
  if (!display) return;
  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  display.textContent = ${m}:${s};
}
function startTimer() {
  if (timerInterval || !display) return;
  timerInterval = setInterval(() => {
    if (remaining > 0) { remaining--; renderTimer(); }
    else { clearInterval(timerInterval); timerInterval = null; display.classList.add('pulse'); setTimeout(()=>display.classList.remove('pulse'),1500); }
  }, 1000);
}
function pauseTimer(){ clearInterval(timerInterval); timerInterval = null; }
function resetTimer(){ pauseTimer(); remaining = 25 * 60; renderTimer(); }

startBtn?.addEventListener('click', startTimer);
pauseBtn?.addEventListener('click', pauseTimer);
resetBtn?.addEventListener('click', resetTimer);
renderTimer();

// Task progress
function updateTasksProgress() {
  const items = [...document.querySelectorAll('#taskList input[type="checkbox"]')];
  const done = items.filter(i => i.checked).length;
  const pct = items.length ? Math.round(done / items.length * 100) : 0;
  const bar = document.getElementById('tasksProgress');
  const cap = document.querySelector('.kpi-orange .kpi-caption');
  if (bar) bar.style.width = pct + '%';
  if (cap) cap.textContent = ${pct}% completed;
}
document.getElementById('taskList')?.addEventListener('change', updateTasksProgress);
updateTasksProgress();

// Add task button
document.getElementById('addTaskBtn')?.addEventListener('click', () => {
  const text = prompt('New task');
  if (!text) return;
  const li = document.createElement('li');
  li.className = 'item';
  li.innerHTML = <label><input type="checkbox" /> ${text}</label><span class="tag">New</span>;
  document.getElementById('taskList').prepend(li);
  updateTasksProgress();
});

// Contact form demo
document.getElementById('contactForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('contactStatus').textContent = 'Thanks! We’ll get back to you soon.';
});
