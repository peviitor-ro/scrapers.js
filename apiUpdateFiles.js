"use strict";

const axios = require("axios");

const add = "https://api.laurentiumarian.ro/scraper/add/";
const remove = "https://dev.laurentiumarian.ro/scraper/remove/";

axios.post(remove, {"repo": "based_scraper_js"})
.then(async (response) => {
    if (response.data.succes) {
        console.log("Success removing files");
        console.log(response.data.succes);
    } else {
        console.log("Error removing files");
        console.log(response.data.error);
    }
}).then(() => {
    axios.post(add, {"url": "https://github.com/peviitor-ro/based_scraper_js.git"}).then((response) => {
        if (response.data.succes) {
            console.log("Success adding files");
            console.log(response.data.succes);
        } else {
            console.log("Error adding files");
            console.log(response.data.error);
        }
    }).catch((error) => {
        console.log("Error adding files");
        console.log(error);
    });
}).catch((error) => {
    console.log("Error removing files");
    console.log(error);
});
