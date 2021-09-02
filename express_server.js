const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { generateRandomString, getUserByEmail, isPasswordCorrect, getUserById } = require('./helpers');
const app = express();
const PORT = 8080; // default port 8080

//Set View Engine 
app.set('view engine', 'ejs');

//Use middleware's 
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['keys1']
}))

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
}

//Database for users
const users = {
  "b5xVl3": {
    id: "b5xVl3",
    email: "lewis.lee@mail.utoronto.ca",
    password: bcrypt.hashSync("lee123", 10)
  }
}







// GET Routes
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls.users", (req, res) => {
  res.json(users);
});

app.get("/urls", (req, res) => {
  const loggedUserCookie = req.session.user_id;
  if (!loggedUserCookie) {
    return res.render("urls_notLogged.ejs", {email: undefined});
  }

  const matchingUrls = getUserById(loggedUserCookie, urlDatabase);
  const templateVars = { 
    email: users[loggedUserCookie],
    urls: matchingUrls, 
   }
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const templateVars = {email: users[req.session.user_id]}
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const doesURLExist = urlDatabase[req.params.shortURL];
  const loggedUserCookie = req.session.user_id;

  if (!doesURLExist) {
    res.status(403);
    return res.send("That shortURL does not exist. Please try again with a correct shortURL.")
  }

  if (!loggedUserCookie) {
    return res.render("urls_notLogged.ejs", {email: undefined});
  }

  const templateVars = { 
    email: users[req.session.user_id],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL }
  res.render("urls_show", templateVars);
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:id", (req, res) => {
  let longURL = urlDatabase[req.params.id];
  if (!longURL) {
    res.status(403);
    return res.send("That id does not exist. Please try again with a correct id.")
  }

  longURL = urlDatabase[req.params.id].longURL

  res.redirect(longURL);
})

app.get("/register", (req, res) => {
  const templateVars = { email: req.session.user_id}
  res.render("urls_register", templateVars);
})

app.get("/users", (req, res) => {
  res.json(users);
})

app.get("/login", (req, res) => {
  const templateVars = { email: req.session.user_id}
  res.render("urls_login", templateVars);
})








//POST Routes
app.post("/register", (req, res) => {
  const { email, password } = req.body; 
  const userExists = getUserByEmail(email, users); 
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email) {
    res.status(403)
    return res.send("Email cannot be empty. Please try again");
  }

  if (!password) {
    res.status(403)
    return res.send("Password cannot be empty. Please try again");
  }

  if (userExists) {
    res.status(403)
    return res.send("User already exists. Please try again");
  }

  const newId = generateRandomString();
  users[newId] = {
    id: newId, 
    email,
    password : hashedPassword
  }
  req.session.user_id = newId
  res.redirect("/urls");
})

app.post("/urls", (req,res) => {
  const shortendURL = generateRandomString(); 
  urlDatabase[shortendURL] = {
    longURL: req.body.longURL,
    shortURL: shortendURL,
    id: req.session.user_id
  }
  res.redirect(`/urls/${shortendURL}`);
})

app.post("/urls/:shortURL/delete", (req, res) => {
  const allowedURLS = getUserById(req.session.user_id, urlDatabase);
  for (const url of allowedURLS) {
    if (url.id === req.session.user_id) {
      delete urlDatabase[req.params.shortURL]; 
    }
  }
  res.redirect(`http://localhost:8080/urls`);
})

app.post("/urls/:id", (req, res) => {
  const newLongURL = req.body.newLongURL;
  const prevShortURL = urlDatabase[req.params.id].shortURL; 
  urlDatabase[req.params.id] = 
  {
    longURL: newLongURL,
    shortURL: prevShortURL,
    id: req.session.user_id
  }
  res.redirect('/urls');
})

app.post("/login", (req,res) => {
  const { email, password } = req.body;
  const userExists = getUserByEmail(email, users); 

  if (!userExists) {
    res.status(403)
    return res.send("Email does not exist");
  }

  const passwordCorrect = isPasswordCorrect(userExists.id, password, users); 

  if (!passwordCorrect) {
    res.status(403)
    return res.send("Password is incorrect");
  }

  req.session.user_id = userExists.id; 
  res.redirect('/urls');
})

app.post("/logout", (req,res) => {
  req.session.user_id = null;
  res.redirect('/urls');
})



//Server Listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});