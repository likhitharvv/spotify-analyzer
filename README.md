# Spotify Music Analyzer & Hit Predictor

**What makes a song popular, and can you tell from the sound alone?**

I analysed over 100,000 Spotify tracks in MATLAB, grouped them into moods, and trained a model to predict hits from audio features. Then I built a dashboard so anyone can explore the results.

**[Open the live dashboard](https://likhitharvv.github.io/spotify-analyzer/)**

---

## What I found

- **Audio alone predicts hits only weakly.** The model scored an AUC of **0.69**, where 0.50 is a coin flip and 1.00 is perfect. A song's sound matters, but artist, playlists and timing matter too.
- **Accuracy is a trap here.** 79% of songs are not hits, so a model that always says "not a hit" is already 79% accurate. Mine scored 59.5% once it started flagging hits for real, so I judged it on precision and recall instead.
- **Features move in pairs.** Energy and loudness rise together (correlation 0.77), and energy and acousticness pull apart (-0.72). That overlap is why I used PCA before clustering.
- **Songs fall into 3 moods.** k-means found them, and the silhouette score picked the number.
- **Genre labels are unreliable.** The dataset stores genres per artist, not per song, so I used them only for exploration and did not predict them.

## What's in the dashboard

| Section | What you can do |
|---|---|
| **Map** | Every dot is a song, placed by how it sounds. Click one to see its 5 nearest matches. Filter by mood. |
| **Data** | See how each audio feature is distributed, and which features move together. |
| **Trends** | Plot how features changed by release year, from 1950 to 2021. |
| **Moods** | See what makes each mood different, and how the number of moods was chosen. |
| **Genres** | Compare the biggest genres on any feature. |
| **Predictor** | See the model's score, ROC curve, confusion matrix, and how hits differ from other songs. |
| **Similar songs** | Search any song and get the 5 closest by sound. |

## How it works

1. **Clean.** The raw file has 523,475 rows. I dropped duplicates, broken tempo values, unrated songs (popularity 0) and anything outside 1950-2021. That left **100,996** songs.
2. **Explore.** Distributions, a correlation heatmap, and yearly trends.
3. **Cluster.** I standardised the 9 audio features, ran k-means for k = 2 to 8, and picked k with the silhouette score. PCA projects the moods onto the map.
4. **Predict.** A bagged-tree ensemble predicts whether a song is in the top 20% for popularity. I split train and test sets with a stratified hold-out so both keep the same share of hits.
5. **Export.** MATLAB writes everything the charts need into JSON files.
6. **Display.** A React app reads those files and draws every chart. There is no backend, so it runs as a static site on GitHub Pages.

## Model results

| Metric | Value | What it means |
|---|---|---|
| AUC | **0.688** | Better than guessing, far from perfect |
| Precision | 0.30 | Of songs flagged as hits, 30% were. Random picking gets about 21%. |
| Recall | 0.70 | The model caught 70% of the real hits |
| F1 | 0.42 | Balance of precision and recall |
| Accuracy | 0.595 | Lower than the 0.790 "always say no" baseline, which is why it is not the headline metric |

The model is tuned to catch hits, so it flags a lot of songs and is wrong about many of them. That is the honest trade-off.

## Run it yourself

**1. Analysis** (MATLAB R2026b with the Statistics and Machine Learning Toolbox)

1. Download the *Spotify Dataset With Genres* from Kaggle and save it as `data/Dataset_with_Genres.csv`.
2. Open the project folder in MATLAB and run `analyzer.m`.
3. It saves plots to `figures/` and writes the dashboard data to `web/public/data/` (`songs.json`, `metrics.json`, `analysis.json`). It takes a few minutes.

**2. Dashboard** (Node 18 or newer)

```bash
cd web
npm install
npm run dev
```

Open the local link it prints. To publish, push to `main`. The workflow in `.github/workflows/deploy.yml` builds `web/` and deploys it to GitHub Pages.

## Project structure

```
analyzer.m            the whole MATLAB pipeline
figures/              the 10 plots MATLAB saves
data/                 put the Kaggle CSV here (not committed, too large)
web/
  public/data/        JSON exported by MATLAB
  src/                React app
    components/       map, charts, sections
  scripts/            sample-data generator for trying the site without MATLAB
.github/workflows/    automatic deploy to GitHub Pages
```

## Limitations

- **Popularity favours recent songs.** Spotify's score rewards recent listening, so release year can look like a predictor of a hit. I did not use year as a model feature.
- **Genres belong to artists.** Each song inherits its artist's first genre tag, so genre charts are approximate.
- **The map shows 5,000 songs.** These are the most popular ones, which keeps the page fast.
- **Only 9 summary features.** The model does not see lyrics, artist fame or release marketing.

## Built with

MATLAB, React 18, Vite, Tailwind CSS, and hand-written SVG charts (no chart library). Deployed with GitHub Actions and GitHub Pages.

## Data and credits

Dataset: *Spotify Dataset With Genres* by Shivam Shrivastava on Kaggle, licensed CC BY-NC-SA 4.0. This project is not affiliated with or endorsed by Spotify.

Built by **Likhitha R V & Manyashree B V**.
