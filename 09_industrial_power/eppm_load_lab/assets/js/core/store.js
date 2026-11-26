window.EPPMLoadLab = window.EPPMLoadLab || {};
window.EPPMLoadLab.Core = window.EPPMLoadLab.Core || {};

(function (Core, Data) {
  "use strict";

  var VALID_MODES = ["benchmark", "variants", "sandbox"];
  var VALID_SCREENS = [1, 2, 3, 4];
  var BENCHMARK_VARIANT_ID = 7;
  var sandboxIdCounter = 1;
  var ALLOWED_PATCH_FIELDS = ["name", "peakPowerKw", "category", "dbnCategory", "profileId", "profile"];

  function validateCustomProfile(arr, label) {
    if (!Array.isArray(arr) || arr.length !== 25) {
      throw new Error((label || "Профіль") + " повинен містити рівно 25 годинних значень.");
    }
    var maxVal = -Infinity;
    for (var i = 0; i < 25; i++) {
      if (typeof arr[i] !== "number" || !Number.isFinite(arr[i]) || arr[i] < 0) {
        throw new TypeError((label || "Профіль") + " містить некоректне значення на годині " + i + ".");
      }
      if (arr[i] > maxVal) maxVal = arr[i];
    }
    if (Math.abs(maxVal - 100.0) > 1e-6) {
      throw new RangeError((label || "Профіль") + " повинен бути нормований до максимуму 100% (фактичний макс.: " + maxVal + "%).");
    }
  }

  function cloneArray(arr) {
    return Array.isArray(arr) ? arr.slice() : [];
  }

  function cloneConsumers(list) {
    return list.map(function (c) {
      return {
        id: c.id,
        name: c.name,
        category: c.category,
        peakPowerKw: c.peakPowerKw,
        profile: c.profile.slice(),
        dbnCategory: c.dbnCategory
      };
    });
  }

  function cloneCosPhiMap(sourceMap) {
    var copy = Object.create(null);
    if (!sourceMap || typeof sourceMap !== "object") return copy;
    var keys = Object.keys(sourceMap);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var item = sourceMap[k];
      if (typeof item === "number") {
        copy[k] = item;
      } else if (item && typeof item === "object") {
        copy[k] = {
          consumerId: item.consumerId,
          value: item.value,
          status: item.status,
          source: item.source,
          overridePreset: Boolean(item.overridePreset)
        };
      }
    }
    return copy;
  }

  function deepCloneSnapshot(val) {
    if (val === null || typeof val !== "object") return val;
    if (Array.isArray(val)) {
      var outArr = new Array(val.length);
      for (var i = 0; i < val.length; i++) {
        outArr[i] = deepCloneSnapshot(val[i]);
      }
      return outArr;
    }
    if (val instanceof Float64Array) {
      return Array.prototype.slice.call(val);
    }
    if (typeof val.interpolate === "function" && typeof val.integrate === "function") {
      return val;
    }
    var outObj = (Object.getPrototypeOf(val) === null) ? Object.create(null) : {};
    var keys = Object.keys(val);
    for (var j = 0; j < keys.length; j++) {
      var prop = keys[j];
      if (typeof val[prop] === "function") continue;
      outObj[prop] = deepCloneSnapshot(val[prop]);
    }
    return outObj;
  }

  function buildScenarioFromVariant(variantId) {
    var variantData = Data.Variants.get(variantId);
    var part1Eval = Core.Integrator.evaluateResidential(variantData.total);
    var consumers = Data.Variants.materialize(variantData, part1Eval.pMaxHourly);

    return {
      variantId: variantData.variant,
      variantProvenance: variantData.provenance,
      part1: {
        zbg: cloneArray(variantData.zbg),
        zh: cloneArray(variantData.zh),
        total: cloneArray(variantData.total)
      },
      consumers: consumers
    };
  }

  // Policy:
  // - If presetId === "custom": strictly require explicit customMap entry for every consumer.
  // - Otherwise: explicit overridePreset entries apply first; supported categories use preset;
  //   only UNSUPPORTED_CATEGORY errors fall back to customMap (unexpected errors propagate to rollback).
  function buildActiveCosPhiMap(presetId, consumers, customMap) {
    if (presetId === "custom") {
      var customResult = Object.create(null);
      for (var i = 0; i < consumers.length; i++) {
        var c = consumers[i];
        var entry = customMap[c.id];
        if (!entry) {
          throw new RangeError("У користувацькому режимі cos φ не задано для споживача [" + c.id + "].");
        }
        customResult[c.id] = (typeof entry === "number")
          ? { consumerId: c.id, value: entry, status: "explicit_user_value", source: "Задано користувачем" }
          : { consumerId: c.id, value: entry.value, status: entry.status || "explicit_user_value", source: entry.source || "Задано користувачем" };
      }
      return customResult;
    }

    var resolvedMap = Object.create(null);
    for (var j = 0; j < consumers.length; j++) {
      var consumer = consumers[j];
      var customEntry = customMap[consumer.id];

      if (customEntry && typeof customEntry === "object" && customEntry.overridePreset === true) {
        resolvedMap[consumer.id] = {
          consumerId: consumer.id,
          value: customEntry.value,
          status: customEntry.status || "explicit_user_value",
          source: customEntry.source || "Індивідуальне перевизначення у Sandbox"
        };
        continue;
      }

      try {
        var singleMap = Data.Variants.buildCosPhiMap(presetId, [consumer]);
        resolvedMap[consumer.id] = singleMap[consumer.id];
      } catch (presetErr) {
        if (presetErr && presetErr.code === "UNSUPPORTED_CATEGORY" && customEntry) {
          resolvedMap[consumer.id] = (typeof customEntry === "number")
            ? { consumerId: consumer.id, value: customEntry, status: "explicit_user_value", source: "Задано користувачем (поза пресетом)" }
            : { consumerId: consumer.id, value: customEntry.value, status: customEntry.status, source: customEntry.source };
        } else {
          throw presetErr;
        }
      }
    }
    return resolvedMap;
  }

  function createStore() {
    var listeners = [];
    var goldenCache = null;

    var state = {
      mode: "benchmark",
      activeScreen: 1,
      presentationMode: false,
      selectedHour: 20,
      layers: {
        step: true,
        trapezoid: true,
        spline: true,
        p30Window: true
      },
      variantId: BENCHMARK_VARIANT_ID,
      variantProvenance: null,
      sandboxMeta: {
        isDirty: false,
        sourceVariantId: BENCHMARK_VARIANT_ID,
        requiresTeacherConfirmation: false
      },
      part1: {
        zbg: [],
        zh: [],
        total: []
      },
      substation: {
        transformerKva: 400,
        cosPhiPresetId: "educational_unified",
        customCosPhiMap: Object.create(null),
        consumers: []
      },
      results: {
        part1: null,
        part2: null,
        apparent: null,
        golden: null
      },
      lastError: null
    };

    function computeResults(targetState) {
      if (!goldenCache) {
        goldenCache = Core.Integrator.evaluateGoldenExample();
      }
      var part1Total = [];
      for (var t = 0; t < 25; t++) {
        part1Total.push(targetState.part1.zbg[t] + targetState.part1.zh[t]);
      }
      targetState.part1.total = part1Total;

      var part1Res = Core.Integrator.evaluateResidential(part1Total);
      var part2Res = Core.Integrator.evaluateSubstation(targetState.substation.consumers);
      var activeCosMap = buildActiveCosPhiMap(
        targetState.substation.cosPhiPresetId,
        targetState.substation.consumers,
        targetState.substation.customCosPhiMap
      );
      var apparentRes = part2Res.computeApparent(activeCosMap, targetState.substation.transformerKva);

      targetState.results = {
        part1: part1Res,
        part2: part2Res,
        apparent: apparentRes,
        golden: goldenCache
      };
      targetState.lastError = null;
    }

    function loadScenario(variantId, targetMode) {
      var loaded = buildScenarioFromVariant(variantId);
      state.mode = targetMode;
      state.variantId = loaded.variantId;
      state.variantProvenance = loaded.variantProvenance || null;
      state.part1 = loaded.part1;
      state.substation.consumers = loaded.consumers;
      state.substation.customCosPhiMap = Object.create(null);
      state.substation.transformerKva = 400;
      state.substation.cosPhiPresetId = "educational_unified";
      state.sandboxMeta = {
        isDirty: false,
        sourceVariantId: loaded.variantId,
        requiresTeacherConfirmation: Boolean(loaded.variantProvenance && loaded.variantProvenance.requiresTeacherConfirmation)
      };
      computeResults(state);
    }

    function notify() {
      var snapshot = getState();
      var currentListeners = listeners.slice();
      for (var i = 0; i < currentListeners.length; i++) {
        try {
          currentListeners[i](snapshot);
        } catch (listenerErr) {
          if (typeof console !== "undefined" && typeof console.error === "function") {
            console.error("[EPPM-LoadLab Store] Subscriber error:", listenerErr);
          }
        }
      }
    }

    function captureBackup() {
      return {
        mode: state.mode,
        variantId: state.variantId,
        variantProvenance: state.variantProvenance,
        sandboxMeta: deepCloneSnapshot(state.sandboxMeta),
        part1: {
          zbg: cloneArray(state.part1.zbg),
          zh: cloneArray(state.part1.zh),
          total: cloneArray(state.part1.total)
        },
        substation: {
          transformerKva: state.substation.transformerKva,
          cosPhiPresetId: state.substation.cosPhiPresetId,
          customCosPhiMap: cloneCosPhiMap(state.substation.customCosPhiMap),
          consumers: cloneConsumers(state.substation.consumers)
        }
      };
    }

    function restoreBackup(backup) {
      state.mode = backup.mode;
      state.variantId = backup.variantId;
      state.variantProvenance = backup.variantProvenance;
      state.sandboxMeta = backup.sandboxMeta;
      state.part1 = backup.part1;
      state.substation = backup.substation;
    }

    function executeWithRollback(mutatorFn) {
      var backup = captureBackup();
      try {
        var needsRecalc = mutatorFn();
        if (needsRecalc) {
          computeResults(state);
        } else {
          state.lastError = null;
        }
      } catch (err) {
        restoreBackup(backup);
        state.lastError = err && err.message ? err.message : String(err);
      }
      notify();
      return getState();
    }

    function getState() {
      var badge = "benchmark_verified";
      if (state.mode === "sandbox") {
        badge = "sandbox_experimental";
      } else if (state.mode === "variants") {
        badge = state.sandboxMeta.requiresTeacherConfirmation
          ? "academic_variant_requires_confirmation"
          : "academic_variant";
      }

      return deepCloneSnapshot({
        mode: state.mode,
        activeScreen: state.activeScreen,
        presentationMode: state.presentationMode,
        selectedHour: state.selectedHour,
        layers: state.layers,
        variantId: state.variantId,
        variantProvenance: state.variantProvenance,
        sandboxMeta: state.sandboxMeta,
        scenarioBadge: badge,
        part1: state.part1,
        substation: {
          transformerKva: state.substation.transformerKva,
          cosPhiPresetId: state.substation.cosPhiPresetId,
          customCosPhiMap: state.substation.customCosPhiMap,
          consumers: state.substation.consumers
        },
        results: state.results,
        lastError: state.lastError
      });
    }

    function subscribe(listener) {
      if (typeof listener !== "function") {
        throw new TypeError("Store subscriber must be a function.");
      }
      listeners.push(listener);
      return function unsubscribe() {
        var idx = listeners.indexOf(listener);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    }

    function recalculate() {
      return executeWithRollback(function () {
        return true;
      });
    }

    function resetSandbox() {
      return executeWithRollback(function () {
        var targetVariant = state.mode === "benchmark" ? BENCHMARK_VARIANT_ID : state.variantId;
        var targetMode = state.mode === "sandbox" ? "sandbox" : state.mode;
        loadScenario(targetVariant, targetMode);
        return false;
      });
    }

    function ensureSandboxClone() {
      if (state.mode !== "sandbox") {
        state.mode = "sandbox";
        state.part1.zbg = cloneArray(state.part1.zbg);
        state.part1.zh = cloneArray(state.part1.zh);
        state.part1.total = cloneArray(state.part1.total);
        state.substation.consumers = cloneConsumers(state.substation.consumers);
        state.substation.customCosPhiMap = cloneCosPhiMap(state.substation.customCosPhiMap);
      }
      state.sandboxMeta.isDirty = true;
    }

    function dispatch(action) {
      if (!action || typeof action.type !== "string") {
        throw new TypeError("Dispatched action must be an object with a string type.");
      }

      return executeWithRollback(function () {
        var needsRecalc = false;

        switch (action.type) {
          case "SET_SCREEN": {
            var screenNum = Number(action.screen);
            if (VALID_SCREENS.indexOf(screenNum) === -1) {
              throw new RangeError("Невідомий номер екрану: " + action.screen);
            }
            state.activeScreen = screenNum;
            break;
          }

          case "SET_PRESENTATION_MODE": {
            if (typeof action.enabled !== "boolean") {
              throw new TypeError("Параметр enabled для SET_PRESENTATION_MODE повинен мати тип boolean.");
            }
            state.presentationMode = action.enabled;
            break;
          }

          case "TOGGLE_PRESENTATION_MODE": {
            state.presentationMode = !state.presentationMode;
            break;
          }

          case "SET_SELECTED_HOUR": {
            var hr = Number(action.hour);
            if (!Number.isInteger(hr) || hr < 0 || hr > 24) {
              throw new RangeError("Година доби повинна бути цілим числом [0..24].");
            }
            state.selectedHour = hr;
            break;
          }

          case "TOGGLE_LAYER": {
            var layerKey = action.layer;
            if (!Object.prototype.hasOwnProperty.call(state.layers, layerKey)) {
              throw new TypeError("Невідомий шар графіка: " + layerKey);
            }
            state.layers[layerKey] = !state.layers[layerKey];
            break;
          }

          case "SET_MODE": {
            var nextMode = action.mode;
            if (VALID_MODES.indexOf(nextMode) === -1) {
              throw new TypeError("Невідомий режим роботи стенду: " + nextMode);
            }
            if (nextMode === "benchmark") {
              loadScenario(BENCHMARK_VARIANT_ID, "benchmark");
            } else if (nextMode === "variants") {
              loadScenario(state.variantId, "variants");
            } else if (nextMode === "sandbox") {
              state.mode = "sandbox";
              state.sandboxMeta.isDirty = false;
            }
            break;
          }

          case "SELECT_VARIANT": {
            var vId = action.variantId;
            var targetMode = (vId === BENCHMARK_VARIANT_ID && action.preferBenchmark) ? "benchmark" : "variants";
            loadScenario(vId, targetMode);
            break;
          }

          case "RESET_SANDBOX": {
            var rVariant = state.mode === "benchmark" ? BENCHMARK_VARIANT_ID : state.variantId;
            var rMode = state.mode === "sandbox" ? "sandbox" : state.mode;
            loadScenario(rVariant, rMode);
            break;
          }

          case "SET_TRANSFORMER_KVA": {
            if (typeof action.kva !== "number" && typeof action.kva !== "string") {
              throw new TypeError("Некоректний тип номінальної потужності трансформатора.");
            }
            var kva = Number(action.kva);
            if (!Number.isFinite(kva) || kva <= 0) {
              throw new RangeError("Номінальна потужність трансформатора повинна бути додатним скінченним числом: " + action.kva);
            }
            // Modifying calculation parameters moves scenario cleanly into Sandbox
            ensureSandboxClone();
            state.substation.transformerKva = kva;
            needsRecalc = true;
            break;
          }

          case "SET_COS_PHI_PRESET": {
            var pId = action.presetId;
            if (pId !== "custom" && !Object.prototype.hasOwnProperty.call(Data.Variants.COS_PHI_PRESETS, pId)) {
              throw new TypeError("Невідомий пресет cos φ: " + pId);
            }
            ensureSandboxClone();
            if (pId === "custom") {
              var currentDetails = state.results.apparent ? state.results.apparent.cosPhiDetails : [];
              for (var dIdx = 0; dIdx < currentDetails.length; dIdx++) {
                var det = currentDetails[dIdx];
                if (!state.substation.customCosPhiMap[det.consumerId]) {
                  state.substation.customCosPhiMap[det.consumerId] = {
                    consumerId: det.consumerId,
                    value: det.value,
                    status: det.status,
                    source: det.source,
                    overridePreset: false
                  };
                }
              }
            } else {
              // Switching to an academic preset clears individual preset overrides,
              // retaining custom values only for categories absent from the preset
              var customKeys = Object.keys(state.substation.customCosPhiMap);
              for (var ck = 0; ck < customKeys.length; ck++) {
                var cItem = state.substation.customCosPhiMap[customKeys[ck]];
                if (cItem && typeof cItem === "object") {
                  cItem.overridePreset = false;
                }
              }
            }
            state.substation.cosPhiPresetId = pId;
            needsRecalc = true;
            break;
          }

          case "SET_CONSUMER_COS_PHI": {
            if (typeof action.consumerId !== "string" || action.consumerId.trim().length === 0) {
              throw new TypeError("Необхідно вказати коректний consumerId.");
            }
            var consumerExists = state.substation.consumers.some(function (item) {
              return item.id === action.consumerId;
            });
            if (!consumerExists) {
              throw new Error("Споживач [" + action.consumerId + "] не знайдений на шинах ТП.");
            }
            var cVal = Number(action.value);
            if (!Number.isFinite(cVal) || cVal <= 0.0 || cVal > 1.0) {
              throw new RangeError("cos φ повинен лежати в межах (0; 1].");
            }
            ensureSandboxClone();
            state.substation.cosPhiPresetId = "custom";
            if (state.results.apparent && state.results.apparent.cosPhiDetails) {
              var existingDetails = state.results.apparent.cosPhiDetails;
              for (var ei = 0; ei < existingDetails.length; ei++) {
                var eItem = existingDetails[ei];
                if (!state.substation.customCosPhiMap[eItem.consumerId]) {
                  state.substation.customCosPhiMap[eItem.consumerId] = {
                    consumerId: eItem.consumerId,
                    value: eItem.value,
                    status: eItem.status,
                    source: eItem.source,
                    overridePreset: false
                  };
                }
              }
            }
            state.substation.customCosPhiMap[action.consumerId] = {
              consumerId: action.consumerId,
              value: cVal,
              status: "explicit_user_value",
              source: "Задано користувачем у Sandbox",
              overridePreset: true
            };
            needsRecalc = true;
            break;
          }

          case "UPDATE_PART1_POINT": {
            var pHour = Number(action.hour);
            var pField = action.field;
            var pVal = Number(action.value);
            if (!Number.isInteger(pHour) || pHour < 0 || pHour > 24) {
              throw new RangeError("Година повинна бути в діапазоні [0..24].");
            }
            if (pField !== "zbg" && pField !== "zh") {
              throw new TypeError("Поле Частини 1 повинно бути 'zbg' або 'zh'.");
            }
            if (!Number.isFinite(pVal) || pVal < 0) {
              throw new RangeError("Потужність повинна бути невід'ємним скінченним числом.");
            }
            ensureSandboxClone();
            state.part1[pField][pHour] = pVal;
            needsRecalc = true;
            break;
          }

          case "ADD_CONSUMER": {
            ensureSandboxClone();
            var newObj = action.consumer;
            if (!newObj || typeof newObj !== "object") {
              throw new TypeError("Необхідно передати об'єкт споживача.");
            }
            var newId;
            if (newObj.id !== undefined) {
              if (typeof newObj.id !== "string" || newObj.id.trim().length === 0) {
                throw new TypeError("Ідентифікатор нового споживача повинен бути непорожнім рядком.");
              }
              newId = newObj.id.trim();
              var dupFound = state.substation.consumers.some(function (item) { return item.id === newId; });
              if (dupFound) {
                throw new Error("Споживач з ідентифікатором [" + newId + "] вже існує.");
              }
            } else {
              do {
                newId = "sandbox_consumer_" + (sandboxIdCounter++);
              } while (state.substation.consumers.some(function (item) { return item.id === newId; }));
            }

            if (newObj.profileId !== undefined && newObj.profile !== undefined) {
              throw new TypeError("Не можна передавати profileId і profile одночасно.");
            }

            var profileArr = null;
            if (Array.isArray(newObj.profile)) {
              validateCustomProfile(newObj.profile, "Профіль нового споживача");
              profileArr = newObj.profile.slice();
            } else if (typeof newObj.profileId === "string") {
              if (!Object.prototype.hasOwnProperty.call(Data.Variants.PROFILES, newObj.profileId)) {
                throw new Error("Невідомий profileId: [" + newObj.profileId + "].");
              }
              profileArr = Data.Variants.PROFILES[newObj.profileId].slice();
            } else {
              throw new TypeError("Необхідно вказати profileId або масив profile (25 точок).");
            }

            if (typeof newObj.name !== "string" || newObj.name.trim().length === 0) {
              throw new TypeError("Необхідно вказати непорожню назву споживача.");
            }
            if (typeof newObj.category !== "string" || newObj.category.trim().length === 0) {
              throw new TypeError("Необхідно вказати коректну категорію споживача.");
            }
            if (newObj.dbnCategory !== null && (typeof newObj.dbnCategory !== "string" || newObj.dbnCategory.trim().length === 0)) {
              throw new TypeError("Поле dbnCategory повинно бути явно задане як непорожній рядок або null.");
            }
            if (typeof newObj.peakPowerKw !== "number" && typeof newObj.peakPowerKw !== "string") {
              throw new TypeError("Некоректний тип peakPowerKw.");
            }
            var newPeakKw = Number(newObj.peakPowerKw);
            if (!Number.isFinite(newPeakKw) || newPeakKw < 0) {
              throw new RangeError("Потужність нового споживача повинна бути невід'ємним скінченним числом.");
            }

            var dto = {
              id: newId,
              name: newObj.name.trim(),
              category: newObj.category.trim(),
              peakPowerKw: newPeakKw,
              profile: profileArr,
              dbnCategory: newObj.dbnCategory
            };

            if (newObj.cosPhi !== undefined) {
              if (typeof newObj.cosPhi !== "number" || !Number.isFinite(newObj.cosPhi) || newObj.cosPhi <= 0 || newObj.cosPhi > 1) {
                throw new RangeError("Некоректний cos φ для нового споживача.");
              }
              state.substation.customCosPhiMap[newId] = {
                consumerId: newId,
                value: newObj.cosPhi,
                status: "explicit_user_value",
                source: "Задано користувачем при додаванні у Sandbox",
                overridePreset: true
              };
            }

            state.substation.consumers.push(dto);
            needsRecalc = true;
            break;
          }

          case "REMOVE_CONSUMER": {
            ensureSandboxClone();
            if (state.substation.consumers.length <= 1) {
              throw new Error("На шинах ТП повинен залишатися принаймні один споживач.");
            }
            var filtered = state.substation.consumers.filter(function (item) {
              return item.id !== action.consumerId;
            });
            if (filtered.length === state.substation.consumers.length) {
              throw new Error("Споживач [" + action.consumerId + "] не знайдений.");
            }
            state.substation.consumers = filtered;
            delete state.substation.customCosPhiMap[action.consumerId];
            needsRecalc = true;
            break;
          }

          case "UPDATE_CONSUMER": {
            ensureSandboxClone();
            var targetIdx = -1;
            for (var ui = 0; ui < state.substation.consumers.length; ui++) {
              if (state.substation.consumers[ui].id === action.consumerId) {
                targetIdx = ui;
                break;
              }
            }
            if (targetIdx === -1) {
              throw new Error("Споживач [" + action.consumerId + "] не знайдений.");
            }
            var patch = action.patch;
            if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
              throw new TypeError("Для UPDATE_CONSUMER необхідно передати об'єкт patch.");
            }
            var patchKeys = Object.keys(patch);
            if (patchKeys.length === 0) {
              throw new TypeError("Об'єкт patch для UPDATE_CONSUMER не може бути порожнім.");
            }
            for (var pk = 0; pk < patchKeys.length; pk++) {
              if (ALLOWED_PATCH_FIELDS.indexOf(patchKeys[pk]) === -1) {
                throw new TypeError("Неприпустиме поле в UPDATE_CONSUMER patch: [" + patchKeys[pk] + "].");
              }
            }

            var hasProfileId = Object.prototype.hasOwnProperty.call(patch, "profileId");
            var hasProfile = Object.prototype.hasOwnProperty.call(patch, "profile");
            if (hasProfileId && hasProfile) {
              throw new TypeError("Не можна передавати profileId і profile одночасно в UPDATE_CONSUMER.");
            }

            // Atomic validation before mutating target consumer
            var nextFields = {};
            if (Object.prototype.hasOwnProperty.call(patch, "name")) {
              if (typeof patch.name !== "string" || patch.name.trim().length === 0) {
                throw new TypeError("Назва споживача повинна бути непорожнім рядком.");
              }
              nextFields.name = patch.name.trim();
            }
            if (Object.prototype.hasOwnProperty.call(patch, "peakPowerKw")) {
              if (typeof patch.peakPowerKw !== "number" && typeof patch.peakPowerKw !== "string") {
                throw new TypeError("Некоректний тип peakPowerKw.");
              }
              var newPeak = Number(patch.peakPowerKw);
              if (!Number.isFinite(newPeak) || newPeak < 0) {
                throw new RangeError("Потужність peakPowerKw повинна бути невід'ємним скінченним числом.");
              }
              nextFields.peakPowerKw = newPeak;
            }
            if (Object.prototype.hasOwnProperty.call(patch, "category")) {
              if (typeof patch.category !== "string" || patch.category.trim().length === 0) {
                throw new TypeError("Категорія повинна бути непорожнім рядком.");
              }
              nextFields.category = patch.category.trim();
            }
            if (Object.prototype.hasOwnProperty.call(patch, "dbnCategory")) {
              if (patch.dbnCategory !== null && (typeof patch.dbnCategory !== "string" || patch.dbnCategory.trim().length === 0)) {
                throw new TypeError("Поле dbnCategory повинно бути непорожнім рядком або null.");
              }
              nextFields.dbnCategory = patch.dbnCategory;
            }
            if (hasProfileId) {
              if (typeof patch.profileId !== "string" || !Object.prototype.hasOwnProperty.call(Data.Variants.PROFILES, patch.profileId)) {
                throw new Error("Невідомий profileId у patch: [" + patch.profileId + "].");
              }
              nextFields.profile = Data.Variants.PROFILES[patch.profileId].slice();
            } else if (hasProfile) {
              validateCustomProfile(patch.profile, "Оновлений профіль");
              nextFields.profile = patch.profile.slice();
            }

            // Commit validated fields atomically
            var curr = state.substation.consumers[targetIdx];
            var validKeys = Object.keys(nextFields);
            for (var vk = 0; vk < validKeys.length; vk++) {
              curr[validKeys[vk]] = nextFields[validKeys[vk]];
            }
            needsRecalc = true;
            break;
          }

          case "UPDATE_CONSUMER_HOUR_KW": {
            ensureSandboxClone();
            var hIdx = Number(action.hour);
            var newKw = Number(action.valueKw);
            if (!Number.isInteger(hIdx) || hIdx < 0 || hIdx > 24) {
              throw new RangeError("Година повинна бути в діапазоні [0..24].");
            }
            if (!Number.isFinite(newKw) || newKw < 0) {
              throw new RangeError("Потужність повинна бути невід'ємним скінченним числом.");
            }

            var cTarget = null;
            for (var ci = 0; ci < state.substation.consumers.length; ci++) {
              if (state.substation.consumers[ci].id === action.consumerId) {
                cTarget = state.substation.consumers[ci];
                break;
              }
            }
            if (!cTarget) {
              throw new Error("Споживач [" + action.consumerId + "] не знайдений.");
            }

            var absCurve = [];
            var newMaxKw = 0.0;
            for (var hrIdx = 0; hrIdx < 25; hrIdx++) {
              var valHr = (hrIdx === hIdx) ? newKw : (cTarget.profile[hrIdx] / 100.0) * cTarget.peakPowerKw;
              absCurve.push(valHr);
              if (valHr > newMaxKw) newMaxKw = valHr;
            }

            if (newMaxKw <= 0.0) {
              throw new RangeError("Неможливо обнулити всі 25 годин профілю: принаймні одна година повинна бути > 0.");
            }

            cTarget.peakPowerKw = newMaxKw;
            var renormalized = [];
            for (var rn = 0; rn < 25; rn++) {
              renormalized.push((absCurve[rn] / newMaxKw) * 100.0);
            }
            cTarget.profile = renormalized;
            needsRecalc = true;
            break;
          }

          default:
            throw new Error("Невідомий тип дії Store: " + action.type);
        }

        return needsRecalc;
      });
    }

    loadScenario(BENCHMARK_VARIANT_ID, "benchmark");

    return {
      getState: getState,
      subscribe: subscribe,
      dispatch: dispatch,
      recalculate: recalculate,
      resetSandbox: resetSandbox
    };
  }

  Core.Store = {
    create: createStore
  };
})(window.EPPMLoadLab.Core, window.EPPMLoadLab.Data);