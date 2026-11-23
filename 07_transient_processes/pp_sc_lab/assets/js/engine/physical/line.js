window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Engine = window.PPSCLab.Engine || {};
window.PPSCLab.Engine.Physical = window.PPSCLab.Engine.Physical || {};

(function (Physical) {
  "use strict";

  function buildLineModel(lineInput, k0Line) {
    var x1Spec = lineInput.x1LineOhmPerKm;
    var lengthKm = lineInput.lengthKm;
    var circuits = lineInput.circuits;

    var x1SingleOhm = x1Spec * lengthKm;
    var x1EqOhm = x1SingleOhm / circuits;
    var x0EqOhm = x1EqOhm * k0Line;

    return {
      x1LineOhmPerKm: x1Spec,
      lengthKm: lengthKm,
      circuits: circuits,
      k0Line: k0Line,
      x1SingleOhm: x1SingleOhm,
      x1EqOhm: x1EqOhm,
      x0EqOhm: x0EqOhm
    };
  }

  Physical.Line = {
    build: buildLineModel
  };
})(window.PPSCLab.Engine.Physical);
