%% Spotify Music Analyzer & Hit Predictor  (dataset: Dataset_with_Genres.csv)
% Requires: Statistics and Machine Learning Toolbox

%% 0. SETUP
clear; clc; close all;
rng(42);                                            % reproducible
if ~isfolder('figures'), mkdir('figures'); end

feat = ["danceability","energy","loudness","speechiness", ...
        "acousticness","instrumentalness","liveness","valence","tempo"];

%% 1. LOAD + CLEAN
T = readtable('data/Dataset_with_Genres.csv');
T = removevars(T, intersect("Var1", string(T.Properties.VariableNames)));

% only drop rows missing what we actually use (other cols are mostly empty)
need = [feat, "popularity","release_date","name","artists"];
T = rmmissing(T, 'DataVariables', need);
T = T(T.tempo > 0, :);                              % tempo 0 = broken metadata
T = T(T.popularity > 0, :);                         % 0 = unrated/obscure, pure noise

% dedupe: same song re-released leaks into the test set
[~, ia] = unique(T.id, 'stable');                   T = T(ia,:);
[~, ia] = unique(T(:,["name","artists"]), 'rows', 'stable'); T = T(ia,:);

% year from release_date ("1922" or "1922-02-22")
T.year = double(extractBefore(string(T.release_date) + "-", "-"));
T = T(T.year >= 1950 & T.year <= 2021, :);

fprintf('Clean rows: %d\n', height(T));
X  = T{:, feat};
Xz = zscore(X);                                     % equal scales for k-means/PCA

%% 2. EDA
% 2a. distributions
figure; tiledlayout(3,3);
for i = 1:numel(feat), nexttile; histogram(X(:,i), 40); title(feat(i)); end
exportgraphics(gcf, 'figures/01_distributions.png');

% 2b. trends over the years (the plot the old dataset couldn't do)
G = groupsummary(T, "year", "mean", ["energy","danceability","valence","acousticness"]);
figure; plot(G.year, G.mean_energy, G.year, G.mean_danceability, ...
             G.year, G.mean_valence, G.year, G.mean_acousticness, 'LineWidth', 1.5);
legend("energy","danceability","valence","acousticness"); xlabel('year');
title('How music changed, 1950-2021');
exportgraphics(gcf, 'figures/02_trends.png');

% 2c. correlation heatmap
figure; heatmap(feat, feat, corr(X), 'Colormap', parula);
title('Feature correlation'); exportgraphics(gcf, 'figures/03_correlation.png');

% 2d. energy by genre: genre column is a LIST per artist -> take the first tag
g = extractBefore(extractAfter(string(T.consolidates_genre_lists), "'"), "'");   % first tag only
if ~isempty(g) && any(strlength(g) > 0)
    g(ismissing(g)) = "";
    [u,~,j] = unique(g);  cnt = accumarray(j,1);  cnt(u=="") = 0;
    [~,o] = maxk(cnt, 6);  m = ismember(g, u(o));
    figure; boxchart(categorical(g(m)), T.energy(m));
    title('Energy by (first) genre'); exportgraphics(gcf, 'figures/04_energy_genre.png');
end

%% 3. CLUSTERING (moods)
ks = 2:8;  sil = zeros(size(ks));
sub = randsample(height(T), 5000);                  % silhouette is O(n^2): subsample
for i = 1:numel(ks)
    c = kmeans(Xz, ks(i), 'Replicates', 3, 'MaxIter', 300);
    sil(i) = mean(silhouette(Xz(sub,:), c(sub)));
end
figure; plot(ks, sil, '-o'); xlabel('k'); ylabel('mean silhouette'); title('Choosing k');
exportgraphics(gcf, 'figures/05_silhouette.png');

[~, best] = max(sil);  K = ks(best);
cl = kmeans(Xz, K, 'Replicates', 5, 'MaxIter', 500);

prof = splitapply(@(x) mean(x,1), Xz, cl);          % what each "mood" looks like
figure; heatmap(feat, "C" + (1:K), prof, 'Colormap', parula);
title('Cluster profiles (z-scores)'); exportgraphics(gcf, 'figures/06_profiles.png');

[~, score, ~, ~, expl] = pca(Xz);
figure; gscatter(score(sub,1), score(sub,2), cl(sub));
xlabel(sprintf('PC1 (%.0f%%)', expl(1))); ylabel(sprintf('PC2 (%.0f%%)', expl(2)));
title('Clusters in PCA space'); exportgraphics(gcf, 'figures/07_pca.png');

%% 4. HIT PREDICTOR  (top 20% popularity)
isHit = T.popularity >= prctile(T.popularity, 80);
cv  = cvpartition(isHit, 'HoldOut', 0.2);           % stratified
Xtr = X(training(cv),:);  ytr = isHit(training(cv));
Xte = X(test(cv),:);      yte = isHit(test(cv));

mdl = fitcensemble(Xtr, ytr, 'Method','Bag', 'NumLearningCycles',50);  % takes a few min
[pred, sc] = predict(mdl, Xte);

% default 0.5 cutoff predicts "not hit" for everything -> use the base rate instead
thr  = mean(ytr);                         % ~0.20
pred = sc(:,2) >= thr;                    % now it actually flags hits
tp = sum(pred & yte);  prec = tp/sum(pred);  rec = tp/sum(yte);
fprintf('Precision %.2f | Recall %.2f | F1 %.2f\n', prec, rec, 2*prec*rec/(prec+rec));

acc      = mean(pred == yte);
baseline = max(mean(yte), 1-mean(yte));             % always guess "not hit"
[fpr, tpr, ~, auc] = perfcurve(yte, sc(:,2), true);
fprintf('Accuracy %.3f | baseline %.3f | AUC %.3f\n', acc, baseline, auc);

figure; plot(fpr, tpr); hold on; plot([0 1],[0 1],'--');
xlabel('FPR'); ylabel('TPR'); title(sprintf('ROC (AUC = %.2f)', auc));
exportgraphics(gcf, 'figures/08_roc.png');
figure; confusionchart(yte, pred); exportgraphics(gcf, 'figures/09_confusion.png');

%% 5. INTERPRET
imp = predictorImportance(mdl);
figure; bar(categorical(feat, feat), imp);
title('What drives popularity?'); exportgraphics(gcf, 'figures/10_importance.png');

%% 6. SIMILAR-SONG FINDER
[~, i0] = max(T.popularity);                       % most popular song in the data
disp(T.name(i0));  disp(findSimilar(T.name(i0), T, Xz));

%% 7. EXPORT FOR WEB
if ~isfolder('web/public/data'), mkdir('web/public/data'); end
[~, top] = maxk(T.popularity, 5000);                % 5k songs keeps JSON small
nn = knnsearch(Xz(top,:), Xz(top,:), 'K', 6);
out = T(top, ["name","artists","popularity","year"]);
out.cluster   = cl(top);
out.pc1       = score(top,1);
out.pc2       = score(top,2);
out.neighbors = nn(:,2:end) - 1;                    % 0-indexed for JS
fid = fopen('web/public/data/songs.json','w');   fwrite(fid, jsonencode(out)); fclose(fid);
metrics = struct('auc',auc,'accuracy',acc,'baseline',baseline, ...
                 'precision',prec,'recall',rec, ...
                 'features',feat,'importance',imp);
fid = fopen('web/public/data/metrics.json','w'); fwrite(fid, jsonencode(metrics)); fclose(fid);

%% LOCAL FUNCTIONS
function out = findSimilar(nm, T, Xz)
    i = find(strcmpi(T.name, nm), 1);
    if isempty(i), out = "Song not found"; return; end
    idx = knnsearch(Xz, Xz(i,:), 'K', 6);           % 1st hit = the song itself
    out = T(idx(2:end), ["name","artists"]);
end
