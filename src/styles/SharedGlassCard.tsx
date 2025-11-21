// src/components/SharedGlassCard.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: object;
  blurAmount?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style, blurAmount = 25 }) => {
  return (
    <View style={[styles.wrapper, style]}>
      <BlurView style={styles.blur} blurType="light" blurAmount={blurAmount} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: 30,
    alignItems: 'center',
  },
});

export default GlassCard;
