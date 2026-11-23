window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Render = window.PPSCLab.Render || {};

(function (Render) {
  "use strict";

  var S = Render.Symbols;

  function renderSequencesSvg(state, calcResult) {
    var svg = S.createSvgCanvas(960, 580, "seq");
    if (!calcResult || calcResult.status !== "success") {
      S.addText(svg, 480, 290, "Оберіть коректний варіант і метод для побудови схем послідовностей.", {
        anchor: "middle", size: 14, fill: "var(--text-muted, #475569)"
      });
      return svg;
    }

    var elms = calcResult.elements;
    var seq = calcResult.sequenceNetworks;
    var unit = seq.positive.unit === "pu" ? "в.о." : "Ом";
    var emfUnit = elms.tgEq.emfEq.unit === "pu" ? "в.о." : "кВ";
    var digits = seq.positive.unit === "pu" ? 4 : 2;

    // 1. Positive sequence
    S.addText(svg, 24, 28, "а) Схема заміщення прямої послідовності (X_1Σ = " + S.fmt(seq.positive.xTotal, digits) + " " + unit + ")", {
      size: 13.5, weight: 700, fill: "var(--svg-accent, #0b3d91)"
    });
    svg.appendChild(S.el("line", { x1: 68, y1: 60, x2: 68, y2: 142, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 2.8 }));
    S.addText(svg, 54, 105, "0_1", { anchor: "end", size: 13, weight: 700 });

    svg.appendChild(S.el("line", { x1: 68, y1: 101, x2: 145, y2: 101, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    S.addEmfSource(svg, 165, 101, 20, 0);
    S.addText(svg, 165, 72, "E''_екв = " + S.fmt(elms.tgEq.emfEq.value.mag, 4) + " " + emfUnit, { anchor: "middle", size: 11.5, mono: true, weight: 600 });
    S.addText(svg, 165, 136, "∠" + S.fmt(elms.tgEq.emfEq.value.deg, 2) + "°", { anchor: "middle", size: 11, mono: true, fill: "var(--text-muted, #475569)" });

    svg.appendChild(S.el("line", { x1: 185, y1: 101, x2: 260, y2: 101, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    S.addReactanceBox(svg, 260, 88, 76, 26, "X''_г.екв", S.fmt(elms.tgEq.xEq.value, digits) + " " + unit);

    svg.appendChild(S.el("line", { x1: 336, y1: 101, x2: 416, y2: 101, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    S.addReactanceBox(svg, 416, 88, 76, 26, "X_1т1", S.fmt(elms.transformer.x1Reduced.value, digits) + " " + unit);

    svg.appendChild(S.el("line", { x1: 492, y1: 101, x2: 572, y2: 101, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    S.addReactanceBox(svg, 572, 88, 76, 26, "X_1л.екв", S.fmt(elms.lines.x1Reduced.value, digits) + " " + unit);

    svg.appendChild(S.el("line", { x1: 648, y1: 101, x2: 790, y2: 101, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    svg.appendChild(S.el("circle", { cx: 790, cy: 101, r: 4, fill: "var(--svg-fault, #dc2626)" }));
    S.addText(svg, 804, 105, "K1 (X_1Σ = " + S.fmt(seq.positive.xTotal, digits) + ")", { size: 12.5, weight: 700, fill: "var(--svg-fault, #dc2626)", mono: true });

    svg.appendChild(S.el("line", { x1: 24, y1: 185, x2: 936, y2: 185, stroke: "var(--border, #cbd5e1)", "stroke-width": 1, "stroke-dasharray": "6 4" }));

    // 2. Negative sequence
    S.addText(svg, 24, 214, "б) Схема заміщення зворотної послідовності (ЕРС відсутні, курсове припущення X_2Σ = X_1Σ = " + S.fmt(seq.negative.xTotal, digits) + " " + unit + ")", {
      size: 13.5, weight: 700, fill: "var(--svg-accent, #0b3d91)"
    });
    svg.appendChild(S.el("line", { x1: 68, y1: 248, x2: 68, y2: 328, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 2.8 }));
    S.addText(svg, 54, 292, "0_2", { anchor: "end", size: 13, weight: 700 });

    svg.appendChild(S.el("line", { x1: 68, y1: 288, x2: 260, y2: 288, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    S.addReactanceBox(svg, 260, 275, 76, 26, "X_2г.екв", S.fmt(elms.tgEq.xEq.value, digits) + " " + unit);

    svg.appendChild(S.el("line", { x1: 336, y1: 288, x2: 416, y2: 288, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    S.addReactanceBox(svg, 416, 275, 76, 26, "X_2т1", S.fmt(elms.transformer.x1Reduced.value, digits) + " " + unit);

    svg.appendChild(S.el("line", { x1: 492, y1: 288, x2: 572, y2: 288, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    S.addReactanceBox(svg, 572, 275, 76, 26, "X_2л.екв", S.fmt(elms.lines.x1Reduced.value, digits) + " " + unit);

    svg.appendChild(S.el("line", { x1: 648, y1: 288, x2: 790, y2: 288, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    svg.appendChild(S.el("circle", { cx: 790, cy: 288, r: 4, fill: "var(--svg-fault, #dc2626)" }));
    S.addText(svg, 804, 292, "K1 (X_2Σ = " + S.fmt(seq.negative.xTotal, digits) + ")", { size: 12.5, weight: 700, fill: "var(--svg-fault, #dc2626)", mono: true });

    svg.appendChild(S.el("line", { x1: 24, y1: 372, x2: 936, y2: 372, stroke: "var(--border, #cbd5e1)", "stroke-width": 1, "stroke-dasharray": "6 4" }));

    // 3. Zero sequence
    var zActive = seq.zero.activeForFault;
    var zGroup = S.el("g", { opacity: zActive ? "1" : "0.52" });
    var zTitle = "в) Схема заміщення нульової послідовності (X_0Σ = " + S.fmt(seq.zero.xTotal, digits) + " " + unit + ", k_0 = " + S.fmt(state.assumptions.k0Line, 1) + ")" +
      (zActive ? " — АКТИВНА" : " — НЕ БЕРЕ УЧАСТІ ПРИ K(2), I_0 = 0");

    S.addText(zGroup, 24, 402, zTitle, {
      size: 13.5, weight: 700, fill: zActive ? "var(--svg-accent, #0b3d91)" : "var(--text-muted, #475569)"
    });

    S.addText(zGroup, 145, 458, "ТГ1, ТГ2 ізольовані", { anchor: "middle", size: 11.5, fill: "var(--text-muted, #475569)" });
    S.addText(zGroup, 145, 474, "обмоткою Δ Т1", { anchor: "middle", size: 11.5, fill: "var(--text-muted, #475569)" });
    zGroup.appendChild(S.el("line", { x1: 230, y1: 452, x2: 230, y2: 492, stroke: "var(--text-muted, #475569)", "stroke-width": 1.6, "stroke-dasharray": "4 3" }));

    zGroup.appendChild(S.el("line", { x1: 320, y1: 432, x2: 320, y2: 514, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 2.8 }));
    S.addText(zGroup, 306, 477, "0_0", { anchor: "end", size: 13, weight: 700 });
    S.addGroundSymbol(zGroup, 320, 514);

    zGroup.appendChild(S.el("line", { x1: 320, y1: 472, x2: 416, y2: 472, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    S.addReactanceBox(zGroup, 416, 459, 76, 26, "X_0т1", S.fmt(elms.transformer.x0Reduced.value, digits) + " " + unit);

    zGroup.appendChild(S.el("line", { x1: 492, y1: 472, x2: 572, y2: 472, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    S.addReactanceBox(zGroup, 572, 459, 76, 26, "X_0л.екв", S.fmt(elms.lines.x0Reduced.value, digits) + " " + unit);

    zGroup.appendChild(S.el("line", { x1: 648, y1: 472, x2: 790, y2: 472, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    zGroup.appendChild(S.el("circle", { cx: 790, cy: 472, r: 4, fill: zActive ? "var(--svg-fault, #dc2626)" : "var(--text-muted, #475569)" }));
    S.addText(zGroup, 804, 476, "K1 (X_0Σ = " + S.fmt(seq.zero.xTotal, digits) + ")", {
      size: 12.5, weight: 700, fill: zActive ? "var(--svg-fault, #dc2626)" : "var(--text-muted, #475569)", mono: true
    });

    svg.appendChild(zGroup);
    return svg;
  }

  Render.SvgSequences = {
    render: renderSequencesSvg
  };
})(window.PPSCLab.Render);
