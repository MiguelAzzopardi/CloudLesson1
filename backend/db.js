import Firestore from "@google-cloud/firestore";
import {createHmac} from "crypto"
import Redis from "redis";

export let redisClient = new Redis.createClient();

console.log("Hi!");
redisClient.on("connect", async() =>{
    console.log("Redis connected!");
    GetCreditPrices().then((data)=>{
        if(data!=undefined && data != null){
            console.log(JSON.parse(data));
        }
            
    });
});

redisClient.on("error", function(error) {
    console.error(error);
});

const GetCreditPrices = async()=>{
    return redisClient.get("credits");
}

const SetCreditPrices = async(payload)=>{
    console.log(`Setting credits to: ${JSON.stringify(payload)}`);
    return await redisClient.set("credits", JSON.stringify(payload));
}

export async function SetCreditsPrices(payload){
    await redisClient.connect();
    console.log(`Redis open: ${redisClient.isOpen}`);
    const resp = await SetCreditPrices(payload);
    console.log("2: " + resp);

    return resp;
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

export async function GetCurCredits(){
    return creditsOfCurUser;
}