window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.UI = window.PPSCLab.UI || {};

(function (App) {
  "use strict";

  var Data = App.Data;
  var Core = App.Core;
  var Render = App.Render;
  var UI = App.UI;

  var lastResult = null;

  function buildComparisonData(state) {
    if (!state || state.method === null) {
      return { methods: [], assumptions: [] };
    }
    var methodList = ["exact_pu", "approx_pu", "exact_named", "approx_named"];
    var methodRows = [];
    for (var m = 0; m < methodList.length; m += 1) {
      var mId = methodList[m];
      var cloneM = JSON.parse(JSON.stringify(state));
      cloneM.method = mId;
      cloneM.methodSource = "manual";
      methodRows.push({
        label: Data.Variants.METHODS[mId].labelUk,
        isActive: state.method === mId,
        result: App.calculate(cloneM)
      });
    }

    var baseAssump = state.assumptions;
    var assumpSpecs = [
      { label: "Номінальний режим E'' (P, cos φ, x''_d)", patch: { emfModel: "rated_complex" }, active: baseAssump.emfModel === "rated_complex" },
      { label: "Типова ЕРС E'' = 1,08 в.о.", patch: { emfModel: "typical_108" }, active: baseAssump.emfModel === "typical_108" },
      { label: "Спрощена ЕРС E'' = 1,0 в.о.", patch: { emfModel: "simplified_100" }, active: baseAssump.emfModel === "simplified_100" },
      { label: "Нульова послідовність k_0 = 4,0", patch: { k0Line: 4.0 }, active: baseAssump.k0Line === 4.0 },
      { label: "Нульова послідовність k_0 = 3,5", patch: { k0Line: 3.5 }, active: baseAssump.k0Line === 3.5 },
      { label: "Напруга генераторів (точн.) U_ном.г = 6,3 кВ", patch: { uGenNomKv: 6.3 }, active: baseAssump.uGenNomKv === 6.3 },
      { label: "Напруга генераторів (точн.) U_ном.г = 6,0 кВ", patch: { uGenNomKv: 6.0 }, active: baseAssump.uGenNomKv === 6.0 }
    ];

    var assumptionRows = [];
    for (var a = 0; a < assumpSpecs.length; a += 1) {
      var sp = assumpSpecs[a];
      var cloneA = JSON.parse(JSON.stringify(state));
      var keys = Object.keys(sp.patch);
      for (var k = 0; k < keys.length; k += 1) {
        cloneA.assumptions[keys[k]] = sp.patch[keys[k]];
      }
      assumptionRows.push({
        label: sp.label,
        isActive: sp.active,
        result: App.calculate(cloneA)
      });
    }

    return { methods: methodRows, assumptions: assumptionRows };
  }

  function renderAll(state) {
    lastResult = App.calculate(state);
    var compData = buildComparisonData(state);

    var handlers = {
      onRecalculate: function () {
        renderAll(Core.Store.getState());
        UI.Toast.show("Розрахунок оновлено.");
      },
      onOpenComparison: function () {
        UI.PanelCenter.setActiveTab("comparison");
        renderAll(Core.Store.getState());
      },
      onExportJson: function () {
        var name = state.isCustomInput ? "pp_sclab_custom.json" : ("pp_sclab_var" + state.variant + ".json");
        Render.Export.downloadText(name, Core.Store.exportJson(), "application/json;charset=utf-8");
        UI.Toast.show("JSON експортовано: " + name);
      },
      onImportJson: function () {
        var inp = document.getElementById("json-file-input");
        if (inp) inp.click();
      },
      onExportSvg: function () {
        var svg = UI.PanelCenter.getActiveSvgElement();
        if (!svg) {
          UI.Toast.show("Перемкніться на вкладку схеми для експорту SVG.");
          return;
        }
        var name = state.isCustomInput ? "pp_sclab_diagram.svg" : ("pp_sclab_var" + state.variant + ".svg");
        Render.Export.downloadSvg(svg, name);
        UI.Toast.show("SVG збережено.");
      },
      onExportMd: function () {
        var md = Render.Protocol.buildMarkdown(state, lastResult);
        var name = state.isCustomInput ? "pp_sclab_protocol.md" : ("pp_sclab_var" + state.variant + ".md");
        Render.Export.downloadText(name, md, "text/markdown;charset=utf-8");
        UI.Toast.show("Markdown-протокол збережено.");
      },
      onPrint: function () {
        var printEl = document.getElementById("print-protocol-root");
        Render.Export.printFromCalcResult(state, lastResult, printEl);
      }
    };

    UI.HeaderToolbar.renderHeader(handlers);
    UI.HeaderToolbar.renderToolbar(state, handlers);
    UI.PanelLeft.render(state, handlers);
    UI.PanelCenter.render(state, lastResult, compData);
    UI.PanelRight.render(state, lastResult);
  }

  window.addEventListener("DOMContentLoaded", function () {
    var fileInp = document.getElementById("json-file-input");
    if (fileInp) {
      fileInp.addEventListener("change", function () {
        if (!fileInp.files || fileInp.files.length === 0) return;
        var reader = new FileReader();
        reader.onload = function () {
          var res = Core.Store.importJson(String(reader.result || ""));
          if (!res.ok) {
            UI.Toast.show("Помилка імпорту: " + (res.errors[0] ? res.errors[0].message : "некоректний файл"));
          } else {
            UI.Toast.show("Конфігурацію JSON успішно завантажено.");
          }
          fileInp.value = "";
        };
        reader.readAsText(fileInp.files[0], "utf-8");
      });
    }

    Core.Store.subscribe(function (nextState) {
      renderAll(nextState);
    });
    Core.Store.init(7);
    renderAll(Core.Store.getState());
  });
})(window.PPSCLab);
