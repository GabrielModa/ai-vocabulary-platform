import type { ReactNode } from "react";
import {
  Pressable,
  Text as ReactNativeText,
  View,
  type PressableProps,
  type TextProps as ReactNativeTextProps,
  type ViewProps,
} from "react-native";
import { nativeTokens } from "../adapters.js";
import type { SemanticState } from "../tokens.js";

export interface NativeButtonProps extends Omit<PressableProps, "children"> {
  readonly accessibilityLabel: string;
  readonly busy?: boolean;
  readonly children: ReactNode;
  readonly state?: SemanticState;
}

export function Button({
  accessibilityLabel,
  busy = false,
  children,
  disabled = false,
  state = "default",
  ...props
}: Readonly<NativeButtonProps>) {
  const unavailable = [disabled, busy].some(Boolean);
  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: unavailable }}
      disabled={unavailable}
      testID={`ui-button-${busy ? "loading" : state}`}
      style={({ pressed }) => ({
        minHeight: nativeTokens.minTarget,
        minWidth: nativeTokens.minTarget,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: nativeTokens.space.md,
        paddingVertical: nativeTokens.space.sm,
        borderRadius: nativeTokens.radius.md,
        backgroundColor: nativeTokens.color.primary,
        opacity: unavailable ? 0.55 : pressed ? 0.82 : 1,
      })}
    >
      <ReactNativeText allowFontScaling style={{ color: nativeTokens.color.onPrimary }}>
        {children}
      </ReactNativeText>
    </Pressable>
  );
}

export function Text({ children, ...props }: Readonly<ReactNativeTextProps>) {
  return (
    <ReactNativeText
      allowFontScaling
      {...props}
      style={[{ color: nativeTokens.color.text, fontSize: nativeTokens.fontSize.md }, props.style]}
    >
      {children}
    </ReactNativeText>
  );
}

export function Surface({ children, ...props }: Readonly<ViewProps>) {
  return (
    <View
      {...props}
      style={[
        {
          padding: nativeTokens.space.lg,
          borderWidth: 1,
          borderColor: nativeTokens.color.border,
          borderRadius: nativeTokens.radius.lg,
          backgroundColor: nativeTokens.color.surface,
        },
        props.style,
      ]}
    >
      {children}
    </View>
  );
}
