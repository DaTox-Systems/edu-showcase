window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Core = window.PPSCLab.Core || {};

(function (Core) {
  "use strict";

  var STRICT_NUM_REGEX = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

  // Strict numeric parser: rejects empty strings, booleans, null, objects, NaN, and Infinity.
  function toStrictNumber(raw) {
    if (typeof raw === "number") {
      return Number.isFinite(raw) ? raw : null;
    }
    if (typeof raw === "string") {
      var normalized = raw.trim().replace(",", ".");
      if (!normalized || !STRICT_NUM_REGEX.test(normalized)) {
        return null;
      }
      var parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  function toStrictInteger(raw) {
    var num = toStrictNumber(raw);
    if (num === null || !Number.isInteger(num)) {
      return null;
    }
    return num;
  }

  Core.NumberParser = {
    toStrictNumber: toStrictNumber,
    toStrictInteger: toStrictInteger
  };
})(window.PPSCLab.Core);
