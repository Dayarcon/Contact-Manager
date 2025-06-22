import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions for design (using iPhone 12 Pro as reference)
const baseWidth = 390;
const baseHeight = 844;

// Scale factors
const widthScale = SCREEN_WIDTH / baseWidth;
const heightScale = SCREEN_HEIGHT / baseHeight;

// Responsive scaling function
export const scale = (size: number) => {
  const newSize = size * widthScale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

// Responsive height scaling
export const verticalScale = (size: number) => {
  const newSize = size * heightScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Responsive font scaling
export const moderateScale = (size: number, factor = 0.5) => {
  const newSize = size + (scale(size) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Device type detection
export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  
  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  } else {
    return (
      pixelDensity === 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920)
    );
  }
};

export const isSmallDevice = () => {
  return SCREEN_WIDTH < 375;
};

export const isLargeDevice = () => {
  return SCREEN_WIDTH > 414;
};

// Responsive spacing
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

// Responsive avatar sizes
export const avatarSizes = {
  small: scale(32),
  medium: scale(48),
  large: scale(80),
  xlarge: scale(100),
  xxlarge: scale(120),
};

// Responsive icon sizes
export const iconSizes = {
  xs: scale(12),
  sm: scale(16),
  md: scale(20),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(40),
};

// Responsive font sizes
export const fontSizes = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  md: moderateScale(14),
  lg: moderateScale(16),
  xl: moderateScale(18),
  xxl: moderateScale(20),
  xxxl: moderateScale(24),
  display: moderateScale(28),
  displayLarge: moderateScale(32),
};

// Responsive border radius
export const borderRadius = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  round: scale(50),
};

// Responsive header heights
export const headerHeights = {
  small: verticalScale(60),
  medium: verticalScale(80),
  large: verticalScale(100),
  xlarge: verticalScale(120),
};

// Responsive card dimensions
export const cardDimensions = {
  padding: spacing.md,
  margin: spacing.sm,
  borderRadius: borderRadius.lg,
  elevation: 4,
};

// Responsive button dimensions
export const buttonDimensions = {
  height: scale(48),
  borderRadius: borderRadius.md,
  paddingHorizontal: spacing.md,
  minWidth: scale(100),
};

// Responsive input dimensions
export const inputDimensions = {
  height: scale(48),
  borderRadius: borderRadius.md,
  paddingHorizontal: spacing.md,
  fontSize: fontSizes.md,
};

// Responsive list item dimensions
export const listItemDimensions = {
  height: scale(64),
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  avatarSize: avatarSizes.medium,
  iconSize: iconSizes.md,
};

// Responsive menu positioning
export const menuPosition = {
  anchorX: screenWidth - scale(50),
  anchorY: headerHeights.medium + scale(10),
};

// Responsive floating action button
export const fabDimensions = {
  size: scale(56),
  position: {
    bottom: spacing.xl,
    right: spacing.xl,
  },
  iconSize: iconSizes.lg,
};

// Responsive progress bar
export const progressBarDimensions = {
  height: scale(8),
  borderRadius: borderRadius.xs,
};

// Responsive chip dimensions
export const chipDimensions = {
  height: scale(32),
  borderRadius: borderRadius.round,
  paddingHorizontal: spacing.sm,
  fontSize: fontSizes.sm,
};

// Responsive badge dimensions
export const badgeDimensions = {
  size: scale(24),
  borderRadius: borderRadius.round,
  fontSize: fontSizes.xs,
};

// Responsive image dimensions
export const imageDimensions = {
  thumbnail: scale(60),
  small: scale(80),
  medium: scale(120),
  large: scale(160),
  xlarge: scale(200),
};

// Responsive modal dimensions
export const modalDimensions = {
  borderRadius: borderRadius.xl,
  padding: spacing.lg,
  margin: spacing.md,
};

// Responsive dialog dimensions
export const dialogDimensions = {
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
  margin: spacing.xl,
};

// Responsive bottom sheet dimensions
export const bottomSheetDimensions = {
  borderRadius: borderRadius.xl,
  padding: spacing.lg,
  handleHeight: scale(4),
  handleWidth: scale(40),
};

// Responsive tab bar dimensions
export const tabBarDimensions = {
  height: scale(60),
  iconSize: iconSizes.md,
  fontSize: fontSizes.sm,
};

// Responsive search bar dimensions
export const searchBarDimensions = {
  height: scale(48),
  borderRadius: borderRadius.round,
  fontSize: fontSizes.md,
  iconSize: iconSizes.md,
};

// Responsive filter chip dimensions
export const filterChipDimensions = {
  height: scale(36),
  borderRadius: borderRadius.round,
  paddingHorizontal: spacing.md,
  fontSize: fontSizes.sm,
  marginRight: spacing.sm,
};

// Responsive quick action dimensions
export const quickActionDimensions = {
  size: scale(56),
  borderRadius: borderRadius.lg,
  iconSize: iconSizes.lg,
  margin: spacing.sm,
};

// Responsive timeline dimensions
export const timelineDimensions = {
  lineWidth: scale(2),
  dotSize: scale(12),
  spacing: spacing.md,
  padding: spacing.lg,
};

// Responsive contact card dimensions
export const contactCardDimensions = {
  avatarSize: avatarSizes.large,
  padding: spacing.lg,
  margin: spacing.md,
  borderRadius: borderRadius.xl,
};

// Responsive form dimensions
export const formDimensions = {
  fieldHeight: scale(56),
  fieldSpacing: spacing.md,
  sectionSpacing: spacing.xl,
  borderRadius: borderRadius.md,
};

// Responsive navigation dimensions
export const navigationDimensions = {
  headerHeight: headerHeights.medium,
  tabBarHeight: tabBarDimensions.height,
  backButtonSize: iconSizes.lg,
  titleFontSize: fontSizes.xl,
};

// Responsive settings dimensions
export const settingsDimensions = {
  itemHeight: scale(56),
  iconSize: iconSizes.md,
  switchSize: scale(40),
  dividerHeight: scale(1),
};

// Responsive notification dimensions
export const notificationDimensions = {
  height: scale(80),
  borderRadius: borderRadius.md,
  padding: spacing.md,
  iconSize: iconSizes.md,
};

// Responsive loading dimensions
export const loadingDimensions = {
  size: scale(40),
  strokeWidth: scale(4),
};

// Responsive error dimensions
export const errorDimensions = {
  iconSize: iconSizes.xl,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
};

// Responsive success dimensions
export const successDimensions = {
  iconSize: iconSizes.xl,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
};

// Responsive warning dimensions
export const warningDimensions = {
  iconSize: iconSizes.xl,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
};

// Responsive info dimensions
export const infoDimensions = {
  iconSize: iconSizes.xl,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
};

// Responsive tooltip dimensions
export const tooltipDimensions = {
  padding: spacing.sm,
  borderRadius: borderRadius.sm,
  fontSize: fontSizes.sm,
  maxWidth: screenWidth * 0.8,
};

// Responsive dropdown dimensions
export const dropdownDimensions = {
  maxHeight: screenHeight * 0.4,
  borderRadius: borderRadius.md,
  fontSize: fontSizes.md,
  itemHeight: scale(48),
};

// Responsive picker dimensions
export const pickerDimensions = {
  height: scale(200),
  borderRadius: borderRadius.lg,
  fontSize: fontSizes.md,
  itemHeight: scale(48),
};

// Responsive slider dimensions
export const sliderDimensions = {
  height: scale(40),
  thumbSize: scale(20),
  trackHeight: scale(4),
};

// Responsive stepper dimensions
export const stepperDimensions = {
  stepSize: scale(32),
  lineHeight: scale(2),
  fontSize: fontSizes.sm,
  spacing: spacing.md,
};

// Responsive rating dimensions
export const ratingDimensions = {
  starSize: scale(24),
  spacing: scale(4),
};

// Responsive progress indicator dimensions
export const progressIndicatorDimensions = {
  size: scale(80),
  strokeWidth: scale(8),
  fontSize: fontSizes.lg,
};

// Responsive skeleton dimensions
export const skeletonDimensions = {
  height: scale(20),
  borderRadius: borderRadius.sm,
  spacing: spacing.sm,
};

// Responsive shimmer dimensions
export const shimmerDimensions = {
  width: screenWidth,
  height: scale(100),
  borderRadius: borderRadius.md,
};

// Responsive animation dimensions
export const animationDimensions = {
  scale: 1.1,
  duration: 200,
  easing: 'ease-in-out',
};

// Responsive gesture dimensions
export const gestureDimensions = {
  swipeThreshold: scale(80),
  longPressDuration: 500,
  tapThreshold: scale(44),
};

// Responsive accessibility dimensions
export const accessibilityDimensions = {
  minTouchTarget: scale(44),
  minTextSize: fontSizes.md,
  minContrastRatio: 4.5,
};

// Responsive performance dimensions
export const performanceDimensions = {
  maxListItems: isTablet() ? 50 : 30,
  maxImageSize: scale(200),
  maxTextLength: 1000,
};

// Responsive theme dimensions
export const themeDimensions = {
  elevation: {
    low: 2,
    medium: 4,
    high: 8,
    max: 12,
  },
  shadow: {
    offset: { width: 0, height: scale(2) },
    radius: scale(4),
    opacity: 0.1,
  },
};

// Export all dimensions
export default {
  scale,
  verticalScale,
  moderateScale,
  screenWidth,
  screenHeight,
  isTablet,
  isSmallDevice,
  isLargeDevice,
  spacing,
  avatarSizes,
  iconSizes,
  fontSizes,
  borderRadius,
  headerHeights,
  cardDimensions,
  buttonDimensions,
  inputDimensions,
  listItemDimensions,
  menuPosition,
  fabDimensions,
  progressBarDimensions,
  chipDimensions,
  badgeDimensions,
  imageDimensions,
  modalDimensions,
  dialogDimensions,
  bottomSheetDimensions,
  tabBarDimensions,
  searchBarDimensions,
  filterChipDimensions,
  quickActionDimensions,
  timelineDimensions,
  contactCardDimensions,
  formDimensions,
  navigationDimensions,
  settingsDimensions,
  notificationDimensions,
  loadingDimensions,
  errorDimensions,
  successDimensions,
  warningDimensions,
  infoDimensions,
  tooltipDimensions,
  dropdownDimensions,
  pickerDimensions,
  sliderDimensions,
  stepperDimensions,
  ratingDimensions,
  progressIndicatorDimensions,
  skeletonDimensions,
  shimmerDimensions,
  animationDimensions,
  gestureDimensions,
  accessibilityDimensions,
  performanceDimensions,
  themeDimensions,
}; 