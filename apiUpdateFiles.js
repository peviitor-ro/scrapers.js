"use strict";

const axios = require("axios");

const url = "https://dev.laurentiumarian.ro/scraper/scrapers.js/";

axios.post(url, {"update": true}).then((response) => {
    if (response.data.succes) {
        console.log("Success updating files");
        console.log(response.data.succes);
    } else {
        console.log("Error updating files");
        console.log(response.data.error);
    }
}).catch((error) => {
    console.log("Error updating files");
    console.log(error);
});