// ====== ATTENDANCE: DAILY CHECK-IN ======
// หน้าจอเช็คชื่อรายวัน: เลือกวันที่/คาบ/วิชา, ปฏิทิน, บันทึกสถานะรายคน
// แยกออกมาจาก attendance.js เดิม
window.switchAttendanceMainTab = function(tab) {
  const btnCheckin = document.getElementById('att-main-tab-checkin');
  const btnReport = document.getElementById('att-main-tab-report');
  const contentCheckin = document.getElementById('att-tab-content-checkin');
  const contentReport = document.getElementById('att-tab-content-report');
  
  if (tab === 'checkin') {
    btnCheckin?.classList.add('active');
    btnReport?.classList.remove('active');
    if (contentCheckin) contentCheckin.style.display = '';
    if (contentReport) contentReport.style.display = 'none';
  } else {
    btnCheckin?.classList.remove('active');
    btnReport?.classList.add('active');
    if (contentCheckin) contentCheckin.style.display = 'none';
    if (contentReport) contentReport.style.display = '';
    // Force reload the summary data
    window.refreshAttSummary();
  }
};

// changeCalendarMonth: change currently displayed calendar month
window.changeCalendarMonth = function(offset) {
  window._calMonth += offset;
  if (window._calMonth < 0) {
    window._calMonth = 11;
    window._calYear -= 1;
  } else if (window._calMonth > 11) {
    window._calMonth = 0;
    window._calYear += 1;
  }
  window.drawCalendar();
};

// selectCalendarDate: update selected date when day cell clicked
window.selectCalendarDate = function(dateStr) {
  window._attDate = dateStr;
  const el = document.getElementById('att-date');
  if (el) el.value = dateStr;
  window.drawCalendar();
  window.onAttDateChange();
};

// goToToday: sets the calendar to the current date
window.goToToday = function() {
  const todayStr = window.today();
  const parts = todayStr.split('-');
  if (parts.length === 3) {
    window._calYear = parseInt(parts[0]);
    window._calMonth = parseInt(parts[1]) - 1;
  }
  window.selectCalendarDate(todayStr);
};

// drawCalendar: renders the calendar day grid
window.drawCalendar = function() {
  if (window.fetchThaiHolidays) {
    window.fetchThaiHolidays(window._calYear);
  }
  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const displayYear = window._calYear + 543;
  const labelEl = document.getElementById('cal-month-year');
  if (labelEl) labelEl.textContent = `${monthNamesThai[window._calMonth]} ${displayYear}`;

  const gridEl = document.getElementById('cal-days-grid');
  if (!gridEl) return;
  
  const firstDay = new Date(window._calYear, window._calMonth, 1);
  const startDayOfWeek = firstDay.getDay(); // 0=Sunday, 1=Monday...
  const totalDays = new Date(window._calYear, window._calMonth + 1, 0).getDate();
  
  let html = '';
  
  // Spacers for first week
  for (let i = 0; i < startDayOfWeek; i++) {
    html += '<div class="cal-day empty"></div>';
  }
  
  // Render actual days
  const currentTerm = window.activeSemesterFilter || '1';
  const dates = window.getSemesterDates();

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${window._calYear}-${String(window._calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = dateStr === window._attDate;
    
    const jsDate = new Date(window._calYear, window._calMonth, d);
    const dayOfWeek = jsDate.getDay(); // 0=Sun, 6=Sat
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    
    // Term day check
    let isTermDay = false;
    if (currentTerm === '1') {
      isTermDay = dateStr >= dates.sem1Start && dateStr <= dates.sem1End;
    } else if (currentTerm === '2') {
      isTermDay = dateStr >= dates.sem2Start && dateStr <= dates.sem2End;
    } else {
      // 'all'
      isTermDay = (dateStr >= dates.sem1Start && dateStr <= dates.sem1End) || 
                  (dateStr >= dates.sem2Start && dateStr <= dates.sem2End);
    }

    // Holiday check
    const isHoliday = !!window.thaiHolidays[dateStr];
    
    // Schedule check: Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5
    const dayNumMap = { 1:1, 2:2, 3:3, 4:4, 5:5 };
    const dayNum = dayNumMap[dayOfWeek];
    
    let hasSchedules = false;
    if (dayNum && isTermDay) {
      // Show indicator for any room that has a schedule on this day
      hasSchedules = window.schedules.some(sc => {
        if (+sc.day !== dayNum) return false;
        const roomExists = window.rooms.some(r => r.id === sc.roomId);
        const subjExists = window.subjects.some(s => s.id === sc.subjectId);
        return roomExists && subjExists;
      });
    }
    
    // Attendance check: green only when ALL schedules on that day have been checked
    let isChecked = false;
    if (hasSchedules) {
      const dayScheds = window.schedules.filter(sc => {
        if (+sc.day !== dayNum) return false;
        const roomExists = window.rooms.some(r => r.id === sc.roomId);
        const subjExists = window.subjects.some(s => s.id === sc.subjectId);
        return roomExists && subjExists;
      });
      const sessionKeys = Object.keys(window.attData);
      // Every schedule must have at least one attData record for this date
      isChecked = dayScheds.length > 0 && dayScheds.every(sc => {
        const subName = window.resolveSubjectName(sc.subjectId);
        return sessionKeys.some(k => {
          const parts = k.split('_');
          return parts[0] === sc.roomId && parts[2] === dateStr && parts[3] === String(sc.period) && parts.slice(4).join('_') === subName;
        });
      });
    }
    
    let classes = ['cal-day'];
    if (!isTermDay) classes.push('outside-term');
    if (isWeekend) classes.push('weekend');
    else if (isHoliday) classes.push('holiday');
    else if (hasSchedules) {
      if (isChecked) classes.push('checked');
      else classes.push('unchecked');
    }
    
    if (isSelected) classes.push('selected');
    
    const titleText = isHoliday ? window.thaiHolidays[dateStr] : '';
    
    let cellContent = `${d}`;
    if (isHoliday && !isWeekend) {
      const holidayName = window.thaiHolidays[dateStr] || '';
      let shortName = holidayName;
      if (shortName.startsWith('วันหยุดชดเชย')) {
        shortName = 'ชดเชย ' + shortName.replace('วันหยุดชดเชย', '').substring(0, 4) + '..';
      } else if (shortName.startsWith('วันเฉลิมพระชนมพรรษา')) {
        shortName = 'เฉลิมฯ';
      } else if (shortName.length > 8) {
        shortName = shortName.substring(0, 7) + '..';
      }
      cellContent = `<div>${d}</div><span class="holiday-lbl" title="${window.esc(holidayName)}">${shortName}</span>`;
    }
    
    html += `<div class="${classes.join(' ')}" onclick="window.selectCalendarDate('${dateStr}')" title="${titleText}">
      ${cellContent}
    </div>`;
  }
  
  gridEl.innerHTML = html;
};

// ====== ATTENDANCE — INIT PANEL ======
window.renderAttendanceSubjectSelect = function(){
  const el=document.getElementById('att-date');
  if(el&&!el.value) el.value=window.today();
  if(!window._attDate) window._attDate = el?.value || window.today();

  // Merge custom holidays from localStorage into thaiHolidays
  window.mergeCustomHolidays();

  // Initialize calendar display month/year based on active date
  const parts = window._attDate.split('-');
  if (parts.length === 3) {
    window._calYear = parseInt(parts[0]);
    window._calMonth = parseInt(parts[1]) - 1;
  }
  
  window.drawCalendar();
  window.onAttDateChange();
  window.updateHolidayBtn();
  
  const d=window._attDate||window.today();
  const l1=document.getElementById('sum-date-label'); if(l1) l1.textContent=d;
  const l2=document.getElementById('sum-date-label2'); if(l2) l2.textContent=d;
  
  window.renderAttSummaryPage();
}

// ====== Date change → show subject cards ======
window.onAttDateChange = function(){
  const dateVal=document.getElementById('att-date')?.value||window.today();
  if(!dateVal)return;
  window._attDate=dateVal;
  if (window.updateHolidayBtn) window.updateHolidayBtn();

  // Sync calendar shown month/year to selected date
  const dateParts = dateVal.split('-');
  if (dateParts.length === 3) {
    const yr = parseInt(dateParts[0]);
    const mo = parseInt(dateParts[1]) - 1;
    if (window._calYear !== yr || window._calMonth !== mo) {
      window._calYear = yr;
      window._calMonth = mo;
    }
    window.drawCalendar();
  }

  const d=new Date(dateVal+'T00:00:00');
  const jsDay=d.getDay(); // 0=Sun
  const dayMap={1:1,2:2,3:3,4:4,5:5};
  const dayNum=dayMap[jsDay];

  const dayLabel=document.getElementById('att-day-label');
  if(dayLabel) {
    const thDateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const isHoliday = !!window.thaiHolidays[dateVal];
    const holidaySuffix = isHoliday ? ` (วันหยุด: ${window.thaiHolidays[dateVal]})` : '';
    dayLabel.textContent=`วัน${ATT_DAY_NAMES[jsDay]||'เสาร์/อาทิตย์'}ที่ ${thDateStr}${holidaySuffix}`;
  }

  const checkinSec=document.getElementById('att-checkin-section');
  if(checkinSec) checkinSec.style.display='none';

  const noSched=document.getElementById('att-no-schedule');
  const cards=document.getElementById('att-subject-cards');
  const manual=document.getElementById('att-manual-select');

  // --- Outside semester check ---
  const currentTerm = window.activeSemesterFilter || '1';
  const dates = window.getSemesterDates();
  let inSemester = false;
  let semRangeStr = '';
  if (currentTerm === '1') {
    inSemester = dateVal >= dates.sem1Start && dateVal <= dates.sem1End;
    semRangeStr = `เทอม 1 (${window.formatDateThai(dates.sem1Start)} - ${window.formatDateThai(dates.sem1End)})`;
  } else if (currentTerm === '2') {
    inSemester = dateVal >= dates.sem2Start && dateVal <= dates.sem2End;
    semRangeStr = `เทอม 2 (${window.formatDateThai(dates.sem2Start)} - ${window.formatDateThai(dates.sem2End)})`;
  } else {
    // 'all'
    const inSem1 = dateVal >= dates.sem1Start && dateVal <= dates.sem1End;
    const inSem2 = dateVal >= dates.sem2Start && dateVal <= dates.sem2End;
    inSemester = inSem1 || inSem2;
    semRangeStr = `เทอม 1 (${window.formatDateThai(dates.sem1Start)} - ${window.formatDateThai(dates.sem1End)}) หรือ เทอม 2 (${window.formatDateThai(dates.sem2Start)} - ${window.formatDateThai(dates.sem2End)})`;
  }

  if (!inSemester) {
    if (noSched) {
      noSched.style.display = '';
      noSched.innerHTML = `<div style="text-align:center;padding:48px 20px;background:var(--surface);border-radius:14px;border:1px solid var(--border)">
        <div style="font-size:40px;margin-bottom:8px">🏖️</div>
        <div style="font-size:14px;font-weight:700;color:var(--text2)">อยู่นอกช่วงเวลาภาคเรียน</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px">ภาคเรียนที่เปิดใช้งานอยู่คือ ${semRangeStr}</div>
      </div>`;
    }
    if (cards) cards.style.display = 'none';
    if (manual) manual.style.display = 'none';
    const topStats = document.getElementById('att-top-stats');
    if (topStats) topStats.innerHTML = '';
    return;
  }

  // --- Weekend check ---
  if(!dayNum){
    if(noSched){
      noSched.style.display='';
      noSched.innerHTML=`<div style="text-align:center;padding:48px 20px;background:var(--surface);border-radius:14px;border:1px solid var(--border)">
        <div style="font-size:40px;margin-bottom:8px">🏖️</div>
        <div style="font-size:14px;font-weight:600;color:var(--text2)">วันเสาร์-อาทิตย์ ไม่มีเรียน</div>
      </div>`;
    }
    if(cards)cards.style.display='none';
    if(manual)manual.style.display='none';
    return;
  }

  // --- Public/Custom holiday check ---
  const isHoliday = !!window.thaiHolidays[dateVal];
  if(isHoliday){
    const holidayName = window.thaiHolidays[dateVal];
    const isCustom = window.loadCustomHolidays ? !!window.loadCustomHolidays()[dateVal] : false;
    const titleText = isCustom ? 'วันหยุดพิเศษ' : 'วันหยุดราชการ';
    const iconEmoji = isCustom ? '🚫' : '🎌';
    
    if(noSched){
      noSched.style.display='';
      noSched.innerHTML=`<div style="text-align:center;padding:48px 20px;background:var(--surface);border-radius:14px;border:1px solid var(--border)">
        <div style="font-size:40px;margin-bottom:8px">${iconEmoji}</div>
        <div style="font-size:14px;font-weight:700;color:var(--text2)">${titleText}</div>
        <div style="font-size:13px;color:var(--accent);margin-top:6px;font-weight:600">${window.esc(holidayName)}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px">ไม่ต้องเช็กชื่อในวันนี้</div>
      </div>`;
    }
    if(cards){ cards.style.display='none'; cards.innerHTML=''; }
    if(manual)manual.style.display='none';
    const topStats=document.getElementById('att-top-stats');
    if(topStats)topStats.innerHTML='';
    return;
  }

  // Show all rooms' schedules for this day
  const clsSched = window.schedules.filter(sc => {
    if (+sc.day !== dayNum) return false;
    const roomExists = window.rooms.some(r => r.id === sc.roomId);
    const subjExists = window.subjects.some(s => s.id === sc.subjectId);
    return roomExists && subjExists;
  }).sort((a,b)=>+a.period-+b.period);

  if(clsSched.length){
    if(noSched)noSched.style.display='none';
    if(cards){
      cards.style.display='grid';
      cards.innerHTML=clsSched.map(sc=>{
        const subName=window.resolveSubjectName(sc.subjectId);
        const rm2=window.rooms.find(x=>x.id===sc.roomId);
        const rm2Lvl = rm2?.level || '';
        const rm2Sec = rm2?.section || '';
        const rmLabel = rm2 ? `${rm2Lvl}/${rm2Sec}` : '';
        
        const sts=window.classData[sc.roomId]||[];
        
        const sessionKeys = Object.keys(window.attData);
        const hasSessionRecord = sessionKeys.some(k => {
          const parts = k.split('_');
          return parts[0] === sc.roomId && parts[2] === dateVal && parts[3] === String(sc.period) && parts.slice(4).join('_') === subName;
        });
        
        const counts={P:0,L:0,A:0,E:0};
        if (hasSessionRecord) {
          sts.forEach(s=>{
            const status=window.getAttStatus(s.id,dateVal,sc.period,subName,sc.roomId);
            if(counts[status]!==undefined)counts[status]++;
          });
        }
        
        const total=sts.length;
        const saved=hasSessionRecord;
        const attendPct=saved && total>0?Math.round((counts.P+counts.L)/total*100):null;
        const cardBorderColor=saved?(attendPct>=80?'var(--green)':attendPct>=60?'var(--amber)':'var(--red)'):'var(--border)';
        const pctColor = attendPct===null?'var(--text3)':attendPct>=80?'var(--green)':attendPct>=60?'var(--amber)':'var(--red)';
        
        return `<div onclick="selectSubjectCard('${sc.id}','${dateVal}','${sc.period}','${subName}','${sc.roomId}')"
          style="cursor:pointer;border:2px solid ${cardBorderColor};border-radius:14px;padding:16px;background:var(--surface);transition:all .18s;box-shadow:0 1px 4px rgba(0,0,0,.05)"
          onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,.1)'"
          onmouseout="this.style.transform='';this.style.boxShadow='0 1px 4px rgba(0,0,0,.05)'"
          id="att-card-${sc.id}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:15px;font-weight:700;color:var(--text);line-height:1.2">${subName}</div>
            <span style="font-size:11px;font-weight:700;background:var(--accent-light);color:var(--accent);padding:2px 8px;border-radius:8px;flex-shrink:0;margin-left:6px">คาบ ${sc.period}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
            <span style="font-size:12px;font-weight:700;color:var(--accent)">${rmLabel}</span>
            ${sc.loc?`<span style="font-size:11px;color:var(--text3)">· ${sc.loc}</span>`:''}
            <div style="flex:1;text-align:right;font-size:${attendPct!==null?'14':'11'}px;font-weight:${attendPct!==null?'800':'400'};color:${pctColor}">${attendPct!==null?attendPct+'%':''}</div>
          </div>
          ${saved&&total>0?`<div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;display:flex;margin-bottom:8px">
            <div style="width:${Math.round(counts.P/total*100)}%;background:var(--green)"></div>
            <div style="width:${Math.round(counts.L/total*100)}%;background:var(--amber)"></div>
            <div style="width:${Math.round(counts.A/total*100)}%;background:var(--red)"></div>
            <div style="width:${Math.round(counts.E/total*100)}%;background:var(--teal)"></div>
          </div>`:'<div style="height:5px;background:var(--border);border-radius:3px;margin-bottom:8px"></div>'}
          <div style="display:flex;gap:5px;align-items:center">
            <span style="background:var(--green-light);color:var(--green);padding:3px 9px;border-radius:8px;font-size:12px;font-weight:700">✓${counts.P}</span>
            <span style="background:var(--amber-light);color:var(--amber);padding:3px 9px;border-radius:8px;font-size:12px;font-weight:700">L${counts.L}</span>
            <span style="background:var(--red-light);color:var(--red);padding:3px 9px;border-radius:8px;font-size:12px;font-weight:700">✗${counts.A}</span>
            <span style="background:var(--teal-light);color:var(--teal);padding:3px 9px;border-radius:8px;font-size:12px;font-weight:700">E${counts.E}</span>
            ${attendPct===null?`<div style="flex:1;text-align:right;font-size:12px;font-weight:500;color:var(--text3)">กด เช็ก</div>`:''}
          </div>
        </div>`;
      }).join('');
    }
    window.renderAttTopStats(clsSched, dateVal);
    if(manual)manual.style.display='none';
  } else {
    if(noSched)noSched.style.display='none';
    if(cards)cards.innerHTML='';
    if(manual){
      manual.style.display='';
      const btns=document.getElementById('att-manual-period-btns');
      if(btns)btns.innerHTML=window.periodConfig.map(p=>`<button class="btn btn-outline btn-sm" onclick="selectSubjectCard(null,'${dateVal}','${p.no}','all')">คาบ ${p.no} (${p.start})</button>`).join('');
    }
  }
  
  window.renderAttSummaryPage();
}

window.renderAttTopStats = function(clsSched, dateVal){
  const el = document.getElementById('att-top-stats');
  if(!el) return;
  
  let P=0, L=0, A=0, E=0;
  clsSched.forEach(sc=>{
    const subName=window.resolveSubjectName(sc.subjectId);
    const sts=window.classData[sc.roomId]||[];
    sts.forEach(s=>{
      const status=window.getAttStatus(s.id,dateVal,sc.period,subName,sc.roomId);
      if(status==='P') P++;
      else if(status==='L') L++;
      else if(status==='A') A++;
      else if(status==='E') E++;
    });
  });
  
  const total = P+L+A+E;
  const pct = total>0?Math.round((P+L)/total*100):0;
  
  el.innerHTML = total>0?`
    <span style="font-size:12px;background:var(--accent-light);color:var(--accent);padding:4px 10px;border-radius:20px;font-weight:600">วันนี้มาเรียนเฉลี่ย: ${pct}%</span>
    <span style="font-size:12px;background:var(--green-light);color:var(--green);padding:4px 10px;border-radius:20px;font-weight:600">มา ✓: ${P}</span>
    <span style="font-size:12px;background:var(--red-light);color:var(--red);padding:4px 10px;border-radius:20px;font-weight:600">ขาด ✗: ${A}</span>
  `:'';
}

// ====== Select a card → switch to checkin view ======
window.selectSubjectCard = function(schedId, date, period, subjectName, roomId){
  if(roomId) window.currentClass=roomId;
  window._attDate=date; window._attPeriod=period; window._attSubject=subjectName; window._attSchedId=schedId||'';

  const mainView=document.getElementById('att-main-view');
  const checkinView=document.getElementById('att-checkin-view');
  if(mainView)mainView.style.display='none';
  if(checkinView)checkinView.style.display='';

  const rm2=window.rooms.find(r=>r.id===roomId);
  const rmLabel=rm2?`${rm2.level}/${rm2.section}`:'';
  const sub2=window.resolveSubject(subjectName)||window.resolveSubject(schedId);
  const displayName=subjectName==='all'?'เช็กชื่อ':(sub2?sub2.name:subjectName);
  
  const title = document.getElementById('att-checkin-title'); if(title) title.textContent = displayName;
  const meta=[rmLabel?'🏫 '+rmLabel:'','คาบ '+period, date].filter(Boolean).join('  ·  ');
  const metaEl = document.getElementById('att-checkin-meta'); if(metaEl) metaEl.textContent = meta;

  window.renderAttendance();
  if (window.renderCheckinPeriodsBar) {
    window.renderCheckinPeriodsBar();
  }
  window.scrollTo({top:0, behavior:'smooth'});
}

// renderCheckinPeriodsBar: renders period switcher bar for current room
window.renderCheckinPeriodsBar = function() {
  const barEl = document.getElementById('att-checkin-periods-bar');
  if (!barEl) return;
  
  const dateVal = window._attDate || window.today();
  const d = new Date(dateVal + 'T00:00:00');
  const jsDay = d.getDay();
  const dayMap = {1:1, 2:2, 3:3, 4:4, 5:5};
  const dayNum = dayMap[jsDay];
  
  if (!dayNum) {
    barEl.innerHTML = '';
    return;
  }
  
  // Filter schedules for the current room
  const roomScheds = window.schedules.filter(sc => {
    if (+sc.day !== dayNum) return false;
    if (sc.roomId !== window.currentClass) return false;
    const roomExists = window.rooms.some(r => r.id === sc.roomId);
    const subjExists = window.subjects.some(s => s.id === sc.subjectId);
    return roomExists && subjExists;
  }).sort((a, b) => +a.period - +b.period);
  
  if (!roomScheds.length) {
    barEl.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:10px 0;text-align:center;width:100%">ไม่มีคาบเรียนอื่นในวันนี้</div>';
    return;
  }
  
  barEl.innerHTML = roomScheds.map(sc => {
    const subName = window.resolveSubjectName(sc.subjectId);
    const sts = window.classData[sc.roomId] || [];
    
    // Check if there is any explicit record saved for this class + session
    const sessionKeys = Object.keys(window.attData);
    const hasSessionRecord = sessionKeys.some(k => {
      const parts = k.split('_');
      return parts[0] === sc.roomId && parts[2] === dateVal && parts[3] === String(sc.period) && parts.slice(4).join('_') === subName;
    });
    
    const counts = { P: 0, L: 0, A: 0, E: 0 };
    if (hasSessionRecord) {
      sts.forEach(s => {
        const status = window.getAttStatus(s.id, dateVal, sc.period, subName, sc.roomId);
        if (counts[status] !== undefined) counts[status]++;
      });
    }
    
    const total = sts.length;
    const saved = hasSessionRecord;
    const attendPct = saved && total > 0 ? Math.round((counts.P + counts.L) / total * 100) : null;
    
    // Check if this card matches current switcher active context
    const isActive = String(sc.period) === String(window._attPeriod) && subName === window._attSubject;
    const cardBorderColor = isActive ? 'var(--accent)' : (saved ? (attendPct >= 80 ? 'var(--green)' : attendPct >= 60 ? 'var(--amber)' : 'var(--red)') : 'var(--border)');
    
    return `
      <div onclick="window.selectCheckinPeriod('${sc.id}','${dateVal}','${sc.period}','${subName}','${sc.roomId}')"
        class="period-switch-card ${isActive ? 'active' : ''}"
        style="border-color:${cardBorderColor}">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:4px">
          <div style="font-size:14px; font-weight:700; color:var(--text); line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${subName}</div>
          <span style="font-size:10px; font-weight:700; background:var(--accent-light); color:var(--accent); padding:2px 6px; border-radius:6px; flex-shrink:0; margin-left:6px">คาบ ${sc.period}</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px">
          <span style="font-size:11px; font-weight:700; color:var(--accent)">${window.esc(window.rooms.find(x=>x.id===sc.roomId)?.level || '')}/${window.esc(window.rooms.find(x=>x.id===sc.roomId)?.section || '')}</span>
        </div>
        ${saved && total > 0 ? `
          <div style="height:5px; background:var(--border); border-radius:3px; overflow:hidden; display:flex; margin-bottom:8px">
            <div style="width:${Math.round(counts.P/total*100)}%; background:var(--green)"></div>
            <div style="width:${Math.round(counts.L/total*100)}%; background:var(--amber)"></div>
            <div style="width:${Math.round(counts.A/total*100)}%; background:var(--red)"></div>
            <div style="width:${Math.round(counts.E/total*100)}%; background:var(--teal)"></div>
          </div>
        ` : `
          <div style="height:5px; background:var(--border); border-radius:3px; margin-bottom:8px"></div>
        `}
        <div style="display:flex; gap:4px; align-items:center; justify-content:space-between; margin-top:auto">
          <div style="display:flex; gap:3px">
            <span style="background:var(--green-light); color:var(--green); padding:2px 5px; border-radius:6px; font-size:11px; font-weight:700">✓${counts.P}</span>
            <span style="background:var(--amber-light); color:var(--amber); padding:2px 5px; border-radius:6px; font-size:11px; font-weight:700">L${counts.L}</span>
            <span style="background:var(--red-light); color:var(--red); padding:2px 5px; border-radius:6px; font-size:11px; font-weight:700">✗${counts.A}</span>
            <span style="background:var(--teal-light); color:var(--teal); padding:2px 5px; border-radius:6px; font-size:11px; font-weight:700">E${counts.E}</span>
          </div>
          <div style="font-size:14px; font-weight:800; color:${attendPct === null ? 'var(--text3)' : (attendPct >= 80 ? 'var(--green)' : (attendPct >= 60 ? 'var(--amber)' : 'var(--red)'))}">
            ${attendPct !== null ? attendPct + '%' : 'กดเช็ก'}
          </div>
        </div>
      </div>
    `;
  }).join('');
};

// selectCheckinPeriod: switches context of checking view to a different period
window.selectCheckinPeriod = function(schedId, date, period, subjectName, roomId) {
  window._attDate = date; 
  window._attPeriod = period; 
  window._attSubject = subjectName; 
  window._attSchedId = schedId || '';
  if (roomId) window.currentClass = roomId;
  
  const rm2 = window.rooms.find(r => r.id === roomId);
  const rmLabel = rm2 ? `${rm2.level}/${rm2.section}` : '';
  const sub2 = window.resolveSubject(subjectName) || window.resolveSubject(schedId);
  const displayName = subjectName === 'all' ? 'เช็กชื่อ' : (sub2 ? sub2.name : subjectName);
  
  const title = document.getElementById('att-checkin-title'); if(title) title.textContent = displayName;
  const meta = [rmLabel ? '🏫 ' + rmLabel : '', 'คาบ ' + period, date].filter(Boolean).join('  ·  ');
  const metaEl = document.getElementById('att-checkin-meta'); if(metaEl) metaEl.textContent = meta;
  
  window.renderAttendance();
  window.renderCheckinPeriodsBar();
};

window.renderAttendance = function(){
  const date=window._attDate||window.today();
  const period=window._attPeriod||'1';
  const subject=window._attSubject||'all';
  const sts=window.classData[window.currentClass]||[];

  const wrap = document.getElementById('att-table-wrap');
  if(!wrap) return;

  if(!sts.length){
    wrap.innerHTML='<div style="text-align:center;padding:28px;color:var(--text3)"><div style="font-size:28px">👥</div><div style="font-size:13px;margin-top:8px">ยังไม่มีนักเรียนในห้องนี้</div></div>';
    return;
  }

  let html='<div>';
  sts.forEach((s,i)=>{
    const cur=window.getAttStatus(s.id,date,period,subject);
    const rowBg=cur==='A'?'rgba(192,57,43,.05)':cur==='L'?'rgba(196,122,10,.05)':cur==='E'?'rgba(13,122,110,.04)':'';
    html+=`<div id="att-row-${s.id}"
      style="display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border);background:${rowBg};transition:background .15s;gap:10px">
      <div style="font-size:12px;color:var(--text3);width:28px;text-align:center;flex-shrink:0">${s.no}</div>
      <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
        <span class="avatar ${window.avColor(i)}" style="font-size:10px;flex-shrink:0">${window.esc(window.initials(s.name))}</span>
        <span style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${window.esc(s.name)}</span>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        ${ATT_STATUS_CFG.map(st=>{
          const active=cur===st.k;
          return `<button
            onclick="setAttRow(${s.id},'${date}','${period}','${subject}','${st.k}')"
            title="${st.label}"
            style="padding:6px 14px;border-radius:8px;border:2px solid ${active?st.fg:'var(--border)'};background:${active?st.bg:'var(--surface)'};color:${active?st.fg:'var(--text3)'};font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;font-family:Sarabun,sans-serif;white-space:nowrap;min-width:48px">
            ${st.short}
          </button>`;
        }).join('')}
      </div>
    </div>`;
  });
  html+='</div>';

  wrap.innerHTML=html;
  window.updateQuickStats(date,period,subject);
  if(document.getElementById('att-sum-subject-body')) window.refreshAttSummary();
}

window.setAttRow = function(sid,date,period,subject,status){
  window.setAttStatus(sid,date,period,subject,status);
  const row=document.getElementById('att-row-'+sid);
  if(row){
    const rowBg=status==='A'?'rgba(192,57,43,.05)':status==='L'?'rgba(196,122,10,.05)':'transparent';
    row.style.background=rowBg;
    const btns=row.querySelectorAll('button');
    btns.forEach((btn,bi)=>{
      const st=ATT_STATUS_CFG[bi];
      const active=status===st.k;
      btn.style.borderColor=active?st.fg:'var(--border)';
      btn.style.background=active?st.bg:'var(--surface)';
      btn.style.color=active?st.fg:'var(--text3)';
    });
  }
  window.updateQuickStats(date,period,subject);
  if(document.getElementById('att-sum-subject-body')) window.refreshAttSummary();
}

window.updateQuickStats = function(date,period,subject){
  const sts = window.classData[window.currentClass] || [];
  let P=0, L=0, A=0, E=0;
  sts.forEach(s => {
    const status = window.getAttStatus(s.id, date, period, subject);
    if(status === 'P') P++;
    else if(status === 'L') L++;
    else if(status === 'A') A++;
    else if(status === 'E') E++;
  });
  
  const total = sts.length; // Total students in class
  const markedTotal = P + L + A + E; // Total students checked so far
  
  // Calculate percentages relative to the total number of students
  const pPct = total > 0 ? Math.round((P / total) * 100) : 0;
  const lPct = total > 0 ? Math.round((L / total) * 100) : 0;
  const aPct = total > 0 ? Math.round((A / total) * 100) : 0;
  const ePct = total > 0 ? Math.round((E / total) * 100) : 0;

  // Let's update the DOM elements
  const elP = document.getElementById('qs-P');
  const elPPct = document.getElementById('qs-P-pct');
  const elL = document.getElementById('qs-L');
  const elLPct = document.getElementById('qs-L-pct');
  const elA = document.getElementById('qs-A');
  const elAPct = document.getElementById('qs-A-pct');
  const elE = document.getElementById('qs-E');
  const elEPct = document.getElementById('qs-E-pct');
  const elTotal = document.getElementById('qs-total');
  const elAttPct = document.getElementById('qs-att-pct');

  if (elP) elP.textContent = P;
  if (elPPct) elPPct.textContent = `${pPct}%`;
  
  if (elL) elL.textContent = L;
  if (elLPct) elLPct.textContent = `${lPct}%`;
  
  if (elA) elA.textContent = A;
  if (elAPct) elAPct.textContent = `${aPct}%`;
  
  if (elE) elE.textContent = E;
  if (elEPct) elEPct.textContent = `${ePct}%`;
  
  if (elTotal) elTotal.textContent = total;
  if (elAttPct) elAttPct.textContent = 'คน';
  
  // Fallback for old element if exists
  const oldEl = document.getElementById('att-quick-stats');
  if (oldEl) {
    const comingPct = markedTotal > 0 ? Math.round(((P + L) / markedTotal) * 100) : 0;
    oldEl.innerHTML = `
      <div style="display:flex;gap:12px;font-size:12px;font-weight:600">
        <span style="color:var(--green)">✓ มาเรียน: ${P} คน</span>
        <span style="color:var(--amber)">L สาย: ${L} คน</span>
        <span style="color:var(--red)">✗ ขาด: ${A} คน</span>
        <span style="color:var(--teal)">E ลา: ${E} คน</span>
        <span style="margin-left:auto;color:var(--accent)">ยอดมาเฉลี่ย: ${comingPct}%</span>
      </div>
    `;
  }
  
  // Keep period switcher bar in sync
  if (window.renderCheckinPeriodsBar) {
    window.renderCheckinPeriodsBar();
  }
}

// ====== ATT-SUMMARY: switchSumView (for att-summary page) ======
window.closeCheckin = function(){
  const mainView = document.getElementById('att-main-view');
  const checkinView = document.getElementById('att-checkin-view');
  if(mainView) mainView.style.display='';
  if(checkinView) checkinView.style.display='none';
  window.scrollTo({top:0,behavior:'smooth'});
  window.onAttDateChange();
}

window.markAllPresent = function(){
  const date=window._attDate||window.today();
  const period=window._attPeriod||'1';
  const subject=window._attSubject||'all';
  const sts = window.classData[window.currentClass]||[];
  sts.forEach(s=>window.setAttStatus(s.id,date,period,subject,'P'));
  window.renderAttendance();
  window.toast('✅ ตั้งทุกคนเป็น "มาเรียน"');
}

