// ---- Edit these three things ------------------------------------------------

// 1. Your repo (shown in the footer)
export const REPO_URL = 'https://github.com/YOUR-USERNAME/spotify-analyzer'

// 2. Names for your mood clusters, in order (cluster 1, 2, 3 ...).
//    Read figures/06_profiles.png from MATLAB, see what each cluster is
//    high/low in, and name it. Example: high energy + loudness -> "Loud and fast".
export const CLUSTER_NAMES = [
  'Mood 1', 'Mood 2', 'Mood 3', 'Mood 4',
  'Mood 5', 'Mood 6', 'Mood 7', 'Mood 8',
]

// 3. Cluster colours (8 max, matches k = 2..8 in analyzer.m)
export const CLUSTER_COLORS = [
  '#1ed760', '#509bf5', '#ff6437', '#f573a0',
  '#ffd23f', '#b49bfc', '#2dd4bf', '#e8115b',
]

// Plain-language meaning of each audio feature
export const FEATURE_INFO = {
  danceability: 'How easy it is to dance to',
  energy: 'Intensity and activity',
  loudness: 'Overall volume in decibels',
  speechiness: 'Spoken words versus singing',
  acousticness: 'Acoustic versus electronic sound',
  instrumentalness: 'How little singing there is',
  liveness: 'Sounds recorded with an audience',
  valence: 'How happy the track sounds',
  tempo: 'Speed in beats per minute',
}
