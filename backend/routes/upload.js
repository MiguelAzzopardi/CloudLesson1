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
import { GetAPISecret } from "../app.js";

//Initialize constants
export const GOOGLE_APPLICATION_CREDENTIALS = './key.json'
var convertapi;

const bucketName = "pftc001.appspot.com";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = Express.Router();

//Firestore instance
const db = new Firestore({
  projectId: 'pftc001',
  keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
});

//Upload image to backend ../uploads/
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

//Route for /upload
upload.route("/").post(imageUpload.single("image"), async function (req, res) {
  const token = req.headers.cookie.split("token=")[1].split(";")[0];
  validateToken(token).then(async function (rsp) {
    const email = rsp.getPayload().email;
    if (req.file) {
      receivedMyId = false;

      //Start listening for messages from cloud functions
      awaitMessages(req, res, email);

      await UploadCloud("pending/", req.file, "").then(async ([r]) => {
        publishMessage({
          url: "https://storage.googleapis.com/pftc001.appspot.com/pending/" + req.file.originalname,
          date: new Date().toUTCString(),
          email: email,
          filename: req.file.originalname,
        });
      });
    }
  });
});

var fileToConvertPath = "";
var fileToDownloadURL = "";
//Convert 'fileToConvertPath' to PDF via API
async function ConvertToPDF() {
  console.log("Calling API with file path: " + fileToConvertPath);
  var APISECRET = "8hfr6FeNB9QiLhvK";
  convertapi = new ConvertAPI(APISECRET);
  await convertapi.convert('pdf', { File: fileToConvertPath })
    .then(function (result) {
      // get converted file url
      console.log("Converted file url: " + result.file.url);

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

async function UpdateDocCompletedFromAPIToStorage(doc) {
  var ext = doc.data().filename.split('.').pop();
  const fileName = doc.data().filename.replace('.' + ext, '.pdf');

  const downloadedLocalPath = "./downloads/" + fileName;

  const file = fs.createWriteStream(downloadedLocalPath);

  var url = doc.data().completed;
  url = url.replace('https', 'http');
  console.log(`Updating doc ${doc.id} completed from ${url} to ${downloadedLocalPath}`);
  const request = await http.get(url, async function (response) {
    response.pipe(file);

    file.on("finish", async () => {
      file.close();
      console.log(`Succesfully download from url and inputted into: ${file.path}`);
      const cloudRet = await storage.bucket(bucketName).upload(downloadedLocalPath, {
        destination: "completed/" + path.basename(downloadedLocalPath),
      });
      console.log(`${file.path} uploaded to ${bucketName}`);

      const docReff = db.collection('conversions').doc(doc.id);
      const res = await docReff.update({
        //completed: "https://storage.googleapis.com/pftc001.appspot.com/completed/" + path.basename(downloadedFile.path),
        completed: "https://storage.googleapis.com/pftc001.appspot.com/completed/" + fileName,
      });
      console.log("Download Completed");
    });
  });
  //const request = await http.get(url);


  // after download completed close filestream
  console.log("File completed transfering");
}

//Gets the most recent document in firestore/conversions
async function GetPendingDocumentReference(email) {
  if (email == "") {
    return null;
  }

  //Get all documents with the same email as user
  const collectionRef = db.collection("conversions");
  const snapshot = await collectionRef.where("email", "==", email).get();

  //Temp vars to keep track of most recent document
  var pendingDocId = "";
  var tmpRecentDate = new Date();

  //Update most recent doc per document in collection snapshot with email
  snapshot.forEach((doc) => {
    if (tmpRecentDate == null || pendingDocId == "") {
      pendingDocId = doc.id;
      tmpRecentDate = doc.date;
    } else if (doc.date > tmpRecentDate) {
      tmpRecentDate = doc.date;
      pendingDocId = doc.id;
    }
  });

  if (pendingDocId == "") {
    console.log("BIG ERROR - Couldn't find lowest date doc with email: " + email);
  }

  return pendingDocId;
}

//Download file from api url
var downloadedLocalPath = "";
async function DownloadFileFromURL(url, name) {
  var ext = name.split('.').pop();
  name = name.replace('.' + ext, '.pdf');

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

//Pubsub related Items
//#region PubSub
const pubsub = new PubSub({
  projectId: 'pftc001',
  keyFilename: './key.json'
});

//Storage instance
const storage = new Storage({
  projectId: 'pftc001',
  keyFilename: './key.json'
});

//Upload to bucket
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
    console.log(`!!File: ${path.basename(overridePath)} + file path: ${overridePath}`);

    const cloudRet = await storage.bucket(bucketName).upload(overridePath, {
      destination: folder + path.basename(overridePath),
    });

    fileToConvertPath = overridePath;
    console.log(`${file.path} uploaded to ${bucketName}`);

    return cloudRet;
  }
};

//Gets called when cloud function is called and receives message
const callbackPubSub = (error, msgId) => {
  console.log("File uploaded from cloud function, message id: " + msgId);
  myMsgId = msgId;
  if (error) {
    console.log(error);
  }
}

//Publish message to cloud function
async function publishMessage(payload) {
  const dataBuffer = Buffer.from(JSON.stringify(payload), "utf8");

  await pubsub.topic("queue").publish(dataBuffer, {}, callbackPubSub);
}

//Awaits message from cloud function (used to send back to frontend when cloud function is done, to remove credits)
let myMsgId = 0;
let messageCount = 0;
let receivedMyId = false;
async function awaitMessages(req, res, email) {
  const messageHandler = async message => {
    console.log(`Received message ${message.id}:`);

    messageCount += 1;

    //If received msg id is same as the one I sent, send back to frontend
    if (message.id == myMsgId) {
      receivedMyId = true;
      try {
        res.send({
          status: "200",
          message: "File uploaded successfully! Processing..",
          url: fileToDownloadURL
        });
      } catch (error) {
        console.log("Await Messages err: " + error);
      }
    }

    // Ack the message
    message.ack();

    //Was supposedto use this to download file from api and use that in the completed link, but weird interaction where this gets called before the cloud function is actually done uploading
    /*const doc = await GetDocWithMessageID(message.id);

    const downloadedFile = await DownloadFileFromURL(doc.data().completed, doc.data().filename);

    fileToDownloadURL = "https://storage.googleapis.com/pftc001.appspot.com/completed/" + path.basename(downloadedFile.path);
    await UploadCloud("completed/", downloadedFile, downloadedFile.path).then(async function ([r]) {
      const docReff = db.collection('conversions').doc(doc.id);
      const res = await docReff.update({
        completed: fileToDownloadURL,
      });
      console.log("Updated completed file!");
    });*/

    //console.log(`fileToDownloadURL: ${fileToDownloadURL}, resp: ${resp}`);

  };
  // Listen for new messages until timeout is hit
  pubsub.subscription('queue-sub').on(`message`, messageHandler);
  setTimeout(async () => {
    pubsub.subscription('queue-sub').removeListener('message', messageHandler);
    console.log(`${messageCount} message(s) received!!!!!!!!!!.`);
  }, 5 * 1000);
}

//Returns document from firestore using messageID
async function GetDocWithMessageID(id) {
  const docRef = db.collection("conversions");
  const snapshot = await docRef.where("messageId", "==", id).get();

  var pendingDoc = null;
  snapshot.forEach((doc) => {
    pendingDoc = doc;
  });

  return pendingDoc;
}

//Gets and returns all conversions with said email
export async function GetAllConversions(email) {
  const docRef = db.collection("conversions");
  const snapshot = await docRef.where("email", "==", email).get();

  var docs = [];
  snapshot.forEach((doc) => {
    docs.push(doc.data());
    if (doc.data().completed.includes("convertapi")) {
      UpdateDocCompletedFromAPIToStorage(doc);
    }
  });

  return docs;
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

