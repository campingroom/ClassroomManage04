// ====== ATTENDANCE: HOLIDAYS ======
// จัดการวันหยุดราชการ (ดึงจาก API) และวันหยุดที่ครูกำหนดเอง
// แยกออกมาจาก attendance.js เดิม
window.loadCustomHolidays = function() {
  try {
    const raw = localStorage.getItem(window._customHolidaysKey);
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
};

window.saveCustomHolidaysStore = function(store) {
  localStorage.setItem(window._customHolidaysKey, JSON.stringify(store));
};

// Merge custom holidays into window.thaiHolidays
window.mergeCustomHolidays = function() {
  const custom = window.loadCustomHolidays();
  Object.assign(window.thaiHolidays, custom);
};

// Toggle: if date is already custom holiday → remove; else prompt name → add
window.toggleCustomHoliday = function() {
  const dateVal = document.getElementById('att-date')?.value || window._attDate || window.today();
  if (!dateVal) return;
  
  const store = window.loadCustomHolidays();
  const isCustom = !!store[dateVal];
  const isBuiltIn = !isCustom && !!window.thaiHolidays[dateVal];
  
  if (isCustom) {
    // Remove custom holiday
    if (!confirm(`ลบวันหยุด "${store[dateVal]}" ออก?`)) return;
    delete store[dateVal];
    window.saveCustomHolidaysStore(store);
    delete window.thaiHolidays[dateVal];
  } else if (isBuiltIn) {
    alert(`วันที่ ${dateVal} เป็นวันหยุดราชการ "${window.thaiHolidays[dateVal]}" ไม่สามารถแก้ไขได้`);
    return;
  } else {
    // Add custom holiday
    const name = prompt('ชื่อวันหยุดพิเศษ:', 'วันหยุดพิเศษ');
    if (!name) return;
    store[dateVal] = name.trim();
    window.saveCustomHolidaysStore(store);
    window.thaiHolidays[dateVal] = name.trim();
  }
  
  // Refresh UI
  window.updateHolidayBtn();
  window.drawCalendar();
  window.onAttDateChange();
};

// Update button label based on current date's holiday status
window.updateHolidayBtn = function() {
  const btn = document.getElementById('btn-set-holiday');
  if (!btn) return;
  const dateVal = document.getElementById('att-date')?.value || window._attDate || window.today();
  const store = window.loadCustomHolidays();
  const isCustom = !!store[dateVal];
  const isBuiltIn = !isCustom && !!window.thaiHolidays[dateVal];
  
  if (isBuiltIn) {
    btn.textContent = '🎌 วันหยุดราชการ';
    btn.style.background = 'var(--red-light)';
    btn.style.color = 'var(--red)';
    btn.style.cursor = 'default';
    btn.style.opacity = '0.7';
  } else if (isCustom) {
    btn.textContent = '✕ ยกเลิกวันหยุด';
    btn.style.background = 'var(--red-light)';
    btn.style.color = 'var(--red)';
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
  } else {
    btn.textContent = '🚫 กำหนดวันหยุด';
    btn.style.background = 'var(--surface2)';
    btn.style.color = 'var(--text2)';
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
  }
};

window._fetchedHolidaysYear = null;
window.fetchThaiHolidays = async function(year) {
  if (window._fetchedHolidaysYear === year) return;
  try {
    const res = await fetch(`https://thailandformats.com/api/v1/holidays/${year}`);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    if (data && Array.isArray(data.holidays)) {
      const thaiTranslationMap = {
        "New Year's Day": "วันขึ้นปีใหม่",
        "Special Public Holiday": "วันหยุดกรณีพิเศษ",
        "Makha Bucha Day": "วันมาฆบูชา",
        "Chakri Memorial Day": "วันจักรี",
        "Chakri Day": "วันจักรี",
        "Songkran Festival": "วันสงกรานต์",
        "National Labour Day": "วันแรงงานแห่งชาติ",
        "Labour Day": "วันแรงงานแห่งชาติ",
        "Coronation Day": "วันฉัตรมงคล",
        "Visakha Bucha Day": "วันวิสาขบูชา",
        "Substitution for Visakha Bucha Day": "วันหยุดชดเชยวันวิสาขบูชา",
        "H.M. Queen Suthida's Birthday": "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี",
        "Substitution for Buddhist Lent Day (Khao Phansa)": "วันหยุดชดเชยวันเข้าพรรษา",
        "Buddhist Lent Day (Khao Phansa)": "วันเข้าพรรษา",
        "H.M. King Maha Vajiralongkorn's Birthday": "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว",
        "Asanha Bucha Day": "วันอาสาฬหบูชา",
        "Buddhist Lent Day": "วันเข้าพรรษา",
        "H.M. Queen Sirikit The Queen Mother's Birthday / Mother's Day": "วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ",
        "H.M. King Bhumibol Adulyadej The Great Memorial Day": "วันคล้ายวันสวรรคต ร.9",
        "Chulalongkorn Memorial Day": "วันปิยมหาราช",
        "H.M. King Bhumibol Adulyadej's Birthday / National Day / Father's Day": "วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ",
        "Substitution for H.M. King Bhumibol Adulyadej's Birthday, National Day, and Father's Day": "วันหยุดชดเชยวันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ",
        "Constitution Day": "วันรัฐธรรมนูญ",
        "New Year's Eve": "วันสิ้นปี",
        "Royal Ploughing Ceremony": "วันพืชมงคล"
      };

      data.holidays.forEach(h => {
        const start = h.start_date;
        const end = h.end_date;
        const nameEn = h.title || '';
        let thaiName = thaiTranslationMap[nameEn];
        
        if (!thaiName) {
          const foundKey = Object.keys(thaiTranslationMap).find(k => nameEn.toLowerCase().includes(k.toLowerCase()));
          thaiName = foundKey ? thaiTranslationMap[foundKey] : nameEn;
        }

        let cur = new Date(start + 'T00:00:00');
        const last = new Date(end + 'T00:00:00');
        while (cur <= last) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const d = String(cur.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          window.thaiHolidays[dateStr] = thaiName;
          cur.setDate(cur.getDate() + 1);
        }
      });
      window._fetchedHolidaysYear = year;
      window.drawCalendar();
      const dateVal = document.getElementById('att-date')?.value || window._attDate;
      if (dateVal) {
        const parts = dateVal.split('-');
        if (parts.length === 3) {
          const d = new Date(dateVal + 'T00:00:00');
          const jsDay = d.getDay();
          const dayLabel = document.getElementById('att-day-label');
          if (dayLabel) {
            const thDateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
            const isHoliday = !!window.thaiHolidays[dateVal];
            const holidaySuffix = isHoliday ? ` (วันหยุด: ${window.thaiHolidays[dateVal]})` : '';
            dayLabel.textContent = `วัน${ATT_DAY_NAMES[jsDay] || 'เสาร์/อาทิตย์'}ที่ ${thDateStr}${holidaySuffix}`;
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch Thai holidays:', err);
  }
};

// Calendar displayed month/year state variables
window._calMonth = new Date().getMonth();
window._calYear = new Date().getFullYear();


// switchAttendanceMainTab: handles tab switching
