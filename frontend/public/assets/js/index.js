let signInButton = document.getElementById("signIn");
let signOutButton = document.getElementById("signOut");
let profile = document.getElementById("profile");
let signInContainer = document.getElementById("signInContainer");
let accountCreditsTxt = document.getElementById("accountTokens");

/*const authenticateReq = async (token) => {*/
async function authenticateReq(token){
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

    profile.style.display = "inline";
    signInContainer.style.display = "none";

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
    document.getElementById("picture").src = picture;
    document.cookie = `token=${token};expires=${expiry}`;
    console.log(`${name} signed in successfully.`);
    return email;
  } else {
    profile.style.display = "none";
    signInContainer.style.display = "inline";
    return null;
  }
};

async function loadGoogleLogin() {
    let session = document.cookie;
    if (session && session.includes("token")) {
      authenticateReq(session.split("token=")[1].split(";")[0]);
    } else {
      profile.style.display = "none";
      signInContainer.style.display = "inline";
    }

    const signOut = () => {
      let auth2 = gapi.auth2.getAuthInstance();
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      auth2
        .signOut()
        .then(() => {
          profile.style.display = "none";
          signInContainer.style.display = "inline";
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
            
            accountTokenTxt.innerHTML = "Credits: Still figuring it out!";
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

