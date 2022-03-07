import Express from "express";
import cors from "cors";
import { v4 as uuid } from "uuid";
import session from "express-session"
import {CreateUser, GetUser, HashPassword} from "./db.js"

const config={
    genid: (req) => uuid(), 
    secret: "ketboard cat",
    cookie: {},
    resave: false,
    saveUninitialized: true,
};

const app = Express();
app.use(cors());
app.use(session(config));

const PORT = 3001;
let requests = 0;
const secretToken = uuid();

app.get("/secret", (req, res) => {
  const token = req.query.token;
  requests++;
  if (token === secretToken) {
    res.send({
      result: 200,
      requests: requests,
      message: "This is a very secret message.",
    });
  } else {
    res.send({ result: 401, message: "Invalid token!" });
  }
});

app.post("/login", (req, res) => {
  const email = req.query.email;
  const password = req.query.password;
  requests++;

  GetUser(email).then((r) =>{
    if(r.length === 1){
      if(r[0].password === HashPassword(password)){
        //Password matched
        console.log("Logged in");
        res.send({results: "success", email:email, name:r[0].name});
      }else{
        //Password did not match
        console.log("Login failed, invalid password!");
        res.send({results: "fail", reason:"invalid password"});
      }
    }else{
      console.log("Login failed, no account found!");
      res.send({results: "fail", reason:"account does not exist"});
    }
  });
});

app.post("/register", (req, res) => {
    const email = req.query.email;
    const password = req.query.password;
    const name = req.query.name;
    const surname = req.query.surname;
    requests++;

    //Step 1: Check if that email address already exits
    //Step 2: If the email is not registered in the database, we create it.
    //Step 3: If the account was created successfully, we inform the user.

    GetUser(email).then((r) =>{
      if(r.length === 0){
        //Save the user to the database
        CreateUser(name, surname, email, password).then((r) =>{
          console.log(r);
          res.send({results: "success", email:email, name:name});
        });
      }else{
        res.send({results: "fail", reason:"account already exists"});
      }
    });
    
  });

console.log(secretToken);

app.listen(PORT, () => console.log("Server Listening on port: " + PORT));
