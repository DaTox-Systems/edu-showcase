window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Render = window.PPSCLab.Render || {};

(function (Render) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  function fmt(num, digits) {
    if (num === null || num === undefined || !Number.isFinite(num)) return "—";
    return Number(num).toFixed(digits === undefined ? 2 : digits).replace(".", ",");
  }

  function el(tag, attrs, text) {
    var node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      var keys = Object.keys(attrs);
      for (var i = 0; i < keys.length; i += 1) {
        node.setAttribute(keys[i], String(attrs[keys[i]]));
      }
    }
    if (text !== undefined && text !== null) {
      node.textContent = String(text);
    }
    return node;
  }

  function createSvgCanvas(width, height, gridIdSuffix) {
    var svg = el("svg", {
      viewBox: "0 0 " + width + " " + height,
      xmlns: SVG_NS
    });

    var suffix = gridIdSuffix || "main";
    var defs = el("defs");

    var patMinor = el("pattern", {
      id: "ppscl-grid-minor-" + suffix,
      width: 10,
      height: 10,
      patternUnits: "userSpaceOnUse"
    });
    patMinor.appendChild(el("path", {
      d: "M 10 0 L 0 0 0 10",
      fill: "none",
      stroke: "var(--grid-minor, #eef2f7)",
      "stroke-width": 0.6
    }));

    var patMajor = el("pattern", {
      id: "ppscl-grid-major-" + suffix,
      width: 50,
      height: 50,
      patternUnits: "userSpaceOnUse"
    });
    patMajor.appendChild(el("rect", {
      width: 50,
      height: 50,
      fill: "url(#ppscl-grid-minor-" + suffix + ")"
    }));
    patMajor.appendChild(el("path", {
      d: "M 50 0 L 0 0 0 50",
      fill: "none",
      stroke: "var(--grid-major, #dbe4f0)",
      "stroke-width": 1
    }));

    var marker = el("marker", {
      id: "ppscl-arrow-" + suffix,
      viewBox: "0 0 10 10",
      refX: 8,
      refY: 5,
      markerWidth: 6,
      markerHeight: 6,
      orient: "auto"
    });
    marker.appendChild(el("path", {
      d: "M 0 1 L 10 5 L 0 9 z",
      fill: "var(--svg-accent, #0b3d91)"
    }));

    defs.appendChild(patMinor);
    defs.appendChild(patMajor);
    defs.appendChild(marker);
    svg.appendChild(defs);

    svg.appendChild(el("rect", {
      width: width,
      height: height,
      fill: "var(--bg-surface, #ffffff)"
    }));
    svg.appendChild(el("rect", {
      width: width,
      height: height,
      fill: "url(#ppscl-grid-major-" + suffix + ")"
    }));

    return svg;
  }

  function addGeneratorSymbol(parent, cx, cy, r) {
    parent.appendChild(el("circle", {
      cx: cx,
      cy: cy,
      r: r,
      fill: "var(--bg-surface, #ffffff)",
      stroke: "var(--svg-stroke, #0f172a)",
      "stroke-width": 1.8
    }));
    var d = "M " + (cx - r * 0.52) + " " + cy +
      " Q " + (cx - r * 0.26) + " " + (cy - r * 0.45) + ", " + cx + " " + cy +
      " T " + (cx + r * 0.52) + " " + cy;
    parent.appendChild(el("path", {
      d: d,
      fill: "none",
      stroke: "var(--svg-stroke, #0f172a)",
      "stroke-width": 1.6
    }));
  }

  function addEmfSource(parent, cx, cy, r, angleDeg) {
    parent.appendChild(el("circle", {
      cx: cx,
      cy: cy,
      r: r,
      fill: "var(--bg-surface, #ffffff)",
      stroke: "var(--svg-accent, #0b3d91)",
      "stroke-width": 1.8
    }));
    var g = el("g", {
      transform: "rotate(" + (angleDeg || 0) + " " + cx + " " + cy + ")"
    });
    g.appendChild(el("line", {
      x1: cx - r * 0.55,
      y1: cy,
      x2: cx + r * 0.42,
      y2: cy,
      stroke: "var(--svg-accent, #0b3d91)",
      "stroke-width": 1.6
    }));
    g.appendChild(el("polygon", {
      points: (cx + r * 0.6) + "," + cy + " " + (cx + r * 0.25) + "," + (cy - 4) + " " + (cx + r * 0.25) + "," + (cy + 4),
      fill: "var(--svg-accent, #0b3d91)"
    }));
    parent.appendChild(g);
  }

  function addGroundSymbol(parent, x, y) {
    parent.appendChild(el("line", { x1: x, y1: y, x2: x, y2: y + 14, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.6 }));
    parent.appendChild(el("line", { x1: x - 11, y1: y + 14, x2: x + 11, y2: y + 14, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.7 }));
    parent.appendChild(el("line", { x1: x - 7, y1: y + 19, x2: x + 7, y2: y + 19, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.5 }));
    parent.appendChild(el("line", { x1: x - 3, y1: y + 24, x2: x + 3, y2: y + 24, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.3 }));
  }

  function addTransformerDeltaY0(parent, cx, cyTop, r) {
    var cyBot = cyTop + r * 1.45;
    parent.appendChild(el("circle", {
      cx: cx, cy: cyTop, r: r,
      fill: "var(--bg-surface, #ffffff)", stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8
    }));
    parent.appendChild(el("circle", {
      cx: cx, cy: cyBot, r: r,
      fill: "none", stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.8
    }));
    // Delta inside upper winding
    parent.appendChild(el("polygon", {
      points: cx + "," + (cyTop - 9) + " " + (cx - 9) + "," + (cyTop + 7) + " " + (cx + 9) + "," + (cyTop + 7),
      fill: "none", stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.5
    }));
    // Canonical Y inside lower winding + neutral grounding from star center
    parent.appendChild(el("line", { x1: cx - 8, y1: cyBot - 8, x2: cx, y2: cyBot + 1, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.6 }));
    parent.appendChild(el("line", { x1: cx + 8, y1: cyBot - 8, x2: cx, y2: cyBot + 1, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.6 }));
    parent.appendChild(el("line", { x1: cx, y1: cyBot + 1, x2: cx, y2: cyBot + 12, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.6 }));
    parent.appendChild(el("line", { x1: cx, y1: cyBot + 1, x2: cx + r + 24, y2: cyBot + 1, stroke: "var(--svg-stroke, #0f172a)", "stroke-width": 1.5 }));
    addGroundSymbol(parent, cx + r + 24, cyBot + 1);
  }

  function addReactanceBox(parent, x, y, w, h, label, subLabel, color) {
    var strokeColor = color || "var(--svg-stroke, #0f172a)";
    parent.appendChild(el("rect", {
      x: x,
      y: y,
      width: w,
      height: h,
      fill: "var(--bg-surface, #ffffff)",
      stroke: strokeColor,
      "stroke-width": 1.7
    }));
    if (label) {
      var t = el("text", {
        x: x + w / 2,
        y: y - 7,
        "text-anchor": "middle",
        "font-size": 12,
        "font-weight": 600,
        fill: "var(--text-main, #0f172a)"
      }, label);
      parent.appendChild(t);
    }
    if (subLabel) {
      var ts = el("text", {
        x: x + w / 2,
        y: y + h + 15,
        "text-anchor": "middle",
        "font-size": 11,
        "font-family": "var(--font-mono, Consolas, monospace)",
        fill: "var(--text-muted, #475569)"
      }, subLabel);
      parent.appendChild(ts);
    }
  }

  function addFaultLightning(parent, tipX, tipY) {
    var pts = (tipX + 26) + "," + (tipY - 38) + " " +
      (tipX + 6) + "," + (tipY - 20) + " " +
      (tipX + 17) + "," + (tipY - 17) + " " +
      (tipX + 2) + "," + (tipY - 3);
    parent.appendChild(el("polyline", {
      points: pts,
      fill: "none",
      stroke: "var(--svg-fault, #dc2626)",
      "stroke-width": 2.2
    }));
    parent.appendChild(el("polygon", {
      points: tipX + "," + tipY + " " + (tipX + 3) + "," + (tipY - 9) + " " + (tipX + 9) + "," + (tipY - 3),
      fill: "var(--svg-fault, #dc2626)"
    }));
  }

  function addText(parent, x, y, text, opts) {
    var o = opts || {};
    return parent.appendChild(el("text", {
      x: x,
      y: y,
      "text-anchor": o.anchor || "start",
      "font-size": o.size || 12,
      "font-weight": o.weight || 400,
      "font-style": o.style || "normal",
      "font-family": o.mono ? "var(--font-mono, Consolas, monospace)" : "var(--font-ui, sans-serif)",
      fill: o.fill || "var(--text-main, #0f172a)"
    }, text));
  }

  Render.Symbols = {
    fmt: fmt,
    el: el,
    createSvgCanvas: createSvgCanvas,
    addGeneratorSymbol: addGeneratorSymbol,
    addEmfSource: addEmfSource,
    addGroundSymbol: addGroundSymbol,
    addTransformerDeltaY0: addTransformerDeltaY0,
    addReactanceBox: addReactanceBox,
    addFaultLightning: addFaultLightning,
    addText: addText
  };
})(window.PPSCLab.Render);
