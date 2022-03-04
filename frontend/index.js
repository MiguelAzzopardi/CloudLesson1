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
        console.log("Invalid credentials");
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
            console.log("Invalid credentials");
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