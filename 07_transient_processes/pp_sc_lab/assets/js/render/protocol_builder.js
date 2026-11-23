window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Render = window.PPSCLab.Render || {};

(function (Render) {
  "use strict";

  var Data = window.PPSCLab.Data;
  var S = Render.Symbols;

  function domEl(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function fmtCplx(c, digits) {
    var d = digits === undefined ? 4 : digits;
    var sign = c.im >= 0 ? " + j" : " - j";
    return S.fmt(c.re, d) + sign + S.fmt(Math.abs(c.im), d) + " (|" + S.fmt(c.mag, d) + "|∠" + S.fmt(c.deg, 2) + "°)";
  }

  function addStepBlock(parent, title, lines) {
    var box = domEl("div", "proto-step");
    box.appendChild(domEl("strong", null, title));
    for (var i = 0; i < lines.length; i += 1) {
      box.appendChild(domEl("div", "proto-formula", lines[i]));
    }
    parent.appendChild(box);
  }

  function addTable(parent, headers, rows) {
    var tbl = domEl("table", "data-table");
    var thead = domEl("thead");
    var trH = domEl("tr");
    for (var h = 0; h < headers.length; h += 1) {
      trH.appendChild(domEl("th", null, headers[h]));
    }
    thead.appendChild(trH);
    tbl.appendChild(thead);

    var tbody = domEl("tbody");
    for (var r = 0; r < rows.length; r += 1) {
      var tr = domEl("tr");
      for (var c = 0; c < rows[r].length; c += 1) {
        tr.appendChild(domEl("td", c > 0 ? "mono" : null, rows[r][c]));
      }
      tbody.appendChild(tr);
    }
    tbl.appendChild(tbody);
    parent.appendChild(tbl);
  }

  function buildProtocolDom(state, calcResult) {
    var doc = domEl("article", "protocol-doc");
    var info = Data.Help.academicInfo;

    doc.appendChild(domEl("div", "kpi-label", info.university + " · " + info.faculty + " · " + info.department));
    doc.appendChild(domEl("h2", null, "ПРОТОКОЛ РОЗРАХУНКУ СТРУМІВ КОРОТКОГО ЗАМИКАННЯ (t = 0)"));

    if (!calcResult || calcResult.status !== "success") {
      var msg = calcResult && calcResult.meta && calcResult.meta.warnings && calcResult.meta.warnings.length > 0
        ? calcResult.meta.warnings[0].message
        : "Розрахунок не виконано або містить помилки.";
      doc.appendChild(domEl("p", null, msg));
      return doc;
    }

    var meta = calcResult.meta;
    var assump = meta.assumptions;
    var methodObj = Data.Variants.METHODS[meta.method];
    var fSymbol = meta.faultType === "K11" ? "K(1,1)" : (meta.faultType === "K1" ? "K(1)" : "K(2)");
    var varTitle = meta.isCustomInput ? "Користувацькі параметри" : ("Варіант №" + meta.variant);
    var srcLabel = meta.methodSource === "pdf" ? "таблиця PDF" : (meta.methodSource === "extrapolated" ? "екстраполяція циклу N mod 4" : "ручний вибір");

    doc.appendChild(domEl("p", null,
      varTitle + " · Метод: " + methodObj.labelUk + " (" + srcLabel + ") · Несиметричне КЗ: " + fSymbol
    ));
    var emfNames = {
      rated_complex: "номінальний режим E''(P, cos φ, x''_d)",
      typical_108: "типова ЕРС 1,08 в.о.",
      simplified_100: "спрощена ЕРС 1,0 в.о."
    };
    var emfLabel = emfNames[assump.emfModel] || assump.emfModel;

    doc.appendChild(domEl("p", null,
      "Активні припущення: U_ном.г = " + S.fmt(assump.uGenNomKv, 1) + " кВ; k_0 = " + S.fmt(assump.k0Line, 1) +
      "; x_0T/x_1T = 1,0; x_2Σ = x_1Σ; модель ЕРС: " + emfLabel +
      (calcResult.bases.systemType === "pu" ? ("; S_б = " + S.fmt(assump.sBaseMva, 0) + " МВА") : "")
    ));

    doc.appendChild(domEl("h3", null, "1. Вихідні дані та перевірка потужності трансформатора Т1"));
    var elms = calcResult.elements;
    addTable(doc, ["Елемент", "Параметр", "Значення"], [
      ["ТГ1", "P_тг1 / cos φ_1 / x''_d1", S.fmt(elms.tg1.pMw, 1) + " МВт / " + S.fmt(elms.tg1.cosPhi, 2) + " / " + S.fmt(elms.tg1.xGenBasePu, 2)],
      ["ТГ2", "P_тг2 / cos φ_2 / x''_d2", S.fmt(elms.tg2.pMw, 1) + " МВт / " + S.fmt(elms.tg2.cosPhi, 2) + " / " + S.fmt(elms.tg2.xGenBasePu, 2)],
      ["Т1 (критерій завдання)", "S_ном.т1 ≥ P_1 + P_2 (" + S.fmt(elms.transformer.sRequiredByTaskMva, 1) + ")", S.fmt(elms.transformer.sNomSelectedMva, 1) + " МВА (Δ/Y0, u_к = " + S.fmt(elms.transformer.ukPercent, 1) + " %)"],
      ["Т1 (інженерний контроль)", "ΣS_ном.тг = S_1 + S_2 / ΔS", S.fmt(elms.transformer.sSumGeneratorsMva, 2) + " МВА (ΔS = " + S.fmt(elms.transformer.engineeringDeltaMva, 2) + " МВА)"],
      ["Л1 ‖ Л2", "L / x_1,пит / X_1л.екв", S.fmt(elms.lines.lengthKm, 1) + " км / " + S.fmt(elms.lines.x1LineOhmPerKm, 2) + " Ом/км / " + S.fmt(elms.lines.x1EqOhm, 2) + " Ом"]
    ]);

    doc.appendChild(domEl("h3", null, "2. Покроковий розрахунок"));
    var b = calcResult.bases;
    var uUnit = b.systemType === "pu" ? "в.о." : "Ом";
    var eUnit = b.systemType === "pu" ? "в.о." : "кВ (фазн.)";
    var dX = b.systemType === "pu" ? 5 : 3;

    if (b.systemType === "pu") {
      addStepBlock(doc, "Крок 1. Базисні умови (" + methodObj.shortLabel + ")", [
        "S_б = " + S.fmt(b.sBaseMva, 1) + " МВА; U_б2 = " + S.fmt(b.uBase2Kv, 1) + " кВ; k_T = " + S.fmt(b.transformerRatio, 4) + "; U_б1 = " + S.fmt(b.uBase1Kv, 5) + " кВ",
        "I_б2 = S_б / (√3 · U_б2) = " + S.fmt(b.iBase2Ka, 5) + " кА"
      ]);
    } else {
      addStepBlock(doc, "Крок 1. Коефіцієнт приведення до сторони К1 (" + methodObj.shortLabel + ")", [
        "Розрахунковий коефіцієнт трансформації: k_T = " + S.fmt(b.transformerRatio, 5),
        "Усі опори та фазні ЕРС приводяться до сторони ВН (точка К1) в Омах та кВ."
      ]);
    }

    addStepBlock(doc, "Крок 2. Генератори ТГ1, ТГ2 та їх еквівалентування", [
      "S_ном.г1 = " + S.fmt(elms.tg1.sNomMva, 4) + " МВА; Ė_1(gen) = " + fmtCplx(elms.tg1.emfGenBasePu.value, 4) + " в.о.",
      "Приведено: Ė_1 = " + fmtCplx(elms.tg1.emfSysReduced.value, 4) + " " + eUnit + "; X_г1 = " + S.fmt(elms.tg1.xReduced.value, dX) + " " + uUnit,
      "S_ном.г2 = " + S.fmt(elms.tg2.sNomMva, 4) + " МВА; Ė_2(gen) = " + fmtCplx(elms.tg2.emfGenBasePu.value, 4) + " в.о.",
      "Приведено: Ė_2 = " + fmtCplx(elms.tg2.emfSysReduced.value, 4) + " " + eUnit + "; X_г2 = " + S.fmt(elms.tg2.xReduced.value, dX) + " " + uUnit,
      "Еквівалент: X_г.екв = " + S.fmt(elms.tgEq.xEq.value, dX) + " " + uUnit + "; Ė_екв = " + fmtCplx(elms.tgEq.emfEq.value, 4) + " " + eUnit
    ]);

    addStepBlock(doc, "Крок 3. Опори трансформатора Т1, ліній Л1 ‖ Л2 та мережі послідовностей", [
      "Т1: X_1т1 = " + S.fmt(elms.transformer.x1Reduced.value, dX) + " " + uUnit + "; X_0т1 = " + S.fmt(elms.transformer.x0Reduced.value, dX) + " " + uUnit,
      "Л1 ‖ Л2: X_1л.екв = " + S.fmt(elms.lines.x1Reduced.value, dX) + " " + uUnit + "; X_0л.екв = " + S.fmt(elms.lines.x0Reduced.value, dX) + " " + uUnit,
      "Пряма / зворотна: X_1Σ = X_2Σ = " + S.fmt(calcResult.sequenceNetworks.positive.xTotal, dX) + " " + uUnit,
      "Нульова (Т1 + Л1‖Л2): X_0Σ = " + S.fmt(calcResult.sequenceNetworks.zero.xTotal, dX) + " " + uUnit + (calcResult.sequenceNetworks.zero.activeForFault ? " (активна)" : " (не задіяна)")
    ]);

    var k3 = calcResult.faults.k3;
    var kn = calcResult.faults.kn;
    var k3Unit = k3.i1Seq.unit === "pu" ? "в.о." : (k3.i1Seq.unit === "kA" ? "кА" : k3.i1Seq.unit);
    addStepBlock(doc, "Крок 4. Струм трифазного КЗ K(3) при t = 0", [
      "İ_1^(3) = Ė_екв / (j · X_1Σ) = " + fmtCplx(k3.i1Seq.value, 4) + " " + k3Unit,
      "Діюче значення струму трифазного КЗ: I_п0^(3) = " + S.fmt(k3.iFaultKa, 4) + " кА"
    ]);

    addStepBlock(doc, "Крок 5. Струми несиметричного КЗ " + fSymbol, [
      "Симетричні складові (кА): İ_1 = " + fmtCplx(kn.sequenceCurrentsKa.i1, 4) + "; İ_2 = " + fmtCplx(kn.sequenceCurrentsKa.i2, 4) + "; İ_0 = " + fmtCplx(kn.sequenceCurrentsKa.i0, 4),
      "Фазні струми (кА): |I_A| = " + S.fmt(kn.phaseCurrentsKa.iA.mag, 4) + "; |I_B| = " + S.fmt(kn.phaseCurrentsKa.iB.mag, 4) + "; |I_C| = " + S.fmt(kn.phaseCurrentsKa.iC.mag, 4),
      "Струм пошкодження I_" + fSymbol + " = " + S.fmt(kn.iFaultPrimaryKa, 4) + " кА; струм у землю I_зем = " + S.fmt(kn.iGroundKa, 4) + " кА"
    ]);

    doc.appendChild(domEl("h3", null, "3. Перевірка контрольних інваріантів"));
    var checkRows = [];
    for (var i = 0; i < calcResult.checks.length; i += 1) {
      var chk = calcResult.checks[i];
      checkRows.push([chk.id, chk.name, chk.passed ? "PASS" : "FAIL", chk.error.toExponential(2)]);
    }
    addTable(doc, ["ID", "Інваріант", "Статус", "Похибка"], checkRows);

    doc.appendChild(domEl("p", "kpi-sub",
      "Примітка: Структура розрахункового протоколу адаптована для оформлення технічної документації. Виконав: " + info.author + "."
    ));

    return doc;
  }

  function buildProtocolMarkdown(state, calcResult) {
    if (!calcResult || calcResult.status !== "success") {
      return "# ПРОТОКОЛ РОЗРАХУНКУ КЗ\n\nРозрахунок недоступний.";
    }
    var meta = calcResult.meta;
    var elms = calcResult.elements;
    var b = calcResult.bases;
    var seq = calcResult.sequenceNetworks;
    var k3 = calcResult.faults.k3;
    var kn = calcResult.faults.kn;
    var fSymbol = meta.faultType === "K11" ? "K(1,1)" : (meta.faultType === "K1" ? "K(1)" : "K(2)");
    var methodObj = Data.Variants.METHODS[meta.method];
    var uUnit = b.systemType === "pu" ? "в.о." : "Ом";
    var eUnitMd = elms.tgEq.emfEq.unit === "pu" ? "в.о." : "кВ";
    var emfNamesMd = {
      rated_complex: "номінальний режим E''(P, cos φ, x''_d)",
      typical_108: "типова ЕРС 1,08 в.о.",
      simplified_100: "спрощена ЕРС 1,0 в.о."
    };
    var emfLabelMd = emfNamesMd[meta.assumptions.emfModel] || meta.assumptions.emfModel;

    var lines = [
      "# ПРОТОКОЛ РОЗРАХУНКУ СТРУМІВ КЗ (НТУ «ДП»)",
      "",
      "- **Варіант:** " + (meta.isCustomInput ? "Користувацькі параметри" : ("№" + meta.variant)),
      "- **Метод:** " + methodObj.labelUk + " (" + meta.methodSource + ")",
      "- **Вид несиметричного КЗ:** " + fSymbol,
      "- **Припущення:** U_ном.г = " + S.fmt(meta.assumptions.uGenNomKv, 1) + " кВ; k_0 = " + S.fmt(meta.assumptions.k0Line, 1) + "; x_0T/x_1T = 1,0; модель ЕРС: " + emfLabelMd + (b.systemType === "pu" ? ("; S_б = " + S.fmt(b.sBaseMva, 0) + " МВА") : ""),
      "",
      "## 1. Параметри та еквівалентування",
      "- **ТГ1:** P = " + S.fmt(elms.tg1.pMw, 1) + " МВт, cos φ = " + S.fmt(elms.tg1.cosPhi, 2) + ", S_ном = " + S.fmt(elms.tg1.sNomMva, 4) + " МВА, X_г1 = " + S.fmt(elms.tg1.xReduced.value, 5) + " " + uUnit,
      "- **ТГ2:** P = " + S.fmt(elms.tg2.pMw, 1) + " МВт, cos φ = " + S.fmt(elms.tg2.cosPhi, 2) + ", S_ном = " + S.fmt(elms.tg2.sNomMva, 4) + " МВА, X_г2 = " + S.fmt(elms.tg2.xReduced.value, 5) + " " + uUnit,
      "- **Еквівалент ТГ:** |E''_екв| = " + S.fmt(elms.tgEq.emfEq.value.mag, 5) + " " + eUnitMd + ", X_г.екв = " + S.fmt(elms.tgEq.xEq.value, 5) + " " + uUnit,
      "- **Т1:** S_ном = " + S.fmt(elms.transformer.sNomSelectedMva, 1) + " МВА (завдання ≥ " + S.fmt(elms.transformer.sRequiredByTaskMva, 1) + "; ΣS_тг = " + S.fmt(elms.transformer.sSumGeneratorsMva, 2) + " МВА), X_1т = " + S.fmt(elms.transformer.x1Reduced.value, 5) + " " + uUnit,
      "- **Л1 ‖ Л2:** L = " + S.fmt(elms.lines.lengthKm, 1) + " км, X_1л.екв = " + S.fmt(elms.lines.x1Reduced.value, 5) + " " + uUnit + ", X_0л.екв = " + S.fmt(elms.lines.x0Reduced.value, 5) + " " + uUnit,
      "",
      "## 2. Послідовності та струми КЗ",
      "- $X_{1\\Sigma} = X_{2\\Sigma} = " + S.fmt(seq.positive.xTotal, 5) + "\\text{ " + uUnit + "}$; $X_{0\\Sigma} = " + S.fmt(seq.zero.xTotal, 5) + "\\text{ " + uUnit + "}$",
      "- $I_{\\text{п0}}^{(3)} = " + S.fmt(k3.iFaultKa, 4) + "\\text{ кА}$",
      "- $I_{" + fSymbol + "} = " + S.fmt(kn.iFaultPrimaryKa, 4) + "\\text{ кА}$ ($|I_A| = " + S.fmt(kn.phaseCurrentsKa.iA.mag, 4) + "$, $|I_B| = " + S.fmt(kn.phaseCurrentsKa.iB.mag, 4) + "$, $|I_C| = " + S.fmt(kn.phaseCurrentsKa.iC.mag, 4) + "$, $I_{\\text{зем}} = " + S.fmt(kn.iGroundKa, 4) + "\\text{ кА}$)",
      "",
      "*Структура розрахункового протоколу адаптована для оформлення технічної документації.*"
    ];
    return lines.join("\n");
  }

  Render.Protocol = {
    buildDom: buildProtocolDom,
    buildMarkdown: buildProtocolMarkdown
  };
})(window.PPSCLab.Render);
