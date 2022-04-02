const uploadFile = async () => {
    const fileUpload = document.getElementById("fileInput").files[0];
    if (fileUpload) {
      var formData = new FormData();
      const url = `/upload`;
      const headers = {
        "Content-Type": "multipart/form-data",
        "Access-Control-Allow-Origin": "*",
      };
      formData.append("image", fileUpload);
      const response = await axios.post(url, formData, headers);
      global.window.open("https://www.youtube.com/", "_blank");
      console.log(response);
    }else{
      console.log("No file uploaded.");
    }
  };