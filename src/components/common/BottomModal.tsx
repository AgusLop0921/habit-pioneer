import React, { useRef } from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Radius, Spacing } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const CLOSE_THRESHOLD = 80;

export default function BottomModal({ visible, onClose, children }: Props) {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 0,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy }) => {
        if (dy > CLOSE_THRESHOLD) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: theme.surface, borderColor: theme.border },
              { transform: [{ translateY }] },
            ]}
          >
            {/* Drag handle — captures the pan gesture */}
            <View style={styles.handleArea} {...panResponder.panHandlers}>
              <View style={[styles.handle, { backgroundColor: theme.border }]} />
            </View>
            <Pressable onPress={() => {}}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {children}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    maxHeight: '90%',
  },
  handleArea: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 99,
  },
});
