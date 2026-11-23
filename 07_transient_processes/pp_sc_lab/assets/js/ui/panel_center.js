window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.UI = window.PPSCLab.UI || {};

(function (UI) {
  "use strict";

  var Data = window.PPSCLab.Data;
  var Render = window.PPSCLab.Render;
  var activeTab = "network";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function renderContextBanner(state, calcResult) {
    var banner = document.getElementById("context-banner");
    if (!banner) return;
    while (banner.firstChild) banner.removeChild(banner.firstChild);

    var varLabel = state.isCustomInput ? "Користувацькі параметри" : ("Варіант " + state.variant);
    var methodLabel = state.method ? Data.Variants.METHODS[state.method].shortLabel : "Метод не призначено";
    var faultLabel = Data.Variants.FAULT_TYPES[state.faultType].symbol;
    var a = state.assumptions;
    var isDefault = a.uGenNomKv === 6.3 && a.k0Line === 4.0 && a.emfModel === "rated_complex" && a.sBaseMva === 100;
    var profLabel = isDefault ? "Курсовий профіль" : "Альтернативні припущення";

    banner.appendChild(el("span", null, varLabel + " · " + methodLabel + " · " + faultLabel + " · " + profLabel));

    var statusBadge = calcResult && calcResult.status === "success"
      ? el("span", "badge badge-ok", "Розрахунок актуальний")
      : (calcResult && calcResult.status === "method_not_assigned"
        ? el("span", "badge badge-warn", "Очікує вибору методу")
        : el("span", "badge badge-crit", "Помилка даних"));
    banner.appendChild(statusBadge);
  }

  function renderPanelCenter(state, calcResult, comparisonData) {
    renderContextBanner(state, calcResult);

    var viewport = document.getElementById("center-viewport");
    var tabsBar = document.getElementById("center-tabs");
    if (!viewport || !tabsBar) return;

    while (viewport.firstChild) viewport.removeChild(viewport.firstChild);
    while (tabsBar.firstChild) tabsBar.removeChild(tabsBar.firstChild);

    if (activeTab === "network") {
      var sheet1 = el("div", "canvas-sheet");
      sheet1.appendChild(Render.SvgNetwork.render(state, calcResult));
      viewport.appendChild(sheet1);
    } else if (activeTab === "sequences") {
      var sheet2 = el("div", "canvas-sheet");
      sheet2.appendChild(Render.SvgSequences.render(state, calcResult));
      viewport.appendChild(sheet2);
    } else if (activeTab === "fault") {
      var sheet3 = el("div", "canvas-sheet");
      sheet3.appendChild(Render.SvgFault.render(state, calcResult));
      viewport.appendChild(sheet3);
    } else if (activeTab === "comparison") {
      viewport.appendChild(Render.Comparison.buildDom(
        calcResult,
        comparisonData ? comparisonData.methods : [],
        comparisonData ? comparisonData.assumptions : []
      ));
    } else if (activeTab === "protocol") {
      viewport.appendChild(Render.Protocol.buildDom(state, calcResult));
    }

    var tabsList = el("div", "tabs-list");
    var tabs = [
      { id: "network", label: "Однолінійна схема" },
      { id: "sequences", label: "Послідовності 1, 2, 0" },
      { id: "fault", label: "Комплексна схема КЗ" },
      { id: "comparison", label: "Порівняння методів" },
      { id: "protocol", label: "Протокол розрахунку" }
    ];
    for (var i = 0; i < tabs.length; i += 1) {
      (function (t) {
        var btn = el("button", "tab-btn" + (activeTab === t.id ? " active" : ""), t.label);
        btn.type = "button";
        btn.addEventListener("click", function () {
          activeTab = t.id;
          renderPanelCenter(state, calcResult, comparisonData);
        });
        tabsList.appendChild(btn);
      })(tabs[i]);
    }
    tabsBar.appendChild(tabsList);

    var footerNote = el("span", "kpi-sub", "file:/// Offline-First · Read-Only Render");
    tabsBar.appendChild(footerNote);
  }

  function setActiveTab(tabId) {
    activeTab = tabId;
  }

  function getActiveSvgElement() {
    var viewport = document.getElementById("center-viewport");
    return viewport ? viewport.querySelector("svg") : null;
  }

  UI.PanelCenter = {
    render: renderPanelCenter,
    setActiveTab: setActiveTab,
    getActiveSvgElement: getActiveSvgElement
  };
})(window.PPSCLab.UI);
