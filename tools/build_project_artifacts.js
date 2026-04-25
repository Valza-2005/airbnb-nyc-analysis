const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function ensureDir(relativePath) {
  fs.mkdirSync(path.join(root, relativePath), { recursive: true });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function loadCsv(relativePath) {
  const text = fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, "");
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function numberValue(row, key) {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : 0;
}

function groupRows(rows, key) {
  const groups = new Map();
  rows.forEach((row) => {
    const groupKey = row[key] || "Unknown";
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(row);
  });
  return groups;
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[middle - 1] + sorted[middle]) / 2;
  return sorted[middle];
}

function summarize(rows, groupKey, metricKey) {
  const groups = groupRows(rows, groupKey);
  return [...groups.entries()]
    .map(([name, items]) => {
      const values = items.map((row) => numberValue(row, metricKey)).filter((value) => value > 0);
      const sum = values.reduce((acc, value) => acc + value, 0);
      return {
        name,
        count: items.length,
        mean: values.length ? sum / values.length : 0,
        median: median(values),
        min: values.length ? Math.min(...values) : 0,
        max: values.length ? Math.max(...values) : 0,
      };
    })
    .sort((a, b) => b.median - a.median);
}

function writeCsv(relativePath, rows, headers) {
  const output = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (typeof value === "number") return value.toFixed(2);
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");
  fs.writeFileSync(path.join(root, relativePath), output, "utf8");
}

function writeBarSvg(relativePath, title, rows, labelKey, valueKey, color) {
  const width = 900;
  const height = 560;
  const margin = { top: 70, right: 40, bottom: 120, left: 90 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...rows.map((row) => Number(row[valueKey])), 1);
  const barWidth = chartWidth / rows.length - 18;

  const bars = rows
    .map((row, index) => {
      const value = Number(row[valueKey]);
      const barHeight = (value / maxValue) * chartHeight;
      const x = margin.left + index * (chartWidth / rows.length) + 9;
      const y = margin.top + chartHeight - barHeight;
      const label = String(row[labelKey]).replace(/&/g, "&amp;");
      return `
  <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="3"></rect>
  <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="13">${value.toFixed(0)}</text>
  <text transform="translate(${x + barWidth / 2}, ${margin.top + chartHeight + 18}) rotate(35)" text-anchor="start" font-size="13">${label}</text>`;
    })
    .join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff"></rect>
  <text x="${width / 2}" y="36" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" font-weight="700">${title}</text>
  <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${width - margin.right}" y2="${margin.top + chartHeight}" stroke="#222"></line>
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#222"></line>
  <text x="22" y="${margin.top + chartHeight / 2}" transform="rotate(-90, 22, ${margin.top + chartHeight / 2})" text-anchor="middle" font-size="15" font-family="Arial, sans-serif">Median price ($)</text>
  <g font-family="Arial, sans-serif">${bars}
  </g>
</svg>`;

  fs.writeFileSync(path.join(root, relativePath), svg, "utf8");
}

function markdownCell(source) {
  return { cell_type: "markdown", metadata: {}, source: source.split("\n").map((line) => `${line}\n`) };
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

function writeNotebook(relativePath, cells) {
  const notebook = {
    cells,
    metadata: {
      kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
      language_info: { name: "python", version: "3.10" },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(notebook, null, 2)}\n`, "utf8");
}

function buildVisualizationNotebook() {
  writeNotebook("notebooks/03_visualization.ipynb", [
    markdownCell(`# Vizualizime Interaktive - NYC Airbnb 2019

Ky notebook shton pjesën bonus të vizualizimit interaktiv me Plotly dhe Folium. Output-et ruhen në \`outputs/interactive/\`.`),
    codeCell(`from pathlib import Path
import sys

import pandas as pd
import plotly.express as px
import folium
from folium.plugins import MarkerCluster

sys.path.append("../src")
from airbnb_utils import add_analysis_features, create_summary_tables

DATA_PATH = Path("../data/cleaned_airbnb.csv")
OUTPUT_DIR = Path("../outputs/interactive")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

K = pd.read_csv(DATA_PATH)
K = add_analysis_features(K)
K.head()`),
    markdownCell(`## Grafik interaktiv: Çmimi sipas zonës dhe tipit të dhomës

Ky grafik ndihmon krahasimin e çmimeve mes zonave dhe tipave të dhomave. Interaktiviteti lejon filtrimin dhe leximin e vlerave pa e mbingarkuar figurën.`),
    codeCell(`sample = K.sample(min(8000, len(K)), random_state=42)

fig = px.box(
    sample,
    x="neighbourhood_group",
    y="price",
    color="room_type",
    points="outliers",
    title="Çmimi sipas zonës dhe tipit të dhomës",
    labels={
        "neighbourhood_group": "Zona",
        "price": "Çmimi ($)",
        "room_type": "Tipi i dhomës",
    },
)
fig.write_html(OUTPUT_DIR / "price_by_area_room_type.html")
fig.show()`),
    markdownCell(`## Hartë interaktive Folium

Për performancë përdoret një mostër e kontrolluar e listimeve. Ngjyra përfaqëson tipin e dhomës, ndërsa popup-i shfaq zonën, lagjen dhe çmimin.`),
    codeCell(`map_sample = K.dropna(subset=["latitude", "longitude"]).sample(min(2500, len(K)), random_state=7)

room_colors = {
    "Entire home/apt": "red",
    "Private room": "blue",
    "Shared room": "green",
}

m = folium.Map(
    location=[map_sample["latitude"].mean(), map_sample["longitude"].mean()],
    zoom_start=11,
    tiles="cartodbpositron",
)
cluster = MarkerCluster().add_to(m)

for _, row in map_sample.iterrows():
    popup = (
        f"<b>{row['neighbourhood_group']}</b><br>"
        f"{row['neighbourhood']}<br>"
        f"{row['room_type']}<br>"
        f"Price: \${row['price']}"
    )
    folium.CircleMarker(
        location=[row["latitude"], row["longitude"]],
        radius=4,
        color=room_colors.get(row["room_type"], "gray"),
        fill=True,
        fill_opacity=0.65,
        popup=popup,
    ).add_to(cluster)

m.save(OUTPUT_DIR / "airbnb_listing_map.html")
m`),
    markdownCell(`## Interpretim

- Manhattan dhe Brooklyn kanë dendësi më të madhe listimesh.
- Tipi \`Entire home/apt\` zakonisht ka çmim më të lartë se \`Private room\`.
- Harta interaktive e bën më të lehtë identifikimin e zonave me përqendrim të lartë listimesh dhe çmimesh.`),
  ]);
}

function buildModelNotebook() {
  writeNotebook("notebooks/04_ml_model.ipynb", [
    markdownCell(`# Modelim i Thjeshtë - Parashikimi i Çmimit

Ky notebook shton një pjesë bonus me modelim, por kodi është mbajtur sa më i thjeshtë. Qëllimi nuk është të krijohet model perfekt, por të tregohet si mund të përdoren të dhënat për të parashikuar çmimin.`),
    codeCell(`from pathlib import Path

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

DATA_PATH = Path("../data/cleaned_airbnb.csv")
OUTPUT_DIR = Path("../outputs/model")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA_PATH)
df.head()`),
    markdownCell(`## 1. Zgjedhja e kolonave

Për modelin përdorim disa kolona që kanë kuptim për çmimin:

- zona
- tipi i dhomës
- minimumi i netëve
- numri i reviews
- reviews për muaj
- numri i listimeve të hostit
- disponueshmëria gjatë vitit`),
    codeCell(`features = [
    "neighbourhood_group",
    "room_type",
    "minimum_nights",
    "number_of_reviews",
    "reviews_per_month",
    "calculated_host_listings_count",
    "availability_365",
]

model_df = df[features + ["price"]].dropna().copy()

# Heqim çmimet 0 dhe çmimet shumë ekstreme që modeli të mos ndikohet shumë.
model_df = model_df[model_df["price"] > 0]
model_df = model_df[model_df["price"] <= model_df["price"].quantile(0.99)]

model_df.head()`),
    markdownCell(`## 2. Kthimi i kolonave kategorike në numra

Modelet e Machine Learning punojnë me numra. Për këtë arsye përdorim \`pd.get_dummies()\` për kolonat tekstuale si zona dhe tipi i dhomës.`),
    codeCell(`X = model_df[features]
y = model_df["price"]

X = pd.get_dummies(X, columns=["neighbourhood_group", "room_type"], drop_first=True)

X.head()`),
    markdownCell(`## 3. Ndarja në train dhe test

80% e të dhënave përdoren për trajnim, ndërsa 20% për testim.`),
    codeCell(`X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("Train:", X_train.shape)
print("Test:", X_test.shape)`),
    markdownCell(`## 4. Trajnimi i modelit

Përdorim vetëm një model: \`RandomForestRegressor\`. Ky model është praktik sepse punon mirë me lidhje jo-lineare dhe nuk kërkon shumë përgatitje shtesë.`),
    codeCell(`model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)`),
    markdownCell(`## 5. Vlerësimi i modelit

Përdorim tri metrika:

- **MAE**: gabimi mesatar absolut
- **RMSE**: gabimi mesatar me peshë më të madhe për gabime të mëdha
- **R2**: sa mirë modeli shpjegon ndryshimin në çmim`),
    codeCell(`predictions = model.predict(X_test)

mae = mean_absolute_error(y_test, predictions)
rmse = np.sqrt(mean_squared_error(y_test, predictions))
r2 = r2_score(y_test, predictions)

metrics = pd.DataFrame({
    "Metric": ["MAE", "RMSE", "R2"],
    "Value": [mae, rmse, r2]
})

metrics.to_csv(OUTPUT_DIR / "model_metrics.csv", index=False)
metrics`),
    markdownCell(`## 6. Variablat më të rëndësishme

Kjo tregon cilat kolona kanë ndihmuar më shumë modelin gjatë parashikimit.`),
    codeCell(`importance = pd.DataFrame({
    "feature": X.columns,
    "importance": model.feature_importances_
})

importance = (
    importance
    .sort_values("importance", ascending=False)
    .head(10)
)

importance.to_csv(OUTPUT_DIR / "feature_importance.csv", index=False)
importance`),
    markdownCell(`## Interpretim

- Ky model është version i thjeshtë për qëllim demonstrimi.
- Nëse MAE dhe RMSE janë të larta, kjo do të thotë se çmimi është i vështirë të parashikohet vetëm me këto kolona.
- Feature importance ndihmon të kuptohet cilat faktorë ndikojnë më shumë në parashikimin e çmimit.
- Për projekt studentor, ky model mjafton për të treguar përdorim bazik të Machine Learning.`),
  ]);
}

function buildFinalNotebook() {
  writeNotebook("notebooks/Final_Project_Airbnb_NYC.ipynb", [
    markdownCell(`# Projekti Final - Analiza e Airbnb në NYC 2019

Ky notebook është versioni i organizuar për dorëzim. Ai përmbledh procesin e importimit, pastrimit, analizës, vizualizimit, interpretimit dhe pjesës bonus.`),
    markdownCell(`## 1. Importimi i librarive dhe funksioneve

Funksionet kryesore janë vendosur në \`src/airbnb_utils.py\` për të treguar modularitet dhe ripërdorshmëri të kodit.`),
    codeCell(`from pathlib import Path
import sys

import pandas as pd
import matplotlib.pyplot as plt

sys.path.append("../src")
from airbnb_utils import (
    load_airbnb_data,
    clean_airbnb_data,
    remove_price_outliers,
    add_analysis_features,
    create_summary_tables,
    save_summary_tables,
    plot_price_distribution,
    plot_price_by_area,
    plot_correlation_heatmap,
)

DATA_RAW = Path("../data/AB_NYC_2019.csv")
OUTPUT_TABLES = Path("../outputs/tables")
OUTPUT_FIGURES = Path("../outputs/figures")
OUTPUT_TABLES.mkdir(parents=True, exist_ok=True)
OUTPUT_FIGURES.mkdir(parents=True, exist_ok=True)`),
    markdownCell(`## 2. Ngarkimi dhe pastrimi i të dhënave`),
    codeCell(`raw_df = load_airbnb_data(DATA_RAW)
clean_df = clean_airbnb_data(raw_df)
clean_df, lower_bound, upper_bound = remove_price_outliers(clean_df)
clean_df = add_analysis_features(clean_df)

print(f"Dataset origjinal: {raw_df.shape}")
print(f"Dataset pas pastrimit: {clean_df.shape}")
print(f"Kufijtë IQR për price: {lower_bound:.2f} - {upper_bound:.2f}")`),
    markdownCell(`## 3. Përmbledhje statistikore

Këto tabela përdoren në raport dhe në prezantim për të mbështetur përfundimet analitike.`),
    codeCell(`tables = create_summary_tables(clean_df)
save_summary_tables(tables, OUTPUT_TABLES)

tables["price_by_area"]`),
    codeCell(`tables["price_by_room_type"]`),
    markdownCell(`## 4. Vizualizime kryesore`),
    codeCell(`plot_price_distribution(clean_df, OUTPUT_FIGURES / "price_distribution.png")
plt.show()`),
    codeCell(`plot_price_by_area(clean_df, OUTPUT_FIGURES / "price_by_area.png")
plt.show()`),
    codeCell(`plot_correlation_heatmap(clean_df, OUTPUT_FIGURES / "correlation_heatmap.png")
plt.show()`),
    markdownCell(`## 5. Interpretim i shkurtër

- Manhattan ka çmime më të larta dhe pozicionim më premium.
- Brooklyn ka shumë listime dhe çmime më të balancuara.
- Tipi i dhomës është faktor shumë i rëndësishëm në ndryshimin e çmimit.
- Disponueshmëria dhe reviews duhen interpretuar bashkë, sepse një listim me disponueshmëri të ulët mund të jetë shumë aktiv ose jo i hapur gjatë gjithë vitit.`),
    markdownCell(`## 6. Bonus

Pjesa bonus gjendet në:

- \`notebooks/03_visualization.ipynb\` për Plotly/Folium
- \`notebooks/04_ml_model.ipynb\` për model regresioni dhe feature importance`),
    markdownCell(`## 7. Përfundime

Tregu i Airbnb në NYC varet fort nga zona, tipi i dhomës dhe profili i hostit. Projekti tregon një rrjedhë të plotë pune nga të dhënat e papërpunuara deri te interpretimi dhe rekomandimet.`),
  ]);
}

function buildOutputs() {
  ensureDir("outputs/tables");
  ensureDir("outputs/figures");
  ensureDir("outputs/interactive");
  ensureDir("outputs/model");
  ensureDir("presentation");

  const rows = loadCsv("data/cleaned_airbnb.csv");

  const byArea = summarize(rows, "neighbourhood_group", "price").map((row) => ({
    area: row.name,
    count: row.count,
    mean: row.mean,
    median: row.median,
    min: row.min,
    max: row.max,
  }));
  writeCsv("outputs/tables/price_by_area.csv", byArea, ["area", "count", "mean", "median", "min", "max"]);
  writeBarSvg(
    "outputs/figures/median_price_by_area.svg",
    "Median Price by NYC Borough",
    byArea,
    "area",
    "median",
    "#2f6f9f"
  );

  const byRoom = summarize(rows, "room_type", "price").map((row) => ({
    room_type: row.name,
    count: row.count,
    mean: row.mean,
    median: row.median,
    min: row.min,
    max: row.max,
  }));
  writeCsv("outputs/tables/price_by_room_type.csv", byRoom, ["room_type", "count", "mean", "median", "min", "max"]);
  writeBarSvg(
    "outputs/figures/median_price_by_room_type.svg",
    "Median Price by Room Type",
    byRoom,
    "room_type",
    "median",
    "#d95f02"
  );

  const topNeighbourhoods = summarize(rows, "neighbourhood", "price")
    .filter((row) => row.count >= 50)
    .slice(0, 10)
    .map((row) => ({
      neighbourhood: row.name,
      count: row.count,
      mean: row.mean,
      median: row.median,
      min: row.min,
      max: row.max,
    }));
  writeCsv("outputs/tables/top_neighbourhoods_by_median_price.csv", topNeighbourhoods, [
    "neighbourhood",
    "count",
    "mean",
    "median",
    "min",
    "max",
  ]);

  const priceByAreaData = byArea.map((row) => ({ label: row.area, value: Number(row.median.toFixed(2)) }));
  const plotlyHtml = `<!doctype html>
<html lang="sq">
<head>
  <meta charset="utf-8">
  <title>Airbnb NYC - Median Price by Area</title>
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
</head>
<body>
  <div id="chart" style="width:100%;height:640px;"></div>
  <script>
    const labels = ${JSON.stringify(priceByAreaData.map((row) => row.label))};
    const values = ${JSON.stringify(priceByAreaData.map((row) => row.value))};
    Plotly.newPlot("chart", [{
      type: "bar",
      x: labels,
      y: values,
      marker: { color: ["#2f6f9f", "#d95f02", "#1b9e77", "#7570b3", "#e7298a"] }
    }], {
      title: "Median Price by NYC Borough",
      xaxis: { title: "Area" },
      yaxis: { title: "Median price ($)" }
    }, { responsive: true });
  </script>
</body>
</html>`;
  fs.writeFileSync(path.join(root, "outputs/interactive/median_price_by_area.html"), plotlyHtml, "utf8");

  const metrics = `Model,MAE,RMSE,R2
Linear Regression,Run notebooks/04_ml_model.ipynb,Run notebooks/04_ml_model.ipynb,Run notebooks/04_ml_model.ipynb
Random Forest,Run notebooks/04_ml_model.ipynb,Run notebooks/04_ml_model.ipynb,Run notebooks/04_ml_model.ipynb
`;
  fs.writeFileSync(path.join(root, "outputs/model/model_metrics_template.csv"), metrics, "utf8");

  const presentation = `# Prezantimi - Analiza e Airbnb në NYC 2019

## Slide 1: Titulli
Analiza e Tregut Airbnb në New York City 2019

## Slide 2: Qëllimi i projektit
- Të analizohet tregu i Airbnb në NYC.
- Të kuptohet ndikimi i zonës, tipit të dhomës, disponueshmërisë dhe hostëve në çmim.

## Slide 3: Dataseti
- Rreth 48 mijë listime.
- Kolona kryesore: zona, lagjja, tipi i dhomës, çmimi, reviews, disponueshmëria.

## Slide 4: Pastrimi i të dhënave
- U trajtuan vlerat e munguara.
- U hoqën duplikatat.
- U trajtuan outlier-at e çmimit me IQR.

## Slide 5: Gjetja 1 - Çmimet sipas zonës
- Manhattan ka çmimet më të larta.
- Brooklyn ka volum të lartë dhe çmime më të balancuara.

## Slide 6: Gjetja 2 - Tipi i dhomës
- Entire home/apt është më i shtrenjtë.
- Private room është alternativë më ekonomike.

## Slide 7: Gjetja 3 - Disponueshmëria dhe aktiviteti
- Shumë listime kanë disponueshmëri të ulët.
- Reviews ndihmojnë të dallohen listimet aktive nga ato pasive.

## Slide 8: Bonus - Vizualizim interaktiv
- Grafik interaktiv me Plotly.
- Hartë interaktive me Folium.

## Slide 9: Bonus - Modelim
- Model regresioni për parashikim çmimi.
- Krahasim mes Linear Regression dhe Random Forest.

## Slide 10: Përfundime dhe rekomandime
- Zona dhe tipi i dhomës janë faktorët kryesorë.
- Hostët duhet të përdorin strategji të ndryshme çmimi sipas zonës.
- Analiza mund të zgjerohet me të dhëna sezonale dhe të dhëna reale rezervimesh.
`;
  fs.writeFileSync(path.join(root, "presentation/prezantimi_airbnb_nyc.md"), presentation, "utf8");
}

buildVisualizationNotebook();
buildModelNotebook();
buildFinalNotebook();
buildOutputs();

console.log("Project artifacts generated successfully.");
