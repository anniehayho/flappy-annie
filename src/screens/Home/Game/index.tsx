import { useRef, useState, useEffect } from 'react'
import { GameEngine } from 'react-native-game-engine'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { View, Text, TouchableOpacity } from 'react-native'

import { styles } from './styles'

import { Start } from './Start'
import { GameOver } from './GameOver'
import { Physics } from '../../../utils/physics'

import entities from '../../../entities'
import { AIController, AIMode } from '../../../ai'

const STORAGE_KEY = '@flappy_annie_max_score'

// Create a global AI controller that persists between renders
let globalAIController: AIController | null = null;

const Game = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [aiMode, setAiMode] = useState(false)
  const [consecutiveZeros, setConsecutiveZeros] = useState(0)
  const [aiStats, setAiStats] = useState({
    generation: 0,
    currentFitness: 0,
    bestScore: 0,
    genomeIndex: 0,
    totalGenomes: 0
  })

  // Create a ref to the GameEngine
  const gameEngineRef = useRef<GameEngine | null>(null)

  // Initialize AI controller on component mount if it doesn't exist
  useEffect(() => {
    // Load max score from AsyncStorage
    loadMaxScore()
    
    // Initialize global AI controller if it doesn't exist
    if (!globalAIController) {
      console.log("Creating global AI controller")
      globalAIController = new AIController(50)
    }
    
    // Set up an interval to update AI stats
    const statUpdateInterval = setInterval(() => {
      if (aiMode && globalAIController) {
        updateAIStats()
      }
    }, 500)
    
    // Clean up event listeners on unmount
    return () => {
      clearInterval(statUpdateInterval)
    }
  }, [])
  
  // Update AI stats whenever aiMode changes
  useEffect(() => {
    if (aiMode && globalAIController) {
      updateAIStats()
    }
  }, [aiMode])

  // Update AI stats from the controller
  const updateAIStats = () => {
    if (!globalAIController) return
    
    setAiStats({
      generation: globalAIController.getGeneration(),
      currentFitness: globalAIController.getCurrentFitness(),
      bestScore: globalAIController.getBestScore(),
      genomeIndex: globalAIController.getCurrentGenomeIndex(),
      totalGenomes: globalAIController.getPopulationSize()
    })
  }

  const loadMaxScore = async () => {
    try {
      const savedScore = await AsyncStorage.getItem(STORAGE_KEY)
      if (savedScore !== null) {
        setMaxScore(parseInt(savedScore, 10))
      }
    } catch (error) {
      console.log('Error loading max score:', error)
    }
  }

  const saveMaxScore = async (newScore: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newScore.toString())
    } catch (error) {
      console.log('Error saving max score:', error)
    }
  }

  const handlebackToStart = () => {
    setIsRunning(false)
    setIsGameOver(false)
    setScore(0)
    setConsecutiveZeros(0)
  }

  const handleOnStartGame = (withAI: boolean = false) => {
    console.log(`Starting game with AI: ${withAI}`);
    setIsRunning(true)
    setIsGameOver(false)
    setScore(0)
    setAiMode(withAI)
    setConsecutiveZeros(0)
    
    // If AI mode is enabled, prepare the AI
    if (withAI && globalAIController) {
      // Start with the next genome but don't reset the entire population
      if (globalAIController.getCurrentGenomeIndex() >= globalAIController.getPopulationSize() - 1) {
        // We've gone through all genomes in this population, force next generation
        console.log("Reached end of genomes, evolving to next generation")
        globalAIController.forceEvolveToNextGeneration()
      } else {
        // Just start with the next genome
        globalAIController.startNextGenome()
      }
      
      updateAIStats()
    }
  }

  const handleForceEvolve = () => {
    if (globalAIController) {
      // Force evolution to next generation
      globalAIController.forceEvolveToNextGeneration();
      
      // Reset the game with AI mode
      setIsRunning(false);
      setTimeout(() => {
        handleOnStartGame(true);
      }, 100);
    }
  }

  const handleOnGameOver = () => {
    console.log(`Game over with score: ${score}`);
    setIsRunning(false)
    setIsGameOver(true)
    
    // Update max score if current score is higher
    if (score > maxScore) {
      setMaxScore(score)
      saveMaxScore(score)
    }
    
    // Check consecutive zeros for AI mode
    if (aiMode && score === 0) {
      setConsecutiveZeros(prev => prev + 1);
      
      // Force regenerate population after 15 consecutive failures
      if (consecutiveZeros >= 15 && globalAIController) {
        console.log("Too many consecutive failures. Generating new population.");
        globalAIController.reset();
        updateAIStats();
      }
    } else {
      setConsecutiveZeros(0);
    }

    // After updating maxScore
    if (aiMode && globalAIController && score > globalAIController.getBestScore()) {
      globalAIController.updateScore(score);
      updateAIStats();
    }
  }

  const handleOnEvent = (event: any) => {
    switch (event.type) {
      case 'game_over':
        handleOnGameOver()
        break
      case 'score':
        const newScore = score + 1;
        setScore(newScore)
        
        // Update score for AI safely
        if (aiMode && globalAIController) {
          try {
            // Don't try to update the gameEngine entities directly
            globalAIController.updateScore(newScore);
            updateAIStats();
            console.log(`Updated score to ${newScore} for AI`);
          } catch (error) {
            console.error("Error updating score for AI:", error);
          }
        }
        break
    }
  }

  if (!isRunning && !isGameOver) {
    return (
      <Start 
        handleOnStartGame={handleOnStartGame} 
        aiModeAvailable={true}
      />
    )
  }
  if (!isRunning && isGameOver) {
    return <GameOver handlebackToStart={handlebackToStart} score={score} maxScore={maxScore} />
  }

  // Make sure globalAIController is initialized
  if (aiMode && !globalAIController) {
    console.log("Creating global AI controller (fall-back)");
    globalAIController = new AIController(50);
    globalAIController.startNextGenome();
    updateAIStats();
  }

  // Add the aiMode and aiController to entities for the physics system
  const gameEntities = {
    ...entities(),
    aiMode: { active: aiMode },
    aiController: globalAIController,
    score: score  // Pass score to entities for AI
  };

  return (
    <View style={styles.container}>
      <View style={styles.scoreDisplay}>
        <Text style={styles.scoreText}>Thuy Trang's Score: {score}</Text>
      </View>
      
      {aiMode && globalAIController && (
        <AIMode 
          generation={aiStats.generation}
          currentFitness={aiStats.currentFitness}
          bestScore={aiStats.bestScore}
          genomeIndex={aiStats.genomeIndex}
          totalGenomes={aiStats.totalGenomes}
          onForceEvolve={handleForceEvolve}
        />
      )}
      
      <GameEngine
        systems={[Physics]}
        ref={gameEngineRef}
        running={isRunning}
        entities={gameEntities}
        onEvent={handleOnEvent}
        style={styles.engineContainer}
      />
    </View>
  )
}

export { Game }
