# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:


# ============================
# React Native (Required)
# ============================
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**

# ============================
# MapLibreGL (Required)
# ============================
-keep class org.maplibre.** { *; }
-dontwarn org.maplibre.**

# ============================
# react-native-config (Required)
# ============================
-keep class com.lugg.ReactNativeConfig.** { *; }
-dontwarn com.lugg.ReactNativeConfig.**

# ============================
# Geolocation (RN Community)
# ============================
-keep class com.reactnativecommunity.geolocation.** { *; }
-dontwarn com.reactnativecommunity.geolocation.**

# ============================
# CompassHeading
# ============================
-keep class com.reactnativecompassheading.** { *; }
-dontwarn com.reactnativecompassheading.**

# ============================
# General Android Safety Rules
# ============================
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
