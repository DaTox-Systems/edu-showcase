window.EPPMLoadLab = window.EPPMLoadLab || {};
window.EPPMLoadLab.Data = window.EPPMLoadLab.Data || {};

(function (Data) {
  "use strict";

  // Academic identity of the Department and Lecturer
  var ACADEMIC_INFO = {
    university: "Національний технічний університет «Дніпровська політехніка»",
    faculty: "Інститут електроенергетики (ЕТФ)",
    department: "Кафедра електроенергетики",
    lecturer: "Рухлова Наталія Юріївна",
    lecturerTitle: "канд. техн. наук, доцент кафедри електроенергетики",
    lecturerRoom: "Кімната: 7/903",
    lecturerPhone: "Тел.: 4-91",
    lecturerEmail: "rukhlova.n.yu@nmu.one",
    lecturerProfileUrl: "https://se.nmu.org.ua/ua/kafedra/vykladachi/Ruhlova/",
    lecturerScopusUrl: "https://www.scopus.com/authid/detail.uri?authorId=55991694900",
    courseHead: "д-р техн. наук, проф. Папаїка Юрій Анатолійович (зав. кафедри)",
    author: "Дідов Платон Андрійович (гр. 141-24-2, Варіант №7)"
  };

  // Raw data from Table 1.1 (25 hourly points: t = 0..24) for base variants 1..10
  var BASE_TABLE_1_1 = {
    1: {
      zbg: [0.68, 0.78, 0.77, 0.77, 0.85, 0.79, 0.84, 1.0, 1.0, 0.91, 1.0, 0.82, 0.78, 1.19, 1.1, 0.95, 0.95, 1.1, 1.0, 0.85, 0.81, 0.75, 0.79, 0.77, 0.73],
      zh:  [45, 38, 29, 23, 17, 21, 32, 46, 57, 45, 38, 39, 44, 47, 44, 56, 59, 66, 77, 72, 70, 69, 64, 57, 49]
    },
    2: {
      zbg: [0.71, 0.62, 0.60, 0.62, 0.73, 0.70, 0.84, 1.1, 1.0, 0.95, 1.0, 0.78, 0.71, 1.10, 1.2, 0.83, 0.90, 1.1, 1.0, 0.75, 0.88, 0.60, 0.75, 0.73, 0.70],
      zh:  [44, 33, 29, 27, 18, 21, 32, 49, 54, 43, 37, 39, 45, 47, 49, 55, 59, 66, 79, 71, 72, 67, 61, 55, 45]
    },
    3: {
      zbg: [0.72, 0.65, 0.61, 0.64, 0.74, 0.75, 0.81, 1.0, 1.0, 0.90, 1.0, 0.83, 0.79, 1.14, 1.1, 0.80, 0.95, 1.1, 1.0, 0.70, 0.80, 0.62, 0.70, 0.73, 0.70],
      zh:  [45, 38, 29, 23, 17, 21, 32, 46, 57, 45, 38, 39, 44, 47, 44, 56, 59, 66, 77, 72, 70, 69, 64, 57, 49]
    },
    4: {
      zbg: [0.68, 0.78, 0.77, 0.77, 0.85, 0.79, 0.84, 1.0, 1.0, 0.91, 1.0, 0.82, 0.78, 1.19, 1.1, 0.95, 0.95, 1.1, 1.0, 0.85, 0.81, 0.75, 0.79, 0.77, 0.73],
      zh:  [44, 33, 29, 27, 18, 21, 32, 49, 54, 43, 37, 39, 45, 47, 49, 55, 59, 66, 79, 71, 72, 67, 61, 55, 45]
    },
    5: {
      zbg: [0.72, 0.65, 0.61, 0.64, 0.74, 0.75, 0.81, 1.0, 1.0, 0.90, 1.0, 0.83, 0.79, 1.14, 1.1, 0.80, 0.95, 1.1, 1.0, 0.70, 0.80, 0.62, 0.70, 0.73, 0.70],
      zh:  [45, 38, 29, 23, 17, 21, 32, 46, 57, 45, 38, 39, 44, 47, 44, 56, 59, 66, 77, 72, 70, 69, 64, 57, 49]
    },
    6: {
      zbg: [0.78, 0.68, 0.67, 0.67, 0.75, 0.77, 0.82, 1.0, 1.0, 0.90, 1.0, 0.81, 0.74, 1.17, 1.1, 0.85, 0.98, 1.1, 1.0, 0.75, 0.80, 0.65, 0.76, 0.75, 0.78],
      zh:  [48, 35, 25, 22, 18, 20, 30, 45, 55, 43, 37, 38, 42, 46, 48, 53, 58, 63, 75, 70, 72, 68, 63, 54, 48]
    },
    7: {
      zbg: [0.70, 0.60, 0.60, 0.60, 0.70, 0.70, 0.80, 1.0, 1.0, 0.90, 1.0, 0.80, 0.70, 1.10, 1.1, 0.80, 0.90, 1.1, 1.0, 0.70, 0.80, 0.60, 0.70, 0.70, 0.70],
      zh:  [45, 38, 28, 22, 19, 22, 31, 48, 53, 41, 39, 37, 42, 46, 47, 53, 58, 63, 78, 70, 72, 66, 63, 56, 49]
    },
    8: {
      zbg: [0.72, 0.65, 0.61, 0.64, 0.74, 0.75, 0.81, 1.0, 1.0, 0.90, 1.0, 0.83, 0.79, 1.14, 1.1, 0.80, 0.95, 1.1, 1.0, 0.70, 0.80, 0.62, 0.70, 0.73, 0.70],
      zh:  [44, 33, 29, 27, 18, 21, 32, 49, 54, 43, 37, 39, 45, 47, 49, 55, 59, 66, 79, 71, 72, 67, 61, 55, 45]
    },
    9: {
      zbg: [0.79, 0.67, 0.66, 0.66, 0.77, 0.77, 0.83, 1.0, 1.0, 0.80, 1.0, 0.87, 0.72, 1.19, 1.15, 0.89, 0.95, 1.1, 1.0, 0.77, 0.78, 0.68, 0.70, 0.70, 0.80],
      zh:  [40, 35, 29, 25, 19, 22, 31, 48, 53, 41, 39, 37, 42, 46, 47, 53, 58, 63, 78, 70, 72, 66, 63, 56, 49]
    },
    10: {
      zbg: [0.73, 0.50, 0.67, 0.61, 0.70, 0.80, 0.83, 1.0, 1.0, 0.89, 1.0, 0.85, 0.73, 1.14, 1.1, 0.20, 0.95, 1.1, 1.0, 0.70, 0.81, 0.68, 0.72, 0.77, 0.80],
      zh:  [50, 37, 29, 20, 19, 25, 33, 44, 54, 47, 39, 35, 43, 48, 49, 55, 57, 69, 71, 77, 75, 69, 65, 58, 50]
    }
  };

  // Table 2.1: Object definitions for each variant on the 0.4 kV bus of the TP
  var OBJECT_DEFINITIONS = {
    1:  { obj1Name: "Житловий будинок із газовими плитами", obj1Mult: 1.0, obj2Name: "Житловий будинок з електроплитами", obj2Mult: 2.0, obj3Name: "Універсам", obj3Mult: 1.1, obj3Type: "supermarket" },
    2:  { obj1Name: "Житловий будинок із газовими плитами", obj1Mult: 1.0, obj2Name: "Житловий будинок з електроплитами", obj2Mult: 2.1, obj3Name: "Їдальня", obj3Mult: 0.6, obj3Type: "canteen" },
    3:  { obj1Name: "Житловий будинок із газовими плитами", obj1Mult: 1.0, obj2Name: "Житловий будинок з електроплитами", obj2Mult: 2.2, obj3Name: "Поліклініка", obj3Mult: 0.5, obj3Type: "polyclinic" },
    4:  { obj1Name: "Житловий будинок із газовими плитами", obj1Mult: 1.0, obj2Name: "Житловий будинок з електроплитами", obj2Mult: 2.3, obj3Name: "Школа", obj3Mult: 0.4, obj3Type: "school" },
    5:  { obj1Name: "Житловий будинок із газовими плитами", obj1Mult: 1.0, obj2Name: "Житловий будинок з електроплитами", obj2Mult: 2.4, obj3Name: "Побуткомбінат", obj3Mult: 0.5, obj3Type: "service_center" },
    6:  { obj1Name: "Житловий будинок із газовими плитами", obj1Mult: 1.0, obj2Name: "Житловий будинок з електроплитами", obj2Mult: 2.5, obj3Name: "Теплопункт", obj3Mult: 0.8, obj3Type: "heat_point" },
    7:  { obj1Name: "Житловий будинок із газовими плитами", obj1Mult: 1.0, obj2Name: "Житловий будинок з електроплитами", obj2Mult: 2.3, obj3Name: "Тягова підстанція", obj3Mult: 1.2, obj3Type: "traction_substation" },
    8:  { obj1Name: "Житловий будинок із газовими плитами", obj1Mult: 1.0, obj2Name: "Житловий будинок з електроплитами", obj2Mult: 2.2, obj3Name: "Водонасосна", obj3Mult: 0.7, obj3Type: "water_pump" },
    9:  { obj1Name: "Житловий будинок із газовими плитами", obj1Mult: 1.0, obj2Name: "Житловий будинок з електроплитами", obj2Mult: 2.6, obj3Name: "Заклад дошкільної освіти", obj3Mult: 0.4, obj3Type: "kindergarten" },
    10: { obj1Name: "Житловий будинок із газовими плитами", obj1Mult: 1.0, obj2Name: "Житловий будинок з електроплитами", obj2Mult: 2.2, obj3Name: "Кафе", obj3Mult: 0.6, obj3Type: "cafe" }
  };

  // Table 2.2: Standard typical daily profiles in percent of maximum (% of P_max, t = 0..24)
  var STANDARD_PROFILES = {
    residential_gas: [30, 20, 18, 15, 15, 15, 32, 50, 35, 20, 25, 30, 28, 25, 28, 30, 35, 40, 55, 70, 85, 100, 70, 40, 30],
    residential_elec:[22, 15, 15, 15, 15, 15, 42, 60, 55, 50, 50, 50, 50, 50, 45, 40, 45, 50, 75, 100, 100, 95, 60, 30, 22],
    supermarket:     [60, 60, 60, 60, 60, 60, 60, 60, 75, 90, 95, 100, 95, 85, 85, 90, 90, 90, 90, 90, 85, 80, 70, 60, 60],
    canteen:         [50, 50, 50, 50, 50, 50, 55, 60, 70, 80, 85, 90, 95, 100, 100, 100, 95, 90, 80, 70, 65, 60, 55, 50, 50],
    polyclinic:      [20, 20, 20, 20, 20, 20, 25, 30, 55, 80, 85, 90, 85, 80, 75, 70, 75, 80, 90, 100, 75, 70, 45, 20, 20],
    school:          [10, 10, 10, 10, 10, 10, 15, 20, 40, 80, 100, 75, 55, 40, 40, 40, 40, 35, 20, 17, 12, 10, 10, 10, 10],
    service_center:  [25, 20, 20, 20, 20, 20, 25, 30, 60, 90, 95, 100, 98, 95, 92, 90, 92, 95, 92, 90, 80, 70, 50, 30, 25],
    heat_point:      [95, 95, 92, 90, 90, 90, 95, 100, 98, 95, 92, 90, 92, 95, 95, 95, 95, 95, 98, 100, 100, 100, 98, 95, 95],
    traction_substation: [48, 45, 32, 20, 28, 35, 55, 75, 88, 100, 90, 80, 78, 75, 78, 80, 88, 95, 92, 90, 80, 70, 60, 50, 48],
    water_pump:      [90, 90, 90, 90, 85, 80, 85, 90, 95, 100, 98, 95, 98, 100, 100, 100, 98, 95, 95, 95, 98, 100, 95, 90, 90],
    kindergarten:    [10, 10, 10, 10, 10, 10, 60, 100, 100, 80, 80, 75, 90, 100, 80, 60, 60, 40, 30, 10, 10, 10, 10, 10, 10],
    cafe:            [50, 50, 50, 50, 50, 50, 70, 75, 95, 95, 95, 95, 100, 100, 100, 80, 70, 70, 85, 100, 100, 100, 95, 90, 50]
  };

  // Table 2.3 (Pages 10-11 of ЕППМ-1_2026.pdf) - Golden Reference Example
  var EXAMPLE_TABLE_2_3 = {
    title: "Контрольний приклад методичних вказівок (Табл. 2.3, стор. 10–11)",
    publishedReference: {
      valueKw: 473.0,
      type: "discrete_hourly",
      nodeHour: 20,
      reportedManualWindow: [19.25, 19.75],
      sourcePage: "10 (PDF стор. 11)",
      auditNote: "Звірено з оригіналом PDF: у формулі (2.2) методички зазначено межі [19,25; 19,75] і результат 473 кВт, що є друкарською неузгодженістю оригіналу — сума точок Табл. 2.3 дає 473 кВт о 20:00."
    },
    gas:         [30, 20, 18, 15, 15, 15, 32, 50, 35, 20, 25, 30, 28, 25, 28, 30, 35, 40, 55, 70, 85, 100, 70, 40, 30],
    elec:        [55, 38, 38, 38, 38, 38, 105, 150, 138, 125, 125, 125, 125, 125, 112, 110, 112, 125, 188, 260, 260, 156, 150, 75, 75],
    supermarket: [90, 90, 90, 90, 90, 90, 90, 90, 112, 90, 135, 150, 142, 128, 128, 130, 135, 135, 135, 135, 128, 120, 105, 90, 90]
  };

  // Explicit list of Table 2.1 non-residential academic objects covered by educational presets
  var SUPPORTED_ACADEMIC_SPECIAL_CATEGORIES = [
    "supermarket",
    "canteen",
    "polyclinic",
    "school",
    "service_center",
    "heat_point",
    "traction_substation",
    "water_pump",
    "kindergarten",
    "cafe"
  ];
  Object.freeze(SUPPORTED_ACADEMIC_SPECIAL_CATEGORIES);

  // Power factor presets: Strict per-category status separation (no catch-all fallback)
  var COS_PHI_PRESETS = {
    educational_unified: {
      id: "educational_unified",
      label: "Навчальне спрощення (єдиний cos φ = 0,95)",
      values: {
        residential_elec: { value: 0.95, status: "conditional_educational", source: "Навчальне спрощення методички" },
        residential_gas:  { value: 0.95, status: "conditional_educational", source: "Навчальне спрощення методички" },
        academic_special: { value: 0.95, status: "conditional_educational", source: "Навчальне спрощення методички (об'єкти Табл. 2.1)" }
      }
    },
    dbn_no_ac: {
      id: "dbn_no_ac",
      label: "Таблиця 6.5 ДБН (без кондиціонерів) + довідковий для об'єктів Табл. 2.1",
      values: {
        residential_elec: { value: 0.98, status: "verified", source: "ДБН В.2.5-23:2025, Табл. 6.5, стор. 24 (звірено з PDF)" },
        residential_gas:  { value: 0.96, status: "verified", source: "ДБН В.2.5-23:2025, Табл. 6.5, стор. 24 (звірено з PDF)" },
        academic_special: { value: 0.90, status: "conditional_reference", source: "Довідкове навчальне значення (поза Табл. 6.5 ДБН, для об'єктів Табл. 2.1)" }
      }
    },
    dbn_with_ac: {
      id: "dbn_with_ac",
      label: "Таблиця 6.5 ДБН (із кондиціонерами) + довідковий для об'єктів Табл. 2.1",
      values: {
        residential_elec: { value: 0.93, status: "verified", source: "ДБН В.2.5-23:2025, Табл. 6.5, стор. 24 (звірено з PDF)" },
        residential_gas:  { value: 0.92, status: "verified", source: "ДБН В.2.5-23:2025, Табл. 6.5, стор. 24 (звірено з PDF)" },
        academic_special: { value: 0.90, status: "conditional_reference", source: "Довідкове навчальне значення (поза Табл. 6.5 ДБН, для об'єктів Табл. 2.1)" }
      }
    }
  };

  function deepFreezePreset(preset) {
    Object.freeze(preset.values.residential_elec);
    Object.freeze(preset.values.residential_gas);
    Object.freeze(preset.values.academic_special);
    Object.freeze(preset.values);
    Object.freeze(preset);
  }

  // Deep Freezing for Data Immutability
  Object.freeze(ACADEMIC_INFO);
  for (var k in BASE_TABLE_1_1) {
    Object.freeze(BASE_TABLE_1_1[k].zbg);
    Object.freeze(BASE_TABLE_1_1[k].zh);
    Object.freeze(BASE_TABLE_1_1[k]);
  }
  Object.freeze(BASE_TABLE_1_1);
  for (var objK in OBJECT_DEFINITIONS) {
    Object.freeze(OBJECT_DEFINITIONS[objK]);
  }
  Object.freeze(OBJECT_DEFINITIONS);
  for (var pK in STANDARD_PROFILES) {
    Object.freeze(STANDARD_PROFILES[pK]);
  }
  Object.freeze(STANDARD_PROFILES);
  Object.freeze(EXAMPLE_TABLE_2_3.publishedReference);
  Object.freeze(EXAMPLE_TABLE_2_3.gas);
  Object.freeze(EXAMPLE_TABLE_2_3.elec);
  Object.freeze(EXAMPLE_TABLE_2_3.supermarket);
  Object.freeze(EXAMPLE_TABLE_2_3);
  deepFreezePreset(COS_PHI_PRESETS.educational_unified);
  deepFreezePreset(COS_PHI_PRESETS.dbn_no_ac);
  deepFreezePreset(COS_PHI_PRESETS.dbn_with_ac);
  Object.freeze(COS_PHI_PRESETS);

  // Strict Variant Resolver (V-01: rejects booleans, null, empty strings, floats, out-of-range)
  function getVariantData(variantNumber) {
    var v;
    if (typeof variantNumber === "number") {
      v = variantNumber;
    } else if (typeof variantNumber === "string" && /^\s*\d+\s*$/.test(variantNumber)) {
      v = Number(variantNumber.trim());
    } else {
      throw new TypeError("Номер навчального варіанта повинен бути цілим числом або числовим рядком (відхилено: " + String(variantNumber) + ").");
    }

    if (!Number.isInteger(v) || v < 1 || v > 30) {
      throw new RangeError("Номер навчального варіанта повинен бути цілим числом від 1 до 30 (отримано: " + variantNumber + ").");
    }

    var baseIndex = ((v - 1) % 10) + 1;
    var tens = Math.floor((v - 1) / 10);

    var deltaZbg = tens * 0.1;
    var deltaZh = tens * 1.0;

    var rawBase = BASE_TABLE_1_1[baseIndex];
    var zbgShifted = [];
    var zhShifted = [];
    var totalDerived = [];

    for (var i = 0; i < 25; i++) {
      var zbgVal = rawBase.zbg[i] + deltaZbg;
      var zhVal = rawBase.zh[i] + deltaZh;
      var totVal = zbgVal + zhVal;

      zbgShifted.push(zbgVal);
      zhShifted.push(zhVal);
      totalDerived.push(totVal);
    }

    var legacyObj = OBJECT_DEFINITIONS[baseIndex];

    var objectsList = [
      {
        id: "residential_gas",
        name: legacyObj.obj1Name,
        category: "residential_gas",
        multiplier: legacyObj.obj1Mult,
        profileId: "residential_gas",
        dbnCategory: "residential_gas"
      },
      {
        id: "residential_elec",
        name: legacyObj.obj2Name,
        category: "residential_elec",
        multiplier: legacyObj.obj2Mult,
        profileId: "residential_elec",
        dbnCategory: "residential_elec"
      },
      {
        id: legacyObj.obj3Type,
        name: legacyObj.obj3Name,
        category: legacyObj.obj3Type,
        multiplier: legacyObj.obj3Mult,
        profileId: legacyObj.obj3Type,
        dbnCategory: legacyObj.obj3Type
      }
    ];

    var provenance = {
      source_variant: baseIndex,
      transformation_rule: tens === 0 ? "identity (1..10)" : ("P_zbg + " + deltaZbg.toFixed(1) + ", P_zh + " + deltaZh.toFixed(0)),
      source_table: "Таблиця 1.1, Таблиця 2.1, Таблиця 2.2 (ЕППМ-1_2026.pdf, стор. 7, 9, 10)",
      totalIsDerivedFromZbgPlusZh: true,
      approval_status: v <= 10 ? "approved_by_manual" : "transformation_rule_approved_composition_unverified",
      transformation_approval: {
        status: v <= 10 ? "approved" : "approved_rule_only",
        compositionApproved: v <= 10,
        approvedBy: "ЕППМ-1_2026.pdf (звірено з оригіналом PDF)",
        sourceReference: v <= 10 ? "Табл. 1.1, Табл. 2.1 (стор. 7, 9)" : "Правило зсуву: примітка стор. 6–7; склад споживачів потребує підтвердження викладача"
      },
      consumer_composition_status: v <= 10 ? "explicit_in_table_2_1" : "mapped_by_decade_mod_10_requires_teacher_confirmation",
      requiresTeacherConfirmation: v > 10
    };

    return {
      variant: v,
      baseIndex: baseIndex,
      decadeShift: tens,
      zbg: zbgShifted,
      zh: zhShifted,
      total: totalDerived,
      objects: objectsList,
      provenance: provenance
    };
  }

  // Consumer Materializer: Full validation & normalization into Consumer DTOs
  // Checks unique IDs, finite multipliers, explicit dbnCategory (string or null), and 100% profile normalization
  function materializeVariantConsumers(variantData, basePowerKw) {
    if (!variantData || !Array.isArray(variantData.objects) || variantData.objects.length < 1) {
      throw new TypeError("Valid variantData object with non-empty objects array is required for materialization.");
    }
    if (typeof basePowerKw !== "number" || !Number.isFinite(basePowerKw) || basePowerKw <= 0) {
      throw new RangeError("Explicit positive basePowerKw is required for materializing consumers.");
    }

    var seenIds = new Set();
    return variantData.objects.map(function (desc, idx) {
      if (!desc || typeof desc !== "object") {
        throw new TypeError("Consumer descriptor at index " + idx + " must be an object.");
      }
      if (typeof desc.id !== "string" || desc.id.trim().length === 0) {
        throw new TypeError("Descriptor at index " + idx + " must have a non-empty string id.");
      }
      var cleanId = desc.id.trim();
      if (seenIds.has(cleanId)) {
        throw new Error("Duplicate descriptor id in variantData: [" + cleanId + "].");
      }
      seenIds.add(cleanId);

      if (typeof desc.name !== "string" || desc.name.trim().length === 0) {
        throw new TypeError("Descriptor [" + desc.id + "] must have a non-empty string name.");
      }
      if (typeof desc.category !== "string" || desc.category.trim().length === 0) {
        throw new TypeError("Descriptor [" + desc.id + "] must have a valid string category.");
      }
      if (typeof desc.multiplier !== "number" || !Number.isFinite(desc.multiplier) || desc.multiplier <= 0) {
        throw new RangeError("Descriptor [" + desc.id + "] multiplier must be a finite positive number (got: " + desc.multiplier + ").");
      }
      if (desc.dbnCategory !== null && (typeof desc.dbnCategory !== "string" || desc.dbnCategory.trim().length === 0)) {
        throw new TypeError("Descriptor [" + desc.id + "] dbnCategory must be explicitly specified as a non-empty string or null.");
      }
      if (typeof desc.profileId !== "string" || !Object.prototype.hasOwnProperty.call(STANDARD_PROFILES, desc.profileId)) {
        throw new Error("Profile [" + desc.profileId + "] for descriptor [" + desc.id + "] not found in STANDARD_PROFILES.");
      }

      var rawProf = STANDARD_PROFILES[desc.profileId];
      if (!Array.isArray(rawProf) || rawProf.length !== 25) {
        throw new Error("Profile [" + desc.profileId + "] must contain exactly 25 points.");
      }
      var maxProf = -Infinity;
      for (var t = 0; t < 25; t++) {
        var val = rawProf[t];
        if (typeof val !== "number" || !Number.isFinite(val) || val < 0) {
          throw new TypeError("Profile [" + desc.profileId + "] has invalid value at hour " + t);
        }
        if (val > maxProf) maxProf = val;
      }
      if (Math.abs(maxProf - 100.0) > 1e-6) {
        throw new RangeError("Profile [" + desc.profileId + "] must be normalized to 100% peak (actual max: " + maxProf + "%).");
      }

      return {
        id: cleanId,
        name: desc.name.trim(),
        category: desc.category.trim(),
        peakPowerKw: desc.multiplier * basePowerKw,
        profile: rawProf.slice(),
        dbnCategory: desc.dbnCategory
      };
    });
  }

  // Explicit cos_phi mapper using null-prototype map & strict uniqueness check
  function buildCosPhiMap(presetId, consumers) {
    var preset = Object.prototype.hasOwnProperty.call(COS_PHI_PRESETS, presetId) ? COS_PHI_PRESETS[presetId] : null;
    if (!preset) {
      throw new Error("Невідомий пресет cos φ: [" + presetId + "].");
    }
    if (!Array.isArray(consumers) || consumers.length < 1) {
      throw new TypeError("Для побудови карти cos φ потрібен непорожній масив споживачів.");
    }

    var map = Object.create(null);
    var seenIds = new Set();

    for (var i = 0; i < consumers.length; i++) {
      var c = consumers[i];
      if (!c || typeof c.id !== "string" || c.id.trim().length === 0) {
        throw new TypeError("Споживач з індексом " + i + " повинен мати коректний строковий id.");
      }
      if (seenIds.has(c.id)) {
        throw new Error("Дублювання ідентифікатора споживача [" + c.id + "] у buildCosPhiMap().");
      }
      seenIds.add(c.id);

      var entry = null;
      if (c.category === "residential_elec") {
        entry = preset.values.residential_elec;
      } else if (c.category === "residential_gas") {
        entry = preset.values.residential_gas;
      } else if (SUPPORTED_ACADEMIC_SPECIAL_CATEGORIES.indexOf(c.category) !== -1) {
        entry = preset.values.academic_special;
      } else {
        var catErr = new RangeError("Пресет [" + presetId + "] не містить cos φ для категорії [" + c.category + "]. У режимі Sandbox задайте cos φ для цього об'єкта явно.");
        catErr.code = "UNSUPPORTED_CATEGORY";
        throw catErr;
      }

      map[c.id] = {
        consumerId: c.id,
        value: entry.value,
        status: entry.status,
        source: entry.source
      };
    }
    return map;
  }

  Data.Academic = ACADEMIC_INFO;
  Data.Variants = {
    get: getVariantData,
    materialize: materializeVariantConsumers,
    buildCosPhiMap: buildCosPhiMap,
    PROFILES: STANDARD_PROFILES,
    EXAMPLE_TABLE_2_3: EXAMPLE_TABLE_2_3,
    COS_PHI_PRESETS: COS_PHI_PRESETS
  };
})(window.EPPMLoadLab.Data);