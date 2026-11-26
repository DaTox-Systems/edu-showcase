window.EPPMLoadLab = window.EPPMLoadLab || {};
window.EPPMLoadLab.Core = window.EPPMLoadLab.Core || {};

(function (Core) {
  "use strict";

  var Spline = Core.Spline;

  // Validates an hourly vector of 25 discrete points [t = 0..24 h]
  function validateHourlyVector(arr, label) {
    if (!Array.isArray(arr) || arr.length !== 25) {
      throw new Error((label || "Hourly curve") + " must be an array of exactly 25 points (t = 0..24).");
    }
    for (var i = 0; i < 25; i++) {
      if (typeof arr[i] !== "number" || !Number.isFinite(arr[i]) || arr[i] < 0) {
        throw new TypeError((label || "Hourly curve") + " contains invalid value at hour " + i + ": " + arr[i]);
      }
    }
  }

  // 1. Single Load Curve Evaluator (Part 1 / Individual Consumer)
  // Double-precision computation, no intermediate rounding, exact analytical spline integration
  function evaluateResidentialCurve(hourlyValues) {
    validateHourlyVector(hourlyValues, "Residential load profile");

    // 1. Peak power & hour
    var pMaxHourly = -Infinity;
    var tMaxHour = 0;
    for (var t = 0; t < 25; t++) {
      if (hourlyValues[t] > pMaxHourly) {
        pMaxHourly = hourlyValues[t];
        tMaxHour = t;
      }
    }

    // 2. Integration methods for daily energy W_a (24 hourly intervals, dt = 1.0 h)
    var sumTrapezoids = 0.0;
    var hourlyEnergy = [];
    var sumLeft = 0.0;
    var sumRight = 0.0;

    for (var i = 0; i < 24; i++) {
      var eStep = ((hourlyValues[i] + hourlyValues[i + 1]) / 2.0) * 1.0;
      hourlyEnergy.push(eStep);
      sumTrapezoids += eStep;
      sumLeft += hourlyValues[i] * 1.0;
      sumRight += hourlyValues[i + 1] * 1.0;
    }

    // 3. Exact Piecewise Analytical Spline Integration
    var xHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    var sp = Spline.create(xHours, hourlyValues);
    var wSpline = sp.integrate(0.0, 24.0);

    // Continuous 30-min sliding window average search
    var sliding30 = sp.findMaxSlidingWindowAverage(0.5);
    var pMax30min = sliding30.maxAverage;

    // 4. Mean powers & fill factors with explicit methodological naming
    var pAvgDaily = sumTrapezoids / 24.0;
    var pAvgSpline = wSpline / 24.0;

    var kFillHourlyPeak = pMaxHourly > 0 ? (pAvgDaily / pMaxHourly) : 0.0;
    var kFill30minPeak = pMax30min > 0 ? (pAvgSpline / pMax30min) : 0.0;

    return {
      pMaxHourly: pMaxHourly,
      tMaxHour: tMaxHour,
      pMax30min: pMax30min,
      pMax30Window: {
        start: sliding30.tStart,
        end: sliding30.tEnd,
        center: sliding30.tCenter,
        candidates: sliding30.candidatesCount
      },
      wTrapezoids: sumTrapezoids,
      wLeftRectangles: sumLeft,
      wRightRectangles: sumRight,
      wSpline: wSpline,
      pAvgDaily: pAvgDaily,
      pAvgSpline: pAvgSpline,
      kFillHourlyPeak: kFillHourlyPeak,
      kFill30minPeak: kFill30minPeak,
      hourlyEnergy: hourlyEnergy,
      splineInstance: sp,
      // Rounded presentation helpers for UI display
      formatted: {
        pMaxHourly: Math.round(pMaxHourly * 100) / 100,
        pMax30min: Math.round(pMax30min * 100) / 100,
        wTrapezoids: Math.round(sumTrapezoids * 100) / 100,
        wSpline: Math.round(wSpline * 100) / 100,
        pAvgDaily: Math.round(pAvgDaily * 100) / 100,
        kFillHourlyPeak: Math.round(kFillHourlyPeak * 1000) / 1000,
        kFill30minPeak: Math.round(kFill30minPeak * 1000) / 1000
      }
    };
  }

  // Validates a materialized Consumer DTO array (I-02, I-03, I-05)
  function validateConsumerDTOs(consumers) {
    if (!Array.isArray(consumers) || consumers.length < 1) {
      throw new Error("Substation requires a non-empty array of materialized Consumer DTOs.");
    }
    var seenIds = new Set();
    for (var i = 0; i < consumers.length; i++) {
      var c = consumers[i];
      if (!c || typeof c !== "object") {
        throw new TypeError("Consumer entry at index " + i + " must be an object.");
      }
      if (typeof c.id !== "string" || c.id.trim().length === 0) {
        throw new TypeError("Consumer at index " + i + " must have a non-empty string id.");
      }
      if (seenIds.has(c.id)) {
        throw new Error("Duplicate consumer id detected: [" + c.id + "]. All consumer IDs must be unique.");
      }
      seenIds.add(c.id);

      if (typeof c.name !== "string" || c.name.trim().length === 0) {
        throw new TypeError("Consumer [" + c.id + "] must have a non-empty string name.");
      }
      if (typeof c.category !== "string" || c.category.trim().length === 0) {
        throw new TypeError("Consumer [" + c.id + "] must have a valid string category.");
      }
      // I-03: dbnCategory must be explicitly assigned (string or null), never implicitly guessed from category
      if (c.dbnCategory !== null && (typeof c.dbnCategory !== "string" || c.dbnCategory.trim().length === 0)) {
        throw new TypeError("Consumer [" + c.id + "] must explicitly specify dbnCategory as a non-empty string or null.");
      }
      if (typeof c.peakPowerKw !== "number" || !Number.isFinite(c.peakPowerKw) || c.peakPowerKw < 0) {
        throw new TypeError("Consumer [" + c.id + "] must have a finite non-negative peakPowerKw.");
      }

      validateHourlyVector(c.profile, "Consumer [" + c.id + "] profile");

      // I-05: Ensure profile is strictly normalized to 100% peak so peakPowerKw equals actual curve peak
      var maxProf = -Infinity;
      for (var pIdx = 0; pIdx < 25; pIdx++) {
        if (c.profile[pIdx] > maxProf) maxProf = c.profile[pIdx];
      }
      if (Math.abs(maxProf - 100.0) > 1e-6) {
        throw new RangeError("Consumer [" + c.id + "] profile must be normalized to 100% peak (actual max: " + maxProf + "%).");
      }
    }
  }

  // 2. Substation 0.4 kV Bus Evaluator (Universal Multi-Consumer Architecture)
  function evaluateSubstationBus(consumers) {
    var DBN = window.EPPMLoadLab.Data.DBN;
    validateConsumerDTOs(consumers);

    // 1. Calculate individual 24-hour profiles in full double precision
    var evaluatedObjects = [];
    var sumCurve = new Float64Array(25);
    var arithmeticSum = 0.0;

    for (var k = 0; k < consumers.length; k++) {
      var c = consumers[k];
      var pPeak = c.peakPowerKw;
      arithmeticSum += pPeak;

      var objCurve = [];
      for (var t = 0; t < 25; t++) {
        var valT = (c.profile[t] / 100.0) * pPeak;
        objCurve.push(valT);
        sumCurve[t] += valT;
      }

      var metrics = evaluateResidentialCurve(objCurve);
      evaluatedObjects.push({
        id: c.id,
        name: c.name,
        category: c.category,
        dbnCategory: c.dbnCategory,
        peakPowerKw: pPeak,
        curve: objCurve,
        metrics: metrics
      });
    }

    // 2. Graphical summation curve evaluation
    var sumCurveArr = Array.prototype.slice.call(sumCurve);
    var evalSum = evaluateResidentialCurve(sumCurveArr);

    // 3. Largest Individual Peak Power Consumer Detection: max(peakPowerKw)
    var largestIdx = 0;
    var maxPeakVal = evaluatedObjects[0].peakPowerKw;
    for (var m = 1; m < evaluatedObjects.length; m++) {
      if (evaluatedObjects[m].peakPowerKw > maxPeakVal) {
        maxPeakVal = evaluatedObjects[m].peakPowerKw;
        largestIdx = m;
      }
    }
    var largestConsumer = evaluatedObjects[largestIdx];

    // 4. DBN V.2.5-23:2025 Calculation with major-row verification check (I-04)
    var majorDbnCat = largestConsumer.dbnCategory;
    var majorRowInfo = (majorDbnCat !== null) ? DBN.getRowInfo(majorDbnCat) : { supported: false, verificationStatus: "unverified" };
    var majorRowSupported = majorRowInfo.supported;

    var coverageStatus = "unavailable";
    var normativeVerificationStatus = "unverified";

    var partialConfirmedContributionKw = null;
    var partialWithAssumptionsContributionKw = null;
    var pDbnStrict = null;
    var pDbnWithAssumptions = null;

    var participationDetails = [];
    var conditionalObjects = [];
    var unconfirmedObjects = [];

    if (majorRowSupported) {
      var runningConfirmed = largestConsumer.peakPowerKw;
      var runningWithAssumptions = largestConsumer.peakPowerKw;
      var hasPendingAudit = (majorRowInfo.verificationStatus !== "verified");

      for (var j = 0; j < evaluatedObjects.length; j++) {
        if (j === largestIdx) continue;
        var secObj = evaluatedObjects[j];
        var secCat = secObj.dbnCategory;
        var factorRes = (secCat !== null)
          ? DBN.getFactor(majorDbnCat, secCat)
          : {
              available: false,
              factor: null,
              status: "unavailable",
              verificationStatus: "not_applicable",
              reason: "Категорія ДБН для [" + secObj.id + "] явно задана як null."
            };

        var factorVal = factorRes.available ? factorRes.factor : null;
        var contribKw = factorRes.available ? (factorVal * secObj.peakPowerKw) : 0.0;

        if (factorRes.status === "confirmed") {
          runningConfirmed += contribKw;
          runningWithAssumptions += contribKw;
          if (factorRes.verificationStatus !== "verified") {
            hasPendingAudit = true;
          }
        } else if (factorRes.status === "conditional_assumption") {
          runningWithAssumptions += contribKw;
          conditionalObjects.push({
            id: secObj.id,
            name: secObj.name,
            category: secObj.category,
            factor: factorVal,
            reason: factorRes.reason
          });
        } else {
          unconfirmedObjects.push({
            id: secObj.id,
            name: secObj.name,
            category: secObj.category,
            status: factorRes.status,
            reason: factorRes.reason
          });
        }

        participationDetails.push({
          id: secObj.id,
          name: secObj.name,
          category: secObj.category,
          factor: factorVal,
          status: factorRes.status,
          verificationStatus: factorRes.verificationStatus,
          dbnRow: factorRes.dbnRow || null,
          dbnCol: factorRes.dbnCol || null,
          contributionKw: factorRes.available ? contribKw : null,
          reason: factorRes.reason
        });
      }

      partialConfirmedContributionKw = runningConfirmed;
      partialWithAssumptionsContributionKw = runningWithAssumptions;

      if (unconfirmedObjects.length > 0) {
        coverageStatus = "incomplete";
        normativeVerificationStatus = "unverified";
        pDbnStrict = null;
        pDbnWithAssumptions = null;
      } else if (conditionalObjects.length > 0) {
        coverageStatus = "conditional";
        normativeVerificationStatus = "unverified";
        pDbnStrict = null;
        pDbnWithAssumptions = runningWithAssumptions;
      } else {
        coverageStatus = "complete";
        normativeVerificationStatus = hasPendingAudit ? "pending_pdf_audit" : "verified";
        pDbnStrict = runningConfirmed;
        pDbnWithAssumptions = runningConfirmed;
      }
    }

    // 5. Method comparison metrics (relative divergence vs graphical hourly max)
    var comparisonTarget = pDbnWithAssumptions;
    var deltaKw = (comparisonTarget !== null) ? (comparisonTarget - evalSum.pMaxHourly) : null;
    var relativeDiffPercent = (deltaKw !== null && evalSum.pMaxHourly > 0)
      ? (Math.abs(deltaKw) / evalSum.pMaxHourly) * 100.0
      : null;

    var diversitySavingKw = arithmeticSum - evalSum.pMaxHourly;
    var diversitySavingPercent = arithmeticSum > 0 ? (diversitySavingKw / arithmeticSum) * 100.0 : 0.0;

    // 6. Vector Apparent Power S_sum(t) = sqrt(P_sum^2 + Q_sum^2)
    var ALLOWED_COS_PHI_STATUSES = [
      "verified",
      "verified_normative",
      "normative_pending_pdf_check",
      "conditional_educational",
      "conditional_reference",
      "conditional_assumption",
      "explicit_user_value"
    ];

    function computeApparentProfile(cosPhiMap, sNomT) {
      if (!cosPhiMap || typeof cosPhiMap !== "object") {
        throw new TypeError("Explicit cosPhi map is required.");
      }
      if (sNomT !== undefined && (typeof sNomT !== "number" || !Number.isFinite(sNomT) || sNomT <= 0)) {
        throw new RangeError("Transformer nominal rating sNomT must be a finite positive number.");
      }

      // Safe preset wrapper check (only unwrap if formal preset structure with id & values object)
      var isPresetWrapper = (typeof cosPhiMap.id === "string" && cosPhiMap.values && typeof cosPhiMap.values === "object" && !Array.isArray(cosPhiMap.values));
      var valuesMap = isPresetWrapper ? cosPhiMap.values : cosPhiMap;

      function resolveCosPhi(objItem) {
        var entry = null;
        if (Object.prototype.hasOwnProperty.call(valuesMap, objItem.id)) {
          entry = valuesMap[objItem.id];
        } else if (Object.prototype.hasOwnProperty.call(valuesMap, objItem.category)) {
          entry = valuesMap[objItem.category];
        } else {
          throw new RangeError("Відсутнє явне значення cos φ для споживача [" + objItem.id + "] (категорія: " + objItem.category + ").");
        }

        var cPhi = (entry && typeof entry === "object") ? entry.value : entry;
        if (typeof cPhi !== "number" || !Number.isFinite(cPhi) || cPhi <= 0.0 || cPhi > 1.0) {
          throw new RangeError("Некоректний cos φ для [" + objItem.id + "]: повинен задовольняти 0 < cos φ <= 1 (отримано: " + cPhi + ").");
        }

        var cStatus = (entry && typeof entry === "object" && entry.status !== undefined)
          ? entry.status
          : "explicit_user_value";
        if (ALLOWED_COS_PHI_STATUSES.indexOf(cStatus) === -1) {
          throw new TypeError("Неприпустимий статус cos φ [" + cStatus + "] для споживача [" + objItem.id + "].");
        }

        return {
          consumerId: objItem.id,
          category: objItem.category,
          value: cPhi,
          status: cStatus,
          source: (entry && typeof entry === "object" && entry.source) ? entry.source : "Задано користувачем"
        };
      }

      var cosPhiDetails = [];
      var tanPhis = [];
      for (var objIdx = 0; objIdx < evaluatedObjects.length; objIdx++) {
        var resolved = resolveCosPhi(evaluatedObjects[objIdx]);
        cosPhiDetails.push(resolved);
        tanPhis.push(Math.tan(Math.acos(resolved.value)));
      }

      var qCurve = [];
      var sCurve = [];
      var loadRatioCurve = [];
      var sMax = 0.0;

      for (var t = 0; t < 25; t++) {
        var qTotalT = 0.0;
        for (var idxObj = 0; idxObj < evaluatedObjects.length; idxObj++) {
          qTotalT += evaluatedObjects[idxObj].curve[t] * tanPhis[idxObj];
        }

        var pT = sumCurveArr[t];
        var sT = Math.sqrt(pT * pT + qTotalT * qTotalT);
        qCurve.push(qTotalT);
        sCurve.push(sT);
        if (sT > sMax) sMax = sT;

        if (sNomT !== undefined) {
          loadRatioCurve.push((sT / sNomT) * 100.0);
        }
      }

      return {
        qCurve: qCurve,
        sCurve: sCurve,
        sMax: sMax,
        sMaxBasis: "discrete_25_hourly_nodes",
        reactiveSignConvention: "lagging_inductive_positive_Q",
        loadRatioCurve: loadRatioCurve,
        cosPhiDetails: cosPhiDetails,
        formatted: {
          sMax: Math.round(sMax * 100) / 100
        }
      };
    }

    return {
      consumersCount: evaluatedObjects.length,
      evaluatedObjects: evaluatedObjects,
      sumCurve: sumCurveArr,
      peaks: {
        arithmeticSum: arithmeticSum,
        largestPeakPowerConsumer: {
          id: largestConsumer.id,
          name: largestConsumer.name,
          category: largestConsumer.category,
          peakPowerKw: largestConsumer.peakPowerKw,
          selectionCriterion: "largest_individual_peak_power_kw"
        }
      },
      methodDbn: {
        coverageStatus: coverageStatus,                         // "complete" | "conditional" | "incomplete" | "unavailable"
        normativeVerificationStatus: normativeVerificationStatus, // "verified" | "pending_pdf_audit" | "unverified"
        majorRowSupported: majorRowSupported,
        majorRowCanonical: majorRowInfo.canonicalRow || null,
        pDbnStrict: pDbnStrict,
        pDbnWithAssumptions: pDbnWithAssumptions,
        partialConfirmedContributionKw: partialConfirmedContributionKw,
        partialWithAssumptionsContributionKw: partialWithAssumptionsContributionKw,
        majorCategoryRow: majorDbnCat,
        participationDetails: participationDetails,
        conditionalObjects: conditionalObjects,
        unconfirmedObjects: unconfirmedObjects
      },
      methodGraphic: {
        pSumMaxHourly: evalSum.pMaxHourly,
        tSumMaxHour: evalSum.tMaxHour,
        pSumMax30min: evalSum.pMax30min,
        pSumMax30Window: evalSum.pMax30Window,
        wTotalTp: evalSum.wTrapezoids,
        wSplineTp: evalSum.wSpline,
        pAvgTp: evalSum.pAvgDaily,
        kFillHourlyPeak: evalSum.kFillHourlyPeak,
        kFill30minPeak: evalSum.kFill30minPeak
      },
      comparison: {
        basis: "graphical_hourly_max",
        deltaKw: deltaKw,
        relativeDiffPercent: relativeDiffPercent,
        diversitySavingKw: diversitySavingKw,
        diversitySavingPercent: diversitySavingPercent
      },
      formatted: {
        arithmeticSum: Math.round(arithmeticSum * 100) / 100,
        pDbnStrict: pDbnStrict !== null ? Math.round(pDbnStrict * 100) / 100 : null,
        pDbnWithAssumptions: pDbnWithAssumptions !== null ? Math.round(pDbnWithAssumptions * 100) / 100 : null,
        partialConfirmedContributionKw: partialConfirmedContributionKw !== null ? Math.round(partialConfirmedContributionKw * 100) / 100 : null,
        pSumMaxHourly: Math.round(evalSum.pMaxHourly * 100) / 100,
        pSumMax30min: Math.round(evalSum.pMax30min * 100) / 100,
        wTotalTp: Math.round(evalSum.wTrapezoids * 100) / 100,
        deltaKw: deltaKw !== null ? Math.round(deltaKw * 100) / 100 : null,
        relativeDiffPercent: relativeDiffPercent !== null ? Math.round(relativeDiffPercent * 100) / 100 : null,
        diversitySavingKw: Math.round(diversitySavingKw * 100) / 100,
        diversitySavingPercent: Math.round(diversitySavingPercent * 100) / 100
      },
      computeApparent: computeApparentProfile
    };
  }

  // Evaluates Golden Reference Example from Manual Table 2.3 (Pages 10-11)
  function evaluateGoldenExample() {
    var ex = window.EPPMLoadLab.Data && window.EPPMLoadLab.Data.Variants && window.EPPMLoadLab.Data.Variants.EXAMPLE_TABLE_2_3;
    if (!ex || !Array.isArray(ex.gas) || !Array.isArray(ex.elec) || !Array.isArray(ex.supermarket)) {
      throw new Error("Golden Example reference dataset (Table 2.3) is missing or corrupted.");
    }
    validateHourlyVector(ex.gas, "Golden Example Gas");
    validateHourlyVector(ex.elec, "Golden Example Elec");
    validateHourlyVector(ex.supermarket, "Golden Example Supermarket");

    var sumCurve = [];
    for (var t = 0; t < 25; t++) {
      sumCurve.push(ex.gas[t] + ex.elec[t] + ex.supermarket[t]);
    }
    var evalSum = evaluateResidentialCurve(sumCurve);
    var pub = ex.publishedReference;
    return {
      sumCurve: sumCurve,
      calculated: {
        pMaxHourly: evalSum.pMaxHourly,
        tMaxHourly: evalSum.tMaxHour,
        pMax30min: evalSum.pMax30min,
        pMax30Window: evalSum.pMax30Window
      },
      publishedReference: pub,
      validation: {
        discreteDifferenceKw: evalSum.pMaxHourly - pub.valueKw,
        splineDifferenceKw: null,
        splineComparisonStatus: "unavailable_without_30min_reference"
      }
    };
  }

  Core.Integrator = {
    evaluateResidential: evaluateResidentialCurve,
    evaluateSubstation: evaluateSubstationBus,
    evaluateGoldenExample: evaluateGoldenExample
  };
})(window.EPPMLoadLab.Core);