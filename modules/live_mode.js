// ====== LIVE TEACHING MODE MODULE ======

// Active states
window._liveRoomId = '';
window._liveSubject = '';
window._livePeriod = '1';
window.liveAudioStream = null;
window.liveAudioContext = null;
window.liveAnalyser = null;
window.liveNoiseMeterInterval = null;
window.isNoiseMeterOn = false;
window.liveTimerInterval = null;
window.liveTimerTime = 0; // seconds
window.liveTimerMode = 'countdown'; // 'countdown' or 'stopwatch'
window.liveTimerRunning = false;
window.liveGoalTarget = 100;
window.liveGoalDesc = "สะสมคะแนนในคาบเพื่อรับรางวัลใหญ่!";

// 1. Audio Synthesizer (100% Offline via Web Audio API)
window.playLiveSound = function(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'bell') {
      // Crystal clear chime bell
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6
      
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } else if (type === 'buzzer') {
      // Low, harsh buzz sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(110, ctx.currentTime);
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(113, ctx.currentTime); // detuned
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } else if (type === 'drumroll') {
      // Snare drum roll effect
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      
      // Simulate rapid roll
      for (let t = 0; t < 1.2; t += 0.05) {
        gain.gain.setValueAtTime(0.12 + 0.08 * Math.sin(t * 60), ctx.currentTime + t);
      }
      // Accent strike
      gain.gain.setValueAtTime(0.35, ctx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
      noise.stop(ctx.currentTime + 1.5);
    } else if (type === 'applause') {
      // Clapping simulator
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      
      for (let t = 0; t < 1.3; t += 0.08) {
        const rnd = Math.random() * 0.03;
        gain.gain.setValueAtTime(0.18, ctx.currentTime + t + rnd);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + t + rnd + 0.06);
      }
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
      noise.stop(ctx.currentTime + 1.5);
    } else if (type === 'success') {
      // Happy ascending arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.1 + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 0.35);
      });
    } else if (type === 'tick') {
      // Short click sound for wheel
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {
    console.error("Audio Context Error:", e);
  }
};

// 2. Main Entry Point for Rendering the Live Panel
window.renderLiveMode = function() {
  const select = document.getElementById('live-subject-select');
  if (!select) return;

  // Populate Subject + Class Dropdown
  let optionsHtml = '';
  const currentTerm = window.activeSemesterFilter || '1';
  window.rooms.forEach(room => {
    const roomSubjs = window.subjects.filter(s => 
      (!s.rooms || s.rooms.length === 0 || s.rooms.includes(room.id)) &&
      (currentTerm === 'all' || s.term === 'all' || s.term === currentTerm)
    );
    roomSubjs.forEach(subj => {
      optionsHtml += `<option value="${room.id}_${subj.name}">${subj.name} - ${room.level}/${room.section}</option>`;
    });
  });

  if (!optionsHtml) {
    optionsHtml = '<option value="">ไม่มีข้อมูลห้องเรียน/วิชา</option>';
  }
  select.innerHTML = optionsHtml;

  // Restore last selected
  const lastSelected = localStorage.getItem('live_selected_class_subj');
  if (lastSelected && select.querySelector(`option[value="${lastSelected}"]`)) {
    select.value = lastSelected;
  }

  // Load Goal config
  const storedGoalTarget = localStorage.getItem('live_goal_target');
  const storedGoalDesc = localStorage.getItem('live_goal_desc');
  if (storedGoalTarget) window.liveGoalTarget = parseInt(storedGoalTarget);
  if (storedGoalDesc) window.liveGoalDesc = storedGoalDesc;

  window.onChangeLiveClassSubject();
};

// 3. Dropdown Change Handler
window.onChangeLiveClassSubject = function() {
  const select = document.getElementById('live-subject-select');
  if (!select || !select.value) {
    document.getElementById('live-student-grid').innerHTML = 
      '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text3);">ไม่พบข้อมูลห้องเรียนหรือวิชา</div>';
    return;
  }

  const [roomId, subjectName] = select.value.split('_');
  window.currentClass = roomId;
  window._liveRoomId = roomId;
  window._liveSubject = subjectName;

  // Save selection
  localStorage.setItem('live_selected_class_subj', select.value);

  // Auto-detect period for today
  const todayDate = window.today();
  const d = new Date(todayDate + 'T00:00:00');
  const jsDay = d.getDay();
  const dayMap = { 1:1, 2:2, 3:3, 4:4, 5:5 };
  const dayNum = dayMap[jsDay];

  let period = '1';
  if (dayNum) {
    const sched = window.schedules.find(sc => sc.roomId === roomId && window.resolveSubjectName(sc.subjectId) === subjectName && +sc.day === dayNum);
    if (sched) {
      period = String(sched.period);
    }
  }
  window._livePeriod = period;

  // Update date label in Thai format
  const dateLabel = document.getElementById('live-date-label');
  if (dateLabel) {
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const thDateStr = d.getDate() + ' ' + months[d.getMonth()] + ' ' + (d.getFullYear() + 543);
    dateLabel.textContent = `วันนี้ ${thDateStr} · คาบ ${period} · แตะการ์ดเพื่อสลับสถานะ`;
  }

  // Ensure all behavior logs have unique IDs for editing/deleting
  if (window.behaviors) {
    window.behaviors.forEach(b => {
      if (!b.id) {
        b.id = 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      }
    });
  }

  // Recalculate student points dynamically from behaviors
  window.recalculateLivePoints();

  // Draw students
  window.renderLiveStudents();
  // Draw Goal Tracker
  window.renderLiveGoalTracker();
};

// 4. Clean prefix of student name
window.cleanStudentName = function(name) {
  if (!name) return '';
  return name.replace(/^(เด็กชาย|เด็กหญิง|นาย|นางสาว|ด\.ช\.|ด\.ญ\.)\s*/, '').trim();
};

// 4.1 Format Live Student Name as: Firstname (Nickname)
window.formatLiveStudentName = function(s) {
  if (!s) return '';
  const name = s.name || '';
  const cleaned = window.cleanStudentName(name);
  const firstName = cleaned.split(/\s+/)[0];
  const nick = s.nickname || (s.health && s.health !== '-' ? s.health : '');
  return firstName + (nick ? ` (${nick})` : '');
};

// 5. Render Student Cards Grid
window.renderLiveStudents = function() {
  const grid = document.getElementById('live-student-grid');
  if (!grid) return;

  const students = window.classData[window._liveRoomId] || [];
  if (!students.length) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text3);">ไม่มีนักเรียนในห้องเรียนนี้</div>';
    window.updateLiveCounters();
    return;
  }

  const date = window.today();
  const period = window._livePeriod;
  const subject = window._liveSubject;

  let html = '';
  students.forEach((s, idx) => {
    // Check if key exists in attData to see if they're checked
    const key = `${window._liveRoomId}_${s.id}_${date}_${period}_${subject}`;
    const isChecked = key in window.attData;
    const status = isChecked ? window.attData[key] : 'unchecked';

    let cardClass = 'live-student-card';
    let cardBg = 'var(--surface)';
    let cardBorder = '1.5px solid var(--border)';
    let numColor = 'var(--text3)';
    let nameColor = 'var(--text)';
    let statusTextColor = 'var(--text3)';
    let dotColor = 'transparent';

    if (status === 'P') {
      cardClass += ' status-P';
      cardBg = 'var(--green-light)';
      cardBorder = '1.5px solid var(--green)';
      numColor = 'var(--green)';
      nameColor = 'var(--green)';
      statusTextColor = 'var(--green)';
      dotColor = 'var(--green)';
    } else if (status === 'A') {
      cardClass += ' status-A';
      cardBg = 'var(--red-light)';
      cardBorder = '1.5px solid var(--red)';
      numColor = 'var(--red)';
      nameColor = 'var(--red)';
      statusTextColor = 'var(--red)';
      dotColor = 'var(--red)';
    } else if (status === 'L') {
      cardClass += ' status-L';
      cardBg = 'var(--amber-light)';
      cardBorder = '1.5px solid var(--amber)';
      numColor = 'var(--amber)';
      nameColor = 'var(--amber)';
      statusTextColor = 'var(--amber)';
      dotColor = 'var(--amber)';
    } else if (status === 'E') {
      cardClass += ' status-E';
      cardBg = 'var(--purple-light)';
      cardBorder = '1.5px solid var(--purple)';
      numColor = 'var(--purple)';
      nameColor = 'var(--purple)';
      statusTextColor = 'var(--purple)';
      dotColor = 'var(--purple)';
    }

    html += `
      <div class="${cardClass}" onclick="window.cycleLiveAttendance(${s.id})" data-student-id="${s.id}"
        style="background: ${cardBg}; border: ${cardBorder}; border-radius: 12px; padding: 16px 12px; text-align: center; cursor: pointer; transition: all 0.15s; position: relative;">
        
        <!-- Quick Award Button (+5) -->
        <button class="live-card-plus-btn" onclick="window.awardDirectLivePoint(event, ${s.id})" 
          title="ให้คะแนนตอบคำถามสด (+5 แต้ม)" 
          style="position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; border-radius: 50%; border: none; background: var(--green); color: white; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.8; transition: opacity 0.15s, transform 0.15s; box-shadow: 0 2px 4px rgba(0,0,0,0.15); z-index: 5;">
          +5
        </button>

        <div style="font-size: 11px; color: ${numColor}; margin-bottom: 4px; font-weight: 600;">เลขที่ ${s.no}</div>
        <div style="font-size: 15px; font-weight: 700; color: ${nameColor}; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${s.name}">
          ${window.formatLiveStudentName(s)}
        </div>
        <div style="font-size: 11px; color: ${statusTextColor}; margin-bottom: 8px; font-weight: 600;">
          ${status === 'unchecked' ? 'แตะเพื่อเช็ก' : status === 'P' ? 'มาเรียน' : status === 'L' ? 'มาสาย' : status === 'A' ? 'ขาดเรียน' : 'ลา/ป่วย'}
        </div>
        <div style="display: flex; justify-content: center; height: 8px;">
          ${status !== 'unchecked' ? `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${dotColor};"></span>` : ''}
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
  window.updateLiveCounters();

  // Populate main manual student dropdown select if present
  const mainManualSelect = document.getElementById('live-manual-student-select');
  if (mainManualSelect) {
    const sortedStudents = [...students].sort((a, b) => (a.no || 0) - (b.no || 0));
    let options = '<option value="">-- เลือกนักเรียน --</option>';
    sortedStudents.forEach(s => {
      options += `<option value="${s.id}">เลขที่ ${s.no} - ${window.formatLiveStudentName(s)}</option>`;
    });
    mainManualSelect.innerHTML = options;
  }
};

// 6. Cycle Attendance (Unchecked -> P -> L -> A -> E -> Unchecked)
window.cycleLiveAttendance = function(studentId) {
  const date = window.today();
  const period = window._livePeriod;
  const subject = window._liveSubject;
  const key = `${window._liveRoomId}_${studentId}_${date}_${period}_${subject}`;
  
  const currentStatus = key in window.attData ? window.attData[key] : 'unchecked';
  let nextStatus;
  
  if (currentStatus === 'unchecked') {
    nextStatus = 'P';
  } else if (currentStatus === 'P') {
    nextStatus = 'L';
  } else if (currentStatus === 'L') {
    nextStatus = 'A';
  } else if (currentStatus === 'A') {
    nextStatus = 'E';
  } else {
    nextStatus = 'unchecked';
  }

  if (nextStatus === 'unchecked') {
    delete window.attData[key];
    if (window.GS_URL) {
      window.pushAttendance(key, '', window._liveRoomId, studentId, date, period, subject);
    }
  } else {
    window.setAttStatus(studentId, date, period, subject, nextStatus, window._liveRoomId);
  }

  // Play a tiny feedback sound
  window.playLiveSound('tick');

  // Redraw
  window.renderLiveStudents();
  window.autoSaveToLocalStorage();
};

// 7. Update Stats Counters
window.updateLiveCounters = function() {
  const students = window.classData[window._liveRoomId] || [];
  const date = window.today();
  const period = window._livePeriod;
  const subject = window._liveSubject;

  let P = 0, A = 0, L = 0, E = 0;
  students.forEach(s => {
    const key = `${window._liveRoomId}_${s.id}_${date}_${period}_${subject}`;
    if (key in window.attData) {
      const status = window.attData[key];
      if (status === 'P') P++;
      else if (status === 'A') A++;
      else if (status === 'L') L++;
      else if (status === 'E') E++;
    }
  });

  window.safeSetText('live-count-P', P);
  window.safeSetText('live-count-A', A);
  window.safeSetText('live-count-L', L);
  window.safeSetText('live-count-E', E);
};

// 8. Quick Actions: Mark all Present / Check-in remaining
window.markAllLivePresent = function() {
  const students = window.classData[window._liveRoomId] || [];
  if (!students.length) return;

  const date = window.today();
  const period = window._livePeriod;
  const subject = window._liveSubject;

  students.forEach(s => {
    window.setAttStatus(s.id, date, period, subject, 'P', window._liveRoomId);
  });

  window.toast('✓ เช็กเป็นมาเรียนครบทุกคนแล้ว');
  window.renderLiveStudents();
  window.autoSaveToLocalStorage();
};

window.quickCheckinLive = function() {
  const students = window.classData[window._liveRoomId] || [];
  if (!students.length) return;

  const date = window.today();
  const period = window._livePeriod;
  const subject = window._liveSubject;
  let count = 0;

  students.forEach(s => {
    const key = `${window._liveRoomId}_${s.id}_${date}_${period}_${subject}`;
    if (!(key in window.attData)) {
      window.setAttStatus(s.id, date, period, subject, 'P', window._liveRoomId);
      count++;
    }
  });

  if (count > 0) {
    window.toast(`✓ เช็กคนที่เหลือเป็นมาเรียนสำเร็จ (+${count} คน)`);
    window.renderLiveStudents();
    window.autoSaveToLocalStorage();
  } else {
    window.toast('เช็กชื่อครบทุกคนเรียบร้อยแล้ว');
  }
};

// 9. Class Goal Tracker Logic
window.renderLiveGoalTracker = function() {
  const bar = document.getElementById('live-goal-progress-bar');
  const label = document.getElementById('live-goal-score-label');
  const desc = document.getElementById('live-goal-description');
  if (!bar || !label || !desc) return;

  // Calculate sum of positive points from all students' todayPoints
  const students = window.classData[window._liveRoomId] || [];
  const currentPoints = students.reduce((sum, s) => sum + (s.todayPoints || 0), 0);

  // Set description
  desc.textContent = window.liveGoalDesc;
  label.textContent = `${currentPoints} / ${window.liveGoalTarget} แต้ม`;

  const percent = Math.min(100, Math.round((currentPoints / window.liveGoalTarget) * 100));
  bar.style.width = `${percent}%`;

  if (percent >= 100) {
    bar.style.backgroundColor = '#10b981'; // Completed: Green
  } else {
    bar.style.backgroundColor = 'var(--accent)';
  }

  // Render Top 3 Daily Leaderboard
  window.renderLiveTodayLeaderboard();

  // Render Today's Point History List
  if (window.renderLivePointsHistory) {
    window.renderLivePointsHistory();
  }
};

window.openEditLiveGoalModal = function() {
  const target = prompt("ระบุคะแนนเป้าหมายสะสม (คะแนน):", window.liveGoalTarget);
  if (target === null) return;
  const targetNum = parseInt(target);
  if (isNaN(targetNum) || targetNum <= 0) {
    alert("กรุณากรอกตัวเลขที่ถูกต้องและมากกว่า 0");
    return;
  }

  const description = prompt("ระบุรางวัลหรือหัวข้อกิจกรรม:", window.liveGoalDesc);
  if (description === null) return;

  window.liveGoalTarget = targetNum;
  window.liveGoalDesc = description;
  
  localStorage.setItem('live_goal_target', targetNum.toString());
  localStorage.setItem('live_goal_desc', description);

  window.renderLiveGoalTracker();
  window.toast("✏️ อัปเดตเป้าหมายของห้องเรียนสำเร็จ");
};

// 10. Random Student Selector & 1v1 Versus
window.selectedRandomStudentId = null;
window.versusPlayer1Id = null;
window.versusPlayer2Id = null;

window.openRandomSelectorModal = function() {
  const modal = document.getElementById('live-random-modal');
  if (!modal) return;
  
  // Set default view (Tab Single)
  window.switchRandomTab('single');

  // Reset display
  document.getElementById('random-display-name').textContent = 'พร้อมสุ่มรายชื่อ';
  document.getElementById('random-display-name').style.color = 'var(--text)';
  document.getElementById('random-award-action').style.display = 'none';
  
  // Hide canvas
  const canvas = document.getElementById('random-confetti-canvas');
  if (canvas) canvas.style.display = 'none';

  // Populate manual student selection dropdown
  const manualSelect = document.getElementById('random-manual-student-select');
  if (manualSelect) {
    const students = window.classData[window._liveRoomId] || [];
    const sortedStudents = [...students].sort((a, b) => (a.no || 0) - (b.no || 0));
    
    let options = '<option value="">-- เลือกนักเรียน --</option>';
    sortedStudents.forEach(s => {
      options += `<option value="${s.id}">เลขที่ ${s.no} - ${window.formatLiveStudentName(s)}</option>`;
    });
    manualSelect.innerHTML = options;
  }
  
  // Update daily leaderboard inside modal
  window.updateRandomModalLeaderboard();

  modal.classList.add('open');
};

window.switchRandomTab = function(tab) {
  const btnSingle = document.getElementById('random-tab-single');
  const btnVersus = document.getElementById('random-tab-versus');
  const bodySingle = document.getElementById('random-body-single');
  const bodyVersus = document.getElementById('random-body-versus');
  
  if (tab === 'single') {
    btnSingle?.classList.add('active');
    btnVersus?.classList.remove('active');
    if (bodySingle) bodySingle.style.display = '';
    if (bodyVersus) bodyVersus.style.display = 'none';
  } else {
    btnSingle?.classList.remove('active');
    btnVersus?.classList.add('active');
    if (bodySingle) bodySingle.style.display = 'none';
    if (bodyVersus) bodyVersus.style.display = '';
    
    // Reset 1v1 view
    document.getElementById('versus-p1-name').textContent = 'ผู้ท้าชิงคนที่ 1';
    document.getElementById('versus-p2-name').textContent = 'ผู้ท้าชิงคนที่ 2';
    document.getElementById('versus-timer-display').textContent = '10';
    document.getElementById('versus-award-row').style.display = 'none';
  }
};

window.startRandomRoll = function() {
  const students = window.classData[window._liveRoomId] || [];
  if (!students.length) {
    window.toast('❌ ไม่มีนักเรียนให้สุ่ม');
    return;
  }

  // Filter if only present students checked
  const onlyPresent = document.getElementById('random-only-present')?.checked;
  const date = window.today();
  const period = window._livePeriod;
  const subject = window._liveSubject;

  let candidates = students;
  if (onlyPresent) {
    candidates = students.filter(s => {
      const key = `${window._liveRoomId}_${s.id}_${date}_${period}_${subject}`;
      const status = window.attData[key];
      return status === 'P' || status === 'L'; // Present or Late only
    });
  }

  if (!candidates.length) {
    window.toast('❌ ไม่มีรายชื่อที่ตรงตามเงื่อนไข (ไม่พบคนที่มาเรียน)');
    return;
  }

  // Disable button while rolling
  const btn = document.querySelector('#random-body-single button.btn-primary');
  if (btn) btn.disabled = true;
  document.getElementById('random-award-action').style.display = 'none';

  // Play drumroll
  window.playLiveSound('drumroll');

  let duration = 2000; // 2 seconds
  let intervalTime = 60;
  const startTime = Date.now();
  
  const timer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const chosen = candidates[randomIndex];
    
    const display = document.getElementById('random-display-name');
    display.textContent = window.formatLiveStudentName(chosen);
    display.style.color = 'var(--text3)';
    
    // Play a tick sound
    window.playLiveSound('tick');

    if (elapsed >= duration) {
      clearInterval(timer);
      
      // Stop and select final
      const finalIndex = Math.floor(Math.random() * candidates.length);
      const finalChosen = candidates[finalIndex];
      
      window.selectedRandomStudentId = finalChosen.id;
      
      display.textContent = window.formatLiveStudentName(finalChosen);
      display.style.color = 'var(--accent)';
      
      // Play success chime
      window.playLiveSound('success');
      
      // Launch Confetti
      window.launchConfetti('random-confetti-canvas');
      
      // Show award action
      document.getElementById('random-award-action').style.display = 'flex';
      
      if (btn) btn.disabled = false;
    }
  }, intervalTime);
};

// 1v1 Versus Battle
window.startVersusRoll = function() {
  const students = window.classData[window._liveRoomId] || [];
  if (students.length < 2) {
    window.toast('❌ ต้องมีนักเรียนอย่างน้อย 2 คนจึงจะเปิดโหมดดวลได้');
    return;
  }

  const onlyPresent = document.getElementById('versus-only-present')?.checked;
  const date = window.today();
  const period = window._livePeriod;
  const subject = window._liveSubject;

  let candidates = students;
  if (onlyPresent) {
    candidates = students.filter(s => {
      const key = `${window._liveRoomId}_${s.id}_${date}_${period}_${subject}`;
      const status = window.attData[key];
      return status === 'P' || status === 'L';
    });
  }

  if (candidates.length < 2) {
    window.toast('❌ มีจำนวนคนที่มาเรียนไม่เพียงพอสำหรับการประชันคู่ (ต้องมีอย่างน้อย 2 คน)');
    return;
  }

  const btn = document.querySelector('#random-body-versus button.btn-primary');
  if (btn) btn.disabled = true;
  document.getElementById('versus-award-row').style.display = 'none';

  window.playLiveSound('drumroll');

  let duration = 2000;
  let intervalTime = 60;
  const startTime = Date.now();
  
  const timer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    
    // Pick two distinct indices
    let idx1 = Math.floor(Math.random() * candidates.length);
    let idx2 = Math.floor(Math.random() * candidates.length);
    while (idx1 === idx2 && candidates.length > 1) {
      idx2 = Math.floor(Math.random() * candidates.length);
    }
    
    document.getElementById('versus-p1-name').textContent = window.formatLiveStudentName(candidates[idx1]);
    document.getElementById('versus-p2-name').textContent = window.formatLiveStudentName(candidates[idx2]);
    
    window.playLiveSound('tick');

    if (elapsed >= duration) {
      clearInterval(timer);
      
      // Select final 2
      let f1 = Math.floor(Math.random() * candidates.length);
      let f2 = Math.floor(Math.random() * candidates.length);
      while (f1 === f2 && candidates.length > 1) {
        f2 = Math.floor(Math.random() * candidates.length);
      }
      
      window.versusPlayer1Id = candidates[f1].id;
      window.versusPlayer2Id = candidates[f2].id;
      
      document.getElementById('versus-p1-name').textContent = window.formatLiveStudentName(candidates[f1]);
      document.getElementById('versus-p2-name').textContent = window.formatLiveStudentName(candidates[f2]);
      
      window.playLiveSound('success');
      
      // Show controls and start the battle countdown
      document.getElementById('versus-award-row').style.display = 'flex';
      window.startVersusCountdown();
      
      if (btn) btn.disabled = false;
    }
  }, intervalTime);
};

window.versusTimer = null;
window.startVersusCountdown = function() {
  if (window.versusTimer) clearInterval(window.versusTimer);
  let timeleft = 10;
  const display = document.getElementById('versus-timer-display');
  display.textContent = timeleft;
  display.style.color = 'var(--text)';

  window.versusTimer = setInterval(() => {
    timeleft--;
    display.textContent = timeleft;
    if (timeleft <= 3 && timeleft > 0) {
      window.playLiveSound('tick');
      display.style.color = 'var(--red)';
    }
    if (timeleft <= 0) {
      clearInterval(window.versusTimer);
      window.playLiveSound('buzzer');
      display.textContent = 'หมดเวลา!';
    }
  }, 1000);
};

window.awardVersusWinner = function(playerNum) {
  if (window.versusTimer) clearInterval(window.versusTimer);
  const targetId = playerNum === 1 ? window.versusPlayer1Id : window.versusPlayer2Id;
  const targetName = playerNum === 1 ? document.getElementById('versus-p1-name').textContent : document.getElementById('versus-p2-name').textContent;
  
  if (!targetId) return;

  const students = window.classData[window._liveRoomId] || [];
  const s = students.find(x => x.id === targetId);
  if (!s) return;

  const pts = 5;

  const syncCheckbox = document.getElementById('live-sync-behavior') || document.getElementById('random-sync-behavior');
  const shouldSync = syncCheckbox ? syncCheckbox.checked : true;

  const rec = {
    id: 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    sid: targetId,
    name: s.name,
    cls: window._liveRoomId,
    type: 'pos',
    note: 'ชนะการดวล 1v1 ตอบคำถามสดในห้อง',
    pts: pts,
    date: window.today(),
    time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  };

  if (shouldSync) {
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 100;
    const scoreAfter = scoreBefore + pts;
    s.behaviorScore = scoreAfter;

    rec.scoreBefore = scoreBefore;
    rec.scoreAfter = scoreAfter;

    if (!window.behaviors) window.behaviors = [];
    window.behaviors.push(rec);

    if (window.snapshotVersion) window.snapshotVersion('ชนะการดวล 1v1');
    if (window.pushBehavior) window.pushBehavior(rec);
  } else {
    rec.unsynced = true;
    rec.note = 'ชนะการดวล 1v1 ตอบคำถามสดในห้อง (สะสมชั่วคราว)';
    if (!window.behaviors) window.behaviors = [];
    window.behaviors.push(rec);
  }

  window.recalculateLivePoints();
  window.autoSaveToLocalStorage();

  window.toast(`🎉 บวกแต้มให้ผู้ชนะ: ${targetName} +5 คะแนน!`);
  window.closeModal('live-random-modal');
  window.renderLiveGoalTracker();
};

window.awardRandomStudentPoint = function(type) {
  if (!window.selectedRandomStudentId) return;
  
  const students = window.classData[window._liveRoomId] || [];
  const s = students.find(x => x.id === window.selectedRandomStudentId);
  if (!s) return;

  const pts = 5;
  const delta = type === 'pos' ? pts : -pts;
  
  const syncCheckbox = document.getElementById('live-sync-behavior') || document.getElementById('random-sync-behavior');
  const shouldSync = syncCheckbox ? syncCheckbox.checked : true;

  const rec = {
    id: 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    sid: window.selectedRandomStudentId,
    name: s.name,
    cls: window._liveRoomId,
    type: type,
    note: type === 'pos' ? 'ตอบคำถามจากการสุ่มเรียกชื่อ' : 'ตักเตือนจากการสุ่มเรียกชื่อ',
    pts: delta,
    date: window.today(),
    time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  };

  if (shouldSync || type === 'neg') {
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 100;
    const scoreAfter = Math.max(0, scoreBefore + delta);
    s.behaviorScore = scoreAfter;

    rec.scoreBefore = scoreBefore;
    rec.scoreAfter = scoreAfter;

    if (!window.behaviors) window.behaviors = [];
    window.behaviors.push(rec);

    if (window.snapshotVersion) window.snapshotVersion('สุ่มชื่อและให้คะแนน');
    if (window.pushBehavior) window.pushBehavior(rec);
  } else {
    rec.unsynced = true;
    rec.note = 'ตอบคำถามจากการสุ่มเรียกชื่อ (สะสมชั่วคราว)';
    if (!window.behaviors) window.behaviors = [];
    window.behaviors.push(rec);
  }

  window.recalculateLivePoints();
  window.autoSaveToLocalStorage();

  window.toast(type === 'pos' ? `🎉 บวกแต้มสะสมให้ ${window.formatLiveStudentName(s)} +5 คะแนน!` : `⚠️ หักแต้มความประพฤติ ${window.formatLiveStudentName(s)} -5 คะแนน!`);
  window.closeModal('live-random-modal');
  window.renderLiveGoalTracker();
};

// ==================== NEW DAILY ACCUMULATION LEADERBOARD & SYNC ====================

// window.getTodayTop3Students: returns top 3 students by accumulated today's points
window.getTodayTop3Students = function() {
  const roomId = window._liveRoomId;
  const students = window.classData[roomId] || [];
  
  const list = students.map(s => ({
    id: s.id,
    no: s.no,
    name: window.formatLiveStudentName(s),
    pts: s.todayPoints || 0
  })).filter(x => x.pts > 0);
  
  list.sort((a, b) => b.pts - a.pts);
  return list.slice(0, 3);
};

// window.renderLiveTodayLeaderboard: renders leaderboard on the main live page
window.renderLiveTodayLeaderboard = function() {
  const el = document.getElementById('live-today-leaderboard');
  if (!el) return;
  
  const top3 = window.getTodayTop3Students();
  const students = window.classData[window._liveRoomId] || [];
  const totalUnsynced = students.reduce((sum, s) => sum + (s.unsyncedTodayPoints || 0), 0);
  
  let html = '🏆 อันดับสูงสุดวันนี้: ';
  if (top3.length === 0) {
    html += '<span style="color:var(--text3); font-style:italic;">ยังไม่มีคะแนนสะสมวันนี้</span>';
  } else {
    html += top3.map((x, idx) => {
      let emoji = '🥇';
      if (idx === 1) emoji = '🥈';
      if (idx === 2) emoji = '🥉';
      return `<span style="font-weight:700; color:var(--text); margin-right:8px;">${emoji} ${x.name} (+${x.pts} แต้ม)</span>`;
    }).join(' | ');
  }
  
  if (totalUnsynced > 0) {
    html += `
      <button class="btn btn-outline btn-sm" onclick="window.syncAllTodayPointsToBehavior()" 
        style="margin-left:auto; font-size:10px; padding:3px 8px; border-color:var(--green); color:var(--green); background:var(--green-light); border-radius:6px; font-family:Sarabun,sans-serif; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:4px;"
        title="บันทึกคะแนนสะสมที่ค้างไว้ เข้าคะแนนความประพฤติทั้งหมด">
        🔄 โอนเข้าคะแนนพฤติกรรม (+${totalUnsynced} แต้ม)
      </button>
    `;
  }
  el.innerHTML = html;
};

// window.updateRandomModalLeaderboard: renders leaderboard inside random selector modal
window.updateRandomModalLeaderboard = function() {
  const el = document.getElementById('random-modal-leaderboard');
  if (!el) return;
  
  const top3 = window.getTodayTop3Students();
  let html = '🏆 <strong>สะสมคะแนนสูงสุด 3 อันดับแรกวันนี้:</strong><br>';
  if (top3.length === 0) {
    html += '<span style="color:var(--text3); font-style:italic;">ยังไม่มีคะแนนสะสมวันนี้</span>';
  } else {
    html += '<div style="display:flex; flex-wrap:wrap; gap:12px; margin-top:4px;">' + top3.map((x, idx) => {
      let emoji = '🥇';
      if (idx === 1) emoji = '🥈';
      if (idx === 2) emoji = '🥉';
      return `<span>${emoji} ${x.name} (${x.pts} แต้ม)</span>`;
    }).join(' ') + '</div>';
  }
  el.innerHTML = html;
};

// window.awardManualStudentPoint: awards points manually inside random modal
window.awardManualStudentPoint = function() {
  const select = document.getElementById('random-manual-student-select');
  if (!select || !select.value) {
    window.toast('❌ กรุณาเลือกนักเรียน');
    return;
  }
  
  const studentId = parseInt(select.value);
  const roomId = window._liveRoomId;
  const students = window.classData[roomId] || [];
  const s = students.find(x => x.id === studentId);
  if (!s) return;
  
  const pts = 5;
  
  const syncCheckbox = document.getElementById('live-sync-behavior') || document.getElementById('random-sync-behavior');
  const shouldSync = syncCheckbox ? syncCheckbox.checked : true;
  
  const rec = {
    id: 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    sid: studentId,
    name: s.name,
    cls: roomId,
    type: 'pos',
    note: 'ตอบคำถามเองโดยสมัครใจ (นอกรอบการสุ่ม)',
    pts: pts,
    date: window.today(),
    time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  };

  if (shouldSync) {
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 100;
    const scoreAfter = scoreBefore + pts;
    s.behaviorScore = scoreAfter;
    
    rec.scoreBefore = scoreBefore;
    rec.scoreAfter = scoreAfter;
    
    if (!window.behaviors) window.behaviors = [];
    window.behaviors.push(rec);
    
    if (window.snapshotVersion) window.snapshotVersion('ให้คะแนนตอบคำถามสมัครใจ');
    if (window.pushBehavior) window.pushBehavior(rec);
  } else {
    rec.unsynced = true;
    rec.note = 'ตอบคำถามเองโดยสมัครใจ (นอกรอบการสุ่ม - สะสมชั่วคราว)';
    if (!window.behaviors) window.behaviors = [];
    window.behaviors.push(rec);
  }
  
  window.recalculateLivePoints();
  window.autoSaveToLocalStorage();
  window.playLiveSound('success');
  window.toast(`🎉 บวกแต้มสะสมให้ ${window.formatLiveStudentName(s)} +5 คะแนน!`);
  
  // Refresh UI
  window.renderLiveGoalTracker();
  window.updateRandomModalLeaderboard();
  window.renderLiveStudents();
};

// window.awardDirectLivePoint: awards points quickly from student card in grid
window.awardDirectLivePoint = function(event, studentId) {
  if (event) event.stopPropagation(); // Prevent cycling attendance!
  
  const roomId = window._liveRoomId;
  const students = window.classData[roomId] || [];
  const s = students.find(x => x.id === studentId);
  if (!s) return;
  
  const pts = 5;
  
  const syncCheckbox = document.getElementById('live-sync-behavior') || document.getElementById('random-sync-behavior');
  const shouldSync = syncCheckbox ? syncCheckbox.checked : true;
  
  const rec = {
    id: 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    sid: studentId,
    name: s.name,
    cls: roomId,
    type: 'pos',
    note: 'ตอบคำถามเองโดยสมัครใจ (ปุ่มด่วน)',
    pts: pts,
    date: window.today(),
    time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  };

  if (shouldSync) {
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 100;
    const scoreAfter = scoreBefore + pts;
    s.behaviorScore = scoreAfter;
    
    rec.scoreBefore = scoreBefore;
    rec.scoreAfter = scoreAfter;
    
    if (!window.behaviors) window.behaviors = [];
    window.behaviors.push(rec);
    
    if (window.snapshotVersion) window.snapshotVersion('ให้คะแนนด่วน');
    if (window.pushBehavior) window.pushBehavior(rec);
  } else {
    rec.unsynced = true;
    rec.note = 'ตอบคำถามเองโดยสมัครใจ (ปุ่มด่วน - สะสมชั่วคราว)';
    if (!window.behaviors) window.behaviors = [];
    window.behaviors.push(rec);
  }
  
  window.recalculateLivePoints();
  window.autoSaveToLocalStorage();
  window.playLiveSound('success');
  window.toast(`🎉 บวกแต้มสะสมให้ ${window.formatLiveStudentName(s)} +5 คะแนน!`);
  
  // Refresh UI
  window.renderLiveGoalTracker();
  window.renderLiveStudents();
};

// window.recalculateLivePoints: computes s.todayPoints and s.unsyncedTodayPoints for each student from behaviors
window.recalculateLivePoints = function() {
  const roomId = window._liveRoomId;
  if (!roomId) return;
  const students = window.classData[roomId] || [];
  const todayDate = window.today();
  students.forEach(s => {
    const logs = (window.behaviors || []).filter(b => +b.sid === +s.id && b.cls === roomId && b.date === todayDate && b.pts > 0);
    s.todayPoints = logs.reduce((sum, log) => sum + log.pts, 0);
    s.unsyncedTodayPoints = logs.filter(b => b.unsynced).reduce((sum, log) => sum + log.pts, 0);
  });
};

// window.renderLivePointsHistory: renders today's live point awards in a collapsible list
window.renderLivePointsHistory = function() {
  const listEl = document.getElementById('live-points-history-list');
  const countEl = document.getElementById('live-history-count');
  if (!listEl) return;

  const roomId = window._liveRoomId;
  if (!roomId) {
    listEl.innerHTML = '<div style="font-size: 11px; color: var(--text3); font-style: italic; text-align: center; padding: 12px 0;">ยังไม่มีประวัติการให้คะแนนในคาบนี้</div>';
    if (countEl) countEl.textContent = '0';
    return;
  }

  const todayDate = window.today();
  const todayLogs = (window.behaviors || []).filter(b => b.cls === roomId && b.date === todayDate);
  
  if (countEl) countEl.textContent = todayLogs.length;

  if (todayLogs.length === 0) {
    listEl.innerHTML = '<div style="font-size: 11px; color: var(--text3); font-style: italic; text-align: center; padding: 12px 0;">ยังไม่มีประวัติการให้คะแนนในคาบนี้</div>';
    return;
  }

  // Sort logs: newest first
  const sortedLogs = [...todayLogs].sort((a, b) => {
    const timeA = a.time || '';
    const timeB = b.time || '';
    if (timeA !== timeB) return timeB.localeCompare(timeA);
    return (b.id || '').localeCompare(a.id || '');
  });

  listEl.innerHTML = sortedLogs.map(log => {
    const isUnsynced = !!log.unsynced;
    const isPositive = log.pts > 0;
    const ptsText = isPositive ? `+${log.pts}` : `${log.pts}`;
    const ptsColor = isPositive ? 'var(--green)' : 'var(--red)';
    const statusBadge = isUnsynced 
      ? '<span style="font-size: 9px; padding: 1px 5px; border-radius: 4px; background: var(--amber-light); color: var(--amber); font-weight: 700; border: 1px solid var(--amber);">ชั่วคราว</span>'
      : '<span style="font-size: 9px; padding: 1px 5px; border-radius: 4px; background: var(--green-light); color: var(--green); font-weight: 700; border: 1px solid var(--green);">บันทึกแล้ว</span>';

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; background: var(--surface2); border-radius: 8px; border: 1px solid var(--border); font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
          <span style="font-size: 10px; color: var(--text3); font-family: monospace;">[${log.time || '--:--'}]</span>
          <span style="font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${log.name}</span>
          <span style="font-weight: 800; color: ${ptsColor};">${ptsText} แต้ม</span>
          <span style="color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; font-size: 11px;" title="${log.note}">${log.note}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          ${statusBadge}
          <button onclick="window.editLivePointLog('${log.id || ''}')" style="background: none; border: none; cursor: pointer; padding: 2px 4px; font-size: 12px;" title="แก้ไขคะแนน">✏️</button>
          <button onclick="window.deleteLivePointLog('${log.id || ''}')" style="background: none; border: none; cursor: pointer; padding: 2px 4px; font-size: 12px;" title="ลบรายการ">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
};

// window.editLivePointLog: prompts and edits a points history log
window.editLivePointLog = function(logId) {
  if (!logId) return;
  const log = (window.behaviors || []).find(b => b.id === logId);
  if (!log) {
    window.toast('❌ ไม่พบรายการประวัตินี้');
    return;
  }

  const newPtsStr = prompt(`แก้ไขคะแนนของ "${log.name}" (ปัจจุบันคือ ${log.pts}):`, log.pts);
  if (newPtsStr === null) return; // Cancelled
  const newPts = parseInt(newPtsStr);
  if (isNaN(newPts) || newPts === 0) {
    window.toast('⚠️ กรุณากรอกตัวเลขคะแนนที่ถูกต้อง (ไม่ใช่ 0)');
    return;
  }

  const roomId = log.cls;
  const students = window.classData[roomId] || [];
  const s = students.find(x => +x.id === +log.sid);
  if (!s) {
    window.toast('❌ ไม่พบนักเรียนคนนี้ในชั้นเรียน');
    return;
  }

  const oldPts = log.pts;
  log.pts = newPts;

  // If the log is synced, adjust the student's behavior score by the difference
  if (!log.unsynced) {
    const diff = newPts - oldPts;
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 100;
    s.behaviorScore = Math.max(0, scoreBefore + diff);
    log.scoreAfter = log.scoreBefore + newPts;

    // Push the updated log to Firestore/Sheets
    if (window.pushBehavior) window.pushBehavior(log);
  }

  // Recalculate and update local storage & UI
  window.recalculateLivePoints();
  window.autoSaveToLocalStorage();
  if (window.snapshotVersion) window.snapshotVersion('แก้ไขคะแนนสด');

  window.toast(`✏️ แก้ไขคะแนนให้ ${log.name} สำเร็จ!`);
  
  // Refresh UI
  window.renderLiveGoalTracker();
  window.renderLiveStudents();
};

// window.deleteLivePointLog: confirms and deletes a points history log
window.deleteLivePointLog = function(logId) {
  if (!logId) return;
  const log = (window.behaviors || []).find(b => b.id === logId);
  if (!log) {
    window.toast('❌ ไม่พบรายการประวัตินี้');
    return;
  }

  if (!confirm(`ต้องการลบรายการให้คะแนนของ "${log.name}" (${log.pts > 0 ? '+' : ''}${log.pts} แต้ม) หรือไม่?\n\n*คะแนนสะสมประจำคาบจะลดลง`)) {
    return;
  }

  const roomId = log.cls;
  const students = window.classData[roomId] || [];
  const s = students.find(x => +x.id === +log.sid);

  if (s && !log.unsynced) {
    // Revert the student's behavior score
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 100;
    s.behaviorScore = Math.max(0, scoreBefore - log.pts);
  }

  // Remove the log from window.behaviors
  window.behaviors = window.behaviors.filter(b => b.id !== logId);

  // Recalculate and update local storage & UI
  window.recalculateLivePoints();
  window.autoSaveToLocalStorage();
  if (window.snapshotVersion) window.snapshotVersion('ลบคะแนนสด');

  window.toast(`🗑️ ลบรายการคะแนนของ ${log.name} สำเร็จ!`);

  // Refresh UI
  window.renderLiveGoalTracker();
  window.renderLiveStudents();
};

// window.syncAllTodayPointsToBehavior: transfers all unsynced points to behavior logs
window.syncAllTodayPointsToBehavior = function() {
  const roomId = window._liveRoomId;
  const students = window.classData[roomId] || [];
  const todayDate = window.today();
  
  // Find all unsynced behavior records for today in this room
  const unsyncedLogs = (window.behaviors || []).filter(b => b.cls === roomId && b.date === todayDate && b.unsynced === true);
  
  if (unsyncedLogs.length === 0) {
    window.toast('ℹ️ ไม่มีคะแนนสะสมชั่วคราวค้างอยู่');
    return;
  }
  
  let count = 0;
  unsyncedLogs.forEach(log => {
    const s = students.find(x => +x.id === +log.sid);
    if (s) {
      const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 100;
      const scoreAfter = scoreBefore + log.pts;
      s.behaviorScore = scoreAfter;
      
      log.scoreBefore = scoreBefore;
      log.scoreAfter = scoreAfter;
      delete log.unsynced; // Remove the unsynced flag so it is now permanent!
      
      if (window.pushBehavior) window.pushBehavior(log);
      count++;
    }
  });
  
  if (count > 0) {
    if (window.snapshotVersion) window.snapshotVersion('โอนคะแนนสะสมประจำวัน');
    window.recalculateLivePoints();
    window.autoSaveToLocalStorage();
    window.toast(`✅ โอนคะแนนสะสมของวันนี้จำนวน ${count} รายการเข้าคะแนนพฤติกรรมถาวรเรียบร้อย!`);
    window.renderLiveGoalTracker();
    window.renderLiveStudents();
  }
};

// window.onLiveSyncBehaviorChange: syncs main checkbox status to modal checkbox
window.onLiveSyncBehaviorChange = function(checked) {
  const modalCheckbox = document.getElementById('random-sync-behavior');
  if (modalCheckbox) modalCheckbox.checked = checked;
};

// window.awardManualStudentPointDirect: awards points from the dropdown on the main Live Mode screen
window.awardManualStudentPointDirect = function() {
  const select = document.getElementById('live-manual-student-select');
  if (!select || !select.value) {
    window.toast('❌ กรุณาเลือกนักเรียน');
    return;
  }
  
  const studentId = parseInt(select.value);
  const roomId = window._liveRoomId;
  const students = window.classData[roomId] || [];
  const s = students.find(x => x.id === studentId);
  if (!s) return;
  
  const pts = 5;
  
  const syncCheckbox = document.getElementById('live-sync-behavior') || document.getElementById('random-sync-behavior');
  const shouldSync = syncCheckbox ? syncCheckbox.checked : true;
  
  const rec = {
    id: 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    sid: studentId,
    name: s.name,
    cls: roomId,
    type: 'pos',
    note: 'ตอบคำถามเองโดยสมัครใจ (จากเป้าหมายห้องเรียนหน้าจอสอนสด)',
    pts: pts,
    date: window.today(),
    time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  };

  if (shouldSync) {
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 100;
    const scoreAfter = scoreBefore + pts;
    s.behaviorScore = scoreAfter;
    
    rec.scoreBefore = scoreBefore;
    rec.scoreAfter = scoreAfter;
    
    if (!window.behaviors) window.behaviors = [];
    window.behaviors.push(rec);
    
    if (window.snapshotVersion) window.snapshotVersion('ให้คะแนนตอบคำถามสมัครใจหน้าสอนสด');
    if (window.pushBehavior) window.pushBehavior(rec);
  } else {
    rec.unsynced = true;
    rec.note = 'ตอบคำถามเองโดยสมัครใจ (จากเป้าหมายห้องเรียนหน้าจอสอนสด - สะสมชั่วคราว)';
    if (!window.behaviors) window.behaviors = [];
    window.behaviors.push(rec);
  }
  
  window.recalculateLivePoints();
  window.autoSaveToLocalStorage();
  window.playLiveSound('success');
  window.toast(`🎉 บวกแต้มสะสมให้ ${window.formatLiveStudentName(s)} +5 คะแนน!`);
  
  // Reset select input
  select.value = '';
  
  // Refresh UI
  window.renderLiveGoalTracker();
  window.updateRandomModalLeaderboard();
  window.renderLiveStudents();
};

// Canvas Confetti Generator
window.launchConfetti = function(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  
  // Set width & height
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#6366f1'];
  const particles = [];

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height - 20,
      vx: (Math.random() - 0.5) * 8,
      vy: -(Math.random() * 8 + 6),
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rSpeed: (Math.random() - 0.5) * 10
    });
  }

  let animationFrame;
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.rSpeed;

      if (p.y < canvas.height + 20) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      animationFrame = requestAnimationFrame(update);
    } else {
      canvas.style.display = 'none';
    }
  }

  cancelAnimationFrame(animationFrame);
  update();
};

// 11. Group Generator
window.openGroupModal = function() {
  const modal = document.getElementById('live-group-modal');
  if (modal) {
    document.getElementById('group-result-container').style.display = 'none';
    document.getElementById('group-input-form').style.display = 'block';
    modal.classList.add('open');
  }
};

window.generateGroups = function() {
  const students = window.classData[window._liveRoomId] || [];
  if (!students.length) {
    window.toast('❌ ไม่มีนักเรียนให้แบ่งกลุ่ม');
    return;
  }

  const mode = document.getElementById('group-mode-select').value; // 'count' or 'size'
  const val = parseInt(document.getElementById('group-value-input').value);
  if (isNaN(val) || val <= 0) {
    window.toast('❌ กรุณาระบุจำนวนที่ถูกต้อง');
    return;
  }

  const onlyPresent = document.getElementById('group-only-present')?.checked;
  const date = window.today();
  const period = window._livePeriod;
  const subject = window._liveSubject;

  let candidates = [...students];
  if (onlyPresent) {
    candidates = students.filter(s => {
      const key = `${window._liveRoomId}_${s.id}_${date}_${period}_${subject}`;
      const status = window.attData[key];
      return status === 'P' || status === 'L';
    });
  }

  if (candidates.length < 2) {
    window.toast('❌ รายชื่อที่สามารถจับกลุ่มได้ต้องมีอย่างน้อย 2 คน');
    return;
  }

  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  let groupCount = 0;
  if (mode === 'count') {
    groupCount = val;
  } else {
    groupCount = Math.ceil(candidates.length / val);
  }

  const groups = Array.from({ length: groupCount }, () => []);
  candidates.forEach((s, idx) => {
    groups[idx % groupCount].push(s);
  });

  // Display groups
  const resultDiv = document.getElementById('group-results');
  let html = '';
  groups.forEach((g, idx) => {
    if (g.length === 0) return;
    html += `
      <div style="background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 12px; min-width: 150px;">
        <h4 style="margin: 0 0 8px 0; color: var(--accent); border-bottom: 2px solid var(--accent-light); padding-bottom: 4px;">กลุ่มที่ ${idx+1}</h4>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: var(--text);">
          ${g.map(s => `<li>${window.formatLiveStudentName(s)} (เลขที่ ${s.no})</li>`).join('')}
        </ul>
      </div>
    `;
  });

  resultDiv.innerHTML = html;
  document.getElementById('group-input-form').style.display = 'none';
  document.getElementById('group-result-container').style.display = 'block';
  
  // Attach raw list for clipboard copy
  window.lastGeneratedGroupsText = groups.map((g, idx) => {
    return `กลุ่มที่ ${idx+1}:\n` + g.map(s => ` - ${window.formatLiveStudentName(s)} (เลขที่ ${s.no})`).join('\n');
  }).join('\n\n');

  window.playLiveSound('success');
};

window.copyGroupsToClipboard = function() {
  if (!window.lastGeneratedGroupsText) return;
  navigator.clipboard.writeText(window.lastGeneratedGroupsText)
    .then(() => window.toast('📋 คัดลอกรายชื่อกลุ่มลงคลิปบอร์ดแล้ว'))
    .catch(() => window.toast('❌ ไม่สามารถคัดลอกได้'));
};

// 12. Challenge Wheel (Canvas Spinning Wheel)
window.wheelItems = [
  "ท่องสูตรคูณแม่ 9",
  "แปลศัพท์คำว่า 'Notebook'",
  "ช่วยเก็บขยะหลังห้องเรียน",
  "ทำท่าเลียนแบบสัตว์ที่ชอบ",
  "บอกชื่อสัตว์ปีก 3 ชนิด",
  "ช่วยทำความสะอาดกระดาน",
  "ร้องเพลงท่อนที่ชอบที่สุด",
  "เต้นท่าไก่ 10 วินาที"
];
window.isWheelSpinning = false;
window.wheelAngle = 0;

window.openWheelModal = function() {
  const modal = document.getElementById('live-wheel-modal');
  if (!modal) return;
  
  const textarea = document.getElementById('wheel-items-input');
  if (textarea) {
    textarea.value = window.wheelItems.join('\n');
  }

  modal.classList.add('open');
  setTimeout(() => window.drawWheel(), 100);
};

window.drawWheel = function() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const radius = width / 2 - 10;
  
  ctx.clearRect(0, 0, width, height);

  const len = window.wheelItems.length;
  if (!len) {
    ctx.font = '16px Sarabun';
    ctx.fillStyle = 'var(--text3)';
    ctx.textAlign = 'center';
    ctx.fillText("ไม่มีข้อมูลนำโชค", cx, cy);
    return;
  }

  const arc = (Math.PI * 2) / len;
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#14b8a6', '#f97316', '#ec4899'];

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(window.wheelAngle);

  for (let i = 0; i < len; i++) {
    const angle = i * arc;
    ctx.fillStyle = colors[i % colors.length];
    
    // Draw sector
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, angle, angle + arc);
    ctx.lineTo(0, 0);
    ctx.fill();

    // Draw text
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Sarabun';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.rotate(angle + arc / 2);
    
    const text = window.wheelItems[i];
    const displayText = text.length > 15 ? text.substring(0, 14) + '...' : text;
    ctx.fillText(displayText, radius - 20, 0);
    ctx.restore();
  }
  ctx.restore();

  // Draw Center Hub & Arrow Indicator
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = 'var(--accent)';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // Arrow Pointer (pointing to the left / into the wheel)
  ctx.fillStyle = 'var(--text)';
  ctx.beginPath();
  ctx.moveTo(width - 25, cy); // Left tip pointing into the wheel
  ctx.lineTo(width - 5, cy - 12); // Right-top base
  ctx.lineTo(width - 5, cy + 12); // Right-bottom base
  ctx.closePath();
  ctx.fill();
};

window.spinWheel = function() {
  if (window.isWheelSpinning) return;

  // Read latest items
  const txt = document.getElementById('wheel-items-input')?.value || '';
  window.wheelItems = txt.split('\n').map(x => x.trim()).filter(Boolean);
  if (!window.wheelItems.length) {
    window.toast('❌ กรุณาระบุภารกิจอย่างน้อย 1 รายการ');
    return;
  }

  window.isWheelSpinning = true;
  const btn = document.querySelector('#live-wheel-modal button.btn-primary');
  if (btn) btn.disabled = true;

  const duration = 3000 + Math.random() * 2000; // 3 to 5 seconds
  const startSpeed = 0.35 + Math.random() * 0.15;
  const startTime = Date.now();
  
  let currentSpeed = startSpeed;
  let lastTickAngle = 0;
  const tickStep = (Math.PI * 2) / window.wheelItems.length;

  function animate() {
    const elapsed = Date.now() - startTime;
    
    // Deceleration curve
    const progress = elapsed / duration;
    if (progress >= 1) {
      window.isWheelSpinning = false;
      if (btn) btn.disabled = false;
      
      // Calculate landing index
      // Normalizing the angle between 0 and 2pi
      const finalAngle = window.wheelAngle % (Math.PI * 2);
      const arc = (Math.PI * 2) / window.wheelItems.length;
      
      // Point is on the right (0 radians). The pointer indicates what is currently at 0 radians relative to the canvas.
      // Index is computed opposite to the rotation direction.
      let landingIndex = Math.floor((Math.PI * 2 - finalAngle) / arc) % window.wheelItems.length;
      if (landingIndex < 0) landingIndex += window.wheelItems.length;
      
      const winningText = window.wheelItems[landingIndex];
      
      // Highlight the result in the UI
      window.playLiveSound('success');
      alert(`🎯 ภารกิจสุ่มได้คือ: "${winningText}"`);
      return;
    }

    currentSpeed = startSpeed * (1 - easeOutQuad(progress));
    window.wheelAngle += currentSpeed;
    
    // Play tick sound when passing a division
    if (Math.floor(window.wheelAngle / tickStep) !== Math.floor(lastTickAngle / tickStep)) {
      window.playLiveSound('tick');
      lastTickAngle = window.wheelAngle;
    }

    window.drawWheel();
    requestAnimationFrame(animate);
  }

  function easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
  }

  animate();
};

// 13. Presentation Board
window.openBoardModal = function() {
  const modal = document.getElementById('live-board-modal');
  if (!modal) return;

  document.getElementById('board-editor-wrap').style.display = 'block';
  document.getElementById('board-view-wrap').style.display = 'none';
  document.getElementById('board-text-input').value = '🌟 กิจกรรมวันนี้:\nให้นักเรียนทุกคนเตรียมสมุดแบบฝึกหัดแล้วเปิดไปหน้า 45 ทำแบบฝึกหัดท้ายบทที่ 3 กันนะคะ';
  document.getElementById('board-img-preview').src = '';
  document.getElementById('board-img-preview').style.display = 'none';

  modal.classList.add('open');
};

window.handleBoardImageSelect = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById('board-img-preview');
    if (img) {
      img.src = e.target.result;
      img.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
};

window.showBoardPresentation = function() {
  const textVal = document.getElementById('board-text-input').value;
  const viewText = document.getElementById('board-view-text');
  const viewImg = document.getElementById('board-view-image');
  const uploadedImg = document.getElementById('board-img-preview');

  if (viewText) {
    viewText.innerHTML = textVal.replace(/\n/g, '<br>');
  }

  if (viewImg && uploadedImg && uploadedImg.src && uploadedImg.style.display !== 'none') {
    viewImg.src = uploadedImg.src;
    viewImg.style.display = 'block';
  } else if (viewImg) {
    viewImg.style.display = 'none';
  }

  document.getElementById('board-editor-wrap').style.display = 'none';
  document.getElementById('board-view-wrap').style.display = 'flex';
};

window.exitBoardPresentation = function() {
  document.getElementById('board-editor-wrap').style.display = 'block';
  document.getElementById('board-view-wrap').style.display = 'none';
};

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
