// ====== ATTENDANCE: CORE DATA LAYER ======
// เก็บ/อ่านสถานะการเช็คชื่อ (localStorage-backed) + ค่าคงที่ที่ใช้ร่วมกันในไฟล์ attendance-*.js อื่น ๆ
// + ฟังก์ชันบันทึก/ลบข้อมูลการเช็คชื่อ
// แยกออกมาจาก attendance.js เดิม (2,188 บรรทัด) เพื่อให้ไฟล์เล็กลงและดูแลง่ายขึ้น
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

const ATT_DAY_NAMES=['','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์'];

const ATT_STATUS_CFG=[
  {k:'P',label:'✓ มาเรียน',bg:'var(--green-light)',fg:'var(--green)',short:'✓'},
  {k:'L',label:'L มาสาย',bg:'var(--amber-light)',fg:'var(--amber)',short:'L'},
  {k:'A',label:'✗ ขาด',bg:'var(--red-light)',fg:'var(--red)',short:'✗'},
  {k:'E',label:'E ลา/ป่วย',bg:'var(--teal-light)',fg:'var(--teal)',short:'E'},
];

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
    ? `ห้อง ${window.esc(window.rooms.find(r=>r.id===roomId)?.level || roomId)}` 
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
