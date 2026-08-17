import axios from "axios";
import * as degreeModel from "../models/degreeModel.js";
import * as studentModel from "../models/studentModel.js";
import * as classificationModel from "../models/classificationModel.js";

export async function getDashboard(req, res) {
  const degreeId = req.session.user.degree_id;
  const officerId = req.session.user.id;

  const response = await axios.get(`http://localhost:4000/students/${degreeId}?officerId=${officerId}`);
  const students = response.data.data;

  const degree = await degreeModel.getById(degreeId);

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
    notEligible: students.filter(s => s.final_result === 'Not eligible for Honours').length,
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
}

export async function getAddStudent(req, res) {
  try {
    const degreeId = req.session.user.degree_id;

    const degree = await degreeModel.getById(degreeId);

    const modules1 = await degreeModel.getModulesByYear(degreeId, '1');
    const modules2 = await degreeModel.getModulesByYear(degreeId, '2');
    const modules3 = await degreeModel.getModulesByYear(degreeId, '3');

    res.render("addstudent", { modules1, modules2, modules3, degree });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with database");
  }
}

export async function postAddStudent(req, res) {
  try {
    const { snumber, firstName, lastName, year, academicYear } = req.body;
    const degreeId = req.session.user.degree_id;
    const officerID = req.session.user.id;

    const studentId = await studentModel.insert(snumber, firstName, lastName, degreeId, year, academicYear, officerID);

    const moduleIds = req.body.moduleIds;
    const marks = req.body.marks;
    const resitIds = req.body.isResit ? [].concat(req.body.isResit).map(String) : [];

    for (let i = 0; i < moduleIds.length; i++) {
      const isResit = resitIds.includes(String(moduleIds[i])) ? 1 : 0;
      const rawMark = parseFloat(marks[i]);
      await studentModel.insertMark(studentId, moduleIds[i], rawMark, isResit);
    }

    res.redirect("/classifications/students/add");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with adding");
  }
}

export async function getReviewStudent(req, res) {
  try {
    const studentId = req.params.id;

    const student = await studentModel.getById(studentId);

    /*if (!student || student.created_by !== officerId) {
      return res.redirect("/classifications");
    }*/

    const modules1 = await studentModel.getMarksByYear(studentId, '1');
    const modules2 = await studentModel.getMarksByYear(studentId, '2');
    const modules3 = await studentModel.getMarksByYear(studentId, '3');

    const classification = await classificationModel.getByStudentId(studentId);

    const classificationOptions = [
      'First Class Honours (1st)',
      'Upper Second Class (2:1)',
      'Lower Second Class (2:2)',
      'Third Class Honours',
      'Fail',
      'Not eligible for Honours'
    ];

    res.render("reviewstudent", { student, modules1, modules2, modules3, classification, classificationOptions });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong");
  }
}

export async function postReviewStudent(req, res) {
  try {
    const studentId = req.params.id;
    const { final_result, rationale } = req.body;
    const isOverridden = req.body.is_overridden === '1' ? 1 : 0;
    const officerId = req.session.user.id;
    const newStatus = isOverridden ? 'overridden' : 'approved';

    await classificationModel.updateReview(studentId, final_result, isOverridden, newStatus, rationale, officerId);

    res.redirect("/classifications");
  } catch (e) {
    console.log(e);
    res.status(500).send("Something went wrong with review");
  }
}

export async function getStudent(req, res) {
  try {
    const studentId = req.params.id;

    const student = await studentModel.getById(studentId);

    /*if (!student || student.created_by !== officerId) {
      return res.redirect("/classifications");
    }*/

    const modules1 = await studentModel.getMarksByYear(studentId, '1');
    const modules2 = await studentModel.getMarksByYear(studentId, '2');
    const modules3 = await studentModel.getMarksByYear(studentId, '3');

    const classification = await classificationModel.getByStudentId(studentId) || null;

    res.render("studentview", { student, modules1, modules2, modules3, classification });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong");
  }
}

export async function getEditStudent(req, res) {
  try {
    const studentId = req.params.id;

    const student = await studentModel.getById(studentId);

    /*if (!student || student.created_by !== officerId) {
      return res.redirect("/classifications");
    }*/

    const degreeId = req.session.user.degree_id;

    const degree = await degreeModel.getById(degreeId);

    const modules1 = await studentModel.getEditableMarksByYear(studentId, '1');
    const modules2 = await studentModel.getEditableMarksByYear(studentId, '2');
    const modules3 = await studentModel.getEditableMarksByYear(studentId, '3');

    res.render("editstudent", { student, modules1, modules2, modules3, degree });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong");
  }
}

export async function postEditStudent(req, res) {
  try {
    const studentID = req.params.id;
    const { snumber, firstName, lastName, year } = req.body;

    await studentModel.update(studentID, snumber, firstName, lastName, year);

    const moduleIds = req.body.moduleIds;
    const marks = req.body.marks;
    const resitIds = req.body.isResit ? [].concat(req.body.isResit).map(String) : [];

    for (let i = 0; i < moduleIds.length; i++) {
      const isResit = resitIds.includes(String(moduleIds[i])) ? 1 : 0;
      const rawMark = parseFloat(marks[i]);
      await studentModel.updateMark(studentID, moduleIds[i], rawMark, isResit);
    }

    res.redirect("/classifications");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with editing");
  }
}

export async function deleteStudent(req, res) {
  try {
    await axios.delete(`http://localhost:4000/students/${req.params.id}`);
    res.redirect("/classifications");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with deletion");
  }
}

export async function reopenStudent(req, res) {
  try {
    await classificationModel.reopen(req.params.id);
    res.redirect("/classifications");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with reopening");
  }
}

export async function runClassifications(req, res) {
  try {
    await axios.post("http://localhost:4000/classifications/run", {
      officerID: req.session.user.id,
      degreeId: req.session.user.degree_id
    });

    res.redirect(`/classifications/`);
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with classification");
  }
}
