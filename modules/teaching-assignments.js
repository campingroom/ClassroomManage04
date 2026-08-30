// ====== TEACHING — ASSIGNMENTS (to-do list of งาน/assignments) ======
// แยกออกมาจาก teaching.js เดิม — ดูไฟล์พี่น้อง: teaching-workgrid.js, teaching-materials.js, teaching-assessment.js

// ====== ASSIGNMENTS ======
window.renderAssignments = function(){
  const sub=window.activeSubjectTab.assignments;
  const today_=window.today();
  const currentTerm = window.activeSemesterFilter || '1';
  const filtered=window.assignments.filter(a=> {
    if (a.cls !== window.currentClass) return false;
    if (sub) return a.subject === sub;
    const subObj = window.subjects.find(s => s.name === a.subject);
    if (!subObj) return true;
    return currentTerm === 'all' || subObj.term === 'all' || subObj.term === currentTerm;
  });
  
  const asnTotal = document.getElementById('asn-total'); if(asnTotal) asnTotal.textContent=filtered.length;
  const asnPending = document.getElementById('asn-pending'); if(asnPending) asnPending.textContent=filtered.filter(a=>a.status==='pending'&&a.due>=today_).length;
  const asnOverdue = document.getElementById('asn-overdue'); if(asnOverdue) asnOverdue.textContent=filtered.filter(a=>a.due<today_&&a.status!=='done').length;
  
  const listTitle = document.getElementById('asn-list-title'); if(listTitle) listTitle.textContent=sub?`งาน: ${sub}`:'งานทั้งหมด';
  
  const listEl = document.getElementById('asn-list');
  if (listEl) {
    listEl.innerHTML=filtered.length?[...filtered].reverse().map(a=>{
      const overdue=a.due<today_&&a.status!=='done';
      return `<div class="asn-item">
        <span class="asn-dot ${a.status==='done'?'asn-done':overdue?'asn-overdue':'asn-pending'}"></span>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:500">${window.esc(a.name)}</div>
          <div style="font-size:11px;color:var(--text3)">${window.esc(a.subject)} · ส่ง ${a.due}${overdue?' ⚠️':''}</div>
        </div>
        <div style="display:flex;gap:6px">
          ${a.status!=='done'?`<button class="btn btn-teal btn-sm" onclick="doneAsn(${a.id})">✓</button>`:''}
          <button class="btn btn-danger btn-sm" onclick="delAsn(${a.id})">ลบ</button>
        </div>
      </div>`;
    }).join(''):'<p style="color:var(--text3);font-size:13px;text-align:center;padding:20px">ยังไม่มีงาน</p>';
  }
}

window.filterAssignments = function(status, btn){
  document.querySelectorAll('.asn-filter-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
}

window.addAssignment = function(){
  const name=(document.getElementById('asn-name')?.value||'').trim();
  if(!name){window.toast('⚠️ กรอกชื่องาน');return;}
  window.assignments.push({id:Date.now(),name,
    subject:document.getElementById('asn-subject-sel')?.value||document.getElementById('work-subject')?.value||'',
    due:document.getElementById('asn-due')?.value||window.today(),
    desc:document.getElementById('asn-desc')?.value||'',
    status:'pending',cls:window.currentClass});
  ['asn-name','asn-due','asn-desc'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.value='';
  });
  window.toast('✅ เพิ่มงานแล้ว');
  window.renderAssignments();
}

window.doneAsn = function(id){
  const a=window.assignments.find(x=>x.id===id);
  if(a)a.status='done';
  window.renderAssignments();
}

window.delAsn = function(id){
  window.assignments=window.assignments.filter(a=>a.id!==id);
  window.renderAssignments();
}
