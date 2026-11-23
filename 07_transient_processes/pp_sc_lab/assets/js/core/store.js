window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Core = window.PPSCLab.Core || {};

(function (Core) {
  "use strict";

  var Data = window.PPSCLab.Data;
  var Validation = Core.Validation;
  var STORAGE_KEY = "ppsclab_state_v1";
  var MAX_UNDO = 20;

  var currentState = null;
  var undoStack = [];
  var listeners = [];
  var isNotifying = false;

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function createVariantState(n, keepAssumptions) {
    var variantNum = Number.isInteger(n) && n >= 1 && n <= 36 ? n : 7;
    var pdfMethod = Data.Variants.getPdfMethodForVariant(variantNum);
    var baseAssump = keepAssumptions
      ? deepClone(keepAssumptions)
      : deepClone(Data.Variants.DEFAULT_ASSUMPTIONS);

    return {
      variant: variantNum,
      isCustomInput: false,
      faultType: Data.Variants.getFaultTypeForVariant(variantNum),
      method: pdfMethod,
      methodSource: pdfMethod ? "pdf" : "none",
      input: Data.Variants.buildVariantRawInput(variantNum),
      assumptions: baseAssump
    };
  }

  function trySaveCache(st) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          app: "PP-SCLab",
          schemaVersion: 1,
          state: st
        }));
      }
    } catch (ignore) {
      // Under file:///, localStorage can be restricted by browser security policy.
    }
  }

  function tryLoadCache() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (!parsed || parsed.app !== "PP-SCLab" || parsed.schemaVersion !== 1 || !parsed.state) {
          return null;
        }
        var res = Validation.inspectImportJson(raw);
        return res.ok ? res.state : null;
      }
    } catch (ignore) {
      return null;
    }
    return null;
  }

  function trySaveCache(st) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          app: "PP-SCLab",
          schemaVersion: 1,
          state: st
        }));
      }
    } catch (ignore) {
      // Under file:///, localStorage can be restricted by browser security policy.
    }
  }

  function notify(reason) {
    isNotifying = true;
    try {
      for (var i = 0; i < listeners.length; i += 1) {
        try {
          listeners[i](deepClone(currentState), reason || "update");
        } catch (e) {
          if (typeof console !== "undefined" && console.error) {
            console.error("Store subscriber error:", e);
          }
        }
      }
    } finally {
      isNotifying = false;
    }
  }

  function commit(nextState, reason, skipUndo) {
    if (isNotifying) {
      throw new Error("Recursive Store mutation inside subscriber is forbidden");
    }
    var check = Validation.validateState(nextState);
    if (!check.ok) {
      return { ok: false, errors: check.errors };
    }
    if (!skipUndo && currentState) {
      undoStack.push(deepClone(currentState));
      if (undoStack.length > MAX_UNDO) {
        undoStack.shift();
      }
    }
    currentState = deepClone(check.normalized);
    trySaveCache(currentState);
    notify(reason);
    return { ok: true, errors: [] };
  }

  function init(defaultVariant) {
    var cached = tryLoadCache();
    var initial = cached || createVariantState(defaultVariant || 7);
    undoStack = [];
    return commit(initial, "init", true);
  }

  function getState() {
    return currentState ? deepClone(currentState) : null;
  }

  function subscribe(fn) {
    if (typeof fn === "function") {
      listeners.push(fn);
    }
    return function unsubscribe() {
      listeners = listeners.filter(function (item) { return item !== fn; });
    };
  }

  function selectVariant(n, preserveAssumptions) {
    var assump = preserveAssumptions && currentState ? currentState.assumptions : null;
    return commit(createVariantState(n, assump), "selectVariant", false);
  }

  function setMethod(methodId) {
    if (!currentState) return { ok: false, errors: [] };
    var next = deepClone(currentState);
    next.method = methodId;
    if (!next.isCustomInput && next.variant !== null) {
      var pdfMethod = Data.Variants.getPdfMethodForVariant(next.variant);
      next.methodSource = methodId === pdfMethod ? "pdf" : "manual";
    } else {
      next.methodSource = methodId ? "manual" : "none";
    }
    return commit(next, "setMethod", false);
  }

  function applyExtrapolatedMethod() {
    if (!currentState || currentState.isCustomInput || currentState.variant === null) {
      return { ok: false, errors: [] };
    }
    var ext = Data.Variants.getExtrapolatedMethodForVariant(currentState.variant);
    if (!ext) return { ok: false, errors: [] };
    var next = deepClone(currentState);
    next.method = ext;
    next.methodSource = "extrapolated";
    return commit(next, "applyExtrapolatedMethod", false);
  }

  function setFaultType(faultType) {
    if (!currentState) return { ok: false, errors: [] };
    var next = deepClone(currentState);
    next.faultType = faultType;
    return commit(next, "setFaultType", false);
  }

  function setAssumptions(patch) {
    if (!currentState || !patch || typeof patch !== "object") return { ok: false, errors: [] };
    var next = deepClone(currentState);
    var keys = Object.keys(patch);
    for (var i = 0; i < keys.length; i += 1) {
      next.assumptions[keys[i]] = patch[keys[i]];
    }
    return commit(next, "setAssumptions", false);
  }

  function resetAssumptions() {
    return setAssumptions(deepClone(Data.Variants.DEFAULT_ASSUMPTIONS));
  }

  function updateCustomInput(mutatorFn) {
    if (!currentState || typeof mutatorFn !== "function") return { ok: false, errors: [] };
    var next = deepClone(currentState);
    next.isCustomInput = true;
    next.variant = null;
    next.methodSource = next.method === null ? "none" : "manual";
    mutatorFn(next.input, next);
    return commit(next, "updateCustomInput", false);
  }

  function undo() {
    if (undoStack.length === 0) return false;
    var prev = undoStack.pop();
    currentState = deepClone(prev);
    trySaveCache(currentState);
    notify("undo");
    return true;
  }

  function canUndo() {
    return undoStack.length > 0;
  }

  function resetToDefault() {
    var baseVariant = currentState && currentState.variant ? currentState.variant : 7;
    return commit(createVariantState(baseVariant, null), "reset", false);
  }

  function exportJson() {
    return JSON.stringify({
      app: "PP-SCLab",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      state: getState()
    }, null, 2);
  }

  function importJson(rawText) {
    var res = Validation.inspectImportJson(rawText);
    if (!res.ok) return res;
    return commit(res.state, "importJson", false);
  }

  Core.Store = {
    init: init,
    getState: getState,
    subscribe: subscribe,
    selectVariant: selectVariant,
    setMethod: setMethod,
    applyExtrapolatedMethod: applyExtrapolatedMethod,
    setFaultType: setFaultType,
    setAssumptions: setAssumptions,
    resetAssumptions: resetAssumptions,
    updateCustomInput: updateCustomInput,
    undo: undo,
    canUndo: canUndo,
    resetToDefault: resetToDefault,
    exportJson: exportJson,
    importJson: importJson
  };
})(window.PPSCLab.Core);
