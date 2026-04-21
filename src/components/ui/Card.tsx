import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  elevated = false,
  className = '',
  children,
  ...props
}) => {
  const bgClass = elevated ? 'bg-surface-elevated shadow-md' : 'bg-surface shadow-sm';
  
  return (
    <View
      className={`${bgClass} rounded-2xl border border-border-subtle p-5 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
