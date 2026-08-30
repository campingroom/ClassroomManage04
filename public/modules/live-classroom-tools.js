// ====== LIVE TEACHING MODE — CLASSROOM TOOLS (confetti, group generator, challenge wheel, presentation board) ======

// Canvas Confetti Generator
window.launchConfetti = function(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  
  // Set width & height
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#6366f1'];
  const particles = [];

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height - 20,
      vx: (Math.random() - 0.5) * 8,
      vy: -(Math.random() * 8 + 6),
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rSpeed: (Math.random() - 0.5) * 10
    });
  }

  let animationFrame;
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.rSpeed;

      if (p.y < canvas.height + 20) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      animationFrame = requestAnimationFrame(update);
    } else {
      canvas.style.display = 'none';
    }
  }

  cancelAnimationFrame(animationFrame);
  update();
};

// 11. Group Generator
window.openGroupModal = function() {
  const modal = document.getElementById('live-group-modal');
  if (modal) {
    document.getElementById('group-result-container').style.display = 'none';
    document.getElementById('group-input-form').style.display = 'block';
    modal.classList.add('open');
  }
};

window.generateGroups = function() {
  const students = window.classData[window._liveRoomId] || [];
  if (!students.length) {
    window.toast('❌ ไม่มีนักเรียนให้แบ่งกลุ่ม');
    return;
  }

  const mode = document.getElementById('group-mode-select').value; // 'count' or 'size'
  const val = parseInt(document.getElementById('group-value-input').value);
  if (isNaN(val) || val <= 0) {
    window.toast('❌ กรุณาระบุจำนวนที่ถูกต้อง');
    return;
  }

  const onlyPresent = document.getElementById('group-only-present')?.checked;
  const date = window.today();
  const period = window._livePeriod;
  const subject = window._liveSubject;

  let candidates = [...students];
  if (onlyPresent) {
    candidates = students.filter(s => {
      const key = `${window._liveRoomId}_${s.id}_${date}_${period}_${subject}`;
      const status = window.attData[key];
      return status === 'P' || status === 'L';
    });
  }

  if (candidates.length < 2) {
    window.toast('❌ รายชื่อที่สามารถจับกลุ่มได้ต้องมีอย่างน้อย 2 คน');
    return;
  }

  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  let groupCount = 0;
  if (mode === 'count') {
    groupCount = val;
  } else {
    groupCount = Math.ceil(candidates.length / val);
  }

  const groups = Array.from({ length: groupCount }, () => []);
  candidates.forEach((s, idx) => {
    groups[idx % groupCount].push(s);
  });

  // Display groups
  const resultDiv = document.getElementById('group-results');
  let html = '';
  groups.forEach((g, idx) => {
    if (g.length === 0) return;
    html += `
      <div style="background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 12px; min-width: 150px;">
        <h4 style="margin: 0 0 8px 0; color: var(--accent); border-bottom: 2px solid var(--accent-light); padding-bottom: 4px;">กลุ่มที่ ${idx+1}</h4>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: var(--text);">
          ${g.map(s => `<li>${window.formatLiveStudentName(s)} (เลขที่ ${s.no})</li>`).join('')}
        </ul>
      </div>
    `;
  });

  resultDiv.innerHTML = html;
  document.getElementById('group-input-form').style.display = 'none';
  document.getElementById('group-result-container').style.display = 'block';
  
  // Attach raw list for clipboard copy
  window.lastGeneratedGroupsText = groups.map((g, idx) => {
    return `กลุ่มที่ ${idx+1}:\n` + g.map(s => ` - ${window.formatLiveStudentName(s)} (เลขที่ ${s.no})`).join('\n');
  }).join('\n\n');

  window.playLiveSound('success');
};

window.copyGroupsToClipboard = function() {
  if (!window.lastGeneratedGroupsText) return;
  navigator.clipboard.writeText(window.lastGeneratedGroupsText)
    .then(() => window.toast('📋 คัดลอกรายชื่อกลุ่มลงคลิปบอร์ดแล้ว'))
    .catch(() => window.toast('❌ ไม่สามารถคัดลอกได้'));
};

// 12. Challenge Wheel (Canvas Spinning Wheel)
window.wheelItems = [
  "ท่องสูตรคูณแม่ 9",
  "แปลศัพท์คำว่า 'Notebook'",
  "ช่วยเก็บขยะหลังห้องเรียน",
  "ทำท่าเลียนแบบสัตว์ที่ชอบ",
  "บอกชื่อสัตว์ปีก 3 ชนิด",
  "ช่วยทำความสะอาดกระดาน",
  "ร้องเพลงท่อนที่ชอบที่สุด",
  "เต้นท่าไก่ 10 วินาที"
];
window.isWheelSpinning = false;
window.wheelAngle = 0;

window.openWheelModal = function() {
  const modal = document.getElementById('live-wheel-modal');
  if (!modal) return;
  
  const textarea = document.getElementById('wheel-items-input');
  if (textarea) {
    textarea.value = window.wheelItems.join('\n');
  }

  modal.classList.add('open');
  setTimeout(() => window.drawWheel(), 100);
};

window.drawWheel = function() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const radius = width / 2 - 10;
  
  ctx.clearRect(0, 0, width, height);

  const len = window.wheelItems.length;
  if (!len) {
    ctx.font = '16px Sarabun';
    ctx.fillStyle = 'var(--text3)';
    ctx.textAlign = 'center';
    ctx.fillText("ไม่มีข้อมูลนำโชค", cx, cy);
    return;
  }

  const arc = (Math.PI * 2) / len;
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#14b8a6', '#f97316', '#ec4899'];

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(window.wheelAngle);

  for (let i = 0; i < len; i++) {
    const angle = i * arc;
    ctx.fillStyle = colors[i % colors.length];
    
    // Draw sector
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, angle, angle + arc);
    ctx.lineTo(0, 0);
    ctx.fill();

    // Draw text
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Sarabun';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.rotate(angle + arc / 2);
    
    const text = window.wheelItems[i];
    const displayText = text.length > 15 ? text.substring(0, 14) + '...' : text;
    ctx.fillText(displayText, radius - 20, 0);
    ctx.restore();
  }
  ctx.restore();

  // Draw Center Hub & Arrow Indicator
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = 'var(--accent)';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // Arrow Pointer (pointing to the left / into the wheel)
  ctx.fillStyle = 'var(--text)';
  ctx.beginPath();
  ctx.moveTo(width - 25, cy); // Left tip pointing into the wheel
  ctx.lineTo(width - 5, cy - 12); // Right-top base
  ctx.lineTo(width - 5, cy + 12); // Right-bottom base
  ctx.closePath();
  ctx.fill();
};

window.spinWheel = function() {
  if (window.isWheelSpinning) return;

  // Read latest items
  const txt = document.getElementById('wheel-items-input')?.value || '';
  window.wheelItems = txt.split('\n').map(x => x.trim()).filter(Boolean);
  if (!window.wheelItems.length) {
    window.toast('❌ กรุณาระบุภารกิจอย่างน้อย 1 รายการ');
    return;
  }

  window.isWheelSpinning = true;
  const btn = document.querySelector('#live-wheel-modal button.btn-primary');
  if (btn) btn.disabled = true;

  const duration = 3000 + Math.random() * 2000; // 3 to 5 seconds
  const startSpeed = 0.35 + Math.random() * 0.15;
  const startTime = Date.now();
  
  let currentSpeed = startSpeed;
  let lastTickAngle = 0;
  const tickStep = (Math.PI * 2) / window.wheelItems.length;

  function animate() {
    const elapsed = Date.now() - startTime;
    
    // Deceleration curve
    const progress = elapsed / duration;
    if (progress >= 1) {
      window.isWheelSpinning = false;
      if (btn) btn.disabled = false;
      
      // Calculate landing index
      // Normalizing the angle between 0 and 2pi
      const finalAngle = window.wheelAngle % (Math.PI * 2);
      const arc = (Math.PI * 2) / window.wheelItems.length;
      
      // Point is on the right (0 radians). The pointer indicates what is currently at 0 radians relative to the canvas.
      // Index is computed opposite to the rotation direction.
      let landingIndex = Math.floor((Math.PI * 2 - finalAngle) / arc) % window.wheelItems.length;
      if (landingIndex < 0) landingIndex += window.wheelItems.length;
      
      const winningText = window.wheelItems[landingIndex];
      
      // Highlight the result in the UI
      window.playLiveSound('success');
      alert(`🎯 ภารกิจสุ่มได้คือ: "${winningText}"`);
      return;
    }

    currentSpeed = startSpeed * (1 - easeOutQuad(progress));
    window.wheelAngle += currentSpeed;
    
    // Play tick sound when passing a division
    if (Math.floor(window.wheelAngle / tickStep) !== Math.floor(lastTickAngle / tickStep)) {
      window.playLiveSound('tick');
      lastTickAngle = window.wheelAngle;
    }

    window.drawWheel();
    requestAnimationFrame(animate);
  }

  function easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
  }

  animate();
};

// 13. Presentation Board
window.openBoardModal = function() {
  const modal = document.getElementById('live-board-modal');
  if (!modal) return;

  document.getElementById('board-editor-wrap').style.display = 'block';
  document.getElementById('board-view-wrap').style.display = 'none';
  document.getElementById('board-text-input').value = '🌟 กิจกรรมวันนี้:\nให้นักเรียนทุกคนเตรียมสมุดแบบฝึกหัดแล้วเปิดไปหน้า 45 ทำแบบฝึกหัดท้ายบทที่ 3 กันนะคะ';
  document.getElementById('board-img-preview').src = '';
  document.getElementById('board-img-preview').style.display = 'none';

  modal.classList.add('open');
};

window.handleBoardImageSelect = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById('board-img-preview');
    if (img) {
      img.src = e.target.result;
      img.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
};

window.showBoardPresentation = function() {
  const textVal = document.getElementById('board-text-input').value;
  const viewText = document.getElementById('board-view-text');
  const viewImg = document.getElementById('board-view-image');
  const uploadedImg = document.getElementById('board-img-preview');

  if (viewText) {
    viewText.innerHTML = textVal.replace(/\n/g, '<br>');
  }

  if (viewImg && uploadedImg && uploadedImg.src && uploadedImg.style.display !== 'none') {
    viewImg.src = uploadedImg.src;
    viewImg.style.display = 'block';
  } else if (viewImg) {
    viewImg.style.display = 'none';
  }

  document.getElementById('board-editor-wrap').style.display = 'none';
  document.getElementById('board-view-wrap').style.display = 'flex';
};

window.exitBoardPresentation = function() {
  document.getElementById('board-editor-wrap').style.display = 'block';
  document.getElementById('board-view-wrap').style.display = 'none';
};
