import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ActivityIndicator } from 'react-native';

const screenWidth = Dimensions.get("window").width;

const GRAPH_TYPES = [
    {
        key: 'jog',
        title: 'Jog Data',
        filters: ['completion', 'type', 'category'],
    },
    {
        key: 'symptom',
        title: 'Symptom Data',
        filters: ['baseline'],
    },
];

const GraphCarousel = ({
    userStats,
    type,
    loading,
}: {
    userStats: any;
    type: string;
    loading: boolean;
}) => {
    const [activeStatIndex, setActiveStatIndex] = useState(0);
    const [activeFilter, setActiveFilter] = useState('completion');

    const currentStat = GRAPH_TYPES[activeStatIndex];

    const renderChart = () => {
        if (currentStat.key === 'jog') {
            switch (activeFilter) {
                case 'completion':
                    return {
                        labels: ['On Time', 'Late', 'Missed'],
                        data: [
                            userStats?.jogStats?.jogCompletionRate?.completedOnTimeTotal ?? 0,
                            userStats?.jogStats?.jogCompletionRate?.completedLateTotal ?? 0,
                            userStats?.jogStats?.jogCompletionRate?.missedJogsTotal ?? 0,
                        ],
                    };

                case 'type':
                    return {
                        labels: ['All', 'AI', 'Step-Based'],
                        data: [
                            userStats?.jogStats?.totalJogsCreated ?? 0,
                            userStats?.jogStats?.totalAIJogsCreated ?? 0,
                            userStats?.jogStats?.totalStepBasedJogsCreated ?? 0,
                        ],
                    };

                case 'category':
                    const categories = Object.keys(userStats?.jogStats?.jogCategories ?? {});
                    const categoryData = categories.map((cat) => userStats.jogStats.jogCategories[cat] ?? 0);
                    return {
                        labels: categories,
                        data: categoryData,
                    };

                default:
                    return { labels: [], data: [] };
            }
        }

        if (currentStat.key === 'symptom') {
            return {
                labels: ['Concentration', 'Memory', 'Mood'],
                data: [
                    userStats?.symptomStats?.initialConcentrationSeverity ?? 0,
                    userStats?.symptomStats?.initialMemorySeverity ?? 0,
                    userStats?.symptomStats?.initialMoodSeverity ?? 0,
                ],
            };
        }

        return { labels: [], data: [] };
    };

    const chart = renderChart();

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#EB5A10" />
            </View>
        );
    }

    return (
        <View className="mb-6">
            {/* Filter Buttons */}
            <View className="flex-row justify-center mb-4">
                {GRAPH_TYPES[activeStatIndex].filters.map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        onPress={() => setActiveFilter(filter)}
                        className={`mx-2 px-4 py-2 rounded-full ${activeFilter === filter ? 'bg-[#EB5A10]' : 'bg-gray-200'
                            }`}
                    >
                        <Text className={activeFilter === filter ? 'text-white' : 'text-black'}>{filter}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Chart Card */}
            <View className="shadow-md bg-white p-5 rounded-2xl">
                <Text className="text-[20px] font-sf-pro-display-bold mb-3 text-center">
                    All-Time {currentStat.title}
                </Text>

                <LineChart
                    data={{
                        labels: chart.labels,
                        datasets: [{ data: chart.data, color: () => "#EB5A10", strokeWidth: 3 }],
                        legend: [`All-Time ${currentStat.title}`],
                    }}
                    width={screenWidth - 80}
                    height={220}
                    chartConfig={{
                        backgroundGradientFrom: "#f3f4f6",
                        backgroundGradientTo: "#e5e7eb",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                        propsForDots: { r: "6", strokeWidth: "2", stroke: "#EB5A10" },
                    }}
                    style={{ borderRadius: 25, padding: 10 }}
                />

                <Text className="text-[30px] font-sf-pro-display-bold mb-4">Your Progress</Text>
                {/* filter between symtpoms and jogs */}
                <View className="flex-row justify-center mt-4">
                    {GRAPH_TYPES.map((type, index) => (
                        <TouchableOpacity
                            key={type.key}
                            onPress={() => setActiveStatIndex(index)}
                            className={`mx-2 px-4 py-2 rounded-full ${activeStatIndex === index ? 'bg-[#EB5A10]' : 'bg-gray-200'}`}
                        >
                            <Text className={activeStatIndex === index ? 'text-white' : 'text-black'}>{type.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
};

export default GraphCarousel;