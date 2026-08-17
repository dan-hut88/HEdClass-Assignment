import bcrypt from "bcrypt";
import apiClient from "../apiClient.js";
import * as userModel from "../models/userModel.js";
import * as degreeModel from "../models/degreeModel.js";
import { isPresent, isValidEmail, isNumber } from "../utils/validate.js";

export async function getRegistry(req, res) {
  const officers = await userModel.getClassificationOfficers();
  const degrees = await degreeModel.getAll();
  const assignments = await userModel.getAllAssignments();
  res.render("registry", { officers, degrees, assignments });
}

export function getAddOfficer(req, res) {
  res.render("addofficer");
}

export async function postAddOfficer(req, res) {
  try {
    const { name, email, password } = req.body;

    const errors = [];
    if (!isPresent(name)) errors.push("Full name is required.");
    if (!isValidEmail(email)) errors.push("A valid email address is required.");
    if (!isPresent(password)) errors.push("Password is required.");

    if (errors.length > 0) {
      req.session.flash = { type: "error", message: errors.join(" ") };
      return res.redirect("/registry/officers/add");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await userModel.insertOfficer(name, email, passwordHash);
    req.session.flash = { type: "success", message: `Officer ${name} added.` };
    res.redirect("/registry");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with database");
  }
}

export async function getEditOfficer(req, res) {
  const officer = await userModel.getById(req.params.id);
  const degrees = await degreeModel.getAll();
  const assignedIds = await userModel.getAssignedDegreeIds(req.params.id);
  res.render("editofficer", { officer, degrees, assignedIds });
}

export async function postEditOfficer(req, res) {
  try {
    const officerId = req.params.id;
    const { name, email, degrees } = req.body;

    const errors = [];
    if (!isPresent(name)) errors.push("Full name is required.");
    if (!isValidEmail(email)) errors.push("A valid email address is required.");

    if (errors.length > 0) {
      req.session.flash = { type: "error", message: errors.join(" ") };
      return res.redirect(`/registry/officers/${officerId}/edit`);
    }

    await userModel.updateOfficer(officerId, name, email);
    await userModel.clearDegrees(officerId);

    if (degrees) {
      const selectedDegrees = Array.isArray(degrees) ? degrees : [degrees];
      for (let i = 0; i < selectedDegrees.length; i++) {
        await userModel.assignDegree(officerId, selectedDegrees[i]);
      }
    }

    req.session.flash = { type: "success", message: `Officer ${name} updated.` };
    res.redirect("/registry");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong");
  }
}

export async function deleteOfficer(req, res) {
  try {
    const officerId = req.params.id;
    await apiClient.delete(`/officers/${officerId}`);
    req.session.flash = { type: "success", message: "Officer deleted." };
  } catch (e) {
    req.session.flash = { type: "error", message: e.response?.data?.error || "Something went wrong deleting the officer." };
  }
  res.redirect("/registry");
}

export function getAddDegree(req, res) {
  res.render("adddegree");
}

export async function postAddDegree(req, res) {
  try {
    const { name, yr2_weight, yr3_weight, credits } = req.body;

    const errors = [];
    if (!isPresent(name)) errors.push("Degree name is required.");
    if (!isNumber(yr2_weight)) errors.push("Year 2 weighting must be a number.");
    if (!isNumber(yr3_weight)) errors.push("Year 3 weighting must be a number.");
    if (!isNumber(credits)) errors.push("Credits per year must be a number.");

    if (errors.length > 0) {
      req.session.flash = { type: "error", message: errors.join(" ") };
      return res.redirect("/registry/degrees/add");
    }

    await degreeModel.insert(name, yr2_weight, yr3_weight, credits);
    req.session.flash = { type: "success", message: `Degree ${name} added.` };
    res.redirect("/registry");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with database");
  }
}

export async function getEditDegree(req, res) {
  const degree = await degreeModel.getById(req.params.id);
  res.render("editdegree", { degree });
}

export async function postEditDegree(req, res) {
  try {
    const { name, yr2_weight, yr3_weight, credits } = req.body;
    const degreeId = req.params.id;

    const errors = [];
    if (!isPresent(name)) errors.push("Degree name is required.");
    if (!isNumber(yr2_weight)) errors.push("Year 2 weighting must be a number.");
    if (!isNumber(yr3_weight)) errors.push("Year 3 weighting must be a number.");
    if (!isNumber(credits)) errors.push("Credits per year must be a number.");

    if (errors.length > 0) {
      req.session.flash = { type: "error", message: errors.join(" ") };
      return res.redirect(`/registry/degrees/${degreeId}/edit`);
    }

    await degreeModel.update(degreeId, name, yr2_weight, yr3_weight, credits);
    req.session.flash = { type: "success", message: `Degree ${name} updated.` };
    res.redirect("/registry");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something wrong with database");
  }
}

export async function deleteDegree(req, res) {
  try {
    const degreeId = req.params.id;
    await degreeModel.deleteById(degreeId);
    req.session.flash = { type: "success", message: "Degree deleted." };
    res.redirect("/registry");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with deletion");
  }
}
