"use strict";

const {Client} = require("peviitor_jsscraper/lib");
const dotenv = require("dotenv");

dotenv.config();   

const url = "https://api.laurentiumarian.ro/scraper/scrapers.js/";

const client = new Client(process.env.EMAIL);

const data = { update: "true" };

client.post(url, data).then((response) => {
  console.log(response.data);
}
).catch((error) => {
  console.error(error);
});




