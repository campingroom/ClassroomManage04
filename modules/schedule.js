// ====== SETUP: ตารางเรียน (ตารางสอนครู - DnD) ======
window._dndDraft = {};
window._dragSubjectId = '';
window._dragRoomId = '';
window._dragSubjectName = '';

window.renderDndBuilder = function(){
  const teacher = document.getElementById('dnd-teacher')?.value||'';
  const el = document.getElementById('dnd-builder');
  const emptyEl = document.getElementById('dnd-empty');
  
  if(!teacher){
    if(el) el.style.display='none';
    if(emptyEl) emptyEl.style.display='';
    return;
  }
  
  if(el) el.style.display='flex';
  if(emptyEl) emptyEl.style.display='none';
  
  window.renderDndSubjectList();
  window.renderDndGrid();
  window.renderPeriodSettings();
}

window.onDndTeacherChange = function(){
  window.renderDndBuilder();
}

window.renderDndSubjectList = function(){
  const teacher = document.getElementById('dnd-teacher')?.value||'';
  const el = document.getElementById('dnd-subject-list');
  if(!el) return;
  
  const currentTerm = window.activeSemesterFilter || '1';
  const tSubjects = window.subjects.filter(s=>s.teacher === teacher && (currentTerm === 'all' || s.term === 'all' || s.term === currentTerm));
  let html = '';
  
  tSubjects.forEach(s => {
    const rooms = Array.isArray(s.rooms) ? s.rooms : s.rooms ? [s.rooms] : [];
    rooms.forEach(rid => {
      const r = window.rooms.find(x => x.id === rid);
      const rLabel = r ? `${r.level}/${r.section}` : rid;
      html += `
        <div class="dnd-subject-chip" draggable="true"
          data-sid="${s.id}" data-rid="${rid}" data-name="${s.name} (${rLabel})"
          style="display:inline-block;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:12px;font-weight:600;color:var(--text2);cursor:grab;transition:all .15s;user-select:none"
          onmouseover="this.style.background='var(--accent-light)';this.style.borderColor='var(--accent)'"
          onmouseout="this.style.background='var(--surface)';this.style.borderColor='var(--border)'"
          ondragstart="window.onChipDragStart(event)"
          ondragend="window.onChipDragEnd(event)">
          📚 ${s.name} (${rLabel})
        </div>`;
    });
  });
  
  el.innerHTML = html || '<div style="font-size:11px;color:var(--text3);text-align:center;padding:12px">ครูท่านนี้ยังไม่มีรายวิชาที่ตรงกับภาคเรียนนี้</div>';
}

window.renderDndGrid = function(){
  const teacher = document.getElementById('dnd-teacher')?.value||'';
  const days=['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์'];
  const titleEl = document.getElementById('dnd-timetable-title');
  const currentTerm = window.activeSemesterFilter || '1';
  const termLabel = currentTerm === '1' ? 'ภาคเรียนที่ 1' : currentTerm === '2' ? 'ภาคเรียนที่ 2' : 'ทุกภาคเรียน';
  if(titleEl) titleEl.textContent=`ตารางสอนคุณครู ${teacher} (${termLabel})`;
  
  const grid = document.getElementById('dnd-grid');
  if(!grid) return;
  
  // Load existing schedule for teacher and specific term
  const draftKey = `${teacher}_${currentTerm}`;
  if(!window._dndDraft[draftKey]){
    window._dndDraft[draftKey]={};
    const teacherSubIds = window.subjects.filter(s=>s.teacher===teacher).map(s=>s.id);
    window.schedules.filter(sc=>teacherSubIds.includes(sc.subjectId) && (sc.term === currentTerm || !sc.term)).forEach(sc=>{
      const r = window.rooms.find(x=>x.id===sc.roomId);
      const rLabel = r ? `${r.level}/${r.section}` : sc.roomId;
      const subName = window.resolveSubjectName(sc.subjectId);
      window._dndDraft[draftKey][sc.day+'_'+sc.period] = {
        subjectId:sc.subjectId,
        roomId:sc.roomId,
        name:`${subName} (${rLabel})`
      };
    });
  }
  
  let html='<table style="width:100%;border-collapse:collapse;font-size:12px">';
  html+='<thead><tr><th style="padding:6px;border:1px solid var(--border);background:var(--surface2);min-width:90px;text-align:center">วัน / คาบ</th>';
  for(let p=1;p<=7;p++){
    const cfg = window.periodConfig[p-1]||{start:'',end:''};
    html+=`<th style="padding:6px;border:1px solid var(--border);background:var(--surface2);min-width:120px;text-align:center">
      <div style="font-weight:600">คาบ ${p}</div>
      <div style="font-size:10px;color:var(--text3);font-weight:normal">${cfg.start}–${cfg.end}</div>
    </th>`;
  }
  html+='</tr></thead><tbody>';
  
  days.forEach((d,di)=>{
    html+=`<tr><td style="padding:6px 10px;border:1px solid var(--border);background:var(--surface2);text-align:center;white-space:nowrap;font-weight:600">
      ${d}
    </td>`;
    for(let p=1;p<=7;p++){
      const key=(di+1)+'_'+p;
      const cell = window._dndDraft[draftKey]&&window._dndDraft[draftKey][key];
      html+=`<td style="padding:4px;border:1px solid var(--border);vertical-align:middle;height:52px"
        ondragover="event.preventDefault()"
        ondrop="window.onCellDrop(event,'${teacher}',${di+1},${p})"
        id="dnd-cell-${di+1}-${p}">
        ${cell?`<div class="dnd-pill" style="display:flex;align-items:center;justify-content:space-between;background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:6px;padding:4px 8px;font-size:11px;font-weight:600;cursor:pointer">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:110px">${cell.name}</span>
          <button class="dnd-del" style="background:transparent;border:none;color:var(--accent);font-weight:700;font-size:10px;margin-left:4px;cursor:pointer" onclick="window.removeDndCell('${teacher}',${di+1},${p});event.stopPropagation()">✕</button>
        </div>`:''}
      </td>`;
    }
    html+='</tr>';
  });
  html+='</tbody></table>';
  grid.innerHTML=html;
}

window.onChipDragStart = function(e){
  window._dragSubjectId = e.target.dataset.sid;
  window._dragRoomId = e.target.dataset.rid;
  window._dragSubjectName = e.target.dataset.name;
  e.target.style.opacity='.5';
  const badge = document.getElementById('dnd-unsaved-badge');
  if(badge) badge.style.display='';
}

window.onChipDragEnd = function(e){ e.target.style.opacity='1'; }

window.onCellDrop = function(e, teacher, day, period){
  e.preventDefault();
  if(!window._dragSubjectId || !window._dragRoomId) return;
  const currentTerm = window.activeSemesterFilter || '1';
  const draftKey = `${teacher}_${currentTerm}`;
  if(!window._dndDraft[draftKey]) window._dndDraft[draftKey]={};
  
  window._dndDraft[draftKey][day+'_'+period]={
    subjectId: window._dragSubjectId,
    roomId: window._dragRoomId,
    name: window._dragSubjectName
  };
  
  const cell = document.getElementById(`dnd-cell-${day}-${period}`);
  if(cell) cell.innerHTML=`<div class="dnd-pill" style="display:flex;align-items:center;justify-content:space-between;background:var(--accent-light);color:var(--accent);border:1px solid var(--accent);border-radius:6px;padding:4px 8px;font-size:11px;font-weight:600;cursor:pointer">
    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:110px">${window._dragSubjectName}</span>
    <button class="dnd-del" style="background:transparent;border:none;color:var(--accent);font-weight:700;font-size:10px;margin-left:4px;cursor:pointer" onclick="window.removeDndCell('${teacher}',${day},${period});event.stopPropagation()">✕</button>
  </div>`;
  
  window._dragSubjectId=''; window._dragRoomId=''; window._dragSubjectName='';
}

window.removeDndCell = function(teacher, day, period){
  const currentTerm = window.activeSemesterFilter || '1';
  const draftKey = `${teacher}_${currentTerm}`;
  if(window._dndDraft[draftKey]) delete window._dndDraft[draftKey][day+'_'+period];
  const cell = document.getElementById(`dnd-cell-${day}-${period}`);
  if(cell) cell.innerHTML='';
  const badge = document.getElementById('dnd-unsaved-badge');
  if(badge) badge.style.display='';
}

window.saveDndTeacherSchedule = function(){
  const teacher = document.getElementById('dnd-teacher')?.value||'';
  if(!teacher){
    return;
  }
  
  // Calibrate ID counters before adding new schedules
  if (window.calibrateIdCounters) window.calibrateIdCounters();
  
  const currentTerm = window.activeSemesterFilter || '1';
  const draftKey = `${teacher}_${currentTerm}`;
  
  // Remove all old schedules for subjects taught by this teacher for this term
  const teacherSubIds = window.subjects.filter(s=>s.teacher===teacher).map(s=>s.id);
  window.schedules = window.schedules.filter(sc=>!(teacherSubIds.includes(sc.subjectId) && (sc.term === currentTerm || !sc.term)));
  
  // Add from draft
  const draft = window._dndDraft[draftKey]||{};
  Object.entries(draft).forEach(([key,cell])=>{
    const [day,period] = key.split('_');
    window.schedules.push({
      id:'sc'+window.nextSchedId++,
      roomId:cell.roomId,
      subjectId:cell.subjectId,
      day:+day,
      period:+period,
      start:window.periodConfig[+period-1]?.start||'08:00',
      end:window.periodConfig[+period-1]?.end||'09:00',
      term:currentTerm,
      loc:''
    });
  });
  
  window.snapshotVersion('แก้ไขตารางเรียน');
  const badge = document.getElementById('dnd-unsaved-badge');
  if(badge) badge.style.display='none';
  window.pushSchedules();
  window.toast('✅ บันทึกตารางสอนแล้ว');
}

window.clearDndTeacher = function(){
  const teacher = document.getElementById('dnd-teacher')?.value||'';
  if(!teacher) return;
  if(!confirm(`ล้างตารางสอนของ ${teacher}?`)) return;
  const currentTerm = window.activeSemesterFilter || '1';
  const draftKey = `${teacher}_${currentTerm}`;
  window._dndDraft[draftKey]={};
  window.renderDndGrid();
  const badge = document.getElementById('dnd-unsaved-badge');
  if(badge) badge.style.display='';
}

window.populateSchedDropdowns = function(){
  const tsel = document.getElementById('dnd-teacher');
  if(tsel){
    const cur = tsel.value;
    const teachers = [...new Set(window.subjects.map(s=>s.teacher).filter(Boolean))].sort();
    tsel.innerHTML = '<option value="">-- เลือกครูผู้สอน --</option>' + teachers.map(t=>`<option value="${t}">${t}</option>`).join('');
    if(cur && teachers.includes(cur)) tsel.value = cur;
  }
}

// renderPeriodSettings: renders period time config in the schedule settings area
window.renderPeriodSettings = function() {
  const container = document.getElementById('period-settings');
  if (!container) return;
  container.innerHTML = window.periodConfig.map((p, i) => `
    <div style="display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:12px;font-weight:600;color:var(--text2);min-width:44px">คาบ ${p.no}</span>
      <input type="time" value="${p.start}" class="inp" style="width:75px;font-size:11px;padding:3px"
        onchange="window.periodConfig[${i}].start=this.value;window.renderDndGrid()">
      <span style="font-size:11px;color:var(--text3)">–</span>
      <input type="time" value="${p.end}" class="inp" style="width:75px;font-size:11px;padding:3px"
        onchange="window.periodConfig[${i}].end=this.value;window.renderDndGrid()">
    </div>
  `).join('');
};
