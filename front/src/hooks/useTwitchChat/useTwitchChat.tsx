import { ChatClient } from '@twurple/chat';
import { useEffect, useRef, useState } from 'react';
import { ChatMessageData } from '../../types';
import { TwurpleChatMessage } from './types';
import { usePronouns } from '../usePronouns';
import { useBadges } from '../useBadges';
import { UserInformation } from '../../api/elpatoApi/types';
import { TwitchChatParser } from './twitchChatParser';
import { useCustomEmotes } from '../useCustomEmotes';
import { useTTS } from '../useTTS/useTTS';
import { useConfiguration } from '../../store/configuration';
import { createNewMessage } from '../../utils/createNewMessage';

const MAX_MESSAGES = 20;

type OnChatMessageEventHandler = (channel: string, user:string, text:string, msg: TwurpleChatMessage) => Promise<void>;

export const useTwitchChat = (channel: UserInformation) => {
  const configuration = useConfiguration(state => state);

  const { 
    clearQueue: ttsClearQueue,
    onRemoveMessage: ttsRemoveMessage,
    speak: ttsSpeak
  } = useTTS();
  const customEmotes = useCustomEmotes(channel.id);
  const { parseBadges } = useBadges(channel.id);
  const { getPronounsFromTwitchName } = usePronouns();
  const [chat, setChat] = useState<ChatClient | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<ChatMessageData> | []>([]);
  const onMessageHandlerRef = useRef<OnChatMessageEventHandler | null>(null);
  const onChatClearRef = useRef<(() => void) | null>(null);
  const onMessageRemovedRef = useRef<((messageId: string) => void) | null>(null);

  useEffect(() => {
    const chatClient = new ChatClient({
      channels: [channel.login]
    });
    chatClient.connect();
    setChat(chatClient);

    return () => {
      chatClient.quit();
      setChat(null);
    };
  }, [channel]);

  // avoids reconnection on callback changes by keeping them on ref
  // twurple does not allow us to disconnect events for some reason... :/ so this works
  useEffect(() => {
    if (!chat) return;
    /*
    chat.irc.onAnyMessage((e) => {
      console.log(e);
    });
    */

    chat.onMessage(async (channel: string, user: string, text: string, msg: TwurpleChatMessage) => {
      if (!onMessageHandlerRef.current) return;
      await onMessageHandlerRef.current(channel, user, text, msg);
    });

    chat.onChatClear(() => {
      if (onChatClearRef.current) {
        onChatClearRef.current();
      }
      setChatMessages([]);
    });

    chat.onBan((channel, user) => {
      setChatMessages(prev => prev.filter(item => {
        const shouldKeep = item.userDisplayName.toLowerCase() !== user;

        if (!shouldKeep && onMessageRemovedRef.current) {
          onMessageRemovedRef.current(item.id);
        }

        return shouldKeep;
      }));
    });

    chat.onTimeout((channel, user) => {
      setChatMessages(prev => prev.filter(item => {
        const shouldKeep = item.userDisplayName.toLowerCase() !== user;

        if (!shouldKeep && onMessageRemovedRef.current) {
          onMessageRemovedRef.current(item.id);
        }

        return shouldKeep;
      }));
    });

    chat.onMessageRemove((channel: string, messageId: string) => {
      if (onMessageRemovedRef.current) {
        onMessageRemovedRef.current(messageId);
      }
      setChatMessages(prev => prev.filter(item => item.id !== messageId));
    });

    chat.onAuthenticationFailure((text, retryCount) => {
      console.error(`Authentication failed: ${text}. Retry count: ${retryCount}`);
      const uniqueId = `auth-failure-${crypto.randomUUID()}`;
      const newMessage: ChatMessageData = createNewMessage({
        id: uniqueId,
        // content: 'Twitch Chat Authentication Failure...',
        content: `Twitch Chat Authentication Failure @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}`,
        userDisplayName: 'Hibiki The Chat',  // TODO: Don't hardcode the System Message Username
        systemMessage: true
      });
      setChatMessages((msgs) => (
        [newMessage, ...msgs].slice(0, MAX_MESSAGES)
      ));
    });

    chat.onAuthenticationSuccess(() => {
      console.log('Twitch Chat Authentication Success');
      const uniqueId = `auth-success-${crypto.randomUUID()}`;
      const newMessage: ChatMessageData = createNewMessage({
        id: uniqueId,
        // content: 'Twitch Chat Authentication Success...',
        content: `Twitch Chat Authentication Success @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}`,
        userDisplayName: 'Hibiki The Chat',  // TODO: Don't hardcode the System Message Username
        systemMessage: true
      });
      setChatMessages((msgs) => (
        [newMessage, ...msgs].slice(0, MAX_MESSAGES)
      ));
    });

    chat.onConnect(() => {
      console.log('Twitch Chat Connected');
      const uniqueId = `connect-success-${crypto.randomUUID()}`;
      const newMessage: ChatMessageData = createNewMessage({
        id: uniqueId,
        // content: 'Twitch Chat Connected...',
        content: `Twitch Chat Connected @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}`,
        userDisplayName: 'Hibiki The Chat',  // TODO: Don't hardcode the System Message Username
        systemMessage: true
      });
      setChatMessages((msgs) => (
        [newMessage, ...msgs].slice(0, MAX_MESSAGES)
      ));
    });

    chat.onDisconnect((manually, reason) => {
      console.log(`Twitch Chat Disconnected. Manually: ${manually}, Reason: ${reason}`);
      const uniqueId = `disconnect-success-${crypto.randomUUID()}`;
      const newMessage: ChatMessageData = createNewMessage({
        id: uniqueId,
        // content: 'Twitch Chat Disconnected...',
        content: `Twitch Chat Disconnected @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}`,
        userDisplayName: 'Hibiki The Chat',  // TODO: Don't hardcode the System Message Username
        systemMessage: true
      });
      setChatMessages((msgs) => (
        [newMessage, ...msgs].slice(0, MAX_MESSAGES)
      ));
    });

  }, [chat]);

  useEffect(() => {
    onMessageHandlerRef.current = async (channel: string, user: string, text: string, msg: TwurpleChatMessage) => {
      if (configuration.ignoredUsers.find(ignoredUser => ignoredUser.value === user)) return;
      const pronoun = await getPronounsFromTwitchName(user);
      const msgParts = TwitchChatParser.parseMessage(msg.text, msg.emoteOffsets, customEmotes, msg);

      const effect = TwitchChatParser.parseMessageEffect(msg);

      const newMessage: ChatMessageData = {
        id: msg.id,
        effect,
        content: msg.text,
        userDisplayName: msg.userInfo.displayName,
        displayPronoun: pronoun,
        color: msg.userInfo.color,
        emoteOffsets: msg.emoteOffsets,
        badges: parseBadges(msg.userInfo.badges),
        contentParts: msgParts
      };

      if (configuration.isTTSEnabled) {
        ttsSpeak({
          parts: msgParts,
          content: newMessage.content,
          id: newMessage.id,
          sentBy: newMessage.userDisplayName
        });
      }

      setChatMessages((msgs) => (
        [newMessage, ...msgs].slice(0, MAX_MESSAGES)
      ));
    };
  }, [getPronounsFromTwitchName, parseBadges, customEmotes, ttsSpeak, configuration]);

  useEffect(() => {
    onMessageRemovedRef.current = (msgId: string) => {
      if (configuration.isTTSEnabled) {
        ttsRemoveMessage([msgId]);
      }
    };
  }, [ttsRemoveMessage, configuration]);

  useEffect(() => {
    onChatClearRef.current = ttsClearQueue;
  }, [ttsClearQueue]);

  return {
    chat,
    chatMessages
  };
};