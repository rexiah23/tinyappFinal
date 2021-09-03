const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const { generateRandomString, getUserByEmail, isPasswordCorrect, urlsForUser, formatUrl } = require('./helpers');
const app = express();
const PORT = 8080; // default port 8080

//Set View Engine
app.set('view engine', 'ejs');

//Use middleware's
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieParser());
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
    totalVisitors: 0,
    alreadyVisited: [],
    timeStamps:[]
   
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    shortURL: "9sm5xK",
    id: "b5xV244l3",
    totalVisitors: 0,
    alreadyVisited: [],
    timeStamps:[]
  
  },
  "sgq3y6": {
    longURL: "http://www.youtube.com",
    shortURL: "b2xVn2",
    id: "b5xV2dl3",
    totalVisitors: 0,
    alreadyVisited: [],
    timeStamps:[]
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
    // longURL: urlDatabase[req.params.id].longURL,
    data: urlDatabase[req.params.id]
  };

  if (checkURL.id !== loggedUserCookie) {
    return res.send("<h1>You don't have access to this short URL</h1>");
  }
  
  return res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const currUrl = urlDatabase[req.params.id];
  if (!currUrl) {
    res.status(403);
    return res.send("<h1>That short URL does not exist. Please try again with a valid short URL.</h1>");
  }

  if (!req.session.visitor_id) {
    const randomId = generateRandomString();
    req.session.visitor_id = randomId;
  }

  if (!currUrl.alreadyVisited.includes(req.session.visitor_id)) {
    const timeNow = Date.now();
    currUrl.alreadyVisited.push(req.session.visitor_id);
    currUrl.timeStamps.push(timeNow);
  }

  currUrl.totalVisitors ++;
  
  return res.redirect(currUrl.longURL);
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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
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
  const formatedLongURL = formatUrl(req.body.longURL);
  urlDatabase[shortendURL] = {
    longURL: formatedLongURL,
    shortURL: shortendURL,
    id: req.session.user_id,
    totalVisitors: 0,
    alreadyVisited: [],
    timeStamps: []
  };
  return res.redirect(`/urls/${shortendURL}`);
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
  req.session.user_id = null;
  return res.redirect('/urls');
});

//PUT Routes
app.put("/urls/:id", (req, res) => {
  const loggedUserCookie = req.session.user_id;
  const newLongURL = formatUrl(req.body.newLongURL);
  const prevShortURL = urlDatabase[req.params.id].shortURL;
  const currtotalVisitors = urlDatabase[req.params.id].totalVisitors;
  const alreadyVisited = urlDatabase[req.params.id].alreadyVisited;
  const timeStamps = urlDatabase[req.params.id].timeStamps;
  urlDatabase[req.params.id] =
  {
    longURL: newLongURL,
    shortURL: prevShortURL,
    id: loggedUserCookie,
    totalVisitors: currtotalVisitors,
    alreadyVisited,
    timeStamps
  };
  return res.redirect('/urls');
});

//DELETE Routes
app.delete("/urls/:id/delete", (req, res) => {
  const loggedUserCookie = req.session.user_id;
  const allowedURLS = urlsForUser(loggedUserCookie, urlDatabase);
  for (const url of allowedURLS) {
    if (url.id === loggedUserCookie) {
      delete urlDatabase[req.params.id];
    }
  }
  return res.redirect(`http://localhost:8080/urls`);
});


//Server Listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});