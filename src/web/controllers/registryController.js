import bcrypt from "bcrypt";
import apiClient from "../apiClient.js";
import * as userModel from "../models/userModel.js";
import * as degreeModel from "../models/degreeModel.js";

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
    const name = req.body.name;
    const email = req.body.email;
    let password = req.body.password;
    const saltRounds = 10;

    password = await bcrypt.hash(password, saltRounds);

    await userModel.insertOfficer(name, email, password);
    res.redirect("/registry/officers/add");
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

    await userModel.updateOfficer(officerId, name, email);
    await userModel.clearDegrees(officerId);

    if (degrees) {
      const selectedDegrees = Array.isArray(degrees) ? degrees : [degrees];
      for (let i = 0; i < selectedDegrees.length; i++) {
        await userModel.assignDegree(officerId, selectedDegrees[i]);
      }
    }

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
    res.redirect("/registry");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with the database");
  }
}

export function getAddDegree(req, res) {
  res.render("adddegree");
}

export async function postAddDegree(req, res) {
  try {
    const { name, yr2_weight, yr3_weight, credits } = req.body;
    await degreeModel.insert(name, yr2_weight, yr3_weight, credits);
    res.redirect("/registry/degrees/add");
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
    await degreeModel.update(degreeId, name, yr2_weight, yr3_weight, credits);
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
    res.redirect("/registry");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong with deletion");
  }
}
