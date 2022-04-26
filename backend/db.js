import Firestore from "@google-cloud/firestore";
import {createHmac} from "crypto"

//Google Cloud key
export const GOOGLE_APPLICATION_CREDENTIALS = './key.json'

//Instantiating Firestore with project details
const db = new Firestore({
    projectId: 'pftc001',
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
});

var creditsOfCurUser = 0;

export function HashPassword(password){
    const secret = "hashDecodePass";
    return createHmac("sha256", password)
    .update(secret)
    .digest("hex");
}

//custom methods to upload to firestore
export async function CreateUser(email){
    //Collection (Table)
    //Document (Row)
    //docRef select the collection and corresponding document
    const docRef = db.collection("userData").doc();
    return await docRef.set({
        credits: 10,
        email: email
    });
}

export async function GetUser(email){
    const docRef = db.collection("userData");
    const snapshot = await docRef.where("email", "==", email).get();
    let data = [];
    snapshot.forEach((doc) => {
        data.push(doc.data());
    });

    if(data.length > 0){
        creditsOfCurUser = data[0].credits;
    }
    
    return data;
}

export function GetCurCredits(){
    return creditsOfCurUser;
}