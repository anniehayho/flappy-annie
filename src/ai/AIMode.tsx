import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';

interface AIModeProps {
  generation: number;
  currentFitness: number;
  bestScore: number;
  genomeIndex?: number;
  totalGenomes?: number;
  onForceEvolve?: () => void;
}

const { width } = Dimensions.get('window');

const AIMode: React.FC<AIModeProps> = ({ 
  generation, 
  currentFitness, 
  genomeIndex = 0,
  totalGenomes = 0,
  onForceEvolve
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.title}>AI Stats</Text>
        <Text style={styles.statText}>Generation: {generation}</Text>
        <Text style={styles.statText}>Current Fitness: {Math.floor(currentFitness)}</Text>
        <Text style={styles.statText}>Genome: {genomeIndex}/{totalGenomes}</Text>
        
        {onForceEvolve && (
          <TouchableOpacity 
            style={styles.evolveButton}
            onPress={onForceEvolve}
          >
            <Text style={styles.evolveButtonText}>Force Evolve</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 10,
  },
  statsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 10,
    minWidth: width * 0.4,
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  statText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 2,
  },
  evolveButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  evolveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  }
});

export default AIMode; 