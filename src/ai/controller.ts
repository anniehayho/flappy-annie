import { Dimensions } from 'react-native'
import { Genome, Population } from './neat'

const windowHeight = Dimensions.get('window').height
const windowWidth = Dimensions.get('window').width

interface GameState {
  bird: {
    position: {
      x: number;
      y: number;
    };
    score?: number;  // Make score optional
  };
  pipes: Array<{
    position: {
      x: number;
      y: number;
    };
    isTop: boolean;
    height: number;
    width: number;
  }>;
}

export class AIController {
  private population: Population;
  private currentGenome: Genome | null = null;
  private currentGenomeIndex: number = 0;
  private frameCount: number = 0;
  
  private bestScore: number = 0;
  private generation: number = 0;
  private currentScore: number = 0;  // Track the score internally
  private totalGenomesTested: number = 0; // Track total genomes tested
  
  // Debug flags
  private debugMode: boolean = true;
  private lastJumpY: number = 0;
  private jumpCooldown: number = 0;
  private maxFramesPerGenome: number = 1000; // Force next genome after this many frames
  
  constructor(populationSize: number = 50) {
    this.population = new Population(populationSize);
    console.log(`Created new AI population with size ${populationSize}`);
  }

  // Get the current generation number
  getGeneration(): number {
    return this.generation;
  }
  
  // Get the current genome's fitness score
  getCurrentFitness(): number {
    return this.currentGenome ? this.currentGenome.fitness : 0;
  }
  
  // Get the best score achieved so far
  getBestScore(): number {
    return this.bestScore;
  }
  
  // Get current genome index
  getCurrentGenomeIndex(): number {
    return this.currentGenomeIndex;
  }
  
  // Get population size
  getPopulationSize(): number {
    return this.population.populationSize;
  }
  
  // Start the AI with a new genome
  startNextGenome(): void {
    if (this.currentGenomeIndex >= this.population.genomes.length) {
      // All genomes have been tested, evolve to next generation
      this.evolvePopulation();
      this.currentGenomeIndex = 0;
    }
    
    this.currentGenome = this.population.genomes[this.currentGenomeIndex];
    this.frameCount = 0;
    this.currentScore = 0;  // Reset current score
    this.currentGenomeIndex++;
    this.totalGenomesTested++;
    
    if (this.debugMode) {
      console.log(`Starting genome ${this.currentGenomeIndex} of ${this.population.genomes.length} (Generation ${this.generation})`);
      console.log(`Total genomes tested: ${this.totalGenomesTested}`);
    }
  }
  
  // Evolve the population to the next generation
  evolvePopulation(): void {
    console.log(`Evolving population from generation ${this.generation} to ${this.generation + 1}`);
    console.log(`Population before evolution: ${this.population.genomes.length} genomes`);
    
    // Check for valid population
    if (this.population.genomes.length === 0) {
      console.error("Cannot evolve empty population. Reinitializing...");
      this.population.initializePopulation();
      return;
    }
    
    try {
      this.population.evolve();
      this.generation++;
      
      // Update best score
      const bestGenome = this.population.bestGenome;
      if (bestGenome && bestGenome.score > this.bestScore) {
        this.bestScore = bestGenome.score;
        
        if (this.debugMode) {
          console.log(`New best score: ${this.bestScore} (Generation ${this.generation})`);
        }
      }
      
      console.log(`Successfully evolved to generation ${this.generation}`);
      console.log(`Population after evolution: ${this.population.genomes.length} genomes`);
    } catch (error) {
      console.error("Error during evolution:", error);
    }
  }
  
  // Force evolution to the next generation
  forceEvolveToNextGeneration(): void {
    console.log("Forcing evolution to next generation");
    this.evolvePopulation();
    this.currentGenomeIndex = 0;
    this.startNextGenome();
  }
  
  // Reset the AI controller
  reset(): void {
    console.log("Resetting AI controller completely");
    this.population = new Population(this.population.populationSize);
    this.currentGenome = null;
    this.currentGenomeIndex = 0;
    this.frameCount = 0;
    this.currentScore = 0;
    this.bestScore = 0;
    this.generation = 0;
    this.totalGenomesTested = 0;
    
    if (this.debugMode) {
      console.log("AI controller reset complete");
    }
  }
  
  // Update the current score
  updateScore(score: number): void {
    if (score > this.currentScore) {
      // Score increased, update fitness accordingly
      if (this.currentGenome) {
        this.currentGenome.fitness += 500; // Big bonus for scoring
      }
    }
    
    this.currentScore = score;
    if (this.currentGenome) {
      this.currentGenome.score = score;
    }
  }
  
  // Process game state and decide whether to jump
  processGameState(gameState: GameState): boolean {
    if (!this.currentGenome) {
      this.startNextGenome();
      return false;
    }
    
    // Extract score from game state safely
    if (gameState.bird && typeof gameState.bird.score === 'number') {
      this.updateScore(gameState.bird.score);
    }
    
    // Check for stuck or long-running genome
    this.frameCount++;
    if (this.frameCount > this.maxFramesPerGenome) {
      console.log(`Genome ${this.currentGenomeIndex} timed out after ${this.frameCount} frames. Moving to next genome.`);
      this.handleGameOver();
      return false;
    }
    
    // Check for valid pipes
    if (!gameState.pipes || gameState.pipes.length === 0) {
      // If no pipes, make basic decisions based on height
      const birdY = gameState.bird.position.y;
      return birdY > windowHeight / 2; // Jump if below middle of screen
    }
    
    // Group pipes by their x position (to find pairs)
    const pipePairs = this.groupPipesByPosition(gameState.pipes);
    if (pipePairs.length === 0) {
      if (this.debugMode && this.frameCount % 60 === 0) {
        console.log("No valid pipe pairs found");
      }
      return false;
    }
    
    // Find the next pipe pair to navigate through
    const nextPipePair = this.findNextPipePair(pipePairs, gameState.bird.position.x);
    if (!nextPipePair) {
      if (this.debugMode && this.frameCount % 60 === 0) {
        console.log("No next pipe pair found");
      }
      return false;
    }
    
    // Log pipe pair info
    if (this.debugMode && this.frameCount % 60 === 0) {
      console.log(`Next pipe: x=${nextPipePair.x}, top=${nextPipePair.topY}, bottom=${nextPipePair.bottomY}, gap=${nextPipePair.gapCenter}`);
      console.log(`Bird at: x=${gameState.bird.position.x}, y=${gameState.bird.position.y}`);
    }
    
    // Extract input values for neural network
    const inputs = this.prepareInputsFromPipePair(gameState, nextPipePair);
    
    // Increase fitness (survival time)
    if (this.currentGenome) {
      this.currentGenome.fitness += 1; // Increase fitness just for surviving
      
      // Bonus fitness for being near the center of the gap
      const birdY = gameState.bird.position.y;
      const gapCenter = nextPipePair.gapCenter;
      const distance = Math.abs(birdY - gapCenter);
      
      if (distance < 50) {
        this.currentGenome.fitness += (50 - distance) / 50; // More reward the closer to center
      }
      
      // Use our tracked score rather than trying to pull from gameState
      this.currentGenome.score = this.currentScore;
    }
    
    // Reduce jump cooldown
    if (this.jumpCooldown > 0) {
      this.jumpCooldown--;
    }
    
    // For early generations, use simple heuristic alongside neural network
    let shouldJump = false;
    
    if (this.generation < 5) {
      // Simple heuristic: aim for the center of the gap
      const birdY = gameState.bird.position.y;
      const gapCenter = nextPipePair.gapCenter;
      
      // Jump if bird is below the gap center and not cooling down
      if (birdY > gapCenter + 20 && this.jumpCooldown <= 0) {
        shouldJump = true;
      }
      
      // Override with neural network occasionally to allow learning
      if (Math.random() < 0.3) {
        shouldJump = this.currentGenome ? this.currentGenome.activate(inputs) : false;
      }
    } else {
      // Later generations rely more on neural network
      shouldJump = this.currentGenome ? this.currentGenome.activate(inputs) : false;
    }
    
    // Implement a simple cooldown to prevent rapid jumping
    if (shouldJump && this.jumpCooldown > 0) {
      shouldJump = false;
    }
    
    // Set cooldown and record last jump position
    if (shouldJump) {
      this.jumpCooldown = 10; // Prevent jumping for next 10 frames
      this.lastJumpY = gameState.bird.position.y;
      
      if (this.debugMode && this.frameCount % 30 === 0) {
        console.log(`AI jumping at y=${gameState.bird.position.y}, gap center=${nextPipePair.gapCenter}`);
      }
    }
    
    // Safety overrides: prevent extreme positions
    const birdY = gameState.bird.position.y;
    if (birdY < 30) {  // Too high, don't jump
      shouldJump = false;
    } else if (birdY > windowHeight - 70) {  // Too low, force jump
      shouldJump = true;
      this.jumpCooldown = 5;
    }
    
    return shouldJump;
  }
  
  // Handle game over event
  handleGameOver(): void {
    if (this.debugMode) {
      console.log(`Game over. Score: ${this.currentScore}, Fitness: ${this.currentGenome?.fitness || 0}, Generation: ${this.generation}, Genome: ${this.currentGenomeIndex}/${this.population.populationSize}`);
    }
    
    // Every 10 genomes tested, force a generation evolution if no progress
    if (this.currentGenomeIndex > 0 && this.currentGenomeIndex % 10 === 0 && this.bestScore === 0) {
      console.log("No progress after 10 genomes. Forcing evolution to next generation.");
      this.forceEvolveToNextGeneration();
    } else {
      // Start the next genome
      this.startNextGenome();
    }
  }
  
  // Group pipes by their x position to find pairs (top and bottom pipes)
  private groupPipesByPosition(pipes: GameState['pipes']): Array<{
    x: number;
    topY: number;
    bottomY: number;
    gapCenter: number;
    width: number;
  }> {
    const tolerance = 20; // Allow small differences in x position
    const pipePairs: Array<{
      x: number;
      topY: number;
      bottomY: number;
      gapCenter: number;
      width: number;
    }> = [];
    
    // Find top pipes first
    const topPipes = pipes.filter(pipe => pipe.isTop);
    
    topPipes.forEach(topPipe => {
      // Find matching bottom pipe
      const bottomPipe = pipes.find(pipe => 
        !pipe.isTop && 
        Math.abs(pipe.position.x - topPipe.position.x) < tolerance
      );
      
      if (bottomPipe) {
        // Calculate gap center
        const topPipeBottom = topPipe.position.y + topPipe.height/2;
        const bottomPipeTop = bottomPipe.position.y - bottomPipe.height/2;
        const gapCenter = topPipeBottom + (bottomPipeTop - topPipeBottom) / 2;
        
        pipePairs.push({
          x: topPipe.position.x,
          topY: topPipe.position.y,
          bottomY: bottomPipe.position.y,
          gapCenter: gapCenter,
          width: topPipe.width
        });
      }
    });
    
    return pipePairs;
  }
  
  // Find the next pipe pair the bird needs to navigate through
  private findNextPipePair(pipePairs: Array<any>, birdX: number): any {
    // Filter pipe pairs that are in front of the bird
    const pairsInFront = pipePairs.filter(pair => pair.x > birdX - 30);
    
    if (pairsInFront.length === 0) {
      return null;
    }
    
    // Sort by x position to find the closest one
    pairsInFront.sort((a, b) => a.x - b.x);
    return pairsInFront[0];
  }
  
  // Prepare inputs for the neural network based on pipe pair
  private prepareInputsFromPipePair(gameState: GameState, pipePair: any): number[] {
    // Normalize inputs between 0 and 1
    
    // Bird Y position (normalized)
    const normalizedBirdY = gameState.bird.position.y / windowHeight;
    
    // Distance to pipe (normalized)
    const distanceToPipe = (pipePair.x - gameState.bird.position.x) / windowWidth;
    
    // Gap center position (normalized)
    const gapCenterY = pipePair.gapCenter / windowHeight;
    
    // Bird's vertical distance to gap center
    const birdToGapDistance = (gameState.bird.position.y - pipePair.gapCenter) / windowHeight;
    
    // Log inputs in debug mode
    if (this.debugMode && this.frameCount % 60 === 0) {
      console.log(`AI Inputs: birdY=${normalizedBirdY.toFixed(2)}, distToPipe=${distanceToPipe.toFixed(2)}, gapY=${gapCenterY.toFixed(2)}, birdToGap=${birdToGapDistance.toFixed(2)}`);
    }
    
    return [normalizedBirdY, distanceToPipe, gapCenterY, birdToGapDistance];
  }
} 