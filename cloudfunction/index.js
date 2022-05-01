const Firestore = require("@google-cloud/firestore")
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const http = require('http');
const ConvertAPI = require('convertapi');

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
        completed: ""
    });

    //FileFromAPIUrl = Link to download converted file
    const FileFromAPIUrl = await ConvertToPDF(jsonData.url);

    //downloadedFile = actual file returned when downloading from previous link
    const downloadedFile = await DownloadFileFromURL(FileFromAPIUrl, jsonData.filename);

    await UploadCloud("completed/", downloadedFile).then(async function (returned) {
        const docReff = db.collection('conversions').doc(currentDocRef.id);
        const res = await docReff.update({
            completed: "https://storage.googleapis.com/pftc001.appspot.com/completed/" + path.basename(downloadedFile.path),
        });
        console.log("Updated conversion!");
    });
}

const AddDocument = async (collection, data) => {
    const docRef = db.collection(collection).doc();
    currentDocRef = docRef;

    return await docRef.set(data);
};

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

const UploadCloud = async (folder, file) => {
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

    await convertapi.convert('pdf', { File: filePath })
        .then(function (result) {
            // get converted file url
            return result.file.url;
        })
        .then(function (file) {
            console.log("File saved: " + file);
        })
        .catch(function (e) {
            console.error(e.toString());
        });
}