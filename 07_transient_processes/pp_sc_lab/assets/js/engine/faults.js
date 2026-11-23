window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Engine = window.PPSCLab.Engine || {};

(function (Engine) {
  "use strict";

  var Complex = window.PPSCLab.Core.Complex;
  var A_OP = Complex.fromPolar(1.0, 120.0);
  var A2_OP = Complex.fromPolar(1.0, 240.0);

  function symToPhase(i0, i1, i2) {
    var iA = Complex.add(i0, Complex.add(i1, i2));
    var iB = Complex.add(i0, Complex.add(Complex.mul(A2_OP, i1), Complex.mul(A_OP, i2)));
    var iC = Complex.add(i0, Complex.add(Complex.mul(A_OP, i1), Complex.mul(A2_OP, i2)));
    return { iA: iA, iB: iB, iC: iC };
  }

  function solveThreePhase(emfEq, x1Total, scaleToKa, seqUnit) {
    var z1 = Complex.create(0, x1Total);
    var i1 = Complex.div(emfEq, z1);
    var iFaultKa = Complex.mag(i1) * scaleToKa;

    return {
      i1Seq: {
        value: Complex.toSummary(i1),
        unit: seqUnit,
        reference: "K1"
      },
      iFaultKa: iFaultKa
    };
  }

  function solveUnsymmetrical(emfEq, seq, faultType, scaleToKa, seqUnit) {
    var x1 = seq.positive.xTotal;
    var x2 = seq.negative.xTotal;
    var x0 = seq.zero.xTotal;

    var i1, i2, i0;
    var u1 = null, u2 = null, u0 = null;
    var phaseVoltagesAtFault = null;

    if (faultType === "K2") {
      // Phase B-C fault without ground
      i1 = Complex.div(emfEq, Complex.create(0, x1 + x2));
      i2 = Complex.scale(i1, -1.0);
      i0 = Complex.create(0, 0);
    } else if (faultType === "K1") {
      // Phase A to ground fault
      i1 = Complex.div(emfEq, Complex.create(0, x1 + x2 + x0));
      i2 = i1;
      i0 = i1;
    } else if (faultType === "K11") {
      // Phases B-C to ground fault
      var xDelta = (x2 * x0) / (x2 + x0);
      i1 = Complex.div(emfEq, Complex.create(0, x1 + xDelta));
      i2 = Complex.scale(i1, -x0 / (x2 + x0));
      i0 = Complex.scale(i1, -x2 / (x2 + x0));

      u1 = Complex.sub(emfEq, Complex.mul(Complex.create(0, x1), i1));
      u2 = Complex.scale(Complex.mul(Complex.create(0, x2), i2), -1.0);
      u0 = Complex.scale(Complex.mul(Complex.create(0, x0), i0), -1.0);
      var phU = symToPhase(u0, u1, u2);
      phaseVoltagesAtFault = {
        uA: Complex.toSummary(phU.iA),
        uB: Complex.toSummary(phU.iB),
        uC: Complex.toSummary(phU.iC)
      };
    } else {
      throw new Error("Unsupported unsymmetrical fault type: " + String(faultType));
    }

    var phasesRaw = symToPhase(i0, i1, i2);
    var iAKa = Complex.scale(phasesRaw.iA, scaleToKa);
    var iBKa = Complex.scale(phasesRaw.iB, scaleToKa);
    var iCKa = Complex.scale(phasesRaw.iC, scaleToKa);

    var iPrimaryKa;
    var iGroundKa;
    if (faultType === "K1") {
      iPrimaryKa = Complex.mag(iAKa);
      iGroundKa = iPrimaryKa;
    } else if (faultType === "K2") {
      iPrimaryKa = Complex.mag(iBKa);
      iGroundKa = 0;
    } else {
      iPrimaryKa = Complex.mag(iBKa);
      iGroundKa = 3.0 * Complex.mag(i0) * scaleToKa;
    }

    return {
      faultType: faultType,
      sequenceCurrents: {
        i1: { value: Complex.toSummary(i1), unit: seqUnit, reference: "K1" },
        i2: { value: Complex.toSummary(i2), unit: seqUnit, reference: "K1" },
        i0: { value: Complex.toSummary(i0), unit: seqUnit, reference: "K1" }
      },
      sequenceCurrentsKa: {
        i1: Complex.toSummary(Complex.scale(i1, scaleToKa)),
        i2: Complex.toSummary(Complex.scale(i2, scaleToKa)),
        i0: Complex.toSummary(Complex.scale(i0, scaleToKa))
      },
      phaseCurrentsKa: {
        iA: Complex.toSummary(iAKa),
        iB: Complex.toSummary(iBKa),
        iC: Complex.toSummary(iCKa)
      },
      phaseVoltagesAtFault: phaseVoltagesAtFault,
      iFaultPrimaryKa: iPrimaryKa,
      iGroundKa: iGroundKa
    };
  }

  function solveAll(reduced, seq, faultType) {
    var isPu = reduced.bases.systemType === "pu";
    // For named system (phase kV / Ohm), result is directly in kA (1 kV / 1 Ohm = 1 kA)
    var scaleToKa = isPu ? reduced.bases.iBase2Ka : 1.0;
    var seqUnit = isPu ? "pu" : "kA";
    var emfEq = reduced.tgEq._emfCplx;

    return {
      k3: solveThreePhase(emfEq, seq.positive.xTotal, scaleToKa, seqUnit),
      kn: solveUnsymmetrical(emfEq, seq, faultType, scaleToKa, seqUnit)
    };
  }

  Engine.Faults = {
    solve: solveAll
  };
})(window.PPSCLab.Engine);
