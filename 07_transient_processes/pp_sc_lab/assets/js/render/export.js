window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Render = window.PPSCLab.Render || {};

(function (Render) {
  "use strict";

  function downloadText(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadSvg(svgElement, filename) {
    if (!svgElement) return false;
    var serializer = new XMLSerializer();
    var svgStr = serializer.serializeToString(svgElement);
    if (!/^<svg[^>]+xmlns=/.test(svgStr)) {
      svgStr = svgStr.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    downloadText(filename, svgStr, "image/svg+xml;charset=utf-8");
    return true;
  }

  // EXPORT-01: Builds printable protocol directly from CalcResult into dedicated #print-protocol-root
  function printFromCalcResult(state, calcResult, printContainerEl) {
    if (!printContainerEl) return false;
    while (printContainerEl.firstChild) {
      printContainerEl.removeChild(printContainerEl.firstChild);
    }
    var docDom = Render.Protocol.buildDom(state, calcResult);
    printContainerEl.appendChild(docDom);
    window.print();
    return true;
  }

  Render.Export = {
    downloadText: downloadText,
    downloadSvg: downloadSvg,
    printFromCalcResult: printFromCalcResult
  };
})(window.PPSCLab.Render);
