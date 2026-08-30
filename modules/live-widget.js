// ====== LIVE TEACHING MODE — FLOATING WIDGET (mood check, breathing, timer, noise meter) ======

// 14. Mood Check & Focus Breather
window.moodCounts = { happy: 0, normal: 0, sleepy: 0, excited: 0 };
window.openPrepModal = function() {
  const modal = document.getElementById('live-prep-modal');
  if (!modal) return;

  // Reset Mood counts & view
  window.moodCounts = { happy: 0, normal: 0, sleepy: 0, excited: 0 };
  window.updateMoodStatsUI();
  window.stopBreathingAnimation();

  modal.classList.add('open');
  window.switchPrepTab('mood');
};

window.switchPrepTab = function(tab) {
  const btnMood = document.getElementById('prep-tab-mood');
  const btnBreath = document.getElementById('prep-tab-breath');
  const bodyMood = document.getElementById('prep-body-mood');
  const bodyBreath = document.getElementById('prep-body-breath');

  if (tab === 'mood') {
    btnMood?.classList.add('active');
    btnBreath?.classList.remove('active');
    if (bodyMood) bodyMood.style.display = '';
    if (bodyBreath) bodyBreath.style.display = 'none';
    window.stopBreathingAnimation();
  } else {
    btnMood?.classList.remove('active');
    btnBreath?.classList.add('active');
    if (bodyMood) bodyMood.style.display = 'none';
    if (bodyBreath) bodyBreath.style.display = '';
  }
};

window.logMood = function(mood) {
  if (window.moodCounts[mood] !== undefined) {
    window.moodCounts[mood]++;
    window.playLiveSound('tick');
    window.updateMoodStatsUI();
  }
};

window.updateMoodStatsUI = function() {
  const total = window.moodCounts.happy + window.moodCounts.normal + window.moodCounts.sleepy + window.moodCounts.excited;
  
  const list = ['happy', 'normal', 'sleepy', 'excited'];
  list.forEach(m => {
    const count = window.moodCounts[m];
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    
    const countEl = document.getElementById(`mood-count-${m}`);
    if (countEl) countEl.textContent = count;

    const barEl = document.getElementById(`mood-bar-${m}`);
    if (barEl) barEl.style.height = `${Math.max(5, pct)}%`;
  });
};

window.breathingTimer = null;
window.breathingState = 0; // 0=Inhale, 1=Hold, 2=Exhale
window.startBreathingAnimation = function() {
  window.stopBreathingAnimation();
  
  const circle = document.getElementById('breathing-circle');
  const text = document.getElementById('breathing-instruction');
  const btn = document.getElementById('breathing-control-btn');
  if (!circle || !text) return;

  btn.textContent = "⏹️ หยุดฝึกสมาธิ";
  btn.onclick = window.stopBreathingAnimation;

  let step = 0; // 0 to 11 (4s inhale, 4s hold, 4s exhale)
  
  function breathCycle() {
    if (step >= 12) step = 0;
    
    if (step < 4) {
      // Inhale
      circle.style.transform = `scale(${1.0 + (step + 1) * 0.2})`;
      circle.style.backgroundColor = 'var(--teal)';
      text.textContent = `หายใจเข้าลึกๆ... (${4 - step})`;
    } else if (step < 8) {
      // Hold
      circle.style.transform = `scale(1.8)`;
      circle.style.backgroundColor = 'var(--accent)';
      text.textContent = `กลั้นหายใจไว้... (${8 - step})`;
    } else {
      // Exhale
      circle.style.transform = `scale(${1.8 - (step - 7) * 0.2})`;
      circle.style.backgroundColor = 'var(--green)';
      text.textContent = `ค่อยๆ ผ่อนลมหายใจออก... (${12 - step})`;
    }
    
    if (step % 4 === 0) {
      window.playLiveSound('bell');
    }
    
    step++;
  }

  breathCycle();
  window.breathingTimer = setInterval(breathCycle, 1000);
};

window.stopBreathingAnimation = function() {
  if (window.breathingTimer) {
    clearInterval(window.breathingTimer);
    window.breathingTimer = null;
  }
  const circle = document.getElementById('breathing-circle');
  const text = document.getElementById('breathing-instruction');
  const btn = document.getElementById('breathing-control-btn');

  if (circle) circle.style.transform = 'scale(1.0)';
  if (circle) circle.style.backgroundColor = 'var(--teal-light)';
  if (text) text.textContent = 'เตรียมตัวทำสมาธิ หายใจเข้าออก';
  if (btn) {
    btn.textContent = "▶️ เริ่มฝึกสมาธิ (1 นาที)";
    btn.onclick = window.startBreathingAnimation;
  }
};

// 15. Draggable Floating Widget
window.toggleLiveTimer = function() {
  const widget = document.getElementById('live-floating-widget');
  if (!widget) return;

  if (widget.style.display === 'none' || !widget.style.display) {
    widget.style.display = 'block';
    // Make draggable
    window.makeElementDraggable(widget);
  } else {
    widget.style.display = 'none';
    // Clean up mic if active
    const micCheck = document.getElementById('noise-meter-toggle');
    if (micCheck && micCheck.checked) {
      micCheck.checked = false;
      window.toggleNoiseMeter();
    }
  }
};

window.makeElementDraggable = function(elm) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = document.getElementById(elm.id + "-header");
  
  if (header) {
    header.onmousedown = dragMouseDown;
    header.ontouchstart = dragTouchStart;
  } else {
    elm.onmousedown = dragMouseDown;
    elm.ontouchstart = dragTouchStart;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function dragTouchStart(e) {
    e = e || window.event;
    if (e.touches.length > 0) {
      pos3 = e.touches[0].clientX;
      pos4 = e.touches[0].clientY;
      document.ontouchend = closeDragElement;
      document.ontouchmove = elementTouchDrag;
    }
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    let newTop = elm.offsetTop - pos2;
    let newLeft = elm.offsetLeft - pos1;
    
    // Bound checks
    if (newTop < 0) newTop = 0;
    if (newLeft < 0) newLeft = 0;
    if (newTop + elm.clientHeight > window.innerHeight) newTop = window.innerHeight - elm.clientHeight;
    if (newLeft + elm.clientWidth > window.innerWidth) newLeft = window.innerWidth - elm.clientWidth;

    elm.style.top = newTop + "px";
    elm.style.left = newLeft + "px";
    elm.style.bottom = "auto";
    elm.style.right = "auto";
  }

  function elementTouchDrag(e) {
    e = e || window.event;
    if (e.touches.length > 0) {
      pos1 = pos3 - e.touches[0].clientX;
      pos2 = pos4 - e.touches[0].clientY;
      pos3 = e.touches[0].clientX;
      pos4 = e.touches[0].clientY;

      let newTop = elm.offsetTop - pos2;
      let newLeft = elm.offsetLeft - pos1;

      if (newTop < 0) newTop = 0;
      if (newLeft < 0) newLeft = 0;
      if (newTop + elm.clientHeight > window.innerHeight) newTop = window.innerHeight - elm.clientHeight;
      if (newLeft + elm.clientWidth > window.innerWidth) newLeft = window.innerWidth - elm.clientWidth;

      elm.style.top = newTop + "px";
      elm.style.left = newLeft + "px";
      elm.style.bottom = "auto";
      elm.style.right = "auto";
    }
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    document.ontouchend = null;
    document.ontouchmove = null;
  }
};

window.setTimerMode = function(mode) {
  window.liveTimerMode = mode;
  const btnCountdown = document.getElementById('timer-mode-countdown');
  const btnStopwatch = document.getElementById('timer-mode-stopwatch');
  const presets = document.getElementById('timer-presets');
  
  if (mode === 'countdown') {
    btnCountdown.style.background = 'var(--accent-light)';
    btnCountdown.style.color = 'var(--accent)';
    btnCountdown.style.borderColor = 'transparent';
    btnStopwatch.style.background = 'transparent';
    btnStopwatch.style.color = 'var(--text2)';
    btnStopwatch.style.borderColor = 'var(--border)';
    if (presets) presets.style.display = 'grid';
    window.liveTimerTime = 60; // 1 min default
  } else {
    btnStopwatch.style.background = 'var(--accent-light)';
    btnStopwatch.style.color = 'var(--accent)';
    btnStopwatch.style.borderColor = 'transparent';
    btnCountdown.style.background = 'transparent';
    btnCountdown.style.color = 'var(--text2)';
    btnCountdown.style.borderColor = 'var(--border)';
    if (presets) presets.style.display = 'none';
    window.liveTimerTime = 0;
  }
  window.updateTimerDisplay();
  window.resetTimer();
};

window.setTimerPreset = function(seconds) {
  if (window.liveTimerRunning) return;
  window.liveTimerTime = seconds;
  window.updateTimerDisplay();
};

window.updateTimerDisplay = function() {
  const display = document.getElementById('timer-display');
  if (!display) return;
  
  const m = Math.floor(window.liveTimerTime / 60);
  const s = window.liveTimerTime % 60;
  display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

window.startTimer = function() {
  const btn = document.getElementById('timer-btn-start');
  if (!btn) return;

  if (window.liveTimerRunning) {
    // Pause
    window.liveTimerRunning = false;
    clearInterval(window.liveTimerInterval);
    btn.textContent = "เริ่มต่อ";
    btn.style.background = 'var(--accent)';
  } else {
    // Start
    window.liveTimerRunning = true;
    btn.textContent = "หยุดชั่วคราว";
    btn.style.background = 'var(--red)';
    
    window.liveTimerInterval = setInterval(() => {
      if (window.liveTimerMode === 'countdown') {
        if (window.liveTimerTime > 0) {
          window.liveTimerTime--;
          window.updateTimerDisplay();
        } else {
          // Time's up!
          clearInterval(window.liveTimerInterval);
          window.liveTimerRunning = false;
          btn.textContent = "เริ่ม";
          btn.style.background = 'var(--accent)';
          window.playLiveSound('bell');
          window.toast('⏰ หมดเวลาทำกิจกรรมแล้วครับ!');
        }
      } else {
        // Stopwatch count up
        window.liveTimerTime++;
        window.updateTimerDisplay();
      }
    }, 1000);
  }
};

window.resetTimer = function() {
  window.liveTimerRunning = false;
  clearInterval(window.liveTimerInterval);
  const btn = document.getElementById('timer-btn-start');
  if (btn) {
    btn.textContent = "เริ่ม";
    btn.style.background = 'var(--accent)';
  }
  if (window.liveTimerMode === 'countdown') {
    window.liveTimerTime = 60;
  } else {
    window.liveTimerTime = 0;
  }
  window.updateTimerDisplay();
};

// 16. Audio Noise Meter Setup
window.toggleNoiseMeter = function() {
  const checkbox = document.getElementById('noise-meter-toggle');
  const indicator = document.getElementById('noise-meter-bar');
  const valText = document.getElementById('noise-meter-val');
  
  if (!checkbox) return;
  
  if (checkbox.checked) {
    // Request microphone stream
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        window.liveAudioStream = stream;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        window.liveAudioContext = new AudioContext();
        const source = window.liveAudioContext.createMediaStreamSource(stream);
        window.liveAnalyser = window.liveAudioContext.createAnalyser();
        window.liveAnalyser.fftSize = 128; // Small fftSize for fast, real-time volume detection
        source.connect(window.liveAnalyser);
        
        window.isNoiseMeterOn = true;
        const bufferLength = window.liveAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let overThresholdCount = 0;
        
        window.liveNoiseMeterInterval = setInterval(() => {
          if (!window.isNoiseMeterOn) return;
          window.liveAnalyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          // Scale it so that standard speech matches around 50-70%
          const percent = Math.min(100, Math.round((average / 100) * 100));
          
          if (indicator) {
            indicator.style.width = percent + '%';
            
            const thresholdInput = document.getElementById('noise-threshold-input');
            const threshold = parseInt(thresholdInput ? thresholdInput.value : '60');
            
            if (percent > threshold) {
              indicator.style.backgroundColor = '#ef4444'; // Red
              overThresholdCount++;
              if (overThresholdCount > 15) { // ~1.5s
                window.playLiveSound('buzzer');
                window.toast('⚠️ เสียงดังเกินไปแล้วครับเด็กๆ!');
                overThresholdCount = 0;
              }
            } else {
              indicator.style.backgroundColor = '#10b981'; // Green
              if (overThresholdCount > 0) overThresholdCount--;
            }
          }
          if (valText) valText.textContent = percent + '%';
        }, 100);
      })
      .catch(err => {
        console.error("Mic access denied:", err);
        window.toast("❌ กรุณาอนุญาตสิทธิ์เข้าถึงไมค์บนบราวเซอร์");
        checkbox.checked = false;
      });
  } else {
    // Shut down mic stream and interval
    window.isNoiseMeterOn = false;
    if (window.liveNoiseMeterInterval) {
      clearInterval(window.liveNoiseMeterInterval);
      window.liveNoiseMeterInterval = null;
    }
    if (window.liveAudioStream) {
      window.liveAudioStream.getTracks().forEach(track => track.stop());
      window.liveAudioStream = null;
    }
    if (window.liveAudioContext) {
      window.liveAudioContext.close();
      window.liveAudioContext = null;
    }
    if (indicator) {
      indicator.style.width = '0%';
      indicator.style.backgroundColor = '#10b981';
    }
    if (valText) valText.textContent = '0%';
  }
};
