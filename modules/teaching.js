// ====== TEACHING: งาน, สื่อ & ประเมินผล ======

const PHASE_LABELS = {
  'pre':      'ก่อนกลางภาค',
  'mid-exam': 'สอบกลางภาค',
  'post':     'หลังกลางภาค',
  'final':    'สอบปลายภาค',
};
const PHASE_COLORS = {
  'pre':'var(--teal)','mid-exam':'var(--purple)','post':'var(--accent)','final':'var(--red)'
};

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
          <div style="font-size:13px;font-weight:500">${a.name}</div>
          <div style="font-size:11px;color:var(--text3)">${a.subject} · ส่ง ${a.due}${overdue?' ⚠️':''}</div>
        </div>
        <div style="display:flex;gap:6px">
          ${a.status!=='done'?`<button class="btn btn-teal btn-sm" onclick="doneAsn(${a.id})">✓</button>`:''}
          <button class="btn btn-danger btn-sm" onclick="delAsn(${a.id})">ลบ</button>
        </div>
      </div>`;
    }).join(''):'<p style="color:var(--text3);font-size:13px;text-align:center;padding:20px">ยังไม่มีงาน</p>';
  }
}

// ====== TEACHING PANEL ======
window.renderTeaching = function(){
  const rsel=document.getElementById('work-room');
  if(rsel&&window.rooms.length){
    const cur=rsel.value;
    rsel.innerHTML=window.rooms.map(r=>`<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
    if(cur&&window.rooms.find(r=>r.id===cur)) rsel.value=cur;
    else if(window.rooms[0]) rsel.value=window.rooms[0].id;
  }
  window.populateWorkSubjects();
  window.renderWorkPanel();
}

window.onWorkRoomChange = function(){
  window.populateWorkSubjects();
  window.renderWorkPanel();
}

window.populateWorkSubjects = function(){
  const rid=document.getElementById('work-room')?.value||'';
  const ssel=document.getElementById('work-subject');
  if(!ssel) return;
  const currentTerm = window.activeSemesterFilter || '1';
  const subs = (rid ? window.subjects.filter(s=>!s.rooms||s.rooms.length===0||s.rooms.includes(rid)) : window.subjects)
    .filter(s => currentTerm === 'all' || s.term === 'all' || s.term === currentTerm);
  
  if (!subs.length) {
    ssel.innerHTML = '<option value="">-- ยังไม่มีวิชา --</option>';
    return;
  }

  if (currentTerm === 'all') {
    const t1 = subs.filter(s => s.term === '1');
    const t2 = subs.filter(s => s.term === '2');
    const tAll = subs.filter(s => s.term === 'all' || !s.term);
    let html = '';
    if (t1.length) {
      html += `<optgroup label="ภาคเรียนที่ 1">` + t1.map(s=>`<option value="${s.id}">${s.name}</option>`).join('') + `</optgroup>`;
    }
    if (t2.length) {
      html += `<optgroup label="ภาคเรียนที่ 2">` + t2.map(s=>`<option value="${s.id}">${s.name}</option>`).join('') + `</optgroup>`;
    }
    if (tAll.length) {
      html += `<optgroup label="เรียนทั้งปีการศึกษา">` + tAll.map(s=>`<option value="${s.id}">${s.name}</option>`).join('') + `</optgroup>`;
    }
    ssel.innerHTML = html;
  } else {
    ssel.innerHTML = subs.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  }
}

window.switchPhase = function(phase){
  window._workPhase=phase;
  document.querySelectorAll('.phase-tab').forEach(b=>{
    b.classList.toggle('active', b.id==='phase-tab-'+phase);
  });
  window.renderWorkPanel();
}

window.renderWorkPanel = function(){
  const rid=document.getElementById('work-room')?.value||'';
  const sid=document.getElementById('work-subject')?.value||'';
  const sts=window.classData[rid]||[];
  const el=document.getElementById('work-phase-content');
  if(!el) return;

  const csvBtn = document.getElementById('export-summary-csv-btn');
  if (csvBtn) {
    csvBtn.style.display = window._workPhase === 'summary' ? 'inline-flex' : 'none';
  }

  const items=window.workItems.filter(w=>w.roomId===rid&&w.subjectId===sid&&(window._workPhase==='summary'||w.phase===window._workPhase));
  const allItems=window.workItems.filter(w=>w.roomId===rid&&w.subjectId===sid);
  const totalPts=allItems.reduce((a,b)=>a+(+b.maxScore||0),0);
  const t2 = document.getElementById('work-max-pts'); if(t2) t2.textContent = totalPts;
  window.syncWorkKPI(rid, sid);

  if(window._workPhase==='summary'){
    window.renderWorkSummary(rid, sid, sts, el);
    return;
  }

  if(!items.length && !sts.length){
    el.innerHTML=`<div style="text-align:center;padding:32px;color:var(--text3)">
      <div style="font-size:36px;margin-bottom:8px">📭</div>
      <div>ยังไม่มีงานในช่วง ${PHASE_LABELS[window._workPhase]||''}</div>
      <div style="font-size:12px;margin-top:6px">กด "+ เพิ่มงาน" เพื่อสร้างงานใหม่</div>
    </div>`;
    return;
  }

  if(!items.length){
    el.innerHTML=`<div style="text-align:center;padding:32px;color:var(--text3)">
      <div style="font-size:28px;margin-bottom:8px">📝</div>
      <div style="font-size:13px">ยังไม่มีงานในช่วง ${PHASE_LABELS[window._workPhase]||''}</div>
      <div style="font-size:12px;margin-top:6px">กด "+ เพิ่มงาน" เพื่อสร้างงานใหม่</div>
    </div>`;
    return;
  }

  const maxW = items.reduce((a,b)=>a+(+b.maxScore||0),0);
  let html=`<div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:${400+items.length*90}px" class="tbl">
      <thead>
        <tr style="background:var(--surface2)">
          <th style="padding:8px 12px;text-align:left;border:1px solid var(--border);min-width:44px">#</th>
          <th style="padding:8px 12px;text-align:left;border:1px solid var(--border);min-width:160px">ชื่อ-นามสกุล</th>
          ${items.map((w,wi)=>`
            <th style="padding:6px 8px;border:1px solid var(--border);text-align:center;min-width:90px;cursor:pointer;position:relative" onclick="editWork('${w.id}')">
              <div style="font-weight:700;color:var(--text)">${w.name}</div>
              <div style="font-size:10px;color:var(--text3);margin-top:2px">/${w.maxScore} คะแนน</div>
              <div style="font-size:9px;color:${PHASE_COLORS[w.phase]||'var(--text3)'};margin-top:1px">${PHASE_LABELS[w.phase]||''}</div>
              <span onclick="event.stopPropagation();deleteWork('${w.id}')" style="position:absolute;top:3px;right:4px;cursor:pointer;color:var(--text3);font-size:11px;opacity:0" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">✕</span>
            </th>`).join('')}
          <th style="padding:8px;border:1px solid var(--border);text-align:center;min-width:80px;background:var(--accent-light);color:var(--accent)">
            รวม<br><span style="font-size:10px;font-weight:400">/${maxW}</span>
          </th>
          <th style="padding:8px;border:1px solid var(--border);text-align:center;min-width:60px;background:var(--green-light);color:var(--green)">
            %
          </th>
        </tr>
      </thead>
      <tbody>`;

  sts.forEach((s,i)=>{
    let rowTotal=0;
    let rowMax=0;
    const cells=items.map(w=>{
      const sc=(w.scores&&w.scores[String(s.id)]!==undefined)?+w.scores[String(s.id)]:null;
      const max=+w.maxScore||0;
      rowMax+=max;
      if(sc!==null) rowTotal+=sc;
      const pct=max>0&&sc!==null?Math.round(sc/max*100):null;
      const bg=pct===null?'':pct>=80?'rgba(39,174,96,.06)':pct>=50?'rgba(241,196,15,.06)':'rgba(231,76,60,.06)';
      return `<td style="padding:5px 7px;border:1px solid var(--border);text-align:center;background:${bg}">
        <input type="number" min="0" max="${max}" value="${sc!==null?sc:''}"
          placeholder="—" class="score-inp"
          oninput="setWorkScore('${w.id}',${s.id},this.value,this)"
          onchange="setWorkScore('${w.id}',${s.id},this.value,this)"
          onkeydown="window.handleScoreKeydown(event, this)"
          onfocus="this.select()"
          onpaste="window.handleScorePaste(event, this)"
          style="background:transparent;border:none;width:54px;text-align:center;font-size:13px;font-weight:600;color:${pct===null?'var(--text3)':pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)'};outline:none;font-family:Sarabun,sans-serif">
      </td>`;
    }).join('');

    const totalPct=rowMax>0?Math.round(rowTotal/rowMax*100):null;
    html+=`<tr id="work-row-${s.id}" style="border-bottom:1px solid var(--border)">
      <td style="padding:7px 10px;text-align:center;color:var(--text3);border:1px solid var(--border)">${s.no}</td>
      <td style="padding:7px 12px;border:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:7px">
          <span class="avatar ${window.avColor(i)}" style="font-size:10px;flex-shrink:0">${window.initials(s.name)}</span>
          <span>${s.name}</span>
        </div>
      </td>
      ${cells}
      <td style="padding:7px 10px;border:1px solid var(--border);text-align:center;background:var(--accent-light)">
        <span style="font-weight:800;color:var(--accent)">${rowTotal > 0 ? rowTotal : '-'}</span>
      </td>
      <td style="padding:7px 10px;border:1px solid var(--border);text-align:center">
        ${totalPct!==null?`<span style="font-weight:800;color:${totalPct>=80?'var(--green)':totalPct>=50?'var(--amber)':'var(--red)'}">${totalPct}%</span>`:'<span style="color:var(--text3)">-</span>'}
      </td>
    </tr>`;
  });

  html+=`</tbody></table></div>`;
  el.innerHTML=html;

  window.syncWorkKPI(rid, sid);
}

// ── Summary view ────────────────────────────────
window.workGrade = function(pct){
  if(pct>=80) return{g:'4',  label:'ดีเยี่ยม',   col:'var(--green)'};
  if(pct>=75) return{g:'3.5',label:'ดีมาก',      col:'var(--green)'};
  if(pct>=70) return{g:'3',  label:'ดี',         col:'var(--teal)'};
  if(pct>=65) return{g:'2.5',label:'ค่อนข้างดี', col:'var(--teal)'};
  if(pct>=60) return{g:'2',  label:'ปานกลาง',    col:'var(--amber)'};
  if(pct>=55) return{g:'1.5',label:'พอใช้',       col:'var(--amber)'};
  if(pct>=50) return{g:'1',  label:'ผ่านเกณฑ์',  col:'var(--coral,#e67e22)'};
  return       {g:'0',  label:'ต่ำกว่าเกณฑ์',   col:'var(--red)'};
}

window.renderWorkSummary = function(rid, sid, sts, el){
  const items=window.workItems.filter(w=>w.roomId===rid&&w.subjectId===sid);
  if(!items.length||!sts.length){
    el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3)">ยังไม่มีข้อมูล</div>';
    return;
  }
  const phases=['pre','mid-exam','post','final'];
  let html=`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px" class="tbl">
    <thead><tr style="background:var(--surface2)">
      <th style="padding:8px 12px;text-align:left;border:1px solid var(--border)">#</th>
      <th style="padding:8px 12px;text-align:left;border:1px solid var(--border)">ชื่อ-นามสกุล</th>
      ${phases.map(ph=>{
        const phItems=items.filter(w=>w.phase===ph);
        const phMax=phItems.reduce((a,b)=>a+(+b.maxScore||0),0);
        return phItems.length?`<th class="ctr" style="padding:8px;border:1px solid var(--border);min-width:80px;color:${PHASE_COLORS[ph]}">${PHASE_LABELS[ph]}<br><span style="font-size:10px;font-weight:400">/${phMax}</span></th>`:'';
      }).join('')}
      <th class="ctr" style="padding:8px;border:1px solid var(--border);min-width:80px;background:var(--accent-light);color:var(--accent)">คะแนนเก็บ<br><span style="font-size:10px;font-weight:400">/${items.reduce((a,b)=>a+(+b.maxScore||0),0)}</span></th>
      <th class="ctr" style="padding:8px;border:1px solid var(--border);min-width:72px;background:var(--surface2)">เกรด</th>
    </tr></thead><tbody>`;

  sts.forEach((s,i)=>{
    let grandTotal=0; let grandMax=0;
    const phaseCells=phases.map(ph=>{
      const phItems=items.filter(w=>w.phase===ph);
      if(!phItems.length) return '';
      const phMax=phItems.reduce((a,b)=>a+(+b.maxScore||0),0);
      const phScore=phItems.reduce((a,w)=>{
        const sc=w.scores&&w.scores[String(s.id)]!==undefined?+w.scores[String(s.id)]:0;
        return a+sc;
      },0);
      grandTotal+=phScore; grandMax+=phMax;
      const pct=phMax>0?Math.round(phScore/phMax*100):0;
      return `<td class="ctr" style="border:1px solid var(--border);padding:7px">
        <div style="font-weight:700;color:${pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)'}">${phScore}</div>
        <div style="font-size:10px;color:var(--text3)">${pct}%</div>
      </td>`;
    }).join('');

    const pct=grandMax>0?Math.round(grandTotal/grandMax*100):0;
    html+=`<tr>
      <td style="padding:7px 10px;text-align:center;color:var(--text3);border:1px solid var(--border)">${s.no}</td>
      <td style="padding:7px 12px;border:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:7px">
          <span class="avatar ${window.avColor(i)}" style="font-size:10px">${window.initials(s.name)}</span>
          <span>${s.name}</span>
        </div>
      </td>
      ${phaseCells}
      <td class="ctr" style="border:1px solid var(--border);padding:7px;background:var(--accent-light)">
        <div style="font-weight:800;color:var(--accent);font-size:14px">${grandTotal}</div>
      </td>
      <td class="ctr" style="border:1px solid var(--border);padding:8px">
        ${grandMax>0?(()=>{
          const gr=window.workGrade(pct);
          return `
            <div style="font-size:20px;font-weight:900;color:${gr.col};line-height:1">${gr.g}</div>
            <div style="font-size:9px;color:${gr.col};margin-top:2px;white-space:nowrap">${gr.label}</div>
            <div style="font-size:9px;color:var(--text3);margin-top:1px">${pct}%</div>
          `;
        })():'<span style="color:var(--text3)">-</span>'}
      </td>
    </tr>`;
  });
  html+=`</tbody></table></div>`;
  el.innerHTML=html;
}

// ── Keyboard Grid Navigation ──────────────────────
window.handleScoreKeydown = function(event, inputEl) {
  const key = event.key;
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) return;

  const currentTd = inputEl.closest('td');
  if (!currentTd) return;
  const currentTr = currentTd.closest('tr');
  if (!currentTr) return;

  // Find column index of current TD in TR
  const tds = Array.from(currentTr.querySelectorAll('td'));
  const colIdx = tds.indexOf(currentTd);
  if (colIdx === -1) return;

  if (key === 'ArrowLeft') {
    // Find previous input in the same row
    const rowInputs = Array.from(currentTr.querySelectorAll('.score-inp'));
    const currentInpIdx = rowInputs.indexOf(inputEl);
    if (currentInpIdx > 0) {
      event.preventDefault();
      rowInputs[currentInpIdx - 1].focus();
      rowInputs[currentInpIdx - 1].select();
    }
  } else if (key === 'ArrowRight') {
    // Find next input in the same row
    const rowInputs = Array.from(currentTr.querySelectorAll('.score-inp'));
    const currentInpIdx = rowInputs.indexOf(inputEl);
    if (currentInpIdx !== -1 && currentInpIdx < rowInputs.length - 1) {
      event.preventDefault();
      rowInputs[currentInpIdx + 1].focus();
      rowInputs[currentInpIdx + 1].select();
    }
  } else if (key === 'ArrowUp') {
    // Find the previous row
    const prevTr = currentTr.previousElementSibling;
    if (prevTr && prevTr.tagName === 'TR') {
      const targetTd = prevTr.querySelectorAll('td')[colIdx];
      if (targetTd) {
        const targetInp = targetTd.querySelector('.score-inp');
        if (targetInp) {
          event.preventDefault();
          targetInp.focus();
          targetInp.select();
        }
      }
    }
  } else if (key === 'ArrowDown' || key === 'Enter') {
    // Find the next row
    const nextTr = currentTr.nextElementSibling;
    if (nextTr && nextTr.tagName === 'TR') {
      const targetTd = nextTr.querySelectorAll('td')[colIdx];
      if (targetTd) {
        const targetInp = targetTd.querySelector('.score-inp');
        if (targetInp) {
          event.preventDefault();
          targetInp.focus();
          targetInp.select();
        }
      }
    }
  }
};

// ── Multi-cell Paste Integration ──────────────────
window.handleScorePaste = function(event, inputEl) {
  const clipboardData = event.clipboardData || window.clipboardData;
  if (!clipboardData) return;

  const pastedText = clipboardData.getData('text');
  if (!pastedText) return;

  // Split by newlines to get rows, then by tabs to get columns
  const lines = pastedText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return;

  // If there are multiple cells (tab or newline), prevent default single-cell paste
  const isGridPaste = lines.length > 1 || lines[0].includes('\t');
  if (!isGridPaste) return; // Let default single value paste work

  event.preventDefault();

  const currentTd = inputEl.closest('td');
  if (!currentTd) return;
  const currentTr = currentTd.closest('tr');
  if (!currentTr) return;

  // Find column index of current TD in TR
  const tds = Array.from(currentTr.querySelectorAll('td'));
  const startColIdx = tds.indexOf(currentTd);
  if (startColIdx === -1) return;

  let targetTr = currentTr;

  for (let r = 0; r < lines.length; r++) {
    if (!targetTr || targetTr.tagName !== 'TR') break;

    const cols = lines[r].split('\t');
    const targetTds = Array.from(targetTr.querySelectorAll('td'));

    for (let c = 0; c < cols.length; c++) {
      const targetTd = targetTds[startColIdx + c];
      if (!targetTd) continue;

      const targetInp = targetTd.querySelector('.score-inp');
      if (!targetInp) continue;

      const val = cols[c].trim();
      targetInp.value = val;
      
      // Execute the input and change handlers directly
      if (typeof targetInp.oninput === 'function') {
        targetInp.oninput();
      }
      if (typeof targetInp.onchange === 'function') {
        targetInp.onchange();
      }
    }

    targetTr = targetTr.nextElementSibling;
  }
};

// ── Score input handler ──────────────────────────
window.setWorkScore = function(workId, studentId, val, inputEl){
  const w=window.workItems.find(x=>x.id===workId);
  if(!w) return;
  if(!w.scores) w.scores={};
  const key=String(studentId);
  
  if (val !== '' && +val > +w.maxScore) {
    window.toast(`⚠️ คะแนนต้องไม่เกินคะแนนเต็ม (${w.maxScore} คะแนน)`);
    val = String(w.maxScore);
    if (inputEl) inputEl.value = val;
  }
  
  const num=val===''?null:Math.min(+w.maxScore, Math.max(0, +val||0));
  if(val==='') delete w.scores[key];
  else w.scores[key]=num;

  if(inputEl){
    const pct=num!==null&&+w.maxScore>0?Math.round(num/+w.maxScore*100):null;
    inputEl.style.color=pct===null?'var(--text3)':pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)';
    const td=inputEl.closest('td');
    if(td) td.style.background=pct===null?'':pct>=80?'rgba(39,174,96,.06)':pct>=50?'rgba(241,196,15,.06)':'rgba(231,76,60,.06)';
  }

  window.updateRowTotal(studentId);
}

window.updateRowTotal = function(studentId){
  const rid=document.getElementById('work-room')?.value||'';
  const sid=document.getElementById('work-subject')?.value||'';
  const key=String(studentId);
  const items=window.workItems.filter(w=>w.roomId===rid&&w.subjectId===sid&&(window._workPhase==='summary'||w.phase===window._workPhase));
  let total=0, maxPts=0;
  items.forEach(w=>{
    const sc=w.scores&&w.scores[key]!==undefined?+(w.scores[key])||0:0;
    total+=sc;
    maxPts+=(+w.maxScore||0);
  });
  
  const rowEl=document.getElementById('work-row-'+studentId);
  if(rowEl){
    const cells=rowEl.querySelectorAll('td');
    const totalCell=cells[cells.length-2];
    const pctCell=cells[cells.length-1];
    if(totalCell) totalCell.innerHTML=`<span style="font-weight:800;color:var(--accent)">${total>0?total:'-'}</span>`;
    if(pctCell){
      const pct=maxPts>0?Math.round(total/maxPts*100):null;
      pctCell.innerHTML=pct!==null?`<span style="font-weight:800;color:${pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)'}">${pct}%</span>`:'<span style="color:var(--text3)">-</span>';
    }
  }
  window.syncWorkKPI(rid, sid);
}

window.syncWorkKPI = function(rid, sid){
  const sts=window.classData[rid]||[];
  const items=window.workItems.filter(w=>w.roomId===rid&&w.subjectId===sid&&(window._workPhase==='summary'||w.phase===window._workPhase));
  
  let completed = 0;
  let incomplete = 0;
  
  if (sts.length > 0 && items.length > 0) {
    sts.forEach(s => {
      let isComplete = true;
      items.forEach(w => {
        const val = w.scores ? w.scores[String(s.id)] : undefined;
        if (val === undefined || val === null || val === '') {
          isComplete = false;
        }
      });
      if (isComplete) completed++;
      else incomplete++;
    });
  }
  
  const elComp = document.getElementById('asn-total');
  if (elComp) elComp.textContent = completed;

  const elIncomp = document.getElementById('work-total-pts');
  if (elIncomp) elIncomp.textContent = incomplete;

  // ── Grade Distribution Mini-Dashboard (above phase tabs) ──────────────
  const dash = document.getElementById('work-grade-dash');
  if (!dash) return;

  // All work items for this subject (all phases) for grade computation
  const allItems = window.workItems.filter(w => w.roomId === rid && w.subjectId === sid);
  if (!allItems.length || !sts.length) {
    dash.innerHTML = '';
    return;
  }

  const gradeCfg = [
    { g:'4',   label:'ดีเยี่ยม',      bg:'var(--green-light)',  col:'var(--green)' },
    { g:'3.5', label:'ดีมาก',          bg:'var(--green-light)',  col:'var(--green)' },
    { g:'3',   label:'ดี',             bg:'var(--teal-light)',   col:'var(--teal)'  },
    { g:'2.5', label:'ค่อนข้างดี',    bg:'var(--teal-light)',   col:'var(--teal)'  },
    { g:'2',   label:'ปานกลาง',       bg:'var(--amber-light)',  col:'var(--amber)' },
    { g:'1.5', label:'พอใช้',          bg:'var(--amber-light)',  col:'var(--amber)' },
    { g:'1',   label:'ผ่าน',           bg:'rgba(230,126,34,.1)', col:'#e67e22'      },
    { g:'0',   label:'ไม่ผ่าน',       bg:'var(--red-light)',    col:'var(--red)'   }
  ];
  const counts = { '4':0,'3.5':0,'3':0,'2.5':0,'2':0,'1.5':0,'1':0,'0':0 };

  sts.forEach(s => {
    const max = allItems.reduce((a,b) => a + (+b.maxScore||0), 0);
    const got = allItems.reduce((a,w) => a + (+(w.scores&&w.scores[String(s.id)])||0), 0);
    if (max > 0) {
      const pct = Math.round(got / max * 100);
      const gr  = window.workGrade ? window.workGrade(pct).g : window.getGrade(pct);
      if (counts[gr] !== undefined) counts[gr]++;
    }
  });

  dash.innerHTML = gradeCfg.map(cfg => `
    <div style="background:${cfg.bg};border-radius:10px;padding:8px 4px;text-align:center">
      <div style="font-size:10px;font-weight:700;color:${cfg.col}">เกรด ${cfg.g}</div>
      <div style="font-size:9px;color:${cfg.col};margin-bottom:2px">${cfg.label}</div>
      <div style="font-size:22px;font-weight:800;color:${cfg.col};line-height:1.1">${counts[cfg.g]}</div>
    </div>
  `).join('');
}


window.syncWorkToScores = function(rid, sid){
  const sts=window.classData[rid]||[];
  const items=window.workItems.filter(w=>w.roomId===rid&&w.subjectId===sid&&(w.phase==='pre'||w.phase==='post'));
  const maxPts=items.reduce((a,b)=>a+(+b.maxScore||0),0);
  if(!maxPts) return;
  sts.forEach(s=>{
    const earned=items.reduce((a,w)=>{
      const sc=w.scores&&w.scores[String(s.id)]!==undefined?+(w.scores[String(s.id)])||0:0;
      return a+sc;
    },0);
    s.scores.work=Math.min(100,Math.round(earned/maxPts*100));
  });
  window.syncWorkKPI(rid, sid);
}

window.saveWorkScores = async function(){
  const rid=document.getElementById('work-room')?.value||'';
  window.syncWorkToScores(rid, document.getElementById('work-subject')?.value||'');
  window.snapshotVersion('บันทึกคะแนนงาน');
  await window.pushStudents(rid);
  if(window.GS_URL){
    try{
      await window.pushSheet('workItems', window.workItems.map(w=>({...w, scores:JSON.stringify(w.scores||{})})));
    }catch(e){}
  }
  window.showSyncToast('💾 บันทึกคะแนนงานแล้ว');
}

// ── Add / Edit work modal ─────────────────────────
window.openAddWorkModal = function(phase){
  window.safeSetHelper('work-edit-id','');
  window.safeSetHelper('work-name','');
  window.safeSetHelper('work-phase', phase||window._workPhase||'pre');
  window.safeSetHelper('work-maxscore','10');
  window.safeSetHelper('work-due','');
  window.safeSetHelper('work-type','homework');
  window.safeSetHelper('work-note','');
  
  const titleEl=document.getElementById('work-modal-title');
  if(titleEl) titleEl.textContent='➕ เพิ่มงาน / ชิ้นงาน';
  const modal = document.getElementById('work-modal'); if(modal) modal.classList.add('open');
}

window.editWork = function(id){
  const w=window.workItems.find(x=>x.id===id); if(!w) return;
  window.safeSetHelper('work-edit-id',id);
  window.safeSetHelper('work-name',w.name);
  window.safeSetHelper('work-phase',w.phase);
  window.safeSetHelper('work-maxscore',w.maxScore);
  window.safeSetHelper('work-due',w.due||'');
  window.safeSetHelper('work-type',w.type||'homework');
  window.safeSetHelper('work-note',w.note||'');
  
  const titleEl=document.getElementById('work-modal-title');
  if(titleEl) titleEl.textContent='✏️ แก้ไขงาน';
  const modal = document.getElementById('work-modal'); if(modal) modal.classList.add('open');
}

window.submitWork = function(){
  const name=(document.getElementById('work-name')?.value||'').trim();
  if(!name){window.toast('⚠️ กรอกชื่องานก่อน');return;}
  const rid=document.getElementById('work-room')?.value||'';
  const sid=document.getElementById('work-subject')?.value||'';
  const editId=document.getElementById('work-edit-id')?.value||'';
  const rec={
    id: editId||'w'+Date.now(),
    name, roomId:rid, subjectId:sid,
    phase: document.getElementById('work-phase')?.value||'pre',
    maxScore: +(document.getElementById('work-maxscore')?.value)||10,
    due: document.getElementById('work-due')?.value||'',
    type: document.getElementById('work-type')?.value||'homework',
    note: document.getElementById('work-note')?.value||'',
    scores: editId?(window.workItems.find(x=>x.id===editId)?.scores||{}):{},
  };
  if(editId){
    const idx=window.workItems.findIndex(x=>x.id===editId);
    if(idx>=0) window.workItems[idx]=rec;
  } else {
    window.workItems.push(rec);
  }
  window.closeModal('work-modal');
  window.renderWorkPanel();
  window.toast(editId?'✅ อัปเดตงานแล้ว':'✅ เพิ่มงานแล้ว');
}

window.deleteWork = function(id){
  if(!confirm('ลบงานนี้?')) return;
  window.workItems=window.workItems.filter(x=>x.id!==id);
  window.renderWorkPanel();
  window.toast('🗑 ลบงานแล้ว');
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

// ====== MATERIALS ======
window.renderMaterials = function(){
  const subs=window.getSubjects();
  const sel=document.getElementById('mat-subject');
  if(sel)sel.innerHTML=subs.map(s=>`<option>${s}</option>`).join('');
  const sub=window.activeSubjectTab.materials;
  const filtered=window.materials.filter(m=>m.cls===window.currentClass&&(!sub||m.subject===sub));
  const tbody=document.getElementById('mat-tbody');
  if(tbody) {
    tbody.innerHTML=filtered.length?filtered.map(m=>`<tr><td>${m.type}</td><td>${m.name}</td><td style="color:var(--text3)">${m.subject}</td><td style="color:var(--text3);font-size:12px">${m.date}</td><td class="ctr"><button class="btn btn-danger btn-sm" onclick="delMat(${m.id})">ลบ</button></td></tr>`).join(''):`<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text3)">ยังไม่มีสื่อ</td></tr>`;
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
        html += `<optgroup label="ภาคเรียนที่ 1">` + t1.map(s=>`<option value="${s.id}">${s.name}</option>`).join('') + `</optgroup>`;
      }
      if (t2.length) {
        html += `<optgroup label="ภาคเรียนที่ 2">` + t2.map(s=>`<option value="${s.id}">${s.name}</option>`).join('') + `</optgroup>`;
      }
      if (tAll.length) {
        html += `<optgroup label="เรียนทั้งปีการศึกษา">` + tAll.map(s=>`<option value="${s.id}">${s.name}</option>`).join('') + `</optgroup>`;
      }
    } else {
      html += subsList.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
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
      <div style="font-size:13px;font-weight:700;margin-bottom:4px;padding-right:20px">${m.name}</div>
      ${sub?`<div style="font-size:11px;color:var(--accent);font-weight:600;margin-bottom:6px">${sub.name}</div>`:''}
      ${m.note?`<div style="font-size:11px;color:var(--text3);margin-bottom:8px">${m.note}</div>`:''}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
        <span style="font-size:10px;color:var(--text3)">${m.date||''}</span>
        ${hasUrl?`<a href="${m.url}" target="_blank"
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

// ====== ASSESSMENT ======
window.fillAllScores = function(field, val){
  const rid=document.getElementById('asmnt-room')?.value||window.currentClass;
  const sts=window.classData[rid]||[];
  const v=+val||0;
  sts.forEach(s=>{s.scores[field]=Math.min(100,Math.max(0,v));});
  window.renderScores();
  window.toast(`✅ ใส่คะแนน ${field}=${v} ให้ทุกคนแล้ว`);
}

window.exportScoresCSV = function(){
  const rid=document.getElementById('asmnt-room')?.value||window.currentClass;
  const sts=window.classData[rid]||[];
  const sub=window.subjects.find(s=>s.id===document.getElementById('asmnt-subject')?.value);
  const rm=window.rooms.find(r=>r.id===rid);
  let csv='\uFEFFเลขที่,ชื่อ-นามสกุล,งานเก็บ,กลางภาค,ปลายภาค,คะแนนรวม,เกรด\n';
  sts.forEach(s=>{
    const t=window.calcTotal(s);const g=t>0?window.getGrade(t):'-';
    csv+=`${s.no},"${s.name}",${s.scores.work},${s.scores.mid},${s.scores.final},${t||'-'},${g}\n`;
  });
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download=`scores_${rm?rm.level+rm.section:''}_${sub?sub.name:''}.csv`;
  a.click();
  window.toast('⬇ ส่งออก CSV แล้ว');
}

window.populateAsmntDropdowns = function(){
  const rsel = document.getElementById('asmnt-room');
  if(rsel){
    const cur = rsel.value;
    rsel.innerHTML = window.rooms.map(r=>`<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
    if(cur && window.rooms.find(r=>r.id===cur)) rsel.value=cur;
  }
  window.populateAsmntSubjects();
}

window.populateAsmntSubjects = function(){
  const rid = document.getElementById('asmnt-room')?.value || (window.rooms[0]?.id||'');
  const ssel = document.getElementById('asmnt-subject');
  if(!ssel) return;
  const currentTerm = window.activeSemesterFilter || '1';
  const filteredSubjects = window.subjects.filter(s => currentTerm === 'all' || s.term === 'all' || s.term === currentTerm);
  const roomSubs = filteredSubjects.filter(s=>!s.rooms||s.rooms.length===0||s.rooms.includes(rid));
  ssel.innerHTML = (roomSubs.length
    ? roomSubs.map(s=>`<option value="${s.id}">${s.name}</option>`)
    : filteredSubjects.map(s=>`<option value="${s.id}">${s.name}</option>`)
  ).join('');
}

window.renderAssessment = function(){
  window.populateAsmntDropdowns();
  const rid = document.getElementById('asmnt-room')?.value;
  if(rid) window.currentClass = rid;
  const activeTab = document.querySelector('.asmnt-tab-btn.active')?.id?.replace('atab-','') || 'scores';
  if(activeTab==='scores') window.renderScores();
  else if(activeTab==='grades') window.renderGrades();
  else window.renderGrades();
}

window.switchAsmntTab = function(tab){
  document.querySelectorAll('.asmnt-tab-btn').forEach(b=>{
    b.classList.toggle('active', b.id==='atab-'+tab);
  });
  const p1 = document.getElementById('asmnt-scores-panel'); if(p1) p1.style.display = tab==='scores' ? '' : 'none';
  const p2 = document.getElementById('asmnt-grades-panel'); if(p2) p2.style.display = tab==='grades' ? '' : 'none';
  const p3 = document.getElementById('asmnt-settings-panel'); if(p3) p3.style.display = tab==='settings' ? '' : 'none';
  
  if(tab==='scores') window.renderScores();
  else if(tab==='grades'){window.applyGrades();}
}

window.saveAllScores = async function(){
  const rid = document.getElementById('asmnt-room')?.value || window.currentClass;
  window.snapshotVersion('บันทึกคะแนน');
  await window.pushStudents(rid);
  window.showSyncToast('💾 บันทึกคะแนนแล้ว');
}

window.renderScores = function(){
  const rid=document.getElementById('asmnt-room')?.value||window.currentClass;
  if(rid) window.currentClass=rid;
  const sts=window.classData[rid]||[];
  const tbody=document.getElementById('score-tbody');
  if(!tbody) return;
  if(!sts.length){
    tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text3)">ยังไม่มีนักเรียน</td></tr>';
    return;
  }
  const rows=sts.map(function(s,i){
    const total=window.calcTotal(s);
    const g=total>0?window.getGrade(total):'-';
    const gc=g!=='-'?'badge-'+g:'';
    const av=window.avColor(i); const ini=window.initials(s.name);
    const tr=document.createElement('tr');
    tr.innerHTML=[
      '<td style="color:var(--text3);font-size:12px;text-align:center">'+s.no+'</td>',
      '<td><div style="display:flex;align-items:center;gap:8px"><span class="avatar '+av+'" style="font-size:10px">'+ini+'</span>'+s.name+'</div></td>',
      window.scoreCell(s.id,'work',s.scores.work),
      window.scoreCell(s.id,'mid',s.scores.mid),
      window.scoreCell(s.id,'final',s.scores.final),
      '<td class="ctr" style="font-weight:800;color:var(--green)">'+(total||'-')+'</td>',
      '<td class="ctr">'+(g!=='-'?'<span class="badge '+gc+'">'+g+'</span>':'<span style="color:var(--text3)">-</span>')+'</td>',
    ].join('');
    return tr.outerHTML;
  });
  tbody.innerHTML=rows.join('');
  window.updateScoreStats();
}

window.scoreCell = function(sid,field,val){
  return '<td class="score-cell ctr"><input type="number" class="score-inp" min="0" max="100" value="'+val+'" oninput="updateScore('+sid+',\''+field+'\',this.value)"></td>';
}

window.updateScore = function(id,key,val){
  const rid=document.getElementById('asmnt-room')?.value||window.currentClass;
  const sts=window.classData[rid]||[];
  const s=sts.find(x=>x.id===id);
  if(s){
    s.scores[key]=Math.min(100,Math.max(0,+val||0));
  }
  window.updateScoreStats();
}

window.updateScoreStats = function(){
  const rid=document.getElementById('asmnt-room')?.value||window.currentClass;
  const sts=window.classData[rid]||[];
  const totals=sts.map(s=>window.calcTotal(s)).filter(v=>v>0);
  
  const avg = document.getElementById('sc-avg'); if(avg) avg.textContent = totals.length?Math.round(totals.reduce((a,b)=>a+b,0)/totals.length*10)/10:'-';
  const max = document.getElementById('sc-max'); if(max) max.textContent = totals.length?Math.max(...totals):'-';
  const min = document.getElementById('sc-min'); if(min) min.textContent = totals.length?Math.min(...totals):'-';
  const fail = document.getElementById('sc-fail'); if(fail) fail.textContent = sts.filter(s=>window.calcTotal(s)<50&&window.calcTotal(s)>0).length;
}

window.updateWeights = function(){
  ['w1','w2','w3','w4'].forEach(k=>{
    const el=document.getElementById(k);
    const vEl=document.getElementById(k+'v');
    if(el){window.weights[k]=+el.value||0;}
    if(vEl)vEl.textContent=(window.weights[k]||0)+'%';
  });
  const sum=Object.values(window.weights).reduce((a,b)=>a+b,0);
  const el = document.getElementById('w-sum');
  if(el) el.textContent=`รวม: ${sum}% ${sum!==100?'⚠️ ควรเป็น 100%':'✅'}`;
}

window.renderGrades = function(){
  const rid=document.getElementById('asmnt-room')?.value||window.currentClass;
  const sts=window.classData[rid]||[];
  const grades={ '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 };
  
  const tbody = document.getElementById('grade-tbody');
  if (tbody) {
    tbody.innerHTML=sts.map((s,i)=>{
      const total=window.calcTotal(s);const g=total>0?window.getGrade(total):'-';const gc=g!=='-'?`badge-${g}`:'';
      if(g!=='-' && grades[g] !== undefined) grades[g]++;
      return`<tr>
        <td style="color:var(--text3);font-size:12px;text-align:center">${s.no}</td>
        <td><div style="display:flex;align-items:center;gap:8px"><span class="avatar ${window.avColor(i)}">${window.initials(s.name)}</span>${s.name}</div></td>
        <td class="ctr" style="color:var(--teal)">${s.scores.work}</td>
        <td class="ctr" style="color:var(--purple)">${s.scores.mid}</td>
        <td class="ctr" style="color:var(--accent)">${s.scores.final}</td>
        <td class="ctr" style="font-weight:700;color:var(--green)">${total||'-'}</td>
        <td class="ctr">${g!=='-'?`<span class="badge ${gc}">${g}</span>`:'<span style="color:var(--text3)">-</span>'}</td>
      </tr>`;
    }).join('');
  }
  window.renderGradeDist(grades, sts.length);
}

window.renderGradeDist = function(grades, total){
  const bar=document.getElementById('grade-dist-bar');
  const legend=document.getElementById('grade-dist-legend');
  if(!bar||!legend) return;
  const colors = {
    '4': 'var(--green)',
    '3.5': 'var(--green)',
    '3': 'var(--teal)',
    '2.5': 'var(--teal)',
    '2': 'var(--amber)',
    '1.5': 'var(--amber)',
    '1': 'var(--coral)',
    '0': 'var(--red)'
  };
  bar.innerHTML=Object.entries(grades).map(([g,n])=>
    `<div style="flex:${n||0};background:${colors[g]};transition:flex .4s;min-width:${n>0?'4px':'0'}" title="${g}: ${n} คน"></div>`
  ).join('');
  legend.innerHTML=Object.entries(grades).map(([g,n])=>
    `<span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;background:${colors[g]};border-radius:2px;display:inline-block"></span>เกรด ${g}: <b>${n}</b> คน (${total>0?Math.round(n/total*100):0}%)</span>`
  ).join('');
  
  ['4','3.5','3','2.5','2','1.5','1','0'].forEach(g=>{
    const elementId = 'g-cnt-' + g.replace('.', '');
    const el=document.getElementById(elementId);
    if(el)el.textContent=grades[g]||0;
  });
}

window.applyGrades = function(){
  const rid=document.getElementById('asmnt-room')?.value||window.currentClass;
  if(rid) window.currentClass=rid;
  window.renderGrades();
  window.updateScoreStats();
}

window.exportWorkSummaryCSV = function(){
  const rid=document.getElementById('work-room')?.value||'';
  const sid=document.getElementById('work-subject')?.value||'';
  const sts=window.classData[rid]||[];
  const items=window.workItems.filter(w=>w.roomId===rid&&w.subjectId===sid);
  if(!items.length||!sts.length){
    window.toast('❌ ไม่มีข้อมูลสำหรับส่งออก');
    return;
  }
  
  const phases=['pre','mid-exam','post','final'];
  const activePhases=phases.filter(ph=>items.some(w=>w.phase===ph));
  
  const phaseHeaders=activePhases.map(ph=>{
    const phItems=items.filter(w=>w.phase===ph);
    const phMax=phItems.reduce((a,b)=>a+(+b.maxScore||0),0);
    const label=PHASE_LABELS[ph]||ph;
    return `"${label} (เต็ม ${phMax})"`;
  }).join(',');
  
  const totalMax=items.reduce((a,b)=>a+(+b.maxScore||0),0);
  
  let csv=`\uFEFFเลขที่,ชื่อ-นามสกุล,${phaseHeaders ? phaseHeaders+',' : ''}"คะแนนเก็บรวม (เต็ม ${totalMax})","เกรด","เปอร์เซ็นต์"\n`;
  
  sts.forEach(s=>{
    let grandTotal=0;
    let grandMax=0;
    const phaseScores=activePhases.map(ph=>{
      const phItems=items.filter(w=>w.phase===ph);
      const phMax=phItems.reduce((a,b)=>a+(+b.maxScore||0),0);
      const phScore=phItems.reduce((a,w)=>{
        const sc=w.scores&&w.scores[String(s.id)]!==undefined?+w.scores[String(s.id)]:0;
        return a+sc;
      },0);
      grandTotal+=phScore;
      grandMax+=phMax;
      return phScore;
    }).join(',');
    
    const pct=grandMax>0?Math.round(grandTotal/grandMax*100):0;
    const gr=grandMax>0?window.workGrade(pct).g : '-';
    
    csv+=`${s.no},"${s.name}",${phaseScores ? phaseScores+',' : ''}${grandTotal},"${gr}",${pct}%\n`;
  });
  
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  
  const roomObj=window.rooms.find(r=>r.id===rid);
  const classLabel=roomObj?`${roomObj.level}_${roomObj.section}`:rid;
  const subObj=window.subjects.find(s=>s.id===sid);
  const subLabel=subObj?`_${subObj.name}`:'';
  
  a.download=`work_summary_${classLabel}${subLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  window.toast('✅ ส่งออกไฟล์ CSV สำเร็จ');
}
