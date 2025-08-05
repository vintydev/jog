import React, { ReactNode } from "react";
import { SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, View, StyleSheet } from "react-native";
import TermsandConditionsFooter from "@/app/components/TermsandConditionsFooter";

interface QuestionnaireLayoutProps {
  children: ReactNode;
}

const QuestionnaireLayout: React.FC<QuestionnaireLayoutProps> = ({ children }) => {
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        {/* Fixed Footer */}
        <View style={styles.footer}>
        
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default QuestionnaireLayout;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
    alignItems: "center",
  },
});