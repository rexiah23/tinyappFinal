const bcrypt = require('bcrypt');

const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

const getUserByEmail = (email, usersDataBase) => {
  for (const id in usersDataBase) {
    if (usersDataBase[id].email === email) {
      return usersDataBase[id];
    }
  }
  return false;
}

const isPasswordCorrect = (id, password, usersDataBase) => {
  return bcrypt.compareSync(password, usersDataBase[id].password);
};

const urlsForUser = (id, urlDatabase) => {
  const matchingUrls = [];
  for (let url in urlDatabase) {
    const currUrl = urlDatabase[url];
    if (currUrl.id === id) {
      matchingUrls.push(currUrl);
    }
  }
  return matchingUrls;
};

const formatUrl = (url) => {
  //This function only formats for two cases: 1) If http://www. is not added at the beginning of an url 2) If extra whitespace is added to the end of the URL. 
  //Does not take into account edge cases such as partially filled format e.g. url = tp://www.facebook.com
  const http = "http://"
  if (url.includes(http)) {
    return url.trim(); 
  }
  const newUrl = http + url;
  return newUrl.trim(); 
}

module.exports = {
  generateRandomString,
  getUserByEmail,
  isPasswordCorrect,
  urlsForUser,
  formatUrl
};