export const NOT_ELIGIBLE = "Not eligible for Honours";

const BOUNDARIES = [
  { min: 70, result: "First Class Honours (1st)" },
  { min: 60, result: "Upper Second Class (2:1)" },
  { min: 50, result: "Lower Second Class (2:2)" },
  { min: 40, result: "Third Class Honours" },
];

// Resit cap is applied here, at calculation time, so the raw mark in student_marks is never touched.
function cappedMark(mark, isResit) {
  return isResit ? Math.min(mark, 40) : mark;
}

export function weightedAverage(marks) {
  let totalWeighted = 0;
  let totalCredits = 0;

  for (const m of marks) {
    const mark = cappedMark(parseFloat(m.mark), m.is_resit);
    totalWeighted += mark * m.credits;
    totalCredits += m.credits;
  }

  return totalCredits > 0 ? parseFloat((totalWeighted / totalCredits).toFixed(2)) : 0;
}

export function classificationResult(average) {
  for (const boundary of BOUNDARIES) {
    if (average >= boundary.min) return boundary.result;
  }
  return "Fail";
}

// Honours eligibility: full credits recorded for years 1-3, and every module a pass
// (using the capped resit value) - an outstanding fail makes the student ineligible
// regardless of their average.
export function isEligibleForHonours(yearMarks, creditsPerYear) {
  for (const year of [1, 2, 3]) {
    const marks = yearMarks[year] || [];
    const totalCredits = marks.reduce((sum, m) => sum + m.credits, 0);

    if (totalCredits < creditsPerYear) return false;

    for (const m of marks) {
      const mark = cappedMark(parseFloat(m.mark), m.is_resit);
      if (mark < 40) return false;
    }
  }

  return true;
}

// yearMarks: { 1: [{mark, credits, is_resit}], 2: [...], 3: [...] }
export function classifyStudent({ yearMarks, creditsPerYear, weightingYr2, weightingYr3 }) {
  const yr2Average = weightedAverage(yearMarks[2] || []);
  const yr3Average = weightedAverage(yearMarks[3] || []);

  const w2 = parseFloat(weightingYr2) / 100;
  const w3 = parseFloat(weightingYr3) / 100;
  const finalAverage = parseFloat(((yr2Average * w2) + (yr3Average * w3)).toFixed(2));

  const proposedResult = isEligibleForHonours(yearMarks, creditsPerYear)
    ? classificationResult(finalAverage)
    : NOT_ELIGIBLE;

  return { yr2Average, yr3Average, finalAverage, proposedResult };
}
