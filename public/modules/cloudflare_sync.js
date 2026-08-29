// ====== MODULE: CLOUDFLARE SYNC ======
// Manages data sync across devices via Cloudflare Pages Functions & D1 SQL database

window.cloudflareConfigKey = 'classrm_cloudflare_config';
window.firebaseUser = null; // Map to keep compatibility with app.js

function cleanSyncKey(key) {
  if (!key) return '';
  let clean = key.trim();
  
  // Try to extract if it's a URL or contains key parameters
  if (clean.includes('://') || clean.includes('?') || clean.includes('/') || clean.includes('sync_key=') || clean.includes('key=')) {
    try {
      let tempUrl = clean;
      if (!tempUrl.includes('://') && (tempUrl.includes('/') || tempUrl.includes('.'))) {
        tempUrl = 'https://' + tempUrl;
      }
      const url = new URL(tempUrl);
      const extracted = url.searchParams.get('sync_key') || url.searchParams.get('key');
      if (extracted) {
        return extracted.trim();
      }
    } catch (e) {
      // Fallback
      if (clean.includes('sync_key=')) {
        const parts = clean.split('sync_key=');
        if (parts.length > 1) {
          return parts[1].split('&')[0].split('#')[0].trim();
        }
      }
      if (clean.includes('key=')) {
        const parts = clean.split('key=');
        if (parts.length > 1) {
          return parts[1].split('&')[0].split('#')[0].trim();
        }
      }
    }
    // If it has URL structure but no parameter was extracted, return empty to trigger validation error
    if (clean.includes('/') || clean.includes('.')) {
      return '';
    }
  }
  return clean;
}
window._lastFirebasePushedAt = '';
window._lastFirebaseReceivedAt = '';
window._cloudflareSyncInterval = null;
window._lastTimePulledCloud = 0;
window._pushSemesterDebounceTimer = null;
window._pushProfileDebounceTimer = null;

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
  
  // Default to the deployed Pages URL if opened locally
  if (window.location.origin.includes('file://') || window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
    return 'https://classroom-management-04.pages.dev/api';
  }
  return '/api';
};

window.loadCloudflareConfig = function() {
  try {
    const raw = localStorage.getItem(window.cloudflareConfigKey);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return { apiUrl: '' };
};



window.clearCloudflareConfig = function() {
  if (!confirm('ต้องการยกเลิกการซิงค์ Cloud และล้างข้อมูลการเชื่อมต่อใช่หรือไม่?')) return;
  localStorage.removeItem(window.cloudflareConfigKey);
  localStorage.removeItem('cf_auth_token');
  localStorage.removeItem('cf_user');
  window.toast('🗑️ ล้างข้อมูลเชื่อมต่อสำเร็จ กำลังเริ่มระบบใหม่...');
  setTimeout(() => location.reload(), 1000);
};

window.toggleSection = function(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }
};

window.toggleLoginConfig = function() {
  window.toggleSection('cf-login-config-area');
};

window.switchAuthTab = function(tab) {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  if (!tabLogin || !tabRegister || !formLogin || !formRegister) return;
  
  if (tab === 'login') {
    tabLogin.style.background = 'var(--surface)';
    tabLogin.style.color = 'var(--accent)';
    tabLogin.style.fontWeight = '700';
    
    tabRegister.style.background = 'transparent';
    tabRegister.style.color = 'var(--text3)';
    tabRegister.style.fontWeight = '500';
    
    formLogin.style.display = 'flex';
    formRegister.style.display = 'none';
  } else {
    tabRegister.style.background = 'var(--surface)';
    tabRegister.style.color = 'var(--teal)';
    tabRegister.style.fontWeight = '700';
    
    tabLogin.style.background = 'transparent';
    tabLogin.style.color = 'var(--text3)';
    tabLogin.style.fontWeight = '500';
    
    formLogin.style.display = 'none';
    formRegister.style.display = 'flex';
  }
};

window.cloudflareLoginProcess = async function() {
  const emailInput = document.getElementById('cf-email-input');
  const passwordInput = document.getElementById('cf-password-input');
  if (!emailInput || !passwordInput) return;
  
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!email || !password) {
    alert('⚠️ กรุณากรอกอีเมลและรหัสผ่าน');
    return;
  }
  
  window.showSyncProgress('กำลังเข้าสู่ระบบ...');
  const apiUrl = window.getCloudflareApiUrl();
  
  try {
    const res = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    window.hideSyncProgress();
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }
    
    const data = await res.json();
    
    localStorage.setItem('cf_auth_token', data.token);
    localStorage.setItem('cf_user', JSON.stringify({ uid: data.user.uid, email: data.user.email }));
    
    window.toast('🔑 เข้าสู่ระบบสำเร็จ กำลังซิงค์ข้อมูลใหม่...');
    window.closeModal('firebase-login-modal');
    
    setTimeout(() => location.reload(), 1000);
  } catch (e) {
    window.hideSyncProgress();
    alert('❌ ' + e.message);
  }
};

window.cloudflareRegisterProcess = async function() {
  const emailInput = document.getElementById('cf-reg-email-input');
  const passwordInput = document.getElementById('cf-reg-password-input');
  if (!emailInput || !passwordInput) return;
  
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!email || !password) {
    alert('⚠️ กรุณากรอกอีเมลและรหัสผ่าน');
    return;
  }
  if (password.length < 6) {
    alert('⚠️ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    return;
  }
  
  window.showSyncProgress('กำลังสมัครสมาชิก...');
  const apiUrl = window.getCloudflareApiUrl();
  
  try {
    const res = await fetch(`${apiUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    window.hideSyncProgress();
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'สมัครสมาชิกไม่สำเร็จ');
    }
    
    const data = await res.json();
    
    localStorage.setItem('cf_auth_token', data.token);
    localStorage.setItem('cf_user', JSON.stringify({ uid: data.user.uid, email: data.user.email }));
    
    window.toast('📝 สมัครสมาชิกสำเร็จ กำลังเริ่มต้นเชื่อมต่อข้อมูล...');
    window.closeModal('firebase-login-modal');
    
    setTimeout(() => location.reload(), 1000);
  } catch (e) {
    window.hideSyncProgress();
    alert('❌ ' + e.message);
  }
};

window.cloudflareLogoutProcess = function() {
  if (!confirm('ต้องการลงชื่อออกจากระบบคลาวด์ใช่หรือไม่? ข้อมูลในคลาวด์จะไม่สูญหาย และคุณสามารถเข้าสู่ระบบใหม่ได้ทุกเมื่อ')) return;
  
  window.stopSyncing();
  localStorage.removeItem('cf_auth_token');
  localStorage.removeItem('cf_user');
  
  localStorage.removeItem('cf_last_active_token');
  localStorage.removeItem('cls_global_profile_time');
  localStorage.removeItem('cls_last_synced_profile');
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && ((key.startsWith('cls_autosave_') && key.endsWith('_time')) || key.startsWith('cls_last_synced_data_'))) {
      localStorage.removeItem(key);
    }
  }
  
  window.toast('🚪 ออกจากระบบสำเร็จ กำลังรีโหลดแอป...');
  setTimeout(() => location.reload(), 1000);
};

// Initialize Cloudflare Sync
window.initCloudflare = function() {
  const config = window.loadCloudflareConfig();
  
  // Fill inputs
  const sysApiUrl = document.getElementById('sys-cf-api-url');
  if (sysApiUrl) sysApiUrl.value = config.apiUrl || '';

  const modalApiUrl = document.getElementById('modal-cf-api-url');
  if (modalApiUrl) modalApiUrl.value = config.apiUrl || '';

  const mainApiUrl = document.getElementById('main-cf-api-url');
  if (mainApiUrl) mainApiUrl.value = config.apiUrl || '';

  // Show status area in settings
  const statusArea = document.getElementById('sys-fb-status-area');
  if (statusArea) statusArea.style.display = 'flex';

  // 1. URL key sync detection disabled (login only)

  let token = localStorage.getItem('cf_auth_token');
  let userRaw = localStorage.getItem('cf_user');

  // Verify if it is a real account (has email with @)
  let isRealAccount = false;
  let userObj = null;
  if (userRaw) {
    try {
      userObj = JSON.parse(userRaw);
      if (userObj.email && userObj.email.includes('@')) {
        isRealAccount = true;
      }
    } catch(e) {}
  }

  // If NOT logged in (no real account)
  if (!isRealAccount) {
    // Clear all classroom data from localStorage
    localStorage.removeItem('cls_current_semester_id');
    localStorage.removeItem('cls_semesters');
    localStorage.removeItem('cls_trash_semesters');
    localStorage.removeItem('cls_global_profile');
    localStorage.removeItem('cls_global_profile_time');
    localStorage.removeItem('cls_last_synced_profile');
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('cls_autosave_') || key.startsWith('cls_last_synced_data_'))) {
        localStorage.removeItem(key);
      }
    }

    // Clear memory variables
    window.currentSemesterId = '';
    window.semesters = [];
    window.trashSemesters = [];

    // Reset UI
    if (window.rebuildClassSelector) window.rebuildClassSelector();
    const selectScreen = document.getElementById('semester-select-screen');
    const appScreen = document.querySelector('.app');
    if (selectScreen) selectScreen.style.display = 'flex';
    if (appScreen) appScreen.style.display = 'none';
    if (window.renderSemesterList) window.renderSemesterList();

    // Show custom status
    const badge = document.getElementById('sys-fb-status-badge');
    if (badge) {
      badge.textContent = 'ยังไม่ได้เข้าสู่ระบบ';
      badge.style.background = 'var(--red-light)';
      badge.style.color = 'var(--red)';
    }

    window.updateSyncStatusBadge('disconnected');

    // Force open login modal
    setTimeout(() => {
      window.showCloudflareLoginModal();
    }, 500);
    return;
  }

  // 4. Detect sync key switch to clear stale local timestamps & caches
  const lastActiveToken = localStorage.getItem('cf_last_active_token');
  if (token !== lastActiveToken) {
    localStorage.setItem('cf_last_active_token', token || '');
    localStorage.removeItem('cls_global_profile_time');
    localStorage.removeItem('cls_last_synced_profile');
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key) {
        if (key.startsWith('cls_autosave_') && key.endsWith('_time')) {
          localStorage.removeItem(key);
        } else if (key.startsWith('cls_last_synced_data_')) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  // Load auth state
  try {
    window.firebaseUser = userObj;
    window.updateFirebaseUI(true, userObj.email);
    
    if (userObj.isLocal) {
      window.updateSyncStatusBadge('connected');
      const badge = document.getElementById('sys-fb-status-badge');
      if (badge) {
        badge.textContent = 'โหมดใช้งานในเครื่อง (Offline)';
        badge.style.background = 'var(--teal-light)';
        badge.style.color = 'var(--teal)';
      }
      window.addSyncLog('โหมดใช้งานในเครื่อง (Local Mode): ข้อมูลถูกบันทึกในเครื่องอัตโนมัติ', 'success');
      return;
    }
    
    // Setup UI elements
    const autoSaveCheckbox = document.getElementById('sys-cf-auto-save');
    if (autoSaveCheckbox) {
      autoSaveCheckbox.checked = localStorage.getItem('cf_auto_save') !== 'false';
    }
    const lastTime = localStorage.getItem('cf_last_sync_time');
    const lastMode = localStorage.getItem('cf_last_sync_mode') || 'อัตโนมัติ';
    const timeLabel = document.getElementById('cf-sync-time-label');
    if (timeLabel && lastTime) {
      timeLabel.textContent = `ล่าสุด: ${lastTime.split(' ')[1] || lastTime} (${lastMode})`;
    }
    
    window.addSyncLog('เริ่มต้นระบบซิงก์คลาวด์...', 'system');
    window.addSyncLog('เซิร์ฟเวอร์ API: ' + window.getCloudflareApiUrl(), 'info');
    window.addSyncLog('ลงชื่อเข้าใช้: ' + userObj.email, 'info');

    window.updateSyncStatusBadge('connected');

    // Start syncing directly
    window.startSyncing(token);
  } catch (e) {
    console.error("Failed to parse user cache", e);
    window.addSyncLog('ข้อผิดพลาดการโหลดกุญแจซิงก์: ' + e.message, 'error');
    window.cloudflareLogoutProcess();
  }
};

// Keep aliases for DOM callbacks
window.initFirebase = window.initCloudflare;

window.showCloudflareLoginModal = function() {
  // Update inputs inside modal
  const token = localStorage.getItem('cf_auth_token') || '';
  const keyInput = document.getElementById('cf-share-key-display');
  if (keyInput) keyInput.value = token;
  document.getElementById('firebase-login-modal')?.classList.add('open');
};
window.showFirebaseLoginModal = window.showCloudflareLoginModal;

window.updateFirebaseUI = function(isLoggedIn, email = '') {
  const badge = document.getElementById('sys-fb-status-badge');
  const userEmailEl = document.getElementById('sys-fb-user-email');
  const token = localStorage.getItem('cf_auth_token') || '';
  
  // Show / Hide logged in vs logged out sections inside the modal
  const loggedInState = document.getElementById('cf-logged-in-state');
  const loggedOutState = document.getElementById('cf-logged-out-state');
  const loggedInEmail = document.getElementById('cf-logged-in-email');
  
  const isRealAccount = email && email.includes('@');
  
  if (loggedInState && loggedOutState) {
    if (isRealAccount) {
      loggedInState.style.display = 'flex';
      loggedOutState.style.display = 'none';
      if (loggedInEmail) loggedInEmail.textContent = email;
    } else {
      loggedInState.style.display = 'none';
      loggedOutState.style.display = 'flex';
    }
  }
  
  if (badge) {
    badge.textContent = isRealAccount ? 'บัญชีคลาวด์' : 'เชื่อมต่อแล้ว';
    badge.style.background = isRealAccount ? 'var(--accent-light)' : 'var(--green-light)';
    badge.style.color = isRealAccount ? 'var(--accent)' : 'var(--green)';
  }
  
  const mobBadge = document.getElementById('mobile-offline-badge');
  if (mobBadge) {
    if (isRealAccount) {
      mobBadge.textContent = 'ซิงค์คลาวด์แล้ว';
      mobBadge.style.color = 'var(--green)';
      mobBadge.style.background = 'var(--green-light)';
    } else {
      mobBadge.textContent = 'พรีวิวออฟไลน์';
      mobBadge.style.color = 'var(--teal)';
      mobBadge.style.background = 'var(--teal-light)';
    }
  }
  if (userEmailEl) {
    const shareUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?sync_key=" + token;
    userEmailEl.textContent = isRealAccount ? `บัญชี: ${email}` : `คีย์ลิงค์: ${shareUrl}`;
  }

  const name = window.teacherName || (window.firebaseUser ? (window.firebaseUser.displayName || 'ครูผู้สอน') : 'ครูผู้สอน');

  // Update Sidebar Account UI
  const sidebarAccountInfo = document.getElementById('sidebar-account-info');
  const sidebarUserEmail = document.getElementById('sidebar-user-email');
  const sidebarProfileName = document.getElementById('sidebar-profile-name');
  const avatarContainer = document.getElementById('sidebar-avatar-container');
  
  const displayLabel = isRealAccount ? email : ('ID: ' + token.substring(0, 10) + '...');
  const fullDisplayLabel = isRealAccount ? email : ('ID: ' + token);

  if (sidebarAccountInfo) {
    sidebarAccountInfo.classList.remove('logged-out');
    sidebarAccountInfo.classList.add('logged-in');
    sidebarAccountInfo.setAttribute('onclick', "window.toggleProfileDropdown(event)");
    sidebarAccountInfo.setAttribute('title', 'คลิกเพื่อดูการเชื่อมต่อคลาวด์');
    
    if (window.updateSidebarProfileUI) {
      window.updateSidebarProfileUI();
    } else {
      if (sidebarProfileName) {
        sidebarProfileName.textContent = name;
        sidebarProfileName.style.display = 'block';
      }
      if (sidebarUserEmail) {
        sidebarUserEmail.textContent = displayLabel;
      }
      if (avatarContainer) {
        avatarContainer.innerHTML = 'สม';
      }
    }
    
    // Update dropdown header
    const dropName = document.getElementById('dropdown-display-name');
    const dropEmail = document.getElementById('dropdown-user-email');
    if (dropName) dropName.textContent = name;
    if (dropEmail) dropEmail.textContent = fullDisplayLabel;
  }

  // Update Topbar Account UI
  const topbarUserProfile = document.getElementById('topbar-user-profile');
  const topbarAvatarContainer = document.getElementById('topbar-avatar-container');
  const topbarDropName = document.getElementById('topbar-dropdown-display-name');
  const topbarDropEmail = document.getElementById('topbar-dropdown-user-email');

  if (topbarUserProfile) {
    topbarUserProfile.classList.remove('logged-out');
    topbarUserProfile.classList.add('logged-in');
    topbarUserProfile.setAttribute('onclick', 'window.toggleTopbarDropdown(event)');
    topbarUserProfile.setAttribute('title', 'คลิกเพื่อดูการเชื่อมต่อคลาวด์');
    
    if (topbarAvatarContainer) {
      if (window.getTeacherInitials) {
        topbarAvatarContainer.textContent = window.getTeacherInitials(name);
      } else {
        topbarAvatarContainer.innerHTML = 'สม';
      }
    }
    
    if (topbarDropName) topbarDropName.textContent = name;
    if (topbarDropEmail) topbarDropEmail.textContent = fullDisplayLabel;
  }
};

// Handlers for Link Sharing Keys (Disabled - Login Only)
window.applyCustomSyncKey = function() {
  alert('ระบบคีย์แชร์ถูกยกเลิกแล้ว กรุณาเข้าสู่ระบบด้วยอีเมล');
};
window.copyShareLink = function() {
  alert('ระบบคีย์แชร์ถูกยกเลิกแล้ว กรุณาใช้ระบบลงชื่อเข้าใช้ด้วยอีเมล');
};
window.cloudflareLogout = function(silent = false) {
  window.cloudflareLogoutProcess();
};
window.firebaseLogout = window.cloudflareLogout;

// Start Polling Synchronization
window.startSyncing = function(uid) {
  window.stopSyncing();
  
  // Initial sync pull
  window.pullAllDataFromCloudflare();
  
  // Polling every 10 seconds to sync metadata & newer saves
  window._cloudflareSyncInterval = setInterval(() => {
    window.pullAllDataFromCloudflare(true); // silent background pull
  }, 10000);
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
  const semId = window.currentSemesterId;

  // Throttle silent background pulls (minimum 5s interval)
  const nowTime = Date.now();
  if (silent && nowTime - window._lastTimePulledCloud < 5000) {
    return;
  }
  window._lastTimePulledCloud = nowTime;

  // 0. Auto PUSH unsynced profile or semester data before pulling
  const hasUnsyncedProfile = localStorage.getItem('cf_has_unsynced_profile') === 'true';
  const hasUnsyncedSemester = semId && localStorage.getItem('cf_has_unsynced_changes_' + semId) === 'true';

  if (hasUnsyncedProfile || hasUnsyncedSemester) {
    if (!silent) window.addSyncLog('ตรวจพบข้อมูลค้างท่อที่ยังไม่ได้บันทึกขึ้นคลาวด์... กำลังส่งข้อมูลก่อนดึงใหม่', 'warn');
    try {
      if (hasUnsyncedProfile) {
        await window.performProfilePush();
      }
      if (hasUnsyncedSemester) {
        await window.performSemesterPush();
      }
    } catch (e) {
      console.warn("Failed to push unsynced changes before pulling", e);
      window.updateSyncStatusBadge('disconnected');
      return;
    }
  }

  if (!silent) window.addSyncLog('เริ่มดึงข้อมูลระบบจากคลาวด์...', 'system');
  
  try {
    // 1. Pull Profile
    const resProfile = await fetch(`${apiUrl}/sync/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (resProfile.status === 401) {
      window.addSyncLog('รหัสผ่าน/กุญแจซิงก์ไม่ถูกต้อง (401)', 'error');
      window.cloudflareLogout(true);
      return;
    }
    
    if (!resProfile.ok) {
      let errMsg = `Profile sync failed with status ${resProfile.status}`;
      try {
        const errData = await resProfile.json();
        if (errData && errData.error) {
          errMsg = errData.error;
        }
      } catch (e) {}
      throw new Error(errMsg);
    }
    
    const dataProfile = await resProfile.json();
    const localProfileTime = localStorage.getItem('cls_global_profile_time') || '';
      
      // If cloud profile is different from our last synced profile
      if (dataProfile._exportedAt && dataProfile._exportedAt !== localProfileTime && dataProfile._exportedAt !== window._lastFirebasePushedAt) {
        window._lastFirebaseReceivedAt = dataProfile._exportedAt;
        window.addSyncLog('ตรวจพบการแก้ไขโปรไฟล์ใหม่จากอุปกรณ์อื่น... กำลังอัปเดตข้อมูลโครงสร้าง', 'warn');
        
        // Merge semesters list instead of hard overwrite
        if (dataProfile.semesters) {
          const semestersMap = {};
          (window.semesters || []).forEach(s => { semestersMap[s.id] = s; });
          dataProfile.semesters.forEach(s => {
            semestersMap[s.id] = { ...(semestersMap[s.id] || {}), ...s };
          });
          window.semesters = Object.values(semestersMap);
        }
        if (dataProfile.trashSemesters) {
          const trashMap = {};
          (window.trashSemesters || []).forEach(s => { trashMap[s.id] = s; });
          dataProfile.trashSemesters.forEach(s => {
            trashMap[s.id] = { ...(trashMap[s.id] || {}), ...s };
          });
          window.trashSemesters = Object.values(trashMap);
        }
        
        const prevSemId = window.currentSemesterId;
        if (dataProfile.currentSemesterId) window.currentSemesterId = dataProfile.currentSemesterId;
        
        localStorage.setItem('cls_semesters', JSON.stringify(window.semesters));
        localStorage.setItem('cls_trash_semesters', JSON.stringify(window.trashSemesters));
        localStorage.setItem('cls_current_semester_id', window.currentSemesterId);
        localStorage.setItem('cls_global_profile_time', dataProfile._exportedAt);
        localStorage.setItem('cls_last_synced_profile', JSON.stringify({
          semesters: window.semesters,
          trashSemesters: window.trashSemesters,
          currentSemesterId: window.currentSemesterId
        }));

        // Reconnect semester sync if semester changed
        if (prevSemId !== window.currentSemesterId) {
          window.reconnectSemesterSync(window.firebaseUser.uid);
        }
        
        window.rebuildClassSelector();
        window.renderPanel(window.currentPanel);
        if (!silent) window.toast('✨ ซิงค์โปรไฟล์จาก Cloud สำเร็จ');
      } else {
        if (!silent) window.addSyncLog('ข้อมูลโปรไฟล์ตรงกันอยู่แล้ว', 'info');
      }
    
    // 2. Pull Semester Data
    await window.pullSemesterDataFromCloudflare(silent);

    // Auto-show app if it was hidden on semester select screen but we now have active semester
    if (window.currentSemesterId) {
      const selectScreen = document.getElementById('semester-select-screen');
      const appScreen = document.querySelector('.app');
      if (selectScreen && selectScreen.style.display !== 'none') {
        selectScreen.style.display = 'none';
        if (appScreen) appScreen.style.display = 'flex';
        window.goto('setup-rooms');
      }
    }
    
    window.updateSyncStatusBadge('connected');
    const syncTime = dataProfile._exportedAt ? new Date(dataProfile._exportedAt) : new Date();
    window.updateSyncTimeDisplay(syncTime, silent ? 'อัตโนมัติ' : 'สั่งเอง');
  } catch (err) {
    console.error("Cloudflare Sync pull error:", err);
    window.addSyncLog('การดึงข้อมูลจาก Cloud ล้มเหลว: ' + err.message, 'error');
    window.updateSyncStatusBadge('disconnected');
  }
};

window.pullSemesterDataFromCloudflare = async function(silent = false) {
  const semId = window.currentSemesterId;
  if (!semId || !window.firebaseUser) return;

  const token = localStorage.getItem('cf_auth_token');
  if (!token) return;

  const apiUrl = window.getCloudflareApiUrl();

  if (!silent) window.addSyncLog(`กำลังตรวจสอบข้อมูลห้องเรียนบน Cloud สำหรับปีการศึกษา: ${semId}...`, 'system');

  try {
    const res = await fetch(`${apiUrl}/sync/semester?semester_id=${semId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const localSaveKey = 'cls_autosave_' + semId;
    const lastSyncedTime = localStorage.getItem(localSaveKey + '_time') || '';
    const hasUnsynced = localStorage.getItem('cf_has_unsynced_changes_' + semId) === 'true';

    if (res.ok) {
      const data = await res.json();

      // If cloud data has a different timestamp (from another device's push)
      if (data._exportedAt && data._exportedAt !== lastSyncedTime && data._exportedAt !== window._lastFirebasePushedAt) {
        window._lastFirebaseReceivedAt = data._exportedAt;
        window.addSyncLog('พบข้อมูลปีการศึกษาที่แก้ไขใหม่บน Cloud! กำลังติดตั้งลงเครื่อง...', 'warn');

        // Check if there are local modifications since last sync
        const lastSyncedKey = 'cls_last_synced_data_' + semId;
        const lastSyncedStr = localStorage.getItem(lastSyncedKey) || '';
        const currentLocalData = window.collectAllData();
        const currentLocalStr = JSON.stringify(currentLocalData);
        
        let finalData = data;
        let hasConflict = false;

        if (hasUnsynced && lastSyncedStr && currentLocalStr !== lastSyncedStr) {
          // Both have changes: Merge conflict resolution
          console.log("Sync conflict detected: merging local and cloud changes...");
          window.addSyncLog('⚠️ ตรวจพบข้อมูลขัดแย้ง (แก้ไขทั้งสองเครื่อง) กำลังทำการรวมข้อมูลอัตโนมัติ...', 'warn');
          const localParsed = JSON.parse(currentLocalStr);
          finalData = window.mergeSemesterData(localParsed, data);
          hasConflict = true;
        }

        window.applyRestoreData(finalData, false);
        
        localStorage.setItem(localSaveKey, JSON.stringify(finalData));
        localStorage.setItem(localSaveKey + '_time', finalData._exportedAt || data._exportedAt);
        localStorage.setItem(lastSyncedKey, JSON.stringify(finalData));

        window.syncSubjectsToClassSubjects();
        window.rebuildClassSelector();
        if (window.renderPeriodSettings) window.renderPeriodSettings();
        window.renderPanel(window.currentPanel);
        
        // Clear local unsynced flag since we are now in sync with cloud
        localStorage.removeItem('cf_has_unsynced_changes_' + semId);

        if (hasConflict) {
          window.toast('✨ ซิงก์และผสานข้อมูลร่วมกันเรียบร้อย');
          window.addSyncLog('รวมข้อมูลขัดแย้งสำเร็จ! และส่งข้อมูลที่ผสานกลับขึ้นเซิร์ฟเวอร์', 'success');
          // Push merged data back to server
          await window.pushSemesterDataToCloudflare(true);
        } else {
          window.toast('✨ ซิงค์ข้อมูลชั้นเรียนจาก Cloud เรียบร้อย');
          window.addSyncLog('ดาวน์โหลดและอัปเดตข้อมูลชั้นเรียนลงเครื่องสำเร็จ!', 'success');
        }
      } else {
        if (!silent) window.addSyncLog('ข้อมูลชั้นเรียนและคะแนนตรงกับบน Cloud แล้ว', 'success');
        // Update cache of last synced data if it doesn't exist
        const lastSyncedKey = 'cls_last_synced_data_' + semId;
        if (!localStorage.getItem(lastSyncedKey)) {
          const currentLocalData = window.collectAllData();
          localStorage.setItem(lastSyncedKey, JSON.stringify(currentLocalData));
        }

        // If server has no newer changes, but we have unsynced changes, push them now!
        if (hasUnsynced) {
          window.addSyncLog('พบข้อมูลการเปลี่ยนแปลงในเครื่องที่ยังไม่ได้ซิงก์ กำลังซิงก์ขึ้นเซิร์ฟเวอร์...', 'system');
          await window.performSemesterPush();
        }
      }
    } else if (res.status === 404) {
      // Semester does not exist in D1 yet, push local version
      window.addSyncLog('ไม่พบข้อมูลปีการศึกษานี้บนคลาวด์ กำลังเริ่มอัปโหลดเวอร์ชันในเครื่องขึ้นไป...', 'warn');
      window.pushSemesterDataToCloudflare(true);
    } else {
      let errMsg = `Semester sync failed with status ${res.status}`;
      try {
        const errData = await res.json();
        if (errData && errData.error) {
          errMsg = errData.error;
        }
      } catch (e) {}
      throw new Error(errMsg);
    }
  } catch (err) {
    console.error("Cloudflare sync semester pull error:", err);
    throw err;
  }
};

// Push Data to Cloudflare

window.performProfilePush = async function() {
  if (!window.firebaseUser) return;
  const token = localStorage.getItem('cf_auth_token');
  if (!token) return;

  const apiUrl = window.getCloudflareApiUrl();

  try {
    window.updateSyncStatusBadge('connecting');
    const res = await fetch(`${apiUrl}/sync/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        semesters: window.semesters,
        trashSemesters: window.trashSemesters,
        currentSemesterId: window.currentSemesterId
      })
    });
    
    if (!res.ok) {
      let errMsg = 'เซิร์ฟเวอร์ตอบกลับมีข้อผิดพลาด';
      try {
        const errData = await res.json();
        if (errData && errData.error) errMsg = errData.error;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const resData = await res.json();
    const serverTimestamp = resData.updated_at;

    window._lastFirebasePushedAt = serverTimestamp;
    localStorage.setItem('cls_global_profile_time', serverTimestamp);
    localStorage.setItem('cls_last_synced_profile', JSON.stringify({
      semesters: window.semesters,
      trashSemesters: window.trashSemesters,
      currentSemesterId: window.currentSemesterId
    }));

    // Clear unsynced flag
    localStorage.removeItem('cf_has_unsynced_profile');

    window.addSyncLog('ซิงก์โปรไฟล์ขึ้น Cloud เรียบร้อย', 'success');
    window.updateSyncStatusBadge('connected');
    window.updateSyncTimeDisplay(new Date(serverTimestamp), 'อัตโนมัติ');
  } catch (err) {
    console.error("Cloudflare sync profile push error:", err);
    window.addSyncLog('อัปโหลดโปรไฟล์ล้มเหลว (จะลองใหม่ภายหลัง): ' + err.message, 'error');
    window.updateSyncStatusBadge('disconnected');
    throw err;
  }
};

window.performSemesterPush = async function() {
  const semId = window.currentSemesterId;
  if (!semId || !window.firebaseUser) return;
  const token = localStorage.getItem('cf_auth_token');
  if (!token) return;

  const apiUrl = window.getCloudflareApiUrl();
  const data = window.collectAllData();

  try {
    window.updateSyncStatusBadge('connecting');
    const res = await fetch(`${apiUrl}/sync/semester?semester_id=${semId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      let errMsg = 'เซิร์ฟเวอร์ตอบกลับมีข้อผิดพลาด';
      try {
        const errData = await res.json();
        if (errData && errData.error) errMsg = errData.error;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const resData = await res.json();
    const serverTimestamp = resData.updated_at;

    window._lastFirebasePushedAt = serverTimestamp;
    localStorage.setItem('cls_autosave_' + semId + '_time', serverTimestamp);
    
    // Cache last synced state
    data._exportedAt = serverTimestamp;
    localStorage.setItem('cls_last_synced_data_' + semId, JSON.stringify(data));

    // Clear unsynced flag
    localStorage.removeItem('cf_has_unsynced_changes_' + semId);

    window.addSyncLog(`ซิงก์ห้องเรียน ${semId} ขึ้น Cloud เรียบร้อย`, 'success');
    window.updateSyncStatusBadge('connected');
    window.updateSyncTimeDisplay(new Date(serverTimestamp), 'อัตโนมัติ');
  } catch (err) {
    console.error("Cloudflare sync semester push error:", err);
    window.addSyncLog(`อัปโหลดข้อมูลห้องเรียน ${semId} ล้มเหลว (จะลองใหม่ภายหลัง): ` + err.message, 'error');
    window.updateSyncStatusBadge('disconnected');
    throw err;
  }
};

window.pushGlobalProfileToCloudflare = async function(isManual = false) {
  if (!isManual && localStorage.getItem('cf_auto_save') === 'false') {
    return;
  }
  if (!window.firebaseUser) return;

  if (!isManual) {
    localStorage.setItem('cf_has_unsynced_profile', 'true');
    if (window._pushProfileDebounceTimer) clearTimeout(window._pushProfileDebounceTimer);
    window._pushProfileDebounceTimer = setTimeout(async () => {
      try {
        await window.performProfilePush();
      } catch (e) {}
    }, 2000);
  } else {
    if (window._pushProfileDebounceTimer) clearTimeout(window._pushProfileDebounceTimer);
    localStorage.setItem('cf_has_unsynced_profile', 'true');
    await window.performProfilePush();
  }
};
window.pushGlobalProfileToFirebase = window.pushGlobalProfileToCloudflare;

window.pushSemesterDataToCloudflare = async function(isManual = false) {
  if (!isManual && localStorage.getItem('cf_auto_save') === 'false') {
    return;
  }
  if (!window.firebaseUser || !window.currentSemesterId) return;

  const semId = window.currentSemesterId;

  if (!isManual) {
    localStorage.setItem('cf_has_unsynced_changes_' + semId, 'true');
    if (window._pushSemesterDebounceTimer) clearTimeout(window._pushSemesterDebounceTimer);
    window._pushSemesterDebounceTimer = setTimeout(async () => {
      try {
        await window.performSemesterPush();
      } catch (e) {}
    }, 2000);
  } else {
    if (window._pushSemesterDebounceTimer) clearTimeout(window._pushSemesterDebounceTimer);
    localStorage.setItem('cf_has_unsynced_changes_' + semId, 'true');
    await window.performSemesterPush();
  }
};
window.pushSemesterDataToFirebase = window.pushSemesterDataToCloudflare;

// Check and trigger init on start
window.addEventListener('DOMContentLoaded', () => {
  window.initCloudflare();
});

// Listen to system events to keep connection always active
window.addEventListener('online', () => {
  window.addSyncLog('🟢 เครือข่ายเชื่อมต่อแล้ว กำลังซิงค์ข้อมูล...', 'system');
  window.pullAllDataFromCloudflare(true);
});

window.addEventListener('focus', () => {
  // Run silent sync on focus (throttled inside pullAllDataFromCloudflare)
  if (window.firebaseUser) {
    window.pullAllDataFromCloudflare(true);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && window.firebaseUser) {
    window.pullAllDataFromCloudflare(true);
  }
});

// Toggle Sidebar Profile Dropdown Popover
window.toggleProfileDropdown = function(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('profile-dropdown-menu');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  }
  // Close topbar dropdown if sidebar dropdown is opened
  const topbarDropdown = document.getElementById('topbar-profile-dropdown-menu');
  if (topbarDropdown) topbarDropdown.style.display = 'none';
  const classDropdown = document.getElementById('topbar-class-dropdown-menu');
  if (classDropdown) classDropdown.style.display = 'none';
};

// Toggle Topbar Profile Dropdown Popover
window.toggleTopbarDropdown = function(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('topbar-profile-dropdown-menu');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  }
  // Close sidebar dropdown if topbar dropdown is opened
  const sidebarDropdown = document.getElementById('profile-dropdown-menu');
  if (sidebarDropdown) sidebarDropdown.style.display = 'none';
};

// Go to setup-settings panel from profile dropdown
window.gotoSettingsFromProfile = function() {
  const dropdown = document.getElementById('profile-dropdown-menu');
  if (dropdown) dropdown.style.display = 'none';
  const topbarDropdown = document.getElementById('topbar-profile-dropdown-menu');
  if (topbarDropdown) topbarDropdown.style.display = 'none';
  window.goto('setup-settings');
};

// Close dropdown when clicking outside
window.addEventListener('click', function(e) {
  // Sidebar profile dropdown
  const dropdown = document.getElementById('profile-dropdown-menu');
  if (dropdown) {
    const btn = document.getElementById('sidebar-account-info');
    if (btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  }
  // Topbar profile dropdown
  const topbarDropdown = document.getElementById('topbar-profile-dropdown-menu');
  if (topbarDropdown) {
    const topbarBtn = document.getElementById('topbar-user-profile');
    if (topbarBtn && !topbarBtn.contains(e.target) && !topbarDropdown.contains(e.target)) {
      topbarDropdown.style.display = 'none';
    }
  }
  // Topbar class dropdown
  const classDropdown = document.getElementById('topbar-class-dropdown-menu');
  if (classDropdown) {
    const classBtn = document.getElementById('topbar-class-badge');
    if (classBtn && !classBtn.contains(e.target) && !classDropdown.contains(e.target)) {
      classDropdown.style.display = 'none';
    }
  }
});

// ====== REDESIGNED SYNC ACTIONS & HELPERS ======

window.toggleAutoSave = function(checked) {
  localStorage.setItem('cf_auto_save', checked ? 'true' : 'false');
  window.toast(checked ? '💾 เปิดการบันทึกอัตโนมัติ' : '🚫 ปิดการบันทึกอัตโนมัติ (กรุณากดบันทึกด้วยตนเอง)');
  window.addSyncLog(checked ? 'เปิดระบบบันทึกอัตโนมัติขึ้นคลาวด์' : 'ปิดระบบบันทึกอัตโนมัติขึ้นคลาวด์', 'warn');
};

window.addSyncLog = function(message, type = 'info') {
  const container = document.getElementById('sys-cf-sync-log-container');
  if (!container) return;
  const time = new Date().toLocaleTimeString('th-TH');
  let color = '#a9b2c3';
  if (type === 'success') color = '#4caf50';
  else if (type === 'error') color = '#fa5252';
  else if (type === 'warn') color = '#f59e0b';
  else if (type === 'system') color = '#12b886';
  
  const div = document.createElement('div');
  div.style.color = color;
  div.style.marginBottom = '4px';
  div.innerHTML = `<span style="color:#6a737d;">[${time}]</span> ${window.esc(message)}`;
  container.appendChild(div);
  
  // Keep logs within last 30 entries
  while (container.childNodes.length > 30) {
    container.removeChild(container.firstChild);
  }
  container.scrollTop = container.scrollHeight;
  
  // Heartbeat flash
  const heartbeat = document.getElementById('sync-heartbeat');
  if (heartbeat) {
    heartbeat.style.background = type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#f59e0b');
    heartbeat.style.transform = 'scale(1.4)';
    setTimeout(() => {
      heartbeat.style.transform = 'scale(1)';
    }, 200);
  }
};

window.toggleAdvancedSyncConfig = function() {
  const el = document.getElementById('sys-cf-advanced-config');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }
};

window.updateSyncStatusBadge = function(status) {
  const badge = document.getElementById('cf-sync-status-badge');
  const dot = document.getElementById('cf-sync-dot');
  const text = document.getElementById('cf-sync-text');
  
  const topbar = document.getElementById('sync-status-topbar');
  const topbarDot = document.getElementById('topbar-sync-dot');
  const topbarText = document.getElementById('topbar-sync-text');
  
  const vpnWarning = document.getElementById('sys-cf-vpn-warning');

  // Update narrow/mobile screen sync status badge dynamically
  const mobBadge = document.getElementById('mobile-offline-badge');
  if (mobBadge) {
    let isRealAccount = false;
    try {
      const userRaw = localStorage.getItem('cf_user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u.email && u.email.includes('@')) {
          isRealAccount = true;
        }
      }
    } catch(e) {}

    if (!isRealAccount) {
      mobBadge.textContent = 'พรีวิวออฟไลน์';
      mobBadge.style.color = 'var(--teal)';
      mobBadge.style.background = 'var(--teal-light)';
    } else {
      if (status === 'connected') {
        mobBadge.textContent = 'ซิงค์คลาวด์แล้ว';
        mobBadge.style.color = 'var(--green)';
        mobBadge.style.background = 'var(--green-light)';
      } else if (status === 'connecting') {
        mobBadge.textContent = 'กำลังซิงค์...';
        mobBadge.style.color = 'var(--amber)';
        mobBadge.style.background = 'var(--amber-light)';
      } else {
        mobBadge.textContent = 'คลาวด์หลุด';
        mobBadge.style.color = 'var(--red)';
        mobBadge.style.background = 'var(--red-light)';
      }
    }
  }

  if (status === 'connected') {
    if (badge) {
      badge.style.color = '#10b981';
      badge.style.background = '#e6fcf5';
      badge.style.borderColor = '#c3fae8';
    }
    if (dot) {
      dot.style.background = '#10b981';
      dot.style.boxShadow = '0 0 8px #10b981';
      dot.style.animation = 'none';
    }
    if (text) text.textContent = 'เชื่อมต่อแล้ว';

    if (topbar) {
      topbar.style.background = '#e6fcf5';
      topbar.style.color = '#0ca678';
      topbar.style.borderColor = '#c3fae8';
      topbar.style.boxShadow = '0 0 10px rgba(12,166,120,.08)';
    }
    if (topbarDot) {
      topbarDot.style.background = '#0ca678';
      topbarDot.style.boxShadow = '0 0 6px #0ca678';
      topbarDot.style.animation = 'none';
    }
    if (topbarText) topbarText.textContent = 'คลาวด์ซิงก์: เชื่อมต่อแล้ว';
    if (vpnWarning) vpnWarning.style.display = 'none';

  } else if (status === 'connecting') {
    if (badge) {
      badge.style.color = '#f59e0b';
      badge.style.background = '#fff9db';
      badge.style.borderColor = '#ffe066';
    }
    if (dot) {
      dot.style.background = '#f59e0b';
      dot.style.boxShadow = '0 0 8px #f59e0b';
      dot.style.animation = 'pulse 1s infinite alternate';
    }
    if (text) text.textContent = 'กำลังเชื่อมต่อ...';

    if (topbar) {
      topbar.style.background = '#fff9db';
      topbar.style.color = '#e67e22';
      topbar.style.borderColor = '#ffe066';
      topbar.style.boxShadow = '0 0 10px rgba(230,126,34,.08)';
    }
    if (topbarDot) {
      topbarDot.style.background = '#e67e22';
      topbarDot.style.boxShadow = '0 0 6px #e67e22';
      topbarDot.style.animation = 'pulse 1s infinite alternate';
    }
    if (topbarText) topbarText.textContent = 'คลาวด์ซิงก์: กำลังอัปเดต...';

  } else {
    // disconnected
    if (badge) {
      badge.style.color = '#ef4444';
      badge.style.background = '#fef2f2';
      badge.style.borderColor = '#fee2e2';
    }
    if (dot) {
      dot.style.background = '#ef4444';
      dot.style.boxShadow = '0 0 8px #ef4444';
      dot.style.animation = 'pulse 0.5s infinite alternate';
    }
    if (text) text.textContent = 'ไม่เชื่อมต่อ';

    if (topbar) {
      topbar.style.background = '#fef2f2';
      topbar.style.color = '#e03131';
      topbar.style.borderColor = '#fee2e2';
      topbar.style.boxShadow = '0 0 10px rgba(224,49,49,.08)';
    }
    if (topbarDot) {
      topbarDot.style.background = '#e03131';
      topbarDot.style.boxShadow = '0 0 6px #e03131';
      topbarDot.style.animation = 'pulse 0.5s infinite alternate';
    }
    if (topbarText) topbarText.textContent = 'คลาวด์ซิงก์: ปัญหาการเชื่อมต่อ';
    if (vpnWarning) vpnWarning.style.display = 'block';
  }
};

window.updateSyncTimeDisplay = function(date, mode = 'อัตโนมัติ') {
  if (!date) return;
  const timeStr = date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH');
  localStorage.setItem('cf_last_sync_time', timeStr);
  localStorage.setItem('cf_last_sync_mode', mode);
  
  const label = document.getElementById('cf-sync-time-label');
  if (label) {
    label.textContent = `ล่าสุด: ${timeStr.split(' ')[1]} (${mode})`;
  }
};

window.manualPushToCloud = async function() {
  window.toast('🔄 กำลังบันทึกข้อมูลขึ้นคลาวด์...');
  window.addSyncLog('เริ่มบันทึกข้อมูลขึ้นเซิร์ฟเวอร์แบบแมนนวล...', 'warn');
  window.updateSyncStatusBadge('connecting');
  try {
    await window.pushGlobalProfileToCloudflare(true);
    await window.pushSemesterDataToCloudflare(true);
    window.toast('🟢 บันทึกข้อมูลขึ้นคลาวด์สำเร็จ!');
    window.addSyncLog('บันทึกข้อมูลโปรไฟล์และห้องเรียนทั้งหมดขึ้นเซิร์ฟเวอร์สำเร็จ!', 'success');
    window.updateSyncStatusBadge('connected');
    window.updateSyncTimeDisplay(new Date(), 'สั่งเอง');
  } catch (e) {
    window.toast('❌ บันทึกข้อมูลล้มเหลว: ' + e.message);
    window.addSyncLog('บันทึกข้อมูลล้มเหลว: ' + e.message, 'error');
    window.updateSyncStatusBadge('disconnected');
  }
};

window.manualPullFromCloud = async function() {
  window.toast('🔄 กำลังดึงข้อมูลล่าสุดจากคลาวด์...');
  window.addSyncLog('เริ่มดึงข้อมูลจากเซิร์ฟเวอร์แบบแมนนวล...', 'warn');
  window.updateSyncStatusBadge('connecting');
  try {
    await window.pullAllDataFromCloudflare(false); // silent = false
    window.toast('🟢 ดึงข้อมูลจากคลาวด์สำเร็จ!');
    window.addSyncLog('ดึงข้อมูลและอัปเดตเข้าเครื่องปัจจุบันสำเร็จ!', 'success');
    window.updateSyncStatusBadge('connected');
    window.updateSyncTimeDisplay(new Date(), 'สั่งเอง');
  } catch (e) {
    window.toast('❌ ดึงข้อมูลล้มเหลว: ' + e.message);
    window.addSyncLog('ดึงข้อมูลล้มเหลว: ' + e.message, 'error');
    window.updateSyncStatusBadge('disconnected');
  }
};

// ====== MERGE SEMESTER DATA FOR CONFLICT RESOLUTION ======
window.mergeSemesterData = function(local, remote) {
  if (!local) return remote;
  if (!remote) return local;

  const merged = { ...local };

  merged._schema = remote._schema || local._schema;
  merged._exportedAt = remote._exportedAt > (local._exportedAt || '') ? remote._exportedAt : local._exportedAt;
  merged._exportedBy = 'Classroom Management Sync (Merged)';

  // Rooms: Union by id
  const localRooms = local.rooms || [];
  const remoteRooms = remote.rooms || [];
  const roomsMap = {};
  localRooms.forEach(r => { roomsMap[r.id] = r; });
  remoteRooms.forEach(r => {
    roomsMap[r.id] = { ...(roomsMap[r.id] || {}), ...r };
  });
  merged.rooms = Object.values(roomsMap);

  // ClassData (student arrays): merge matching students by id
  merged.classData = {};
  const allRoomIds = new Set([...Object.keys(local.classData || {}), ...Object.keys(remote.classData || {})]);
  allRoomIds.forEach(roomId => {
    const localSts = local.classData?.[roomId] || [];
    const remoteSts = remote.classData?.[roomId] || [];
    const stdsMap = {};
    localSts.forEach(s => { stdsMap[s.id] = s; });
    remoteSts.forEach(s => {
      if (!stdsMap[s.id]) {
        stdsMap[s.id] = s;
      } else {
        const localS = stdsMap[s.id];
        stdsMap[s.id] = {
          ...localS,
          ...s,
          scores: {
            ...(localS.scores || {}),
            ...(s.scores || {})
          }
        };
        if (s.behaviorScore !== undefined && s.behaviorScore !== localS.behaviorScore) {
          stdsMap[s.id].behaviorScore = Math.max(s.behaviorScore, localS.behaviorScore);
        }
      }
    });
    merged.classData[roomId] = Object.values(stdsMap);
  });

  // Subjects: Union by id
  const localSubjects = local.subjects || [];
  const remoteSubjects = remote.subjects || [];
  const subjectsMap = {};
  localSubjects.forEach(s => { subjectsMap[s.id] = s; });
  remoteSubjects.forEach(s => {
    subjectsMap[s.id] = { ...(subjectsMap[s.id] || {}), ...s };
  });
  merged.subjects = Object.values(subjectsMap);

  // Schedules: Union by id
  const localSchedules = local.schedules || [];
  const remoteSchedules = remote.schedules || [];
  const schedulesMap = {};
  localSchedules.forEach(s => { schedulesMap[s.id] = s; });
  remoteSchedules.forEach(s => {
    schedulesMap[s.id] = { ...(schedulesMap[s.id] || {}), ...s };
  });
  merged.schedules = Object.values(schedulesMap);

  // attData: Merge keys, take non-empty status
  merged.attData = { ...(local.attData || {}) };
  Object.entries(remote.attData || {}).forEach(([k, status]) => {
    if (!merged.attData[k] || status === 'present' || status === 'absent' || status === 'late' || status === 'leave') {
      merged.attData[k] = status;
    }
  });

  // Behaviors: Union by id or composite key
  const localBehaviors = local.behaviors || [];
  const remoteBehaviors = remote.behaviors || [];
  const behaviorsMap = {};
  localBehaviors.forEach(b => {
    const key = b.id || `${b.sid}_${b.time}`;
    behaviorsMap[key] = b;
  });
  remoteBehaviors.forEach(b => {
    const key = b.id || `${b.sid}_${b.time}`;
    behaviorsMap[key] = b;
  });
  merged.behaviors = Object.values(behaviorsMap);

  // WorkItems, Assignments, Materials: Union by id
  const mergeListById = (localList, remoteList) => {
    const map = {};
    (localList || []).forEach(x => { map[x.id] = x; });
    (remoteList || []).forEach(x => { map[x.id] = { ...(map[x.id] || {}), ...x }; });
    return Object.values(map);
  };
  merged.workItems = mergeListById(local.workItems, remote.workItems);
  merged.assignments = mergeListById(local.assignments, remote.assignments);
  merged.materials = mergeListById(local.materials, remote.materials);

  // Auto incrementing counters
  merged.nextId = Math.max(local.nextId || 0, remote.nextId || 0);
  merged.nextRoomId = Math.max(local.nextRoomId || 0, remote.nextRoomId || 0);
  merged.nextSchedId = Math.max(local.nextSchedId || 0, remote.nextSchedId || 0);

  // Merge profile details
  const mergeVal = (v1, v2) => {
    if (!v1) return v2 || '';
    if (!v2) return v1;
    return String(v2).length > String(v1).length ? v2 : v1;
  };
  merged.teacherName = mergeVal(local.teacherName, remote.teacherName);
  merged.schoolName = mergeVal(local.schoolName, remote.schoolName);
  merged.academicYear = mergeVal(local.academicYear, remote.academicYear);
  merged.semester = mergeVal(local.semester, remote.semester);

  return merged;
};

// ====== MAIN AUTH SCREEN CONTROLLERS ======
window.switchAuthScreenTab = function(tab) {
  const tabLogin = document.getElementById('auth-tab-login');
  const tabRegister = document.getElementById('auth-tab-register');
  const formLogin = document.getElementById('auth-form-login');
  const formRegister = document.getElementById('auth-form-register');
  if (!tabLogin || !tabRegister || !formLogin || !formRegister) return;
  
  if (tab === 'login') {
    tabLogin.style.background = 'var(--surface)';
    tabLogin.style.color = 'var(--accent)';
    tabLogin.style.fontWeight = '700';
    
    tabRegister.style.background = 'transparent';
    tabRegister.style.color = 'var(--text3)';
    tabRegister.style.fontWeight = '500';
    
    formLogin.style.display = 'flex';
    formRegister.style.display = 'none';
  } else {
    tabRegister.style.background = 'var(--surface)';
    tabRegister.style.color = 'var(--teal)';
    tabRegister.style.fontWeight = '700';
    
    tabLogin.style.background = 'transparent';
    tabLogin.style.color = 'var(--text3)';
    tabLogin.style.fontWeight = '500';
    
    formLogin.style.display = 'none';
    formRegister.style.display = 'flex';
  }
};

window.mainCloudflareLogin = async function() {
  const emailInput = document.getElementById('main-cf-email');
  const passwordInput = document.getElementById('main-cf-password');
  if (!emailInput || !passwordInput) return;
  
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!email || !password) {
    alert('⚠️ กรุณากรอกอีเมลและรหัสผ่าน');
    return;
  }
  
  window.showSyncProgress('กำลังเข้าสู่ระบบ...');
  const apiUrl = window.getCloudflareApiUrl();
  
  try {
    const res = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    window.hideSyncProgress();
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }
    
    const data = await res.json();
    
    localStorage.setItem('cf_auth_token', data.token);
    localStorage.setItem('cf_user', JSON.stringify({ uid: data.user.uid, email: data.user.email }));
    
    window.toast('🔑 เข้าสู่ระบบสำเร็จ กำลังซิงค์ข้อมูล...');
    setTimeout(() => location.reload(), 1000);
  } catch (e) {
    window.hideSyncProgress();
    alert('❌ ' + e.message);
  }
};

window.mainCloudflareRegister = async function() {
  const emailInput = document.getElementById('main-cf-reg-email');
  const passwordInput = document.getElementById('main-cf-reg-password');
  if (!emailInput || !passwordInput) return;
  
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!email || !password) {
    alert('⚠️ กรุณากรอกอีเมลและรหัสผ่าน');
    return;
  }
  if (password.length < 6) {
    alert('⚠️ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    return;
  }
  
  window.showSyncProgress('กำลังสมัครสมาชิก...');
  const apiUrl = window.getCloudflareApiUrl();
  
  try {
    const res = await fetch(`${apiUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    window.hideSyncProgress();
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'สมัครสมาชิกไม่สำเร็จ');
    }
    
    const data = await res.json();
    
    localStorage.setItem('cf_auth_token', data.token);
    localStorage.setItem('cf_user', JSON.stringify({ uid: data.user.uid, email: data.user.email }));
    
    window.toast('📝 สมัครสมาชิกสำเร็จ กำลังเริ่มต้นเชื่อมต่อข้อมูล...');
    setTimeout(() => location.reload(), 1000);
  } catch (e) {
    window.hideSyncProgress();
    alert('❌ ' + e.message);
  }
};

window.enterLocalTrialMode = function() {
  const localUser = { uid: 'local_teacher', email: 'teacher@local.school', name: 'คุณครู (Offline Mode)', isLocal: true };
  localStorage.setItem('cf_user', JSON.stringify(localUser));
  localStorage.setItem('cf_auth_token', 'local_offline_token');
  window.toast('💻 เข้าสู่โหมดใช้งานในเครื่อง (Offline Mode) เรียบร้อยแล้ว');
  setTimeout(() => location.reload(), 400);
};



