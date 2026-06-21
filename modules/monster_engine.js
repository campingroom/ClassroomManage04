// ====== MONSTER EVOLUTION ENGINE MODULE ======

window.getStudentMonsterData = function(score) {
  // Ensure score is a valid number, default to 100
  const s = typeof score === 'number' ? score : 100;
  
  let level = 1;
  let name = 'Baby Blob';
  let thaiName = 'ร่างเบบี้บ็อบ (ดื้อจอมซน)';
  let gradient = 'linear-gradient(135deg, #ff8a80, #ff5252)'; // Red-coral
  let textColor = '#d32f2f';
  let badgeColor = '#ffebee';
  let scale = 0.85; // size multiplier for UI
  let progressPercent = 0;
  let nextLevelScore = 50;
  let minLevelScore = 0;

  if (s >= 120) {
    level = 5;
    name = 'Apex Dragon';
    thaiName = 'ร่างมหาเทพมังกรทอง (ในตำนาน)';
    gradient = 'linear-gradient(135deg, #f07dfa, #8e24aa)'; // Purple-magenta
    textColor = '#7b1fa2';
    badgeColor = '#f3e5f5';
    scale = 1.25;
    progressPercent = 100; // Max level
    nextLevelScore = 150;
    minLevelScore = 120;
  } else if (s >= 100) {
    level = 4;
    name = 'Guardian Horn';
    thaiName = 'ร่างผู้พิทักษ์เขายักษ์ (โตเต็มวัย)';
    gradient = 'linear-gradient(135deg, #4ef3d6, #00796b)'; // Teal-green
    textColor = '#004d40';
    badgeColor = '#e0f2f1';
    scale = 1.15;
    progressPercent = Math.min(100, Math.round(((s - 100) / 20) * 100));
    nextLevelScore = 120;
    minLevelScore = 100;
  } else if (s >= 80) {
    level = 3;
    name = 'Bunny Spike';
    thaiName = 'ร่างกระต่ายจ๊าบ (วัยรุ่น)';
    gradient = 'linear-gradient(135deg, #90caf9, #1565c0)'; // Blue-sky
    textColor = '#0d47a1';
    badgeColor = '#e3f2fd';
    scale = 1.05;
    progressPercent = Math.min(100, Math.round(((s - 80) / 20) * 100));
    nextLevelScore = 100;
    minLevelScore = 80;
  } else if (s >= 50) {
    level = 2;
    name = 'Tuffy Horn';
    thaiName = 'ร่างมีเขาหัดเดิน (วัยเตาะแตะ)';
    gradient = 'linear-gradient(135deg, #ffe082, #ff8f00)'; // Yellow-orange
    textColor = '#ff6f00';
    badgeColor = '#fff8e1';
    scale = 0.95;
    progressPercent = Math.min(100, Math.round(((s - 50) / 30) * 100));
    nextLevelScore = 80;
    minLevelScore = 50;
  } else {
    // Level 1: score < 50
    level = 1;
    name = 'Baby Blob';
    thaiName = 'ร่างเบบี้บ็อบ (ดื้อจอมซน)';
    gradient = 'linear-gradient(135deg, #ff8a80, #ff5252)'; // Red-coral
    textColor = '#d32f2f';
    badgeColor = '#ffebee';
    scale = 0.85;
    progressPercent = Math.min(100, Math.round((s / 50) * 100));
    nextLevelScore = 50;
    minLevelScore = 0;
  }

  // Animation CSS styles inside the SVG
  const styleBlock = `
    <style>
      @keyframes monster-breathe {
        0% { transform: scale(1) translateY(0); }
        50% { transform: scale(1.02, 0.97) translateY(1px); }
        100% { transform: scale(1) translateY(0); }
      }
      @keyframes monster-float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-3px); }
        100% { transform: translateY(0px); }
      }
      @keyframes eye-blink {
        0%, 95%, 100% { transform: scaleY(1); }
        97% { transform: scaleY(0.1); }
      }
      @keyframes wing-flap {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(10deg); }
      }
      @keyframes spark-glow {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }
      .m-body {
        animation: monster-breathe 2.5s ease-in-out infinite;
        transform-origin: bottom center;
      }
      .m-float {
        animation: monster-float 4s ease-in-out infinite;
      }
      .m-eye {
        animation: eye-blink 5s infinite;
        transform-origin: center;
      }
      .m-wing-l {
        animation: wing-flap 2s ease-in-out infinite;
        transform-origin: right center;
      }
      .m-wing-r {
        animation: wing-flap 2s ease-in-out infinite;
        transform-origin: left center;
      }
      .m-spark {
        animation: spark-glow 1.5s ease-in-out infinite;
        transform-origin: center;
      }
    </style>
  `;

  let svgContent = '';

  if (level === 1) {
    // Level 1: Red-orange blob, grumpy/cute, tiny legs
    svgContent = `
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${styleBlock}
        <g class="m-float">
          <!-- Shadow -->
          <ellipse cx="50" cy="88" rx="20" ry="4" fill="rgba(0,0,0,0.15)"/>
          
          <g class="m-body">
            <!-- Tiny Legs -->
            <rect x="36" y="80" width="8" height="10" rx="4" fill="#d32f2f"/>
            <rect x="56" y="80" width="8" height="10" rx="4" fill="#d32f2f"/>
            
            <!-- Main Blob Body -->
            <ellipse cx="50" cy="56" rx="28" ry="26" fill="url(#bodyGrad1)"/>
            
            <!-- Band-aid / Scrape -->
            <path d="M26,45 L34,50" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
            <path d="M30,43 L30,52" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
            
            <!-- Eyes (Sad/Grumpy) -->
            <circle class="m-eye" cx="36" cy="52" r="5" fill="#fff"/>
            <circle class="m-eye" cx="36" cy="52" r="2.5" fill="#1e293b"/>
            
            <circle class="m-eye" cx="64" cy="52" r="5" fill="#fff"/>
            <circle class="m-eye" cx="64" cy="52" r="2.5" fill="#1e293b"/>
            
            <!-- Grumpy Eyebrows -->
            <path d="M28,44 L42,48" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M72,44 L58,48" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
            
            <!-- Mouth (Frown) -->
            <path d="M44,66 Q50,60 56,66" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
            
            <!-- Tear (since low score) -->
            <path d="M68,58 C68,61 66,63 64,63 C62,63 61,61 61,58 C61,56 64,52 64,52 C64,52 68,56 68,58 Z" fill="#93c5fd" opacity="0.9"/>
          </g>
        </g>
        <defs>
          <linearGradient id="bodyGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ff8a80"/>
            <stop offset="100%" stop-color="#d50000"/>
          </linearGradient>
        </defs>
      </svg>
    `;
  } else if (level === 2) {
    // Level 2: Orange oval, single small yellow horn
    svgContent = `
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${styleBlock}
        <g class="m-float">
          <!-- Shadow -->
          <ellipse cx="50" cy="90" rx="22" ry="5" fill="rgba(0,0,0,0.15)"/>
          
          <g class="m-body">
            <!-- Feet -->
            <rect x="34" y="80" width="10" height="12" rx="5" fill="#ff6f00"/>
            <rect x="56" y="80" width="10" height="12" rx="5" fill="#ff6f00"/>
            
            <!-- Tiny Horn on head -->
            <path d="M44,28 L50,12 L56,28 Z" fill="#ffe082" stroke="#ff8f00" stroke-width="1.5" stroke-linejoin="round"/>
            
            <!-- Body -->
            <rect x="22" y="30" width="56" height="52" rx="26" fill="url(#bodyGrad2)"/>
            
            <!-- Eyes (Curious) -->
            <circle class="m-eye" cx="38" cy="50" r="6" fill="#fff"/>
            <circle class="m-eye" cx="38" cy="50" r="3" fill="#1e293b"/>
            <circle class="m-eye" cx="38" cy="48" r="1" fill="#fff"/> <!-- Sparkle -->
            
            <circle class="m-eye" cx="62" cy="50" r="6" fill="#fff"/>
            <circle class="m-eye" cx="62" cy="50" r="3" fill="#1e293b"/>
            <circle class="m-eye" cx="62" cy="48" r="1" fill="#fff"/> <!-- Sparkle -->
            
            <!-- Blushing cheeks -->
            <circle cx="28" cy="58" r="3" fill="#ff8a80" opacity="0.6"/>
            <circle cx="72" cy="58" r="3" fill="#ff8a80" opacity="0.6"/>
            
            <!-- Mouth (Small smile) -->
            <path d="M46,62 Q50,65 54,62" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
          </g>
        </g>
        <defs>
          <linearGradient id="bodyGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffe082"/>
            <stop offset="100%" stop-color="#ff6f00"/>
          </linearGradient>
        </defs>
      </svg>
    `;
  } else if (level === 3) {
    // Level 3: Blue bunny-like monster, cute ears
    svgContent = `
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${styleBlock}
        <g class="m-float">
          <!-- Shadow -->
          <ellipse cx="50" cy="91" rx="24" ry="5.5" fill="rgba(0,0,0,0.15)"/>
          
          <!-- Bunny ears -->
          <g class="m-body">
            <rect x="32" y="8" width="10" height="26" rx="5" fill="#90caf9" transform="rotate(-10 37 21)"/>
            <rect x="35" y="12" width="4" height="18" rx="2" fill="#ff8a80" transform="rotate(-10 37 21)" opacity="0.6"/>
            
            <rect x="58" y="8" width="10" height="26" rx="5" fill="#90caf9" transform="rotate(10 63 21)"/>
            <rect x="61" y="12" width="4" height="18" rx="2" fill="#ff8a80" transform="rotate(10 63 21)" opacity="0.6"/>
            
            <!-- Feet -->
            <rect x="32" y="80" width="11" height="13" rx="5.5" fill="#1565c0"/>
            <rect x="57" y="80" width="11" height="13" rx="5.5" fill="#1565c0"/>
            
            <!-- Main Body -->
            <rect x="20" y="28" width="60" height="54" rx="27" fill="url(#bodyGrad3)"/>
            
            <!-- Big Cute Eyes -->
            <circle class="m-eye" cx="36" cy="48" r="7.5" fill="#fff"/>
            <circle class="m-eye" cx="36" cy="48" r="3.5" fill="#1e293b"/>
            <circle class="m-eye" cx="34" cy="46" r="1.5" fill="#fff"/> <!-- Sparkle -->
            
            <circle class="m-eye" cx="64" cy="48" r="7.5" fill="#fff"/>
            <circle class="m-eye" cx="64" cy="48" r="3.5" fill="#1e293b"/>
            <circle class="m-eye" cx="62" cy="46" r="1.5" fill="#fff"/> <!-- Sparkle -->
            
            <!-- Rosy Cheeks -->
            <circle cx="26" cy="58" r="4.5" fill="#f48fb1" opacity="0.7"/>
            <circle cx="74" cy="58" r="4.5" fill="#f48fb1" opacity="0.7"/>
            
            <!-- Cute Smile with a single tooth -->
            <path d="M44,60 Q50,68 56,60" fill="#1e293b"/>
            <rect x="48" y="60" width="4" height="4" fill="#fff"/>
          </g>
        </g>
        <defs>
          <linearGradient id="bodyGrad3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#90caf9"/>
            <stop offset="100%" stop-color="#1565c0"/>
          </linearGradient>
        </defs>
      </svg>
    `;
  } else if (level === 4) {
    // Level 4: Teal monster, striped side-horns, waving hand
    svgContent = `
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${styleBlock}
        <g class="m-float">
          <!-- Shadow -->
          <ellipse cx="50" cy="92" rx="26" ry="6" fill="rgba(0,0,0,0.15)"/>
          
          <g class="m-body">
            <!-- Left Horn (Striped) -->
            <path d="M22,34 C12,30 14,14 26,18 C26,18 20,24 24,32" fill="#e0f2f1" stroke="#00796b" stroke-width="2"/>
            <line x1="17" y1="26" x2="23" y2="23" stroke="#00796b" stroke-width="2"/>
            <line x1="18" y1="20" x2="22" y2="18" stroke="#00796b" stroke-width="2"/>
            
            <!-- Right Horn (Striped) -->
            <path d="M78,34 C88,30 86,14 74,18 C74,18 80,24 76,32" fill="#e0f2f1" stroke="#00796b" stroke-width="2"/>
            <line x1="83" y1="26" x2="77" y2="23" stroke="#00796b" stroke-width="2"/>
            <line x1="82" y1="20" x2="78" y2="18" stroke="#00796b" stroke-width="2"/>
            
            <!-- Feet -->
            <rect x="30" y="80" width="12" height="14" rx="6" fill="#004d40"/>
            <rect x="58" y="80" width="12" height="14" rx="6" fill="#004d40"/>
            
            <!-- Body -->
            <ellipse cx="50" cy="56" rx="31" ry="28" fill="url(#bodyGrad4)"/>
            
            <!-- Little Hands/Arms -->
            <path d="M16,56 Q10,50 14,44 Q18,44 20,52 Z" fill="#00796b"/>
            <path d="M84,56 Q94,50 92,42 Q86,40 80,52 Z" fill="#00796b"/> <!-- Waving arm -->
            
            <!-- Happy Eyes -->
            <ellipse class="m-eye" cx="36" cy="48" rx="8" ry="8" fill="#fff"/>
            <circle class="m-eye" cx="36" cy="48" r="4" fill="#004d40"/>
            <circle class="m-eye" cx="34" cy="46" r="2" fill="#fff"/> <!-- Sparkle -->
            
            <ellipse class="m-eye" cx="64" cy="48" rx="8" ry="8" fill="#fff"/>
            <circle class="m-eye" cx="64" cy="48" r="4" fill="#004d40"/>
            <circle class="m-eye" cx="62" cy="46" r="2" fill="#fff"/> <!-- Sparkle -->
            
            <!-- Rosy Cheeks -->
            <circle cx="25" cy="58" r="5" fill="#f87171" opacity="0.6"/>
            <circle cx="75" cy="58" r="5" fill="#f87171" opacity="0.6"/>
            
            <!-- Wide Open Smiling Mouth -->
            <path d="M42,60 Q50,72 58,60 Z" fill="#1e293b"/>
            <!-- Tongue -->
            <path d="M45,65 Q50,72 55,65 Z" fill="#f87171"/>
          </g>
        </g>
        <defs>
          <linearGradient id="bodyGrad4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4ef3d6"/>
            <stop offset="100%" stop-color="#004d40"/>
          </linearGradient>
        </defs>
      </svg>
    `;
  } else {
    // Level 5 (120+): Purple dragon/mega monster with crown, wings and sparkles
    svgContent = `
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${styleBlock}
        <g class="m-float">
          <!-- Shadow -->
          <ellipse cx="50" cy="93" rx="30" ry="7" fill="rgba(0,0,0,0.15)"/>
          
          <!-- Wings (Flapping Animation) -->
          <g class="m-wing-l" style="transform-origin: 30px 50px;">
            <path d="M22,46 C10,34 5,48 10,58 C15,62 24,56 24,56" fill="#8e24aa" stroke="#5c007a" stroke-width="2"/>
          </g>
          <g class="m-wing-r" style="transform-origin: 70px 50px;">
            <path d="M78,46 C90,34 95,48 90,58 C85,62 76,56 76,56" fill="#8e24aa" stroke="#5c007a" stroke-width="2"/>
          </g>
          
          <g class="m-body">
            <!-- Big Side Horns -->
            <path d="M25,28 C10,12 8,30 20,36" fill="#fffbdf" stroke="#8e24aa" stroke-width="2" stroke-linejoin="round"/>
            <path d="M75,28 C90,12 92,30 80,36" fill="#fffbdf" stroke="#8e24aa" stroke-width="2" stroke-linejoin="round"/>
            
            <!-- Feet -->
            <rect x="28" y="80" width="14" height="15" rx="7" fill="#4a0072"/>
            <rect x="58" y="80" width="14" height="15" rx="7" fill="#4a0072"/>
            
            <!-- Large Body -->
            <rect x="16" y="28" width="68" height="56" rx="28" fill="url(#bodyGrad5)"/>
            
            <!-- Golden Crown on Head -->
            <path d="M40,24 L43,12 L50,19 L57,12 L60,24 Z" fill="#ffd54f" stroke="#ffb300" stroke-width="1.5"/>
            <circle cx="43" cy="12" r="1.5" fill="#d32f2f"/>
            <circle cx="50" cy="19" r="1.5" fill="#1976d2"/>
            <circle cx="57" cy="12" r="1.5" fill="#388e3c"/>
            
            <!-- Big Sparkling Eyes -->
            <circle class="m-eye" cx="36" cy="48" r="8.5" fill="#fff"/>
            <circle class="m-eye" cx="36" cy="48" r="4.5" fill="#4a0072"/>
            <!-- Sparkles -->
            <circle class="m-eye" cx="33" cy="45" r="2.2" fill="#fff"/>
            <circle class="m-eye" cx="38" cy="51" r="1" fill="#fff"/>
            
            <circle class="m-eye" cx="64" cy="48" r="8.5" fill="#fff"/>
            <circle class="m-eye" cx="64" cy="48" r="4.5" fill="#4a0072"/>
            <!-- Sparkles -->
            <circle class="m-eye" cx="61" cy="45" r="2.2" fill="#fff"/>
            <circle class="m-eye" cx="66" cy="51" r="1" fill="#fff"/>
            
            <!-- Pink cheeks -->
            <circle cx="24" cy="58" r="6" fill="#f48fb1" opacity="0.8"/>
            <circle cx="76" cy="58" r="6" fill="#f48fb1" opacity="0.8"/>
            
            <!-- Laughing mouth with teeth -->
            <path d="M38,60 C38,74 62,74 62,60 Z" fill="#1e293b"/>
            <!-- Top Teeth -->
            <path d="M42,60 L45,63 L48,60 L52,60 L55,63 L58,60" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
            <!-- Tongue -->
            <path d="M44,66 Q50,72 56,66 Z" fill="#f48fb1"/>
          </g>
          
          <!-- Sparkle stars surrounding -->
          <path class="m-spark" d="M12,24 L14,20 L16,24 L14,28 Z" fill="#ffd54f"/>
          <path class="m-spark" d="M85,20 L87,17 L89,20 L87,23 Z" fill="#ffd54f"/>
        </g>
        <defs>
          <linearGradient id="bodyGrad5" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f07dfa"/>
            <stop offset="100%" stop-color="#4a0072"/>
          </linearGradient>
        </defs>
      </svg>
    `;
  }

  return {
    level,
    name,
    thaiName,
    gradient,
    textColor,
    badgeColor,
    scale,
    progressPercent,
    nextLevelScore,
    minLevelScore,
    svg: svgContent
  };
};
