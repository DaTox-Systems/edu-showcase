window.EPPMLoadLab = window.EPPMLoadLab || {};
window.EPPMLoadLab.UI = window.EPPMLoadLab.UI || {};

(function (Core, Data, Render, UI) {
  "use strict";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function clearEl(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function fmt(num, digits) {
    if (typeof num !== "number" || !Number.isFinite(num)) return "—";
    return num.toFixed(digits === undefined ? 2 : digits).replace(".", ",");
  }

  function fmtTimeRange(win) {
    if (!win) return "—";
    function toHHMM(hDec) {
      var hrs = Math.floor(hDec);
      var mins = Math.round((hDec - hrs) * 60);
      if (mins === 60) { hrs += 1; mins = 0; }
      return (hrs < 10 ? "0" : "") + hrs + ":" + (mins < 10 ? "0" : "") + mins;
    }
    return toHHMM(win.start) + "–" + toHHMM(win.end);
  }

  function createKpiCard(label, valueStr, unitStr, subStr) {
    var card = el("div", "kpi-card");
    card.appendChild(el("div", "kpi-label", label));
    var valRow = el("div", "kpi-value", valueStr);
    if (unitStr) {
      valRow.appendChild(el("span", "kpi-unit", unitStr));
    }
    card.appendChild(valRow);
    if (subStr) {
      card.appendChild(el("div", "kpi-sub", subStr));
    }
    return card;
  }

  function initApp() {
    var store = Core.Store.create();
    var toolbar = UI.Toolbar.init(store);

    // Cached Screen 1 DOM
    var kpiPart1El = document.getElementById("kpi-part1");
    var chartPart1Host = document.getElementById("chart-part1-host");
    var tablePart1Host = document.getElementById("table-part1-host");
    var part1EditHint = document.getElementById("part1-edit-hint");
    var layerCheckboxes = document.querySelectorAll(".layer-toggles input[data-layer]");

    // Cached Screen 2 DOM
    var kpiPart2El = document.getElementById("kpi-part2");
    var cityViewHost = document.getElementById("city-view-host");
    var chartSumHost = document.getElementById("chart-sum-host");
    var consumersEditorHost = document.getElementById("consumers-editor-host");
    var transformerSelect = document.getElementById("select-transformer-kva");
    var cosPhiSelect = document.getElementById("select-cosphi-preset");
    var hourSlider = document.getElementById("slider-hour");
    var hourReadout = document.getElementById("slider-hour-value");
    var cursorHourLabel = document.getElementById("cursor-hour-label");
    var addConsumerBtn = document.getElementById("btn-add-consumer");

    // Cached Screen 3 DOM
    var dbnSummaryHost = document.getElementById("dbn-summary-host");
    var dbnMatrixHost = document.getElementById("dbn-matrix-host");

    // Cached Screen 4 DOM
    var comparisonHost = document.getElementById("comparison-host");
    var goldenHost = document.getElementById("golden-reference-host");
    var methodologyHost = document.getElementById("methodology-notes-host");
    var exportJsonBtn = document.getElementById("btn-export-json");
    var printBtn = document.getElementById("btn-print-report");
    var printSheet = document.getElementById("print-report-sheet");

    var footerRef = document.getElementById("footer-academic-ref");
    if (footerRef && Data.Academic) {
      footerRef.textContent = Data.Academic.department + " · " + Data.Academic.university;
    }

    var addFormVisible = false;

    // Event Bindings
    for (var l = 0; l < layerCheckboxes.length; l++) {
      layerCheckboxes[l].addEventListener("change", function () {
        store.dispatch({ type: "TOGGLE_LAYER", layer: this.getAttribute("data-layer") });
      });
    }

    if (transformerSelect) {
      transformerSelect.addEventListener("change", function () {
        store.dispatch({ type: "SET_TRANSFORMER_KVA", kva: Number(transformerSelect.value) });
      });
    }

    if (cosPhiSelect) {
      cosPhiSelect.addEventListener("change", function () {
        store.dispatch({ type: "SET_COS_PHI_PRESET", presetId: cosPhiSelect.value });
      });
    }

    if (hourSlider) {
      hourSlider.addEventListener("input", function () {
        store.dispatch({ type: "SET_SELECTED_HOUR", hour: Number(hourSlider.value) });
      });
    }

    if (addConsumerBtn) {
      addConsumerBtn.addEventListener("click", function () {
        addFormVisible = !addFormVisible;
        renderConsumersEditor(store.getState());
      });
    }

    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", function () {
        var snap = store.getState();
        var exportPayload = {
          exportedAt: new Date().toISOString(),
          mode: snap.mode,
          variantId: snap.variantId,
          provenance: snap.variantProvenance,
          part1Metrics: snap.results.part1 ? snap.results.part1.formatted : null,
          part2Metrics: snap.results.part2 ? snap.results.part2.formatted : null,
          dbnDetails: snap.results.part2 ? snap.results.part2.methodDbn : null,
          cosPhiDetails: snap.results.apparent ? snap.results.apparent.cosPhiDetails : null
        };
        var blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "EPPM_LoadLab_Var" + snap.variantId + "_" + snap.mode + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    if (printBtn) {
      printBtn.addEventListener("click", function () {
        buildPrintReport(store.getState());
        window.print();
      });
    }

    // Screen 1 Renderer
    function renderScreen1(state) {
      var res1 = state.results.part1;
      if (!res1) return;

      for (var lc = 0; lc < layerCheckboxes.length; lc++) {
        var key = layerCheckboxes[lc].getAttribute("data-layer");
        layerCheckboxes[lc].checked = Boolean(state.layers[key]);
      }

      if (kpiPart1El) {
        clearEl(kpiPart1El);
        kpiPart1El.appendChild(createKpiCard(
          "Макс. годинна потужність Pр.ж.б.",
          fmt(res1.pMaxHourly), "кВт",
          "Година піку: " + res1.tMaxHour + ":00"
        ));
        kpiPart1El.appendChild(createKpiCard(
          "Модельний 30-хв максимум P30,max",
          fmt(res1.pMax30min), "кВт",
          "Вікно: " + fmtTimeRange(res1.pMax30Window)
        ));
        kpiPart1El.appendChild(createKpiCard(
          "Добова енергія Wа (трапеції, Δt=1 год)",
          fmt(res1.wTrapezoids), "кВт·год",
          "Сплайн: " + fmt(res1.wSpline) + " · Сходинки: " + fmt(res1.wLeftRectangles) + " / " + fmt(res1.wRightRectangles)
        ));
        kpiPart1El.appendChild(createKpiCard(
          "Середньодобове навантаження Pсер.д",
          fmt(res1.pAvgDaily), "кВт",
          "Pсер.д = Wа / 24 год"
        ));
        kpiPart1El.appendChild(createKpiCard(
          "Коефіцієнт заповнення Kз.г",
          fmt(res1.kFillHourlyPeak, 3), "в.о.",
          "За P30 (сплайн): " + fmt(res1.kFill30minPeak, 3)
        ));
      }

      Render.LoadChart.render(chartPart1Host, state, {
        onPointSelect: function (hourIdx) {
          var rowEl = tablePart1Host ? tablePart1Host.querySelector('tr[data-hour="' + hourIdx + '"]') : null;
          if (rowEl) rowEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      });

      var isSandbox = state.mode === "sandbox";
      var tableTitle = document.querySelector("#screen-1 .side-panel .card-header h3");
      if (tableTitle) {
        tableTitle.textContent = isSandbox
          ? "Таблиця 1.1 — Користувацькі дані (Sandbox)"
          : (state.mode === "benchmark" ? "Таблиця 1.1 — Вихідні дані методичних рекомендацій (Вар. №7)" : "Таблиця 1.1 — Дані варіанта №" + state.variantId);
      }

      if (part1EditHint) {
        part1EditHint.textContent = isSandbox ? "Режим редагування (Sandbox)" : "Тільки перегляд";
        part1EditHint.className = isSandbox ? "badge badge-conditional" : "badge badge-neutral";
      }

      if (tablePart1Host) {
        clearEl(tablePart1Host);
        var tbl = el("table", "data-table");
        var thead = el("thead");
        var hRow = el("tr");
        var headers = ["t, год", "Pз.б., кВт", "Pж., кВт", "Pб., кВт", "Wінт., кВт·год"];
        for (var hi = 0; hi < headers.length; hi++) hRow.appendChild(el("th", "", headers[hi]));
        thead.appendChild(hRow);
        tbl.appendChild(thead);

        var tbody = el("tbody");
        for (var t = 0; t < 25; t++) {
          var tr = el("tr");
          tr.setAttribute("data-hour", String(t));
          if (t === res1.tMaxHour) tr.classList.add("is-highlighted-row");
          tr.appendChild(el("td", "", t + ":00"));

          var tdZbg = el("td");
          var tdZh = el("td");
          if (isSandbox) {
            var inZbg = el("input", "cell-input");
            inZbg.type = "number";
            inZbg.step = "0.1";
            inZbg.min = "0";
            inZbg.value = String(Number(state.part1.zbg[t].toFixed(2)));
            (function (hr) {
              inZbg.addEventListener("change", function () {
                store.dispatch({ type: "UPDATE_PART1_POINT", hour: hr, field: "zbg", value: Number(this.value) });
              });
            })(t);
            tdZbg.appendChild(inZbg);

            var inZh = el("input", "cell-input");
            inZh.type = "number";
            inZh.step = "1";
            inZh.min = "0";
            inZh.value = String(Number(state.part1.zh[t].toFixed(2)));
            (function (hr) {
              inZh.addEventListener("change", function () {
                store.dispatch({ type: "UPDATE_PART1_POINT", hour: hr, field: "zh", value: Number(this.value) });
              });
            })(t);
            tdZh.appendChild(inZh);
          } else {
            tdZbg.textContent = fmt(state.part1.zbg[t]);
            tdZh.textContent = fmt(state.part1.zh[t], 0);
          }

          tr.appendChild(tdZbg);
          tr.appendChild(tdZh);
          tr.appendChild(el("td", "", fmt(state.part1.total[t])));
          tr.appendChild(el("td", "", t < 24 ? fmt(res1.hourlyEnergy[t]) : "—"));
          tbody.appendChild(tr);
        }
        tbl.appendChild(tbody);
        tablePart1Host.appendChild(tbl);
      }
    }

    // Screen 2 Consumers Editor
    function renderConsumersEditor(state) {
      if (!consumersEditorHost) return;
      clearEl(consumersEditorHost);

      var part2 = state.results.part2;
      var apparent = state.results.apparent;
      if (!part2 || !apparent) return;

      var isSandbox = state.mode === "sandbox";
      var hr = state.selectedHour;

      if (addConsumerBtn) {
        addConsumerBtn.textContent = addFormVisible ? "× Скасувати" : "+ Додати споживача";
      }

      if (addFormVisible) {
        var formBox = el("div", "consumer-item");
        formBox.appendChild(el("strong", "", "Новий споживач на шини 0,4 кВ ТП (Sandbox)"));

        var fName = el("input", "control-select");
        fName.type = "text";
        fName.placeholder = "Назва (напр. Їдальня або Цех)";
        fName.value = "Додатковий об'єкт";

        var fCat = el("select", "control-select");
        var catOpts = [
          { v: "canteen", l: "Їдальня (ДБН: так)", dbn: "canteen" },
          { v: "school", l: "Школа (ДБН: так)", dbn: "school" },
          { v: "supermarket", l: "Універсам (ДБН: так)", dbn: "supermarket" },
          { v: "polyclinic", l: "Поліклініка (ДБН: так)", dbn: "polyclinic" },
          { v: "cafe", l: "Кафе (ДБН: так)", dbn: "cafe" },
          { v: "traction_substation", l: "Тягова ПС (умовн. аналогія)", dbn: "traction_substation" },
          { v: "custom_industrial", l: "Нетипове навантаження (поза ДБН)", dbn: null }
        ];
        for (var co = 0; co < catOpts.length; co++) {
          var oNode = el("option", "", catOpts[co].l);
          oNode.value = catOpts[co].v;
          fCat.appendChild(oNode);
        }

        var fPeak = el("input", "cell-input");
        fPeak.type = "number";
        fPeak.min = "1";
        fPeak.value = "60";

        var fCos = el("input", "cell-input");
        fCos.type = "number";
        fCos.step = "0.01";
        fCos.min = "0.1";
        fCos.max = "1";
        fCos.value = "0.92";

        var fSubmit = el("button", "btn btn-small btn-primary", "Додати на шини ТП");
        fSubmit.type = "button";
        fSubmit.addEventListener("click", function () {
          var selIdx = fCat.selectedIndex;
          var chosenMeta = catOpts[selIdx];
          var profKey = Data.Variants.PROFILES[chosenMeta.v] ? chosenMeta.v : "canteen";
          addFormVisible = false;
          store.dispatch({
            type: "ADD_CONSUMER",
            consumer: {
              name: fName.value,
              category: chosenMeta.v,
              dbnCategory: chosenMeta.dbn,
              profileId: profKey,
              peakPowerKw: Number(fPeak.value),
              cosPhi: Number(fCos.value)
            }
          });
        });

        formBox.appendChild(el("div", "kpi-sub", "Назва:"));
        formBox.appendChild(fName);
        formBox.appendChild(el("div", "kpi-sub", "Категорія та профіль:"));
        formBox.appendChild(fCat);
        var rowNums = el("div", "inline-control");
        rowNums.appendChild(el("span", "", "Pмакс (кВт):"));
        rowNums.appendChild(fPeak);
        rowNums.appendChild(el("span", "", "cos φ:"));
        rowNums.appendChild(fCos);
        formBox.appendChild(rowNums);
        formBox.appendChild(fSubmit);
        consumersEditorHost.appendChild(formBox);
      }

      var cosDetails = apparent.cosPhiDetails || [];
      for (var i = 0; i < part2.evaluatedObjects.length; i++) {
        var obj = part2.evaluatedObjects[i];
        var box = el("div", "consumer-item");

        var top = el("div", "inline-control");
        top.appendChild(el("strong", "", obj.name));
        var dbnBadge = obj.dbnCategory
          ? el("span", "badge badge-verified", "ДБН: " + obj.dbnCategory)
          : el("span", "badge badge-unavailable", "Поза ДБН");
        top.appendChild(dbnBadge);
        box.appendChild(top);

        var cosVal = 0.95;
        for (var cd = 0; cd < cosDetails.length; cd++) {
          if (cosDetails[cd].consumerId === obj.id) {
            cosVal = cosDetails[cd].value;
            break;
          }
        }

        box.appendChild(el("div", "kpi-sub", "P(" + hr + ":00) = " + fmt(obj.curve[hr]) + " кВт · Pмакс = " + fmt(obj.peakPowerKw) + " кВт · cos φ = " + fmt(cosVal, 2)));

        // Controls for editing (switching automatically to Sandbox on edit)
        var editRow = el("div", "inline-control");
        editRow.appendChild(el("span", "", "Pмакс:"));
        var inPeak = el("input", "cell-input");
        inPeak.type = "number";
        inPeak.step = "1";
        inPeak.min = "0";
        inPeak.value = String(Number(obj.peakPowerKw.toFixed(2)));
        (function (cid) {
          inPeak.addEventListener("change", function () {
            store.dispatch({ type: "UPDATE_CONSUMER", consumerId: cid, patch: { peakPowerKw: Number(this.value) } });
          });
        })(obj.id);
        editRow.appendChild(inPeak);

        editRow.appendChild(el("span", "", "P(" + hr + ":00):"));
        var inHourKw = el("input", "cell-input");
        inHourKw.type = "number";
        inHourKw.step = "1";
        inHourKw.min = "0";
        inHourKw.value = String(Number(obj.curve[hr].toFixed(2)));
        (function (cid, hSel) {
          inHourKw.addEventListener("change", function () {
            store.dispatch({ type: "UPDATE_CONSUMER_HOUR_KW", consumerId: cid, hour: hSel, valueKw: Number(this.value) });
          });
        })(obj.id, hr);
        editRow.appendChild(inHourKw);

        editRow.appendChild(el("span", "", "cos φ:"));
        var inCos = el("input", "cell-input");
        inCos.type = "number";
        inCos.step = "0.01";
        inCos.min = "0.1";
        inCos.max = "1";
        inCos.value = String(cosVal);
        (function (cid) {
          inCos.addEventListener("change", function () {
            store.dispatch({ type: "SET_CONSUMER_COS_PHI", consumerId: cid, value: Number(this.value) });
          });
        })(obj.id);
        editRow.appendChild(inCos);

        if (part2.evaluatedObjects.length > 1 && isSandbox) {
          var rmBtn = el("button", "btn btn-small badge-danger", "Видалити");
          rmBtn.type = "button";
          (function (cid) {
            rmBtn.addEventListener("click", function () {
              store.dispatch({ type: "REMOVE_CONSUMER", consumerId: cid });
            });
          })(obj.id);
          editRow.appendChild(rmBtn);
        }

        box.appendChild(editRow);
        consumersEditorHost.appendChild(box);
      }
    }

    // Screen 2 Renderer
    function renderScreen2(state) {
      var part2 = state.results.part2;
      var apparent = state.results.apparent;
      if (!part2 || !apparent) return;

      if (transformerSelect) transformerSelect.value = String(state.substation.transformerKva);
      if (cosPhiSelect) cosPhiSelect.value = state.substation.cosPhiPresetId;
      if (hourSlider) hourSlider.value = String(state.selectedHour);
      if (hourReadout) hourReadout.textContent = state.selectedHour + ":00";
      if (cursorHourLabel) cursorHourLabel.textContent = state.selectedHour + ":00";

      if (kpiPart2El) {
        clearEl(kpiPart2El);
        kpiPart2El.appendChild(createKpiCard(
          "Арифметична сума ΣPмакс",
          fmt(part2.peaks.arithmeticSum), "кВт",
          "Теоретичний збіг усіх піків"
        ));
        kpiPart2El.appendChild(createKpiCard(
          "Графічний максимум (60 хв)",
          fmt(part2.methodGraphic.pSumMaxHourly), "кВт",
          "Пік на шинах ТП о " + part2.methodGraphic.tSumMaxHour + ":00"
        ));
        kpiPart2El.appendChild(createKpiCard(
          "Півгодинний максимум P30,max (сплайн)",
          fmt(part2.methodGraphic.pSumMax30min), "кВт",
          "Вікно: " + fmtTimeRange(part2.methodGraphic.pSumMax30Window)
        ));
        kpiPart2El.appendChild(createKpiCard(
          "Добова енергія ТП Wа.ТП",
          fmt(part2.methodGraphic.wTotalTp), "кВт·год",
          "Зниження піка: −" + fmt(part2.comparison.diversitySavingKw) + " кВт (" + fmt(part2.comparison.diversitySavingPercent) + "%)"
        ));
        kpiPart2El.appendChild(createKpiCard(
          "Повна потужність Smax (25 вузлів)",
          fmt(apparent.sMax), "кВА",
          "Sном.Т = " + state.substation.transformerKva + " кВА"
        ));
      }

      Render.CityView.render(cityViewHost, state);
      Render.SumChart.render(chartSumHost, state, {
        onSelectHour: function (hr) {
          store.dispatch({ type: "SET_SELECTED_HOUR", hour: hr });
        }
      });
      renderConsumersEditor(state);
    }

    // Screen 3 Renderer: DBN Normative Matrix & Strict Isolation
    function renderScreen3(state) {
      var part2 = state.results.part2;
      if (!part2) return;
      var dbn = part2.methodDbn;
      var largest = part2.peaks.largestPeakPowerConsumer;

      if (dbnSummaryHost) {
        clearEl(dbnSummaryHost);

        // Card 1: Status & Major Consumer
        var card1 = el("div", "card");
        card1.appendChild(el("h3", "", "Статус нормативного розрахунку (Табл. 6.17 ДБН)"));
        card1.appendChild(el("p", "", "Найбільший споживач (max Ppeak): " + largest.name + " (" + fmt(largest.peakPowerKw) + " кВт)"));

        var covBadge = el("span", "badge " + (dbn.coverageStatus === "complete" ? "badge-verified" : (dbn.coverageStatus === "conditional" ? "badge-conditional" : "badge-unavailable")));
        covBadge.textContent = "Покриття: " + dbn.coverageStatus;
        var verBadge = el("span", "badge " + (dbn.normativeVerificationStatus === "verified" ? "badge-verified" : "badge-conditional"));
        verBadge.textContent = "Верифікація PDF: " + dbn.normativeVerificationStatus;

        var bRow = el("div", "inline-control");
        bRow.appendChild(covBadge);
        bRow.appendChild(verBadge);
        card1.appendChild(bRow);
        dbnSummaryHost.appendChild(card1);

        // Card 2: Strictly separated totals
        var card2 = el("div", "card");
        card2.appendChild(el("h3", "", "Результати за формулою (17) ДБН В.2.5-23:2025"));

        var strictText = dbn.pDbnStrict !== null
          ? (fmt(dbn.pDbnStrict) + " кВт (підтверджений)")
          : "Недоступний (наявні умовні/непідтверджені об'єкти)";
        card2.appendChild(el("p", "", "Чистий нормативний ДБН (pDbnStrict): " + strictText));

        if (dbn.partialConfirmedContributionKw !== null && dbn.pDbnStrict === null) {
          card2.appendChild(el("p", "kpi-sub", "Діагностичний частковий внесок підтверджених категорій: " + fmt(dbn.partialConfirmedContributionKw) + " кВт (не є повним підсумком!)."));
        }

        if (dbn.pDbnWithAssumptions !== null && dbn.coverageStatus === "conditional") {
          card2.appendChild(el("p", "badge badge-conditional", "Із умовними аналогіями: " + fmt(dbn.pDbnWithAssumptions) + " кВт"));
        }
        dbnSummaryHost.appendChild(card2);

        // Card 3: Factor breakdown per object
        var card3 = el("div", "card");
        card3.appendChild(el("h3", "", "Складові участі споживачів"));
        var ul = el("ul", "");
        for (var p = 0; p < dbn.participationDetails.length; p++) {
          var det = dbn.participationDetails[p];
          var txt = det.name + ": K = " + (det.factor !== null ? fmt(det.factor, 1) : "—") +
            " -> " + (det.contributionKw !== null ? (fmt(det.contributionKw) + " кВт") : "виключено") +
            " [" + det.status + "]";
          var li = el("li", "", txt);
          li.title = det.reason || "";
          ul.appendChild(li);
        }
        card3.appendChild(ul);
        dbnSummaryHost.appendChild(card3);
      }

      // Render Interactive 10x16 Table 6.17
      if (dbnMatrixHost && Data.DBN && Data.DBN.MATRIX) {
        clearEl(dbnMatrixHost);
        var matrix = Data.DBN.MATRIX;
        var colKeys = [
          "residential_elec", "residential_gas", "canteen", "cafe", "specialized_edu",
          "school", "admin", "retail_1shift", "retail_2shift", "hotel", "barber",
          "kindergarten", "polyclinic", "service_center", "communal_services", "culture"
        ];
        var colShortLabels = [
          "Житл. (ел.)", "Житл. (газ)", "Їдальні", "Рест./кафе", "Спец. освіта",
          "Школи", "Адмін.", "Торг. 1-зм.", "Торг. 2-зм.", "Готелі", "Перукарні",
          "ДНЗ", "Мед. доп.", "Побут. обсл.", "Комун. підпр.", "Культура"
        ];

        // Collect active column highlights from participationDetails
        var activeCols = Object.create(null);
        for (var ad = 0; ad < dbn.participationDetails.length; ad++) {
          var dItem = dbn.participationDetails[ad];
          if (dItem.dbnCol) {
            activeCols[dItem.dbnCol] = dItem.status;
          }
        }

        var mTable = el("table", "data-table");
        var mHead = el("thead");
        var mHRow = el("tr");
        mHRow.appendChild(el("th", "", "Споживач із найбільшим навантаженням"));
        for (var ci = 0; ci < colShortLabels.length; ci++) {
          mHRow.appendChild(el("th", "", colShortLabels[ci]));
        }
        mHead.appendChild(mHRow);
        mTable.appendChild(mHead);

        var mBody = el("tbody");
        var rowKeys = Object.keys(matrix);
        for (var ri = 0; ri < rowKeys.length; ri++) {
          var rk = rowKeys[ri];
          var rowData = matrix[rk];
          var isMainRow = (dbn.majorRowCanonical === rk);
          var tr = el("tr", isMainRow ? "is-highlighted-row" : "");
          tr.appendChild(el("td", "", rowData.label));

          for (var cIdx = 0; cIdx < colKeys.length; cIdx++) {
            var ck = colKeys[cIdx];
            var val = rowData[ck];
            var td = el("td", "", typeof val === "number" ? fmt(val, 1) : "—");
            if (isMainRow && activeCols[ck]) {
              td.classList.add("is-highlighted-cell");
              td.title = activeCols[ck] === "conditional_assumption"
                ? "Умовна навчальна аналогія (поза прямою сферою ДБН)"
                : "Підтверджений коефіцієнт ДБН В.2.5-23:2025";
            }
            tr.appendChild(td);
          }
          mBody.appendChild(tr);
        }
        mTable.appendChild(mBody);
        dbnMatrixHost.appendChild(mTable);
      }
    }

    // Screen 4 Renderer: Comparison, Golden Reference, Methodology
    function renderScreen4(state) {
      var part2 = state.results.part2;
      var golden = state.results.golden;
      if (!part2) return;

      if (comparisonHost) {
        clearEl(comparisonHost);
        var cardComp = el("div", "card");
        cardComp.appendChild(el("h3", "", "Порівняння методів визначення навантаження ТП"));
        var tbl = el("table", "data-table");
        var tb = el("tbody");
        var rows = [
          ["Арифметична сума максимумів (довідково)", fmt(part2.peaks.arithmeticSum) + " кВт", "Теоретичне завищення за одночасного піку"],
          ["Спосіб 1: ДБН В.2.5-23:2025", part2.methodDbn.pDbnWithAssumptions !== null ? (fmt(part2.methodDbn.pDbnWithAssumptions) + " кВт") : "Недоступно", "Статус покриття: " + part2.methodDbn.coverageStatus],
          ["Спосіб 2: Годинний максимум графіка (60 хв)", fmt(part2.methodGraphic.pSumMaxHourly) + " кВт", "Час настання піку: " + part2.methodGraphic.tSumMaxHour + ":00"],
          ["Модельний півгодинний максимум (сплайн P30)", fmt(part2.methodGraphic.pSumMax30min) + " кВт", "Вікно: " + fmtTimeRange(part2.methodGraphic.pSumMax30Window)],
          ["Відносне розходження методів (база: графік 60 хв)", part2.comparison.relativeDiffPercent !== null ? (fmt(part2.comparison.relativeDiffPercent) + " % (" + fmt(part2.comparison.deltaKw) + " кВт)") : "—", "Порівняння різних методологічних баз"]
        ];
        for (var i = 0; i < rows.length; i++) {
          var tr = el("tr");
          tr.appendChild(el("td", "", rows[i][0]));
          tr.appendChild(el("td", "", rows[i][1]));
          tr.appendChild(el("td", "", rows[i][2]));
          tb.appendChild(tr);
        }
        tbl.appendChild(tb);
        cardComp.appendChild(tbl);
        comparisonHost.appendChild(cardComp);
      }

      if (goldenHost && golden) {
        clearEl(goldenHost);
        goldenHost.appendChild(el("h3", "", golden.publishedReference.title || "Контрольний еталон методичних вказівок (Табл. 2.3, стор. 10–11)"));
        goldenHost.appendChild(el("p", "", "Опубліковане дискретне значення в методичних рекомендаціях: " + fmt(golden.publishedReference.valueKw) + " кВт (у вузлі t = " + golden.publishedReference.nodeHour + ":00)."));
        goldenHost.appendChild(el("p", "", "Відтворений дискретний максимум: " + fmt(golden.calculated.pMaxHourly) + " кВт (різниця: " + fmt(golden.validation.discreteDifferenceKw) + " кВт)."));
        goldenHost.appendChild(el("p", "", "Неперервний півгодинний максимум сплайна: " + fmt(golden.calculated.pMax30min) + " кВт у вікні " + fmtTimeRange(golden.calculated.pMax30Window) + " (окрема модельна величина)."));
        goldenHost.appendChild(el("p", "kpi-sub", golden.publishedReference.auditNote));
      }

      if (methodologyHost) {
        clearEl(methodologyHost);
        methodologyHost.appendChild(el("h3", "", "Методологічні засади та межі застосовності"));
        var ul = el("ul", "");
        var notes = [
          "Перехід від миттєвої потужності P [кВт] до добової енергії Wа [кВт·год] виконується інтегруванням за часом із кроком Δt = 1 год.",
          "Розрахункове навантаження за тепловою дією визначається найбільшим 30-хвилинним середнім навантаженням (P30,max); за годинної дискретності АСКОЕ застосовується годинний максимум.",
          "Явище незбіжності максимумів: сумарний максимум на шинах ТП завжди менший або дорівнює арифметичній сумі максимумів окремих споживачів через зсув піків у часі.",
          "Межі дії ДБН В.2.5-23:2025: згідно з п. 1.3 спеціальні транспортні й промислові споживачі (тягові підстанції тощо) виходять за пряму сферу дії норм."
        ];
        for (var n = 0; n < notes.length; n++) ul.appendChild(el("li", "", notes[n]));
        methodologyHost.appendChild(ul);
      }
    }

    function buildPrintReport(state) {
      if (!printSheet) return;
      clearEl(printSheet);
      var r1 = state.results.part1;
      var r2 = state.results.part2;
      var app = state.results.apparent;

      printSheet.appendChild(el("h2", "", "ЗВІТ МОДЕЛЮВАННЯ ДОБОВИХ ГРАФІКІВ НАВАНТАЖЕННЯ (EPPM-LoadLab)"));
      printSheet.appendChild(el("p", "", Data.Academic.university + " · " + Data.Academic.department));
      printSheet.appendChild(el("p", "", "Режим: " + state.mode + " · Варіант №" + state.variantId + " · Перевірив: " + Data.Academic.lecturer));

      if (r1) {
        printSheet.appendChild(el("h3", "", "Частина 1: Індивідуальний житловий будинок"));
        printSheet.appendChild(el("p", "", "Pр.ж.б. (60 хв) = " + fmt(r1.pMaxHourly) + " кВт (о " + r1.tMaxHour + ":00); P30,max (сплайн) = " + fmt(r1.pMax30min) + " кВт; Wа = " + fmt(r1.wTrapezoids) + " кВт·год; Pсер.д = " + fmt(r1.pAvgDaily) + " кВт; Kз.г = " + fmt(r1.kFillHourlyPeak, 3)));
      }
      if (r2 && app) {
        printSheet.appendChild(el("h3", "", "Частина 2: Шини 0,4 кВ ТП"));
        printSheet.appendChild(el("p", "", "Арифметична сума = " + fmt(r2.peaks.arithmeticSum) + " кВт; Графічний максимум = " + fmt(r2.methodGraphic.pSumMaxHourly) + " кВт (" + r2.methodGraphic.tSumMaxHour + ":00); Wа.ТП = " + fmt(r2.methodGraphic.wTotalTp) + " кВт·год; Smax = " + fmt(app.sMax) + " кВА."));
        printSheet.appendChild(el("p", "", "Нормативний ДБН: покриття=" + r2.methodDbn.coverageStatus + ", верифікація=" + r2.methodDbn.normativeVerificationStatus + ", чистий=" + (r2.methodDbn.pDbnStrict !== null ? fmt(r2.methodDbn.pDbnStrict) + " кВт" : "недоступний") + ", з умовними припущеннями=" + (r2.methodDbn.pDbnWithAssumptions !== null ? fmt(r2.methodDbn.pDbnWithAssumptions) + " кВт" : "—")));
      }
    }

    function renderAll(state) {
      toolbar.render(state);
      renderScreen1(state);
      renderScreen2(state);
      renderScreen3(state);
      renderScreen4(state);
    }

    store.subscribe(renderAll);
    renderAll(store.getState());
  }

  window.addEventListener("DOMContentLoaded", initApp);
})(window.EPPMLoadLab.Core, window.EPPMLoadLab.Data, window.EPPMLoadLab.Render, window.EPPMLoadLab.UI);
