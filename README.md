# Analiza e Tregut Airbnb në New York City 2019

## Autorët

- Valeza Dobruna
- Jon Ukmata

## Përmbledhje

Ky projekt analizon datasetin **New York City Airbnb Open Data 2019**, i cili përmban rreth 48 mijë listime të Airbnb në pesë zona kryesore të New York-ut: Manhattan, Brooklyn, Queens, Bronx dhe Staten Island. Qëllimi është të kuptohet si ndryshojnë çmimet, disponueshmëria, aktiviteti i listimeve dhe sjellja e hostëve sipas zonës, tipit të dhomës dhe faktorëve të tjerë.

Projekti përfshin importimin e të dhënave, pastrimin, analizën eksploruese, vizualizimin, interpretimin analitik, funksione të ripërdorshme dhe një pjesë bonus me modelim parashikues dhe vizualizim interaktiv.

## Struktura e projektit

```text
airbnb-nyc-analysis/
├── data/
│   ├── AB_NYC_2019.csv
│   ├── cleaned_airbnb.csv
│   └── PreProcessedData.ipynb
├── notebooks/
│   ├── 01_cleaning.ipynb
│   ├── 02_analysis.ipynb
│   ├── 02_analysis_reorganized.ipynb
│   ├── 03_visualization.ipynb
│   └── 04_ml_model.ipynb
├── outputs/
│   ├── figures/
│   ├── tables/
│   ├── interactive/
│   └── model/
├── presentation/
│   └── prezantimi_airbnb_nyc.md
├── src/
│   └── airbnb_utils.py
├── environment.yml
└── README.md
```

## Dataseti

Dataseti përmban informata për listimet Airbnb në NYC gjatë vitit 2019. Disa nga kolonat kryesore janë:

- `neighbourhood_group`: zona kryesore, p.sh. Manhattan ose Brooklyn
- `neighbourhood`: lagjja specifike
- `room_type`: tipi i dhomës
- `price`: çmimi për natë
- `minimum_nights`: minimumi i netëve
- `number_of_reviews`: numri i vlerësimeve
- `reviews_per_month`: aktiviteti mujor i reviews
- `availability_365`: ditët e disponueshme gjatë vitit
- `calculated_host_listings_count`: numri i listimeve për host

## Metodologjia

### 1. Importimi dhe përgatitja e të dhënave

Të dhënat u importuan nga CSV origjinal dhe u krijua një kopje pune në mënyrë që dataseti origjinal të ruhej i pandryshuar. U kontrolluan dimensionet, tipet e kolonave, statistikat përshkruese dhe vlerat e munguara.

### 2. Pastrimi i të dhënave

Procesi i pastrimit përfshin:

- heqjen e duplikatave
- trajtimin e vlerave të munguara
- konvertimin e `last_review` në format date
- krijimin e `days_since_last_review`
- trajtimin e outlier-ave në kolonën `price` me metodën IQR
- ruajtjen e datasetit të pastruar si `data/cleaned_airbnb.csv`

### 3. Analiza eksploruese

Analiza kryesore gjendet në `notebooks/02_analysis_reorganized.ipynb` dhe fokusohet në:

- dendësinë gjeografike të listimeve
- shpërndarjen e çmimeve
- çmimet sipas zonës dhe tipit të dhomës
- korrelacionet mes variablave numerike
- lagjet më të shtrenjta
- disponueshmërinë gjatë vitit
- aktivitetin e listimeve
- ndikimin e hostëve me shumë listime

### 4. Vizualizimi

Vizualizimet statike janë krijuar me Matplotlib dhe Seaborn, ndërsa pjesa bonus përdor Plotly dhe Folium për grafikë dhe hartë interaktive. Këto output-e ruhen në `outputs/`.

### 5. Modelimi bonus

Në `notebooks/04_ml_model.ipynb` shtohet një model regresioni për të parashikuar çmimin e listimit. Modeli përdor variabla si zona, tipi i dhomës, minimumi i netëve, numri i reviews, disponueshmëria dhe numri i listimeve të hostit. Performanca vlerësohet me MAE, RMSE dhe R2.

## Gjetjet kryesore

1. **Manhattan ka çmimet më të larta mesatare dhe mediane.** Kjo tregon se vendndodhja është një faktor shumë i rëndësishëm në çmimin e Airbnb.
2. **Brooklyn ka volum të madh listimesh dhe çmime më të balancuara.** Kjo e bën zonë konkurruese për udhëtarë që kërkojnë çmim më të arsyeshëm.
3. **Entire home/apartment zakonisht kushton më shumë se private room.** Tipi i dhomës ka ndikim të qartë në çmim.
4. **Shumë listime kanë disponueshmëri të ulët.** Kjo mund të tregojë listime shumë aktive, të rezervuara shpesh, ose listime joaktive.
5. **Hostët me shumë listime përfaqësojnë një pjesë të rëndësishme të tregut.** Kjo sugjeron se Airbnb në NYC nuk përdoret vetëm nga individë, por edhe nga operatorë më profesionalë.

## Rekomandime

- Hostët në Manhattan mund të përdorin strategji premium pricing, por duhet të justifikojnë çmimin me lokacion, cilësi dhe reviews.
- Hostët në Brooklyn dhe Queens mund të pozicionohen si alternativa më ekonomike dhe më fleksibile.
- Për analizë më të saktë të çmimeve, outlier-at duhet të trajtohen para modelimit.
- Airbnb ose analistët e tregut duhet të ndajnë listimet aktive nga ato joaktive për të shmangur interpretimet e gabuara.
- Për vendimmarrje më të mirë, analiza duhet të kombinojë çmimin me disponueshmërinë dhe aktivitetin e reviews.

## Kufizime

- Dataseti është vetëm për vitin 2019 dhe nuk përfaqëson ndryshimet pas pandemisë ose ndryshimet më të reja në treg.
- Nuk përmban të dhëna për cilësinë reale të pronës, fotografitë, rregullat e hostit apo lokacionin e saktë të atraksioneve turistike.
- `reviews_per_month` dhe `last_review` nuk janë zëvendësues perfekt për rezervimet reale.
- Çmimi mund të ndryshojë sipas sezonit, por dataseti nuk jep histori ditore të çmimeve.

## Si të ekzekutohet projekti

1. Krijo ambientin:

```bash
conda env create -f environment.yml
conda activate airbnb-project
```

2. Hap notebook-ët me Jupyter:

```bash
jupyter notebook
```

3. Rekomandohet rendi:

```text
data/PreProcessedData.ipynb
notebooks/02_analysis_reorganized.ipynb
notebooks/03_visualization.ipynb
notebooks/04_ml_model.ipynb
```

## Përfundim

Analiza tregon se tregu i Airbnb në NYC është shumë i ndikuar nga zona, tipi i dhomës dhe sjellja e hostëve. Manhattan dhe Brooklyn dominojnë në volum dhe rëndësi analitike, ndërsa tipi i dhomës është një nga faktorët më të qartë në ndryshimin e çmimit. Projekti përmbush kërkesat kryesore të analizës së të dhënave dhe shton elemente bonus përmes modelimit dhe vizualizimit interaktiv.
