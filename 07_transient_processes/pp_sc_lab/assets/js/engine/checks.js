window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Engine = window.PPSCLab.Engine || {};

(function (Engine) {
  "use strict";

  var Complex = window.PPSCLab.Core.Complex;
  var EPS_ABS = 1e-11;
  var EPS_REL = 1e-11;

  function mixedDiffOk(a, b) {
    var diff = Math.abs(a - b);
    var tol = EPS_ABS + EPS_REL * Math.max(Math.abs(a), Math.abs(b));
    return { passed: diff <= tol, error: diff };
  }

  function mixedComplexDiffOk(za, zb) {
    var diff = Complex.diffMag(za, zb);
    var tol = EPS_ABS + EPS_REL * Math.max(Complex.mag(za), Complex.mag(zb));
    return { passed: diff <= tol, error: diff };
  }

  function runSinglePipeline(phys, methodId, assumptions, faultType) {
    var red = Engine.Reduction[methodId](phys, assumptions);
    var seq = Engine.Sequences.build(red, faultType);
    var flt = Engine.Faults.solve(red, seq, faultType);
    return { reduced: red, seq: seq, faults: flt };
  }

  function getEmfPhaseHvKv(reduced, methodId) {
    if (methodId === "exact_pu") {
      return Complex.scale(reduced.tgEq._emfCplx, reduced.bases.uBase2Kv / Math.sqrt(3));
    }
    if (methodId === "approx_pu") {
      return Complex.scale(reduced.tgEq._emfCplx, reduced.bases.uBase2Kv / Math.sqrt(3));
    }
    return reduced.tgEq._emfCplx;
  }

  function runInvariantChecks(phys, primaryOut, methodId, assumptions, faultType) {
    var checks = [];
    var red = primaryOut.reduced;
    var seq = primaryOut.seq;
    var flt = primaryOut.faults;

    // Cross-method pair (INV-01 for exact, INV-02 for approx, plus INV-EMF-01)
    var isExact = methodId === "exact_pu" || methodId === "exact_named";
    var pairMethod = isExact
      ? (methodId === "exact_pu" ? "exact_named" : "exact_pu")
      : (methodId === "approx_pu" ? "approx_named" : "approx_pu");
    var pairOut = runSinglePipeline(phys, pairMethod, assumptions, faultType);

    var dK3 = mixedDiffOk(flt.k3.iFaultKa, pairOut.faults.k3.iFaultKa);
    var dKn = mixedDiffOk(flt.kn.iFaultPrimaryKa, pairOut.faults.kn.iFaultPrimaryKa);
    checks.push({
      id: isExact ? "INV-01" : "INV-02",
      name: isExact ? "Тотожність exact_pu == exact_named (кА)" : "Тотожність approx_pu == approx_named (кА)",
      passed: dK3.passed && dKn.passed,
      error: Math.max(dK3.error, dKn.error)
    });

    var emfA = getEmfPhaseHvKv(red, methodId);
    var emfB = getEmfPhaseHvKv(pairOut.reduced, pairMethod);
    var dEmf = mixedComplexDiffOk(emfA, emfB);
    checks.push({
      id: "INV-EMF-01",
      name: "Тотожність фізичної фазної ЕРС на стороні K1",
      passed: dEmf.passed,
      error: dEmf.error
    });

    // Base power invariance (INV-EMF-02 & INV-11) for pu methods
    if (red.bases.systemType === "pu") {
      var altAssump = Object.assign({}, assumptions, { sBaseMva: assumptions.sBaseMva === 1000 ? 63 : 1000 });
      var altOut = runSinglePipeline(phys, methodId, altAssump, faultType);
      var dEmfAlt = mixedComplexDiffOk(emfA, getEmfPhaseHvKv(altOut.reduced, methodId));
      var dAltK3 = mixedDiffOk(flt.k3.iFaultKa, altOut.faults.k3.iFaultKa);
      var dAltKn = mixedDiffOk(flt.kn.iFaultPrimaryKa, altOut.faults.kn.iFaultPrimaryKa);

      checks.push({
        id: "INV-EMF-02",
        name: "Незмінність фізичної ЕРС при зміні бази S_б",
        passed: dEmfAlt.passed,
        error: dEmfAlt.error
      });
      checks.push({
        id: "INV-11",
        name: "Незмінність струмів КЗ при зміні бази S_б",
        passed: dAltK3.passed && dAltKn.passed,
        error: Math.max(dAltK3.error, dAltKn.error)
      });
    }

    // Sequence network invariants
    var dX2 = mixedDiffOk(seq.negative.xTotal, seq.positive.xTotal);
    checks.push({
      id: "INV-03",
      name: "Курсова рівність X_2Σ == X_1Σ",
      passed: dX2.passed && seq.negative.assumesEqualsPositive === true,
      error: dX2.error
    });

    var dX0 = mixedDiffOk(seq.zero.xTotal, red.transformer.x0Reduced.value + red.lines.x0Reduced.value);
    checks.push({
      id: "INV-04",
      name: "Склад X_0Σ без генераторів (T1 + L1||L2)",
      passed: dX0.passed && seq.zero.includesGenerators === false,
      error: dX0.error
    });

    // Fault boundary conditions (INV-05..10)
    var sc = flt.kn.sequenceCurrentsKa;
    var pc = flt.kn.phaseCurrentsKa;

    if (faultType === "K2") {
      var dI0 = mixedDiffOk(sc.i0.mag, 0);
      var dIA = mixedDiffOk(pc.iA.mag, 0);
      var dBC = mixedComplexDiffOk(pc.iB, Complex.scale(pc.iC, -1));
      checks.push({
        id: "INV-05",
        name: "Граничні умови K(2): I_0 = 0, I_A = 0, I_B = -I_C",
        passed: dI0.passed && dIA.passed && dBC.passed,
        error: Math.max(dI0.error, dIA.error, dBC.error)
      });
    } else if (faultType === "K1") {
      var d12 = mixedComplexDiffOk(sc.i1, sc.i2);
      var d10 = mixedComplexDiffOk(sc.i1, sc.i0);
      var dIB = mixedDiffOk(pc.iB.mag, 0);
      var dIC = mixedDiffOk(pc.iC.mag, 0);
      checks.push({
        id: "INV-06",
        name: "Граничні умови K(1): I_1 = I_2 = I_0, I_B = I_C = 0",
        passed: d12.passed && d10.passed && dIB.passed && dIC.passed,
        error: Math.max(d12.error, d10.error, dIB.error, dIC.error)
      });
    } else if (faultType === "K11") {
      var dA0 = mixedDiffOk(pc.iA.mag, 0);
      var dEqBC = mixedDiffOk(pc.iB.mag, pc.iC.mag);
      var dGnd = mixedDiffOk(flt.kn.iGroundKa, 3.0 * sc.i0.mag);
      var uFault = flt.kn.phaseVoltagesAtFault;
      var dUB = mixedDiffOk(uFault.uB.mag, 0);
      var dUC = mixedDiffOk(uFault.uC.mag, 0);

      checks.push({ id: "INV-07", name: "K(1,1): I_A == 0", passed: dA0.passed, error: dA0.error });
      checks.push({ id: "INV-08", name: "K(1,1): |I_B| == |I_C|", passed: dEqBC.passed, error: dEqBC.error });
      checks.push({ id: "INV-09", name: "K(1,1): I_зем == 3|I_0|", passed: dGnd.passed, error: dGnd.error });
      checks.push({ id: "INV-10", name: "K(1,1): U_B == U_C == 0", passed: dUB.passed && dUC.passed, error: Math.max(dUB.error, dUC.error) });
    }

    var allPassed = true;
    for (var i = 0; i < checks.length; i += 1) {
      if (!checks[i].passed) {
        allPassed = false;
        break;
      }
    }
    return { allPassed: allPassed, checks: checks };
  }

  Engine.Checks = {
    mixedDiffOk: mixedDiffOk,
    mixedComplexDiffOk: mixedComplexDiffOk,
    runInvariantChecks: runInvariantChecks
  };
})(window.PPSCLab.Engine);
