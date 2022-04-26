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
      const email = authenticateReq(session.split("token=")[1].split(";")[0]);
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
/*
app.post("/login", (req, res) => {
  const email = req.query.email;
  const password = req.query.password;
  requests++;

  GetUser(email).then((r) =>{
    if(r.length === 1){
      if(r[0].password === HashPassword(password)){
        //Password matched
        console.log("Logged in");
        res.send({results: "success", email:email, name:r[0].name});
      }else{
        //Password did not match
        console.log("Login failed, invalid password!");
        res.send({results: "fail", reason:"invalid password"});
      }
    }else{
      console.log("Login failed, no account found!");
      res.send({results: "fail", reason:"account does not exist"});
    }
  });
});

app.post("/register", (req, res) => {
  const email = req.query.email;
  const password = req.query.password;
  const name = req.query.name;
  const surname = req.query.surname;
  requests++;

  //Step 1: Check if that email address already exits
  //Step 2: If the email is not registered in the database, we create it.
  //Step 3: If the account was created successfully, we inform the user.

  GetUser(email).then((r) =>{
    if(r.length === 0){
      //Save the user to the database
      CreateUser(name, surname, email, password).then((r) =>{
        console.log(r);
        res.send({results: "success", email:email, name:name});
      });
    }else{
      res.send({results: "fail", reason:"account already exists"});
    }
  });
  
});
*/

