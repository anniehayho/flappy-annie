import { useEffect } from 'react'
import { View, Image, TouchableWithoutFeedback } from 'react-native'
import GAME_OVER from '../../../../assets/images/game-over.png'

import { styles } from './styles'

const GameOver = ({ handlebackToStart }: { handlebackToStart: () => void }) => {
  useEffect(() => {
    setTimeout(() => {
      handlebackToStart()
    }, 3000)
  }, [])

  return (
    <View style={styles.container}>
      <Image source={GAME_OVER} style={styles.logo} />
    </View>
  )
}

export { GameOver }
