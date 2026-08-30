// ====== LIVE TEACHING MODE — POINTS & ENGAGEMENT (goal tracker, random picker/1v1, daily leaderboard) ======

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
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 0;
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
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 0;
    const scoreAfter = scoreBefore + delta;
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
      return `<span style="font-weight:700; color:var(--text); margin-right:8px;">${emoji} ${window.esc(x.name)} (+${x.pts} แต้ม)</span>`;
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
      return `<span>${emoji} ${window.esc(x.name)} (${x.pts} แต้ม)</span>`;
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
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 0;
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
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 0;
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
          <span style="font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${window.esc(log.name)}</span>
          <span style="font-weight: 800; color: ${ptsColor};">${ptsText} แต้ม</span>
          <span style="color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; font-size: 11px;" title="${window.esc(log.note)}">${window.esc(log.note)}</span>
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

  const newPtsStr = prompt(`แก้ไขคะแนนของ "${window.esc(log.name)}" (ปัจจุบันคือ ${log.pts}):`, log.pts);
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
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 0;
    s.behaviorScore = scoreBefore + diff;
    log.scoreAfter = log.scoreBefore + newPts;

    // Push the updated log to Firestore/Sheets
    if (window.pushBehavior) window.pushBehavior(log);
  }

  // Recalculate and update local storage & UI
  window.recalculateLivePoints();
  window.autoSaveToLocalStorage();
  if (window.snapshotVersion) window.snapshotVersion('แก้ไขคะแนนสด');

  window.toast(`✏️ แก้ไขคะแนนให้ ${window.esc(log.name)} สำเร็จ!`);
  
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

  if (!confirm(`ต้องการลบรายการให้คะแนนของ "${window.esc(log.name)}" (${log.pts > 0 ? '+' : ''}${log.pts} แต้ม) หรือไม่?\n\n*คะแนนสะสมประจำคาบจะลดลง`)) {
    return;
  }

  const roomId = log.cls;
  const students = window.classData[roomId] || [];
  const s = students.find(x => +x.id === +log.sid);

  if (s && !log.unsynced) {
    // Revert the student's behavior score
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 0;
    s.behaviorScore = scoreBefore - log.pts;
  }

  // Remove the log from window.behaviors
  window.behaviors = window.behaviors.filter(b => b.id !== logId);

  // Recalculate and update local storage & UI
  window.recalculateLivePoints();
  window.autoSaveToLocalStorage();
  if (window.snapshotVersion) window.snapshotVersion('ลบคะแนนสด');

  window.toast(`🗑️ ลบรายการคะแนนของ ${window.esc(log.name)} สำเร็จ!`);

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
      const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 0;
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
    const scoreBefore = s.behaviorScore !== undefined ? s.behaviorScore : 0;
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
