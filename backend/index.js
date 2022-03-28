import Express from "express";
import cors from "cors";
import { v4 as uuid } from "uuid";
import session from "express-session"
import {
  CreateUser, 
  GetUser, 
  HashPassword,
  GOOGLE_APPLICATION_CREDENTIALS
} from "./db.js"
import { fileURLToPath} from "url";
import path, {dirname} from "path";

import https from "https";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const PORT = 443;

const startServerEncrypted = async () =>{
  const sm = new SecretManagerServiceClient({
    projectId: "pftc001",
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
  });
  const [prvt] = await sm.accessSecretVersion({
    name: "projects/943607083854/secrets/PrivateKey/versions/1",
  });
  const [pub] = await sm.accessSecretVersion({
    name: "projects/943607083854/secrets/publickey/versions/1",
  });
  
  const sslOptions = {
    key : prvt.payload.data.toString(),
    cert: pub.payload.data.toString()
  };
  console.log(sslOptions);
  
  https.createServer(sslOptions, app).listen(PORT, () =>{
    console.log("Secure Server Listening on port:" + PORT);
  });
}

const startServer = () => {
  app.listen(PORT, () => console.log("Server Listening on port: " + PORT));
}

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

//Session config
const config={
    genid: (req) => uuid(), 
    secret: "keyboard cat",
    cookie: {},
    resave: false,
    saveUninitialized: true,
};

const app = Express();
app.use(cors());
app.use(session(config));
//Delivering static path
app.use(Express.static(path.join(_dirname, "../frontend/public/")));


let requests = 0;
const secretToken = uuid();

app.get("/", (req, res)=> {
  res.sendFile(path.join(_dirname, "../frontend/index.html"));
});

app.get("/login", (req, res)=> {
  res.sendFile(path.join(_dirname, "../frontend/login.html"));
});

app.get("/register", (req, res)=> {
  res.sendFile(path.join(_dirname, "../frontend/register.html"));
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

startServerEncrypted();
