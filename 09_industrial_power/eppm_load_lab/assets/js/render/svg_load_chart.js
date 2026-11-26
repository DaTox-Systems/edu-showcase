window.EPPMLoadLab = window.EPPMLoadLab || {};
window.EPPMLoadLab.Render = window.EPPMLoadLab.Render || {};

(function (Render) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, text) {
    var node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      var keys = Object.keys(attrs);
      for (var i = 0; i < keys.length; i++) {
        node.setAttribute(keys[i], String(attrs[keys[i]]));
      }
    }
    if (text !== undefined && text !== null) {
      node.textContent = String(text);
    }
    return node;
  }

  function fmt(num, digits) {
    if (typeof num !== "number" || !Number.isFinite(num)) return "—";
    return num.toFixed(digits === undefined ? 2 : digits).replace(".", ",");
  }

  function niceCeiling(maxVal) {
    if (maxVal <= 10) return 10;
    var mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
    var norm = maxVal / mag;
    if (norm <= 1.2) return 1.2 * mag;
    if (norm <= 1.5) return 1.5 * mag;
    if (norm <= 2.0) return 2.0 * mag;
    if (norm <= 2.5) return 2.5 * mag;
    if (norm <= 5.0) return 5.0 * mag;
    return 10.0 * mag;
  }

  function renderLoadChart(hostEl, state, callbacks) {
    if (!hostEl || !state || !state.results || !state.results.part1) return;

    while (hostEl.firstChild) hostEl.removeChild(hostEl.firstChild);

    var part1 = state.part1;
    var res1 = state.results.part1;
    var layers = state.layers || {};
    var isSandbox = state.mode === "sandbox";

    var W = 880;
    var H = 410;
    var padL = 62;
    var padR = 26;
    var padT = 28;
    var padB = 56;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;

    var maxSeries = Math.max(res1.pMaxHourly, res1.pMax30min, 10);
    var yMax = niceCeiling(maxSeries * 1.12);

    function xAt(t) {
      return padL + (t / 24.0) * plotW;
    }

    function yAt(p) {
      return padT + plotH - (Math.max(0, p) / yMax) * plotH;
    }

    var svg = el("svg", {
      viewBox: "0 0 " + W + " " + H,
      role: "img",
      "aria-label": "Добовий графік житлового будинку (Частина 1)"
    });

    // 1. Grid Lines (Y ticks: 5 steps; X ticks: every 2 hours)
    for (var gy = 0; gy <= 5; gy++) {
      var valY = (yMax / 5) * gy;
      var py = yAt(valY);
      svg.appendChild(el("line", { x1: padL, y1: py, x2: W - padR, y2: py, stroke: "#e2e8f0", "stroke-width": 1 }));
      svg.appendChild(el("text", {
        x: padL - 8, y: py + 4, "text-anchor": "end", fill: "#475569",
        "font-size": "var(--svg-font-size, 12px)"
      }, fmt(valY, 0)));
    }

    for (var gx = 0; gx <= 24; gx += 2) {
      var px = xAt(gx);
      svg.appendChild(el("line", { x1: px, y1: padT, x2: px, y2: padT + plotH, stroke: "#e2e8f0", "stroke-width": 1 }));
      svg.appendChild(el("text", {
        x: px, y: padT + plotH + 20, "text-anchor": "middle", fill: "#475569",
        "font-size": "var(--svg-font-size, 12px)"
      }, gx));
    }

    // Axis Labels
    svg.appendChild(el("text", { x: padL - 44, y: padT - 10, fill: "#0f172a", "font-size": 12, "font-weight": "bold" }, "P, кВт"));
    svg.appendChild(el("text", { x: W - padR, y: padT + plotH + 38, "text-anchor": "end", fill: "#0f172a", "font-size": 12, "font-weight": "bold" }, "t, год доби"));

    // 2. Layer: P30 Sliding Window Band
    if (layers.p30Window && res1.pMax30Window) {
      var wStart = xAt(res1.pMax30Window.start);
      var wEnd = xAt(res1.pMax30Window.end);
      svg.appendChild(el("rect", {
        x: wStart, y: padT, width: Math.max(4, wEnd - wStart), height: plotH,
        fill: "#f59e0b", "fill-opacity": "0.18", stroke: "#d97706", "stroke-width": 1.2, "stroke-dasharray": "4,3"
      }));
      svg.appendChild(el("text", {
        x: (wStart + wEnd) / 2, y: padT + 16, "text-anchor": "middle",
        fill: "#b45309", "font-size": 11, "font-weight": "bold"
      }, "P30 = " + fmt(res1.pMax30min) + " кВт"));
    }

    // 3. Layer: Trapezoid Area Fill (W_a)
    if (layers.trapezoid) {
      var trapPts = [xAt(0).toFixed(1) + "," + yAt(0).toFixed(1)];
      for (var i = 0; i < 25; i++) {
        trapPts.push(xAt(i).toFixed(1) + "," + yAt(part1.total[i]).toFixed(1));
      }
      trapPts.push(xAt(24).toFixed(1) + "," + yAt(0).toFixed(1));
      svg.appendChild(el("polygon", {
        points: trapPts.join(" "),
        fill: "#0284c7", "fill-opacity": "0.14", stroke: "#0284c7", "stroke-width": 1, "stroke-opacity": "0.4"
      }));
    }

    // 4. Layer: ASKOE Step Profile
    if (layers.step) {
      var dStep = "M " + xAt(0).toFixed(1) + " " + yAt(part1.total[0]).toFixed(1);
      for (var s = 0; s < 24; s++) {
        dStep += " L " + xAt(s + 1).toFixed(1) + " " + yAt(part1.total[s]).toFixed(1);
        dStep += " L " + xAt(s + 1).toFixed(1) + " " + yAt(part1.total[s + 1]).toFixed(1);
      }
      svg.appendChild(el("path", {
        d: dStep, fill: "none", stroke: "#64748b", "stroke-width": "var(--svg-stroke-sub, 1.8px)", "stroke-dasharray": "6,4"
      }));
    }

    // 5. Daily Average Horizontal Line (P_сер.д)
    var avgY = yAt(res1.pAvgDaily);
    svg.appendChild(el("line", {
      x1: padL, y1: avgY, x2: W - padR, y2: avgY,
      stroke: "#047857", "stroke-width": 2, "stroke-dasharray": "8,4"
    }));
    svg.appendChild(el("text", {
      x: padL + 8, y: avgY - 6, fill: "#047857", "font-size": 11.5, "font-weight": "bold"
    }, "Pсер.д = " + fmt(res1.pAvgDaily) + " кВт"));

    // 6. General House Load (P_з.б.) bottom line
    var zbgPts = [];
    for (var z = 0; z < 25; z++) {
      zbgPts.push(xAt(z).toFixed(1) + "," + yAt(part1.zbg[z]).toFixed(1));
    }
    svg.appendChild(el("polyline", {
      points: zbgPts.join(" "), fill: "none", stroke: "#dc2626", "stroke-width": 1.8, "stroke-dasharray": "4,3"
    }));

    // 7. Layer: Smooth Natural Cubic Spline
    if (layers.spline && res1.splineInstance) {
      var spPts = [];
      var samples = 240;
      for (var k = 0; k <= samples; k++) {
        var tVal = (k / samples) * 24.0;
        var yVal = res1.splineInstance.interpolate(tVal);
        spPts.push(xAt(tVal).toFixed(1) + "," + yAt(yVal).toFixed(1));
      }
      svg.appendChild(el("polyline", {
        points: spPts.join(" "), fill: "none", stroke: "#004b87",
        "stroke-width": "var(--svg-stroke-main, 2.8px)", "stroke-linejoin": "round", "stroke-linecap": "round"
      }));
    }

    // 8. Discrete ASKOE Nodes (with interactive click/edit cues)
    for (var nIdx = 0; nIdx < 25; nIdx++) {
      var isPeak = nIdx === res1.tMaxHour;
      var cx = xAt(nIdx);
      var cy = yAt(part1.total[nIdx]);

      var dot = el("circle", {
        cx: cx, cy: cy,
        r: isPeak ? 6.5 : "var(--svg-node-radius, 4.5px)",
        fill: isPeak ? "#b91c1c" : "#ffffff",
        stroke: isPeak ? "#ffffff" : "#004b87",
        "stroke-width": 2,
        style: isSandbox ? "cursor: pointer;" : ""
      });

      dot.appendChild(el("title", {}, "t = " + nIdx + ":00 · Pб = " + fmt(part1.total[nIdx]) + " кВт (Pз.б. " + fmt(part1.zbg[nIdx]) + " + Pж " + fmt(part1.zh[nIdx], 0) + ")"));

      if (isSandbox && callbacks && typeof callbacks.onPointSelect === "function") {
        (function (hourIndex) {
          dot.addEventListener("click", function () {
            callbacks.onPointSelect(hourIndex);
          });
        })(nIdx);
      }

      svg.appendChild(dot);
    }

    // Main Axes Frame
    svg.appendChild(el("rect", { x: padL, y: padT, width: plotW, height: plotH, fill: "none", stroke: "#0f172a", "stroke-width": 1.6 }));

    // Bottom Legend Strip
    var legendY = H - 10;
    svg.appendChild(el("text", { x: padL, y: legendY, fill: "#004b87", "font-size": 11.5, "font-weight": "bold" }, "━━ Pб(t) (сплайн)"));
    svg.appendChild(el("text", { x: padL + 135, y: legendY, fill: "#64748b", "font-size": 11.5, "font-weight": "bold" }, "┈ Сходинки"));
    svg.appendChild(el("text", { x: padL + 235, y: legendY, fill: "#0284c7", "font-size": 11.5, "font-weight": "bold" }, "■ Площа Wa = " + fmt(res1.wTrapezoids) + " кВт·год"));
    svg.appendChild(el("text", { x: padL + 445, y: legendY, fill: "#dc2626", "font-size": 11.5, "font-weight": "bold" }, "┈ Pз.б.(t)"));
    svg.appendChild(el("text", { x: padL + 540, y: legendY, fill: "#b91c1c", "font-size": 11.5, "font-weight": "bold" }, "● Pмакс = " + fmt(res1.pMaxHourly) + " кВт (" + res1.tMaxHour + ":00)"));

    hostEl.appendChild(svg);
  }

  Render.LoadChart = {
    render: renderLoadChart
  };
})(window.EPPMLoadLab.Render);
