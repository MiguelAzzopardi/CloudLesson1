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

import auth from "./routes/auth.js";
import upload from "./routes/upload.js";
import { start } from "repl";

//Used to quickly switch between local dev & online dev
const DEV_USINGLOCAL = false;
const PORT = DEV_USINGLOCAL ? 80 : 443;

const sm = new SecretManagerServiceClient({
  projectId: "pftc001",
  keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
});

//Reference secrets
const SECRET_PRIVATE_KEY = "projects/943607083854/secrets/PrivateKey/versions/1";

const SECRET_PUBLIC_KEY = "projects/943607083854/secrets/publickey/versions/1";

const SECRET_API = "projects/943607083854/secrets/ConvertAPI_Secret/versions/1";
export let API_KEY = "570878769";//Get from secret manager ideally

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

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
//enables http -> https redirection
if(!DEV_USINGLOCAL){
  app.enable("trust proxy");
  app.use((req, res, next) => {
    req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
  });
}
//server static files
app.use(Express.static(path.join(_dirname, "../frontend/public/")));

//allow cross-origin reqs
app.use(cors());

//route auth traffic to auth.js
app.use("/auth", auth);

//route upload traffic to upload.js
app.use("/upload", upload);

//Delivering index.html
app.get("/", (req, res)=> {
  res.sendFile(path.join(_dirname, "../frontend/index.html"));
});

startServer();
//--------------------------------
//Delivering index.html
async function loadGoogleLogin(){
  let session = document.cookie;
  if(session && session.includes("token")){
    
  }
}
