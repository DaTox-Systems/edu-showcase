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

  function renderCityView(hostEl, state) {
    if (!hostEl || !state || !state.results || !state.results.part2 || !state.results.apparent) return;

    while (hostEl.firstChild) hostEl.removeChild(hostEl.firstChild);

    var part2 = state.results.part2;
    var apparent = state.results.apparent;
    var consumers = part2.evaluatedObjects;
    var hr = state.selectedHour;
    var sNom = state.substation.transformerKva;

    var pTotal = part2.sumCurve[hr];
    var qTotal = apparent.qCurve[hr];
    var sTotal = apparent.sCurve[hr];
    var loadPct = apparent.loadRatioCurve[hr] || 0;

    var loadColor = "#047857";
    var loadBg = "#ecfdf5";
    var loadLabel = "Помірне завантаження";
    if (loadPct > 100.0) {
      loadColor = "#b91c1c";
      loadBg = "#fef2f2";
      loadLabel = "Понад 100% (підвищ. навант.)";
    } else if (loadPct >= 80.0) {
      loadColor = "#b45309";
      loadBg = "#fffbeb";
      loadLabel = "Високе завантаження";
    }

    var n = consumers.length;
    var width = Math.max(880, n * 240);
    var height = 270;

    var svg = el("svg", {
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-label": "Мнемосхема ТП 10/0,4 кВ"
    });

    var centerX = width / 2;

    // 1. 10 kV Busbar & Feed Line
    svg.appendChild(el("line", { x1: centerX - 180, y1: 22, x2: centerX + 180, y2: 22, stroke: "#0f172a", "stroke-width": 4 }));
    svg.appendChild(el("text", { x: centerX - 190, y: 26, "text-anchor": "end", fill: "#334155", "font-size": 12, "font-weight": "bold" }, "10 кВ"));
    svg.appendChild(el("line", { x1: centerX, y1: 22, x2: centerX, y2: 44, stroke: "#0f172a", "stroke-width": 2.5 }));

    // 2. Power Transformer Symbol (Two overlapping circles)
    svg.appendChild(el("circle", { cx: centerX, cy: 62, r: 18, fill: "#ffffff", stroke: "#004b87", "stroke-width": 2.5 }));
    svg.appendChild(el("circle", { cx: centerX, cy: 84, r: 18, fill: "none", stroke: "#004b87", "stroke-width": 2.5 }));
    svg.appendChild(el("line", { x1: centerX, y1: 102, x2: centerX, y2: 126, stroke: "#0f172a", "stroke-width": 3 }));

    // Transformer Rating & Instantaneous Vector Panel (Left & Right of symbol)
    svg.appendChild(el("rect", {
      x: centerX - 270, y: 42, width: 230, height: 64, rx: 8,
      fill: "#f8fafc", stroke: "#cbd5e1", "stroke-width": 1.5
    }));
    svg.appendChild(el("text", { x: centerX - 256, y: 63, fill: "#0f172a", "font-size": 13, "font-weight": "bold" }, "ТП 10/0,4 кВ · Sном = " + sNom + " кВА"));
    svg.appendChild(el("text", { x: centerX - 256, y: 82, fill: "#475569", "font-size": 12 }, "P = " + fmt(pTotal) + " кВт · Q = " + fmt(qTotal) + " квар"));
    svg.appendChild(el("text", { x: centerX - 256, y: 98, fill: "#004b87", "font-size": 12, "font-weight": "bold" }, "S(t) = " + fmt(sTotal) + " кВА"));

    // Load Ratio Indicator Box (Right)
    svg.appendChild(el("rect", {
      x: centerX + 40, y: 42, width: 240, height: 64, rx: 8,
      fill: loadBg, stroke: loadColor, "stroke-width": 1.8
    }));
    svg.appendChild(el("text", { x: centerX + 54, y: 64, fill: loadColor, "font-size": 14, "font-weight": "bold" }, "Kз(" + hr + ":00) = " + fmt(loadPct, 1) + " %"));
    svg.appendChild(el("text", { x: centerX + 54, y: 82, fill: "#334155", "font-size": 11.5 }, loadLabel));

    // Load progress bar
    svg.appendChild(el("rect", { x: centerX + 54, y: 90, width: 210, height: 7, rx: 3.5, fill: "#e2e8f0" }));
    var barWidth = Math.min(210, Math.max(4, (loadPct / 120.0) * 210));
    svg.appendChild(el("rect", { x: centerX + 54, y: 90, width: barWidth, height: 7, rx: 3.5, fill: loadColor }));

    // 3. 0.4 kV Low Voltage Busbar
    var busLeft = 80;
    var busRight = width - 80;
    svg.appendChild(el("line", { x1: busLeft, y1: 126, x2: busRight, y2: 126, stroke: "#004b87", "stroke-width": 5 }));
    svg.appendChild(el("text", { x: busLeft - 10, y: 130, "text-anchor": "end", fill: "#004b87", "font-size": 12, "font-weight": "bold" }, "0,4 кВ"));

    // 4. Feeder Lines & Consumer Cards
    var cosDetails = apparent.cosPhiDetails || [];
    var slotWidth = (busRight - busLeft) / n;

    for (var i = 0; i < n; i++) {
      var c = consumers[i];
      var cx = busLeft + slotWidth * (i + 0.5);
      var pNow = c.curve[hr];
      var ratio = c.peakPowerKw > 0 ? (pNow / c.peakPowerKw) : 0;
      var lineThick = 1.8 + ratio * 2.8;

      // Feeder drop line
      svg.appendChild(el("line", {
        x1: cx, y1: 126, x2: cx, y2: 160,
        stroke: "#0369a1", "stroke-width": lineThick.toFixed(1)
      }));
      // Breaker dot
      svg.appendChild(el("rect", { x: cx - 5, y: 138, width: 10, height: 10, fill: "#ffffff", stroke: "#0f172a", "stroke-width": 1.8 }));

      // Consumer box
      var cardW = Math.min(220, slotWidth - 18);
      var cardX = cx - cardW / 2;
      svg.appendChild(el("rect", {
        x: cardX, y: 160, width: cardW, height: 94, rx: 8,
        fill: "#ffffff", stroke: "#94a3b8", "stroke-width": 1.5
      }));

      var shortName = c.name.length > 26 ? (c.name.slice(0, 24) + "…") : c.name;
      svg.appendChild(el("text", { x: cx, y: 180, "text-anchor": "middle", fill: "#0f172a", "font-size": 12, "font-weight": "bold" }, shortName));
      svg.appendChild(el("text", { x: cx, y: 200, "text-anchor": "middle", fill: "#0369a1", "font-size": 13, "font-weight": "bold" }, "P(" + hr + ":00) = " + fmt(pNow) + " кВт"));
      svg.appendChild(el("text", { x: cx, y: 218, "text-anchor": "middle", fill: "#475569", "font-size": 11 }, "Макс: " + fmt(c.peakPowerKw) + " кВт"));

      var cosVal = "—";
      for (var cd = 0; cd < cosDetails.length; cd++) {
        if (cosDetails[cd].consumerId === c.id) {
          cosVal = fmt(cosDetails[cd].value, 2);
          break;
        }
      }
      var dbnTag = c.dbnCategory ? ("ДБН: " + c.dbnCategory) : "Поза ДБН";
      svg.appendChild(el("text", { x: cx, y: 236, "text-anchor": "middle", fill: "#64748b", "font-size": 10.5 }, "cos φ = " + cosVal + " · " + dbnTag));
    }

    hostEl.appendChild(svg);
  }

  Render.CityView = {
    render: renderCityView
  };
})(window.EPPMLoadLab.Render);
