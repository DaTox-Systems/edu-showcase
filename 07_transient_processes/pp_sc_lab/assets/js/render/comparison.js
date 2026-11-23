window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Render = window.PPSCLab.Render || {};

(function (Render) {
  "use strict";

  var S = Render.Symbols;

  function domEl(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function buildTableSection(parent, title, baseK3, baseKn, rows) {
    var box = domEl("div", "card");
    box.style.marginBottom = "14px";
    box.appendChild(domEl("h3", "card-title", title));

    var tbl = domEl("table", "data-table");
    var thead = domEl("thead");
    var trH = domEl("tr");
    var headers = ["Профіль / Метод", "I_п0^(3), кА", "Δ K(3), %", "I_к^(n), кА", "Δ K(n), %", "I_зем, кА"];
    for (var i = 0; i < headers.length; i += 1) {
      trH.appendChild(domEl("th", null, headers[i]));
    }
    thead.appendChild(trH);
    tbl.appendChild(thead);

    var tbody = domEl("tbody");
    for (var r = 0; r < rows.length; r += 1) {
      var item = rows[r];
      var res = item.result;
      var tr = domEl("tr");
      if (item.isActive) {
        tr.style.background = "var(--bg-info-soft)";
        tr.style.fontWeight = "700";
      }

      tr.appendChild(domEl("td", null, item.label + (item.isActive ? " (активний)" : "")));
      if (res && res.status === "success") {
        var k3Val = res.faults.k3.iFaultKa;
        var knVal = res.faults.kn.iFaultPrimaryKa;
        var gndVal = res.faults.kn.iGroundKa;
        var d3 = baseK3 > 0 ? ((k3Val - baseK3) / baseK3) * 100 : 0;
        var dn = baseKn > 0 ? ((knVal - baseKn) / baseKn) * 100 : 0;

        tr.appendChild(domEl("td", "mono", S.fmt(k3Val, 4)));
        tr.appendChild(domEl("td", "mono", (d3 >= 0 ? "+" : "") + S.fmt(d3, 2) + "%"));
        tr.appendChild(domEl("td", "mono", S.fmt(knVal, 4)));
        tr.appendChild(domEl("td", "mono", (dn >= 0 ? "+" : "") + S.fmt(dn, 2) + "%"));
        tr.appendChild(domEl("td", "mono", S.fmt(gndVal, 4)));
      } else {
        for (var c = 0; c < 5; c += 1) tr.appendChild(domEl("td", "mono", "—"));
      }
      tbody.appendChild(tr);
    }

    tbl.appendChild(tbody);
    box.appendChild(tbl);
    parent.appendChild(box);
  }

  // Strictly Read-Only: accepts pre-computed comparison rows from controller
  function buildComparisonDom(baseResult, methodRows, assumptionRows) {
    var wrap = domEl("div");
    wrap.style.width = "100%";
    wrap.style.maxWidth = "920px";

    if (!baseResult || baseResult.status !== "success") {
      wrap.appendChild(domEl("div", "notice-box warn", "Для порівняння методів і припущень оберіть валідний варіант та метод розрахунку."));
      return wrap;
    }

    var baseK3 = baseResult.faults.k3.iFaultKa;
    var baseKn = baseResult.faults.kn.iFaultPrimaryKa;

    buildTableSection(wrap, "1. Порівняння чотирьох методів приведення (при поточних припущеннях)", baseK3, baseKn, methodRows);
    buildTableSection(wrap, "2. Порівняння методичних припущень (при поточному методі)", baseK3, baseKn, assumptionRows);

    return wrap;
  }

  Render.Comparison = {
    buildDom: buildComparisonDom
  };
})(window.PPSCLab.Render);
