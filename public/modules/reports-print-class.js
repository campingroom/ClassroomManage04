// ====== REPORTS — PRINT (ปพ.5 ทั้งห้อง, browser print-to-PDF) ======

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
    return `<th class="ctr">${window.esc(sub.name)}<br><small>(เต็ม ${mx})</small></th>`;
  }).join('');

  let rowsHTML = sts.map(s => {
    const sAttRecs = Object.entries(window.attData).filter(([k]) => k.startsWith(rid + '_' + s.id + '_'));
    const sN = sAttRecs.length;
    const sP = sAttRecs.filter(([, v]) => v === 'P' || v === 'L').length;
    const attPct = sN > 0 ? Math.round((sP / sN) * 100) : '-';
    const behScore = s.behaviorScore !== undefined ? s.behaviorScore : 0;

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
    const riskBeh = behScore < 0;
    const risk = riskAtt || riskSub || riskBeh;

    const subCells = subGrades.map(sg =>
      `<td class="ctr">${sg.pct !== null ? sg.got + '/' + sg.max + '<br>เกรด ' + sg.gr : '-'}</td>`
    ).join('');

    return `
      <tr>
        <td style="text-align:center">${s.no}</td>
        <td>${window.esc(s.name)}</td>
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
          <h2 style="font-size:15px;margin-top:2px;margin-bottom:6px">โรงเรียน${window.esc(window.schoolName)}</h2>
          <h3 style="font-size:12px;font-weight:500;margin:0 0 6px 0;font-family:'Sarabun',sans-serif">สำนักงานเขตพื้นที่การศึกษาประถมศึกษา${window.esc(window.areaOffice || '..........................................................')} &nbsp;&nbsp;&nbsp;&nbsp; จังหวัด${window.esc(window.province || '....................')}</h3>
          <h2 style="font-size:14px">ระดับชั้นเรียน ${classLabel} · ประจำภาคเรียนที่ ${window.semester} ปีการศึกษา ${window.academicYear}</h2>
        </div>
        <div class="meta-grid">
          <div>
            <strong>ครูผู้สอน/ประจำชั้น:</strong> ${window.esc(window.teacherName)} ${window.teacherRank ? `(${window.esc(window.teacherRank)})` : ''}<br>
            <strong>กลุ่มสาระการเรียนรู้:</strong> ${window.esc(window.teacherSubjectGroup || '-')}<br>
            <strong>วิชาที่เปิดสอน:</strong> ${window.esc(subs.map(s => s.name).join(', ') || 'บูรณาการ')}
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
            <div style="margin-top:4px; font-size:11px; color:#555">( ${window.esc(window.registrarName || '............................................')} )</div>
            <div style="margin-top:4px; font-weight:600">เจ้าหน้าที่ทะเบียน</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>(ลงชื่อ) ............................................</div>
            <div style="margin-top:4px; font-size:11px; color:#555">( ${window.esc(window.teacherName || '............................................')} )</div>
            <div style="margin-top:4px; font-weight:600">ครูประจำชั้น/ครูผู้สอน</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>(ลงชื่อ) ............................................</div>
            <div style="margin-top:4px; font-size:11px; color:#555">( ${window.esc(window.academicHeadName || '............................................')} )</div>
            <div style="margin-top:4px; font-weight:600">หัวหน้าฝ่ายวิชาการ</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>(ลงชื่อ) ............................................</div>
            <div style="margin-top:4px; font-size:11px; color:#555">( ${window.esc(window.directorName || '............................................')} )</div>
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
