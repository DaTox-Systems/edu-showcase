window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.UI = window.PPSCLab.UI || {};

(function (UI) {
  "use strict";

  var Data = window.PPSCLab.Data;
  var Core = window.PPSCLab.Core;
  var Parser = Core.NumberParser;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function addParamField(parent, labelText, value, onValidNumber) {
    var row = el("div", "field-row");
    row.appendChild(el("label", null, labelText));
    var inp = el("input", "input-ctrl");
    inp.type = "text";
    inp.value = String(value).replace(".", ",");
    inp.addEventListener("change", function () {
      var parsed = Parser.toStrictNumber(inp.value);
      if (parsed === null) {
        UI.Toast.show("Некоректне числове значення: " + labelText);
        inp.value = String(value).replace(".", ",");
        return;
      }
      var res = onValidNumber(parsed);
      if (res && !res.ok && res.errors && res.errors.length > 0) {
        UI.Toast.show(res.errors[0].message);
        inp.value = String(value).replace(".", ",");
      }
    });
    row.appendChild(inp);
    parent.appendChild(row);
  }

  function renderPanelLeft(state, handlers) {
    var root = document.getElementById("panel-left");
    if (!root) return;
    while (root.firstChild) root.removeChild(root.firstChild);

    // 1. Variant selector grid (N = 1..36)
    var cardVar = el("div", "card");
    var titleVar = el("div", "card-title");
    titleVar.appendChild(el("span", null, "Варіанти за журналом (N = 1..36)"));
    if (state.isCustomInput) {
      titleVar.appendChild(el("span", "badge badge-info", "Користувацькі"));
    }
    cardVar.appendChild(titleVar);

    var grid = el("div", "variant-grid");
    for (var n = 1; n <= 36; n += 1) {
      (function (num) {
        var btn = el("button", "var-btn", String(num));
        btn.type = "button";
        if (num > 32) btn.classList.add("unassigned");
        if (!state.isCustomInput && state.variant === num) btn.classList.add("active");
        btn.title = "Варіант " + num + " (" + Data.Variants.getFaultTypeForVariant(num) + (num > 32 ? ", метод не задано" : "") + ")";
        btn.addEventListener("click", function () {
          Core.Store.selectVariant(num, true);
        });
        grid.appendChild(btn);
      })(n);
    }
    cardVar.appendChild(grid);
    root.appendChild(cardVar);

    // 2. Method & Fault selector
    var cardMethod = el("div", "card");
    var titleMethod = el("div", "card-title");
    titleMethod.appendChild(el("span", null, "Метод розрахунку та вид КЗ"));
    var badgeTxt = state.methodSource === "pdf" ? "📄 Таблиця PDF"
      : (state.methodSource === "extrapolated" ? "Екстраполяція"
      : (state.methodSource === "manual" ? "Ручний" : "Не задано"));
    var badgeCls = state.methodSource === "pdf" ? "badge-ok"
      : (state.methodSource === "extrapolated" || state.methodSource === "none" ? "badge-warn" : "badge-info");
    var badgeBtn = el("button", "badge badge-clickable " + badgeCls, badgeTxt);
    badgeBtn.type = "button";
    badgeBtn.title = "Натисніть для перегляду оригінального завдання з PDF";
    badgeBtn.addEventListener("click", function () {
      if (UI.TaskModal && UI.TaskModal.open) {
        UI.TaskModal.open(state.variant);
      }
    });
    titleMethod.appendChild(badgeBtn);
    cardMethod.appendChild(titleMethod);

    if (state.method === null) {
      var warnBox = el("div", "notice-box warn");
      warnBox.style.marginBottom = "8px";
      warnBox.appendChild(el("div", null, "Для цього варіанта метод не визначено таблицею PDF. Оберіть метод нижче або застосуйте екстраполяцію."));
      if (!state.isCustomInput && state.variant >= 33) {
        var extBtn = el("button", "btn btn-primary", "Застосувати екстраполяцію N mod 4");
        extBtn.type = "button";
        extBtn.style.marginTop = "6px";
        extBtn.style.width = "100%";
        extBtn.addEventListener("click", function () {
          Core.Store.applyExtrapolatedMethod();
        });
        warnBox.appendChild(extBtn);
      }
      cardMethod.appendChild(warnBox);
    }

    var selMethod = el("select", "select-ctrl");
    selMethod.style.marginBottom = "8px";
    var nullOpt = el("option", null, "— Не вибрано —");
    nullOpt.value = "";
    if (state.method === null) nullOpt.selected = true;
    selMethod.appendChild(nullOpt);

    var selectLabels = {
      exact_pu: "Точне приведення у відносних од.",
      approx_pu: "Наближене приведення у відносних од.",
      exact_named: "Точне приведення в іменованих од.",
      approx_named: "Наближене приведення в іменованих од."
    };
    var methodIds = ["exact_pu", "approx_pu", "exact_named", "approx_named"];
    for (var m = 0; m < methodIds.length; m += 1) {
      var mObj = Data.Variants.METHODS[methodIds[m]];
      var mOpt = el("option", null, selectLabels[mObj.id] || mObj.labelUk);
      mOpt.value = mObj.id;
      if (state.method === mObj.id) mOpt.selected = true;
      selMethod.appendChild(mOpt);
    }
    selMethod.addEventListener("change", function () {
      if (!selMethod.value) return;
      Core.Store.setMethod(selMethod.value);
    });
    cardMethod.appendChild(selMethod);

    var faultSeg = el("div", "segmented");
    var faultList = ["K2", "K11", "K1"];
    for (var f = 0; f < faultList.length; f += 1) {
      (function (ftId) {
        var fObj = Data.Variants.FAULT_TYPES[ftId];
        var fBtn = el("button", "seg-btn", fObj.symbol);
        fBtn.type = "button";
        if (state.faultType === ftId) fBtn.classList.add("active");
        fBtn.title = fObj.labelUk;
        fBtn.addEventListener("click", function () {
          Core.Store.setFaultType(ftId);
        });
        faultSeg.appendChild(fBtn);
      })(faultList[f]);
    }
    cardMethod.appendChild(faultSeg);
    root.appendChild(cardMethod);

    // 3. Circuit parameters (editable custom mode)
    var cardParams = el("div", "card");
    var titleParams = el("div", "card-title");
    titleParams.appendChild(el("span", null, "Параметри елементів схеми"));
    cardParams.appendChild(titleParams);

    var inp = state.input;
    addParamField(cardParams, "ТГ1 P_тг1, МВт", inp.tg1.pMw, function (v) {
      return Core.Store.updateCustomInput(function (d) {
        d.tg1.pMw = v;
        d.transformer.sRequiredByTaskMva = d.tg1.pMw + d.tg2.pMw;
      });
    });
    addParamField(cardParams, "ТГ1 cos φ_1", inp.tg1.cosPhi, function (v) {
      return Core.Store.updateCustomInput(function (d) { d.tg1.cosPhi = v; });
    });
    addParamField(cardParams, "ТГ1 x''_d1, в.о.", inp.tg1.xdPp, function (v) {
      return Core.Store.updateCustomInput(function (d) { d.tg1.xdPp = v; });
    });
    addParamField(cardParams, "ТГ2 P_тг2, МВт", inp.tg2.pMw, function (v) {
      return Core.Store.updateCustomInput(function (d) {
        d.tg2.pMw = v;
        d.transformer.sRequiredByTaskMva = d.tg1.pMw + d.tg2.pMw;
      });
    });
    addParamField(cardParams, "ТГ2 cos φ_2", inp.tg2.cosPhi, function (v) {
      return Core.Store.updateCustomInput(function (d) { d.tg2.cosPhi = v; });
    });
    addParamField(cardParams, "ТГ2 x''_d2, в.о.", inp.tg2.xdPp, function (v) {
      return Core.Store.updateCustomInput(function (d) { d.tg2.xdPp = v; });
    });
    addParamField(cardParams, "Т1 S_ном, МВА", inp.transformer.sNomMva, function (v) {
      return Core.Store.updateCustomInput(function (d) { d.transformer.sNomMva = v; });
    });
    addParamField(cardParams, "Т1 u_к1, %", inp.transformer.ukPercent, function (v) {
      return Core.Store.updateCustomInput(function (d) { d.transformer.ukPercent = v; });
    });
    addParamField(cardParams, "Л1‖Л2 L, км", inp.lines.lengthKm, function (v) {
      return Core.Store.updateCustomInput(function (d) { d.lines.lengthKm = v; });
    });
    addParamField(cardParams, "Л1‖Л2 x_1,пит, Ом/км", inp.lines.x1LineOhmPerKm, function (v) {
      return Core.Store.updateCustomInput(function (d) { d.lines.x1LineOhmPerKm = v; });
    });
    root.appendChild(cardParams);

    // 4. Methodological assumptions inspector (Scenario 2)
    var cardAssump = el("div", "card");
    var a = state.assumptions;
    var isDefaultAssump = a.uGenNomKv === 6.3 && a.k0Line === 4.0 && a.emfModel === "rated_complex" && a.sBaseMva === 100;

    var titleAssump = el("div", "card-title");
    titleAssump.appendChild(el("span", null, "Методичні налаштування"));
    titleAssump.appendChild(el("span", "badge " + (isDefaultAssump ? "badge-ok" : "badge-info"), isDefaultAssump ? "Курсовий" : "Змінено"));
    cardAssump.appendChild(titleAssump);

    cardAssump.appendChild(el("div", "kpi-sub", "Номінальна напруга генераторів (для точного методу):"));
    var segUg = el("div", "segmented");
    segUg.style.margin = "4px 0 8px 0";
    [6.3, 6.0].forEach(function (val) {
      var b = el("button", "seg-btn", String(val).replace(".", ",") + " кВ");
      b.type = "button";
      if (a.uGenNomKv === val) b.classList.add("active");
      b.addEventListener("click", function () { Core.Store.setAssumptions({ uGenNomKv: val }); });
      segUg.appendChild(b);
    });
    cardAssump.appendChild(segUg);

    cardAssump.appendChild(el("div", "kpi-sub", "Курсовий профіль нульової послідовності ПЛ (k_0):"));
    var segK0 = el("div", "segmented");
    segK0.style.margin = "4px 0 8px 0";
    [4.0, 3.5].forEach(function (val) {
      var b = el("button", "seg-btn", "k_0 = " + String(val).replace(".", ","));
      b.type = "button";
      if (a.k0Line === val) b.classList.add("active");
      b.addEventListener("click", function () { Core.Store.setAssumptions({ k0Line: val }); });
      segK0.appendChild(b);
    });
    cardAssump.appendChild(segK0);

    cardAssump.appendChild(el("div", "kpi-sub", "Модель ЕРС генераторів:"));
    var selEmf = el("select", "select-ctrl");
    selEmf.style.margin = "4px 0 8px 0";
    [
      { id: "rated_complex", label: "Номінальний режим E''(P, cos φ, x''_d)" },
      { id: "typical_108", label: "Типова E'' = 1,08 в.о." },
      { id: "simplified_100", label: "Спрощена E'' = 1,0 в.о." }
    ].forEach(function (item) {
      var opt = el("option", null, item.label);
      opt.value = item.id;
      if (a.emfModel === item.id) opt.selected = true;
      selEmf.appendChild(opt);
    });
    selEmf.addEventListener("change", function () {
      Core.Store.setAssumptions({ emfModel: selEmf.value });
    });
    cardAssump.appendChild(selEmf);

    addParamField(cardAssump, "Базис S_б (для в.о.), МВА", a.sBaseMva, function (v) {
      return Core.Store.setAssumptions({ sBaseMva: v });
    });

    var btnRow = el("div", "toolbar-group");
    btnRow.style.marginTop = "8px";
    var restoreBtn = el("button", "btn", "Повернути курсові");
    restoreBtn.type = "button";
    restoreBtn.addEventListener("click", function () {
      Core.Store.resetAssumptions();
      UI.Toast.show("Відновлено базовий курсовий профіль.");
    });
    var compareBtn = el("button", "btn btn-primary", "Порівняти допущення");
    compareBtn.type = "button";
    compareBtn.addEventListener("click", handlers.onOpenComparison);
    btnRow.appendChild(restoreBtn);
    btnRow.appendChild(compareBtn);
    cardAssump.appendChild(btnRow);

    root.appendChild(cardAssump);
  }

  UI.PanelLeft = {
    render: renderPanelLeft
  };
})(window.PPSCLab.UI);
