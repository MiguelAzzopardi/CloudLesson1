const Firestore = require("@google-cloud/firestore")

const db = new Firestore({
    projectId: "pftc001",
    keyFilename: "./key.json",
});
  
const AddDocument = async (collection, data) => {
    const docRef = db.collection(collection).doc();
    return await docRef.set(data);
};

//entry point for application with url  uploaded by emal on  data
exports.helloPubSub = (event, context)=>{
    const data = Buffer.from(event.data, "base64").toString();
    const jsonData = JSON.parse(data);
    
    console.log(`File ${jsonData.filename} with url ${jsonData.url} uploaded by ${jsonData.email} on ${jsonData.date}`);
    AddDocument("conversions",{
        email:jsonData.email,
        filename:jsonData.filename,
        data: jsonData.date,
        pending: jsonData.url,
        completed: ""
    });
}