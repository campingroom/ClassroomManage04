// ====== SETUP: ห้องเรียน ======

window.renderSetupRooms = function(){
  window.renderRoomListMini();
  window.renderAllStudentStats();
  if(window.rooms.length && !window.classData[window.currentClass]){
    window.currentClass = window.rooms[0].id;
  }
  window.renderStudents();
  window.renderRoomTabs();
  if(window.updateSidebarProfileUI) window.updateSidebarProfileUI();
}

window.renderAllStudentStats = function(){
  const allSts = window.rooms.flatMap(r=>window.classData[r.id]||[]);
  const cr = document.getElementById('cr-total'); if(cr) cr.textContent = window.rooms.length;
  const ast = document.getElementById('all-students-total'); if(ast) ast.textContent = allSts.length;
  const asm = document.getElementById('all-students-male'); if(asm) asm.textContent = allSts.filter(s=>s.gender==='ชาย').length;
  const asf = document.getElementById('all-students-female'); if(asf) asf.textContent = allSts.filter(s=>s.gender==='หญิง').length;
}

window.renderRoomListMini = function(){
  const container = document.getElementById('room-cards-container');
  if(!container) return;
  
  if(!window.rooms.length){
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--text3); background:var(--surface); border:1.5px dashed var(--border); border-radius:16px;">ยังไม่มีห้องเรียน กดปุ่ม "สร้างห้องเรียน" เพื่อเริ่มสร้าง</div>`;
    return;
  }
  
  container.innerHTML = window.rooms.map(r => {
    const students = window.classData[r.id] || [];
    const maleCount = students.filter(s => s.gender === 'ชาย').length;
    const femaleCount = students.filter(s => s.gender === 'หญิง').length;
    const isActive = r.id === window.currentClass;
    
    return `
      <div class="room-card ${isActive ? 'active' : ''}">
        <div class="room-card-header">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <div class="room-card-title">${r.level}/${r.section}</div>
            <div style="display: flex; gap: 6px; margin-top: 4px;">
              <button class="btn-edit-outlined" style="padding: 2px 6px; font-size: 10.5px; border-radius: 6px;" onclick="editRoom('${r.id}');event.stopPropagation()">✏️ แก้ไข</button>
              <button class="btn-delete-outlined" style="padding: 2px 6px; font-size: 10.5px; border-radius: 6px;" onclick="deleteRoom('${r.id}');event.stopPropagation()">🗑 ลบ</button>
            </div>
          </div>
          <div class="room-card-badge">${students.length} คน</div>
        </div>
        <div class="room-card-body">
          <div class="room-card-info">
            👤 ครูผู้สอน: ${window.esc(r.teacher || 'ไม่ระบุ')}
          </div>
          <div class="room-card-stats">
            ชาย ${maleCount} คน • หญิง ${femaleCount} คน
          </div>
        </div>
        <div style="margin-top: 8px;">
          ${isActive 
            ? `<div class="room-card-btn-active">กำลังดูรายชื่ออยู่</div>`
            : `<button class="room-card-btn-inactive" onclick="selectRoomMini('${r.id}')">เปิดดูรายชื่อ</button>`
          }
        </div>
      </div>
    `;
  }).join('');
};

window.toggleCheckAllRooms = function(checked) {
  document.querySelectorAll('.room-select-cb').forEach(cb => {
    cb.checked = checked;
  });
  window.onRoomCheckboxChange();
};

window.onRoomCheckboxChange = function() {
  const checkedCbs = document.querySelectorAll('.room-select-cb:checked');
  const bulkBtn = document.getElementById('btn-bulk-delete-rooms');
  if (bulkBtn) {
    bulkBtn.style.display = checkedCbs.length > 0 ? 'inline-flex' : 'none';
  }
  
  // Update select all checkbox state
  const checkAll = document.getElementById('check-all-rooms');
  if (checkAll) {
    const totalCbs = document.querySelectorAll('.room-select-cb');
    checkAll.checked = totalCbs.length > 0 && checkedCbs.length === totalCbs.length;
  }
};

window.bulkDeleteRooms = function() {
  const checkedCbs = [...document.querySelectorAll('.room-select-cb:checked')];
  const idsToDelete = checkedCbs.map(cb => cb.value);
  if (!idsToDelete.length) return;
  
  if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบห้องเรียนที่เลือกทั้ง ${idsToDelete.length} ห้อง? (ข้อมูลนักเรียนในห้องเหล่านี้จะถูกลบไปด้วย)`)) return;
  
  window.rooms = window.rooms.filter(r => !idsToDelete.includes(r.id));
  
  // Clear classData and classSubjects for deleted rooms
  idsToDelete.forEach(id => {
    delete window.classData[id];
    delete window.classSubjects[id];
  });
  
  // If currentClass is in deleted rooms, reset it
  if (idsToDelete.includes(window.currentClass)) {
    window.currentClass = window.rooms[0]?.id || '';
  }
  
  window.toast(`🗑️ ลบห้องเรียนที่เลือกสำเร็จ ${idsToDelete.length} ห้อง`);
  
  // Reset Check All checkbox
  const checkAll = document.getElementById('check-all-rooms');
  if (checkAll) checkAll.checked = false;
  
  const bulkBtn = document.getElementById('btn-bulk-delete-rooms');
  if (bulkBtn) bulkBtn.style.display = 'none';
  
  window.snapshotVersion('ลบห้องเรียนหลายห้อง');
  window.syncSubjectsToClassSubjects();
  window.rebuildClassSelector();
  window.renderSetupRooms();
  
  if (window.GS_URL) {
    window.pushRooms().catch(e => console.warn('pushRooms:', e.message));
  }
};

window.selectRoomMini = function(rid){
  window.currentClass = rid;
  window.renderStudents();
  window.renderRoomTabs();
  window.renderRoomListMini();
  if(window.updateTopbarClassBadge) window.updateTopbarClassBadge();
}

window.renderRoomTabs = function(){
  const wrap = document.getElementById('student-room-tabs');
  if(!wrap) return;

  const allActive = window.currentClass === 'all';
  const allStsCount = window.rooms.flatMap(r=>window.classData[r.id]||[]).length;

  const allTabHtml = `<button
    style="padding:6px 14px;border-radius:8px;border:1.5px solid ${allActive?'var(--accent)':'var(--border)'};background:${allActive?'var(--accent)':'var(--surface)'};color:${allActive?'#fff':'var(--text2)'};font-size:12px;font-weight:600;cursor:pointer;font-family:Sarabun,sans-serif"
    onclick="selectRoomMini('all')">
    ทุกห้อง <span style="opacity:.8">${allStsCount}</span>
  </button>`;

  const roomsHtml = window.rooms.map(r=>`<button
    style="padding:6px 14px;border-radius:8px;border:1.5px solid ${r.id===window.currentClass?'var(--accent)':'var(--border)'};background:${r.id===window.currentClass?'var(--accent)':'var(--surface)'};color:${r.id===window.currentClass?'#fff':'var(--text2)'};font-size:12px;font-weight:600;cursor:pointer;font-family:Sarabun,sans-serif"
    onclick="selectRoomMini('${r.id}')">
    ${r.level}/${r.section} <span style="opacity:.8">${(window.classData[r.id]||[]).length}</span>
  </button>`).join('');

  wrap.innerHTML = allTabHtml + roomsHtml;

  const title = document.getElementById('student-card-title');
  if(title) {
    if(window.currentClass === 'all') {
      title.textContent = 'นักเรียนทั้งหมดทุกห้อง';
    } else {
      const rm = window.rooms.find(r=>r.id===window.currentClass);
      if(rm) title.textContent = `นักเรียน ${rm.level}/${rm.section}`;
    }
  }
}

window.saveRoom = function(){
  const level = document.getElementById('room-level')?.value||'ม.1';
  const section = document.getElementById('room-section')?.value||'';
  if(!section.trim()){window.toast('⚠️ กรอกชื่อห้อง');return;}
  const editId = document.getElementById('edit-room-id')?.value||'';
  const year = document.getElementById('room-year')?.value||'2568';
  const semester = document.getElementById('room-semester')?.value||'1';
  const teacher = document.getElementById('room-teacher')?.value||'';
  const note = document.getElementById('room-note')?.value||'';

  if(editId){
    const r = window.rooms.find(x=>x.id===editId);
    if(r) Object.assign(r,{level,section,year,semester,teacher,note});
    window.toast('✅ อัปเดตห้องเรียนแล้ว');
  } else {
    const id = 'r'+window.nextRoomId++;
    window.rooms.push({id,level,section,year,semester,teacher,note});
    if(!window.classData[id]) window.classData[id]=[];
    window.currentClass = id;
    window.toast('✅ สร้างห้องเรียนแล้ว');
  }
  window.closeModal('add-room-modal');
  window.snapshotVersion('แก้ไขห้องเรียน');
  window.syncSubjectsToClassSubjects();
  window.rebuildClassSelector();
  window.renderSetupRooms();
  if(window.GS_URL){ window.pushRooms().catch(e=>console.warn('pushRooms:',e.message)); }
}

window.openCreateRoomModal = function(){
  const e1 = document.getElementById('edit-room-id'); if(e1) e1.value = '';
  const e2 = document.getElementById('room-level'); if(e2) e2.value = 'ม.3';
  const e3 = document.getElementById('room-section'); if(e3) e3.value = '';
  const e4 = document.getElementById('room-year'); if(e4) e4.value = '2568';
  const e5 = document.getElementById('room-semester'); if(e5) e5.value = '1';
  const e6 = document.getElementById('room-teacher'); if(e6) e6.value = '';
  const e7 = document.getElementById('room-note'); if(e7) e7.value = '';
  
  const title = document.getElementById('modal-room-title');
  if(title) title.textContent = '➕ สร้างห้องเรียนใหม่';
  
  const el = document.getElementById('add-room-modal');
  if(el) el.classList.add('open');
}

window.editRoom = function(id){
  const r = window.rooms.find(x=>x.id===id);
  if(!r) return;
  const e1 = document.getElementById('edit-room-id'); if(e1) e1.value = id;
  const e2 = document.getElementById('room-level'); if(e2) e2.value = r.level;
  const e3 = document.getElementById('room-section'); if(e3) e3.value = r.section;
  const e4 = document.getElementById('room-year'); if(e4) e4.value = r.year||'2568';
  const e5 = document.getElementById('room-semester'); if(e5) e5.value = r.semester||'1';
  const e6 = document.getElementById('room-teacher'); if(e6) e6.value = r.teacher||'';
  const e7 = document.getElementById('room-note'); if(e7) e7.value = r.note||'';
  
  const title = document.getElementById('modal-room-title');
  if(title) title.textContent = '✏️ แก้ไขห้องเรียน';
  
  const el = document.getElementById('add-room-modal');
  if(el) el.classList.add('open');
}

window.cancelRoomEdit = function(){
  window.closeModal('add-room-modal');
}

window.deleteRoom = function(id){
  if(!confirm('ลบห้องเรียนนี้? นักเรียนทั้งหมดในห้องจะถูกลบด้วย')) return;
  window.rooms = window.rooms.filter(r=>r.id!==id);
  delete window.classData[id];
  if(window.currentClass===id) window.currentClass = window.rooms[0]?.id||'';
  window.snapshotVersion('ลบห้องเรียน');
  window.syncSubjectsToClassSubjects();
  window.rebuildClassSelector();
  window.renderSetupRooms();
  window.pushRooms();
  window.toast('🗑 ลบห้องเรียนแล้ว');
}
