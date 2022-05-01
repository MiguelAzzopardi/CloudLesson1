import Express from "express";
import cors from "cors";
import { fileURLToPath} from "url";
import path, {dirname} from "path";

import https from "https";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

import auth from "./routes/auth.js";
import upload from "./routes/upload.js";
import home from "./routes/home.js";
import clean from "./routes/clean.js";

import {
  GetUser,
  CreateUser,
  GetCurCredits,
  SetCreditsPrices,
  GetCreditsPrices,
  SetCurCredits,
  GetCurUserCredits
} from "./db.js"

//Used to quickly switch between local dev & online dev
const DEV_USINGLOCAL = false;
const PORT = DEV_USINGLOCAL ? 80 : 443;

const sm = new SecretManagerServiceClient({
  projectId: "pftc001",
  keyFilename: "./key.json",
});

//Reference secrets
const SECRET_PRIVATE_KEY = "projects/943607083854/secrets/PrivateKey/versions/1";

const SECRET_PUBLIC_KEY = "projects/943607083854/secrets/publickey/versions/1";

const SECRET_API = "projects/943607083854/secrets/ConvertAPI_Secret/versions/1";
const API_KEY = "projects/943607083854/secrets/ConvertAPI_Key/versions/1";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

var api_key = "";
var api_secret = "";
//Start Server
const startServer = async () =>{
  //Load API key
  const [pdf] = await sm.accessSecretVersion({
    name: SECRET_API,
  });
  
  if(!DEV_USINGLOCAL){
    const [pub] = await sm.accessSecretVersion({
      name: SECRET_PUBLIC_KEY,
    });

    const [priv] = await sm.accessSecretVersion({
      name: SECRET_PRIVATE_KEY,
    });

    api_key = await sm.accessSecretVersion({
      name: API_KEY,
    });
    
    api_secret = await sm.accessSecretVersion({
      name: SECRET_API,
    });

    const sslOptions = {
      key : priv.payload.data.toString(),
      cert: pub.payload.data.toString()
    };

    https.createServer(sslOptions, app).listen(PORT, () =>{
      console.log("Secure Server Listening on port:" + PORT);
    });
  }else {
    app.listen(PORT, () => console.log("Server Listening on port: " + PORT));
  }
}

const app = Express();

export function GetAPISecret(){
  return api_secret;
}

//enables http -> https redirection
if(!DEV_USINGLOCAL){
  app.enable("trust proxy");
  app.use((req, res, next) => {
    req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
  });
  app.use(Express.json());
}

//server static files
app.use(Express.static(path.join(_dirname, "../frontend/public")));

//allow cross-origin reqs
app.use(cors());

//route auth traffic to auth.js
app.use("/auth", auth);

//route upload traffic to upload.js
app.use("/upload", upload);

app.use("/home", home);

app.use("/clean", clean);

//Delivering index.html
app.get("/", (req, res)=> {
  res.sendFile(path.join(_dirname, "../frontend/index.html"));
});

app.post("/login", (req, res) => {
  const email = req.query.email;
  console.log("\nBackend received email: " + email + ". \nCalling GetUser");

  GetUser(email).then((r) =>{
    //r = returned array
    if(r.length > 0){
      console.log(`Data in r:\nr[0].credits]: ${r[0].credits}`);

      res.send({ result: "success", reason: "Found email in database", credits: r[0].credits, admin: r[0].admin});
    }else{
      console.log(`Email ${email} not found, creating account in database!`);
      CreateUser(email);

      console.log(`Data in r:\nr[0].credits]: ${r[0].credits}`);

      res.send({ result: "fail", reason: "Email not found in database, account has been created!", credits: "10", admin:"false"});
    }
  });
});

app.post("/credits", (req, res) => {
  GetCurCredits().then((methodResult)=>{
    res.send({ result: "gotCredits", reason: "Credits received", credits: methodResult});
  }); 
});

app.post("/setCredits", (req, res) => {
  SetCreditsPrices(req.body).then((methodResult)=>{
    res.send({ result: "setCreditPrices", reason: "Credits set!"});
  }); 
});

app.post("/getCredits", (req, res) => {
  GetCreditsPrices().then((methodResult)=>{
    res.send({ result: "getCredits", reason: "Credits got!", creditPrices: JSON.stringify(methodResult)});
  }); 
});

app.post("/getUserCredits", (req, res) => {
  GetCurUserCredits(req.query.email).then((methodResult)=>{
    res.send({ result: "setUserCredits", reason: "Credits set!", credits: methodResult});
  }); 
});

app.post("/setUserCredits", (req, res) => {
  console.log(`Setting user credits: ${req.query.email} plus: ${req.query.amount}`);
  SetCurCredits(req.query.email, req.query.amount).then((methodResult)=>{
    res.send({ result: "setUserCredits", reason: "Credits set!"});
  }); 
});

startServer();
//--------------------------------
//Delivering index.html