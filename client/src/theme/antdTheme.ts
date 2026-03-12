/**
 * Ant Design Theme — Configures AntD token system to match brand.
 */
import type { ThemeConfig } from 'antd';
import { colors, fonts, textColors } from './tokens';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.terracotta,
    colorPrimaryHover: colors.terracottaLight,
    colorPrimaryActive: colors.terracottaDark,
    fontFamily: fonts.body,
    fontFamilyCode: fonts.mono,
    colorText: textColors.primary,
    colorTextSecondary: textColors.secondary,
    colorTextTertiary: textColors.muted,
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
  },
};
