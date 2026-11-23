window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Engine = window.PPSCLab.Engine || {};
window.PPSCLab.Engine.Physical = window.PPSCLab.Engine.Physical || {};

(function (Physical) {
  "use strict";

  function buildTransformerModel(trInput, tg1Model, tg2Model, x0TrRatio) {
    var sNomMva = trInput.sNomMva;
    var uHvKv = trInput.uHvKv;
    var uLvKv = trInput.uLvKv;
    var ukPercent = trInput.ukPercent;
    var kTExact = uHvKv / uLvKv;

    // Physical phase reactance referred to HV winding nominal voltage (uHvKv)
    var x1PhysHvOhm = (ukPercent / 100.0) * (uHvKv * uHvKv) / sNomMva;
    var x0PhysHvOhm = x1PhysHvOhm * x0TrRatio;

    var sRequiredByTaskMva = trInput.sRequiredByTaskMva;
    var sSumGeneratorsMva = tg1Model.sNomMva + tg2Model.sNomMva;
    var engineeringDeltaMva = sNomMva - sSumGeneratorsMva;
    var isOverloadedByFullPower = engineeringDeltaMva < -1e-9;
    var overloadPercent = isOverloadedByFullPower ? (-engineeringDeltaMva / sNomMva) * 100.0 : 0.0;

    return {
      sRequiredByTaskMva: sRequiredByTaskMva,
      sNomSelectedMva: sNomMva,
      sSumGeneratorsMva: sSumGeneratorsMva,
      engineeringDeltaMva: engineeringDeltaMva,
      isOverloadedByFullPower: isOverloadedByFullPower,
      overloadPercent: overloadPercent,
      uHvKv: uHvKv,
      uLvKv: uLvKv,
      kTExact: kTExact,
      ukPercent: ukPercent,
      windingGroup: trInput.windingGroup,
      x1PhysHvOhm: x1PhysHvOhm,
      x0PhysHvOhm: x0PhysHvOhm
    };
  }

  Physical.Transformer = {
    build: buildTransformerModel
  };
})(window.PPSCLab.Engine.Physical);
