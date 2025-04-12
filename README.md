# Flappy Annie Game with NEAT AI

This is a Flappy Bird-style game built with React Native and Expo, featuring an AI player powered by NEAT (NeuroEvolution of Augmenting Topologies).

## Features

- Classic Flappy Bird gameplay
- AI mode that uses NEAT to learn how to play the game
- Neural networks evolve over generations for improved performance
- Toggle between manual play and AI mode
- View AI stats including generation number, best score, and current score

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## How the AI Works

The game uses a simplified implementation of NEAT (NeuroEvolution of Augmenting Topologies), a genetic algorithm that evolves neural networks.

### Neural Network Structure

- **Inputs**: Bird Y position, Bird velocity, Distance to next pipe, Pipe gap position
- **Hidden Layer**: 8 neurons with sigmoid activation
- **Output**: Jump decision (> 0.5 triggers a jump)

### Evolution Process

1. The AI starts with a population of neural networks with random weights
2. Each network takes a turn controlling the bird
3. Networks earn fitness points based on distance traveled
4. After the entire population has played, the best performers are selected
5. Offspring are created through crossover and mutation
6. The process repeats for multiple generations

### Using AI Mode

1. Tap the AI button in the top-right corner to toggle AI control
2. When active, the AI will control the bird automatically
3. View the current generation, best score, and current score

## Technical Details

- Built with React Native and Expo
- Uses Matter.js for physics
- Game state managed with React hooks
- AI implemented in TypeScript without external ML libraries
- Best genomes are saved to device storage for continuous improvement

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
