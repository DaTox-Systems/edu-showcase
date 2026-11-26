window.EPPMLoadLab = window.EPPMLoadLab || {};
window.EPPMLoadLab.Render = window.EPPMLoadLab.Render || {};

(function (Render) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var PALETTE = ["#1d4ed8", "#0284c7", "#d97706", "#9333ea", "#0d9488", "#e11d48"];

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

  function renderSumChart(hostEl, state, callbacks) {
    if (!hostEl || !state || !state.results || !state.results.part2) return;

    while (hostEl.firstChild) hostEl.removeChild(hostEl.firstChild);

    var part2 = state.results.part2;
    var objects = part2.evaluatedObjects;
    var dbn = part2.methodDbn;
    var graphic = part2.methodGraphic;
    var hr = state.selectedHour;

    var W = 880;
    var H = 430;
    var padL = 64;
    var padR = 26;
    var padT = 28;
    var padB = 72;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;

    var samples = 240;
    var trapEnabled = Boolean(state.layers && state.layers.arithmeticTrap);
    var arithSum = part2.peaks.arithmeticSum;
    var trapSyncSamples = null;
    var trapSyncMax = 0;

    if (trapEnabled && objects.length > 0) {
      trapSyncSamples = [];
      for (var ts = 0; ts <= samples; ts++) {
        var tBase = (ts / samples) * 24.0;
        var valSync = 0.0;
        for (var oiTrap = 0; oiTrap < objects.length; oiTrap++) {
          var objTrap = objects[oiTrap];
          var objPeakHr = (objTrap.metrics && typeof objTrap.metrics.tMaxHour === "number")
            ? objTrap.metrics.tMaxHour
            : graphic.tSumMaxHour;
          var shiftH = graphic.tSumMaxHour - objPeakHr;
          var uShifted = tBase - shiftH;
          while (uShifted < 0) uShifted += 24.0;
          while (uShifted > 24.0) uShifted -= 24.0;
          valSync += objTrap.metrics.splineInstance.interpolate(uShifted);
        }
        if (valSync > trapSyncMax) trapSyncMax = valSync;
        trapSyncSamples.push({ t: tBase, v: valSync });
      }
    }

    var dbnLineVal = dbn.pDbnWithAssumptions !== null ? dbn.pDbnWithAssumptions : 0;
    var trapLineVal = (trapEnabled && typeof arithSum === "number") ? Math.max(arithSum, trapSyncMax) : 0;
    var maxPeak = Math.max(graphic.pSumMaxHourly, graphic.pSumMax30min, dbnLineVal, trapLineVal, 10);
    var yMax = niceCeiling(maxPeak * 1.12);

    function xAt(t) {
      return padL + (t / 24.0) * plotW;
    }

    function yAt(p) {
      return padT + plotH - (Math.max(0, p) / yMax) * plotH;
    }

    var svg = el("svg", {
      viewBox: "0 0 " + W + " " + H,
      role: "img",
      "aria-label": "Сумарний графік навантаження шин 0,4 кВ ТП"
    });

    // 1. Grid
    for (var gy = 0; gy <= 5; gy++) {
      var valY = (yMax / 5) * gy;
      var py = yAt(valY);
      svg.appendChild(el("line", { x1: padL, y1: py, x2: W - padR, y2: py, stroke: "#e2e8f0", "stroke-width": 1 }));
      svg.appendChild(el("text", { x: padL - 8, y: py + 4, "text-anchor": "end", fill: "#475569", "font-size": "var(--svg-font-size, 12px)" }, fmt(valY, 0)));
    }

    for (var gx = 0; gx <= 24; gx += 2) {
      var px = xAt(gx);
      svg.appendChild(el("line", { x1: px, y1: padT, x2: px, y2: padT + plotH, stroke: "#e2e8f0", "stroke-width": 1 }));
      svg.appendChild(el("text", { x: px, y: padT + plotH + 20, "text-anchor": "middle", fill: "#475569", "font-size": "var(--svg-font-size, 12px)" }, gx));
    }

    svg.appendChild(el("text", { x: padL - 46, y: padT - 10, fill: "#0f172a", "font-size": 12, "font-weight": "bold" }, "P, кВт"));
    svg.appendChild(el("text", { x: W - padR, y: padT + plotH + 36, "text-anchor": "end", fill: "#0f172a", "font-size": 12, "font-weight": "bold" }, "t, год доби"));

    // 2. Arithmetic Peak Sum Warning Line (Rendered ONLY when educational trap layer is toggled)
    if (trapEnabled && typeof arithSum === "number" && arithSum > 0) {
      var arithY = yAt(arithSum);
      svg.appendChild(el("line", {
        x1: padL, y1: arithY, x2: W - padR, y2: arithY,
        stroke: "#dc2626", "stroke-width": 1.8, "stroke-dasharray": "5,3"
      }));
      svg.appendChild(el("text", {
        x: padL + 8, y: arithY - 6, fill: "#b91c1c", "font-size": 11.5, "font-weight": "bold"
      }, "⚠ Умовна сума піків: " + fmt(arithSum) + " кВт (пунктир — при штучному збігу о " + graphic.tSumMaxHour + ":00; +" + fmt(part2.comparison.diversitySavingKw) + " кВт)"));
    }

    // 2.1. DBN Reference Line (honest label reflecting coverageStatus)
    if (dbn.pDbnWithAssumptions !== null) {
      var dbnY = yAt(dbn.pDbnWithAssumptions);
      var dbnLabel = (dbn.coverageStatus === "complete")
        ? ("ДБН В.2.5-23:2025: " + fmt(dbn.pDbnWithAssumptions) + " кВт")
        : ("ДБН (з умовн. аналогією): " + fmt(dbn.pDbnWithAssumptions) + " кВт");

      svg.appendChild(el("line", {
        x1: padL, y1: dbnY, x2: W - padR, y2: dbnY,
        stroke: "#7c3aed", "stroke-width": 2, "stroke-dasharray": "7,5"
      }));
      svg.appendChild(el("text", {
        x: padL + 8, y: dbnY - 6, fill: "#6d28d9", "font-size": 11.5, "font-weight": "bold"
      }, dbnLabel));
    }

    // 3. Interactive Time Cursor Vertical Line
    var cursorX = xAt(hr);
    svg.appendChild(el("line", {
      x1: cursorX, y1: padT, x2: cursorX, y2: padT + plotH,
      stroke: "#0f172a", "stroke-width": 1.6, "stroke-dasharray": "3,3"
    }));
    svg.appendChild(el("rect", { x: cursorX - 24, y: padT + 4, width: 48, height: 18, rx: 4, fill: "#0f172a" }));
    svg.appendChild(el("text", { x: cursorX, y: padT + 17, "text-anchor": "middle", fill: "#ffffff", "font-size": 11, "font-weight": "bold" }, hr + ":00"));

    // 4. Individual Consumer Splines (No time shifting)
    for (var cIdx = 0; cIdx < objects.length; cIdx++) {
      var obj = objects[cIdx];
      var color = PALETTE[cIdx % PALETTE.length];
      var spObj = obj.metrics.splineInstance;
      var ptsObj = [];
      for (var s = 0; s <= samples; s++) {
        var tVal = (s / samples) * 24.0;
        ptsObj.push(xAt(tVal).toFixed(1) + "," + yAt(spObj.interpolate(tVal)).toFixed(1));
      }
      svg.appendChild(el("polyline", {
        points: ptsObj.join(" "), fill: "none", stroke: color,
        "stroke-width": "var(--svg-stroke-sub, 2px)", "stroke-linejoin": "round"
      }));

      // Intersection dot at active cursor hour
      svg.appendChild(el("circle", {
        cx: cursorX, cy: yAt(obj.curve[hr]), r: 4.5,
        fill: color, stroke: "#ffffff", "stroke-width": 1.5
      }));
    }

    // 5. Total Substation Curve P_sum(t)
    var sumPts = [];
    for (var sSum = 0; sSum <= samples; sSum++) {
      var tSum = (sSum / samples) * 24.0;
      var valSumT = 0.0;
      for (var oi = 0; oi < objects.length; oi++) {
        valSumT += objects[oi].metrics.splineInstance.interpolate(tSum);
      }
      sumPts.push(xAt(tSum).toFixed(1) + "," + yAt(valSumT).toFixed(1));
    }
    svg.appendChild(el("polyline", {
      points: sumPts.join(" "), fill: "none", stroke: "#047857",
      "stroke-width": "var(--svg-stroke-main, 3.2px)", "stroke-linejoin": "round"
    }));

    // 5.1. Synchronized-Peaks Trap Curve (Only when trap layer is active)
    if (trapEnabled && trapSyncSamples && trapSyncSamples.length > 0) {
      var trapPts = [];
      for (var tp = 0; tp < trapSyncSamples.length; tp++) {
        trapPts.push(xAt(trapSyncSamples[tp].t).toFixed(1) + "," + yAt(trapSyncSamples[tp].v).toFixed(1));
      }
      svg.appendChild(el("polyline", {
        points: trapPts.join(" "), fill: "none", stroke: "#dc2626",
        "stroke-width": "var(--svg-stroke-sub, 2.2px)", "stroke-dasharray": "6,4", "stroke-linejoin": "round"
      }));

      var peakX = xAt(graphic.tSumMaxHour);
      var realPeakY = yAt(graphic.pSumMaxHourly);
      var trapPeakY = yAt(arithSum);
      svg.appendChild(el("line", {
        x1: peakX, y1: realPeakY, x2: peakX, y2: trapPeakY,
        stroke: "#dc2626", "stroke-width": 2.2
      }));
      svg.appendChild(el("circle", {
        cx: peakX, cy: trapPeakY, r: 5.5,
        fill: "#dc2626", stroke: "#ffffff", "stroke-width": 2
      }));
      svg.appendChild(el("text", {
        x: peakX + 8, y: (realPeakY + trapPeakY) / 2 + 4, fill: "#b91c1c", "font-size": 11.5, "font-weight": "bold"
      }, "+" + fmt(part2.comparison.diversitySavingKw) + " кВт"));
    }

    // Peak marker & cursor marker on Sum curve
    svg.appendChild(el("circle", {
      cx: xAt(graphic.tSumMaxHour), cy: yAt(graphic.pSumMaxHourly), r: 6.5,
      fill: "#b91c1c", stroke: "#ffffff", "stroke-width": 2
    }));
    svg.appendChild(el("circle", {
      cx: cursorX, cy: yAt(part2.sumCurve[hr]), r: 5.5,
      fill: "#047857", stroke: "#ffffff", "stroke-width": 2
    }));

    // 6. Clickable Hour Hit-Zones across plot for effortless time cursor navigation
    for (var hZone = 0; hZone <= 24; hZone++) {
      var hitX = xAt(hZone) - (plotW / 48);
      var hitRect = el("rect", {
        x: Math.max(padL, hitX), y: padT, width: plotW / 24, height: plotH,
        fill: "transparent", style: "cursor: crosshair;"
      });
      hitRect.appendChild(el("title", {}, "Клік: вибрати годину " + hZone + ":00 (PΣ = " + fmt(part2.sumCurve[hZone]) + " кВт)"));
      if (callbacks && typeof callbacks.onSelectHour === "function") {
        (function (hourSelected) {
          hitRect.addEventListener("click", function () {
            callbacks.onSelectHour(hourSelected);
          });
        })(hZone);
      }
      svg.appendChild(hitRect);
    }

    // Frame
    svg.appendChild(el("rect", { x: padL, y: padT, width: plotW, height: plotH, fill: "none", stroke: "#0f172a", "stroke-width": 1.6 }));

    // Legend Row
    var legY1 = H - 24;
    var legY2 = H - 7;
    svg.appendChild(el("text", { x: padL, y: legY1, fill: "#047857", "font-size": 11.5, "font-weight": "bold" }, "━━ Сумарне навантаження PΣ(t) · Макс: " + fmt(graphic.pSumMaxHourly) + " кВт (" + graphic.tSumMaxHour + ":00)"));

    var xOffset = padL;
    for (var lIdx = 0; lIdx < objects.length; lIdx++) {
      var lColor = PALETTE[lIdx % PALETTE.length];
      var shortTitle = objects[lIdx].name.length > 28 ? (objects[lIdx].name.slice(0, 26) + "…") : objects[lIdx].name;
      svg.appendChild(el("text", { x: xOffset, y: legY2, fill: lColor, "font-size": 11, "font-weight": "bold" }, "● " + shortTitle));
      xOffset += 215;
      if (xOffset > W - 120) break;
    }

    hostEl.appendChild(svg);
  }

  Render.SumChart = {
    render: renderSumChart
  };
})(window.EPPMLoadLab.Render);
