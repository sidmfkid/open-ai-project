require("dotenv").config();
const openai = require("./api");
const express = require("express");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const path = require("path");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");

const app = express();
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const sessionConfig = {
  name: "session",
  secret: "mynewsecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());

let results = [];

app.get("/", async function (req, res) {
  console.log(results);
  if (req.session.results) {
    console.log(req.session);
    console.log(req.session.page_views);
    results = req.session.results;
  }

  res.render("home", { results: results });
});

app.post("/", async function (req, res) {
  const completion = await openai.createCompletion("text-curie-001", {
    prompt: req.body.prompt,
    temperature: 0.9,
    max_tokens: 200,
  });

  const prompt = {
    input: req.body.prompt,
    output: completion.data.choices[0].text,
  };
  results.unshift(prompt);
  req.session.results = results;

  req.session.save();
  res.redirect("/");
});

const port = process.env.PORT || 80;

const server = app.listen(port, () => {
  console.log(`app started on ${port}`);
});
