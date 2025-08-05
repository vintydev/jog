import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/app/services/FirebaseService";
import UserService from "@/app/services/UserService";
import CustomInput from "@/app/components/CustomInput";
import CustomButton from "@/app/components/CustomButton";
import InfoPopup from "@/app/components/InfoPopup";
import CustomSelectList from "@/app/components/CustomSelectList";
import SelectableButton from "@/app/components/SelectableButton";
import BottomButtonLayout from "@/app/components/BottomButtonLayout";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "@/app/contexts/AuthContext";

import { useNavigation } from "@react-navigation/native";

const ProfileScreen = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editableData, setEditableData] = useState<any>({});
  const [originalData, setOriginalData] = useState<any>(null);
  const navigation = useNavigation();


  const { userData: userDataFromContext } = useAuthContext();

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Subscribe to Firestore updates dynamically
    const userRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {

      if (snapshot.exists()) {
        console.log("Profile updated dynamically:", snapshot.data());
        setUserData(snapshot.data());
        setEditableData(snapshot.data());
        setOriginalData(snapshot.data());
        

      } else {
        console.error("User not found in Firestore!");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {

    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      setEditableData(originalData);
      console.log("Profile data reset to original data");
      console.log("Original data:", originalData);
    })
    // Prevent default behavior of leaving the screen
    return unsubscribe;
  }
    , [navigation, originalData, editableData]);




  const handleUpdate = async () => {
    if (!userId) return;

    setLoading(true);

    const updatedData = { ...editableData };

    // Clean up unselected fields
    if (!updatedData.occupationInfo.isStudent) {
      updatedData.occupationInfo.isStudent = false;
    }
    if (updatedData.adhdInfo.isDiagnosed && !updatedData.adhdInfo.dateDiagnosed) {
      Alert.alert("Selection Required", "Please select a diagnosed date if you have been diagnosed.");
      return;
    }
    if (!updatedData.adhdInfo.isDiagnosed) {
      updatedData.adhdInfo.dateDiagnosed = null;
    }
    if (!updatedData.adhdInfo.isWaiting) {
      updatedData.adhdInfo.lengthWaiting = null;
    }
    if (!updatedData.adhdInfo.isDiagnosedPrivately) {
      updatedData.adhdInfo.isDiagnosedPrivately = false;
    }
    if (!updatedData.medicationInfo.isMedicated) {
      updatedData.medicationInfo.medications = [];
    }

    Alert.alert("Updating Profile", "Are you sure you want to update your profile?", [
      {
        text: "Cancel",
        onPress: () => {
          setLoading(false);
          return;
        },
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: async () => {
          setLoading(true);
          try {

            await UserService.updateUserProfile(userId, updatedData);
            Alert.alert("Profile Updated", "Your profile has been successfully updated.");

          } catch (error) {

            console.error("Error updating profile:", error);
            Alert.alert("Error", "There was an error updating your profile. Please try again.");

          } finally {
            setLoading(false);
          }
        },
      },
    ]);

  };

  return (

    <ScrollView className="bg-gray-100 p-4 rounded-xl" contentContainerClassName="flex-grow pb-20 pt-4 px-4">

      <View className="flex-row justify-center items-center mb-4">
        <Text className="text-[30px] font-sf-pro-display-bold"><Text className="text-primary-0">{userDataFromContext?.displayName}</Text>'s Profile</Text>

      </View>


      <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6 items-center">
        <CustomInput label="Display Name" value={userData?.displayName ?? ""} editable={false} />
        <CustomInput label="Email" value={editableData?.email ?? ""} editable={false} />
        <Text className="text-lg font-sf-pro-bold mt-4">Gender</Text>
        <CustomSelectList

          data={[{ key: "Male", value: "Male" }, { key: "Female", value: "Female" }, { key: "Non-binary", value: "Non-binary" }, { key: "Prefer not to say", value: "Prefer not to say" }]}
          setSelected={(val) => setEditableData({ ...editableData, gender: String(val) })}
          placeholder={editableData.gender ? editableData.gender.toString().substring(0, 1).toUpperCase() + editableData.gender.toString().slice(1) : "Select your gender"}
        />
        <CustomInput
          editable={false}
          label="Age"
          value={editableData.age ? editableData.age.toString() : ""}
          keyboardType="numeric"
          onChangeText={(text) => setEditableData({ ...editableData, age: Number(text) })}
        />
        <CustomInput
          editable={false}
          label="Date of Birth"
          value={editableData.dateOfBirth ?? ""}
          onChangeText={(text) => setEditableData({ ...editableData, dateOfBirth: String(text) })}
        />
      </View>


      <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6 items-center">
        {/* Header */}
        <View className="flex-row items-center">
          <Text className="text-lg font-sf-pro-bold mr-2">ADHD Information</Text>
          <InfoPopup
            modalTitle="ADHD Information"
            message="This information is used for research purposes and is stored in a centralised, encrypted database. It is not shared with any third parties and is only used to improve the app's functionality and future user experience."
          />
        </View>

        {/* Diagnosed Toggle */}
        <SelectableButton
          label="Diagnosed?"
          isSelected={editableData?.adhdInfo?.isDiagnosed ?? false}
          onPress={() =>
            setEditableData({
              ...editableData,
              adhdInfo: {
                ...editableData.adhdInfo,
                isDiagnosed: !editableData.adhdInfo?.isDiagnosed,
                isWaiting: !editableData.adhdInfo?.isDiagnosed ? false : editableData.adhdInfo?.isWaiting,
                lengthWaiting: !editableData.adhdInfo?.isDiagnosed ? null : editableData.adhdInfo?.lengthWaiting,
              },
            })
          }
        />

        {/* Waiting List Toggle (if not diagnosed) */}
        {!editableData?.adhdInfo?.isDiagnosed && (
          <SelectableButton
            label="On Waiting List?"
            isSelected={editableData?.adhdInfo?.isWaiting ?? false}
            onPress={() => {
              const newState = !editableData.adhdInfo?.isWaiting;
              setEditableData({
                ...editableData,
                adhdInfo: {
                  ...editableData.adhdInfo,
                  isWaiting: newState,
                  lengthWaiting: newState ? editableData.adhdInfo.lengthWaiting : null,
                },
              });
            }}
          />
        )}
      </View>

      {/* Diagnosed Details */}
      {editableData?.adhdInfo?.isDiagnosed && (
        <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6 w-full items-center">
          <Text className="text-md font-sf-pro-bold mb-2 text-gray-800 ">Diagnosis Details</Text>
          <CustomInput
            label="Year Diagnosed"
            containerStyle={{ width: "100%" }}
            placeholder="e.g., 2020"
            value={editableData.adhdInfo.dateDiagnosed}
            onChangeText={(text) => {
              if (text.length <= 4 || text === "" || !isNaN(Number(text))) {
                setEditableData({
                  ...editableData,
                  adhdInfo: { ...editableData.adhdInfo, dateDiagnosed: text },
                });
              } else {
                Alert.alert("Invalid Date", "Please enter a valid year.");
              }
            }}
          />
        </View>
      )}

      {/* Waiting List Details */}
      {editableData?.adhdInfo?.isWaiting && !editableData?.adhdInfo?.isDiagnosed && (
        <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6 w-full items-center">
          <Text className="text-md font-sf-pro-bold mb-2 text-gray-800">Waiting List Duration</Text>
          {["Less than a month", "A few months", "A year or more"].map((option) => (
            <SelectableButton
              key={option}
              label={option}
              isSelected={editableData?.adhdInfo?.lengthWaiting === option}
              onPress={() => {
                setEditableData({
                  ...editableData,
                  adhdInfo: { ...editableData.adhdInfo, lengthWaiting: option },
                });
              }}
            />
          ))}
        </View>
      )}

      {/* Employment Status */}
      <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6 items-center">
        <Text className="text-lg font-sf-pro-bold">Employment Status</Text>
        {["Unemployed", "Part-time", "Full-time"].map((status) => (
          <SelectableButton
            key={status}
            label={status}
            isSelected={editableData.occupationInfo?.employabilityStatus === status}
            onPress={() => {
              if (editableData.occupationInfo?.employabilityStatus === status) {
                // Prevent deselecting the only selected employment status
                Alert.alert("Selection Required", "You must select at least one option.");
              } else {
                setEditableData({
                  ...editableData,
                  occupationInfo: { ...editableData.occupationInfo, employabilityStatus: status },
                });
              }
            }}
          />
        ))}
        <SelectableButton
          label="Student"
          isSelected={editableData.occupationInfo?.isStudent ?? false}
          onPress={() =>
            setEditableData({
              ...editableData,
              occupationInfo: { ...editableData.occupationInfo, isStudent: !editableData.occupationInfo.isStudent },
            })
          }
        />
      </View>

      {/* Medications */}
      <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6 items-center" >
        <Text className="text-lg font-sf-pro-bold">Medications</Text>

        <SelectableButton
          label="Take any medications?"
          isSelected={editableData.medicationInfo?.isMedicated ?? false}
          onPress={() =>
            setEditableData({
              ...editableData,
              medicationInfo: {
                ...editableData.medicationInfo,
                isMedicated: !editableData.medicationInfo?.isMedicated,
              },
            })
          }
        />
      </View>

      {editableData?.medicationInfo?.isMedicated && (
        <View className="bg-gray-100 p-5 rounded-2xl shadow-md mb-6 border border-gray-200 items-center">
          <Text className="text-lg font-sf-pro-bold mb-4">Current Medications</Text>

          {editableData?.medicationInfo?.medications?.map((med: any, index: number) => (
            <View
              key={index}
              className="bg-gray-50 p-4 rounded-xl mb-3 shadow-sm relative w-[95%]"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-sf-pro-bold text-base text-gray-700">
                  Medication #{index + 1}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const newMeds = [...editableData.medicationInfo.medications];
                    newMeds.splice(index, 1);
                    setEditableData({
                      ...editableData,
                      medicationInfo: {
                        ...editableData.medicationInfo,
                        medications: newMeds,
                      },
                    });
                  }}
                >
                  <Ionicons name="trash" size={20} color="#EB5A10" />
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-between">
                <CustomInput
                  width="100%"
                  label="Name"
                  value={med.name}
                  onChangeText={(text) => {
                    const newMeds = [...editableData.medicationInfo.medications];
                    newMeds[index].name = text;
                    setEditableData({
                      ...editableData,
                      medicationInfo: {
                        ...editableData.medicationInfo,
                        medications: newMeds,
                      },
                    });
                  }}
                />
                <CustomInput
                  width="100%"
                  label="Dosage"
                  value={med.dosage}
                  onChangeText={(text) => {
                    const newMeds = [...editableData.medicationInfo.medications];
                    newMeds[index].dosage = text;
                    setEditableData({
                      ...editableData,
                      medicationInfo: {
                        ...editableData.medicationInfo,
                        medications: newMeds,
                      },
                    });
                  }}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => {
              setEditableData({
                ...editableData,
                medicationInfo: {
                  ...editableData.medicationInfo,
                  medications: [
                    ...(editableData.medicationInfo.medications || []),
                    { name: "", dosage: "" },
                  ],
                },
              });
            }}
            className="mt-2"
          >
            <Text className="text-lg text-primary-0 font-sf-pro-bold">+ Add Medication</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="bg-gray-100 rounded-2xl shadow-lg justify-items-end items-center w-auto mx-auto p-6">

        <CustomButton text="Save Changes" onPress={handleUpdate} type="primary" isLoading={loading} />

      </View>

    </ScrollView>

  );
};

export default ProfileScreen;