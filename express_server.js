const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "b5xVl3"
  },
  "9sm5xK": {
    longURL: "http://www.google.com", 
    userID: "b5xV244l3"
  }
}

const users = {
  "b5xVl3": {
    id: "b5xVl3",
    email: "lewis.lee@mail.utoronto.ca",
    password: "lewislee123"
  }
}

function generateRandomString () {
  return Math.random().toString(36).substr(2, 8);
}

function doesUserExist (email, usersDataBase) {
  for (const id in usersDataBase) {
    if (usersDataBase[id].email === email) {
      return usersDataBase[id];
    }
  }
  return false; 
}

function isPasswordCorrect (id, password, usersDataBase) {
  return usersDataBase[id].password === password
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    email: users[req.cookies["user_id"]],
    urls: urlDatabase, 
    id: req.cookies["user_id"]
   }
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.redirect("/login");
  }
  const templateVars = {email: users[req.cookies["user_id"]]}
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {

  const templateVars = { 
    email: users[req.cookies["user_id"]],
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

  longURL = urlDatabase[req.params.id].longURL;

  res.redirect(longURL);
})

app.get("/register", (req, res) => {
  res.render("urls_register");
})

app.get("/users", (req, res) => {
  res.json(users);
})

app.get("/login", (req, res) => {
  res.render("urls_login");
})

app.post("/register", (req, res) => {
  const { email, password } = req.body; 
  const userExists = doesUserExist(email, users); 

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
    password
  }
  res.cookie("user_id", newId); 
  res.redirect("/urls");
})

app.post("/urls", (req,res) => {
  console.log(req.body); 
  const shortendURL = generateRandomString(); 
  urlDatabase[shortendURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  }
  res.redirect(`/urls/${shortendURL}`);
})

app.post("/urls/:id", (req, res) => {
  const newLongURL = req.body.newLongURL;
  urlDatabase[req.params.id] = 
  {
    longURL: newLongURL,
    userID: req.cookies["user_id"]
  }
  res.redirect('/urls');
})

app.post("/urls/delete/:shortURL", (req, res) => {
  delete urlDatabase[req.params.shortURL]; 
  res.redirect(`http://localhost:8080/urls`);
})

app.post("/login", (req,res) => {
  const { email, password } = req.body;
  const userExists = doesUserExist(email, users); 
  
  if (!userExists) {
    res.status(403)
    return res.send("Email does not exist");
  }

  const passwordCorrect = isPasswordCorrect(userExists.id, password, users); 

  if (!passwordCorrect) {
    res.status(403)
    return res.send("Password is incorrect");
  }

  res.cookie("user_id", userExists.id); 
  res.redirect('/urls');
})

app.post("/logout", (req,res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});