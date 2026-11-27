(() => {
  "use strict";

  /* =========================================================
     RETRO 8-BIT WEB AUDIO SYNTHESIZER (WITH MUTE TOGGLE)
     ========================================================= */
  class RetroAudio {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    ensureContext() {
      if (this.muted) return null;
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    tone(freq, duration = 0.1, type = "square", volume = 0.12, delay = 0) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    playBleep() {
      this.tone(660, 0.07, "square", 0.09);
      this.tone(880, 0.08, "square", 0.09, 0.05);
    }

    playBuzzer() {
      this.tone(210, 0.14, "sawtooth", 0.12);
      this.tone(145, 0.24, "sawtooth", 0.12, 0.12);
    }

    playUnlock() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => this.tone(n, 0.12, "square", 0.11, idx * 0.08));
    }

    playWhoosh() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const bufferSize = ctx.sampleRate * 0.22;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(900, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    }

    playBirthdayFanfare() {
      // Upbeat 8-bit Happy Birthday phrase
      const melody = [
        [392, 0.14], [392, 0.14], [440, 0.25], [392, 0.25], [523.25, 0.25], [493.88, 0.42],
        [392, 0.14], [392, 0.14], [440, 0.25], [392, 0.25], [587.33, 0.25], [523.25, 0.45],
      ];
      let t = 0;
      melody.forEach(([freq, dur]) => {
        this.tone(freq, dur * 0.9, "square", 0.1, t);
        t += dur;
      });
    }

    playTick() {
      this.tone(950, 0.03, "triangle", 0.08);
    }

    playWin() {
      const notes = [523.25, 659.25, 783.99, 659.25, 1046.5];
      notes.forEach((n, idx) => this.tone(n, 0.14, "square", 0.11, idx * 0.09));
    }

    playShutter() {
      this.tone(1200, 0.03, "triangle", 0.09);
      this.tone(420, 0.05, "sine", 0.08, 0.03);
    }

    playStamp() {
      this.tone(110, 0.18, "triangle", 0.24);
      this.tone(880, 0.15, "square", 0.09, 0.14);
      this.tone(1174.66, 0.22, "square", 0.1, 0.24);
    }
  }

  const sfx = new RetroAudio();

  /* =========================================================
     CONFETTI ENGINE
     ========================================================= */
  const confettiCanvas = document.getElementById("confetti-canvas");
  const cCtx = confettiCanvas.getContext("2d");
  let particles = [];
  let confettiAnimId = null;

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeConfetti);
  resizeConfetti();

  function launchConfetti(count = 110, originX = 0.5, originY = 0.45) {
    const colors = ["#FFE600", "#FF2E93", "#00F0FF", "#39FF6A", "#FF7A00", "#FFFFFF"];
    const ox = confettiCanvas.width * originX;
    const oy = confettiCanvas.height * originY;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 11;
      particles.push({
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 14,
        life: 0,
        maxLife: 85 + Math.random() * 55,
      });
    }

    if (!confettiAnimId) animateConfetti();
  }

  function animateConfetti() {
    cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    particles = particles.filter((p) => p.life < p.maxLife);

    for (const p of particles) {
      p.life++;
      p.vy += 0.26; // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vRot;

      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      cCtx.save();
      cCtx.globalAlpha = alpha;
      cCtx.translate(p.x, p.y);
      cCtx.rotate((p.rot * Math.PI) / 180);
      cCtx.fillStyle = p.color;
      cCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      cCtx.restore();
    }

    if (particles.length > 0) {
      confettiAnimId = requestAnimationFrame(animateConfetti);
    } else {
      confettiAnimId = null;
    }
  }

  /* =========================================================
     SHARED HYPE SCORE & MUTE SYNC
     ========================================================= */
  let hypeScore = 100;
  const hypeEl = document.getElementById("hype-score");
  const muteBtn = document.getElementById("mute-btn");
  const vaultMuteBtn = document.getElementById("vault-mute-btn");

  function addHype(points) {
    hypeScore += points;
    hypeEl.textContent = String(hypeScore);
  }

  function syncMuteUI() {
    if (sfx.muted) {
      muteBtn.textContent = "🔇 MUTED";
      muteBtn.classList.add("muted");
      vaultMuteBtn.textContent = "🔇 SFX: OFF";
    } else {
      muteBtn.textContent = "🔊 ON";
      muteBtn.classList.remove("muted");
      vaultMuteBtn.textContent = "🔊 SFX: ON";
    }
  }

  function toggleMute() {
    sfx.muted = !sfx.muted;
    syncMuteUI();
    if (!sfx.muted) sfx.playBleep();
  }

  muteBtn.addEventListener("click", toggleMute);
  vaultMuteBtn.addEventListener("click", toggleMute);

  /* =========================================================
     1. TOP SECRET BIRTHDAY VAULT (RIDDLES & UNLOCK)
     ========================================================= */
  const RIDDLES = [
    {
      question:
        "Riddle 1: Raised in the hills where the momos hit different, spits Hindi + English bars faster than 5G... Where is Vichaar's official 'Ilaaka'?",
      hint: "Hint: Famous valley in Uttarakhand — rhymes with 'Ilaaka Doon City'!",
      options: [
        { label: "A) Mumbai Local Train", correct: false, roast: "Wrong track! Even fast flows can't beat Virar local rush." },
        { label: "B) Ilaaka Doon City (Dehradun)", correct: true, reply: "LOCKED & VERIFIED! Dehradun represent!" },
        { label: "C) Mars Colony Sector-4", correct: false, roast: "His verses are out of this world, yes, wrong zip code though!" },
        { label: "D) Goa Beach Shack", correct: false, roast: "Too chill! Think misty hills + unstoppable punchlines." },
      ],
    },
    {
      question:
        "Riddle 2: What happens the exact millisecond a beat drops near Vichaar?",
      hint: "Hint: Think bilingual lyricism at supersonic speed!",
      options: [
        { label: "A) Instant 10-hour power nap", correct: false, roast: "Nope—only *after* dropping 3 back-to-back verses!" },
        { label: "B) Rapid-fire Hindi-English wordplay", correct: true, reply: "ACCESS GRANTED! Welcome to the Birthday Arcade!" },
        { label: "C) He opens an Excel spreadsheet", correct: false, roast: "VLOOKUP does NOT have double entendres like Vichaar!" },
        { label: "D) He rides off on a horse in a red coat", correct: false, roast: "Wait—he actually *did* pose beside a horse in a red coat, but pick his rap superpower!" },
      ],
    },
  ];

  let currentRiddleIdx = 0;
  const vaultScreen = document.getElementById("vault-screen");
  const vaultCard = vaultScreen.querySelector(".vault-card");
  const partyApp = document.getElementById("party-app");
  const riddleQuestionEl = document.getElementById("riddle-question");
  const riddleOptionsEl = document.getElementById("riddle-options");
  const vaultFeedbackEl = document.getElementById("vault-feedback");
  const vaultStepLabel = document.getElementById("vault-step-label");
  const padlockIcon = document.getElementById("padlock-icon");
  const pill1 = document.getElementById("pill-1");
  const pill2 = document.getElementById("pill-2");

  function renderRiddle() {
    const r = RIDDLES[currentRiddleIdx];
    vaultStepLabel.textContent = `RIDDLE ${currentRiddleIdx + 1} OF ${RIDDLES.length}`;
    pill1.className = currentRiddleIdx === 0 ? "pill active" : "pill done";
    pill2.className = currentRiddleIdx === 1 ? "pill active" : "pill";

    riddleQuestionEl.textContent = r.question;
    riddleOptionsEl.innerHTML = "";
    vaultFeedbackEl.textContent = "";
    vaultFeedbackEl.classList.remove("success");

    r.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => handleRiddleChoice(btn, opt));
      riddleOptionsEl.appendChild(btn);
    });
  }

  function handleRiddleChoice(btn, opt) {
    if (!opt.correct) {
      sfx.playBuzzer();
      btn.classList.add("wrong");
      vaultCard.classList.remove("shake");
      void vaultCard.offsetWidth;
      vaultCard.classList.add("shake");
      vaultFeedbackEl.classList.remove("success");
      vaultFeedbackEl.textContent = `❌ ${opt.roast}`;
      return;
    }

    btn.classList.add("correct");
    vaultFeedbackEl.classList.add("success");
    vaultFeedbackEl.textContent = `✅ ${opt.reply}`;
    addHype(50);

    // Disable options briefly during transition
    [...riddleOptionsEl.querySelectorAll("button")].forEach((b) => (b.disabled = true));

    if (currentRiddleIdx < RIDDLES.length - 1) {
      sfx.playBleep();
      setTimeout(() => {
        currentRiddleIdx++;
        renderRiddle();
      }, 850);
    } else {
      sfx.playUnlock();
      padlockIcon.textContent = "🔓";
      pill2.className = "pill done";
      launchConfetti(140, 0.5, 0.4);
      setTimeout(unlockPartySite, 900);
    }
  }

  function unlockPartySite() {
    vaultScreen.classList.add("hidden");
    partyApp.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "instant" });
    drawWheel();
    launchConfetti(100, 0.5, 0.25);
  }

  document.getElementById("vault-hint-btn").addEventListener("click", () => {
    sfx.playBleep();
    vaultFeedbackEl.classList.remove("success");
    vaultFeedbackEl.textContent = `💡 ${RIDDLES[currentRiddleIdx].hint}`;
  });

  document.getElementById("relock-btn").addEventListener("click", () => {
    sfx.playBleep();
    currentRiddleIdx = 0;
    padlockIcon.textContent = "🔒";
    partyApp.classList.add("hidden");
    vaultScreen.classList.remove("hidden");
    renderRiddle();
  });

  document.getElementById("confetti-btn").addEventListener("click", () => {
    sfx.playWin();
    launchConfetti(120, 0.5, 0.35);
    addHype(10);
  });

  renderRiddle();

  /* =========================================================
     2. INTERACTIVE CAKE (CLICK OR BLOW INTO MIC)
     ========================================================= */
  const candles = [...document.querySelectorAll(".candle")];
  const wishBanner = document.getElementById("wish-banner");
  const relightBtn = document.getElementById("relight-btn");
  const blowClickBtn = document.getElementById("blow-click-btn");
  const enableMicBtn = document.getElementById("enable-mic-btn");
  const micStatusText = document.getElementById("mic-status-text");
  const micMeterFill = document.getElementById("mic-meter-fill");

  let micStream = null;
  let micRaf = null;
  let celebrationFired = false;

  function litCandles() {
    return candles.filter((c) => !c.classList.contains("out"));
  }

  function extinguishCandle(candleEl) {
    if (!candleEl || candleEl.classList.contains("out")) return;
    candleEl.classList.remove("windy");
    candleEl.classList.add("out");
    sfx.playWhoosh();
    addHype(20);

    if (litCandles().length === 0 && !celebrationFired) {
      celebrationFired = true;
      wishBanner.classList.remove("hidden");
      relightBtn.classList.remove("hidden");
      blowClickBtn.classList.add("hidden");
      sfx.playBirthdayFanfare();
      launchConfetti(170, 0.5, 0.45);
      addHype(100);
      stopMicMonitor();
    }
  }

  candles.forEach((candle) => {
    candle.addEventListener("click", () => extinguishCandle(candle));
  });

  blowClickBtn.addEventListener("click", () => {
    const remaining = litCandles();
    if (remaining.length > 0) {
      // Blow out next lit candle
      extinguishCandle(remaining[0]);
    }
  });

  relightBtn.addEventListener("click", () => {
    sfx.playBleep();
    celebrationFired = false;
    candles.forEach((c) => c.classList.remove("out", "windy"));
    wishBanner.classList.add("hidden");
    relightBtn.classList.add("hidden");
    blowClickBtn.classList.remove("hidden");
  });

  function stopMicMonitor() {
    if (micRaf) {
      cancelAnimationFrame(micRaf);
      micRaf = null;
    }
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
    micMeterFill.style.width = "0%";
    enableMicBtn.textContent = "🎤 BLOW WITH MIC";
    micStatusText.textContent = celebrationFired ? "CANDLES BLOWN!" : "MIC: STANDBY";
  }

  enableMicBtn.addEventListener("click", async () => {
    if (micStream) {
      stopMicMonitor();
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      micStatusText.textContent = "MIC UNAVAILABLE — USE TAP!";
      return;
    }
    try {
      sfx.ensureContext();
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const micCtx = new AudioCtx();
      const source = micCtx.createMediaStreamSource(micStream);
      const analyser = micCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      let blowCooldown = 0;
      enableMicBtn.textContent = "🛑 STOP MIC";
      micStatusText.textContent = "BLOW INTO MIC NOW!";

      const tickMic = () => {
        if (!micStream) return;
        analyser.getByteFrequencyData(data);
        // Average amplitude across lower-mid frequencies where breath noise sits
        let sum = 0;
        const bins = Math.min(36, data.length);
        for (let i = 0; i < bins; i++) sum += data[i];
        const avg = sum / bins;
        const pct = Math.min(100, Math.round((avg / 110) * 100));
        micMeterFill.style.width = `${pct}%`;

        const remaining = litCandles();
        if (pct > 32) {
          remaining.forEach((c) => c.classList.add("windy"));
        } else {
          remaining.forEach((c) => c.classList.remove("windy"));
        }

        if (pct > 54 && blowCooldown <= 0 && remaining.length > 0) {
          extinguishCandle(remaining[0]);
          blowCooldown = 14; // ~230ms spacing so each candle pops cleanly
        }
        if (blowCooldown > 0) blowCooldown--;

        micRaf = requestAnimationFrame(tickMic);
      };

      tickMic();
    } catch {
      micStatusText.textContent = "MIC BLOCKED — CLICK CANDLES!";
    }
  });

  /* =========================================================
     3. SPIN THE BIRTHDAY WHEEL MINI-GAME
     ========================================================= */
  const WHEEL_SLICES = [
    {
      short: "FREESTYLE DARE",
      type: "🎤 DARE",
      tagClass: "tag-pink",
      color: "#FF2E93",
      textColor: "#FFFFFF",
      title: "8-Bar Doon Birthday Freestyle!",
      desc: "Drop an instant 8-bar Hindi-English freestyle right now including the words: 'Momos', 'Birthday', and 'Doon City'!",
    },
    {
      short: "FREE MOMOS",
      type: "🥟 COUPON",
      tagClass: "tag-yellow",
      color: "#FFE600",
      textColor: "#120628",
      title: "VIP Dehradun Momos Coupon!",
      desc: "Redeemable for 1 full plate of steaming momos + fiery red chutney. Zero excuses, 100% birthday privileges.",
    },
    {
      short: "SHADES ROAST",
      type: "🕶️ ROAST",
      tagClass: "tag-cyan",
      color: "#00F0FF",
      textColor: "#120628",
      title: "Indoors Sunglasses Immunity",
      desc: "Roast/Pass: You wear sunglasses indoors like it's always golden hour—today, nobody is allowed to question the drip!",
    },
    {
      short: "STUDIO PASS",
      type: "🎧 COUPON",
      tagClass: "tag-lime",
      color: "#39FF6A",
      textColor: "#120628",
      title: "Do-Not-Disturb Studio Voucher",
      desc: "Valid for 1 uninterrupted late-night writing & recording session—snacks delivered, zero distractions.",
    },
    {
      short: "DOON TOAST",
      type: "🥂 TOAST",
      tagClass: "tag-pink",
      color: "#FF7A00",
      textColor: "#FFFFFF",
      title: "Raise a Glass to Ilaaka Doon City!",
      desc: "Toast: Everyone around you has to yell 'ILAAKA DOON CITY!' and hype up your fastest verse of the year!",
    },
    {
      short: "HORSE POSE",
      type: "🐎 DARE",
      tagClass: "tag-yellow",
      color: "#9B5DE5",
      textColor: "#FFFFFF",
      title: "Red Coat Equestrian Pose Dare!",
      desc: "Dare: Recreate your iconic dramatic sunglasses-next-to-a-horse face for a mandatory birthday selfie right now.",
    },
    {
      short: "LYRIC BRAIN",
      type: "🧠 ROAST",
      tagClass: "tag-cyan",
      color: "#F15BB5",
      textColor: "#FFFFFF",
      title: "Mid-Convo Rhyme Freeze Pass",
      desc: "Roast: We know when you zone out mid-sentence you're actually stacking internal rhymes. 1 free pass granted!",
    },
    {
      short: "DOUBLE CAKE",
      type: "🍰 COUPON",
      tagClass: "tag-lime",
      color: "#00BBF9",
      textColor: "#120628",
      title: "Birthday Cake Boss Coupon!",
      desc: "Entitles Vichaar to the biggest corner slice with extra frosting. Sharing is strictly optional.",
    },
  ];

  const wheelCanvas = document.getElementById("wheel-canvas");
  const wCtx = wheelCanvas.getContext("2d");
  const wheelPointer = document.getElementById("wheel-pointer");
  const spinBtn = document.getElementById("spin-btn");
  const resultCard = document.getElementById("wheel-result-card");
  const resultTypeBadge = document.getElementById("result-type-badge");
  const resultTitle = document.getElementById("result-title");
  const resultDesc = document.getElementById("result-desc");
  const spinCountEl = document.getElementById("spin-count");
  const lootList = document.getElementById("loot-list");

  let wheelAngle = 0; // radians
  let isSpinning = false;
  let spinCount = 0;
  const collectedLoot = [];

  function drawWheel() {
    const cx = wheelCanvas.width / 2;
    const cy = wheelCanvas.height / 2;
    const r = cx - 10;
    const sliceArc = (Math.PI * 2) / WHEEL_SLICES.length;

    wCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

    WHEEL_SLICES.forEach((slice, i) => {
      const start = wheelAngle + i * sliceArc - Math.PI / 2;
      const end = start + sliceArc;

      wCtx.beginPath();
      wCtx.moveTo(cx, cy);
      wCtx.arc(cx, cy, r, start, end);
      wCtx.closePath();
      wCtx.fillStyle = slice.color;
      wCtx.fill();
      wCtx.lineWidth = 4;
      wCtx.strokeStyle = "#120628";
      wCtx.stroke();

      // Label
      wCtx.save();
      wCtx.translate(cx, cy);
      wCtx.rotate(start + sliceArc / 2);
      wCtx.fillStyle = slice.textColor;
      wCtx.font = "bold 14px 'Bungee', sans-serif";
      wCtx.textAlign = "right";
      wCtx.textBaseline = "middle";
      wCtx.fillText(slice.short, r - 20, 0);
      wCtx.restore();
    });

    // Rim pegs
    for (let i = 0; i < WHEEL_SLICES.length; i++) {
      const pegAngle = wheelAngle + i * sliceArc - Math.PI / 2;
      const px = cx + Math.cos(pegAngle) * (r - 2);
      const py = cy + Math.sin(pegAngle) * (r - 2);
      wCtx.beginPath();
      wCtx.arc(px, py, 6, 0, Math.PI * 2);
      wCtx.fillStyle = "#FFFFFF";
      wCtx.fill();
      wCtx.lineWidth = 2.5;
      wCtx.strokeStyle = "#120628";
      wCtx.stroke();
    }

    // Center hub
    wCtx.beginPath();
    wCtx.arc(cx, cy, 34, 0, Math.PI * 2);
    wCtx.fillStyle = "#120628";
    wCtx.fill();
    wCtx.lineWidth = 4;
    wCtx.strokeStyle = "#FFE600";
    wCtx.stroke();

    wCtx.fillStyle = "#FFE600";
    wCtx.font = "bold 12px 'Press Start 2P', monospace";
    wCtx.textAlign = "center";
    wCtx.textBaseline = "middle";
    wCtx.fillText("GO!", cx, cy + 1);
  }

  spinBtn.addEventListener("click", () => {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    sfx.playBleep();

    const startAngle = wheelAngle;
    const extraSpins = 5 + Math.floor(Math.random() * 4);
    const randomOffset = Math.random() * Math.PI * 2;
    const totalDelta = extraSpins * Math.PI * 2 + randomOffset;
    const duration = 4200;
    const startTime = performance.now();
    const sliceArc = (Math.PI * 2) / WHEEL_SLICES.length;
    let lastSliceTick = Math.floor(wheelAngle / sliceArc);

    const frame = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - t, 3);
      wheelAngle = startAngle + totalDelta * ease;
      drawWheel();

      const currentTick = Math.floor(wheelAngle / sliceArc);
      if (currentTick !== lastSliceTick) {
        lastSliceTick = currentTick;
        sfx.playTick();
        wheelPointer.classList.add("kick");
        setTimeout(() => wheelPointer.classList.remove("kick"), 55);
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        isSpinning = false;
        spinBtn.disabled = false;
        finishWheelSpin();
      }
    };

    requestAnimationFrame(frame);
  });

  function finishWheelSpin() {
    const sliceArc = (Math.PI * 2) / WHEEL_SLICES.length;
    // Top pointer sits at -Math.PI/2, which matches index 0 start offset
    const normalized = ((-wheelAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const winnerIdx = Math.floor(normalized / sliceArc) % WHEEL_SLICES.length;
    const prize = WHEEL_SLICES[winnerIdx];

    spinCount++;
    spinCountEl.textContent = String(spinCount);
    addHype(75);
    sfx.playWin();
    launchConfetti(110, 0.35, 0.5);

    resultTypeBadge.className = `arcade-tag ${prize.tagClass}`;
    resultTypeBadge.textContent = prize.type;
    resultTitle.textContent = prize.title;
    resultDesc.textContent = prize.desc;

    resultCard.classList.remove("pop");
    void resultCard.offsetWidth;
    resultCard.classList.add("pop");

    if (!collectedLoot.includes(prize.title)) {
      collectedLoot.push(prize.title);
      lootList.innerHTML = collectedLoot
        .map((item) => `<li>✨ ${item}</li>`)
        .join("");
    }
  }

  /* =========================================================
     4. PHOTO / MEME GALLERY & LIGHTBOX
     ========================================================= */
  const GALLERY_ITEMS = [
    {
      src: "assets/photo-1-pink-hoodie.jpg",
      tag: "PINK HOODIE ERA",
      title: "Blazing Pitlane Squad",
      caption:
        "When the Dehradun winter hits 18°C so you casually drop a neon-pink racing hoodie + wrap shades harder than a verse.",
    },
    {
      src: "assets/photo-3-stage-bars.jpg",
      tag: "STAGE MODE",
      title: "Mid-Bar Brain Freeze",
      caption:
        "POV: The beat switches mid-performance and you're casually explaining a triple-entendre to the entire crowd.",
    },
    {
      src: "assets/photo-4-mirror-fan.jpg",
      tag: "SELF CARE KING",
      title: "Mirror + Mini Fan Combo",
      caption:
        "Dreads heavy, flow heavier—still got the tiny purple handheld fan working overtime in the middle of the jungle.",
    },
    {
      src: "assets/photo-5-red-coat-horse.jpg",
      tag: "MAIN CHARACTER",
      title: "Red Coat & A Whole Horse",
      caption:
        "Other rappers flex rented cars. Vichaar pulls up in a scarlet trench coat, white gloves, and an actual stallion.",
    },
    {
      src: "assets/photo-2-leather-flash.jpg",
      tag: "FLASH ARCHIVE",
      title: "Album Cover Loading...",
      caption:
        "Leather jacket, silver chains, film grain, and zero eye contact—certified 'bout to drop track of the year' posture.",
    },
    {
      src: "assets/photo-6-bw-stage.jpg",
      tag: "UNPLUGGED AURA",
      title: "Dreads In Motion",
      caption:
        "Black-and-white concert shot looking straight out of a hip-hop documentary called 'From Doon To Everywhere'.",
    },
    {
      src: "assets/photo-7-live-smile.jpg",
      tag: "PURE VIBES",
      title: "When The Crowd Knows The Lyrics",
      caption:
        "That exact split-second smile when every single person in the venue screams 'ILAAKA DOON CITY' back at the mic.",
    },
  ];

  const memeGrid = document.getElementById("meme-grid");
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbTag = document.getElementById("lb-tag");
  const lbTitle = document.getElementById("lb-title");
  const lbCaption = document.getElementById("lb-caption");
  let activeLbIndex = 0;

  GALLERY_ITEMS.forEach((item, idx) => {
    const card = document.createElement("article");
    card.className = "meme-card";
    card.innerHTML = `
      <button class="meme-img-btn" type="button" aria-label="Open ${item.title}">
        <img src="${item.src}" alt="${item.title}" loading="lazy" />
        <span class="meme-chip">${item.tag}</span>
      </button>
      <div class="meme-body">
        <h3 class="meme-title">${item.title}</h3>
        <p class="meme-caption">${item.caption}</p>
        <div class="meme-reactions">
          <button class="react-btn" type="button" data-kind="fire">🔥 <span>${12 + idx * 3}</span></button>
          <button class="react-btn" type="button" data-kind="lol">😂 <span>${8 + idx * 2}</span></button>
        </div>
      </div>
    `;

    card.querySelector(".meme-img-btn").addEventListener("click", () => openLightbox(idx));
    card.querySelectorAll(".react-btn").forEach((rBtn) => {
      rBtn.addEventListener("click", () => {
        sfx.playBleep();
        const span = rBtn.querySelector("span");
        span.textContent = String(Number(span.textContent) + 1);
        rBtn.classList.remove("bumped");
        void rBtn.offsetWidth;
        rBtn.classList.add("bumped");
        addHype(5);
      });
    });

    memeGrid.appendChild(card);
  });

  function openLightbox(idx) {
    activeLbIndex = idx;
    const item = GALLERY_ITEMS[idx];
    lbImg.src = item.src;
    lbImg.alt = item.title;
    lbTag.textContent = item.tag;
    lbTitle.textContent = item.title;
    lbCaption.textContent = item.caption;
    lightbox.classList.remove("hidden");
    sfx.playShutter();
  }

  document.getElementById("lb-close").addEventListener("click", () => {
    lightbox.classList.add("hidden");
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.add("hidden");
  });

  document.getElementById("lb-prev").addEventListener("click", () => {
    openLightbox((activeLbIndex - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length);
  });

  document.getElementById("lb-next").addEventListener("click", () => {
    openLightbox((activeLbIndex + 1) % GALLERY_ITEMS.length);
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape") lightbox.classList.add("hidden");
    if (e.key === "ArrowLeft") openLightbox((activeLbIndex - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length);
    if (e.key === "ArrowRight") openLightbox((activeLbIndex + 1) % GALLERY_ITEMS.length);
  });

  /* =========================================================
     5. OFFICIAL BIRTHDAY DECREE STAMP
     ========================================================= */
  const stampBtn = document.getElementById("stamp-decree-btn");
  const officialStamp = document.getElementById("official-stamp");
  let stamped = false;

  stampBtn.addEventListener("click", () => {
    sfx.playStamp();
    officialStamp.classList.remove("hidden");
    launchConfetti(180, 0.5, 0.65);

    if (!stamped) {
      stamped = true;
      addHype(150);
      stampBtn.textContent = "✅ DECREE SEALED! (POP AGAIN)";
      stampBtn.classList.remove("btn-pink");
      stampBtn.classList.add("btn-lime");
    }
  });
})();
