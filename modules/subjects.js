// ====== SETUP: รายวิชา ======
window._subjSortCol = 'term';
window._subjSortDir = 'asc';

window.sortSubjects = function(col){
  if(window._subjSortCol === col){
    window._subjSortDir = window._subjSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    window._subjSortCol = col;
    window._subjSortDir = 'asc';
  }
  window.renderSubjectList();
}

// ensure safeSet helper is available locally if not defined on window
const localSafeSet = function(id, val) {
  const el = document.getElementById(id);
  if(el) el.value = val;
};

window.renderSubjectList = function(){
  window.populateSubjRooms();
  const q = (document.getElementById('search-subj')?.value||'').toLowerCase();
  const filtered = window.subjects.filter(s=>
    s.name.toLowerCase().includes(q)||
    (s.code||'').toLowerCase().includes(q)||
    (s.teacher||'').toLowerCase().includes(q)
  );
  
  // Apply sorting
  const col = window._subjSortCol || 'code';
  const dir = window._subjSortDir || 'asc';
  
  filtered.sort((a, b) => {
    let res = 0;
    if (col === 'code') {
      res = (a.code || '').localeCompare(b.code || '');
    } else if (col === 'name') {
      res = (a.name || '').localeCompare(b.name || '', 'th');
    } else if (col === 'term') {
      const aTerm = a.term || '1';
      const bTerm = b.term || '1';
      res = aTerm.localeCompare(bTerm);
    } else if (col === 'teacher') {
      res = (a.teacher || '').localeCompare(b.teacher || '', 'th');
    } else if (col === 'credits') {
      res = (parseFloat(a.credits) || 0) - (parseFloat(b.credits) || 0);
    } else if (col === 'rooms') {
      const aRoomNames = (a.rooms||[]).map(rid=>{
        const r=window.rooms.find(x=>x.id===rid || `${x.level}/${x.section}`===rid);
        return r?r.level+'/'+r.section:rid;
      }).join(', ');
      const bRoomNames = (b.rooms||[]).map(rid=>{
        const r=window.rooms.find(x=>x.id===rid || `${x.level}/${x.section}`===rid);
        return r?r.level+'/'+r.section:rid;
      }).join(', ');
      res = aRoomNames.localeCompare(bRoomNames, 'th');
    }
    return dir === 'asc' ? res : -res;
  });

  // Update header sort indicator arrows
  const headers = {
    'code': {id: 'th-subj-code', label: 'รหัส'},
    'name': {id: 'th-subj-name', label: 'ชื่อวิชา'},
    'term': {id: 'th-subj-term', label: 'ภาคเรียน'},
    'teacher': {id: 'th-subj-teacher', label: 'ครูผู้สอน'},
    'credits': {id: 'th-subj-credits', label: 'หน่วยกิต'},
    'rooms': {id: 'th-subj-rooms', label: 'ห้องที่เรียน'}
  };
  
  Object.keys(headers).forEach(k => {
    const el = document.getElementById(headers[k].id);
    if (el) {
      if (k === col) {
        el.innerHTML = `${headers[k].label} ${dir === 'asc' ? '▲' : '▼'}`;
        el.style.color = 'var(--accent)';
        el.style.fontWeight = '700';
      } else {
        el.innerHTML = headers[k].label;
        el.style.color = '';
        el.style.fontWeight = '';
      }
    }
  });

  // Reset select all checkbox and delete selected button on render
  const selectAll = document.getElementById('subj-select-all');
  if (selectAll) selectAll.checked = false;
  const delBtn = document.getElementById('btn-delete-selected-subs');
  if (delBtn) delBtn.style.display = 'none';

  const tbody = document.getElementById('subj-tbody');
  if(!tbody) return;

  // Calculate credit summaries
  let c1 = 0, c2 = 0, cAll = 0;
  window.subjects.forEach(s => {
    const cred = parseFloat(s.credits) || 0;
    if (s.term === '1') c1 += cred;
    else if (s.term === '2') c2 += cred;
    else cAll += cred;
  });
  const totalC = c1 + c2 + cAll;
  
  let rowsHTML = filtered.length ? filtered.map(s=>{
    const roomNames = (s.rooms||[]).map(rid=>{
      const r=window.rooms.find(x=>x.id===rid || `${x.level}/${x.section}`===rid);
      return r?r.level+'/'+r.section:rid;
    }).join(', ');
    
    let termText = 'ภาคเรียนที่ 1';
    if (s.term === '2') termText = 'ภาคเรียนที่ 2';
    else if (s.term === 'all') termText = 'เรียนทั้งปีการศึกษา';
    
    const typeBadge = s.type === 'additional'
      ? `<span class="badge" style="background:var(--purple-light);color:var(--purple);font-size:10px;margin-left:6px;font-weight:700">เพิ่มเติม</span>`
      : `<span class="badge" style="background:var(--accent-light);color:var(--accent);font-size:10px;margin-left:6px;font-weight:700">พื้นฐาน</span>`;

    return `<tr>
      <td style="text-align:center;vertical-align:middle">
        <input type="checkbox" class="subj-row-cb" data-id="${s.id}" onchange="window.checkSubjectSelection()" style="width:16px;height:16px;cursor:pointer;vertical-align:middle">
      </td>
      <td style="font-size:12px;color:var(--text3)">${s.code||'-'}</td>
      <td style="font-weight:500">${s.name}${typeBadge}</td>
      <td style="font-size:12px;color:var(--text2)">${termText}</td>
      <td style="font-size:12px">${s.teacher||'-'}</td>
      <td class="ctr"><span class="badge badge-info">${s.credits}</span></td>
      <td style="font-size:12px;color:var(--text2)">${roomNames||'-'}</td>
      <td class="ctr">
        <div style="display:flex;gap:5px;justify-content:center">
          <button class="btn btn-outline btn-sm" onclick="editSubject('${s.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteSubject2('${s.id}')">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="8" style="text-align:center;padding:28px;color:var(--text3)">ยังไม่มีรายวิชา</td></tr>';

  if (filtered.length) {
    rowsHTML += `<tr style="background:var(--surface2);font-weight:700">
      <td colspan="5" style="text-align:right;vertical-align:middle">หน่วยกิตรวมสะสม:</td>
      <td class="ctr" style="vertical-align:middle">
        <div style="font-size:11px;text-align:left;display:inline-block;font-weight:700;color:var(--text2);line-height:1.4">
          เทอม 1: <span style="color:var(--accent)">${c1}</span> นก.<br>
          เทอม 2: <span style="color:var(--accent)">${c2}</span> นก.<br>
          เรียนทั้งปี: <span style="color:var(--accent)">${cAll}</span> นก.<br>
          <hr style="margin:2px 0;border:none;border-top:1px solid var(--border)">
          รวมทั้งสิ้น: <span style="color:var(--teal)">${totalC}</span> นก.
        </div>
      </td>
      <td colspan="2"></td>
    </tr>`;
  }
  
  tbody.innerHTML = rowsHTML;
  
  window.syncSubjectsToClassSubjects();
}

window.toggleSelectAllSubjects = function(checked){
  document.querySelectorAll('.subj-row-cb').forEach(cb => cb.checked = checked);
  window.checkSubjectSelection();
}

window.checkSubjectSelection = function(){
  const cbs = document.querySelectorAll('.subj-row-cb');
  const checkedCbs = document.querySelectorAll('.subj-row-cb:checked');
  const delBtn = document.getElementById('btn-delete-selected-subs');
  const countSpan = document.getElementById('selected-subs-count');
  
  if (delBtn && countSpan) {
    if (checkedCbs.length > 0) {
      delBtn.style.display = 'inline-flex';
      countSpan.textContent = checkedCbs.length;
    } else {
      delBtn.style.display = 'none';
    }
  }
  
  const selectAll = document.getElementById('subj-select-all');
  if (selectAll && cbs.length > 0) {
    selectAll.checked = cbs.length === checkedCbs.length;
  }
}

window.deleteSelectedSubjects = function(){
  const checkedCbs = document.querySelectorAll('.subj-row-cb:checked');
  if (!checkedCbs.length) return;
  
  if (!confirm(`ต้องการลบรายวิชาที่เลือกทั้งหมด ${checkedCbs.length} วิชาใช่หรือไม่?`)) return;
  
  const idsToDelete = Array.from(checkedCbs).map(cb => cb.dataset.id);
  window.subjects = window.subjects.filter(s => !idsToDelete.includes(s.id));
  
  window.snapshotVersion('ลบหลายรายวิชา');
  window.syncSubjectsToClassSubjects();
  window.renderSubjectList();
  window.pushSubjects();
  window.toast(`🗑 ลบ ${checkedCbs.length} รายวิชาสำเร็จ`);
}


window.populateSubjRooms = function(){
  const wrap = document.getElementById('subj-rooms-check');
  if(!wrap) return;
  wrap.innerHTML = window.rooms.map(r=>`<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
    <input type="checkbox" class="subj-room-cb" value="${r.id}"
      style="width:15px;height:15px">
    ${r.level}/${r.section}
  </label>`).join('');
}

window.clearSubjForm = function(){
  const ss = window.safeSetHelper || localSafeSet;
  ss('edit-subj-id','');
  ss('subj-name','');
  ss('subj-code','');
  ss('subj-credits','2');
  ss('subj-teacher','');
  ss('subj-note','');
  ss('subj-term','1');
  ss('subj-type','basic');
  document.querySelectorAll('#subj-rooms-check input').forEach(cb=>cb.checked=false);
}

window.openCreateSubjectModal = function(){
  window.clearSubjForm();
  const title = document.getElementById('modal-subj-title');
  if(title) title.textContent = '➕ เพิ่มรายวิชา';
  const el = document.getElementById('add-subject-modal');
  if(el) el.classList.add('open');
}

window.saveSubject = function(){
  if (window.calibrateIdCounters) window.calibrateIdCounters();
  const name = (document.getElementById('subj-name')?.value||'').trim();
  if(!name){window.toast('⚠️ กรอกชื่อวิชา');return;}
  const editId = (document.getElementById('edit-subj-id')?.value||'');
  const code = (document.getElementById('subj-code')?.value||'').trim();
  const credits = parseFloat(document.getElementById('subj-credits')?.value||'')||2;
  const teacher = document.getElementById('subj-teacher')?.value||'';
  const note = document.getElementById('subj-note')?.value||'';
  const term = document.getElementById('subj-term')?.value||'1';
  const type = document.getElementById('subj-type')?.value||'basic';
  const roomsChk = [...document.querySelectorAll('#subj-rooms-check input:checked')].map(i=>i.value);
  
  if(editId){
    const s = window.subjects.find(x=>x.id===editId);
    if(s) Object.assign(s,{name,code:code||'',credits,teacher,note,rooms:roomsChk,term,type});
    window.cancelSubjEdit();
    window.toast('✅ อัปเดตวิชาแล้ว');
  } else {
    window.subjects.push({id:'s'+window.nextSubjId++,name,code:code||'',credits,teacher,note,rooms:roomsChk,term,type});
    window.cancelSubjEdit();
    window.toast('✅ เพิ่มวิชาแล้ว');
  }
  window.snapshotVersion('แก้ไขรายวิชา');
  window.syncSubjectsToClassSubjects();
  window.renderSubjectList();
  window.pushSubjects();
}

window.editSubject = function(id){
  const s = window.subjects.find(x=>x.id===id);
  if(!s) return;
  if(!Array.isArray(s.rooms)) s.rooms=s.rooms?[s.rooms]:[];
  
  const ss = window.safeSetHelper || localSafeSet;
  ss('subj-name', s.name);
  ss('edit-subj-id', id);
  ss('subj-code', s.code||'');
  ss('subj-credits', s.credits);
  ss('subj-teacher', s.teacher||'');
  ss('subj-note', s.note||'');
  ss('subj-term', s.term || '1');
  ss('subj-type', s.type || 'basic');
  
  // Check room checkboxes
  document.querySelectorAll('#subj-rooms-check input').forEach(cb=>{
    cb.checked = s.rooms.includes(cb.value);
  });
  
  const title = document.getElementById('modal-subj-title');
  if(title) title.textContent='✏️ แก้ไขรายวิชา';
  
  const el = document.getElementById('add-subject-modal');
  if(el) el.classList.add('open');
}

window.cancelSubjEdit = function(){
  window.clearSubjForm();
  window.closeModal('add-subject-modal');
}

window.deleteSubject2 = function(id){
  if(!confirm('ลบวิชานี้?')) return;
  window.subjects = window.subjects.filter(s=>s.id!==id);
  window.syncSubjectsToClassSubjects();
  window.renderSubjectList();
  window.snapshotVersion('ลบรายวิชา');
  window.pushSubjects();
  window.toast('🗑 ลบวิชาแล้ว');
}
