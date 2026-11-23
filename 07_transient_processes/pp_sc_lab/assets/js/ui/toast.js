window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.UI = window.PPSCLab.UI || {};

(function (UI) {
  "use strict";

  function showToast(message, durationMs) {
    var container = document.getElementById("toast-container");
    if (!container) return;
    var item = document.createElement("div");
    item.className = "toast-item";
    item.textContent = String(message);
    container.appendChild(item);

    setTimeout(function () {
      if (item.parentNode === container) {
        container.removeChild(item);
      }
    }, durationMs || 2800);
  }

  UI.Toast = {
    show: showToast
  };
})(window.PPSCLab.UI);
