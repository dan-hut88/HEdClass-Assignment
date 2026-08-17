import "dotenv/config";
import mysql from "mysql2";
import express from "express";
import { classifyStudent } from "./services/classify.js";
const server = express();
const PORT = 4000;

server.use(express.json());
server.use(express.urlencoded( {extended: true }) );

server.use((req, res, next) => {
  if (req.get("x-api-key") !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});


const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

connection.getConnection((err) => {
  if (err) return console.log(err);
  console.log("connected to local mysql db");
});


server.get('/students/:degree_id', async (req, res) => {
  
    const degreeId = req.params.degree_id;
    const officerId = req.query.officerId;

  try {
    const [students] = await connection.promise().query(`
      SELECT 
        s.id, s.first_name, s.last_name, s.student_number,
        c.yr2_average, c.yr3_average, c.final_average,
        c.proposed_result, c.final_result,
        c.is_overridden, c.status, c.rationale
      FROM students s
      LEFT JOIN classifications c ON s.id = c.student_id
      WHERE s.degree_id = ? AND s.created_by = ?
      ORDER BY s.last_name ASC
    `, [degreeId, officerId]);

    res.json({
      data: students,
      info: 'request successful'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

server.delete("/officers/:id", async (req, res) => {
  try {
    
      const officerId = req.params.id;

      const [degreeRows] = await connection.promise().query(`SELECT * FROM user_degree WHERE user_id = ?`, [officerId]);
      const [studentRows] = await connection.promise().query(`SELECT * FROM students WHERE created_by = ?`, [officerId]);

      if (degreeRows.length > 0 || studentRows.length > 0) {
        return res.status(409).json({ error: "Officer cannot be deleted while assigned to a degree or has students" });
      }

      await connection.promise().query(`DELETE FROM users WHERE id = ?`, [officerId]);
      

      res.json({
      data: { id: parseInt(officerId) },
      info: "Officer deleted successfully",
    });

  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with the database");
  }
});

server.post("/classifications/run", async (req, res) => {

  try {
    
      const officerID = req.body.officerID;
      const degreeId = req.body.degreeId;

      const [students] = await connection.promise().query(`SELECT s.*, d.weighting_yr2, d.weighting_yr3, d.credits_per_year
                                                  FROM students s
                                                  JOIN degree d ON s.degree_id = d.id
                                                  WHERE s.degree_id = ? AND s.created_by = ?`, [degreeId, officerID]);

      for (const student of students) {

        const [marks1] = await connection.promise().query(`SELECT sm.mark, sm.is_resit, dm.credits
                                                  FROM student_marks sm
                                                  JOIN degree_modules dm ON sm.degree_module_id = dm.id
                                                  WHERE sm.student_id = ? AND dm.year = '1'`, [student.id]);

        const [marks2] = await connection.promise().query(`SELECT sm.mark, sm.is_resit, dm.credits
                                                  FROM student_marks sm
                                                  JOIN degree_modules dm ON sm.degree_module_id = dm.id
                                                  WHERE sm.student_id = ? AND dm.year = '2'`, [student.id]);


        const [marks3] = await connection.promise().query(`SELECT sm.mark, sm.is_resit, dm.credits
                                                  FROM student_marks sm
                                                  JOIN degree_modules dm ON sm.degree_module_id = dm.id
                                                  WHERE sm.student_id = ? AND dm.year = '3'`, [student.id]);


        const { yr2Average, yr3Average, finalAverage, proposedResult } = classifyStudent({
          yearMarks: { 1: marks1, 2: marks2, 3: marks3 },
          creditsPerYear: student.credits_per_year,
          weightingYr2: student.weighting_yr2,
          weightingYr3: student.weighting_yr3,
        });

        const [existing] = await connection.promise().query(
          `SELECT id, status FROM classifications WHERE student_id = ?`, [student.id]
        );

        if (existing.length === 0) {
          await connection.promise().query(`INSERT INTO classifications
                                  (student_id, degree_id, yr2_average, yr3_average, final_average, proposed_result, final_result, is_overridden, status, rationale, classified_by)
                                  VALUES (?, ?, ?, ?, ?, ?, "Pending", 0, 'pending_review', '', ?)`,
            [student.id, student.degree_id, yr2Average, yr3Average, finalAverage,
              proposedResult,officerID]);
        } else if (existing[0].status === 'pending_review') {
          await connection.promise().query(`UPDATE classifications
                                  SET yr2_average = ?, yr3_average = ?, final_average = ?, proposed_result = ?
                                  WHERE id = ?`,
            [yr2Average, yr3Average, finalAverage, proposedResult, existing[0].id]);
        }
        // approved/overridden rows are left untouched — an officer must reopen them first

      }

      res.json({ info: 'Classifications complete' });


  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }

});

server.delete("/students/:id", async (req, res) => {
  try {
    const studentId = req.params.id;

    const [classRow] = await connection.promise().query(
      `SELECT status FROM classifications WHERE student_id = ?`, [studentId]
    );

    if (classRow.length > 0 && (classRow[0].status === 'approved' || classRow[0].status === 'overridden')) {
      return res.status(409).json({ error: "Cannot delete a student with an approved or overridden classification" });
    }

    await connection.promise().query(`DELETE FROM classifications WHERE student_id = ?`, [studentId]);
    await connection.promise().query(`DELETE FROM student_marks WHERE student_id = ?`, [studentId]);
    await connection.promise().query(`DELETE FROM students WHERE id = ?`, [studentId]);

    res.json({
      data: { id: parseInt(studentId) },
      info: "Student deleted successfully"
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`API started on port ${PORT}`);
});

