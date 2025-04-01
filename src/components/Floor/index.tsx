import { View } from 'react-native'
import Matter from 'matter-js'
import { styles } from './styles'

interface FloorProps {
  body: {
    bounds: {
      max: { x: number, y: number },
      min: { x: number, y: number }
    },
    position: { x: number, y: number }
  },
  color: string
}

const Floor = (props: FloorProps) => {
  const widthBody = props.body.bounds.max.x - props.body.bounds.min.x
  const heightBody = props.body.bounds.max.y - props.body.bounds.min.y

  const xBody = props.body.position.x - widthBody / 2
  const yBody = props.body.position.y - heightBody / 2

  const color = props.color

  return (
    <View
      style={
        styles({
          widthBody,
          heightBody,
          xBody,
          yBody,
          color
        }).floor
      }
    />
  )
}

export default (world: Matter.World, color: string, pos: Matter.Vector, size: Matter.Vector) => {
  const initialFloor = Matter.Bodies.rectangle(
    pos.x,
    pos.y,
    size.width,
    size.height,
    { label: 'Floor', isStatic: true }
  )

  Matter.World.add(world, [initialFloor])

  return {
    body: initialFloor,
    color,
    pos,
    renderer: <Floor body={{
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
