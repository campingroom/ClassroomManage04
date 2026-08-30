// ====== TEACHING — WORK GRID (ตารางให้คะแนนงานตามช่วง pre/mid-exam/post/final) ======

const PHASE_LABELS = {
  'pre':      'ก่อนกลางภาค',
  'mid-exam': 'สอบกลางภาค',
  'post':     'หลังกลางภาค',
  'final':    'สอบปลายภาค',
};
const PHASE_COLORS = {
  'pre':'var(--teal)','mid-exam':'var(--purple)','post':'var(--accent)','final':'var(--red)'
};

// ====== TEACHING PANEL ======
window.renderTeaching = function(){
  const rsel=document.getElementById('work-room');
  if(rsel&&window.rooms.length){
    let options = '<option value="all">🌟 ทุกห้องเรียน</option>';
    options += window.rooms.map(r=>`<option value="${r.id}">ห้อง ${r.level}/${r.section}</option>`).join('');
    rsel.innerHTML = options;
    if(window.currentClass && (window.currentClass === 'all' || window.rooms.some(r=>r.id===window.currentClass))) {
      rsel.value = window.currentClass;
    } else {
      rsel.value = 'all';
    }
  }
  window.populateWorkSubjects();
  window.renderWorkPanel();
}

window.onWorkRoomChange = function(){
  const val = document.getElementById('work-room')?.value;
  if(val && window.currentClass !== val) {
    window.currentClass = val;
    if(window.updateTopbarClassBadge) window.updateTopbarClassBadge();
  }
  window.populateWorkSubjects();
  window.renderWorkPanel();
}

window.populateWorkSubjects = function(){
  const rid=document.getElementById('work-room')?.value||'';
  const ssel=document.getElementById('work-subject');
  if(!ssel) return;
  const currentTerm = window.activeSemesterFilter || '1';
  const subs = (rid && rid !== 'all' ? window.subjects.filter(s=>!s.rooms||s.rooms.length===0||s.rooms.includes(rid)) : window.subjects)
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
      html += `<optgroup label="ภาคเรียนที่ 1">` + t1.map(s=>`<option value="${s.id}">${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
    }
    if (t2.length) {
      html += `<optgroup label="ภาคเรียนที่ 2">` + t2.map(s=>`<option value="${s.id}">${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
    }
    if (tAll.length) {
      html += `<optgroup label="เรียนทั้งปีการศึกษา">` + tAll.map(s=>`<option value="${s.id}">${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
    }
    ssel.innerHTML = html;
  } else {
    ssel.innerHTML = subs.map(s=>`<option value="${s.id}">${window.esc(s.name)}</option>`).join('');
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
  
  let sts = [];
  if (rid === 'all') {
    window.rooms.forEach(r => {
      sts = sts.concat((window.classData[r.id] || []).map(s => Object.assign({}, s, { roomName: `${r.level}/${r.section}`, roomId: r.id })));
    });
  } else {
    sts = (window.classData[rid] || []).map(s => Object.assign({}, s, { roomId: rid }));
  }
  
  const el=document.getElementById('work-phase-content');
  if(!el) return;

  const csvBtn = document.getElementById('export-summary-csv-btn');
  if (csvBtn) {
    csvBtn.style.display = window._workPhase === 'summary' ? 'inline-flex' : 'none';
  }

  const items=window.workItems.filter(w=>(rid==='all'||w.roomId===rid)&&w.subjectId===sid&&(window._workPhase==='summary'||w.phase===window._workPhase));
  const allItems=window.workItems.filter(w=>(rid==='all'||w.roomId===rid)&&w.subjectId===sid);
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
              <div style="font-weight:700;color:var(--text)">${window.esc(w.name)}</div>
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
          <span class="avatar ${window.avColor(i)}" style="font-size:10px;flex-shrink:0">${window.esc(window.initials(s.name))}</span>
          <span>${window.esc(s.name)}</span>
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
  const items=window.workItems.filter(w=>(rid==='all'||w.roomId===rid)&&w.subjectId===sid);
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
    const targetRoomId = s.roomId || rid;
    const studentItems = items.filter(w => w.roomId === targetRoomId);
    let grandTotal=0; let grandMax=0;
    const phaseCells=phases.map(ph=>{
      const phItems=studentItems.filter(w=>w.phase===ph);
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
          <span class="avatar ${window.avColor(i)}" style="font-size:10px">${window.esc(window.initials(s.name))}</span>
          <span>${window.esc(s.name)}${rid === 'all' && s.roomName ? ` <span class="badge badge-info" style="font-size:10px;padding:2px 6px;margin-left:6px;">${s.roomName}</span>` : ''}</span>
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
  
  const rid=document.getElementById('work-room')?.value||'';
  const sid=document.getElementById('work-subject')?.value||'';
  window.updateRowTotal(studentId, rid, sid);
}

window.updateRowTotal = function(studentId, rid, sid){
  const key=String(studentId);
  const items=window.workItems.filter(w=>(rid==='all'||w.roomId===rid)&&w.subjectId===sid&&(window._workPhase==='summary'||w.phase===window._workPhase));
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
  let sts = [];
  if (rid === 'all') {
    window.rooms.forEach(r => {
      sts = sts.concat((window.classData[r.id] || []).map(s => Object.assign({}, s, { roomId: r.id })));
    });
  } else {
    sts = (window.classData[rid] || []).map(s => Object.assign({}, s, { roomId: rid }));
  }

  const items=window.workItems.filter(w=>(rid==='all'||w.roomId===rid)&&w.subjectId===sid&&(window._workPhase==='summary'||w.phase===window._workPhase));
  
  let completed = 0;
  let incomplete = 0;
  
  if (sts.length > 0 && items.length > 0) {
    sts.forEach(s => {
      let isComplete = true;
      const targetRoomId = s.roomId || rid;
      const sItems = items.filter(w => w.roomId === targetRoomId);
      sItems.forEach(w => {
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
  const allItems = window.workItems.filter(w => (rid === 'all' || w.roomId === rid) && w.subjectId === sid);
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
    const targetRoomId = s.roomId || rid;
    const sAllItems = allItems.filter(w => w.roomId === targetRoomId);
    const max = sAllItems.reduce((a,b) => a + (+b.maxScore||0), 0);
    const got = sAllItems.reduce((a,w) => a + (+(w.scores&&w.scores[String(s.id)])||0), 0);
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
