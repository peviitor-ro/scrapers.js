const counties = require("./getTownAndCounty.js").counties;
const { Scraper } = require("peviitor_jsscraper");

const findCity = (sentence) => {
  /**
   * @summary This function finds the city in a sentence
   * @param {String} sentence
   * @param {Array} exclude
   *
   * @tutorial This function is used in the following sentences:
   * - senteces: Regele Mihai a fost inmormantat la Curtea de Arges
   * - result: Curtea de Arges
   *
   * @returns {String} city
   */

  // split sentence into words
  const splitsSentence = sentence.split(" ");

  // create an array of supposed cities
  const supposedCity = [];
  // iterate over each word
  splitsSentence.forEach((word) => {
    // iterate over each county
    counties.forEach((county) => {
      // iterate over each city
      Object.values(county).forEach((value) => {
        value.forEach((city) => {
          for (let i = 0; i < splitsSentence.length; i++) {
            for (let j = i; j < splitsSentence.length; j++) {
              let newWord = splitsSentence.slice(i, j + 1).join(" ");
              if (
                city.toLowerCase() ===
                translate_city(newWord.toLowerCase()).toLowerCase()
              ) {
                if (
                  sentence.toLowerCase().indexOf(newWord.toLowerCase()) !== -1
                ) {
                  if (!supposedCity.includes(city)) {
                    supposedCity.push(city);
                  }
                }
              }
            }
          }
        });
      });
    });
  });
  // split each city in the array into an array of words
  let arrays = [...supposedCity.map((city) => city.split(" "))];
  // sort the arrays by length
  let longest = arrays.sort((a, b) => b.length - a.length)[0];
  return longest.join(" ");
};

const translate_city = (city) => {
  /**
   * @summary This function translates the city in romanian
   * @param {String} city
   *
   * @returns {String} city
   */

  // Populate this object with the cities that need translation
  const cities = {
    bucharest: "Bucuresti",
    cluj: "Cluj-Napoca",
  };

  if (cities[city.toLowerCase()]) {
    return cities[city];
  } else {
    return city;
  }
};

const replace_char = (sentence, chars = [], charToReplace = "") => {
  /**
   * @summary This function replaces the characters in a sentence
   * @param {String} sentence
   * @param {Array} chars
   * @param {String} charToReplace
   *
   * @returns {String} new sentence
   */

  let new_sentence = sentence;

  sentence.split("").forEach((char) => {
    if (chars.includes(char)) {
      new_sentence = new_sentence.replace(char, charToReplace);
    }
  });
  return new_sentence;
};

module.exports = {
  findCity,
  translate_city,
  replace_char,
};
