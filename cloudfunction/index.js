const Firestore = require("@google-cloud/firestore")
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const http = require('http');
const ConvertAPI = require('convertapi');
const path = require("path");
const os = require('os');
const request = require('request');
const bucketName = "pftc001.appspot.com";

const db = new Firestore({
    projectId: "pftc001",
    keyFilename: "./key.json",
});

const storage = new Storage({
    projectId: 'pftc001',
    keyFilename: './key.json'
});

var currentDocRef = null;
exports.helloPubSub = async function (event, context) {
    const data = Buffer.from(event.data, "base64").toString();
    const jsonData = JSON.parse(data);

    console.log(`File ${jsonData.filename} with url ${jsonData.url} uploaded by ${jsonData.email} on ${jsonData.date}`);

    await AddDocument("conversions", {
        email: jsonData.email,
        filename: jsonData.filename,
        date: jsonData.date,
        pending: jsonData.url,
        completed: "",
        messageId: context.eventId
    });

    //FileFromAPIUrl = Link to download converted file
    const FileFromAPIUrl = await ConvertToPDF(jsonData.url);

    //downloadedFile = actual file returned when downloading from previous link
    //const downloadedFile = await DownloadFileFromURL(FileFromAPIUrl, jsonData.filename);

    const docReff = db.collection('conversions').doc(currentDocRef.id);
    const res = await docReff.update({
        //completed: "https://storage.googleapis.com/pftc001.appspot.com/completed/" + path.basename(downloadedFile.path),
        completed: FileFromAPIUrl,
    });
    console.log("Updated conversion!");
}

const AddDocument = async (collection, data) => {
    const docRef = db.collection(collection).doc();
    currentDocRef = docRef;

    return await docRef.set(data);
};

async function DownloadFileFromURL(url, name) {
    console.log(`URLfromAPI: ${url}, filename: ${name}`);
    var ext = name.split('.').pop();
    name = name.replace('.' + ext, '.pdf');

    downloadedLocalPath = os.tmpdir() + "/" + name;

    url = url.replace('https', 'http');
    
    await new Promise(async (resolve)=>{
        console.log("IN PROMISE");
        request.get(url, async function (error, response, body) {
            console.log("Gonna cry");
            if (!error && response.statusCode == 200) {
                var data = "data:" + response.headers["content-type"] + ";base64," + Buffer.from(body).toString('base64');
                const newfile = new Buffer.from(base64Data, "base64");
                //console.log("base64: " + data);
                console.log(`created file name: ${newfile.originalname}, path: ${newfile.path}`);
                const cloudRet = await storage.bucket(bucketName).upload(os.tmpdir() + "/" + path.basename(newfile.path), {
                    destination: "completed/" + path.basename(newfile.path),
                });
                resolve();
            }else{
                console.log("ERRRORRRR: " + response.statusCode + "\nErr: " + error);
                resolve();
            }
        });
        console.log("END PROMISE??");
    });
    
    /*const file = fs.createWriteStream(downloadedLocalPath);
    url = url.replace('https', 'http');
    console.log("Going to download url: " + url + " and place in " + downloadedLocalPath);
    const request = await http.get(url);

    console.log("Promise::");
    await promisifiedWriteFile(request, file);
    console.log(`Succesfully download from url and inputted into: ${file.path}`);

    console.log("Attempting to upload to storage from file: " + file.path);
    console.log("osdir: " + os.tmpdir());
    console.log("final path: " + os.tmpdir() + "/" + path.basename(file.path));
    const cloudRet = await storage.bucket(bucketName).upload(os.tmpdir() + "/" + path.basename(file.path), {
        destination: "completed/" + path.basename(file.path),
    });

    fileToConvertPath = file.path;
    console.log(`${file.path} uploaded to ${bucketName}`);

    // after download completed close filestream
    console.log("File completed downloading");
    file.close();*/
    return "done!";
}

const promisifiedWriteFile = async function (response, file) {
    return new Promise((resolve, reject) => {
        response.pipe(file);

        file.on("finish", resolve);

    });
};

const UploadCloud = async (folder, file) => {
    console.log("Attempting to upload to storage from file: " + file.path);
    const cloudRet = await storage.bucket(bucketName).upload(file.path, {
        destination: folder + path.basename(file.path),
    });

    fileToConvertPath = file.path;
    console.log(`${file.path} uploaded to ${bucketName}`);

    return cloudRet;
}

async function ConvertToPDF(filePath) {
    console.log("Calling API with file path: " + filePath);

    var APISECRET = "8hfr6FeNB9QiLhvK";
    convertapi = new ConvertAPI(APISECRET);

    return await convertapi.convert('pdf', { File: filePath })
        .then(function (result) {
            // get converted file url
            return result.file.url;
        })
        .then(function (fileurl) {
            console.log("File converted: " + fileurl);
            return fileurl;
        })
        .catch(function (e) {
            console.error(e.toString());
        });
}