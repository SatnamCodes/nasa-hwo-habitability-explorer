# Habitability Model Notebook: Simple Explanation of All Graphs

This guide explains, in very simple terms, every important chart produced when you run the habitability machine learning training notebook. Imagine you're a curious student who wants to understand what the pictures mean and **why we trained these models the way we did**.

> All images below are saved automatically when you re-run the notebook after the latest update, into `docs/images/habitability/`.

---
## 1. Physics Feature Sample Table
![Sample Physics Features](../images/habitability/01_sample_physics_features.png)
**What you see:** A small table with columns like `equilibrium_temp_kelvin`, `in_habitable_zone`, `earth_similarity_index`, etc.

**What it means:** Each row is a planet. Each column is a measured or calculated property (a "feature"). These features come from physics: star heat, distance, size, atmosphere, and more.

**Why it matters:** The machine learning models "learn" patterns from these numbers to guess how habitable a planet might be.

---
## 2. Physics Feature Quality / Distribution Stats
![Physics Feature Stats](../images/habitability/02_physics_feature_stats.png)
**What you see:** Printed lines like "High habitability", "Planets in HZ", "Tidally locked", etc.

**What it means:** These tell us counts—how many planets are likely good, average, or poor candidates; how many are inside the star’s Goldilocks zone; how many might be stuck showing one side to their star (tidal locking).

**Why it matters:** Before trusting models, we check whether the data is balanced or very lopsided. If almost all planets were “bad,” the model might just learn to always say “bad.”

---
## 3. Random Forest: Predicted vs Actual (Regression)
![RF Regression Scatter](../images/habitability/03_rf_regression_scatter.png)
**What you see:** A scatter plot with points near a diagonal dashed line.

**Kid-friendly meaning:** Each dot is a planet. The higher a dot, the more habitable the model thinks it is. If dots sit on the line, the model’s guess matches the real score.

**Goal:** Dots close to the line = model understands the habitability score well.

**Why these parameters:**
- `n_estimators=200`: More trees = better averaging (like asking 200 classmates instead of 10).
- `max_depth=15`: Let each tree explore detailed patterns, but not endlessly.
- `class_weight='balanced'`: Makes sure the model doesn’t ignore rare “good” planets.

---
## 4. Random Forest: Residuals Plot
![RF Residuals](../images/habitability/04_rf_residuals.png)
**What you see:** Dots above and below a horizontal zero line.

**Meaning:** Residual = (real score – predicted score). If many dots are far away, the model makes big mistakes there.

**Goal:** A random cloud around zero means the model isn't biased high or low.

---
## 5. Random Forest: Feature Importance Bar Chart
![RF Feature Importance](../images/habitability/05_rf_feature_importance.png)
**What you see:** Bars showing which features influenced the model most.

**Meaning:** Taller bar = model relies on that feature more. Examples:
- `composite_habitability_score`: Combines multiple physics signals.
- `earth_similarity_index`: How Earth-like the planet is.
- `equilibrium_temp_kelvin`: Temperature matters a lot.

**Why it matters:** Helps scientists know which physics traits actually drive habitability predictions.

---
## 6. Random Forest: Confusion Matrix (Classification)
![RF Confusion Matrix](../images/habitability/06_rf_confusion_matrix.png)
**What you see:** A small 2×2 grid of numbers.

**Meaning:**
- Top-left: Correctly predicted “not habitable”.
- Bottom-right: Correctly predicted “habitable”.
- Top-right / bottom-left: Mistakes.

**Goal:** Diagonal numbers should be big, off-diagonals small.

---
## 7. ROC Curve (Random Forest vs Others)
![ROC RF vs Models](../images/habitability/07_roc_comparison_partial.png)
**What you see:** Curvy lines starting near (0,0) and bending toward (0,1).

**Meaning:** Higher curves = model is better at ranking good planets above bad ones.

**Why important:** AUC score near 1.0 = very smart at distinguishing candidates.

---
## 8. Model Comparison Bars (Random Forest vs XGBoost)
![RF vs XGB Bars](../images/habitability/08_rf_xgb_bar_compare.png)
**What you see:** Three grouped bars per model: R², F1, AUC.

**Meaning of metrics:**
- R²: How well regression model explains habitability score.
- F1: Balance between catching real habitable planets and not over-guessing.
- AUC: Ranking skill of the classifier.

**Why compare:** Lets us pick best model for each task.

---
## 9. XGBoost Predicted vs Actual (Regression)
![XGB Regression Scatter](../images/habitability/09_xgb_regression_scatter.png)
**What you see:** Similar to Random Forest scatter.

**Why XGBoost sometimes better:** It builds trees one after another, fixing mistakes step-by-step (boosting).

**Why these parameters:**
- `n_estimators=500`: Many small learning steps.
- `learning_rate=0.05`: Small steps prevent over-jumping.
- `max_depth=8`: Deep enough to see patterns, shallow enough to avoid noise.
- `subsample=0.85` & `colsample_bytree=0.85`: Add randomness to reduce overfitting.
- `reg_alpha=0.1`, `reg_lambda=1.0`: Penalties to keep the model from memorizing.

---
## 10. XGBoost Residuals Plot
![XGB Residuals](../images/habitability/10_xgb_residuals.png)
Same concept as the Random Forest residual plot. We compare shapes—if one has tighter residuals, it’s more precise.

---
## 11. XGBoost Feature Importance
![XGB Feature Importance](../images/habitability/11_xgb_feature_importance.png)
**Meaning:** Often similar top features as Random Forest. Agreement across models increases trust in feature relevance.

---
## 12. XGBoost Confusion Matrix & ROC Curve
![XGB Confusion Matrix](../images/habitability/12_xgb_confusion_matrix.png)
![XGB ROC Overlay](../images/habitability/12b_xgb_roc_overlay.png)
Same interpretation as Random Forest, but we check if XGBoost improves recall (finding real good planets) or precision (avoiding false alarms).

---
## 13. Neural Network Loss Curves
![NN Loss Curves](../images/habitability/13_nn_loss_curves.png)
**What you see:** Lines that go down over iterations (epochs).

**Meaning:** The network is “learning.” Loss = how wrong it is. Flat lines early mean learning stalled.

**Why these parameters:**
- Layers: `(128, 64, 32, 16)` mimic learning coarse → medium → fine patterns.
- `alpha=0.01`: Regularization to prevent overfitting (like telling the net “don’t get cocky”).
- `early_stopping=True`: Stops before it starts memorizing.
- `learning_rate='adaptive'`: Slows down if improvement stalls.

---
## 14. Neural Network Predicted vs Actual & Confusion Matrix
![NN Regression Scatter](../images/habitability/14_nn_regression_scatter.png)
![NN Confusion Matrix](../images/habitability/14b_nn_confusion_matrix.png)
Same meaning as before. We check if neural nets capture any complex interactions trees miss.

---
## 15. Combined ROC Curve (All Models)
![All Models ROC](../images/habitability/15_all_models_roc.png)
**What you see:** 3 colored curves.

**Meaning:** Compare which model best separates habitable from non-habitable across all thresholds. The one with highest AUC is strongest overall ranker.

---
## 16. Final Model Comparison Bar Chart
![All Models Bars](../images/habitability/16_all_models_bar_compare.png)
**What you see:** One grouped chart with R², F1, AUC for all three models.

**How we choose models:**
- Best regression (R²) → Good for scoring habitability continuously.
- Best classification (F1 & AUC) → Good for yes/no “likely habitable” flag.

---
## 17. Why Train Both Regression and Classification?
| Task | What It Does | Why Useful |
|------|--------------|------------|
| Regression | Predicts a habitability score (0–1) | Rank planets, prioritize follow-up |
| Classification | Predicts habitable vs not | Quick filtering for pipelines |

They complement each other: The score tells “how much,” the class tells “yes/no.”

---
## 18. Why We Chose These Models
| Model | Strength | Why Keep It |
|-------|----------|-------------|
| Random Forest | Stable, easy to interpret | Baseline + feature trust |
| XGBoost | High performance on structured data | Often best accuracy |
| Neural Network | Captures subtle interactions | Future-proof for richer data |

---
## 19. How Parameter Choices Prevent Overfitting
| Technique | What It Does | Example |
|-----------|--------------|---------|
| More Trees (RF/XGB) | Smooths randomness | 200–500 trees |
| Depth Limits | Avoids memorizing | max_depth 8–15 |
| Subsampling | Adds diversity | subsample 0.85 |
| Regularization | Penalizes complexity | reg_alpha, reg_lambda, alpha |
| Early Stopping | Stops before memorizing | n_iter_no_change, validation_fraction |

---
## 20. What To Do With Results
1. Pick top-scoring planets (regression) for deeper study.
2. Use classifier to auto-flag candidates in new catalogs.
3. Track which physics features drive “habitable” predictions.
4. Improve weak features (those rarely used by any model).

---
## 21. Summary (Kid Level)
- We feed space numbers into smart math helpers.
- They guess which planets might be nice places.
- We check charts to see if they’re guessing well.
- We keep the models that are both smart and fair.

> Like teaching three students (Forest, Booster, and Neural) to judge “Which planet could host life?”—then we compare their report cards.

---
## 22. Next Improvements
- Add uncertainty estimates.
- Use ensembles (combine model votes).
- Add spectral/atmosphere chemistry when available.
- Track drift as new planet data arrives.

---
**Done.** This document lives at `docs/development/notebook_visualizations_explained.md`. Update it whenever you add or change plots.
