import apiClient from "../apiClient.js";
import * as degreeModel from "../models/degreeModel.js";
import * as studentModel from "../models/studentModel.js";
import * as classificationModel from "../models/classificationModel.js";
import { isPresent, isMarkInRange } from "../utils/validate.js";

const CLASSIFICATION_OPTIONS = [
  'First Class Honours (1st)',
  'Upper Second Class (2:1)',
  'Lower Second Class (2:2)',
  'Third Class Honours',
  'Fail',
  'Not eligible for Honours'
];

// A student belongs to the officer who created them — used to stop one
// classifications officer reaching another's students by guessing an id.
function isOwnStudent(req, student) {
  return !!student && student.created_by === req.session.user.id;
}

function marksInRange(marks) {
  return [].concat(marks || []).every(isMarkInRange);
}

function csvField(value) {
  const str = String(value ?? "");
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function getDashboard(req, res) {
  const degreeId = req.session.user.degree_id;
  const officerId = req.session.user.id;

  const response = await apiClient.get(`/students/${degreeId}?officerId=${officerId}`);
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

export async function exportCsv(req, res) {
  try {
    const degreeId = req.session.user.degree_id;
    const officerId = req.session.user.id;

    const response = await apiClient.get(`/students/${degreeId}?officerId=${officerId}`);
    const students = response.data.data;

    const headers = ["Student number", "First name", "Last name", "Yr2 average", "Yr3 average", "Final average", "Result", "Status", "Overridden"];
    const rows = students.map(s => [
      s.student_number,
      s.first_name,
      s.last_name,
      s.yr2_average,
      s.yr3_average,
      s.final_average,
      s.final_result,
      s.status,
      s.is_overridden ? "Yes" : "No",
    ]);

    const csv = [headers, ...rows].map(row => row.map(csvField).join(",")).join("\r\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"classifications.csv\"");
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong exporting the cohort");
  }
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

    const moduleIds = req.body.moduleIds;
    const marks = req.body.marks;
    const resitIds = req.body.isResit ? [].concat(req.body.isResit).map(String) : [];

    const errors = [];
    if (!isPresent(snumber)) errors.push("Student number is required.");
    if (!isPresent(firstName)) errors.push("First name is required.");
    if (!isPresent(lastName)) errors.push("Last name is required.");
    if (!isPresent(year)) errors.push("Entry year is required.");
    if (!isPresent(academicYear)) errors.push("Academic year is required.");
    if (!marksInRange(marks)) errors.push("All marks must be between 0 and 100.");

    if (errors.length > 0) {
      req.session.flash = { type: "error", message: errors.join(" ") };
      return res.redirect("/classifications/students/add");
    }

    const studentId = await studentModel.insert(snumber, firstName, lastName, degreeId, year, academicYear, officerID);

    for (let i = 0; i < moduleIds.length; i++) {
      const isResit = resitIds.includes(String(moduleIds[i])) ? 1 : 0;
      const rawMark = parseFloat(marks[i]);
      await studentModel.insertMark(studentId, moduleIds[i], rawMark, isResit);
    }

    req.session.flash = { type: "success", message: `${firstName} ${lastName} added.` };
    res.redirect("/classifications");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with adding");
  }
}

export async function getReviewStudent(req, res) {
  try {
    const studentId = req.params.id;

    const student = await studentModel.getById(studentId);

    if (!isOwnStudent(req, student)) {
      return res.redirect("/classifications");
    }

    const modules1 = await studentModel.getMarksByYear(studentId, '1');
    const modules2 = await studentModel.getMarksByYear(studentId, '2');
    const modules3 = await studentModel.getMarksByYear(studentId, '3');

    const classification = await classificationModel.getByStudentId(studentId);

    res.render("reviewstudent", { student, modules1, modules2, modules3, classification, classificationOptions: CLASSIFICATION_OPTIONS });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong");
  }
}

export async function postReviewStudent(req, res) {
  try {
    const studentId = req.params.id;
    const student = await studentModel.getById(studentId);

    if (!isOwnStudent(req, student)) {
      return res.redirect("/classifications");
    }

    const { final_result, rationale } = req.body;
    const isOverridden = req.body.is_overridden === '1' ? 1 : 0;
    const officerId = req.session.user.id;
    const newStatus = isOverridden ? 'overridden' : 'approved';

    const errors = [];
    if (!CLASSIFICATION_OPTIONS.includes(final_result)) errors.push("Select a valid classification result.");
    if (!isPresent(rationale)) errors.push("Rationale is required.");

    if (errors.length > 0) {
      req.session.flash = { type: "error", message: errors.join(" ") };
      return res.redirect(`/classifications/students/${studentId}/review`);
    }

    await classificationModel.updateReview(studentId, final_result, isOverridden, newStatus, rationale, officerId);

    req.session.flash = { type: "success", message: isOverridden ? "Classification overridden." : "Classification approved." };
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

    if (!isOwnStudent(req, student)) {
      return res.redirect("/classifications");
    }

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

    if (!isOwnStudent(req, student)) {
      return res.redirect("/classifications");
    }

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
    const student = await studentModel.getById(studentID);

    if (!isOwnStudent(req, student)) {
      return res.redirect("/classifications");
    }

    const { snumber, firstName, lastName, year } = req.body;
    const moduleIds = req.body.moduleIds;
    const marks = req.body.marks;
    const resitIds = req.body.isResit ? [].concat(req.body.isResit).map(String) : [];

    const errors = [];
    if (!isPresent(snumber)) errors.push("Student number is required.");
    if (!isPresent(firstName)) errors.push("First name is required.");
    if (!isPresent(lastName)) errors.push("Last name is required.");
    if (!isPresent(year)) errors.push("Entry year is required.");
    if (!marksInRange(marks)) errors.push("All marks must be between 0 and 100.");

    if (errors.length > 0) {
      req.session.flash = { type: "error", message: errors.join(" ") };
      return res.redirect(`/classifications/students/${studentID}/edit`);
    }

    await studentModel.update(studentID, snumber, firstName, lastName, year);

    for (let i = 0; i < moduleIds.length; i++) {
      const isResit = resitIds.includes(String(moduleIds[i])) ? 1 : 0;
      const rawMark = parseFloat(marks[i]);
      await studentModel.updateMark(studentID, moduleIds[i], rawMark, isResit);
    }

    req.session.flash = { type: "success", message: `${firstName} ${lastName} updated.` };
    res.redirect("/classifications");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with editing");
  }
}

export async function deleteStudent(req, res) {
  try {
    const student = await studentModel.getById(req.params.id);

    if (!isOwnStudent(req, student)) {
      return res.redirect("/classifications");
    }

    await apiClient.delete(`/students/${req.params.id}`);
    req.session.flash = { type: "success", message: "Student deleted." };
  } catch (e) {
    req.session.flash = { type: "error", message: e.response?.data?.error || "Something went wrong with deletion." };
  }
  res.redirect("/classifications");
}

export async function reopenStudent(req, res) {
  try {
    const student = await studentModel.getById(req.params.id);

    if (!isOwnStudent(req, student)) {
      return res.redirect("/classifications");
    }

    await classificationModel.reopen(req.params.id);
    req.session.flash = { type: "success", message: "Student reopened for review." };
    res.redirect("/classifications");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with reopening");
  }
}

export async function runClassifications(req, res) {
  try {
    await apiClient.post("/classifications/run", {
      officerID: req.session.user.id,
      degreeId: req.session.user.degree_id
    });

    req.session.flash = { type: "success", message: "Classifications run." };
    res.redirect(`/classifications/`);
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with classification");
  }
}
