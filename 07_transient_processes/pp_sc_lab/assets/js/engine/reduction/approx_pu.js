window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Engine = window.PPSCLab.Engine || {};
window.PPSCLab.Engine.Reduction = window.PPSCLab.Engine.Reduction || {};

(function (Reduction) {
  "use strict";

  var Complex = window.PPSCLab.Core.Complex;

  function reduceGenerator(gen, sBaseMva) {
    // In approximate reduction, step voltage equals generator average voltage (6.3 kV)
    var emfSysPu = Complex.create(gen.emfGenBasePu.re, gen.emfGenBasePu.im);
    var xSysPu = gen.xdPp * (sBaseMva / gen.sNomMva);

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
        value: Complex.toSummary(emfSysPu),
        unit: "pu",
        quantity: "phase_emf_pu",
        reference: "system_base"
      },
      xReduced: {
        value: xSysPu,
        unit: "pu",
        reference: "system_base"
      },
      _emfCplx: emfSysPu,
      _xVal: xSysPu
    };
  }

  function reduceApproxPu(phys, assumptions) {
    var sBaseMva = assumptions.sBaseMva;
    var uBase1Kv = 6.3;
    var uBase2Kv = 115;
    var kTApprox = uBase2Kv / uBase1Kv;
    var iBase1Ka = sBaseMva / (Math.sqrt(3) * uBase1Kv);
    var iBase2Ka = sBaseMva / (Math.sqrt(3) * uBase2Kv);

    var tg1 = reduceGenerator(phys.tg1, sBaseMva);
    var tg2 = reduceGenerator(phys.tg2, sBaseMva);

    var y1 = 1.0 / tg1._xVal;
    var y2 = 1.0 / tg2._xVal;
    var xEq = 1.0 / (y1 + y2);
    var emfEq = Complex.scale(
      Complex.add(Complex.scale(tg1._emfCplx, y1), Complex.scale(tg2._emfCplx, y2)),
      xEq
    );

    var x1TrPu = (phys.transformer.ukPercent / 100.0) * (sBaseMva / phys.transformer.sNomSelectedMva);
    var x0TrPu = x1TrPu * assumptions.x0TrRatio;

    var x1LinePu = phys.lines.x1EqOhm * (sBaseMva / (uBase2Kv * uBase2Kv));
    var x0LinePu = phys.lines.x0EqOhm * (sBaseMva / (uBase2Kv * uBase2Kv));

    return {
      bases: {
        systemType: "pu",
        sBaseMva: sBaseMva,
        uBase1Kv: uBase1Kv,
        uBase2Kv: uBase2Kv,
        iBase1Ka: iBase1Ka,
        iBase2Ka: iBase2Ka,
        transformerRatio: kTApprox
      },
      tg1: tg1,
      tg2: tg2,
      tgEq: {
        emfEq: {
          value: Complex.toSummary(emfEq),
          unit: "pu",
          quantity: "phase_emf_pu",
          reference: "system_base"
        },
        xEq: {
          value: xEq,
          unit: "pu",
          reference: "system_base"
        },
        _emfCplx: emfEq,
        _xVal: xEq
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
        x1Reduced: { value: x1TrPu, unit: "pu", reference: "system_base" },
        x0Reduced: { value: x0TrPu, unit: "pu", reference: "system_base" }
      },
      lines: {
        x1LineOhmPerKm: phys.lines.x1LineOhmPerKm,
        lengthKm: phys.lines.lengthKm,
        circuits: phys.lines.circuits,
        x1SingleOhm: phys.lines.x1SingleOhm,
        x1EqOhm: phys.lines.x1EqOhm,
        x1Reduced: { value: x1LinePu, unit: "pu", reference: "system_base" },
        x0Reduced: { value: x0LinePu, unit: "pu", reference: "system_base" }
      }
    };
  }

  Reduction.approx_pu = reduceApproxPu;
})(window.PPSCLab.Engine.Reduction);
