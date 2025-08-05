import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import CustomButton from "@/app/components/CustomButton";
import SelectableButton from "@/app/components/SelectableButton"; // adjust path if needed

type QuestionComponentProps = {
  question: string;
  onNext: (answer: any) => void;
  type?: "scale" | "text";
  subtitle?: string;
};

const SCALE_OPTIONS = [
  { label: "1 - Not at all", value: 1 },
  { label: "2 - Slightly", value: 2 },
  { label: "3 - Moderately", value: 3 },
  { label: "4 - Very", value: 4 },
  { label: "5 - Extremely", value: 5 },
];

const QuestionComponent: React.FC<QuestionComponentProps> = ({
  question,
  onNext,
  type = "scale",
  subtitle,
}) => {
  const [answer, setAnswer] = useState<any>(type === "text" ? "" : null);

  const handleSubmit = () => {
    onNext(answer);
  };

  return (
    <View className="p-5 flex-1 justify-between">
      <View className="mt-8">
        <Text className="text-[22px] font-sf-pro-display-bold text-black mb-2">{question}</Text>
        {subtitle && <Text className="text-md text-gray-500 mb-4">{subtitle}</Text>}

        {type === "text" && (
          <TextInput
            className="border border-gray-300 p-3 rounded-xl text-base text-black bg-white"
            multiline
            placeholder="Type your answer here..."
            placeholderTextColor="#999"
            value={answer}
            onChangeText={setAnswer}
            style={{ minHeight: 100 }}
          />
        )}

        {type === "scale" && (
          <View className="mt-4 space-y-2">
            {SCALE_OPTIONS.map((option) => (
              <SelectableButton
                key={option.value}
                label={option.label}
                isSelected={answer === option.value}
                onPress={() => setAnswer(option.value)}
              />
            ))}
          </View>
        )}
      </View>

      <CustomButton
        onPress={handleSubmit}
        text="Next"
        type="primary"
        isLoading={false}
        disabled={(type === "text" && answer.trim().length === 0) || (type === "scale" && answer === null)}
      />
    </View>
  );
};

export default QuestionComponent;