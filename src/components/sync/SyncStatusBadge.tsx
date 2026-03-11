/**
 * SyncStatusBadge.tsx
 *
 * Non-intrusive indicator showing the current sync status.
 * Only visible in cloud mode. Appears in top-right of the screen.
 * - idle + synced: cloud checkmark (fades away)
 * - syncing: animated cloud-upload
 * - error: orange warning dot
 * - offline: grey cloud-offline
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, selectIsCloudMode } from '../../store/authStore';
import type { SyncStatus } from '../../store/authStore';

const STATUS_ICONS: Record<SyncStatus, { name: any; color: string }> = {
  idle:     { name: 'cloud-done-outline',   color: '#22C55E' },
  syncing:  { name: 'cloud-upload-outline', color: '#6366f1' },
  error:    { name: 'cloud-offline-outline', color: '#F59E0B' },
  offline:  { name: 'cloud-offline-outline', color: '#6B7280' },
};

export default function SyncStatusBadge() {
  const isCloud = useAuthStore(selectIsCloudMode);
  const syncStatus = useAuthStore((s) => s.syncStatus);
  const opacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  // Show badge whenever status changes, then fade after 3s when idle
  useEffect(() => {
    if (!isCloud) return;

    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    if (syncStatus === 'syncing') {
      // Pulsing animation while syncing
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.6, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse.setValue(1);
      if (syncStatus === 'idle') {
        // Fade out after 3s when idle (sync complete)
        const timer = setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [syncStatus, isCloud]);

  if (!isCloud) return null;

  const { name, color } = STATUS_ICONS[syncStatus];

  return (
    <Animated.View style={[s.badge, { opacity }]}>
      <Animated.View style={{ opacity: pulse }}>
        <Ionicons name={name} size={16} color={color} />
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
