// ====== REPORTS — PRINT INDIVIDUAL (ปพ.6 รายบุคคล, browser print-to-PDF) ======

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
            <td style="padding-left: 15px;">${sub.code ? sub.code + ' ' : ''}${window.esc(sub.name)}</td>
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
            <td style="padding-left: 15px;">${sub.code ? sub.code + ' ' : ''}${window.esc(sub.name)}</td>
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
            <h2 style="font-size: 13.5px; font-weight: 600; margin: 0 0 4px 0; font-family: 'Sarabun', sans-serif;">ชั้นประถมศึกษาปีที่ ${window.esc(gradeLevel)} &nbsp;&nbsp;&nbsp;&nbsp; ปีการศึกษา ${window.academicYear}</h2>
            <h3 style="font-size: 12px; font-weight: 500; margin: 0; font-family: 'Sarabun', sans-serif;">โรงเรียน${window.esc(window.schoolName)} &nbsp;&nbsp;&nbsp;&nbsp; สำนักงานเขตพื้นที่การศึกษาประถมศึกษา${window.esc(areaOffice)} &nbsp;&nbsp;&nbsp;&nbsp; จังหวัด${window.esc(province)}</h3>
          </div>
        </div>

        <div style="border-bottom: 2px solid #000; padding: 5px 0; margin-top: 10px; margin-bottom: 12px; font-size: 12px; display: flex; justify-content: space-between;">
          <div><strong>เลขประจำตัวนักเรียน:</strong> ${s.code || s.id}</div>
          <div style="flex: 1; text-align: center;"><strong>ชื่อ-นามสกุล:</strong> ${window.esc(s.name)}</div>
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
              <div style="padding-left: 25px; margin-top: 2px; color: #555; font-size: 10px;">( &nbsp;&nbsp;&nbsp;${window.esc(window.teacherName || '..........................................................')}&nbsp;&nbsp;&nbsp; )</div>
            </div>
            <div style="text-align: left; line-height: 1.4;">
              <div>ลงชื่อ.............................................................. ผู้อำนวยการโรงเรียน</div>
              <div style="padding-left: 25px; margin-top: 2px; color: #555; font-size: 10px;">( &nbsp;&nbsp;&nbsp;${window.esc(window.directorName || '..........................................................')}&nbsp;&nbsp;&nbsp; )</div>
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
