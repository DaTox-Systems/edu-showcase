window.EPPMLoadLab = window.EPPMLoadLab || {};
window.EPPMLoadLab.UI = window.EPPMLoadLab.UI || {};

(function (UI, Data) {
  "use strict";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function clearEl(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function initToolbar(store) {
    var modeButtons = document.querySelectorAll(".mode-btn[data-mode]");
    var tabButtons = document.querySelectorAll(".tab-btn[data-screen]");
    var screenPanels = document.querySelectorAll(".screen-panel[data-screen-panel]");
    var variantSelect = document.getElementById("select-variant");
    var resetBtn = document.getElementById("btn-reset-sandbox");
    var projectorBtn = document.getElementById("btn-presentation-mode");
    var statusBadge = document.getElementById("scenario-status-badge");
    var alertBanner = document.getElementById("alert-banner");
    var errorBanner = document.getElementById("error-banner");

    var sourcesBtn = document.getElementById("btn-sources-modal");
    var modalBackdrop = document.getElementById("sources-modal");
    var closeModalBtn = document.getElementById("btn-close-modal");
    var modalBody = document.getElementById("sources-modal-body");

    // Populate Variant selector (1..30)
    if (variantSelect) {
      clearEl(variantSelect);
      for (var v = 1; v <= 30; v++) {
        var opt = document.createElement("option");
        opt.value = String(v);
        opt.textContent = (v === 7)
          ? "Варіант 7 (Власний приклад за замовченням)"
          : (v <= 10 ? ("Варіант " + v + " (Табл. 1.1/2.1)") : ("Варіант " + v + " (зсув +0,1/+1)"));
        variantSelect.appendChild(opt);
      }
      variantSelect.addEventListener("change", function () {
        var chosen = Number(variantSelect.value);
        store.dispatch({ type: "SELECT_VARIANT", variantId: chosen, preferBenchmark: chosen === 7 });
      });
    }

    for (var m = 0; m < modeButtons.length; m++) {
      modeButtons[m].addEventListener("click", function () {
        var nextMode = this.getAttribute("data-mode");
        store.dispatch({ type: "SET_MODE", mode: nextMode });
      });
    }

    for (var t = 0; t < tabButtons.length; t++) {
      tabButtons[t].addEventListener("click", function () {
        var nextScreen = Number(this.getAttribute("data-screen"));
        store.dispatch({ type: "SET_SCREEN", screen: nextScreen });
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        store.resetSandbox();
      });
    }

    if (projectorBtn) {
      projectorBtn.addEventListener("click", function () {
        store.dispatch({ type: "TOGGLE_PRESENTATION_MODE" });
      });
    }

    // Sources & Academic Metadata Modal
    function populateSourcesModal() {
      if (!modalBody) return;
      clearEl(modalBody);
      var ac = Data.Academic;

      var hUniv = el("h4", "", ac.university);
      var pDept = el("p", "", ac.faculty + " · " + ac.department);
      var pHead = el("p", "", "Завідувач кафедри: " + ac.courseHead);
      var pLect = el("p", "", "Науковий куратор / лектор: " + ac.lecturer + " (" + ac.lecturerTitle + ", " + ac.lecturerRoom + ", " + ac.lecturerPhone + ")");
      var pAuth = el("p", "", "Розробник стенду: " + ac.author);

      var linksList = el("ul", "");
      if (ac.lecturerProfileUrl) {
        var li1 = el("li", "");
        var a1 = el("a", "", "Профіль викладача на сайті НТУ «ДП» ↗");
        a1.href = ac.lecturerProfileUrl;
        a1.target = "_blank";
        a1.rel = "noopener noreferrer";
        li1.appendChild(a1);
        linksList.appendChild(li1);
      }
      if (ac.lecturerScopusUrl) {
        var li2 = el("li", "");
        var a2 = el("a", "", "Профіль Scopus (ID 55991694900) ↗");
        a2.href = ac.lecturerScopusUrl;
        a2.target = "_blank";
        a2.rel = "noopener noreferrer";
        li2.appendChild(a2);
        linksList.appendChild(li2);
      }

      var hNorms = el("h4", "", "Чинні нормативні та методичні першоджерела");
      var ulNorms = el("ul", "");
      var norms = [
        "ДБН В.2.5-23:2025. Проєктування електроустановок житлових будинків та громадських будівель і споруд (чинні від 01.01.2026; Табл. 6.5, Табл. 6.17, п. 6.2.16, п. 1.3).",
        "ДСТУ 9324:2025. Настанова щодо проєктування систем електропостачання промислових підприємств.",
        "Методичні вказівки до виконання дослідницької лабораторної роботи ЕППМ-1 / І. М. Луценко, Н. Ю. Рухлова, М. В. Луценко. Дніпро : НТУ «ДП», 2026. 13 с.",
        "Примітка щодо одруківки оригіналу: у формулі (2.2) на стор. 10 методичних вказівок зазначено межі [19,25; 19,75] і 473 кВт, тоді як дискретна сума Табл. 2.3 дорівнює 473 кВт у точці t = 20:00."
      ];
      for (var ni = 0; ni < norms.length; ni++) {
        ulNorms.appendChild(el("li", "", norms[ni]));
      }

      var pDisclaimer = el("p", "badge badge-conditional", "Навчальний стенд не є сертифікованим ПЗ для промислового проєктування.");

      modalBody.appendChild(hUniv);
      modalBody.appendChild(pDept);
      modalBody.appendChild(pHead);
      modalBody.appendChild(pLect);
      modalBody.appendChild(pAuth);
      modalBody.appendChild(linksList);
      modalBody.appendChild(hNorms);
      modalBody.appendChild(ulNorms);
      modalBody.appendChild(pDisclaimer);
    }

    if (sourcesBtn && modalBackdrop) {
      sourcesBtn.addEventListener("click", function () {
        populateSourcesModal();
        modalBackdrop.classList.remove("is-hidden");
      });
    }
    if (closeModalBtn && modalBackdrop) {
      closeModalBtn.addEventListener("click", function () {
        modalBackdrop.classList.add("is-hidden");
      });
      modalBackdrop.addEventListener("click", function (ev) {
        if (ev.target === modalBackdrop) modalBackdrop.classList.add("is-hidden");
      });
    }

    function renderToolbar(state) {
      // 1. Mode buttons
      for (var i = 0; i < modeButtons.length; i++) {
        var btnMode = modeButtons[i].getAttribute("data-mode");
        modeButtons[i].classList.toggle("is-active", btnMode === state.mode);
      }

      // 2. Tabs & Screen Panels
      for (var j = 0; j < tabButtons.length; j++) {
        var sNum = Number(tabButtons[j].getAttribute("data-screen"));
        var active = sNum === state.activeScreen;
        tabButtons[j].classList.toggle("is-active", active);
        tabButtons[j].setAttribute("aria-selected", active ? "true" : "false");
      }
      for (var p = 0; p < screenPanels.length; p++) {
        var pNum = Number(screenPanels[p].getAttribute("data-screen-panel"));
        screenPanels[p].classList.toggle("is-active", pNum === state.activeScreen);
      }

      // 3. Clear UX separation of Modes: Variant selector is ONLY visible in Variants mode!
      var variantWrapper = document.querySelector(".variant-controls");
      if (variantWrapper) {
        var shouldShowVariantSelector = (state.mode === "variants");
        if (variantSelect) {
          variantSelect.style.display = shouldShowVariantSelector ? "inline-block" : "none";
          var variantLabel = variantWrapper.querySelector("label[for='select-variant']");
          if (variantLabel) variantLabel.style.display = shouldShowVariantSelector ? "inline-block" : "none";
        }
        if (resetBtn) {
          resetBtn.style.display = (state.mode === "sandbox") ? "inline-block" : "none";
          resetBtn.disabled = !state.sandboxMeta.isDirty;
        }
      }

      if (variantSelect) {
        variantSelect.value = String(state.variantId);
      }

      // 4. Projector presentation mode
      document.body.classList.toggle("presentation-mode", Boolean(state.presentationMode));
      if (projectorBtn) {
        projectorBtn.setAttribute("aria-pressed", state.presentationMode ? "true" : "false");
        projectorBtn.textContent = state.presentationMode ? "Звичайний режим" : "Режим проектора";
      }

      // 5. Status pill
      if (statusBadge) {
        statusBadge.className = "status-pill";
        if (state.mode === "benchmark") {
          statusBadge.classList.add("status-benchmark");
          statusBadge.textContent = "Приклад за замовченням (Вар. №7)";
        } else if (state.mode === "sandbox") {
          statusBadge.classList.add("status-warning");
          statusBadge.textContent = "Пісочниця (експериментальна модель)";
        } else if (state.sandboxMeta && state.sandboxMeta.requiresTeacherConfirmation) {
          statusBadge.classList.add("status-warning");
          statusBadge.textContent = "Варіант " + state.variantId + " (потрібне підтвердження складу)";
        } else {
          statusBadge.classList.add("badge-model");
          statusBadge.textContent = "Академічний варіант №" + state.variantId;
        }
      }

      // 6. Alert & Error Banners
      if (alertBanner) {
        if (state.mode === "sandbox") {
          alertBanner.textContent = "Режим Sandbox: зміни впливають лише на робочу копію сценарію. Еталонні дані методичних вказівок незмінні; результати мають статус експериментальної моделі.";
          alertBanner.classList.remove("is-hidden");
        } else if (state.sandboxMeta && state.sandboxMeta.requiresTeacherConfirmation) {
          alertBanner.textContent = "Варіант №" + state.variantId + " (поза першою десяткою): зсув +0,1/+1 підтверджено методичними вказівками (стор. 6–7), але закріплення складу споживачів потребує підтвердження викладача.";
          alertBanner.classList.remove("is-hidden");
        } else {
          alertBanner.classList.add("is-hidden");
        }
      }

      if (errorBanner) {
        if (state.lastError) {
          errorBanner.textContent = "Помилка валідації: " + state.lastError;
          errorBanner.classList.remove("is-hidden");
        } else {
          errorBanner.classList.add("is-hidden");
        }
      }
    }

    return {
      render: renderToolbar
    };
  }

  UI.Toolbar = {
    init: initToolbar
  };
})(window.EPPMLoadLab.UI, window.EPPMLoadLab.Data);
