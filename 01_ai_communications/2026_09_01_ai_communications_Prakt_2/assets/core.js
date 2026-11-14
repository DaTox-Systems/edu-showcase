// Core UI, Navigation & Chapter 2 Interactive Forensics Engine (Zero-CORS)

// =========================================================================
// 1. CANONICAL 5-TAB DECK SWITCHER & NAVIGATION (TASK 1 CONTRACT)
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

  const tabsHeader = document.querySelector('.deck-tabs-header');
  if (tabsHeader) {
    const targetY = tabsHeader.getBoundingClientRect().top + window.pageYOffset - 12;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }
}
window.switchTaskTab = switchTaskTab;

function goToHub(e) {
  if (e) e.preventDefault();
  if (window.location.hostname.includes('github.io')) {
    window.location.href = '/edu-showcase/01_ai_communications/index.html';
    return;
  }
  if (window.location.pathname.includes('/work/')) {
    window.location.href = '../../index.html';
  } else {
    window.location.href = '../index.html';
  }
}
window.goToHub = goToHub;

function goToPrakt1(e) {
  if (e) e.preventDefault();
  if (window.location.hostname.includes('github.io')) {
    window.location.href = '/edu-showcase/01_ai_communications/2026_09_Prakt_1/index.html';
    return;
  }
  if (window.location.pathname.includes('/work/')) {
    window.location.href = '../../2026_09_Prakt_1/index.html';
  } else {
    window.location.href = '../2026_09_Prakt_1/index.html';
  }
}
window.goToPrakt1 = goToPrakt1;

// =========================================================================
// 2. MODALS (UNIFIED TASK 1 OVERLAY STYLE)
// =========================================================================
function toggleTaskModal(show) {
  const modal = document.getElementById('taskModal');
  if (!modal) return;
  if (show) modal.classList.add('open');
  else modal.classList.remove('open');
}
window.toggleTaskModal = toggleTaskModal;

function closeEvidenceModal() {
  const modal = document.getElementById('evidenceModal');
  if (modal) modal.classList.remove('open');
}
window.closeEvidenceModal = closeEvidenceModal;

function injectGlossaryTooltips(rawHtml) {
  const glossary = [
    { term: "концептуальне інженерне проєктування", tip: "Початковий етап створення виробу чи будівлі: вибір принципової схеми, фізичної форми та архітектури до детальних креслень." },
    { term: "ко-креації", tip: "Спільна творчість людини та машини, де обидва учасники пропонують і розвивають варіанти рішень." },
    { term: "каталізує", tip: "Прискорює та підсилює пошук нових рішень." },
    { term: "дивергентний пошук", tip: "Мислення 'вшир': генерація великої кількості різноманітних варіантів без передчасної критики." },
    { term: "деконструкція таксономій", tip: "Розбір на деталі усталених схем і класифікацій, щоб знайти їхні слабкі місця." },
    { term: "операціоналізації", tip: "Перетворення абстрактної наукової ідеї на чіткі виробничі інструкції та правила." },
    { term: "Oversight Gating", tip: "Обов'язкові бар'єри людського контролю: модель не може продовжити роботу, доки інженер особисто не підтвердив попередній крок." },
    { term: "САПР", tip: "Системи автоматизованого проєктування (AutoCAD, SolidWorks, Компас тощо) — точні програми для розрахунків і креслень." },
    { term: "метрики оцінки", tip: "Числові критерії вимірювання успішності та надійності роботи системи." },
    { term: "ітераційність", tip: "Кількість повторних правок і доопрацювань запиту до отримання правильного результату." },
    { term: "рандомізованого контрольного експерименту", tip: "Науковий дослід із випадковим розподілом учасників на групи для виключення упередженості." },
    { term: "рандомізований експеримент", tip: "Науковий дослід із випадковим вибором для чесної перевірки гіпотези." },
    { term: "Authority, Exemplar, Constraint, Rubric, Metadata", tip: "5-елементний пакет контексту: роль експерта, зразок результату, суворі заборони, шкала оцінки та службові дані." },
    { term: "Retrieval, Generation, Processing, Management", tip: "4 цикли інженерії контексту: пошук потрібних фактів, складання запиту, обробка даних моделлю та керування пам'яттю." },
    { term: "Таксономія", tip: "Систематична класифікація складних понять за категоріями та рівнями." },
    { term: "таксономіями", tip: "Класифікаціями та системами наукового групування понять." },
    { term: "емпіричний", tip: "Отриманий дослідним шляхом на реальних фактах і практиці, а не з теорії." },
    { term: "QA", tip: "Question-Answering: автоматичний пошук точної відповіді на поставлене запитання у великому тексті." },
    { term: "key-value", tip: "Пошук значення за його ключем (як знайти номер телефону за прізвищем у довіднику)." },
    { term: "бенчмарках", tip: "Стандартизовані тестові завдання для вимірювання реальної точності та швидкості роботи ШІ." },
    { term: "Thought-Action-Observation", tip: "Цикл ReAct: модель спочатку пише думку (Thought), потім викликає інструмент (Action), а потім читає отриманий результат (Observation)." },
    { term: "HotpotQA", tip: "Складний тест, де для відповіді нейромережі потрібно зв'язати факти з кількох різних статей." },
    { term: "ALFWorld", tip: "Інтерактивний симулятор, де ШІ керує віртуальними діями у кімнаті, тестуючи здатність планувати." },
    { term: "API", tip: "Програмний міст, через який нейромережа може звертатися до калькулятора, бази даних чи САПР." },
    { term: "Zero-shot", tip: "Розв'язання задачі моделлю одразу з першого разу без попередніх прикладів." },
    { term: "GenAI", tip: "Generative AI: генеративний штучний інтелект, здатний створювати новий текст, код або схеми." },
    { term: "фронтиру", tip: "Межа можливостей технології: завдання всередині межі ШІ робить блискуче, а за межею — критично помиляється." },
    { term: "Falling Asleep at the Wheel", tip: "Ефект 'засинання за кермом': інженер втрачає пильність і перестає перевіряти цифри, коли бачить гладкі та красиві тексти моделі." },
    { term: "апробації", tip: "Практичне випробування та перевірка методики в реальних умовах виробництва." },
    { term: "Емпіричне обґрунтування", tip: "Доведення ідеї за допомогою реальних вимірювань та лабораторних фактів." }
  ];

  let res = rawHtml;
  glossary.forEach(item => {
    const escaped = item.term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const rx = new RegExp(`(?<![\\wа-яіїєґА-ЯІЇЄҐ])(${escaped})(?![\\wа-яіїєґА-ЯІЇЄҐ])`, 'gi');
    res = res.replace(rx, `<span class="tooltip-term" data-tooltip="${item.tip}">$1</span>`);
  });
  return res;
}

function openEvidenceModal(paperId) {
  const modal = document.getElementById('evidenceModal');
  const titleEl = document.getElementById('modal-card-title');
  const bodyEl = document.getElementById('modal-card-body');
  if (!modal || !titleEl || !bodyEl) return;

  const db = window.PAPERS_DB || [];
  const paper = db.find(p => p.id === paperId);
  if (paper) {
    titleEl.textContent = `${paper.authors_short} (${paper.year}) // ${paper.publication.name}`;
    const volInfo = [
      paper.publication.volume ? `Vol. ${paper.publication.volume}` : null,
      paper.publication.issue ? `Issue ${paper.publication.issue}` : null,
      paper.publication.article_number ? paper.publication.article_number : null,
      paper.publication.pages ? `P. ${paper.publication.pages}` : null
    ].filter(Boolean).join(' · ');

    const htmlContent = `
      <div style="margin-bottom: 12px; font-weight: 700; font-size: 14px; color: #fff; line-height: 1.45;">${escapeHtml(paper.title)}</div>
      <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-bottom: 14px;">
        Автори: ${escapeHtml(paper.authors.join(', '))}<br>
        Видавництво: ${escapeHtml(paper.publication.publisher)} ${volInfo ? '(' + escapeHtml(volInfo) + ')' : ''}
      </div>
      <div style="background:#090c10; border:1px solid #1e2633; border-left:3px solid var(--kernel); padding:10px 12px; border-radius:4px; margin-bottom:8px;">
        <strong style="color:var(--kernel);">Дослідницьке питання:</strong> ${escapeHtml(paper.evidence_card.research_question)}
      </div>
      <div style="background:#090c10; border:1px solid #1e2633; padding:10px 12px; border-radius:4px; margin-bottom:8px;">
        <strong>Метод:</strong> ${escapeHtml(paper.evidence_card.method)}
      </div>
      <div style="background:#090c10; border:1px solid #1e2633; border-left:3px solid var(--success); padding:10px 12px; border-radius:4px; margin-bottom:8px;">
        <strong style="color:var(--success);">Здобуті докази:</strong> ${escapeHtml(paper.evidence_card.evidence)}
      </div>
      <div style="background:#090c10; border:1px solid #1e2633; border-left:3px solid var(--alert); padding:10px 12px; border-radius:4px; margin-bottom:8px;">
        <strong style="color:#f87171;">Обмеження:</strong> ${escapeHtml(paper.evidence_card.limitation)}
      </div>
      <div style="background:#090c10; border:1px solid #1e2633; border-left:3px solid var(--gold); padding:10px 12px; border-radius:4px; margin-bottom:12px;">
        <strong style="color:var(--gold);">Значення для симбіозу:</strong> ${escapeHtml(paper.evidence_card.relevance)}
      </div>
      <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 10px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <span>DOI: <a href="${escapeHtml(paper.identifiers.doi_url)}" target="_blank" style="color: var(--kernel);">${escapeHtml(paper.identifiers.doi)} ↗</a></span>
        <span style="color: var(--success);">✔ ${escapeHtml(paper.verification.source_database)} (${escapeHtml(paper.verification.verified_date)})</span>
      </div>
    `;

    bodyEl.innerHTML = injectGlossaryTooltips(htmlContent);
  } else {
    titleEl.textContent = 'Картка джерела';
    bodyEl.innerHTML = '<p>Дані джерела не знайдено у локальній базі.</p>';
  }
  modal.classList.add('open');
} 
window.openEvidenceModal = openEvidenceModal;

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    toggleTaskModal(false);
    closeEvidenceModal();
  }
});

// =========================================================================
// 3. UTILITIES
// =========================================================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =========================================================================
// 4. ПАРАГРАФ 1: ДІАЛОГОВИЙ СПЕКТРОМЕТР + СПЕКТРАЛЬНА ЛІНЗА
// =========================================================================
let specMode = 'naive';
let specModel = 'grok';
let specLensActive = true;
let specSplitView = false;

let lastLensCounts = { sci: 0, std: 0, web: 0, anom: 0 };

function applySpectralLens(rawText) {
  const safe = escapeHtml(rawText);
  if (!specLensActive) return safe;

  const patterns = [
    {
      regex: /\b(arXiv[:\s]*2611\.05454)\b/gi,
      cls: 'lens-anom',
      title: 'Код відсутній у реєстрі (404 у нашій перевірці)'
    },
    {
      regex: /(DOI:\s*[^\s,;)]+|arXiv[:\s]*\d{4}\.\d{4,5}(?:\s*\[[^\]]+\])?|ScienceDirect|Design Studies|Systems Engineering|Transactions of the Association for Computational Linguistics|Wiley|Springer|Elsevier|INCOSE|Harvard Business School|ICLR\s*\d{4}|Nature Communications|Journal of Engineering Design|California Management Review|Vol\.\s*\d+|P\.\s*\d+[–-]\d+)/g,
      cls: 'lens-sci',
      title: 'Науковий маркер / ідентифікатор / видання'
    },
    {
      regex: /(NIST AI(?:\s*RMF)?(?:\s*600-1)?|ISO\/IEC\s*42001(?::2023)?|EU AI Act|Regulation \(EU\) 2024\/1689|Model Context Protocol|MCP(?:\s+Specification)?|Стаття\s*\d+|Article\s*\d+)/g,
      cls: 'lens-std',
      title: 'Стандарт / технічна специфікація / правовий акт'
    },
    {
      regex: /(LinkedIn[^\n.:]*|Medium|Nasscom\s*\/\s*Opcito|AlphaXiv|DATOXSYS Lab|Платон[а]?\s*Дідов[а]?|GitHub Pages|Port\.io|Aptly)/g,
      cls: 'lens-web',
      title: 'Веб-блог / медіа / згадка проєкту автора'
    }
  ];

  let counts = { sci: 0, std: 0, web: 0, anom: 0 };
  let tokens = [{ text: safe, tagged: false }];
  patterns.forEach(p => {
    const nextTokens = [];
    tokens.forEach(tok => {
      if (tok.tagged) {
        nextTokens.push(tok);
        return;
      }
      let lastIdx = 0;
      p.regex.lastIndex = 0;
      let match;
      while ((match = p.regex.exec(tok.text)) !== null) {
        if (match.index > lastIdx) {
          nextTokens.push({ text: tok.text.slice(lastIdx, match.index), tagged: false });
        }
        if (p.cls === 'lens-sci') counts.sci++;
        else if (p.cls === 'lens-std') counts.std++;
        else if (p.cls === 'lens-web') counts.web++;
        else if (p.cls === 'lens-anom') counts.anom++;

        nextTokens.push({
          text: `<span class="${p.cls}" title="${p.title}">${match[0]}</span>`,
          tagged: true
        });
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < tok.text.length) {
        nextTokens.push({ text: tok.text.slice(lastIdx), tagged: false });
      }
    });
    tokens = nextTokens;
  });

  lastLensCounts = counts;
  return tokens.map(t => t.text).join('');
}

function updateSpectrometerView() {
  const db = window.RAW_LOGS_DB;
  if (!db) return;

  const modeObj = db[specMode];
  const meta = modeObj.meta[specModel];
  const modelNames = { grok: 'xAI Grok 2', gpt: 'OpenAI ChatGPT-4o', gemini: 'Google Gemini 1.5' };

  const promptEl = document.getElementById('operatorPromptDisplay');
  const telStyle = document.getElementById('telemetry-style');
  const telGround = document.getElementById('telemetry-grounding');
  const telDoi = document.getElementById('telemetry-doi');
  const statusPill = document.getElementById('spec-status-pill');
  const activeTitle = document.getElementById('activeModelTitle');

  if (promptEl) promptEl.textContent = `«${modeObj.prompt}»`;
  if (telStyle) { telStyle.textContent = meta.styleLabel; telStyle.style.color = meta.styleColor; }
  if (telGround) { telGround.textContent = meta.groundingLabel; telGround.style.color = meta.groundingColor; }
  if (telDoi) { telDoi.textContent = meta.doiStatusLabel; telDoi.style.color = meta.doiStatusColor; }
  if (statusPill) { statusPill.className = meta.pillClass; statusPill.textContent = meta.pillText; }
  if (activeTitle) activeTitle.textContent = `100% ПОВНИЙ СИРИЙ ЛОГ // ${modelNames[specModel]}`;

  const sp = meta.spectrum;
  const segWeb = document.getElementById('specSegWeb');
  const segStd = document.getElementById('specSegStd');
  const segSci = document.getElementById('specSegSci');
  const segAnom = document.getElementById('specSegAnom');
  const legEl = document.getElementById('spectrumLegendText');
  if (segWeb) segWeb.style.width = sp.web + '%';
  if (segStd) segStd.style.width = sp.std + '%';
  if (segSci) segSci.style.width = sp.sci + '%';
  if (segAnom) segAnom.style.width = sp.anom + '%';

  const monoBox = document.getElementById('specMonoContainer');
  const splitBox = document.getElementById('specSplitContainer');
  const viewport = document.getElementById('fullRawOutputViewport');
  const splitA = document.getElementById('splitNaiveViewport');
  const splitB = document.getElementById('splitAcademicViewport');

  if (specSplitView && monoBox && splitBox) {
    monoBox.style.display = 'none';
    splitBox.style.display = 'grid';
    if (splitA) splitA.innerHTML = applySpectralLens(db.naive[specModel]);
    if (splitB) splitB.innerHTML = applySpectralLens(db.academic[specModel]);
  } else if (monoBox && splitBox) {
    splitBox.style.display = 'none';
    monoBox.style.display = 'block';
    if (viewport) viewport.innerHTML = applySpectralLens(modeObj[specModel]);
  }

  if (legEl) {
    const cnt = lastLensCounts;
    const lensInfo = specLensActive
      ? `(знайдено у тексті: ${cnt.web} веб, ${cnt.std} стандартів, ${cnt.sci} наукових, ${cnt.anom} неперевірених)`
      : `(лінзу вимкнено)`;

    legEl.innerHTML = `
      <span><strong style="color:#f59e0b;">■</strong> Веб / блоги / сайти: ${sp.web}%</span>
      <span><strong style="color:#a855f7;">■</strong> Стандарти / право (NIST, ISO, AI Act): ${sp.std}%</span>
      <span><strong style="color:#00bcd4;">■</strong> Наукові статті / праці: ${sp.sci}%</span>
      <span><strong style="color:#f87171;">■</strong> Неперевірені коди (404): ${sp.anom}%</span>
      <span style="color:var(--text-dim); margin-left:auto;">${lensInfo}</span>
    `;
  }
}

function setSpectrometerMode(mode) {
  specMode = mode;
  const btnA = document.getElementById('btnSpecModeA');
  const btnB = document.getElementById('btnSpecModeB');
  if (btnA && btnB) {
    btnA.className = 'spec-pill' + (mode === 'naive' ? ' active-naive' : '');
    btnB.className = 'spec-pill' + (mode === 'academic' ? ' active-academic' : '');
  }
  updateSpectrometerView();
}
window.setSpectrometerMode = setSpectrometerMode;

function setSpectrometerModel(modelKey) {
  specModel = modelKey;
  ['btnModelGrok', 'btnModelGPT', 'btnModelGemini'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.className = 'spec-pill';
  });
  const activeId = { grok: 'btnModelGrok', gpt: 'btnModelGPT', gemini: 'btnModelGemini' }[modelKey];
  const activeBtn = document.getElementById(activeId);
  if (activeBtn) activeBtn.classList.add('active-model');
  updateSpectrometerView();
}
window.setSpectrometerModel = setSpectrometerModel;

function toggleSpectrometerLens() {
  specLensActive = !specLensActive;
  const btn = document.getElementById('btnToggleLens');
  if (btn) {
    btn.className = 'spec-pill' + (specLensActive ? ' active-lens' : '');
    btn.textContent = specLensActive ? '🔬 СПЕКТРАЛЬНА ЛІНЗА: УВІМК' : '🔬 СПЕКТРАЛЬНА ЛІНЗА: ВИМК';
  }
  updateSpectrometerView();
}
window.toggleSpectrometerLens = toggleSpectrometerLens;

function toggleSpectrometerSplit() {
  specSplitView = !specSplitView;
  const btn = document.getElementById('btnToggleSplit');
  if (btn) {
    btn.className = 'spec-pill' + (specSplitView ? ' active-academic' : '');
    btn.textContent = specSplitView ? '◫ РЕЖИМ: СПЛІТ А | Б' : '▢ РЕЖИМ: ОДИН ЛОГ 100%';
  }
  updateSpectrometerView();
}
window.toggleSpectrometerSplit = toggleSpectrometerSplit;

function copyCurrentPrompt(btn) {
  const db = window.RAW_LOGS_DB;
  if (!db) return;
  navigator.clipboard.writeText(db[specMode].prompt).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✅ СКОПІЙОВАНО!';
    setTimeout(() => { btn.textContent = orig; }, 1800);
  });
}
window.copyCurrentPrompt = copyCurrentPrompt;

// =========================================================================
// 5. ПАРАГРАФ 2: LOCAL-FIRST FAKE DOI SCANNER
// =========================================================================
function normalizeIdentifier(raw) {
  return String(raw || '')
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^DOI:\s*/i, '')
    .trim();
}

function loadDoiPreset(identifier, chipEl) {
  const input = document.getElementById('doi-input-field');
  if (input) input.value = identifier;
  document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active-preset'));
  if (chipEl) chipEl.classList.add('active-preset');
  executeDoiScan();
}
window.loadDoiPreset = loadDoiPreset;

function setStageState(elId, text, statusClass) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.className = 'stage-status ' + statusClass;
}

function executeDoiScan() {
  const input = document.getElementById('doi-input-field');
  const resultBox = document.getElementById('scanner-result-box');
  const titleEl = document.getElementById('scan-verdict-title');
  const badgeEl = document.getElementById('scan-verdict-badge');
  const descEl = document.getElementById('scan-verdict-desc');
  if (!input || !resultBox) return;

  const clean = normalizeIdentifier(input.value);
  if (!clean) return;

  resultBox.style.display = 'block';
  resultBox.style.borderLeftColor = 'var(--gold)';
  setStageState('stage-syntax-status', 'АНАЛІЗ...', 'status-scanning');
  setStageState('stage-registry-status', 'ОЧІКУВАННЯ', 'status-waiting');
  setStageState('stage-metadata-status', 'ОЧІКУВАННЯ', 'status-waiting');

  const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;
  const arxivRegex = /^(?:arXiv:)?\d{4}\.\d{4,5}(?:v\d+)?$/i;
  const syntaxValid = doiRegex.test(clean) || arxivRegex.test(clean);

  setTimeout(() => {
    if (!syntaxValid) {
      setStageState('stage-syntax-status', 'ПОМИЛКА ФОРМАТУ', 'status-failed');
      setStageState('stage-registry-status', 'ЗУПИНЕНО', 'status-waiting');
      setStageState('stage-metadata-status', 'ЗУПИНЕНО', 'status-waiting');
      resultBox.style.borderLeftColor = 'var(--alert)';
      if (titleEl) titleEl.textContent = `Помилка запису номера: ${clean}`;
      if (badgeEl) { badgeEl.className = 'badge badge-red'; badgeEl.textContent = 'НЕВІДОМИЙ ФОРМАТ'; }
      if (descEl) descEl.innerHTML = 'Рядок не схожий на номер наукової статті. Правильний формат має вигляд: <code>10.xxxx/...</code> або <code>arXiv:YYMM.NNNNN</code>.';
      return;
    }

    setStageState('stage-syntax-status', 'УСПІШНО // ФОРМАТ ПРАВИЛЬНИЙ', 'status-success');
    setStageState('stage-registry-status', 'ПОШУК У БАЗІ...', 'status-scanning');

    setTimeout(() => {
      const lower = clean.toLowerCase();
      const verified = (window.PAPERS_DB || []).find(p =>
        p.identifiers.doi.toLowerCase() === lower ||
        (p.identifiers.arxiv && (`arxiv:${p.identifiers.arxiv}`.toLowerCase() === lower || p.identifiers.arxiv.toLowerCase() === lower))
      );

      if (verified) {
        setStageState('stage-registry-status', 'ЗНАЙДЕНО // ЗАПИС Є В БАЗІ', 'status-success');
        setTimeout(() => {
          setStageState('stage-metadata-status', 'ПІДТВЕРДЖЕНО // ДАНІ ЗБІГАЮТЬСЯ', 'status-success');
          resultBox.style.borderLeftColor = 'var(--success)';
          if (titleEl) titleEl.textContent = `${verified.authors_short} (${verified.year}) — ПЕРЕВІРКУ ПРОЙДЕНО УСПІШНО`;
          if (badgeEl) { badgeEl.className = 'badge badge-green'; badgeEl.textContent = 'СПРАВЖНЯ ПУБЛІКАЦІЯ'; }
          if (descEl) {
            descEl.innerHTML = `
              <strong>Справжня назва:</strong> ${escapeHtml(verified.title)}<br>
              <strong>Офіційне видання:</strong> ${escapeHtml(verified.publication.name)} (видавництво ${escapeHtml(verified.publication.publisher)})<br>
              <strong>Пряме посилання на журнал:</strong> <a href="${escapeHtml(verified.identifiers.doi_url)}" target="_blank" style="color:var(--kernel); font-weight:700;">${escapeHtml(verified.identifiers.doi_url)} ↗</a>
            `;
          }
        }, 160);
        return;
      }

      const anomaly = (window.SCANNER_ANOMALIES || []).find(a => a.input_identifier.toLowerCase() === lower);
      if (anomaly) {
        if (anomaly.registry_found) {
          setStageState('stage-registry-status', 'НОМЕР ІСНУЄ В БАЗІ', 'status-warn');
        } else {
          setStageState('stage-registry-status', 'ПОМИЛКА 404 // НОМЕРА НЕМАЄ', 'status-failed');
        }

        setTimeout(() => {
          setStageState('stage-metadata-status', 'ВІДХИЛЕНО // ДАНІ НЕ ЗБІГАЮТЬСЯ', 'status-failed');
          resultBox.style.borderLeftColor = 'var(--alert)';
          if (titleEl) titleEl.textContent = anomaly.verdict;
          if (badgeEl) { badgeEl.className = 'badge badge-red'; badgeEl.textContent = 'ВИЯВЛЕНО НЕВІДПОВІДНІСТЬ'; }
          if (descEl) {
            descEl.innerHTML = `
              <strong>Заявлена назва в чаті:</strong> ${escapeHtml(anomaly.title)}<br>
              <strong>Походження зразка:</strong> <span style="color:var(--gold);">${escapeHtml(anomaly.source_tag)}</span><br>
              <strong>Розбір дефекту:</strong> ${escapeHtml(anomaly.analysis)}
            `;
          }
        }, 160);
        return;
      }

      setStageState('stage-registry-status', 'НЕМАЄ В НАШІЙ ВИБІРЦІ', 'status-warn');
      setStageState('stage-metadata-status', 'ПОТРІБНА РУЧНА ПЕРЕВІРКА', 'status-warn');
      resultBox.style.borderLeftColor = 'var(--gold)';
      if (titleEl) titleEl.textContent = 'Формат правильний, але цього номера немає в нашій перевіреній вибірці з 10 джерел';
      if (badgeEl) { badgeEl.className = 'badge badge-gold'; badgeEl.textContent = 'СТОРОННЄ ДЖЕРЕЛО'; }
      if (descEl) {
        descEl.innerHTML = `Цей номер відсутній у нашому верифікованому списку. Щоб перевірити його вручну, перейдіть за прямим посиланням у всесвітній реєстр: <a href="https://doi.org/${encodeURIComponent(clean)}" target="_blank" style="color:var(--kernel); font-weight:700;">https://doi.org/${escapeHtml(clean)} ↗</a>`;
      }
    }, 180);
  }, 160);
}
window.executeDoiScan = executeDoiScan;

// =========================================================================
// 6. ПАРАГРАФ 4: СИНТАКСИЧНИЙ РЕНТГЕН + ПОВНИЙ СПИСОК 10 ДЖЕРЕЛ
// =========================================================================
let xraySourceKey = 'fang';
let xrayVariantKey = 'gpt_dstu';
let xrayActiveZone = null;

function renderXrayView() {
  const db = window.XRAY_CITATIONS_DB;
  if (!db || !db[xraySourceKey]) return;

  const entry = db[xraySourceKey][xrayVariantKey];
  if (!entry) return;

  const viewport = document.getElementById('xray-viewport');
  const titleEl = document.getElementById('xray-mode-title');
  const badgeEl = document.getElementById('xray-mode-badge');
  const noteEl = document.getElementById('xray-explanation-box');

  if (titleEl) titleEl.textContent = entry.name;
  if (badgeEl) { badgeEl.className = entry.badgeClass; badgeEl.textContent = entry.badge; }
  if (viewport) viewport.innerHTML = entry.html;
  if (noteEl) noteEl.innerHTML = `<strong style="color:var(--gold);">Аудит запису:</strong> ${escapeHtml(entry.note)}`;

  if (xrayActiveZone) applyXrayHighlight(xrayActiveZone);
}

function setXraySource(srcKey) {
  xraySourceKey = srcKey;
  ['btnXraySrcFang', 'btnXraySrcLiu'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.className = 'spec-pill';
  });
  const activeId = srcKey === 'fang' ? 'btnXraySrcFang' : 'btnXraySrcLiu';
  const b = document.getElementById(activeId);
  if (b) b.classList.add('active-academic');
  renderXrayView();
}
window.setXraySource = setXraySource;

function setXrayMode(variantKey) {
  xrayVariantKey = variantKey;
  ['btnXrayGptDstu', 'btnXrayGrokDstu', 'btnXrayGeminiDstu', 'btnXrayGptApa', 'btnXrayGrokApa'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.className = 'spec-pill';
  });
  const map = {
    gpt_dstu: 'btnXrayGptDstu',
    grok_dstu: 'btnXrayGrokDstu',
    gemini_dstu: 'btnXrayGeminiDstu',
    gpt_apa: 'btnXrayGptApa',
    grok_apa: 'btnXrayGrokApa'
  };
  const b = document.getElementById(map[variantKey]);
  if (b) b.classList.add('active-model');
  renderXrayView();
}
window.setXrayMode = setXrayMode;

function applyXrayHighlight(zone) {
  const viewport = document.getElementById('xray-viewport');
  if (!viewport) return;
  const zones = ['author', 'title', 'journal', 'year', 'volume', 'doi', 'punct'];
  zones.forEach(z => {
    viewport.querySelectorAll('.xr-' + z).forEach(el => el.classList.remove('highlight-' + z));
  });
  if (zone === 'all') {
    zones.forEach(z => {
      viewport.querySelectorAll('.xr-' + z).forEach(el => el.classList.add('highlight-' + z));
    });
  } else if (zone) {
    viewport.querySelectorAll('.xr-' + zone).forEach(el => el.classList.add('highlight-' + zone));
  }
}

function highlightXrayZone(zone, chipEl) {
  if (xrayActiveZone === zone) {
    xrayActiveZone = null;
    document.querySelectorAll('.legend-chip').forEach(c => c.classList.remove('active-zone'));
    applyXrayHighlight(null);
    return;
  }
  xrayActiveZone = zone;
  document.querySelectorAll('.legend-chip').forEach(c => c.classList.remove('active-zone'));
  if (chipEl) chipEl.classList.add('active-zone');
  applyXrayHighlight(zone);
}
window.highlightXrayZone = highlightXrayZone;

function switchBibListTab(styleKey) {
  const dstuBox = document.getElementById('bibListDstu');
  const apaBox = document.getElementById('bibListApa');
  const btnDstu = document.getElementById('btnBibDstu');
  const btnApa = document.getElementById('btnBibApa');
  if (!dstuBox || !apaBox) return;

  if (styleKey === 'dstu') {
    dstuBox.style.display = 'block';
    apaBox.style.display = 'none';
    if (btnDstu) btnDstu.className = 'spec-pill active-academic';
    if (btnApa) btnApa.className = 'spec-pill';
  } else {
    dstuBox.style.display = 'none';
    apaBox.style.display = 'block';
    if (btnDstu) btnDstu.className = 'spec-pill';
    if (btnApa) btnApa.className = 'spec-pill active-model';
  }
}
window.switchBibListTab = switchBibListTab;

// =========================================================================
// 7. ПАРАГРАФ 5: EVIDENCE_REGISTRY COPY, ЧЕК-ЛИСТ ТА ЕКСПРЕС-ВАЛІДАТОР
// =========================================================================
function copyRegistryToClipboard(btn) {
  const text = window.EVIDENCE_REGISTRY_TEMPLATE || '';
  navigator.clipboard.writeText(text).then(() => {
    const targetBtn = btn || document.getElementById('btn-copy-registry');
    if (targetBtn) {
      const orig = targetBtn.textContent;
      targetBtn.textContent = '✅ РЕГЛАМЕНТ СКОПІЙОВАНО!';
      setTimeout(() => { targetBtn.textContent = orig; }, 2000);
    }
  });
}
window.copyRegistryToClipboard = copyRegistryToClipboard;

function updateChecklistProgress() {
  const boxes = document.querySelectorAll('.op-check-input');
  const label = document.getElementById('opChecklistScore');
  if (!boxes.length || !label) return;
  let checked = 0;
  boxes.forEach(b => {
    const row = b.closest('.check-row');
    if (b.checked) {
      checked++;
      if (row) row.classList.add('checked');
    } else if (row) {
      row.classList.remove('checked');
    }
  });
  if (checked === boxes.length) {
    label.textContent = `${checked}/${boxes.length} PASS — ДЖЕРЕЛО ВЕРИФІКОВАНО`;
    label.className = 'badge badge-green';
  } else {
    label.textContent = `${checked}/${boxes.length} ПЕРЕВІРЕНО`;
    label.className = 'badge badge-gold';
  }
}
window.updateChecklistProgress = updateChecklistProgress;

function runQuickCitationLint() {
  const input = document.getElementById('quickLintInput');
  const out = document.getElementById('quickLintOutput');
  if (!input || !out) return;
  const val = input.value.trim();
  if (!val) {
    out.innerHTML = '<span style="color:var(--text-muted);">Вставте рядок бібліографічного опису або DOI для перевірки.</span>';
    return;
  }

  const findings = [];
  const hasDoi = /10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/.test(val);
  const hasArxiv = /arXiv[:\s]*\d{4}\.\d{4,5}/i.test(val);
  const hasHttpsDoi = /https:\/\/doi\.org\/10\./i.test(val);
  const hasRetroSlash = /\s\/\/\s/.test(val);
  const hasRetroDash = /\.\s*[—–-]\s+/.test(val);
  const hasEtAl = /et\s+al\./i.test(val);
  const hasYearParen = /\(\d{4}\)/.test(val);

  findings.push(hasDoi || hasArxiv
    ? '✅ Виявлено машинозчитуваний ідентифікатор (' + (hasDoi ? 'DOI' : 'arXiv') + ').'
    : '❌ Відсутній DOI або arXiv ID — швидка реєстрова перевірка ускладнена.');

  if (hasDoi) {
    findings.push(hasHttpsDoi
      ? '✅ DOI оформлено як активне посилання https://doi.org/...'
      : '⚠️ Краще подавати DOI у вигляді повного URL https://doi.org/... (обов’язково в APA 7th, рекомендовано у ДСТУ 8302:2015).');
  }

  if (hasRetroSlash || hasRetroDash) {
    findings.push('ℹ️ Виявлено традиційні роздільники («//» або «.—») — стиль ГОСТ 7.1:2006 / класичний варіант ДСТУ.');
  } else if (hasYearParen) {
    findings.push('ℹ️ Виявлено формат року в дужках після авторів — ознака міжнародного стилю APA 7th.' + (hasEtAl ? ' Увага: в APA 7th у списку літератури до 20 авторів вказують повністю без et al.' : ''));
  } else {
    findings.push('ℹ️ Пунктуація без «//» і «.—» відповідає рекомендованій спрощеній моделі ДСТУ 8302:2015 (п. 4.9.1).');
  }

  out.innerHTML = findings.map(f => `<div style="margin-bottom:4px;">${escapeHtml(f)}</div>`).join('');
}
window.runQuickCitationLint = runQuickCitationLint;

// =========================================================================
// 8. 3D INERTIAL PHYSICS LOGO, LECTURER POPUP & 5-CLICK FLIP (TASK 1 SHELL)
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
window.triggerLecturerEasterEgg = triggerLecturerEasterEgg;

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
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const colors = ['#00bcd4', '#d4af37', '#00e676', '#ffffff', '#38bdf8', '#fbbf24'];
  const particles = [];
  for (let i = 0; i < 45; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 4;
    particles.push({
      x: x, y: y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3.5,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1, decay: Math.random() * 0.02 + 0.012,
      rotation: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 14
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    for (let p of particles) {
      if (p.alpha > 0) {
        active = true;
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.26; p.vx *= 0.98;
        p.alpha -= p.decay; p.rotation += p.rotSpeed;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    }
    if (active) requestAnimationFrame(render);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(render);
}

let secretClickCount = 0;
let secretClickTimer = null;
window.handleStudentBadgeClick = function() {
  const card = document.getElementById('studentFlipCard');
  if (!card) return;
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
  } else {
    secretClickTimer = setTimeout(() => { secretClickCount = 0; }, 450);
  }
};

// =========================================================================
// 9. BOOTSTRAP ON LOAD
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  updateSpectrometerView();
  renderXrayView();
  applyXrayHighlight('all');
  updateChecklistProgress();
});
