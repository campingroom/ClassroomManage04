// ====== STUDENTS ======
window._studentSortCol = 'no';
window._studentSortDir = 'asc';

window.sortStudents = function (col) {
  if (window._studentSortCol === col) {
    window._studentSortDir = window._studentSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    window._studentSortCol = col;
    window._studentSortDir = 'asc';
  }
  window.renderStudents();
}

window.renderStudents = function () {
  window.renderRoomTabs();

  let sts = [];
  if (window.currentClass === 'all') {
    window.rooms.forEach(r => {
      const roomSts = (window.classData[r.id] || []).map(s => Object.assign({}, s, { roomName: `${r.level}/${r.section}`, roomId: r.id }));
      sts = sts.concat(roomSts);
    });
  } else {
    sts = window.classData[window.currentClass] || [];
  }

  const q = (document.getElementById('search-student')?.value || '').toLowerCase();

  // Apply filter options (male, female, health) if elements exist
  const modeEl = document.getElementById('student-view-mode');
  const mode = modeEl ? modeEl.value : 'all';

  let filtered = sts;
  if (q) {
    filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || String(s.no).includes(q) || String(s.id).includes(q) || (s.roomName && s.roomName.toLowerCase().includes(q)));
  }
  if (mode === 'male') {
    filtered = filtered.filter(s => s.gender === 'ชาย');
  } else if (mode === 'female') {
    filtered = filtered.filter(s => s.gender === 'หญิง');
  } else if (mode === 'health') {
    filtered = filtered.filter(s => s.health && s.health !== '-');
  }

  // Apply sorting
  const col = window._studentSortCol || 'no';
  const dir = window._studentSortDir || 'asc';

  filtered.sort((a, b) => {
    let res = 0;
    if (col === 'no') {
      res = (+a.no || 0) - (+b.no || 0);
    } else if (col === 'id') {
      res = (+a.id || 0) - (+b.id || 0);
    } else if (col === 'name') {
      res = (a.name || '').localeCompare(b.name || '', 'th');
    } else if (col === 'gender') {
      res = (a.gender || '').localeCompare(b.gender || '', 'th');
    } else if (col === 'phone') {
      res = (a.phone || '').localeCompare(b.phone || '');
    } else if (col === 'health') {
      res = (a.health || '').localeCompare(b.health || '', 'th');
    }
    return dir === 'asc' ? res : -res;
  });

  // Update header sort indicator arrows
  const headers = {
    'no': { id: 'th-std-no', label: 'เลขที่' },
    'id': { id: 'th-std-id', label: 'รหัสประจำตัว' },
    'name': { id: 'th-std-name', label: 'ชื่อ-นามสกุล' },
    'gender': { id: 'th-std-gender', label: 'เพศ' },
    'phone': { id: 'th-std-phone', label: 'โทร ผปค.' },
    'health': { id: 'th-std-health', label: 'ชื่อเล่น' }
  };

  Object.keys(headers).forEach(k => {
    const el = document.getElementById(headers[k].id);
    if (el) {
      if (k === col) {
        el.innerHTML = `${headers[k].label} ${dir === 'asc' ? '▲' : '▼'}`;
        el.style.color = 'var(--accent)';
        el.style.fontWeight = '700';
      } else {
        el.innerHTML = headers[k].label;
        el.style.color = '';
        el.style.fontWeight = '';
      }
    }
  });

  // Reset select all checkbox and delete selected button on render
  const selectAll = document.getElementById('std-select-all');
  if (selectAll) selectAll.checked = false;
  const delBtn = document.getElementById('btn-delete-selected-stds');
  if (delBtn) delBtn.style.display = 'none';

  const tbody = document.getElementById('student-tbody');
  if (!tbody) return;

  // Render stats counters
  const totalEl = document.getElementById('s-total'); if (totalEl) totalEl.textContent = sts.length;
  const maleEl = document.getElementById('s-male'); if (maleEl) maleEl.textContent = sts.filter(s => s.gender === 'ชาย').length;
  const femaleEl = document.getElementById('s-female'); if (femaleEl) femaleEl.textContent = sts.filter(s => s.gender === 'หญิง').length;
  const healthEl = document.getElementById('s-health'); if (healthEl) healthEl.textContent = sts.filter(s => s.health && s.health !== '-').length;

  // Render student list mini stats dashboard for the selected room
  const miniTotal = document.getElementById('mini-stat-total'); if (miniTotal) miniTotal.textContent = sts.length;
  const miniMale = document.getElementById('mini-stat-male'); if (miniMale) miniMale.textContent = sts.filter(s => s.gender === 'ชาย').length;
  const miniFemale = document.getElementById('mini-stat-female'); if (miniFemale) miniFemale.textContent = sts.filter(s => s.gender === 'หญิง').length;

  tbody.innerHTML = filtered.length ? filtered.map((s, i) => {
    return `<tr style="cursor:pointer" onclick="window.openStudentProfileModal(${s.id})"
      onmouseover="this.style.background='var(--accent-light)'" onmouseout="this.style.background=''">
      <td style="text-align:center;vertical-align:middle" onclick="event.stopPropagation()">
        <input type="checkbox" class="std-row-cb" data-id="${s.id}" onchange="window.checkStudentSelection()" style="width:16px;height:16px;cursor:pointer;vertical-align:middle">
      </td>
      <td style="color:var(--text3);font-size:12px;text-align:center">${s.no}</td>
      <td style="font-size:11px;color:var(--accent);text-align:center;font-family:monospace;font-weight:600">${s.id}</td>
      <td><div style="display:flex;align-items:center;gap:8px">
        <span class="avatar ${window.avColor(i)}" style="font-size:10px">${window.esc(window.initials(s.name))}</span>
        <div>
          <div style="font-size:13px;font-weight:500">${window.esc(s.name)}</div>
          <div style="display:flex;gap:6px;align-items:center;margin-top:2px">
            ${s.roomName ? `<span style="background:var(--accent-light);color:var(--accent);font-size:10px;padding:1px 6px;border-radius:4px;font-weight:600">ห้อง ${window.esc(s.roomName)}</span>` : ''}
            ${s.health && s.health !== '-' ? `<span style="font-size:11px;color:var(--text3)">ชื่อเล่น: ${window.esc(s.health)}</span>` : ''}
          </div>
        </div>
      </div></td>
      <td style="font-size:12px;color:var(--text2)">${s.gender}</td>
      <td style="font-size:12px;color:var(--text2)">${window.esc(s.phone || '-')}</td>
      <td style="font-size:12px;color:var(--text2)">${window.esc(s.health || '-')}</td>
      <td class="ctr" onclick="event.stopPropagation()">
        <div style="display:flex;gap:6px;justify-content:center">
          <button class="btn-edit-outlined" onclick="editStudent(${s.id})" style="padding: 4px 10px; font-size: 11.5px;">✏️ แก้ไข</button>
          <button class="btn-delete-outlined" onclick="deleteStudent(${s.id});event.stopPropagation()" style="padding: 4px 10px; font-size: 11.5px;">ลบ</button>
        </div>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text3)">ยังไม่มีนักเรียน</td></tr>`;
  window.renderAllStudentStats();
}

window.toggleSelectAllStudents = function (checked) {
  document.querySelectorAll('.std-row-cb').forEach(cb => cb.checked = checked);
  window.checkStudentSelection();
}

window.checkStudentSelection = function () {
  const cbs = document.querySelectorAll('.std-row-cb');
  const checkedCbs = document.querySelectorAll('.std-row-cb:checked');
  const delBtn = document.getElementById('btn-delete-selected-stds');
  const countSpan = document.getElementById('selected-stds-count');

  if (delBtn && countSpan) {
    if (checkedCbs.length > 0) {
      delBtn.style.display = 'inline-flex';
      countSpan.textContent = checkedCbs.length;
    } else {
      delBtn.style.display = 'none';
    }
  }

  const selectAll = document.getElementById('std-select-all');
  if (selectAll && cbs.length > 0) {
    selectAll.checked = cbs.length === checkedCbs.length;
  }
}

window.deleteSelectedStudents = function () {
  const checkedCbs = document.querySelectorAll('.std-row-cb:checked');
  if (!checkedCbs.length) return;

  if (!confirm(`ต้องการลบนักเรียนที่เลือกทั้งหมด ${checkedCbs.length} คนใช่หรือไม่?`)) return;

  const idsToDelete = Array.from(checkedCbs).map(cb => +cb.dataset.id);

  for (const rId in window.classData) {
    window.classData[rId] = (window.classData[rId] || []).filter(s => !idsToDelete.includes(s.id));
  }

  window.snapshotVersion('ลบหลายนักเรียน');
  window.renderStudents();
  if (window.GS_URL) { window.pushStudents(window.currentClass).catch(e => console.warn(e)); }
  else { window.showSyncToast('💾 บันทึกในเครื่องแล้ว'); }
  window.toast(`🗑 ลบนักเรียน ${checkedCbs.length} คนสำเร็จ`);
}

window.editStudent = function (id) {
  let s = null;
  let sRoom = window.currentClass;
  for (const rId in window.classData) {
    const found = (window.classData[rId] || []).find(x => x.id === id);
    if (found) {
      s = found;
      sRoom = rId;
      break;
    }
  }
  if (!s) return;

  const titleEl = document.getElementById('modal-student-title');
  if (titleEl) titleEl.textContent = '✏️ แก้ไขข้อมูลนักเรียน';

  window.safeSetHelper('m-edit-id', id);
  window.safeSetHelper('m-student-id', id);
  window.safeSetHelper('m-no', s.no);
  window.safeSetHelper('m-gender', s.gender);
  window.safeSetHelper('m-name', s.name);
  window.safeSetHelper('m-dob', s.dob || '');
  window.safeSetHelper('m-phone', s.phone || '');
  window.safeSetHelper('m-health', s.health || '-');

  const roomSelect = document.getElementById('m-room');
  if (roomSelect) {
    roomSelect.innerHTML = window.rooms.map(r => `<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
    roomSelect.value = sRoom;
  }

  const el = document.getElementById('add-modal');
  if (el) el.classList.add('open');
}

window.deleteStudent = function (id) {
  if (!confirm('ลบนักเรียนคนนี้?')) return;
  for (const rId in window.classData) {
    window.classData[rId] = (window.classData[rId] || []).filter(s => s.id !== id);
  }
  window.renderStudents();
  window.snapshotVersion('ลบนักเรียน');
  if (window.GS_URL) { window.pushStudents(window.currentClass).catch(e => console.warn(e)); }
  window.toast('🗑 ลบนักเรียนแล้ว');
}

window.openAddModal = function () {
  const titleEl = document.getElementById('modal-student-title');
  if (titleEl) titleEl.textContent = 'เพิ่มนักเรียนใหม่';
  window.safeSetHelper('m-edit-id', '');
  window.safeSetHelper('m-student-id', window.nextId);
  ['m-no', 'm-name', 'm-dob', 'm-phone', 'm-health'].forEach(id => {
    window.safeSetHelper(id, '');
  });

  const roomSelect = document.getElementById('m-room');
  if (roomSelect) {
    roomSelect.innerHTML = window.rooms.map(r => `<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
    roomSelect.value = window.currentClass === 'all' ? (window.rooms[0]?.id || '') : window.currentClass;
  }

  const el = document.getElementById('add-modal');
  if (el) el.classList.add('open');
}

window.updateStudentIdReferences = function (oldId, newId) {
  oldId = +oldId;
  newId = +newId;
  if (oldId === newId) return;

  // 1. Update scores in workItems
  if (window.workItems) {
    window.workItems.forEach(w => {
      if (w.scores) {
        if (w.scores[String(oldId)] !== undefined) {
          w.scores[String(newId)] = w.scores[String(oldId)];
          delete w.scores[String(oldId)];
        }
      }
    });
  }

  // 2. Update attData
  if (window.attData) {
    Object.keys(window.attData).forEach(k => {
      const parts = k.split('_');
      if (parts[1] === String(oldId)) {
        parts[1] = String(newId);
        const newKey = parts.join('_');
        window.attData[newKey] = window.attData[k];
        delete window.attData[k];
      }
    });
  }

  // 3. Update behaviors list
  if (window.behaviors) {
    window.behaviors.forEach(rec => {
      if (rec.sid === oldId) {
        rec.sid = newId;
      }
    });
  }
}

window.submitStudent = function () {
  const name = (document.getElementById('m-name')?.value || '').trim();
  if (!name) { window.toast('⚠️ กรอกชื่อก่อน'); return; }
  const editId = +(document.getElementById('m-edit-id')?.value || 0);
  const studentId = +(document.getElementById('m-student-id')?.value || 0) || (editId || window.nextId++);

  const targetRoom = document.getElementById('m-room')?.value || (window.currentClass === 'all' ? (window.rooms[0]?.id || '') : window.currentClass);
  const no = +(document.getElementById('m-no')?.value || 0) || (window.classData[targetRoom]?.length || 0) + 1;
  const gender = document.getElementById('m-gender')?.value || 'ชาย';
  const dob = document.getElementById('m-dob')?.value || '';
  const phone = document.getElementById('m-phone')?.value || '';
  const health = document.getElementById('m-health')?.value || '-';

  if (!window.classData[targetRoom]) window.classData[targetRoom] = [];

  if (editId) {
    let oldRoom = window.currentClass;
    let oldIdx = -1;
    let oldStudent = null;

    for (const rId in window.classData) {
      const idx = window.classData[rId].findIndex(s => s.id === editId);
      if (idx >= 0) {
        oldRoom = rId;
        oldIdx = idx;
        oldStudent = window.classData[rId][idx];
        break;
      }
    }

    if (oldStudent) {
      // Validate unique ID if changed
      if (studentId !== editId) {
        let exists = false;
        for (const rId in window.classData) {
          if ((window.classData[rId] || []).some(x => x.id === studentId)) {
            exists = true;
            break;
          }
        }
        if (exists) {
          window.toast('⚠️ รหัสประจำตัวนี้ถูกใช้งานโดยนักเรียนคนอื่นแล้ว');
          return;
        }
        window.updateStudentIdReferences(editId, studentId);
      }

      const updatedStudent = Object.assign({}, oldStudent, { id: studentId, no, name, gender, dob, phone, health });
      if (oldRoom === targetRoom) {
        window.classData[oldRoom][oldIdx] = updatedStudent;
        window.toast('✅ อัปเดตข้อมูลแล้ว');
      } else {
        if (window.classData[oldRoom]) {
          window.classData[oldRoom].splice(oldIdx, 1);
        }
        window.classData[targetRoom].push(updatedStudent);
        window.toast('✅ อัปเดตและย้ายห้องเรียนแล้ว');
      }
      window.classData[targetRoom].sort((a, b) => a.no - b.no);
    }
  } else {
    // Validate unique studentId
    let exists = false;
    for (const rId in window.classData) {
      if ((window.classData[rId] || []).some(x => x.id === studentId)) {
        exists = true;
        break;
      }
    }
    if (exists) {
      window.toast('⚠️ รหัสประจำตัวนี้ถูกใช้งานแล้ว');
      return;
    }

    window.classData[targetRoom].push({
      id: studentId, no, name, gender, dob, phone, addr: '', health,
      scores: { work: 0, mid: 0, final: 0, behavior: 0 }, behaviorScore: 0
    });
    // Keep nextId ahead
    if (studentId >= window.nextId) {
      window.nextId = studentId + 1;
    }
    window.classData[targetRoom].sort((a, b) => a.no - b.no);
    window.toast('✅ เพิ่มนักเรียนแล้ว');
  }

  if (window.currentClass !== 'all') {
    window.currentClass = targetRoom;
  }
  window.closeModal('add-modal');
  window.renderStudents();
  window.snapshotVersion('แก้ไขนักเรียน');
  if (window.GS_URL) { window.pushStudents(targetRoom).catch(e => console.warn('pushStudents:', e.message)); }
  else { window.showSyncToast('💾 บันทึกในเครื่องแล้ว'); }
}

window.safeSetHelper = function (id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// ====== IMPORT / EXPORT ======
window.downloadTemplate = function (format) {
  // col order: เลขที่, รหัสประจำตัว, ชื่อ-นามสกุล, เพศ, ห้องเรียน, วันเกิด, โทรศัพท์ผู้ปกครอง, ชื่อเล่น
  const headers = ['เลขที่', 'รหัสประจำตัว', 'ชื่อ-นามสกุล', 'เพศ', 'ห้องเรียน', 'วันเกิด(YYYY-MM-DD)', 'โทรศัพท์ผู้ปกครอง', 'ชื่อเล่น'];
  const sample = [
    [1, 10001, 'เด็กชายสมชาย ใจดี', 'ชาย', 'ม.3/2', '2010-05-12', '081-234-5678', 'ใส'],
    [2, 10002, 'เด็กหญิงสมหญิง สวยงาม', 'หญิง', 'ม.3/2', '2010-03-22', '082-345-6789', 'ส้ม'],
  ];
  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    ws['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 28 }, { wch: 8 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'นักเรียน');
    XLSX.writeFile(wb, 'template_students.xlsx');
    window.toast('⬇ ดาวน์โหลดเทมเพลต Excel แล้ว');
  } else {
    const csv = '\uFEFF' + [headers, ...sample].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'template_students.csv'; a.click();
    window.toast('⬇ ดาวน์โหลดเทมเพลต CSV แล้ว');
  }
}

window.exportStudentCSV = function () {
  let sts = [];
  if (window.currentClass === 'all') {
    window.rooms.forEach(r => {
      const roomSts = (window.classData[r.id] || []).map(s => Object.assign({}, s, { roomName: `${r.level}/${r.section}` }));
      sts = sts.concat(roomSts);
    });
  } else {
    sts = window.classData[window.currentClass] || [];
  }

  let csv = '\uFEFFเลขที่,ชื่อ-นามสกุล,เพศ,ห้องเรียน,วันเกิด,โทรศัพท์,ที่อยู่,ชื่อเล่น,คะแนนรวม,เกรด\n';
  sts.forEach(s => {
    const t = window.calcTotal(s);
    const roomVal = s.roomName || (() => {
      const r = window.rooms.find(x => x.id === window.currentClass);
      return r ? `${r.level}/${r.section}` : '';
    })();
    csv += `${s.no},"${window.esc(s.name)}",${s.gender},"${roomVal}",${s.dob || ''},${s.phone || ''},"${s.addr || ''}","${window.esc(s.health || '-')}",${t > 0 ? t : '-'},${t > 0 ? window.getGrade(t) : '-'}\n`;
  });

  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);

  let label = 'all';
  if (window.currentClass !== 'all') {
    const r = window.rooms.find(x => x.id === window.currentClass);
    label = r ? r.level + '_' + r.section : window.currentClass;
  }

  a.download = `students_${label}.csv`;
  a.click();
  window.toast('⬆ ส่งออก CSV แล้ว');
}

window.openImportModal = function () {
  window.resetImportModal();
  const modal = document.getElementById('import-modal');
  if (modal) modal.classList.add('open');
}

window.resetImportModal = function () {
  const selector = document.getElementById('import-file-selector');
  if (selector) selector.value = '';
  window._importRows = [];

  const s1 = document.getElementById('import-state-initial');
  const s2 = document.getElementById('import-state-preview');
  if (s1) s1.style.display = 'block';
  if (s2) s2.style.display = 'none';
}

window.importFile = function (input) {
  const file = input.files[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') {
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      // Skip headers
      const rows = lines.slice(1).map(l => {
        const r = []; let cur = '', inQ = false;
        for (const c of l) {
          if (c === '"') { inQ = !inQ; }
          else if (c === ',' && !inQ) { r.push(cur.trim().replace(/^"|"$/g, '')); cur = ''; }
          else cur += c;
        }
        r.push(cur.trim().replace(/^"|"$/g, ''));
        return r;
      });
      showImportPreview(rows, file.name);
    };
    reader.readAsText(file, 'UTF-8');
  } else {
    // xlsx / xls
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
        // Skip header row
        const rows = raw.slice(1).filter(r => r.length > 0).map(r => r.map(c => c !== undefined && c !== null ? String(c) : ''));
        showImportPreview(rows, file.name);
      } catch (err) {
        window.toast('❌ ไม่สามารถอ่านไฟล์ Excel ได้: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

function showImportPreview(rows, filename) {
  const previewEl = document.getElementById('import-preview-body');
  if (previewEl) {
    previewEl.innerHTML = rows.slice(0, 5).map(r => {
      // col: 0=เลขที่ 1=รหัสประจำตัว 2=ชื่อ 3=เพศ 4=ห้อง 5=วันเกิด 6=โทร 7=ชื่อเล่น
      const missingId = !r[1] || !String(r[1]).trim();
      return `<tr>
        <td>${r[0] || '-'}</td>
        <td style="${missingId ? 'color:var(--red);font-weight:700' : ''}">` +
        (missingId ? '⚠️ ขาด' : r[1]) +
        `</td>
        <td>${r[2] || '-'}</td>
        <td>${r[3] || '-'}</td>
        <td>${r[4] || '-'}</td>
        <td>${r[5] || '-'}</td>
        <td>${r[6] || '-'}</td>
        <td>${r[7] || '-'}</td>
      </tr>`;
    }).join('');
  }

  const fnEl = document.getElementById('import-filename');
  if (fnEl) fnEl.textContent = filename;

  const badge = document.getElementById('import-total-rows-badge');
  if (badge) badge.textContent = `ทั้งหมด ${rows.length} แถว`;

  // Populate target room select
  const sel = document.getElementById('import-target-room');
  if (sel) {
    sel.innerHTML = window.rooms.map(r => `<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
    sel.value = window.currentClass === 'all' ? (window.rooms[0]?.id || '') : window.currentClass;
  }

  // Check if rows have room info
  const hasRoom = rows.some(r => r[3] && r[3].trim());
  const alertEl = document.getElementById('import-has-room-info');
  if (alertEl) {
    alertEl.style.display = hasRoom ? 'block' : 'none';
  }

  window._importRows = rows;

  // Show State 2, Hide State 1
  const s1 = document.getElementById('import-state-initial');
  const s2 = document.getElementById('import-state-preview');
  if (s1) s1.style.display = 'none';
  if (s2) s2.style.display = 'block';

  const modal = document.getElementById('import-modal');
  if (modal) modal.classList.add('open');
}

window.confirmImport = function () {
  const rows = window._importRows || [];
  const mode = document.getElementById('import-mode')?.value || 'single';
  const targetRoom = document.getElementById('import-target-room')?.value || window.currentClass;
  let added = 0;
  let affectedRooms = new Set();

  // ── Validate: warn if any row is missing รหัสประจำตัว ───────────────────
  // col layout: 0=เลขที่, 1=รหัสประจำตัว, 2=ชื่อ, 3=เพศ, 4=ห้อง, 5=วันเกิด, 6=โทร, 7=ชื่อเล่น
  const missingIdRows = rows.filter(r => (r[2] || r[1] || r[0]) && (!r[1] || !String(r[1]).trim()));
  if (missingIdRows.length > 0) {
    const proceed = confirm(
      `⚠️ พบนักเรียน ${missingIdRows.length} คนที่ไม่มีรหัสประจำตัว\n` +
      `ระบบจะสร้างรหัสชั่วคราวให้อัตโนมัติ\n\n` +
      `กด OK เพื่อนำเข้าต่อ หรือ Cancel เพื่อยกเลิกและแก้ไขไฟล์`
    );
    if (!proceed) return;
  }

  rows.forEach((r, i) => {
    // col: 0=เลขที่, 1=รหัสประจำตัว, 2=ชื่อ, 3=เพศ, 4=ห้อง, 5=วันเกิด, 6=โทร, 7=ชื่อเล่น
    if (!r[2] && !r[1] && !r[0]) return; // skip empty
    const name = r[2] || r[1] || r[0] || '';
    if (!name || /^\d+$/.test(name.trim())) return; // skip header-like or pure numeric rows

    // Explicit student ID from col 1 (use auto-increment if blank)
    const explicitId = r[1] && String(r[1]).trim() ? parseInt(String(r[1]).trim()) : null;

    let rid = targetRoom;
    if (mode === 'auto' || mode === 'split') {
      const roomStr = (r[4] || '').trim();
      if (roomStr) {
        let matchedRoom = window.rooms.find(x => `${x.level}/${x.section}` === roomStr || `${x.level}${x.section}` === roomStr);
        if (matchedRoom) {
          rid = matchedRoom.id;
        } else if (mode === 'auto') {
          const parts = roomStr.split('/');
          const level = parts[0] || 'ม.3';
          const section = parts[1] || '1';
          const newId = 'r' + window.nextRoomId++;
          window.rooms.push({
            id: newId, level, section,
            year: '2568', semester: '1', teacher: '',
            note: 'สร้างอัตโนมัติจากการนำเข้า'
          });
          window.classData[newId] = [];
          rid = newId;
        } else {
          return;
        }
      } else {
        rid = targetRoom === 'all' ? (window.rooms[0]?.id || '') : targetRoom;
      }
    } else {
      rid = targetRoom === 'all' ? (window.rooms[0]?.id || '') : targetRoom;
    }

    if (!window.classData[rid]) window.classData[rid] = [];
    affectedRooms.add(rid);

    const no = +r[0] || (window.classData[rid].length) + 1;
    const studentId = (explicitId && !isNaN(explicitId)) ? explicitId : window.nextId++;
    // Keep nextId ahead if explicit ID used
    if (explicitId && !isNaN(explicitId) && explicitId >= window.nextId) {
      window.nextId = explicitId + 1;
    }

    if (!window.classData[rid].find(s => s.name === name)) {
      window.classData[rid].push({
        id: studentId, no, name,
        gender: r[3] || 'ชาย', dob: r[5] || '', phone: r[6] || '',
        addr: '', health: r[7] || '-',
        scores: { work: 0, mid: 0, final: 0, behavior: 0 }, behaviorScore: 0
      });
      added++;
    }
  });

  affectedRooms.forEach(rid => {
    if (window.classData[rid]) window.classData[rid].sort((a, b) => a.no - b.no);
    window.pushStudents(rid);
  });

  window.resetImportModal();
  window.closeModal('import-modal');
  window.renderStudents();
  window.snapshotVersion('นำเข้านักเรียน');
  window.toast(`✅ นำเข้า ${added} คนสำเร็จ`);
}

// ====== INDIVIDUAL STUDENT PROFILE MODAL ======
window._activeProfileStudentId = null;
window._activeProfileRoomId = null;

window.openStudentProfileModal = function (studentId, initialTab) {
  let student = null;
  let roomId = '';
  for (const rId in window.classData) {
    const s = window.classData[rId].find(x => x.id === studentId);
    if (s) {
      student = s;
      roomId = rId;
      break;
    }
  }

  if (!student) return;

  window._activeProfileStudentId = studentId;
  window._activeProfileRoomId = roomId;

  // Set student details
  const nameEl = document.getElementById('std-profile-name');
  if (nameEl) {
    const nickname = student.nickname || (student.health && student.health !== '-' ? student.health : '');
    nameEl.innerHTML = `${window.esc(student.name)}${nickname ? `<div style="font-size:13px;font-weight:600;color:var(--text3);margin-top:2px">ชื่อเล่น: ${window.esc(nickname)}</div>` : ''}`;
  }

  const detEl = document.getElementById('std-profile-details');
  if (detEl) {
    const r = window.rooms.find(x => x.id === roomId);
    const roomStr = r ? `${r.level}/${r.section}` : roomId;
    detEl.innerHTML = `เลขประจำตัว: ${student.id} • ห้องเรียน: ${window.esc(roomStr)}`;
  }

  // Set avatar SVG — behavior-score-based emoji (same as profile cards and behavior page)
  const avatarWrap = document.getElementById('std-profile-avatar-wrap');
  if (avatarWrap) {
    const score = student.behaviorScore !== undefined ? student.behaviorScore : 0;
    const monster = window.getStudentMonsterData(score);
    
    avatarWrap.innerHTML = `
      <div style="width: 80px; height: 80px; border-radius: 50%; background: ${monster.gradient}; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(0,0,0,0.12); margin: 0 auto; transition: transform 0.2s;">
        <div style="width: 100%; height: 100%; transform: scale(${monster.scale}); display: flex; align-items: center; justify-content: center;">
          ${monster.svg}
        </div>
      </div>
      <div style="text-align: center; margin-top: 10px;">
        <span class="monster-level-badge" style="background: ${monster.badgeColor}; color: ${monster.textColor};">
          Lv. ${monster.level} · ${monster.name}
        </span>
        <div class="monster-level-name" style="margin-bottom: 0;">${monster.thaiName}</div>
        <div style="display: flex; justify-content: center; margin-top: 6px;">
          <div class="monster-exp-bar-container" style="width: 140px; margin-bottom: 0;" title="EXP Progress: ${monster.progressPercent}%">
            <div class="monster-exp-bar-fill" style="width: ${monster.progressPercent}%; background: ${monster.gradient};"></div>
          </div>
        </div>
      </div>
    `;
  }

  // Calculate stats
  // 1. Weighted GPA — same formula as รายงานผลรายห้อง
  {
    const _subIds = [...new Set(window.workItems.filter(w => w.roomId === roomId).map(w => w.subjectId))];
    const currentTerm = window.activeSemesterFilter || '1';
    const _subs = _subIds.map(sid => window.subjects.find(sub => sub.id === sid))
      .filter(Boolean)
      .filter(s => currentTerm === 'all' || s.term === 'all' || s.term === currentTerm);
    let _sumW = 0, _sumCr = 0;
    _subs.forEach(sub => {
      const _items = window.workItems.filter(w => w.roomId === roomId && w.subjectId === sub.id);
      const _max = _items.reduce((a, b) => a + (+b.maxScore || 0), 0);
      const _got = _items.reduce((a, w) => a + (+(w.scores && w.scores[String(student.id)]) || 0), 0);
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
    const _gpa = _sumCr > 0 ? Math.round((_sumW / _sumCr) * 100) / 100 : null;
    const gpaEl = document.getElementById('std-profile-gpa');
    if (gpaEl) {
      gpaEl.textContent = _gpa !== null ? _gpa.toFixed(2) : '—';
      gpaEl.style.color = _gpa === null ? 'var(--text3)' : _gpa >= 3.5 ? 'var(--green)' : _gpa >= 2 ? 'var(--amber)' : 'var(--red)';
    }
  }

  // 2. Behavior
  const behScore = student.behaviorScore !== undefined ? student.behaviorScore : 0;
  const behEl = document.getElementById('std-profile-behavior');
  if (behEl) behEl.textContent = behScore;

  // 3. Attendance rate
  const sAttRecs = Object.entries(window.attData).filter(([k]) => k.startsWith(roomId + '_' + student.id + '_'));
  const sN = sAttRecs.length;
  const sP = sAttRecs.filter(([, v]) => v === 'P' || v === 'L').length;
  const attPct = sN > 0 ? Math.round((sP / sN) * 100) : 100;
  const attEl = document.getElementById('std-profile-att');
  if (attEl) attEl.textContent = `${attPct}%`;

  // Render first tab (or specified initial tab)
  window.switchStdProfileTab(initialTab || 'scores');

  // Open modal
  const modal = document.getElementById('student-profile-modal');
  if (modal) modal.classList.add('open');
};

window.switchStdProfileTab = function (tab) {
  const btnScores = document.getElementById('std-profile-tab-scores');
  const btnBehaviors = document.getElementById('std-profile-tab-behaviors');
  const btnAttendance = document.getElementById('std-profile-tab-attendance');
  const panelScores = document.getElementById('std-profile-panel-scores');
  const panelBehaviors = document.getElementById('std-profile-panel-behaviors');
  const panelAttendance = document.getElementById('std-profile-panel-attendance');

  if (!btnScores || !btnBehaviors || !panelScores || !panelBehaviors) return;

  btnScores.classList.remove('active');
  btnBehaviors.classList.remove('active');
  if (btnAttendance) btnAttendance.classList.remove('active');
  panelScores.style.display = 'none';
  panelBehaviors.style.display = 'none';
  if (panelAttendance) panelAttendance.style.display = 'none';

  if (tab === 'scores') {
    btnScores.classList.add('active');
    panelScores.style.display = '';
    window.renderStdProfileScores();
  } else if (tab === 'behaviors') {
    btnBehaviors.classList.add('active');
    panelBehaviors.style.display = '';
    window.renderStdProfileBehaviors();
  } else if (tab === 'attendance') {
    if (btnAttendance) btnAttendance.classList.add('active');
    if (panelAttendance) panelAttendance.style.display = '';
    window.renderStdProfileAttendance();
  }
};

window.renderStdProfileAttendance = function () {
  const panel = document.getElementById('std-profile-panel-attendance');
  if (!panel) return;

  const studentId = window._activeProfileStudentId;
  const roomId = window._activeProfileRoomId;

  // Filter window.attData entries for this student
  const prefix = `${roomId}_${studentId}_`;
  const records = [];

  Object.entries(window.attData).forEach(([key, val]) => {
    if (key.startsWith(prefix)) {
      const parts = key.split('_');
      const date = parts[2];
      const period = parts[3];
      const subject = parts.slice(4).join('_');
      records.push({ date, period, subject, status: val });
    }
  });

  // Sort by date descending, then period descending
  records.sort((a, b) => b.date.localeCompare(a.date) || (+b.period - +a.period));

  if (!records.length) {
    panel.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text3);font-size:13px;">📭 ยังไม่มีประวัติการมาเรียน</div>';
    return;
  }

  const statusCfg = {
    'P': { label: '✓ มาเรียน', bg: 'var(--green-light)', fg: 'var(--green)' },
    'L': { label: 'L มาสาย', bg: 'var(--amber-light)', fg: 'var(--amber)' },
    'A': { label: '✗ ขาดเรียน', bg: 'var(--red-light)', fg: 'var(--red)' },
    'E': { label: 'E ลา/ป่วย', bg: 'var(--teal-light)', fg: 'var(--teal)' }
  };

  panel.innerHTML = records.map(r => {
    const cfg = statusCfg[r.status] || { label: r.status, bg: 'var(--surface2)', fg: 'var(--text3)' };
    const dateLabel = r.date;
    const subLabel = r.subject === 'all' ? 'เช็กชื่อทั่วไป' : r.subject;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 13px;">
        <div>
          <div style="font-weight: 600; color: var(--text);">${subLabel}</div>
          <div style="font-size: 10px; color: var(--text3); margin-top: 2px;">วันที่ ${dateLabel} · คาบ ${r.period}</div>
        </div>
        <span style="font-weight: 800; background: ${cfg.bg}; color: ${cfg.fg}; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-family: Sarabun, sans-serif;">
          ${cfg.label}
        </span>
      </div>
    `;
  }).join('');
};

window.renderStdProfileScores = function () {
  const panel = document.getElementById('std-profile-panel-scores');
  if (!panel) return;

  const studentId = window._activeProfileStudentId;
  const roomId = window._activeProfileRoomId;

  // Find academic scores from work items
  const wItems = (window.workItems || []).filter(w => {
    return w.scores && w.scores[String(studentId)] !== undefined;
  });

  if (!wItems.length) {
    panel.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text3);font-size:13px;">📭 ยังไม่มีการบันทึกคะแนนเก็บรายวิชา</div>';
    return;
  }

  panel.innerHTML = wItems.map(w => {
    const earned = w.scores[String(studentId)];
    const max = w.maxScore || 10;
    const pct = max > 0 ? (earned / max) * 100 : 0;

    let col = 'var(--text)';
    if (pct >= 80) col = 'var(--green)';
    else if (pct >= 50) col = 'var(--amber)';
    else col = 'var(--red)';

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 13px;">
        <span style="font-weight: 500; color: var(--text2); display: flex; align-items: center; gap: 6px;">
          📝 ${window.esc(w.name)}
        </span>
        <span style="font-weight: 800; color: ${col}; font-family: monospace; font-size: 14px;">
          ${earned}/${max}
        </span>
      </div>
    `;
  }).join('');
};

window.renderStdProfileBehaviors = function () {
  const panel = document.getElementById('std-profile-panel-behaviors');
  if (!panel) return;

  const studentId = window._activeProfileStudentId;
  const currentTerm = window.activeSemesterFilter || '1';
  const logs = (window.behaviors || []).filter(b => b.sid === studentId && (currentTerm === 'all' || !b.term || b.term === 'all' || b.term === currentTerm)).reverse();

  if (!logs.length) {
    panel.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text3);font-size:13px;">📭 ยังไม่มีประวัติความประพฤติ</div>';
    return;
  }

  panel.innerHTML = logs.map(b => {
    const isPos = b.pts >= 0;
    const badgeBg = isPos ? 'var(--green-light)' : 'var(--red-light)';
    const badgeCol = isPos ? 'var(--green)' : 'var(--red)';
    const sign = isPos ? '+' : '';

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 13px;">
        <div>
          <div style="font-weight: 600; color: var(--text);">${window.esc(b.note)}</div>
          <div style="font-size: 10px; color: var(--text3); margin-top: 2px;">${b.date || ''} ${b.time || ''}</div>
        </div>
        <span style="font-weight: 800; background: ${badgeBg}; color: ${badgeCol}; padding: 3px 10px; border-radius: 8px; font-family: monospace; font-size: 13px;">
          ${sign}${b.pts}
        </span>
      </div>
    `;
  }).join('');
};

// ====== INDIVIDUAL STUDENT PROFILE PAGE ======
window.renderStudentProfilePage = function () {
  const roomSelect = document.getElementById('profile-page-room-select');
  const gridEl = document.getElementById('profile-page-grid');
  const emptyEl = document.getElementById('profile-page-empty');
  const searchInp = document.getElementById('profile-page-search');

  if (!roomSelect || !gridEl || !emptyEl) return;

  // 1. Populate room dropdown
  let options = '<option value="all">🌟 ทุกห้องเรียน</option>';
  options += (window.rooms || []).map(r => {
    return `<option value="${r.id}">ห้อง ${r.level}/${r.section}</option>`;
  }).join('');
  roomSelect.innerHTML = options;

  if (window.currentClass && (window.currentClass === 'all' || (window.rooms || []).some(r => r.id === window.currentClass))) {
    roomSelect.value = window.currentClass;
  } else {
    roomSelect.value = 'all';
  }

  const roomId = roomSelect.value;

  let students = [];
  if (roomId === 'all') {
    window.rooms.forEach(r => {
      const roomSts = (window.classData[r.id] || []).map(s => Object.assign({}, s, { roomName: `${r.level}/${r.section}`, roomId: r.id }));
      students = students.concat(roomSts);
    });
  } else {
    const r = window.rooms.find(x => x.id === roomId);
    const rName = r ? `${r.level}/${r.section}` : '';
    students = (window.classData[roomId] || []).map(s => Object.assign({}, s, { roomName: rName, roomId: roomId }));
  }

  const query = searchInp ? (searchInp.value || '').trim().toLowerCase() : '';

  // 2. Filter students by query
  let filtered = students;
  if (query) {
    filtered = students.filter(s => {
      const nameMatch = s.name.toLowerCase().includes(query);
      const idMatch = String(s.id).includes(query);
      const nickname = s.nickname || (s.health && s.health !== '-' ? s.health : '');
      const nickMatch = nickname ? nickname.toLowerCase().includes(query) : false;
      return nameMatch || idMatch || nickMatch;
    });
  }

  if (filtered.length === 0) {
    gridEl.innerHTML = '';
    gridEl.style.display = 'none';
    emptyEl.style.display = '';
    emptyEl.innerHTML = query ? '❌ ไม่พบรายชื่อนักเรียนที่ค้นหา' : '👤 ไม่มีข้อมูลนักเรียนในห้องเรียนนี้';
    return;
  }

  gridEl.style.display = 'grid';
  emptyEl.style.display = 'none';

  // 3. Render student cards in grid
  gridEl.innerHTML = filtered.map((s, si) => {
    // Nickname string
    const nickname = s.nickname || (s.health && s.health !== '-' ? s.health : '');
    const nickStr = nickname ? ` (${window.esc(nickname)})` : '';

    // Monster Evolution Data
    const score = s.behaviorScore !== undefined ? s.behaviorScore : 0;
    const monster = window.getStudentMonsterData(score);

    const targetRoomId = s.roomId || roomId;

    // GPA — Weighted average from reports formula: Σ(grade×credits) / Σcredits
    const _subIds = [...new Set(window.workItems.filter(w => w.roomId === targetRoomId).map(w => w.subjectId))];
    const currentTerm = window.activeSemesterFilter || '1';
    const _subs = _subIds.map(sid => window.subjects.find(sub => sub.id === sid))
      .filter(Boolean)
      .filter(x => currentTerm === 'all' || x.term === 'all' || x.term === currentTerm);
    let _sumW = 0, _sumCr = 0;
    _subs.forEach(sub => {
      const _items = window.workItems.filter(w => w.roomId === targetRoomId && w.subjectId === sub.id);
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
    const _gpa = _sumCr > 0 ? Math.round((_sumW / _sumCr) * 100) / 100 : null;
    const gpaVal = _gpa !== null ? _gpa.toFixed(2) : '—';
    const gpaColor = _gpa === null ? 'var(--text3)' : _gpa >= 3.5 ? 'var(--green)' : _gpa >= 2 ? 'var(--amber)' : 'var(--red)';

    // Behavior score
    const behScore = s.behaviorScore !== undefined ? s.behaviorScore : 0;
    let behBg = 'rgba(16, 185, 129, 0.08)';
    let behCol = 'var(--green)';
    if (behScore < 0) {
      behBg = 'rgba(239, 68, 68, 0.08)';
      behCol = 'var(--red)';
    } else if (behScore === 0) {
      behBg = 'var(--surface2)';
      behCol = 'var(--text2)';
    }

    // Attendance rate
    const sAttRecs = Object.entries(window.attData).filter(([k]) => k.startsWith(targetRoomId + '_' + s.id + '_'));
    const sN = sAttRecs.length;
    const sP = sAttRecs.filter(([, v]) => v === 'P' || v === 'L').length;
    const attPct = sN > 0 ? Math.round((sP / sN) * 100) : 100;

    let attCol = 'var(--green)';
    if (attPct < 80) {
      attCol = 'var(--red)';
    } else if (attPct < 90) {
      attCol = 'var(--amber)';
    }

    return `
      <div class="card profile-grid-card" onclick="window.openStudentProfileModal(${s.id})" 
           style="position: relative; padding: 24px 16px; border-radius: 16px; text-align: center; cursor: pointer; transition: all 0.2s ease-in-out; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; box-shadow: var(--shadow);"
           onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 24px rgba(0,0,0,0.15)';" 
           onmouseout="this.style.transform='none'; this.style.boxShadow='var(--shadow)';">
        <!-- Top right button -->
        <button class="btn btn-outline" style="position: absolute; top: 12px; right: 12px; font-size: 11px; padding: 3px 10px; border-radius: 8px; font-family: Sarabun, sans-serif; background: var(--surface); border: 1px solid var(--border); color: var(--text2); height: auto; z-index: 5;" 
                onclick="event.stopPropagation(); window.editStudent(${s.id})">แก้ไข</button>
        
        <!-- Avatar -->
        <div style="margin: 12px auto 16px auto; width: 76px; height: 76px; border-radius: 50%; background: ${monster.gradient}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.12); flex-shrink: 0;">
          <div style="width: 100%; height: 100%; transform: scale(${monster.scale * 0.95}); display: flex; align-items: center; justify-content: center;">
            ${monster.svg}
          </div>
        </div>
        
        <!-- Monster Level Info -->
        <div style="margin-bottom: 12px;">
          <span class="monster-level-badge" style="background: ${monster.badgeColor}; color: ${monster.textColor}; margin-top: 0;">
            Lv. ${monster.level} · ${monster.name}
          </span>
        </div>

        <!-- Name & ID -->
        <h3 style="font-size: 15px; font-weight: 800; margin: 0 0 6px 0; color: var(--text); line-height: 1.4;">${window.esc(s.name)}${nickStr}${roomId === 'all' && s.roomName ? ` <span class="badge badge-info" style="font-size:10px;padding:2px 6px;">${window.esc(s.roomName)}</span>` : ''}</h3>
        <p style="font-size: 11px; color: var(--text3); margin: 0 0 20px 0;">รหัสประจำตัว: ${s.id}</p>

        <div style="width: 100%; height: 1px; background: var(--border); margin-bottom: 16px;"></div>

        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center;">
          <div>
            <div style="font-size: 16px; font-weight: 800; color: ${gpaColor};">${gpaVal}</div>
            <div style="font-size: 9px; color: var(--text3); margin-top: 4px; font-weight: 600;">เกรดเฉลี่ย</div>
          </div>
          <div style="border-left: 1px solid var(--border); border-right: 1px solid var(--border);">
            <div style="display: inline-block; font-size: 13px; font-weight: 800; color: ${behCol}; background: ${behBg}; padding: 1px 8px; border-radius: 8px; font-family: monospace;">${behScore}</div>
            <div style="font-size: 9px; color: var(--text3); margin-top: 4px; font-weight: 600;">พฤติกรรม</div>
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: ${attCol};">${attPct}%</div>
            <div style="font-size: 9px; color: var(--text3); margin-top: 4px; font-weight: 600;">เวลาเรียน</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.onProfilePageRoomChange = function () {
  const val = document.getElementById('profile-page-room-select')?.value;
  if (val && window.currentClass !== val) {
    window.currentClass = val;
    if (window.updateTopbarClassBadge) window.updateTopbarClassBadge();
  }
  window.renderStudentProfilePage();
};

window.switchStdPageTab = function (tab) {
  window._pageProfileTab = tab;
  const btnScores = document.getElementById('std-page-tab-scores');
  const btnBehaviors = document.getElementById('std-page-tab-behaviors');
  const panelScores = document.getElementById('std-page-panel-scores');
  const panelBehaviors = document.getElementById('std-page-panel-behaviors');

  if (!btnScores || !btnBehaviors || !panelScores || !panelBehaviors) return;

  btnScores.classList.remove('active');
  btnBehaviors.classList.remove('active');
  panelScores.style.display = 'none';
  panelBehaviors.style.display = 'none';

  if (tab === 'scores') {
    btnScores.classList.add('active');
    panelScores.style.display = '';
    window.renderStdPageScores();
  } else {
    btnBehaviors.classList.add('active');
    panelBehaviors.style.display = '';
    window.renderStdPageBehaviors();
  }
};

window.renderStdPageScores = function () {
  const panel = document.getElementById('std-page-panel-scores');
  const stdSelect = document.getElementById('profile-page-student-select');
  if (!panel || !stdSelect) return;

  const studentId = stdSelect.value;
  if (!studentId) return;

  // Find academic scores from work items
  const wItems = (window.workItems || []).filter(w => {
    return w.scores && w.scores[String(studentId)] !== undefined;
  });

  if (!wItems.length) {
    panel.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);font-size:14px;">📭 ยังไม่มีการบันทึกคะแนนเก็บรายวิชา</div>';
    return;
  }

  panel.innerHTML = wItems.map(w => {
    const earned = w.scores[String(studentId)];
    const max = w.maxScore || 10;
    const pct = max > 0 ? (earned / max) * 100 : 0;

    let col = 'var(--text)';
    if (pct >= 80) col = 'var(--green)';
    else if (pct >= 50) col = 'var(--amber)';
    else col = 'var(--red)';

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; border-bottom: 1px solid var(--border); font-size: 14px;">
        <span style="font-weight: 500; color: var(--text2); display: flex; align-items: center; gap: 8px;">
          📝 ${window.esc(w.name)}
        </span>
        <span style="font-weight: 800; color: ${col}; font-family: monospace; font-size: 15px;">
          ${earned}/${max}
        </span>
      </div>
    `;
  }).join('');
};

window.renderStdPageBehaviors = function () {
  const panel = document.getElementById('std-page-panel-behaviors');
  const stdSelect = document.getElementById('profile-page-student-select');
  if (!panel || !stdSelect) return;

  const studentId = parseInt(stdSelect.value);
  if (isNaN(studentId)) return;

  const currentTerm = window.activeSemesterFilter || '1';
  const logs = (window.behaviors || []).filter(b => b.sid === studentId && (currentTerm === 'all' || !b.term || b.term === 'all' || b.term === currentTerm)).reverse();

  if (!logs.length) {
    panel.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);font-size:14px;">📭 ยังไม่มีประวัติความประพฤติ</div>';
    return;
  }

  panel.innerHTML = logs.map(b => {
    const isPos = b.pts >= 0;
    const badgeBg = isPos ? 'var(--green-light)' : 'var(--red-light)';
    const badgeCol = isPos ? 'var(--green)' : 'var(--red)';
    const sign = isPos ? '+' : '';

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; border-bottom: 1px solid var(--border); font-size: 14px;">
        <div>
          <div style="font-weight: 600; color: var(--text);">${window.esc(b.note)}</div>
          <div style="font-size: 11px; color: var(--text3); margin-top: 4px;">${b.date || ''} ${b.time || ''}</div>
        </div>
        <span style="font-weight: 800; background: ${badgeBg}; color: ${badgeCol}; padding: 4px 12px; border-radius: 8px; font-family: monospace; font-size: 14px;">
          ${sign}${b.pts}
        </span>
      </div>
    `;
  }).join('');
};

