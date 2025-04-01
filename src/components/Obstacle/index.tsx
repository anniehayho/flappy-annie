import { Image } from 'react-native'
import Matter from 'matter-js'
import { styles } from './styles'
import PIPE_GREEN from '../../assets/images/pipe-green.png'
import PIPE_GREEN_INVERTED from '../../assets/images/pipe-green-inverted.png'
import PIPE_ORANGE from '../../assets/images/pipe-orange.png'
import PIPE_ORANGE_INVERTED from '../../assets/images/pipe-orange-inverted.png'

const Obstacle = (props: { body: { bounds: { max: { x: number; y: number }; min: { x: number; y: number } }; position: { x: number; y: number } }; color: any; isTop: any }) => {
  const widthBody = props.body.bounds.max.x - props.body.bounds.min.x
  const heightBody = props.body.bounds.max.y - props.body.bounds.min.y

  const xBody = props.body.position.x - widthBody / 2
  const yBody = props.body.position.y - heightBody / 2

  const color = props.color

  return (
    <Image
      source={
        color === 'green'
          ? !props.isTop
            ? PIPE_GREEN
            : PIPE_GREEN_INVERTED
          : !props.isTop
          ? PIPE_ORANGE
          : PIPE_ORANGE_INVERTED
      }
      style={
        styles({
          widthBody,
          heightBody,
          xBody,
          yBody,
          color
        }).obstacle
      }
    />
  )
}

export default (world: Matter.World, label: any, color: any, pos: { x: number; y: number }, size: { width: number; height: number }, isTop = false) => {
  const initialObstacle = Matter.Bodies.rectangle(
    pos.x,
    pos.y,
    size.width,
    size.height,
    { label, isStatic: true }
  )

  Matter.World.add(world, [initialObstacle])

  return {
    body: initialObstacle,
    color,
    pos,
    isTop,
    renderer: <Obstacle body={{
      bounds: {
        max: {
          x: 0,
          y: 0
        },
        min: {
          x: 0,
          y: 0
        }
      },
      position: {
        x: 0,
        y: 0
      }
    }} color={undefined} isTop={undefined} />
  }
}
