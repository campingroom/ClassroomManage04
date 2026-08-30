// ====== ATTENDANCE: ACADEMIC CALENDAR VIEW ======
// ปฏิทินวิชาการรายภาคเรียน (ดูวันเปิดสอน/วันหยุดทั้งภาค)
// แยกออกมาจาก attendance.js เดิม
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

      const tooltipAttr = isHoliday ? `title="${window.esc(window.thaiHolidays[dateStr])}"` : '';
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
              <span><strong>${dateStr}</strong>: ${window.esc(h.name)} ${badge}</span>
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

