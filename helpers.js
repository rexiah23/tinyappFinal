const bcrypt = require('bcrypt');

const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 8);
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

module.exports = {
  generateRandomString,
  getUserByEmail,
  isPasswordCorrect,
  urlsForUser
};