import { useEffect } from 'react'
import { View, Image, Text, TouchableWithoutFeedback } from 'react-native'
import GAME_OVER from '../../../../assets/images/game-over.png'

import { styles } from './styles'

interface GameOverProps {
  handlebackToStart: () => void;
  score: number;
  maxScore: number;
}

const GameOver = ({ handlebackToStart, score, maxScore }: GameOverProps) => {
  useEffect(() => {
    setTimeout(() => {
      handlebackToStart()
    }, 3000)
  }, [])

  return (
    <View style={styles.container}>
      <Image source={GAME_OVER} style={styles.logo} />
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.scoreText}>Best Score: {maxScore}</Text>
      </View>
    </View>
  )
}

export { GameOver }
