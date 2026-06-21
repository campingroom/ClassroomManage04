// ====== MODULE: REPORTS ======
// Handles individual progress reports, CSV exports, and browser print-to-PDF formatting.

window.populateReportRoom = function() {
  const sel = document.getElementById('report-room');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = window.rooms.map(r => `<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
  if (cur && window.rooms.find(r => r.id === cur)) sel.value = cur;
};


// ══════════════════════════════════════════════════
// INDIVIDUAL PROGRESS RENDER & PRINT
// ══════════════════════════════════════════════════
window.renderReport = function() {
  window.populateReportRoom();
  const rid = document.getElementById('report-room')?.value || window.currentClass;
  if (rid) window.currentClass = rid;
  const sts = window.classData[rid] || [];
  const el = document.getElementById('report-tbody');
  if (!el) return;

  // Subjects that have work items in this room
  const subIds = [...new Set(window.workItems.filter(w => w.roomId === rid).map(w => w.subjectId))];
  const currentTerm = window.activeSemesterFilter || '1';
  const subs = subIds.map(sid => window.subjects.find(s => s.id === sid))
    .filter(Boolean)
    .filter(s => currentTerm === 'all' || s.term === 'all' || s.term === currentTerm);

  // Sort subjects by term: Term 1, then Term 2, then Year-round
  const termOrder = { '1': 1, '2': 2, 'all': 3 };
  subs.sort((a, b) => {
    const tA = termOrder[a.term] || 3;
    const tB = termOrder[b.term] || 3;
    if (tA !== tB) return tA - tB;
    return (a.code || '').localeCompare(b.code || '');
  });

  // Grade colour/label helpers
  const gradeColor = {
    '4': 'var(--green)', '3.5': 'var(--green)',
    '3': 'var(--teal)',  '2.5': 'var(--teal)',
    '2': 'var(--amber)', '1.5': 'var(--amber)',
    '1': '#e67e22',      '0': 'var(--red)'
  };
  const gradeLabel = {
    '4': 'ดีเยี่ยม', '3.5': 'ดีมาก',
    '3': 'ดี',       '2.5': 'ค่อนข้างดี',
    '2': 'ปานกลาง',  '1.5': 'พอใช้',
    '1': 'ผ่าน',     '0': 'ไม่ผ่าน'
  };

  // ── Rebuild thead with subject columns ──────────────────────────────────
  const thead = document.getElementById('report-thead');
  if (thead) {
    const subjectCols = subs.map(sub => {
      // total max score for this subject in this room
      const items = window.workItems.filter(w => w.roomId === rid && w.subjectId === sub.id);
      const maxTotal = items.reduce((a, b) => a + (+b.maxScore || 0), 0);
      return `<th class="ctr" style="white-space:nowrap">${sub.name}<br>
        <span style="font-size:10px;font-weight:400;color:var(--text3)">(เต็ม ${maxTotal} | ${sub.credits} หน่วยกิต)</span>
      </th>`;
    }).join('');
    thead.innerHTML = `
      <tr>
        <th>เลขที่</th>
        <th>ชื่อ-นามสกุล</th>
        ${subjectCols}
        <th class="ctr">GPA เฉลี่ย</th>
        <th class="ctr">พฤติกรรม</th>
        <th class="ctr">%เข้าเรียน</th>
        <th class="ctr">สถานะ</th>
      </tr>`;
  }

  if (!sts.length) {
    const colSpan = 6 + subs.length;
    el.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center;padding:32px;color:var(--text3)">ยังไม่มีนักเรียนในห้องนี้</td></tr>`;
    _resetGradeBoxes();
    return;
  }

  // ── Compute per-student data ─────────────────────────────────────────────
  const studentData = sts.map((s, si) => {
    // Attendance
    const attRecs = Object.entries(window.attData).filter(([k]) => k.startsWith(rid + '_' + s.id + '_'));
    const attN = attRecs.length;
    const attP = attRecs.filter(([, v]) => v === 'P' || v === 'L').length;
    const attPct = attN > 0 ? Math.round((attP / attN) * 100) : null;

    // Per-subject: score, max, percentage, grade
    const subGrades = subs.map(sub => {
      const items = window.workItems.filter(w => w.roomId === rid && w.subjectId === sub.id);
      const max = items.reduce((a, b) => a + (+b.maxScore || 0), 0);
      const got = items.reduce((a, w) => a + (+(w.scores && w.scores[String(s.id)]) || 0), 0);
      const pct = max > 0 ? Math.round((got / max) * 100) : null;
      const gr  = pct !== null ? window.getGrade(pct) : null;
      return { sub, got, max, pct, gr };
    });

    // Weighted GPA = Σ(grade × credits) / Σcredits  (only subjects that have scores)
    let sumWeighted = 0, sumCredits = 0;
    subGrades.forEach(sg => {
      if (sg.gr !== null) {
        const cr = parseFloat(sg.sub.credits) || 1;
        sumWeighted += parseFloat(sg.gr) * cr;
        sumCredits  += cr;
      }
    });
    const gpa = sumCredits > 0 ? Math.round((sumWeighted / sumCredits) * 10) / 10 : null;

    // Behavior
    const behScore = s.behaviorScore !== undefined ? s.behaviorScore : 100;

    // Status conditions
    const riskAtt = attPct !== null && attPct < 80;
    const riskSub = subGrades.some(sg => sg.pct !== null && sg.pct < 50);
    const riskBeh = behScore < 50;
    const risk = riskAtt || riskSub || riskBeh;

    return { s, si, subGrades, attPct, gpa, behScore, risk };
  });

  // ── Update 4-group GPA boxes ──────────────────────────────────────────
  const gpaGroups = { a:0, b:0, c:0, d:0 };
  studentData.forEach(d => {
    if (d.gpa !== null) {
      if (d.gpa >= 3.5)      gpaGroups.a++;
      else if (d.gpa >= 2.5) gpaGroups.b++;
      else if (d.gpa >= 1)   gpaGroups.c++;
      else                   gpaGroups.d++;
    }
  });
  ['a','b','c','d'].forEach(k => {
    const box = document.getElementById('r-gpa-' + k);
    if (box) box.textContent = gpaGroups[k];
  });

  if (!subs.length) {
    const colSpan = 6 + subs.length;
    el.innerHTML = `
      <tr>
        <td colspan="${colSpan}" style="text-align:center;padding:32px;color:var(--text3)">
          ยังไม่มีข้อมูลคะแนนรายวิชา<br>
          <span style="font-size:12px;color:var(--text3)">กรอกคะแนนในหน้า "งาน & คะแนนเก็บ" ก่อน</span>
        </td>
      </tr>
    `;
    return;
  }

  // ── Render rows ───────────────────────────────────────────────────────────
  el.innerHTML = studentData.map(({ s, si, subGrades, attPct, gpa, behScore, risk }) => {
    const subCols = subGrades.map(sg => {
      if (sg.pct === null) {
        return `<td class="ctr" style="border-bottom:1px solid var(--border)"><span style="color:var(--text3)">-</span></td>`;
      }
      const col = gradeColor[sg.gr] || 'var(--text3)';
      const lbl = gradeLabel[sg.gr] || '-';
      const bg  = sg.pct < 50 ? 'background:rgba(231,76,60,.05)' : '';
      return `<td class="ctr" style="border-bottom:1px solid var(--border);${bg}">
        <div style="font-weight:700;font-size:13px">${sg.got}/${sg.max}</div>
        <div style="font-size:10px;color:${col};font-weight:600">เกรด ${sg.gr} · ${lbl}</div>
      </td>`;
    }).join('');

    const gpaCol = gpa !== null
      ? `<span style="font-size:18px;font-weight:900;color:${gpa >= 3.5 ? 'var(--green)' : gpa >= 2 ? 'var(--amber)' : 'var(--red)'}">${gpa}</span>`
      : `<span style="color:var(--text3)">-</span>`;

    const attCol = attPct !== null
      ? `<span style="font-weight:700;color:${attPct >= 80 ? 'var(--green)' : attPct >= 60 ? 'var(--amber)' : 'var(--red)'}">${attPct}%</span>`
      : `<span style="color:var(--text3)">-</span>`;

    const behCol = `<span style="font-weight:600;color:${behScore >= 50 ? 'var(--green)' : 'var(--red)'}">${behScore}</span>`;

    const statusCol = risk
      ? `<span style="font-size:11px;background:var(--red-light);color:var(--red);padding:2px 8px;border-radius:8px;font-weight:600">⚠️ ดูแล</span>`
      : gpa === null
        ? `<span style="font-size:11px;color:var(--text3)">-</span>`
        : `<span style="font-size:11px;background:var(--green-light);color:var(--green);padding:2px 8px;border-radius:8px;font-weight:600">✓ ปกติ</span>`;

    return `
      <tr style="${risk ? 'background:rgba(231,76,60,.03)' : ''}">
        <td style="padding:8px 10px;text-align:center;color:var(--text3);border-bottom:1px solid var(--border)">${s.no}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="avatar ${window.avColor(si)}" style="font-size:10px">${window.initials(s.name)}</span>
            <span style="font-weight:600">${s.name}</span>
          </div>
        </td>
        ${subCols}
        <td class="ctr" style="border-bottom:1px solid var(--border);background:var(--accent-light)">${gpaCol}</td>
        <td class="ctr" style="border-bottom:1px solid var(--border)">${behCol}</td>
        <td class="ctr" style="border-bottom:1px solid var(--border);background:var(--amber-light)">${attCol}</td>
        <td class="ctr" style="border-bottom:1px solid var(--border)">${statusCol}</td>
      </tr>
    `;
  }).join('');
};

function _resetGradeBoxes() {
  ['r-gpa-a','r-gpa-b','r-gpa-c','r-gpa-d'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '0';
  });
}


window.exportReport = function(subjectId) {
  let rid = window.currentClass;
  if (window.currentPanel === 'report') {
    const rSel = document.getElementById('report-room');
    if (rSel) rid = rSel.value;
  } else if (window.currentPanel === 'report-export') {
    const reSel = document.getElementById('rep-exp-room-select');
    if (reSel) rid = reSel.value;
  }
  const targetSubId = subjectId || (window.currentPanel === 'report-export' ? document.getElementById('rep-exp-subject-select')?.value : 'all') || 'all';
  const sts = window.classData[rid] || [];
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

  const subHeaders = subs.map(s => `"${s.name}(คะแนน)","${s.name}(เกรด)"`).join(',');
  let csv = `\uFEFFเลขที่,ชื่อ-นามสกุล,${subHeaders},GPA เฉลี่ย,พฤติกรรม,%เข้าเรียน,สถานะ\n`;

  sts.forEach(s => {
    // Subject-aware attendance percentage
    const att = window.getReportAttSummary ? window.getReportAttSummary(s.id, rid, targetSubId) : window.getAttSummary(s.id, rid);
    const attPct = att.total > 0 ? Math.round(((att.P + att.L) / att.total) * 100) : null;

    const subGrades = subs.map(sub => {
      const items = window.workItems.filter(w => w.roomId === rid && w.subjectId === sub.id);
      const max = items.reduce((a, b) => a + (+b.maxScore || 0), 0);
      const got = items.reduce((a, w) => a + (+(w.scores && w.scores[String(s.id)]) || 0), 0);
      const pct = max > 0 ? Math.round((got / max) * 100) : null;
      const gr  = pct !== null ? window.getGrade(pct) : '-';
      return { got, max, gr, pct };
    });

    let sumW = 0, sumCr = 0;
    subs.forEach((sub, i) => {
      const sg = subGrades[i];
      if (sg.gr !== '-') {
        const cr = parseFloat(sub.credits) || 1;
        sumW  += parseFloat(sg.gr) * cr;
        sumCr += cr;
      }
    });
    const gpa = sumCr > 0 ? Math.round((sumW / sumCr) * 10) / 10 : '-';
    const behScore = s.behaviorScore !== undefined ? s.behaviorScore : 100;
    const riskAtt = attPct !== null && attPct < 80;
    const riskSub = subGrades.some(sg => sg.pct !== null && sg.pct < 50);
    const riskBeh = behScore < 50;
    const risk = riskAtt || riskSub || riskBeh;

    const subCols = subGrades.map(sg => `${sg.got}/${sg.max},${sg.gr}`).join(',');
    csv += `${s.no},"${s.name}",${subCols},${gpa},${behScore},${attPct !== null ? attPct + '%' : '-'},${risk ? 'ต้องดูแล' : 'ปกติ'}\n`;
  });

  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  const r = window.rooms.find(x => x.id === rid);
  const classLabel = r ? `${r.level}_${r.section}` : rid;
  const subLabel = targetSubId !== 'all' && subs.length > 0 ? `_${subs[0].name}` : '';
  a.download = `report_${classLabel}${subLabel}.csv`;
  a.click();
  window.toast('⬆ ส่งออกรายงานสรุปสำเร็จ');
};

// ══════════════════════════════════════════════════
// BROWSER PRINT-TO-PDF SERVICE (ปพ.5)
// ══════════════════════════════════════════════════
window.printReport = function(subjectId) {
  let rid = window.currentClass;
  if (window.currentPanel === 'report') {
    const rSel = document.getElementById('report-room');
    if (rSel) rid = rSel.value;
  } else if (window.currentPanel === 'report-export') {
    const reSel = document.getElementById('rep-exp-room-select');
    if (reSel) rid = reSel.value;
  }
  const targetSubId = subjectId || (window.currentPanel === 'report-export' ? document.getElementById('rep-exp-subject-select')?.value : 'all') || 'all';
  const r = window.rooms.find(x => x.id === rid);
  const classLabel = r ? `${r.level}/${r.section}` : '';
  const sts = window.classData[rid] || [];

  if (!sts.length) {
    window.toast('⚠️ ไม่มีข้อมูลนักเรียนให้จัดพิมพ์');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.toast('⚠️ โปรดอนุญาตป๊อปอัปเพื่อจัดพิมพ์รายงาน');
    return;
  }

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

  const subTh = subs.map(sub => {
    const items = window.workItems.filter(w => w.roomId === rid && w.subjectId === sub.id);
    const mx = items.reduce((a, b) => a + (+b.maxScore || 0), 0);
    return `<th class="ctr">${sub.name}<br><small>(เต็ม ${mx})</small></th>`;
  }).join('');

  let rowsHTML = sts.map(s => {
    const sAttRecs = Object.entries(window.attData).filter(([k]) => k.startsWith(rid + '_' + s.id + '_'));
    const sN = sAttRecs.length;
    const sP = sAttRecs.filter(([, v]) => v === 'P' || v === 'L').length;
    const attPct = sN > 0 ? Math.round((sP / sN) * 100) : '-';
    const behScore = s.behaviorScore !== undefined ? s.behaviorScore : 100;

    const subGrades = subs.map(sub => {
      const items = window.workItems.filter(w => w.roomId === rid && w.subjectId === sub.id);
      const max = items.reduce((a, b) => a + (+b.maxScore || 0), 0);
      const got = items.reduce((a, w) => a + (+(w.scores && w.scores[String(s.id)]) || 0), 0);
      const pct = max > 0 ? Math.round((got / max) * 100) : null;
      const gr  = pct !== null ? window.getGrade(pct) : '-';
      return { got, max, pct, gr };
    });

    let sumW = 0, sumCr = 0;
    subs.forEach((sub, i) => {
      if (subGrades[i].gr !== '-') {
        const cr = parseFloat(sub.credits) || 1;
        sumW  += parseFloat(subGrades[i].gr) * cr;
        sumCr += cr;
      }
    });
    const gpa = sumCr > 0 ? Math.round((sumW / sumCr) * 10) / 10 : '-';

    const riskAtt = typeof attPct === 'number' && attPct < 80;
    const riskSub = subGrades.some(sg => sg.pct !== null && sg.pct < 50);
    const riskBeh = behScore < 50;
    const risk = riskAtt || riskSub || riskBeh;

    const subCells = subGrades.map(sg =>
      `<td class="ctr">${sg.pct !== null ? sg.got + '/' + sg.max + '<br>เกรด ' + sg.gr : '-'}</td>`
    ).join('');

    return `
      <tr>
        <td style="text-align:center">${s.no}</td>
        <td>${s.name}</td>
        ${subCells}
        <td style="text-align:center;font-weight:bold">${gpa}</td>
        <td style="text-align:center">${behScore}</td>
        <td style="text-align:center">${typeof attPct === 'number' ? attPct + '%' : '-'}</td>
        <td style="text-align:center;font-weight:bold;color:${risk ? 'red' : 'green'}">
          ${risk ? 'ควรปรับปรุง/เฝ้าระวัง' : 'ผ่านเกณฑ์'}
        </td>
      </tr>
    `;
  }).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>รายงาน ปพ.5 — ชั้น ${classLabel}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
          body { font-family: 'Sarabun', sans-serif; color: #333; padding: 24px; margin: 0; background: #fff; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px double #333; padding-bottom: 12px; }
          .header h1 { font-size: 22px; font-weight: 700; margin: 0 0 6px 0; }
          .header h2 { font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #555; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; font-size: 13px; margin-bottom: 16px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
          th, td { border: 1px solid #333; padding: 5px 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: 700; }
          .ctr { text-align: center; }
          small { font-size: 9px; color: #666; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
          .sig-box { text-align: center; width: 170px; }
          .sig-line { border-bottom: 1px dashed #333; margin-bottom: 6px; height: 40px; }
          @media print { body { padding: 0; } button { display: none; } }
        </style>
      </head>
      <body>
        <div style="text-align:right;margin-bottom:10px">
          <button onclick="window.print()" style="padding:8px 16px;background:#2c3e50;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-family:'Sarabun',sans-serif">🖨 จัดพิมพ์รายงาน (PDF)</button>
        </div>
        <div class="header">
          <h1 style="margin-bottom:2px">เอกสารประเมินผลการพัฒนาการเรียนรู้ (ปพ.5)</h1>
          <h2 style="font-size:15px;margin-top:2px;margin-bottom:6px">โรงเรียน${window.schoolName}</h2>
          <h3 style="font-size:12px;font-weight:500;margin:0 0 6px 0;font-family:'Sarabun',sans-serif">สำนักงานเขตพื้นที่การศึกษาประถมศึกษา${window.areaOffice || '..........................................................'} &nbsp;&nbsp;&nbsp;&nbsp; จังหวัด${window.province || '....................'}</h3>
          <h2 style="font-size:14px">ระดับชั้นเรียน ${classLabel} · ประจำภาคเรียนที่ ${window.semester} ปีการศึกษา ${window.academicYear}</h2>
        </div>
        <div class="meta-grid">
          <div>
            <strong>ครูผู้สอน/ประจำชั้น:</strong> ${window.teacherName} ${window.teacherRank ? `(${window.teacherRank})` : ''}<br>
            <strong>กลุ่มสาระการเรียนรู้:</strong> ${window.teacherSubjectGroup || '-'}<br>
            <strong>วิชาที่เปิดสอน:</strong> ${subs.map(s => s.name).join(', ') || 'บูรณาการ'}
          </div>
          <div style="text-align:right">
            <strong>วันที่ออกรายงาน:</strong> ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
            <strong>จำนวนนักเรียนทั้งหมด:</strong> ${sts.length} คน
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:40px;text-align:center">เลขที่</th>
              <th>ชื่อ - นามสกุล</th>
              ${subTh}
              <th style="width:70px;text-align:center">GPA เฉลี่ย</th>
              <th style="width:80px;text-align:center">คะแนนพฤติกรรม</th>
              <th style="width:80px;text-align:center">ร้อยละเวลาเรียน</th>
              <th style="width:130px;text-align:center">การประเมินสถานะ</th>
            </tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
        </table>
        <div class="footer">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>(ลงชื่อ) ............................................</div>
            <div style="margin-top:4px; font-size:11px; color:#555">( ${window.registrarName || '............................................'} )</div>
            <div style="margin-top:4px; font-weight:600">เจ้าหน้าที่ทะเบียน</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>(ลงชื่อ) ............................................</div>
            <div style="margin-top:4px; font-size:11px; color:#555">( ${window.teacherName || '............................................'} )</div>
            <div style="margin-top:4px; font-weight:600">ครูประจำชั้น/ครูผู้สอน</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>(ลงชื่อ) ............................................</div>
            <div style="margin-top:4px; font-size:11px; color:#555">( ${window.academicHeadName || '............................................'} )</div>
            <div style="margin-top:4px; font-weight:600">หัวหน้าฝ่ายวิชาการ</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>(ลงชื่อ) ............................................</div>
            <div style="margin-top:4px; font-size:11px; color:#555">( ${window.directorName || '............................................'} )</div>
            <div style="margin-top:4px; font-weight:600">ผู้อำนวยการสถานศึกษา</div>
          </div>
        </div>
        <script>
          window.addEventListener('DOMContentLoaded', () => { setTimeout(() => window.print(), 300); });
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

window.printIndividualReport = function() {
  const rid = document.getElementById('rep-exp-room-select')?.value || window.currentClass;
  const targetStudentId = document.getElementById('rep-individual-student-select')?.value || 'all';
  const areaOffice = (window.areaOffice || '').trim() || '..........................................................';
  const province = (window.province || '').trim() || '....................';
  
  const initAttribute = document.getElementById('rep-individual-attribute')?.value || 'ดีเยี่ยม';
  const initReadwrite = document.getElementById('rep-individual-readwrite')?.value || 'ดี';
  const initActivity = document.getElementById('rep-individual-activity')?.value || 'ผ่าน';
  
  const r = window.rooms.find(x => x.id === rid);
  const classLabel = r ? `${r.level}/${r.section}` : '';
  const gradeLevel = r ? r.level : '..........';
  const sts = window.classData[rid] || [];
  
  if (!sts.length) {
    window.toast('⚠️ ไม่มีข้อมูลนักเรียนให้จัดพิมพ์');
    return;
  }
  
  let printStudents = [];
  if (targetStudentId === 'all') {
    printStudents = [...sts];
  } else {
    const sObj = sts.find(x => String(x.id) === targetStudentId);
    if (sObj) printStudents = [sObj];
  }
  
  if (printStudents.length === 0) {
    window.toast('⚠️ ไม่พบข้อมูลนักเรียนที่เลือก');
    return;
  }
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.toast('⚠️ โปรดอนุญาตป๊อปอัปเพื่อจัดพิมพ์รายงาน');
    return;
  }
  
  const subIds = [...new Set(window.workItems.filter(w => w.roomId === rid).map(w => w.subjectId))];
  const subsFromWork = subIds.map(sid => window.subjects.find(s => s.id === sid)).filter(Boolean);
  const subsFromConfig = window.subjects.filter(s => s.rooms && s.rooms.includes(rid));
  
  const allSubsMap = new Map();
  subsFromWork.forEach(s => allSubsMap.set(s.id, s));
  subsFromConfig.forEach(s => allSubsMap.set(s.id, s));
  const subs = Array.from(allSubsMap.values());
  
  const termOrder = { '1': 1, '2': 2, 'all': 3 };
  subs.sort((a, b) => {
    const tA = termOrder[a.term] || 3;
    const tB = termOrder[b.term] || 3;
    if (tA !== tB) return tA - tB;
    return (a.code || '').localeCompare(b.code || '');
  });

  const getSubjectDetails = (s, sub) => {
    const subItems = window.workItems.filter(w => w.roomId === rid && w.subjectId === sub.id);
    
    let t1Items = [], t2Items = [];
    if (sub.term === '1') {
      t1Items = subItems;
    } else if (sub.term === '2') {
      t2Items = subItems;
    } else {
      t1Items = subItems.filter(w => w.phase === 'pre' || w.phase === 'mid-exam');
      t2Items = subItems.filter(w => w.phase === 'post' || w.phase === 'final');
    }

    const t1Max = t1Items.reduce((sum, w) => sum + (+w.maxScore || 0), 0);
    const t1Got = t1Items.reduce((sum, w) => sum + (+(w.scores && w.scores[String(s.id)]) || 0), 0);
    const t2Max = t2Items.reduce((sum, w) => sum + (+w.maxScore || 0), 0);
    const t2Got = t2Items.reduce((sum, w) => sum + (+(w.scores && w.scores[String(s.id)]) || 0), 0);

    let t1Val = t1Max > 0 ? Math.round((t1Got / t1Max) * 50) : null;
    let t2Val = t2Max > 0 ? Math.round((t2Got / t2Max) * 50) : null;

    let totalVal = null;
    if (sub.term === '1') {
      totalVal = t1Max > 0 ? Math.round((t1Got / t1Max) * 100) : null;
    } else if (sub.term === '2') {
      totalVal = t2Max > 0 ? Math.round((t2Got / t2Max) * 100) : null;
    } else {
      if (t1Max > 0 && t2Max > 0) {
        totalVal = (t1Val !== null || t2Val !== null) ? ((t1Val || 0) + (t2Val || 0)) : null;
      } else if (t1Max > 0) {
        totalVal = Math.round((t1Got / t1Max) * 100);
      } else if (t2Max > 0) {
        totalVal = Math.round((t2Got / t2Max) * 100);
      }
    }

    const gradeVal = totalVal !== null ? window.getGrade(totalVal) : '-';

    return {
      t1: t1Val !== null ? t1Val : '-',
      t2: t2Val !== null ? t2Val : '-',
      total: totalVal !== null ? totalVal : '-',
      grade: gradeVal
    };
  };

  const studentHTMLs = printStudents.map((s) => {
    let basicRows = '';
    let additionalRows = '';
    
    let weightedSum = 0;
    let totalCredits = 0;
    let basicReg = 0, basicEarned = 0;
    let addReg = 0, addEarned = 0;

    const basicSubs = subs.filter(sub => sub.type === 'basic' || !sub.type);
    if (basicSubs.length > 0) {
      basicRows += `
        <tr style="background: #f2f5fa; font-weight: bold;">
          <td colspan="6" style="padding: 4px 8px;">สาระการเรียนรู้พื้นฐาน</td>
        </tr>
      `;
      basicSubs.forEach(sub => {
        const details = getSubjectDetails(s, sub);
        const cred = parseFloat(sub.credits) || 0;
        const gradeNum = parseFloat(details.grade);
        const hasGrade = !isNaN(gradeNum);
        const passed = hasGrade && gradeNum >= 1;

        if (hasGrade) {
          weightedSum += gradeNum * cred;
          totalCredits += cred;
          basicReg += cred;
          if (passed) basicEarned += cred;
        }

        basicRows += `
          <tr>
            <td style="padding-left: 15px;">${sub.code ? sub.code + ' ' : ''}${sub.name}</td>
            <td class="ctr">${sub.credits}</td>
            <td class="ctr">${details.t1}</td>
            <td class="ctr">${details.t2}</td>
            <td class="ctr" style="font-weight: 700;">${details.total}</td>
            <td class="ctr" style="font-weight: 700;">${details.grade}</td>
          </tr>
        `;
      });
    }

    const additionalSubs = subs.filter(sub => sub.type === 'additional');
    if (additionalSubs.length > 0) {
      additionalRows += `
        <tr style="background: #f2f5fa; font-weight: bold;">
          <td colspan="6" style="padding: 4px 8px;">สาระเพิ่มเติม</td>
        </tr>
      `;
      additionalSubs.forEach(sub => {
        const details = getSubjectDetails(s, sub);
        const cred = parseFloat(sub.credits) || 0;
        const gradeNum = parseFloat(details.grade);
        const hasGrade = !isNaN(gradeNum);
        const passed = hasGrade && gradeNum >= 1;

        if (hasGrade) {
          weightedSum += gradeNum * cred;
          totalCredits += cred;
          addReg += cred;
          if (passed) addEarned += cred;
        }

        additionalRows += `
          <tr>
            <td style="padding-left: 15px;">${sub.code ? sub.code + ' ' : ''}${sub.name}</td>
            <td class="ctr">${sub.credits}</td>
            <td class="ctr">${details.t1}</td>
            <td class="ctr">${details.t2}</td>
            <td class="ctr" style="font-weight: 700;">${details.total}</td>
            <td class="ctr" style="font-weight: 700;">${details.grade}</td>
          </tr>
        `;
      });
    }

    const gpaVal = totalCredits > 0 ? (Math.round((weightedSum / totalCredits) * 100) / 100).toFixed(2) : '-';

    return `
      <div class="page-container">
        <div class="report-header" style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px; position: relative;">
          <div style="position: absolute; left: 0; top: 0;">
            <svg width="60" height="60" viewBox="0 0 100 100" style="display: block;">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#2c3e50" stroke-width="2"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#2c3e50" stroke-width="0.5"/>
              <path d="M 50 15 C 38 35, 30 55, 50 85 C 70 55, 62 35, 50 15 Z" fill="#e67e22" opacity="0.85"/>
              <path d="M 50 25 C 43 40, 38 52, 50 75 C 62 52, 57 40, 50 25 Z" fill="#f1c40f"/>
              <circle cx="50" cy="50" r="8" fill="#2980b9"/>
              <path d="M 50 5 L 50 12 M 50 88 L 50 95 M 5 50 L 12 50 M 95 50 L 88 50" stroke="#2c3e50" stroke-width="1.5"/>
            </svg>
          </div>
          <div style="text-align: center; width: 100%;">
            <h1 style="font-size: 17px; font-weight: 700; margin: 0 0 4px 0; font-family: 'Sarabun', sans-serif;">แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล</h1>
            <h2 style="font-size: 13.5px; font-weight: 600; margin: 0 0 4px 0; font-family: 'Sarabun', sans-serif;">ชั้นประถมศึกษาปีที่ ${gradeLevel} &nbsp;&nbsp;&nbsp;&nbsp; ปีการศึกษา ${window.academicYear}</h2>
            <h3 style="font-size: 12px; font-weight: 500; margin: 0; font-family: 'Sarabun', sans-serif;">โรงเรียน${window.schoolName} &nbsp;&nbsp;&nbsp;&nbsp; สำนักงานเขตพื้นที่การศึกษาประถมศึกษา${areaOffice} &nbsp;&nbsp;&nbsp;&nbsp; จังหวัด${province}</h3>
          </div>
        </div>

        <div style="border-bottom: 2px solid #000; padding: 5px 0; margin-top: 10px; margin-bottom: 12px; font-size: 12px; display: flex; justify-content: space-between;">
          <div><strong>เลขประจำตัวนักเรียน:</strong> ${s.code || s.id}</div>
          <div style="flex: 1; text-align: center;"><strong>ชื่อ-นามสกุล:</strong> ${s.name}</div>
          <div style="width: 100px; text-align: right;"><strong>เลขที่:</strong> ${s.no}</div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th rowspan="2" style="text-align: center; vertical-align: middle; width: 45%;">กลุ่มสาระการเรียนรู้ / รายวิชา</th>
              <th rowspan="2" style="text-align: center; vertical-align: middle; width: 10%;">น้ำหนัก<br><span style="font-size: 9px; font-weight: normal;">(หน่วยกิต)</span></th>
              <th colspan="2" style="text-align: center; width: 25%;">คะแนนระหว่างปี/ภาคเรียน</th>
              <th rowspan="2" style="text-align: center; vertical-align: middle; width: 10%;">รวม<br><span style="font-size: 9px; font-weight: normal;">(100)</span></th>
              <th rowspan="2" style="text-align: center; vertical-align: middle; width: 10%;">ระดับ<br>ผลการเรียน</th>
            </tr>
            <tr>
              <th style="text-align: center; font-size: 9.5px; font-weight: 600; padding: 3px;">ภาคเรียนที่ 1<br><span style="font-size: 8px; font-weight: normal;">(50 คะแนน)</span></th>
              <th style="text-align: center; font-size: 9.5px; font-weight: 600; padding: 3px;">ภาคเรียนที่ 2<br><span style="font-size: 8px; font-weight: normal;">(50 คะแนน)</span></th>
            </tr>
          </thead>
          <tbody>
            ${basicRows}
            ${additionalRows}
            <tr style="background: #f5f6f8; font-weight: bold; font-size: 11.5px;">
              <td style="text-align: right; padding-right: 12px;">ผลการเรียนเฉลี่ย</td>
              <td class="ctr">${totalCredits}</td>
              <td colspan="3"></td>
              <td class="ctr" style="font-weight: 800; background: #eef2ff; font-size: 12px; color: var(--accent);">${gpaVal}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: flex-start; gap: 30px;">
          <table class="summary-table" style="width: 55%; font-size: 11px; margin-top: 0;">
            <thead>
              <tr>
                <th rowspan="2" style="text-align: center; vertical-align: middle; width: 60%;">สรุปผลการเรียนตลอดหลักสูตร</th>
                <th colspan="2" style="text-align: center; width: 40%;">ผลการเรียน</th>
              </tr>
              <tr>
                <th style="text-align: center; font-size: 9.5px; font-weight: 600; width: 20%; padding: 3px;">ที่เรียน</th>
                <th style="text-align: center; font-size: 9.5px; font-weight: 600; width: 20%; padding: 3px;">ที่ได้</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>จำนวนหน่วยกิต/น้ำหนักวิชาพื้นฐาน</td>
                <td class="ctr">${basicReg}</td>
                <td class="ctr">${basicEarned}</td>
              </tr>
              <tr>
                <td>จำนวนหน่วยกิต/น้ำหนักวิชาเพิ่มเติม</td>
                <td class="ctr">${addReg}</td>
                <td class="ctr">${addEarned}</td>
              </tr>
              <tr style="font-weight: bold; background: #fafafa;">
                <td>รวมจำนวนหน่วยกิต/น้ำหนัก</td>
                <td class="ctr">${basicReg + addReg}</td>
                <td class="ctr">${basicEarned + addEarned}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">ระดับผลการเรียนเฉลี่ย (GPA)</td>
                <td colspan="2" class="ctr" style="font-weight: bold; background: #eef2ff; font-size: 11.5px; color: var(--accent);">${gpaVal}</td>
              </tr>
              <tr>
                <td>คุณลักษณะอันพึงประสงค์ของสถานศึกษา*</td>
                <td colspan="2" class="ctr" style="font-weight: bold;">${initAttribute}</td>
              </tr>
              <tr>
                <td>การอ่าน คิด วิเคราะห์และเขียน**</td>
                <td colspan="2" class="ctr" style="font-weight: bold;">${initReadwrite}</td>
              </tr>
              <tr>
                <td>กิจกรรมพัฒนาผู้เรียน***</td>
                <td colspan="2" class="ctr" style="font-weight: bold;">${initActivity}</td>
              </tr>
            </tbody>
          </table>

          <div class="signature-section" style="width: 42%; font-size: 11px; display: flex; flex-direction: column; justify-content: space-between; height: 165px; margin-top: 5px; padding-top: 5px;">
            <div style="text-align: left; line-height: 1.4;">
              <div>ลงชื่อ.............................................................. ครูประจำชั้น</div>
              <div style="padding-left: 25px; margin-top: 2px; color: #555; font-size: 10px;">( &nbsp;&nbsp;&nbsp;${window.teacherName || '..........................................................'}&nbsp;&nbsp;&nbsp; )</div>
            </div>
            <div style="text-align: left; line-height: 1.4;">
              <div>ลงชื่อ.............................................................. ผู้อำนวยการโรงเรียน</div>
              <div style="padding-left: 25px; margin-top: 2px; color: #555; font-size: 10px;">( &nbsp;&nbsp;&nbsp;${window.directorName || '..........................................................'}&nbsp;&nbsp;&nbsp; )</div>
            </div>
            <div style="text-align: left; line-height: 1.4;">
              <div>ลงชื่อ.............................................................. ผู้ปกครอง</div>
              <div style="padding-left: 25px; margin-top: 2px; color: #555; font-size: 10px;">( &nbsp;&nbsp;&nbsp;.......................................................... &nbsp;&nbsp;&nbsp;)</div>
            </div>
          </div>
        </div>

        <div style="font-size: 9px; color: #555; margin-top: 12px; line-height: 1.4; border-top: 1px dashed #ccc; padding-top: 6px;">
          <div>* &nbsp;&nbsp;&nbsp; = &nbsp; ดีเยี่ยม / ดี / ผ่าน / ไม่ผ่าน</div>
          <div>** &nbsp;&nbsp; = &nbsp; ดีเยี่ยม / ดี / ผ่าน / ไม่ผ่าน</div>
          <div>*** &nbsp; = &nbsp; ผ่าน / ไม่ผ่าน</div>
        </div>
      </div>
    `;
  }).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>แบบรายงานผลสัมฤทธิ์รายบุคคล — ชั้น ${classLabel}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Sarabun', sans-serif; color: #111; padding: 0; margin: 0; background: #e4e6e9; }
          .page-container {
            background: #fff;
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 20mm;
            margin: 20px auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.12);
            box-sizing: border-box;
            position: relative;
          }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 5px; }
          th, td { border: 1px solid #000; padding: 5px 6px; text-align: left; line-height: 1.4; }
          th { background-color: #f5f6f8; font-weight: 700; font-size: 10.5px; }
          .ctr { text-align: center; }
          .no-print { display: flex; }
          @media print {
            body { background: #fff; padding: 0; margin: 0; }
            .page-container {
              margin: 0;
              box-shadow: none;
              padding: 10mm 15mm;
              width: 100%;
              min-height: auto;
              page-break-after: always;
              page-break-inside: avoid;
            }
            .page-container:last-child {
              page-break-after: avoid;
            }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="position: sticky; top: 0; background: #2c3e50; padding: 12px 24px; color: #fff; display: flex; justify-content: space-between; align-items: center; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: 'Sarabun', sans-serif;">
          <div>
            <strong style="font-size: 15px;">🏫 พิมพ์แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.6 เสมือนจริง)</strong>
            <span style="font-size: 12px; opacity: 0.8; margin-left: 10px;">ชั้นเรียน: ${classLabel} · ปีการศึกษา ${window.academicYear}</span>
          </div>
          <button onclick="window.print()" style="padding: 8px 18px; background: #1abc9c; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-family: 'Sarabun', sans-serif; transition: background 0.15s;">🖨️ สั่งพิมพ์เอกสาร (PDF)</button>
        </div>
        ${studentHTMLs}
        <script>
          window.addEventListener('DOMContentLoaded', () => { setTimeout(() => window.print(), 350); });
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

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
  const opts = window.rooms.map(r => `<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
  
  const sUnified = document.getElementById('rep-exp-room-select');
  const sAtt = document.getElementById('export-att-room');
  const sIndividual = document.getElementById('rep-individual-room-select');
  if (sUnified) { sUnified.innerHTML = opts; sUnified.value = window.currentClass; }
  if (sAtt) { sAtt.innerHTML = opts; sAtt.value = window.currentClass; }
  if (sIndividual) { sIndividual.innerHTML = opts; sIndividual.value = window.currentClass; }

  const rid = window.currentClass;
  if (!rid) return;

  const sts = window.classData[rid] || [];
  const studentSelect = document.getElementById('rep-individual-student-select');
  if (studentSelect) {
    let studentOpts = `<option value="all">พิมพ์ของทุกคนในห้องเรียน (แยกทีละหน้า)</option>`;
    studentOpts += sts.map(s => `<option value="${s.id}">เลขที่ ${s.no}: ${s.name}</option>`).join('');
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
        subjOpts += `<optgroup label="ภาคเรียนที่ 1">` + t1.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${s.name}</option>`).join('') + `</optgroup>`;
      }
      if (t2.length) {
        subjOpts += `<optgroup label="ภาคเรียนที่ 2">` + t2.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${s.name}</option>`).join('') + `</optgroup>`;
      }
      if (tAll.length) {
        subjOpts += `<optgroup label="เรียนทั้งปีการศึกษา">` + tAll.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${s.name}</option>`).join('') + `</optgroup>`;
      }
    } else {
      subjOpts += classSubs.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${s.name}</option>`).join('');
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
            <span class="avatar ${window.avColor(si)}" style="font-size:10px">${window.initials(s.name)}</span>
            <span style="font-weight:600">${s.name}</span>
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
    ...subs.flatMap(sub => [`วิชา ${sub.name} (คะแนน)`, `วิชา ${sub.name} (เกรด)`]),
    'GPA เฉลี่ย',
    'ผลประเมินสถานะ'
  ];

  // Rows
  const rows = sts.map(s => {
    // Attendance
    const att = window.getReportAttSummary(s.id, rid, targetSubId);
    const attPct = att.total > 0 ? Math.round(((att.P + att.L) / att.total) * 100) : 100;

    // Behavior
    const behScore = s.behaviorScore !== undefined ? s.behaviorScore : 100;

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
    const subLabel = targetSubId !== 'all' && subs.length > 0 ? `_${subs[0].name}` : '';
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
  const rid = window.currentClass;
  const opts = window.rooms.map(r => `<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
  
  const rSel = document.getElementById('sum-att-room');
  if (rSel) { rSel.innerHTML = opts; rSel.value = rid; }

  // Populate subjects dropdown
  const subSelect = document.getElementById('sum-att-subject');
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

    let subjOpts = `<option value="all">ทุกรายวิชา (All Subjects)</option>`;
    if (currentTerm === 'all') {
      const t1 = classSubs.filter(s => s.term === '1');
      const t2 = classSubs.filter(s => s.term === '2');
      const tAll = classSubs.filter(s => s.term === 'all' || !s.term);
      if (t1.length) {
        subjOpts += `<optgroup label="ภาคเรียนที่ 1">` + t1.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${s.name}</option>`).join('') + `</optgroup>`;
      }
      if (t2.length) {
        subjOpts += `<optgroup label="ภาคเรียนที่ 2">` + t2.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${s.name}</option>`).join('') + `</optgroup>`;
      }
      if (tAll.length) {
        subjOpts += `<optgroup label="เรียนทั้งปีการศึกษา">` + tAll.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${s.name}</option>`).join('') + `</optgroup>`;
      }
    } else {
      subjOpts += classSubs.map(s => `<option value="${s.id}">${s.code ? s.code + ' ' : ''}${s.name}</option>`).join('');
    }
    subSelect.innerHTML = subjOpts;
    subSelect.value = 'all';
  }
};

window.renderRoomStats = function() {
  const rid = document.getElementById('sum-att-room')?.value || window.currentClass;
  if (!rid) return;

  const sts = window.classData[rid] || [];
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
            <span class="avatar ${window.avColor(si)}" style="font-size:10px">${window.initials(s.name)}</span>
            <span style="font-weight:600">${s.name}</span>
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
