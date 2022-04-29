let signInButton = document.getElementById("signIn");
let signOutButton = document.getElementById("signOut");

let profile = document.getElementById("profile");
let home = document.getElementById("homeSpan");

let editPricesBtn = document.getElementById("editPrices");

let uploadDiv = document.getElementById("uploadDiv");
let paymentDiv = document.getElementById("payment_area");
let adminDiv = document.getElementById("admin_area");
//let signInContainer = document.getElementById("signInContainer");
let creditsTxt = document.getElementById("credits");

function loggedIn() {
  profile.style.display = "inline";
  creditsTxt.style.display = "inline";
  uploadDiv.style.display = "inline";
  signInButton.style.display = "none";
  paymentDiv.style.display = "none";
  adminDiv.style.display = "none";
}

function loadMainPage() {
  uploadDiv.style.display = "inline";
  paymentDiv.style.display = "none";
  adminDiv.style.display = "none";
}

function loggedOut() {
  profile.style.display = "none";
  creditsTxt.style.display = "none"
  uploadDiv.style.display = "none";
  signInButton.style.display = "inline";
  paymentDiv.style.display = "none";
  editPricesBtn.style.display = "none"
  adminDiv.style.display = "none";
}

function adminScreen() {
  profile.style.display = "inline";
  creditsTxt.style.display = "inline";
  uploadDiv.style.display = "none";
  paymentDiv.style.display = "none";
  signInButton.style.display = "none";
  adminDiv.style.display = "inline";
}

let pay1 = document.getElementById("paymentOption1");
let pay2 = document.getElementById("paymentOption2");
let pay3 = document.getElementById("paymentOption3");
async function purchaseCreditsScreen() {
  profile.style.display = "inline";
  creditsTxt.style.display = "inline";
  uploadDiv.style.display = "none";
  paymentDiv.style.display = "inline";
  signInButton.style.display = "none";
  adminDiv.style.display = "none";

  const url = `/getCredits`;
  const response = await axios.post(url);

  var prices = JSON.parse(response.data.creditPrices);
  prices = JSON.parse(prices);

  const payHTML = "<input type=\"radio\" name=\"radio\"><span class=\"checkmark\"></span>";
  pay1.innerHTML = `€${prices.option1}\t\t : 10 Credits`+payHTML;
  pay2.innerHTML = `€${prices.option2}\t\t : 20 Credits`+payHTML;
  pay3.innerHTML = `€${prices.option3}\t\t : 30 Credits`+payHTML;
}

let pay1Rad = document.getElementById("paymentOption1Rad");
let pay2Rad = document.getElementById("paymentOption2Rad");
let pay3Rad = document.getElementById("paymentOption3Rad");
const radioButtons = document.querySelectorAll('input[name="radio"]');

function SetRadCheck(i){
  switch(i){
    case 1:
      pay1Rad.checked = true;
      pay2Rad.checked = false;
      pay3Rad.checked = false;
    break;

    case 2:
      pay1Rad.checked = false;
      pay2Rad.checked = true;
      pay3Rad.checked = false;
    break;

    case 3:
      pay1Rad.checked = false;
      pay2Rad.checked = false;
      pay3Rad.checked = true;
    break;
  }
}
async function PurchaseCredits(){
  if(email == ""){
    console.log("No Email Set!");
    return;
  }
  var amountToPurchase = 0;

  for (const radioButton of radioButtons) {
    if (radioButton.checked) {
        amountToPurchase = Number(radioButton.value);
        break;
    }
  }
  console.log(`Going to purchase: ${amountToPurchase}`);

  const url = `/setUserCredits?email=${email}&amount=${amountToPurchase}`;
  const response = await axios.post(url);

  console.log("Email Set!");
  UpdateCreditAmount();

}

let creditsOption1 = document.getElementById("o1");
let creditsOption2 = document.getElementById("o2");
let creditsOption3 = document.getElementById("o3");

async function UpdateCreditOptions() {
  var o1 = creditsOption1.value;
  var o2 = creditsOption2.value;
  var o3 = creditsOption3.value;

  //const json = JSON.stringify({ option1: o1, option2: o2, option3: o3 });
  //console.log(`JSON Stringified: ${json}\nJSON Alone: { option1: o1, option2: o2, option3: o3 }`);
  const url = `/setCredits`;
  const response = await axios.post(url, {
    option1: o1,
    option2: o2,
    option3: o3
  });
  //console.log(response);
}

let credit1Label = document.getElementById("credit01");
let credit2Label = document.getElementById("credit02");
let credit3Label = document.getElementById("credit03");

var officialPricesFor10Credits = 0;
var officialPricesFor20Credits = 0;
var officialPricesFor30Credits = 0;
async function GetCreditOptions() {
  const url = `/getCredits`;
  const response = await axios.post(url);

  console.log("CREDIT PRICES: " + response.data.creditPrices);

  var prices = JSON.parse(response.data.creditPrices);
  prices = JSON.parse(prices);
  console.log("Json: " + prices);
  var o1 = prices.option1;
  var o2 = prices.option2;
  var o3 = prices.option3;

  officialPricesFor10Credits = o1;
  officialPricesFor20Credits = o2;
  officialPricesFor30Credits = o3;

  credit1Label.innerHTML = "Price of 10: " + o1;
  credit2Label.innerHTML = "Price of 20: " + o2;
  credit3Label.innerHTML = "Price of 30: " + o3;
}

async function UpdateCreditAmount(){
  const url = `/getUserCredits?email=${email}`;
  const resp = await axios.post(url);

  const curCredits = resp.data.credits;
  creditsTxt.innerHTML = "Credits: " + curCredits;
}

async function RemoveCredit(){

}

/*const authenticateReq = async (token) => {*/
var email = "";
async function authenticateReq(token) {
  console.log("Authenticating Req token");

  const url = `/auth?token=${token}`;
  const headers = {
    "Content-Type": "text/html",
    "Access-Control-Allow-Origin": "*",
  };
  const response = await axios.post(url, headers);
  const status = response.data.status;

  if (status == 200) {
    const name = response.data.name;
    email = response.data.email;
    const picture = response.data.picture;
    const expiry = response.data.expiry;

    loggedIn();

    document.getElementById("navbarDropdownMenuLink").innerHTML =
      `<img
    id="picture"
    src=""
    class="rounded-circle"
    style="margin-right: 5px"
    height="25"
    alt=""
    loading="lazy"
  />` + name;
    //home.innerHTML = `<a style="display: inline" id="home" href="/home?token=${token}">Home</a>`;

    document.getElementById("picture").src = picture;
    let date = new Date();
    date.setTime(date.getTime() + expiry);
    document.cookie = `token=${token};expires=${date.toUTCString()}`;
    console.log(`${name} signed in successfully.`);

    console.log(`Status 200`);
    return email;
  } else {
    loggedOut();
    editPricesBtn.style.display = "none";
    console.log(`Status ${status}`);
    return null;
  }

};

async function loadGoogleLogin() {
  console.log("Loading google login");

  let session = document.cookie;
  if (session && session.includes("token")) {
    email = await authenticateReq(session.split("token=")[1].split(";")[0]);
    if (email != null) {
      console.log(`Email with token is: ${email}`);

      const url = `/login?email=${email}`;
      const headers = {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*",
      };

      const response = await axios.post(url, headers);
      if (response.data.result === "success") {
        //console.log("Found email in database: " + email);
      } else {
        //console.log(`Email not found in database, account has been created for ${email}`);
      }

      console.log(`setting credits to : ${response.data.credits}`);
      UpdateCreditAmount();

      if (response.data.admin) {
        editPricesBtn.style.display = "inline";
      } else {
        editPricesBtn.style.display = "none";
      }
    }
  } else {
    loggedOut();
  }

  console.log("Token checked");

  const signOut = () => {
    let auth2 = gapi.auth2.getAuthInstance();
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    auth2
      .signOut()
      .then(() => {
        loggedOut();
        console.log("User signed out.");
      })
      .catch((error) => alert(error));
  };

  signOutButton.addEventListener("click", () => signOut());

  gapi.load("auth2", () => {
    // Retrieve the singleton for the GoogleAuth library and set up the client.
    let auth2 = gapi.auth2.init({
      client_id:
        "943607083854-u6u1k67lph43ad6u66qq0mdf4d3uingk.apps.googleusercontent.com",
      cookiepolicy: "single_host_origin",
      scope: "profile",
    });

    auth2.attachClickHandler(
      signInButton,
      {},
      async function (googleUser) {
        email = await authenticateReq(googleUser.getAuthResponse().id_token).catch();
        if (email != null) {
          console.log("Looking for email: " + email);

          const url = `/login?email=${email}`;
          const headers = {
            "Content-Type": "text/html",
            "Access-Control-Allow-Origin": "*",
          };

          const response = await axios.post(url, headers);
          if (response.data.result === "success") {
            console.log("Found email in database: " + email);
          } else {
            console.log(`Email not found in database, account has been created for ${email}`);
          }

          UpdateCreditAmount();
          
          if (response.data.admin) {
            editPricesBtn.style.display = "inline";
          } else {
            editPricesBtn.style.display = "none";
          }
        }
      },
      function (error) {
        alert(
          "Error: " + JSON.parse(JSON.stringify(error, undefined, 2)).error
        );
      }
    );
  });
}

async function DebugCreditsRuntime() {
  const url = `/credits`;
  const headers = {
    "Content-Type": "text/html",
    "Access-Control-Allow-Origin": "*",
  };

  const response = await axios.post(url, headers);
  console.log(`Runtime credits: ${response.data.credits}`);
}

function myFunction() {
  //alert("Page is loaded");
}