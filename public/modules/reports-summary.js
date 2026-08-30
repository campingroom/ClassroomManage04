// ====== REPORTS — SUMMARY (ตารางสรุปผลรวมรายห้อง + CSV export) ======
// แยกออกมาจาก reports.js เดิม — ดูไฟล์พี่น้อง: reports-print-class.js, reports-print-individual.js, reports-attendance-stats.js

window.populateReportRoom = function() {
  const sel = document.getElementById('report-room');
  if (!sel) return;
  let options = '<option value="all">🌟 ทุกห้องเรียน</option>';
  options += window.rooms.map(r => `<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
  sel.innerHTML = options;
  if (window.currentClass && (window.currentClass === 'all' || window.rooms.some(r => r.id === window.currentClass))) {
    sel.value = window.currentClass;
  } else {
    sel.value = 'all';
  }
};


// ══════════════════════════════════════════════════
// INDIVIDUAL PROGRESS RENDER & PRINT
// ══════════════════════════════════════════════════
window.renderReport = function() {
  window.populateReportRoom();
  const rid = document.getElementById('report-room')?.value || window.currentClass;
  if (rid && window.currentClass !== rid) {
    window.currentClass = rid;
    if (window.updateTopbarClassBadge) window.updateTopbarClassBadge();
  }
  
  let sts = [];
  if (rid === 'all') {
    window.rooms.forEach(r => {
      sts = sts.concat((window.classData[r.id] || []).map(s => Object.assign({}, s, { roomName: `${r.level}/${r.section}`, roomId: r.id })));
    });
  } else {
    sts = (window.classData[rid] || []).map(s => Object.assign({}, s, { roomId: rid }));
  }
  
  const el = document.getElementById('report-tbody');
  if (!el) return;

  // Subjects that have work items
  const subIds = [...new Set(window.workItems.filter(w => (rid === 'all' || w.roomId === rid)).map(w => w.subjectId))];
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
    const items = window.workItems.filter(w => (rid === 'all' || w.roomId === rid) && w.subjectId === sub.id);
      const maxTotal = items.reduce((a, b) => a + (+b.maxScore || 0), 0);
      return `<th class="ctr" style="white-space:nowrap">${window.esc(sub.name)}<br>
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
    const targetRoomId = s.roomId || rid;
    // Attendance
    const attRecs = Object.entries(window.attData).filter(([k]) => k.startsWith(targetRoomId + '_' + s.id + '_'));
    const attN = attRecs.length;
    const attP = attRecs.filter(([, v]) => v === 'P' || v === 'L').length;
    const attPct = attN > 0 ? Math.round((attP / attN) * 100) : null;

    // Per-subject: score, max, percentage, grade
    const subGrades = subs.map(sub => {
      const items = window.workItems.filter(w => w.roomId === targetRoomId && w.subjectId === sub.id);
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
    const behScore = s.behaviorScore !== undefined ? s.behaviorScore : 0;

    // Status conditions
    const riskAtt = attPct !== null && attPct < 80;
    const riskSub = subGrades.some(sg => sg.pct !== null && sg.pct < 50);
    const riskBeh = behScore < 0;
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

    const behCol = `<span style="font-weight:600;color:${behScore >= 0 ? 'var(--green)' : 'var(--red)'}">${behScore}</span>`;

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
            <span class="avatar ${window.avColor(si)}" style="font-size:10px">${window.esc(window.initials(s.name))}</span>
            <span style="font-weight:600">${window.esc(s.name)}${rid === 'all' && s.roomName ? ` <span class="badge badge-info" style="font-size:10px;padding:2px 6px;margin-left:6px;">${window.esc(s.roomName)}</span>` : ''}</span>
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

  const subHeaders = subs.map(s => `"${window.esc(s.name)}(คะแนน)","${window.esc(s.name)}(เกรด)"`).join(',');
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
    const behScore = s.behaviorScore !== undefined ? s.behaviorScore : 0;
    const riskAtt = attPct !== null && attPct < 80;
    const riskSub = subGrades.some(sg => sg.pct !== null && sg.pct < 50);
    const riskBeh = behScore < 0;
    const risk = riskAtt || riskSub || riskBeh;

    const subCols = subGrades.map(sg => `${sg.got}/${sg.max},${sg.gr}`).join(',');
    csv += `${s.no},"${window.esc(s.name)}",${subCols},${gpa},${behScore},${attPct !== null ? attPct + '%' : '-'},${risk ? 'ต้องดูแล' : 'ปกติ'}\n`;
  });

  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  const r = window.rooms.find(x => x.id === rid);
  const classLabel = r ? `${r.level}_${r.section}` : rid;
  const subLabel = targetSubId !== 'all' && subs.length > 0 ? `_${window.esc(subs[0].name)}` : '';
  a.download = `report_${classLabel}${subLabel}.csv`;
  a.click();
  window.toast('⬆ ส่งออกรายงานสรุปสำเร็จ');
};
