import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

type ChartCardProps = {
    label: string;
    cardTitle?: string;
    data: number[];
    labels: string[];
    suffix?: string;
    loading?: boolean;
    selectedDot?: {
        index: number;
        value: number;
        x: number;
        y: number;
        metricKey: string;
        date?: string;
    } | null;
    onDataPointClick?: (props: any) => void;
    segments?: number;
    cardWidth?: number;
    cardHeight?: number;
    center?: boolean;
};

const ChartCard: React.FC<ChartCardProps> = ({
    label,
    data,
    labels,
    suffix = '',
    loading = false,
    selectedDot = null,
    onDataPointClick,
    segments,
    cardHeight,
    cardWidth,
    cardTitle,
    center,
}) => {



    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }

    return (
        <View className="mb-6 bg-white rounded-2xl shadow-md p-4 border border-gray-200">
            <Text className={`text-lg font-sf-pro-bold ${center ? 'text-center ': 'text-start'} mb-2`}>{cardTitle?.length ? cardTitle : label}</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#EB5A10" />
            ) : (


                <LineChart
                    data={{
                        labels,
                        datasets: [{ data }],
                        legend: [label],
                    }}
                    width={cardWidth || screenWidth - 70}
                    height={220}
                    yAxisSuffix={suffix}
                    segments={segments}
                    chartConfig={{
                        backgroundGradientFrom: '#f3f4f6',
                        backgroundGradientTo: '#e5e7eb',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(60, 60, 60, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                        propsForDots: { r: '6', strokeWidth: '2', stroke: '#EB5A10' },
                    }}
                    style={{ borderRadius: 16 }}
                    bezier
                    onDataPointClick={onDataPointClick}
                    decorator={() =>
                        selectedDot ? (
                            <View
                                key={`${selectedDot.metricKey}-${selectedDot.index}`}
                                style={{
                                    position: 'absolute',
                                   
                                    left: selectedDot.x - 30,
                                    top: selectedDot.y - 10,
                                    backgroundColor: 'white',
                                    paddingHorizontal: 6,
                                    paddingVertical: 3,
                                    borderRadius: 6,
                                    borderColor: '#EB5A10',
                                    borderWidth: 1,
                                    zIndex: 9999,
                                   
                                }}
                            >
                                <Text style={{ fontSize: 12, color: '#EB5A10', fontWeight: '600' }}>
                                    {selectedDot.value}
                                    {suffix?.trim() === '/5' ? suffix : ` ${suffix?.trim()}`}
                                </Text>

                                {selectedDot.date && (
                                    <Text style={{ fontSize: 10, color: '#6B7280' }}>
                                        {new Date(selectedDot.date).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month:'long',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                )}


                                   
                            </View>
                        ) : null
                    }

                />
            )}
        </View>
    );
};

export default ChartCard;