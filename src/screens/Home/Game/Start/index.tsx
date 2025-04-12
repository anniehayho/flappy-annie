import { View, Image, TouchableWithoutFeedback, Text, TouchableOpacity } from 'react-native'

import { styles } from './styles'

import LOGO from '../../../../assets/images/logo.png'
import PLAY from '../../../../assets/images/play.png'

interface StartProps {
  handleOnStartGame: (withAI?: boolean) => void;
  aiModeAvailable?: boolean;
}

const Start = ({ handleOnStartGame, aiModeAvailable = false }: StartProps) => {
  return (
    <View style={styles.container}>
      <Image source={LOGO} style={styles.logo} />
      
      <TouchableWithoutFeedback onPress={() => handleOnStartGame(false)}>
        <Image source={PLAY} style={styles.playButton} />
      </TouchableWithoutFeedback>
      
      {aiModeAvailable && (
        <TouchableOpacity 
          style={styles.aiButton} 
          onPress={() => handleOnStartGame(true)}
        >
          <Text style={styles.aiButtonText}>Play with AI</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export { Start }
