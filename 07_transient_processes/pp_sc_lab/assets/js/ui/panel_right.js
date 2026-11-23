window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.UI = window.PPSCLab.UI || {};

(function (UI) {
  "use strict";

  var S = window.PPSCLab.Render.Symbols;
  var Data = window.PPSCLab.Data;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function renderPanelRight(state, calcResult) {
    var root = document.getElementById("panel-right");
    if (!root) return;
    while (root.firstChild) root.removeChild(root.firstChild);

    // 1. KPI Summary
    var cardKpi = el("div", "card");
    cardKpi.appendChild(el("div", "card-title", "Підсумкові струми в точці K1"));

    if (calcResult && calcResult.status === "success") {
      var grid = el("div", "kpi-grid");
      var fSymbol = Data.Variants.FAULT_TYPES[calcResult.meta.faultType].symbol;

      var tile3 = el("div", "kpi-tile");
      tile3.appendChild(el("div", "kpi-label", "Трифазне КЗ I_п0^(3)"));
      tile3.appendChild(el("div", "kpi-value", S.fmt(calcResult.faults.k3.iFaultKa, 4) + " кА"));
      tile3.appendChild(el("div", "kpi-sub", "t = 0, пряма посл."));
      grid.appendChild(tile3);

      var tileN = el("div", "kpi-tile");
      tileN.appendChild(el("div", "kpi-label", "Вид " + fSymbol));
      tileN.appendChild(el("div", "kpi-value", S.fmt(calcResult.faults.kn.iFaultPrimaryKa, 4) + " кА"));
      tileN.appendChild(el("div", "kpi-sub", "I_зем = " + S.fmt(calcResult.faults.kn.iGroundKa, 4) + " кА"));
      grid.appendChild(tileN);
      cardKpi.appendChild(grid);

      // T1 dual criteria box
      var tr = calcResult.elements.transformer;
      var trBox = el("div", "kpi-tile");
      trBox.style.marginTop = "8px";
      trBox.appendChild(el("div", "kpi-label", "Контроль потужності Т1"));
      trBox.appendChild(el("div", "kpi-sub", "За завданням (≥ P1+P2 = " + S.fmt(tr.sRequiredByTaskMva, 1) + "): " + S.fmt(tr.sNomSelectedMva, 1) + " МВА"));
      trBox.appendChild(el("div", "kpi-sub", "Сума повних ΣS_тг: " + S.fmt(tr.sSumGeneratorsMva, 2) + " МВА (ΔS = " + S.fmt(tr.engineeringDeltaMva, 2) + " МВА)"));
      cardKpi.appendChild(trBox);
    } else {
      cardKpi.appendChild(el("div", "kpi-sub", "Результати з'являться після вибору методу і коректних параметрів."));
    }
    root.appendChild(cardKpi);

    // 2. Three-level diagnostics (error / warning / info)
    var cardMsg = el("div", "card");
    cardMsg.appendChild(el("div", "card-title", "Діагностика та попередження"));
    var hasMessages = false;

    if (calcResult && calcResult.meta) {
      var errs = calcResult.meta.errors || [];
      for (var e = 0; e < errs.length; e += 1) {
        hasMessages = true;
        var eb = el("div", "notice-box error", errs[e].message);
        eb.style.marginBottom = "6px";
        cardMsg.appendChild(eb);
      }
      var warns = calcResult.meta.warnings || [];
      for (var w = 0; w < warns.length; w += 1) {
        hasMessages = true;
        var cls = warns[w].level === "warning" ? "notice-box warn" : "notice-box";
        var wb = el("div", cls, warns[w].message);
        wb.style.marginBottom = "6px";
        cardMsg.appendChild(wb);
      }
    }
    if (!hasMessages) {
      cardMsg.appendChild(el("div", "notice-box", "Усі параметри відповідають курсовому профілю."));
    }
    root.appendChild(cardMsg);

    // 3. Invariants panel
    var cardInv = el("div", "card");
    cardInv.appendChild(el("div", "card-title", "Контрольні інваріанти"));
    if (calcResult && calcResult.checks && calcResult.checks.length > 0) {
      for (var c = 0; c < calcResult.checks.length; c += 1) {
        var chk = calcResult.checks[c];
        var row = el("div", "check-row");
        row.appendChild(el("span", null, chk.id + ": " + chk.name));
        row.appendChild(el("span", "badge " + (chk.passed ? "badge-ok" : "badge-crit"), chk.passed ? "PASS" : "FAIL"));
        cardInv.appendChild(row);
      }
    } else {
      cardInv.appendChild(el("div", "kpi-sub", "Інваріанти перевіряються при кожному розрахунку."));
    }
    root.appendChild(cardInv);
  }

  UI.PanelRight = {
    render: renderPanelRight
  };
})(window.PPSCLab.UI);
