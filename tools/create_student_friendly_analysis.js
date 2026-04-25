const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function markdownCell(source) {
  return {
    cell_type: "markdown",
    metadata: {},
    source: source.split("\n").map((line) => `${line}\n`),
  };
}

function codeCell(source) {
  return {
    cell_type: "code",
    execution_count: null,
    metadata: {},
    outputs: [],
    source: source.split("\n").map((line) => `${line}\n`),
  };
}

const cells = [
  markdownCell(`# Analiza e Thjeshtuar - Airbnb NYC 2019

Ky notebook është version më i thjeshtë dhe më i lehtë për t'u shpjeguar gjatë prezantimit. Analizat janë mbajtur të qarta: çmimet, zonat, tipi i dhomës, reviews, disponueshmëria dhe hostët.`),

  markdownCell(`## 1. Importimi i librarive dhe datasetit`),

  codeCell(`from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_style("whitegrid")
plt.rcParams["figure.figsize"] = (10, 5)

OUTPUT_DIR = Path("../outputs/figures/student_friendly")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv("../data/cleaned_airbnb.csv")
df.head()`),

  markdownCell(`## 2. Informata bazë për datasetin

Këtu shohim sa rreshta dhe kolona ka dataseti, cilat janë kolonat kryesore dhe disa statistika përmbledhëse.`),

  codeCell(`print("Numri i rreshtave dhe kolonave:", df.shape)
print("\\nKolonat:")
print(df.columns.tolist())`),

  codeCell(`df[[
    "price",
    "minimum_nights",
    "number_of_reviews",
    "reviews_per_month",
    "availability_365"
]].describe()`),

  markdownCell(`## 3. Analiza e çmimeve

Fillimisht shohim si shpërndahen çmimet. Kjo na ndihmon të kuptojmë nëse shumica e listimeve janë të lira, mesatare apo të shtrenjta.`),

  codeCell(`plt.hist(df["price"], bins=50, color="skyblue", edgecolor="black")
plt.title("Shpërndarja e çmimeve")
plt.xlabel("Çmimi ($)")
plt.ylabel("Numri i listimeve")
plt.savefig(OUTPUT_DIR / "01_price_distribution.png", dpi=150, bbox_inches="tight")
plt.show()`),

  markdownCell(`**Interpretim:** Shumica e listimeve kanë çmime më të ulëta ose mesatare, ndërsa një numër më i vogël listimesh ka çmime shumë të larta.`),

  markdownCell(`## 4. Outliers në çmim

Outliers janë vlera shumë më të larta ose shumë më të ulëta se shumica e të dhënave. Në këtë rast, na interesojnë sidomos listimet me çmime shumë të larta, sepse ato mund ta shtrembërojnë mesataren.`),

  codeCell(`Q1 = df["price"].quantile(0.25)
Q3 = df["price"].quantile(0.75)
IQR = Q3 - Q1

lower_limit = Q1 - 1.5 * IQR
upper_limit = Q3 + 1.5 * IQR

outliers = df[(df["price"] < lower_limit) | (df["price"] > upper_limit)]

print("Q1:", Q1)
print("Q3:", Q3)
print("IQR:", IQR)
print("Kufiri i poshtëm:", lower_limit)
print("Kufiri i sipërm:", upper_limit)
print("Numri i outliers:", len(outliers))
print("Përqindja e outliers:", round(len(outliers) / len(df) * 100, 2), "%")`),

  codeCell(`plt.boxplot(df["price"], vert=False)
plt.title("Boxplot i çmimeve - identifikimi i outliers")
plt.xlabel("Çmimi ($)")
plt.savefig(OUTPUT_DIR / "02_price_outliers_boxplot.png", dpi=150, bbox_inches="tight")
plt.show()`),

  codeCell(`outliers[[
    "name",
    "neighbourhood_group",
    "neighbourhood",
    "room_type",
    "price",
    "number_of_reviews",
    "availability_365"
]].sort_values("price", ascending=False).head(10)`),

  markdownCell(`**Interpretim:** Outliers në çmim janë listime që kanë çmim shumë më të lartë se shumica e listimeve të tjera. Këto mund të jenë prona luksoze, lokacione shumë të mira, gabime në të dhëna, ose oferta jo tipike. Për analizë më të drejtë, është mirë të raportohet se ekzistojnë dhe të vendoset nëse do të mbahen apo hiqen.`),

  markdownCell(`## 5. Çmimi sipas zonës

Krahasojmë çmimet mes zonave kryesore të New York-ut.`),

  codeCell(`price_by_area = df.groupby("neighbourhood_group")["price"].mean().sort_values(ascending=False)
price_by_area`),

  codeCell(`price_by_area.plot(kind="bar", color="coral")
plt.title("Çmimi mesatar sipas zonës")
plt.xlabel("Zona")
plt.ylabel("Çmimi mesatar ($)")
plt.xticks(rotation=45)
plt.savefig(OUTPUT_DIR / "03_average_price_by_area.png", dpi=150, bbox_inches="tight")
plt.show()`),

  markdownCell(`**Interpretim:** Manhattan zakonisht ka çmime më të larta se zonat tjera, ndërsa Bronx dhe Staten Island janë më ekonomike.`),

  markdownCell(`## 6. Çmimi sipas tipit të dhomës

Tipi i dhomës është faktor i rëndësishëm sepse një apartament i plotë pritet të kushtojë më shumë se një dhomë private.`),

  codeCell(`price_by_room = df.groupby("room_type")["price"].mean().sort_values(ascending=False)
price_by_room`),

  codeCell(`price_by_room.plot(kind="bar", color="mediumseagreen")
plt.title("Çmimi mesatar sipas tipit të dhomës")
plt.xlabel("Tipi i dhomës")
plt.ylabel("Çmimi mesatar ($)")
plt.xticks(rotation=30)
plt.savefig(OUTPUT_DIR / "04_average_price_by_room_type.png", dpi=150, bbox_inches="tight")
plt.show()`),

  markdownCell(`**Interpretim:** Entire home/apt ka çmimin më të lartë mesatar, sepse ofron më shumë privatësi dhe hapësirë.`),

  markdownCell(`## 7. Numri i listimeve sipas zonës

Kjo analizë tregon në cilat zona ka më shumë oferta Airbnb.`),

  codeCell(`listings_by_area = df["neighbourhood_group"].value_counts()
listings_by_area`),

  codeCell(`listings_by_area.plot(kind="bar", color="steelblue")
plt.title("Numri i listimeve sipas zonës")
plt.xlabel("Zona")
plt.ylabel("Numri i listimeve")
plt.xticks(rotation=45)
plt.savefig(OUTPUT_DIR / "05_listings_by_area.png", dpi=150, bbox_inches="tight")
plt.show()`),

  markdownCell(`**Interpretim:** Manhattan dhe Brooklyn kanë numrin më të madh të listimeve, që tregon se këto zona janë më aktive në tregun e Airbnb.`),

  markdownCell(`## 8. Reviews dhe aktiviteti i listimeve

Reviews mund të përdoren si tregues i aktivitetit. Më shumë reviews zakonisht nënkupton se listimi është përdorur më shpesh.`),

  codeCell(`plt.scatter(df["number_of_reviews"], df["price"], alpha=0.3)
plt.title("Çmimi dhe numri i reviews")
plt.xlabel("Numri i reviews")
plt.ylabel("Çmimi ($)")
plt.savefig(OUTPUT_DIR / "06_price_vs_reviews.png", dpi=150, bbox_inches="tight")
plt.show()`),

  markdownCell(`**Interpretim:** Nuk shihet lidhje shumë e fortë mes çmimit dhe numrit të reviews. Disa listime të lira kanë shumë reviews, ndërsa disa listime të shtrenjta kanë pak reviews.`),

  markdownCell(`## 9. Disponueshmëria gjatë vitit

Kolona \`availability_365\` tregon për sa ditë gjatë vitit një listim është i disponueshëm.`),

  codeCell(`plt.hist(df["availability_365"], bins=30, color="plum", edgecolor="black")
plt.title("Disponueshmëria gjatë vitit")
plt.xlabel("Ditë të disponueshme në vit")
plt.ylabel("Numri i listimeve")
plt.savefig(OUTPUT_DIR / "07_availability_distribution.png", dpi=150, bbox_inches="tight")
plt.show()`),

  markdownCell(`**Interpretim:** Disa listime janë të disponueshme për shumë ditë gjatë vitit, ndërsa disa të tjera kanë disponueshmëri shumë të ulët. Kjo mund të lidhet me kërkesën, rezervimet ose me faktin që hostët nuk i mbajnë listimet aktive gjatë gjithë vitit.`),

  markdownCell(`## 10. Hostët me më shumë listime

Kjo analizë tregon nëse disa hostë kanë shumë prona/listime.`),

  codeCell(`top_hosts = df["host_id"].value_counts().head(10)
top_hosts`),

  codeCell(`top_hosts.plot(kind="bar", color="orange")
plt.title("Top 10 hostët me më shumë listime")
plt.xlabel("Host ID")
plt.ylabel("Numri i listimeve")
plt.xticks(rotation=45)
plt.savefig(OUTPUT_DIR / "08_top_hosts.png", dpi=150, bbox_inches="tight")
plt.show()`),

  markdownCell(`**Interpretim:** Disa hostë kanë shumë listime, që mund të tregojë se Airbnb përdoret edhe në mënyrë më profesionale/komerciale, jo vetëm nga individë me një pronë.`),

  markdownCell(`## 11. Korrelacionet

Korrelacioni tregon nëse dy variabla kanë lidhje me njëra-tjetrën. Vlerat afër 1 ose -1 tregojnë lidhje më të fortë, ndërsa vlerat afër 0 tregojnë lidhje të dobët.`),

  codeCell(`numeric_cols = [
    "price",
    "minimum_nights",
    "number_of_reviews",
    "reviews_per_month",
    "calculated_host_listings_count",
    "availability_365"
]

corr = df[numeric_cols].corr()
corr`),

  codeCell(`sns.heatmap(corr, annot=True, cmap="coolwarm", center=0)
plt.title("Matrica e korrelacionit")
plt.savefig(OUTPUT_DIR / "09_correlation_heatmap.png", dpi=150, bbox_inches="tight")
plt.show()`),

  markdownCell(`**Interpretim:** Korrelacionet nuk janë shumë të forta, që do të thotë se çmimi nuk shpjegohet vetëm nga një faktor. Zona, tipi i dhomës dhe faktorë të tjerë duhen analizuar së bashku.`),

  markdownCell(`## 12. Përfundime

- Manhattan është zona më e shtrenjtë mesatarisht.
- Entire home/apt kushton më shumë se private room dhe shared room.
- Manhattan dhe Brooklyn kanë më shumë listime.
- Në çmime ka outliers, prandaj mesatarja duhet interpretuar me kujdes.
- Numri i reviews nuk ka lidhje shumë të fortë me çmimin.
- Disa hostë kanë shumë listime, që tregon prani të operatorëve më profesionalë.
- Për të kuptuar çmimin, duhet të shikohen disa faktorë së bashku: zona, tipi i dhomës, reviews dhe disponueshmëria.`),
];

const notebook = {
  cells,
  metadata: {
    kernelspec: {
      display_name: "Python 3",
      language: "python",
      name: "python3",
    },
    language_info: {
      name: "python",
      version: "3.10",
    },
  },
  nbformat: 4,
  nbformat_minor: 5,
};

fs.writeFileSync(
  path.join(root, "notebooks", "02_analysis_student_friendly.ipynb"),
  `${JSON.stringify(notebook, null, 2)}\n`,
  "utf8"
);

console.log("Created notebooks/02_analysis_student_friendly.ipynb");
