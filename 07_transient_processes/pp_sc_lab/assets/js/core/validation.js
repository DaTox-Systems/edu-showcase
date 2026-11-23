window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Core = window.PPSCLab.Core || {};

(function (Core) {
  "use strict";

  var Data = window.PPSCLab.Data;
  var Parser = Core.NumberParser;
  var MAX_JSON_BYTES = 500 * 1024;

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function pushError(errors, code, field, message) {
    errors.push({ code: code, field: field, message: message });
  }

  var ALLOWED_ASSUMPTION_KEYS = ["uGenNomKv", "k0Line", "x0TrRatio", "emfModel", "sBaseMva"];
  var ALLOWED_STATE_KEYS = ["variant", "isCustomInput", "faultType", "method", "methodSource", "input", "assumptions"];

  function checkAllowedKeys(obj, allowed, prefix, errors) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i += 1) {
      if (allowed.indexOf(keys[i]) === -1) {
        pushError(
          errors,
          "UNKNOWN_KEY",
          prefix ? (prefix + "." + keys[i]) : keys[i],
          "Невідомий параметр: " + keys[i] + "."
        );
      }
    }
  }

  function validateAssumptions(rawAssump, errors) {
    if (!rawAssump || typeof rawAssump !== "object" || Array.isArray(rawAssump)) {
      pushError(errors, "INVALID_ASSUMPTIONS", "assumptions", "Об'єкт методичних допущень пошкоджений.");
      return null;
    }
    checkAllowedKeys(rawAssump, ALLOWED_ASSUMPTION_KEYS, "assumptions", errors);

    var uGenNomKv = Parser.toStrictNumber(rawAssump.uGenNomKv);
    var k0Line = Parser.toStrictNumber(rawAssump.k0Line);
    var x0TrRatio = Parser.toStrictNumber(rawAssump.x0TrRatio);
    var sBaseMva = Parser.toStrictNumber(rawAssump.sBaseMva);
    var emfModel = typeof rawAssump.emfModel === "string" ? rawAssump.emfModel : "";

    if (uGenNomKv !== 6.3 && uGenNomKv !== 6.0) {
      pushError(errors, "INVALID_UGEN", "assumptions.uGenNomKv", "Номінальна напруга генератора має бути 6,3 або 6,0 кВ.");
    }
    if (k0Line !== 4.0 && k0Line !== 3.5) {
      pushError(errors, "INVALID_K0", "assumptions.k0Line", "Коефіцієнт k0 лінії має бути 4,0 або 3,5.");
    }
    if (x0TrRatio !== 1.0) {
      pushError(errors, "INVALID_X0T", "assumptions.x0TrRatio", "Для курсового профілю приймається x0T/x1T = 1,0.");
    }
    if (emfModel !== "rated_complex" && emfModel !== "typical_108" && emfModel !== "simplified_100") {
      pushError(errors, "INVALID_EMF_MODEL", "assumptions.emfModel", "Невідома модель ЕРС генераторів.");
    }
    if (sBaseMva === null || sBaseMva <= 0) {
      pushError(errors, "INVALID_SBASE", "assumptions.sBaseMva", "Базова потужність S_б має бути > 0 МВА.");
    }

    return {
      uGenNomKv: uGenNomKv,
      k0Line: k0Line,
      x0TrRatio: x0TrRatio,
      emfModel: emfModel,
      sBaseMva: sBaseMva
    };
  }

  function validateGenerator(gen, prefix, errors) {
    var src = gen && typeof gen === "object" ? gen : {};
    var pMw = Parser.toStrictNumber(src.pMw);
    var cosPhi = Parser.toStrictNumber(src.cosPhi);
    var xdPp = Parser.toStrictNumber(src.xdPp);

    if (pMw === null || pMw <= 0) {
      pushError(errors, "INVALID_GEN_P", prefix + ".pMw", "Активна потужність генератора має бути > 0 МВт.");
    }
    if (cosPhi === null || cosPhi <= 0 || cosPhi > 1) {
      pushError(errors, "INVALID_GEN_COS", prefix + ".cosPhi", "Коефіцієнт потужності cos φ має бути в межах (0; 1].");
    }
    if (xdPp === null || xdPp <= 0) {
      pushError(errors, "INVALID_GEN_XD", prefix + ".xdPp", "Надперехідний опір x''_d має бути > 0 в.о.");
    }

    return { pMw: pMw, cosPhi: cosPhi, xdPp: xdPp };
  }

  function validateState(state) {
    var errors = [];
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      pushError(errors, "INVALID_STATE", null, "Об'єкт стану відсутній або пошкоджений.");
      return { ok: false, errors: errors, normalized: null };
    }

    checkAllowedKeys(state, ALLOWED_STATE_KEYS, "", errors);

    if (typeof state.isCustomInput !== "boolean") {
      pushError(errors, "INVALID_CUSTOM_FLAG", "isCustomInput", "Поле isCustomInput має бути булевим.");
    }
    var isCustomInput = state.isCustomInput === true;
    var variant = null;
    if (!isCustomInput) {
      variant = Parser.toStrictInteger(state.variant);
      if (variant === null || variant < 1 || variant > 36) {
        pushError(errors, "INVALID_VARIANT", "variant", "Номер варіанта N має бути цілим числом від 1 до 36.");
      }
    } else if (state.variant !== null) {
      pushError(errors, "INVALID_VARIANT", "variant", "У режимі користувацьких параметрів variant має бути null.");
    }

    var faultType = typeof state.faultType === "string" ? state.faultType : "";
    if (!hasOwn(Data.Variants.FAULT_TYPES, faultType)) {
      pushError(errors, "INVALID_FAULT_TYPE", "faultType", "Невідомий вид КЗ.");
    }

    var method = state.method === null ? null : (typeof state.method === "string" ? state.method : "__invalid__");
    if (method !== null && !hasOwn(Data.Variants.METHODS, method)) {
      pushError(errors, "INVALID_METHOD", "method", "Невідомий метод приведення.");
    }

    var methodSource = typeof state.methodSource === "string" ? state.methodSource : "__invalid__";
    if (["pdf", "extrapolated", "manual", "none"].indexOf(methodSource) === -1) {
      pushError(errors, "INVALID_METHOD_SOURCE", "methodSource", "Невідоме джерело призначення методу.");
    }

    if (!isCustomInput && variant !== null && variant >= 1 && variant <= 36) {
      if (variant <= 32 && method === null) {
        pushError(errors, "METHOD_REQUIRED", "method", "Для варіантів 1–32 метод має бути призначений.");
      }
      if (methodSource === "pdf") {
        var expectedPdf = Data.Variants.getPdfMethodForVariant(variant);
        if (expectedPdf === null || method !== expectedPdf) {
          pushError(errors, "METHOD_SOURCE_MISMATCH", "methodSource", "Метод не відповідає офіційній таблиці варіантів.");
        }
      } else if (methodSource === "extrapolated") {
        var expectedExt = Data.Variants.getExtrapolatedMethodForVariant(variant);
        if (variant < 33 || method !== expectedExt) {
          pushError(errors, "METHOD_SOURCE_MISMATCH", "methodSource", "Екстраполяція дозволена лише для варіантів 33–36.");
        }
      } else if (methodSource === "manual") {
        if (method === null) {
          pushError(errors, "METHOD_SOURCE_MISMATCH", "methodSource", "Для ручного призначення method не може бути null.");
        }
      } else if (methodSource === "none") {
        if (variant <= 32 || method !== null) {
          pushError(errors, "METHOD_SOURCE_MISMATCH", "methodSource", "Статус none допустимий лише коли метод не призначений (N = 33..36).");
        }
      }
    } else if (isCustomInput) {
      if (methodSource === "pdf" || methodSource === "extrapolated") {
        pushError(errors, "METHOD_SOURCE_MISMATCH", "methodSource", "У користувацькому режимі джерела pdf/extrapolated заборонені.");
      } else if (methodSource === "manual" && method === null) {
        pushError(errors, "METHOD_SOURCE_MISMATCH", "methodSource", "Для ручного призначення method не може бути null.");
      } else if (methodSource === "none" && method !== null) {
        pushError(errors, "METHOD_SOURCE_MISMATCH", "methodSource", "При заданому методі methodSource не може бути none.");
      }
    }

    var rawIn = state.input && typeof state.input === "object" ? state.input : {};
    var tg1 = validateGenerator(rawIn.tg1, "input.tg1", errors);
    var tg2 = validateGenerator(rawIn.tg2, "input.tg2", errors);

    var trSrc = rawIn.transformer && typeof rawIn.transformer === "object" ? rawIn.transformer : {};
    var sNomMva = Parser.toStrictNumber(trSrc.sNomMva);
    var uHvKv = Parser.toStrictNumber(trSrc.uHvKv);
    var uLvKv = Parser.toStrictNumber(trSrc.uLvKv);
    var ukPercent = Parser.toStrictNumber(trSrc.ukPercent);

    var hasSReq = hasOwn(trSrc, "sRequiredByTaskMva") && trSrc.sRequiredByTaskMva !== undefined;
    var sReq = hasSReq ? Parser.toStrictNumber(trSrc.sRequiredByTaskMva) : null;
    if (hasSReq && sReq === null) {
      pushError(errors, "INVALID_TR_S_REQ", "input.transformer.sRequiredByTaskMva", "Поле sRequiredByTaskMva містить некоректне число.");
    } else if (hasSReq && tg1.pMw !== null && tg2.pMw !== null) {
      if (Math.abs(sReq - (tg1.pMw + tg2.pMw)) > 1e-9) {
        pushError(errors, "TR_S_REQ_MISMATCH", "input.transformer.sRequiredByTaskMva", "Значення sRequiredByTaskMva не узгоджується з P1 + P2.");
      }
    }

    if (sNomMva === null || sNomMva <= 0) {
      pushError(errors, "INVALID_TR_S", "input.transformer.sNomMva", "Номінальна потужність Т1 має бути > 0 МВА.");
    }
    if (uHvKv === null || uHvKv <= 0 || uLvKv === null || uLvKv <= 0) {
      pushError(errors, "INVALID_TR_U", "input.transformer.uHvKv", "Напруги обмоток Т1 мають бути > 0 кВ.");
    }
    if (ukPercent === null || ukPercent <= 0) {
      pushError(errors, "INVALID_TR_UK", "input.transformer.ukPercent", "Напруга КЗ трансформатора u_к має бути > 0 %.");
    }

    var lnSrc = rawIn.lines && typeof rawIn.lines === "object" ? rawIn.lines : {};
    var x1LineOhmPerKm = Parser.toStrictNumber(lnSrc.x1LineOhmPerKm);
    var lengthKm = Parser.toStrictNumber(lnSrc.lengthKm);
    var circuits = Parser.toStrictInteger(lnSrc.circuits);

    if (x1LineOhmPerKm === null || x1LineOhmPerKm <= 0) {
      pushError(errors, "INVALID_LINE_X1", "input.lines.x1LineOhmPerKm", "Питомий опір лінії x_1,пит має бути > 0 Ом/км.");
    }
    if (lengthKm === null || lengthKm <= 0) {
      pushError(errors, "INVALID_LINE_LEN", "input.lines.lengthKm", "Довжина лінії має бути > 0 км.");
    }
    if (circuits !== 2) {
      pushError(errors, "INVALID_LINE_CIRCUITS", "input.lines.circuits", "Для поточної моделі мережі кількість паралельних кіл ЛЕП фіксована: 2.");
    }

    var assumptions = validateAssumptions(state.assumptions, errors);

    if (errors.length > 0) {
      return { ok: false, errors: errors, normalized: null };
    }

    return {
      ok: true,
      errors: [],
      normalized: {
        variant: variant,
        isCustomInput: isCustomInput,
        faultType: faultType,
        method: method,
        methodSource: methodSource,
        input: {
          tg1: tg1,
          tg2: tg2,
          transformer: {
            sRequiredByTaskMva: hasSReq ? sReq : (tg1.pMw + tg2.pMw),
            sNomMva: sNomMva,
            uHvKv: uHvKv,
            uLvKv: uLvKv,
            ukPercent: ukPercent,
            windingGroup: "Delta/Y0"
          },
          lines: {
            x1LineOhmPerKm: x1LineOhmPerKm,
            lengthKm: lengthKm,
            circuits: circuits
          }
        },
        assumptions: assumptions
      }
    };
  }

  function inspectImportJson(rawText) {
    if (typeof rawText !== "string" || !rawText.trim()) {
      return { ok: false, errors: [{ code: "EMPTY_JSON", field: null, message: "Файл JSON порожній." }], state: null };
    }
    var byteLen = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(rawText).length : rawText.length * 2;
    if (byteLen > MAX_JSON_BYTES) {
      return { ok: false, errors: [{ code: "JSON_TOO_LARGE", field: null, message: "Перевищено ліміт розміру JSON (500 КБ)." }], state: null };
    }

    var parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      return { ok: false, errors: [{ code: "JSON_PARSE_ERROR", field: null, message: "Некоректний синтаксис JSON." }], state: null };
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, errors: [{ code: "JSON_ROOT_INVALID", field: null, message: "Корінь JSON має бути об'єктом." }], state: null };
    }

    var isWrapper = hasOwn(parsed, "app") || hasOwn(parsed, "schemaVersion") || hasOwn(parsed, "state");
    if (isWrapper) {
      if (parsed.app !== "PP-SCLab" || parsed.schemaVersion !== 1 || !parsed.state || typeof parsed.state !== "object") {
        return { ok: false, errors: [{ code: "JSON_SCHEMA_MISMATCH", field: null, message: "Несумісна версія схеми або ідентифікатор файлу." }], state: null };
      }
    }

    var candidate = isWrapper ? parsed.state : parsed;
    var check = validateState(candidate);
    if (!check.ok) {
      return { ok: false, errors: check.errors, state: null };
    }
    return { ok: true, errors: [], state: check.normalized };
  }

  Core.Validation = {
    validateState: validateState,
    inspectImportJson: inspectImportJson
  };
})(window.PPSCLab.Core);
