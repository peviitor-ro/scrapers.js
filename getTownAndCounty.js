// Remove diacritics from a string
const removeDiacritics = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

class Counties {
  _counties = [];

  #setCounties(counties) {
    this._counties = [...this._counties, ...counties];
  }

  #getCounties() {
    return this._counties;
  }

  async getCounties(city) {
    for (const county of this.#getCounties()) {
      if (county.city.toLowerCase() === removeDiacritics(city.toLowerCase())) {
        return county;
      }
    }

    const api_endpoint = `https://api.laurentiumarian.ro/orase/?search=${removeDiacritics(
      city
    )}&page_size=50`;
    const counties_found = [];

    let response = await fetch(api_endpoint).then((response) =>
      response.json()
    );

    while (response.next) {
      counties_found.push(...response.results);
      response = await fetch(response.next).then((response) => response.json());
    }

    counties_found.push(...response.results);

    let counties = [];
    counties_found.map((c) => {
      if (c.name.toLowerCase() === removeDiacritics(city.toLowerCase())) {
        counties = [...counties, c.county];
      }
    });

    if (counties.length !== 0) {
      let cityWithountDiacritics = removeDiacritics(city);
      this.#setCounties([{ city: cityWithountDiacritics, county: counties }]);
      return { city: cityWithountDiacritics, county: counties };
    }

    return { city: null, county: null };
  }
}

module.exports = {
  Counties,
};

// (async () => {
//   const counties = new Counties();
//   let county = await counties.getCounties("Iasi");
//   console.log(county);
//   county = await counties.getCounties("Bucuresti");
//   console.log(county);
//   county = await counties.getCounties("Iași");
//   console.log(county);
// })();
