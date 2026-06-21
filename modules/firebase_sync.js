// ====== MODULE: FIREBASE SYNC ======
// Manages real-time data sync across devices with offline support via Cloud Firestore

window.firebaseConfigKey = 'classrm_firebase_config';
window.firebaseUser = null;
window._firestoreUnsubscribeGlobal = null;
window._firestoreUnsubscribeSemester = null;

// Track timestamps to prevent echo loops
window._lastFirebasePushedAt = '';
window._lastFirebaseReceivedAt = '';

window.loadFirebaseConfig = function() {
  try {
    const raw = localStorage.getItem(window.firebaseConfigKey);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  
  if (window.bundledFirebaseConfig) {
    return window.bundledFirebaseConfig;
  }
  return null;
};

window.saveFirebaseConfig = function() {
  const apiKey = document.getElementById('sys-fb-api-key')?.value.trim();
  const authDomain = document.getElementById('sys-fb-auth-domain')?.value.trim();
  const projectId = document.getElementById('sys-fb-project-id')?.value.trim();
  const appId = document.getElementById('sys-fb-app-id')?.value.trim();

  if (!apiKey || !authDomain || !projectId || !appId) {
    window.toast('⚠️ กรุณากรอกข้อมูลคอนฟิกให้ครบถ้วน');
    return;
  }

  const config = { apiKey, authDomain, projectId, appId };
  localStorage.setItem(window.firebaseConfigKey, JSON.stringify(config));
  window.toast('💾 บันทึกการเชื่อมต่อเรียบร้อยแล้ว กำลังเริ่มระบบใหม่...');
  setTimeout(() => location.reload(), 1000);
};

window.saveFirebaseConfigFromModal = function() {
  const apiKey = document.getElementById('modal-fb-api-key')?.value.trim();
  const authDomain = document.getElementById('modal-fb-auth-domain')?.value.trim();
  const projectId = document.getElementById('modal-fb-project-id')?.value.trim();
  const appId = document.getElementById('modal-fb-app-id')?.value.trim();

  if (!apiKey || !authDomain || !projectId || !appId) {
    document.getElementById('fb-auth-error').textContent = '⚠️ กรุณากรอกข้อมูลคอนฟิกให้ครบถ้วน';
    document.getElementById('fb-auth-error').style.display = 'block';
    return;
  }

  const config = { apiKey, authDomain, projectId, appId };
  localStorage.setItem(window.firebaseConfigKey, JSON.stringify(config));
  window.toast('💾 บันทึกคอนฟิกสำเร็จ กำลังรีโหลดแอป...');
  setTimeout(() => location.reload(), 1000);
};

window.clearFirebaseConfig = function() {
  if (!confirm('ต้องการยกเลิกการซิงค์ Cloud และล้างข้อมูลการเชื่อมต่อใช่หรือไม่?')) return;
  localStorage.removeItem(window.firebaseConfigKey);
  window.toast('🗑️ ล้างข้อมูลเชื่อมต่อสำเร็จ กำลังเริ่มระบบใหม่...');
  setTimeout(() => location.reload(), 1000);
};

window.toggleLoginConfig = function() {
  const el = document.getElementById('fb-login-config-area');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }
};

window.parseAndFillFirebaseConfig = function(prefix) {
  const textarea = document.getElementById(prefix === 'sys' ? 'sys-fb-raw-config' : 'modal-fb-raw-config');
  const rawText = textarea ? textarea.value.trim() : '';
  if (!rawText) {
    window.toast('⚠️ กรุณาวางข้อความคอนฟิกก่อนกดปุ่มครับ');
    return;
  }

  // 1. Try regex matching for typical JS object properties
  const apiKeyMatch = rawText.match(/apiKey\s*:\s*["']([^"']+)["']/);
  const authDomainMatch = rawText.match(/authDomain\s*:\s*["']([^"']+)["']/);
  const projectIdMatch = rawText.match(/projectId\s*:\s*["']([^"']+)["']/);
  const appIdMatch = rawText.match(/appId\s*:\s*["']([^"']+)["']/);

  let config = null;
  if (apiKeyMatch && authDomainMatch && projectIdMatch && appIdMatch) {
    config = {
      apiKey: apiKeyMatch[1],
      authDomain: authDomainMatch[1],
      projectId: projectIdMatch[1],
      appId: appIdMatch[1]
    };
  } else {
    // 2. Try parsing after cleaning JS variables (e.g. const firebaseConfig = { ... })
    try {
      let cleaned = rawText;
      if (cleaned.includes('{') && cleaned.includes('}')) {
        cleaned = cleaned.substring(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1);
      }
      // Ensure keys are double-quoted for standard JSON parsing
      cleaned = cleaned.replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":');
      // Replace single quotes with double quotes
      cleaned = cleaned.replace(/'/g, '"');
      // Remove trailing commas before closing braces
      cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
      
      const parsed = JSON.parse(cleaned);
      if (parsed.apiKey && parsed.authDomain && parsed.projectId && parsed.appId) {
        config = {
          apiKey: parsed.apiKey,
          authDomain: parsed.authDomain,
          projectId: parsed.projectId,
          appId: parsed.appId
        };
      }
    } catch(e) {
      console.warn("Parse attempt failed:", e);
    }
  }

  if (config) {
    const apiKeyInput = document.getElementById(prefix === 'sys' ? 'sys-fb-api-key' : 'modal-fb-api-key');
    const authDomainInput = document.getElementById(prefix === 'sys' ? 'sys-fb-auth-domain' : 'modal-fb-auth-domain');
    const projectIdInput = document.getElementById(prefix === 'sys' ? 'sys-fb-project-id' : 'modal-fb-project-id');
    const appIdInput = document.getElementById(prefix === 'sys' ? 'sys-fb-app-id' : 'modal-fb-app-id');

    if (apiKeyInput) apiKeyInput.value = config.apiKey;
    if (authDomainInput) authDomainInput.value = config.authDomain;
    if (projectIdInput) projectIdInput.value = config.projectId;
    if (appIdInput) appIdInput.value = config.appId;

    window.toast('⚡ ดึงข้อมูลและเติมค่าใส่ช่องด้านล่างเรียบร้อยแล้ว!');
  } else {
    window.toast('❌ ไม่สามารถระบุค่าคอนฟิกได้ กรุณาตรวจสอบรูปแบบหรือกรอกข้อมูลแยกช่องด้วยตนเอง');
  }
};

// Initialize Firebase
window.initFirebase = function() {
  const config = window.loadFirebaseConfig();
  if (!config) return;

  // Render settings page inputs if present
  const sysApiKey = document.getElementById('sys-fb-api-key');
  const sysAuthDomain = document.getElementById('sys-fb-auth-domain');
  const sysProjectId = document.getElementById('sys-fb-project-id');
  const sysAppId = document.getElementById('sys-fb-app-id');
  
  if (sysApiKey) sysApiKey.value = config.apiKey || '';
  if (sysAuthDomain) sysAuthDomain.value = config.authDomain || '';
  if (sysProjectId) sysProjectId.value = config.projectId || '';
  if (sysAppId) sysAppId.value = config.appId || '';

  const modalApiKey = document.getElementById('modal-fb-api-key');
  const modalAuthDomain = document.getElementById('modal-fb-auth-domain');
  const modalProjectId = document.getElementById('modal-fb-project-id');
  const modalAppId = document.getElementById('modal-fb-app-id');

  if (modalApiKey) modalApiKey.value = config.apiKey || '';
  if (modalAuthDomain) modalAuthDomain.value = config.authDomain || '';
  if (modalProjectId) modalProjectId.value = config.projectId || '';
  if (modalAppId) modalAppId.value = config.appId || '';

  // Show status area in settings
  const statusArea = document.getElementById('sys-fb-status-area');
  if (statusArea) statusArea.style.display = 'flex';

  try {
    firebase.initializeApp(config);
    const db = firebase.firestore();
    
    // Enable offline persistence
    db.enablePersistence({ synchronizeTabs: true })
      .catch((err) => {
        console.warn("Firestore persistence error:", err.code);
      });

    // Listen to Auth state
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        window.firebaseUser = user;
        window.updateFirebaseUI(true, user.email);
        window.closeModal('firebase-login-modal');
        window.startSyncing(user.uid);
      } else {
        window.firebaseUser = null;
        window.updateFirebaseUI(false);
        window.stopSyncing();
        // Show login modal
        document.getElementById('firebase-login-modal')?.classList.add('open');
      }
    });

  } catch(e) {
    console.error("Firebase init failed:", e);
    window.toast('❌ เชื่อมต่อ Firebase ไม่สำเร็จ: ' + e.message);
  }
};

window.showFirebaseLoginModal = function() {
  document.getElementById('firebase-login-modal')?.classList.add('open');
};

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

  // 1. Update Sidebar Account UI
  const sidebarAccountInfo = document.getElementById('sidebar-account-info');
  const sidebarUserEmail = document.getElementById('sidebar-user-email');
  const sidebarProfileName = document.getElementById('sidebar-profile-name');
  const avatarContainer = document.getElementById('sidebar-avatar-container');
  
  if (sidebarAccountInfo) {
    if (isLoggedIn) {
      sidebarAccountInfo.classList.remove('logged-out');
      sidebarAccountInfo.classList.add('logged-in');
      sidebarAccountInfo.style.background = '';
      sidebarAccountInfo.style.borderColor = '';
      sidebarAccountInfo.style.color = '';
      sidebarAccountInfo.setAttribute('onclick', 'window.toggleProfileDropdown(event)');
      sidebarAccountInfo.setAttribute('title', 'คลิกเพื่อดูโปรไฟล์');
      
      if (sidebarProfileName) {
        sidebarProfileName.textContent = name;
        sidebarProfileName.style.display = 'block';
      }
      if (sidebarUserEmail) sidebarUserEmail.textContent = email;
      
      if (avatarContainer) {
        avatarContainer.style.borderColor = '';
        avatarContainer.style.background = '';
        avatarContainer.style.color = '';
        if (window.firebaseUser && window.firebaseUser.photoURL) {
          avatarContainer.innerHTML = `<img src="${window.firebaseUser.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
          avatarContainer.innerHTML = '🐵'; // Monkey avatar fallback matching image
        }
      }
      
      // Update dropdown header
      const dropName = document.getElementById('dropdown-display-name');
      const dropEmail = document.getElementById('dropdown-user-email');
      if (dropName) dropName.textContent = name;
      if (dropEmail) dropEmail.textContent = email;
      
    } else {
      sidebarAccountInfo.classList.remove('logged-in');
      sidebarAccountInfo.classList.add('logged-out');
      sidebarAccountInfo.style.background = '';
      sidebarAccountInfo.style.borderColor = '';
      sidebarAccountInfo.style.color = '';
      sidebarAccountInfo.setAttribute('onclick', 'window.showFirebaseLoginModal()');
      sidebarAccountInfo.setAttribute('title', 'คลิกเพื่อเข้าสู่ระบบ');
      
      if (sidebarProfileName) {
        sidebarProfileName.style.display = 'none';
      }
      if (sidebarUserEmail) sidebarUserEmail.textContent = 'เข้าสู่ระบบ Cloud Sync';
      
      if (avatarContainer) {
        avatarContainer.style.borderColor = '';
        avatarContainer.style.background = '';
        avatarContainer.innerHTML = '👤';
      }
      
      // Close dropdown if open
      const dropdown = document.getElementById('profile-dropdown-menu');
      if (dropdown) dropdown.style.display = 'none';
    }
  }

  // 2. Update Topbar Account UI
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
        if (window.firebaseUser && window.firebaseUser.photoURL) {
          topbarAvatarContainer.innerHTML = `<img src="${window.firebaseUser.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
          topbarAvatarContainer.innerHTML = '🐵';
        }
      }
      
      if (topbarDropName) topbarDropName.textContent = name;
      if (topbarDropEmail) topbarDropEmail.textContent = email;
    } else {
      topbarUserProfile.classList.remove('logged-in');
      topbarUserProfile.classList.add('logged-out');
      topbarUserProfile.setAttribute('onclick', 'window.showFirebaseLoginModal()');
      topbarUserProfile.setAttribute('title', 'คลิกเพื่อเข้าสู่ระบบ');
      
      if (topbarAvatarContainer) {
        topbarAvatarContainer.innerHTML = '👤';
      }
      
      // Close topbar dropdown if open
      const topbarDropdown = document.getElementById('topbar-profile-dropdown-menu');
      if (topbarDropdown) topbarDropdown.style.display = 'none';
    }
  }
};

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
});

// Auth Handlers
window.handleFirebaseLogin = function() {
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
  
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      window.toast('✅ เข้าสู่ระบบสำเร็จ');
    })
    .catch((err) => {
      errorEl.textContent = '❌ เข้าสู่ระบบล้มเหลว: ' + err.message;
      errorEl.style.display = 'block';
    });
};

window.handleFirebaseRegister = function() {
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
  window.toast('✨ กำลังสร้างบัญชีผู้ใช้...');

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      window.toast('✅ สมัครสมาชิกและเข้าระบบสำเร็จ');
    })
    .catch((err) => {
      errorEl.textContent = '❌ สมัครสมาชิกล้มเหลว: ' + err.message;
      errorEl.style.display = 'block';
    });
};

window.firebaseLogout = function() {
  if (!confirm('ต้องการออกจากระบบคลาวด์ใช่หรือไม่?')) return;
  firebase.auth().signOut().then(() => {
    window.toast('🚪 ออกจากระบบเรียบร้อยแล้ว');
  });
};

// Start Firestore Listeners
window.startSyncing = function(uid) {
  const db = firebase.firestore();
  
  // 1. Sync global profile
  window._firestoreUnsubscribeGlobal = db.collection('users').doc(uid).collection('profile').doc('global')
    .onSnapshot((doc) => {
      if (!doc.exists) {
        // If profile doesn't exist on cloud, upload local global profile
        window.pushGlobalProfileToFirebase();
        return;
      }
      const data = doc.data();
      const localProfileTime = localStorage.getItem('cls_global_profile_time') || '';
      
      // If cloud profile is newer
      if (data._exportedAt && data._exportedAt > localProfileTime && data._exportedAt !== window._lastFirebasePushedAt) {
        window._lastFirebaseReceivedAt = data._exportedAt;
        
        // Sync to window variables
        if (data.semesters) window.semesters = data.semesters;
        if (data.trashSemesters) window.trashSemesters = data.trashSemesters;
        if (data.currentSemesterId) window.currentSemesterId = data.currentSemesterId;
        
        // Save locally
        localStorage.setItem('cls_semesters', JSON.stringify(window.semesters));
        localStorage.setItem('cls_trash_semesters', JSON.stringify(window.trashSemesters));
        localStorage.setItem('cls_current_semester_id', window.currentSemesterId);
        localStorage.setItem('cls_global_profile_time', data._exportedAt);

        // If semester changed, re-subscribe to the new semester
        window.reconnectSemesterSync(uid);
        window.rebuildClassSelector();
        window.renderPanel(window.currentPanel);
      }
    });

  // 2. Sync active semester classroom data
  window.reconnectSemesterSync(uid);
};

window.reconnectSemesterSync = function(uid) {
  if (window._firestoreUnsubscribeSemester) {
    window._firestoreUnsubscribeSemester();
    window._firestoreUnsubscribeSemester = null;
  }

  const semId = window.currentSemesterId;
  if (!semId) return;

  const db = firebase.firestore();
  window._firestoreUnsubscribeSemester = db.collection('users').doc(uid).collection('semesters').doc(semId)
    .onSnapshot((doc) => {
      if (!doc.exists) {
        // If semester data doesn't exist on cloud, upload local data
        window.pushSemesterDataToFirebase();
        return;
      }
      const data = doc.data();
      const localSaveKey = 'cls_autosave_' + semId;
      const localSaveTime = localStorage.getItem(localSaveKey + '_time') || '';

      // If cloud data is newer/different
      if (data._exportedAt && data._exportedAt > localSaveTime && data._exportedAt !== window._lastFirebasePushedAt) {
        window._lastFirebaseReceivedAt = data._exportedAt;

        // Apply restore data
        window.applyRestoreData(data, false);
        
        // Save locally in cache without calling autoSaveToLocalStorage (to avoid infinite push loop)
        localStorage.setItem(localSaveKey, JSON.stringify(data));
        localStorage.setItem(localSaveKey + '_time', data._exportedAt);

        // Refresh UI
        window.syncSubjectsToClassSubjects();
        window.rebuildClassSelector();
        if (window.renderPeriodSettings) window.renderPeriodSettings();
        window.renderPanel(window.currentPanel);
        window.toast('✨ ซิงค์ข้อมูลจากคลาวด์เรียบร้อย');
      }
    });
};

window.stopSyncing = function() {
  if (window._firestoreUnsubscribeGlobal) {
    window._firestoreUnsubscribeGlobal();
    window._firestoreUnsubscribeGlobal = null;
  }
  if (window._firestoreUnsubscribeSemester) {
    window._firestoreUnsubscribeSemester();
    window._firestoreUnsubscribeSemester = null;
  }
};

// Push Data to Firebase
window.pushGlobalProfileToFirebase = function() {
  if (!window.firebaseUser) return;
  const uid = window.firebaseUser.uid;
  const db = firebase.firestore();

  const timestamp = new Date().toISOString();
  window._lastFirebasePushedAt = timestamp;
  localStorage.setItem('cls_global_profile_time', timestamp);

  db.collection('users').doc(uid).collection('profile').doc('global').set({
    semesters: window.semesters,
    trashSemesters: window.trashSemesters,
    currentSemesterId: window.currentSemesterId,
    _exportedAt: timestamp
  }).catch(e => console.error("Error pushing profile:", e));
};

window.pushSemesterDataToFirebase = function() {
  if (!window.firebaseUser || !window.currentSemesterId) return;
  const uid = window.firebaseUser.uid;
  const semId = window.currentSemesterId;
  const db = firebase.firestore();

  const data = window.collectAllData();
  const timestamp = new Date().toISOString();
  data._exportedAt = timestamp;
  
  window._lastFirebasePushedAt = timestamp;
  localStorage.setItem('cls_autosave_' + semId + '_time', timestamp);

  db.collection('users').doc(uid).collection('semesters').doc(semId).set(data)
    .catch(e => console.error("Error pushing semester data:", e));
};

// Check and trigger init on start
window.addEventListener('DOMContentLoaded', () => {
  window.initFirebase();
});
