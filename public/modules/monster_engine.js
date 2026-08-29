// ====== MONSTER EVOLUTION ENGINE MODULE ======
// Contains all SVG templates and formulas for the 25-tier behavior gamification.

window.getStudentMonsterData = function(score) {
  const s = typeof score === 'number' ? score : 0;

  const levelConfigs = [
    // Negative Levels (-5 to -1)
    { level: -5, min: -Infinity, max: -51, name: 'Gloom King', thaiName: 'ร่างจอมปีศาจแห่งความเศร้าหมอง (Lv.-5)', gradient: 'linear-gradient(135deg, #1e1b4b, #030712)', gradStart: '#1e1b4b', gradEnd: '#030712', textColor: '#818cf8', badgeColor: '#1e1b4b', scale: 0.35, nextLevelScore: -50, minLevelScore: -51 },
    { level: -4, min: -50, max: -31, name: 'Moody Cloud', thaiName: 'ร่างกลุ่มเมฆมืดครึ้มหม่นหมอง (Lv.-4)', gradient: 'linear-gradient(135deg, #2f3640, #718093)', gradStart: '#2f3640', gradEnd: '#718093', textColor: '#718093', badgeColor: '#2f3640', scale: 0.45, nextLevelScore: -30, minLevelScore: -50 },
    { level: -3, min: -30, max: -16, name: 'Rain Droplet', thaiName: 'ร่างหยาดน้ำตาแห่งความเงียบเหงา (Lv.-3)', gradient: 'linear-gradient(135deg, #4b6584, #778ca3)', gradStart: '#4b6584', gradEnd: '#778ca3', textColor: '#778ca3', badgeColor: '#4b6584', scale: 0.55, nextLevelScore: -15, minLevelScore: -30 },
    { level: -2, min: -15, max: -6, name: 'Grumpy Sprout', thaiName: 'ร่างต้นอ่อนเหี่ยวเฉาจอมโวยวาย (Lv.-2)', gradient: 'linear-gradient(135deg, #7f8c8d, #9b59b6)', gradStart: '#7f8c8d', gradEnd: '#9b59b6', textColor: '#9b59b6', badgeColor: '#7f8c8d', scale: 0.65, nextLevelScore: -5, minLevelScore: -15 },
    { level: -1, min: -5, max: -1, name: 'Baby Gloomy', thaiName: 'ร่างบ็อบน้อยดื้อรั้นเจ้าอารมณ์ (Lv.-1)', gradient: 'linear-gradient(135deg, #a1a1a1, #e74c3c)', gradStart: '#a1a1a1', gradEnd: '#e74c3c', textColor: '#e74c3c', badgeColor: '#ffebee', scale: 0.75, nextLevelScore: 0, minLevelScore: -5 },
    // Positive Levels (1 to 20)
    { level: 1, min: 0, max: 5, name: 'Sprout Egg', thaiName: 'ร่างไข่ใบไม้ต้นอ่อนแรกฟัก (Lv.1)', gradient: 'linear-gradient(135deg, #a8e6cf, #56ab2f)', gradStart: '#a8e6cf', gradEnd: '#56ab2f', textColor: '#388e3c', badgeColor: '#e8f5e9', scale: 0.8, nextLevelScore: 6, minLevelScore: 0 },
    { level: 2, min: 6, max: 10, name: 'Green Jelly Slime', thaiName: 'ร่างเจลลี่สไลม์เขียววัยเตาะแตะ (Lv.2)', gradient: 'linear-gradient(135deg, #d4fc79, #96e6a1)', gradStart: '#d4fc79', gradEnd: '#96e6a1', textColor: '#2e7d32', badgeColor: '#f1f8e9', scale: 0.85, nextLevelScore: 11, minLevelScore: 6 },
    { level: 3, min: 11, max: 15, name: 'Spotted Horned Slime', thaiName: 'ร่างสไลม์มีเขาลายจุดน่ารัก (Lv.3)', gradient: 'linear-gradient(135deg, #84fab0, #8fd3f4)', gradStart: '#84fab0', gradEnd: '#8fd3f4', textColor: '#00796b', badgeColor: '#e0f2f1', scale: 0.9, nextLevelScore: 16, minLevelScore: 11 },
    { level: 4, min: 16, max: 20, name: 'Spike Bunny', thaiName: 'ร่างกระต่ายน้อยหูหนามขนฟู (Lv.4)', gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)', gradStart: '#ff9a9e', gradEnd: '#fecfef', textColor: '#d81b60', badgeColor: '#fce4ec', scale: 0.95, nextLevelScore: 21, minLevelScore: 16 },
    { level: 5, min: 21, max: 25, name: 'Magic Wand Slime', thaiName: 'ร่างสไลม์คทาเวทมนตร์แสนซน (Lv.5)', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', gradStart: '#a18cd1', gradEnd: '#fbc2eb', textColor: '#6d1b7b', badgeColor: '#f3e5f5', scale: 1.0, nextLevelScore: 26, minLevelScore: 21 },
    { level: 6, min: 26, max: 30, name: 'Little Bush Squirrel', thaiName: 'ร่างกระรอกหางพุ่มตัวกลม (Lv.6)', gradient: 'linear-gradient(135deg, #f1c40f, #f39c12)', gradStart: '#f1c40f', gradEnd: '#f39c12', textColor: '#e65100', badgeColor: '#fff8e1', scale: 1.05, nextLevelScore: 31, minLevelScore: 26 },
    { level: 7, min: 31, max: 40, name: 'Fox Seedling', thaiName: 'ร่างจิ้งจอกหางผลไม้แรกผลิ (Lv.7)', gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)', gradStart: '#ff9a9e', gradEnd: '#fecfef', textColor: '#d81b60', badgeColor: '#fce4ec', scale: 1.1, nextLevelScore: 41, minLevelScore: 31 },
    { level: 8, min: 41, max: 50, name: 'Sea Glass Turtle', thaiName: 'ร่างเต่าแก้วปะการังมหาสมุทร (Lv.8)', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', gradStart: '#4facfe', gradEnd: '#00f2fe', textColor: '#01579b', badgeColor: '#e1f5fe', scale: 1.15, nextLevelScore: 51, minLevelScore: 41 },
    { level: 9, min: 51, max: 60, name: 'Sun Fox', thaiName: 'ร่างจิ้งจอกสุริยะเปล่งแสง (Lv.9)', gradient: 'linear-gradient(135deg, #ffafbd, #ffc3a0)', gradStart: '#ffafbd', gradEnd: '#ffc3a0', textColor: '#e65100', badgeColor: '#ffe0b2', scale: 1.2, nextLevelScore: 61, minLevelScore: 51 },
    { level: 10, min: 61, max: 70, name: 'Spark Horn Pegasus', thaiName: 'ร่างเพกาซัสเขาประกายฟ้า (Lv.10)', gradient: 'linear-gradient(135deg, #ee9ca7, #ffdde1)', gradStart: '#ee9ca7', gradEnd: '#ffdde1', textColor: '#880e4f', badgeColor: '#fce4ec', scale: 1.25, nextLevelScore: 71, minLevelScore: 61 },
    { level: 11, min: 71, max: 80, name: 'Clover Sheep', thaiName: 'ร่างแกะนุ่มฟูสี่ใบนำโชค (Lv.11)', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)', gradStart: '#11998e', gradEnd: '#38ef7d', textColor: '#1b5e20', badgeColor: '#e8f5e9', scale: 1.3, nextLevelScore: 81, minLevelScore: 71 },
    { level: 12, min: 81, max: 90, name: 'Cosmic Jellyfish', thaiName: 'ร่างแมงกะพรุนอวกาศลอยฟ้า (Lv.12)', gradient: 'linear-gradient(135deg, #182848, #4b6cb7)', gradStart: '#182848', gradEnd: '#4b6cb7', textColor: '#1a237e', badgeColor: '#e8eaf6', scale: 1.35, nextLevelScore: 91, minLevelScore: 81 },
    { level: 13, min: 91, max: 100, name: 'Starlight Griffin', thaiName: 'ร่างกริฟฟินลูกครึ่งสิงโตนก (Lv.13)', gradient: 'linear-gradient(135deg, #ffe259, #ffa751)', gradStart: '#ffe259', gradEnd: '#ffa751', textColor: '#f57c00', badgeColor: '#fff3e0', scale: 1.4, nextLevelScore: 101, minLevelScore: 91 },
    { level: 14, min: 101, max: 110, name: 'Lava Salamander', thaiName: 'ร่างซาลาแมนเดอร์หินหนืดไฟ (Lv.14)', gradient: 'linear-gradient(135deg, #ff416c, #ff4b2b)', gradStart: '#ff416c', gradEnd: '#ff4b2b', textColor: '#d84315', badgeColor: '#fbe9e7', scale: 1.45, nextLevelScore: 111, minLevelScore: 101 },
    { level: 15, min: 111, max: 120, name: 'Aurora Kitsune', thaiName: 'ร่างจิ้งจอกออโรร่าพิทักษ์ (Lv.15)', gradient: 'linear-gradient(135deg, #833ab4, #fd1d1d)', gradStart: '#833ab4', gradEnd: '#fd1d1d', textColor: '#4a148c', badgeColor: '#f3e5f5', scale: 1.5, nextLevelScore: 121, minLevelScore: 111 },
    { level: 16, min: 121, max: 135, name: 'Thunder Bird', thaiName: 'ร่างนกฟ้าร้องสายฟ้านภา (Lv.16)', gradient: 'linear-gradient(135deg, #3f51b5, #ab47bc)', gradStart: '#3f51b5', gradEnd: '#ab47bc', textColor: '#311b92', badgeColor: '#ede7f6', scale: 1.55, nextLevelScore: 136, minLevelScore: 121 },
    { level: 17, min: 136, max: 150, name: 'Forest Dryad Deer', thaiName: 'ร่างกวางวิญญาณแห่งผืนป่า (Lv.17)', gradient: 'linear-gradient(135deg, #134e5e, #71b280)', gradStart: '#134e5e', gradEnd: '#71b280', textColor: '#1b5e20', badgeColor: '#e8f5e9', scale: 1.6, nextLevelScore: 151, minLevelScore: 136 },
    { level: 18, min: 151, max: 165, name: 'Solar Phoenix', thaiName: 'ร่างฟีนิกซ์เพลิงสุริยันอมตะ (Lv.18)', gradient: 'linear-gradient(135deg, #ff007f, #ffaa00)', gradStart: '#ff007f', gradEnd: '#ffaa00', textColor: '#b71c1c', badgeColor: '#ffebee', scale: 1.65, nextLevelScore: 166, minLevelScore: 151 },
    { level: 19, min: 166, max: 180, name: 'Elder Titan', thaiName: 'ร่างยักษ์ไททันผู้พิทักษ์ปฐพี (Lv.19)', gradient: 'linear-gradient(135deg, #8d6e63, #4e342e)', gradStart: '#8d6e63', gradEnd: '#4e342e', textColor: '#3e2723', badgeColor: '#efebe9', scale: 1.7, nextLevelScore: 181, minLevelScore: 166 },
    { level: 20, min: 181, max: Infinity, name: 'Apex Creator', thaiName: 'ร่างเทพบรรพกาลผู้สร้างสรรค์ (Lv.20)', gradient: 'linear-gradient(135deg, #f093fb, #f5576c, #4facfe, #00f2fe)', gradStart: '#f093fb', gradEnd: '#00f2fe', textColor: '#4a148c', badgeColor: '#f3e5f5', scale: 1.8, nextLevelScore: 9999, minLevelScore: 181 }
  ];

  // Match the score to find level configuration
  const conf = levelConfigs.find(c => s >= c.min && s <= c.max) || levelConfigs[5]; // Default to Level 1

  // Calculate EXP progress percent
  let progressPercent = 0;
  if (conf.level === 20 || conf.level === -5) {
    progressPercent = 100;
  } else {
    const range = conf.max - conf.min;
    if (range > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round(((s - conf.min) / range) * 100)));
    } else {
      progressPercent = 100;
    }
  }

  // Animation CSS styles inside the SVG
  const styleBlock = `
    <style>
      @keyframes monster-breathe {
        0% { transform: scale(1) translateY(0); }
        50% { transform: scale(1.02, 0.98) translateY(1.5px); }
        100% { transform: scale(1) translateY(0); }
      }
      @keyframes monster-float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-4px); }
        100% { transform: translateY(0px); }
      }
      @keyframes eye-blink {
        0%, 95%, 100% { transform: scaleY(1); }
        97% { transform: scaleY(0.12); }
      }
      @keyframes wing-flap-l {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(14deg); }
      }
      @keyframes wing-flap-r {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(-14deg); }
      }
      @keyframes spark-glow {
        0%, 100% { opacity: 0.4; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.2); }
      }
      .m-body {
        animation: monster-breathe 2.4s ease-in-out infinite;
        transform-origin: bottom center;
      }
      .m-float {
        animation: monster-float 3.8s ease-in-out infinite;
      }
      .m-eye {
        animation: eye-blink 5.2s infinite;
        transform-origin: center;
      }
      .m-wing-l {
        animation: wing-flap-l 1.8s ease-in-out infinite;
      }
      .m-wing-r {
        animation: wing-flap-r 1.8s ease-in-out infinite;
      }
      .m-spark {
        animation: spark-glow 1.4s ease-in-out infinite;
        transform-origin: center;
      }
    </style>
  `;

  // Gradient definitions inside the SVG
  const gradId = `monsterGrad_${Math.abs(conf.level)}_${s < 0 ? 'neg' : 'pos'}`;
  let stopsHTML = '';
  if (conf.level === 20) {
    stopsHTML = `
      <stop offset="0%" stop-color="#f093fb"/>
      <stop offset="33%" stop-color="#f5576c"/>
      <stop offset="66%" stop-color="#4facfe"/>
      <stop offset="100%" stop-color="#00f2fe"/>
    `;
  } else {
    stopsHTML = `
      <stop offset="0%" stop-color="${conf.gradStart}"/>
      <stop offset="100%" stop-color="${conf.gradEnd}"/>
    `;
  }
  const defs = `
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        ${stopsHTML}
      </linearGradient>
    </defs>
  `;

  let svgContent = '';

  switch (conf.level) {
    // ═════════════════ NEGATIVE TIE-UPS ═════════════════
    case -5:
      // Gloom King: Grumpy voids, multi eyes, horns
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="88" rx="20" ry="4.5" fill="rgba(0,0,0,0.3)"/>
            <g class="m-body">
              <path d="M25,35 L15,20 L30,28 Z" fill="#312e81" stroke="#1e1b4b" stroke-width="1.5"/>
              <path d="M75,35 L85,20 L70,28 Z" fill="#312e81" stroke="#1e1b4b" stroke-width="1.5"/>
              <ellipse cx="50" cy="58" rx="28" ry="24" fill="url(#${gradId})"/>
              <circle cx="36" cy="50" r="5" fill="#f87171"/>
              <circle cx="36" cy="50" r="2" fill="#7f1d1d"/>
              <circle cx="64" cy="50" r="5" fill="#f87171"/>
              <circle cx="64" cy="50" r="2" fill="#7f1d1d"/>
              <circle cx="50" cy="44" r="4" fill="#ef4444"/>
              <circle cx="50" cy="44" r="1.5" fill="#7f1d1d"/>
              <path d="M42,70 Q50,62 58,70" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" fill="none"/>
              <path d="M30,42 L42,48" stroke="#7f1d1d" stroke-width="2" stroke-linecap="round"/>
              <path d="M70,42 L58,48" stroke="#7f1d1d" stroke-width="2" stroke-linecap="round"/>
            </g>
            <circle class="m-spark" cx="20" cy="30" r="2" fill="#ef4444"/>
            <circle class="m-spark" cx="80" cy="35" r="1.5" fill="#ef4444"/>
          </g>
        </svg>
      `;
      break;

    case -4:
      // Moody Cloud: Frowning cloud body, rainy drops
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="88" rx="20" ry="4" fill="rgba(0,0,0,0.15)"/>
            <g class="m-body">
              <ellipse cx="50" cy="54" rx="26" ry="20" fill="url(#${gradId})"/>
              <circle cx="34" cy="58" r="15" fill="url(#${gradId})"/>
              <circle cx="66" cy="58" r="15" fill="url(#${gradId})"/>
              <circle cx="42" cy="44" r="14" fill="url(#${gradId})"/>
              <circle cx="58" cy="44" r="14" fill="url(#${gradId})"/>
              <path d="M32,54 Q36,50 40,54" stroke="#1e272e" stroke-width="2.5" stroke-linecap="round" fill="none"/>
              <path d="M60,54 Q64,50 68,54" stroke="#1e272e" stroke-width="2.5" stroke-linecap="round" fill="none"/>
              <path d="M46,66 Q50,61 54,66" stroke="#1e272e" stroke-width="2.5" stroke-linecap="round" fill="none"/>
              <path class="m-spark" d="M32,74 L32,80" stroke="#70a1ff" stroke-width="2" stroke-linecap="round"/>
              <path class="m-spark" d="M50,76 L50,82" stroke="#70a1ff" stroke-width="2" stroke-linecap="round"/>
              <path class="m-spark" d="M68,74 L68,80" stroke="#70a1ff" stroke-width="2" stroke-linecap="round"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case -3:
      // Rain Droplet: Drop shape crying
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="90" rx="18" ry="4" fill="rgba(0,0,0,0.15)"/>
            <g class="m-body">
              <path d="M50,25 C30,55 30,80 50,80 C70,80 70,55 50,25 Z" fill="url(#${gradId})"/>
              <circle cx="42" cy="60" r="3.5" fill="#fff"/>
              <circle cx="42" cy="60" r="1.5" fill="#1e293b"/>
              <circle cx="58" cy="60" r="3.5" fill="#fff"/>
              <circle cx="58" cy="60" r="1.5" fill="#1e293b"/>
              <path d="M42,63 L42,72" stroke="#70a1ff" stroke-width="2" stroke-linecap="round"/>
              <path d="M58,63 L58,72" stroke="#70a1ff" stroke-width="2" stroke-linecap="round"/>
              <path d="M47,68 Q50,64 53,68" stroke="#1e293b" stroke-width="2" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case -2:
      // Grumpy Sprout: Withered stem, frown face
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="88" rx="18" ry="4" fill="rgba(0,0,0,0.15)"/>
            <g class="m-body">
              <path d="M50,50 L50,30" stroke="#7f8c8d" stroke-width="4" stroke-linecap="round"/>
              <path d="M50,30 Q40,25 35,30 Q45,35 50,30" fill="#7f8c8d"/>
              <ellipse cx="50" cy="65" rx="22" ry="18" fill="url(#${gradId})"/>
              <circle cx="42" cy="62" r="3" fill="#fff"/>
              <circle cx="42" cy="62" r="1.5" fill="#1e293b"/>
              <circle cx="58" cy="62" r="3" fill="#fff"/>
              <circle cx="58" cy="62" r="1.5" fill="#1e293b"/>
              <path d="M38,56 L46,59" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
              <path d="M62,56 L54,59" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
              <path d="M46,72 Q50,67 54,72" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case -1:
      // Baby Gloomy: Small pouting blob, bandaid
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="88" rx="16" ry="3.5" fill="rgba(0,0,0,0.15)"/>
            <g class="m-body">
              <ellipse cx="50" cy="62" rx="20" ry="17" fill="url(#${gradId})"/>
              <path d="M36,52 L44,56" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
              <circle cx="42" cy="60" r="3" fill="#fff"/>
              <circle cx="42" cy="60" r="1.5" fill="#1e293b"/>
              <circle cx="58" cy="60" r="3" fill="#fff"/>
              <circle cx="58" cy="60" r="1.5" fill="#1e293b"/>
              <path d="M38,54 L46,57" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
              <path d="M62,54 L54,57" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
              <path d="M47,68 Q50,64 53,68" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    // ═════════════════ POSITIVE TIE-UPS ═════════════════
    case 1:
      // Sprout Egg: Cracked egg, leaf sprout
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="88" rx="18" ry="4" fill="rgba(0,0,0,0.1)"/>
            <g class="m-body">
              <path d="M50,34 Q40,24 50,14 Q60,24 50,34" fill="#56ab2f"/>
              <path d="M50,14 L50,34" stroke="#388e3c" stroke-width="1.5"/>
              <path d="M30,50 C30,35 70,35 70,50 C70,72 30,72 30,50 Z" fill="url(#${gradId})"/>
              <path d="M30,50 L40,55 L50,48 L60,56 L70,50" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.6"/>
              <circle class="m-eye" cx="44" cy="58" r="3" fill="#fff"/>
              <circle class="m-eye" cx="44" cy="58" r="1.5" fill="#1e293b"/>
              <circle class="m-eye" cx="56" cy="58" r="3" fill="#fff"/>
              <circle class="m-eye" cx="56" cy="58" r="1.5" fill="#1e293b"/>
              <path d="M48,64 Q50,67 52,64" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 2:
      // Green Jelly Slime: Round jelly slime, cute smile
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="88" rx="20" ry="4.5" fill="rgba(0,0,0,0.1)"/>
            <g class="m-body">
              <ellipse cx="50" cy="58" rx="25" ry="21" fill="url(#${gradId})"/>
              <circle class="m-eye" cx="40" cy="54" r="4.5" fill="#fff"/>
              <circle class="m-eye" cx="40" cy="54" r="2" fill="#1e293b"/>
              <circle class="m-eye" cx="60" cy="54" r="4.5" fill="#fff"/>
              <circle class="m-eye" cx="60" cy="54" r="2" fill="#1e293b"/>
              <circle cx="32" cy="60" r="3" fill="#ff7675" opacity="0.6"/>
              <circle cx="68" cy="60" r="3" fill="#ff7675" opacity="0.6"/>
              <path d="M46,62 Q50,66 54,62" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 3:
      // Spotted Horned Slime: Slime horns and spots
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="88" rx="21" ry="5" fill="rgba(0,0,0,0.1)"/>
            <g class="m-body">
              <path d="M34,40 L30,26 L42,36 Z" fill="#8fd3f4" stroke="#84fab0" stroke-width="1"/>
              <path d="M66,40 L70,26 L58,36 Z" fill="#8fd3f4" stroke="#84fab0" stroke-width="1"/>
              <ellipse cx="50" cy="58" rx="26" ry="22" fill="url(#${gradId})"/>
              <circle cx="36" cy="46" r="3" fill="#fff" opacity="0.4"/>
              <circle cx="64" cy="46" r="3" fill="#fff" opacity="0.4"/>
              <circle class="m-eye" cx="42" cy="54" r="4.5" fill="#fff"/>
              <circle class="m-eye" cx="42" cy="54" r="2" fill="#1e293b"/>
              <circle class="m-eye" cx="58" cy="54" r="4.5" fill="#fff"/>
              <circle class="m-eye" cx="58" cy="54" r="2" fill="#1e293b"/>
              <path d="M47,61 Q50,65 53,61" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 4:
      // Spike Bunny: Cute bunny ears, spike cheeks
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="90" rx="22" ry="5" fill="rgba(0,0,0,0.1)"/>
            <g class="m-body">
              <rect x="32" y="10" width="9" height="24" rx="4.5" fill="url(#${gradId})" transform="rotate(-15 36 22)"/>
              <rect x="59" y="10" width="9" height="24" rx="4.5" fill="url(#${gradId})" transform="rotate(15 64 22)"/>
              <rect x="35" y="14" width="4" height="16" rx="2" fill="#ffccd5" transform="rotate(-15 36 22)"/>
              <rect x="61" y="14" width="4" height="16" rx="2" fill="#ffccd5" transform="rotate(15 64 22)"/>
              <ellipse cx="50" cy="60" rx="26" ry="22" fill="url(#${gradId})"/>
              <circle class="m-eye" cx="40" cy="56" r="4.5" fill="#fff"/>
              <circle class="m-eye" cx="40" cy="56" r="2" fill="#1e293b"/>
              <circle class="m-eye" cx="60" cy="56" r="4.5" fill="#fff"/>
              <circle class="m-eye" cx="60" cy="56" r="2" fill="#1e293b"/>
              <circle cx="32" cy="63" r="3" fill="#ff7675" opacity="0.6"/>
              <circle cx="68" cy="63" r="3" fill="#ff7675" opacity="0.6"/>
              <path d="M46,63 Q50,67 54,63" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 5:
      // Magic Wand Slime: Holding star wand
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="88" rx="22" ry="5" fill="rgba(0,0,0,0.1)"/>
            <g class="m-body">
              <rect x="70" y="44" width="4" height="24" rx="2" fill="#a18cd1" transform="rotate(25 72 56)"/>
              <path d="M72,36 L75,41 L80,41 L76,44 L78,49 L72,46 L66,49 L68,44 L64,41 L69,41 Z" fill="#ffd54f" stroke="#fbc2eb" stroke-width="1" transform="rotate(25 72 41)"/>
              <ellipse cx="46" cy="58" rx="26" ry="22" fill="url(#${gradId})"/>
              <circle class="m-eye" cx="36" cy="54" r="5" fill="#fff"/>
              <circle class="m-eye" cx="36" cy="54" r="2.2" fill="#1e293b"/>
              <circle class="m-eye" cx="56" cy="54" r="5" fill="#fff"/>
              <circle class="m-eye" cx="56" cy="54" r="2.2" fill="#1e293b"/>
              <path d="M43,62 Q46,66 49,62" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 6:
      // Little Bush Squirrel: Big squirrel tail, ears
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="90" rx="23" ry="5" fill="rgba(0,0,0,0.1)"/>
            <g class="m-body">
              <path d="M22,64 C12,50 14,24 28,34 C24,44 26,56 22,64 Z" fill="url(#${gradId})" stroke="#f39c12" stroke-width="1.5"/>
              <path d="M40,36 L45,18 L52,32 Z" fill="url(#${gradId})"/>
              <path d="M68,36 L73,18 L60,32 Z" fill="url(#${gradId})"/>
              <ellipse cx="54" cy="58" rx="24" ry="22" fill="url(#${gradId})"/>
              <circle class="m-eye" cx="46" cy="52" r="4.5" fill="#fff"/>
              <circle class="m-eye" cx="46" cy="52" r="2" fill="#1e293b"/>
              <circle class="m-eye" cx="62" cy="52" r="4.5" fill="#fff"/>
              <circle class="m-eye" cx="62" cy="52" r="2" fill="#1e293b"/>
              <polygon points="54,57 52,55 56,55" fill="#1e293b"/>
              <path d="M51,59 Q54,62 57,59" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 7:
      // Fox Seedling: Fox ears, leaf tail
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="90" rx="23" ry="5.5" fill="rgba(0,0,0,0.1)"/>
            <g class="m-body">
              <path d="M30,36 L25,18 L40,28 Z" fill="url(#${gradId})"/>
              <path d="M70,36 L75,18 L60,28 Z" fill="url(#${gradId})"/>
              <path d="M22,70 Q10,65 14,50 Q24,55 22,70 Z" fill="#56ab2f"/>
              <rect x="25" y="32" width="50" height="48" rx="24" fill="url(#${gradId})"/>
              <circle class="m-eye" cx="40" cy="50" r="5" fill="#fff"/>
              <circle class="m-eye" cx="40" cy="50" r="2.2" fill="#1e293b"/>
              <circle class="m-eye" cx="60" cy="50" r="5" fill="#fff"/>
              <circle class="m-eye" cx="60" cy="50" r="2.2" fill="#1e293b"/>
              <circle cx="32" cy="57" r="3.5" fill="#f87171" opacity="0.6"/>
              <circle cx="68" cy="57" r="3.5" fill="#f87171" opacity="0.6"/>
              <path d="M47,59 Q50,62 53,59" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 8:
      // Sea Glass Turtle: Round transparent shell, flippers
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="88" rx="24" ry="5" fill="rgba(0,0,0,0.1)"/>
            <g class="m-body">
              <path d="M22,65 Q10,75 16,80 Q22,80 26,70" fill="#00f2fe"/>
              <path d="M78,65 Q90,75 84,80 Q78,80 74,70" fill="#00f2fe"/>
              <ellipse cx="30" cy="42" rx="6" ry="12" fill="#00f2fe" transform="rotate(-30 30 42)"/>
              <ellipse cx="70" cy="42" rx="6" ry="12" fill="#00f2fe" transform="rotate(30 70 42)"/>
              <circle cx="50" cy="56" r="26" fill="url(#${gradId})"/>
              <circle cx="50" cy="56" r="20" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5"/>
              <circle cx="50" cy="32" r="12" fill="#00f2fe"/>
              <circle class="m-eye" cx="46" cy="30" r="2.5" fill="#fff"/>
              <circle class="m-eye" cx="46" cy="30" r="1.2" fill="#1e293b"/>
              <circle class="m-eye" cx="54" cy="30" r="2.5" fill="#fff"/>
              <circle class="m-eye" cx="54" cy="30" r="1.2" fill="#1e293b"/>
              <path d="M48,36 Q50,38 52,36" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 9:
      // Sun Fox: Orange fox, glowing rays
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="90" rx="24" ry="5.5" fill="rgba(0,0,0,0.15)"/>
            <g class="m-body">
              <path class="m-spark" d="M22,30 L16,24" stroke="#ffc3a0" stroke-width="3" stroke-linecap="round"/>
              <path class="m-spark" d="M78,30 L84,24" stroke="#ffc3a0" stroke-width="3" stroke-linecap="round"/>
              <path class="m-spark" d="M50,18 L50,10" stroke="#ffc3a0" stroke-width="3" stroke-linecap="round"/>
              <path d="M28,34 L20,12 L38,24 Z" fill="url(#${gradId})"/>
              <path d="M72,34 L80,12 L62,24 Z" fill="url(#${gradId})"/>
              <rect x="22" y="28" width="56" height="52" rx="28" fill="url(#${gradId})"/>
              <ellipse class="m-eye" cx="38" cy="48" rx="5" ry="6" fill="#fff"/>
              <circle class="m-eye" cx="38" cy="48" r="2.5" fill="#1e293b"/>
              <ellipse class="m-eye" cx="62" cy="48" rx="5" ry="6" fill="#fff"/>
              <circle class="m-eye" cx="62" cy="48" r="2.5" fill="#1e293b"/>
              <polygon points="50,54 47,51 53,51" fill="#1e293b"/>
              <path d="M47,56 Q50,59 53,56" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 10:
      // Spark Horn Pegasus: Pegasus unicorn, glowing horn, wings
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="91" rx="24" ry="5.5" fill="rgba(0,0,0,0.15)"/>
            <g class="m-wing-l" style="transform-origin: 32px 55px;">
              <path d="M26,45 C15,35 12,50 18,58" fill="#ffdde1" stroke="#ee9ca7" stroke-width="1.5"/>
            </g>
            <g class="m-wing-r" style="transform-origin: 68px 55px;">
              <path d="M74,45 C85,35 88,50 82,58" fill="#ffdde1" stroke="#ee9ca7" stroke-width="1.5"/>
            </g>
            <g class="m-body">
              <path class="m-spark" d="M46,28 L50,10 L54,28 Z" fill="#ffd54f" stroke="#ee9ca7" stroke-width="1"/>
              <rect x="25" y="30" width="50" height="52" rx="25" fill="url(#${gradId})"/>
              <circle class="m-eye" cx="38" cy="50" r="6" fill="#fff"/>
              <circle class="m-eye" cx="38" cy="50" r="3" fill="#1e293b"/>
              <circle class="m-eye" cx="62" cy="50" r="6" fill="#fff"/>
              <circle class="m-eye" cx="62" cy="50" r="3" fill="#1e293b"/>
              <path d="M47,60 Q50,64 53,60" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 11:
      // Clover Sheep: Fluffy sheep, lucky clovers
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="90" rx="25" ry="5.5" fill="rgba(0,0,0,0.12)"/>
            <g class="m-body">
              <circle cx="30" cy="50" r="12" fill="#e8f5e9"/>
              <circle cx="70" cy="50" r="12" fill="#e8f5e9"/>
              <circle cx="50" cy="38" r="14" fill="#e8f5e9"/>
              <circle cx="36" cy="66" r="12" fill="#e8f5e9"/>
              <circle cx="64" cy="66" r="12" fill="#e8f5e9"/>
              <g class="m-spark">
                <path d="M46,24 C43,18 57,18 54,24" fill="#38ef7d"/>
                <path d="M46,24 C46,18 50,14 50,24" fill="#38ef7d"/>
              </g>
              <ellipse cx="50" cy="54" rx="20" ry="18" fill="url(#${gradId})"/>
              <circle class="m-eye" cx="42" cy="52" r="4.5" fill="#fff"/>
              <circle class="m-eye" cx="42" cy="52" r="2" fill="#1e293b"/>
              <circle class="m-eye" cx="58" cy="52" r="4.5" fill="#fff"/>
              <circle class="m-eye" cx="58" cy="52" r="2" fill="#1e293b"/>
              <path d="M47,60 Q50,63 53,60" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 12:
      // Cosmic Jellyfish: Wavy space jellyfish, cosmic spots
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="92" rx="22" ry="5" fill="rgba(0,0,0,0.1)"/>
            <path class="m-spark" d="M38,62 Q34,75 38,88" stroke="#4b6cb7" stroke-width="3" stroke-linecap="round" fill="none"/>
            <path class="m-spark" d="M50,64 Q50,78 48,90" stroke="#4b6cb7" stroke-width="3.5" stroke-linecap="round" fill="none"/>
            <path class="m-spark" d="M62,62 Q66,75 62,88" stroke="#4b6cb7" stroke-width="3" stroke-linecap="round" fill="none"/>
            <g class="m-body">
              <path d="M22,54 C22,30 78,30 78,54 C78,60 22,60 22,54 Z" fill="url(#${gradId})"/>
              <circle cx="38" cy="42" r="2" fill="#fff" opacity="0.8"/>
              <circle cx="62" cy="42" r="1.5" fill="#fff" opacity="0.8"/>
              <circle cx="50" cy="35" r="2" fill="#fff" opacity="0.8"/>
              <circle class="m-eye" cx="40" cy="50" r="4" fill="#fff"/>
              <circle class="m-eye" cx="40" cy="50" r="1.8" fill="#1e293b"/>
              <circle class="m-eye" cx="60" cy="50" r="4" fill="#fff"/>
              <circle class="m-eye" cx="60" cy="50" r="1.8" fill="#1e293b"/>
              <path d="M47,54 Q50,57 53,54" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 13:
      // Starlight Griffin: Eagle beak, lion wings
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="90" rx="25" ry="5.5" fill="rgba(0,0,0,0.15)"/>
            <g class="m-wing-l" style="transform-origin: 28px 50px;">
              <path d="M22,44 C12,30 8,45 15,58" fill="#ffa751" stroke="#f57c00" stroke-width="1.5"/>
            </g>
            <g class="m-wing-r" style="transform-origin: 72px 50px;">
              <path d="M78,44 C88,30 92,45 85,58" fill="#ffa751" stroke="#f57c00" stroke-width="1.5"/>
            </g>
            <g class="m-body">
              <path d="M72,70 Q88,75 82,60" stroke="#ffa751" stroke-width="3.5" stroke-linecap="round" fill="none"/>
              <rect x="24" y="30" width="52" height="52" rx="26" fill="url(#${gradId})"/>
              <path d="M50,48 L43,58 L57,58 Z" fill="#ffe259" stroke="#ffa751" stroke-width="1"/>
              <circle class="m-eye" cx="38" cy="46" r="6" fill="#fff"/>
              <circle class="m-eye" cx="38" cy="46" r="2.5" fill="#1e293b"/>
              <circle class="m-eye" cx="62" cy="46" r="6" fill="#fff"/>
              <circle class="m-eye" cx="62" cy="46" r="2.5" fill="#1e293b"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 14:
      // Lava Salamander: Fire tail, horns
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="91" rx="25" ry="6" fill="rgba(0,0,0,0.15)"/>
            <g class="m-body">
              <path class="m-spark" d="M72,68 C88,68 94,48 85,42 C80,52 75,60 72,68 Z" fill="#ff4b2b"/>
              <path d="M30,32 L22,14 L38,24 L42,12 L48,28 Z" fill="#ff4b2b"/>
              <path d="M70,32 L78,14 L62,24 L58,12 L52,28 Z" fill="#ff4b2b"/>
              <rect x="24" y="28" width="52" height="54" rx="26" fill="url(#${gradId})"/>
              <ellipse class="m-eye" cx="38" cy="48" rx="6" ry="7" fill="#fff"/>
              <circle class="m-eye" cx="38" cy="48" r="3" fill="#d84315"/>
              <ellipse class="m-eye" cx="62" cy="48" rx="6" ry="7" fill="#fff"/>
              <circle class="m-eye" cx="62" cy="48" r="3" fill="#d84315"/>
              <path d="M47,58 Q50,62 53,58" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 15:
      // Aurora Kitsune: Multi tails, fox face
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="90" rx="26" ry="6" fill="rgba(0,0,0,0.15)"/>
            <g class="m-spark">
              <path d="M20,60 C10,50 8,30 22,44 C26,50 24,56 20,60 Z" fill="#833ab4" opacity="0.7"/>
              <path d="M80,60 C90,50 92,30 78,44 C74,50 76,56 80,60 Z" fill="#833ab4" opacity="0.7"/>
              <path d="M12,48 C5,38 8,18 20,32 Z" fill="#fd1d1d" opacity="0.6"/>
              <path d="M88,48 C95,38 92,18 80,32 Z" fill="#fd1d1d" opacity="0.6"/>
            </g>
            <g class="m-body">
              <path d="M30,34 L20,12 L38,24 Z" fill="url(#${gradId})"/>
              <path d="M72,34 L80,12 L62,24 Z" fill="url(#${gradId})"/>
              <rect x="24" y="28" width="52" height="54" rx="26" fill="url(#${gradId})"/>
              <ellipse class="m-eye" cx="38" cy="48" rx="6" ry="5" fill="#fff" transform="rotate(-10 38 48)"/>
              <circle class="m-eye" cx="38" cy="48" r="2.5" fill="#4a148c" transform="rotate(-10 38 48)"/>
              <ellipse class="m-eye" cx="62" cy="48" rx="6" ry="5" fill="#fff" transform="rotate(10 62 48)"/>
              <circle class="m-eye" cx="62" cy="48" r="2.5" fill="#4a148c" transform="rotate(10 62 48)"/>
              <polygon points="50,54 48,52 52,52" fill="#1e293b"/>
              <path d="M47,56 Q50,59 53,56" stroke="#1e293b" stroke-width="1.5" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 16:
      // Thunder Bird: Lightning backgrounds, feather crown, flapping wings
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="91" rx="25" ry="6" fill="rgba(0,0,0,0.15)"/>
            <path class="m-spark" d="M15,20 L25,32 L20,36 L30,48" stroke="#ab47bc" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <path class="m-spark" d="M85,20 L75,32 L80,36 L70,48" stroke="#ab47bc" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <g class="m-wing-l" style="transform-origin: 28px 50px;">
              <path d="M22,46 L10,36 L14,54 L24,54" fill="#ab47bc" stroke="#311b92" stroke-width="1.5"/>
            </g>
            <g class="m-wing-r" style="transform-origin: 72px 50px;">
              <path d="M78,46 L90,36 L86,54 L76,54" fill="#ab47bc" stroke="#311b92" stroke-width="1.5"/>
            </g>
            <g class="m-body">
              <rect x="24" y="30" width="52" height="52" rx="26" fill="url(#${gradId})"/>
              <path d="M45,30 L50,15 L55,30 Z" fill="#ab47bc"/>
              <path d="M50,48 L44,56 L56,56 Z" fill="#ab47bc" stroke="#311b92" stroke-width="1"/>
              <circle class="m-eye" cx="38" cy="44" r="5.5" fill="#fff"/>
              <circle class="m-eye" cx="38" cy="44" r="2.5" fill="#311b92"/>
              <circle class="m-eye" cx="62" cy="44" r="5.5" fill="#fff"/>
              <circle class="m-eye" cx="62" cy="44" r="2.5" fill="#311b92"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 17:
      // Forest Dryad Deer: Antlers with leaf buds
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="90" rx="24" ry="5.5" fill="rgba(0,0,0,0.15)"/>
            <g class="m-body">
              <path d="M34,32 Q25,20 20,24 Q30,28 36,36" stroke="#71b280" stroke-width="3" stroke-linecap="round" fill="none"/>
              <path d="M66,32 Q75,20 80,24 Q70,28 64,36" stroke="#71b280" stroke-width="3" stroke-linecap="round" fill="none"/>
              <circle class="m-spark" cx="20" cy="24" r="2.5" fill="#71b280"/>
              <circle class="m-spark" cx="80" cy="24" r="2.5" fill="#71b280"/>
              <rect x="26" y="32" width="48" height="50" rx="24" fill="url(#${gradId})"/>
              <circle class="m-eye" cx="40" cy="50" r="5" fill="#fff"/>
              <circle class="m-eye" cx="40" cy="50" r="2.2" fill="#1b5e20"/>
              <circle class="m-eye" cx="60" cy="50" r="5" fill="#fff"/>
              <circle class="m-eye" cx="60" cy="50" r="2.2" fill="#1b5e20"/>
              <path d="M47,59 Q50,62 53,59" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 18:
      // Solar Phoenix: Fiery bird body, fire crown, majestic look
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="91" rx="25" ry="6" fill="rgba(0,0,0,0.15)"/>
            <g class="m-wing-l" style="transform-origin: 28px 50px;">
              <path d="M22,46 C8,28 4,48 10,60 C16,66 22,54 22,54" fill="#ff007f" stroke="#b71c1c" stroke-width="1.5"/>
            </g>
            <g class="m-wing-r" style="transform-origin: 72px 50px;">
              <path d="M78,46 C92,28 96,48 90,60 C84,66 78,54 78,54" fill="#ff007f" stroke="#b71c1c" stroke-width="1.5"/>
            </g>
            <g class="m-body">
              <path class="m-spark" d="M40,28 L50,10 L60,28 Q50,22 40,28 Z" fill="#ffaa00"/>
              <rect x="24" y="30" width="52" height="52" rx="26" fill="url(#${gradId})"/>
              <path d="M50,48 L44,56 L56,56 Z" fill="#ffaa00" stroke="#b71c1c" stroke-width="1"/>
              <circle class="m-eye" cx="38" cy="44" r="6" fill="#fff"/>
              <circle class="m-eye" cx="38" cy="44" r="2.5" fill="#b71c1c"/>
              <circle class="m-eye" cx="62" cy="44" r="6" fill="#fff"/>
              <circle class="m-eye" cx="62" cy="44" r="2.5" fill="#b71c1c"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 19:
      // Elder Titan: Stone body, glowing runes
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="92" rx="28" ry="6.5" fill="rgba(0,0,0,0.2)"/>
            <g class="m-body">
              <rect x="12" y="38" width="16" height="16" rx="4" fill="#4e342e" transform="rotate(-15 20 46)"/>
              <rect x="72" y="38" width="16" height="16" rx="4" fill="#4e342e" transform="rotate(15 80 46)"/>
              <rect x="20" y="28" width="60" height="56" rx="14" fill="url(#${gradId})"/>
              <path class="m-spark" d="M38,62 L50,50 L62,62" stroke="#ffaa00" stroke-width="3" stroke-linecap="round" fill="none"/>
              <circle cx="36" cy="42" r="4.5" fill="#ffaa00"/>
              <circle cx="64" cy="42" r="4.5" fill="#ffaa00"/>
            </g>
          </g>
        </svg>
      `;
      break;

    case 20:
      // Apex Creator: Celestial Dragon/God, halo, crown, stars, sparkles, wings
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="93" rx="32" ry="7" fill="rgba(0,0,0,0.2)"/>
            <circle class="m-spark" cx="50" cy="22" r="14" fill="none" stroke="#ffd54f" stroke-width="2.5" stroke-dasharray="8,4" opacity="0.8"/>
            <g class="m-wing-l" style="transform-origin: 26px 50px;">
              <path d="M22,44 C6,22 2,46 10,60 C18,70 24,54 24,54" fill="#00f2fe" stroke="#4facfe" stroke-width="1.5"/>
            </g>
            <g class="m-wing-r" style="transform-origin: 74px 50px;">
              <path d="M78,44 C94,22 98,46 90,60 C82,70 76,54 76,54" fill="#00f2fe" stroke="#4facfe" stroke-width="1.5"/>
            </g>
            <g class="m-body">
              <path d="M36,28 L28,10 L42,22 Z" fill="#ffd54f" stroke="#ffa751" stroke-width="1"/>
              <path d="M64,28 L72,10 L58,22 Z" fill="#ffd54f" stroke="#ffa751" stroke-width="1"/>
              <rect x="22" y="28" width="56" height="56" rx="28" fill="url(#${gradId})"/>
              <path d="M42,26 L45,18 L50,23 L55,18 L58,26 Z" fill="#ffd54f" stroke="#ffa751" stroke-width="1"/>
              <circle class="m-eye" cx="38" cy="46" r="7.5" fill="#fff"/>
              <circle class="m-eye" cx="38" cy="46" r="3.5" fill="#4a148c"/>
              <circle class="m-eye" cx="36" cy="44" r="1.5" fill="#fff"/>
              <circle class="m-eye" cx="62" cy="46" r="7.5" fill="#fff"/>
              <circle class="m-eye" cx="62" cy="46" r="3.5" fill="#4a148c"/>
              <circle class="m-eye" cx="60" cy="44" r="1.5" fill="#fff"/>
              <circle cx="30" cy="54" r="4.5" fill="#ff7675" opacity="0.7"/>
              <circle cx="70" cy="54" r="4.5" fill="#ff7675" opacity="0.7"/>
              <path d="M46,58 Q50,62 54,58" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            </g>
            <path class="m-spark" d="M12,24 L14,20 L16,24 L14,28 Z" fill="#ffd54f"/>
            <path class="m-spark" d="M88,24 L90,20 L92,24 L90,28 Z" fill="#ffd54f"/>
          </g>
        </svg>
      `;
      break;

    default:
      // Fallback (same as Level 1)
      svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${styleBlock}
          ${defs}
          <g class="m-float">
            <ellipse cx="50" cy="88" rx="18" ry="4" fill="rgba(0,0,0,0.1)"/>
            <g class="m-body">
              <path d="M50,34 Q40,24 50,14 Q60,24 50,34" fill="#56ab2f"/>
              <path d="M30,50 C30,35 70,35 70,50 C70,72 30,72 30,50 Z" fill="url(#${gradId})"/>
              <circle class="m-eye" cx="44" cy="58" r="3" fill="#fff"/>
              <circle class="m-eye" cx="44" cy="58" r="1.5" fill="#1e293b"/>
              <circle class="m-eye" cx="56" cy="58" r="3" fill="#fff"/>
              <circle class="m-eye" cx="56" cy="58" r="1.5" fill="#1e293b"/>
              <path d="M48,64 Q50,67 52,64" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            </g>
          </g>
        </svg>
      `;
  }

  return {
    level: conf.level,
    name: conf.name,
    thaiName: conf.thaiName,
    gradient: conf.gradient,
    textColor: conf.textColor,
    badgeColor: conf.badgeColor,
    scale: conf.scale,
    progressPercent: progressPercent,
    nextLevelScore: conf.nextLevelScore,
    minLevelScore: conf.minLevelScore,
    svg: svgContent
  };
};
