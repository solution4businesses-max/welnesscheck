import { Platform } from 'react-native'

export const colors = {
  bg: '#f7f4ef',
  card: '#ffffff',
  border: '#e7e2d9',
  ink: '#2b2620',
  dark: '#292420',
  muted: '#8a8377',
  faint: '#b7b0a3',
}

export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' })
