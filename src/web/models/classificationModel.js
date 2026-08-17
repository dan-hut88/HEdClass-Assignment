import db from "../db.js";

export async function getByStudentId(studentId) {
  const [rows] = await db.promise().query(`SELECT * FROM classifications WHERE student_id = ?`, [studentId]);
  return rows[0];
}

export async function updateReview(studentId, finalResult, isOverridden, status, rationale, classifiedBy) {
  await db.promise().query(
    ` UPDATE classifications
        SET final_result = ?, is_overridden = ?, status = ?, rationale = ?,classified_by = ?
        WHERE student_id = ?`,
    [finalResult, isOverridden, status, rationale, classifiedBy, studentId]
  );
}

export async function reopen(studentId) {
  await db.promise().query(
    `UPDATE classifications
        SET status = 'pending_review', final_result = 'Pending', is_overridden = 0
        WHERE student_id = ?`,
    [studentId]
  );
}
