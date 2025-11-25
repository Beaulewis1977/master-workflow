/**
 * Auto-Tuner Engine
 * ==================
 * Real optimization algorithms: Bayesian optimization with Gaussian Process,
 * genetic algorithms, simulated annealing, and multi-armed bandits.
 */

import { EventEmitter } from 'events';
import { Matrix, inverse, pseudoInverse } from 'ml-matrix';

export class AutoTuner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      algorithm: options.algorithm || 'bayesian', // bayesian, genetic, annealing, bandit
      maxIterations: options.maxIterations || 100,
      populationSize: options.populationSize || 20,
      mutationRate: options.mutationRate || 0.1,
      explorationRate: options.explorationRate || 0.2,
      verbose: options.verbose || false
    };

    this.history = [];
    this.bestConfig = null;
    this.bestScore = -Infinity;
    
    this.metrics = {
      iterations: 0,
      improvements: 0,
      convergenceRate: 0
    };
  }

  log(msg) { if (this.options.verbose) console.log(`[Tuner] ${msg}`); }

  async initialize() {
    this.log('Initializing Auto-Tuner Engine...');
    this.emit('initialized');
    return true;
  }

  /**
   * Main optimization entry point
   */
  async optimize(objectiveFn, paramSpace, options = {}) {
    const algorithm = options.algorithm || this.options.algorithm;
    
    this.log(`Starting optimization with ${algorithm} algorithm...`);
    this.emit('optimization:start', { algorithm, paramSpace });

    let result;
    switch (algorithm) {
      case 'bayesian':
        result = await this.bayesianOptimization(objectiveFn, paramSpace, options);
        break;
      case 'genetic':
        result = await this.geneticAlgorithm(objectiveFn, paramSpace, options);
        break;
      case 'annealing':
        result = await this.simulatedAnnealing(objectiveFn, paramSpace, options);
        break;
      case 'bandit':
        result = await this.multiArmedBandit(objectiveFn, paramSpace, options);
        break;
      default:
        result = await this.bayesianOptimization(objectiveFn, paramSpace, options);
    }

    this.emit('optimization:complete', result);
    return result;
  }

  /**
   * Bayesian Optimization with Gaussian Process surrogate
   */
  async bayesianOptimization(objectiveFn, paramSpace, options = {}) {
    const maxIter = options.maxIterations || this.options.maxIterations;
    const xi = options.xi || 0.01; // Exploration-exploitation trade-off
    
    // GP hyperparameters
    this.gpParams = {
      lengthScale: options.lengthScale || 1.0,
      signalVariance: options.signalVariance || 1.0,
      noiseVariance: options.noiseVariance || 0.01
    };
    
    // Initialize with random samples
    const initialSamples = Math.min(5, Math.max(3, Object.keys(paramSpace).length + 1));
    for (let i = 0; i < initialSamples; i++) {
      const config = this.sampleRandom(paramSpace);
      const score = await objectiveFn(config);
      this.recordObservation(config, score);
    }

    // Bayesian optimization loop
    for (let iter = 0; iter < maxIter - initialSamples; iter++) {
      this.metrics.iterations++;

      // Generate candidate points
      const candidates = this.generateCandidates(paramSpace, 200);
      
      // Fit Gaussian Process to current observations
      const gpModel = this.fitGaussianProcess(paramSpace);
      
      // Find best candidate using Expected Improvement
      let bestCandidate = null;
      let bestAcquisition = -Infinity;

      for (const candidate of candidates) {
        const { mean, variance } = this.gpPredict(candidate, gpModel, paramSpace);
        const acquisition = this.calculateExpectedImprovement(mean, variance, this.bestScore, xi);
        
        if (acquisition > bestAcquisition) {
          bestAcquisition = acquisition;
          bestCandidate = candidate;
        }
      }

      // Evaluate best candidate
      const score = await objectiveFn(bestCandidate);
      this.recordObservation(bestCandidate, score);

      if (score > this.bestScore) {
        this.bestScore = score;
        this.bestConfig = bestCandidate;
        this.metrics.improvements++;
        this.log(`New best: ${score.toFixed(4)} at iteration ${iter}`);
      }

      this.emit('iteration', { iter, score, best: this.bestScore, acquisition: bestAcquisition });
    }

    return {
      bestConfig: this.bestConfig,
      bestScore: this.bestScore,
      history: this.history,
      metrics: this.metrics
    };
  }

  /**
   * Fit a Gaussian Process model to the current observations
   */
  fitGaussianProcess(paramSpace) {
    const n = this.history.length;
    if (n === 0) return null;

    // Extract X (configurations) and y (scores)
    const X = this.history.map(h => this.configToVector(h.config, paramSpace));
    const y = this.history.map(h => h.score);

    // Normalize y
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    const yStd = Math.sqrt(y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / n) || 1;
    const yNorm = y.map(val => (val - yMean) / yStd);

    // Build covariance matrix K
    const K = new Matrix(n, n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        K.set(i, j, this.rbfKernel(X[i], X[j]));
      }
      // Add noise variance to diagonal
      K.set(i, i, K.get(i, i) + this.gpParams.noiseVariance);
    }

    // Compute K inverse (with regularization for numerical stability)
    let Kinv;
    try {
      Kinv = inverse(K);
    } catch (e) {
      // Fall back to pseudo-inverse if singular
      Kinv = pseudoInverse(K);
    }

    // Precompute alpha = K^-1 * y
    const yMatrix = Matrix.columnVector(yNorm);
    const alpha = Kinv.mmul(yMatrix);

    return {
      X,
      y: yNorm,
      yMean,
      yStd,
      K,
      Kinv,
      alpha
    };
  }

  /**
   * Predict mean and variance at a new point using the GP model
   */
  gpPredict(config, gpModel, paramSpace) {
    if (!gpModel) {
      return { mean: 0, variance: 1 };
    }

    const x = this.configToVector(config, paramSpace);
    const n = gpModel.X.length;

    // Compute k* (covariance between new point and training points)
    const kStar = [];
    for (let i = 0; i < n; i++) {
      kStar.push(this.rbfKernel(x, gpModel.X[i]));
    }
    const kStarMatrix = Matrix.rowVector(kStar);

    // Compute k** (variance of new point)
    const kStarStar = this.rbfKernel(x, x);

    // Predictive mean: k* . alpha
    const meanNorm = kStarMatrix.mmul(gpModel.alpha).get(0, 0);
    const mean = meanNorm * gpModel.yStd + gpModel.yMean;

    // Predictive variance: k** - k* . K^-1 . k*^T
    const kStarCol = Matrix.columnVector(kStar);
    const varianceNorm = kStarStar - kStarMatrix.mmul(gpModel.Kinv).mmul(kStarCol).get(0, 0);
    const variance = Math.max(0, varianceNorm) * gpModel.yStd * gpModel.yStd;

    return { mean, variance };
  }

  /**
   * RBF (Squared Exponential) kernel
   */
  rbfKernel(x1, x2) {
    const { lengthScale, signalVariance } = this.gpParams;
    let sqDist = 0;
    for (let i = 0; i < x1.length; i++) {
      sqDist += Math.pow((x1[i] - x2[i]) / lengthScale, 2);
    }
    return signalVariance * Math.exp(-0.5 * sqDist);
  }

  /**
   * Convert config object to normalized vector
   */
  configToVector(config, paramSpace) {
    const vector = [];
    for (const [key, spec] of Object.entries(paramSpace)) {
      if (spec.type === 'continuous' || spec.type === 'integer') {
        // Normalize to [0, 1]
        const range = spec.max - spec.min;
        vector.push(range !== 0 ? (config[key] - spec.min) / range : 0);
      } else if (spec.type === 'categorical') {
        // One-hot encode
        for (let i = 0; i < spec.values.length; i++) {
          vector.push(config[key] === spec.values[i] ? 1 : 0);
        }
      }
    }
    return vector;
  }

  /**
   * Calculate Expected Improvement acquisition function
   */
  calculateExpectedImprovement(mean, variance, bestScore, xi = 0.01) {
    if (variance <= 0) return 0;
    
    const std = Math.sqrt(variance);
    const z = (mean - bestScore - xi) / std;
    
    // EI = (mean - best - xi) * Phi(z) + std * phi(z)
    const phi = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    const Phi = 0.5 * (1 + this.erf(z / Math.sqrt(2)));
    
    return (mean - bestScore - xi) * Phi + std * phi;
  }

  /**
   * Error function approximation
   */
  erf(x) {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Genetic Algorithm optimization
   */
  async geneticAlgorithm(objectiveFn, paramSpace, options = {}) {
    const popSize = options.populationSize || this.options.populationSize;
    const maxGen = options.maxIterations || this.options.maxIterations;
    const mutationRate = options.mutationRate || this.options.mutationRate;

    // Initialize population
    let population = [];
    for (let i = 0; i < popSize; i++) {
      const config = this.sampleRandom(paramSpace);
      const score = await objectiveFn(config);
      population.push({ config, score });
      this.recordObservation(config, score);
    }

    // Evolution loop
    for (let gen = 0; gen < maxGen; gen++) {
      this.metrics.iterations++;

      // Sort by fitness
      population.sort((a, b) => b.score - a.score);

      // Update best
      if (population[0].score > this.bestScore) {
        this.bestScore = population[0].score;
        this.bestConfig = population[0].config;
        this.metrics.improvements++;
      }

      // Selection (top 50%)
      const parents = population.slice(0, Math.floor(popSize / 2));

      // Crossover and mutation
      const offspring = [];
      while (offspring.length < popSize - parents.length) {
        const p1 = parents[Math.floor(Math.random() * parents.length)];
        const p2 = parents[Math.floor(Math.random() * parents.length)];
        
        let child = this.crossover(p1.config, p2.config, paramSpace);
        child = this.mutate(child, paramSpace, mutationRate);
        
        const score = await objectiveFn(child);
        offspring.push({ config: child, score });
        this.recordObservation(child, score);
      }

      population = [...parents, ...offspring];
      this.emit('generation', { gen, best: this.bestScore });
    }

    return {
      bestConfig: this.bestConfig,
      bestScore: this.bestScore,
      history: this.history,
      metrics: this.metrics
    };
  }

  /**
   * Simulated Annealing optimization
   */
  async simulatedAnnealing(objectiveFn, paramSpace, options = {}) {
    const maxIter = options.maxIterations || this.options.maxIterations;
    let temperature = options.initialTemp || 1.0;
    const coolingRate = options.coolingRate || 0.95;

    // Initialize
    let current = this.sampleRandom(paramSpace);
    let currentScore = await objectiveFn(current);
    this.recordObservation(current, currentScore);
    
    this.bestConfig = current;
    this.bestScore = currentScore;

    for (let iter = 0; iter < maxIter; iter++) {
      this.metrics.iterations++;

      // Generate neighbor
      const neighbor = this.getNeighbor(current, paramSpace);
      const neighborScore = await objectiveFn(neighbor);
      this.recordObservation(neighbor, neighborScore);

      // Accept or reject
      const delta = neighborScore - currentScore;
      if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
        current = neighbor;
        currentScore = neighborScore;

        if (currentScore > this.bestScore) {
          this.bestScore = currentScore;
          this.bestConfig = current;
          this.metrics.improvements++;
        }
      }

      // Cool down
      temperature *= coolingRate;
      this.emit('iteration', { iter, score: currentScore, temp: temperature });
    }

    return {
      bestConfig: this.bestConfig,
      bestScore: this.bestScore,
      history: this.history,
      metrics: this.metrics
    };
  }

  /**
   * Multi-Armed Bandit (Thompson Sampling)
   */
  async multiArmedBandit(objectiveFn, paramSpace, options = {}) {
    const maxIter = options.maxIterations || this.options.maxIterations;
    const numArms = options.numArms || 10;

    // Generate arms (discrete configurations)
    const arms = [];
    for (let i = 0; i < numArms; i++) {
      arms.push({
        config: this.sampleRandom(paramSpace),
        alpha: 1, // Beta distribution parameters
        beta: 1,
        pulls: 0,
        totalReward: 0
      });
    }

    for (let iter = 0; iter < maxIter; iter++) {
      this.metrics.iterations++;

      // Thompson sampling: sample from each arm's beta distribution
      let bestArm = null;
      let bestSample = -Infinity;

      for (const arm of arms) {
        const sample = this.sampleBeta(arm.alpha, arm.beta);
        if (sample > bestSample) {
          bestSample = sample;
          bestArm = arm;
        }
      }

      // Pull the selected arm
      const score = await objectiveFn(bestArm.config);
      const reward = score > 0 ? 1 : 0; // Binary reward
      
      // Update arm statistics
      bestArm.pulls++;
      bestArm.totalReward += score;
      if (reward > 0) bestArm.alpha++;
      else bestArm.beta++;

      this.recordObservation(bestArm.config, score);

      if (score > this.bestScore) {
        this.bestScore = score;
        this.bestConfig = bestArm.config;
        this.metrics.improvements++;
      }

      this.emit('iteration', { iter, score, arm: arms.indexOf(bestArm) });
    }

    return {
      bestConfig: this.bestConfig,
      bestScore: this.bestScore,
      arms: arms.map(a => ({ config: a.config, avgReward: a.pulls > 0 ? a.totalReward / a.pulls : 0 })),
      history: this.history,
      metrics: this.metrics
    };
  }

  // Helper methods
  sampleRandom(paramSpace) {
    const config = {};
    for (const [key, spec] of Object.entries(paramSpace)) {
      if (spec.type === 'continuous') {
        config[key] = spec.min + Math.random() * (spec.max - spec.min);
      } else if (spec.type === 'integer') {
        config[key] = Math.floor(spec.min + Math.random() * (spec.max - spec.min + 1));
      } else if (spec.type === 'categorical') {
        config[key] = spec.values[Math.floor(Math.random() * spec.values.length)];
      }
    }
    return config;
  }

  generateCandidates(paramSpace, n) {
    const candidates = [];
    for (let i = 0; i < n; i++) {
      candidates.push(this.sampleRandom(paramSpace));
    }
    return candidates;
  }

  crossover(p1, p2, paramSpace) {
    const child = {};
    for (const key of Object.keys(paramSpace)) {
      child[key] = Math.random() < 0.5 ? p1[key] : p2[key];
    }
    return child;
  }

  mutate(config, paramSpace, rate) {
    const mutated = { ...config };
    for (const [key, spec] of Object.entries(paramSpace)) {
      if (Math.random() < rate) {
        if (spec.type === 'continuous') {
          const range = spec.max - spec.min;
          mutated[key] += (Math.random() - 0.5) * range * 0.2;
          mutated[key] = Math.max(spec.min, Math.min(spec.max, mutated[key]));
        } else if (spec.type === 'integer') {
          mutated[key] += Math.floor((Math.random() - 0.5) * 3);
          mutated[key] = Math.max(spec.min, Math.min(spec.max, mutated[key]));
        } else if (spec.type === 'categorical') {
          mutated[key] = spec.values[Math.floor(Math.random() * spec.values.length)];
        }
      }
    }
    return mutated;
  }

  getNeighbor(config, paramSpace) {
    return this.mutate(config, paramSpace, 0.3);
  }

  sampleBeta(alpha, beta) {
    // Approximate beta sampling
    const x = this.sampleGamma(alpha);
    const y = this.sampleGamma(beta);
    return x / (x + y);
  }

  sampleGamma(shape) {
    // Marsaglia and Tsang's method approximation
    if (shape < 1) return this.sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x, v;
      do {
        x = this.sampleNormal();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  sampleNormal() {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  recordObservation(config, score) {
    this.history.push({ config, score, timestamp: Date.now() });
  }

  getMetrics() {
    return {
      ...this.metrics,
      historySize: this.history.length,
      bestScore: this.bestScore
    };
  }

  getStatus() {
    return {
      initialized: true,
      bestConfig: this.bestConfig,
      bestScore: this.bestScore,
      metrics: this.getMetrics()
    };
  }
}

export default AutoTuner;
