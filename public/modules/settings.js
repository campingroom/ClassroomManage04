// ====== MODULE: SETTINGS ======
// Handles system configuration, grading scale custom thresholds, teacher personal details, 
// dark mode switching, and local snapshots management.

window.renderSetupSettings = function() {
  window.loadSettingsInputs();
  window.renderSnapshotsTable();
  window.renderSettingsVersions();
};

window.loadSettingsInputs = function() {
  // Semester and grading thresholds
  const acYr = document.getElementById('sys-academic-year');
  if (acYr) acYr.value = window.academicYear || '2569';
  
  const sem = document.getElementById('sys-semester');
  if (sem) sem.value = window.semester || '1';
  
  const gt = window.gradeThresholds || { g4: 80, g35: 75, g3: 70, g25: 65, g2: 60, g15: 55, g1: 50, g0: 0 };
  const keys = ['g4', 'g35', 'g3', 'g25', 'g2', 'g15', 'g1'];
  keys.forEach(k => {
    const id = 'sys-grade-' + k.replace('g', '');
    const el = document.getElementById(id);
    if (el) el.value = gt[k] !== undefined ? gt[k] : '';
  });
  
  // Teacher credentials
  const tName = document.getElementById('sys-teacher-name');
  if (tName) tName.value = window.teacherName || '';
  
  const tRank = document.getElementById('sys-teacher-rank');
  if (tRank) tRank.value = window.teacherRank || '';
  
  const tGrp = document.getElementById('sys-teacher-subject-group');
  if (tGrp) tGrp.value = window.teacherSubjectGroup || '';
  
  const schName = document.getElementById('sys-school-name');
  if (schName) schName.value = window.schoolName || '';

  const areaOffice = document.getElementById('sys-area-office');
  if (areaOffice) areaOffice.value = window.areaOffice || '';

  const province = document.getElementById('sys-province');
  if (province) province.value = window.province || '';

  const dirName = document.getElementById('sys-director-name');
  if (dirName) dirName.value = window.directorName || '';

  const acadHead = document.getElementById('sys-academic-head-name');
  if (acadHead) acadHead.value = window.academicHeadName || '';

  const regName = document.getElementById('sys-registrar-name');
  if (regName) regName.value = window.registrarName || '';

  // Semester start/end dates
  const dates = window.getSemesterDates();
  const s1Start = document.getElementById('sys-sem1-start');
  if (s1Start) s1Start.value = dates.sem1Start || '';
  const s1End = document.getElementById('sys-sem1-end');
  if (s1End) s1End.value = dates.sem1End || '';
  const s2Start = document.getElementById('sys-sem2-start');
  if (s2Start) s2Start.value = dates.sem2Start || '';
  const s2End = document.getElementById('sys-sem2-end');
  if (s2End) s2End.value = dates.sem2End || '';

  // Period Settings
  window.renderPeriodSettings();
};

window.renderPeriodSettings = function() {
  const periodCountSelect = document.getElementById('sys-period-count');
  if (periodCountSelect) {
    periodCountSelect.value = (window.periodConfig || []).length.toString();
  }
  window.renderSettingsPeriodList();
};

window.renderSettingsPeriodList = function() {
  const container = document.getElementById('settings-period-list');
  if (!container) return;
  container.innerHTML = (window.periodConfig || []).map((p, i) => `
    <div style="display:flex;align-items:center;gap:6px;padding:6px;border-bottom:1px solid var(--border)">
      <span style="font-size:12px;font-weight:600;color:var(--text2);min-width:50px">คาบ ${p.no}</span>
      <input type="time" id="settings-p-start-${i}" value="${p.start}" class="inp" style="width:100px;font-size:12px;padding:4px">
      <span style="font-size:12px;color:var(--text3)">–</span>
      <input type="time" id="settings-p-end-${i}" value="${p.end}" class="inp" style="width:100px;font-size:12px;padding:4px">
    </div>
  `).join('');
};

window.onPeriodCountChange = function(count) {
  const n = parseInt(count);
  if (isNaN(n) || n < 5 || n > 10) return;
  
  if (!window.periodConfig) window.periodConfig = [];
  
  // Update periodConfig array
  while (window.periodConfig.length < n) {
    const no = window.periodConfig.length + 1;
    window.periodConfig.push({ no, start: '08:00', end: '09:00' });
  }
  window.periodConfig = window.periodConfig.slice(0, n);
  
  window.renderSettingsPeriodList();
};

window.savePeriodConfig = function() {
  const countSelect = document.getElementById('sys-period-count');
  if (!countSelect) return;
  const n = parseInt(countSelect.value);
  
  const newConfig = [];
  for (let i = 0; i < n; i++) {
    const startEl = document.getElementById(`settings-p-start-${i}`);
    const endEl = document.getElementById(`settings-p-end-${i}`);
    const startVal = startEl ? startEl.value : '08:00';
    const endVal = endEl ? endEl.value : '09:00';
    newConfig.push({
      no: i + 1,
      start: startVal,
      end: endVal
    });
  }
  
  window.periodConfig = newConfig;
  
  // Save version snapshot
  if (window.snapshotVersion) window.snapshotVersion('ตั้งค่าคาบเรียนและเวลาเรียน');
  
  // Push to cloud if logged in
  if (window.pushSchedules) window.pushSchedules();
  
  // If autoSaveToLocalStorage is defined
  if (window.autoSaveToLocalStorage) window.autoSaveToLocalStorage();
  
  // Re-render schedule grids
  if (window.renderDndGrid) window.renderDndGrid();
  
  window.toast('✅ บันทึกตารางเวลาเรียนเรียนเรียบร้อย');
};

window.saveSystemSettings = function() {
  // Read and save grade thresholds
  const g4 = parseFloat(document.getElementById('sys-grade-4').value);
  const g35 = parseFloat(document.getElementById('sys-grade-35').value);
  const g3 = parseFloat(document.getElementById('sys-grade-3').value);
  const g25 = parseFloat(document.getElementById('sys-grade-25').value);
  const g2 = parseFloat(document.getElementById('sys-grade-2').value);
  const g15 = parseFloat(document.getElementById('sys-grade-15').value);
  const g1 = parseFloat(document.getElementById('sys-grade-1').value);
  
  if (isNaN(g4) || isNaN(g35) || isNaN(g3) || isNaN(g25) || isNaN(g2) || isNaN(g15) || isNaN(g1)) {
    window.toast('⚠️ กรุณากรอกเกณฑ์คะแนนเกรดให้ครบถ้วน');
    return;
  }
  
  window.gradeThresholds = {
    g4: g4,
    g35: g35,
    g3: g3,
    g25: g25,
    g2: g2,
    g15: g15,
    g1: g1,
    g0: 0
  };
  
  window.snapshotVersion('บันทึกการตั้งค่าเกรด');
  window.autoSaveToLocalStorage();
  window.toast('💾 บันทึกการตั้งค่าเกรดแล้ว');
  
  if (window.renderDashboard) window.renderDashboard();
};

window.saveSemesterDates = function() {
  const sem1Start = document.getElementById('sys-sem1-start')?.value;
  const sem1End = document.getElementById('sys-sem1-end')?.value;
  const sem2Start = document.getElementById('sys-sem2-start')?.value;
  const sem2End = document.getElementById('sys-sem2-end')?.value;

  if (!sem1Start || !sem1End || !sem2Start || !sem2End) {
    window.toast('⚠️ กรุณากรอกวันเปิด-ปิดภาคเรียนให้ครบถ้วน');
    return;
  }

  if (sem1Start >= sem1End) {
    window.toast('⚠️ วันเปิดเรียนเทอม 1 ต้องมาก่อนวันปิดเรียน');
    return;
  }
  if (sem2Start >= sem2End) {
    window.toast('⚠️ วันเปิดเรียนเทอม 2 ต้องมาก่อนวันปิดเรียน');
    return;
  }

  window.semesterDates = {
    sem1Start,
    sem1End,
    sem2Start,
    sem2End
  };

  window.snapshotVersion('บันทึกวันเปิดปิดภาคเรียน');
  window.autoSaveToLocalStorage();
  window.toast('💾 บันทึกวันเปิด-ปิดภาคเรียนเรียบร้อย');

  // Re-render components that depend on these dates
  if (window.drawCalendar) window.drawCalendar();
  if (window.onAttDateChange) window.onAttDateChange();
  if (window.renderDashboard) window.renderDashboard();
};

window.savePersonalInfo = function() {
  const teacherName = document.getElementById('sys-teacher-name').value.trim();
  const teacherRank = document.getElementById('sys-teacher-rank').value.trim();
  const teacherSubjectGroup = document.getElementById('sys-teacher-subject-group').value.trim();
  const schoolName = document.getElementById('sys-school-name').value.trim();
  const academicYear = document.getElementById('sys-academic-year').value.trim();
  const semester = document.getElementById('sys-semester')?.value || window.semester || '1';
  
  const areaOffice = document.getElementById('sys-area-office')?.value.trim() || '';
  const province = document.getElementById('sys-province')?.value.trim() || '';
  const directorName = document.getElementById('sys-director-name')?.value.trim() || '';
  const academicHeadName = document.getElementById('sys-academic-head-name')?.value.trim() || '';
  const registrarName = document.getElementById('sys-registrar-name')?.value.trim() || '';
  
  if (!teacherName) {
    window.toast('⚠️ กรุณากรอกชื่อ-นามสกุลคุณครู');
    return;
  }
  if (!academicYear) {
    window.toast('⚠️ กรุณากรอกปีการศึกษา');
    return;
  }
  
  window.teacherName = teacherName;
  window.teacherRank = teacherRank;
  window.teacherSubjectGroup = teacherSubjectGroup;
  window.schoolName = schoolName;
  window.academicYear = academicYear;
  window.semester = semester;
  window.areaOffice = areaOffice;
  window.province = province;
  window.directorName = directorName;
  window.academicHeadName = academicHeadName;
  window.registrarName = registrarName;
  
  // Sync teacher name to all subjects to prevent mismatch in schedule
  if (window.subjects) {
    window.subjects.forEach(s => {
      s.teacher = teacherName;
    });
    if (window.pushSubjects) window.pushSubjects();
  }
  
  window.snapshotVersion('บันทึกข้อมูลส่วนตัวครู');
  window.autoSaveToLocalStorage();
  window.updateTopbarBadge();
  if (window.updateFirebaseUI) {
    window.updateFirebaseUI(!!window.firebaseUser, window.firebaseUser ? window.firebaseUser.email : '');
  }
  window.toast('💾 บันทึกข้อมูลประจำตัวสำเร็จ');
};

window.updateTopbarBadge = function() {
  // Sync the badges inside topbar actions if we are currently on the setup-settings page
  if (window.currentPanel === 'setup-settings') {
    window.renderTopbarActions('setup-settings');
  }
};

// Dark Mode Toggle
window.toggleDarkMode = function() {
  const body = document.body;
  const html = document.documentElement;
  const isDark = body.classList.contains('dark-theme') || html.classList.contains('dark-theme');
  if (isDark) {
    body.classList.remove('dark-theme');
    html.classList.remove('dark-theme');
    localStorage.setItem('dark_theme', 'false');
  } else {
    body.classList.add('dark-theme');
    html.classList.add('dark-theme');
    localStorage.setItem('dark_theme', 'true');
  }
  // Update dark mode button icon
  const dmBtn = document.getElementById('darkmode-toggle-btn');
  if (dmBtn) dmBtn.textContent = !isDark ? '☀️' : '🌙';
  window.updateTopbarBadge();
  window.toast(isDark ? '☀️ เปลี่ยนเป็นโหมดสว่าง' : '🌙 เปลี่ยนเป็นโหมดมืด');
};

// Snapshot Engine
window.createLocalSnapshot = function() {
  const title = prompt('กรอกหัวข้อหรือคำอธิบายสำหรับการสำรองข้อมูลนี้:');
  if (title === null) return;
  const cleanTitle = title.trim() || 'สำรองข้อมูลทั่วไป';
  
  const data = window.collectAllData();
  const snapshot = {
    id: Date.now(),
    time: new Date().toISOString(),
    timeStr: new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    title: cleanTitle,
    data: data
  };
  
  let snapshots = [];
  try {
    snapshots = JSON.parse(localStorage.getItem('cls_local_snapshots') || '[]');
  } catch (e) {
    snapshots = [];
  }
  
  snapshots.unshift(snapshot);
  localStorage.setItem('cls_local_snapshots', JSON.stringify(snapshots));
  window.toast('✨ บันทึกสแนปช็อตสำเร็จ');
  window.renderSnapshotsTable();
};

window.restoreSnapshot = function(id) {
  let snapshots = [];
  try {
    snapshots = JSON.parse(localStorage.getItem('cls_local_snapshots') || '[]');
  } catch (e) {
    return;
  }
  const snap = snapshots.find(x => x.id === id);
  if (!snap) {
    window.toast('❌ ไม่พบข้อมูลสแนปช็อตนี้');
    return;
  }
  
  if (!confirm(`คุณต้องการย้อนกลับข้อมูลทั้งหมดเป็นจุดสำรอง "${snap.title}" (${snap.timeStr}) ใช่หรือไม่?\n\n*คำเตือน: ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลสแนปช็อตนี้`)) {
    return;
  }
  
  try {
    window.snapshotVersion('ก่อนย้อนคืนสแนปช็อต');
    
    window.applyRestoreData(snap.data, false);
    window.syncSubjectsToClassSubjects();
    window.rebuildClassSelector();
    window.renderPeriodSettings();
    window.renderPanel(window.currentPanel);
    
    if (window.currentPanel === 'setup-settings') {
      window.loadSettingsInputs();
    }
    
    window.toast('✅ คืนค่าสแนปช็อตสำเร็จ');
  } catch (e) {
    window.toast('❌ เกิดข้อผิดพลาดในการคืนค่า: ' + e.message);
  }
};

window.deleteSnapshot = function(id) {
  let snapshots = [];
  try {
    snapshots = JSON.parse(localStorage.getItem('cls_local_snapshots') || '[]');
  } catch (e) {
    return;
  }
  const snap = snapshots.find(x => x.id === id);
  if (!snap) return;
  
  if (!confirm(`คุณต้องการลบจุดสำรอง "${snap.title}" หรือไม่?`)) {
    return;
  }
  
  snapshots = snapshots.filter(x => x.id !== id);
  localStorage.setItem('cls_local_snapshots', JSON.stringify(snapshots));
  window.toast('🗑 ลบสแนปช็อตสำเร็จ');
  window.renderSnapshotsTable();
};

window.renderSnapshotsTable = function() {
  const tbody = document.getElementById('snapshot-tbody');
  if (!tbody) return;
  
  let snapshots = [];
  try {
    snapshots = JSON.parse(localStorage.getItem('cls_local_snapshots') || '[]');
  } catch (e) {
    snapshots = [];
  }
  
  if (snapshots.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="ctr" style="color:var(--text3); padding:32px 10px">
          ยังไม่มีการจัดการสแนปช็อตจุดคืนข้อมูลภายในระบบ
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = snapshots.map(snap => {
    return `
      <tr>
        <td style="vertical-align:middle; font-weight: 500">${snap.timeStr}</td>
        <td style="vertical-align:middle; color:var(--text2)">${window.esc(snap.title)}</td>
        <td class="ctr" style="vertical-align:middle">
          <button onclick="window.restoreSnapshot(${snap.id})" class="btn btn-teal btn-sm" style="font-size:11px; padding:3px 8px; border-radius:5px">คืนค่า</button>
          <button onclick="window.deleteSnapshot(${snap.id})" class="btn btn-danger btn-sm" style="font-size:11px; padding:3px 8px; border-radius:5px">ลบ</button>
        </td>
      </tr>
    `;
  }).join('');
};

window.renderSettingsVersions = function() {
  const el = document.getElementById('settings-version-list');
  if (!el) return;
  
  const rawVers = window.getVersions ? window.getVersions() : [];
  const vers = rawVers.filter(x => x && x.data);
  
  if (vers.length === 0) {
    el.innerHTML = `
      <div style="text-align:center; padding:32px 10px; color:var(--text3); font-size:12px; background:var(--surface2); border:1px solid var(--border); border-radius:8px">
        📭 ยังไม่มีประวัติการบันทึกอัตโนมัติ
      </div>
    `;
    return;
  }
  
  el.innerHTML = vers.map((v, i) => {
    const isCurrent = (i === 0);
    const roomsCount = v.data?.rooms?.length || 0;
    
    // Count total students across all rooms in this version
    let studentsCount = 0;
    if (v.data?.classData) {
      Object.values(v.data.classData).forEach(arr => {
        if (Array.isArray(arr)) {
          studentsCount += arr.length;
        }
      });
    }
    
    const label = v.label || 'บันทึกอัตโนมัติ';
    const dateStr = v.dateStr || (v.ts ? new Date(v.ts).toLocaleString('th-TH') : '');
    
    return `
      <div class="version-card ${isCurrent ? 'current' : ''}" style="margin-bottom:8px; border:1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}; background:${isCurrent ? 'var(--accent-light)' : 'var(--surface)'}; border-radius:10px; padding:12px 14px">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
          <div style="flex:1">
            <div style="font-size:13px; font-weight:700; color:var(--text)">
              ${label}
              ${isCurrent ? ' <span style="font-size:10px; background:var(--accent); color:#fff; padding:1px 6px; border-radius:6px; font-weight:normal; margin-left:4px">ล่าสุด</span>' : ''}
            </div>
            <div style="font-size:11px; color:var(--text3); margin-top:2px">${dateStr}</div>
            <div style="font-size:11px; color:var(--text3)">${roomsCount} ห้องเรียน • ${studentsCount} นักเรียน</div>
          </div>
          <div>
            ${isCurrent ? '<span style="font-size:11px; color:var(--accent); font-weight:600">ปัจจุบัน</span>' 
                        : `<button onclick="window.restoreVersionFromSettings(${i})" class="btn btn-outline btn-sm" style="font-size:11px; padding:4px 10px; border-radius:6px">ย้อนกลับ</button>`}
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.restoreVersionFromSettings = function(idx) {
  const rawVers = window.getVersions ? window.getVersions() : [];
  const vers = rawVers.filter(x => x && x.data);
  const v = vers[idx];
  if (!v) return;
  
  const label = v.label || 'บันทึกอัตโนมัติ';
  const dateStr = v.dateStr || (v.ts ? new Date(v.ts).toLocaleString('th-TH') : '');
  
  if (!confirm(`คุณต้องการย้อนกลับข้อมูลทั้งหมดไปยังจุดประวัติอัตโนมัติ "${label}" (${dateStr}) ใช่หรือไม่?\n\n*คำเตือน: ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลย้อนกลับนี้`)) {
    return;
  }
  
  try {
    // Record current state in version history before restoring, so user can undo if they want
    if (window.snapshotVersion) {
      window.snapshotVersion('ก่อนย้อนกลับ');
    }
    
    window.rooms = v.data.rooms || [];
    
    // Clear and restore classData
    if (window.classData) {
      Object.keys(window.classData).forEach(k => delete window.classData[k]);
      Object.assign(window.classData, v.data.classData || {});
    }
    
    window.subjects = v.data.subjects || [];
    window.schedules = v.data.schedules || [];
    window.behaviors = v.data.behaviors || [];
    window.assignments = v.data.assignments || [];
    
    // Clear and restore attData
    if (window.attData) {
      Object.keys(window.attData).forEach(k => delete window.attData[k]);
      Object.assign(window.attData, v.data.attData || {});
    }
    
    // Check extra fields in profile
    if (v.data.academicYear !== undefined) window.academicYear = v.data.academicYear;
    if (v.data.semester !== undefined) window.semester = v.data.semester;
    if (v.data.semesterDates !== undefined) window.semesterDates = v.data.semesterDates;
    if (v.data.teacherName !== undefined) window.teacherName = v.data.teacherName;
    if (v.data.teacherRank !== undefined) window.teacherRank = v.data.teacherRank;
    if (v.data.teacherSubjectGroup !== undefined) window.teacherSubjectGroup = v.data.teacherSubjectGroup;
    if (v.data.schoolName !== undefined) window.schoolName = v.data.schoolName;
    if (v.data.areaOffice !== undefined) window.areaOffice = v.data.areaOffice;
    if (v.data.province !== undefined) window.province = v.data.province;
    if (v.data.directorName !== undefined) window.directorName = v.data.directorName;
    if (v.data.academicHeadName !== undefined) window.academicHeadName = v.data.academicHeadName;
    if (v.data.registrarName !== undefined) window.registrarName = v.data.registrarName;
    
    if (window.syncSubjectsToClassSubjects) window.syncSubjectsToClassSubjects();
    if (window.rebuildClassSelector) window.rebuildClassSelector();
    if (window.renderPeriodSettings) window.renderPeriodSettings();
    
    window.renderPanel(window.currentPanel);
    if (window.currentPanel === 'setup-settings') {
      window.loadSettingsInputs();
      window.renderSnapshotsTable();
      window.renderSettingsVersions();
    }
    
    window.toast('✅ คืนค่าจากประวัติย้อนหลังสำเร็จ');
  } catch(e) {
    window.toast('❌ เกิดข้อผิดพลาด: ' + e.message);
  }
};

