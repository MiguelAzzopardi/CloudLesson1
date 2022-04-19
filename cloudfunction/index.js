const Firestore = require("@google-cloud/firestore")

//entry point for application
exports.helloPubSub = (event, context)=>{
    const data = Buffer.from(event.data, "base64").toString();
    const jsonData = JSON.parse(data);
    
    AddDocument("conversions",{
        email:jsonData.email,
        filename:jsonData.filename,
        data: jsonData.date,
        pending: jsonData.url
    });
}