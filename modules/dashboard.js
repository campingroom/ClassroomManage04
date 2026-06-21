// ====== MODULE: DASHBOARD ======
// Handles stats aggregation, GPA/attendance/behavior watchlists, and grade distribution charts.

window._activeDashChart = 'bar';

window.switchDashboardChart = function(type) {
  window._activeDashChart = type;
  
  const btnBar = document.getElementById('btn-chart-bar');
  const btnPie = document.getElementById('btn-chart-pie');
  
  if (btnBar && btnPie) {
    if (type === 'bar') {
      btnBar.style.background = 'var(--accent)';
      btnBar.style.color = '#fff';
      btnPie.style.background = 'transparent';
      btnPie.style.color = 'var(--text2)';
    } else {
      btnPie.style.background = 'var(--accent)';
      btnPie.style.color = '#fff';
      btnBar.style.background = 'transparent';
      btnBar.style.color = 'var(--text2)';
    }
  }
  
  // Re-render dashboard to update chart display
  window.renderDashboard();
};

window.populateDashboardRooms = function() {
  const sel = document.getElementById('dash-room-select');
  if (!sel) return;
  const cur = sel.value;
  
  let options = '<option value="all">🌟 ทุกห้องเรียน</option>';
  options += window.rooms.map(r => `<option value="${r.id}">🏫 ห้อง ${r.level}/${r.section}</option>`).join('');
  
  sel.innerHTML = options;
  if (cur && (cur === 'all' || window.rooms.find(r => r.id === cur))) {
    sel.value = cur;
  } else {
    if (window.currentClass && window.currentClass !== 'all' && window.rooms.find(r => r.id === window.currentClass)) {
      sel.value = window.currentClass;
    } else {
      sel.value = 'all';
    }
  }
};

// Helper: Calculate Weighted GPA for a student in a specific room
window.calcStudentGPA = function(s, roomId) {
  const _subIds = [...new Set(window.workItems.filter(w => w.roomId === roomId).map(w => w.subjectId))];
  const currentTerm = window.activeSemesterFilter || '1';
  const _subs = _subIds.map(sid => window.subjects.find(sub => sub.id === sid))
    .filter(Boolean)
    .filter(sub => currentTerm === 'all' || sub.term === 'all' || sub.term === currentTerm);
  let _sumW = 0, _sumCr = 0;
  _subs.forEach(sub => {
    const _items = window.workItems.filter(w => w.roomId === roomId && w.subjectId === sub.id);
    const _max = _items.reduce((a, b) => a + (+b.maxScore || 0), 0);
    const _got = _items.reduce((a, w) => a + (+(w.scores && w.scores[String(s.id)]) || 0), 0);
    if (_max > 0) {
      const _pct = Math.round(_got / _max * 100);
      const _gr = parseFloat(window.getGrade(_pct));
      if (!isNaN(_gr)) {
        const _cr = parseFloat(sub.credits) || 1;
        _sumW += _gr * _cr;
        _sumCr += _cr;
      }
    }
  });
  return _sumCr > 0 ? (_sumW / _sumCr) : null;
};

window.renderDashboard = function() {
  // 1. Populate rooms selector
  window.populateDashboardRooms();
  
  const sel = document.getElementById('dash-room-select');
  const selectedRoom = sel ? sel.value : 'all';

  // Get students based on selection
  let sts = [];
  if (selectedRoom === 'all') {
    window.rooms.forEach(r => {
      const roomSts = (window.classData[r.id] || []).map(s => Object.assign({}, s, { roomName: `${r.level}/${r.section}`, roomId: r.id }));
      sts = sts.concat(roomSts);
    });
  } else {
    const r = window.rooms.find(x => x.id === selectedRoom);
    const rName = r ? `${r.level}/${r.section}` : '';
    sts = (window.classData[selectedRoom] || []).map(s => Object.assign({}, s, { roomName: rName, roomId: selectedRoom }));
  }
  
  // 1. Total Students
  const totalEl = document.getElementById('d-total');
  if (totalEl) totalEl.textContent = sts.length;

  // 2. Average Weighted GPA
  let gpaSum = 0, gpaCount = 0;
  sts.forEach(s => {
    const gpa = window.calcStudentGPA(s, s.roomId);
    if (gpa !== null) {
      gpaSum += gpa;
      gpaCount++;
    }
  });
  const gpaAvgEl = document.getElementById('d-gpa-avg');
  if (gpaAvgEl) {
    gpaAvgEl.textContent = gpaCount > 0 ? (gpaSum / gpaCount).toFixed(2) : '—';
  }

  // 3. Average Behavior Score
  let behSum = 0;
  sts.forEach(s => {
    behSum += (s.behaviorScore !== undefined ? s.behaviorScore : 100);
  });
  const avgBeh = sts.length > 0 ? (behSum / sts.length).toFixed(1) : '—';
  const behAvgEl = document.getElementById('d-beh-avg');
  if (behAvgEl) {
    behAvgEl.textContent = avgBeh;
  }

  // 4. Attendance Risk < 80% count
  let attRiskCount = 0;
  sts.forEach(s => {
    const sAttRecs = Object.entries(window.attData).filter(([k]) => k.startsWith(s.roomId + '_' + s.id + '_'));
    const sN = sAttRecs.length;
    const sP = sAttRecs.filter(([, v]) => v === 'P' || v === 'L').length;
    const attPct = sN > 0 ? Math.round((sP / sN) * 100) : 100;
    if (sN > 0 && attPct < 80) {
      attRiskCount++;
    }
  });
  const attRiskEl = document.getElementById('d-att-risk');
  if (attRiskEl) {
    attRiskEl.textContent = attRiskCount;
  }

  // 5. Subject Score Risk < 50% count
  let subjRiskCount = 0;
  sts.forEach(s => {
    const roomId = s.roomId;
    const _subIds = [...new Set(window.workItems.filter(w => w.roomId === roomId).map(w => w.subjectId))];
    const currentTerm = window.activeSemesterFilter || '1';
    const activeSubIds = _subIds.filter(sid => {
      const sub = window.subjects.find(sub => sub.id === sid);
      if(!sub) return false;
      return currentTerm === 'all' || sub.term === 'all' || sub.term === currentTerm;
    });
    let hasRisk = false;
    activeSubIds.forEach(sid => {
      const _items = window.workItems.filter(w => w.roomId === roomId && w.subjectId === sid);
      const _max = _items.reduce((a, b) => a + (+b.maxScore || 0), 0);
      const _got = _items.reduce((a, w) => a + (+(w.scores && w.scores[String(s.id)]) || 0), 0);
      if (_max > 0) {
        const _pct = (_got / _max) * 100;
        if (_pct < 50) {
          hasRisk = true;
        }
      }
    });
    if (hasRisk) {
      subjRiskCount++;
    }
  });
  const subjRiskEl = document.getElementById('d-subj-risk');
  if (subjRiskEl) {
    subjRiskEl.textContent = subjRiskCount;
  }

  // 6. Behavior Risk < 80 count
  let behRiskCount = 0;
  sts.forEach(s => {
    const beh = (s.behaviorScore !== undefined ? s.behaviorScore : 100);
    if (beh < 80) {
      behRiskCount++;
    }
  });
  const behRiskEl = document.getElementById('d-beh-risk');
  if (behRiskEl) {
    behRiskEl.textContent = behRiskCount;
  }

  // 7. Grade Distribution Chart (Bar / Pie Switching)
  const gradeChart = document.getElementById('grade-chart');
  const pieChart = document.getElementById('grade-pie-chart');
  const activeChart = window._activeDashChart || 'bar';

  // Explicitly ordered from highest to lowest grade (4 to 0)
  const gradeOrder = ['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'];

  const grades = { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 };
  sts.forEach(s => {
    const gpa = window.calcStudentGPA(s, s.roomId);
    if (gpa !== null) {
      let g = '0';
      if (gpa >= 4.0) g = '4';
      else if (gpa >= 3.5) g = '3.5';
      else if (gpa >= 3.0) g = '3';
      else if (gpa >= 2.5) g = '2.5';
      else if (gpa >= 2.0) g = '2';
      else if (gpa >= 1.5) g = '1.5';
      else if (gpa >= 1.0) g = '1';
      
      if (grades[g] !== undefined) grades[g]++;
    } else {
      grades['0']++;
    }
  });

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

  if (activeChart === 'bar') {
    if (gradeChart) gradeChart.style.display = 'flex';
    if (pieChart) pieChart.style.display = 'none';

    if (gradeChart) {
      const maxCount = Math.max(...Object.values(grades), 1);
      // Max visual height of the bar (taller than before to show dynamic differences!)
      const maxBarHeight = 110; 

      gradeChart.innerHTML = gradeOrder.map(g => {
        const count = grades[g] || 0;
        // Make the bar height strictly proportional to count
        const barHeight = Math.max(4, Math.round((count / maxCount) * maxBarHeight));
        return `
          <div class="bar-item">
            <div class="bar-val">${count} คน</div>
            <div class="bar-fill" style="height:${barHeight}px;background:${colors[g]};" title="เกรด ${g}: ${count} คน"></div>
            <div class="bar-label">เกรด ${g}</div>
          </div>
        `;
      }).join('');
    }
  } else {
    if (gradeChart) gradeChart.style.display = 'none';
    if (pieChart) pieChart.style.display = 'flex';

    if (pieChart) {
      let totalCount = Object.values(grades).reduce((a, b) => a + b, 0);
      if (totalCount === 0) {
        pieChart.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:24px;text-align:center;width:100%">ไม่มีข้อมูลผลการเรียน</div>';
      } else {
        let accumulatedAngle = 0;
        let gradientSegments = [];
        let legendHTML = '<div style="display:flex;flex-direction:column;gap:6px;font-size:12px;min-width:180px;text-align:left;">';
        
        gradeOrder.forEach(g => {
          const count = grades[g] || 0;
          if (count > 0) {
            let pct = (count / totalCount) * 100;
            let angle = (count / totalCount) * 360;
            let nextAngle = accumulatedAngle + angle;
            gradientSegments.push(`${colors[g]} ${accumulatedAngle}deg ${nextAngle}deg`);
            
            legendHTML += `
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${colors[g]};flex-shrink:0;"></span>
                <span style="font-weight:500;color:var(--text2);min-width:55px;">เกรด ${g}:</span>
                <strong style="color:var(--text);">${count} คน (${pct.toFixed(1)}%)</strong>
              </div>
            `;
            accumulatedAngle = nextAngle;
          }
        });
        legendHTML += '</div>';

        if (gradientSegments.length === 0) {
          gradientSegments.push('var(--border) 0deg 360deg');
        }

        let pieStyle = `width:160px;height:160px;border-radius:50%;background:conic-gradient(${gradientSegments.join(', ')});box-shadow:var(--shadow);position:relative;flex-shrink:0;`;
        
        pieChart.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;gap:36px;flex-wrap:wrap;width:100%;padding:10px 0;">
            <div style="${pieStyle}"></div>
            ${legendHTML}
          </div>
        `;
      }
    }
  }

  // 8. Attendance Summary List (Per Student)
  const attDash = document.getElementById('att-summary-dash');
  if (attDash) {
    if (!sts.length) {
      attDash.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:12px;">ไม่มีข้อมูลนักเรียน</div>';
    } else {
      attDash.innerHTML = sts.map(s => {
        // Individual attendance
        const sAttRecs = Object.entries(window.attData).filter(([k]) => k.startsWith(s.roomId + '_' + s.id + '_'));
        const sN = sAttRecs.length;
        const sP = sAttRecs.filter(([, v]) => v === 'P' || v === 'L').length;
        const pct = sN > 0 ? Math.round((sP / sN) * 100) : 100;
        const barColor = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';
        
        return `
          <div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
              <span style="font-weight:500;">${s.no}. ${s.name} ${selectedRoom === 'all' && s.roomName ? `<span style="font-size:10px;color:var(--text3)">(${s.roomName})</span>` : ''}</span>
              <span style="font-weight:700;color:${barColor};">${pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%;background:${barColor};"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 9. Risk watchlist & counts
  const riskList = document.getElementById('risk-list');
  let riskCount = 0;
  let riskHTML = '';

  if (sts.length > 0) {
    sts.forEach(s => {
      const sAttRecs = Object.entries(window.attData).filter(([k]) => k.startsWith(s.roomId + '_' + s.id + '_'));
      const sN = sAttRecs.length;
      const sP = sAttRecs.filter(([, v]) => v === 'P' || v === 'L').length;
      const attPct = sN > 0 ? Math.round((sP / sN) * 100) : 100;
      
      const behScore = s.behaviorScore !== undefined ? s.behaviorScore : 100;
      
      // Calculate individual subject scores and find if any subject < 50%
      const roomId = s.roomId;
      const _subIds = [...new Set(window.workItems.filter(w => w.roomId === roomId).map(w => w.subjectId))];
      const currentTerm = window.activeSemesterFilter || '1';
      const activeSubIds = _subIds.filter(sid => {
        const sub = window.subjects.find(sub => sub.id === sid);
        if(!sub) return false;
        return currentTerm === 'all' || sub.term === 'all' || sub.term === currentTerm;
      });
      let lowScoreSubjects = [];
      activeSubIds.forEach(sid => {
        const _items = window.workItems.filter(w => w.roomId === roomId && w.subjectId === sid);
        const _max = _items.reduce((a, b) => a + (+b.maxScore || 0), 0);
        const _got = _items.reduce((a, w) => a + (+(w.scores && w.scores[String(s.id)]) || 0), 0);
        if (_max > 0) {
          const _pct = (_got / _max) * 100;
          if (_pct < 50) {
            const subObj = window.subjects.find(sub => sub.id === sid);
            const subLabel = subObj ? subObj.name : sid;
            lowScoreSubjects.push(`${subLabel} (${Math.round(_pct)}%)`);
          }
        }
      });
      
      const reasons = [];
      let isHighRisk = false;
      
      if (sN > 0 && attPct < 80) {
        reasons.push(`เข้าเรียนต่ำกว่าเกณฑ์ (${attPct}%)`);
        isHighRisk = true;
      }
      if (lowScoreSubjects.length > 0) {
        reasons.push(`คะแนนต่ำกว่า 50% ในวิชา: ${lowScoreSubjects.join(', ')}`);
        isHighRisk = true;
      }
      if (behScore < 80) {
        reasons.push(`คะแนนพฤติกรรมต่ำกว่าเกณฑ์ (${behScore} คะแนน)`);
        if (behScore < 70) isHighRisk = true;
      }

      if (reasons.length > 0) {
        riskCount++;
        const levelClass = isHighRisk ? 'risk-high' : 'risk-med';
        const badgeColor = isHighRisk ? 'var(--red)' : 'var(--amber)';
        const gpa = window.calcStudentGPA(s, s.roomId);
        const gpaVal = gpa !== null ? gpa.toFixed(2) : '—';
        
        riskHTML += `
          <div class="risk-item">
            <span class="risk-level ${levelClass}"></span>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span>${s.no}. ${s.name}</span>
                ${selectedRoom === 'all' && s.roomName ? `<span style="font-size:11px;color:var(--text3);font-weight:normal">(${s.roomName})</span>` : ''}
                <span class="badge" style="background:${isHighRisk?'rgba(231,76,60,.1)':'rgba(241,196,15,.1)'};color:${badgeColor};font-size:10px;padding:1px 6px;border-radius:4px;">
                  ${isHighRisk?'เฝ้าระวังสูง':'เฝ้าระวังปานกลาง'}
                </span>
              </div>
              <div style="font-size:11px;color:var(--text3);margin-top:2px;">สาเหตุ: ${reasons.join(', ')}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px;font-weight:700;color:var(--text2);">GPA: ${gpaVal}</div>
              <div style="font-size:10px;color:var(--text3);">${behScore} คะแนนพฤติกรรม</div>
            </div>
          </div>
        `;
      }
    });
  }

  if (riskList) {
    if (riskCount === 0) {
      riskList.innerHTML = `
        <div style="text-align:center;padding:24px;color:var(--green);font-weight:500;font-size:13px;">
          🎉 ทุกคนปกติดี ไม่มีนักเรียนที่ต้องดูแลเป็นพิเศษ
        </div>
      `;
    } else {
      riskList.innerHTML = riskHTML;
    }
  }

  // 10. Outstanding Weekly Behavior Ranking (Top 3)
  const topListEl = document.getElementById('behavior-top-list');
  if (topListEl) {
    // Sort students by behaviorScore descending
    const sortedByBeh = [...sts].sort((a, b) => {
      const behA = a.behaviorScore !== undefined ? a.behaviorScore : 100;
      const behB = b.behaviorScore !== undefined ? b.behaviorScore : 100;
      return behB - behA;
    });

    const top3 = sortedByBeh.slice(0, 3);
    if (top3.length === 0) {
      topListEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);font-size:12px;">ไม่มีข้อมูลพฤติกรรมนักเรียน</div>';
    } else {
      const medals = ['🥇', '🥈', '🥉'];
      const bgColors = [
        'rgba(241,196,15,0.08)', // Gold
        'rgba(189,195,199,0.08)', // Silver
        'rgba(211,84,0,0.05)' // Bronze
      ];
      const borderColors = [
        'rgba(241,196,15,0.3)',
        'rgba(189,195,199,0.3)',
        'rgba(211,84,0,0.2)'
      ];

      topListEl.innerHTML = top3.map((s, idx) => {
        const score = s.behaviorScore !== undefined ? s.behaviorScore : 100;
        
        return `
          <div style="display:flex;align-items:center;padding:10px 12px;border-radius:10px;margin-bottom:8px;background:${bgColors[idx]||'var(--surface2)'};border:1px solid ${borderColors[idx]||'var(--border)'};gap:10px;transition:transform .15s">
            <div style="font-size:20px;font-weight:700;width:28px;text-align:center;flex-shrink:0;">${medals[idx] || (idx+1)}</div>
            <div style="flex:1;display:flex;align-items:center;gap:10px;min-width:0;">
              <span class="avatar" style="width:30px;height:30px;font-size:9px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center;border-radius:50%;font-weight:600;flex-shrink:0;box-shadow:0 1px 2px rgba(0,0,0,0.05)">
                ${window.initials ? window.initials(s.name) : s.name.charAt(0)}
              </span>
              <div style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                <div style="font-size:12px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.name}</div>
                <div style="font-size:10px;color:var(--text3);margin-top:2px;">
                  เลขที่ ${s.no} ${selectedRoom === 'all' && s.roomName ? `· ห้อง ${s.roomName}` : ''}
                </div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:14px;font-weight:800;color:var(--green);">${score}</div>
              <div style="font-size:9px;color:var(--text3);font-weight:500;">คะแนนความประพฤติ</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
};
