# Based Scraper JavaScript

![Pe Viitor logo](https://peviitor.ro/static/media/peviitor_logo.df4cd2d4b04f25a93757bb59b397e656.svg)

## Descriere

**peviitor_jsscraper** este o bibliotecă de scraping bazată pe JavaScript, care se bazează pe bibliotecile de parsing HTML, JSSoup și Axios. Acesta vă permite să extrageți datele necesare din paginile web și să le salvați într-un format ușor de utilizat, cum ar fi CSV sau JSON. Cu , **peviitor_jsscraper** puteți selecta elementele HTML specifice de pe o pagină web și puteți extrage informațiile necesare, cum ar fi textul, link-urile, imagini etc.

Caracteristicile cheie ale **peviitor_jsscraper** includ:

- Utilizează bibliotecile JavaScript populare, JSSoup și Axios, pentru a facilita scraping-ul web.
- Extrage datele necesare de pe o pagină web folosind selecții HTML/JSON specifice.
- Oferă o interfață simpla de stocare pentru datele prelucrate.
- Este ușor de utilizat și integrat în proiectele JavaScript existente.

## Instalare

Pentru a va seta mediul de lucru urmați următorii pași:

- Clonați fișierul `git clone https://github.com/peviitor-ro/based_scraper_py.git`
- Navigați la directorul **based_scraper_js**. Rulați comanda `cd based_scraper_js` pentru a naviga la acest director.
- Rulați comanda `npm i` pentru a instala dependințele.

## Exemple de utilizare

0. Pentru exemple de implementări puteți consulta [this](https://github.com/peviitor-ro/scrapers.js/blob/main/sites/syncrosoft.js), [this](https://github.com/peviitor-ro/scrapers.js/blob/main/sites/abbvie.js) or [this](https://github.com/peviitor-ro/scrapers.js/blob/main/sites/adient.js)

1. Descărcarea conținutului de la un anumit URL:

```javascript
const { Scraper } = require("peviitor_jsscraper");
const url = "https://www.example.com";
const scraper = new Scraper(url);
const type = "HTML";
const soup = await scraper.get_soup(type);
console.log(soup);
```

Aceste linii de cod creează un obiect Scraper care are ca URL https://www.example.com, și apoi descarcă codul HTML de la acel URL folosind metoda `get_soup` și returnează un obiect JSSoup care poate fi ulterior folosit pentru a căuta anumite elemente în cadrul paginii web.

Pentru a extrage toate tag-urile "a" care conțin un atribut "href" cu un anumit URL":

```javascript
const type = "HTML";
const soup = await scraper.get_soup(type);
const anchors = soup.findAll("a", {"href":'https://www.iana.org/domains/example'});
console.log(anchors);
```

Pentru a extrage primul tag "h1" de pe pagină:

```javascript
const type = "HTML";
const soup = await scraper.get_soup(type);
const heading = soup.find("h1");
```

2. Pentru a face un request POST către un API și a extrage răspunsul în format JSON:

```javascript
const url = "https://api.example.com";
const scraper = new Scraper(url);
const data = { key1: "value1", key2: "value2" };
const soup = await scraper.post(data);
```

3. Pentru a salva job-urile in baza noastră de date și pentru a putea testa codul este esențial să avem 2 funcții, `getJobs` si `getParams` care trebuiesc exportate.

```javascript
const { postApiPeViitor } = require("peviitor_jsscraper");

const getJobs = async () => {
  const job1 = {
    job_title: "Programator",
    job_link: "http://example.com/",
    country: "Romania",
    city: "Bucuresti",
  };
  const job2 = {
    job_title: "Manager",
    job_link: "http://example.com/",
    country: "Romania",
    city: "Constanta",
  };
  const jobs = [jobs1, jobs2];
  return jobs;
};

const getParams = () => {
  const company = "SyncROSoft";
  const logo =
    "https://www.sync.ro/oxygen-webhelp/template/resources/img/logo_syncrosoft.png";
  const apikey = process.env.APIKEY; // api key-urile sunt stocate in github secrets.
  const params = {
    company,
    logo,
    apikey,
  };
  return params;
};

const run = async () => {
  const jobs = await getJobs();
  const params = getParams();
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
```

## Atribute si Metode

### Name:

Returnează numele tag-ului HTML

```javascript
const type = "HTML";
const soup = await scraper.get_soup(type);
const tag = soup.find("head");
console.log(tag.name);
// 'head'
```

### Attributes:

Obiectul Attributes din **peviitor_jsscraper** este folosit pentru a reprezenta atributele unui tag HTML. Atributele pot fi accesate și modificate folosind sintaxa obiectului Attributes.

De exemplu, dacă ai un tag HTML de tipul `<a href="https://www.example.com">Example</a>`, poți accesa atributul href folosind obiectul Attributes. Astfel, poți obține valoarea cu atributul href:

```javascript
const type = "HTML";
const soup = await scraper.get_soup(type);
const tag = soup.find("a");
console.log(tag.attrs.href);
// 'https://www.example.com'
```

### Navigation

#### .previousElement, .nextElement

Metodele .previousElement() și .nextElement() sunt metode ale obiectului Element din JavaScript și sunt folosite pentru a accesa elementele înrudite cu un anumit element HTML în cadrul unui document.

Metoda .previousElement() este folosită pentru a accesa elementul anterior al unui element HTML, adică primul element anterior care este, de asemenea, un element HTML. De exemplu, în cazul următorului fragment de cod HTML:

```html
<ul>
  <li>Primul element</li>
  <li>Al doilea element</li>
  <li>Al treilea element</li>
</ul>
```

Dacă vrem să accesează elementul `<li>` care conține textul "Al doilea element", putem folosi următorul cod JavaScript:

```javascript
const type = "HTML";
const soup = await scraper.get_soup(type);
const ul = soup.nextElement;
console.log(ul.nextElement.nextElement);
// secondli.string: 'Al doilea element';
console.log(li.previousElement);
// firstli.string: 'Primul element';
```

#### .previousSibling, .nextSibling

Metodele .previousSibling și .nextSibling sunt metode ale obiectului Node din JavaScript și sunt folosite pentru a accesa nodurile înrudite cu un anumit nod HTML în cadrul unui document.

Metoda .previousSibling este folosită pentru a accesa nodul anterior al unui nod HTML, adică primul nod anterior care este, de asemenea, un nod.

Dacă vrem să accesează nodul text care se află înaintea primului element din listă, putem folosi următorul cod JavaScript:

```javascript
const type = "HTML";
const soup = await scraper.get_soup(type);
const previousNode = element.previousSibling;
console.log(previousNode);
```

În acest exemplu, element reprezintă primul element din listă, adică elementul `<li>` cu textul "Primul element". Folosind metoda .previousSibling, putem accesa nodul anterior al acestui element, adică nodul text care se află înaintea sa.

Metoda .nextSibling este folosită pentru a accesa nodul următor al unui nod HTML, adică primul nod următor care este, de asemenea, un nod.

```javascript
const type = "HTML";
const soup = await scraper.get_soup(type);
const nextNode = element.nextSibling;
console.log(nextNode);
```

În acest exemplu, nextNode reprezintă nodul următor al nodului reprezentat de variabila soup, adică primul element următor din listă. Folosind metoda .nextSibling(), putem accesa nodul următor al acestui element.
