// NEAT (NeuroEvolution of Augmenting Topologies) implementation for Flappy Bird

export interface Gene {
  in: number;
  out: number;
  weight: number;
  enabled: boolean;
  innovation: number;
}

export interface Neuron {
  id: number;
  value: number;
  connections: Gene[];
}

export class Genome {
  fitness: number = 0;
  score: number = 0;
  neurons: Map<number, Neuron> = new Map();
  genes: Gene[] = [];
  
  constructor() {
    // Initialize with basic structure: 4 input nodes + 1 bias node, 1 output node
    // Inputs: Bird Y, Nearest Pipe X, Nearest Pipe Top Y, Nearest Pipe Bottom Y
    // Outputs: Jump (> 0.5 means jump)
    
    // Input neurons (0-3) + bias (4)
    for (let i = 0; i < 5; i++) {
      this.neurons.set(i, { id: i, value: 0, connections: [] });
    }
    
    // Output neuron (5)
    this.neurons.set(5, { id: 5, value: 0, connections: [] });
    
    // Create initial connections from all inputs to output
    for (let i = 0; i < 5; i++) {
      this.genes.push({
        in: i,
        out: 5,
        weight: Math.random() * 2 - 1, // Random weight between -1 and 1
        enabled: true,
        innovation: i
      });
      
      const neuron = this.neurons.get(i);
      if (neuron) {
        neuron.connections.push(this.genes[i]);
      }
    }
  }
  
  clone(): Genome {
    const genome = new Genome();
    genome.fitness = this.fitness;
    genome.score = this.score;
    
    // Clone neurons
    genome.neurons = new Map();
    this.neurons.forEach((neuron, id) => {
      genome.neurons.set(id, { ...neuron, connections: [] });
    });
    
    // Clone genes
    genome.genes = this.genes.map(gene => ({ ...gene }));
    
    // Reconnect neurons to genes
    genome.genes.forEach(gene => {
      const neuron = genome.neurons.get(gene.in);
      if (neuron) {
        neuron.connections.push(gene);
      }
    });
    
    return genome;
  }
  
  // Feed forward neural network
  activate(inputs: number[]): boolean {
    // Set input values
    for (let i = 0; i < inputs.length; i++) {
      const neuron = this.neurons.get(i);
      if (neuron) {
        neuron.value = inputs[i];
      }
    }
    
    // Set bias neuron to 1
    const biasNeuron = this.neurons.get(4);
    if (biasNeuron) {
      biasNeuron.value = 1;
    }
    
    // Reset output neuron value
    const outputNeuron = this.neurons.get(5);
    if (outputNeuron) {
      outputNeuron.value = 0;
    }
    
    // Feed forward
    this.neurons.forEach((neuron, id) => {
      if (id < 5) {  // Input or bias neurons
        neuron.connections.forEach(gene => {
          if (gene.enabled) {
            const targetNeuron = this.neurons.get(gene.out);
            if (targetNeuron) {
              targetNeuron.value += neuron.value * gene.weight;
            }
          }
        });
      }
    });
    
    // Apply sigmoid activation function to output
    const output = this.neurons.get(5);
    if (output) {
      output.value = this.sigmoid(output.value);
      return output.value > 0.5;
    }
    return false;
  }
  
  // Sigmoid activation function
  sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
  
  // Mutate the genome
  mutate(): void {
    // 80% chance to mutate weights
    if (Math.random() < 0.8) {
      this.mutateWeights();
    }
    
    // 3% chance to add a connection
    if (Math.random() < 0.03) {
      this.addConnection();
    }
    
    // 1% chance to add a neuron
    if (Math.random() < 0.01) {
      this.addNeuron();
    }
  }
  
  // Mutate weights
  mutateWeights(): void {
    this.genes.forEach(gene => {
      // 90% chance to slightly modify weight
      if (Math.random() < 0.9) {
        gene.weight += (Math.random() * 0.2 - 0.1); // Small change between -0.1 and 0.1
        
        // Keep weights in range [-1, 1]
        if (gene.weight > 1) gene.weight = 1;
        if (gene.weight < -1) gene.weight = -1;
      } else {
        // 10% chance to assign a completely new weight
        gene.weight = Math.random() * 2 - 1;
      }
    });
  }
  
  // Add a new connection
  addConnection(): void {
    // Find two neurons that are not already connected
    const availableConnections: [number, number][] = [];
    
    this.neurons.forEach((neuronA, idA) => {
      this.neurons.forEach((neuronB, idB) => {
        // Only allow connections from inputs to outputs and hidden to outputs
        // Avoid connections to inputs and from outputs (feed-forward only)
        if (idA < 5 && idB === 5) {
          // Check if this connection already exists
          const exists = this.genes.some(gene => 
            gene.in === idA && gene.out === idB);
          
          if (!exists) {
            availableConnections.push([idA, idB]);
          }
        }
      });
    });
    
    if (availableConnections.length > 0) {
      const [inId, outId] = availableConnections[
        Math.floor(Math.random() * availableConnections.length)
      ];
      
      const newGene: Gene = {
        in: inId,
        out: outId,
        weight: Math.random() * 2 - 1,
        enabled: true,
        innovation: this.getNextInnovation()
      };
      
      this.genes.push(newGene);
      
      const inNeuron = this.neurons.get(inId);
      if (inNeuron) {
        inNeuron.connections.push(newGene);
      }
    }
  }
  
  // Add a new neuron by splitting an existing connection
  addNeuron(): void {
    if (this.genes.length === 0) {
      return;
    }
    
    // Select a random enabled connection to split
    const enabledGenes = this.genes.filter(gene => gene.enabled);
    if (enabledGenes.length === 0) {
      return;
    }
    
    const geneToSplit = enabledGenes[
      Math.floor(Math.random() * enabledGenes.length)
    ];
    
    // Disable the old connection
    geneToSplit.enabled = false;
    
    // Create a new neuron
    const newNeuronId = this.getNextNeuronId();
    this.neurons.set(newNeuronId, {
      id: newNeuronId,
      value: 0,
      connections: []
    });
    
    // Create two new connections
    const gene1: Gene = {
      in: geneToSplit.in,
      out: newNeuronId,
      weight: 1.0, // Weight from input to new neuron is 1
      enabled: true,
      innovation: this.getNextInnovation()
    };
    
    const gene2: Gene = {
      in: newNeuronId,
      out: geneToSplit.out,
      weight: geneToSplit.weight, // Keep the original weight
      enabled: true,
      innovation: this.getNextInnovation()
    };
    
    this.genes.push(gene1);
    this.genes.push(gene2);
    
    // Connect the new genes to neurons
    const inputNeuron = this.neurons.get(geneToSplit.in);
    if (inputNeuron) {
      inputNeuron.connections.push(gene1);
    }
    
    const newNeuron = this.neurons.get(newNeuronId);
    if (newNeuron) {
      newNeuron.connections.push(gene2);
    }
  }
  
  // Get next innovation number
  getNextInnovation(): number {
    return Math.max(...this.genes.map(gene => gene.innovation), -1) + 1;
  }
  
  // Get next neuron ID
  getNextNeuronId(): number {
    return Math.max(...Array.from(this.neurons.keys()), -1) + 1;
  }
  
  // Calculate fitness based on score
  calculateFitness(): void {
    this.fitness = this.score;
  }
}

export class Population {
  genomes: Genome[] = [];
  generation: number = 0;
  bestGenome: Genome | null = null;
  populationSize: number;
  
  constructor(size: number) {
    this.populationSize = size;
    this.initializePopulation();
  }
  
  initializePopulation(): void {
    for (let i = 0; i < this.populationSize; i++) {
      const genome = new Genome();
      this.genomes.push(genome);
    }
  }
  
  evolve(): void {
    // Calculate fitness for all genomes
    this.genomes.forEach(genome => {
      genome.calculateFitness();
    });
    
    // Sort genomes by fitness
    this.genomes.sort((a, b) => b.fitness - a.fitness);
    
    // Keep track of the best genome
    this.bestGenome = this.genomes[0].clone();
    
    // Create new population
    const newGenomes: Genome[] = [];
    
    // The top 10% of genomes survive to the next generation (elitism)
    const eliteCount = Math.max(1, Math.floor(this.populationSize * 0.1));
    for (let i = 0; i < eliteCount; i++) {
      newGenomes.push(this.genomes[i].clone());
    }
    
    // Fill the rest with children from crossover and mutation
    while (newGenomes.length < this.populationSize) {
      // Select parents (tournament selection)
      const parent1 = this.tournamentSelect();
      const parent2 = this.tournamentSelect();
      
      // Create child through crossover
      const child = this.crossover(parent1, parent2);
      
      // Mutate child
      child.mutate();
      
      newGenomes.push(child);
    }
    
    // Replace old population with new one
    this.genomes = newGenomes;
    this.generation++;
  }
  
  // Tournament selection
  tournamentSelect(): Genome {
    const tournamentSize = 3;
    let best: Genome | null = null;
    
    for (let i = 0; i < tournamentSize; i++) {
      const idx = Math.floor(Math.random() * this.genomes.length);
      const genome = this.genomes[idx];
      if (best === null || genome.fitness > best.fitness) {
        best = genome;
      }
    }
    
    return best!.clone();
  }
  
  // Crossover between two parents
  crossover(parent1: Genome, parent2: Genome): Genome {
    // The more fit parent is the primary parent
    if (parent2.fitness > parent1.fitness) {
      [parent1, parent2] = [parent2, parent1];
    }
    
    const child = new Genome();
    
    // Copy all neurons from the more fit parent
    child.neurons = new Map();
    parent1.neurons.forEach((neuron, id) => {
      child.neurons.set(id, { ...neuron, connections: [] });
    });
    
    // Clear genes before crossover
    child.genes = [];
    
    // Crossover genes
    const innovationP2 = new Map<number, Gene>();
    parent2.genes.forEach(gene => {
      innovationP2.set(gene.innovation, gene);
    });
    
    parent1.genes.forEach(gene1 => {
      const gene2 = innovationP2.get(gene1.innovation);
      
      if (gene2 && gene2.enabled && Math.random() < 0.5) {
        // Take gene from parent2
        const newGene = { ...gene2 };
        child.genes.push(newGene);
        
        // Add connection to neuron
        const neuron = child.neurons.get(newGene.in);
        if (neuron) {
          neuron.connections.push(newGene);
        } else {
          // Create neuron if it doesn't exist
          child.neurons.set(newGene.in, { 
            id: newGene.in, 
            value: 0, 
            connections: [newGene] 
          });
        }
      } else {
        // Take gene from parent1
        const newGene = { ...gene1 };
        child.genes.push(newGene);
        
        // Add connection to neuron
        const neuron = child.neurons.get(newGene.in);
        if (neuron) {
          neuron.connections.push(newGene);
        } else {
          // Create neuron if it doesn't exist
          child.neurons.set(newGene.in, { 
            id: newGene.in, 
            value: 0, 
            connections: [newGene] 
          });
        }
      }
    });
    
    return child;
  }
  
  // Get the current best genome
  getBest(): Genome {
    return this.genomes[0];
  }
} 