// ====== MODULE: CLOUDFLARE SYNC ======
// Manages data sync across devices via Cloudflare Pages Functions & D1 SQL database

window.cloudflareConfigKey = 'classrm_cloudflare_config';
window.firebaseUser = null; // Map to keep compatibility with app.js
window._lastFirebasePushedAt = '';
window._lastFirebaseReceivedAt = '';
window._cloudflareSyncInterval = null;

// Helpers to get API URL
window.getCloudflareApiUrl = function() {
  try {
    const raw = localStorage.getItem(window.cloudflareConfigKey);
    if (raw) {
      const config = JSON.parse(raw);
      if (config.apiUrl) {
        // Strip trailing slash if present
        return config.apiUrl.replace(/\/$/, '') + '/api';
      }
    }
  } catch (e) {}
  
  // Default to current origin /api
  return window.location.origin.includes('file://') ? 'http://localhost:8788/api' : '/api';
};

window.loadCloudflareConfig = function() {
  try {
    const raw = localStorage.getItem(window.cloudflareConfigKey);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return { apiUrl: '' };
};

window.saveCloudflareConfig = function() {
  const apiUrl = document.getElementById('sys-cf-api-url')?.value.trim() || '';
  const config = { apiUrl };
  localStorage.setItem(window.cloudflareConfigKey, JSON.stringify(config));
  window.toast('💾 บันทึกการเชื่อมต่อเรียบร้อยแล้ว กำลังเชื่อมต่อระบบใหม่...');
  setTimeout(() => location.reload(), 1000);
};

window.saveCloudflareConfigFromModal = function() {
  const apiUrl = document.getElementById('modal-cf-api-url')?.value.trim() || '';
  const config = { apiUrl };
  localStorage.setItem(window.cloudflareConfigKey, JSON.stringify(config));
  window.toast('💾 บันทึกการเชื่อมต่อเรียบร้อยแล้ว กำลังเริ่มระบบใหม่...');
  setTimeout(() => location.reload(), 1000);
};

window.clearCloudflareConfig = function() {
  if (!confirm('ต้องการยกเลิกการซิงค์ Cloud และล้างข้อมูลการเชื่อมต่อใช่หรือไม่?')) return;
  localStorage.removeItem(window.cloudflareConfigKey);
  localStorage.removeItem('cf_auth_token');
  localStorage.removeItem('cf_user');
  window.toast('🗑️ ล้างข้อมูลเชื่อมต่อสำเร็จ กำลังเริ่มระบบใหม่...');
  setTimeout(() => location.reload(), 1000);
};

window.toggleLoginConfig = function() {
  const el = document.getElementById('cf-login-config-area');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }
};

// Initialize Cloudflare Sync
window.initCloudflare = function() {
  const config = window.loadCloudflareConfig();
  
  // Fill inputs
  const sysApiUrl = document.getElementById('sys-cf-api-url');
  if (sysApiUrl) sysApiUrl.value = config.apiUrl || '';

  const modalApiUrl = document.getElementById('modal-cf-api-url');
  if (modalApiUrl) modalApiUrl.value = config.apiUrl || '';

  // Show status area in settings
  const statusArea = document.getElementById('sys-fb-status-area');
  if (statusArea) statusArea.style.display = 'flex';

  // Load auth state
  const token = localStorage.getItem('cf_auth_token');
  const userRaw = localStorage.getItem('cf_user');

  if (token && userRaw) {
    try {
      const user = JSON.parse(userRaw);
      window.firebaseUser = user;
      window.updateFirebaseUI(true, user.email);
      window.startSyncing(user.uid);
    } catch (e) {
      console.error("Failed to parse user cache", e);
      window.cloudflareLogout(true);
    }
  } else {
    window.firebaseUser = null;
    window.updateFirebaseUI(false);
    window.stopSyncing();
    // Show login modal
    document.getElementById('firebase-login-modal')?.classList.add('open');
  }
};

// Keep aliases for DOM callbacks
window.initFirebase = window.initCloudflare;

window.showCloudflareLoginModal = function() {
  document.getElementById('firebase-login-modal')?.classList.add('open');
};
window.showFirebaseLoginModal = window.showCloudflareLoginModal;

window.updateFirebaseUI = function(isLoggedIn, email = '') {
  const badge = document.getElementById('sys-fb-status-badge');
  const userEmailEl = document.getElementById('sys-fb-user-email');
  
  if (badge) {
    badge.textContent = isLoggedIn ? 'เชื่อมต่อแล้ว' : 'ยังไม่เข้าระบบ';
    badge.style.background = isLoggedIn ? 'var(--green-light)' : 'var(--red-light)';
    badge.style.color = isLoggedIn ? 'var(--green)' : 'var(--red)';
  }
  if (userEmailEl) {
    userEmailEl.textContent = isLoggedIn ? `บัญชี: ${email}` : 'ยังไม่ได้เข้าสู่ระบบ';
  }

  const name = window.teacherName || (window.firebaseUser ? (window.firebaseUser.displayName || email.split('@')[0]) : email.split('@')[0]);

  // Update Sidebar Account UI
  const sidebarAccountInfo = document.getElementById('sidebar-account-info');
  const sidebarUserEmail = document.getElementById('sidebar-user-email');
  const sidebarProfileName = document.getElementById('sidebar-profile-name');
  const avatarContainer = document.getElementById('sidebar-avatar-container');
  
  if (sidebarAccountInfo) {
    if (isLoggedIn) {
      sidebarAccountInfo.classList.remove('logged-out');
      sidebarAccountInfo.classList.add('logged-in');
      sidebarAccountInfo.setAttribute('onclick', 'window.toggleProfileDropdown(event)');
      sidebarAccountInfo.setAttribute('title', 'คลิกเพื่อดูโปรไฟล์');
      
      if (sidebarProfileName) {
        sidebarProfileName.textContent = name;
        sidebarProfileName.style.display = 'block';
      }
      if (sidebarUserEmail) sidebarUserEmail.textContent = email;
      
      if (avatarContainer) {
        avatarContainer.innerHTML = '🐵'; // Claymorphic cute monster/animal placeholder
      }
      
      // Update dropdown header
      const dropName = document.getElementById('dropdown-display-name');
      const dropEmail = document.getElementById('dropdown-user-email');
      if (dropName) dropName.textContent = name;
      if (dropEmail) dropEmail.textContent = email;
      
    } else {
      sidebarAccountInfo.classList.remove('logged-in');
      sidebarAccountInfo.classList.add('logged-out');
      sidebarAccountInfo.setAttribute('onclick', 'window.showCloudflareLoginModal()');
      sidebarAccountInfo.setAttribute('title', 'คลิกเพื่อเข้าสู่ระบบ');
      
      if (sidebarProfileName) {
        sidebarProfileName.style.display = 'none';
      }
      if (sidebarUserEmail) sidebarUserEmail.textContent = 'เข้าสู่ระบบ Cloud Sync';
      
      if (avatarContainer) {
        avatarContainer.innerHTML = '👤';
      }
      
      const dropdown = document.getElementById('profile-dropdown-menu');
      if (dropdown) dropdown.style.display = 'none';
    }
  }

  // Update Topbar Account UI
  const topbarUserProfile = document.getElementById('topbar-user-profile');
  const topbarAvatarContainer = document.getElementById('topbar-avatar-container');
  const topbarDropName = document.getElementById('topbar-dropdown-display-name');
  const topbarDropEmail = document.getElementById('topbar-dropdown-user-email');

  if (topbarUserProfile) {
    if (isLoggedIn) {
      topbarUserProfile.classList.remove('logged-out');
      topbarUserProfile.classList.add('logged-in');
      topbarUserProfile.setAttribute('onclick', 'window.toggleTopbarDropdown(event)');
      topbarUserProfile.setAttribute('title', 'คลิกเพื่อดูโปรไฟล์');
      
      if (topbarAvatarContainer) {
        topbarAvatarContainer.innerHTML = '🐵';
      }
      
      if (topbarDropName) topbarDropName.textContent = name;
      if (topbarDropEmail) topbarDropEmail.textContent = email;
    } else {
      topbarUserProfile.classList.remove('logged-in');
      topbarUserProfile.classList.add('logged-out');
      topbarUserProfile.setAttribute('onclick', 'window.showCloudflareLoginModal()');
      topbarUserProfile.setAttribute('title', 'คลิกเพื่อเข้าสู่ระบบ');
      
      if (topbarAvatarContainer) {
        topbarAvatarContainer.innerHTML = '👤';
      }
      
      const topbarDropdown = document.getElementById('topbar-profile-dropdown-menu');
      if (topbarDropdown) topbarDropdown.style.display = 'none';
    }
  }
};

// Auth Handlers
window.handleFirebaseLogin = async function() {
  const email = document.getElementById('fb-login-email').value.trim();
  const password = document.getElementById('fb-login-password').value.trim();
  const errorEl = document.getElementById('fb-auth-error');

  if (!email || !password) {
    errorEl.textContent = '⚠️ กรุณากรอกอีเมลและรหัสผ่าน';
    errorEl.style.display = 'block';
    return;
  }

  errorEl.style.display = 'none';
  window.toast('🔑 กำลังเข้าสู่ระบบ...');

  try {
    const apiUrl = window.getCloudflareApiUrl();
    const res = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }

    localStorage.setItem('cf_auth_token', data.token);
    localStorage.setItem('cf_user', JSON.stringify(data.user));
    
    window.firebaseUser = data.user;
    window.updateFirebaseUI(true, data.user.email);
    window.closeModal('firebase-login-modal');
    window.startSyncing(data.user.uid);
    window.toast('✅ เข้าสู่ระบบซิงค์สำเร็จ');
  } catch (err) {
    errorEl.textContent = '❌ เข้าสู่ระบบล้มเหลว: ' + err.message;
    errorEl.style.display = 'block';
  }
};

window.handleFirebaseRegister = async function() {
  const email = document.getElementById('fb-login-email').value.trim();
  const password = document.getElementById('fb-login-password').value.trim();
  const errorEl = document.getElementById('fb-auth-error');

  if (!email || !password) {
    errorEl.textContent = '⚠️ กรุณากรอกอีเมลและรหัสผ่าน';
    errorEl.style.display = 'block';
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = '⚠️ รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    errorEl.style.display = 'block';
    return;
  }

  errorEl.style.display = 'none';
  window.toast('✨ กำลังสร้างบัญชีผู้ใช้ใหม่...');

  try {
    const apiUrl = window.getCloudflareApiUrl();
    const res = await fetch(`${apiUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'สมัครสมาชิกไม่สำเร็จ');
    }

    localStorage.setItem('cf_auth_token', data.token);
    localStorage.setItem('cf_user', JSON.stringify(data.user));

    window.firebaseUser = data.user;
    window.updateFirebaseUI(true, data.user.email);
    window.closeModal('firebase-login-modal');
    window.startSyncing(data.user.uid);
    window.toast('✅ สมัครสมาชิกและเข้าระบบซิงค์สำเร็จ');
  } catch (err) {
    errorEl.textContent = '❌ สมัครสมาชิกล้มเหลว: ' + err.message;
    errorEl.style.display = 'block';
  }
};

window.cloudflareLogout = function(silent = false) {
  if (!silent && !confirm('ต้องการออกจากระบบคลาวด์ใช่หรือไม่?')) return;
  
  window.stopSyncing();
  localStorage.removeItem('cf_auth_token');
  localStorage.removeItem('cf_user');
  window.firebaseUser = null;
  window.updateFirebaseUI(false);
  
  if (!silent) {
    window.toast('🚪 ออกจากระบบเรียบร้อยแล้ว');
  }
};
window.firebaseLogout = window.cloudflareLogout;

// Start Polling Synchronization
window.startSyncing = function(uid) {
  window.stopSyncing();
  
  // Initial sync pull
  window.pullAllDataFromCloudflare();
  
  // Polling every 20 seconds to sync metadata & newer saves
  window._cloudflareSyncInterval = setInterval(() => {
    window.pullAllDataFromCloudflare(true); // silent background pull
  }, 20000);
};

window.stopSyncing = function() {
  if (window._cloudflareSyncInterval) {
    clearInterval(window._cloudflareSyncInterval);
    window._cloudflareSyncInterval = null;
  }
};

// Reconnect Semester Sync
window.reconnectSemesterSync = function(uid) {
  // Pull semester data when current semester ID changes
  window.pullSemesterDataFromCloudflare();
};

// Pull Profile and Semester Data from Cloudflare
window.pullAllDataFromCloudflare = async function(silent = false) {
  if (!window.firebaseUser) return;
  
  const token = localStorage.getItem('cf_auth_token');
  if (!token) return;

  const apiUrl = window.getCloudflareApiUrl();
  
  try {
    // 1. Pull Profile
    const resProfile = await fetch(`${apiUrl}/sync/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (resProfile.status === 401) {
      window.cloudflareLogout(true);
      return;
    }
    
    if (resProfile.ok) {
      const dataProfile = await resProfile.json();
      const localProfileTime = localStorage.getItem('cls_global_profile_time') || '';
      
      // If cloud profile is newer
      if (dataProfile._exportedAt && dataProfile._exportedAt > localProfileTime && dataProfile._exportedAt !== window._lastFirebasePushedAt) {
        window._lastFirebaseReceivedAt = dataProfile._exportedAt;
        
        if (dataProfile.semesters) window.semesters = dataProfile.semesters;
        if (dataProfile.trashSemesters) window.trashSemesters = dataProfile.trashSemesters;
        
        const prevSemId = window.currentSemesterId;
        if (dataProfile.currentSemesterId) window.currentSemesterId = dataProfile.currentSemesterId;
        
        localStorage.setItem('cls_semesters', JSON.stringify(window.semesters));
        localStorage.setItem('cls_trash_semesters', JSON.stringify(window.trashSemesters));
        localStorage.setItem('cls_current_semester_id', window.currentSemesterId);
        localStorage.setItem('cls_global_profile_time', dataProfile._exportedAt);

        // Reconnect semester sync if semester changed
        if (prevSemId !== window.currentSemesterId) {
          window.reconnectSemesterSync(window.firebaseUser.uid);
        }
        
        window.rebuildClassSelector();
        window.renderPanel(window.currentPanel);
        if (!silent) window.toast('✨ ซิงค์โปรไฟล์จาก Cloud สำเร็จ');
      }
    }
    
    // 2. Pull Semester Data
    await window.pullSemesterDataFromCloudflare(silent);
    
  } catch (err) {
    console.error("Cloudflare Sync pull error:", err);
  }
};

window.pullSemesterDataFromCloudflare = async function(silent = false) {
  const semId = window.currentSemesterId;
  if (!semId || !window.firebaseUser) return;

  const token = localStorage.getItem('cf_auth_token');
  if (!token) return;

  const apiUrl = window.getCloudflareApiUrl();

  try {
    const res = await fetch(`${apiUrl}/sync/semester?semester_id=${semId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      const localSaveKey = 'cls_autosave_' + semId;
      const localSaveTime = localStorage.getItem(localSaveKey + '_time') || '';

      // If cloud data is newer
      if (data._exportedAt && data._exportedAt > localSaveTime && data._exportedAt !== window._lastFirebasePushedAt) {
        window._lastFirebaseReceivedAt = data._exportedAt;

        window.applyRestoreData(data, false);
        
        localStorage.setItem(localSaveKey, JSON.stringify(data));
        localStorage.setItem(localSaveKey + '_time', data._exportedAt);

        window.syncSubjectsToClassSubjects();
        window.rebuildClassSelector();
        if (window.renderPeriodSettings) window.renderPeriodSettings();
        window.renderPanel(window.currentPanel);
        
        window.toast('✨ ซิงค์ข้อมูลชั้นเรียนจาก Cloud เรียบร้อย');
      }
    } else if (res.status === 404) {
      // Semester does not exist in D1 yet, push local version
      window.pushSemesterDataToCloudflare();
    }
  } catch (err) {
    console.error("Cloudflare sync semester pull error:", err);
  }
};

// Push Data to Cloudflare
window.pushGlobalProfileToCloudflare = async function() {
  if (!window.firebaseUser) return;
  const token = localStorage.getItem('cf_auth_token');
  if (!token) return;

  const apiUrl = window.getCloudflareApiUrl();
  const timestamp = new Date().toISOString();
  
  window._lastFirebasePushedAt = timestamp;
  localStorage.setItem('cls_global_profile_time', timestamp);

  try {
    const res = await fetch(`${apiUrl}/sync/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        semesters: window.semesters,
        trashSemesters: window.trashSemesters,
        currentSemesterId: window.currentSemesterId,
        _exportedAt: timestamp
      })
    });
    
    if (!res.ok) {
      console.warn("Failed to push profile to Cloudflare");
    }
  } catch (err) {
    console.error("Cloudflare sync profile push error:", err);
  }
};
window.pushGlobalProfileToFirebase = window.pushGlobalProfileToCloudflare;

window.pushSemesterDataToCloudflare = async function() {
  if (!window.firebaseUser || !window.currentSemesterId) return;
  const token = localStorage.getItem('cf_auth_token');
  if (!token) return;

  const semId = window.currentSemesterId;
  const apiUrl = window.getCloudflareApiUrl();

  const data = window.collectAllData();
  const timestamp = new Date().toISOString();
  data._exportedAt = timestamp;
  
  window._lastFirebasePushedAt = timestamp;
  localStorage.setItem('cls_autosave_' + semId + '_time', timestamp);

  try {
    const res = await fetch(`${apiUrl}/sync/semester?semester_id=${semId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      console.warn("Failed to push semester data to Cloudflare");
    }
  } catch (err) {
    console.error("Cloudflare sync semester push error:", err);
  }
};
window.pushSemesterDataToFirebase = window.pushSemesterDataToCloudflare;

// Check and trigger init on start
window.addEventListener('DOMContentLoaded', () => {
  window.initCloudflare();
});
