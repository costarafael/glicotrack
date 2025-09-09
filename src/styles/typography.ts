import { Platform } from 'react-native';

export const FontFamily = {
  regular: Platform.select({
    ios: 'Figtree-Regular',
    android: 'Figtree-Regular',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'Figtree-Medium',
    android: 'Figtree-Medium', 
    default: 'System',
  }),
  semiBold: Platform.select({
    ios: 'Figtree-SemiBold',
    android: 'Figtree-SemiBold',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'Figtree-Bold',
    android: 'Figtree-Bold',
    default: 'System',
  }),
};

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Typography = {
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
  },
  h3: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    fontWeight: FontWeight.normal,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.normal,
  },
  button: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
};