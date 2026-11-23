window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.UI = window.PPSCLab.UI || {};

(function (UI) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var Data = window.PPSCLab.Data;
  var Core = window.PPSCLab.Core;
  var currentTheme = "light";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function buildNtuLogoSvg() {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 210 52");
    svg.setAttribute("width", "168");
    svg.setAttribute("height", "42");

    var cubes = [
      { x: 0, y: 34, c: "#009fe3" },
      { x: 16, y: 34, c: "#009fe3" },
      { x: 32, y: 34, c: "#0080ff" },
      { x: 16, y: 18, c: "#009fe3" },
      { x: 32, y: 18, c: "#0080ff" },
      { x: 32, y: 2, c: "#0080ff" }
    ];
    for (var i = 0; i < cubes.length; i += 1) {
      var r = document.createElementNS(SVG_NS, "rect");
      r.setAttribute("x", String(cubes[i].x));
      r.setAttribute("y", String(cubes[i].y));
      r.setAttribute("width", "13");
      r.setAttribute("height", "13");
      r.setAttribute("rx", "2");
      r.setAttribute("fill", cubes[i].c);
      svg.appendChild(r);
    }

    var addLbl = function (y, txt, sz, wt, col) {
      var t = document.createElementNS(SVG_NS, "text");
      t.setAttribute("x", "54");
      t.setAttribute("y", String(y));
      t.setAttribute("font-size", String(sz));
      t.setAttribute("font-weight", String(wt));
      t.setAttribute("fill", col);
      t.textContent = txt;
      svg.appendChild(t);
    };
    addLbl(18, "ДНІПРОВСЬКА", 12.5, 800, "var(--brand-navy)");
    addLbl(32, "ПОЛІТЕХНІКА", 12.5, 800, "var(--brand-navy)");
    addLbl(45, "1899 // ІЕ (ЕТФ)", 10, 600, "var(--text-muted)");
    return svg;
  }

  function renderHeader(handlers) {
    var header = document.getElementById("app-header");
    if (!header) return;
    while (header.firstChild) header.removeChild(header.firstChild);

    var brand = el("div", "header-brand");
    brand.appendChild(buildNtuLogoSvg());
    var titleBlock = el("div", "header-title-block");
    titleBlock.appendChild(el("h1", null, "PP-SCLab // Лабораторія розрахунку струмів КЗ (t = 0)"));
    titleBlock.appendChild(el("p", null, "Перехідні процеси в системах електропостачання · Перевірка 36 варіантів"));
    brand.appendChild(titleBlock);
    header.appendChild(brand);

    var actions = el("div", "header-actions");

    // Academic popover
    var popWrap = el("div", "popover-anchor");
    var popBtn = el("button", "btn", "Наукова база");
    popBtn.type = "button";
    var popCard = el("div", "popover-card hidden");
    var info = Data.Help.academicInfo;

    var depTitle = el("strong", null, info.department + " НТУ «ДП»");
    depTitle.style.display = "block";
    depTitle.style.marginBottom = "8px";
    depTitle.style.color = "var(--brand-navy)";
    popCard.appendChild(depTitle);

    var lectBlock = el("div", null);
    lectBlock.style.marginBottom = "10px";
    lectBlock.appendChild(el("strong", null, info.lecturer));
    var lectDeg = el("div", "kpi-sub", info.lecturerDegree);
    lectDeg.style.margin = "2px 0 4px 0";
    lectBlock.appendChild(lectDeg);

    if (info.lecturerLinks && info.lecturerLinks.length > 0) {
      var linksRow = el("div", null);
      linksRow.style.fontSize = "11.5px";
      linksRow.style.lineHeight = "1.6";
      for (var l = 0; l < info.lecturerLinks.length; l += 1) {
        if (l > 0) linksRow.appendChild(document.createTextNode(" · "));
        var aTag = el("a", null, info.lecturerLinks[l].label);
        aTag.href = info.lecturerLinks[l].url;
        aTag.target = "_blank";
        aTag.rel = "noopener noreferrer";
        aTag.style.color = "var(--brand-cyan)";
        aTag.style.fontWeight = "600";
        aTag.style.textDecoration = "none";
        linksRow.appendChild(aTag);
      }
      lectBlock.appendChild(linksRow);
    }
    popCard.appendChild(lectBlock);

    var headP = el("p", null, "Керівник курсу: " + info.courseHead);
    headP.style.margin = "6px 0";
    popCard.appendChild(headP);

    var authP = el("p", "kpi-sub", "Розробник: " + info.author);
    authP.style.margin = "8px 0 0 0";
    authP.style.paddingTop = "6px";
    authP.style.borderTop = "1px solid var(--border-soft)";
    popCard.appendChild(authP);

    popBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      popCard.classList.toggle("hidden");
    });
    document.addEventListener("click", function () {
      popCard.classList.add("hidden");
    });
    popWrap.appendChild(popBtn);
    popWrap.appendChild(popCard);
    actions.appendChild(popWrap);

    var themeBtn = el("button", "btn", currentTheme === "light" ? "Темна тема" : "Світла тема");
    themeBtn.type = "button";
    themeBtn.addEventListener("click", function () {
      currentTheme = currentTheme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", currentTheme === "dark" ? "dark" : "");
      themeBtn.textContent = currentTheme === "light" ? "Темна тема" : "Світла тема";
    });
    actions.appendChild(themeBtn);

    var helpBtn = el("button", "btn", "? Методика");
    helpBtn.type = "button";
    helpBtn.addEventListener("click", function () { UI.HelpModal.open(); });
    actions.appendChild(helpBtn);

    header.appendChild(actions);
  }

  function renderToolbar(state, handlers) {
    var tb = document.getElementById("app-toolbar");
    if (!tb) return;
    while (tb.firstChild) tb.removeChild(tb.firstChild);

    var leftGroup = el("div", "toolbar-group");
    leftGroup.appendChild(el("span", "kpi-label", "Швидкий вибір варіанта:"));

    var sel = el("select", "select-ctrl");
    sel.style.width = "250px";
    for (var n = 1; n <= 36; n += 1) {
      var opt = el("option", null, "Варіант №" + n + " (" + Data.Variants.getFaultTypeForVariant(n) + (n > 32 ? ", метод не задано" : "") + ")");
      opt.value = String(n);
      if (!state.isCustomInput && state.variant === n) opt.selected = true;
      sel.appendChild(opt);
    }
    if (state.isCustomInput) {
      var custOpt = el("option", null, "Користувацькі параметри");
      custOpt.value = "custom";
      custOpt.selected = true;
      sel.appendChild(custOpt);
    }
    sel.addEventListener("change", function () {
      var v = Number(sel.value);
      if (Number.isInteger(v) && v >= 1 && v <= 36) {
        Core.Store.selectVariant(v, true);
      }
    });
    leftGroup.appendChild(sel);

    var undoBtn = el("button", "btn", "Назад");
    undoBtn.type = "button";
    undoBtn.disabled = !Core.Store.canUndo();
    undoBtn.addEventListener("click", function () { Core.Store.undo(); });
    leftGroup.appendChild(undoBtn);

    var resetBtn = el("button", "btn", "Скинути");
    resetBtn.type = "button";
    resetBtn.addEventListener("click", function () {
      Core.Store.resetToDefault();
      UI.Toast.show("Стан повернуто до курсового профілю.");
    });
    leftGroup.appendChild(resetBtn);

    tb.appendChild(leftGroup);

    var rightGroup = el("div", "toolbar-group");
    var addActionBtn = function (label, cls, cb) {
      var b = el("button", cls || "btn", label);
      b.type = "button";
      b.addEventListener("click", cb);
      rightGroup.appendChild(b);
    };

    addActionBtn("Зберегти JSON", "btn", handlers.onExportJson);
    addActionBtn("Відкрити JSON", "btn", handlers.onImportJson);
    addActionBtn("SVG", "btn", handlers.onExportSvg);
    addActionBtn("Markdown", "btn", handlers.onExportMd);
    addActionBtn("Друк / PDF", "btn btn-primary", handlers.onPrint);
    addActionBtn("Розрахувати", "btn btn-action", handlers.onRecalculate);

    tb.appendChild(rightGroup);
  }

  UI.HeaderToolbar = {
    renderHeader: renderHeader,
    renderToolbar: renderToolbar
  };
})(window.PPSCLab.UI);
