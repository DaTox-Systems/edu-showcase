window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Render = window.PPSCLab.Render || {};

(function (Render) {
  "use strict";

  var S = Render.Symbols;

  function renderNetworkSvg(state, calcResult) {
    var svg = S.createSvgCanvas(880, 460, "net");
    var inp = state.input;
    var faultSymbol = state.faultType === "K11" ? "K(1,1)" : (state.faultType === "K1" ? "K(1)" : "K(2)");

    // Title inside canvas
    var headerText = state.isCustomInput
      ? ("Однолінійна схема мережі (Користувацькі параметри) · Точка K1: K(3) / " + faultSymbol)
      : ("Однолінійна схема мережі · Варіант N = " + state.variant + " · Точка K1: K(3) / " + faultSymbol);
    S.addText(svg, 24, 26, headerText, { size: 13.5, weight: 700, fill: "var(--svg-accent, #0b3d91)" });

    // TG1
    S.addGeneratorSymbol(svg, 310, 82, 23);
    svg.appendChild(S.el("line", { x1: 310, y1: 105, x2: 310, y2: 146, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
    S.addText(svg, 272, 68, "ТГ1", { anchor: "end", size: 14, weight: 700 });
    S.addText(svg, 272, 86, "P = " + S.fmt(inp.tg1.pMw, 1) + " МВт; cos φ = " + S.fmt(inp.tg1.cosPhi, 2), { anchor: "end", size: 12, mono: true });
    S.addText(svg, 272, 104, "x''_d1 = " + S.fmt(inp.tg1.xdPp, 2), { anchor: "end", size: 12, mono: true });

    // TG2
    S.addGeneratorSymbol(svg, 510, 82, 23);
    svg.appendChild(S.el("line", { x1: 510, y1: 105, x2: 510, y2: 146, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
    S.addText(svg, 548, 68, "ТГ2", { anchor: "start", size: 14, weight: 700 });
    S.addText(svg, 548, 86, "P = " + S.fmt(inp.tg2.pMw, 1) + " МВт; cos φ = " + S.fmt(inp.tg2.cosPhi, 2), { anchor: "start", size: 12, mono: true });
    S.addText(svg, 548, 104, "x''_d2 = " + S.fmt(inp.tg2.xdPp, 2), { anchor: "start", size: 12, mono: true });

    // Bus 6 kV
    svg.appendChild(S.el("line", { x1: 230, y1: 146, x2: 590, y2: 146, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 3.4 }));
    svg.appendChild(S.el("circle", { cx: 410, cy: 146, r: 3.5, fill: "var(--svg-stroke, #0f172a)" }));
    S.addText(svg, 214, 143, "U_1ном = 6 кВ", { anchor: "end", size: 13, weight: 700 });
    S.addText(svg, 214, 160, "(U_ном.г = " + S.fmt(state.assumptions.uGenNomKv, 1) + " кВ)", { anchor: "end", size: 11.5, fill: "var(--text-muted, #475569)" });

    // T1
    svg.appendChild(S.el("line", { x1: 410, y1: 146, x2: 410, y2: 176, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
    S.addTransformerDeltaY0(svg, 410, 198, 22);
    S.addText(svg, 376, 216, "Т1", { anchor: "end", size: 14, weight: 700 });
    S.addText(svg, 474, 196, "S_ном.т1 = " + S.fmt(inp.transformer.sNomMva, 1) + " МВА", { size: 12, weight: 600, mono: true });
    S.addText(svg, 474, 214, S.fmt(inp.transformer.uLvKv, 1) + " / " + S.fmt(inp.transformer.uHvKv, 0) + " кВ · Δ / Y0", { size: 12, mono: true });
    S.addText(svg, 474, 232, "u_к1 = " + S.fmt(inp.transformer.ukPercent, 1) + " %", { size: 12, mono: true });

    // Intermediate bus 110 kV
    svg.appendChild(S.el("line", { x1: 410, y1: 252, x2: 410, y2: 280, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
    svg.appendChild(S.el("line", { x1: 295, y1: 280, x2: 525, y2: 280, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 3.0 }));

    // Parallel lines L1 and L2
    svg.appendChild(S.el("line", { x1: 335, y1: 280, x2: 335, y2: 392, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
    svg.appendChild(S.el("line", { x1: 485, y1: 280, x2: 485, y2: 392, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8 }));
    S.addText(svg, 320, 326, "Л1", { anchor: "end", size: 13.5, weight: 700 });
    S.addText(svg, 500, 326, "Л2", { anchor: "start", size: 13.5, weight: 700 });
    S.addText(svg, 410, 328, "L = " + S.fmt(inp.lines.lengthKm, 1) + " км", { anchor: "middle", size: 12, mono: true });
    S.addText(svg, 410, 346, "x_1,пит = " + S.fmt(inp.lines.x1LineOhmPerKm, 2) + " Ом/км", { anchor: "middle", size: 12, mono: true });

    // Bus 110 kV & Fault K1
    svg.appendChild(S.el("line", { x1: 230, y1: 392, x2: 560, y2: 392, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 3.4 }));
    S.addText(svg, 214, 388, "U_2ном = 110 кВ", { anchor: "end", size: 13, weight: 700 });

    if (calcResult && calcResult.status === "success" && calcResult.bases) {
      var baseLabel = calcResult.bases.systemType === "pu"
        ? ("Базис: S_б = " + S.fmt(calcResult.bases.sBaseMva, 0) + " МВА, U_б2 = " + S.fmt(calcResult.bases.uBase2Kv, 0) + " кВ")
        : ("Приведено до K1 (k_T = " + S.fmt(calcResult.bases.transformerRatio, 4) + ")");
      S.addText(svg, 214, 406, baseLabel, { anchor: "end", size: 11, fill: "var(--text-muted, #475569)" });
    }

    S.addFaultLightning(svg, 286, 392);
    S.addText(svg, 286, 418, "K1: K(3), " + faultSymbol, {
      anchor: "middle", size: 13.5, weight: 700, fill: "var(--svg-fault, #dc2626)"
    });

    if (calcResult && calcResult.status === "success") {
      S.addText(svg, 585, 385, "I_п0^(3) = " + S.fmt(calcResult.faults.k3.iFaultKa, 4) + " кА", {
        size: 13, weight: 700, mono: true, fill: "var(--svg-accent, #0b3d91)"
      });
      S.addText(svg, 585, 407, "I_" + faultSymbol + " = " + S.fmt(calcResult.faults.kn.iFaultPrimaryKa, 4) + " кА", {
        size: 13, weight: 700, mono: true, fill: "var(--svg-fault, #dc2626)"
      });
      if (calcResult.faults.kn.iGroundKa > 0 && state.faultType === "K11") {
        S.addText(svg, 585, 427, "I_зем = " + S.fmt(calcResult.faults.kn.iGroundKa, 4) + " кА", {
          size: 12, weight: 600, mono: true, fill: "var(--svg-fault, #dc2626)"
        });
      }
    }

    return svg;
  }

  Render.SvgNetwork = {
    render: renderNetworkSvg
  };
})(window.PPSCLab.Render);
