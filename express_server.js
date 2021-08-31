const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString () {
  return Math.random().toString(36).substr(2, 8);
}
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    username: req.cookies.username,
    urls: urlDatabase }
    console.log(templateVars.username)
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    username: req.cookies['username'],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL] }
  res.render("urls_show", templateVars);
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
})

app.post("/urls", (req,res) => {
  console.log(req.body); 
  const shortendURL = generateRandomString(); 
  urlDatabase[shortendURL] = req.body.longURL; 
  console.log(urlDatabase);
  res.redirect(`/urls/${shortendURL}`);
})

app.post("/urls/:id", (req, res) => {
  const newLongURL = req.body.newLongURL;
  urlDatabase[req.params.id] = newLongURL; 
  res.redirect('/urls');
})

app.post("/urls/9sm5xK/delete", (req, res) => {
  delete urlDatabase["9sm5xK"]; 
  res.redirect(`http://localhost:8080/urls`);
})

app.post("/login", (req,res) => {
  res.cookie('username', req.body.username); 
  res.redirect('/urls');
})

app.post("/logout", (req,res) => {
  res.clearCookie('username');
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});