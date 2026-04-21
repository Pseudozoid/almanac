import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useGoalsStore } from '../store/goalsStore';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Feather } from '@expo/vector-icons';

export const GoalsScreen = () => {
  const { dailyGoalMinutes, currentDayMinutes, streakDays, checkAndUpdateStreak } = useGoalsStore();

  useEffect(() => {
    checkAndUpdateStreak();
  }, []);

  const progress = Math.min((currentDayMinutes / dailyGoalMinutes) * 100, 100);

  return (
    <View className="flex-1 bg-background p-5 pt-16">
      <View className="flex-row items-center mb-8">
        <Typography variant="h1">Reading Goals</Typography>
      </View>
      
      <View className="flex-row justify-between mb-5">
        <Card elevated className="flex-1 mr-2 items-center justify-center py-8">
          <Feather name="zap" size={24} color="#DDAA3E" style={{ marginBottom: 12 }} />
          <Typography variant="h1" className="mb-1">{streakDays}</Typography>
          <Typography variant="bodySmall" color="secondary" font="ui" className="uppercase tracking-wider">Day Streak</Typography>
        </Card>
        
        <Card elevated className="flex-1 ml-2 items-center justify-center py-8">
          <Feather name="clock" size={24} color="#4A6B7C" style={{ marginBottom: 12 }} />
          <Typography variant="h1" className="mb-1">{currentDayMinutes}</Typography>
          <Typography variant="bodySmall" color="secondary" font="ui" className="uppercase tracking-wider">Mins Today</Typography>
        </Card>
      </View>

      <Card>
        <View className="flex-row justify-between items-end mb-4">
          <Typography variant="h3">Daily Progress</Typography>
          <Typography variant="bodySmall" color="muted">Goal: {dailyGoalMinutes} mins</Typography>
        </View>
        <View className="h-3 bg-surface-elevated rounded-full overflow-hidden">
          <View 
            className="h-full bg-primary" 
            style={{ width: `${Math.max(progress, 2)}%` }} 
          />
        </View>
        <Typography variant="bodySmall" color="primary" className="mt-3 font-medium">
          {Math.round(progress)}% Completed
        </Typography>
      </Card>
    </View>
  );
};
