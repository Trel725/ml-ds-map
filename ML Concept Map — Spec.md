# ML Concept Map — Spec

Oct 23, 2026 · @Juan

## Purpose and audience

An interactive web map that lets one student see how the ideas in a data science master's fit together, so new material lands somewhere instead of piling up. It is for orientation, not for exam drilling or as a full course.

**Who it's for**

- Switched from a bachelor's in arts to a master's in data science; now overwhelmed by many ideas arriving at once.
- Math is a real gap: high-school topics such as logarithms are shaky. The map cannot assume calculus, linear algebra or probability.
- Program likely covers classic ML, basic neural nets, NLP, econometrics, data modelling and prediction. Exact syllabus unconfirmed.
- Works in Python; English is fine.

**Design goals**

1. **See the whole at once.** The top level fits on one screen and shows every major area.
2. **Show why things connect.** Every link says what kind of relationship it is ("is trained by", "needs").
3. **Make math feel motivated.** Every math node answers "where does this show up in ML?"
4. **Turn confusion into a specific gap.** From any topic, the student can trace back to the one idea they are missing.
5. **Intuition before formulas.** Plain words and pictures first; notation one click deeper.

**Non-goals:** full lessons, exercises, grading, progress tracking, or replacing course materials.

## Organizing principles

Two ideas give the map its shape: every model is described by the same five-slot recipe, and every node sits in one of six layers stacked from foundations up to problems.

### The five-slot recipe

Every supervised method fills the same five slots. Showing this template on every algorithm node is the main tool against "too many unrelated ideas."

| Algorithm | Problem | Model family | Loss | Optimizer | Evaluation |
| --- | --- | --- | --- | --- | --- |
| OLS | Regression | Linear | Squared error | Analytical (normal equations) or gradient descent | RMSE, R² |
| Logistic regression | Classification | Linear + sigmoid | Log loss | Gradient descent, Newton | Accuracy, AUC, log loss |
| Decision tree | Either | Piecewise constant | Gini / entropy / squared error | Greedy splitting | Depends on problem |
| Gradient boosting | Either | Sum of small trees | Any differentiable loss | Gradient descent in function space | Depends on problem |
| Neural network | Either | Stacked linear + nonlinear layers | Any differentiable loss | SGD / Adam via backprop | Depends on problem |

Unsupervised methods use a reduced recipe: goal (group, compress, detect), what they optimize (e.g. within-cluster distance, explained variance), optimizer, and how to judge the result.

### Six layers, bottom to top

1. **Foundations** — pre-university math the rest stands on.
2. **Math** — linear algebra, calculus, optimization, probability, statistics.
3. **Core concepts** — ideas shared across all models (overfitting, regularization, validation).
4. **Algorithms** — the methods themselves, grouped into families.
5. **Problems** — the tasks people actually want solved.
6. **Tools** — a side rail, not a layer: Python libraries linked to the concepts they implement.

Domain areas (econometrics, NLP, time series) are not a seventh layer. They are **lenses**: highlighted subsets that cut across layers (see Interaction).

## Content inventory

About 30 group nodes are visible at the top level and about 120 nodes exist at full depth. Each group expands in place. The lists below are the draft node set; one-liners are the plain-language text shown on the node.

### 1. Foundations

| Node | One-liner | Shows up in ML as |
| --- | --- | --- |
| Functions and graphs | A rule that turns an input into an output | Every model is a function from features to a prediction |
| Exponents and logarithms | A log asks "what power gives this number?" | Log loss, likelihood, softmax, log-transforming skewed data |
| Notation: Σ, subscripts, vectors | Shorthand for "add all of these up" | Every loss function and average |
| Slope and rate of change | How fast one thing changes when another does | The seed of derivatives and gradient descent |
| Averages and spread | Mean, median, variance, standard deviation | MSE, standardization, data exploration |
| Basic probability | Chance of an event; chance given something else | Class probabilities, Naive Bayes |
| Distance | Pythagoras, extended to many columns | kNN, k-means, regularization norms |
| Reading plots | Axes, scales, log scales, scatter vs histogram | All exploratory work |

### 2. Math

**Linear algebra:** vectors (a row of data), dot product, matrices and matrix multiplication, projections, eigenvalues and SVD.

**Calculus:** derivatives, partial derivatives and gradients, chain rule.

**Optimization:** loss landscape, analytical (closed-form) solutions, gradient descent, SGD and Adam, learning rate, convexity and local minima, Newton's method, greedy search.

**Probability:** random variables, common distributions (normal, Bernoulli, binomial, Poisson), conditional probability and Bayes' rule, expectation and variance, independence, likelihood and maximum likelihood estimation (MLE).

**Statistics:** sampling and sampling distributions, central limit theorem, estimators and standard errors, confidence intervals, hypothesis testing and p-values, bootstrap, correlation vs causation.

### 3. Core concepts

- Features, target, training vs prediction
- Parameters vs hyperparameters
- Loss function vs evaluation metric (and why they often differ)
- Overfitting and underfitting
- Bias–variance tradeoff
- Regularization (one idea, many forms: L1/L2, pruning, dropout, early stopping)
- Train / validation / test split; cross-validation; hyperparameter tuning
- Data leakage
- Class imbalance
- Feature engineering and scaling
- Curse of dimensionality
- Parametric vs non-parametric; generative vs discriminative
- Prediction vs explanation (the ML vs econometrics mindset)
- Interpretability (coefficients, feature importance, SHAP)

### 4. Algorithms

| Family | Members | Core idea |
| --- | --- | --- |
| Linear models | OLS, Ridge, Lasso, Elastic Net, logistic regression, GLMs | Weighted sum of features |
| Probabilistic / generative | Naive Bayes, LDA, QDA, Gaussian mixtures | Model how each class generates data, then apply Bayes' rule |
| Instance-based | k-nearest neighbors | Predict like your closest examples |
| Kernel methods | SVM, kernel trick | Find the widest separating margin, possibly in a transformed space |
| Trees | Decision trees (CART) | Ask a sequence of yes/no questions |
| Ensembles: bagging | Bagging, random forests | Average many varied trees to cut variance |
| Ensembles: boosting | AdaBoost, gradient boosting, XGBoost, LightGBM | Add trees one by one, each fixing the last one's errors |
| Neural networks | Perceptron, MLP, backpropagation | Stack linear models with nonlinear bends between them |
| Clustering | k-means, hierarchical, DBSCAN | Group similar points without labels |
| Dimensionality reduction | PCA, t-SNE, UMAP | Squeeze many columns into a few |
| Time series models | ARIMA family, exponential smoothing | Predict the future from the series' own past |

### 5. Problems

Regression · classification (binary, multiclass) · clustering · dimensionality reduction and visualization · anomaly detection · time series forecasting · causal effect estimation · text tasks (classification, sentiment, topic discovery).

### 6. Lenses (cross-cutting domain subsets)

**Econometrics:** OLS assumptions and Gauss–Markov, coefficient interpretation, heteroskedasticity and robust standard errors, multicollinearity, omitted variable bias and endogeneity, instrumental variables, panel data (fixed and random effects), difference-in-differences, logit and probit.

**NLP:** tokenization, bag-of-words and n-grams, TF-IDF, word embeddings, text classification with Naive Bayes or logistic regression, topic models, transformers (pointer only, beyond scope).

**Time series:** trend and seasonality, stationarity, autocorrelation, lag features, time-aware cross-validation.

> Note: "LDA" means two different things — Linear Discriminant Analysis (classification) and Latent Dirichlet Allocation (topic models). The map shows both with a visible "not the same thing" link.

### 7. Tools (side rail)

| Tool | Linked concepts |
| --- | --- |
| NumPy | Vectors, matrices, linear algebra |
| pandas | Data loading, cleaning, feature engineering |
| matplotlib / seaborn | Reading plots, data exploration |
| scikit-learn | Most algorithms, pipelines, cross-validation, metrics |
| statsmodels | OLS with full statistics, hypothesis tests, econometrics, ARIMA |
| XGBoost / LightGBM | Gradient boosting |
| PyTorch | Neural networks; autograd = backprop done for you |
| NLTK / spaCy | Tokenization and text preprocessing |

## Edges and key connections

Every edge has one of eight types, and the type is always shown as words on hover. Untyped "related to" links are not allowed: they are what turns concept maps into hairballs.

### Edge types

| Type | Reads as | Example | Line style |
| --- | --- | --- | --- |
| needs | A needs B to be understood | Gradient descent needs derivatives | Solid, thin |
| is trained by | Model A is fitted using method B | Neural network is trained by SGD | Solid, thick |
| solves | Algorithm A is used for problem B | Random forest solves classification | Solid, toward Problems layer |
| is a special case of | A is B with something fixed or removed | OLS is a special case of a GLM | Dashed |
| fixes weakness of | A was invented to address B's problem | Random forest fixes the variance of a decision tree | Dashed with arrow |
| is built from | A combines copies of B | Gradient boosting is built from decision trees | Dotted |
| controls | Concept A is a dial on B | Regularization controls overfitting | Solid with bar end |
| implemented in | Concept A is available in tool B | Cross-validation implemented in scikit-learn | Gray, tools rail only |

One extra annotation, **not the same as**, marks confusable names (the two LDAs; logistic regression vs linear regression; loss vs metric).

### Signature connections

These links are the main "aha" moments the map exists to deliver. Each one gets a short explanation on its edge panel.

| From | Edge | To | Why it matters |
| --- | --- | --- | --- |
| Slope | is needed by | Derivative | Derivatives are just slopes at a single point |
| Gradient | needs | Derivative | A gradient is a list of slopes, one per parameter |
| Gradient descent | needs | Gradient | Learning = walk downhill on the loss surface |
| Logistic regression, neural nets, boosting | is trained by | Gradient descent | One optimizer trains most of modern ML |
| OLS | is trained by | Analytical solution | Some problems can be solved exactly with linear algebra |
| Log loss | needs | Logarithms | Why logs suddenly matter |
| MLE | needs | Logarithms | Products of probabilities become sums |
| OLS | is a special case of | MLE | Squared error = MLE under normal noise |
| Ridge / Lasso | controls | Overfitting | Regularization as a penalty on big weights |
| Bagging | needs | Bootstrap | The same resampling trick from statistics |
| Random forest | fixes weakness of | Decision tree | High variance of a single tree |
| Gradient boosting | fixes weakness of | Decision stump | High bias of a tiny tree |
| Neural network | is built from | Logistic regression | One neuron = a logistic regression |
| Backpropagation | needs | Chain rule | Backprop is the chain rule, applied repeatedly |
| PCA | needs | Eigenvectors / SVD | Directions of most variance |
| Naive Bayes, LDA, QDA | needs | Bayes' rule | Generative classifiers flip conditional probabilities |
| kNN, k-means | needs | Distance | Why feature scaling matters |
| Cross-validation | controls | Hyperparameters | How tuning is done honestly |
| Econometric OLS | not the same as | ML regression | Same formula, different goal: explain vs predict |
| Hypothesis testing | needs | Sampling distributions | p-values come from imagined repeated samples |

## Node detail panel

Clicking a node opens a side panel with the same fixed sections, in the same order, for every node. Sections that don't apply are hidden, never left empty.

1. **Name and one-liner** — plain language, under 15 words.
2. **Intuition** — 2–4 sentences with an everyday analogy (e.g. gradient descent = walking downhill in fog, feeling the slope with your feet).
3. **Concept visualization** — the interactive mini-explainer for this node, if it has one (see next section).
4. **Recipe card** (algorithms only) — the five slots: problem, model family, loss, optimizer, evaluation. Each slot is a link to its node.
5. **Where it shows up** (math and foundations only) — the ML nodes that need this, as clickable chips.
6. **What you need first** — direct "needs" links, plus a button: *Trace all prerequisites*.
7. **Strengths and weaknesses** (algorithms only) — 2–3 of each, plus "fixed by" links where they exist.
8. **The math, one level deeper** — collapsed by default. Key formula with every symbol explained in words beneath it.
9. **In code** — 3–6 line Python snippet using the linked tool.
10. **Common confusions** — the "not the same as" notes and typical beginner mistakes.
11. **Go further** — 1–3 trusted external resources (e.g. StatQuest, 3Blue1Brown, ISLR chapters).

Writing rules for panel text: no symbol appears before it is explained in words; sentences under 20 words; one analogy per node, reused consistently wherever the concept reappears.

## Concept visualizations

About 25 key nodes carry a small interactive explainer inside their panel: one takeaway each, one or two controls, no formulas needed to use it. Eight are core (P1) and ship first.

**Rules for every visualization**

- One sentence states the takeaway above the visual; the interaction proves it.
- At most two controls (slider, drag, or step button).
- Two shared toy datasets reused everywhere: **flat prices** (size → price, for regression) and **emails** (spam / not spam, for classification). Seeing the same data under OLS, a tree and a forest is part of the lesson.
- Same colors mean the same things across all visuals: training data, test data, model prediction, error.
- Also browsable together as a gallery view.

### Catalog

| Node | What it shows | Interaction | Takeaway | Priority |
| --- | --- | --- | --- | --- |
| Logarithms | Number line vs log line; skewed price histogram | Slide x; toggle log scale | Logs turn multiplying into adding and tame huge numbers | P1 |
| Slope → derivative | A line between two points on a curve | Drag points together until the line just touches | A derivative is a slope at one point | P1 |
| Gradient descent | Ball rolling on a loss curve, then a 2D contour map | Learning-rate slider; step button | Too small is slow, too big overshoots or explodes | P1 |
| OLS fit | Line through points, errors drawn as literal squares | Drag points | "Least squares" = the line with the smallest total square area | P1 |
| Overfitting | Polynomial fit + train/test error curves | Complexity slider | Training error always falls; test error falls then rises | P1 |
| Decision tree | 2D points split into rectangles | Depth slider | A tree is a stack of yes/no cuts | P1 |
| Classification threshold | Predicted probabilities + confusion matrix | Threshold slider | Precision and recall trade off against each other | P1 |
| Bayes' rule | Grid of 1,000 dots (test result × condition) | Change base rate | A positive test can still mean "probably not" | P1 |
| Loss functions | Squared, absolute and log loss curves | Drag the prediction | How hard each loss punishes a wrong answer | P2 |
| Regularization | Fitted curve + coefficient bars | λ slider; Ridge/Lasso toggle | Penalties shrink weights; Lasso sets some to zero | P2 |
| Cross-validation | Data strip split into folds | Step through folds | Every point gets a turn as test data | P2 |
| Random forest | Several jagged tree boundaries vs their average | Number-of-trees slider | Averaging many noisy guesses gives a smooth one | P2 |
| Gradient boosting | Residuals after each added tree | Step button | Each tree fixes what the last ones got wrong | P2 |
| kNN | Query point and its neighbors | Drag point; k slider; scaling toggle | Prediction = vote of neighbors; unscaled features distort distance | P2 |
| k-means | Points and moving centroids | Step: assign / move | Two simple steps repeated until nothing changes | P2 |
| PCA | 2D cloud and a rotating projection line | Rotate line | The best line keeps the most spread | P2 |
| Logistic regression | Sigmoid curve over data | Weight and bias sliders | A line bent into probabilities | P2 |
| Neuron → network | One neuron's boundary, then several combined | Add hidden units | Combining simple boundaries makes curved ones | P2 |
| Backpropagation | Tiny 2-layer network with values on edges | Step forward, then backward | Error flows backward through the chain rule | P2 |
| Sampling distribution / CLT | Many sample means piling into a histogram | Sample-size slider; draw button | Averages of samples form a bell curve | P2 |
| Bootstrap | Resampling the same data with replacement | Draw button | Fake new datasets from the one you have | P2 |
| Hypothesis test | Shuffled-label histogram vs observed value | Shuffle button | A p-value is how often chance alone does this well | P2 |
| Omitted variable bias | Regression with and without a confounder | Toggle confounder | Leaving out a cause can flip a coefficient | P2 |
| TF-IDF | Sentences and their word weights | Edit sentences | Common words count for little | P2 |
| Time series decomposition | Series = trend + seasonality + noise | Sliders per component | A series is layers you can pull apart | P2 |

## Interaction and navigation

The map is calm by default and reveals connections only on request. Edges are hidden until a node is selected; that rule matters more than any other for avoiding a hairball.

### Zoom levels

1. **Layers** — six labeled lanes, nothing else. The first screen a new visitor sees.
2. **Groups** — about 30 group nodes (e.g. "Optimization", "Ensembles"). Default view.
3. **Nodes** — expanding a group shows its members in place; neighbors shift to make room.

### Selecting a node

- Click: node highlights, its direct edges appear with type labels, unrelated nodes fade to 20% opacity, detail panel opens.
- Hover an edge: shows its sentence ("Random forest fixes the variance of a decision tree").
- Click an edge: panel shows the edge's own explanation.
- Escape or click background: back to the calm view.

### Traces

- **Trace prerequisites (down):** lights up every "needs" chain from the selected node to the foundations, as an ordered path. Answers "what am I missing?"
- **Trace uses (up):** from a math or foundation node, lights up everything that depends on it. Answers "why do I need this?"
- **Recipe trace:** from an algorithm, lights up its five recipe slots across layers at once.

### Lenses

Toggle chips for Econometrics, NLP, Time series and Neural nets. A lens highlights its nodes across all layers and dims the rest. Only one lens at a time.

### Guided tours

Short click-through stories that walk the map, 5–8 stops each:

1. **How a model learns** — function → loss → slope → gradient → gradient descent → logistic regression.
2. **From one tree to a forest** — decision tree → overfitting → variance → bootstrap → bagging → random forest → boosting.
3. **Why logs are everywhere** — logarithms → probability → likelihood → MLE → log loss → logistic regression.
4. **Explain vs predict** — OLS in econometrics vs OLS in ML: same formula, different questions.
5. **From a neuron to a network** — logistic regression → neuron → layers → chain rule → backprop.

### Other

- Search box with autocomplete, including synonyms ("linear regression" → OLS).
- Breadcrumb of the last 5 selected nodes.
- Each node has its own link, so a node can be shared or bookmarked.
- Small screens: a searchable list view with the same panels, no graph.

## Visual design

The screen splits into a map on the left and one detail panel on the right, with foundations at the bottom so the picture itself says "ideas build upward."

&#91;embedded content: screen layout · 5 lanes, tools rail, detail panel\]

The tools rail sits beside the lanes rather than inside them, because tools implement ideas from every layer.

- **Color:** one muted hue per layer; full saturation only for the selected node and its connections. Color is never the only cue: layer is also shown by position, edge type by line style.
- **Node labels:** at most three words, 13 px or larger. A small badge marks nodes that have a concept visualization.
- **Node shapes:** rounded rectangles for algorithms and problems, pills for concepts, circles for math and foundation topics.
- **Density:** at most 12 nodes per lane at the group level; anything more goes one level deeper.
- **Motion:** 200–300 ms transitions on expand, fade and trace; disabled when the system asks for reduced motion.
- **Themes:** works in light and dark mode.
- **Accessibility:** every node reachable by keyboard (Tab to move, Enter to select, arrow keys to follow edges); every visualization has a one-sentence text alternative.

## Scope, phasing and open questions

Build in three phases so the student gets a usable map early; the content (about 120 node panels) is most of the work, not the code.

### Phases

| Phase | Includes |
| --- | --- |
| 1 — Usable map | Layered map at group and node level; every node with one-liner, intuition and "where it shows up"; typed edges on select; prerequisite trace; search; the 8 P1 visualizations; tour 1 (How a model learns) |
| 2 — Full depth | Complete panels (recipe card, math one level deeper, code, confusions, resources); remaining 17 visualizations; lenses; tours 2–5 |
| 3 — Polish | Small-screen list view; full keyboard navigation; visualization gallery; per-node links |

### Data model (for implementation)

Content lives in data files separate from the code, so it can be edited without touching the app.

- **Node:** id, label, synonyms, layer, group, lenses, one-liner, intuition, analogy, recipe (algorithms), formula + symbol notes, code snippet, confusions, resources, visualization id.
- **Edge:** from, to, type (one of the eight), one-sentence explanation, signature flag.
- **Tour:** id, title, ordered list of node ids with a short caption per stop.

### Open questions

- [ ] Get the program's actual course list to confirm what's in scope.
- [ ] "Data modelling": statistical modelling, or database/schema design (SQL)? The second would need its own area.
- [ ] How deep should econometrics go (e.g. are panel data and instrumental variables taught)?
- [ ] Include Bayesian statistics beyond Bayes' rule?
- [ ] Should the student be able to mark nodes as "I get this"? Currently a non-goal; it may help motivation.
- [ ] Who reviews the node content for accuracy and level: the student, a tutor, or both?
