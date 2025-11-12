import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Modal,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import GlassCard from './SharedGlassCard';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | null>(null);
  const [modalMessage, setModalMessage] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleEmployeeIdChange = (text: string) => {
    setEmployeeId(text.toUpperCase());
  };

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    const empIdPattern = /^DT-\d{5}$/;

    if (!empIdPattern.test(employeeId)) {
      setModalType('error');
      setModalMessage('⚠️ Employee ID must be in the format DT-XXXXX');
      setModalVisible(true);
      return;
    }

    setLoading(true);
    animatePress();

    setTimeout(() => {
      setLoading(false);
      if (employeeId === 'DT-12345' && password === '1234') {
        setModalType('success');
        setModalMessage('✅ Login Successful!');
        setModalVisible(true);
        setTimeout(() => {
          setModalVisible(false);
          navigation.replace('Home');
        }, 1500);
      } else {
        setModalType('error');
        setModalMessage('❌ Invalid Employee ID or password');
        setModalVisible(true);
      }
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <GlassCard style={styles.card}>
          {/* Logo + Title */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/CompanyLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Deduce Drive Tracker</Text>
          </View>

          <Text style={styles.subtitle}>Employee Login</Text>

          {/* Employee ID Input */}
          <TextInput
            style={[
              styles.input,
              focusedInput === 'employeeId' && styles.inputFocused,
            ]}
            placeholder="Employee ID (DT-XXXXX)"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={employeeId}
            onChangeText={handleEmployeeIdChange}
            onFocus={() => setFocusedInput('employeeId')}
            onBlur={() => setFocusedInput(null)}
            autoCapitalize="characters"
            maxLength={8}
          />

          {/* Password Input */}
          <TextInput
            style={[
              styles.input,
              focusedInput === 'password' && styles.inputFocused,
            ]}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
            secureTextEntry
          />

          {/* Login Button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.button, loading && { opacity: 0.8 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom Links */}
          <View style={styles.bottomLinks}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.linkText}>New User? Register</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Success/Error Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
      <View style={styles.modalContainer}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: '#ffffff',
              borderColor: modalType === 'success' ? '#28a745' : '#ff4d4d',
              borderWidth: 1.5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 5,
              elevation: 6,
            },
          ]}
        >
          <Text
            style={[
              styles.modalText,
              {
                color: modalType === 'success' ? '#28a745' : '#ff4d4d',
                fontWeight: '600',
              },
            ]}
          >
            {modalMessage}
          </Text>

          {modalType === 'error' && (
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: modalType === 'error' ? '#ff4d4d' : '#28a745' },
              ]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  card: {
    width: width * 0.9,
    alignItems: 'center',
    paddingVertical: 25,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginRight: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '60%',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    marginLeft: 0, 
  },
  subtitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  input: {
    width: width * 0.75,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 18,
    fontSize: 16,
    color: 'black',
  },
  inputFocused: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderColor: '#4688b4ff',
    borderWidth: 1,
    shadowColor: '#56a8dfff',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  button: {
    width: width * 0.75,
    height: 50,
    backgroundColor: '#28a745',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.75,
  },
  linkText: {
    color: 'black',
    fontSize: 14,
    textDecorationLine: 'underline',
    opacity: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: '80%',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  modalText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalButton: {
    width: '50%',
    padding: 10,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default LoginScreen;
