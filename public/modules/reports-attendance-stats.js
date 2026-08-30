// ====== REPORTS — ATTENDANCE STATS & EXCEL EXPORT ======

window.getReportAttSummary = function(sid, classId, subjectId) {
  const cid = classId || window.currentClass;
  const prefix = `${cid}_${sid}_`;
  let P = 0, L = 0, A = 0, E = 0;
  const seen = new Set();
  
  // Find subject name if specific subject
  let targetSubName = '';
  if (subjectId && subjectId !== 'all') {
    const sObj = window.subjects.find(x => x.id === subjectId);
    if (sObj) targetSubName = sObj.name;
  }

  Object.keys(window.attData).forEach(k => {
    if (!k.startsWith(prefix)) return;
    const parts = k.split('_'); // [cid, sid, date, period, subject]
    const subjPart = parts.slice(4).join('_') || 'all';

    if (subjectId && subjectId !== 'all') {
      if (subjPart !== 'all' && subjPart !== targetSubName && subjPart !== subjectId) {
        return; // Skip if subject doesn't match
      }
    }

    const dayKey = parts[2] + '_' + parts[3] + '_' + subjPart;
    if (seen.has(dayKey)) return;
    seen.add(dayKey);

    const v = window.attData[k];
    if (v === 'P') P++;
    else if (v === 'L') L++;
    else if (v === 'A') A++;
    else if (v === 'E') E++;
  });

  return { P, L, A, E, total: P + L + A + E };
};

window.renderReportExport = function() {
  let opts = '<option value="all">🌟 ทุกห้องเรียน</option>';
  opts += window.rooms.map(r => `<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
  
  const sUnified = document.getElementById('rep-exp-room-select');
  const sAtt = document.getElementById('export-att-room');
  const sIndividual = document.getElementById('rep-individual-room-select');
  if (sUnified) { sUnified.innerHTML = opts; sUnified.value = window.currentClass || 'all'; }
  if (sAtt) { sAtt.innerHTML = opts; sAtt.value = window.currentClass || 'all'; }
  if (sIndividual) { sIndividual.innerHTML = opts; sIndividual.value = window.currentClass || 'all'; }

  const rid = window.currentClass || 'all';
  
  let sts = [];
  if (rid === 'all') {
    window.rooms.forEach(r => {
      sts = sts.concat((window.classData[r.id] || []).map(s => Object.assign({}, s, { roomName: `${r.level}/${r.section}`, roomId: r.id })));
    });
  } else {
    sts = (window.classData[rid] || []).map(s => Object.assign({}, s, { roomId: rid }));
  }

  const studentSelect = document.getElementById('rep-individual-student-select');
  if (studentSelect) {
    let studentOpts = `<option value="all">พิมพ์ของทุกคนในห้องเรียน (แยกทีละหน้า)</option>`;
    studentOpts += sts.map(s => `<option value="${s.id}">${rid === 'all' && s.roomName ? `[${window.esc(s.roomName)}] ` : ''}เลขที่ ${s.no || '--'}: ${window.esc(s.name)}</option>`).join('');
    studentSelect.innerHTML = studentOpts;
  }

  // Populate subjects dropdown for this room uniquely
  const subSelect = document.getElementById('rep-exp-subject-select');
  let targetSubId = 'all';
  if (subSelect) {
    const subIds = [...new Set(window.workItems.filter(w => w.roomId === rid).map(w => w.subjectId))];
    const subsFromWork = subIds.map(sid => window.subjects.find(s => s.id === sid)).filter(Boolean);
    const subsFromConfig = window.subjects.filter(s => s.rooms && s.rooms.includes(rid));
    
    // Merge uniquely by ID
    const allSubsMap = new Map();
    subsFromWork.forEach(s => allSubsMap.set(s.id, s));
    subsFromConfig.forEach(s => allSubsMap.set(s.id, s));
    const currentTerm = window.activeSemesterFilter || '1';
    const classSubs = Array.from(allSubsMap.values()).filter(s => currentTerm === 'all' || s.term === 'all' || s.term === currentTerm);

    const prevSubVal = subSelect.value || 'all';

    let subjOpts = `<option value="all">ทุกรายวิชา (All Subjects)</option>`;
    if (currentTerm === 'all') {
      const t1 = classSubs.filter(s => s.term === '1');
      const t2 = classSubs.filter(s => s.term === '2');
      const tAll = classSubs.filter(s => s.term === 'all' || !s.term);
      if (t1.length) {
        subjOpts += `<optgroup label="ภาคเรียนที่ 1">` + t1.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
      }
      if (t2.length) {
        subjOpts += `<optgroup label="ภาคเรียนที่ 2">` + t2.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
      }
      if (tAll.length) {
        subjOpts += `<optgroup label="เรียนทั้งปีการศึกษา">` + tAll.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
      }
    } else {
      subjOpts += classSubs.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${window.esc(s.name)}</option>`).join('');
    }
    subSelect.innerHTML = subjOpts;

    if (prevSubVal && (prevSubVal === 'all' || classSubs.find(s => s.id === prevSubVal))) {
      subSelect.value = prevSubVal;
      targetSubId = prevSubVal;
    } else {
      subSelect.value = 'all';
    }
  }

  const el = document.getElementById('rep-export-att-tbody');
  if (!el) return;

  if (!sts.length) {
    el.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text3)">ยังไม่มีนักเรียนในห้องนี้</td></tr>`;
    document.getElementById('att-avg-rate').textContent = '0%';
    document.getElementById('att-total-periods').textContent = '0';
    document.getElementById('att-top-absent').textContent = '-';
    document.getElementById('att-top-absent-sub').textContent = '0 ครั้ง';
    document.getElementById('att-top-late').textContent = '-';
    document.getElementById('att-top-late-sub').textContent = '0 ครั้ง';
    return;
  }

  let totalPctSum = 0;
  let maxPeriods = 0;
  let highestAbsentCount = 0;
  let highestAbsentName = '-';
  let highestLateCount = 0;
  let highestLateName = '-';

  // Detailed per-student calculations (Subject-aware!)
  const studentRowsHTML = sts.map((s, si) => {
    const att = window.getReportAttSummary(s.id, rid, targetSubId);
    const pct = att.total > 0 ? Math.round(((att.P + att.L) / att.total) * 100) : 100;
    
    totalPctSum += pct;
    if (att.total > maxPeriods) maxPeriods = att.total;

    // Track highest absent
    if (att.A > highestAbsentCount) {
      highestAbsentCount = att.A;
      highestAbsentName = s.name;
    }
    // Track highest late
    if (att.L > highestLateCount) {
      highestLateCount = att.L;
      highestLateName = s.name;
    }

    const pctText = att.total > 0 ? `${pct}%` : '-';
    const evalBadge = pct >= 80 
      ? `<span class="badge badge-A" style="font-weight:700">ปกติ</span>`
      : `<span class="badge badge-F" style="font-weight:700">เฝ้าระวัง</span>`;

    return `
      <tr>
        <td class="ctr" style="color:var(--text3)">${s.no}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="avatar ${window.avColor(si)}" style="font-size:10px">${window.esc(window.initials(s.name))}</span>
            <span style="font-weight:600">${window.esc(s.name)}</span>
          </div>
        </td>
        <td class="ctr" style="font-weight:600;color:var(--green)">${att.P}</td>
        <td class="ctr" style="font-weight:600;color:var(--amber)">${att.L}</td>
        <td class="ctr" style="font-weight:600;color:var(--teal)">${att.E}</td>
        <td class="ctr" style="font-weight:600;color:var(--red)">${att.A}</td>
        <td class="ctr" style="font-weight:700">${pctText}</td>
        <td class="ctr">${evalBadge}</td>
      </tr>
    `;
  }).join('');

  el.innerHTML = studentRowsHTML;

  // Render overall summary cards
  const avgRate = sts.length > 0 ? Math.round(totalPctSum / sts.length) : 0;
  document.getElementById('att-avg-rate').textContent = `${avgRate}%`;
  document.getElementById('att-total-periods').textContent = maxPeriods;

  if (highestAbsentCount > 0) {
    document.getElementById('att-top-absent').textContent = highestAbsentName;
    document.getElementById('att-top-absent-sub').textContent = `ขาดเรียน ${highestAbsentCount} ครั้ง`;
  } else {
    document.getElementById('att-top-absent').textContent = '-';
    document.getElementById('att-top-absent-sub').textContent = '0 ครั้ง';
  }

  if (highestLateCount > 0) {
    document.getElementById('att-top-late').textContent = highestLateName;
    document.getElementById('att-top-late-sub').textContent = `สาย ${highestLateCount} ครั้ง`;
  } else {
    document.getElementById('att-top-late').textContent = '-';
    document.getElementById('att-top-late-sub').textContent = '0 ครั้ง';
  }
};

window.exportToExcel = function(subjectId) {
  let rid = window.currentClass;
  if (window.currentPanel === 'report') {
    const rSel = document.getElementById('report-room');
    if (rSel) rid = rSel.value;
  } else if (window.currentPanel === 'report-export') {
    const reSel = document.getElementById('rep-exp-room-select');
    if (reSel) rid = reSel.value;
  }
  if (!rid) return;
  const sts = window.classData[rid] || [];
  
  if (!sts.length) {
    window.toast('⚠️ ไม่มีข้อมูลนักเรียนเพื่อส่งออก Excel');
    return;
  }

  const targetSubId = subjectId || document.getElementById('rep-exp-subject-select')?.value || 'all';

  const subIds = [...new Set(window.workItems.filter(w => w.roomId === rid).map(w => w.subjectId))];
  let subs = subIds.map(sid => window.subjects.find(s => s.id === sid)).filter(Boolean);
  const currentTerm = window.activeSemesterFilter || '1';

  if (targetSubId !== 'all') {
    subs = subs.filter(s => s.id === targetSubId);
  } else {
    subs = subs.filter(s => currentTerm === 'all' || s.term === 'all' || s.term === currentTerm);
    // Sort subjects by term
    const termOrder = { '1': 1, '2': 2, 'all': 3 };
    subs.sort((a, b) => {
      const tA = termOrder[a.term] || 3;
      const tB = termOrder[b.term] || 3;
      if (tA !== tB) return tA - tB;
      return (a.code || '').localeCompare(b.code || '');
    });
  }

  // Headers
  const headers = [
    'เลขที่',
    'รหัสประจำตัว',
    'ชื่อ-นามสกุล',
    'เพศ',
    'อัตราเข้าเรียน (%)',
    'คะแนนพฤติกรรมสะสม',
    ...subs.flatMap(sub => [`วิชา ${window.esc(sub.name)} (คะแนน)`, `วิชา ${window.esc(sub.name)} (เกรด)`]),
    'GPA เฉลี่ย',
    'ผลประเมินสถานะ'
  ];

  // Rows
  const rows = sts.map(s => {
    // Attendance
    const att = window.getReportAttSummary(s.id, rid, targetSubId);
    const attPct = att.total > 0 ? Math.round(((att.P + att.L) / att.total) * 100) : 100;

    // Behavior
    const behScore = s.behaviorScore !== undefined ? s.behaviorScore : 0;

    // Per-subject: score, max, grade
    const subGrades = subs.map(sub => {
      const items = window.workItems.filter(w => w.roomId === rid && w.subjectId === sub.id);
      const max = items.reduce((a, b) => a + (+b.maxScore || 0), 0);
      const got = items.reduce((a, w) => a + (+(w.scores && w.scores[String(s.id)]) || 0), 0);
      const pct = max > 0 ? Math.round((got / max) * 100) : null;
      const gr  = pct !== null ? window.getGrade(pct) : null;
      return { got, max, pct, gr };
    });

    // Weighted GPA
    let sumW = 0, sumCr = 0;
    subs.forEach((sub, i) => {
      const sg = subGrades[i];
      if (sg.gr !== null) {
        const cr = parseFloat(sub.credits) || 1;
        sumW  += parseFloat(sg.gr) * cr;
        sumCr += cr;
      }
    });
    const gpa = sumCr > 0 ? Math.round((sumW / sumCr) * 10) / 10 : '-';

    // Status Risk
    const riskAtt = attPct < 80;
    const riskSub = subGrades.some(sg => sg.pct !== null && sg.pct < 50);
    const riskBeh = behScore < 50;
    const risk = riskAtt || riskSub || riskBeh;

    const subCols = subGrades.flatMap(sg => [
      sg.pct !== null ? `${sg.got}/${sg.max}` : '-',
      sg.gr !== null ? String(sg.gr) : '-'
    ]);

    return [
      s.no,
      s.code || s.id,
      s.name,
      s.gender || '-',
      att.total > 0 ? `${attPct}%` : '-',
      behScore,
      ...subCols,
      gpa,
      risk ? 'ควรปรับปรุง/เฝ้าระวัง' : 'ปกติ'
    ];
  });

  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Format column widths nicely
    ws['!cols'] = [
      { wch: 8 },  // เลขที่
      { wch: 14 }, // รหัสประจำตัว
      { wch: 28 }, // ชื่อ-นามสกุล
      { wch: 8 },  // เพศ
      { wch: 18 }, // อัตราเข้าเรียน
      { wch: 18 }, // คะแนนพฤติกรรมสะสม
      ...subs.flatMap(() => [{ wch: 24 }, { wch: 16 }]), // subjects
      { wch: 12 }, // GPA
      { wch: 20 }  // ผลประเมินสถานะ
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'รายงานสรุปการเรียนเเละพฤติกรรม');

    const r = window.rooms.find(x => x.id === rid);
    const classLabel = r ? `${r.level}_${r.section}` : rid;
    const subLabel = targetSubId !== 'all' && subs.length > 0 ? `_${window.esc(subs[0].name)}` : '';
    XLSX.writeFile(wb, `academic_report_${classLabel}${subLabel}.xlsx`);
    window.toast('🟢 ส่งออกไฟล์ Excel (.xlsx) สำเร็จ');
  } catch (err) {
    console.error(err);
    window.toast('❌ เกิดข้อผิดพลาดในการส่งออก Excel');
  }
};

// Unified Export Wrappers
window.exportToExcelClicked = function() {
  const subSelect = document.getElementById('rep-exp-subject-select');
  const subId = subSelect ? subSelect.value : 'all';
  window.exportToExcel(subId);
};

window.exportReportClicked = function() {
  const subSelect = document.getElementById('rep-exp-subject-select');
  const subId = subSelect ? subSelect.value : 'all';
  window.exportReport(subId);
};

window.printReportClicked = function() {
  const subSelect = document.getElementById('rep-exp-subject-select');
  const subId = subSelect ? subSelect.value : 'all';
  window.printReport(subId);
};

window.onReportExportSubjectChange = function() {
  window.renderReportExport();
};

window.buildRoomStatsHTML = function() {
  return `
    <div style="margin-top:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div>
          <h3 style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:6px">📅 รายงานผลด้านการเช็กสถิติการมาเรียน</h3>
          <p style="font-size:11px;color:var(--text3);margin-top:2px">สถิติสรุปความถี่การเช็กชื่อ เปอร์เซ็นต์เข้าเรียน และรายชื่อนักเรียนกลุ่มเสี่ยงขาดเรียน</p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:12px;font-weight:600;color:var(--text2)">ห้องเรียน:</span>
            <select id="sum-att-room" class="inp" style="width:130px;font-size:12px;cursor:pointer;height:32px;padding:0 8px;border-radius:8px" onchange="window.onSumRoomStatsClassChange(this.value)"></select>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:12px;font-weight:600;color:var(--text2)">รายวิชา:</span>
            <select id="sum-att-subject" class="inp" style="width:180px;font-size:12px;cursor:pointer;height:32px;padding:0 8px;border-radius:8px" onchange="window.renderRoomStats()"></select>
          </div>
        </div>
      </div>

      <!-- 4 Stats Cards -->
      <div class="stats-row" style="margin-bottom:18px">
        <div class="stat-card stat-purple">
          <div class="label">อัตราเข้าเรียนเฉลี่ย</div>
          <div class="value" id="att-avg-rate">0%</div>
          <div class="sub">ของนักเรียนทั้งหมด</div>
        </div>
        <div class="stat-card stat-teal">
          <div class="label">จำนวนคาบเรียนที่เช็กชื่อ</div>
          <div class="value" id="att-total-periods">0</div>
          <div class="sub">คาบเรียน</div>
        </div>
        <div class="stat-card stat-coral">
          <div class="label">ขาดเรียนบ่อยสุด</div>
          <div class="value" id="att-top-absent" style="font-size:15px;margin-top:6px;word-break:break-all;font-weight:700;line-height:1.2">-</div>
          <div class="sub" id="att-top-absent-sub">0 ครั้ง</div>
        </div>
        <div class="stat-card stat-amber">
          <div class="label">มาสายบ่อยสุด</div>
          <div class="value" id="att-top-late" style="font-size:15px;margin-top:6px;word-break:break-all;font-weight:700;line-height:1.2">-</div>
          <div class="sub" id="att-top-late-sub">0 ครั้ง</div>
        </div>
      </div>

      <!-- Detailed Attendance Table -->
      <div class="card">
        <div class="card-header">
          <h3>ตารางสถิติเวลาเรียนรายบุคคล</h3>
        </div>
        <div style="overflow-x:auto">
          <table class="tbl">
            <thead>
              <tr>
                <th style="width:50px;text-align:center">เลขที่</th>
                <th>ชื่อ-นามสกุล</th>
                <th class="ctr" style="color:var(--green)">มาเรียน (ครั้ง)</th>
                <th class="ctr" style="color:var(--amber)">มาสาย (ครั้ง)</th>
                <th class="ctr" style="color:var(--teal)">ลา (ครั้ง)</th>
                <th class="ctr" style="color:var(--red)">ขาด (ครั้ง)</th>
                <th class="ctr">ร้อยละเวลาเรียน</th>
                <th class="ctr">ผลประเมิน</th>
              </tr>
            </thead>
            <tbody id="sum-att-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
};

window.initRoomStatsDropdowns = function() {
  const rid = window.currentClass || 'all';
  let opts = '<option value="all">🌟 ทุกห้องเรียน</option>';
  opts += window.rooms.map(r => `<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
  
  const rSel = document.getElementById('sum-att-room');
  if (rSel) { rSel.innerHTML = opts; rSel.value = rid; }

  // Populate subjects dropdown
  const subSelect = document.getElementById('sum-att-subject');
  if (subSelect) {
    const subIds = [...new Set(window.workItems.filter(w => (rid === 'all' || w.roomId === rid)).map(w => w.subjectId))];
    const subsFromWork = subIds.map(sid => window.subjects.find(s => s.id === sid)).filter(Boolean);
    const subsFromConfig = rid === 'all' ? window.subjects : window.subjects.filter(s => s.rooms && s.rooms.includes(rid));
    
    // Merge uniquely by ID
    const allSubsMap = new Map();
    subsFromWork.forEach(s => allSubsMap.set(s.id, s));
    subsFromConfig.forEach(s => allSubsMap.set(s.id, s));
    const currentTerm = window.activeSemesterFilter || '1';
    const classSubs = Array.from(allSubsMap.values()).filter(s => currentTerm === 'all' || s.term === 'all' || s.term === currentTerm);

    let subjOpts = `<option value="all">ทุกรายวิชา (All Subjects)</option>`;
    if (currentTerm === 'all') {
      const t1 = classSubs.filter(s => s.term === '1');
      const t2 = classSubs.filter(s => s.term === '2');
      const tAll = classSubs.filter(s => s.term === 'all' || !s.term);
      if (t1.length) {
        subjOpts += `<optgroup label="ภาคเรียนที่ 1">` + t1.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
      }
      if (t2.length) {
        subjOpts += `<optgroup label="ภาคเรียนที่ 2">` + t2.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
      }
      if (tAll.length) {
        subjOpts += `<optgroup label="เรียนทั้งปีการศึกษา">` + tAll.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${window.esc(s.name)}</option>`).join('') + `</optgroup>`;
      }
    } else {
      subjOpts += classSubs.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${window.esc(s.name)}</option>`).join('');
    }
    subSelect.innerHTML = subjOpts;
    subSelect.value = 'all';
  }
};

window.renderRoomStats = function() {
  const rid = document.getElementById('sum-att-room')?.value || window.currentClass;
  if (!rid) return;

  let sts = [];
  if (rid === 'all') {
    window.rooms.forEach(r => {
      sts = sts.concat((window.classData[r.id] || []).map(s => Object.assign({}, s, { roomName: `${r.level}/${r.section}`, roomId: r.id })));
    });
  } else {
    sts = (window.classData[rid] || []).map(s => Object.assign({}, s, { roomId: rid }));
  }
  
  const subSelect = document.getElementById('sum-att-subject');
  const targetSubId = subSelect ? subSelect.value : 'all';

  const el = document.getElementById('sum-att-tbody');
  if (!el) return;

  if (!sts.length) {
    el.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text3)">ยังไม่มีนักเรียนในห้องนี้</td></tr>`;
    document.getElementById('att-avg-rate').textContent = '0%';
    document.getElementById('att-total-periods').textContent = '0';
    document.getElementById('att-top-absent').textContent = '-';
    document.getElementById('att-top-absent-sub').textContent = '0 ครั้ง';
    document.getElementById('att-top-late').textContent = '-';
    document.getElementById('att-top-late-sub').textContent = '0 ครั้ง';
    return;
  }

  let totalPctSum = 0;
  let maxPeriods = 0;
  let highestAbsentCount = 0;
  let highestAbsentName = '-';
  let highestLateCount = 0;
  let highestLateName = '-';

  // Detailed calculations (Subject-aware!)
  const studentRowsHTML = sts.map((s, si) => {
    const att = window.getReportAttSummary(s.id, s.roomId || rid, targetSubId);
    const pct = att.total > 0 ? Math.round(((att.P + att.L) / att.total) * 100) : 100;
    
    totalPctSum += pct;
    if (att.total > maxPeriods) maxPeriods = att.total;

    // Track highest absent
    if (att.A > highestAbsentCount) {
      highestAbsentCount = att.A;
      highestAbsentName = s.name;
    }
    // Track highest late
    if (att.L > highestLateCount) {
      highestLateCount = att.L;
      highestLateName = s.name;
    }

    const pctText = att.total > 0 ? `${pct}%` : '-';
    const evalBadge = pct >= 80 
      ? `<span class="badge badge-A" style="font-weight:700">ปกติ</span>`
      : `<span class="badge badge-F" style="font-weight:700">เฝ้าระวัง</span>`;

    return `
      <tr>
        <td class="ctr" style="color:var(--text3)">${s.no}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="avatar ${window.avColor(si)}" style="font-size:10px">${window.esc(window.initials(s.name))}</span>
            <span style="font-weight:600">${window.esc(s.name)}${rid === 'all' && s.roomName ? ` <span class="badge badge-info" style="font-size:10px;padding:2px 6px;margin-left:6px;">${window.esc(s.roomName)}</span>` : ''}</span>
          </div>
        </td>
        <td class="ctr" style="font-weight:600;color:var(--green)">${att.P}</td>
        <td class="ctr" style="font-weight:600;color:var(--amber)">${att.L}</td>
        <td class="ctr" style="font-weight:600;color:var(--teal)">${att.E}</td>
        <td class="ctr" style="font-weight:600;color:var(--red)">${att.A}</td>
        <td class="ctr" style="font-weight:700">${pctText}</td>
        <td class="ctr">${evalBadge}</td>
      </tr>
    `;
  }).join('');

  el.innerHTML = studentRowsHTML;

  // Render overall summary cards
  const avgRate = sts.length > 0 ? Math.round(totalPctSum / sts.length) : 0;
  document.getElementById('att-avg-rate').textContent = `${avgRate}%`;
  document.getElementById('att-total-periods').textContent = maxPeriods;

  if (highestAbsentCount > 0) {
    document.getElementById('att-top-absent').textContent = highestAbsentName;
    document.getElementById('att-top-absent-sub').textContent = `ขาดเรียน ${highestAbsentCount} ครั้ง`;
  } else {
    document.getElementById('att-top-absent').textContent = '-';
    document.getElementById('att-top-absent-sub').textContent = '0 ครั้ง';
  }

  if (highestLateCount > 0) {
    document.getElementById('att-top-late').textContent = highestLateName;
    document.getElementById('att-top-late-sub').textContent = `สาย ${highestLateCount} ครั้ง`;
  } else {
    document.getElementById('att-top-late').textContent = '-';
    document.getElementById('att-top-late-sub').textContent = '0 ครั้ง';
  }
};

window.onSumRoomStatsClassChange = function(roomId) {
  window.currentClass = roomId;
  window.initRoomStatsDropdowns();
  window.renderRoomStats();
};
