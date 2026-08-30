// ====== LIVE TEACHING MODE — CORE (state, audio cues, main render, attendance cycle) ======
// แยกออกมาจาก live_mode.js เดิม — ดูไฟล์พี่น้อง: live-points.js, live-classroom-tools.js, live-widget.js

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
  const targetClass = window.currentClass || 'all';

  window.rooms.forEach(room => {
    if (targetClass !== 'all' && room.id !== targetClass) return; // Filter by targetClass!
    
    const roomSubjs = window.subjects.filter(s => 
      (!s.rooms || s.rooms.length === 0 || s.rooms.includes(room.id)) &&
      (currentTerm === 'all' || s.term === 'all' || s.term === currentTerm)
    );
    roomSubjs.forEach(subj => {
      optionsHtml += `<option value="${room.id}_${window.esc(subj.name)}">${window.esc(subj.name)} - ${room.level}/${room.section}</option>`;
    });
  });

  if (!optionsHtml) {
    optionsHtml = '<option value="">ไม่มีข้อมูลห้องเรียน/วิชา</option>';
  }
  select.innerHTML = optionsHtml;

  // Restore last selected or default to first
  const lastSelected = localStorage.getItem('live_selected_class_subj');
  if (lastSelected && select.querySelector(`option[value="${lastSelected}"]`)) {
    select.value = lastSelected;
  } else if (select.options.length > 0) {
    select.selectedIndex = 0;
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
  if (roomId && window.currentClass !== roomId) {
    window.currentClass = roomId;
    if (window.updateTopbarClassBadge) window.updateTopbarClassBadge();
  }
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
        <div style="font-size: 15px; font-weight: 700; color: ${nameColor}; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${window.esc(s.name)}">
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
