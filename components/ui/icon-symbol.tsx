// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'checkmark': 'check',
  'trash.fill': 'delete',
  'plus': 'add',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  'circle': 'radio-button-unchecked',
  'star.fill': 'star',
  'flag.fill': 'flag',
  'chart.bar.fill': 'bar-chart',
  'person.fill': 'person',
  'person.circle.fill': 'account-circle',
  // Profile screen icons
  'flame.fill': 'local-fire-department',
  'calendar': 'calendar-today',
  'birthday.cake.fill': 'cake',
  'envelope.fill': 'email',
  'pencil': 'edit',
  'bolt.fill': 'bolt',
  'trophy.fill': 'emoji-events',
  'crown.fill': 'workspace-premium',
  'sparkles': 'auto-awesome',
  'lock.fill': 'lock',
  'rectangle.portrait.and.arrow.right': 'logout',
  'clock': 'access-time',
  'plus.circle': 'add-circle-outline',
  'bell.fill': 'notifications',
  'gear': 'settings',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
