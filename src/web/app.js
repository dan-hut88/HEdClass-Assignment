import "dotenv/config";
import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import axios from "axios";

const app = express();
const PORT = 3000;

import db from "./db.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.set("view engine", "ejs");

//middleware
const hour = 1000 * 60 * 60 * 1;

app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: hour }
}));

// Redirects to sign-in unless the logged-in user has the required role.
function requireRole(role) {
  return (req, res, next) => {
    if (req.session.user && req.session.user.role === role) {
      return next();
    }
    return res.redirect("/");
  };
}

app.get("/", (req, res) => {
  res.render("signin");
});

app.post("/", async (req, res) => {
  const userEmail = req.body.emailField;
  const userPassword = req.body.passwordField;

  try {
    const [rows] = await db.promise().query(
      "SELECT users.id, users.email, users.role, users.password_hash, user_degree.degree_id FROM users LEFT JOIN user_degree ON users.id = user_degree.user_id WHERE email = ?",
      [userEmail]
    );

    const degreeCount = rows.length;

    if (degreeCount === 0) {
      return res.redirect("/");
    }

    const user = rows[0];
    const match = await bcrypt.compare(userPassword, user.password_hash);

    if (!match) {
      return res.redirect("/");
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      degree_id: user.degree_id
    };



    if (user.role === "registry services officer") {
      res.redirect("/registry");
    }else if (user.role === "classifications officer" && degreeCount > 1) {
      res.redirect("select-degree");
    } else {
      res.redirect("/classifications");
    }

  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/select-degree", requireRole("classifications officer"), async (req, res) => {
  const officerId = req.session.user.id;

  const [degrees] = await db.promise().query(`SELECT degree.* FROM degree
                                              JOIN user_degree ON degree.id = user_degree.degree_id
                                              WHERE user_degree.user_id = ?`, [officerId]);

  res.render("selectdegree", { degrees });
});

app.post("/select-degree", requireRole("classifications officer"), async (req, res) => {
  req.session.user.degree_id = parseInt(req.body.degree_id);
  res.redirect("/classifications");
});



app.get("/registry", requireRole("registry services officer"), async (req, res) => {
  const officerSQL = `SELECT users.*, GROUP_CONCAT(degree.name SEPARATOR ', ') AS degree_name
                    FROM users
                    LEFT JOIN user_degree ON users.id = user_degree.user_id
                    LEFT JOIN degree ON user_degree.degree_id = degree.id
                    WHERE users.role = 'classifications officer'
                    GROUP BY users.id`;
  const degreeSQL = `SELECT * FROM degree`;
  const userDegreeSql = `SELECT * FROM user_degree`;

  const [officers] = await db.promise().query(officerSQL);
  const [degrees] = await db.promise().query(degreeSQL);
  const [assignments] = await db.promise().query(userDegreeSql)


  res.render("registry", { officers, degrees, assignments });
});

app.get("/registry/officers/add", requireRole("registry services officer"), (req, res) => {
  res.render("addofficer");
});

app.post("/registry/officers/add", requireRole("registry services officer"), async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    let password = req.body.password;
    const saltRounds = 10;

    password = await bcrypt.hash(password, saltRounds);

    const insertOfficerSQL = `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`;

    const result = await db.promise().query(insertOfficerSQL, [name, email, password]);
    res.redirect("/registry/officers/add")
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with database")
  }
});


app.get("/registry/officers/:id/edit", requireRole("registry services officer"), async (req, res) => {
  const [officerRow] = await db.promise().query(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
  const officer = officerRow[0];
  const [degrees] = await db.promise().query(`SELECT * FROM degree`);
  const [assigned] = await db.promise().query(`SELECT degree_id FROM user_degree WHERE user_id = ?`, [req.params.id]);
  const assignedIds = [];
  for (let i = 0; i < assigned.length; i++) {
    assignedIds.push(assigned[i].degree_id);
  }
  res.render("editofficer", { officer, degrees, assignedIds });
});

app.post("/registry/officers/:id/delete", requireRole("registry services officer"), async (req, res) => {
  try {
    const officerId = req.params.id;

    const response = await axios.delete(`http://localhost:4000/officers/${officerId}`);

    res.redirect("/registry");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with the database");
  }
});

app.get("/registry/degrees/add", requireRole("registry services officer"), (req, res) => {
  res.render("adddegree");
});

app.post("/registry/officers/:id/edit", requireRole("registry services officer"), async (req, res) => {
  try {
    const officerId = req.params.id;
    const { name, email, degrees } = req.body;

    await db.promise().query(`UPDATE users SET name = ?, email = ? WHERE id = ?`, [name, email, officerId]);

    await db.promise().query(`DELETE FROM user_degree WHERE user_id = ?`, [officerId]);

    if (degrees) {
      const selectedDegrees = Array.isArray(degrees) ? degrees : [degrees];
      for (let i = 0; i < selectedDegrees.length; i++) {
        await db.promise().query(`INSERT INTO user_degree (user_id, degree_id) VALUES (?, ?)`, [officerId, selectedDegrees[i]]);
      }
    }

    res.redirect("/registry");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong");
  }
});


app.post("/registry/degrees/add", requireRole("registry services officer"), async (req, res) => {
  try {
    const { name, yr2_weight, yr3_weight, credits } = req.body;

    const insertDegreeSQL = `INSERT INTO degree(name, weighting_yr2, weighting_yr3, credits_per_year) VALUES (?, ?, ?, ?)`;

    const results = await db.promise().query(insertDegreeSQL, [name, yr2_weight, yr3_weight, credits]);
    res.redirect("/registry/degrees/add");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with database")
  }
});

app.get("/registry/degrees/:id/edit", requireRole("registry services officer"), async (req, res) => {
  const degreeId = req.params.id;
  const [rows] = await db.promise().query(`SELECT * FROM degree WHERE id = ?`, [degreeId]);
  const degree = rows[0];
  res.render("editdegree", { degree });
});

app.post("/registry/degrees/:id/edit", requireRole("registry services officer"), async (req, res) => {
  try {
    const { name, yr2_weight, yr3_weight, credits } = req.body;

    const degreeId = req.params.id;


    const updateDegreeSQL = `UPDATE degree SET name=?, weighting_yr2=?, weighting_yr3=?, credits_per_year= ? WHERE id=?`;

    const results = await db.promise().query(updateDegreeSQL, [name, yr2_weight, yr3_weight, credits, degreeId]);
    res.redirect("/registry");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with database")
  }
});

app.post("/registry/degrees/:id/delete", requireRole("registry services officer"), async (req, res) => {
  try {
    const degreeId = req.params.id;

    const deleteDegreeSql = `DELETE FROM degree WHERE id = ?`;

    const result = await db.promise().query(deleteDegreeSql, [degreeId]);
    res.redirect("/registry");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with deletion");
  };
});

app.get("/classifications", requireRole("classifications officer"), async (req, res) => {
  const degreeId = req.session.user.degree_id;
  const officerId = req.session.user.id;

  const response = await axios.get(`http://localhost:4000/students/${degreeId}?officerId=${officerId}`);
  const students = response.data.data;

  const [rows] = await db.promise().query(`SELECT * FROM degree WHERE id = ?`, [degreeId]);
  const degree = rows[0];


  // stats cards
  const total = students.length;
  const classified = students.filter(s => s.status === 'approved' || s.status === 'overridden').length;
  const pending = students.filter(s => s.status === 'pending_review').length;
  const notEligible = students.filter(s => s.status === null).length;

  // distribution — use final_result so overrides are reflected
  const distribution = {
    first: students.filter(s => s.final_result === 'First Class Honours (1st)').length,
    upper: students.filter(s => s.final_result === 'Upper Second Class (2:1)').length,
    lower: students.filter(s => s.final_result === 'Lower Second Class (2:2)').length,
    third: students.filter(s => s.final_result === 'Third Class Honours').length,
    fail: students.filter(s => s.final_result === 'Fail').length,
  };

  // flags
  const flags = {
    overridden: students.filter(s => s.status === 'overridden').length,
    borderline: students.filter(s => {
      const avg = parseFloat(s.final_average);
      if (!avg) return false;
      return [40, 50, 60, 70].some(b => Math.abs(avg - b) <= 1);
    }).length,
    pendingReview: students.filter(s => s.status === 'pending_review').length,
  };



  res.render("classifications", {
    students, degree,
    stats: { total, classified, pending, notEligible },
    distribution,
    flags
  });
});


app.get("/classifications/students/add", requireRole("classifications officer"), async (req, res) => {
  try {
    const degreeId = req.session.user.degree_id;

    const [degreeRow] = await db.promise().query(`SELECT * FROM degree WHERE id = ?`, [degreeId]);
    const degree = degreeRow[0];


    const [modules1] = await db.promise().query(`SELECT * FROM degree_modules WHERE degree_id = ? AND year = '1'`, [degreeId]);
    const [modules2] = await db.promise().query(`SELECT * FROM degree_modules WHERE degree_id = ? AND year = '2'`, [degreeId]);
    const [modules3] = await db.promise().query(`SELECT * FROM degree_modules WHERE degree_id = ? AND year = '3'`, [degreeId]);

    res.render("addstudent", { modules1, modules2, modules3, degree });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with database")
  }
});

app.post("/classifications/students/add", requireRole("classifications officer"), async (req, res) => {
  try {
    const { snumber, firstName, lastName, year } = req.body
    const degreeId = req.session.user.degree_id;
    const officerID = req.session.user.id;


    const insertStudentSQL = `INSERT INTO students(student_number, first_name, last_name, degree_id, entry_year, created_by) VALUES (?,?,?,?,?,?)`
    const studentResults = await db.promise().query(insertStudentSQL, [snumber, firstName, lastName, degreeId, year, officerID])

    const student_id = studentResults[0].insertId;
    const moduleIds = req.body.moduleIds;
    const marks = req.body.marks;
    const resitIds = req.body.isResit ? [].concat(req.body.isResit).map(String) : [];

    for (let i = 0; i < moduleIds.length; i++) {
      const isResit = resitIds.includes(String(moduleIds[i])) ? 1 : 0;
      const rawMark = parseFloat(marks[i]);
      const updatedMark = isResit && rawMark > 40 ? 40 : rawMark;
      const insertModuleSql = `INSERT INTO student_marks (student_id, degree_module_id, mark, is_resit) VALUES (?, ?, ?, ?)`;
      const degreeResults = await db.promise().query(insertModuleSql, [student_id, moduleIds[i], updatedMark, isResit]);
    };

    res.redirect("/classifications/students/add");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with adding")
  }
});

app.get("/classifications/students/:id/review", requireRole("classifications officer"), async (req, res) => {
  try {
    const studentId = req.params.id;

    const [studentRow] = await db.promise().query(`SELECT * FROM students WHERE id = ?`, [studentId]);
    const student = studentRow[0];

    /*if (!student || student.created_by !== officerId) {
      return res.redirect("/classifications");
    }*/

    const [modules1] = await db.promise().query(`SELECT dm.module_name, dm.credits, sm.mark, sm.is_resit FROM student_marks sm JOIN degree_modules dm ON sm.degree_module_id = dm.id WHERE sm.student_id = ? AND dm.year = '1'`, [studentId]);
    const [modules2] = await db.promise().query(`SELECT dm.module_name, dm.credits, sm.mark, sm.is_resit FROM student_marks sm JOIN degree_modules dm ON sm.degree_module_id = dm.id WHERE sm.student_id = ? AND dm.year = '2'`, [studentId]);
    const [modules3] = await db.promise().query(`SELECT dm.module_name, dm.credits, sm.mark, sm.is_resit FROM student_marks sm JOIN degree_modules dm ON sm.degree_module_id = dm.id WHERE sm.student_id = ? AND dm.year = '3'`, [studentId]);

    const [classRow] = await db.promise().query(`SELECT * FROM classifications WHERE student_id = ?`, [studentId]);
    const classification = classRow[0];

    const classificationOptions = [
      'First Class Honours (1st)',
      'Upper Second Class (2:1)',
      'Lower Second Class (2:2)',
      'Third Class Honours',
      'Fail'
    ];

    res.render("reviewstudent", { student, modules1, modules2, modules3, classification, classificationOptions });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong");
  }
});

app.post("/classifications/students/:id/review", requireRole("classifications officer"), async (req, res) => {
  try {
    const studentId = req.params.id;
    const { final_result, rationale} = req.body;
    const isOverridden = req.body.is_overridden === '1' ? 1 : 0;
    const officerId = req.session.user.id;
    const newStatus = isOverridden ? 'overridden' : 'approved';

    await db.promise().query(` UPDATE classifications
                                SET final_result = ?, is_overridden = ?, status = ?, rationale = ?,classified_by = ?
                                WHERE student_id = ?`, [final_result, isOverridden, newStatus, rationale, officerId, studentId]);

    res.redirect("/classifications");
  } catch (e) {
    console.log(e);
    res.status(500).send("Something went wrong with review");
  }
});

app.get("/classifications/students/:id", requireRole("classifications officer"), async (req, res) => {
  try {
    const studentId = req.params.id;

    const [studentRow] = await db.promise().query(`SELECT * FROM students WHERE id = ?`, [studentId]);
    const student = studentRow[0];

    /*if (!student || student.created_by !== officerId) {
      return res.redirect("/classifications");
    }*/

    const [modules1] = await db.promise().query(`SELECT dm.module_name, dm.credits, sm.mark, sm.is_resit FROM student_marks sm JOIN degree_modules dm ON sm.degree_module_id = dm.id WHERE sm.student_id = ? AND dm.year = '1'`, [studentId]);
    const [modules2] = await db.promise().query(`SELECT dm.module_name, dm.credits, sm.mark, sm.is_resit FROM student_marks sm JOIN degree_modules dm ON sm.degree_module_id = dm.id WHERE sm.student_id = ? AND dm.year = '2'`, [studentId]);
    const [modules3] = await db.promise().query(`SELECT dm.module_name, dm.credits, sm.mark, sm.is_resit FROM student_marks sm JOIN degree_modules dm ON sm.degree_module_id = dm.id WHERE sm.student_id = ? AND dm.year = '3'`, [studentId]);

    const [classRow] = await db.promise().query(`SELECT * FROM classifications WHERE student_id = ?`, [studentId]);
    const classification = classRow[0] || null;

    res.render("studentview", { student, modules1, modules2, modules3, classification });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong");
  }
});

app.get("/classifications/students/:id/edit", requireRole("classifications officer"), async (req, res) => {
  try {
    const studentId = req.params.id;

    const [studentRow] = await db.promise().query(`SELECT * FROM students WHERE id = ?`, [studentId]);
    const student = studentRow[0];

    /*if (!student || student.created_by !== officerId) {
      return res.redirect("/classifications");
    }*/

    const degreeId = req.session.user.degree_id;

    const [degreeRow] = await db.promise().query(`SELECT * FROM degree WHERE id = ?`, [degreeId]);
    const degree = degreeRow[0];



    const [modules1] = await db.promise().query(`SELECT dm.id AS module_id, dm.module_name, dm.credits, sm.mark, sm.is_resit FROM student_marks sm JOIN degree_modules dm ON sm.degree_module_id = dm.id WHERE sm.student_id = ? AND dm.year = '1'`, [studentId]);
    const [modules2] = await db.promise().query(`SELECT dm.id AS module_id, dm.module_name, dm.credits, sm.mark, sm.is_resit FROM student_marks sm JOIN degree_modules dm ON sm.degree_module_id = dm.id WHERE sm.student_id = ? AND dm.year = '2'`, [studentId]);
    const [modules3] = await db.promise().query(`SELECT dm.id AS module_id, dm.module_name, dm.credits, sm.mark, sm.is_resit FROM student_marks sm JOIN degree_modules dm ON sm.degree_module_id = dm.id WHERE sm.student_id = ? AND dm.year = '3'`, [studentId]);


    res.render("editstudent", { student, modules1, modules2, modules3, degree });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong");
  }
});

app.post("/classifications/students/:id/edit", requireRole("classifications officer"), async (req, res) => {
  try {
    const studentID = req.params.id;
    const { snumber, firstName, lastName, year } = req.body



    const updateStudentSQL = `UPDATE students SET student_number = ?, first_name = ?, last_name = ?, entry_year = ? WHERE id = ?`
    const studentResults = await db.promise().query(updateStudentSQL, [snumber, firstName, lastName, year, studentID])


    const moduleIds = req.body.moduleIds;
    const marks = req.body.marks;
    const resitIds = req.body.isResit ? [].concat(req.body.isResit).map(String) : [];

    for (let i = 0; i < moduleIds.length; i++) {
      const isResit = resitIds.includes(String(moduleIds[i])) ? 1 : 0;
      const rawMark = parseFloat(marks[i]);
      const updatedMark = isResit && rawMark > 40 ? 40 : rawMark;
      const updateModuleSql = `UPDATE student_marks SET mark = ?, is_resit = ? WHERE student_id = ? AND degree_module_id = ?`;
      const degreeResults = await db.promise().query(updateModuleSql, [updatedMark, isResit,  studentID, moduleIds[i]]);
    };

    res.redirect("/classifications");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with editing")
  }
});

app.post("/classifications/students/:id/delete", requireRole("classifications officer"), async (req, res) => {
  try {
    const response = await axios.delete(`http://localhost:4000/students/${req.params.id}`);
    res.redirect("/classifications");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with deletion");
  };
});

app.post("/classifications/run", requireRole("classifications officer"), async (req, res) => {
  try {
    const response = await axios.post("http://localhost:4000/classifications/run", {
      officerID: req.session.user.id,
      degreeId: req.session.user.degree_id
    });

    res.redirect(`/classifications/`);
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with classification");
  }
});


app.listen(PORT, (err) => {
  console.log(`listening on port http://localhost:${PORT}`);
});
