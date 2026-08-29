// ====== ATTENDANCE: SUMMARY & REPORTS ======
// หน้าสรุปผลการเช็คชื่อ: รายวิชา/รายห้อง, drill-down ดูรายครั้ง, ตารางสรุปรายเดือน/รายวัน
// แยกออกมาจาก attendance.js เดิม
window.renderAttSummaryPage = function(){
  const toEl=document.getElementById('sum-to');
  const frEl=document.getElementById('sum-from');
  if(toEl&&!toEl.value) toEl.value=window.today();
  if(frEl&&!frEl.value){
    const d=new Date(); d.setDate(d.getDate()-30);
    frEl.value=d.toISOString().split('T')[0];
  }
  window.showSumView('summary');
  window.switchSumView(window._sumView2||'overview');
}

window.switchSumView = function(view){
  window._sumView2=view;
  const views=['overview','daily','room-stats'];
  views.forEach(v=>{
    const btn=document.getElementById('sumv-'+v);
    if(btn){
      btn.style.background=v===view?'var(--accent)':'var(--surface)';
      btn.style.color=v===view?'#fff':'var(--text2)';
      btn.style.fontWeight=v===view?'600':'500';
    }
  });
  const el=document.getElementById('att-sum-page-content');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3)">⏳ กำลังโหลด...</div>';
  
  setTimeout(()=>{
    if(view==='overview') el.innerHTML=window.buildSumOverview();
    else if(view==='daily') el.innerHTML=window.buildSumDaily();
    else if(view==='room-stats') {
      if(window.buildRoomStatsHTML) {
        el.innerHTML = window.buildRoomStatsHTML();
        if(window.initRoomStatsDropdowns) window.initRoomStatsDropdowns();
        if(window.renderRoomStats) window.renderRoomStats();
      }
    }
  },30);
}

// ====== ATTENDANCE SUMMARY — tab switch & drill-down ======
window.refreshAttSummary = function(){
  window.renderAttSummaryPage();
}

window.showSumView = function(viewId){
  ['subject-list','subject-sessions','room-list','room-sessions','summary'].forEach(v=>{
    const el = document.getElementById('sum-view-'+v);
    if(el) el.style.display = v===viewId?'':'none';
  });
}

window.setBreadcrumb = function(items){
  const el = document.getElementById('sum-breadcrumb');
  if(!el) return;
  if(!items.length){el.innerHTML='';return;}
  el.innerHTML = items.map((item,i)=>{
    if(i===items.length-1) return `<span style="font-weight:600;color:var(--text)">${item.label}</span>`;
    return `<span style="cursor:pointer;color:var(--accent)" onclick="${item.onclick}">${item.label}</span><span style="color:var(--text3)">›</span>`;
  }).join('');
}

window.renderAttSubjectCards = function(){
  const el = document.getElementById('att-sum-subject-body');
  if(!el) return;
  const currentTerm = window.activeSemesterFilter || '1';
  const termSubjects = window.subjects.filter(s => currentTerm === 'all' || s.term === 'all' || s.term === currentTerm);
  if(!termSubjects.length){
    el.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text3)">ยังไม่มีรายวิชาในภาคเรียนนี้</div>';
    return;
  }

  const generateCardHTML = (sub) => {
    const sessions = window.getAllSessionsForSubject(sub.name);
    const stats = window.calcSessionsStats(sessions);
    const pct = stats.total>0?Math.round((stats.P+stats.L)/stats.total*100):null;
    const col = pct===null?'var(--text3)':pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)';
    return `<div onclick="drillSubject('${sub.id}')"
      style="cursor:pointer;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:16px;transition:all .18s"
      onmouseover="this.style.borderColor='var(--accent)';this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.transform='';this.style.boxShadow=''">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
        <div>
          <div style="font-size:15px;font-weight:700">${window.esc(sub.name)}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${window.esc(sub.teacher||'')}</div>
        </div>
        <div style="font-size:24px;font-weight:800;color:${col}">${pct!==null?pct+'%':'–'}</div>
      </div>
      ${stats.total>0?`<div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;display:flex;margin-bottom:8px">
        <div style="width:${Math.round(stats.P/stats.total*100)}%;background:var(--green)"></div>
        <div style="width:${Math.round(stats.L/stats.total*100)}%;background:var(--amber)"></div>
        <div style="width:${Math.round(stats.A/stats.total*100)}%;background:var(--red)"></div>
        <div style="width:${Math.round(stats.E/stats.total*100)}%;background:var(--teal)"></div>
      </div>`:'<div style="height:6px;background:var(--border);border-radius:3px;margin-bottom:8px"></div>'}
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:8px;font-size:11px">
          <span style="color:var(--green)">✓${stats.P}</span>
          <span style="color:var(--amber)">L${stats.L}</span>
          <span style="color:var(--red)">✗${stats.A}</span>
          <span style="color:var(--teal)">E${stats.E}</span>
        </div>
        <span style="font-size:11px;color:var(--text3)">${sessions.length} คาบ</span>
      </div>
    </div>`;
  };

  if (currentTerm === 'all') {
    const t1 = termSubjects.filter(s => s.term === '1');
    const t2 = termSubjects.filter(s => s.term === '2');
    const tAll = termSubjects.filter(s => s.term === 'all' || !s.term);
    
    let html = '';
    if (t1.length) {
      html += `<div style="grid-column: 1 / -1; font-weight: 700; font-size: 13px; color: var(--text2); border-bottom: 2px solid var(--border); padding-bottom: 4px; margin-top: 12px; margin-bottom: 8px;">ภาคเรียนที่ 1</div>`;
      html += t1.map(generateCardHTML).join('');
    }
    if (t2.length) {
      html += `<div style="grid-column: 1 / -1; font-weight: 700; font-size: 13px; color: var(--text2); border-bottom: 2px solid var(--border); padding-bottom: 4px; margin-top: 20px; margin-bottom: 8px;">ภาคเรียนที่ 2</div>`;
      html += t2.map(generateCardHTML).join('');
    }
    if (tAll.length) {
      html += `<div style="grid-column: 1 / -1; font-weight: 700; font-size: 13px; color: var(--text2); border-bottom: 2px solid var(--border); padding-bottom: 4px; margin-top: 20px; margin-bottom: 8px;">เรียนทั้งปีการศึกษา</div>`;
      html += tAll.map(generateCardHTML).join('');
    }
    el.innerHTML = html;
  } else {
    el.innerHTML = termSubjects.map(generateCardHTML).join('');
  }
}

window.drillSubject = function(subjectId){
  const sub = window.subjects.find(s=>s.id===subjectId);
  if(!sub) return;
  window._sumSubjectId = subjectId;
  window._sumView = 'sessions';
  window.showSumView('subject-sessions');
  window.setBreadcrumb([
    {label:'📚 รายวิชา', onclick:"switchSummaryTab('subject')"},
    {label: sub.name}
  ]);
  const t = document.getElementById('sum-subj-title'); if(t) t.textContent = sub.name;
  const st = document.getElementById('sum-subj-subtitle'); if(st) st.textContent = (sub.code||'')+(sub.teacher?' · ครู'+sub.teacher:'');
  window.renderSubjectSessions(sub.name);
}

window.renderSubjectSessions = function(subjectName){
  const el = document.getElementById('sum-subj-sessions');
  if(!el) return;
  const sessions = window.getAllSessionsForSubject(subjectName);
  if(!sessions.length){
    el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3)">ยังไม่มีการบันทึก</div>';
    return;
  }
  const byDate={};
  sessions.forEach(s=>{if(!byDate[s.date])byDate[s.date]=[];byDate[s.date].push(s);});
  const dates=Object.keys(byDate).sort().reverse();
  const dayNames=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  el.innerHTML='<div style="border-top:1px solid var(--border)">'
    +dates.map(date=>{
      const daySessions=byDate[date];
      const dayStats=window.calcSessionsStats(daySessions);
      const pct=dayStats.total>0?Math.round((dayStats.P+dayStats.L)/dayStats.total*100):null;
      const d=new Date(date+'T00:00:00');
      return `<div style="border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;padding:10px 16px;background:var(--surface2);gap:12px">
          <div style="flex:1;display:flex;align-items:center;gap:10px">
            <span style="font-size:13px;font-weight:700">วัน${dayNames[d.getDay()]} ${date}</span>
            <button onclick="deleteAttDay('${date}','${subjectName}')" 
              style="padding:2px 8px;border-radius:6px;border:1px solid var(--red);background:transparent;color:var(--red);font-size:10px;font-weight:600;cursor:pointer;font-family:Sarabun,sans-serif;transition:all .15s"
              onmouseover="this.style.background='var(--red-light)'" onmouseout="this.style.background='transparent'">
              🗑️ ลบทั้งวัน
            </button>
          </div>
          ${pct!==null?`<span style="font-size:14px;font-weight:800;color:${pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)'}">${pct}%</span>`:''}
        </div>
        ${daySessions.map(s=>{
          const rm=window.rooms.find(r=>r.id===s.roomId);
          const sPct=s.total>0?Math.round((s.P+s.L)/s.total*100):null;
          return `<div style="display:flex;align-items:center;padding:10px 16px;border-top:1px solid var(--border);gap:12px">
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600">${rm?rm.level+'/'+rm.section:'?'}</div>
              <div style="display:flex;gap:10px;font-size:11px;color:var(--text3);margin-top:3px">
                <span style="color:var(--green)">✓${s.P}</span>
                <span style="color:var(--amber)">L${s.L}</span>
                <span style="color:var(--red)">✗${s.A}</span>
                <span style="color:var(--teal)">E${s.E}</span>
                <span>คาบ ${s.period}</span>
              </div>
            </div>
            ${sPct!==null?`<div style="text-align:center;margin-right:8px">
              <div style="font-size:16px;font-weight:800;color:${sPct>=80?'var(--green)':sPct>=60?'var(--amber)':'var(--red)'}">${sPct}%</div>
              <div style="font-size:10px;color:var(--text3)">${s.P+s.L}/${s.total} คน</div>
            </div>`:''}
            <div style="display:flex;gap:6px">
              <button onclick="editAttSession('${s.roomId}','${date}','${s.period}','${subjectName}')"
                style="padding:6px 14px;border-radius:8px;border:1.5px solid var(--accent);background:var(--accent-light);color:var(--accent);font-size:12px;font-weight:600;cursor:pointer;font-family:Sarabun,sans-serif">
                ✏️ แก้ไข
              </button>
              <button onclick="deleteAttSession('${s.roomId}','${date}','${s.period}','${subjectName}')"
                style="padding:6px 14px;border-radius:8px;border:1.5px solid var(--red);background:var(--red-light);color:var(--red);font-size:12px;font-weight:600;cursor:pointer;font-family:Sarabun,sans-serif;transition:all .15s"
                onmouseover="this.style.background='var(--red)';this.style.color='#fff'" onmouseout="this.style.background='var(--red-light)';this.style.color='var(--red)'">
                🗑️ ลบ
              </button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('')+'</div>';
}

window.renderRoomList = function(){
  const el = document.getElementById('att-sum-room-body');
  if(!el) return;
  if(!window.rooms.length){
    el.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text3)">ยังไม่มีห้องเรียน</div>';
    return;
  }
  el.innerHTML = window.rooms.map(rm=>{
    const sessions = window.getAllSessionsForRoom(rm.id);
    const stats = window.calcSessionsStats(sessions);
    const pct = stats.total>0?Math.round((stats.P+stats.L)/stats.total*100):null;
    const col = pct===null?'var(--text3)':pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)';
    const sts = window.classData[rm.id]||[];
    return `<div onclick="drillRoom('${rm.id}')"
      style="cursor:pointer;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:16px;transition:all .18s"
      onmouseover="this.style.borderColor='var(--accent)';this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.transform='';this.style.boxShadow=''">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
        <div>
          <div style="font-size:16px;font-weight:700">${rm.level}/${rm.section}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">ครูที่ปรึกษา: ${window.esc(rm.teacher||'-')} · ${sts.length} นักเรียน</div>
        </div>
        <div style="font-size:24px;font-weight:800;color:${col}">${pct!==null?pct+'%':'–'}</div>
      </div>
      ${stats.total>0?`<div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;display:flex;margin-bottom:8px">
        <div style="width:${Math.round(stats.P/stats.total*100)}%;background:var(--green)"></div>
        <div style="width:${Math.round(stats.L/stats.total*100)}%;background:var(--amber)"></div>
        <div style="width:${Math.round(stats.A/stats.total*100)}%;background:var(--red)"></div>
        <div style="width:${Math.round(stats.E/stats.total*100)}%;background:var(--teal)"></div>
      </div>`:'<div style="height:6px;background:var(--border);border-radius:3px;margin-bottom:8px"></div>'}
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:8px;font-size:11px">
          <span style="color:var(--green)">✓${stats.P}</span>
          <span style="color:var(--amber)">L${stats.L}</span>
          <span style="color:var(--red)">✗${stats.A}</span>
          <span style="color:var(--teal)">E${stats.E}</span>
        </div>
        <span style="font-size:11px;color:var(--text3)">${sessions.length} คาบ</span>
      </div>
    </div>`;
  }).join('');
}

window.drillRoom = function(roomId){
  const rm = window.rooms.find(r=>r.id===roomId);
  if(!rm) return;
  window._sumRoomId = roomId;
  window._sumView = 'sessions';
  window.showSumView('room-sessions');
  window.setBreadcrumb([
    {label:'🏫 รายห้อง', onclick:"switchSummaryTab('room')"},
    {label: rm.level+'/'+rm.section}
  ]);
  const title = document.getElementById('sum-room-title'); if(title) title.textContent = `${rm.level}/${rm.section}`;
  const sub = document.getElementById('sum-room-subtitle'); if(sub) sub.textContent = `ครูที่ปรึกษา: ${window.esc(rm.teacher||'-')} · ${(window.classData[roomId]||[]).length} นักเรียน`;
  window.renderRoomSessions(roomId);
}

window.renderRoomSessions = function(roomId){
  const el = document.getElementById('sum-room-sessions');
  if(!el) return;
  const sessions = window.getAllSessionsForRoom(roomId);
  if(!sessions.length){
    el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3)">ยังไม่มีการบันทึก</div>';
    return;
  }
  const byDate={};
  sessions.forEach(s=>{if(!byDate[s.date])byDate[s.date]=[];byDate[s.date].push(s);});
  const dates=Object.keys(byDate).sort().reverse();
  const dayNames=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  el.innerHTML='<div style="border-top:1px solid var(--border)">'
    +dates.map(date=>{
      const daySessions=byDate[date];
      const dayStats=window.calcSessionsStats(daySessions);
      const pct=dayStats.total>0?Math.round((dayStats.P+dayStats.L)/dayStats.total*100):null;
      const d=new Date(date+'T00:00:00');
      return `<div style="border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;padding:10px 16px;background:var(--surface2);gap:12px">
          <div style="flex:1;display:flex;align-items:center;gap:10px">
            <span style="font-size:13px;font-weight:700">วัน${dayNames[d.getDay()]} ${date}</span>
            <button onclick="deleteAttDay('${date}','','${roomId}')" 
              style="padding:2px 8px;border-radius:6px;border:1px solid var(--red);background:transparent;color:var(--red);font-size:10px;font-weight:600;cursor:pointer;font-family:Sarabun,sans-serif;transition:all .15s"
              onmouseover="this.style.background='var(--red-light)'" onmouseout="this.style.background='transparent'">
              🗑️ ลบทั้งวัน
            </button>
          </div>
          ${pct!==null?`<span style="font-size:14px;font-weight:800;color:${pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)'}">${pct}%</span>`:''}
        </div>
        ${daySessions.map(s=>{
          const sPct=s.total>0?Math.round((s.P+s.L)/s.total*100):null;
          return `<div style="display:flex;align-items:center;padding:10px 16px;border-top:1px solid var(--border);gap:12px">
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600">${window.esc(s.subjectName||'–')}</div>
              <div style="display:flex;gap:10px;font-size:11px;color:var(--text3);margin-top:3px">
                <span style="color:var(--green)">✓${s.P}</span>
                <span style="color:var(--amber)">L${s.L}</span>
                <span style="color:var(--red)">✗${s.A}</span>
                <span style="color:var(--teal)">E${s.E}</span>
                <span>คาบ ${s.period}</span>
              </div>
            </div>
            ${sPct!==null?`<div style="text-align:center;margin-right:8px">
              <div style="font-size:16px;font-weight:800;color:${sPct>=80?'var(--green)':sPct>=60?'var(--amber)':'var(--red)'}">${sPct}%</div>
              <div style="font-size:10px;color:var(--text3)">${s.P+s.L}/${s.total} คน</div>
            </div>`:''}
            <div style="display:flex;gap:6px">
              <button onclick="editAttSession('${roomId}','${date}','${s.period}','${window.esc(s.subjectName||'all')}')"
                style="padding:6px 14px;border-radius:8px;border:1.5px solid var(--accent);background:var(--accent-light);color:var(--accent);font-size:12px;font-weight:600;cursor:pointer;font-family:Sarabun,sans-serif">
                ✏️ แก้ไข
              </button>
              <button onclick="deleteAttSession('${roomId}','${date}','${s.period}','${window.esc(s.subjectName||'all')}')"
                style="padding:6px 14px;border-radius:8px;border:1.5px solid var(--red);background:var(--red-light);color:var(--red);font-size:12px;font-weight:600;cursor:pointer;font-family:Sarabun,sans-serif;transition:all .15s"
                onmouseover="this.style.background='var(--red)';this.style.color='#fff'" onmouseout="this.style.background='var(--red-light)';this.style.color='var(--red)'">
                🗑️ ลบ
              </button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('')+'</div>';
}

window.editAttSession = function(roomId, date, period, subjectName){
  window.currentClass = roomId;
  window.selectSubjectCard(null, date, period, subjectName, roomId);
  window.scrollTo({top:0, behavior:'smooth'});
}

window.getAllSessionsForSubject = function(subjectName){
  const sessMap={};
  Object.entries(window.attData).forEach(([key,status])=>{
    const parts=key.split('_');
    const roomId=parts[0],sid=+parts[1],date=parts[2],period=parts[3],sub=parts.slice(4).join('_');
    if(sub!==subjectName&&sub!=='all') return;
    const sessKey=roomId+'|'+date+'|'+period+'|'+sub;
    if(!sessMap[sessKey]) sessMap[sessKey]={roomId,date,period,subjectName,P:0,L:0,A:0,E:0,total:0,students:[]};
  });
  
  Object.values(sessMap).forEach(sess => {
    const sts = window.classData[sess.roomId] || [];
    sess.total = sts.length;
    sts.forEach(s => {
      sess.students.push(s.id);
      const status = window.getAttStatus(s.id, sess.date, sess.period, sess.subjectName, sess.roomId);
      if(status==='P') sess.P++;
      else if(status==='L') sess.L++;
      else if(status==='A') sess.A++;
      else if(status==='E') sess.E++;
    });
  });
  
  return Object.values(sessMap).sort((a,b)=>b.date.localeCompare(a.date)||(+a.period-+b.period));
}

window.getAllSessionsForRoom = function(roomId){
  const sessMap={};
  Object.entries(window.attData).forEach(([key,status])=>{
    const parts=key.split('_');
    const rId=parts[0],sid=+parts[1],date=parts[2],period=parts[3],sub=parts.slice(4).join('_');
    if(rId!==roomId) return;
    const sessKey=date+'|'+period+'|'+sub;
    if(!sessMap[sessKey]) sessMap[sessKey]={roomId,date,period,subjectName:sub,P:0,L:0,A:0,E:0,total:0,students:[]};
  });
  
  Object.values(sessMap).forEach(sess => {
    const sts = window.classData[sess.roomId] || [];
    sess.total = sts.length;
    sts.forEach(s => {
      sess.students.push(s.id);
      const status = window.getAttStatus(s.id, sess.date, sess.period, sess.subjectName, sess.roomId);
      if(status==='P') sess.P++;
      else if(status==='L') sess.L++;
      else if(status==='A') sess.A++;
      else if(status==='E') sess.E++;
    });
  });
  
  return Object.values(sessMap).sort((a,b)=>b.date.localeCompare(a.date)||(+a.period-+b.period));
}

window.calcSessionsStats = function(sessions){
  const st={P:0,L:0,A:0,E:0,total:0};
  sessions.forEach(s=>{st.P+=s.P;st.L+=s.L;st.A+=s.A;st.E+=s.E;st.total+=s.total;});
  return st;
}

window.buildSumOverview = function(){
  let P=0, L=0, A=0, E=0;
  Object.values(window.attData).forEach(v=>{
    if(v==='P') P++;
    else if(v==='L') L++;
    else if(v==='A') A++;
    else if(v==='E') E++;
  });
  const total = P+L+A+E;
  const presentPct = total>0?Math.round((P+L)/total*100):0;
  
  const academicYear = window.academicYear || '2568';
  const yrBE = parseInt(academicYear);
  const yrAD = yrBE - 543;
  const todayStr = window.today();

  const months = [
    { name: 'พฤษภาคม', idx: 4, yr: yrAD, sem: 1, limitStart: 16, limitEnd: 31 },
    { name: 'มิถุนายน', idx: 5, yr: yrAD, sem: 1, limitStart: 1, limitEnd: 30 },
    { name: 'กรกฎาคม', idx: 6, yr: yrAD, sem: 1, limitStart: 1, limitEnd: 31 },
    { name: 'สิงหาคม', idx: 7, yr: yrAD, sem: 1, limitStart: 1, limitEnd: 31 },
    { name: 'กันยายน', idx: 8, yr: yrAD, sem: 1, limitStart: 1, limitEnd: 30 },
    { name: 'ตุลาคม', idx: 9, yr: yrAD, sem: 1, limitStart: 1, limitEnd: 15 },
    { name: 'พฤศจิกายน', idx: 10, yr: yrAD, sem: 2, limitStart: 1, limitEnd: 30 },
    { name: 'ธันวาคม', idx: 11, yr: yrAD, sem: 2, limitStart: 1, limitEnd: 31 },
    { name: 'มกราคม', idx: 0, yr: yrAD + 1, sem: 2, limitStart: 1, limitEnd: 31 },
    { name: 'กุมภาพันธ์', idx: 1, yr: yrAD + 1, sem: 2, limitStart: 1, limitEnd: 29 },
    { name: 'มีนาคม', idx: 2, yr: yrAD + 1, sem: 2, limitStart: 1, limitEnd: 31 },
    { name: 'เมษายน', idx: 3, yr: yrAD + 1, sem: 2, limitStart: 32, limitEnd: 30 }
  ];

  let term1Opened = 0;
  let term1Checked = 0;
  let term2Opened = 0;
  let term2Checked = 0;

  months.forEach(m => {
    const totalDaysInMonth = new Date(m.yr, m.idx + 1, 0).getDate();
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${m.yr}-${String(m.idx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      let isTermDay = false;
      const dates = window.getSemesterDates();
      if (m.sem === 1) {
        isTermDay = dateStr >= dates.sem1Start && dateStr <= dates.sem1End;
      } else if (m.sem === 2) {
        isTermDay = dateStr >= dates.sem2Start && dateStr <= dates.sem2End;
      }
      if (!isTermDay) continue;

      const d = new Date(m.yr, m.idx, day);
      const dayOfWeek = d.getDay();
      const isHoliday = window.thaiHolidays && !!window.thaiHolidays[dateStr];

      let isSchoolDay = false;
      if (!isHoliday) {
        if (dayOfWeek === 6) {
          const hasSatSchedule = window.schedules && window.schedules.some(sc => +sc.day === 6);
          if (hasSatSchedule) isSchoolDay = true;
        } else if (dayOfWeek === 0) {
          const hasSunSchedule = window.schedules && window.schedules.some(sc => +sc.day === 7);
          if (hasSunSchedule) isSchoolDay = true;
        } else {
          const dayNumMap = { 1:1, 2:2, 3:3, 4:4, 5:5 };
          const dayNum = dayNumMap[dayOfWeek];
          const hasSchedule = window.schedules && window.schedules.some(sc => +sc.day === dayNum);
          if (hasSchedule) isSchoolDay = true;
        }
      }

      if (isSchoolDay) {
        const hasPassed = dateStr <= todayStr;
        if (hasPassed) {
          const dayNumMap = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 0:7 };
          const dayNum = dayNumMap[dayOfWeek];
          const dayScheds = window.schedules.filter(sc => {
            if (+sc.day !== dayNum) return false;
            const roomExists = window.rooms.some(r => r.id === sc.roomId);
            const subjExists = window.subjects.some(s => s.id === sc.subjectId);
            return roomExists && subjExists;
          });

          let dayFraction = 0;
          if (dayScheds.length > 0) {
            const sessionKeys = Object.keys(window.attData);
            const checkedCount = dayScheds.filter(sc => {
              const subName = window.resolveSubjectName(sc.subjectId);
              return sessionKeys.some(k => {
                const parts = k.split('_');
                return parts[0] === sc.roomId && parts[2] === dateStr && parts[3] === String(sc.period) && parts.slice(4).join('_') === subName;
              });
            }).length;
            dayFraction = checkedCount / dayScheds.length;
          }

          if (m.sem === 1) {
            term1Opened++;
            term1Checked += dayFraction;
          } else if (m.sem === 2) {
            term2Opened++;
            term2Checked += dayFraction;
          }
        }
      }
    }
  });

  const calendarHTML = window.buildAcademicCalendarHTML ? window.buildAcademicCalendarHTML() : '';
  
  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="stats-row" style="margin-bottom:0">
      <div class="stat-card stat-teal">
        <div class="label">เทอม 1 · เปิดเรียนแล้ว</div>
        <div class="value">${term1Opened} วัน</div>
        <div class="sub">จากตารางเรียนปกติ</div>
      </div>
      <div class="stat-card stat-green">
        <div class="label">เทอม 1 · เช็กชื่อแล้ว</div>
        <div class="value">${window.formatFractionDays(term1Checked)} วัน</div>
        <div class="sub">คิดเป็น ${term1Opened > 0 ? Math.round(term1Checked / term1Opened * 100) : 0}% ของวันเปิด</div>
      </div>
      <div class="stat-card stat-purple">
        <div class="label">เทอม 2 · เปิดเรียนแล้ว</div>
        <div class="value">${term2Opened} วัน</div>
        <div class="sub">จากตารางเรียนปกติ</div>
      </div>
      <div class="stat-card stat-amber">
        <div class="label">เทอม 2 · เช็กชื่อแล้ว</div>
        <div class="value">${window.formatFractionDays(term2Checked)} วัน</div>
        <div class="sub">คิดเป็น ${term2Opened > 0 ? Math.round(term2Checked / term2Opened * 100) : 0}% ของวันเปิด</div>
      </div>
    </div>
    
    <div class="card" style="margin-bottom:0">
      <div class="card-body" style="text-align:center;padding:24px">
        <div style="font-size:14px;font-weight:600;color:var(--text3);margin-bottom:6px">อัตราการเข้าเรียนเฉลี่ยรวม</div>
        <div style="font-size:44px;font-weight:800;color:var(--teal);line-height:1;margin-bottom:12px">${presentPct}%</div>
        <div class="progress-bar" style="height:10px;background:var(--border);border-radius:5px;overflow:hidden;max-width:400px;margin:0 auto">
          <div class="progress-fill" style="width:${presentPct}%;background:var(--teal);height:100%"></div>
        </div>
      </div>
    </div>
    
    ${calendarHTML}
  </div>`;
}

window.buildSumDaily = function(){
  const frEl = document.getElementById('sum-from');
  const toEl = document.getElementById('sum-to');
  const fromVal = frEl ? frEl.value : '';
  const toVal = toEl ? toEl.value : '';

  // Extract all sessions
  const sessMap = {};
  Object.entries(window.attData).forEach(([key, status]) => {
    const parts = key.split('_');
    const roomId = parts[0];
    const sid = +parts[1];
    const date = parts[2];
    const period = parts[3];
    const sub = parts.slice(4).join('_');
    
    // Date range filter
    if (fromVal && date < fromVal) return;
    if (toVal && date > toVal) return;

    const sessKey = roomId + '|' + date + '|' + period + '|' + sub;
    if (!sessMap[sessKey]) {
      sessMap[sessKey] = { roomId, date, period, subjectName: sub, P: 0, L: 0, A: 0, E: 0, total: 0 };
    }
  });

  // Calculate statistics for each session
  Object.values(sessMap).forEach(sess => {
    const sts = window.classData[sess.roomId] || [];
    sess.total = sts.length;
    sts.forEach(s => {
      const status = window.getAttStatus(s.id, sess.date, sess.period, sess.subjectName, sess.roomId);
      if (status === 'P') sess.P++;
      else if (status === 'L') sess.L++;
      else if (status === 'A') sess.A++;
      else if (status === 'E') sess.E++;
    });
  });

  const sessions = Object.values(sessMap);
  if (!sessions.length) {
    return '<div style="text-align:center;padding:40px;color:var(--text3);font-size:14px;">📭 ยังไม่มีข้อมูลการเข้าเรียนในช่วงเวลานี้</div>';
  }

  // Group sessions by date
  const byDate = {};
  sessions.forEach(s => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });

  // Sort dates descending
  const dates = Object.keys(byDate).sort().reverse();
  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  let html = '<div style="display:flex;flex-direction:column;gap:16px;">';

  dates.forEach(date => {
    const daySessions = byDate[date];
    const d = new Date(date + 'T00:00:00');
    const dayName = dayNames[d.getDay()] || '';

    // Sort daySessions by roomId, then period
    daySessions.sort((a, b) => a.roomId.localeCompare(b.roomId) || (+a.period - +b.period));

    html += `
      <div class="card" style="margin-bottom:0; overflow:hidden; border:1px solid var(--border); border-radius:12px; box-shadow: var(--shadow);">
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--surface2); border-bottom:1px solid var(--border);">
          <span style="font-size:14px; font-weight:700; color:var(--text);">วัน${dayName}ที่ ${date}</span>
          <button onclick="window.deleteAttDay('${date}','','')" 
            style="padding:3px 10px; border-radius:8px; border:1.5px solid var(--red); background:var(--red-light); color:var(--red); font-size:11px; font-weight:700; cursor:pointer; font-family:Sarabun,sans-serif; transition:all 0.15s ease;"
            onmouseover="this.style.background='var(--red)'; this.style.color='#fff';" 
            onmouseout="this.style.background='var(--red-light)'; this.style.color='var(--red)';">
            🗑️ ลบทั้งวัน
          </button>
        </div>
        <div>
    `;

    daySessions.forEach(s => {
      const sPct = s.total > 0 ? Math.round((s.P + s.L) / s.total * 100) : 0;
      const roomObj = window.rooms.find(r => r.id === s.roomId);
      const roomLabel = roomObj ? `${roomObj.level}/${roomObj.section}` : s.roomId;
      const subLabel = s.subjectName === 'all' ? 'เช็กชื่อทั่วไป' : s.subjectName;

      html += `
        <div style="display:flex; align-items:center; padding:12px 16px; border-top: 1.5px solid var(--border); gap:12px; transition: background 0.15s;" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='transparent'">
          <div style="flex:1">
            <div style="font-weight:700; font-size:13.5px; color:var(--text); display:flex; align-items:center; gap:8px;">
              <span style="background:var(--accent-light); color:var(--accent); font-size:11px; padding:2px 6px; border-radius:6px; font-weight:700;">ห้อง ${roomLabel}</span>
              <span>${subLabel}</span>
            </div>
            <div style="display:flex; gap:10px; font-size:11px; color:var(--text3); margin-top:4px;">
              <span style="color:var(--green)">✓ มา ${s.P}</span>
              <span style="color:var(--amber)">L สาย ${s.L}</span>
              <span style="color:var(--red)">✗ ขาด ${s.A}</span>
              <span style="color:var(--teal)">E ลา ${s.E}</span>
              <span style="border-left:1px solid var(--border); padding-left:8px; margin-left:2px; color:var(--text3);">คาบ ${s.period}</span>
            </div>
          </div>
          <div style="text-align:right; margin-right:12px;">
            <div style="font-size:16px; font-weight:800; color:${sPct >= 80 ? 'var(--green)' : sPct >= 60 ? 'var(--amber)' : 'var(--red)'}">${sPct}%</div>
            <div style="font-size:10px; color:var(--text3); font-weight:600;">${s.P + s.L}/${s.total} คน</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button onclick="window.editAttSession('${s.roomId}','${date}','${s.period}','${s.subjectName}')"
              style="padding:6px 12px; border-radius:8px; border:1.5px solid var(--accent); background:var(--accent-light); color:var(--accent); font-size:12px; font-weight:600; cursor:pointer; font-family:Sarabun,sans-serif; transition:all 0.15s ease;"
              onmouseover="this.style.background='var(--accent)'; this.style.color='#fff';" 
              onmouseout="this.style.background='var(--accent-light)'; this.style.color='var(--accent)';">
              ✏️ แก้ไข
            </button>
            <button onclick="window.deleteAttSession('${s.roomId}','${date}','${s.period}','${s.subjectName}')"
              style="padding:6px 12px; border-radius:8px; border:1.5px solid var(--red); background:var(--red-light); color:var(--red); font-size:12px; font-weight:600; cursor:pointer; font-family:Sarabun,sans-serif; transition:all 0.15s ease;"
              onmouseover="this.style.background='var(--red)'; this.style.color='#fff';" 
              onmouseout="this.style.background='var(--red-light)'; this.style.color='var(--red)';">
              🗑️ ลบ
            </button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

// saveAttendance: called when teacher clicks 💾 บันทึก in checkin view
