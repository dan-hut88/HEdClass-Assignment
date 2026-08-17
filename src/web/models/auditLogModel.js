import db from "../db.js";

export async function log(userId, action, entity, entityId, details) {
  await db.promise().query(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)`,
    [userId, action, entity, entityId, details]
  );
}

export async function getForUser(userId) {
  const [rows] = await db.promise().query(
    `SELECT * FROM audit_log WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}
