window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Data = window.PPSCLab.Data || {};

(function (Data) {
  "use strict";

  var TRANSFORMER_POWER_SCALE_MVA = [
    1.6, 2.5, 4, 6.3, 10, 16, 25, 40,
    63, 80, 100, 125, 160, 250, 400
  ];

  var METHODS = {
    exact_pu: {
      id: "exact_pu",
      labelUk: "Точне приведення у відносних одиницях",
      shortLabel: "Точне в.о.",
      systemType: "pu",
      isExact: true
    },
    approx_named: {
      id: "approx_named",
      labelUk: "Наближене приведення в іменованих одиницях",
      shortLabel: "Наближене імен.",
      systemType: "named",
      isExact: false
    },
    approx_pu: {
      id: "approx_pu",
      labelUk: "Наближене приведення у відносних одиницях",
      shortLabel: "Наближене в.о.",
      systemType: "pu",
      isExact: false
    },
    exact_named: {
      id: "exact_named",
      labelUk: "Точне приведення в іменованих одиницях",
      shortLabel: "Точне імен.",
      systemType: "named",
      isExact: true
    }
  };

  var FAULT_TYPES = {
    K3: { id: "K3", symbol: "K(3)", labelUk: "Трифазне КЗ" },
    K2: { id: "K2", symbol: "K(2)", labelUk: "Двофазне КЗ без землі" },
    K11: { id: "K11", symbol: "K(1,1)", labelUk: "Двофазне КЗ на землю" },
    K1: { id: "K1", symbol: "K(1)", labelUk: "Однофазне КЗ на землю" }
  };

  var DEFAULT_ASSUMPTIONS = {
    uGenNomKv: 6.3,
    k0Line: 4.0,
    x0TrRatio: 1.0,
    emfModel: "rated_complex",
    sBaseMva: 100
  };

  function getMethodBase(methodId, transformerUhvKv, transformerUlvKv) {
    var uHv = typeof transformerUhvKv === "number" ? transformerUhvKv : 114;
    var uLv = typeof transformerUlvKv === "number" ? transformerUlvKv : 6.4;
    var kTExact = uHv / uLv;

    switch (methodId) {
      case "exact_pu":
        return {
          systemType: "pu",
          uBase2Kv: 110,
          uBase1Kv: 110 / kTExact,
          kT: kTExact
        };
      case "approx_pu":
        return {
          systemType: "pu",
          uBase2Kv: 115,
          uBase1Kv: 6.3,
          kT: 115 / 6.3
        };
      case "exact_named":
        return {
          systemType: "named",
          uBase2Kv: null,
          uBase1Kv: null,
          kT: kTExact
        };
      case "approx_named":
        return {
          systemType: "named",
          uBase2Kv: null,
          uBase1Kv: null,
          kT: 115 / 6.3
        };
      default:
        throw new Error("Unknown reduction method: " + String(methodId));
    }
  }

  function selectStandardTransformerMva(requiredMva) {
    for (var i = 0; i < TRANSFORMER_POWER_SCALE_MVA.length; i += 1) {
      if (TRANSFORMER_POWER_SCALE_MVA[i] >= requiredMva) {
        return TRANSFORMER_POWER_SCALE_MVA[i];
      }
    }
    return null;
  }

  function getFaultTypeForVariant(n) {
    var mod = n % 3;
    if (mod === 1) return "K2";
    if (mod === 2) return "K11";
    return "K1";
  }

  function methodByMod4(n) {
    var mod = n % 4;
    if (mod === 1) return "exact_pu";
    if (mod === 2) return "approx_named";
    if (mod === 3) return "approx_pu";
    return "exact_named";
  }

  // Official PDF method table covers N = 1..32; N = 33..36 are intentionally unassigned.
  function getPdfMethodForVariant(n) {
    if (!Number.isInteger(n) || n < 1 || n > 32) {
      return null;
    }
    return methodByMod4(n);
  }

  function getExtrapolatedMethodForVariant(n) {
    if (!Number.isInteger(n) || n < 1 || n > 36) {
      return null;
    }
    return methodByMod4(n);
  }

  function buildVariantRawInput(n) {
    var pTg1Mw = 20 + n;
    var pTg2Mw = 15 + 2 * n;
    var sRequiredT1 = pTg1Mw + pTg2Mw;
    var sNomT1Mva = selectStandardTransformerMva(sRequiredT1);

    return {
      tg1: {
        pMw: pTg1Mw,
        cosPhi: 0.85,
        xdPp: 0.12
      },
      tg2: {
        pMw: pTg2Mw,
        cosPhi: 0.90,
        xdPp: 0.14
      },
      transformer: {
        sRequiredByTaskMva: sRequiredT1,
        sNomMva: sNomT1Mva,
        uHvKv: 114,
        uLvKv: 6.4,
        ukPercent: 10.5,
        windingGroup: "Delta/Y0"
      },
      lines: {
        x1LineOhmPerKm: 0.42,
        lengthKm: 7 + n,
        circuits: 2
      }
    };
  }

  function buildAllVariantsSummary() {
    var list = [];
    for (var n = 1; n <= 36; n += 1) {
      var raw = buildVariantRawInput(n);
      list.push({
        n: n,
        faultType: getFaultTypeForVariant(n),
        pdfMethod: getPdfMethodForVariant(n),
        extrapolatedMethod: getExtrapolatedMethodForVariant(n),
        pTg1Mw: raw.tg1.pMw,
        pTg2Mw: raw.tg2.pMw,
        sNomT1Mva: raw.transformer.sNomMva,
        lengthKm: raw.lines.lengthKm
      });
    }
    return list;
  }

  Data.Variants = {
    TRANSFORMER_POWER_SCALE_MVA: TRANSFORMER_POWER_SCALE_MVA,
    METHODS: METHODS,
    FAULT_TYPES: FAULT_TYPES,
    DEFAULT_ASSUMPTIONS: DEFAULT_ASSUMPTIONS,
    selectStandardTransformerMva: selectStandardTransformerMva,
    getMethodBase: getMethodBase,
    getFaultTypeForVariant: getFaultTypeForVariant,
    getPdfMethodForVariant: getPdfMethodForVariant,
    getExtrapolatedMethodForVariant: getExtrapolatedMethodForVariant,
    buildVariantRawInput: buildVariantRawInput,
    buildAllVariantsSummary: buildAllVariantsSummary
  };
})(window.PPSCLab.Data);
