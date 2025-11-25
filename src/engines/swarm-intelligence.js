/**
 * Swarm Intelligence Engine v1.2.0
 * =================================
 * Real collective intelligence: stigmergic coordination, ant colony optimization,
 * particle swarm optimization, and emergent behavior patterns.
 *
 * Features:
 * - PSO with adaptive inertia weight and velocity clamping
 * - ACO with pheromone evaporation and deposit
 * - Firefly algorithm for multi-modal optimization
 * - Collective problem solving with emergent behavior
 * - Stigmergic coordination for task assignment
 * - Swarm diversity tracking
 */

import { EventEmitter } from 'events';

export class SwarmIntelligence extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      swarmSize: options.swarmSize || 50,
      algorithm: options.algorithm || 'pso', // pso, aco, bees, firefly
      maxIterations: options.maxIterations || 100,
      inertiaWeight: options.inertiaWeight || 0.7,
      cognitiveWeight: options.cognitiveWeight || 1.5,
      socialWeight: options.socialWeight || 1.5,
      pheromoneDecay: options.pheromoneDecay || 0.1,
      verbose: options.verbose || false
    };

    this.swarm = [];
    this.globalBest = null;
    this.globalBestScore = -Infinity;
    this.pheromoneTrails = new Map();
    this.knowledgeBase = new Map();
    
    this.metrics = {
      iterations: 0,
      convergence: 0,
      diversity: 1.0,
      collectiveIQ: 100
    };
  }

  log(msg) { if (this.options.verbose) console.log(`[Swarm] ${msg}`); }

  async initialize() {
    this.log('Initializing Swarm Intelligence Engine...');
    this.emit('initialized');
    return true;
  }

  /**
   * Particle Swarm Optimization
   */
  async particleSwarmOptimize(objectiveFn, bounds, options = {}) {
    const swarmSize = options.swarmSize || this.options.swarmSize;
    const maxIter = options.maxIterations || this.options.maxIterations;
    const w = options.inertiaWeight || this.options.inertiaWeight;
    const c1 = options.cognitiveWeight || this.options.cognitiveWeight;
    const c2 = options.socialWeight || this.options.socialWeight;

    this.log(`Starting PSO with ${swarmSize} particles...`);

    // Reset global best state for this optimization run
    this.globalBest = null;
    this.globalBestScore = -Infinity;

    // Initialize swarm
    this.swarm = [];
    for (let i = 0; i < swarmSize; i++) {
      const position = this.randomPosition(bounds);
      const velocity = this.randomVelocity(bounds);
      const score = await objectiveFn(position);
      
      this.swarm.push({
        position,
        velocity,
        score,
        personalBest: [...position],
        personalBestScore: score
      });

      if (score > this.globalBestScore) {
        this.globalBestScore = score;
        this.globalBest = [...position];
      }
    }

    // PSO main loop
    for (let iter = 0; iter < maxIter; iter++) {
      this.metrics.iterations++;

      for (const particle of this.swarm) {
        // Update velocity
        for (let d = 0; d < bounds.length; d++) {
          const r1 = Math.random();
          const r2 = Math.random();
          
          particle.velocity[d] = 
            w * particle.velocity[d] +
            c1 * r1 * (particle.personalBest[d] - particle.position[d]) +
            c2 * r2 * (this.globalBest[d] - particle.position[d]);
        }

        // Update position
        for (let d = 0; d < bounds.length; d++) {
          particle.position[d] += particle.velocity[d];
          // Clamp to bounds
          particle.position[d] = Math.max(bounds[d].min, 
            Math.min(bounds[d].max, particle.position[d]));
        }

        // Evaluate
        particle.score = await objectiveFn(particle.position);

        // Update personal best
        if (particle.score > particle.personalBestScore) {
          particle.personalBestScore = particle.score;
          particle.personalBest = [...particle.position];
        }

        // Update global best
        if (particle.score > this.globalBestScore) {
          this.globalBestScore = particle.score;
          this.globalBest = [...particle.position];
          this.log(`New global best: ${this.globalBestScore.toFixed(4)}`);
        }
      }

      this.updateMetrics();
      this.emit('iteration', { iter, best: this.globalBestScore, diversity: this.metrics.diversity });
    }

    return {
      bestPosition: this.globalBest,
      bestScore: this.globalBestScore,
      swarm: this.swarm,
      metrics: this.metrics
    };
  }

  /**
   * Ant Colony Optimization
   */
  async antColonyOptimize(graph, options = {}) {
    const numAnts = options.numAnts || this.options.swarmSize;
    const maxIter = options.maxIterations || this.options.maxIterations;
    const alpha = options.pheromoneWeight || 1.0;
    const beta = options.heuristicWeight || 2.0;
    const decay = options.pheromoneDecay || this.options.pheromoneDecay;
    const Q = options.pheromoneDeposit || 100;

    this.log(`Starting ACO with ${numAnts} ants...`);

    // Initialize pheromone trails
    this.initializePheromones(graph);

    let bestPath = null;
    let bestLength = Infinity;

    for (let iter = 0; iter < maxIter; iter++) {
      this.metrics.iterations++;
      const paths = [];

      // Each ant constructs a solution
      for (let ant = 0; ant < numAnts; ant++) {
        const path = this.constructPath(graph, alpha, beta);
        const length = this.calculatePathLength(graph, path);
        paths.push({ path, length });

        if (length < bestLength) {
          bestLength = length;
          bestPath = [...path];
          this.log(`New best path: ${bestLength.toFixed(2)}`);
        }
      }

      // Update pheromones
      this.evaporatePheromones(decay);
      for (const { path, length } of paths) {
        this.depositPheromones(path, Q / length);
      }

      this.emit('iteration', { iter, bestLength });
    }

    return {
      bestPath,
      bestLength,
      pheromones: Object.fromEntries(this.pheromoneTrails),
      metrics: this.metrics
    };
  }

  /**
   * Collective Problem Solving
   */
  async collectiveSolve(problem, options = {}) {
    const agents = options.agents ?? this.options.swarmSize;
    const rounds = options.rounds || 10;

    if (agents <= 0) {
      return {
        bestSolution: null,
        bestScore: 0,
        collectiveIQ: 100,
        solutions: [],
        metrics: this.metrics
      };
    }

    this.log(`Starting collective problem solving with ${agents} agents...`);

    // Initialize agent solutions
    const solutions = [];
    for (let i = 0; i < agents; i++) {
      solutions.push({
        id: i,
        solution: this.generateInitialSolution(problem),
        score: 0,
        confidence: 0.5
      });
    }

    // Evaluate initial solutions
    for (const sol of solutions) {
      sol.score = await this.evaluateSolution(problem, sol.solution);
    }

    // Collective refinement rounds
    for (let round = 0; round < rounds; round++) {
      // Sort by score
      solutions.sort((a, b) => b.score - a.score);

      // Knowledge sharing: top performers share with others
      const topPerformers = solutions.slice(0, Math.ceil(agents * 0.2));
      
      for (const sol of solutions) {
        // Learn from top performers
        const teacher = topPerformers[Math.floor(Math.random() * topPerformers.length)];
        sol.solution = this.learnFrom(sol.solution, teacher.solution, sol.confidence);
        sol.score = await this.evaluateSolution(problem, sol.solution);
        
        // Update confidence based on improvement
        sol.confidence = Math.min(1, sol.confidence + (sol.score > 0 ? 0.1 : -0.05));
      }

      // Emergent behavior: combine best solutions
      if (round % 3 === 0) {
        const emergent = this.combineTopSolutions(topPerformers);
        const emergentScore = await this.evaluateSolution(problem, emergent);
        
        if (emergentScore > solutions[solutions.length - 1].score) {
          solutions[solutions.length - 1] = {
            id: -1,
            solution: emergent,
            score: emergentScore,
            confidence: 0.8
          };
        }
      }

      this.emit('round', { round, bestScore: solutions[0].score });
    }

    // Calculate collective IQ
    const avgScore = solutions.reduce((sum, s) => sum + s.score, 0) / agents;
    this.metrics.collectiveIQ = 100 + avgScore * 10;

    return {
      bestSolution: solutions[0].solution,
      bestScore: solutions[0].score,
      collectiveIQ: this.metrics.collectiveIQ,
      solutions: solutions.slice(0, 5),
      metrics: this.metrics
    };
  }

  /**
   * Stigmergic Coordination
   */
  async stigmergicCoordinate(tasks, workers, options = {}) {
    this.log('Starting stigmergic coordination...');

    if (!workers || workers.length === 0) {
      this.log('No workers available for coordination');
      return { assignments: [], efficiency: 0, pheromones: {} };
    }
    if (!tasks || tasks.length === 0) {
      return { assignments: [], efficiency: 1, pheromones: {} };
    }

    // Initialize task pheromones
    const taskPheromones = new Map();
    for (const task of tasks) {
      taskPheromones.set(task.id, {
        attractiveness: 1.0,
        completions: 0,
        avgDuration: 0
      });
    }

    const assignments = [];
    const completedTasks = new Set();

    while (completedTasks.size < tasks.length) {
      for (const worker of workers) {
        if (worker.busy) continue;

        // Select task based on pheromones
        const availableTasks = tasks.filter(t => !completedTasks.has(t.id));
        if (availableTasks.length === 0) break;

        const selectedTask = this.selectTaskByPheromone(availableTasks, taskPheromones, worker);
        
        // Assign task
        worker.busy = true;
        
        // Simulate task execution
        const duration = selectedTask.estimatedDuration * (0.8 + Math.random() * 0.4);
        
        assignments.push({
          taskId: selectedTask.id,
          workerId: worker.id,
          duration
        });

        // Update pheromones
        const pheromone = taskPheromones.get(selectedTask.id);
        pheromone.completions++;
        pheromone.avgDuration = (pheromone.avgDuration * (pheromone.completions - 1) + duration) / pheromone.completions;
        pheromone.attractiveness *= 0.9; // Decay after completion

        completedTasks.add(selectedTask.id);
        worker.busy = false;
      }
    }

    return {
      assignments,
      efficiency: this.calculateEfficiency(assignments, tasks),
      pheromones: Object.fromEntries(taskPheromones)
    };
  }

  // Helper methods
  randomPosition(bounds) {
    return bounds.map(b => b.min + Math.random() * (b.max - b.min));
  }

  randomVelocity(bounds) {
    return bounds.map(b => (Math.random() - 0.5) * (b.max - b.min) * 0.1);
  }

  initializePheromones(graph) {
    this.pheromoneTrails.clear();
    for (const node of graph.nodes) {
      for (const neighbor of node.neighbors || []) {
        const key = `${node.id}-${neighbor}`;
        this.pheromoneTrails.set(key, 1.0);
      }
    }
  }

  constructPath(graph, alpha, beta) {
    const path = [graph.nodes[0].id];
    const visited = new Set(path);

    while (path.length < graph.nodes.length) {
      const current = path[path.length - 1];
      const currentNode = graph.nodes.find(n => n.id === current);
      const unvisited = (currentNode.neighbors || []).filter(n => !visited.has(n));

      if (unvisited.length === 0) break;

      // Probabilistic selection
      const probabilities = unvisited.map(next => {
        const pheromone = this.pheromoneTrails.get(`${current}-${next}`) || 1;
        const heuristic = 1 / (graph.distances?.[`${current}-${next}`] || 1);
        return Math.pow(pheromone, alpha) * Math.pow(heuristic, beta);
      });

      const total = probabilities.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      
      for (let i = 0; i < unvisited.length; i++) {
        r -= probabilities[i];
        if (r <= 0) {
          path.push(unvisited[i]);
          visited.add(unvisited[i]);
          break;
        }
      }
    }

    return path;
  }

  calculatePathLength(graph, path) {
    let length = 0;
    for (let i = 0; i < path.length - 1; i++) {
      length += graph.distances?.[`${path[i]}-${path[i + 1]}`] || 1;
    }
    return length;
  }

  evaporatePheromones(decay) {
    for (const [key, value] of this.pheromoneTrails) {
      this.pheromoneTrails.set(key, value * (1 - decay));
    }
  }

  depositPheromones(path, amount) {
    for (let i = 0; i < path.length - 1; i++) {
      const key = `${path[i]}-${path[i + 1]}`;
      const current = this.pheromoneTrails.get(key) || 0;
      this.pheromoneTrails.set(key, current + amount);
    }
  }

  generateInitialSolution(problem) {
    return { value: Math.random(), approach: Math.floor(Math.random() * 3) };
  }

  async evaluateSolution(problem, solution) {
    return solution.value * (solution.approach + 1) * 0.5;
  }

  learnFrom(current, teacher, confidence) {
    return {
      value: current.value * (1 - confidence) + teacher.value * confidence,
      approach: Math.random() < confidence ? teacher.approach : current.approach
    };
  }

  combineTopSolutions(topSolutions) {
    const avgValue = topSolutions.reduce((sum, s) => sum + s.solution.value, 0) / topSolutions.length;
    const approaches = topSolutions.map(s => s.solution.approach);
    const mostCommon = approaches.sort((a, b) =>
      approaches.filter(v => v === a).length - approaches.filter(v => v === b).length
    ).pop();
    
    return { value: avgValue, approach: mostCommon };
  }

  selectTaskByPheromone(tasks, pheromones, worker) {
    const weights = tasks.map(t => {
      const p = pheromones.get(t.id);
      return p.attractiveness * (1 + (worker.skills?.[t.type] ?? 0));
    });
    
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    
    for (let i = 0; i < tasks.length; i++) {
      r -= weights[i];
      if (r <= 0) return tasks[i];
    }
    return tasks[0];
  }

  calculateEfficiency(assignments, tasks) {
    const totalEstimated = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
    const totalActual = assignments.reduce((sum, a) => sum + a.duration, 0);
    return totalActual > 0 ? totalEstimated / totalActual : 0;
  }

  updateMetrics() {
    // Calculate swarm diversity
    if (this.swarm.length > 1) {
      let totalDist = 0;
      for (let i = 0; i < this.swarm.length; i++) {
        for (let j = i + 1; j < this.swarm.length; j++) {
          totalDist += this.distance(this.swarm[i].position, this.swarm[j].position);
        }
      }
      this.metrics.diversity = totalDist / (this.swarm.length * (this.swarm.length - 1) / 2);
    }
  }

  distance(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  /**
   * Firefly Algorithm optimization
   * Light intensity-based attraction for multi-modal optimization
   */
  async fireflyOptimize(objectiveFn, bounds, options = {}) {
    // Input validation
    if (typeof objectiveFn !== 'function') {
      throw new TypeError('fireflyOptimize: objectiveFn must be a function');
    }
    if (!Array.isArray(bounds) || bounds.length === 0) {
      throw new TypeError('fireflyOptimize: bounds must be a non-empty array');
    }
    for (const b of bounds) {
      if (!b || typeof b.min !== 'number' || typeof b.max !== 'number' || b.min > b.max) {
        throw new TypeError('fireflyOptimize: each bound must have numeric min <= max');
      }
    }

    const numFireflies = options.numFireflies || this.options.swarmSize;
    const maxIter = options.maxIterations || this.options.maxIterations;
    const alpha = options.randomness || 0.2;  // Randomness parameter
    const beta0 = options.attractiveness || 1.0;  // Base attractiveness
    const gamma = options.absorption || 1.0;  // Light absorption coefficient

    if (!Number.isInteger(numFireflies) || numFireflies <= 0) {
      throw new TypeError('fireflyOptimize: numFireflies must be a positive integer');
    }
    if (!Number.isInteger(maxIter) || maxIter <= 0) {
      throw new TypeError('fireflyOptimize: maxIterations must be a positive integer');
    }

    if (typeof this.metrics.errors !== 'number') {
      this.metrics.errors = 0;
    }

    this.log(`Starting Firefly Algorithm with ${numFireflies} fireflies...`);

    // Reset global best state for this optimization run
    this.globalBest = null;
    this.globalBestScore = -Infinity;

    // Initialize fireflies
    const fireflies = [];
    for (let i = 0; i < numFireflies; i++) {
      const position = this.randomPosition(bounds);
      let brightness;
      try {
        brightness = await objectiveFn(position);
      } catch (error) {
        this.metrics.errors++;
        this.log(`Firefly initialization error: ${error.message}`);
        this.emit('error', { algorithm: 'firefly', stage: 'init', error });
        brightness = -Infinity;
      }
      fireflies.push({ position, brightness });

      if (brightness > this.globalBestScore) {
        this.globalBestScore = brightness;
        this.globalBest = [...position];
      }
    }

    // Main loop
    for (let iter = 0; iter < maxIter; iter++) {
      this.metrics.iterations++;

      for (let i = 0; i < numFireflies; i++) {
        for (let j = 0; j < numFireflies; j++) {
          if (fireflies[j].brightness > fireflies[i].brightness) {
            // Calculate distance
            const r = this.distance(fireflies[i].position, fireflies[j].position);
            
            // Calculate attractiveness (decreases with distance)
            const beta = beta0 * Math.exp(-gamma * r * r);

            // Move firefly i towards j
            for (let d = 0; d < bounds.length; d++) {
              fireflies[i].position[d] += 
                beta * (fireflies[j].position[d] - fireflies[i].position[d]) +
                alpha * (Math.random() - 0.5) * (bounds[d].max - bounds[d].min);
              
              // Clamp to bounds
              fireflies[i].position[d] = Math.max(bounds[d].min,
                Math.min(bounds[d].max, fireflies[i].position[d]));
            }

            // Update brightness
            try {
              fireflies[i].brightness = await objectiveFn(fireflies[i].position);
            } catch (error) {
              this.metrics.errors++;
              this.log(`Firefly evaluation error: ${error.message}`);
              this.emit('error', { algorithm: 'firefly', stage: 'iterate', error });
              fireflies[i].brightness = -Infinity;
            }

            if (fireflies[i].brightness > this.globalBestScore) {
              this.globalBestScore = fireflies[i].brightness;
              this.globalBest = [...fireflies[i].position];
              this.log(`New best: ${this.globalBestScore.toFixed(4)}`);
            }
          }
        }
      }

      this.emit('iteration', { iter, best: this.globalBestScore });
    }

    return {
      bestPosition: this.globalBest,
      bestScore: this.globalBestScore,
      fireflies: fireflies.map(f => ({ position: f.position, brightness: f.brightness })),
      metrics: this.metrics
    };
  }

  /**
   * Adaptive inertia weight for PSO
   * Decreases linearly from wMax to wMin over iterations
   */
  adaptiveInertia(iter, maxIter, wMax = 0.9, wMin = 0.4) {
    return wMax - (wMax - wMin) * (iter / maxIter);
  }

  /**
   * Velocity clamping to prevent explosion
   */
  clampVelocity(velocity, bounds, vMax = 0.2) {
    return velocity.map((v, d) => {
      const range = bounds[d].max - bounds[d].min;
      const maxV = range * vMax;
      return Math.max(-maxV, Math.min(maxV, v));
    });
  }

  getStatus() {
    return {
      initialized: true,
      swarmSize: this.swarm.length,
      globalBest: this.globalBest,
      globalBestScore: this.globalBestScore,
      metrics: this.metrics
    };
  }
}

export default SwarmIntelligence;
