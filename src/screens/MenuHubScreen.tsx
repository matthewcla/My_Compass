import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MenuHubScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Menu Hub</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Basic background
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
