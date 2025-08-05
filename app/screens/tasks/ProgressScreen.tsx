import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut, Layout, LinearTransition, withSpring } from 'react-native-reanimated';
import useReminders from '@/app/hooks/useReminders';
import useUserStats from '@/app/hooks/useUserStats';
import { Timestamp } from 'firebase/firestore';
import ChartCard from '@/app/components/ChartCard';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { calculateSymptomChange } from '@/app/utils/calculateSymptomChange';
import { UserStats } from '@/app/types/UserStats';
import OneTimeOverlay from '@/app/components/OneTimeOverlay';
import { getLatestSymptomInsights } from '@/app/utils/symptomUtils';
import { rem } from 'nativewind';


export type SymptomKey = 'mood' | 'concentration' | 'memory';

const metrics = [
    { key: 'completed', label: 'Overall Completed', filter: (r: any) => r.completed === true },
    { key: 'completedOnTime', label: 'Completed on Time', filter: (r: any) => r.completeStatus === 'completedOnTime' },
    { key: 'completedLate', label: 'Completed Late', filter: (r: any) => r.completeStatus === 'completedLate' },
    { key: 'isAI', label: 'AI Jogs Created', filter: (r: any) => r.isAI },
    { key: 'isStepBased', label: 'Step-Based Jog Created', filter: (r: any) => r.isStepBased },
];

const symptoms = [
    { key: 'mood', label: 'Mood' },
    { key: 'concentration', label: 'Concentration' },
    { key: 'memory', label: 'Memory' },
].reverse();

const getStartOfWeek = (offset = 0) => {
    const now = new Date();
    const start = new Date(now.setDate(now.getDate() - now.getDay() + 1 + offset * 7));
    return new Date(start.setHours(0, 0, 0, 0));
};

const ADHDProgressScreen: React.FC = () => {
    const [viewType, setViewType] = useState<'reminders' | 'symptoms'>('reminders');
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedDot, setSelectedDot] = useState<any>(null);

    const currentWeekStart = useMemo(() => getStartOfWeek(weekOffset), [weekOffset]);
    const { reminders, loading: reminderLoading } = useReminders({ weekStart: currentWeekStart });
    const { userStats, loading: userStatsLoading } = useUserStats();
    const { userData, loading: userDataLoading } = useAuthContext();
    const [loading, setLoading] = useState(true);

    const [latestAdvice, setLatestAdvice] = useState<string | null>(null);
    const [latestSummary, setLatestSummary] = useState<string | null>(null);
    const [latestDate, setLatestDate] = useState<string | null>(null);
    const [previousDate, setPreviousDate] = useState<string | null>(null);


    const isLoading = userStatsLoading || reminderLoading || userDataLoading

    useEffect(() => {
        if (userStats) {
            const insights = getLatestSymptomInsights(userStats);
            if (insights) {
                setLatestAdvice(insights.advice);
                setLatestSummary(insights.summary);
                setLatestDate(insights.latestCheckInDate ?? null);
                setPreviousDate(insights.previousCheckInDate ?? null);

            }
        }
    }, [userStats]);

    const symptomChanges = useMemo(() => {

        if (!userStats?.symptomStats) return {};

        const result: Record<string, { value: number | null; change: number }> = {};

        ["memory", "concentration", "mood"].forEach((key) => {
            const lastKey = `lastLogged${key.charAt(0).toUpperCase() + key.slice(1)}Severity` as keyof typeof userStats.symptomStats;
            const initialKey = `initial${key.charAt(0).toUpperCase() + key.slice(1)}Severity` as keyof typeof userStats.symptomStats;

            const value = typeof userStats.symptomStats[lastKey] === 'number'
                ? userStats.symptomStats[lastKey]
                : typeof userStats.symptomStats[initialKey] === 'number'
                    ? userStats.symptomStats[initialKey]
                    : null;
            const change = calculateSymptomChange(key as SymptomKey, userStats);

            result[key] = { value, change };
        });

        return result;
    }, [userStats]);

    const chartDataByMetric: Record<string, number[]> = useMemo(() => {

        if (!reminders || viewType !== 'reminders') return {};

        setLoading(true);

        const metricResults: Record<string, number[]> = {};
        const startOfWeek = getStartOfWeek(weekOffset);

        metrics.forEach(({ key, filter }) => {
            const dataByDay = Array(7).fill(0);

            reminders.forEach(({ createdAt, ...reminder }) => {
                const date = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
                if (date >= startOfWeek && filter({ createdAt: date, ...reminder })) {
                    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
                    dataByDay[dayIndex]++;
                }
            });

            metricResults[key] = dataByDay;
        });

        setTimeout(() => setLoading(false), 100);

        return metricResults;
    }, [reminders, viewType, weekOffset]);

    const symptomSeries: Record<string, { label: string; value: number; date: string }[]> = useMemo(() => {
        if (!userStats || viewType !== 'symptoms') return {};

        setLoading(true);

        const logs = Object.values(userStats.symptomStats.dailyLogs ?? {}).sort
            ((a, b) => {
                const dateA = a.submittedAt instanceof Timestamp ? a.submittedAt.toDate() : new Date();
                const dateB = b.submittedAt instanceof Timestamp ? b.submittedAt.toDate() : new Date();
                return dateA.getTime() - dateB.getTime();
            });
        const baseLabel: string = 'Start';

        console.log('BaseLabel:', baseLabel);

        const baseData = {
            mood: [{ label: baseLabel, value: userStats.symptomStats.initialMoodSeverity, date: userStats.createdAt instanceof Timestamp ? userStats.createdAt.toDate() : userStats.createdAt }],
            concentration: [{ label: baseLabel, value: userStats.symptomStats.initialConcentrationSeverity, date: userStats.createdAt instanceof Timestamp ? userStats.createdAt.toDate() : userStats.createdAt }],
            memory: [{ label: baseLabel, value: userStats.symptomStats.initialMemorySeverity, date: userStats.createdAt instanceof Timestamp ? userStats.createdAt.toDate() : userStats.createdAt }],
        };

        logs.forEach(({ symptomSeverity, submittedAt }) => {
            const date = submittedAt instanceof Timestamp ? submittedAt.toDate() : new Date();
            const label = date.toLocaleDateString('en-GB', {
                month: 'short',
                day: 'numeric',
            });

            if (!symptoms.some(({ key }) => key in symptomSeverity)) return;

            baseData.mood.push({ label, value: symptomSeverity.mood, date });
            baseData.concentration.push({ label, value: symptomSeverity.concentration, date });
            baseData.memory.push({ label, value: symptomSeverity.memory, date });
        });

        setTimeout(() => setLoading(false), 100);

        return baseData;
    }, [userStats, viewType]);

    const handleDataPointClick = useCallback(({ index, value, x, y }: any, key: string) => {
        setSelectedDot({ metricKey: key, index, value, x, y });
        setTimeout(() => setSelectedDot(null), 2000);
    }, []);

    return (
        !isLoading ? (
            <Animated.ScrollView className="flex-1 bg-gray-100 px-5 py-6" contentContainerClassName="pb-20"
                entering={FadeInUp.delay(50).duration(350)}
                exiting={FadeOut.duration(50).withCallback(() => { })}
                layout={LinearTransition.springify(1000).duration(200).withCallback(() => { })}
            >

                <Animated.View
                    key={`title-${viewType}`}
                    entering={FadeIn.duration(250)}
                    exiting={FadeOut.duration(150)}
                    layout={LinearTransition.springify(100)}
                    className="flex-row items-center justify-center mb-4"
                >
                    <Text className="text-[30px] text-black font-sf-pro-display-bold">
                        {viewType === 'reminders' ? 'Weekly Jog' : 'Symptom'} Progress
                    </Text>
                </Animated.View>

                <Animated.View
                    key={`tabs-${viewType}`}
                    entering={FadeIn.duration(250)}
                    exiting={FadeOut.duration(150)}
                    layout={LinearTransition.springify().mass(0.5).duration(200).withCallback(() => { })}




                    className="flex-row justify-center mb-6 space-x-2"
                >
                    {['reminders', 'symptoms'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            onPress={() => setViewType(type as any)}
                            className={`px-8 py-4 ml-2 rounded-full shadow-sm ${viewType === type ? 'bg-primary-0' : 'bg-gray-100'
                                }`}
                        >
                            <Text
                                className={`text-md font-sf-pro-bold ${viewType === type ? 'text-white' : 'text-gray-700'
                                    }`}
                            >
                                {type === 'reminders' ? 'Jogs' : 'Symptoms'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>
                {viewType === 'symptoms' && (


                    <Animated.View
                        entering={FadeIn.duration(100).withCallback(() => { 
                            
                        })}
                        exiting={FadeOut.duration(50).withCallback(() => { 

                        })}
                        layout={LinearTransition.springify(100).damping(15).mass(0.5)
                            .duration(200).withCallback(() => { })}
                        onLayout={() => {
                            setTimeout(() => {
                                setSelectedDot(null);
                            }, 2000);
                        }
                        }
                        className="bg-white shadow-md rounded-xl p-4 mb-4 mx-2"
                        style={{
                            transform: [{ translateY: 2 }]

                        }}


                    >
                        <Text className="text-lg font-sf-pro-bold text-center flex-1 mb-2">🧠 Latest Advice</Text>


                        <View className="bg-white  shadow-md rounded-xl p-4 mb-4 mx-4">
                            <View className="flex-row justify-between items-center mb-2">


                            </View>

                            <Text className="text-sm mb-4 text-center font-sf-pro-bold">
                                {latestAdvice && latestAdvice.length > 0
                                    ? latestAdvice
                                    : "No advice available. Enable AI in your next check-in to receive personalised advice."}
                            </Text>
                            {latestDate && (
                                <Text className="text-xs text-gray-400 text-center">{latestDate}</Text>
                            )}
                        </View>

                        <Text className="text-lg font-sf-pro-bold text-center mb-1">
                            {previousDate
                                ? `Change Since ${previousDate}`
                                : 'Your Baseline Symptoms'}
                        </Text>




                        <View className="flex-row justify-between px-4 mb-3">
                            {["Memory", "Concentration", "Mood"].map((label, index) => {
                                const key = label.toLowerCase();
                                const data = symptomChanges[key];

                                if (!data) return null;

                                const { value, change } = data;

                                const emoji = change === 0 ? "😐" : change > 0 ? "🥳" : "😗";

                                return (
                                    <View key={index} className="flex-1 mx-1 p-3 rounded-xl shadow bg-white">
                                        <Text className="text-xs text-gray-500 font-sf-pro text-center">{label === 'Concentration' ? "Focus": label}</Text>
                                        <Text className="text-center text-2xl font-sf-pro-bold text-primary-0">
                                            {emoji} {String(value ?? "-")}
                                        </Text>
                                        <Text className="text-xs text-center text-black font-sf-pro-bold mt-0.5">
                                            {change > 0 ? "Improved" : change < 0 ? "Worsened" : "No Change"}
                                        </Text>
                                        {change !== 0 && (
                                            <Text className="text-xs text-center text-gray-400 mt-0.5">
                                                {change > 0 ? "↑" : "↓"} {Math.abs(change)} point{Math.abs(change) > 1 ? "s" : ""}
                                            </Text>
                                        )}
                                        {change === 0 && (
                                            <Text className="text-xs text-center text-gray-400 mt-0.5">No change</Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                        <Text className="text-xs text-center text-gray-400 mb-2">
                            {latestDate
                                ? `${latestDate}`
                                : 'No further data — complete your first check-in!'}
                        </Text>

                        <OneTimeOverlay

                            storageKey={"symptomInsightsOverlay"}
                            title="Symptom Insights"
                            message="Here you can assess your symptoms overtime against your initial baseline symptoms. Check back each day after completing your check-in to see how your symptoms are changing. To view specific details on the chart, click on the data points!"
                        />
                    </Animated.View>
                )}


                {viewType === 'reminders' && (

                    <Animated.View
                        entering={FadeIn.duration(100).withCallback(() => { })}
                        exiting={FadeOut.duration(50).withCallback(() => { })}
                        layout={LinearTransition.springify(100).damping(15).mass(0.5)
                            .duration(200).withCallback(() => { })}
                     
                        
                        
                        className="bg-white shadow-md rounded-xl p-4 mb-4 mx-4"
                        style={{ transform: [{ translateY: 5 }] }}


                    >
                        <Text className="text-lg font-sf-pro-bold text-center flex-1 mb-2  ">📝 Latest Summary</Text>

                        <View className="bg-white shadow-md rounded-xl p-4 mb-4 mx-2">
                            <View className="flex-row justify-between items-center mb-2">


                            </View>

                            <Text className="text-sm text-black font-sf-pro-bold mb-4 text-left"
                            >
                                {latestSummary && latestSummary.length > 0
                                    ? latestSummary
                                    : "No summary available. Enable AI in your next check-in to receive personalised insights."}
                            </Text>
                            {latestDate && (
                                <Text className="text-xs text-gray-400 text-center ">{latestDate}</Text>
                            )}
                        </View>

                        <View className="px-6 ">
                            <Text className="text-lg font-sf-pro-bold text-center ">Daily Streak</Text>


                            <View className="flex-row justify-between items-center bg-white shadow rounded-xl px-4 py-3 mb-4">
                                <View className="items-center">
                                    <Text className="text-gray-500 text-xs">Current Streak</Text>
                                    <Text className="text-2xl font-sf-pro-bold text-primary-0">
                                        🔥 {Number(userStats?.jogStats?.currentStreak)}
                                    </Text>
                                </View>

                                <View className="w-[1px] bg-gray-200 h-10 mx-3" />

                                <View className="items-center">
                                    <Text className="text-gray-500 text-xs">Best Streak</Text>
                                    <Text className="text-2xl font-sf-pro-bold text-orange-500">
                                        🏆 {Number(userStats?.jogStats?.bestStreak)}
                                    </Text>
                                </View>
                            </View>

                            <OneTimeOverlay

                                storageKey={"jogInsightsOverlay"}
                                title="Jog Insights"
                                message="Here you can asesss your jog completion metrics, as well as view your streak information. Complete a jog each day to increase your streak. Keep up the great work!"
                            />
                        </View>
                    </Animated.View>
                )}


                <Text className="text-lg font-sf-pro-bold text-center mb-2">
                    {viewType === 'reminders' ? 'Jog' : 'Symptom'} Charts
                </Text>

                {viewType === 'reminders' &&

                    <Animated.View
                        entering={FadeIn.duration(200).withCallback(() => { })}
                        exiting={FadeOut.duration(150).withCallback(() => { })}
                        layout={LinearTransition.springify(200).duration(200).withCallback(() => { })}
                        className="bg-white shadow-md rounded-xl p-4 mb-4 mx-2"
                        style={{
                            transform: [{ translateY: 5 }]

                        }}


                    >



                        <View className="flex-row justify-between items-center px-2">
                            <TouchableOpacity onPress={() => setWeekOffset(prev => prev - 1)}>
                                <Text className="text-primary-0 font-semibold">← Back</Text>
                            </TouchableOpacity>

                            <Text className="font-sf-pro-bold text-black text-[15px]">
                                {currentWeekStart.toLocaleDateString("en-GB")} -{" "}
                                {new Date(currentWeekStart.getTime() + 6 * 86400000).toLocaleDateString("en-GB")}
                            </Text>

                            <TouchableOpacity onPress={() => setWeekOffset(prev => prev + 1)}>
                                <Text className="text-primary-0 font-semibold">Next →</Text>
                            </TouchableOpacity>

                        </View>

                        {weekOffset !== 0 && (
                            <View className="flex-row justify-center items-center mt-2 px-4">
                                <TouchableOpacity onPress={() => setWeekOffset(0)}>
                                    <Text className="text-primary-0 font-semibold underline">This Week</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>

                }
                <Animated.View
                    entering={FadeIn.duration(200).withCallback(() => { })}
                    exiting={FadeOut.duration(150).withCallback(() => { })}
                    layout={LinearTransition}

                    style={{
                        transform: [{ translateY: 5 }]

                    }}


                >
                    {viewType === 'reminders' ? (





                        metrics.map(({ key, label }) => (

                            <ChartCard
                                key={key}
                                center={true}
                                label={label}
                                data={chartDataByMetric[key] || []}
                                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                                suffix=" jogs"
                                selectedDot={selectedDot?.metricKey === key ? selectedDot : null}
                                onDataPointClick={p => handleDataPointClick(p, key)}
                                segments={new Set(chartDataByMetric[key] || []).size}
                                loading={loading}
                            />
                        ))) :




                        symptoms.map(({ key, label }) => {
                            const series = symptomSeries[key] || [];
                            const labels = series.map(e => e.label);
                            const data = series.map(e => (typeof e.value === 'number' ? e.value : 0));



                            return (
                                <ChartCard
                                    key={key}
                                    label={label === 'Concentration' ? "Focus" : label}
                                    labels={[]}
                                    center={true}

                                    data={data}
                                    suffix="/5"
                                    segments={Math.min(2, data.length)}
                                    loading={loading}
                                    cardTitle={label === 'Concentration' ? 'Focus' + " Since Signup" : label + " Since Signup"}
                                    selectedDot={selectedDot?.metricKey === key ? selectedDot : null}
                                    onDataPointClick={({ index, value, x, y }) => {
                                        setTimeout(() => setSelectedDot(null), 4000);
                                        const point = series[index];
                                        setSelectedDot({ index, value, x, y, date: point?.date, metricKey: key });
                                    }}
                                />
                            );
                        })}
                </Animated.View>



            </Animated.ScrollView>

        ) : (
            <View className="flex-1 items-center justify-center bg-gray-100">
                <ActivityIndicator
                    size="large" color="#EB5A10"
                >
                </ActivityIndicator>
                <Text className="text-lg font-sf-pro text-gray-500 mt-2">
                    Loading...
                </Text>
            </View>
        )
    );


};

export default ADHDProgressScreen;