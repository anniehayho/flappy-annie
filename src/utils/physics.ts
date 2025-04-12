import { Dimensions } from 'react-native'
import Matter from 'matter-js'

import { getPipeSizePosPair } from './random'

const windowHeight = Dimensions.get('window').height
const windowWidth = Dimensions.get('window').width

// To track which pipes have been scored
let pipesScored = [false, false];

// Flag to track if collision listener is already added
let collisionListenerAdded = false;

// Define pipe type for TypeScript
interface Pipe {
  position: { x: number; y: number };
  isTop: boolean;
  height: number;
  width: number;
}

export const Physics = (entities: any, { touches, time, dispatch }: { touches: any, time: any, dispatch: any }) => {
  let engine = entities.physics.engine

  // Check if AI mode is active and AI controller exists
  const isAIMode = entities.aiMode?.active === true;
  const aiController = entities.aiController;
  
  // Get current score safely
  const currentScore = typeof entities.score === 'number' ? entities.score : 0;

  // If playing manually, handle touch events
  if (!isAIMode) {
    touches
      .filter((t: any) => t.type === 'press')
      .forEach((t: any) => {
        Matter.Body.setVelocity(entities.Bird.body, {
          x: 0,
          y: -4
        })
      })
  } else if (isAIMode && aiController) {
    // Prepare game state for AI
    const gameState = {
      bird: {
        position: {
          x: entities.Bird.body.position.x,
          y: entities.Bird.body.position.y
        },
        score: currentScore
      },
      pipes: [] as Pipe[]
    };

    // Add pipe data - collect both top and bottom pipes
    for (let i = 1; i <= 2; i++) {
      const topPipe = entities[`ObstacleTop${i}`];
      const bottomPipe = entities[`ObstacleBottom${i}`];

      if (topPipe && bottomPipe) {
        // Calculate width from bounds
        const topPipeWidth = topPipe.body.bounds.max.x - topPipe.body.bounds.min.x;
        const topPipeHeight = topPipe.body.bounds.max.y - topPipe.body.bounds.min.y;
        
        const bottomPipeWidth = bottomPipe.body.bounds.max.x - bottomPipe.body.bounds.min.x;
        const bottomPipeHeight = bottomPipe.body.bounds.max.y - bottomPipe.body.bounds.min.y;
        
        // Add top pipe to gameState
        gameState.pipes.push({
          position: { 
            x: topPipe.body.position.x, 
            y: topPipe.body.position.y 
          },
          isTop: true,
          height: topPipeHeight,
          width: topPipeWidth
        });

        // Add bottom pipe to gameState
        gameState.pipes.push({
          position: { 
            x: bottomPipe.body.position.x, 
            y: bottomPipe.body.position.y 
          },
          isTop: false,
          height: bottomPipeHeight,
          width: bottomPipeWidth
        });
        
        // Debug log pipe positions occasionally
        if (i === 1 && time.current % 100 < 1) {
          console.log(`Pipe ${i} positions - Top: (${topPipe.body.position.x}, ${topPipe.body.position.y}), Bottom: (${bottomPipe.body.position.x}, ${bottomPipe.body.position.y})`);
          console.log(`Pipe ${i} sizes - Top: ${topPipeWidth}x${topPipeHeight}, Bottom: ${bottomPipeWidth}x${bottomPipeHeight}`);
          
          // Calculate and log the gap
          const topBottom = topPipe.body.position.y + topPipeHeight/2;
          const bottomTop = bottomPipe.body.position.y - bottomPipeHeight/2;
          const gapHeight = bottomTop - topBottom;
          const gapCenter = topBottom + gapHeight/2;
          
          console.log(`Pipe ${i} gap: height=${gapHeight}, center=${gapCenter}`);
        }
      }
    }

    // Directly update the score in the AI controller if that method exists
    if (aiController.updateScore && typeof aiController.updateScore === 'function') {
      aiController.updateScore(currentScore);
    }

    // Let AI decide whether to jump
    const shouldJump = aiController.processGameState(gameState);
    
    if (shouldJump) {
      console.log("AI decided to jump!");
      Matter.Body.setVelocity(entities.Bird.body, {
        x: 0,
        y: -4
      });
    }
  }

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
      
      // If AI mode is active, log scoring
      if (isAIMode) {
        console.log(`AI scored a point! Score: ${currentScore + 1}`);
      }
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

  // Only add the collision listener once
  if (!collisionListenerAdded) {
    Matter.Events.on(engine, 'collisionStart', (event) => {
      // Log collision info for debugging
      if (isAIMode) {
        const birdPosition = entities.Bird.body.position;
        console.log(`Collision detected at bird position: (${birdPosition.x}, ${birdPosition.y})`);
      }
      
      dispatch({ type: 'game_over' });
      
      // Notify AI controller of game over if in AI mode
      if (isAIMode && aiController) {
        aiController.handleGameOver();
      }
    });
    collisionListenerAdded = true;
  }

  return entities
}
