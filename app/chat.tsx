import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaWrapper } from '../src/components/layout/SafeAreaWrapper';
import { useAuth } from '../src/context/AuthContext';
import { ChatMessage, sendChatMessage, subscribeToChatMessages } from '../src/services/firebase/chat';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../src/constants/theme';

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(setMessages);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  async function handleSend() {
    if (!draft.trim() || !user?.email || sending) return;
    setSending(true);
    try {
      await sendChatMessage(draft, user.email);
      setDraft('');
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaWrapper style={styles.wrap}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>ATENCIÓN AL CLIENTE</Text>
          <Text style={styles.subtitle}>Sala general — SUSURROS</Text>
        </View>
        <View style={styles.backSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.usuario === user?.email} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Aún no hay mensajes. Escribe tu consulta y el equipo de SUSURROS te responderá aquí.
            </Text>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe tu mensaje…"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendLabel}>ENVIAR</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

function MessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  return (
    <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && <Text style={styles.sender}>{message.usuario}</Text>}
        <Text style={styles.messageText}>{message.texto}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: SPACING.lg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  back: { ...TYPOGRAPHY.headline, color: COLORS.gold, fontSize: 28, width: 28 },
  backSpacer: { flex: 1 },
  title: { ...TYPOGRAPHY.title, color: COLORS.textPrimary, letterSpacing: 2 },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  list: { paddingVertical: SPACING.md, gap: SPACING.sm },
  empty: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING['2xl'],
  },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  bubbleOther: {
    backgroundColor: COLORS.abyss,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  bubbleOwn: {
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  sender: { ...TYPOGRAPHY.labelSm, color: COLORS.gold, marginBottom: 2 },
  messageText: { ...TYPOGRAPHY.body, color: COLORS.textPrimary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.strokeSubtle,
    backgroundColor: COLORS.abyss,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...TYPOGRAPHY.body,
  },
  sendBtn: {
    height: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendLabel: { ...TYPOGRAPHY.label, color: COLORS.gold },
});
