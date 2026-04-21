import React from 'react';
import { Text, TextProps } from 'react-native';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall';
  color?: 'primary' | 'secondary' | 'muted' | 'accent';
  font?: 'ui' | 'code' | 'imperial';
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'primary',
  font = 'imperial', // Default to the elegant font
  className = '',
  children,
  ...props
}) => {
  const variantClasses = {
    h1: 'text-[32px] font-imperialBold tracking-tight',
    h2: 'text-[24px] font-imperialBold tracking-tight',
    h3: 'text-[18px] font-imperialBold tracking-tight',
    body: 'text-[16px] leading-relaxed',
    bodySmall: 'text-[13px] leading-relaxed',
  };

  const colorClasses = {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    muted: 'text-text-muted',
    accent: 'text-primary', // Use the actual theme primary color for accents
  };

  const fontClass = font === 'imperial' 
    ? (variant.startsWith('h') ? 'font-imperialBold' : 'font-imperial') 
    : (font === 'ui' ? 'font-ui' : 'font-code');

  return (
    <Text
      className={`${variantClasses[variant]} ${colorClasses[color]} ${fontClass} ${className}`}
      {...props}
    >
      {children}
    </Text>
  );
};
