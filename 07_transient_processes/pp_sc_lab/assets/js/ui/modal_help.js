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

  function openModal() {
    var backdrop = document.getElementById("modal-help-backdrop");
    if (!backdrop) return;
    while (backdrop.firstChild) backdrop.removeChild(backdrop.firstChild);

    var win = el("div", "modal-window");
    var topRow = el("div", "card-title");
    topRow.appendChild(el("span", null, "Методика розрахунку та наукові першоджерела"));
    var closeBtn = el("button", "btn", "Закрити");
    closeBtn.type = "button";
    closeBtn.addEventListener("click", closeModal);
    topRow.appendChild(closeBtn);
    win.appendChild(topRow);

    var sections = Data.Help.sections;
    for (var i = 0; i < sections.length; i += 1) {
      var sec = sections[i];
      var h = el("h3", null, sec.title);
      h.style.margin = "12px 0 6px 0";
      h.style.color = "var(--brand-navy)";
      win.appendChild(h);
      for (var p = 0; p < sec.paragraphs.length; p += 1) {
        var para = el("p", null, sec.paragraphs[p]);
        para.style.margin = "4px 0 8px 0";
        para.style.lineHeight = "1.45";
        win.appendChild(para);
      }
    }

    var bibH = el("h3", null, "Нормативна та навчальна література");
    bibH.style.margin = "12px 0 6px 0";
    bibH.style.color = "var(--brand-navy)";
    win.appendChild(bibH);

    var ul = el("ul");
    ul.style.paddingLeft = "18px";
    for (var b = 0; b < Data.Help.bibliography.length; b += 1) {
      var li = el("li", null, Data.Help.bibliography[b]);
      li.style.marginBottom = "4px";
      ul.appendChild(li);
    }
    win.appendChild(ul);

    backdrop.appendChild(win);
    backdrop.classList.remove("hidden");

    backdrop.onclick = function (ev) {
      if (ev.target === backdrop) closeModal();
    };
  }

  function closeModal() {
    var backdrop = document.getElementById("modal-help-backdrop");
    if (backdrop) backdrop.classList.add("hidden");
  }

  UI.HelpModal = {
    open: openModal,
    close: closeModal
  };
})(window.PPSCLab.UI);
