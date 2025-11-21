import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
  Image,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import axios from 'axios';
import GlassCard from '../styles/SharedGlassCard';

const { width } = Dimensions.get('window');

type RegistrationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegistrationScreenNavigationProp>();
  const [employeeId, setEmployeeId] = useState('');
  const [employeename, setEmployeename] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | null>(null);
  const [modalMessage, setModalMessage] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const handleEmployeeIdChange = (text: string) => {
    setEmployeeId(text.toUpperCase());
  };

  const handleRegister = async () => {
    const empIdPattern = /^DT-\d{5}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

    // 🔹 Validate all required fields
    if (!employeeId || !employeename || !email || !password) {
      setModalType('error');
      setModalMessage('⚠️ All fields are required!');
      setModalVisible(true);
      return;
    }

    // 🔹 Validate employee ID format
    if (!empIdPattern.test(employeeId)) {
      setModalType('error');
      setModalMessage('⚠️ Employee ID must be in the format DT-XXXXX');
      setModalVisible(true);
      return;
    }

    // 🔹 Validate DeduceTech email format
    if (!emailPattern.test(email)) {
      setModalType('error');
      setModalMessage('⚠️ Email must end with @deducetech.in or @deducetech.com');
      setModalVisible(true);
      return;
    }

    setLoading(true);
    animatePress();

    try {
      const res = await axios.post('https://deduce-drive-tracker-be.onrender.com/auth/register', {
        employee_id: employeeId,
        employee_name: employeename,
        email,
        password,
      });

      if (res.status === 200) {
        setModalType('success');
        setModalMessage('✅ Registration Successful!');
        setModalVisible(true);
        setTimeout(() => {
          setModalVisible(false);
          navigation.replace('Login');
        }, 1500);
      } else {
        setModalType('error');
        setModalMessage('❌ Registration Failed. Try again!');
        setModalVisible(true);
      }
    } catch {
      setModalType('error');
      setModalMessage('❌ Something went wrong. Please try again.');
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
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
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/CompanyLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Deduce Drive Tracker</Text>
          </View>

          <Text style={styles.subtitle}>Create Account</Text>

          {/* Employee ID */}
          <TextInput
            style={[
              styles.input,
              focusedInput === 'employeeId' && styles.inputFocused,
            ]}
            placeholder="Employee ID (DT-XXXXX)"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={employeeId}
            onChangeText={handleEmployeeIdChange}
            autoCapitalize="characters"
            maxLength={8}
            onFocus={() => setFocusedInput('employeeId')}
            onBlur={() => setFocusedInput(null)}
          />

          {/* Employee Name */}
          <TextInput
            style={[
              styles.input,
              focusedInput === 'employeeName' && styles.inputFocused,
            ]}
            placeholder="Employee Name"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={employeename}
            onChangeText={setEmployeename}
            onFocus={() => setFocusedInput('employeeName')}
            onBlur={() => setFocusedInput(null)}
          />

          {/* Email */}
          <TextInput
            style={[
              styles.input,
              focusedInput === 'email' && styles.inputFocused,
            ]}
            placeholder="Email (name@deducetech.in/.com)"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
          />

          {/* Password Input */}
          <View style={{ width: width * 0.75, marginBottom: 18 }}>
            <TextInput
              style={[
                styles.input,
                focusedInput === 'password' && styles.inputFocused,
                { paddingRight: 45 } // space for eye icon
              ]}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}  // 👈 toggle show/hide
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />

            {/* 👁 Show / Hide Password Icon */}
            <TouchableOpacity
              onPress={() => setShowPassword(prev => !prev)}
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                padding: 4,
              }}
            >
              <Image
                source={{
                  uri: showPassword
                    ? "https://img.icons8.com/ios-filled/50/visible.png"
                    : "https://img.icons8.com/ios-filled/50/closed-eye.png",
                }}
                style={{ width: 22, height: 22, tintColor: "white" }}
              />
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
            <Pressable
              onPress={handleRegister}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                pressed && { backgroundColor: '#1e7e34' },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Already have an account */}
          <View style={styles.bottomLinks}>
            <Text style={styles.linkLabel}>Already registered?</Text>
            <Pressable onPress={() => navigation.replace('Login')}>
              <Text style={styles.linkText}>Login</Text>
            </Pressable>
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
                shadowOpacity: 0.25,
                shadowRadius: 5,
                elevation: 6,
              },
            ]}
          >
            <Text
              style={[
                styles.modalText,
                { color: modalType === 'success' ? '#28a745' : '#ff4d4d' },
              ]}
            >
              {modalMessage}
            </Text>

            {modalType === 'error' && (
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      modalType === 'error' ? '#ff4d4d' : '#28a745',
                  },
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
    marginRight: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '60%',
    textAlign: 'center',
    marginLeft: 0,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
    opacity: 0.9,
  },
  input: {
    width: width * 0.75,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 18,
    fontSize: 16,
    color: '#000',
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.75,
  },
  linkLabel: {
    color: '#000',
    fontSize: 14,
  },
  linkText: {
    color: 'black',
    fontSize: 14,
    textDecorationLine: 'underline',
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

export default RegisterScreen;
