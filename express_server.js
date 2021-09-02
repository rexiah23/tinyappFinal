const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { generateRandomString, getUserByEmail, isPasswordCorrect, urlsForUser } = require('./helpers');
const app = express();
const PORT = 8080; // default port 8080

//Set View Engine
app.set('view engine', 'ejs');

//Use middleware's
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['keys1']
}));

//Database for URLS
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    shortURL: "b2xVn2",
    id: "b5xVl3",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    shortURL: "9sm5xK",
    id: "b5xV244l3"
  },
  "sgq3y6": {
    longURL: "http://www.youtube.com",
    shortURL: "b2xVn2",
    id: "b5xV2dl3",
  }
};

//Database for users
const users = {
  "b5xVl3": {
    id: "b5xVl3",
    email: "lewis.lee@mail.utoronto.ca",
    password: bcrypt.hashSync("lee123", 10)
  }
};

// GET Routes
app.get("/", (req, res) => {
  const loggedUserCookie = req.session.user_id;
  if (!loggedUserCookie) {
    return res.redirect('/login');
  }
  return res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const loggedUserCookie = req.session.user_id;
  if (!loggedUserCookie) {
    return res.render("urls_notLogged.ejs", {email: undefined});
  }
  const allowedURLS = urlsForUser(loggedUserCookie, urlDatabase);
  const templateVars = {
    email: users[loggedUserCookie],
    urls: allowedURLS,
  };
  return res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const loggedUserCookie = req.session.user_id;
  if (!loggedUserCookie) {
    return res.redirect("/login");
  }
  const templateVars = {email: users[loggedUserCookie]};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const loggedUserCookie = req.session.user_id;
  const doesURLExist = urlDatabase[req.params.id];
  const checkURL = urlDatabase[req.params.id];

  if (!doesURLExist) {
    res.status(403);
    return res.send('<h1>That shortURL does not exist. Please try again with a correct shortURL.</h1>');
  }

  if (!loggedUserCookie) {
    return res.render("urls_notLogged.ejs", {email: undefined});
  }

  const templateVars = {
    email: users[loggedUserCookie],
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL };

  if (checkURL.id !== loggedUserCookie) {
    return res.send("<h1>You don't have access to this short URL</h1>");
  }
  
  return res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  let longURL = urlDatabase[req.params.id];
  if (!longURL) {
    res.status(403);
    return res.send("<h1>That id does not exist. Please try again with a correct id.</h1>");
  }
  //Need to restate longURL because if it is undefined, urlDatabase[req.params.id].longURL will throw an error
  longURL = urlDatabase[req.params.id].longURL;
  return res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  return res.send("<html><body>Hello <b>World</b></body></html>");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  const templateVars = { email: req.session.user_id};
  return res.render("urls_register", templateVars);
});

app.get("/users", (req, res) => {
  return res.json(users);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  const templateVars = { email: req.session.user_id};
  res.render("urls_login", templateVars);
});

//POST Routes
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!email) {
    res.status(403);
    return res.send("Email cannot be empty. Please try again");
  }
  if (!password) {
    res.status(403);
    return res.send("Password cannot be empty. Please try again");
  }
  if (user) {
    res.status(403);
    return res.send("User already exists. Please try again");
  }
  const newId = generateRandomString();
  users[newId] = {
    id: newId,
    email,
    password : hashedPassword
  };
  req.session.user_id = newId;
  return res.redirect("/urls");
});

app.post("/urls", (req,res) => {
  const shortendURL = generateRandomString();
  urlDatabase[shortendURL] = {
    longURL: req.body.longURL,
    shortURL: shortendURL,
    id: req.session.user_id
  };
  return res.redirect(`/urls/${shortendURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const loggedUserCookie = req.session.user_id;
  const allowedURLS = urlsForUser(loggedUserCookie, urlDatabase);
  for (const url of allowedURLS) {
    if (url.id === loggedUserCookie) {
      delete urlDatabase[req.params.id];
    }
  }
  return res.redirect(`http://localhost:8080/urls`);
});

app.post("/urls/:id", (req, res) => {
  const loggedUserCookie = req.session.user_id;
  const newLongURL = req.body.newLongURL;
  const prevShortURL = urlDatabase[loggedUserCookie].shortURL;
  urlDatabase[req.params.id] =
  {
    longURL: newLongURL,
    shortURL: prevShortURL,
    id: loggedUserCookie
  };
  return res.redirect('/urls');
});

app.post("/login", (req,res) => {
  const { email, password } = req.body;
  const userExists = getUserByEmail(email, users);
  if (!userExists) {
    res.status(403);
    return res.send("Email does not exist");
  }
  
  const passwordCorrect = isPasswordCorrect(userExists.id, password, users);
  if (!passwordCorrect) {
    res.status(403);
    return res.send("Password is incorrect");
  }
  req.session.user_id = userExists.id;
  return res.redirect('/urls');
});

app.post("/logout", (req,res) => {
  req.session = null;
  return res.redirect('/urls');
});


//Server Listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});