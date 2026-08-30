// ====== TEACHING — ASSESSMENT (คะแนน/เกรด) ======

// ====== ASSESSMENT ======
window.fillAllScores = function(field, val){
  const rid=document.getElementById('asmnt-room')?.value||window.currentClass;
  const v=+val||0;
  if (rid === 'all') {
    window.rooms.forEach(r => {
      const sts = window.classData[r.id] || [];
      sts.forEach(s=>{s.scores[field]=Math.min(100,Math.max(0,v));});
    });
  } else {
    const sts=window.classData[rid]||[];
    sts.forEach(s=>{s.scores[field]=Math.min(100,Math.max(0,v));});
  }
  window.renderScores();
  window.toast(`✅ ใส่คะแนน ${field}=${v} ให้ทุกคนแล้ว`);
}

window.exportScoresCSV = function(){
  const rid=document.getElementById('asmnt-room')?.value||window.currentClass;
  let sts = [];
  if (rid === 'all') {
    window.rooms.forEach(r => {
      sts = sts.concat((window.classData[r.id] || []).map(s => Object.assign({}, s, { roomName: `${r.level}/${r.section}` })));
    });
  } else {
    sts = (window.classData[rid] || []).map(s => Object.assign({}, s, { roomName: '' }));
  }
  const sub=window.subjects.find(s=>s.id===document.getElementById('asmnt-subject')?.value);
  const rm=window.rooms.find(r=>r.id===rid);
  let csv='\uFEFFเลขที่,ชื่อ-นามสกุล,ห้อง,งานเก็บ,กลางภาค,ปลายภาค,คะแนนรวม,เกมด\n';
  sts.forEach(s=>{
    const t=window.calcTotal(s);const g=t>0?window.getGrade(t):'-';
    csv+=`${s.no},"${window.esc(s.name)}",${s.roomName || ''},${s.scores.work},${s.scores.mid},${s.scores.final},${t||'-'},${g}\n`;
  });
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download=`scores_${rid === 'all' ? 'all' : (rm?rm.level+rm.section:'')}_${window.esc(sub?sub.name:'')}.csv`;
  a.click();
  window.toast('⬇ ส่งออก CSV แล้ว');
}

window.populateAsmntDropdowns = function(){
  const rsel = document.getElementById('asmnt-room');
  if(rsel){
    let options = '<option value="all">🌟 ทุกห้องเรียน</option>';
    options += window.rooms.map(r=>`<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
    rsel.innerHTML = options;
    if(window.currentClass && (window.currentClass === 'all' || window.rooms.some(r=>r.id===window.currentClass))) {
      rsel.value=window.currentClass;
    } else {
      rsel.value='all';
    }
  }
  window.populateAsmntSubjects();
}

window.populateAsmntSubjects = function(){
  const rid = document.getElementById('asmnt-room')?.value || (window.rooms[0]?.id||'');
  const ssel = document.getElementById('asmnt-subject');
  if(!ssel) return;
  const currentTerm = window.activeSemesterFilter || '1';
  const filteredSubjects = window.subjects.filter(s => currentTerm === 'all' || s.term === 'all' || s.term === currentTerm);
  const roomSubs = rid === 'all' ? filteredSubjects : filteredSubjects.filter(s=>!s.rooms||s.rooms.length===0||s.rooms.includes(rid));
  ssel.innerHTML = (roomSubs.length
    ? roomSubs.map(s=>`<option value="${s.id}">${window.esc(s.name)}</option>`)
    : filteredSubjects.map(s=>`<option value="${s.id}">${window.esc(s.name)}</option>`)
  ).join('');
}

window.renderAssessment = function(){
  window.populateAsmntDropdowns();
  const rid = document.getElementById('asmnt-room')?.value;
  if(rid) {
    window.currentClass = rid;
    if(window.updateTopbarClassBadge) window.updateTopbarClassBadge();
  }
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
  if (rid === 'all') {
    for (const r of window.rooms) {
      await window.pushStudents(r.id);
    }
  } else {
    await window.pushStudents(rid);
  }
  window.showSyncToast('💾 บันทึกคะแนนแล้ว');
}

window.renderScores = function(){
  const rid=document.getElementById('asmnt-room')?.value||window.currentClass;
  if(rid && window.currentClass !== rid) {
    window.currentClass=rid;
    if(window.updateTopbarClassBadge) window.updateTopbarClassBadge();
  }
  
  let sts = [];
  if (rid === 'all') {
    window.rooms.forEach(r => {
      sts = sts.concat((window.classData[r.id] || []).map(s => Object.assign({}, s, { roomName: `${r.level}/${r.section}`, roomId: r.id })));
    });
  } else {
    sts = (window.classData[rid] || []).map(s => Object.assign({}, s, { roomId: rid }));
  }

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
    const roomBadge = rid === 'all' && s.roomName ? ` <span class="badge badge-info" style="font-size:10px;padding:2px 6px;margin-left:6px;">${s.roomName}</span>` : '';
    tr.innerHTML=[
      '<td style="color:var(--text3);font-size:12px;text-align:center">'+s.no+'</td>',
      '<td><div style="display:flex;align-items:center;gap:8px"><span class="avatar '+av+'" style="font-size:10px">'+ini+'</span>'+s.name+roomBadge+'</div></td>',
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
  let s = null;
  if (rid === 'all') {
    for (const r of window.rooms) {
      const list = window.classData[r.id] || [];
      s = list.find(x => x.id === id);
      if (s) break;
    }
  } else {
    const sts=window.classData[rid]||[];
    s=sts.find(x=>x.id===id);
  }
  if(s){
    s.scores[key]=Math.min(100,Math.max(0,+val||0));
  }
  window.updateScoreStats();
}

window.updateScoreStats = function(){
  const rid=document.getElementById('asmnt-room')?.value||window.currentClass;
  let sts = [];
  if (rid === 'all') {
    window.rooms.forEach(r => {
      sts = sts.concat(window.classData[r.id] || []);
    });
  } else {
    sts = window.classData[rid] || [];
  }
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
  let sts = [];
  if (rid === 'all') {
    window.rooms.forEach(r => {
      sts = sts.concat((window.classData[r.id] || []).map(s => Object.assign({}, s, { roomName: `${r.level}/${r.section}` })));
    });
  } else {
    sts = (window.classData[rid] || []).map(s => Object.assign({}, s, { roomName: '' }));
  }
  const grades={ '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 };
  
  const tbody = document.getElementById('grade-tbody');
  if (tbody) {
    tbody.innerHTML=sts.map((s,i)=>{
      const total=window.calcTotal(s);const g=total>0?window.getGrade(total):'-';const gc=g!=='-'?`badge-${g}`:'';
      if(g!=='-' && grades[g] !== undefined) grades[g]++;
      const roomBadge = rid === 'all' && s.roomName ? ` <span class="badge badge-info" style="font-size:10px;padding:2px 6px;margin-left:6px;">${s.roomName}</span>` : '';
      return`<tr>
        <td style="color:var(--text3);font-size:12px;text-align:center">${s.no}</td>
        <td><div style="display:flex;align-items:center;gap:8px"><span class="avatar ${window.avColor(i)}">${window.esc(window.initials(s.name))}</span>${window.esc(s.name)}${roomBadge}</div></td>
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
    
    csv+=`${s.no},"${window.esc(s.name)}",${phaseScores ? phaseScores+',' : ''}${grandTotal},"${gr}",${pct}%\n`;
  });
  
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  
  const roomObj=window.rooms.find(r=>r.id===rid);
  const classLabel=roomObj?`${roomObj.level}_${roomObj.section}`:rid;
  const subObj=window.subjects.find(s=>s.id===sid);
  const subLabel=subObj?`_${window.esc(subObj.name)}`:'';
  
  a.download=`work_summary_${classLabel}${subLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  window.toast('✅ ส่งออกไฟล์ CSV สำเร็จ');
}
