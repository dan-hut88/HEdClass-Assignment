import db from "../db.js";

// Login lookup: user plus (via LEFT JOIN) one of their degree assignments.
export async function findByEmail(email) {
  const [rows] = await db.promise().query(
    "SELECT users.id, users.email, users.role, users.password_hash, user_degree.degree_id FROM users LEFT JOIN user_degree ON users.id = user_degree.user_id WHERE email = ?",
    [email]
  );
  return rows;
}

// All classification officers with a comma-joined list of their degree names.
export async function getClassificationOfficers() {
  const [officers] = await db.promise().query(`SELECT users.*, GROUP_CONCAT(degree.name SEPARATOR ', ') AS degree_name
                    FROM users
                    LEFT JOIN user_degree ON users.id = user_degree.user_id
                    LEFT JOIN degree ON user_degree.degree_id = degree.id
                    WHERE users.role = 'classifications officer'
                    GROUP BY users.id`);
  return officers;
}

export async function getAllAssignments() {
  const [assignments] = await db.promise().query(`SELECT * FROM user_degree`);
  return assignments;
}

export async function getById(id) {
  const [rows] = await db.promise().query(`SELECT * FROM users WHERE id = ?`, [id]);
  return rows[0];
}

export async function insertOfficer(name, email, passwordHash) {
  const [result] = await db.promise().query(
    `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
    [name, email, passwordHash]
  );
  return result;
}

export async function updateOfficer(id, name, email) {
  await db.promise().query(`UPDATE users SET name = ?, email = ? WHERE id = ?`, [name, email, id]);
}

export async function getAssignedDegreeIds(userId) {
  const [assigned] = await db.promise().query(`SELECT degree_id FROM user_degree WHERE user_id = ?`, [userId]);
  const assignedIds = [];
  for (let i = 0; i < assigned.length; i++) {
    assignedIds.push(assigned[i].degree_id);
  }
  return assignedIds;
}

export async function clearDegrees(userId) {
  await db.promise().query(`DELETE FROM user_degree WHERE user_id = ?`, [userId]);
}

export async function assignDegree(userId, degreeId) {
  await db.promise().query(`INSERT INTO user_degree (user_id, degree_id) VALUES (?, ?)`, [userId, degreeId]);
}
