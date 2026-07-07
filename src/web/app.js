import "dotenv/config";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import authRouter from "./routes/auth.js";
import registryRouter from "./routes/registry.js";
import classificationsRouter from "./routes/classifications.js";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hour = 1000 * 60 * 60 * 1;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: hour }
}));

app.use("/", authRouter);
app.use("/registry", registryRouter);
app.use("/classifications", classificationsRouter);

app.listen(PORT, (err) => {
  console.log(`listening on port http://localhost:${PORT}`);
});
