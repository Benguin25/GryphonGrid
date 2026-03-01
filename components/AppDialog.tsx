import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";

interface AppDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Makes the confirm button red */
  destructive?: boolean;
  /** Shows a spinner on the confirm button and disables it */
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * In-app confirmation / info dialog — replaces native Alert.alert.
 * If cancelText is omitted, only the confirm button is shown (info mode).
 */
export default function AppDialog({
  visible,
  title,
  message,
  confirmText = "OK",
  cancelText,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: AppDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel ?? onConfirm}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={[styles.buttons, !cancelText && styles.buttonsSingle]}>
            {cancelText && onCancel ? (
              <Pressable
                style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && styles.pressed]}
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                destructive ? styles.destructiveBtn : styles.confirmBtn,
                loading && styles.disabledBtn,
                pressed && styles.pressed,
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.confirmText, !cancelText && styles.confirmTextSingle]}>
                  {confirmText}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 4,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  buttonsSingle: {
    justifyContent: "center",
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  cancelBtn: {
    backgroundColor: "#f3f4f6",
  },
  confirmBtn: {
    backgroundColor: "#CC0000",
  },
  destructiveBtn: {
    backgroundColor: "#dc2626",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  confirmTextSingle: {
    textAlign: "center",
  },
});
