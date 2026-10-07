/**
 * AuthInput — Komponen input form autentikasi yang dapat digunakan ulang.
 * Mendukung semua aksesibilitas (accessibilityLabel, accessibilityHint),
 * tampilan error, dan toggle visibility untuk field password.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  isPassword?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export function AuthInput({
  label,
  error,
  isPassword = false,
  iconName,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: AuthInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {/* Ikon kiri */}
        {iconName && (
          <Ionicons
            name={iconName}
            size={18}
            color={error ? '#DC2626' : '#64748B'}
            style={styles.iconLeft}
            importantForAccessibility="no"
          />
        )}

        <TextInput
          style={styles.input}
          secureTextEntry={isPassword && !isVisible}
          autoCapitalize={isPassword ? 'none' : rest.autoCapitalize}
          placeholderTextColor="#94A3B8"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ selected: false }}
          {...rest}
        />

        {/* Toggle visibility untuk field password */}
        {isPassword && (
          <Pressable
            style={styles.eyeButton}
            onPress={() => setIsVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={isVisible ? 'Sembunyikan password' : 'Tampilkan password'}
            accessibilityHint={
              isVisible
                ? 'Ketuk untuk menyembunyikan karakter password'
                : 'Ketuk untuk menampilkan karakter password'
            }
          >
            <Ionicons
              name={isVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#64748B"
              importantForAccessibility="no"
            />
          </Pressable>
        )}
      </View>

      {/* Pesan error */}
      {error ? (
        <View
          style={styles.errorRow}
          accessibilityRole="alert"
          accessibilityLabel={`Error: ${error}`}
        >
          <Ionicons
            name="alert-circle"
            size={13}
            color="#DC2626"
            importantForAccessibility="no"
          />
          <Text style={styles.errorText} importantForAccessibility="no">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 50, // Memenuhi minimum tap target 44px
    paddingHorizontal: 14,
    gap: 8,
  },
  inputError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  iconLeft: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 12,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
});
