import Express from "express";
import cors from "cors";
import { v4 as uuid } from "uuid";
import session from "express-session"
import {CreateUser} from "./db.js"

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
  if (email == "test@test.com" && password == "123") {
    res.send({results: "success", email:"test@test.com", name:"Miguel"});
  } else {
    res.send("Invalid credentials!");
  }
});

app.post("/register", (req, res) => {
    const email = req.query.email;
    const password = req.query.password;
    const name = req.query.name;
    const surname = req.query.surname;

    //Save the user to the database
    CreateUser(name, surname, email, password).then((r) =>{
      console.log(r);
    });

    requests++;
    console.log(req.query);
    res.send({results: "success", email:"test@test.com", name:"Miguel"});
  });

console.log(secretToken);

app.listen(PORT, () => console.log("Server Listening on port: " + PORT));
