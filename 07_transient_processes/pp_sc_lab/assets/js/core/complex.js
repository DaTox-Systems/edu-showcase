window.PPSCLab = window.PPSCLab || {};
window.PPSCLab.Core = window.PPSCLab.Core || {};

(function (Core) {
  "use strict";

  var RAD_TO_DEG = 180 / Math.PI;
  var DEG_TO_RAD = Math.PI / 180;

  function assertFiniteNumber(val, label) {
    if (typeof val !== "number" || !Number.isFinite(val)) {
      throw new TypeError("Complex " + label + " must be a finite number");
    }
  }

  function assertComplex(z) {
    if (!z || typeof z !== "object") {
      throw new TypeError("Expected complex object");
    }
    assertFiniteNumber(z.re, "re");
    assertFiniteNumber(z.im, "im");
  }

  function create(re, im) {
    assertFiniteNumber(re, "re");
    assertFiniteNumber(im, "im");
    return { re: re, im: im };
  }

  function fromPolar(magVal, degVal) {
    assertFiniteNumber(magVal, "mag");
    assertFiniteNumber(degVal, "deg");
    var rad = degVal * DEG_TO_RAD;
    return create(magVal * Math.cos(rad), magVal * Math.sin(rad));
  }

  function add(a, b) {
    assertComplex(a);
    assertComplex(b);
    return create(a.re + b.re, a.im + b.im);
  }

  function sub(a, b) {
    assertComplex(a);
    assertComplex(b);
    return create(a.re - b.re, a.im - b.im);
  }

  function mul(a, b) {
    assertComplex(a);
    assertComplex(b);
    return create(
      a.re * b.re - a.im * b.im,
      a.re * b.im + a.im * b.re
    );
  }

  function div(a, b) {
    assertComplex(a);
    assertComplex(b);
    var denom = b.re * b.re + b.im * b.im;
    if (denom === 0 || !Number.isFinite(denom)) {
      throw new Error("Complex division by zero");
    }
    return create(
      (a.re * b.re + a.im * b.im) / denom,
      (a.im * b.re - a.re * b.im) / denom
    );
  }

  function scale(a, k) {
    assertComplex(a);
    assertFiniteNumber(k, "scalar");
    return create(a.re * k, a.im * k);
  }

  function conj(a) {
    assertComplex(a);
    return create(a.re, -a.im);
  }

  function mag(a) {
    return Math.hypot(a.re, a.im);
  }

  function phaseRad(a) {
    return Math.atan2(a.im, a.re);
  }

  function phaseDeg(a) {
    return Math.atan2(a.im, a.re) * RAD_TO_DEG;
  }

  function toSummary(a) {
    return {
      re: a.re,
      im: a.im,
      mag: mag(a),
      deg: phaseDeg(a)
    };
  }

  function diffMag(a, b) {
    return Math.hypot(a.re - b.re, a.im - b.im);
  }

  function isFiniteComplex(a) {
    return Boolean(
      a &&
      typeof a === "object" &&
      Number.isFinite(a.re) &&
      Number.isFinite(a.im)
    );
  }

  Core.Complex = {
    create: create,
    fromPolar: fromPolar,
    add: add,
    sub: sub,
    mul: mul,
    div: div,
    scale: scale,
    conj: conj,
    mag: mag,
    phaseRad: phaseRad,
    phaseDeg: phaseDeg,
    toSummary: toSummary,
    diffMag: diffMag,
    isFiniteComplex: isFiniteComplex
  };
})(window.PPSCLab.Core);
