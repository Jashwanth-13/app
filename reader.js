(function reader() {
  requireAuth('login.html');

  const fileInput = document.getElementById('fileInput');
  const pdfFrame = document.getElementById('pdfFrame');
  const textContent = document.getElementById('textContent');
  const fileMeta = document.getElementById('fileMeta');
  const readerControls = document.getElementById('readerControls');

  const openTimeEl = document.getElementById('openTime');
  const activeTimeEl = document.getElementById('activeTime');
  const etaEl = document.getElementById('eta');

  const startBtn = document.getElementById('startReading');
  const pauseBtn = document.getElementById('pauseReading');
  const finishBtn = document.getElementById('finishReading');

  const notifyStart = document.getElementById('notifyStart');
  const notifyBreak = document.getElementById('notifyBreak');

  let currentFile = null;
  let openStart = null;
  let activeTimer = null;
  let activeMs = 0;

  function resetReader() {
    pdfFrame.src = '';
    pdfFrame.classList.add('hidden');
    textContent.textContent = '';
    textContent.classList.add('hidden');
    fileMeta.classList.add('hidden');
    readerControls.classList.add('hidden');
    openStart = null; activeMs = 0;
    openTimeEl.textContent = '0';
    activeTimeEl.textContent = '0';
    etaEl.textContent = '—';
    clearInterval(activeTimer); activeTimer = null;
  }

  function estimateCompletion(meta) {
    // naive estimate: 200 words/min for text; 2 min/page for PDF
    if (meta.type === 'text') {
      const min = Math.max(1, Math.ceil(meta.wordCount / 200));
      return ${min} min;
    } else if (meta.type === 'pdf') {
      const min = Math.max(2, meta.pageCount ? meta.pageCount * 2 : 10);
      return ${min} min;
    }
    return '—';
  }

  async function displayFile(file) {
    resetReader();
    currentFile = file;

    const name = file.name;
    const ext = name.split('.').pop().toLowerCase();

    fileMeta.classList.remove('hidden');
    readerControls.classList.remove('hidden');
    openStart = time.now();

    if (ext === 'pdf') {
      const url = URL.createObjectURL(file);
      pdfFrame.src = url;
      pdfFrame.classList.remove('hidden');
      fileMeta.innerHTML = <strong>${name}</strong><br/><small>PDF loaded. Page count will be inferred via viewer.</small>;
      etaEl.textContent = estimateCompletion({ type: 'pdf', pageCount: null });
    } else {
      const text = await file.text();
      textContent.textContent = text;
      textContent.classList.remove('hidden');
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      fileMeta.innerHTML = <strong>${name}</strong><br/><small>${words} words</small>;
      etaEl.textContent = estimateCompletion({ type: 'text', wordCount: words });
    }

    // Open time tracker
    (function trackOpen() {
      const interval = setInterval(() => {
        if (!openStart || !currentFile) { clearInterval(interval); return; }
        const min = time.min(time.now() - openStart);
        openTimeEl.textContent = String(min);
      }, 5000);
    })();
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    displayFile(file);
  });

  startBtn.addEventListener('click', async () => {
    if (!currentFile || activeTimer) return;
    await notify.ensurePermission();
    const start = time.now();
    activeTimer = setInterval(() => {
      const delta = time.now() - start;
      activeMs += 1000;
      activeTimeEl.textContent = String(time.min(activeMs));
    }, 1000);
  });

  pauseBtn.addEventListener('click', () => {
    clearInterval(activeTimer); activeTimer = null;
  });

  finishBtn.addEventListener('click', () => {
    clearInterval(activeTimer); activeTimer = null;
    if (!currentFile || !openStart) return;
    const openMin = time.min(time.now() - openStart);
    const activeMin = time.min(activeMs);
    notify.push('Reading session saved', Open: ${openMin} min • Active: ${activeMin} min);
    // Persist per-file stats
    const key = ff:file:${currentFile.name};
    const list = store.get('ff:reader:list', []);
    const existingIdx = list.findIndex(x => x.name === currentFile.name);
    const entry = { name: currentFile.name, openMin, activeMin, at: time.now() };
    if (existingIdx >= 0) list[existingIdx] = entry; else list.push(entry);
    store.set('ff:reader:list', list);
    currentFile = null;
    resetReader();
  });

  notifyStart.addEventListener('click', async () => {
    await notify.ensurePermission();
    notify.push('Gentle nudge', 'Time to start your assignment. Open your document now.');
  });

  notifyBreak.addEventListener('click', async () => {
    await notify.ensurePermission();
    notify.push('Break reminder', 'Stand up, breathe, and take a 5‑minute break.');
  });
})();
