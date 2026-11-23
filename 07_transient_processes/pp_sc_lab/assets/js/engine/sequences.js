window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Engine = window.PPSCLab.Engine || {};

(function (Engine) {
  "use strict";

  function buildSequenceNetworks(reduced, faultType) {
    var unit = reduced.bases.systemType === "pu" ? "pu" : "Ohm";
    var x1Gen = reduced.tgEq.xEq.value;
    var x1Tr = reduced.transformer.x1Reduced.value;
    var x1Line = reduced.lines.x1Reduced.value;
    var x1Total = x1Gen + x1Tr + x1Line;

    // Course assumption: negative-sequence total reactance equals positive-sequence
    var x2Total = x1Total;

    // Zero-sequence loop closes through L1||L2 and grounded HV neutral of T1 (Delta blocks generators)
    var x0Tr = reduced.transformer.x0Reduced.value;
    var x0Line = reduced.lines.x0Reduced.value;
    var x0Total = x0Tr + x0Line;

    return {
      positive: {
        xTotal: x1Total,
        unit: unit,
        includesGenerators: true,
        components: { xGenEq: x1Gen, xTr: x1Tr, xLineEq: x1Line }
      },
      negative: {
        xTotal: x2Total,
        unit: unit,
        assumesEqualsPositive: true,
        includesGenerators: true,
        components: { xGenEq: x1Gen, xTr: x1Tr, xLineEq: x1Line }
      },
      zero: {
        xTotal: x0Total,
        unit: unit,
        includesGenerators: false,
        activeForFault: faultType === "K1" || faultType === "K11",
        components: { xTr: x0Tr, xLineEq: x0Line }
      }
    };
  }

  Engine.Sequences = {
    build: buildSequenceNetworks
  };
})(window.PPSCLab.Engine);
