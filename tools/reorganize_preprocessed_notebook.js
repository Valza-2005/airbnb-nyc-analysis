const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const notebookPath = path.resolve(__dirname, "..", "data", "PreProcessedData.ipynb");
const notebook = JSON.parse(fs.readFileSync(notebookPath, "utf8"));

function hashCodeCells(cells) {
  const code = cells
    .filter((cell) => cell.cell_type === "code")
    .map((cell) => Array.isArray(cell.source) ? cell.source.join("") : cell.source)
    .join("\n---CODE-CELL---\n");
  return crypto.createHash("sha256").update(code).digest("hex");
}

function md(source) {
  return {
    cell_type: "markdown",
    metadata: {},
    source: source.split("\n").map((line) => `${line}\n`),
  };
}

const originalCodeHash = hashCodeCells(notebook.cells);
const codeCells = notebook.cells.filter((cell) => cell.cell_type === "code");

if (codeCells.length !== 21) {
  throw new Error(`Expected 21 code cells, found ${codeCells.length}. Aborting to avoid changing code structure.`);
}

const organizedCells = [
  md(`# Përgatitja dhe Pastrimi i të Dhënave

**Dataset:** Airbnb New York City 2019  
**Qëllimi:** Të përgatitet dataseti për analizë duke kontrolluar strukturën, vlerat e munguara, duplikatat, outliers dhe tipet e të dhënave.

Ky notebook fokusohet vetëm në fazën e preprocessing. Analizat dhe vizualizimet kryesore gjenden në notebook-ët e analizës.`),

  md(`## Përmbajtja

1. Importimi i librarive dhe datasetit  
2. Kontrolli fillestar i të dhënave  
3. Vlerat e munguara  
4. Duplikatat  
5. Outliers në çmim  
6. Konvertimi i tipeve dhe pastrimi final  
7. Përmbledhja para/pas dhe eksportimi`),

  md(`---\n## 1. Importimi i librarive`),
  codeCells[0],

  md(`## 2. Ngarkimi i datasetit

Fillimisht lexohet dataseti origjinal dhe krijohet një kopje pune. Kjo është praktikë e mirë sepse dataseti origjinal mbetet i pandryshuar.`),
  codeCells[1],

  md(`---\n## 3. Kontrolli fillestar i të dhënave

Në këtë pjesë kontrollojmë pamjen e parë të datasetit, kolonat kryesore, tipet e të dhënave dhe statistikat bazë.`),

  md(`### 3.1 Shikimi i rreshtave të parë`),
  codeCells[2],

  md(`### 3.2 Zgjedhja e disa kolonave kryesore

Kjo tabelë e vogël ndihmon për ta parë më lehtë strukturën e datasetit.`),
  codeCells[3],

  md(`### 3.3 Informacioni strukturor

` + "`info()`" + ` tregon tipet e kolonave dhe sa vlera jo-null ka secila kolonë.`),
  codeCells[4],

  md(`### 3.4 Statistikat përshkruese

` + "`describe()`" + ` jep përmbledhje numerike për kolonat kryesore.`),
  codeCells[5],

  md(`---\n## 4. Analiza dhe trajtimi i vlerave të munguara

Vlerat e munguara mund të ndikojnë në cilësinë e analizës. Prandaj fillimisht identifikohen, pastaj trajtohen sipas rëndësisë së kolonës.`),
  codeCells[6],

  md(`### 4.1 Strategjia për vlerat e munguara

| Kolona | Strategjia | Arsyeja |
|---|---|---|
| ` + "`name`" + ` | Hiq rreshtat bosh | Janë shumë pak raste dhe nuk ndikojnë shumë në dataset |
| ` + "`host_name`" + ` | Hiq rreshtat bosh | Janë shumë pak raste |
| ` + "`reviews_per_month`" + ` | Zëvendëso me medianë ose 0 sipas qasjes në kod | Vlera mungon zakonisht kur listimi nuk ka reviews |
| ` + "`last_review`" + ` | Konverto në datë dhe krijo variabël ndihmëse | Nevojitet për analizë të aktivitetit |`),
  codeCells[7],

  md(`### 4.2 Transformimi i ` + "`last_review`" + `

Kolona ` + "`last_review`" + ` konvertohet në format date. Pastaj krijohet një kolonë e re që tregon sa ditë kanë kaluar nga review i fundit.`),
  codeCells[8],

  md(`**Shënim:** Për listimet pa review, mungesa në ` + "`last_review`" + ` nuk do të thotë domosdoshmërisht gabim. Shpesh tregon se listimi nuk ka marrë ende vlerësime. Për këtë arsye krijimi i një kolone si ` + "`days_since_last_review`" + ` e bën më të lehtë analizën e aktivitetit.`),

  md(`---\n## 5. Trajtimi i duplikatave

Duplikatat mund t'i japin peshë të dyfishtë të njëjtit listim dhe të shtrembërojnë rezultatet.`),
  codeCells[9],

  md(`---\n## 6. Identifikimi dhe trajtimi i outliers në çmim

Outliers janë vlera shumë të larta ose shumë të ulëta krahasuar me shumicën e të dhënave. Në këtë dataset, outliers në ` + "`price`" + ` janë të rëndësishëm sepse mund ta rrisin artificialisht mesataren.`),
  codeCells[10],

  md(`### 6.1 Boxplot i çmimeve

Boxplot ndihmon për t'i parë vizualisht vlerat ekstreme.`),
  codeCells[11],

  md(`### 6.2 Identifikimi me metodën IQR

Metoda IQR përdor kuartilin e parë dhe të tretë për të përcaktuar kufijtë normalë të çmimeve.`),
  codeCells[12],

  md(`### 6.3 Kontrolli i reviews për outliers

Kjo pjesë ndihmon të kuptohet nëse outliers janë listime aktive apo listime me pak/aspak aktivitet.`),
  codeCells[13],

  md(`### 6.4 Heqja e outliers

Pas analizës, outliers largohen nga dataseti i punës që analiza kryesore të mos ndikohet nga vlera shumë ekstreme.`),
  codeCells[14],

  md(`### 6.5 Përmbledhje e gjetjeve për outliers

- Disa çmime janë shumë më të larta se shumica e listimeve.
- Një pjesë e outliers mund të jenë prona luksoze ose lokacione shumë të kërkuara.
- Disa mund të jenë gabime në të dhëna ose listime jo tipike.
- Për analizë më të drejtë, është e arsyeshme të raportohet dhe të trajtohet ndikimi i tyre.`),
  codeCells[15],

  md(`---\n## 7. Konvertimi i tipeve dhe pastrimi final

Në këtë pjesë kolonat kategorike konvertohen në tipin ` + "`category`" + ` dhe hiqen listimet me çmim të pavlefshëm.`),
  codeCells[16],

  md(`### 7.1 Heqja e çmimeve zero

Çmimi ` + "`0`" + ` nuk është realist për një rezervim Airbnb, prandaj këto rreshta largohen.`),
  codeCells[17],

  md(`---\n## 8. Përmbledhja para dhe pas pastrimit

Kjo tabelë tregon ndryshimin mes datasetit origjinal dhe datasetit të pastruar.`),
  codeCells[18],

  md(`---\n## 9. Eksportimi i datasetit të pastruar

Dataseti final ruhet si CSV që të përdoret në notebook-ët e analizës dhe vizualizimit.`),
  codeCells[19],

  codeCells[20],

  md(`## Përfundim

Pas këtyre hapave, dataseti është më i pastër dhe më i përshtatshëm për analizë:

- janë kontrolluar vlerat e munguara;
- janë trajtuar duplikatat;
- janë analizuar dhe trajtuar outliers në çmim;
- janë konvertuar tipet e rëndësishme të kolonave;
- është ruajtur një version i pastruar i datasetit.`),
];

notebook.cells = organizedCells;

const newCodeHash = hashCodeCells(notebook.cells);
if (newCodeHash !== originalCodeHash) {
  throw new Error("Code cell content changed. Aborting.");
}

fs.writeFileSync(notebookPath, `${JSON.stringify(notebook, null, 2)}\n`, "utf8");
console.log("PreProcessedData.ipynb reorganized without changing code cells.");
