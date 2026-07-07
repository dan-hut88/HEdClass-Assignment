import db from "../db.js";

export async function getAll() {
  const [degrees] = await db.promise().query(`SELECT * FROM degree`);
  return degrees;
}

export async function getById(id) {
  const [rows] = await db.promise().query(`SELECT * FROM degree WHERE id = ?`, [id]);
  return rows[0];
}

// Degrees a given officer is assigned to (for the select-degree screen).
export async function getByUserId(userId) {
  const [degrees] = await db.promise().query(`SELECT degree.* FROM degree
                                              JOIN user_degree ON degree.id = user_degree.degree_id
                                              WHERE user_degree.user_id = ?`, [userId]);
  return degrees;
}

export async function insert(name, yr2Weight, yr3Weight, credits) {
  const [result] = await db.promise().query(
    `INSERT INTO degree(name, weighting_yr2, weighting_yr3, credits_per_year) VALUES (?, ?, ?, ?)`,
    [name, yr2Weight, yr3Weight, credits]
  );
  return result;
}

export async function update(id, name, yr2Weight, yr3Weight, credits) {
  await db.promise().query(
    `UPDATE degree SET name=?, weighting_yr2=?, weighting_yr3=?, credits_per_year= ? WHERE id=?`,
    [name, yr2Weight, yr3Weight, credits, id]
  );
}

export async function deleteById(id) {
  await db.promise().query(`DELETE FROM degree WHERE id = ?`, [id]);
}

export async function getModulesByYear(degreeId, year) {
  const [modules] = await db.promise().query(
    `SELECT * FROM degree_modules WHERE degree_id = ? AND year = ?`,
    [degreeId, year]
  );
  return modules;
}
