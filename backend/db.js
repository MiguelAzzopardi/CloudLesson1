import Firestore from "@google-cloud/firestore";
import {createHmac} from "crypto"
import Redis from "redis";

export let redisClient = new Redis.createClient();

console.log("Hi!");
redisClient.on("connect", async() =>{
    console.log("Redis connected!");
});

redisClient.on("error", function(error) {
    console.error(error);
});

export async function SetCreditsPrices(payload){
    if(!redisClient.isOpen){
        await redisClient.connect();
    }

    return await redisClient.set("credits", JSON.stringify(payload));
}

export async function GetCreditsPrices(){
    if(!redisClient.isOpen){
        await redisClient.connect();
    }

    return await redisClient.get("credits");
}

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
        admin: false,
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

export async function GetUserDoc(email){
    const docRef = db.collection("userData");
    const snapshot = await docRef.where("email", "==", email).get();
    let data = [];
    snapshot.forEach((doc) => {
        data.push(doc);
    });
    
    return data[0];
}

export async function GetCurUserCredits(email){
    const userDoc = await GetUserDoc(email);
    
    console.log(`Doc: ${userDoc}`);
    console.log(`Got email of ${email}, credits: ${userDoc.data().credits}`);
    return userDoc.data().credits;
}

export async function SetCurCredits(email, amount){
    //Would confirm payment here
    
    //Add credits
    console.log("Getting user doc of email: " + email);
    const userDoc = await GetUserDoc(email);

    var newCredits = Number(userDoc.data().credits) + Number(amount);

    const userRef = db.collection('userData').doc(userDoc.id);
    const res = await userRef.update({
        credits: Number(newCredits),
    });
}

export async function GetCurCredits(){
    return creditsOfCurUser;
}