/* FILE: projects/education/3_course/1_semester/01_ai_communications/2026_09_Prakt_1/work/assets/core.js */

// =========================================================================
// 1. 8 STEPS CANONICAL METADATA (SOKOLOVA'S LAMP ROADMAP)
// =========================================================================
const bulbStepTitles = {
  1: "Крок 1. Визначення реальної інженерної проблеми",
  2: "Крок 2. Мозковий штурм: пошук системних ідей",
  3: "Крок 3. Деталізація ідеї: Машина когнітивних станів",
  4: "Крок 4. Об'єктивний SWOT-аналіз методології",
  5: "Крок 5. Пошук унікальності: Доктрина Інженерного Симбіозу",
  6: "Крок 6. Створення плану дій: Цикл Human-in-the-loop",
  7: "Крок 7. Ідентифікація мінімального інструментарію",
  8: "Крок 8. Зворотний зв'язок ➔ Народження Паспорта"
};

let activeStepNum = 1;

// =========================================================================
// 2. 5-TAB DECK SWITCHER & VIEWPORT FOCUS
// =========================================================================
function switchTaskTab(tabIndex) {
  for (let i = 1; i <= 5; i++) {
    const btn = document.getElementById('tabBtn' + i);
    const pane = document.getElementById('pane' + i);
    if (btn) btn.classList.remove('active-tab');
    if (pane) pane.classList.remove('active-pane');
  }
  const activeBtn = document.getElementById('tabBtn' + tabIndex);
  const activePane = document.getElementById('pane' + tabIndex);
  if (activeBtn) activeBtn.classList.add('active-tab');
  if (activePane) activePane.classList.add('active-pane');
  window.scrollTo({ top: 120, behavior: 'smooth' });
}

function focusOnDeckView() {
  const tabsHeader = document.querySelector('.deck-tabs-header');
  if (tabsHeader) {
    const targetY = tabsHeader.getBoundingClientRect().top + window.pageYOffset - 8;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }
}

// =========================================================================
// 3. TWO-CARD DECK CONTROLLER (NAVIGATOR <-> WORKSPACE)
// =========================================================================
function showNavigatorCard() {
  const navCard = document.getElementById('deckCard_Navigator');
  const workCard = document.getElementById('deckCard_Workspace');
  if (workCard) workCard.style.display = 'none';
  if (navCard) navCard.style.display = 'block';
  focusOnDeckView();
}

function showWorkspaceCard() {
  const navCard = document.getElementById('deckCard_Navigator');
  const workCard = document.getElementById('deckCard_Workspace');
  if (navCard) navCard.style.display = 'none';
  if (workCard) workCard.style.display = 'block';
  focusOnDeckView();
}

function selectBulbStep(num) {
  activeStepNum = num;

  const titleElem = document.getElementById('inspectTitle');
  if (titleElem && bulbStepTitles[num]) {
    titleElem.textContent = bulbStepTitles[num];
  }

  const allViews = document.querySelectorAll('.bulb-step-view');
  allViews.forEach(v => v.classList.remove('active-view'));

  const targetView = document.getElementById('bulbStep_' + num);
  if (targetView) {
    targetView.classList.add('active-view');
  }

  showWorkspaceCard();
}

function navigateBulbStep(dir) {
  let next = activeStepNum + dir;
  if (next < 1) next = 8;
  if (next > 8) next = 1;
  selectBulbStep(next);
}

// =========================================================================
// 4. COPY UTILITIES
// =========================================================================
function copyContract() {
  const textElem = document.getElementById('contractText');
  if (!textElem) return;
  navigator.clipboard.writeText(textElem.textContent).then(() => {
    const btn = document.querySelector('.btn-copy');
    if (btn) {
      const original = btn.textContent;
      btn.textContent = '✅ СКОПІЙОВАНО!';
      setTimeout(() => { btn.textContent = original; }, 2000);
    }
  });
}

function copyPromptGeneric(elementId, btnElem) {
  const promptBox = document.getElementById(elementId);
  if (!promptBox) return;
  navigator.clipboard.writeText(promptBox.textContent.trim()).then(() => {
    if (btnElem) {
      const originalText = btnElem.textContent;
      btnElem.textContent = '✅ СКОПІЙОВАНО!';
      btnElem.style.borderColor = 'var(--success)';
      btnElem.style.color = 'var(--success)';
      setTimeout(() => {
        btnElem.textContent = originalText;
        btnElem.style.borderColor = '';
        btnElem.style.color = '';
      }, 2000);
    }
  });
}

function copyOperatorPrompt(btnElem) { copyPromptGeneric('operatorPromptBox', btnElem); }
function copyStep2Prompt(btnElem) { copyPromptGeneric('operatorStep2PromptBox', btnElem); }
function copyStep3Prompt(btnElem) { copyPromptGeneric('operatorStep3PromptBox', btnElem); }
function copyStep4Prompt(btnElem) { copyPromptGeneric('operatorStep4PromptBox', btnElem); }
function copyStep5Prompt(btnElem) { copyPromptGeneric('operatorStep5PromptBox', btnElem); }
function copyStep6Prompt(btnElem) { copyPromptGeneric('operatorStep6PromptBox', btnElem); }
function copyStep7Prompt(btnElem) { copyPromptGeneric('operatorStep7PromptBox', btnElem); }
function copyStep8Prompt(btnElem) { copyPromptGeneric('operatorStep8PromptBox', btnElem); }

// =========================================================================
// 5. STEP 2: 7-IDEA SELECTOR RADAR
// =========================================================================
const step2IdeasData = {
  1: {
    title: "01. Контрактна генерація через суворі схеми та обмеження [ОБРАНО ДЛЯ КРОКУ 3]",
    body: "<strong>Як це діє в реальності:</strong> ШІ заборонено вільно писати текст чи додавати щось від себе. Модель отримує строгий числовий чи параметричний бланк (діапазон розмірів, допустимі напруги, перелік матеріалів). Якщо відповідь виходить за межі бланка — вона автоматично блокується валідатором.",
    role: "🛡️ <strong>Що блокує:</strong> унеможливлює вигадування неіснуючих розмірів або самовільну зміну вузлів конструкції.",
    color: "var(--kernel)"
  },
  2: {
    title: "02. Зовнішній стан і версіонована істина (State-of-Record)",
    body: "<strong>Як це діє в реальності:</strong> Усі погоджені рішення фіксуються не в пам'яті чат-бота, а в зовнішньому файлі або кресленні на комп'ютері інженера. Модель отримує лише актуальний зріз задачі на поточний момент.",
    role: "🗄️ <strong>Що блокує:</strong> ліквідує забудькуватість моделі (Loss in the Middle) у тривалих розмовах.",
    color: "var(--gold)"
  },
  3: {
    title: "03. Багатошаровий конвеєр контролю (Generate → Critique → Ground → Approve) [ОБРАНО ДЛЯ КРОКУ 3]",
    body: "<strong>Як це діє в реальності:</strong> Замість одного чату процес розбивається на ролі: Генератор пропонує варіант, Критик шукає вади, Grounder вимагає посилань на нормативи (ДСТУ), а Людина-оператор ставить фінальний підпис.",
    role: "🔍 <strong>Що блокує:</strong> зупиняє галюцинації ще до показу людині та ліквідує сліпу довіру до одного виводу.",
    color: "var(--kernel)"
  },
  4: {
    title: "04. Протокол покрокових точкових змін (Diff-only)",
    body: "<strong>Як це діє в реальності:</strong> Моделі заборонено переписувати весь документ чи креслення наново. Вона повертає лише точкову різницю: конкретний рядок, розмір чи формулу, які пропонує змінити.",
    role: "⚖️ <strong>Що блокує:</strong> виключає випадкове «вирізання» робочих фрагментів проєкту коментарем «...решта без змін».",
    color: "#38bdf8"
  },
  5: {
    title: "05. Жорстке підґрунтя фактів (Grounding)",
    body: "<strong>Як це діє в реальності:</strong> Будь-яке твердження моделі про властивості матеріалу, міцність чи параметри струму має супроводжуватися посиланням на офіційний каталог, норматив або формулу розрахунку.",
    role: "📚 <strong>Що блокує:</strong> ліквідує статистичні вигадки характеристик «на око».",
    color: "var(--purple)"
  },
  6: {
    title: "06. Автоматичні інженерні інваріанти",
    body: "<strong>Як це діє в реальності:</strong> Програмні правила, які спрацьовують після кожної генерації (наприклад: «вихідна напруга не може бути більшою за вхідну», «матеріал тільки з затвердженого списку ГОСТ»).",
    role: "🚫 <strong>Що блокує:</strong> моментально бракує фізично нездійсненні відповіді.",
    color: "#f87171"
  },
  7: {
    title: "07. Гібридний режим: ШІ як радник, а не виконавець",
    body: "<strong>Як це діє в реальності:</strong> Модель ніколи не створює фінальний артефакт власноруч. Вона лише радить, яку математичну утиліту чи розрахункову програму викликати людині для отримання гарантованого результату.",
    role: "🤝 <strong>Що блокує:</strong> захищає критичні інженерні контури від проникнення неперевірених генерацій.",
    color: "var(--gold)"
  }
};

function showStep2Idea(id, btnElem) {
  document.querySelectorAll('.step2-idea-pill').forEach(b => b.classList.remove('active'));
  if (btnElem) btnElem.classList.add('active');

  const data = step2IdeasData[id];
  if (!data) return;

  const box = document.getElementById('step2IdeaDetailsBox');
  const title = document.getElementById('step2IdeaTitle');
  const body = document.getElementById('step2IdeaBody');
  const role = document.getElementById('step2IdeaRole');

  if (box && title && body && role) {
    box.style.borderColor = data.color;
    box.style.borderLeftColor = data.color;
    title.style.color = data.color;
    title.innerHTML = data.title;
    body.innerHTML = data.body;
    role.innerHTML = data.role;
  }
}

// =========================================================================
// 6. STEP 3: SUB-VIEW SWITCHER
// =========================================================================
function switchStep3SubView(viewId) {
  const b1 = document.getElementById('btnSubStep3_1');
  const b2 = document.getElementById('btnSubStep3_2');
  const b3 = document.getElementById('btnSubStep3_3');
  const box = document.getElementById('aiStep3ScrollBox');
  const tmpl = document.getElementById('tmpl_step3_part' + viewId);

  [b1, b2, b3].forEach(b => {
    if (b) {
      b.style.background = '#100d17';
      b.style.borderColor = '#3b2854';
      b.style.color = '#94a3b8';
      b.style.fontWeight = '500';
    }
  });

  const activeBtn = document.getElementById('btnSubStep3_' + viewId);
  if (activeBtn) {
    activeBtn.style.background = 'rgba(192,132,252,0.25)';
    activeBtn.style.borderColor = '#c084fc';
    activeBtn.style.color = '#fff';
    activeBtn.style.fontWeight = '700';
  }

  if (box && tmpl) {
    const rawContent = tmpl.content ? tmpl.content.textContent : tmpl.innerHTML;
    box.textContent = rawContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
    box.scrollTop = 0;
  }
}

// =========================================================================
// 7. STEP 6: 4-PHASE PIPELINE CONTROLLER
// =========================================================================
const step6PhasesData = {
  1: {
    title: "ФАЗА 1: ФІКСАЦІЯ РАМОК ТА ПОСТАНОВКА ЗАДАЧІ (FRAME & SPECIFY)",
    goal: "<strong>Мета:</strong> створити чіткий числовий та параметричний контракт (діапазони навантажень, перелік ДСТУ, допуски).",
    ban: "🚫 <strong>Суворо заборонено ШІ:</strong> пропонувати будь-які готові технічні рішення, розміри чи марки матеріалів, поки людина особисто не підтвердила правильність поставленої задачі.",
    role: "👤 <strong>Роль людини:</strong> остаточно затверджує межі задачі. Без згоди інженера перехід до розрахунків заблоковано.",
    color: "var(--kernel)"
  },
  2: {
    title: "ФАЗА 2: ГЕНЕРАЦІЯ ЧОРНОВИХ КАНДИДАТІВ (CONSTRAINED GENERATION)",
    goal: "<strong>Мета:</strong> отримати кілька варіантів рішень строго в межах затвердженого на Фазі 1 бланка.",
    ban: "🚫 <strong>Суворо заборонено ШІ:</strong> додавати параметри поза узгодженою схемою, змінювати погоджені вузли або давати вільні текстові виправдання.",
    role: "👤 <strong>Роль людини:</strong> запускає процес генерації, не втручаючись у механічну роботу алгоритму.",
    color: "#38bdf8"
  },
  3: {
    title: "ФАЗА 3: НЕЗАЛЕЖНИЙ ПЕРЕХРЕСНИЙ АУДИТ (CRITIQUE + GROUND)",
    goal: "<strong>Мета:</strong> максимально очистити чернетку від помилок та галюцинацій до того, як її побачить інженер.",
    ban: "🚫 <strong>Суворо заборонено ШІ:</strong> виправляти рішення самостійно або пом'якшувати зауваження чек-листа перевірки.",
    role: "👤 <strong>Роль людини:</strong> очікує результату аудиту, отримуючи готовий зведений пакет: чернетка + список зауважень + посилання на нормативи.",
    color: "#c084fc"
  },
  4: {
    title: "ФАЗА 4: ОСОБИСТЕ РІШЕННЯ І ПІДПИС ІНЖЕНЕРА (HUMAN APPROVE & COMMIT)",
    goal: "<strong>Мета:</strong> юридичне та моральне прийняття рішення людиною та внесення перевіреного вузла до офіційного проєкту.",
    ban: "🚫 <strong>Суворо заборонено ШІ:</strong> проявляти будь-яку самовільну ініціативу або автоматично схвалювати проєкт навіть за 100% зеленого звіту критика.",
    role: "👤 <strong>Роль людини:</strong> єдиний повноправний суб'єкт, хто ставить фінальний підпис (Затвердити / Відхилити / Доопрацювати).",
    color: "var(--gold)"
  }
};

function showStep6Phase(id, btnElem) {
  document.querySelectorAll('.step6-phase-pill').forEach(b => b.classList.remove('active'));
  if (btnElem) btnElem.classList.add('active');

  const data = step6PhasesData[id];
  if (!data) return;

  const box = document.getElementById('step6PhaseDetailsBox');
  const title = document.getElementById('step6PhaseTitle');
  const goal = document.getElementById('step6PhaseGoal');
  const ban = document.getElementById('step6PhaseBan');
  const role = document.getElementById('step6PhaseRole');

  if (box && title && goal && ban && role) {
    box.style.borderColor = data.color;
    box.style.borderLeftColor = data.color;
    title.style.color = data.color;
    title.innerHTML = data.title;
    goal.innerHTML = data.goal;
    ban.innerHTML = data.ban;
    role.innerHTML = data.role;
  }
}

// =========================================================================
// 8. STEP 1: COMPARISON TOGGLE (A vs B)
// =========================================================================
function switchStep1Mode(modeKey) {
  const btnGeneral = document.getElementById('btnStep1ModeGeneral');
  const btnEngineered = document.getElementById('btnStep1ModeEngineered');
  const promptNotice = document.getElementById('step1PromptNotice');
  const opPromptBox = document.getElementById('operatorPromptBox');
  const aiStatusPill = document.getElementById('aiStatusPill');
  const aiResponseBox = document.getElementById('aiResponseBox');
  const panelEng = document.getElementById('step1AnalysisEngineered');
  const panelGen = document.getElementById('step1AnalysisGeneral');
  const wrapper = document.getElementById('step1AnalysisWrapper');

  if (modeKey === 'general') {
    btnGeneral.style.background = 'linear-gradient(180deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.08) 100%)';
    btnGeneral.style.borderColor = 'var(--gold)';
    btnGeneral.style.color = '#fff';
    btnGeneral.style.boxShadow = '0 0 12px rgba(212,175,55,0.3)';
    btnGeneral.innerHTML = '<span style="color:var(--gold); font-size:12px;">●</span> ВАРІАНТ А: ЗАГАЛЬНИЙ ЗАПИТ';

    btnEngineered.style.background = 'transparent';
    btnEngineered.style.borderColor = '#222d3d';
    btnEngineered.style.color = '#8b949e';
    btnEngineered.style.boxShadow = 'none';
    btnEngineered.innerHTML = '<span style="color:#475569; font-size:12px;">○</span> ВАРІАНТ Б: ТОЧНИЙ СИСТЕМНИЙ ЗАПИТ';

    promptNotice.style.borderLeftColor = 'var(--gold)';
    promptNotice.innerHTML = '🔸 <em>Спроба №1: людина запитує узагальнено, не маючи в голові конкретної задачі («що порадиш у сфері технологій?»).</em>';
    opPromptBox.textContent = 'Я хочу створити проєкт у сфері програмування (чи технологій). Які варіанти ти можеш запропонувати?';
    aiStatusPill.textContent = '[ОГЛЯДОВИЙ ШУМ]';
    aiStatusPill.style.color = 'var(--gold)';
    aiResponseBox.textContent = `Ось кілька цікавих і актуальних варіантів проєктів у сфері програмування та технологій...`;

  } else {
    btnEngineered.style.background = 'linear-gradient(180deg, rgba(0,188,212,0.25) 0%, rgba(0,188,212,0.08) 100%)';
    btnEngineered.style.borderColor = 'var(--kernel)';
    btnEngineered.style.color = '#fff';
    btnEngineered.style.boxShadow = '0 0 14px rgba(0,188,212,0.35)';
    btnEngineered.innerHTML = '<span style="color:var(--kernel); font-size:12px;">●</span> ВАРІАНТ Б: ТОЧНИЙ СИСТЕМНИЙ ЗАПИТ';

    btnGeneral.style.background = 'transparent';
    btnGeneral.style.borderColor = '#222d3d';
    btnGeneral.style.color = '#8b949e';
    btnGeneral.style.boxShadow = 'none';
    btnGeneral.innerHTML = '<span style="color:#475569; font-size:12px;">○</span> ВАРІАНТ А: ЗАГАЛЬНИЙ ЗАПИТ';

    promptNotice.style.borderLeftColor = 'var(--kernel)';
    promptNotice.innerHTML = '🔹 <em>Спроба №2: формування запиту через конкретний біль (хаос відповідей, амнезія, вигадки фактів).</em>';
    
    const opTmpl = document.getElementById('tmpl_step1_op_eng');
    const aiTmpl = document.getElementById('tmpl_step1_ai_eng');
    if (opTmpl) opPromptBox.textContent = opTmpl.textContent.trim();
    aiStatusPill.textContent = '[ФОКУСНИЙ АНАЛІЗ]';
    aiStatusPill.style.color = '#c084fc';
    if (aiTmpl) aiResponseBox.textContent = aiTmpl.textContent.trim();
  }

  if (wrapper) {
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'rotateX(90deg)';
    setTimeout(() => {
      if (modeKey === 'general') {
        panelEng.style.display = 'none';
        panelGen.style.display = 'block';
      } else {
        panelGen.style.display = 'none';
        panelEng.style.display = 'block';
      }
      wrapper.style.transform = 'rotateX(0deg)';
      wrapper.style.opacity = '1';
    }, 180);
  }
}

// =========================================================================
// 9. MODALS & UI INTERACTIVITY
// =========================================================================
function toggleTaskModal(show) {
  const modal = document.getElementById('taskModal');
  if (!modal) return;
  if (show) modal.classList.add('open');
  else modal.classList.remove('open');
}

// =========================================================================
// 10. 3D INERTIAL PHYSICS LOGO
// =========================================================================
(function initPhysicsLogo() {
  const container = document.querySelector('.logo-container');
  const svg = document.querySelector('.nmu-logo-svg');
  if (!container || !svg) return;

  let isDragging = false, angleY = 0, velocityY = 0, lastX = 0, lastTime = 0, animFrameId = null;

  function renderTransform() { svg.style.transform = `rotateY(${angleY}deg)`; }

  function physicsLoop() {
    if (!isDragging) {
      angleY += velocityY;
      velocityY *= 0.94;
      if (Math.abs(velocityY) < 0.2) {
        velocityY = 0;
        const remainder = angleY % 360;
        if (Math.abs(remainder) > 0.5) angleY -= remainder * 0.12;
        else {
          angleY = 0;
          renderTransform();
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
          return;
        }
      }
      renderTransform();
    }
    animFrameId = requestAnimationFrame(physicsLoop);
  }

  function onStart(clientX) {
    isDragging = true;
    lastX = clientX;
    lastTime = performance.now();
    velocityY = 0;
    if (!animFrameId) animFrameId = requestAnimationFrame(physicsLoop);
  }

  function onMove(clientX) {
    if (!isDragging) return;
    const now = performance.now();
    const deltaX = clientX - lastX;
    const deltaTime = Math.max(1, now - lastTime);
    angleY += deltaX * 1.2;
    velocityY = (deltaX / deltaTime) * 16.0;
    lastX = clientX;
    lastTime = now;
    renderTransform();
  }

  function onEnd() { isDragging = false; }

  container.addEventListener('mousedown', e => { onStart(e.clientX); e.preventDefault(); });
  window.addEventListener('mousemove', e => onMove(e.clientX));
  window.addEventListener('mouseup', onEnd);
  container.addEventListener('touchstart', e => { if (e.touches.length > 0) onStart(e.touches[0].clientX); }, { passive: true });
  window.addEventListener('touchmove', e => { if (e.touches.length > 0) onMove(e.touches[0].clientX); }, { passive: true });
  window.addEventListener('touchend', onEnd);
})();

// =========================================================================
// 11. LECTURER POPUP & CONFETTI ENGINE
// =========================================================================
let popoverTimeout = null;
function triggerLecturerEasterEgg(e) {
  e.stopPropagation();
  const popover = document.getElementById('lecturerPopover');
  const badge = document.getElementById('lecturerBadge');
  if (!popover || !badge) return;

  if (popover.style.display === 'block') { closeLecturerPopover(); return; }

  popover.style.display = 'block';
  const rect = badge.getBoundingClientRect();
  spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  if (popoverTimeout) clearTimeout(popoverTimeout);
  popoverTimeout = setTimeout(closeLecturerPopover, 5000);
}

function closeLecturerPopover() {
  const popover = document.getElementById('lecturerPopover');
  if (popover) popover.style.display = 'none';
  if (popoverTimeout) clearTimeout(popoverTimeout);
}

document.addEventListener('click', e => {
  const popover = document.getElementById('lecturerPopover');
  if (popover && !popover.contains(e.target)) closeLecturerPopover();
});

function spawnConfetti(x, y) {
  let canvas = document.getElementById('confettiCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confettiCanvas';
    document.body.appendChild(canvas);
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const colors = ['#00bcd4', '#d4af37', '#00e676', '#ffffff', '#38bdf8', '#fbbf24'];
  const particles = [];
  for (let i = 0; i < 45; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 4;
    particles.push({
      x: x, 
      y: y,
      vx: Math.cos(angle) * speed, 
      vy: Math.sin(angle) * speed - 3.5,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1, 
      decay: Math.random() * 0.02 + 0.012,
      rotation: Math.random() * 360, 
      rotSpeed: (Math.random() - 0.5) * 14
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    for (let p of particles) {
      if (p.alpha > 0) {
        active = true;
        p.x += p.vx; 
        p.y += p.vy;
        p.vy += 0.26; // гравитация
        p.vx *= 0.98; // сопротивление воздуха
        p.alpha -= p.decay; 
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore(); // ✅ Вызов функции со скобками
      }
    }
    if (active) {
      requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(render);
}
// =========================================================================
// 12. DATOXSYS 5-CLICK SECRET FLIP EASTER EGG
// =========================================================================
let secretClickCount = 0;
let secretClickTimer = null;

window.handleStudentBadgeClick = function() {
  const card = document.getElementById('studentFlipCard');
  if (!card) return;

  // Если уже перевернута — возвращаем назад по 1 клику
  if (card.classList.contains('is-flipped')) {
    card.classList.remove('is-flipped');
    secretClickCount = 0;
    return;
  }

  secretClickCount++;
  if (secretClickTimer) clearTimeout(secretClickTimer);

  if (secretClickCount >= 5) {
    card.classList.add('is-flipped');
    secretClickCount = 0;
    // Звуковой или тактильный микро-эффект в консоль
    console.log("%c[DATOXSYS KERNEL ACTIVATED] Welcome, Architect.", "color: #00bcd4; font-weight: bold; font-size: 12px;");
  } else {
    // Сброс счетчика, если между кликами прошло более 450 мс
    secretClickTimer = setTimeout(() => { secretClickCount = 0; }, 450);
  }
}