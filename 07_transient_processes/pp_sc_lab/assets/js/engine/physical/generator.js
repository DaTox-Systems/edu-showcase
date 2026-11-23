window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Engine = window.PPSCLab.Engine || {};
window.PPSCLab.Engine.Physical = window.PPSCLab.Engine.Physical || {};

(function (Physical) {
  "use strict";

  var Complex = window.PPSCLab.Core.Complex;

  function computeEmfGenBasePu(xdPp, cosPhi, sinPhi, emfModel) {
    if (emfModel === "typical_108") {
      return Complex.create(1.08, 0);
    }
    if (emfModel === "simplified_100") {
      return Complex.create(1.0, 0);
    }
    // Rated pre-fault regime: U* = 1.0<0, I* = cos(phi) - j*sin(phi), E'' = U* + j*xd''*I*
    return Complex.create(1.0 + xdPp * sinPhi, xdPp * cosPhi);
  }

  function buildGeneratorModel(genInput, uGenNomKv, emfModel) {
    var pMw = genInput.pMw;
    var cosPhi = genInput.cosPhi;
    var xdPp = genInput.xdPp;
    var sinPhi = Math.sqrt(Math.max(0, 1.0 - cosPhi * cosPhi));
    var sNomMva = pMw / cosPhi;
    var emfGenBasePu = computeEmfGenBasePu(xdPp, cosPhi, sinPhi, emfModel);
    var xGenBaseOhmAtNom = xdPp * (uGenNomKv * uGenNomKv) / sNomMva;

    return {
      pMw: pMw,
      cosPhi: cosPhi,
      sinPhi: sinPhi,
      sNomMva: sNomMva,
      xdPp: xdPp,
      uGenNomKv: uGenNomKv,
      emfGenBasePu: emfGenBasePu,
      xGenBaseOhmAtNom: xGenBaseOhmAtNom
    };
  }

  Physical.Generator = {
    build: buildGeneratorModel
  };
})(window.PPSCLab.Engine.Physical);
