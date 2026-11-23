window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Engine = window.PPSCLab.Engine || {};
window.PPSCLab.Engine.Reduction = window.PPSCLab.Engine.Reduction || {};

(function (Reduction) {
  "use strict";

  var Complex = window.PPSCLab.Core.Complex;

  function reduceGenerator(gen, uStep1Kv, kTApprox) {
    var xGenAtAvgStepOhm = gen.xdPp * (uStep1Kv * uStep1Kv) / gen.sNomMva;
    var xHvOhm = xGenAtAvgStepOhm * (kTApprox * kTApprox);
    var emfPhaseHvKv = Complex.scale(gen.emfGenBasePu, (uStep1Kv / Math.sqrt(3)) * kTApprox);

    return {
      pMw: gen.pMw,
      cosPhi: gen.cosPhi,
      sinPhi: gen.sinPhi,
      sNomMva: gen.sNomMva,
      xGenBasePu: gen.xdPp,
      emfGenBasePu: {
        value: Complex.toSummary(gen.emfGenBasePu),
        unit: "pu",
        quantity: "phase_emf_pu",
        reference: "generator_base"
      },
      emfSysReduced: {
        value: Complex.toSummary(emfPhaseHvKv),
        unit: "kV",
        quantity: "phase_emf_kV",
        reference: "K1"
      },
      xReduced: {
        value: xHvOhm,
        unit: "Ohm",
        reference: "K1"
      },
      _emfCplx: emfPhaseHvKv,
      _xVal: xHvOhm
    };
  }

  function reduceApproxNamed(phys, assumptions) {
    var uStep1Kv = 6.3;
    var uStep2Kv = 115;
    var kTApprox = uStep2Kv / uStep1Kv;

    var tg1 = reduceGenerator(phys.tg1, uStep1Kv, kTApprox);
    var tg2 = reduceGenerator(phys.tg2, uStep1Kv, kTApprox);

    var y1 = 1.0 / tg1._xVal;
    var y2 = 1.0 / tg2._xVal;
    var xEqOhm = 1.0 / (y1 + y2);
    var emfEqHvKv = Complex.scale(
      Complex.add(Complex.scale(tg1._emfCplx, y1), Complex.scale(tg2._emfCplx, y2)),
      xEqOhm
    );

    var x1TrOhm = (phys.transformer.ukPercent / 100.0) * (uStep2Kv * uStep2Kv) / phys.transformer.sNomSelectedMva;
    var x0TrOhm = x1TrOhm * assumptions.x0TrRatio;
    var x1LineOhm = phys.lines.x1EqOhm;
    var x0LineOhm = phys.lines.x0EqOhm;

    return {
      bases: {
        systemType: "named",
        sBaseMva: null,
        uBase1Kv: null,
        uBase2Kv: null,
        iBase1Ka: null,
        iBase2Ka: null,
        transformerRatio: kTApprox
      },
      tg1: tg1,
      tg2: tg2,
      tgEq: {
        emfEq: {
          value: Complex.toSummary(emfEqHvKv),
          unit: "kV",
          quantity: "phase_emf_kV",
          reference: "K1"
        },
        xEq: {
          value: xEqOhm,
          unit: "Ohm",
          reference: "K1"
        },
        _emfCplx: emfEqHvKv,
        _xVal: xEqOhm
      },
      transformer: {
        sRequiredByTaskMva: phys.transformer.sRequiredByTaskMva,
        sNomSelectedMva: phys.transformer.sNomSelectedMva,
        sSumGeneratorsMva: phys.transformer.sSumGeneratorsMva,
        engineeringDeltaMva: phys.transformer.engineeringDeltaMva,
        isOverloadedByFullPower: phys.transformer.isOverloadedByFullPower,
        overloadPercent: phys.transformer.overloadPercent,
        uHvKv: phys.transformer.uHvKv,
        uLvKv: phys.transformer.uLvKv,
        ukPercent: phys.transformer.ukPercent,
        x1Reduced: { value: x1TrOhm, unit: "Ohm", reference: "K1" },
        x0Reduced: { value: x0TrOhm, unit: "Ohm", reference: "K1" }
      },
      lines: {
        x1LineOhmPerKm: phys.lines.x1LineOhmPerKm,
        lengthKm: phys.lines.lengthKm,
        circuits: phys.lines.circuits,
        x1SingleOhm: phys.lines.x1SingleOhm,
        x1EqOhm: phys.lines.x1EqOhm,
        x1Reduced: { value: x1LineOhm, unit: "Ohm", reference: "K1" },
        x0Reduced: { value: x0LineOhm, unit: "Ohm", reference: "K1" }
      }
    };
  }

  Reduction.approx_named = reduceApproxNamed;
})(window.PPSCLab.Engine.Reduction);
