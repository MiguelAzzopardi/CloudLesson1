let signInButton = document.getElementById("signIn");
let signOutButton = document.getElementById("signOut");
let profile = document.getElementById("profile");
let home = document.getElementById("homeSpan");
let uploadDiv = document.getElementById("uploadDiv");
//let signInContainer = document.getElementById("signInContainer");
let creditsTxt = document.getElementById("credits");

function loggedIn(){
  profile.style.display = "inline";
  creditsTxt.style.display = "inline";
  uploadDiv.style.display = "inline";
  signInButton.style.display = "none";
}

function loggedOut(){
  profile.style.display = "none";
  creditsTxt.style.display = "none"
  uploadDiv.style.display = "none";
  signInButton.style.display = "inline";
}

/*const authenticateReq = async (token) => {*/
async function authenticateReq(token){
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
    const email = response.data.email;
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
    console.log(`Status ${status}`);
    return null;
  }
  
};

async function loadGoogleLogin() {
    console.log("Loading google login");

    let session = document.cookie;
    if (session && session.includes("token")) {
      const email = await authenticateReq(session.split("token=")[1].split(";")[0]);
      if(email != null){
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

        creditsTxt.innerHTML = "Credits: " + response.data.credits;
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
          const email = await authenticateReq(googleUser.getAuthResponse().id_token).catch();
          if(email != null){
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

            creditsTxt.innerHTML = "Credits: " + response.data.credits;
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

function DebugCreditsRuntime(){
  const url = `/credits`;
  const headers = {
    "Content-Type": "text/html",
    "Access-Control-Allow-Origin": "*",
  };

  const response = axios.post(url, headers);
  console.log(`Runtime credits: ${response.data.credits}`);
}
