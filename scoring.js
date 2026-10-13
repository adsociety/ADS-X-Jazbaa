/*
  scoring.js — the ONE scoring implementation, shared by the site and
  scripts/check-distribution.js. Pure: no DOM, no state.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./quiz-data.js'));
  else root.QuizScoring = factory(root.QuizData);
})(typeof self !== 'undefined' ? self : this, function (data) {
  /**
   * @param {number[]} answers  chosen option index per question (length = questions.length)
   * @param {object}   [d]      quiz data (defaults to the loaded quiz-data.js)
   * @returns {{e:number, v:number, colour:object, index:number}}
   */
  var EPSILON = 1e-9;

  function score(answers, d) {
    d = d || data;
    var n = d.questions.length, sumE = 0, sumV = 0;
    for (var i = 0; i < n; i++) {
      var opt = d.questions[i].options[answers[i]];
      sumE += opt.e;
      sumV += opt.v;
    }
    var e = sumE / n, v = sumV / n;
    var best = -1, bestDist = Infinity;
    for (var c = 0; c < d.colours.length; c++) {
      var dist = Math.hypot(e - d.colours[c].e, v - d.colours[c].v);
      // EPSILON: exact ties are common (e.g. Yellow/Pink) but floating-point noise can make
      // them differ by ~1e-16, so compare with a tolerance. Ties go to the earlier colour.
      if (dist < bestDist - EPSILON) { bestDist = dist; best = c; }
    }
    return { e: e, v: v, colour: d.colours[best], index: best };
  }

  return { score: score };
});
