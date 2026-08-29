// ====== MODULE: SCHEDULE ======
// Handles teacher schedule grid building using tap-to-place interaction.
// Options are configured in Settings.

// Selected subject and room variables for tap-to-place
window.selectedScheduleSubjectId = '';
window.selectedScheduleRoomId = '';
window.selectedScheduleSubjectName = '';

window._dndDraft = {};

window.getSubjectColor = function(subjName) {
  if (!subjName) return '#ff7043';
  const name = subjName.toLowerCase();
  if (name.includes('คณิต')) return '#0288d1';
  if (name.includes('วิทย์') || name.includes('วิทยาศาสตร์')) return '#2e7d32';
  if (name.includes('อัง')) return '#ba68c8';
  if (name.includes('สังคม') || name.includes('ประวัติ')) return '#ffa726';
  return '#ef5350';
};

window.getSubjectCellStyles = function(subjName) {
  const color = window.getSubjectColor(subjName);
  if (color === '#0288d1') {
    return { bg: '#e0f2fe', text: '#0284c7', border: '1.5px solid #bae6fd' };
  } else if (color === '#2e7d32') {
    return { bg: '#dcfce7', text: '#15803d', border: '1.5px solid #bbf7d0' };
  } else if (color === '#ba68c8') {
    return { bg: '#f3e8ff', text: '#7e22ce', border: '1.5px solid #e9d5ff' };
  } else if (color === '#ffa726') {
    return { bg: '#fef3c7', text: '#b45309', border: '1.5px solid #fde68a' };
  } else {
    return { bg: '#fee2e2', text: '#b91c1c', border: '1.5px solid #fecaca' };
  }
};

window.renderDndBuilder = function(){
  const teacher = window.teacherName || 'ครูผู้สอน';
  const el = document.getElementById('dnd-builder');
  const emptyEl = document.getElementById('dnd-empty');
  
  if(el) el.style.display='flex';
  if(emptyEl) emptyEl.style.display='none';
  
  // Reset selection on teacher change
  window.selectedScheduleSubjectId = '';
  window.selectedScheduleRoomId = '';
  window.selectedScheduleSubjectName = '';
  
  const statusEl = document.getElementById('schedule-select-status');
  if (statusEl) {
    statusEl.innerHTML = `ยังไม่ได้เลือกวิชา — แตะวิชาด้านบนก่อน แล้วแตะช่องว่างในตารางเพื่อวาง`;
    statusEl.style.background = '#fef2f2';
    statusEl.style.color = '#ef4444';
    statusEl.style.borderColor = '#fee2e2';
  }
  
  window.renderDndSubjectList();
  window.renderDndGrid();
};

window.onDndTeacherChange = function(){
  window.renderDndBuilder();
};

window.selectScheduleSubject = function(sid, rid, name) {
  const oldSid = window.selectedScheduleSubjectId;
  const oldRid = window.selectedScheduleRoomId;
  
  if (oldSid === sid && oldRid === rid) {
    window.selectedScheduleSubjectId = '';
    window.selectedScheduleRoomId = '';
    window.selectedScheduleSubjectName = '';
  } else {
    window.selectedScheduleSubjectId = sid;
    window.selectedScheduleRoomId = rid;
    window.selectedScheduleSubjectName = name;
  }
  
  window.renderDndSubjectList();
  
  const statusEl = document.getElementById('schedule-select-status');
  if (statusEl) {
    if (window.selectedScheduleSubjectId) {
      statusEl.innerHTML = `<span style="color:var(--accent);font-weight:600">กำลังเลือก:</span> ${window.selectedScheduleSubjectName} — แตะช่องในตารางเพื่อวาง`;
      statusEl.style.background = 'var(--accent-light)';
      statusEl.style.color = 'var(--accent)';
      statusEl.style.borderColor = 'var(--accent)';
    } else {
      statusEl.innerHTML = `ยังไม่ได้เลือกวิชา — แตะวิชาด้านบนก่อน แล้วแตะช่องว่างในตารางเพื่อวาง`;
      statusEl.style.background = '#fef2f2';
      statusEl.style.color = '#ef4444';
      statusEl.style.borderColor = '#fee2e2';
    }
  }
};

window.renderDndSubjectList = function(){
  const teacher = document.getElementById('dnd-teacher')?.value||'';
  const el = document.getElementById('dnd-subject-list');
  if(!el) return;
  
  const currentTerm = window.activeSemesterFilter || '1';
  const tSubjects = window.subjects.filter(s => {
    const sTeacher = s.teacher || 'ครูผู้สอน';
    const currentTeacher = teacher || 'ครูผู้สอน';
    return (sTeacher === currentTeacher) && (currentTerm === 'all' || s.term === 'all' || s.term === currentTerm);
  });
  let html = '';
  
  tSubjects.forEach(s => {
    const rooms = Array.isArray(s.rooms) ? s.rooms : s.rooms ? [s.rooms] : [];
    rooms.forEach(rid => {
      const r = window.rooms.find(x => x.id === rid);
      const rLabel = r ? `${r.level}/${r.section}` : rid;
      const isSelected = window.selectedScheduleSubjectId === s.id && window.selectedScheduleRoomId === rid;
      const color = window.getSubjectColor(s.name);
      
      html += `
        <div class="schedule-subject-card" onclick="window.selectScheduleSubject('${s.id}', '${rid}', '${window.esc(s.name)} (${rLabel})')"
             style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--surface); border:1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}; border-radius:12px; cursor:pointer; transition:all 0.15s; box-shadow:${isSelected ? '0 4px 12px var(--accent-light)' : 'none'};">
          <span class="subject-dot" style="background: ${color}; width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink:0;"></span>
          <div style="display:flex; flex-direction:column; gap:2px; flex:1; min-width:0;">
            <span style="font-size:13px; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${window.esc(s.name)}</span>
            <span style="font-size:11px; color:var(--text3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.code || '-'} · ${s.credits || '0'} นก. · ${rLabel}</span>
          </div>
        </div>
      `;
    });
  });
  
  el.innerHTML = html || '<div style="font-size:11.5px;color:var(--text3);text-align:center;padding:16px">ครูท่านนี้ยังไม่มีรายวิชาที่ตรงกับภาคเรียนนี้</div>';
};

window.renderDndGrid = function(){
  const teacher = document.getElementById('dnd-teacher')?.value||'';
  const titleEl = document.getElementById('dnd-timetable-title');
  const currentTerm = window.activeSemesterFilter || '1';
  
  if(titleEl) {
    titleEl.textContent = `ตารางสอน ${(window.periodConfig || []).length} คาบ • ครู${teacher}`;
  }
  
  const grid = document.getElementById('dnd-grid');
  if(!grid) return;
  
  const draftKey = `${teacher}_${currentTerm}`;
  if(!window._dndDraft[draftKey]){
    window._dndDraft[draftKey]={};
    const teacherSubIds = window.subjects.filter(s => {
      const sTeacher = s.teacher || 'ครูผู้สอน';
      const currentTeacher = teacher || 'ครูผู้สอน';
      return sTeacher === currentTeacher;
    }).map(s => s.id);
    window.schedules.filter(sc=>teacherSubIds.includes(sc.subjectId) && (sc.term === currentTerm || !sc.term)).forEach(sc=>{
      const r = window.rooms.find(x=>x.id===sc.roomId);
      const rLabel = r ? `${r.level}/${r.section}` : sc.roomId;
      const subName = window.resolveSubjectName(sc.subjectId);
      window._dndDraft[draftKey][sc.day+'_'+sc.period] = {
        subjectId:sc.subjectId,
        roomId:sc.roomId,
        name:`${window.esc(subName)} (${rLabel})`
      };
    });
  }
  
  let html = '<table style="width:100%; border-collapse:collapse; font-family:\'Sarabun\',sans-serif; text-align:center; font-size:12px;">';
  
  // Table Header: Periods (Columns)
  html += `
    <thead>
      <tr>
        <th style="padding:12px; border:1px solid var(--border); background:var(--surface2); width:110px; font-weight:700; color:var(--text2);">วัน / คาบ</th>
  `;
  const periodsCount = (window.periodConfig || []).length;
  for (let p = 1; p <= periodsCount; p++) {
    const cfg = window.periodConfig[p-1] || { start: '08:00', end: '09:00' };
    html += `
      <th style="padding:10px; border:1px solid var(--border); background:var(--surface2); font-weight:700; color:var(--text2); min-width:110px;">
        <div style="font-size:12.5px;">คาบ ${p}</div>
        <div style="font-size:10px; color:var(--text3); font-weight:normal; margin-top:2px;">${cfg.start}–${cfg.end}</div>
      </th>
    `;
  }
  html += '</tr></thead><tbody>';
  
  // Table Body: Rows = Days
  const dayStyles = {
    1: { label: 'จันทร์', bg: '#fefcf0', text: '#b25e00', border: '1.5px solid #fde047' },
    2: { label: 'อังคาร', bg: '#fff5f7', text: '#be185d', border: '1.5px solid #fbcfe8' },
    3: { label: 'พุธ', bg: '#f0fdf4', text: '#15803d', border: '1.5px solid #bbf7d0' },
    4: { label: 'พฤหัสบดี', bg: '#fff7ed', text: '#c2410c', border: '1.5px solid #fed7aa' },
    5: { label: 'ศุกร์', bg: '#f0f9ff', text: '#0369a1', border: '1.5px solid #bae6fd' }
  };
  
  for (let dIdx = 1; dIdx <= 5; dIdx++) {
    const dStyle = dayStyles[dIdx];
    html += `
      <tr>
        <td style="padding:12px; border:1px solid var(--border); background:${dStyle.bg}; color:${dStyle.text}; font-weight:700; text-align:center; min-width:100px;">
          <div style="font-size:13.5px;">วัน${dStyle.label}</div>
        </td>
    `;
    
    // Period cells
    for (let p = 1; p <= periodsCount; p++) {
      const key = dIdx + '_' + p;
      const cell = window._dndDraft[draftKey] && window._dndDraft[draftKey][key];
      
      let cellHtml = '';
      let cellStyle = 'background:var(--surface); border:1px dashed var(--border); color:var(--text3); cursor:pointer;';
      
      if (cell) {
        const styles = window.getSubjectCellStyles(cell.name);
        cellStyle = `background:${styles.bg}; border:${styles.border}; color:${styles.text}; cursor:pointer; font-weight:700; position:relative;`;
        
        let subName = cell.name;
        let roomLabel = '';
        const match = cell.name.match(/(.+)\s*\((.+)\)$/);
        if (match) {
          subName = match[1];
          roomLabel = match[2];
        }
        
        cellHtml = `
          <div style="display:flex; flex-direction:column; gap:2px; padding:4px;">
            <button onclick="window.removeScheduleCell(event, ${dIdx}, ${p})"
                    style="position:absolute; top:4px; right:4px; width:16px; height:16px; border-radius:50%; background:rgba(0,0,0,0.06); border:none; color:inherit; font-size:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; transition:all 0.15s; line-height:1;"
                    onmouseover="this.style.background='var(--red)'; this.style.color='#fff';"
                    onmouseout="this.style.background='rgba(0,0,0,0.06)'; this.style.color='inherit';">
              ×
            </button>
            <div style="font-size:12px; line-height:1.3; word-break:break-word; padding-right:12px;">${window.esc(subName)}</div>
            <div style="font-size:11.5px; opacity:0.85; font-weight:600;">${window.esc(roomLabel)}</div>
          </div>
        `;
      } else {
        cellHtml = '<div style="font-size:12px; opacity:0.6;">ว่าง</div>';
      }
      
      html += `
        <td style="padding:6px; border:1px solid var(--border); vertical-align:middle; height:64px; transition:all 0.15s; ${cellStyle}"
            onclick="window.onScheduleCellClick(event, ${dIdx}, ${p})"
            onmouseover="this.style.filter='brightness(0.97)'"
            onmouseout="this.style.filter=''">
          ${cellHtml}
        </td>
      `;
    }
    html += '</tr>';
  }
  
  html += '</tbody></table>';
  grid.innerHTML = html;
};

window.removeScheduleCell = function(event, day, period) {
  if (event) event.stopPropagation();
  const teacher = document.getElementById('dnd-teacher')?.value||'';
  if (!teacher) return;
  const currentTerm = window.activeSemesterFilter || '1';
  const draftKey = `${teacher}_${currentTerm}`;
  if (window._dndDraft[draftKey] && window._dndDraft[draftKey][day + '_' + period]) {
    delete window._dndDraft[draftKey][day + '_' + period];
    window.toast(`✕ เอาวิชาออกแล้ว`);
    window.saveDndTeacherSchedule(true);
    window.renderDndGrid();
  }
};

window.onScheduleCellClick = function(event, day, period) {
  if (event) event.stopPropagation();
  const teacher = document.getElementById('dnd-teacher')?.value||'';
  if (!teacher) return;
  const currentTerm = window.activeSemesterFilter || '1';
  const draftKey = `${teacher}_${currentTerm}`;
  if (!window._dndDraft[draftKey]) window._dndDraft[draftKey] = {};
  
  const key = day + '_' + period;
  const existing = window._dndDraft[draftKey][key];
  
  if (window.selectedScheduleSubjectId) {
    if (existing && existing.subjectId === window.selectedScheduleSubjectId && existing.roomId === window.selectedScheduleRoomId) {
      delete window._dndDraft[draftKey][key];
      window.toast(`✕ เอาวิชาออกแล้ว`);
    } else {
      window._dndDraft[draftKey][key] = {
        subjectId: window.selectedScheduleSubjectId,
        roomId: window.selectedScheduleRoomId,
        name: window.selectedScheduleSubjectName
      };
      window.toast(`📍 วางวิชา ${window.selectedScheduleSubjectName}`);
    }
  } else {
    if (existing) {
      delete window._dndDraft[draftKey][key];
      window.toast(`✕ เอาวิชาออกแล้ว`);
    } else {
      window.toast(`⚠️ เลือกวิชาจากแถบด้านขวาก่อนแตะวาง`);
      return;
    }
  }
  
  window.saveDndTeacherSchedule(true);
  window.renderDndGrid();
};

window.saveDndTeacherSchedule = function(silent = true){
  const teacher = window.teacherName || 'ครูผู้สอน';
  
  if (window.calibrateIdCounters) window.calibrateIdCounters();
  
  const currentTerm = window.activeSemesterFilter || '1';
  const draftKey = `${teacher}_${currentTerm}`;
  
  const teacherSubIds = window.subjects.filter(s => {
    const sTeacher = s.teacher || 'ครูผู้สอน';
    const currentTeacher = teacher || 'ครูผู้สอน';
    return sTeacher === currentTeacher;
  }).map(s => s.id);
  window.schedules = window.schedules.filter(sc=>!(teacherSubIds.includes(sc.subjectId) && (sc.term === currentTerm || !sc.term)));
  
  const draft = window._dndDraft[draftKey]||{};
  Object.entries(draft).forEach(([key,cell])=>{
    const [day,period] = key.split('_');
    window.schedules.push({
      id:'sc'+window.nextSchedId++,
      roomId:cell.roomId,
      subjectId:cell.subjectId,
      day:+day,
      period:+period,
      start:(window.periodConfig[+period-1] || {start:'08:00'}).start,
      end:(window.periodConfig[+period-1] || {end:'09:00'}).end,
      term:currentTerm,
      loc:''
    });
  });
  
  window.snapshotVersion('แก้ไขตารางเรียน');
  const badge = document.getElementById('dnd-unsaved-badge');
  if(badge) badge.style.display='none';
  window.pushSchedules();
  if (!silent) window.toast('✅ บันทึกตารางสอนแล้ว');
};

window.clearDndTeacher = function(){
  const teacher = window.teacherName || 'ครูผู้สอน';
  if(!teacher) return;
  if(!confirm(`ล้างตารางสอนของ ${teacher}?`)) return;
  const currentTerm = window.activeSemesterFilter || '1';
  const draftKey = `${teacher}_${currentTerm}`;
  window._dndDraft[draftKey]={};
  window.saveDndTeacherSchedule(true);
  window.renderDndGrid();
  window.toast('🗑 ล้างตารางเรียนสำเร็จ');
};

window.populateSchedDropdowns = function(){
  const tsel = document.getElementById('dnd-teacher');
  if(tsel){
    const val = window.teacherName || 'ครูผู้สอน';
    tsel.innerHTML = `<option value="${val}">${val}</option>`;
    tsel.value = val;
  }
};
