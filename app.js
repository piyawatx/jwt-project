require("dotenv").config();
require("./config/database").connect();

const express = require("express");
const { validate } = require("./model/user");
const User = require("./model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/user/:email", async (req, res) => {
  try {
    const email = req.params.email;
    if (!email) {
      res.status(400).send("Input is required");
    }
    const user = await User.findOne({ email });
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
  }
});

app.put("/deposit", async (req, res) => {
  try {
    const { email, amount } = req.body;
    const user = await User.findOne({ email });
    var myquery = { email: email };

    var newvalues = {
      $set: {
        balance: Number(user.balance) + Number(amount),
      },
    };
    User.updateOne(myquery, newvalues, async (err, result) => {
      if (err) throw err;
      const user = await User.findOne({ email });
      res.send(user);
    });
  } catch (error) {
    console.log(error);
  }
});

app.put("/withdraw", async (req, res) => {
  try {
    const { email, amount } = req.body;
    const user = await User.findOne({ email });
    var myquery = { email: email };
    var newvalues = {
      $set: {
        balance: Number(user.balance) - Number(amount),
      },
    };
    User.updateOne(myquery, newvalues, async (err, result) => {
      if (err) throw err;
      const user = await User.findOne({ email });
      res.send(user);
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/transfer", async (req, res) => {
  try {
    const { user, receiver, amount } = req.body;

    const user1 = await User.findOne({ email: user });
    const user2 = await User.findOne({ email: receiver });
    const newBalance1 = Number(user1.balance) - Number(amount);
    const newBalance2 = Number(user2.balance) + Number(amount);

    var newvalue1 = {
      $set: {
        balance: newBalance1,
      },
    };
    var newvalue2 = {
      $set: {
        balance: newBalance2,
      },
    };

    var myquery1 = { email: user1.email };
    var myquery2 = { email: user2.email };

    User.updateOne(myquery1, newvalue1, async (err, result) => {
      if (err) throw err;
      // const user1 = await User.findOne({ email: user });
      // console.log(user1.email, user1.balance);
    });
    User.updateOne(myquery2, newvalue2, async (err, result) => {
      if (err) throw err;
      // const user2 = await User.findOne({ email: receiver });
      // console.log(user2.email, user2.balance);
    });

    let date = new Date().toLocaleString('en-US', { timeZone: "Asia/Bangkok" });
    let transaction = {
      user: user,
      receiver: receiver,
      amount: amount,
      balance: newBalance1,
      datetime: date,
    };
    res.send(transaction);
  } catch (error) {
    console.log(error);
  }
});

app.post("/register", async (req, res) => {
  try {
    // get input
    const { firstname, lastname, email, password, balance } = req.body;

    // validate
    if (!(email && password && firstname && lastname && balance)) {
      res.status(400).send("All input is required");
    }

    // validate if user exist in our database
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(409).send("User already exist. Please loging");
    }

    // encrypt password
    encryptedPassword = await bcrypt.hash(password, 10);

    // create user in db
    const user = await User.create({
      firstname,
      lastname,
      email: email.toLowerCase(),
      password: encryptedPassword,
      balance: 500,
    });

    // create token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    user.token = token;

    res.status(201).json(user);
  } catch (error) {
    console.log(error);
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send("All input is required");
    }

    // validate if user exist in our database
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "1h",
        }
      );
      user.token = token;
      res.status(200).json(user);
    } else {
      res.status(400).send("Invalid Credentials");
    }
    // res.status(400).send("Invalid Credentials");
  } catch (error) {
    console.log(error);
  }
});

app.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome");
});

module.exports = app;
