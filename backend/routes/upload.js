import Express from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import ConvertAPI from 'convertapi';
import { Storage }from "@google-cloud/storage";
import * as Storage2 from "@google-cloud/storage";
import { PubSub}from "@google-cloud/pubsub";
import { validateToken } from "./auth.js";
import fs from "fs"

const convertapi = new ConvertAPI('8hfr6FeNB9QiLhvK');
const bucketName = "pftc001.appspot.com";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = Express.Router();

async function testBucket(id) {
    const doc = await db.collection(collection).doc(id).get();

    if (!doc.exists) {
        throw new Error('No such document!');
    }
    return doc.data();
}

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
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg") {
      return callback(new Error("Only images are allowed"));
    }
    callback(null, true);
  },
  limits: {
    fileSize: 2621441,
  },
});

//Used for debugging to see if Credentials work
async function listBuckets() {
  const storage = new Storage.Storage({projectId: 'pftc001',
  keyFilename: './key.json',});
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

async function convertDOCorFILEtoPDF(){
  await convertapi.convert('pdf', { File: fileToConvertPath })
  .then(function(result) {
    // get converted file url
    console.log("Converted file url: " + result.file.url);

    // save to file
    //global.window.open(result.file.url, "_blank");
    fileToDownloadURL = result.file.url;
    //return result.file.save('/uploads');
  })
  .then(function(file) {
    console.log("File saved: " + file);
  })
  .catch(function(e) {
    console.error(e.toString());
  });
}

async function uploadFile(file){
  const storage = new Storage2.Storage({projectId: 'pftc001',
    keyFilename: './key.json',});  
  const bucketName = "pftc001.appspot.com";

  console.log(`Attempting to upload file: ${file.path}, to bucket name: ${bucketName}. `);
  await storage.bucket(bucketName).upload(file.path, {
    destination: "pending/" + file.originalname,
  });

  //Create new conversion in firestore with appropriate data.
  

  fileToConvertPath = file.path;
  console.log(`${file.path} uploaded to ${bucketName}`);
}

var fileToConvertPath = "";
var fileToDownloadURL = "";
async function downloadFile(filename){
  
  const storage = new Storage.Storage({projectId: 'pftc001',
    keyFilename: './key.json',});  

  const options = {
    destination: `/uploads/${filename}`
  }
  console.log(`Attempting to download file`);
  await storage.bucket(bucketName).file(`completed/${filename}`).downloadFile(options);

  console.log(`file downloaded to /upload/${filename}`);
}

upload.route("/").post(imageUpload.single("image"), async function (req, res){
  const token = req.headers.cookie.split("token=")[1].split(";")[0];
  validateToken(token).then(async function (rsp){
    const email = rsp.getPayload().email;
    if (req.file) {
      console.log(`File: ${req.file.originalname}, email: ${email}`);
      //await listBuckets();
      UploadCloud("pending/", req.file).then(([r])=>{
          publishMessage({
            url: r.metadata.mediaLink,
            date: new Date().toUTCString(),
            email: email,
            filename: req.file.originalname,
          });
      });
      console.log("\nFile downloaded at: " + req.file.path);
  
      var resp = await uploadFile(req.file).catch(console.error);
  
      //resp = await convertDOCorFILEtoPDF();
      //console.log(`fileToDownloadURL: ${fileToDownloadURL}, resp: ${resp}`);
      res.send({
        status: "200",
        message: "File uploaded successfully! Processing..",
        url: fileToDownloadURL
      });
    }
  });
});

export default upload;

//Pubsub

const pubsub = new PubSub({
  projectId: 'pftc001',
  keyFilename: './key.json'
});

const storage = new Storage({
  projectId: 'pftc001',
  keyFilename: './key.json'
});

const UploadCloud = async (folder, file) => {
  return await storage.bucket(bucketName).upload(file.path, {
    destination: folder + file.originalname,
  });
};
const callbackPubSub = (error, msgId)=>{
  if(error){
    console.log(error);
  }
}

async function publishMessage(payload){
  var payload64 = fs.readFileSync(payload, "base64");
  const dataBuffer = Buffer.from(JSON.stringify(payload64), "utf8");

  pubsub.topic("queue-subscriber").publish(dataBuffer, {}, callbackPubSub);
}