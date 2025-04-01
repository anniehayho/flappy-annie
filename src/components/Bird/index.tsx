import { Image } from 'react-native'
import Matter from 'matter-js'

import { styles } from './styles'

const BIRD = require('../../assets/images/bird.png')

interface BirdProps {
  body: {
    bounds: {
      max: { x: number, y: number },
      min: { x: number, y: number }
    },
    position: { x: number, y: number }
  },
  color: string
}

const Bird = (props: BirdProps) => {
  const widthBody = props.body.bounds.max.x - props.body.bounds.min.x
  const heightBody = props.body.bounds.max.y - props.body.bounds.min.y

  const xBody = props.body.position.x - widthBody / 2
  const yBody = props.body.position.y - heightBody / 2

  const color = props.color

  return (
    <Image
      source={BIRD}
      style={
        styles({
          widthBody,
          heightBody,
          xBody,
          yBody,
          color
        }).bird
      }
    />
  )
}

interface World {
  // Define the properties of the world object if known
}

interface Position {
  x: number,
  y: number
}

interface Size {
  width: number,
  height: number
}

export default (world: World, color: string, pos: Position, size: Size) => {
  const initialBird = Matter.Bodies.rectangle(
    pos.x,
    pos.y,
    size.width,
    size.height,
    { label: 'Bird' }
  )

  Matter.World.add(world as Matter.World, [initialBird])

  return {
    body: initialBird,
    color,
    pos,
    renderer: <Bird body={{
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
    }} color={''} />
  }
}
