// BuzzArena v3 — Présentateur TV IA
// Module autonome : bandeau de commentaires, voix off (Web Speech API),
// effets sonores synthétisés (roulement de tambour, suspense) et confettis.
// by twagirumukiza

const Presenter = (() => {
  const ENABLED_KEY = 'ba_presenter_enabled_v1';
  let enabled = localStorage.getItem(ENABLED_KEY);
  enabled = enabled === null ? true : enabled === '1';

  let soundOn = true; // synchronisé par app.js via setSoundEnabled()
  let hooks = { fanfare: null, victory: null };

  // ---------- Texte du présentateur (variantes) ----------
  const TPL = {
    welcome: [
      "🎙️ Bienvenue dans BuzzArena ! Aujourd'hui, {n} concurrents vont tenter de devenir champion !",
      "🎙️ Installez-vous confortablement, {n} candidats sont prêts à en découdre dans BuzzArena !",
      "🎙️ Mesdames et messieurs, {n} concurrents entrent en piste pour BuzzArena !"
    ],
    theme: [
      "Le thème du jour : {theme}. Que le meilleur gagne !",
      "Aujourd'hui, direction « {theme} ». Bonne chance à toutes et à tous !",
      "Cette partie sera consacrée à « {theme} ». Concentration maximale !"
    ],
    introNormal: [
      "Première question… attention, la partie commence !",
      "Question {i} sur {n}… concentration maximale !",
      "On enchaîne avec la question {i} sur {n}.",
      "Prêts ? Voici la question {i} !"
    ],
    introDouble: [
      "Attention… cette question vaut DOUBLE !",
      "Accrochez-vous, voici une question qui vaut DOUBLE !",
      "Ça se corse : cette question vaut le double des points !"
    ],
    introTriple: [
      "Roulement de tambour… cette question vaut TRIPLE !!!",
      "Moment décisif : une question TRIPLE arrive !",
      "Tout peut basculer : voici la question TRIPLE de la partie !"
    ],
    timerHalf: [
      "Le temps tourne…",
      "La moitié du temps est déjà passée !",
      "Qui va se décider en premier ?"
    ],
    timerLow: [
      "Plus que cinq secondes, dépêchez-vous !",
      "Vite, le temps est presque écoulé !",
      "Dernières secondes… vite !"
    ],
    fastReflex: [
      "Quel réflexe ! {name} répond en seulement {s} secondes !",
      "Éclair ! {name} a dégainé en {s} secondes à peine !",
      "Impressionnant, {name} a répondu en {s} secondes !"
    ],
    newLeader: [
      "Excellent ! {name} prend la tête du classement !",
      "Changement en tête : {name} passe devant tout le monde !",
      "{name} s'empare de la première place !"
    ],
    comeback: [
      "Quelle remontée spectaculaire de {name} !",
      "{name} réalise une remontée fulgurante !",
      "Retournement de situation : {name} grimpe au classement !"
    ],
    generic: [
      "Bonne pioche pour les plus rapides sur cette question.",
      "Une question qui a fait la différence !",
      "Ça se joue serré, la partie continue."
    ],
    allWrong: [
      "Question piège ! Personne n'a trouvé la bonne réponse.",
      "Personne n'est tombé juste, quelle question redoutable !",
      "Aïe, tout le monde s'est trompé sur ce coup-là !"
    ],
    closeFinish: [
      "Plus que {n} question(s)… tout peut encore basculer !",
      "Attention, il ne reste que {n} question(s) et tout reste possible !",
      "Rien n'est joué, {n} question(s) suffisent à tout changer !"
    ],
    finalists: [
      "Et voici nos deux finalistes : {a} et {b} ! La grande finale va commencer.",
      "Place à la finale ! {a} affronte {b} pour le titre de champion."
    ],
    finalIntro: [
      "Bienvenue dans la grande finale de BuzzArena ! Six questions vont désigner le champion.",
      "La tension monte : six questions décisives pour couronner un champion."
    ],
    championBuild: [
      "🥁 Le suspense est à son comble…",
      "🥁 Silence… l'heure de vérité a sonné.",
      "🥁 Plus une seconde à perdre, le verdict approche…"
    ],
    championReveal: [
      "Et notre champion est…",
      "Le titre revient à…",
      "Après cette bataille, le grand vainqueur est…"
    ]
  };

  function hashSeed(str) { let h = 0; str = String(str); for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; } return h; }
  function pick(key, seed) { const arr = TPL[key] || ['…']; return arr[hashSeed(seed) % arr.length]; }
  function fmt(str, map) { return str.replace(/\{(\w+)\}/g, (_, k) => (map && map[k] !== undefined) ? map[k] : ''); }
  function line(key, seed, map) { return fmt(pick(key, seed), map); }

  // ---------- Bandeau + voix ----------
  let bannerTimeout = null, voices = [], frenchVoice = null;
  function loadVoices() { voices = ('speechSynthesis' in window) ? speechSynthesis.getVoices() : []; frenchVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('fr')) || null; }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

  function els() { return { banner: document.getElementById('presenterBanner'), text: document.getElementById('presenterText') }; }

  function say(text, opts = {}) {
    if (!enabled || !text) return;
    const { banner, text: textEl } = els();
    if (banner && textEl) {
      textEl.textContent = text;
      banner.classList.remove('hidden');
      requestAnimationFrame(() => banner.classList.add('show'));
      clearTimeout(bannerTimeout);
      const holdMs = opts.holdMs || Math.max(2600, text.length * 75);
      bannerTimeout = setTimeout(() => banner.classList.remove('show'), holdMs);
    }
    if (soundOn && 'speechSynthesis' in window) {
      try {
        speechSynthesis.cancel();
        const clean = text.replace(/[🎙️🏆⚡🎉🥁]/gu, '').trim();
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = 'fr-FR'; if (frenchVoice) u.voice = frenchVoice;
        u.rate = opts.rate || 1.03; u.pitch = opts.pitch || 1;
        speechSynthesis.speak(u);
      } catch { /* voix indisponible, le bandeau suffit */ }
    }
  }

  // ---------- Effets sonores synthétisés (aucun fichier externe requis) ----------
  let audioCtx = null;
  function ctx() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {}); return audioCtx; }
  function noiseBuffer(c, duration) { const buf = c.createBuffer(1, Math.max(1, c.sampleRate * duration), c.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return buf; }

  function drumHit(c, time, gainVal) {
    const src = c.createBufferSource(); src.buffer = noiseBuffer(c, 0.07);
    const filter = c.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 170 + Math.random() * 50;
    const gain = c.createGain(); gain.gain.setValueAtTime(gainVal, time); gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    src.connect(filter).connect(gain).connect(c.destination); src.start(time); src.stop(time + 0.1);
  }
  function crashHit(c, time) {
    const src = c.createBufferSource(); src.buffer = noiseBuffer(c, 0.6);
    const filter = c.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 2600;
    const gain = c.createGain(); gain.gain.setValueAtTime(0.35, time); gain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);
    src.connect(filter).connect(gain).connect(c.destination); src.start(time); src.stop(time + 0.6);
  }
  function drumroll(totalMs = 1600) {
    if (!enabled || !soundOn) return;
    try {
      const c = ctx(); let t = c.currentTime + 0.05; const end = t + totalMs / 1000; let interval = 0.1;
      while (t < end) { drumHit(c, t, 0.3); t += interval; interval = Math.max(0.028, interval * 0.93); }
      crashHit(c, end + 0.03);
    } catch { /* audio indisponible */ }
  }
  function suspense(durationMs = 2200) {
    if (!enabled || !soundOn) return;
    try {
      const c = ctx(); const t0 = c.currentTime + 0.03; const dur = durationMs / 1000;
      const osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(105, t0); osc.frequency.linearRampToValueAtTime(185, t0 + dur);
      const lfo = c.createOscillator(); lfo.frequency.value = 6.2; const lfoGain = c.createGain(); lfoGain.gain.value = 0.16;
      const gain = c.createGain(); gain.gain.setValueAtTime(0.0001, t0); gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.3);
      gain.gain.setValueAtTime(0.22, t0 + dur - 0.3); gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      lfo.connect(lfoGain); lfoGain.connect(gain.gain); osc.connect(gain).connect(c.destination);
      lfo.start(t0); osc.start(t0); osc.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
    } catch { /* audio indisponible */ }
  }

  // ---------- Confettis ----------
  function confettiBurst(durationMs = 2800) {
    if (!enabled) return;
    const canvas = document.getElementById('confettiCanvas'); if (!canvas) return;
    canvas.classList.remove('hidden');
    const g = canvas.getContext('2d');
    canvas.width = innerWidth; canvas.height = innerHeight;
    const colors = ['#7c5cff', '#22d3ee', '#ff2d8d', '#ff9f1c', '#73d13d', '#ffd166'];
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width, y: -20 - Math.random() * canvas.height * 0.4,
      r: 4 + Math.random() * 5, c: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 3.2, vx: -1.6 + Math.random() * 3.2, rot: Math.random() * 360, vr: -7 + Math.random() * 14
    }));
    let start = null;
    function frame(ts) {
      if (!start) start = ts; const elapsed = ts - start;
      g.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot * Math.PI / 180);
        g.fillStyle = p.c; g.fillRect(-p.r / 2, -p.r * 0.8, p.r, p.r * 1.6);
        g.restore();
      });
      if (elapsed < durationMs) requestAnimationFrame(frame);
      else { g.clearRect(0, 0, canvas.width, canvas.height); canvas.classList.add('hidden'); }
    }
    requestAnimationFrame(frame);
  }

  // ---------- Réglages ----------
  function setEnabled(v) { enabled = !!v; localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0'); if (!enabled) { const { banner } = els(); banner && banner.classList.remove('show'); if ('speechSynthesis' in window) speechSynthesis.cancel(); } }
  function isEnabled() { return enabled; }
  function setSoundEnabled(v) { soundOn = !!v; if (!soundOn && 'speechSynthesis' in window) speechSynthesis.cancel(); }
  function setHooks(h) { hooks = Object.assign(hooks, h); }
  function fanfare() { if (hooks.fanfare) hooks.fanfare(); }
  function victory() { if (hooks.victory) hooks.victory(); }

  return { say, line, drumroll, suspense, confettiBurst, setEnabled, isEnabled, setSoundEnabled, setHooks, fanfare, victory };
})();
