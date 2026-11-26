window.EPPMLoadLab = window.EPPMLoadLab || {};
window.EPPMLoadLab.Core = window.EPPMLoadLab.Core || {};

(function (Core) {
  "use strict";

  // Natural Cubic Spline Interpolation with Analytical Segment Antiderivatives
  // Conforms strictly to Academic Engine Standards:
  // 1. Strict input validation & domain boundaries enforcement (throws RangeError outside domain).
  // 2. Thomas Tridiagonal Solver with scale-aware pivot degeneracy verification.
  // 3. Exact antiderivative integration of the cubic spline interpolant (eliminates quadrature error; IEEE-754 arithmetic & model assumptions apply).
  // 4. Analytical candidate enumeration with numerical root isolation for sliding-window maximum.
  function createCubicSpline(xArr, yArr) {
    // 1. Strict Input Validation
    if (!Array.isArray(xArr) || !Array.isArray(yArr)) {
      throw new TypeError("Spline coordinates must be valid arrays.");
    }
    var n = xArr.length - 1;
    if (n < 1 || xArr.length !== yArr.length) {
      throw new Error("Spline requires equal-length arrays with at least 2 points.");
    }
    for (var idx = 0; idx <= n; idx++) {
      if (typeof xArr[idx] !== "number" || !Number.isFinite(xArr[idx])) {
        throw new TypeError("X coordinate at index " + idx + " is not a finite number.");
      }
      if (typeof yArr[idx] !== "number" || !Number.isFinite(yArr[idx])) {
        throw new TypeError("Y coordinate at index " + idx + " is not a finite number.");
      }
      if (idx > 0 && xArr[idx] <= xArr[idx - 1]) {
        throw new Error("X coordinates must be strictly monotonically increasing.");
      }
    }

    // Internal immutable copies to protect spline state from external array mutations
    xArr = xArr.slice();
    yArr = yArr.slice();

    var xMin = xArr[0];
    var xMax = xArr[n];
    var xSpan = xMax - xMin;

    // Scale-aware numerical tolerances relative to domain span and signal amplitude (S-02)
    var yScale = 1.0;
    for (var yk = 0; yk <= n; yk++) {
      var absY = Math.abs(yArr[yk]);
      if (absY > yScale) yScale = absY;
    }
    var EPS_BOUNDARY = 1e-9 * Math.max(1.0, xSpan);
    var EPS_X = 1e-12 * Math.max(1.0, xSpan);
    var EPS_Y = 1e-12 * yScale;
    var EPS_ZERO_PIVOT = 1e-14 * Math.max(1.0, xSpan);

    // Symmetrical boundary clamping helper for both domain endpoints [xMin, xMax] (S-03)
    function clampToDomain(val, label) {
      if (typeof val !== "number" || !Number.isFinite(val)) {
        throw new TypeError((label || "Point") + " must be a finite number.");
      }
      if (val >= xMin - EPS_BOUNDARY && val < xMin) return xMin;
      if (val <= xMax + EPS_BOUNDARY && val > xMax) return xMax;
      if (val < xMin || val > xMax) {
        throw new RangeError((label || "Point") + " (" + val + ") is outside spline domain [" + xMin + "; " + xMax + "].");
      }
      return val;
    }

    var h = new Float64Array(n);
    for (var i = 0; i < n; i++) {
      h[i] = xArr[i + 1] - xArr[i];
    }

    var alpha = new Float64Array(n);
    for (var i = 1; i < n; i++) {
      alpha[i] = (3.0 / h[i]) * (yArr[i + 1] - yArr[i]) - (3.0 / h[i - 1]) * (yArr[i] - yArr[i - 1]);
    }

    var l = new Float64Array(n + 1);
    var mu = new Float64Array(n + 1);
    var z = new Float64Array(n + 1);

    l[0] = 1.0;
    mu[0] = 0.0;
    z[0] = 0.0;

    for (var i = 1; i < n; i++) {
      l[i] = 2.0 * (xArr[i + 1] - xArr[i - 1]) - h[i - 1] * mu[i - 1];
      if (Math.abs(l[i]) <= EPS_ZERO_PIVOT) {
        throw new Error("Degenerate tridiagonal system encountered in spline solver.");
      }
      mu[i] = h[i] / l[i];
      z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }

    l[n] = 1.0;
    z[n] = 0.0;

    var b = new Float64Array(n);
    var c = new Float64Array(n + 1);
    var d = new Float64Array(n);

    c[n] = 0.0;

    for (var j = n - 1; j >= 0; j--) {
      c[j] = z[j] - mu[j] * c[j + 1];
      b[j] = (yArr[j + 1] - yArr[j]) / h[j] - (h[j] * (c[j + 1] + 2.0 * c[j])) / 3.0;
      d[j] = (c[j + 1] - c[j]) / (3.0 * h[j]);
    }

    // Binary search for polynomial segment index i where x in [xArr[i], xArr[i+1]]
    function findSegment(xVal) {
      var low = 0;
      var high = n - 1;
      while (low <= high) {
        var mid = (low + high) >> 1;
        if (xVal >= xArr[mid] && xVal <= xArr[mid + 1]) {
          return mid;
        }
        if (xVal < xArr[mid]) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }
      return n - 1;
    }

    // Evaluates point interpolation S(x) with strict symmetrical boundary validation
    function interpolate(x) {
      x = clampToDomain(x, "Interpolation point");
      var idx = findSegment(x);
      var dx = x - xArr[idx];
      return yArr[idx] + b[idx] * dx + c[idx] * dx * dx + d[idx] * dx * dx * dx;
    }

    // Antiderivative of polynomial segment idx from 0 to dx:
    // int_0^dx (y_i + b_i*u + c_i*u^2 + d_i*u^3) du = y_i*dx + (b_i/2)*dx^2 + (c_i/3)*dx^3 + (d_i/4)*dx^4
    function segmentAntiderivative(segIdx, dxVal) {
      var y0 = yArr[segIdx];
      var b0 = b[segIdx];
      var c0 = c[segIdx];
      var d0 = d[segIdx];
      return dxVal * (y0 + dxVal * (b0 / 2.0 + dxVal * (c0 / 3.0 + dxVal * (d0 / 4.0))));
    }

    // Exact piecewise analytical integration of the cubic spline interpolant (to IEEE-754 precision)
    function integrateAnalytical(a, bVal) {
      a = clampToDomain(a, "Integration lower bound");
      bVal = clampToDomain(bVal, "Integration upper bound");

      if (bVal < a) {
        throw new Error("Integration upper bound must be greater than or equal to lower bound.");
      }
      if (bVal === a) {
        return 0.0;
      }

      var startSeg = findSegment(a);
      var endSeg = findSegment(bVal);
      var totalIntegral = 0.0;

      if (startSeg === endSeg) {
        var dxA = a - xArr[startSeg];
        var dxB = bVal - xArr[startSeg];
        return segmentAntiderivative(startSeg, dxB) - segmentAntiderivative(startSeg, dxA);
      }

      // 1. Partial first segment: [a, xArr[startSeg + 1]]
      var dxStartA = a - xArr[startSeg];
      var hStart = h[startSeg];
      totalIntegral += (segmentAntiderivative(startSeg, hStart) - segmentAntiderivative(startSeg, dxStartA));

      // 2. Full intermediate segments
      for (var seg = startSeg + 1; seg < endSeg; seg++) {
        totalIntegral += segmentAntiderivative(seg, h[seg]);
      }

      // 3. Partial last segment: [xArr[endSeg], bVal]
      var dxEndB = bVal - xArr[endSeg];
      totalIntegral += segmentAntiderivative(endSeg, dxEndB);

      return totalIntegral;
    }

    // Evaluates second derivative S''(x) for verifying natural boundary conditions S''(0) = S''(24) = 0
    function secondDerivative(x) {
      x = clampToDomain(x, "Second derivative point");
      var idx = findSegment(x);
      var dx = x - xArr[idx];
      return 2.0 * c[idx] + 6.0 * d[idx] * dx;
    }

    // Analytical global candidate enumeration with numerical root isolation (S-01, S-02, S-04)
    // Maximizes A(t) = (1/W) * int_t^(t+W) S(u) du across [xMin, xMax - W]
    // Uses exact derivative A'(t) = (S(t + W) - S(t)) / W = 0 with scale-aware tolerances.
    function findMaxSlidingWindowAverage(windowWidth) {
      var width = (windowWidth === undefined) ? 0.5 : windowWidth;
      if (typeof width !== "number" || !Number.isFinite(width) || width <= 0) {
        throw new RangeError("Window width must be a finite positive number.");
      }

      var xMaxStart = xMax - width;
      if (xMaxStart < xMin - EPS_BOUNDARY) {
        throw new RangeError("Window width exceeds spline domain.");
      }
      if (xMaxStart < xMin) xMaxStart = xMin;

      function windowAvgAt(t0) {
        return integrateAnalytical(t0, t0 + width) / width;
      }

      // 1. Collect all breakpoints where S(t) or S(t + W) changes polynomial segment
      var rawBreaks = [xMin, xMaxStart];
      for (var i = 0; i <= n; i++) {
        var tLeft = xArr[i];
        var tShifted = xArr[i] - width;
        if (tLeft > xMin + EPS_X && tLeft < xMaxStart - EPS_X) rawBreaks.push(tLeft);
        if (tShifted > xMin + EPS_X && tShifted < xMaxStart - EPS_X) rawBreaks.push(tShifted);
      }
      rawBreaks.sort(function (u1, u2) { return u1 - u2; });

      var breaks = [rawBreaks[0]];
      for (var bi = 1; bi < rawBreaks.length; bi++) {
        if (rawBreaks[bi] - breaks[breaks.length - 1] > EPS_X) {
          breaks.push(rawBreaks[bi]);
        }
      }

      var candidates = [xMin, xMaxStart];

      // 2. Analyze D(t) = S(t + W) - S(t) analytically on each smooth interval [u0, u1]
      for (var m = 0; m < breaks.length - 1; m++) {
        var u0 = breaks[m];
        var u1 = breaks[m + 1];
        var ds = u1 - u0;
        if (ds <= EPS_X * 0.1) continue;

        var tMid = 0.5 * (u0 + u1);
        var segL = findSegment(tMid);
        var segR = findSegment(tMid + width);

        var a0 = u0 - xArr[segL];
        var b0 = (u0 + width) - xArr[segR];

        // Expand D(u0 + s) = K0 + K1*s + K2*s^2 + K3*s^3 for s in [0, ds]
        var K0 = (yArr[segR] + b[segR] * b0 + c[segR] * b0 * b0 + d[segR] * b0 * b0 * b0)
               - (yArr[segL] + b[segL] * a0 + c[segL] * a0 * a0 + d[segL] * a0 * a0 * a0);
        var K1 = (b[segR] + 2.0 * c[segR] * b0 + 3.0 * d[segR] * b0 * b0)
               - (b[segL] + 2.0 * c[segL] * a0 + 3.0 * d[segL] * a0 * a0);
        var K2 = (c[segR] + 3.0 * d[segR] * b0) - (c[segL] + 3.0 * d[segL] * a0);
        var K3 = d[segR] - d[segL];

        function evalD(s) {
          return K0 + s * (K1 + s * (K2 + s * K3));
        }

        // Critical points of D(s) where D'(s) = 3*K3*s^2 + 2*K2*s + K1 = 0
        var subPoints = [0.0, ds];
        var qA = 3.0 * K3;
        var qB = 2.0 * K2;
        var qC = K1;
        var qScale = Math.max(1.0, Math.abs(qA) + Math.abs(qB) + Math.abs(qC));

        if (Math.abs(qA) <= 1e-14 * qScale) {
          if (Math.abs(qB) > 1e-14 * qScale) {
            var sLin = -qC / qB;
            if (sLin > EPS_X && sLin < ds - EPS_X) subPoints.push(sLin);
          }
        } else {
          var disc = qB * qB - 4.0 * qA * qC;
          var discTol = 1e-14 * qScale * qScale;
          if (Math.abs(disc) <= discTol) {
            var sRepeated = -qB / (2.0 * qA);
            if (sRepeated > EPS_X && sRepeated < ds - EPS_X) subPoints.push(sRepeated);
          } else if (disc > discTol) {
            var sqrtD = Math.sqrt(disc);
            // Numerically stable quadratic roots avoiding catastrophic cancellation (S-03)
            var qStable = -0.5 * (qB + (qB >= 0.0 ? sqrtD : -sqrtD));
            var s1 = qStable / qA;
            var s2 = (Math.abs(qStable) > 1e-15 * qScale) ? (qC / qStable) : 0.0;
            if (s1 > EPS_X && s1 < ds - EPS_X) subPoints.push(s1);
            if (s2 > EPS_X && s2 < ds - EPS_X) subPoints.push(s2);
          }
        }
        subPoints.sort(function (p1, p2) { return p1 - p2; });

        // 3. On each strictly monotonic sub-interval, locate zeros & tangent extrema
        for (var spIdx = 0; spIdx < subPoints.length - 1; spIdx++) {
          var sLo = subPoints[spIdx];
          var sHi = subPoints[spIdx + 1];
          if (sHi - sLo <= EPS_ZERO_PIVOT) continue;

          var vLo = evalD(sLo);
          var vHi = evalD(sHi);

          if (Math.abs(vLo) <= EPS_Y) candidates.push(u0 + sLo);
          if (Math.abs(vHi) <= EPS_Y) candidates.push(u0 + sHi);

          if ((vLo > 0.0 && vHi < 0.0) || (vLo < 0.0 && vHi > 0.0)) {
            var left = sLo;
            var right = sHi;
            var fLeft = vLo;
            for (var it = 0; it < 55; it++) {
              var midS = 0.5 * (left + right);
              var fMid = evalD(midS);
              if (Math.abs(fMid) <= EPS_Y * 1e-2 || (right - left) <= EPS_ZERO_PIVOT) {
                left = midS;
                right = midS;
                break;
              }
              if ((fLeft > 0.0 && fMid > 0.0) || (fLeft < 0.0 && fMid < 0.0)) {
                left = midS;
                fLeft = fMid;
              } else {
                right = midS;
              }
            }
            candidates.push(u0 + 0.5 * (left + right));
          }
        }
      }

      // 4. Select global maximum across all stationary candidates & domain boundaries
      var bestT = candidates[0];
      var bestAvg = windowAvgAt(bestT);
      for (var cIdx = 1; cIdx < candidates.length; cIdx++) {
        var tCand = candidates[cIdx];
        var avgCand = windowAvgAt(tCand);
        if (avgCand > bestAvg) {
          bestAvg = avgCand;
          bestT = tCand;
        }
      }

      return {
        maxAverage: bestAvg,
        tStart: bestT,
        tEnd: bestT + width,
        tCenter: bestT + width / 2.0,
        candidatesCount: candidates.length,
        method: "analytical_candidate_enumeration_root_isolation"
      };
    }

    return Object.freeze({
      domain: Object.freeze([xMin, xMax]),
      interpolate: interpolate,
      secondDerivative: secondDerivative,
      integrate: integrateAnalytical,
      findMaxSlidingWindowAverage: findMaxSlidingWindowAverage
    });
  }

  Core.Spline = {
    create: createCubicSpline
  };
})(window.EPPMLoadLab.Core);