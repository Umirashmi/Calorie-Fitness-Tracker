import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  HelperText,
  Chip,
  Divider,
  useTheme,
} from "react-native-paper";
import { router, Stack } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import { ProfileUpdate, ActivityLevel, Gender } from "../types/nutrition";
import { ApisClient } from "../services/api";

interface ProfileFormData {
  name: string;
  email: string;
  age: string;
  weight: string;
  height: string;
  gender: Gender | "";
  activityLevel: ActivityLevel | "";
}

interface FormErrors {
  name?: string;
  email?: string;
  age?: string;
  weight?: string;
  height?: string;
}

const ACTIVITY_LEVELS: {
  key: ActivityLevel;
  label: string;
  description: string;
}[] = [
  {
    key: "sedentary",
    label: "Sedentary",
    description: "Office job, no exercise",
  },
  {
    key: "lightly_active",
    label: "Lightly Active",
    description: "Light exercise 1-3 days/week",
  },
  {
    key: "moderately_active",
    label: "Moderately Active",
    description: "Moderate exercise 3-5 days/week",
  },
  {
    key: "very_active",
    label: "Very Active",
    description: "Heavy exercise 6-7 days/week",
  },
  {
    key: "extra_active",
    label: "Extra Active",
    description: "Physical job + exercise",
  },
];

const GENDERS: { key: Gender; label: string }[] = [
  { key: "male", label: "Male" },
  { key: "female", label: "Female" },
  { key: "other", label: "Other" },
];

export default function EditProfileScreen() {
  const theme = useTheme();
  const { user, updateUser } = useAuth();
  const { 
    calculateBMI, 
    calculateBMR, 
    calculateTDEE, 
    getBMICategory 
  } = useProfile();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    age: "",
    weight: "",
    height: "",
    gender: "",
    activityLevel: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        age: user.age?.toString() || "",
        weight: user.weight?.toString() || "",
        height: user.height?.toString() || "",
        gender: user.gender || "",
        activityLevel: user.activityLevel || "",
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (
      formData.age &&
      (parseInt(formData.age) < 13 || parseInt(formData.age) > 120)
    ) {
      newErrors.age = "Age must be between 13 and 120";
    }

    if (
      formData.weight &&
      (parseFloat(formData.weight) < 20 || parseFloat(formData.weight) > 500)
    ) {
      newErrors.weight = "Weight must be between 20 and 500 kg";
    }

    if (
      formData.height &&
      (parseFloat(formData.height) < 50 || parseFloat(formData.height) > 300)
    ) {
      newErrors.height = "Height must be between 50 and 300 cm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please correct the errors in the form.");
      return;
    }

    setLoading(true);

    try {
      const updates: any = {
        name: formData.name,
        email: formData.email,
        age: formData.age ? parseInt(formData.age) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        gender: formData.gender,
        activity_level: formData.activityLevel || undefined,
      };

      // Remove undefined values
      Object.keys(updates).forEach((key) => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      const response = await ApisClient.updateProfile(updates);

      if (!response.success) {
        throw new Error(response.error || "Failed to update profile");
      }

      // Update the user data in auth context
      if (response.data) {
        updateUser(response.data);
      }

      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setLoading(false);
      router.back();
    }
  };

  const calculateMetrics = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseInt(formData.age);

    if (!weight || !height || !age || !formData.gender) {
      return null;
    }

    const bmi = calculateBMI(weight, height);
    const bmr = calculateBMR(weight, height, age, formData.gender as Gender);
    const tdee = formData.activityLevel
      ? calculateTDEE(bmr, formData.activityLevel as ActivityLevel)
      : bmr * 1.4; // Default moderate activity

    return {
      bmi,
      bmiCategory: getBMICategory(bmi),
      bmr,
      tdee: Math.round(tdee),
    };
  };

  const metrics = calculateMetrics();

  useEffect(() => {
    console.log("formData", formData);
  }, [])
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "edit-profile",
          headerShown: true,
          headerRight: () => (
            <Button
              mode="text"
              onPress={handleSave}
              disabled={loading}
              loading={loading}
              compact
            >
              Save
            </Button>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1, margin: 20 }} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <ThemedView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Basic Information */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <Title>Basic Information</Title>

              <TextInput
                label="Full Name *"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                error={!!errors.name}
                style={{ marginBottom: 8 }}
                disabled={loading}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>

              <TextInput
                label="Email Address *"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                style={{ marginBottom: 8 }}
                disabled={loading}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>
            </Card.Content>
          </Card>

          {/* Physical Information */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <Title>Physical Information</Title>
              <Paragraph style={{ marginBottom: 16, opacity: 0.7 }}>
                This information helps us provide personalized recommendations.
              </Paragraph>

              <TextInput
                label="Age (years)"
                value={formData.age}
                onChangeText={(text) => setFormData({ ...formData, age: text })}
                keyboardType="numeric"
                error={!!errors.age}
                style={{ marginBottom: 8 }}
                disabled={loading}
              />
              <HelperText type="error" visible={!!errors.age}>
                {errors.age}
              </HelperText>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
                <TextInput
                  label="Weight (kg)"
                  value={formData.weight}
                  onChangeText={(text) =>
                    setFormData({ ...formData, weight: text })
                  }
                  keyboardType="numeric"
                  error={!!errors.weight}
                  style={{ flex: 1 }}
                  disabled={loading}
                />
                <TextInput
                  label="Height (cm)"
                  value={formData.height}
                  onChangeText={(text) =>
                    setFormData({ ...formData, height: text })
                  }
                  keyboardType="numeric"
                  error={!!errors.height}
                  style={{ flex: 1 }}
                  disabled={loading}
                />
              </View>
              <HelperText type="error" visible={!!errors.weight}>
                {errors.weight}
              </HelperText>
              <HelperText type="error" visible={!!errors.height}>
                {errors.height}
              </HelperText>
            </Card.Content>
          </Card>

          {/* Gender Selection */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <Title style={{ marginBottom: 16 }}>Gender</Title>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {GENDERS.map((gender) => (
                  <Chip
                    key={gender.key}
                    mode={formData.gender === gender.key ? "flat" : "outlined"}
                    selected={formData.gender === gender.key}
                    onPress={() =>
                      setFormData({ ...formData, gender: gender.key })
                    }
                    disabled={loading}
                    style={{
                      backgroundColor: formData.gender === gender.key 
                        ? theme.colors.primaryContainer 
                        : "transparent"
                    }}
                    textStyle={{
                      color: formData.gender === gender.key 
                        ? theme.colors.onPrimaryContainer 
                        : theme.colors.onSurface
                    }}
                  >
                    {gender.label}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Activity Level */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <Title style={{ marginBottom: 8 }}>Activity Level</Title>
              <Paragraph style={{ marginBottom: 16, opacity: 0.7 }}>
                Select your typical activity level for accurate calorie
                recommendations.
              </Paragraph>

              {ACTIVITY_LEVELS.map((level) => (
                <Card
                  key={level.key}
                  style={{
                    marginBottom: 8,
                    backgroundColor:
                      formData.activityLevel === level.key
                        ? theme.colors.primaryContainer
                        : theme.colors.surface,
                    borderWidth: formData.activityLevel === level.key ? 2 : 1,
                    borderColor: formData.activityLevel === level.key 
                      ? theme.colors.primary 
                      : theme.colors.outline,
                  }}
                  onPress={() =>
                    setFormData({ ...formData, activityLevel: level.key })
                  }
                  disabled={loading}
                >
                  <Card.Content style={{ paddingVertical: 12 }}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText
                          style={{ 
                            fontWeight: "bold", 
                            marginBottom: 4,
                            color: formData.activityLevel === level.key 
                              ? theme.colors.onPrimaryContainer 
                              : theme.colors.onSurface
                          }}
                        >
                          {level.label}
                        </ThemedText>
                        <ThemedText 
                          style={{ 
                            fontSize: 12, 
                            color: formData.activityLevel === level.key 
                              ? theme.colors.onPrimaryContainer 
                              : theme.colors.onSurfaceVariant,
                            opacity: 0.8
                          }}
                        >
                          {level.description}
                        </ThemedText>
                      </View>
                      {formData.activityLevel === level.key && (
                        <ThemedText style={{ color: theme.colors.primary, fontSize: 18 }}>✓</ThemedText>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>

          {/* Health Metrics */}
          {metrics && (
            <Card style={{ marginBottom: 32 }}>
              <Card.Content>
                <Title>Your Health Metrics</Title>
                <Divider style={{ marginVertical: 16 }} />

                <View style={{ gap: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <ThemedText>BMI:</ThemedText>
                    <ThemedText style={{ fontWeight: "bold" }}>
                      {metrics.bmi.toFixed(1)} ({metrics.bmiCategory})
                    </ThemedText>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <ThemedText>BMR:</ThemedText>
                    <ThemedText style={{ fontWeight: "bold" }}>
                      {Math.round(metrics.bmr)} cal/day
                    </ThemedText>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <ThemedText>TDEE:</ThemedText>
                    <ThemedText style={{ fontWeight: "bold" }}>
                      {metrics.tdee} cal/day
                    </ThemedText>
                  </View>
                </View>

                <Paragraph
                  style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}
                >
                  BMI: Body Mass Index | BMR: Basal Metabolic Rate | TDEE: Total
                  Daily Energy Expenditure
                </Paragraph>
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        <View style={{ padding: 16 }}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={{ marginBottom: 8 }}
          >
            Save Changes
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
        </View>
      </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}
