window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Render = window.PPSCLab.Render || {};

(function (Render) {
  "use strict";

  var S = Render.Symbols;

  function drawBranchVertical(svg, x, yTop, yBot, label, valText, hasEmf, emfText, currentLabel) {
    svg.appendChild(S.el("line", { x1: x, y1: yTop, x2: x, y2: yTop + 34, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
    S.addReactanceBox(svg, x - 14, yTop + 34, 28, 56);
    S.addText(svg, x - 22, yTop + 56, label, { anchor: "end", size: 12.5, weight: 700 });
    S.addText(svg, x - 22, yTop + 74, valText, { anchor: "end", size: 11.5, mono: true, fill: "var(--text-muted, #475569)" });

    if (hasEmf) {
      svg.appendChild(S.el("line", { x1: x, y1: yTop + 90, x2: x, y2: yTop + 114, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
      S.addEmfSource(svg, x, yTop + 134, 20, -90);
      S.addText(svg, x - 26, yTop + 138, emfText, { anchor: "end", size: 11.5, mono: true });
      svg.appendChild(S.el("line", { x1: x, y1: yTop + 154, x2: x, y2: yBot, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
    } else {
      svg.appendChild(S.el("line", { x1: x, y1: yTop + 90, x2: x, y2: yBot, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
    }

    if (currentLabel) {
      S.addText(svg, x + 10, yTop + 20, currentLabel, { size: 11.5, mono: true, weight: 700, fill: "var(--svg-accent, #0b3d91)" });
    }
  }

  function drawPhasorDiagram(svg, cx, cy, phaseCurrentsKa) {
    var rMax = 68;
    svg.appendChild(S.el("rect", {
      x: cx - 125, y: cy - 115, width: 250, height: 225, rx: 6,
      fill: "var(--bg-panel, #f8fafc)", stroke: "var(--border, #cbd5e1)", "stroke-width": 1.2
    }));
    S.addText(svg, cx, cy - 94, "Векторна діаграма струмів у K1", { anchor: "middle", size: 12, weight: 700, fill: "var(--svg-accent, #0b3d91)" });

    svg.appendChild(S.el("circle", { cx: cx, cy: cy + 6, r: rMax, fill: "none", stroke: "var(--border, #cbd5e1)", "stroke-width": 1, "stroke-dasharray": "4 3" }));
    svg.appendChild(S.el("line", { x1: cx - rMax - 8, y1: cy + 6, x2: cx + rMax + 8, y2: cy + 6, stroke: "var(--border, #cbd5e1)", "stroke-width": 0.9 }));
    svg.appendChild(S.el("line", { x1: cx, y1: cy + 6 - rMax - 8, x2: cx, y2: cy + 6 + rMax + 8, stroke: "var(--border, #cbd5e1)", "stroke-width": 0.9 }));

    var phases = [
      { key: "iA", label: "I_A", color: "#d97706" },
      { key: "iB", label: "I_B", color: "#15803d" },
      { key: "iC", label: "I_C", color: "#dc2626" }
    ];

    var maxMag = Math.max(phaseCurrentsKa.iA.mag, phaseCurrentsKa.iB.mag, phaseCurrentsKa.iC.mag, 1e-9);
    for (var i = 0; i < phases.length; i += 1) {
      var p = phases[i];
      var vec = phaseCurrentsKa[p.key];
      if (vec.mag < 1e-6) continue;
      var len = (vec.mag / maxMag) * (rMax - 6);
      var rad = (vec.deg * Math.PI) / 180;
      var tx = cx + len * Math.cos(rad);
      var ty = (cy + 6) - len * Math.sin(rad);

      svg.appendChild(S.el("line", {
        x1: cx, y1: cy + 6, x2: tx, y2: ty,
        stroke: p.color, "stroke-width": 2.4
      }));
      svg.appendChild(S.el("circle", { cx: tx, cy: ty, r: 3.2, fill: p.color }));
      var lx = cx + (len + 15) * Math.cos(rad);
      var ly = (cy + 6) - (len + 15) * Math.sin(rad);
      S.addText(svg, lx, ly + 4, p.label, { anchor: "middle", size: 11, weight: 700, fill: p.color, mono: true });
    }
    S.addText(svg, cx, cy + 98, "A: " + S.fmt(phaseCurrentsKa.iA.mag, 2) + " | B: " + S.fmt(phaseCurrentsKa.iB.mag, 2) + " | C: " + S.fmt(phaseCurrentsKa.iC.mag, 2) + " кА", {
      anchor: "middle", size: 10.5, mono: true, fill: "var(--text-muted, #475569)"
    });
  }

  function renderFaultSvg(state, calcResult) {
    var svg = S.createSvgCanvas(920, 440, "flt");
    if (!calcResult || calcResult.status !== "success") {
      S.addText(svg, 460, 220, "Комплексна схема КЗ доступна після успішного розрахунку.", {
        anchor: "middle", size: 14, fill: "var(--text-muted, #475569)"
      });
      return svg;
    }

    var ft = calcResult.meta.faultType;
    var fSymbol = ft === "K11" ? "K(1,1)" : (ft === "K1" ? "K(1)" : "K(2)");
    var seq = calcResult.sequenceNetworks;
    var unit = seq.positive.unit === "pu" ? "в.о." : "Ом";
    var digits = seq.positive.unit === "pu" ? 4 : 2;
    var emfStr = S.fmt(calcResult.elements.tgEq.emfEq.value.mag, digits) + " " + (calcResult.elements.tgEq.emfEq.unit === "pu" ? "в.о." : "кВ");
    var kn = calcResult.faults.kn;
    var scKa = kn.sequenceCurrentsKa;

    S.addText(svg, 24, 28, "Комплексна схема з'єднання послідовностей при " + fSymbol + " у точці K1", {
      size: 13.5, weight: 700, fill: "var(--svg-accent, #0b3d91)"
    });

    if (ft === "K2") {
      svg.appendChild(S.el("line", { x1: 110, y1: 315, x2: 430, y2: 315, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 2.8 }));
      S.addText(svg, 98, 319, "0_1, 0_2", { anchor: "end", size: 12.5, weight: 700 });
      svg.appendChild(S.el("line", { x1: 155, y1: 85, x2: 385, y2: 85, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 2.0 }));
      svg.appendChild(S.el("circle", { cx: 270, cy: 85, r: 4, fill: "var(--svg-fault, #dc2626)" }));
      S.addText(svg, 270, 72, "K1 (B — C)", { anchor: "middle", size: 12.5, weight: 700, fill: "var(--svg-fault, #dc2626)" });

      drawBranchVertical(svg, 155, 85, 315, "X_1Σ", S.fmt(seq.positive.xTotal, digits) + " " + unit, true, emfStr, "I_1 = " + S.fmt(scKa.i1.mag, 3) + " кА");
      drawBranchVertical(svg, 385, 85, 315, "X_2Σ", S.fmt(seq.negative.xTotal, digits) + " " + unit, false, null, "I_2 = -I_1");
    } else if (ft === "K1") {
      svg.appendChild(S.el("line", { x1: 110, y1: 315, x2: 520, y2: 315, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 2.8 }));
      S.addText(svg, 98, 319, "0_1", { anchor: "end", size: 12.5, weight: 700 });
      drawBranchVertical(svg, 165, 85, 315, "X_1Σ", S.fmt(seq.positive.xTotal, digits) + " " + unit, true, emfStr, "I_1 = I_2 = I_0 = " + S.fmt(scKa.i1.mag, 3) + " кА");

      svg.appendChild(S.el("line", { x1: 165, y1: 85, x2: 245, y2: 85, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
      S.addReactanceBox(svg, 245, 72, 76, 26, "X_2Σ", S.fmt(seq.negative.xTotal, digits) + " " + unit);
      svg.appendChild(S.el("line", { x1: 321, y1: 85, x2: 380, y2: 85, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
      S.addReactanceBox(svg, 380, 72, 76, 26, "X_0Σ", S.fmt(seq.zero.xTotal, digits) + " " + unit);
      svg.appendChild(S.el("line", { x1: 456, y1: 85, x2: 510, y2: 85, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
      svg.appendChild(S.el("line", { x1: 510, y1: 85, x2: 510, y2: 315, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
      svg.appendChild(S.el("circle", { cx: 215, cy: 85, r: 4, fill: "var(--svg-fault, #dc2626)" }));
      S.addText(svg, 215, 68, "K1 (A — земля)", { anchor: "middle", size: 12, weight: 700, fill: "var(--svg-fault, #dc2626)" });
    } else {
      svg.appendChild(S.el("line", { x1: 95, y1: 315, x2: 540, y2: 315, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 2.8 }));
      S.addText(svg, 84, 319, "0", { anchor: "end", size: 12.5, weight: 700 });
      svg.appendChild(S.el("line", { x1: 155, y1: 85, x2: 495, y2: 85, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 2.0 }));
      svg.appendChild(S.el("circle", { cx: 335, cy: 85, r: 4, fill: "var(--svg-fault, #dc2626)" }));
      S.addText(svg, 335, 68, "K1 (B, C — земля)", { anchor: "middle", size: 12.5, weight: 700, fill: "var(--svg-fault, #dc2626)" });

      drawBranchVertical(svg, 155, 85, 315, "X_1Σ", S.fmt(seq.positive.xTotal, digits) + " " + unit, true, emfStr, "I_1 = " + S.fmt(scKa.i1.mag, 3));
      drawBranchVertical(svg, 335, 85, 315, "X_2Σ", S.fmt(seq.negative.xTotal, digits) + " " + unit, false, null, "I_2 = " + S.fmt(scKa.i2.mag, 3));
      drawBranchVertical(svg, 495, 85, 315, "X_0Σ", S.fmt(seq.zero.xTotal, digits) + " " + unit, false, null, "I_0 = " + S.fmt(scKa.i0.mag, 3));
    }

    S.addText(svg, 40, 365, "Симетричні складові (кА):  |I_1| = " + S.fmt(scKa.i1.mag, 4) +
      "   |I_2| = " + S.fmt(scKa.i2.mag, 4) +
      "   |I_0| = " + S.fmt(scKa.i0.mag, 4) +
      "   I_зем = 3|I_0| = " + S.fmt(kn.iGroundKa, 4) + " кА", {
      size: 12, mono: true, weight: 600
    });
    S.addText(svg, 40, 392, "Струм трифазного КЗ I_п0^(3) = " + S.fmt(calcResult.faults.k3.iFaultKa, 4) +
      " кА   |   Струм " + fSymbol + " = " + S.fmt(kn.iFaultPrimaryKa, 4) + " кА", {
      size: 13, mono: true, weight: 700, fill: "var(--svg-fault, #dc2626)"
    });

    drawPhasorDiagram(svg, 755, 190, kn.phaseCurrentsKa);

    return svg;
  }

  Render.SvgFault = {
    render: renderFaultSvg
  };
})(window.PPSCLab.Render);
