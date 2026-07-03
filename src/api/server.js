import "dotenv/config";
import mysql from "mysql2";
import express from "express";
const server = express();
const PORT = 4000;

server.use(express.json());
server.use(express.urlencoded( {extended: true }) );


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

      const [students] = await connection.promise().query(`SELECT s.*, d.weighting_yr2, d.weighting_yr3 
                                                  FROM students s 
                                                  JOIN degree d ON s.degree_id = d.id 
                                                  WHERE s.degree_id = ? AND s.created_by = ?`, [degreeId, officerID]);

      function weightedAverage(marks) {

        let totalMarks = 0;
        let totalCredits = 0;

        for (const m of marks) {
          let mark = parseFloat(m.mark);
          

          if (m.is_resit) {
            mark = Math.min(mark, 40);
          }

          totalMarks += mark * m.credits;
          totalCredits += m.credits;
        }

        return parseFloat((totalMarks / totalCredits).toFixed(2));
      }

      function classificationResult(average) {

        let result = "";

        if (average >= 70) {
          result = "First Class Honours (1st)"
        } else if (average >= 60) {
          result = "Upper Second Class (2:1)"
        } else if (average >= 50) {
          result = "Lower Second Class (2:2)"
        } else if (average >= 40) {
          result = "Third Class Honours"
        } else {
          result = "Fail"
        }

        return result;

      }

      for (const student of students) {

        const [marks2] = await connection.promise().query(`SELECT sm.mark, sm.is_resit, dm.credits 
                                                  FROM student_marks sm 
                                                  JOIN degree_modules dm ON sm.degree_module_id = dm.id 
                                                  WHERE sm.student_id = ? AND dm.year = '2'`, [student.id]);


        const [marks3] = await connection.promise().query(`SELECT sm.mark, sm.is_resit, dm.credits 
                                                  FROM student_marks sm 
                                                  JOIN degree_modules dm ON sm.degree_module_id = dm.id 
                                                  WHERE sm.student_id = ? AND dm.year = '3'`, [student.id]);


        const yr2Average = weightedAverage(marks2);
        const yr3Average = weightedAverage(marks3);
        const w2 = parseFloat(student.weighting_yr2) / 100;
        const w3 = parseFloat(student.weighting_yr3) / 100;

        const finalAverage = parseFloat(((yr2Average * w2) + (yr3Average * w3)).toFixed(2));



        const proposedResult = classificationResult(finalAverage);

        const [existing] = await connection.promise().query(
          `SELECT id FROM classifications WHERE student_id = ?`, [student.id]
        );

        if (existing.length === 0) {
          await connection.promise().query(`INSERT INTO classifications 
                                  (student_id, degree_id, yr2_average, yr3_average, final_average, proposed_result, final_result, is_overridden, status, rationale, classified_by) 
                                  VALUES (?, ?, ?, ?, ?, ?, "Pending", 0, 'pending_review', '', ?)`,
            [student.id, student.degree_id, yr2Average, yr3Average, finalAverage,
              proposedResult,officerID]);
        }

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

