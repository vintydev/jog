import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import useReminders from '../hooks/useReminders';
import { Timestamp } from 'firebase/firestore';
import ChartCard from './ChartCard';

interface WeeklyStatsProps {
  stats: number[];
  navigation: any;
}

const WeeklyStats: React.FC<WeeklyStatsProps> = ({ stats, navigation }) => {
  const screenWidth = Dimensions.get('window').width;
  const {reminders} = useReminders();

  const [weeklyStats, setWeeklyStats] = useState<number[]>(Array(7).fill(0));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reminders) return;

    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const filteredReminders = reminders.filter((reminder) => {
      const reminderDate = reminder.createdAt instanceof Timestamp
        ? reminder.createdAt.toDate()
        : new Date(reminder.createdAt);
      return reminderDate >= startOfWeek;
    });

    const updatedStats = Array(7).fill(0);

    filteredReminders.forEach((reminder) => {
      if (reminder.completed) {
        const completionDate = reminder.completedAt instanceof Timestamp
          ? reminder.completedAt.toDate()
          : new Date(reminder.completedAt);
        const day = completionDate.getDay();
        const index = day === 0 ? 6 : day - 1;
        updatedStats[index]++;
      }
    });

    setWeeklyStats(updatedStats);
    setLoading(false);
  }, [reminders, stats]);

  return (
    <View className="bg-white rounded-xl px-4 py-5 mx-4 my-4 shadow-md">
      <Text className="text-xl font-sf-pro-bold text-black mb-3">📈 Your Week in Jogs</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#EB5A10" />
      ) : (
        <ChartCard
          data={weeklyStats}
          label="Completed Jogs"
          suffix=""
          loading={loading}
          segments={5}
          labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
          cardWidth={screenWidth - 87}
          cardHeight={200}
          cardTitle=''
        />
      )}

      <TouchableOpacity
        className="self-center"
        onPress={() =>
          navigation.navigate('Drawer', {
            screen: 'DrawerHome',
            params: {
              screen: 'My Stats',
            },
          })
        }
      >
        <Text className="text-[17px] font-semibold text-primary-0 underline">
          View More
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default WeeklyStats;