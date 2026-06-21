// ====== ATTENDANCE ======

window.attKey = function(sid,date,period,subject,classId){
  const cid = classId || window.currentClass;
  return `${cid}_${sid}_${date}_${period}_${subject||'all'}`;
}

window.getAttStatus = function(sid,date,period,subject,classId){
  return window.attData[window.attKey(sid,date,period,subject,classId)]||'P';
}

window.setAttStatus = function(sid,date,period,subject,val,classId){
  const cid = classId || window.currentClass;
  window.attData[window.attKey(sid,date,period,subject,cid)]=val;
  // trigger push to Sheet if connected
  if(window.GS_URL){
    window.pushAttendance(window.attKey(sid,date,period,subject,cid), val, cid, sid, date, period, subject);
  }
}

window.getAttSummary = function(sid,classId){
  const cid=classId||window.currentClass;
  const prefix=`${cid}_${sid}_`;
  let P=0,L=0,A=0,E=0;
  const seen=new Set();
  Object.keys(window.attData).forEach(k=>{
    if(!k.startsWith(prefix))return;
    const parts=k.split('_');
    const subjPart=parts.slice(4).join('_')||'all';
    const dayKey=parts[2]+'_'+parts[3]+'_'+subjPart;
    if(seen.has(dayKey))return;seen.add(dayKey);
    const v=window.attData[k];
    if(v==='P')P++;else if(v==='L')L++;else if(v==='A')A++;else if(v==='E')E++;
  });
  return{P,L,A,E,total:P+L+A+E};
}

window.getAttBySubject = function(sid,date,subjectName){
  const prefix=`${window.currentClass}_${sid}_${date}_`;
  let result='P';
  Object.keys(window.attData).forEach(k=>{
    if(k.startsWith(prefix)){
      const parts=k.split('_');
      const subjPart=parts.slice(4).join('_')||'all';
      if(subjPart===subjectName||subjPart==='all') result=window.attData[k];
    }
  });
  return result;
}

// active checkin context
window._attDate = '';
window._attPeriod = '1';
window._attSubject = 'all';
window._attSchedId = '';

// Predefined standard Thai holidays (AD format: YYYY-MM-DD)
window.thaiHolidays = {
  '2026-01-01': 'วันขึ้นปีใหม่',
  '2026-04-13': 'วันสงกรานต์',
  '2026-04-14': 'วันสงกรานต์',
  '2026-04-15': 'วันสงกรานต์',
  '2026-05-01': 'วันแรงงานแห่งชาติ',
  '2026-05-05': 'วันฉัตรมงคล',
  '2026-06-03': 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี',
  '2026-07-28': 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
  '2026-08-12': 'วันแม่แห่งชาติ',
  '2026-10-13': 'วันคล้ายวันสวรรคต ร.9',
  '2026-10-23': 'วันปิยมหาราช',
  '2026-12-05': 'วันพ่อแห่งชาติ',
  '2026-12-10': 'วันรัฐธรรมนูญ',
  '2026-12-31': 'วันสิ้นปี'
};

// ====== Custom Holidays (user-defined) stored in localStorage ======
window._customHolidaysKey = 'classrm_custom_holidays';

window.loadCustomHolidays = function() {
  try {
    const raw = localStorage.getItem(window._customHolidaysKey);
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
};

window.saveCustomHolidaysStore = function(store) {
  localStorage.setItem(window._customHolidaysKey, JSON.stringify(store));
};

// Merge custom holidays into window.thaiHolidays
window.mergeCustomHolidays = function() {
  const custom = window.loadCustomHolidays();
  Object.assign(window.thaiHolidays, custom);
};

// Toggle: if date is already custom holiday → remove; else prompt name → add
window.toggleCustomHoliday = function() {
  const dateVal = document.getElementById('att-date')?.value || window._attDate || window.today();
  if (!dateVal) return;
  
  const store = window.loadCustomHolidays();
  const isCustom = !!store[dateVal];
  const isBuiltIn = !isCustom && !!window.thaiHolidays[dateVal];
  
  if (isCustom) {
    // Remove custom holiday
    if (!confirm(`ลบวันหยุด "${store[dateVal]}" ออก?`)) return;
    delete store[dateVal];
    window.saveCustomHolidaysStore(store);
    delete window.thaiHolidays[dateVal];
  } else if (isBuiltIn) {
    alert(`วันที่ ${dateVal} เป็นวันหยุดราชการ "${window.thaiHolidays[dateVal]}" ไม่สามารถแก้ไขได้`);
    return;
  } else {
    // Add custom holiday
    const name = prompt('ชื่อวันหยุดพิเศษ:', 'วันหยุดพิเศษ');
    if (!name) return;
    store[dateVal] = name.trim();
    window.saveCustomHolidaysStore(store);
    window.thaiHolidays[dateVal] = name.trim();
  }
  
  // Refresh UI
  window.updateHolidayBtn();
  window.drawCalendar();
  window.onAttDateChange();
};

// Update button label based on current date's holiday status
window.updateHolidayBtn = function() {
  const btn = document.getElementById('btn-set-holiday');
  if (!btn) return;
  const dateVal = document.getElementById('att-date')?.value || window._attDate || window.today();
  const store = window.loadCustomHolidays();
  const isCustom = !!store[dateVal];
  const isBuiltIn = !isCustom && !!window.thaiHolidays[dateVal];
  
  if (isBuiltIn) {
    btn.textContent = '🎌 วันหยุดราชการ';
    btn.style.background = 'var(--red-light)';
    btn.style.color = 'var(--red)';
    btn.style.cursor = 'default';
    btn.style.opacity = '0.7';
  } else if (isCustom) {
    btn.textContent = '✕ ยกเลิกวันหยุด';
    btn.style.background = 'var(--red-light)';
    btn.style.color = 'var(--red)';
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
  } else {
    btn.textContent = '🚫 กำหนดวันหยุด';
    btn.style.background = 'var(--surface2)';
    btn.style.color = 'var(--text2)';
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
  }
};

window._fetchedHolidaysYear = null;
window.fetchThaiHolidays = async function(year) {
  if (window._fetchedHolidaysYear === year) return;
  try {
    const res = await fetch(`https://thailandformats.com/api/v1/holidays/${year}`);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    if (data && Array.isArray(data.holidays)) {
      const thaiTranslationMap = {
        "New Year's Day": "วันขึ้นปีใหม่",
        "Special Public Holiday": "วันหยุดกรณีพิเศษ",
        "Makha Bucha Day": "วันมาฆบูชา",
        "Chakri Memorial Day": "วันจักรี",
        "Chakri Day": "วันจักรี",
        "Songkran Festival": "วันสงกรานต์",
        "National Labour Day": "วันแรงงานแห่งชาติ",
        "Labour Day": "วันแรงงานแห่งชาติ",
        "Coronation Day": "วันฉัตรมงคล",
        "Visakha Bucha Day": "วันวิสาขบูชา",
        "Substitution for Visakha Bucha Day": "วันหยุดชดเชยวันวิสาขบูชา",
        "H.M. Queen Suthida's Birthday": "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี",
        "Substitution for Buddhist Lent Day (Khao Phansa)": "วันหยุดชดเชยวันเข้าพรรษา",
        "Buddhist Lent Day (Khao Phansa)": "วันเข้าพรรษา",
        "H.M. King Maha Vajiralongkorn's Birthday": "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว",
        "Asanha Bucha Day": "วันอาสาฬหบูชา",
        "Buddhist Lent Day": "วันเข้าพรรษา",
        "H.M. Queen Sirikit The Queen Mother's Birthday / Mother's Day": "วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ",
        "H.M. King Bhumibol Adulyadej The Great Memorial Day": "วันคล้ายวันสวรรคต ร.9",
        "Chulalongkorn Memorial Day": "วันปิยมหาราช",
        "H.M. King Bhumibol Adulyadej's Birthday / National Day / Father's Day": "วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ",
        "Substitution for H.M. King Bhumibol Adulyadej's Birthday, National Day, and Father's Day": "วันหยุดชดเชยวันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ",
        "Constitution Day": "วันรัฐธรรมนูญ",
        "New Year's Eve": "วันสิ้นปี",
        "Royal Ploughing Ceremony": "วันพืชมงคล"
      };

      data.holidays.forEach(h => {
        const start = h.start_date;
        const end = h.end_date;
        const nameEn = h.title || '';
        let thaiName = thaiTranslationMap[nameEn];
        
        if (!thaiName) {
          const foundKey = Object.keys(thaiTranslationMap).find(k => nameEn.toLowerCase().includes(k.toLowerCase()));
          thaiName = foundKey ? thaiTranslationMap[foundKey] : nameEn;
        }

        let cur = new Date(start + 'T00:00:00');
        const last = new Date(end + 'T00:00:00');
        while (cur <= last) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const d = String(cur.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          window.thaiHolidays[dateStr] = thaiName;
          cur.setDate(cur.getDate() + 1);
        }
      });
      window._fetchedHolidaysYear = year;
      window.drawCalendar();
      const dateVal = document.getElementById('att-date')?.value || window._attDate;
      if (dateVal) {
        const parts = dateVal.split('-');
        if (parts.length === 3) {
          const d = new Date(dateVal + 'T00:00:00');
          const jsDay = d.getDay();
          const dayLabel = document.getElementById('att-day-label');
          if (dayLabel) {
            const thDateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
            const isHoliday = !!window.thaiHolidays[dateVal];
            const holidaySuffix = isHoliday ? ` (วันหยุด: ${window.thaiHolidays[dateVal]})` : '';
            dayLabel.textContent = `วัน${ATT_DAY_NAMES[jsDay] || 'เสาร์/อาทิตย์'}ที่ ${thDateStr}${holidaySuffix}`;
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch Thai holidays:', err);
  }
};

// Calendar displayed month/year state variables
window._calMonth = new Date().getMonth();
window._calYear = new Date().getFullYear();


// switchAttendanceMainTab: handles tab switching
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
      cellContent = `<div>${d}</div><span class="holiday-lbl" title="${holidayName}">${shortName}</span>`;
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
const ATT_DAY_NAMES=['','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์'];

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
        <div style="font-size:13px;color:var(--accent);margin-top:6px;font-weight:600">${holidayName}</div>
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
          <span style="font-size:11px; font-weight:700; color:var(--accent)">${(window.rooms.find(x=>x.id===sc.roomId)?.level || '')}/${window.rooms.find(x=>x.id===sc.roomId)?.section || ''}</span>
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

const ATT_STATUS_CFG=[
  {k:'P',label:'✓ มาเรียน',bg:'var(--green-light)',fg:'var(--green)',short:'✓'},
  {k:'L',label:'L มาสาย',bg:'var(--amber-light)',fg:'var(--amber)',short:'L'},
  {k:'A',label:'✗ ขาด',bg:'var(--red-light)',fg:'var(--red)',short:'✗'},
  {k:'E',label:'E ลา/ป่วย',bg:'var(--teal-light)',fg:'var(--teal)',short:'E'},
];

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
        <span class="avatar ${window.avColor(i)}" style="font-size:10px;flex-shrink:0">${window.initials(s.name)}</span>
        <span style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</span>
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
          <div style="font-size:15px;font-weight:700">${sub.name}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${sub.teacher||''}</div>
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
          <div style="font-size:11px;color:var(--text3);margin-top:2px">ครูที่ปรึกษา: ${rm.teacher||'-'} · ${sts.length} นักเรียน</div>
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
  const sub = document.getElementById('sum-room-subtitle'); if(sub) sub.textContent = `ครูที่ปรึกษา: ${rm.teacher||'-'} · ${(window.classData[roomId]||[]).length} นักเรียน`;
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
              <div style="font-size:13px;font-weight:600">${s.subjectName||'–'}</div>
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
              <button onclick="editAttSession('${roomId}','${date}','${s.period}','${s.subjectName||'all'}')"
                style="padding:6px 14px;border-radius:8px;border:1.5px solid var(--accent);background:var(--accent-light);color:var(--accent);font-size:12px;font-weight:600;cursor:pointer;font-family:Sarabun,sans-serif">
                ✏️ แก้ไข
              </button>
              <button onclick="deleteAttSession('${roomId}','${date}','${s.period}','${s.subjectName||'all'}')"
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

window.clickAcademicCalendarDate = function(dateStr) {
  if (window.goto) {
    window.goto('attendance');
  }
  if (window.switchAttendanceMainTab) {
    window.switchAttendanceMainTab('checkin');
  }
  const mainView = document.getElementById('att-main-view');
  const checkinView = document.getElementById('att-checkin-view');
  if (mainView) mainView.style.display = '';
  if (checkinView) checkinView.style.display = 'none';

  if (window.selectCalendarDate) {
    window.selectCalendarDate(dateStr);
  }
  window.scrollTo({top: 0, behavior: 'smooth'});
};

// ====== BIND MISSING ATT-SUMMARY ANALYTICS ENGINES ======

window.buildAcademicCalendarHTML = function() {
  const academicYear = window.academicYear || '2568';
  const yrBE = parseInt(academicYear);
  const yrAD = yrBE - 543;

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

  const thaiDayInitials = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  let html = `
  <div class="card" style="margin-top:0">
    <style>
      .cal-container {
        padding: 20px;
      }
      .cal-title-section {
        text-align: center;
        margin-bottom: 16px;
      }
      .cal-title-section h3 {
        font-size: 16px;
        font-weight: 800;
        margin: 0;
        color: var(--text);
      }
      .cal-title-section p {
        font-size: 11px;
        color: var(--text3);
        margin: 4px 0 0 0;
      }
      .cal-responsive-wrapper {
        width: 100%;
        overflow-x: auto;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
      }
      .cal-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
        table-layout: fixed;
        min-width: 900px;
      }
      .cal-table th, .cal-table td {
        border: 1px solid var(--border);
        text-align: center;
        padding: 6px 0;
        font-weight: 700;
        height: 32px;
        box-sizing: border-box;
      }
      .cal-table th {
        background: var(--surface2);
        color: var(--text2);
        font-weight: 800;
        font-size: 10px;
      }
      .cal-cell-day {
        transition: all 0.15s ease;
        cursor: pointer;
      }
      .cal-cell-day:hover {
        filter: brightness(0.95);
        transform: translateY(-1px);
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
      }
      body.dark-theme .cal-cell-day:hover {
        filter: brightness(1.1);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
      }
      .cal-summary-row {
        background: var(--green-light, #e7f4e9);
        color: var(--green, #2d7a3a);
        font-weight: 800;
        font-size: 11px;
        text-align: center;
        padding: 8px 0;
      }
      body.dark-theme .cal-summary-row {
        background: rgba(45, 180, 97, 0.15);
        color: #48b461;
      }
      /* Colors */
      .bg-green { background: #d1fae5 !important; border: 1px solid #10b981 !important; color: #065f46 !important; }
      .bg-yellow { background: #fef08a !important; border: 1px solid #eab308 !important; color: #854d0e !important; }
      .bg-red { background: #fecaca !important; border: 1px solid #ef4444 !important; color: #991b1b !important; }
      .bg-pink { background: #fbcfe8 !important; border: 1px solid #ec4899 !important; color: #9d174d !important; }
      .bg-orange { background: #ffedd5 !important; border: 1px solid #f97316 !important; color: #c2410c !important; }
      .bg-darkred { background: #fee2e2 !important; border: 1px solid #dc2626 !important; color: #991b1b !important; }
      .bg-grey { background: var(--surface2) !important; color: var(--text3) !important; }
      .bg-empty { background: transparent !important; border: none !important; }

      body.dark-theme .bg-green { background: #064e3b !important; border: 1px solid #10b981 !important; color: #a7f3d0 !important; }
      body.dark-theme .bg-yellow { background: #451a03 !important; border: 1px solid #eab308 !important; color: #fef08a !important; }
      body.dark-theme .bg-red { background: #7f1d1d !important; border: 1px solid #ef4444 !important; color: #fecaca !important; }
      body.dark-theme .bg-pink { background: #701a75 !important; border: 1px solid #ec4899 !important; color: #fbcfe8 !important; }
      body.dark-theme .bg-orange { background: #7c2d12 !important; border: 1px solid #f97316 !important; color: #ffedd5 !important; }
      body.dark-theme .bg-darkred { background: #991b1b !important; border: 1px solid #dc2626 !important; color: #fee2e2 !important; }

      .cal-legend-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 12px;
        margin-top: 18px;
        padding-top: 14px;
        border-top: 1px solid var(--border);
        font-size: 11px;
      }
      .cal-legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text2);
      }
      .cal-legend-box {
        width: 22px;
        height: 22px;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 9px;
      }
      .cal-holidays-title {
        font-size: 12px;
        font-weight: 700;
        color: var(--text);
        margin: 18px 0 8px 0;
      }
      .cal-holidays-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 8px;
        font-size: 11px;
        color: var(--text2);
      }
      .cal-holiday-li {
        display: flex;
        gap: 6px;
        align-items: flex-start;
      }
    </style>
    <div class="cal-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
        <div style="text-align:left">
          <h3 style="font-size:16px; font-weight:800; margin:0; color:var(--text)">ปฏิทินกำหนดวันเรียน ปีการศึกษา ${yrBE}</h3>
          <p style="font-size:11px; color:var(--text3); margin:4px 0 0 0">16 พฤษภาคม ${yrBE} - 31 มีนาคม ${yrBE + 1}</p>
        </div>
        <div>
          <button id="toggle-cal-attendance-btn" class="btn" onclick="window.toggleCalendarAttendance()" style="background:${window._showCalAttendance ? 'var(--green)' : 'var(--surface2)'}; color:${window._showCalAttendance ? '#fff' : 'var(--text)'}; border:1px solid ${window._showCalAttendance ? 'var(--green)' : 'var(--border)'}; font-size:12px; font-weight:700; padding:6px 12px; border-radius:8px; display:flex; align-items:center; gap:6px; transition:all 0.2s; cursor:pointer">
            <span>${window._showCalAttendance ? '✅' : '👁️'}</span> ดูการเช็กชื่อ
          </button>
        </div>
      </div>
      <div class="cal-responsive-wrapper">
        <table class="cal-table">
          <thead>
            <tr>
              <th style="width: 120px;">เดือน</th>
              ${Array.from({ length: 31 }, (_, i) => `<th style="width: 24px;">${i + 1}</th>`).join('')}
              <th style="width: 60px;">รวม (วัน)</th>
            </tr>
          </thead>
          <tbody>
  `;

  let sem1Total = 0;
  let sem2Total = 0;
  const holidaysFound = [];

  months.forEach((m) => {
    let monthSchoolDays = 0;
    let daysHTML = '';

    const totalDaysInMonth = new Date(m.yr, m.idx + 1, 0).getDate();

    for (let day = 1; day <= 31; day++) {
      if (day > totalDaysInMonth) {
        daysHTML += `<td class="bg-empty"></td>`;
        continue;
      }

      const d = new Date(m.yr, m.idx, day);
      const dayOfWeek = d.getDay();
      const dateStr = `${m.yr}-${String(m.idx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      let isTermDay = false;
      const dates = window.getSemesterDates();
      if (m.sem === 1) {
        isTermDay = dateStr >= dates.sem1Start && dateStr <= dates.sem1End;
      } else if (m.sem === 2) {
        isTermDay = dateStr >= dates.sem2Start && dateStr <= dates.sem2End;
      }

      const isHoliday = window.thaiHolidays && !!window.thaiHolidays[dateStr];
      if (isHoliday && isTermDay) {
        const hName = window.thaiHolidays[dateStr];
        holidaysFound.push({ date: d, name: hName, isCustom: window.loadCustomHolidays ? !!window.loadCustomHolidays()[dateStr] : false });
      }

      let bgClass = 'bg-grey';
      let text = '';
      let isSchoolDay = false;

      if (isTermDay) {
        if (isHoliday) {
          bgClass = 'bg-pink';
          text = thaiDayInitials[dayOfWeek];
        } else if (dayOfWeek === 6) {
          const hasSatSchedule = window.schedules && window.schedules.some(sc => +sc.day === 6);
          if (hasSatSchedule) {
            bgClass = 'bg-orange';
            text = 'ส';
            isSchoolDay = true;
          } else {
            bgClass = 'bg-yellow';
          }
        } else if (dayOfWeek === 0) {
          const hasSunSchedule = window.schedules && window.schedules.some(sc => +sc.day === 7);
          if (hasSunSchedule) {
            bgClass = 'bg-darkred';
            text = 'อา';
            isSchoolDay = true;
          } else {
            bgClass = 'bg-red';
          }
        } else {
          const dayNumMap = { 1:1, 2:2, 3:3, 4:4, 5:5 };
          const dayNum = dayNumMap[dayOfWeek];
          const hasSchedule = window.schedules && window.schedules.some(sc => +sc.day === dayNum);
          if (hasSchedule) {
            bgClass = 'bg-green';
            text = thaiDayInitials[dayOfWeek];
            isSchoolDay = true;
          } else {
            bgClass = 'bg-grey';
          }
        }
      } else {
        if (dayOfWeek === 6) bgClass = 'bg-yellow';
        else if (dayOfWeek === 0) bgClass = 'bg-red';
        else bgClass = 'bg-grey';
      }

      if (isSchoolDay) {
        monthSchoolDays++;
        if (m.sem === 1) sem1Total++;
        else if (m.sem === 2) sem2Total++;
      }

      let cellContent = text;
      if (isSchoolDay && window._showCalAttendance) {
        const dayNumMap = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 0:7 };
        const dayNum = dayNumMap[dayOfWeek];
        const dayScheds = window.schedules.filter(sc => {
          if (+sc.day !== dayNum) return false;
          const roomExists = window.rooms.some(r => r.id === sc.roomId);
          const subjExists = window.subjects.some(s => s.id === sc.subjectId);
          return roomExists && subjExists;
        });

        if (dayScheds.length > 0) {
          const sessionKeys = Object.keys(window.attData);
          const checkedCount = dayScheds.filter(sc => {
            const subName = window.resolveSubjectName(sc.subjectId);
            return sessionKeys.some(k => {
              const parts = k.split('_');
              return parts[0] === sc.roomId && parts[2] === dateStr && parts[3] === String(sc.period) && parts.slice(4).join('_') === subName;
            });
          }).length;
          
          if (checkedCount === dayScheds.length) {
            cellContent = `<div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center">
              <span style="opacity:0.35">${text}</span>
              <span style="position:absolute; font-size:16px; font-weight:900; color:#10b981; text-shadow:0 0 2px #fff">✓</span>
            </div>`;
          }
        }
      }

      const tooltipAttr = isHoliday ? `title="${window.thaiHolidays[dateStr]}"` : '';
      daysHTML += `<td class="cal-cell-day ${bgClass}" ${tooltipAttr} onclick="window.clickAcademicCalendarDate('${dateStr}')">${cellContent}</td>`;
    }

    const yearSuffix = m.yr + 543;
    html += `
      <tr>
        <td style="text-align: left; padding-left: 8px; font-weight: 800; color: var(--text);">${m.name} ${yearSuffix}</td>
        ${daysHTML}
        <td style="font-weight: 800; color: var(--text); background: var(--surface2);">${monthSchoolDays}</td>
      </tr>
    `;

    if (m.name === 'ตุลาคม') {
      html += `
        <tr>
          <td colspan="33" class="cal-summary-row">
            📝 จำนวนวันเรียนภาคเรียนที่ 1 ทั้งหมด ${sem1Total} วัน
          </td>
        </tr>
      `;
    } else if (m.name === 'เมษายน') {
      html += `
        <tr>
          <td colspan="33" class="cal-summary-row">
            📝 จำนวนวันเรียนภาคเรียนที่ 2 ทั้งหมด ${sem2Total} วัน
          </td>
        </tr>
      `;
    }
  });

  html += `
          </tbody>
        </table>
      </div>

      <div class="cal-legend-grid">
        <div class="cal-legend-item">
          <span class="cal-legend-box bg-green">จ</span>
          <span>วันเรียนปกติ (มีตารางเรียน)</span>
        </div>
        <div class="cal-legend-item">
          <span class="cal-legend-box bg-yellow"></span>
          <span>วันเสาร์ (ปกติไม่มีเรียน)</span>
        </div>
        <div class="cal-legend-item">
          <span class="cal-legend-box bg-orange">ส</span>
          <span>วันชดเชย/เรียนเพิ่มเติมวันเสาร์</span>
        </div>
        <div class="cal-legend-item">
          <span class="cal-legend-box bg-red"></span>
          <span>วันอาทิตย์ (ปกติไม่มีเรียน)</span>
        </div>
        <div class="cal-legend-item">
          <span class="cal-legend-box bg-darkred">อา</span>
          <span>วันชดเชย/เรียนเพิ่มเติมวันอาทิตย์</span>
        </div>
        <div class="cal-legend-item">
          <span class="cal-legend-box bg-pink">พ</span>
          <span>วันหยุดราชการ / วันหยุดพิเศษ</span>
        </div>
        <div class="cal-legend-item">
          <span class="cal-legend-box" style="border:1px solid var(--border); background:var(--surface); display:inline-flex; align-items:center; justify-content:center; position:relative">
            <span style="opacity:0.35">จ</span>
            <span style="position:absolute; font-size:14px; font-weight:900; color:#10b981">✓</span>
          </span>
          <span>เช็กชื่อครบทุกคาบแล้ว</span>
        </div>
      </div>
  `;

  if (holidaysFound.length > 0) {
    holidaysFound.sort((a, b) => a.date - b.date);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    
    html += `
      <div class="cal-holidays-title">📅 รายละเอียดวันหยุดราชการและวันหยุดพิเศษ (ในภาคเรียน)</div>
      <div class="cal-holidays-list">
        ${holidaysFound.map(h => {
          const dateStr = h.date.toLocaleDateString('th-TH', options);
          const badge = h.isCustom 
            ? `<span style="font-size:10px;background:var(--amber-light);color:var(--amber);padding:1px 6px;border-radius:4px;font-weight:700;margin-left:5px">วันหยุดพิเศษ</span>`
            : `<span style="font-size:10px;background:var(--pink-cell);color:#ec4899;padding:1px 6px;border-radius:4px;font-weight:700;margin-left:5px">วันหยุดราชการ</span>`;
          return `
            <div class="cal-holiday-li">
              <span>📌</span>
              <span><strong>${dateStr}</strong>: ${h.name} ${badge}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  html += `
    </div>
  </div>
  `;

  return html;
};

window._showCalAttendance = false;
window.toggleCalendarAttendance = function() {
  window._showCalAttendance = !window._showCalAttendance;
  if (window.switchSumView) {
    window.switchSumView(window._sumView2 || 'overview');
  }
};

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
window.saveAttendance = function() {
  const date = window._attDate || window.today();
  const period = window._attPeriod || '1';
  const subject = window._attSubject || 'all';
  const sts = window.classData[window.currentClass] || [];
  
  sts.forEach(s => {
    const cur = window.getAttStatus(s.id, date, period, subject);
    window.setAttStatus(s.id, date, period, subject, cur);
  });
  
  if (window.autoSaveToLocalStorage) {
    window.autoSaveToLocalStorage();
  }
  
  window.snapshotVersion('บันทึกการเช็กชื่อ');
  window.showSyncToast('💾 บันทึกการเช็กชื่อแล้ว (ข้อมูลในเครื่อง)');
  
  window.closeCheckin();
};

// renderAttSummaryPage alias for att-summary page
if (!window.renderAttSummaryPage) {
  window.renderAttSummaryPage = function() {
    window.switchSumView('overview');
  };
}

window.deleteAttSession = function(roomId, date, period, subjectName) {
  const rm = window.rooms.find(r=>r.id===roomId);
  const rmLabel = rm ? `${rm.level}/${rm.section}` : roomId;
  if (!confirm(`⚠️ คุณต้องการลบข้อมูลการเช็กชื่อของห้อง ${rmLabel} วันที่ ${date} คาบ ${period} ใช่หรือไม่?\nข้อมูลการเช็กชื่อของคาบนี้จะถูกลบออกทั้งหมด`)) {
    return;
  }
  
  const keysToDelete = [];
  Object.keys(window.attData).forEach(k => {
    const parts = k.split('_');
    const rId = parts[0];
    const dateVal = parts[2];
    const periodVal = parts[3];
    const sub = parts.slice(4).join('_');
    
    if (rId === roomId && dateVal === date && periodVal === String(period) && (sub === subjectName || sub === 'all')) {
      keysToDelete.push(k);
    }
  });
  
  keysToDelete.forEach(k => {
    delete window.attData[k];
  });
  
  if (window.autoSaveToLocalStorage) {
    window.autoSaveToLocalStorage();
  }
  
  window.toast('🗑️ ลบข้อมูลการเช็กชื่อของคาบนี้แล้ว');
  window.refreshAttSummary();
  if (window._sumSubjectId) {
    window.renderSubjectSessions(window.subjects.find(s=>s.id===window._sumSubjectId)?.name);
  } else if (window._sumRoomId) {
    window.renderRoomSessions(window._sumRoomId);
  }
  if (window._sumView2) {
    window.switchSumView(window._sumView2);
  }
};

window.deleteAttDay = function(date, subjectName, roomId) {
  const targetLabel = roomId 
    ? `ห้อง ${window.rooms.find(r=>r.id===roomId)?.level || roomId}` 
    : (subjectName ? `วิชา ${subjectName}` : `ทุกห้องเรียนและทุกวิชา`);
    
  if (!confirm(`⚠️ คุณต้องการลบข้อมูลการเช็กชื่อทั้งหมดของ ${targetLabel} ในวันที่ ${date} ใช่หรือไม่?\nข้อมูลในวันดังกล่าวจะถูกลบออกทั้งหมด`)) {
    return;
  }
  
  const keysToDelete = [];
  Object.keys(window.attData).forEach(k => {
    const parts = k.split('_');
    const rId = parts[0];
    const dateVal = parts[2];
    const sub = parts.slice(4).join('_');
    
    if (dateVal === date) {
      if (roomId && rId !== roomId) return;
      if (!roomId && subjectName && sub !== subjectName && sub !== 'all') return;
      keysToDelete.push(k);
    }
  });
  
  keysToDelete.forEach(k => {
    delete window.attData[k];
  });
  
  if (window.autoSaveToLocalStorage) {
    window.autoSaveToLocalStorage();
  }
  
  window.toast('🗑️ ลบข้อมูลการเช็กชื่อทั้งหมดของวันแล้ว');
  window.refreshAttSummary();
  if (window._sumSubjectId) {
    window.renderSubjectSessions(window.subjects.find(s=>s.id===window._sumSubjectId)?.name);
  } else if (window._sumRoomId) {
    window.renderRoomSessions(window._sumRoomId);
  }
  if (window._sumView2) {
    window.switchSumView(window._sumView2);
  }
};
