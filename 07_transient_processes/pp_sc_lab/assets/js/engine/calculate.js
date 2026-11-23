window.PPSCLab = window.PPSCLab || {};

(function (App) {
  "use strict";

  var Core = App.Core;
  var Engine = App.Engine;

  function buildWarnings(normalized, phys) {
    var warnings = [];
    var assump = normalized.assumptions;

    if (normalized.methodSource === "extrapolated") {
      warnings.push({
        level: "warning",
        code: "EXTRAPOLATED_METHOD",
        message: "Метод визначено екстраполяцією циклу N mod 4, оскільки N = 33..36 відсутній в офіційній таблиці PDF."
      });
    }
    if (phys.transformer.isOverloadedByFullPower) {
      warnings.push({
        level: "info",
        code: "T1_FULL_POWER_INFO",
        message: "Сума повних потужностей генераторів (" + phys.transformer.sSumGeneratorsMva.toFixed(2) +
          " МВА) перевищує вибрану за правилом завдання S_ном.т1 (" + phys.transformer.sNomSelectedMva +
          " МВА) на " + phys.transformer.overloadPercent.toFixed(1) + " %."
      });
    }
    if (assump.uGenNomKv !== 6.3 || assump.k0Line !== 4.0 || assump.emfModel !== "rated_complex" || assump.sBaseMva !== 100) {
      warnings.push({
        level: "info",
        code: "CUSTOM_ASSUMPTION_ACTIVE",
        message: "Застосовано альтернативне методичне припущення замість базового курсового профілю."
      });
    }
    return warnings;
  }

  function buildPhysicalBundle(input, assumptions) {
    var tg1 = Engine.Physical.Generator.build(input.tg1, assumptions.uGenNomKv, assumptions.emfModel);
    var tg2 = Engine.Physical.Generator.build(input.tg2, assumptions.uGenNomKv, assumptions.emfModel);
    var transformer = Engine.Physical.Transformer.build(input.transformer, tg1, tg2, assumptions.x0TrRatio);
    var lines = Engine.Physical.Line.build(input.lines, assumptions.k0Line);
    return { tg1: tg1, tg2: tg2, transformer: transformer, lines: lines };
  }

  function buildStepTrace(normalized, reduced, seq, faults) {
    var u = reduced.bases.systemType === "pu" ? "в.о." : "Ом";
    var eU = reduced.bases.systemType === "pu" ? "в.о." : "кВ (фазн.)";
    return [
      { id: "step_bases", title: "1. Вибір базисних умов та коефіцієнта трансформації", data: reduced.bases },
      { id: "step_gens", title: "2. Параметри та еквівалентування ТГ1 ‖ ТГ2", data: { tg1: reduced.tg1, tg2: reduced.tg2, tgEq: reduced.tgEq, unitE: eU, unitX: u } },
      { id: "step_tr_lines", title: "3. Приведення опорів Т1 та паралельних ліній Л1 ‖ Л2", data: { transformer: reduced.transformer, lines: reduced.lines, unitX: u } },
      { id: "step_seq", title: "4. Сумарні опори прямої, зворотної та нульової послідовностей", data: seq },
      { id: "step_k3", title: "5. Розрахунок періодичного струму трифазного КЗ K(3) при t = 0", data: faults.k3 },
      { id: "step_kn", title: "6. Розрахунок несиметричного КЗ " + normalized.faultType + " методом симетричних складових", data: faults.kn }
    ];
  }

  function stripInternalFields(reduced) {
    var cleanGen = function (g) {
      return {
        pMw: g.pMw,
        cosPhi: g.cosPhi,
        sinPhi: g.sinPhi,
        sNomMva: g.sNomMva,
        xGenBasePu: g.xGenBasePu,
        emfGenBasePu: g.emfGenBasePu,
        emfSysReduced: g.emfSysReduced,
        xReduced: g.xReduced
      };
    };
    return {
      tg1: cleanGen(reduced.tg1),
      tg2: cleanGen(reduced.tg2),
      tgEq: {
        emfEq: reduced.tgEq.emfEq,
        xEq: reduced.tgEq.xEq
      },
      transformer: reduced.transformer,
      lines: reduced.lines
    };
  }

  function calculate(state) {
    var val = Core.Validation.validateState(state);
    if (!val.ok) {
      return {
        status: "invalid_input",
        meta: {
          variant: state && typeof state.variant === "number" ? state.variant : null,
          isCustomInput: Boolean(state && state.isCustomInput),
          method: state ? state.method : null,
          methodSource: state ? state.methodSource : "none",
          faultType: state ? state.faultType : null,
          assumptions: state ? state.assumptions : null,
          warnings: [],
          errors: val.errors
        },
        bases: null,
        elements: null,
        sequenceNetworks: null,
        faults: null,
        steps: [],
        checks: []
      };
    }

    var norm = val.normalized;
    var phys = buildPhysicalBundle(norm.input, norm.assumptions);
    var warnings = buildWarnings(norm, phys);

    if (norm.method === null) {
      warnings.unshift({
        level: "warning",
        code: "METHOD_NOT_ASSIGNED",
        message: "Для варіанта N = " + norm.variant + " метод розрахунку не призначено таблицею PDF. Оберіть метод вручну або застосуйте екстраполяцію циклу."
      });
      return {
        status: "method_not_assigned",
        meta: {
          variant: norm.variant,
          isCustomInput: norm.isCustomInput,
          method: null,
          methodSource: norm.methodSource,
          faultType: norm.faultType,
          assumptions: norm.assumptions,
          warnings: warnings,
          errors: []
        },
        bases: null,
        elements: { rawPhysical: phys },
        sequenceNetworks: null,
        faults: null,
        steps: [],
        checks: []
      };
    }

    try {
      var reduceFn = Engine.Reduction[norm.method];
      if (typeof reduceFn !== "function") {
        throw new Error("Missing reduction strategy: " + norm.method);
      }

      var reduced = reduceFn(phys, norm.assumptions);
      var seq = Engine.Sequences.build(reduced, norm.faultType);
      var faults = Engine.Faults.solve(reduced, seq, norm.faultType);
      var checkSummary = Engine.Checks.runInvariantChecks(
        phys,
        { reduced: reduced, seq: seq, faults: faults },
        norm.method,
        norm.assumptions,
        norm.faultType
      );

      var cleanElements = stripInternalFields(reduced);
      var steps = buildStepTrace(norm, reduced, seq, faults);

      return {
        status: checkSummary.allPassed ? "success" : "invariant_failed",
        meta: {
          variant: norm.variant,
          isCustomInput: norm.isCustomInput,
          method: norm.method,
          methodSource: norm.methodSource,
          faultType: norm.faultType,
          assumptions: norm.assumptions,
          warnings: warnings,
          errors: checkSummary.allPassed ? [] : [{
            code: "INVARIANT_FAILED",
            field: null,
            message: "Порушено контрольний математичний інваріант."
          }]
        },
        bases: reduced.bases,
        elements: cleanElements,
        sequenceNetworks: seq,
        faults: faults,
        steps: steps,
        checks: checkSummary.checks
      };
    } catch (err) {
      return {
        status: "calculation_error",
        meta: {
          variant: norm.variant,
          isCustomInput: norm.isCustomInput,
          method: norm.method,
          methodSource: norm.methodSource,
          faultType: norm.faultType,
          assumptions: norm.assumptions,
          warnings: warnings,
          errors: [{
            code: "CALC_ERROR_BOUNDARY",
            field: null,
            message: err && err.message ? err.message : String(err)
          }]
        },
        bases: null,
        elements: null,
        sequenceNetworks: null,
        faults: null,
        steps: [],
        checks: []
      };
    }
  }

  App.calculate = calculate;
})(window.PPSCLab);
