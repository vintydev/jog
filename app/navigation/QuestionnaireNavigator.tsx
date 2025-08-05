import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { QuestionnaireStackParamList } from "../types/Navigator";
import QuestionnaireScreen from "../screens/questionnaire/QuestionnaireScreen";

const QuestionnaireStack = createStackNavigator<QuestionnaireStackParamList>();

const QuestionnaireNavigator = () => {
  return (
    <QuestionnaireStack.Navigator>
      <QuestionnaireStack.Screen name="QuestionnaireTest" component={QuestionnaireScreen} options={{headerShown:false}} />
    </QuestionnaireStack.Navigator>
  );
};

export default QuestionnaireNavigator;