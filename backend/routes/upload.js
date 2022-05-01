import Express from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import ConvertAPI from 'convertapi';
import { Storage } from "@google-cloud/storage";
import * as Storage2 from "@google-cloud/storage";
import { PubSub } from "@google-cloud/pubsub";
import { validateToken } from "./auth.js";
import fs from "fs"
import Firestore from "@google-cloud/firestore";
import http from 'http';
import { GetAPISecret } from "../app.js"

export const GOOGLE_APPLICATION_CREDENTIALS = './key.json'
var convertapi;

const bucketName = "pftc001.appspot.com";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = Express.Router();

let imageUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../uploads/"));
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg" && ext !== ".doc" && ext !== ".docx") {
      return callback(new Error("Only images & docs are allowed"));
    }
    callback(null, true);
  },
  limits: {
    fileSize: 2621441,
  },
});

async function ConvertToPDF() {
  console.log("Calling API with file path: " + fileToConvertPath);
  var APISECRET = "8hfr6FeNB9QiLhvK";
  convertapi = new ConvertAPI(APISECRET);
  await convertapi.convert('pdf', { File: fileToConvertPath })
    .then(function (result) {
      // get converted file url
      console.log("Converted file url: " + result.file.url);

      // save to file
      //global.window.open(result.file.url, "_blank");
      fileToDownloadURL = result.file.url;
      //return result.file.save('/uploads');
    })
    .then(function (file) {
      console.log("File saved: " + file);
    })
    .catch(function (e) {
      console.error(e.toString());
    });
}

var fileToConvertPath = "";
var fileToDownloadURL = "";
async function downloadFile(filename) {

  const storage = new Storage.Storage({
    projectId: 'pftc001',
    keyFilename: './key.json',
  });

  const options = {
    destination: `/uploads/${filename}`
  }
  console.log(`Attempting to download file`);
  await storage.bucket(bucketName).file(`completed/${filename}`).downloadFile(options);

  console.log(`file downloaded to /upload/${filename}`);
}

var email = "";
upload.route("/").post(imageUpload.single("image"), async function (req, res) {

  const token = req.headers.cookie.split("token=")[1].split(";")[0];
  validateToken(token).then(async function (rsp) {
    email = rsp.getPayload().email;
    if (req.file) {
      //console.log(`File: ${req.file.originalname}, email: ${email}`);
      /*await UploadCloud("pending/", req.file, "").then(async ([r]) => {
        publishMessage({
          url: "https://storage.googleapis.com/pftc001.appspot.com/pending/" + req.file.originalname,
          date: new Date().toUTCString(),
          email: email,
          filename: req.file.originalname,
        });
      }).then(async function () {
        //console.log("\nFile downloaded at: " + req.file.path);

        //var resp = await uploadFile(req.file).catch(console.error);

        const resp = await ConvertToPDF();

        const downloadedFile = await DownloadFileFromURL(fileToDownloadURL, req.file.originalname);
        console.log(`Downloaded file path: ${downloadFile.path}`);

        await UploadCloud("completed/", downloadedFile, downloadedFile.path).then(async function ([r]) {
          const docToUpdate = await GetPendingDocumentReference();
          const docReff = db.collection('conversions').doc(docToUpdate);
          const res = await docReff.update({
            pending: "",
            completed: "https://storage.googleapis.com/pftc001.appspot.com/completed/" + req.file.originalname,
          });
          console.log("Updated conversion!");
        });

        //console.log(`fileToDownloadURL: ${fileToDownloadURL}, resp: ${resp}`);
        res.send({
          status: "200",
          message: "File uploaded successfully! Processing..",
          url: fileToDownloadURL
        });
        
      });*/
      awaitMessages(req, res, email);
      await UploadCloud("pending/", req.file, "").then(async ([r]) => {
        publishMessageNew({
          url: "https://storage.googleapis.com/pftc001.appspot.com/pending/" + req.file.originalname,
          date: new Date().toUTCString(),
          email: email,
          filename: req.file.originalname,
        });
      });
      
      
    }
    
  });
});

const db = new Firestore({
  projectId: 'pftc001',
  keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
});

async function GetPendingDocumentReference() {
  if (email == "") {
    return null;
  }
  const docRef = db.collection("conversions");
  const snapshot = await docRef.where("email", "==", email).get();

  var pendingDoc = "";
  var lowestDate = new Date();
  snapshot.forEach((doc) => {
    if (lowestDate == null || pendingDoc == "") {
      pendingDoc = doc.id;
      lowestDate = doc.date;
    } else {
      if (doc.date < lowestDate) {
        lowestDate = doc.date;
        pendingDoc = doc.id;
      }
    }
  });

  if (pendingDoc == "") {
    console.log("BIG ERROR - Couldn't find lowest date doc with email: " + email);
  }
  return pendingDoc;
}

var downloadedLocalPath = "";
async function DownloadFileFromURL(url, name) {
  if (name.includes(".jpg")) {
    name = name.replace('.jpg', '.pdf');
  }
  else if (name.includes(".png")) {
    name = name.replace('.png', '.pdf');
  }
  else if (name.includes(".gif")) {
    name = name.replace('.gif', '.pdf');
  }
  else if (name.includes(".jpeg")) {
    name = name.replace('.jpeg', '.pdf');
  }
  else if (name.includes(".doc")) {
    name = name.replace('.doc', '.pdf');
  } else if (name.includes(".docx")) {
    name = name.replace('.docx', '.pdf');
  }

  downloadedLocalPath = "./downloads/" + name;

  const file = fs.createWriteStream(downloadedLocalPath);
  url = url.replace('https', 'http');
  console.log("Going to download url: " + url + " and place in " + downloadedLocalPath);
  const request = await http.get(url, function (response) {
    response.pipe(file);

    // after download completed close filestream
    file.on("finish", () => {
      file.close();
      console.log("Download Completed");
    });
  });
  console.log(`Succesfully download from url and inputted into: ${file.path}`);
  return file;
}

export default upload;

//#region PubSub
//Pubsub

const pubsub = new PubSub({
  projectId: 'pftc001',
  keyFilename: './key.json'
});

const storage = new Storage({
  projectId: 'pftc001',
  keyFilename: './key.json'
});

const UploadCloud = async (folder, file, overridePath) => {

  if (overridePath == "") {
    console.log(`!!File: ${file} + file path: ${file.path}`);

    const cloudRet = await storage.bucket(bucketName).upload(file.path, {
      destination: folder + file.originalname,
    });

    fileToConvertPath = file.path;
    console.log(`${file.path} uploaded to ${bucketName}`);

    return cloudRet;
  } else {
    console.log(`!!File: ${file} + file path: ${overridePath}`);

    const cloudRet = await storage.bucket(bucketName).upload(overridePath, {
      destination: folder + file.originalname,
    });

    fileToConvertPath = overridePath;
    console.log(`${file.path} uploaded to ${bucketName}`);

    return cloudRet;
  }


};

const callbackPubSub = (error, msgId) => {
  console.log("File uploaded from cloud function, message id: " + msgId);
  if (error) {
    console.log(error);
  }
}

async function publishMessage(payload) {
  const dataBuffer = Buffer.from(JSON.stringify(payload), "utf8");

  await pubsub.topic("queue").publish(dataBuffer, {}, callbackPubSub);
}

async function publishMessageNew(payload) {
  const dataBuffer = Buffer.from(JSON.stringify(payload), "utf8");

  await pubsub.topic("queue").publish(dataBuffer).then(msgId =>{
    myMsgId = msgId;
    console.log(`Message ${msgId} published.`);
  }).catch(err => {
    console.error('ERROR:', err);
  });
}

let myMsgId = 0;
let messageCount = 0;
async function awaitMessages(req, res, email){
  const messageHandler = async message => {
    console.log(`Received message ${message.id}:`);
    console.log(`Data: ${message.data}`);
    console.log(`tAttributes: ${message.attributes}`);
    messageCount += 1;
  
    if(message.id == myMsgId){
      const resp = await ConvertToPDF();
      console.log("URL IS: ");
      const downloadedFile = await DownloadFileFromURL(fileToDownloadURL, req.file.originalname);
      console.log(`Downloaded file path: ${downloadFile.path}`);

      await UploadCloud("completed/", downloadedFile, downloadedFile.path).then(async function ([r]) {
        const docToUpdate = await GetPendingDocumentReference();
        const docReff = db.collection('conversions').doc(docToUpdate);
        const res = await docReff.update({
          pending: "",
          completed: "https://storage.googleapis.com/pftc001.appspot.com/completed/" + req.file.originalname,
        });
        console.log("Updated conversion!");
      });

      //console.log(`fileToDownloadURL: ${fileToDownloadURL}, resp: ${resp}`);
      res.send({
        status: "200",
        message: "File uploaded successfully! Processing..",
        url: fileToDownloadURL
      });
    }
    // Ack the messae
    message.ack();
  };
  
  // Listen for new messages until timeout is hit
  pubsub.subscription('queue-sub').on(`message`, messageHandler);
  setTimeout(() => {
    pubsub.subscription('queue-sub').removeListener('message', messageHandler);
    console.log(`${messageCount} message(s) received!!!!!!!!!!.`);

    

  }, 10 * 1000);
}
//#endregion

//#region Extras

//Used for debugging to see if Credentials work
async function listBuckets() {
  const storage = new Storage.Storage({
    projectId: 'pftc001',
    keyFilename: './key.json',
  });
  try {
    const results = await storage.getBuckets();

    const [buckets] = results;

    console.log('Buckets:');
    buckets.forEach(bucket => {
      console.log(bucket.name);
    });
  } catch (err) {
    console.error('ERROR:', err);
  }
}

async function testBucket(id) {
  const doc = await db.collection(collection).doc(id).get();

  if (!doc.exists) {
    throw new Error('No such document!');
  }
  return doc.data();
}

//#endregion

