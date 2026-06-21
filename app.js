// ====== EARLY GLOBAL DECLARATIONS ======
window._sumTab = 'subject';
window._sumView = 'list';
window._sumSubjectId = '';
window._sumRoomId = '';
window._sumView2 = 'overview';
window.GS_URL = ''; // Google Sheets database connection disabled for Local Trial Preview
window.syncInProgress = false;

// ====== ACADEMIC YEAR & SEMESTER STATE ======
window.currentSemesterId = localStorage.getItem('cls_current_semester_id') || '';
window.semesters = JSON.parse(localStorage.getItem('cls_semesters') || '[]');
window.trashSemesters = JSON.parse(localStorage.getItem('cls_trash_semesters') || '[]');

// ====== DATA ======
window.currentClass = 'm32';
window.classNames = {m31:'ม.3/1',m32:'ม.3/2',m33:'ม.3/3',m41:'ม.4/1',m42:'ม.4/2'};

// Per-class student data
window.classData = {
  m31: [],
  m32: [
    {id:1,no:1,name:'เด็กชายสมชาย ใจดี',gender:'ชาย',dob:'2010-05-12',phone:'081-234-5678',addr:'กรุงเทพ',health:'ใส',scores:{work:72,mid:68,final:75,behavior:100},behaviorScore:100},
    {id:2,no:2,name:'เด็กหญิงสมหญิง สวยงาม',gender:'หญิง',dob:'2010-03-22',phone:'082-345-6789',addr:'นนทบุรี',health:'ส้ม',scores:{work:85,mid:82,final:80,behavior:100},behaviorScore:100},
    {id:3,no:3,name:'เด็กชายวีระ กล้าหาญ',gender:'ชาย',dob:'2010-07-01',phone:'083-456-7890',addr:'สมุทรปราการ',health:'วี',scores:{work:60,mid:55,final:58,behavior:90},behaviorScore:90},
    {id:4,no:4,name:'เด็กหญิงมาลี ดีใจ',gender:'หญิง',dob:'2010-11-15',phone:'084-567-8901',addr:'ปทุมธานี',health:'มด',scores:{work:90,mid:88,final:92,behavior:100},behaviorScore:100},
    {id:5,no:5,name:'เด็กชายประยุทธ์ ศรีสุข',gender:'ชาย',dob:'2010-09-08',phone:'085-678-9012',addr:'กรุงเทพ',health:'ตู่',scores:{work:45,mid:40,final:42,behavior:80},behaviorScore:80},
  ],
  m33: [], m41: [], m42: []
};
window.nextId = 10;

// Period settings (7 periods default)
window.periodConfig = [
  {no:1,start:'08:00',end:'09:00'},{no:2,start:'09:00',end:'10:00'},
  {no:3,start:'10:00',end:'11:00'},{no:4,start:'11:00',end:'12:00'},
  {no:5,start:'13:00',end:'14:00'},{no:6,start:'14:00',end:'15:00'},
  {no:7,start:'15:00',end:'16:00'},
];

// ====== CLASSROOM MANAGEMENT DATA ======
window.rooms = [
  {id:'m31',level:'ม.3',section:'1',year:'2568',semester:'1',teacher:'ครูสมศรี',note:''},
  {id:'m32',level:'ม.3',section:'2',year:'2568',semester:'1',teacher:'ครูวิภา',note:''},
  {id:'m33',level:'ม.3',section:'3',year:'2568',semester:'1',teacher:'ครูมานะ',note:''},
  {id:'m41',level:'ม.4',section:'1',year:'2568',semester:'1',teacher:'ครูสุรชัย',note:''},
  {id:'m42',level:'ม.4',section:'2',year:'2568',semester:'1',teacher:'ครูพิมพ์',note:''},
];
window.subjects = [
  {id:'s1',name:'ภาษาไทย',code:'THAI301',credits:1.5,teacher:'ครูวิภา',rooms:['m31','m32','m33'],note:''},
  {id:'s2',name:'คณิตศาสตร์',code:'MATH301',credits:2,teacher:'ครูมานะ',rooms:['m31','m32','m33'],note:''},
  {id:'s3',name:'วิทยาศาสตร์',code:'SCI301',credits:1.5,teacher:'ครูสมศรี',rooms:['m31','m32','m33'],note:''},
  {id:'s4',name:'ภาษาอังกฤษ',code:'ENG301',credits:2,teacher:'ครูสุรชัย',rooms:['m31','m32','m33'],note:''},
  {id:'s5',name:'สังคมศึกษา',code:'SOC301',credits:1,teacher:'ครูพิมพ์',rooms:['m32'],note:''},
  {id:'s6',name:'ฟิสิกส์',code:'PHY401',credits:2,teacher:'ครูมานะ',rooms:['m41','m42'],note:''},
  {id:'s7',name:'เคมี',code:'CHEM401',credits:2,teacher:'ครูสมศรี',rooms:['m41','m42'],note:''},
];
window.schedules = [
  {id:'sc1',roomId:'m32',subjectId:'s1',day:'1',period:'1',start:'08:00',end:'09:00',loc:'ห้อง 302'},
  {id:'sc2',roomId:'m32',subjectId:'s2',day:'1',period:'2',start:'09:00',end:'10:00',loc:'ห้อง 302'},
  {id:'sc3',roomId:'m32',subjectId:'s3',day:'2',period:'1',start:'08:00',end:'09:00',loc:'ห้องแล็บ 1'},
  {id:'sc4',roomId:'m32',subjectId:'s4',day:'3',period:'3',start:'10:00',end:'11:00',loc:'ห้อง 302'},
];
window.nextRoomId = 100;
window.nextSubjId = 100;
window.nextSchedId = 100;
window.crTab = 'rooms';

// Subjects per class
window.classSubjects = {
  m31:['ภาษาไทย','คณิตศาสตร์','วิทยาศาสตร์','ภาษาอังกฤษ'],
  m32:['ภาษาไทย','คณิตศาสตร์','วิทยาศาสตร์','ภาษาอังกฤษ','สังคมศึกษา','ศิลปะ','พลศึกษา'],
  m33:['ภาษาไทย','คณิตศาสตร์','วิทยาศาสตร์','ภาษาอังกฤษ'],
  m41:['ภาษาไทย','คณิตศาสตร์','ฟิสิกส์','เคมี','ชีววิทยา','ภาษาอังกฤษ'],
  m42:['ภาษาไทย','คณิตศาสตร์','ฟิสิกส์','เคมี','ชีววิทยา','ภาษาอังกฤษ'],
};

// Attendance: key = classId_studentId_date_period_subject => status
window.attData = {};

window.behaviors = [];
window.assignments = [];
// workItems: {id, name, phase, maxScore, due, type, note, roomId, subjectId, scores:{studentId: score}}
// phase: 'pre' | 'mid-exam' | 'post' | 'final'
window.workItems = [];
window._workPhase = 'pre'; // current phase tab
window.materials = [];
window.messages = [
  {from:'ผปค.สมชาย',to:'ครู',subject:'สอบถามผลการเรียน',body:'สวัสดีครับ อยากทราบผลการเรียนของน้องสมชาย',time:'09:30',unread:true},
  {from:'ผู้บริหาร',to:'ครู',subject:'ประชุมประจำเดือน',body:'ขอเชิญเข้าร่วมประชุม วันศุกร์ 13.00 น.',time:'08:15',unread:false},
];
window.weights = {w1:30,w2:30,w3:30,w4:10};
window.academicYear = '2569';
window.semester = '1';
window.semesterDates = null;
window.teacherName = 'Kosit Singchoo';
window.teacherRank = 'ครูผู้ช่วย';
window.teacherSubjectGroup = 'คณิตศาสตร์';
window.schoolName = 'โรงเรียนบ้านหนองสระพังโนนสะอาด';
window.areaOffice = 'ขอนแก่น เขต 1';
window.province = 'ขอนแก่น';
window.directorName = '';
window.academicHeadName = '';
window.registrarName = '';
window.gradeThresholds = { g4: 80, g35: 75, g3: 70, g25: 65, g2: 60, g15: 55, g1: 50, g0: 0 };
window.activeSubjectTab = {assignments:null, materials:null, scores:null};

// ====== HELPERS ======
window.getStudents = function() { return window.classData[window.currentClass]||[]; }
window.getSubjects = function() { return window.classSubjects[window.currentClass]||[]; }

// Resolve subject by id OR name
window.resolveSubject = function(sid){
  if(!sid)return null;
  // Try by id first
  let s=window.subjects.find(x=>x.id===sid);
  if(s)return s;
  // Try by name (for legacy/dnd-created schedules)
  s=window.subjects.find(x=>x.name===sid);
  return s||null;
}

window.resolveSubjectName = function(sid){
  const s=window.resolveSubject(sid);
  return s?s.name:(sid||'?');
}

window.getGrade = function(score) {
  const g = window.gradeThresholds;
  const g4 = g.g4 !== undefined ? g.g4 : 80;
  const g35 = g.g35 !== undefined ? g.g35 : 75;
  const g3 = g.g3 !== undefined ? g.g3 : 70;
  const g25 = g.g25 !== undefined ? g.g25 : 65;
  const g2 = g.g2 !== undefined ? g.g2 : 60;
  const g15 = g.g15 !== undefined ? g.g15 : 55;
  const g1 = g.g1 !== undefined ? g.g1 : 50;
  
  if(score>=g4)return'4';
  if(score>=g35)return'3.5';
  if(score>=g3)return'3';
  if(score>=g25)return'2.5';
  if(score>=g2)return'2';
  if(score>=g15)return'1.5';
  if(score>=g1)return'1';
  return '0';
}

window.syncGradeThresholds = function(){
  const keys = ['g4','g35','g3','g25','g2','g15','g1','g0'];
  keys.forEach(k=>{
    const el=document.getElementById('sys-grade-'+k.replace('g',''));
    if(el) window.gradeThresholds[k] = parseFloat(el.value) || 0;
  });
}

window.calcTotal = function(s){
  const w=window.weights;
  const academicSum=w.w1+w.w2+w.w3;
  if(academicSum===0) return 0;
  return Math.round(((s.scores.work*(w.w1/academicSum))+(s.scores.mid*(w.w2/academicSum))+(s.scores.final*(w.w3/academicSum)))*10)/10;
}

window.initials = function(name){
  const p=name.replace(/เด็กชาย|เด็กหญิง/g,'').trim().split(' ');
  return(p[0]?.[0]||'')+(p[1]?.[0]||'');
}

// safeSetText: set textContent of an element by id
window.safeSetText = function(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(val);
};

window.avColors = ['av-p','av-t','av-a','av-c'];
window.avColor = function(i){return window.avColors[i%4];}

window.toast = function(msg){
  const t=document.getElementById('toast');
  if(t) {
    t.textContent=msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),2300);
  }
}

window.today = function(){return new Date().toISOString().split('T')[0];}
window.closeModal = function(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('open');
}

// ====== NAVIGATION ======
window.pageTitles = {
  'setup-rooms':'ห้องเรียน & นักเรียน',
  'setup-subjects':'จัดการรายวิชา',
  'setup-schedule':'ตารางเรียน',
  'setup-settings':'การตั้งค่าระบบและความจำ',
  attendance:'การเช็กชื่อ',
  behavior:'บันทึกพฤติกรรม',
  'att-summary':'สรุปการเรียน',
  'student-profile-page':'ข้อมูลรายบุคคล',
  teaching:'งาน & คะแนนเก็บ',
  materials:'สื่อ & เนื้อหา',
  assessment:'คะแนน & เกรด',
  report:'รายงานผล',
  dashboard:'Dashboard',
  'report-export':'รายงานผลและส่งออก',
  'live-mode':'โหมดสอนสด'
};
window.currentPanel = 'students';

window.toggleSidebar = function(forceState) {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;
  
  let show = forceState;
  if (show === undefined) {
    show = !sidebar.classList.contains('show');
  }
  
  if (show) {
    sidebar.classList.add('show');
    if (overlay) overlay.classList.add('show');
  } else {
    sidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
  }
};

window.goto = function(page){
  // Close sidebar on navigation on mobile viewports
  window.toggleSidebar(false);

  if(page==='att-summary'){
    window.goto('attendance');
    window.switchSummaryTab('summary');
    return;
  }

  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  
  const targetPanel = document.getElementById('panel-'+page);
  if(targetPanel) targetPanel.classList.add('active');
  
  document.querySelectorAll('.nav-item').forEach(n=>{
    if(n.getAttribute('onclick')===`goto('${page}')`) n.classList.add('active');
  });
  
  const pt = document.getElementById('page-title');
  if(pt) pt.textContent=window.pageTitles[page]||page;
  
  window.currentPanel=page;
  window.renderPanel(page);
  window.renderTopbarActions(page);

  // Update bottom navigation active tab highlight
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.classList.remove('active');
    const onclickAttr = btn.getAttribute('onclick');
    if (onclickAttr && onclickAttr.includes(`'${page}'`)) {
      btn.classList.add('active');
    }
  });
}

window.renderTopbarActions = function(page){
  const el=document.getElementById('topbar-actions');
  if(!el) return;
  if(page==='setup-rooms') {
    el.innerHTML=`<button class="btn btn-outline btn-sm" onclick="window.openImportModal()"><span style="margin-right:4px">📂</span> นำเข้าข้อมูล</button><button class="btn btn-outline btn-sm" onclick="exportStudentCSV()"><span style="margin-right:4px">⬆</span> ส่งออก</button><button class="btn btn-primary btn-sm" onclick="openAddModal()">+ เพิ่มนักเรียน</button>`;
  } else if(page==='setup-settings') {
    el.innerHTML = `
      <span class="badge badge-info" style="font-size:12px; padding:6px 12px; border-radius:20px; font-weight:600; background:var(--accent-light); color:var(--accent)">
        ปีการศึกษา ${window.academicYear}
      </span>
    `;
  } else {
    el.innerHTML='';
  }
}

window.renderPanel = function(p){
  if(p==='setup-rooms'){window.renderSetupRooms();}
  else if(p==='setup-subjects'){
    window.populateSubjRooms();
    window.renderSubjectList();
    if(window.populateSchedDropdowns) window.populateSchedDropdowns();
    if(window.renderDndBuilder) window.renderDndBuilder();
  }
  else if(p==='setup-settings'){
    if(window.renderSetupSettings) window.renderSetupSettings();
  }
  else if(p==='attendance'){window.renderAttendanceSubjectSelect();}
  else if(p==='att-summary'){window.renderAttSummaryPage();}
  else if(p==='student-profile-page'){if(window.renderStudentProfilePage) window.renderStudentProfilePage();}
  else if(p==='classrooms'){window.renderSetupRooms();}
  else if(p==='scores'){window.renderPanel('assessment');}
  else if(p==='grades'){window.renderPanel('assessment');window.switchAsmntTab('grades');}
  else if(p==='behavior')window.renderBehaviorPanel();
  else if(p==='teaching'){window.renderTeaching();}
  else if(p==='materials'){window.populateMatDropdowns();window.renderMaterials2();}
  else if(p==='assessment'){window.populateAsmntDropdowns();window.renderAssessment();}
  else if(p==='report'){window.populateReportRoom();window.renderReport();}
  else if(p==='dashboard')window.renderDashboard();
  else if(p==='report-export'){if(window.renderReportExport) window.renderReportExport();}
  else if(p==='live-mode'){if(window.renderLiveMode) window.renderLiveMode();}
}

// ====== CLASS SWITCH ======
window.switchClass = function(val){
  window.currentClass=val;
  const r=window.rooms.find(x=>x.id===val);
  const label=r?`${r.level}/${r.section}`:(val||'');
  const titleEl=document.getElementById('student-card-title');
  if(titleEl)titleEl.textContent='รายชื่อนักเรียน '+label;
  
  const sel=document.getElementById('class-select');
  if(sel&&sel.value!==val)sel.value=val;
  if(window.currentPanel==='setup-rooms') window.renderSetupRooms();
  else window.renderPanel(window.currentPanel);
  if(r) window.toast('เปลี่ยนห้องเรียนเป็น '+label);
}

// ====== SYNC / GOOGLE SHEETS ======
window.gsCall = async function(url, action, params={}, body={}){
  const qs=new URLSearchParams({action,...params}).toString();
  const res=await fetch(url+'?'+qs,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  if(!res.ok) throw new Error('HTTP '+res.status);
  return res.json();
}

window.pushSheet = async function(sheetName, rows){
  if(!window.GS_URL) return;
  try{
    window.updateSyncStatus('syncing','กำลังบันทึก '+sheetName+'...');
    await window.gsCall(window.GS_URL,'batchUpsert',{sheet:sheetName},{data:rows});
    const now=new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
    const el=document.getElementById('sync-time');
    if(el) el.textContent='บันทึกล่าสุด '+now;
    window.updateSyncStatus('connected','เชื่อมต่อแล้ว');
  }catch(e){
    window.updateSyncStatus('error','บันทึกไม่สำเร็จ');
    throw e;
  }
}

window.pullSheet = async function(sheetName){
  if(!window.GS_URL) return [];
  try{
    const res=await window.gsCall(window.GS_URL,'getSheet',{sheet:sheetName});
    return res.data||[];
  }catch(e){
    console.warn('pullSheet',sheetName,e.message);
    return [];
  }
}

window.pushRooms = async function(){
  if(!window.GS_URL){ window.showSyncToast('💾 บันทึกในเครื่องแล้ว'); return; }
  window.snapshotVersion('แก้ไขห้องเรียน');
  await window.pushSheet('rooms', window.rooms);
  window.showSyncToast('💾 บันทึกห้องเรียนแล้ว');
}

window.pushStudents = async function(roomId){
  if(!window.GS_URL){ window.showSyncToast('💾 บันทึกในเครื่องแล้ว'); return; }
  window.snapshotVersion('แก้ไขข้อมูลนักเรียน');
  const sts=(window.classData[roomId]||[]).map(s=>({
    id:s.id, roomId,
    no:s.no, name:s.name, gender:s.gender, dob:s.dob||'',
    phone:s.phone||'', addr:s.addr||'', health:s.health||'-',
    behaviorScore:s.behaviorScore||100,
    scoreWork:s.scores?.work||0, scoreMid:s.scores?.mid||0, scoreFinal:s.scores?.final||0
  }));
  await window.pushSheet('students', sts);
  window.showSyncToast('💾 บันทึกนักเรียนแล้ว');
}

window.pushSubjects = async function(){
  if(!window.GS_URL){ window.showSyncToast('💾 บันทึกในเครื่องแล้ว'); return; }
  window.snapshotVersion('แก้ไขรายวิชา');
  await window.pushSheet('subjects', window.subjects.map(s=>({...s,rooms:(s.rooms||[]).join(',')})));
  window.showSyncToast('💾 บันทึกรายวิชาแล้ว');
}

window.pushSchedules = async function(){
  if(!window.GS_URL){ window.showSyncToast('💾 บันทึกในเครื่องแล้ว'); return; }
  window.snapshotVersion('แก้ไขตารางเรียน');
  await window.pushSheet('schedules', window.schedules);
  window.showSyncToast('💾 บันทึกตารางแล้ว');
}

window.pushAttendance = function(key,status,roomId,studentId,date,period,subject){
  if(!window.GS_URL) return;
  window.pushSheet('attendance',[{key,status,roomId,studentId,date,period,subject}]).catch(()=>{});
}

window.pushBehavior = function(rec){
  if(!window.GS_URL) return;
  window.pushSheet('behaviors',[rec]).catch(()=>{});
}

window.syncAll = async function(){
  if(window.syncInProgress){window.toast('⏳ กำลังซิงค์อยู่...');return;}
  if(!window.GS_URL){window.openSyncSettings();return;}
  window.syncInProgress=true;
  window.updateSyncStatus('syncing','กำลังโหลดข้อมูล...');
  try{
    const remoteRooms=await window.pullSheet('rooms').catch(()=>[]);
    if(remoteRooms.length){
      window.rooms=remoteRooms;
    }
    const remoteStudents=await window.pullSheet('students').catch(()=>[]);
    if(remoteStudents.length){
      window.rooms.forEach(r=>window.classData[r.id]=[]);
      remoteStudents.forEach(s=>{
        if(!window.classData[s.roomId]) window.classData[s.roomId]=[];
        window.classData[s.roomId].push({
          id:+s.id,no:+s.no,name:s.name||'',gender:s.gender||'ชาย',
          dob:s.dob||'',phone:s.phone||'',addr:s.addr||'',health:s.health||'-',
          behaviorScore:+s.behaviorScore||100,
          scores:{work:+s.scoreWork||0,mid:+s.scoreMid||0,final:+s.scoreFinal||0,behavior:100}
        });
      });
    }
    const remoteSubjects=await window.pullSheet('subjects').catch(()=>[]);
    if(remoteSubjects.length){
      window.subjects=remoteSubjects.map(s=>({...s,rooms:(s.rooms||'').split(',').filter(Boolean)}));
    }
    const remoteSchedules=await window.pullSheet('schedules').catch(()=>[]);
    if(remoteSchedules.length) window.schedules=remoteSchedules;
    const remoteAtt=await window.pullSheet('attendance').catch(()=>[]);
    remoteAtt.forEach(r=>{ if(r.key&&r.status) window.attData[r.key]=r.status; });
    const remoteBeh=await window.pullSheet('behaviors').catch(()=>[]);
    if(remoteBeh.length) window.behaviors=remoteBeh;

    window.syncSubjectsToClassSubjects();
    window.rebuildClassSelector();
    window.renderPanel(window.currentPanel);
    window.updateSyncStatus('connected','เชื่อมต่อแล้ว — ซิงค์สำเร็จ');
    window.toast('✅ โหลดข้อมูลจาก Google Sheets สำเร็จ');
  }catch(e){
    window.updateSyncStatus('error','ซิงค์ไม่สำเร็จ: '+e.message);
    window.toast('❌ ซิงค์ไม่สำเร็จ: '+e.message);
  }finally{
    window.syncInProgress=false;
  }
}

window.updateSyncStatus = function(state, msg){
  const dot=document.getElementById('sync-dot');
  const lbl=document.getElementById('sync-label');
  if(dot){
    dot.className='sync-dot '+(state==='connected'?'connected':state==='syncing'?'syncing':'disconnected');
  }
  if(lbl) lbl.textContent=msg||'';
}

window.openSyncSettings = function(){
  const el = document.getElementById('sync-modal');
  if(el) el.classList.add('open');
}

window.saveGsUrl = function(){
  const url=(document.getElementById('gs-url-input')?.value||'').trim();
  if(!url){window.toast('⚠️ กรอก URL ก่อน');return;}
  window.GS_URL=url;
  localStorage.setItem('gs_url',url);
  const syncBtn=document.getElementById('sync-btn');
  if(syncBtn) syncBtn.style.display='';
  window.updateSyncStatus('connected','เชื่อมต่อแล้ว — กด ซิงค์ทั้งหมด เพื่อโหลดข้อมูล');
  window.closeModal('sync-modal');
  window.toast('✅ บันทึก URL แล้ว');
}

// ====== VERSION HISTORY ======
const VERSION_KEY = 'cls_versions';
const MAX_VERSIONS = 100;

window.getVersions = function(){
  try{
    const v = JSON.parse(localStorage.getItem(VERSION_KEY)||'[]');
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    // Keep versions within 7 days, OR always preserve at least the 3 most recent versions
    const filtered = v.filter((x, idx) => x.ts >= oneWeekAgo || idx < 3);
    if (filtered.length !== v.length) {
      window.saveVersions(filtered);
    }
    return filtered;
  }
  catch{ return []; }
}
window.saveVersions = function(v){ localStorage.setItem(VERSION_KEY, JSON.stringify(v)); }

window.snapshotVersion = function(action){
  try{
    const snap={
      ts:Date.now(), label:action||'บันทึก',
      dateStr:new Date().toLocaleString('th-TH',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),
      data:{
        rooms:JSON.parse(JSON.stringify(window.rooms)),
        classData:JSON.parse(JSON.stringify(window.classData)),
        subjects:JSON.parse(JSON.stringify(window.subjects)),
        schedules:JSON.parse(JSON.stringify(window.schedules)),
        behaviors:JSON.parse(JSON.stringify(window.behaviors)),
        assignments:JSON.parse(JSON.stringify(window.assignments||[])),
        attData:JSON.parse(JSON.stringify(window.attData)),
      }
    };
    const v=window.getVersions();
    if (window.historyIndex > 0) {
      v.splice(0, window.historyIndex);
      window.historyIndex = 0;
    }
    v.unshift(snap);
    
    // Enforce 1-week limit while preserving at least the 3 most recent versions
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let filtered = v.filter((x, idx) => x.ts >= oneWeekAgo || idx < 3);
    if (filtered.length > MAX_VERSIONS) filtered.length = MAX_VERSIONS;
    
    window.saveVersions(filtered); window.updateVersionBadge(filtered.length);
    if (window.renderSettingsVersions) window.renderSettingsVersions();
    window.updateUndoRedoButtons();
    const sb=document.getElementById('save-all-btn');
    if(sb&&!sb.disabled){
      sb.style.background='var(--green)';
      setTimeout(function(){if(sb)sb.style.background='var(--accent)';},400);
    }
    window.autoSaveToLocalStorage();
  }catch(e){}
}

window.updateVersionBadge = function(n){
  const el=document.getElementById('version-count');
  if(!el)return;
  el.textContent=n; el.style.display=n>0?'':'none';
}

window.openVersionHistory = function(){
  const vers=window.getVersions();
  const el=document.getElementById('version-list');
  if(!el){ document.getElementById('version-modal').classList.add('open'); return; }
  el.innerHTML=vers.length?vers.map(function(v,i){
    return '<div class="version-card '+(i===0?'current':'')+'"><div style="display:flex;align-items:center;gap:10px">'
      +'<div style="flex:1"><div style="font-size:14px;font-weight:700">'+v.label+(i===0?' <span style="font-size:11px;background:var(--accent);color:#fff;padding:1px 8px;border-radius:8px">ล่าสุด</span>':'')+'</div>'
      +'<div style="font-size:12px;color:var(--text3)">'+v.dateStr+'</div>'
      +'<div style="font-size:11px;color:var(--text3)">'+v.data.rooms.length+' ห้อง · '+Object.values(v.data.classData).flat().length+' นักเรียน</div>'
      +'</div><div>'+(i===0?'<span style="font-size:11px;color:var(--accent)">ปัจจุบัน</span>'
        :'<button onclick="restoreVersion('+i+')" class="btn btn-outline btn-sm" style="font-size:11px">↩ ย้อนกลับ</button>')
      +'</div></div></div>';
  }).join(''):'<div style="text-align:center;padding:32px;color:var(--text3)">📭 ยังไม่มีประวัติ</div>';
  document.getElementById('version-modal').classList.add('open');
}

window.restoreVersion = function(idx){
  const v=window.getVersions()[idx]; if(!v)return;
  if(!confirm('ย้อนกลับไป "'+v.label+'"?')) return;
  window.snapshotVersion('ก่อนย้อนกลับ');
  window.rooms=v.data.rooms; Object.assign(window.classData,v.data.classData);
  window.subjects=v.data.subjects; window.schedules=v.data.schedules;
  window.behaviors=v.data.behaviors;
  if(v.data.assignments) window.assignments=v.data.assignments;
  Object.assign(window.attData,v.data.attData);
  window.syncSubjectsToClassSubjects(); window.rebuildClassSelector();
  window.renderPanel(window.currentPanel); window.closeModal('version-modal');
  window.toast('↩ ย้อนกลับสำเร็จ');
}

window.pushAllToSheets = async function(){
  if(!window.GS_URL)return;
  window.showSyncProgress('กำลังบันทึก...');
  try{
    await window.pushRooms();
    for(const rid of window.rooms.map(r=>r.id)) await window.pushStudents(rid);
    await window.pushSubjects(); await window.pushSchedules();
    window.hideSyncProgress(); window.toast('✅ บันทึกสำเร็จ');
  }catch(e){ window.hideSyncProgress(); window.toast('❌ '+e.message); }
}

window._syncProgressEl=null;
window.showSyncProgress = function(msg){
  if(window._syncProgressEl){window._syncProgressEl.querySelector('span').textContent=msg;return;}
  window._syncProgressEl=document.createElement('div');
  window._syncProgressEl.className='sync-progress';
  window._syncProgressEl.innerHTML='<div style="width:14px;height:14px;border:2px solid var(--accent);border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite"></div><span>'+msg+'</span>';
  document.body.appendChild(window._syncProgressEl);
}

window.hideSyncProgress = function(){if(window._syncProgressEl){window._syncProgressEl.remove();window._syncProgressEl=null;}}

window.showSyncToast = function(msg){
  const t=document.createElement('div'); t.className='sync-progress';
  t.innerHTML='<span style="color:var(--green)">✅</span><span>'+(msg||'บันทึกแล้ว')+'</span>';
  document.body.appendChild(t); setTimeout(function(){t.remove();},2200);
}

window.saveCurrentPage = async function(){
  const btn=document.getElementById('save-all-btn');
  if(btn){btn.textContent='⏳...';btn.style.opacity='.7';btn.disabled=true;}
  try{
    const panelTitle = window.pageTitles[window.currentPanel] || window.currentPanel || 'บันทึก';
    window.snapshotVersion('บันทึกหน้า ' + panelTitle);

    switch(window.currentPanel){
      case 'setup-rooms': window.pushStudents(window.currentClass); window.pushRooms(); window.toast('💾 บันทึกแล้ว'); break;
      case 'setup-subjects': window.pushSubjects(); if(window.saveDndTeacherSchedule) window.saveDndTeacherSchedule(); window.toast('💾 บันทึกแล้ว'); break;
      case 'attendance': window.toast('💾 บันทึกในเครื่องแล้ว'); break; // auto saved
      case 'behavior': window.pushStudents(window.currentClass); window.toast('💾 บันทึกแล้ว'); break;
      case 'assessment': if (window.saveAllScores) window.saveAllScores(); break;
      case 'teaching': if (window.saveWorkScores) window.saveWorkScores(); break;
      default: if(window.GS_URL)await window.pushAllToSheets(); else window.toast('💾 บันทึกในเครื่องแล้ว'); break;
    }
  }catch(e){window.toast('❌ '+e.message);}
  setTimeout(function(){if(btn){btn.textContent='💾 บันทึก';btn.style.opacity='1';btn.disabled=false;}},800);
}

if(!document.getElementById('spin-style')){
  const s=document.createElement('style');s.id='spin-style';
  s.textContent='@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(s);
}

// ====== DATA BACKUP & RESTORE ======
const DATA_SCHEMA_VERSION='2.0';
let LS_AUTO_KEY = window.currentSemesterId ? 'cls_autosave_' + window.currentSemesterId : 'cls_autosave';

window.collectAllData = function(){
  return{
    _schema:DATA_SCHEMA_VERSION, _exportedAt:new Date().toISOString(),
    _exportedBy:'Classroom Management System',
    rooms:JSON.parse(JSON.stringify(window.rooms)),
    classData:JSON.parse(JSON.stringify(window.classData)),
    subjects:JSON.parse(JSON.stringify(window.subjects)),
    schedules:JSON.parse(JSON.stringify(window.schedules)),
    attData:JSON.parse(JSON.stringify(window.attData)),
    periodConfig:JSON.parse(JSON.stringify(window.periodConfig)),
    behaviors:JSON.parse(JSON.stringify(window.behaviors)),
    workItems:JSON.parse(JSON.stringify(window.workItems||[])),
    assignments:JSON.parse(JSON.stringify(window.assignments||[])),
    materials:JSON.parse(JSON.stringify(window.materials||[])),
    nextId:window.nextId, nextRoomId:window.nextRoomId, nextSchedId:window.nextSchedId,
    gradeThresholds:JSON.parse(JSON.stringify(window.gradeThresholds)),
    weights:JSON.parse(JSON.stringify(window.weights)),
    academicYear:window.academicYear,
    semester:window.semester,
    semesterDates:window.semesterDates?JSON.parse(JSON.stringify(window.semesterDates)):null,
    teacherName:window.teacherName,
    teacherRank:window.teacherRank,
    teacherSubjectGroup:window.teacherSubjectGroup,
    schoolName:window.schoolName,
    areaOffice:window.areaOffice,
    province:window.province,
    directorName:window.directorName,
    academicHeadName:window.academicHeadName,
    registrarName:window.registrarName,
    GS_URL:window.GS_URL||'',
  };
}

window.exportAllData = function(){
  window.snapshotVersion('ก่อนส่งออก');
  const data=window.collectAllData();
  const json=JSON.stringify(data,null,2);
  const blob=new Blob(['\uFEFF'+json],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const d=new Date();
  const ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  a.download='classroom_'+window.rooms.map(r=>r.level+r.section).join('-')+'_'+ds+'.json';
  a.href=url; a.click(); URL.revokeObjectURL(url);
  window.showSyncToast('⬇ ส่งออกสำเร็จ');
}

window._pendingRestoreData=null;
window.importAllData = function(input){
  const file=input.files[0]; if(!file)return; input.value='';
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      const data=JSON.parse(e.target.result.replace(/^\uFEFF/,''));
      if(!data.rooms||!data.classData){window.toast('❌ ไฟล์ไม่ถูกต้อง');return;}
      window._pendingRestoreData=data;
      const totalStudents=Object.values(data.classData||{}).flat().length;
      const el=document.getElementById('restore-preview-content');
      if(el) el.innerHTML=[
        window.rowHelper('📁 ไฟล์','<strong>'+file.name+'</strong>'),
        window.rowHelper('🕐 ส่งออกเมื่อ',data._exportedAt?new Date(data._exportedAt).toLocaleString('th-TH'):'ไม่ทราบ'),
        window.rowHelper('🏫 ห้องเรียน',(data.rooms||[]).map(r=>r.level+'/'+r.section).join(', ')||'-'),
        window.rowHelper('👥 นักเรียน',totalStudents+' คน'),
        window.rowHelper('📚 รายวิชา',(data.subjects||[]).length+' วิชา'),
        window.rowHelper('📅 เช็กชื่อ',Object.keys(data.attData||{}).length+' รายการ'),
        window.rowHelper('📋 งาน/คะแนน',(data.workItems||[]).length+' รายการ'),
      ].join('');
      document.getElementById('restore-modal').classList.add('open');
    }catch(err){window.toast('❌ อ่านไฟล์ไม่ได้: '+err.message);}
  };
  reader.readAsText(file,'UTF-8');
}

window.rowHelper = function(label,value){
  return '<div style="display:flex;gap:8px;margin-bottom:7px"><span style="font-size:12px;color:var(--text3);min-width:150px">'+label+'</span><span style="font-size:13px">'+value+'</span></div>';
}

window.confirmRestore = function(){
  if(!window._pendingRestoreData){window.closeModal('restore-modal');return;}
  const merge=document.getElementById('restore-merge')?.checked||false;
  window.snapshotVersion('ก่อนโหลดข้อมูล');
  try{
    window.applyRestoreData(window._pendingRestoreData,merge);
    window._pendingRestoreData=null; window.closeModal('restore-modal');
    window.syncSubjectsToClassSubjects(); window.rebuildClassSelector();
    window.renderPeriodSettings(); window.renderPanel(window.currentPanel);
    window.showSyncToast('✅ โหลดข้อมูลสำเร็จ');
    if(window.GS_URL) setTimeout(window.pushAllToSheets,500);
  }catch(err){window.toast('❌ '+err.message);}
}

window.applyRestoreData = function(data,merge){
  if(merge){
    (data.rooms||[]).forEach(r=>{if(!window.rooms.find(x=>x.id===r.id))window.rooms.push(r);});
    Object.entries(data.classData||{}).forEach(([rid,sts])=>{
      if(!window.classData[rid])window.classData[rid]=[];
      sts.forEach(s=>{if(!window.classData[rid].find(x=>x.id===s.id))window.classData[rid].push(s);});
    });
    (data.subjects||[]).forEach(s=>{if(!window.subjects.find(x=>x.id===s.id))window.subjects.push(s);});
    (data.schedules||[]).forEach(s=>{if(!window.schedules.find(x=>x.id===s.id))window.schedules.push(s);});
    Object.assign(window.attData,data.attData||{});
    (data.behaviors||[]).forEach(b=>{if(!window.behaviors.find(x=>x.sid===b.sid&&x.time===b.time))window.behaviors.push(b);});
    (data.workItems||[]).forEach(w=>{if(!window.workItems.find(x=>x.id===w.id))window.workItems.push(w);});
    (data.materials||[]).forEach(m=>{if(!window.materials.find(x=>x.id===m.id))window.materials.push(m);});
  } else {
    window.rooms=data.rooms||[];
    Object.keys(window.classData).forEach(k=>delete window.classData[k]);
    Object.assign(window.classData,data.classData||{});
    window.subjects=data.subjects||[]; window.schedules=data.schedules||[];
    Object.keys(window.attData).forEach(k=>delete window.attData[k]);
    Object.assign(window.attData,data.attData||{});
    window.behaviors=data.behaviors||[]; window.workItems=data.workItems||[];
    window.assignments=data.assignments||[]; window.materials=data.materials||[];
    if(data.periodConfig) window.periodConfig=data.periodConfig;
  }
  if(data.nextId&&data.nextId>window.nextId) window.nextId=data.nextId;
  if(data.nextRoomId&&data.nextRoomId>window.nextRoomId) window.nextRoomId=data.nextRoomId;
  if(data.nextSchedId&&data.nextSchedId>window.nextSchedId) window.nextSchedId=data.nextSchedId;
  if(data.gradeThresholds) Object.assign(window.gradeThresholds,data.gradeThresholds);
  if(data.weights) Object.assign(window.weights,data.weights);
  if(data.academicYear !== undefined) window.academicYear = data.academicYear;
  if(data.semester !== undefined) window.semester = data.semester;
  if(data.semesterDates !== undefined) window.semesterDates = data.semesterDates;
  if(data.teacherName !== undefined) window.teacherName = data.teacherName;
  if(data.teacherRank !== undefined) window.teacherRank = data.teacherRank;
  if(data.teacherSubjectGroup !== undefined) window.teacherSubjectGroup = data.teacherSubjectGroup;
  if(data.schoolName !== undefined) window.schoolName = data.schoolName;
  if(data.areaOffice !== undefined) window.areaOffice = data.areaOffice;
  if(data.province !== undefined) window.province = data.province;
  if(data.directorName !== undefined) window.directorName = data.directorName;
  if(data.academicHeadName !== undefined) window.academicHeadName = data.academicHeadName;
  if(data.registrarName !== undefined) window.registrarName = data.registrarName;
  if(data.GS_URL&&!window.GS_URL){window.GS_URL=data.GS_URL;localStorage.setItem('gs_url',window.GS_URL);}
}

window.autoSaveToLocalStorage = function(){
  try{
    const timestamp = new Date().toISOString();
    localStorage.setItem(LS_AUTO_KEY,JSON.stringify(window.collectAllData()));
    localStorage.setItem(LS_AUTO_KEY+'_time',timestamp);
    window.saveGlobalProfile(); // Sync profile globally
    window.handleAutoSnapshot();
    if (window.firebaseUser) {
      if (window.pushSemesterDataToFirebase) window.pushSemesterDataToFirebase();
      if (window.pushGlobalProfileToFirebase) window.pushGlobalProfileToFirebase();
    }
  }catch(e){}
}

window.handleAutoSnapshot = function() {
  const now = Date.now();
  const lastAuto = parseInt(localStorage.getItem('cls_last_auto_snapshot_time') || '0');
  if (now - lastAuto >= 15 * 60 * 1000) { // 15 minutes
    localStorage.setItem('cls_last_auto_snapshot_time', now.toString()); // Set BEFORE to prevent infinite loop
    window.snapshotVersion('บันทึกอัตโนมัติ (15 นาที)');
  }
};

window.checkAutoSave = function(){
  const saved = localStorage.getItem(LS_AUTO_KEY);
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    if (data && (data.rooms?.length > 0 || Object.values(data.classData || {}).flat().length > 0)) {
      window.applyRestoreData(data, false);
      window.syncSubjectsToClassSubjects();
      window.rebuildClassSelector();
      
      // Update sidebar badge
      const badge = document.getElementById('active-semester-badge');
      if (badge && window.currentSemesterId) {
        const sem = window.semesters.find(x => x.id === window.currentSemesterId);
        if (sem) badge.textContent = `ปีการศึกษา ${sem.year}`;
      }
      
      window.renderPanel(window.currentPanel);
      window.toast('✨ โหลดข้อมูลล่าสุดสำเร็จ');
    }
  } catch(e) {}
}

window.restoreFromAutoSave = function(){
  const saved=localStorage.getItem(LS_AUTO_KEY);
  if(!saved)return;
  try{
    window.applyRestoreData(JSON.parse(saved),false);
    window.syncSubjectsToClassSubjects(); window.rebuildClassSelector();
    window.renderPanel(window.currentPanel); window.showSyncToast('✅ โหลดอัตโนมัติสำเร็จ');
  }catch(e){window.toast('❌ '+e.message);}
}

// ====== SETUP SYNC HELPERS ======
window.calibrateIdCounters = function() {
  // Calibrate nextRoomId
  let maxRoomId = 100;
  window.rooms.forEach(r => {
    if (r.id && r.id.startsWith('r')) {
      const num = parseInt(r.id.substring(1), 10);
      if (!isNaN(num) && num >= maxRoomId) {
        maxRoomId = num + 1;
      }
    }
  });
  window.nextRoomId = maxRoomId;

  // Calibrate nextId (Student ID)
  let maxStudentId = 10;
  for (const rId in window.classData) {
    (window.classData[rId]||[]).forEach(s => {
      const num = parseInt(s.id, 10);
      if (!isNaN(num) && num >= maxStudentId) {
        maxStudentId = num + 1;
      }
    });
  }
  window.nextId = maxStudentId;

  // Calibrate nextSubjId (Subject ID)
  let maxSubjId = 100;
  window.subjects.forEach(s => {
    if (s.id) {
      const idStr = String(s.id);
      if (idStr.startsWith('s')) {
        const num = parseInt(idStr.substring(1), 10);
        if (!isNaN(num) && num >= maxSubjId) {
          maxSubjId = num + 1;
        }
      } else {
        const num = parseInt(idStr, 10);
        if (!isNaN(num) && num >= maxSubjId) {
          maxSubjId = num + 1;
        }
      }
    }
  });
  window.nextSubjId = maxSubjId;

  // Calibrate nextSchedId (Schedule ID)
  let maxSchedId = 100;
  window.schedules.forEach(sc => {
    if (sc.id) {
      const idStr = String(sc.id);
      if (idStr.startsWith('sc')) {
        const num = parseInt(idStr.substring(2), 10);
        if (!isNaN(num) && num >= maxSchedId) {
          maxSchedId = num + 1;
        }
      }
    }
  });
  window.nextSchedId = maxSchedId;

  // Clean up orphan schedule entries referencing deleted/mock rooms or subjects
  if (window.schedules) {
    const initialLen = window.schedules.length;
    window.schedules = window.schedules.filter(sc => {
      const roomExists = window.rooms.some(r => r.id === sc.roomId);
      const subjExists = window.subjects.some(s => s.id === sc.subjectId);
      return roomExists && subjExists;
    });
    if (window.schedules.length !== initialLen) {
      window.autoSaveToLocalStorage();
    }
  }
}

window.syncSubjectsToClassSubjects = function(){
  window.classSubjects={};
  const currentTerm = window.activeSemesterFilter || '1';
  window.rooms.forEach(r=>{
    window.classSubjects[r.id]=window.subjects.filter(s=> (!s.rooms||s.rooms.length===0||s.rooms.includes(r.id)) && (currentTerm === 'all' || s.term === 'all' || s.term === currentTerm) ).map(x=>x.name);
  });
}

window.rebuildClassSelector = function(){
  window.calibrateIdCounters();
  const sel=document.getElementById('class-select');
  if(!sel) return;
  sel.innerHTML=window.rooms.map(r=>`<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
  if(window.rooms.length&&!window.classData[window.currentClass]){
    window.currentClass=window.rooms[0].id;
  }
  sel.value=window.currentClass;
  
  // Update all room-related dropdowns
  ['asmnt-room','score-room','report-room','gov-room','beh-room','work-room'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    const cur=el.value;
    el.innerHTML=window.rooms.map(r=>`<option value="${r.id}">${r.level}/${r.section}</option>`).join('');
    if(cur&&window.rooms.find(r=>r.id===cur)) el.value=cur;
    else if(window.rooms[0]) el.value=window.rooms[0].id;
  });
}

window.testConnection = async function(){
  const url = (document.getElementById('gs-url-input')?.value||'').trim();
  if(!url){window.toast('⚠️ กรอก URL ก่อน');return;}
  const btn = document.querySelector('[onclick="testConnection()"]');
  if(btn){btn.textContent='⏳ กำลังทดสอบ...';btn.disabled=true;}
  try{
    const testUrl = url + (url.includes('?')?'&':'?') + 'action=ping';
    const res = await fetch(testUrl, {method:'GET', mode:'cors'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json().catch(()=>({ok:true}));
    window.toast('✅ เชื่อมต่อสำเร็จ!');
    window.updateSyncStatus('connected','เชื่อมต่อแล้ว');
  }catch(e){
    if(e.message.includes('fetch')||e.message.includes('CORS')||e.message.includes('Failed')){
      window.toast('⚠️ ไม่สามารถทดสอบจากเบราว์เซอร์ได้ (CORS) — ลอง "บันทึกและเชื่อมต่อ" แทน');
    } else {
      window.toast('❌ เชื่อมต่อไม่ได้: '+e.message);
    }
  }finally{
    if(btn){btn.textContent='🔌 ทดสอบการเชื่อมต่อ';btn.disabled=false;}
  }
}

// ====== UNDO / REDO ENGINE ======
window.historyIndex = 0;

window.undo = function() {
  const v = window.getVersions();
  if (v.length <= 1 || window.historyIndex >= v.length - 1) return;
  
  window.historyIndex++;
  const snap = v[window.historyIndex];
  if (!snap) return;
  
  window.applyState(snap.data);
  window.updateUndoRedoButtons();
  window.toast('↩ ย้อนกลับ (Undo): ' + snap.label);
}

window.redo = function() {
  const v = window.getVersions();
  if (window.historyIndex <= 0) return;
  
  window.historyIndex--;
  const snap = v[window.historyIndex];
  if (!snap) return;
  
  window.applyState(snap.data);
  window.updateUndoRedoButtons();
  window.toast('↪ ทำซ้ำ (Redo): ' + snap.label);
}

window.applyState = function(data) {
  window.rooms = JSON.parse(JSON.stringify(data.rooms));
  // Clear classData
  Object.keys(window.classData).forEach(k => delete window.classData[k]);
  Object.assign(window.classData, JSON.parse(JSON.stringify(data.classData)));
  
  window.subjects = JSON.parse(JSON.stringify(data.subjects));
  window.schedules = JSON.parse(JSON.stringify(data.schedules));
  window.behaviors = JSON.parse(JSON.stringify(data.behaviors));
  
  if (data.assignments) window.assignments = JSON.parse(JSON.stringify(data.assignments));
  
  // Clear attData
  Object.keys(window.attData).forEach(k => delete window.attData[k]);
  Object.assign(window.attData, JSON.parse(JSON.stringify(data.attData)));
  
  window.syncSubjectsToClassSubjects();
  window.rebuildClassSelector();
  window.renderPanel(window.currentPanel);
  window.autoSaveToLocalStorage();
}

window.updateUndoRedoButtons = function() {
  const v = window.getVersions();
  const ub = document.getElementById('btn-undo');
  const rb = document.getElementById('btn-redo');
  
  const canUndo = v.length > 1 && window.historyIndex < v.length - 1;
  const canRedo = window.historyIndex > 0;
  
  if (ub) {
    ub.disabled = !canUndo;
    ub.style.opacity = !canUndo ? '0.4' : '1';
    ub.style.cursor = !canUndo ? 'not-allowed' : 'pointer';
  }
  if (rb) {
    rb.disabled = !canRedo;
    rb.style.opacity = !canRedo ? '0.4' : '1';
    rb.style.cursor = !canRedo ? 'not-allowed' : 'pointer';
  }
}

// Keyboard shortcuts for Undo/Redo (Ctrl+Z / Cmd+Z, Ctrl+Y / Cmd+Y)
window.addEventListener('keydown', function(e) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
  
  if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      window.redo();
    } else {
      window.undo();
    }
  } else if(isCmdOrCtrl && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    window.redo();
  }
});


// ====== ACADEMIC YEAR & SEMESTER MANAGEMENT ======

window.saveGlobalProfile = function() {
  const profile = {
    teacherName: window.teacherName,
    teacherRank: window.teacherRank,
    teacherSubjectGroup: window.teacherSubjectGroup,
    schoolName: window.schoolName,
    areaOffice: window.areaOffice || '',
    province: window.province || '',
    directorName: window.directorName || '',
    academicHeadName: window.academicHeadName || '',
    registrarName: window.registrarName || '',
    GS_URL: window.GS_URL || ''
  };
  localStorage.setItem('cls_global_profile', JSON.stringify(profile));
  localStorage.setItem('cls_global_profile_time', new Date().toISOString());
  if (window.firebaseUser && window.pushGlobalProfileToFirebase) {
    window.pushGlobalProfileToFirebase();
  }
};

window.loadGlobalProfile = function() {
  try {
    const raw = localStorage.getItem('cls_global_profile');
    if (raw) {
      const p = JSON.parse(raw);
      window.teacherName = p.teacherName || window.teacherName;
      window.teacherRank = p.teacherRank || window.teacherRank;
      window.teacherSubjectGroup = p.teacherSubjectGroup || window.teacherSubjectGroup;
      window.schoolName = p.schoolName || window.schoolName;
      window.GS_URL = p.GS_URL || window.GS_URL;
      window.areaOffice = p.areaOffice || window.areaOffice;
      window.province = p.province || window.province;
      window.directorName = p.directorName || window.directorName;
      window.academicHeadName = p.academicHeadName || window.academicHeadName;
      window.registrarName = p.registrarName || window.registrarName;
    }
  } catch(e) {}
};

window.migrateLegacyData = function() {
  const legacySave = localStorage.getItem('cls_autosave');
  if (!legacySave) return;
  try {
    const data = JSON.parse(legacySave);
    const year = data.academicYear || '2568';
    const term = data.semester || '1';
    const semId = `sem_${year}_${term}`;
    
    // Add to semesters list if not already present
    if (!window.semesters.some(x => x.id === semId)) {
      const newSem = {
        id: semId,
        year: year,
        term: term,
        name: `ปีการศึกษา ${year} ภาคเรียนที่ ${term}`,
        createdAt: new Date().toISOString()
      };
      window.semesters.push(newSem);
      localStorage.setItem('cls_semesters', JSON.stringify(window.semesters));
    }
    
    // Save to the partitioned key
    localStorage.setItem(`cls_autosave_${semId}`, legacySave);
    const legacyTime = localStorage.getItem('cls_autosave_time');
    if (legacyTime) {
      localStorage.setItem(`cls_autosave_${semId}_time`, legacyTime);
    }
    
    // Save global profile
    const profile = {
      teacherName: data.teacherName || window.teacherName,
      teacherRank: data.teacherRank || window.teacherRank,
      teacherSubjectGroup: data.teacherSubjectGroup || window.teacherSubjectGroup,
      schoolName: data.schoolName || window.schoolName,
      GS_URL: data.GS_URL || ''
    };
    localStorage.setItem('cls_global_profile', JSON.stringify(profile));
    
    // Set active pointer
    window.currentSemesterId = semId;
    localStorage.setItem('cls_current_semester_id', semId);
    LS_AUTO_KEY = `cls_autosave_${semId}`;
    
    // Delete legacy keys
    localStorage.removeItem('cls_autosave');
    localStorage.removeItem('cls_autosave_time');
    
    console.log(`Legacy data successfully migrated to semester: ${semId}`);
  } catch(e) {
    console.error('Migration failed:', e);
  }
};

window.renderSemesterList = function() {
  const container = document.getElementById('semester-list-container');
  const badgeCount = document.getElementById('sem-badge-count');
  if (!container) return;
  
  if (badgeCount) {
    badgeCount.textContent = window.semesters.length + ' ปีการศึกษา';
  }
  
  if (window.semesters.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text3); font-size: 13px; border: 1px dashed var(--border); border-radius: 12px; background: var(--surface2); font-family: Sarabun, sans-serif;">
        ยังไม่มีปีการศึกษาในระบบ<br>กรุณากรอกปีการศึกษาด้านบนเพื่อเริ่มต้น
      </div>
    `;
    return;
  }
  
  // Sort semesters: newest first
  const sorted = [...window.semesters].sort((a, b) => b.id.localeCompare(a.id));
  
  container.innerHTML = sorted.map(sem => {
    const displayName = sem.name || `ปีการศึกษา ${sem.year}`;
    return `
      <div class="card" style="margin-bottom: 0; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--surface2); transition: all 0.2s; border: 1px solid var(--border); font-family: Sarabun, sans-serif;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
        <div style="cursor: pointer; flex: 1;" onclick="window.selectSemester('${sem.id}')">
          <div style="font-weight: 700; color: var(--text); font-size: 14px;">${displayName}</div>
          <div style="font-size: 11px; color: var(--text3); margin-top: 2px;">สร้างเมื่อ ${new Date(sem.createdAt).toLocaleDateString('th-TH')}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button class="btn btn-teal btn-sm" onclick="window.selectSemester('${sem.id}')" style="font-weight: 700; padding: 5px 12px; border-radius: 6px; font-family: Sarabun, sans-serif;">🚪 เข้าใช้งาน</button>
          <button class="btn btn-outline btn-sm" onclick="window.openEditSemesterModal('${sem.id}', event)" style="padding: 5px; border-radius: 6px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-family: Sarabun, sans-serif;" title="แก้ไขชื่อภาคเรียน">✏️</button>
          <button class="btn btn-outline btn-sm" onclick="window.openCloneSemesterModal('${sem.id}', event)" style="padding: 5px; border-radius: 6px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-family: Sarabun, sans-serif;" title="โคลนภาคเรียน">👥</button>
          <button class="btn btn-danger btn-sm" onclick="window.handleDeleteSemester('${sem.id}', event)" style="padding: 5px; border-radius: 6px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-family: Sarabun, sans-serif;" title="ย้ายลงถังขยะ">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
};

window.handleCreateSemester = function() {
  const yearInput = document.getElementById('new-sem-year');
  if (!yearInput) return;
  
  const year = yearInput.value.trim();
  
  if (!year || isNaN(year)) {
    window.toast('⚠️ กรุณากรอกปีการศึกษาเป็นตัวเลข (เช่น 2569)');
    return;
  }
  
  const semId = `year_${year}`;
  
  // Check duplicates
  if (window.semesters.some(x => x.id === semId)) {
    window.toast('⚠️ ปีการศึกษานี้มีอยู่ในระบบแล้ว');
    return;
  }
  
  const newSem = {
    id: semId,
    year: year,
    term: '1', // Default value for backward compatibility
    name: `ปีการศึกษา ${year}`,
    createdAt: new Date().toISOString()
  };
  
  window.semesters.push(newSem);
  localStorage.setItem('cls_semesters', JSON.stringify(window.semesters));
  
  // Save current active state if any
  if (window.currentSemesterId) {
    window.autoSaveToLocalStorage();
  }
  
  // Select this academic year!
  window.selectSemester(semId, true);
  window.toast('✨ สร้างปีการศึกษาใหม่สำเร็จ');
};

window.selectSemester = function(semesterId, isNew = false) {
  window.currentSemesterId = semesterId;
  localStorage.setItem('cls_current_semester_id', semesterId);
  LS_AUTO_KEY = 'cls_autosave_' + semesterId;
  
  const sem = window.semesters.find(x => x.id === semesterId);
  if (!sem) return;
  
  // Clear/Load data
  const saved = localStorage.getItem(LS_AUTO_KEY);
  if (saved) {
    try {
      window.applyRestoreData(JSON.parse(saved), false);
    } catch(e) {}
  } else {
    // Fresh initialize
    window.rooms = [];
    Object.keys(window.classData).forEach(k => delete window.classData[k]);
    window.subjects = [];
    window.schedules = [];
    Object.keys(window.attData).forEach(k => delete window.attData[k]);
    window.behaviors = [];
    window.workItems = [];
    window.assignments = [];
    window.materials = [];
    window.weights = {w1:30,w2:30,w3:30,w4:10};
    window.gradeThresholds = { g4: 80, g35: 75, g3: 70, g25: 65, g2: 60, g15: 55, g1: 50, g0: 0 };
    
    // Preload global profile info
    window.loadGlobalProfile();
    
    window.academicYear = sem.year;
    window.semester = sem.term;
    
    // Save fresh initialize state
    window.autoSaveToLocalStorage();
  }
  
  // Sync UI & state
  window.syncSubjectsToClassSubjects();
  window.rebuildClassSelector();
  window.renderPeriodSettings();
  
  // Initialize Semester Filter
  window.activeSemesterFilter = localStorage.getItem('cls_active_semester_filter_' + semesterId) || '1';
  const segmentedFilter = document.getElementById('semester-segmented-filter');
  if (segmentedFilter) {
    segmentedFilter.querySelectorAll('.segment-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-value') === window.activeSemesterFilter);
    });
  }
  
  // Update sidebar badge
  const badge = document.getElementById('active-semester-badge');
  if (badge) {
    badge.textContent = `ปีการศึกษา ${sem.year}`;
  }
  
  // Transition screens
  const selectScreen = document.getElementById('semester-select-screen');
  const appContainer = document.querySelector('.app');
  if (selectScreen) selectScreen.style.display = 'none';
  if (appContainer) appContainer.style.display = 'flex';
  
  // Go to default page
  window.goto('setup-rooms');
  window.toast(`🚪 เข้าใช้งานปีการศึกษา ${sem.year}`);
};

window.setActiveSemesterFilter = function(val) {
  window.activeSemesterFilter = val;
  localStorage.setItem('cls_active_semester_filter_' + window.currentSemesterId, val);
  
  // Update Segmented Control active status in UI
  const segmentedFilter = document.getElementById('semester-segmented-filter');
  if (segmentedFilter) {
    segmentedFilter.querySelectorAll('.segment-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-value') === val);
    });
  }
  
  // Refresh UI screens that depend on the semester filter
  if (window.renderSubjectList) window.renderSubjectList();
  if (window.renderDndBuilder) window.renderDndBuilder();
  if (window.rebuildClassSelector) window.rebuildClassSelector();
  if (window.renderAttendanceGrid) window.renderAttendanceGrid();
  if (window.renderBehaviorTable) window.renderBehaviorTable();
  if (window.renderLiveStudents) window.renderLiveStudents();
  if (window.renderLiveGoalTracker) window.renderLiveGoalTracker();
  if (window.renderTeachingMain) window.renderTeachingMain();
  if (window.renderReportRoomSelect) window.renderReportRoomSelect();
  
  window.toast(`📌 แสดงผลข้อมูล: ${val === '1' ? 'ภาคเรียนที่ 1' : val === '2' ? 'ภาคเรียนที่ 2' : 'ทุกภาคเรียน'}`);
};

window.handleDeleteSemester = function(semesterId, event) {
  if (event) event.stopPropagation();
  const sem = window.semesters.find(x => x.id === semesterId);
  if (!sem) return;
  
  if (!confirm(`⚠️ คุณต้องการย้าย "ปีการศึกษา ${sem.year} ภาคเรียนที่ ${sem.term}" ไปยังถังขยะหรือไม่?\n\n(คุณสามารถกู้คืนกลับมาใช้งานได้ตลอดเวลาจากถังขยะด้านล่าง)`)) {
    return;
  }
  
  // Add to trash list
  const trashItem = {
    ...sem,
    deletedAt: Date.now()
  };
  window.trashSemesters.push(trashItem);
  localStorage.setItem('cls_trash_semesters', JSON.stringify(window.trashSemesters));
  
  // Remove from main semesters list
  window.semesters = window.semesters.filter(x => x.id !== semesterId);
  localStorage.setItem('cls_semesters', JSON.stringify(window.semesters));
  
  // Unset pointers if current
  if (window.currentSemesterId === semesterId) {
    window.currentSemesterId = '';
    localStorage.removeItem('cls_current_semester_id');
  }
  
  window.toast('🗑️ ย้ายภาคเรียนลงถังขยะแล้ว');
  window.renderSemesterList();
  window.renderTrashBinList();
};

window.backToSemesterSelect = function() {
  if (window.currentSemesterId) {
    window.autoSaveToLocalStorage();
  }
  
  window.currentSemesterId = '';
  localStorage.removeItem('cls_current_semester_id');
  LS_AUTO_KEY = 'cls_autosave';
  
  // Transition screens
  const selectScreen = document.getElementById('semester-select-screen');
  const appContainer = document.querySelector('.app');
  if (selectScreen) selectScreen.style.display = 'flex';
  if (appContainer) appContainer.style.display = 'none';
  
  window.renderSemesterList();
  window.toast('↩ กลับหน้าจัดการภาคเรียน');
};


// ====== SEMESTER TRASH & CLONING & EDITING ======

window.toggleTrashBin = function() {
  const section = document.getElementById('trash-bin-section');
  const btn = document.getElementById('btn-toggle-trash');
  if (!section) return;
  
  const isHidden = section.style.display === 'none';
  section.style.display = isHidden ? 'flex' : 'none';
  if (btn) {
    btn.textContent = isHidden ? '🔽 ซ่อนถังขยะภาคเรียน' : `🗑️ ดูถังขยะภาคเรียน (${window.trashSemesters.length})`;
  }
  if (isHidden) {
    window.renderTrashBinList();
  }
};

window.renderTrashBinList = function() {
  const container = document.getElementById('trash-bin-section');
  const countSpan = document.getElementById('trash-sem-count');
  if (countSpan) countSpan.textContent = window.trashSemesters.length;
  if (!container) return;
  
  if (window.trashSemesters.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 16px; color: var(--text3); font-size: 11px; border: 1px dashed var(--border); border-radius: 10px; background: var(--surface2); font-family: Sarabun, sans-serif;">
        ถังขยะว่างเปล่า
      </div>
    `;
    return;
  }
  
  // Sort trash: newest deleted first
  const sorted = [...window.trashSemesters].sort((a, b) => b.deletedAt - a.deletedAt);
  
  container.innerHTML = sorted.map(sem => {
    const elapsedDays = Math.floor((Date.now() - sem.deletedAt) / (24 * 60 * 60 * 1000));
    const remainingDays = Math.max(0, 90 - elapsedDays);
    
    return `
      <div class="card" style="margin-bottom: 0; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--red-light); border: 1px solid var(--red); font-family: Sarabun, sans-serif; opacity: 0.85;">
        <div style="flex: 1;">
          <div style="font-weight: 700; color: var(--red); font-size: 13px;">ปีการศึกษา ${sem.year} &bull; ภาคเรียนที่ ${sem.term}</div>
          <div style="font-size: 10.5px; color: var(--text2); margin-top: 1px;">
            เหลือเวลาอีก <strong>${remainingDays} วัน</strong> ก่อนถูกลบถาวร
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button class="btn btn-sm" onclick="window.handlePutBackSemester('${sem.id}')" style="background: var(--surface); border: 1px solid var(--border); color: var(--text2); font-weight: 700; font-family: Sarabun, sans-serif; padding: 4px 10px; font-size: 11px; border-radius: 5px;">↩️ นำกลับคืน</button>
          <button class="btn btn-danger btn-sm" onclick="window.handlePermanentDeleteAttempt()" style="padding: 4px 8px; font-size: 11px; border-radius: 5px; font-family: Sarabun, sans-serif;" title="ลบถาวร (ถูกบล็อก)">🗑️ ลบถาวร</button>
        </div>
      </div>
    `;
  }).join('');
};

window.handlePutBackSemester = function(semesterId) {
  const sem = window.trashSemesters.find(x => x.id === semesterId);
  if (!sem) return;
  
  // Remove from trash semesters
  window.trashSemesters = window.trashSemesters.filter(x => x.id !== semesterId);
  localStorage.setItem('cls_trash_semesters', JSON.stringify(window.trashSemesters));
  
  // Remove deletedAt metadata and push back to active list
  const activeSem = {
    id: sem.id,
    year: sem.year,
    term: sem.term,
    name: sem.name,
    createdAt: sem.createdAt
  };
  
  window.semesters.push(activeSem);
  localStorage.setItem('cls_semesters', JSON.stringify(window.semesters));
  
  window.toast('↩️ กู้คืนภาคเรียนกลับมาใช้งานแล้ว');
  window.renderSemesterList();
  window.renderTrashBinList();
};

window.handlePermanentDeleteAttempt = function() {
  alert('⚠️ เพื่อความปลอดภัยของข้อมูลหลักสูตรและประวัตินักเรียน\\n\\nระบบจะล็อกปุ่มลบถาวรไว้จนกว่าจะครบ 90 วัน นับจากวันที่ย้ายลงถังขยะ เพื่อเปิดโอกาสให้คุณครูกู้คืนข้อมูล (Put Back) กลับไปใช้งานได้ตลอดเวลาหากจำเป็น!');
};

window.runAutoPurgeTrash = function() {
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  let deletedCount = 0;
  
  window.trashSemesters = window.trashSemesters.filter(sem => {
    if (now - sem.deletedAt > ninetyDaysMs) {
      // Permanently destroy the actual database partition in localStorage
      localStorage.removeItem('cls_autosave_' + sem.id);
      localStorage.removeItem('cls_autosave_' + sem.id + '_time');
      deletedCount++;
      return false; // Remove from index
    }
    return true; // Keep
  });
  
  if (deletedCount > 0) {
    localStorage.setItem('cls_trash_semesters', JSON.stringify(window.trashSemesters));
    console.log(`Auto-purged ${deletedCount} semesters from trash bin after 90 days.`);
  }
};

window.openEditSemesterModal = function(semesterId, event) {
  if (event) event.stopPropagation();
  const sem = window.semesters.find(x => x.id === semesterId);
  if (!sem) return;
  
  const targetIdInput = document.getElementById('edit-sem-target-id');
  const yearInput = document.getElementById('edit-sem-year');
  const termSelect = document.getElementById('edit-sem-term');
  
  if (targetIdInput) targetIdInput.value = semesterId;
  if (yearInput) yearInput.value = sem.year;
  if (termSelect) termSelect.value = sem.term;
  
  const el = document.getElementById('edit-semester-modal');
  if (el) el.classList.add('open');
};

window.confirmEditSemester = function() {
  const targetId = document.getElementById('edit-sem-target-id')?.value;
  const year = document.getElementById('edit-sem-year')?.value.trim();
  const term = document.getElementById('edit-sem-term')?.value;
  
  if (!year || isNaN(year)) {
    window.toast('⚠️ กรุณากรอกปีการศึกษาเป็นตัวเลข');
    return;
  }
  
  const sem = window.semesters.find(x => x.id === targetId);
  if (!sem) return;
  
  const newSemId = `sem_${year}_${term}`;
  
  // If ID changes, check duplicates
  if (newSemId !== targetId && window.semesters.some(x => x.id === newSemId)) {
    window.toast('⚠️ ภาคเรียนปลายทางนี้ซ้ำกับที่มีอยู่แล้วในระบบ');
    return;
  }
  
  // Rename key in localStorage if needed
  if (newSemId !== targetId) {
    const oldKey = 'cls_autosave_' + targetId;
    const oldTimeKey = 'cls_autosave_' + targetId + '_time';
    const newKey = 'cls_autosave_' + newSemId;
    const newTimeKey = 'cls_autosave_' + newSemId + '_time';
    
    const savedData = localStorage.getItem(oldKey);
    if (savedData) {
      localStorage.setItem(newKey, savedData);
      localStorage.removeItem(oldKey);
    }
    
    const savedTime = localStorage.getItem(oldTimeKey);
    if (savedTime) {
      localStorage.setItem(newTimeKey, savedTime);
      localStorage.removeItem(oldTimeKey);
    }
  }
  
  // Update semesters metadata list
  sem.id = newSemId;
  sem.year = year;
  sem.term = term;
  sem.name = `ปีการศึกษา ${year} ภาคเรียนที่ ${term}`;
  
  localStorage.setItem('cls_semesters', JSON.stringify(window.semesters));
  
  // Update active semester pointer if we are modifying the currently active one
  if (window.currentSemesterId === targetId) {
    window.currentSemesterId = newSemId;
    localStorage.setItem('cls_current_semester_id', newSemId);
    LS_AUTO_KEY = 'cls_autosave_' + newSemId;
    
    // Update badge in sidebar
    const badge = document.getElementById('active-semester-badge');
    if (badge) badge.textContent = `ปีการศึกษา ${year}`;
  }
  
  window.closeModal('edit-semester-modal');
  window.toast('✅ แก้ไขชื่อภาคเรียนเรียบร้อย');
  window.renderSemesterList();
};

window.openCloneSemesterModal = function(semesterId, event) {
  if (event) event.stopPropagation();
  const sem = window.semesters.find(x => x.id === semesterId);
  if (!sem) return;
  
  const sourceIdInput = document.getElementById('clone-sem-source-id');
  const sourceTitle = document.getElementById('clone-sem-source-title');
  const yearInput = document.getElementById('clone-sem-year');
  const termSelect = document.getElementById('clone-sem-term');
  
  if (sourceIdInput) sourceIdInput.value = semesterId;
  if (sourceTitle) sourceTitle.textContent = `โคลนข้อมูลจาก: ปีการศึกษา ${sem.year} ภาคเรียนที่ ${sem.term}`;
  if (yearInput) yearInput.value = (parseInt(sem.year) + (sem.term === '2' ? 1 : 0)) || sem.year; // Guess next year
  if (termSelect) termSelect.value = sem.term === '1' ? '2' : '1'; // Suggest next semester
  
  const el = document.getElementById('clone-semester-modal');
  if (el) el.classList.add('open');
};

window.confirmCloneSemester = function() {
  const sourceId = document.getElementById('clone-sem-source-id')?.value;
  const year = document.getElementById('clone-sem-year')?.value.trim();
  const term = document.getElementById('clone-sem-term')?.value;
  
  if (!year || isNaN(year)) {
    window.toast('⚠️ กรุณากรอกปีการศึกษาเป็นตัวเลข');
    return;
  }
  
  const newSemId = `sem_${year}_${term}`;
  
  // Check duplicates
  if (window.semesters.some(x => x.id === newSemId)) {
    window.toast('⚠️ ภาคเรียนปลายทางมีอยู่แล้วในระบบ');
    return;
  }
  
  // Options
  const cloneRooms = document.getElementById('clone-opt-rooms')?.checked || false;
  const cloneStudents = document.getElementById('clone-opt-students')?.checked || false;
  const cloneSubjects = document.getElementById('clone-opt-subjects')?.checked || false;
  const cloneSchedules = document.getElementById('clone-opt-schedules')?.checked || false;
  const cloneHistory = document.getElementById('clone-opt-history')?.checked || false;
  
  // Load source data
  const sourceKey = 'cls_autosave_' + sourceId;
  const sourceRaw = localStorage.getItem(sourceKey);
  if (!sourceRaw) {
    window.toast('❌ ไม่พบข้อมูลต้นทางที่จะโคลน');
    return;
  }
  
  try {
    const sourceData = JSON.parse(sourceRaw);
    
    // Build cloned structure
    const clonedData = {
      _schema: sourceData._schema || '2.0',
      _exportedAt: new Date().toISOString(),
      _exportedBy: 'Classroom Management System (Cloned)',
      
      rooms: cloneRooms ? JSON.parse(JSON.stringify(sourceData.rooms || [])) : [],
      classData: {},
      subjects: cloneSubjects ? JSON.parse(JSON.stringify(sourceData.subjects || [])) : [],
      schedules: cloneSchedules ? JSON.parse(JSON.stringify(sourceData.schedules || [])) : [],
      attData: cloneHistory ? JSON.parse(JSON.stringify(sourceData.attData || {})) : {},
      periodConfig: JSON.parse(JSON.stringify(sourceData.periodConfig || [])),
      behaviors: cloneHistory ? JSON.parse(JSON.stringify(sourceData.behaviors || [])) : [],
      workItems: cloneHistory ? JSON.parse(JSON.stringify(sourceData.workItems || [])) : [],
      assignments: cloneHistory ? JSON.parse(JSON.stringify(sourceData.assignments || [])) : [],
      materials: JSON.parse(JSON.stringify(sourceData.materials || [])),
      nextId: sourceData.nextId || 10,
      nextRoomId: sourceData.nextRoomId || 100,
      nextSchedId: sourceData.nextSchedId || 100,
      gradeThresholds: JSON.parse(JSON.stringify(sourceData.gradeThresholds || {})),
      weights: JSON.parse(JSON.stringify(sourceData.weights || {})),
      academicYear: year,
      semester: term,
      teacherName: sourceData.teacherName || '',
      teacherRank: sourceData.teacherRank || '',
      teacherSubjectGroup: sourceData.teacherSubjectGroup || '',
      schoolName: sourceData.schoolName || '',
      GS_URL: sourceData.GS_URL || '',
    };
    
    // Copy student rosters selectively
    if (cloneRooms && cloneStudents) {
      clonedData.classData = JSON.parse(JSON.stringify(sourceData.classData || {}));
      
      // If we are NOT copying history, reset student scores in memory
      if (!cloneHistory) {
        for (const rid in clonedData.classData) {
          clonedData.classData[rid].forEach(st => {
            st.scores = { work: 0, mid: 0, final: 0, behavior: 100 };
            st.behaviorScore = 100;
          });
        }
      }
    } else if (cloneRooms) {
      // Create empty student arrays for each room
      clonedData.rooms.forEach(r => {
        clonedData.classData[r.id] = [];
      });
    }
    
    // Save to the destination partition key
    const destKey = 'cls_autosave_' + newSemId;
    localStorage.setItem(destKey, JSON.stringify(clonedData));
    localStorage.setItem(destKey + '_time', new Date().toISOString());
    
    // Add to semesters list index
    const newSem = {
      id: newSemId,
      year: year,
      term: term,
      name: `ปีการศึกษา ${year} ภาคเรียนที่ ${term}`,
      createdAt: new Date().toISOString()
    };
    window.semesters.push(newSem);
    localStorage.setItem('cls_semesters', JSON.stringify(window.semesters));
    
    window.closeModal('clone-semester-modal');
    window.toast('👥 โคลนภาคเรียนเสร็จสมบูรณ์!');
    
    // Load and select the new cloned semester!
    window.selectSemester(newSemId);
  } catch(e) {
    window.toast('❌ เกิดข้อผิดพลาดในการโคลน: ' + e.message);
  }
};

window.getSemesterDates = function() {
  const yrBE = parseInt(window.academicYear || '2569');
  const yrAD = yrBE - 543;
  
  const defaults = {
    sem1Start: `${yrAD}-05-16`,
    sem1End: `${yrAD}-10-15`,
    sem2Start: `${yrAD}-11-01`,
    sem2End: `${yrAD+1}-03-31`
  };
  
  if (!window.semesterDates) {
    return defaults;
  }
  
  return {
    sem1Start: window.semesterDates.sem1Start || defaults.sem1Start,
    sem1End: window.semesterDates.sem1End || defaults.sem1End,
    sem2Start: window.semesterDates.sem2Start || defaults.sem2Start,
    sem2End: window.semesterDates.sem2End || defaults.sem2End
  };
};

window.formatDateThai = function(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const yr = parseInt(parts[0]) + 543;
  const mo = parseInt(parts[1]);
  const dy = parseInt(parts[2]);
  const months = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${dy} ${months[mo]} ${yr}`;
};

window.formatFractionDays = function(value) {
  if (value === 0) return '0';
  const integerPart = Math.floor(value);
  const decimalPart = value - integerPart;
  
  if (decimalPart < 0.005) return String(integerPart);
  if (Math.abs(decimalPart - 1) < 0.005) return String(integerPart + 1);
  
  let bestNum = 0;
  let bestDen = 1;
  let minDiff = 1.0;
  for (let den = 2; den <= 12; den++) {
    const num = Math.round(decimalPart * den);
    const diff = Math.abs(decimalPart - (num / den));
    if (diff < minDiff) {
      minDiff = diff;
      bestNum = num;
      bestDen = den;
    }
  }
  
  if (minDiff < 0.01) {
    if (integerPart === 0) {
      return `${bestNum}/${bestDen}`;
    }
    return `${integerPart} ${bestNum}/${bestDen}`;
  }
  
  return value.toFixed(2).replace(/\.?0+$/, '');
};

