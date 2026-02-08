import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Don't show error boundary for timeout errors during development
    if (__DEV__ && error.message && 
        (error.message.includes('6000ms timeout exceeded') || 
         error.message.includes('timeout') ||
         error.message.includes('flipper'))) {
      console.log('Suppressed timeout error in ErrorBoundary:', error.message);
      return { hasError: false }; // Don't show error UI for timeout errors
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__ && error.message && 
        (error.message.includes('6000ms timeout exceeded') || 
         error.message.includes('timeout') ||
         error.message.includes('flipper'))) {
      console.log('Suppressed timeout error in ErrorBoundary:', error.message);
      return; // Don't log timeout errors
    }
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Card style={styles.card} elevation={2}>
            <Card.Content style={styles.content}>
              <Text variant="headlineSmall" style={styles.title}>
                Something went wrong
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                The app encountered an unexpected error. Please try again.
              </Text>
              {__DEV__ && this.state.error && (
                <Text variant="bodySmall" style={styles.errorDetails}>
                  {this.state.error.message}
                </Text>
              )}
              <Button
                mode="contained"
                onPress={this.handleReset}
                style={styles.button}
              >
                Try Again
              </Button>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorDetails: {
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  button: {
    minWidth: 120,
  },
});

export default ErrorBoundary;