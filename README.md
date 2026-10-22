# Spotify Music Analyzer & Hit Predictor

What makes a song popular? MATLAB cleans ~100k Spotify tracks, finds mood clusters
and trains a hit predictor. A React dashboard shows the results.

**Live demo:** https://YOUR-USERNAME.github.io/spotify-analyzer/

## What it does
1. Cleans the data (drops duplicates, broken tempo, unrated songs)
2. Explores it: distributions, correlation heatmap, trends by year
3. Groups songs into moods with k-means (k chosen by silhouette score) and plots them with PCA
4. Trains a bagged-tree model to predict the top 20% most popular songs
5. Exports results to JSON for the dashboard

## Results
| Metric | Value |
|---|---|
| AUC | _fill in from MATLAB_ |
| Precision / Recall | _fill in_ |
| Accuracy vs baseline | _fill in_ |

_Add 2-3 figures from `figures/` here and 3 honest findings. Audio features alone give a modest AUC:
popularity also depends on the artist, playlists and timing._

## Run it

**Analysis (MATLAB + Statistics and Machine Learning Toolbox)**
1. Download the Kaggle "Spotify Dataset With Genres" CSV into `data/Dataset_with_Genres.csv`
2. Run `analyzer.m`. It saves plots to `figures/` and writes the dashboard data to `web/public/data/`

**Dashboard (Node 18+)**
```bash
cd web
npm install
npm run dev
```
Rename the mood clusters in `web/src/config.js` after reading `figures/06_profiles.png`.

## Deploy
Push to `main`. In the repo go to **Settings > Pages > Source: GitHub Actions**.
The workflow in `.github/workflows/deploy.yml` builds and publishes `web/`.

## Layout
```
analyzer.m          MATLAB pipeline
figures/            plots from the analysis
data/               put the CSV here (gitignored)
web/                React + Vite + Tailwind dashboard
  public/data/      songs.json, metrics.json exported by MATLAB
```

## Limitations
- Genre tags in this dataset belong to the artist, not the song, so genre prediction was skipped.
- Popularity is time-biased: newer songs score higher.
- The dashboard shows the 5,000 most popular songs to keep the page fast.
