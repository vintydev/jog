import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import Animated from 'react-native-reanimated';
import Reminder from './Reminder';
import type { DrawerScreenProps as RNDrawerScreenProps } from '@react-navigation/drawer';
import { Timestamp } from 'firebase/firestore';


export interface AuthSelections {
  isFromGoogle: boolean;
  date: Date;
  gender: string | null;
  adhdDiagnosed: boolean | null;
  dateDiagnosed: string | null;
  isWaiting: boolean | null;
  isDiagnosedPrivately: boolean | null;
  lengthWaiting: string | null;
  isMedicated: boolean | null;
  medications: { name: string; dosage: string; }[];
  employabilityStatus: string | null;
  isStudent: boolean | null;
  memorySeverity: number | null;
  concentrationSeverity: number | null;
  moodSeverity: number | null;
  username: string;
  email: string;
  password: string;
  questionnaireTime: Timestamp | null;

}

export type AuthStackParamList = {

  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  Age: undefined;
  GenderInfo: { selections: AuthSelections };
  ADHDInfo: { selections: AuthSelections };
  ADHDInfoResult: { selections: AuthSelections };
  ADHDInfoResult2: { selections: AuthSelections };
  MedicationInfo: { selections: AuthSelections };
  OccupationInfo: { selections: AuthSelections };
  MemoryInfo: { selections: AuthSelections };
  ConcentrationInfo: { selections: AuthSelections };
  MoodInfo: { selections: AuthSelections };
  QuestionnaireTime: { selections: AuthSelections };
  AuthInfo: { selections: AuthSelections };

};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Drawer: NavigatorScreenParams<DrawerStackParamList>;
  Tasks: NavigatorScreenParams<TaskStackParamList>;
  Questionnaire: NavigatorScreenParams<QuestionnaireStackParamList>;
  Tab: NavigatorScreenParams<TabStackParamList>;
};

export type TabStackParamList = {
  Home: undefined;
  Profile: undefined;
  Tasks: undefined;
  Questionnaire: { screen: string, params?: { data: any } };
  "My Jogs": undefined;
  "AI Planner": { screen: string, params?: { data: any } };
  "My Stats": undefined;

};

export type DrawerStackParamList = {
  DrawerHome: undefined;
  Profile: undefined;
  Tasks: { screen: string, params?: { data: any } };
  Settings: undefined;
  Feedback: undefined;
};

export type TaskStackParamList = {
  TaskList: undefined;
  TaskDetail: { data: Reminder };
  AddTask: undefined;
  AddTaskCategory: undefined;
  AddTaskSchedule: {
    taskDetails: {
      [x: string]: string | null; title: string; category: string; notes: string
    }
  };
  ChatBotSelection: undefined;
  ChatBot: { conversationId: string };
  WeeklyStats: undefined;
};


export type QuestionnaireStackParamList = {
  Questionnaire: undefined;
  QuestionnaireTest: undefined;
  QuestionnaireResults: { selections: AuthSelections };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

export type TaskStackScreenProps<T extends keyof TaskStackParamList> =
  StackScreenProps<TaskStackParamList, T>;

export type DrawerScreenProps<T extends keyof DrawerStackParamList> =
  RNDrawerScreenProps<DrawerStackParamList, T>;



export type TabScreenProps<T extends keyof TabStackParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabStackParamList, T>,
    StackScreenProps<RootStackParamList>
  >;

export type QuestionnaireScreenProps<T extends keyof QuestionnaireStackParamList> =
  StackScreenProps<QuestionnaireStackParamList, T>;


declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}