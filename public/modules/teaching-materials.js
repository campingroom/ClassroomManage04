// ====== TEACHING — MATERIALS (สื่อการสอน) ======

// ====== MATERIALS ======
window.renderMaterials = function(){
  const subs=window.getSubjects();
  const sel=document.getElementById('mat-subject');
  if(sel)sel.innerHTML=subs.map(s=>`<option>${s}</option>`).join('');
  const sub=window.activeSubjectTab.materials;
  const filtered=window.materials.filter(m=>m.cls===window.currentClass&&(!sub||m.subject===sub));
  const tbody=document.getElementById('mat-tbody');
  if(tbody) {
    tbody.innerHTML=filtered.length?filtered.map(m=>`<tr><td>${m.type}</td><td>${window.esc(m.name)}</td><td style="color:var(--text3)">${window.esc(m.subject)}</td><td style="color:var(--text3);font-size:12px">${m.date}</td><td class="ctr"><button class="btn btn-danger btn-sm" onclick="delMat(${m.id})">ลบ</button></td></tr>`).join(''):`<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text3)">ยังไม่มีสื่อ</td></tr>`;
  }
}

const MAT_TYPE_ICONS = {
  '📄 เอกสาร':'📄','🎥 วีดิโอ':'🎥','🔗 ลิงก์':'🔗',
  '📊 Slides':'📊','🖼 รูปภาพ':'🖼','📝 บทเรียน':'📝',
};

window.populateMatDropdowns = function(){
  const ssel=document.getElementById('mat-subject');
  const fsel=document.getElementById('mat-filter-subj');
  const currentTerm = window.activeSemesterFilter || '1';
  const filtered = window.subjects.filter(s => currentTerm === 'all' || s.term === 'all' || s.term === currentTerm);
  
  const buildOptionsHTML = (subsList, hasEmptyOption = false) => {
    let html = hasEmptyOption ? '<option value="">ทุกวิชา</option>' : '';
    if (!subsList.length) {
      return html + '<option value="">-- ยังไม่มีวิชา --</option>';
    }
    if (currentTerm === 'all') {
      const t1 = subsList.filter(s => s.term === '1');
      const t2 = subsList.filter(s => s.term === '2');
      const tAll = subsList.filter(s => s.term === 'all' || !s.term);
      if (t1.length) {
        html += `<optgroup label="ภาคเรียนที่ 1">` + t1.map(s=>`<option value="${s.id}">${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
      }
      if (t2.length) {
        html += `<optgroup label="ภาคเรียนที่ 2">` + t2.map(s=>`<option value="${s.id}">${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
      }
      if (tAll.length) {
        html += `<optgroup label="เรียนทั้งปีการศึกษา">` + tAll.map(s=>`<option value="${s.id}">${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
      }
    } else {
      html += subsList.map(s=>`<option value="${s.id}">${window.esc(s.name)}</option>`).join('');
    }
    return html;
  };
  
  if(ssel) ssel.innerHTML = buildOptionsHTML(filtered, false);
  if(fsel) fsel.innerHTML = buildOptionsHTML(filtered, true);
}

window.renderMaterials2 = function(){
  const grid=document.getElementById('mat-grid');
  if(!grid) return;
  const filterSid=document.getElementById('mat-filter-subj')?.value||'';
  const currentTerm = window.activeSemesterFilter || '1';
  const filtered = filterSid
    ? window.materials.filter(m=>m.subject===filterSid)
    : window.materials.filter(m=>{
        const s = window.subjects.find(sub => sub.id === m.subject);
        if(!s) return true;
        return currentTerm === 'all' || s.term === 'all' || s.term === currentTerm;
      });

  if(!filtered.length){
    grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3)">
      <div style="font-size:36px;margin-bottom:8px">📭</div>
      <div style="font-size:14px">ยังไม่มีสื่อการสอน</div>
      <div style="font-size:12px;margin-top:4px">เพิ่มสื่อจากฟอร์มด้านซ้าย</div>
    </div>`;
    return;
  }

  grid.innerHTML=filtered.map(m=>{
    const sub=window.subjects.find(s=>s.id===m.subject);
    const icon=MAT_TYPE_ICONS[m.type]||'📄';
    const hasUrl=m.url&&m.url.startsWith('http');
    return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;transition:all .18s;position:relative" class="mat-card">
      <button onclick="deleteMaterial(${m.id})" class="mat-del-btn" style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;color:var(--text3);font-size:13px;opacity:0;transition:opacity .15s">✕</button>
      <div style="font-size:28px;margin-bottom:8px">${icon}</div>
      <div style="font-size:13px;font-weight:700;margin-bottom:4px;padding-right:20px">${window.esc(m.name)}</div>
      ${sub?`<div style="font-size:11px;color:var(--accent);font-weight:600;margin-bottom:6px">${window.esc(sub.name)}</div>`:''}
      ${m.note?`<div style="font-size:11px;color:var(--text3);margin-bottom:8px">${window.esc(m.note)}</div>`:''}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
        <span style="font-size:10px;color:var(--text3)">${m.date||''}</span>
        ${hasUrl?`<a href="${window.esc(m.url)}" target="_blank" rel="noopener noreferrer"
          style="font-size:11px;font-weight:600;color:var(--accent);background:var(--accent-light);padding:3px 10px;border-radius:8px;text-decoration:none">
          🔗 เปิด
        </a>`:''}
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.mat-del-btn').forEach(btn=>{
    const card = btn.closest('.mat-card');
    if (card) {
      card.onmouseover=function(){
        this.style.boxShadow='0 4px 16px rgba(0,0,0,.1)';
        this.style.borderColor='var(--accent)';
        const d = this.querySelector('.mat-del-btn'); if(d) d.style.opacity='1';
      };
      card.onmouseout=function(){
        this.style.boxShadow='';
        this.style.borderColor='var(--border)';
        const d = this.querySelector('.mat-del-btn'); if(d) d.style.opacity='0';
      };
    }
  });
}

window.deleteMaterial = function(id){
  if(!confirm('ลบสื่อนี้?')) return;
  window.materials=window.materials.filter(m=>m.id!==id);
  window.renderMaterials2();
  window.toast('🗑 ลบสื่อแล้ว');
}

window.addMaterial = function(){
  const name=(document.getElementById('mat-name')?.value||'').trim();
  if(!name){window.toast('⚠️ กรอกชื่อสื่อ');return;}
  window.materials.push({id:Date.now(),name,
    type:document.getElementById('mat-type')?.value||'',
    subject:document.getElementById('mat-subject')?.value||'',
    url:document.getElementById('mat-url')?.value||'',
    note:document.getElementById('mat-note')?.value||'',
    date:window.today(),cls:window.currentClass});
    
  const mnEl=document.getElementById('mat-name'); if(mnEl) mnEl.value='';
  const muEl=document.getElementById('mat-url'); if(muEl) muEl.value='';
  const mtEl=document.getElementById('mat-note'); if(mtEl) mtEl.value='';
  window.renderMaterials2();
  window.toast('✅ เพิ่มสื่อแล้ว');
}

window.delMat = function(id){
  window.materials=window.materials.filter(m=>m.id!==id);
  window.renderMaterials();
}

