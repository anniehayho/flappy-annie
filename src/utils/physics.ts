import { Dimensions } from 'react-native'
import Matter from 'matter-js'

import { getPipeSizePosPair } from './random'

const windowHeight = Dimensions.get('window').height
const windowWidth = Dimensions.get('window').width

// To track which pipes have been scored
let pipesScored = [false, false];

export const Physics = (entities: any, { touches, time, dispatch }: { touches: any, time: any, dispatch: any }) => {
  let engine = entities.physics.engine

  touches
    .filter((t: any) => t.type === 'press')
    .forEach((t: any) => {
      Matter.Body.setVelocity(entities.Bird.body, {
        x: 0,
        y: -4
      })
    })

  // Track whether bird has passed a pipe
  const birdX = entities.Bird.body.position.x;

  for (let index = 1; index <= 2; index++) {
    // Get array index (0 or 1)
    const pipeIndex = index - 1;
    
    // Check if bird has passed the pipe
    const pipeX = entities[`ObstacleTop${index}`].body.position.x;
    
    // Bird is past the pipe center (pipe is behind the bird)
    if (pipeX < birdX && !pipesScored[pipeIndex]) {
      pipesScored[pipeIndex] = true;
      dispatch({ type: 'score' });
    }
    
    if (entities[`ObstacleTop${index}`].body.bounds.max.x <= 0) {
      const pipeSizePos = getPipeSizePosPair(windowWidth * 0.9)
      
      // Reset scoring for this pipe
      pipesScored[pipeIndex] = false;

      Matter.Body.setPosition(
        entities[`ObstacleTop${index}`].body,
        pipeSizePos.pipeTop.pos
      )
      Matter.Body.setPosition(
        entities[`ObstacleBottom${index}`].body,
        pipeSizePos.pipeBottom.pos
      )
    }

    Matter.Body.translate(entities[`ObstacleTop${index}`].body, { x: -3, y: 0 })
    Matter.Body.translate(entities[`ObstacleBottom${index}`].body, {
      x: -3,
      y: 0
    })
  }

  Matter.Engine.update(engine, time.delta)

  Matter.Events.on(engine, 'collisionStart', () => {
    dispatch({ type: 'game_over' })
  })

  return entities
}
