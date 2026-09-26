import { Platform, type TextStyle } from 'react-native';

/** Removes the browser focus ring on web text inputs; native inputs are unaffected. */
export const webNoOutline: TextStyle = Platform.OS === 'web' ? { outlineWidth: 0 } : {};
