document.addEventListener("submit", (e) => {
    e.preventDefault();
    submitLoginInformation();
});

async function submitLoginInformation(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const url = "http://localhost:3001/login?email="+email+"&password="+password;

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": true,
    };

    const response = await axios.post(url, {}, {headers});
    if(response.data.results ==="success"){
        console.log("Hello " + response.data.name);
    }else{
        console.log(response.data.results + ": " + response.data.reason);
    }
}

async function submitRegisterInfo(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConf = document.getElementById("passwordConf").value;
    const name = document.getElementById("name").value;
    const surname = document.getElementById("surname").value;
    
    const url = "http://localhost:3001/register?email="+email+"&password="+password + "&passwordConf="+ passwordConf +"&name="+name+"&surname="+surname;

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": true,
    };

    if(validateEmail(email) && password === passwordConf){
        const response = await axios.post(url, {}, {headers});
        if(response.data.results ==="success"){
            console.log("Hello " + response.data.name);
        }else{
            console.log(response.data.results + ": " + response.data.reason);
        }
    }else{
        console.log("Password do not match!");
    }
    
}

const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
  }

  function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      console.log('User signed out.');
    });
  }