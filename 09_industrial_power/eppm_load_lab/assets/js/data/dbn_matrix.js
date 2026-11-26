window.EPPMLoadLab = window.EPPMLoadLab || {};
window.EPPMLoadLab.Data = window.EPPMLoadLab.Data || {};

(function (Data) {
  "use strict";

  // Extract from Table 6.17 DBN V.2.5-23:2025 (Page 32)
  // "Коефіцієнти участі в максимумі навантаження"
  // Strictly validated: NO silent fallbacks (0.7 / 0.8) allowed!
  // Official Table 6.17 Metadata (DBN V.2.5-23:2025, Page 32 / PDF Page 40)
  var MATRIX_METADATA = {
    document: "ДБН В.2.5-23:2025",
    table: "6.17",
    page: 32,
    pdfPage: 40,
    auditDate: "2026-11-25",
    verificationStatus: "verified",
    canonicalRowsCount: 10,
    canonicalColsCount: 16
  };

  // Exactly 10 Canonical Rows x 16 Canonical Columns from Table 6.17 DBN V.2.5-23:2025
  // Note: Self-intersection for identical residential buildings is '-' in Table 6.17; 1.0 is used in engineering summation.
  var RAW_PARTICIPATION_MATRIX = {
    residential_elec: {
      label: "Житлові будинки з електроплитами",
      residential_elec: 1.0, residential_gas: 0.9, canteen: 0.6, cafe: 0.7,
      specialized_edu: 0.6, school: 0.4, admin: 0.6, retail_1shift: 0.6,
      retail_2shift: 0.8, hotel: 0.7, barber: 0.8, kindergarten: 0.4,
      polyclinic: 0.7, service_center: 0.6, communal_services: 0.7, culture: 0.9
    },
    residential_gas: {
      label: "Житлові будинки з газовими плитами",
      residential_elec: 0.9, residential_gas: 1.0, canteen: 0.6, cafe: 0.7,
      specialized_edu: 0.5, school: 0.3, admin: 0.4, retail_1shift: 0.5,
      retail_2shift: 0.8, hotel: 0.7, barber: 0.7, kindergarten: 0.4,
      polyclinic: 0.6, service_center: 0.5, communal_services: 0.5, culture: 0.9
    },
    canteen: {
      label: "Підприємства харчування (їдальні, ресторани, кафе)",
      residential_elec: 0.4, residential_gas: 0.4, canteen: 0.8, cafe: 0.8,
      specialized_edu: 0.8, school: 0.8, admin: 0.8, retail_1shift: 0.8,
      retail_2shift: 0.8, hotel: 0.7, barber: 0.8, kindergarten: 0.8,
      polyclinic: 0.8, service_center: 0.8, communal_services: 0.8, culture: 0.5
    },
    school: {
      label: "Заклади вищої, загальної середньої, професійної освіти, бібліотеки",
      residential_elec: 0.5, residential_gas: 0.4, canteen: 0.8, cafe: 0.6,
      specialized_edu: 0.7, school: 0.7, admin: 0.8, retail_1shift: 0.8,
      retail_2shift: 0.8, hotel: 0.7, barber: 0.8, kindergarten: 0.8,
      polyclinic: 0.8, service_center: 0.7, communal_services: 0.8, culture: 0.8
    },
    retail_2shift: {
      label: "Торгові підприємства одно-, півтора- та двозмінні",
      residential_elec: 0.5, residential_gas: 0.4, canteen: 0.8, cafe: 0.6,
      specialized_edu: 0.7, school: 0.7, admin: 0.8, retail_1shift: 0.8,
      retail_2shift: 0.8, hotel: 0.7, barber: 0.8, kindergarten: 0.8,
      polyclinic: 0.8, service_center: 0.7, communal_services: 0.8, culture: 0.8
    },
    admin: {
      label: "Установи управління, фінансові, адміністративні будівлі підприємств",
      residential_elec: 0.5, residential_gas: 0.4, canteen: 0.8, cafe: 0.8,
      specialized_edu: 0.8, school: 0.8, admin: 0.8, retail_1shift: 0.8,
      retail_2shift: 0.8, hotel: 0.7, barber: 0.8, kindergarten: 0.8,
      polyclinic: 0.8, service_center: 0.7, communal_services: 0.8, culture: 0.5
    },
    hotel: {
      label: "Готелі",
      residential_elec: 0.8, residential_gas: 0.8, canteen: 0.6, cafe: 0.8,
      specialized_edu: 0.4, school: 0.3, admin: 0.6, retail_1shift: 0.6,
      retail_2shift: 0.8, hotel: 0.8, barber: 0.8, kindergarten: 0.4,
      polyclinic: 0.7, service_center: 0.5, communal_services: 0.7, culture: 0.9
    },
    polyclinic: {
      label: "Заклади первинної медичної допомоги",
      residential_elec: 0.5, residential_gas: 0.4, canteen: 0.8, cafe: 0.6,
      specialized_edu: 0.8, school: 0.8, admin: 0.8, retail_1shift: 0.8,
      retail_2shift: 0.7, hotel: 0.7, barber: 0.8, kindergarten: 0.8,
      polyclinic: 0.8, service_center: 0.7, communal_services: 0.8, culture: 0.8
    },
    service_center: {
      label: "Ательє та комбінати побутового обслуговування",
      residential_elec: 0.5, residential_gas: 0.4, canteen: 0.8, cafe: 0.6,
      specialized_edu: 0.8, school: 0.8, admin: 0.8, retail_1shift: 0.8,
      retail_2shift: 0.7, hotel: 0.7, barber: 0.8, kindergarten: 0.8,
      polyclinic: 0.8, service_center: 0.7, communal_services: 0.8, culture: 0.8
    },
    culture: {
      label: "Культові, видовищні заклади, кінотеатри",
      residential_elec: 0.9, residential_gas: 0.9, canteen: 0.4, cafe: 0.6,
      specialized_edu: 0.3, school: 0.2, admin: 0.2, retail_1shift: 0.8,
      retail_2shift: 0.7, hotel: 0.7, barber: 0.8, kindergarten: 0.2,
      polyclinic: 0.4, service_center: 0.4, communal_services: 0.5, culture: 1.0
    }
  };

  // Explicit registry of Table 6.17 grouped row aliases (separate from canonical columns)
  var ROW_ALIASES = {
    cafe: { canonicalRow: "canteen", note: "Рядок 3 Табл. 6.17 об'єднує їдальні, ресторани та кафе." },
    specialized_edu: { canonicalRow: "school", note: "Рядок 4 Табл. 6.17 об'єднує заклади вищої, загальної середньої та професійної освіти." },
    retail_1shift: { canonicalRow: "retail_2shift", note: "Рядок 5 Табл. 6.17 об'єднує одно-, півтора- та двозмінні торгові підприємства." },
    supermarket: { canonicalRow: "retail_2shift", note: "Універсам як головний споживач відповідає рядку 5 Табл. 6.17 («Торгові підприємства»)." }
  };

  // Explicit registry of academic column aliases mapped to canonical Table 6.17 columns
  var COLUMN_ALIASES = {
    supermarket: {
      mappedColumn: "retail_2shift",
      status: "confirmed",
      note: "Універсам (режим 08:00–22:00 за Табл. 2.2) відповідає стовп. 9 Табл. 6.17 («Торгові підприємства півтора- та двозмінні»)."
    }
  };

  // Explicit registry of academic analogies for special objects outside direct DBN scope (p. 1.3)
  var ANALOGY_MAPPINGS = {
    traction_substation: {
      mappedCategory: "communal_services",
      status: "conditional_assumption",
      note: "Поза прямою сферою дії Табл. 6.17 ДБН (п. 1.3); у навчальному розрахунку умовно прийнято стовп. 15 («Підприємства комунального обслуговування») за погодженням викладача."
    },
    heat_point: {
      mappedCategory: "communal_services",
      status: "conditional_assumption",
      note: "Навчальне припущення: тепловий пункт віднесено за аналогією до стовп. 15 Табл. 6.17 (потребує підтвердження викладача)."
    },
    water_pump: {
      mappedCategory: "communal_services",
      status: "conditional_assumption",
      note: "Навчальне припущення: водонасосна станція віднесена за аналогією до стовп. 15 Табл. 6.17 (потребує підтвердження викладача)."
    }
  };

  // Deep freeze every nested structure (Data Immutability Invariant)
  Object.freeze(MATRIX_METADATA);
  for (var rowKey in RAW_PARTICIPATION_MATRIX) {
    if (Object.prototype.hasOwnProperty.call(RAW_PARTICIPATION_MATRIX, rowKey)) {
      Object.freeze(RAW_PARTICIPATION_MATRIX[rowKey]);
    }
  }
  Object.freeze(RAW_PARTICIPATION_MATRIX);

  for (var rAliasKey in ROW_ALIASES) {
    if (Object.prototype.hasOwnProperty.call(ROW_ALIASES, rAliasKey)) {
      Object.freeze(ROW_ALIASES[rAliasKey]);
    }
  }
  Object.freeze(ROW_ALIASES);

  for (var cAliasKey in COLUMN_ALIASES) {
    if (Object.prototype.hasOwnProperty.call(COLUMN_ALIASES, cAliasKey)) {
      Object.freeze(COLUMN_ALIASES[cAliasKey]);
    }
  }
  Object.freeze(COLUMN_ALIASES);

  for (var aKey in ANALOGY_MAPPINGS) {
    if (Object.prototype.hasOwnProperty.call(ANALOGY_MAPPINGS, aKey)) {
      Object.freeze(ANALOGY_MAPPINGS[aKey]);
    }
  }
  Object.freeze(ANALOGY_MAPPINGS);

  function resolveMainRow(mainCategory) {
    if (typeof mainCategory !== "string" || mainCategory.length === 0) return null;
    if (Object.prototype.hasOwnProperty.call(RAW_PARTICIPATION_MATRIX, mainCategory)) {
      return {
        canonicalRow: mainCategory,
        rowObj: RAW_PARTICIPATION_MATRIX[mainCategory],
        isAlias: false,
        verificationStatus: MATRIX_METADATA.verificationStatus
      };
    }
    if (Object.prototype.hasOwnProperty.call(ROW_ALIASES, mainCategory)) {
      var alias = ROW_ALIASES[mainCategory];
      return {
        canonicalRow: alias.canonicalRow,
        rowObj: RAW_PARTICIPATION_MATRIX[alias.canonicalRow],
        isAlias: true,
        aliasNote: alias.note,
        verificationStatus: MATRIX_METADATA.verificationStatus
      };
    }
    return null;
  }

  function getRowInfo(mainCategory) {
    var resolved = resolveMainRow(mainCategory);
    if (!resolved) {
      return {
        supported: false,
        canonicalRow: null,
        verificationStatus: "unverified",
        sourceTable: null
      };
    }
    return {
      supported: true,
      canonicalRow: resolved.canonicalRow,
      isAlias: resolved.isAlias,
      verificationStatus: resolved.verificationStatus,
      sourceTable: MATRIX_METADATA.document + ", Табл. " + MATRIX_METADATA.table + ", стор. " + MATRIX_METADATA.page
    };
  }

  function getParticipationFactor(mainCategory, secondaryCategory) {
    if (typeof mainCategory !== "string" || typeof secondaryCategory !== "string") {
      return {
        available: false,
        factor: null,
        status: "unavailable",
        verificationStatus: "not_applicable",
        reason: "Категорії повинні бути задані рядковими ідентифікаторами."
      };
    }

    var resolvedMain = resolveMainRow(mainCategory);
    if (!resolvedMain) {
      return {
        available: false,
        factor: null,
        status: "unavailable",
        verificationStatus: "not_applicable",
        reason: "Категорія головного споживача [" + mainCategory + "] відсутня у Таблиці 6.17 ДБН В.2.5-23:2025."
      };
    }
    var row = resolvedMain.rowObj;

    // 1. Direct canonical column match
    if (Object.prototype.hasOwnProperty.call(row, secondaryCategory) && typeof row[secondaryCategory] === "number") {
      return {
        available: true,
        factor: row[secondaryCategory],
        status: "confirmed",
        verificationStatus: MATRIX_METADATA.verificationStatus,
        source: {
          document: MATRIX_METADATA.document,
          table: MATRIX_METADATA.table,
          page: MATRIX_METADATA.page,
          auditDate: MATRIX_METADATA.auditDate
        },
        dbnRow: resolvedMain.canonicalRow,
        dbnCol: secondaryCategory,
        reason: "Офіційний нормативний коефіцієнт Таблиці 6.17 ДБН В.2.5-23:2025."
      };
    }

    // 2. Confirmed column alias match (e.g. supermarket -> retail_2shift)
    if (Object.prototype.hasOwnProperty.call(COLUMN_ALIASES, secondaryCategory)) {
      var colAlias = COLUMN_ALIASES[secondaryCategory];
      if (typeof row[colAlias.mappedColumn] === "number") {
        return {
          available: true,
          factor: row[colAlias.mappedColumn],
          status: colAlias.status,
          verificationStatus: MATRIX_METADATA.verificationStatus,
          source: {
            document: MATRIX_METADATA.document,
            table: MATRIX_METADATA.table,
            page: MATRIX_METADATA.page,
            auditDate: MATRIX_METADATA.auditDate
          },
          dbnRow: resolvedMain.canonicalRow,
          dbnCol: colAlias.mappedColumn,
          reason: colAlias.note
        };
      }
    }

    // 3. Academic analogy match (special objects outside direct DBN scope)
    if (Object.prototype.hasOwnProperty.call(ANALOGY_MAPPINGS, secondaryCategory)) {
      var analogy = ANALOGY_MAPPINGS[secondaryCategory];
      if (typeof row[analogy.mappedCategory] === "number") {
        return {
          available: true,
          factor: row[analogy.mappedCategory],
          status: "conditional_assumption",
          verificationStatus: "academic_analogy_unverified_by_norm",
          source: {
            document: MATRIX_METADATA.document,
            table: MATRIX_METADATA.table,
            page: MATRIX_METADATA.page,
            auditDate: MATRIX_METADATA.auditDate
          },
          dbnRow: resolvedMain.canonicalRow,
          dbnCol: analogy.mappedCategory,
          reason: analogy.note
        };
      }
    }

    // 4. Category unavailable
    return {
      available: false,
      factor: null,
      status: "unavailable",
      verificationStatus: "not_applicable",
      reason: "Об'єкт [" + secondaryCategory + "] не має коефіцієнта участі в Таблиці 6.17 ДБН для головного споживача [" + mainCategory + "]."
    };
  }

  Data.DBN = {
    METADATA: MATRIX_METADATA,
    MATRIX: RAW_PARTICIPATION_MATRIX,
    ROW_ALIASES: ROW_ALIASES,
    COLUMN_ALIASES: COLUMN_ALIASES,
    ANALOGIES: ANALOGY_MAPPINGS,
    getRowInfo: getRowInfo,
    getFactor: getParticipationFactor
  };
})(window.EPPMLoadLab.Data);