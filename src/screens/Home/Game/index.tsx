import { useRef, useState, useEffect } from 'react'
import { GameEngine } from 'react-native-game-engine'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { View, Text } from 'react-native'

import { styles } from './styles'

import { Start } from './Start'
import { GameOver } from './GameOver'
import { Physics } from '../../../utils/physics'

import entities from '../../../entities'

const STORAGE_KEY = '@flappy_annie_max_score'

const Game = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)

  const gameEngineRef = useRef()

  useEffect(() => {
    // Load max score from AsyncStorage when component mounts
    loadMaxScore()
  }, [])

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
  }

  const handleOnStartGame = () => {
    setIsRunning(true)
    setIsGameOver(false)
    setScore(0)
  }

  const handleOnGameOver = () => {
    setIsRunning(false)
    setIsGameOver(true)
    
    // Update max score if current score is higher
    if (score > maxScore) {
      setMaxScore(score)
      saveMaxScore(score)
    }
  }

  const handleOnEvent = (event: any) => {
    switch (event.type) {
      case 'game_over':
        handleOnGameOver()
        break
      case 'score':
        setScore(score + 1)
        break
    }
  }

  if (!isRunning && !isGameOver) {
    return <Start handleOnStartGame={handleOnStartGame} />
  }
  if (!isRunning && isGameOver) {
    return <GameOver handlebackToStart={handlebackToStart} score={score} maxScore={maxScore} />
  }

  return (
    <View style={styles.container}>
      <View style={styles.scoreDisplay}>
        <Text style={styles.scoreText}>Your Score: {score}</Text>
      </View>
      <GameEngine
        systems={[Physics]}
        ref={gameEngineRef as any}
        running={isRunning}
        entities={entities()}
        onEvent={handleOnEvent}
        style={styles.engineContainer}
      />
    </View>
  )
}

export { Game }
