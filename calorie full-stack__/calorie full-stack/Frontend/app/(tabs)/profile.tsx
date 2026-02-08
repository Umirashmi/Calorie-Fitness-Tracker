import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  List,
  Switch,
  Button,
  Divider,
  useTheme,
  Surface,
  ProgressBar,
  Dialog,
  Portal,
  Avatar,
  Chip,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useNutrition } from '../../hooks/useNutrition';
import { useFreshData } from '../../hooks/useFreshData';

const ProfileScreen: React.FC = () => {
  const theme: any = useTheme();
  const { user, logout } = useAuth();
  const { 
    profileCompleteness, 
    isProfileSufficient, 
    calculatedMetrics, 
    generateRecommendedGoals 
  } = useProfile();
  const { themeContext, syncOfflineData, clearError } = useNutrition();
  const { loadProfileData, isReady } = useFreshData();
  
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Call API on every page visit when authenticated
  useEffect(() => {
    if (isReady) {
      loadProfileData();
    }
  }, [isReady, loadProfileData]);

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleGoalSetting = () => {
    router.push('/goal-setting');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadProfileData(),
        syncOfflineData()
      ]);
      clearError();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const getBMIColor = (category: string) => {
    switch (category) {
      case 'underweight': return theme.colors.info;
      case 'normal': return theme.colors.success;
      case 'overweight': return theme.colors.warning;
      case 'obese': return theme.colors.error;
      default: return theme.colors.outline;
    }
  };

  const getBMILabel = (category: string) => {
    switch (category) {
      case 'underweight': return 'Underweight';
      case 'normal': return 'Normal';
      case 'overweight': return 'Overweight';
      case 'obese': return 'Obese';
      default: return 'Unknown';
    }
  };

  const renderProfileHeader = () => (
    <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content style={styles.headerContent}>
        <View style={styles.avatarContainer}>
          <Avatar.Text 
            size={80} 
            label={user?.name?.charAt(0) || 'U'} 
            style={{ backgroundColor: theme.colors.primary }}
          />
          <Text variant="headlineSmall" style={styles.userName}>
            {user?.name || 'User'}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {user?.email}
          </Text>
        </View>

        <View style={styles.profileStats}>
          <View style={styles.statItem}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Profile Completion
            </Text>
            <ProgressBar 
              progress={profileCompleteness / 100} 
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: -12}}>
              {profileCompleteness}%
            </Text>
          </View>

          {/* {isProfileSufficient && (
            <View style={styles.bmiContainer}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                BMI
              </Text>
              <View style={styles.bmiRow}>
                <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
                  {calculatedMetrics.bmi}
                </Text>
                <Chip 
                  mode="flat" 
                  textStyle={{ color: getBMIColor(calculatedMetrics?.bmiCategory) }}
                  style={{ backgroundColor: `${getBMIColor(calculatedMetrics?.bmiCategory)}` }}
                >
                  {getBMILabel(calculatedMetrics.bmiCategory)}
                </Chip>
              </View>
            </View>
          )} */}
        </View>

        <Button 
          mode="outlined" 
          onPress={handleEditProfile}
          style={styles.editButton}
          icon="pencil"
        >
          Edit Profile
        </Button>
      </Card.Content>
    </Card>
  );

  const renderHealthMetrics = () => {
    if (!isProfileSufficient) return null;

    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Health Metrics
          </Text>

          <View style={styles.metricsGrid}>
            <Surface style={[styles.metricItem, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                {calculatedMetrics.bmr}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                BMR (cal/day)
              </Text>
            </Surface>

            <Surface style={[styles.metricItem, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                {calculatedMetrics.tdee}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                TDEE (cal/day)
              </Text>
            </Surface>

            <Surface style={[styles.metricItem, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                {user?.weight || 0}kg
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Weight
              </Text>
            </Surface>

            <Surface style={[styles.metricItem, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                {user?.height || 0}cm
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Height
              </Text>
            </Surface>
          </View>

          <View style={styles.recommendationContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Recommended daily intake: {calculatedMetrics.recommendedCalories} calories
            </Text>
            <Button
              mode="text"
              onPress={() => {
                const goals = generateRecommendedGoals();
                if (goals) {
                  router.push({
                    pathname: '/goal-setting',
                    params: { recommended: JSON.stringify(goals) }
                  });
                }
              }}
              style={styles.recommendButton}
            >
              Use Recommended Goals
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderSettingsCard = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          Settings
        </Text>

        <List.Item
          title="Dark Mode"
          description="Toggle between light and dark theme"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={themeContext.isDarkMode}
              onValueChange={themeContext.toggleTheme}
            />
          )}
        />

        <Divider />

        <List.Item
          title="Nutrition Goals"
          description="Set your daily macro targets"
          left={(props) => <List.Icon {...props} icon="target" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleGoalSetting}
        />
      </Card.Content>
    </Card>
  );

  const renderLogoutCard = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]} elevation={1}>
      <Card.Content>
        <Button
          mode="text"
          onPress={() => setShowLogoutDialog(true)}
          icon="logout"
          textColor={theme.colors.onErrorContainer}
          style={styles.logoutButton}
        >
          Sign Out
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderProfileHeader()}
        {renderHealthMetrics()}
        {renderSettingsCard()}
        {renderLogoutCard()}
      </ScrollView>

      <Portal>
        <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
          <Dialog.Title>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to sign out? Any unsynced data will be lost.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button onPress={handleLogout} textColor={theme.colors.error}>
              Sign Out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 20,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
    padding: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  profileStats: {
    width: '100%',
    marginBottom: 24,
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  bmiContainer: {
    alignItems: 'center',
  },
  bmiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  editButton: {
    width: '100%',
    marginTop: 10
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  recommendationContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  recommendButton: {
    marginTop: 8,
  },
  logoutButton: {
    width: '100%',
  },
});

export default ProfileScreen;