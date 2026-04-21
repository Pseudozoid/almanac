import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  title: string;
  iconName?: keyof typeof Feather.glyphMap;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  title,
  iconName,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'flex-row items-center justify-center rounded-xl';
  
  const variantClasses = {
    primary: 'bg-primary active:bg-primary-active shadow-sm',
    secondary: 'bg-surface border border-border-strong shadow-sm active:bg-surface-elevated',
    ghost: 'bg-transparent active:bg-surface-elevated',
  };

  const sizeClasses = {
    sm: 'px-4 py-2',
    md: 'px-5 py-3',
    lg: 'px-8 py-4',
  };

  const textClasses = {
    primary: 'text-background font-ui font-medium',
    secondary: 'text-text-primary font-ui font-medium',
    ghost: 'text-text-primary font-ui font-medium',
  };

  const disabledClasses = disabled || loading ? 'opacity-50' : '';
  const iconColor = variant === 'primary' ? '#FDFBF7' : '#2C2A28'; // Simplistic fallback mapping

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <>
          {iconName && (
            <Feather 
              name={iconName} 
              size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} 
              color={iconColor} 
              className="mr-2" 
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={`${textClasses[variant]} ${size === 'lg' ? 'text-lg' : 'text-base'}`}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
