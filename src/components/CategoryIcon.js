import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const FALLBACK_ICON = 'tag';

/**
 * Renders a category icon. Supports FontAwesome5 icon names (e.g. 'wallet', 'utensils').
 * If icon is an emoji string (e.g. '💰'), shows fallback FontAwesome icon.
 */
export default function CategoryIcon({ name, size = 24, color = '#333', style, iconStyle }) {
  const isFontAwesomeName =
    typeof name === 'string' &&
    name.length > 0 &&
    !/\p{Emoji}/u.test(name);

  if (isFontAwesomeName) {
    return (
      <FontAwesome5
        name={name}
        size={size}
        color={color}
        style={[style, iconStyle]}
        solid
      />
    );
  }

  return (
    <FontAwesome5
      name={FALLBACK_ICON}
      size={size}
      color={color}
      style={[style, iconStyle]}
      solid
    />
  );
}
