import { ImageBackground } from 'react-native'
import { styles } from './styles'
import BACKGROUND from '../assets/images/background.png'
import { Game } from './Home/Game'

const Home = () => {
  return (
    <ImageBackground source={BACKGROUND} style={styles.container}>
      <Game />
    </ImageBackground>
  )
}

export { Home }
