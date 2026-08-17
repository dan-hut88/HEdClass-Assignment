import db from "../db.js";

export async function insert(studentNumber, firstName, lastName, degreeId, entryYear, academicYear, createdBy) {
  const [result] = await db.promise().query(
    `INSERT INTO students(student_number, first_name, last_name, degree_id, entry_year, academic_year, created_by) VALUES (?,?,?,?,?,?,?)`,
    [studentNumber, firstName, lastName, degreeId, entryYear, academicYear, createdBy]
  );
  return result.insertId;
}

export async function update(id, studentNumber, firstName, lastName, entryYear) {
  await db.promise().query(
    `UPDATE students SET student_number = ?, first_name = ?, last_name = ?, entry_year = ? WHERE id = ?`,
    [studentNumber, firstName, lastName, entryYear, id]
  );
}

export async function getById(id) {
  const [rows] = await db.promise().query(`SELECT * FROM students WHERE id = ?`, [id]);
  return rows[0];
}

// Marks + module name/credits for one year — read-only views (view/review).
export async function getMarksByYear(studentId, year) {
  const [marks] = await db.promise().query(
    `SELECT dm.module_name, dm.credits, sm.mark, sm.is_resit FROM student_marks sm JOIN degree_modules dm ON sm.degree_module_id = dm.id WHERE sm.student_id = ? AND dm.year = ?`,
    [studentId, year]
  );
  return marks;
}

// Same as above but includes the module id, needed to build the edit form.
export async function getEditableMarksByYear(studentId, year) {
  const [marks] = await db.promise().query(
    `SELECT dm.id AS module_id, dm.module_name, dm.credits, sm.mark, sm.is_resit FROM student_marks sm JOIN degree_modules dm ON sm.degree_module_id = dm.id WHERE sm.student_id = ? AND dm.year = ?`,
    [studentId, year]
  );
  return marks;
}

export async function insertMark(studentId, moduleId, mark, isResit) {
  await db.promise().query(
    `INSERT INTO student_marks (student_id, degree_module_id, mark, is_resit) VALUES (?, ?, ?, ?)`,
    [studentId, moduleId, mark, isResit]
  );
}

export async function updateMark(studentId, moduleId, mark, isResit) {
  await db.promise().query(
    `UPDATE student_marks SET mark = ?, is_resit = ? WHERE student_id = ? AND degree_module_id = ?`,
    [mark, isResit, studentId, moduleId]
  );
}
