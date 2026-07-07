import bcrypt from "bcrypt";
import * as userModel from "../models/userModel.js";
import * as degreeModel from "../models/degreeModel.js";

export function getSignin(req, res) {
  res.render("signin");
}

export async function login(req, res) {
  const userEmail = req.body.emailField;
  const userPassword = req.body.passwordField;

  try {
    const rows = await userModel.findByEmail(userEmail);
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
    } else if (user.role === "classifications officer" && degreeCount > 1) {
      res.redirect("select-degree");
    } else {
      res.redirect("/classifications");
    }
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
}

export function logout(req, res) {
  req.session.destroy();
  res.redirect("/");
}

export async function getSelectDegree(req, res) {
  const officerId = req.session.user.id;
  const degrees = await degreeModel.getByUserId(officerId);
  res.render("selectdegree", { degrees });
}

export async function postSelectDegree(req, res) {
  req.session.user.degree_id = parseInt(req.body.degree_id);
  res.redirect("/classifications");
}
