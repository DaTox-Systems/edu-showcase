window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.UI = window.PPSCLab.UI || {};

(function (UI) {
  "use strict";

  var Data = window.PPSCLab.Data;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function openTaskModal(currentVariant) {
    var backdrop = document.getElementById("modal-task-backdrop");
    if (!backdrop) return;
    while (backdrop.firstChild) backdrop.removeChild(backdrop.firstChild);

    var curN = typeof currentVariant === "number" ? currentVariant : 7;
    var faultType = Data.Variants.getFaultTypeForVariant(curN);
    var faultObj = Data.Variants.FAULT_TYPES[faultType];
    var methodKey = Data.Variants.getPdfMethodForVariant(curN);
    var methodLabel = methodKey ? Data.Variants.METHODS[methodKey].labelUk : "Не призначено таблицею PDF (N ≥ 33)";

    var win = el("div", "modal-window modal-window-lg");

    // Header
    var topRow = el("div", "card-title");
    topRow.style.marginBottom = "12px";
    topRow.appendChild(el("span", null, "Оригінальне завдання: «Розрахункове завдання (контроль, практика)»"));
    var closeBtn = el("button", "btn", "Закрити ✕");
    closeBtn.type = "button";
    closeBtn.addEventListener("click", closeTaskModal);
    topRow.appendChild(closeBtn);
    win.appendChild(topRow);

    // Action bar with direct links to the physical PDF
    var actionsBar = el("div", "toolbar-group");
    actionsBar.style.marginBottom = "12px";
    actionsBar.style.justifyContent = "space-between";

    var leftActions = el("div", "toolbar-group");
    var openPdfLink = el("a", "btn btn-primary", "↗️ Відкрити PDF у новій вкладці");
    openPdfLink.href = "assets/docs/task_brief.pdf";
    openPdfLink.target = "_blank";
    leftActions.appendChild(openPdfLink);

    var downloadPdfLink = el("a", "btn", "⬇️ Завантажити task_brief.pdf");
    downloadPdfLink.href = "assets/docs/task_brief.pdf";
    downloadPdfLink.setAttribute("download", "Розрахункове завдання_Контроль_Практика.pdf");
    leftActions.appendChild(downloadPdfLink);
    actionsBar.appendChild(leftActions);

    var curBadge = el("span", "badge badge-ok", "Активний варіант: №" + curN);
    curBadge.style.fontSize = "12px";
    curBadge.style.padding = "4px 10px";
    actionsBar.appendChild(curBadge);
    win.appendChild(actionsBar);

    // Active variant summary banner
    var banner = el("div", "notice-box");
    banner.style.marginBottom = "14px";
    var bText = "Поточний вибір у лабораторії: Варіант №" + curN +
      " ➔ Несиметричне КЗ: " + faultObj.symbol + " (" + faultObj.labelUk + ")" +
      " ➔ Метод за бланком: " + methodLabel + ".";
    banner.appendChild(el("strong", null, bText));
    win.appendChild(banner);

    // Embedded PDF viewer frame
    var frameWrap = el("div", "pdf-frame-container");
    frameWrap.style.width = "100%";
    frameWrap.style.height = "520px";
    frameWrap.style.border = "1px solid var(--border)";
    frameWrap.style.borderRadius = "var(--radius)";
    frameWrap.style.marginBottom = "14px";
    frameWrap.style.background = "#525659";

    var iframe = el("iframe");
    iframe.src = "assets/docs/task_brief.pdf#toolbar=1&navpanes=0&view=FitH";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    frameWrap.appendChild(iframe);
    win.appendChild(frameWrap);

    // Matrix Quick Reference with live variant highlight
    var refCard = el("div", "card");
    refCard.style.marginTop = "10px";
    refCard.appendChild(el("div", "card-title", "Зведена матриця розподілу варіантів (із бланка завдань)"));

    var tbl = el("table", "data-table");
    var thead = el("thead");
    var trH = el("tr");
    trH.appendChild(el("th", null, "Параметр"));
    trH.appendChild(el("th", null, "Група / Категорія"));
    trH.appendChild(el("th", null, "Перелік номерів варіантів (N)"));
    thead.appendChild(trH);
    tbl.appendChild(thead);

    var tbody = el("tbody");
    var rowsData = [
      { cat: "Вид несиметричного КЗ", label: "К(2) (двофазне без землі)", list: [1,4,7,10,13,16,19,22,25,28,31,34] },
      { cat: "Вид несиметричного КЗ", label: "К(1,1) (двофазне на землю)", list: [2,5,8,11,14,17,20,23,26,29,32,35] },
      { cat: "Вид несиметричного КЗ", label: "К(1) (однофазне на землю)", list: [3,6,9,12,15,18,21,24,27,30,33,36] },
      { cat: "Метод розрахунку", label: "Точним приведенням у відносних одиницях", list: [1,5,9,13,17,21,25,29] },
      { cat: "Метод розрахунку", label: "Наближеним приведенням в іменованих одиницях", list: [2,6,10,14,18,22,26,30] },
      { cat: "Метод розрахунку", label: "Наближеним приведенням у відносних одиницях", list: [3,7,11,15,19,23,27,31] },
      { cat: "Метод розрахунку", label: "Точним приведенням в іменованих одиницях", list: [4,8,12,16,20,24,28,32] }
    ];

    for (var r = 0; r < rowsData.length; r += 1) {
      var row = rowsData[r];
      var tr = el("tr");
      var isHighlighted = row.list.indexOf(curN) !== -1;
      if (isHighlighted) {
        tr.style.background = "var(--bg-info-soft)";
        tr.style.fontWeight = "600";
      }

      tr.appendChild(el("td", null, row.cat));
      tr.appendChild(el("td", null, row.label));

      var tdList = el("td", "mono");
      for (var k = 0; k < row.list.length; k += 1) {
        var num = row.list[k];
        if (num === curN) {
          var hSpan = el("span", "badge badge-ok", String(num));
          hSpan.style.margin = "0 3px";
          tdList.appendChild(hSpan);
        } else {
          tdList.appendChild(document.createTextNode((k > 0 ? ", " : "") + String(num)));
        }
      }
      tr.appendChild(tdList);
      tbody.appendChild(tr);
    }
    tbl.appendChild(tbody);
    refCard.appendChild(tbl);
    win.appendChild(refCard);

    backdrop.appendChild(win);
    backdrop.classList.remove("hidden");

    backdrop.onclick = function (ev) {
      if (ev.target === backdrop) closeTaskModal();
    };
  }

  function closeTaskModal() {
    var backdrop = document.getElementById("modal-task-backdrop");
    if (backdrop) backdrop.classList.add("hidden");
  }

  UI.TaskModal = {
    open: openTaskModal,
    close: closeTaskModal
  };
})(window.PPSCLab.UI);