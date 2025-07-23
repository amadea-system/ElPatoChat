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

/* ----------- Types ---------- */
type OnChatMessageEventHandler = (channel: string, user:string, text:string, msg: TwurpleChatMessage) => Promise<void>;

type ChatStatusEventIDPrefix = 
      'chat-auth-failure'            // chat.onAuthenticationFailure
    | 'chat-auth-success'            // chat.onAuthenticationSuccess
    | 'chat-connect-success'         // chat.onConnect
    | 'chat-disconnect-success';     // chat.onDisconnect

type EventSubStatusEventIDPrefix = 
      'subscription-create-success'  // eventSubListener.onSubscriptionCreateSuccess  (Generic Event ID)
    | 'subscription-create-failure'  // eventSubListener.onSubscriptionCreateFailure  (Generic Event ID)
    | 'user-socket-connect'          // eventSubListener.onUserSocketConnect
    | 'user-socket-disconnect';      // eventSubListener.onUserSocketDisconnect

type StatusEventIDPrefix = ChatStatusEventIDPrefix | EventSubStatusEventIDPrefix;

/* ----- Configs ----- */
const MAX_MESSAGES = 20;

// This is a list of status events that will be displayed in the chat.
// If you want to prevent a status event from being displayed in the chat, remove it from this list.
const STATUS_EVENTS_TO_DISPLAY_IN_CHAT: StatusEventIDPrefix[] = [
  // Chat Status Events
  'chat-auth-failure',
  // 'chat-auth-success',
  'chat-connect-success',
  'chat-disconnect-success',



/* ---------- Helper Functions ---------- */

/**
 * Helper function to remove any similar messages from the chat messages state.
 * @param messageIds A message ID to remove. Strings or Regex patterns can be used.
 *                   If string, it will remove messages that start with the string.
 * @return void
 */
const removeMessagesById = (setChatMessages: React.Dispatch<React.SetStateAction<Array<ChatMessageData> | []>>, messageId: string | RegExp) => {
  setChatMessages((msgs) => msgs.filter(msg => {
    if (typeof messageId === 'string') {
      return !msg.id.startsWith(messageId);
    } else {
      return !messageId.test(msg.id);
    }
  }));
};


const handleStatusEvent = (
  setChatMessages: React.Dispatch<React.SetStateAction<Array<ChatMessageData> | []>>,
  statusEventID: StatusEventIDPrefix,
  removePastMessages: boolean = true,
  content: string = '',
  additionalID: string | null = null
): void => {
  if (!STATUS_EVENTS_TO_DISPLAY_IN_CHAT.includes(statusEventID)) {
    return;
  }

  const msgIDPrefix = additionalID ? `${statusEventID}-${additionalID}` : statusEventID;
  const uniqueId = `${msgIDPrefix}-${crypto.randomUUID()}`;
  const finalContent = content || `Event: ${msgIDPrefix} @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}`;

  const newMessage: ChatMessageData = createNewMessage({
    id: uniqueId,
    content: finalContent,
    userDisplayName: 'Hibiki The Chat',  // TODO: Don't hardcode the System Message Username
    systemMessage: true
  });

  if (removePastMessages) {
    removeMessagesById(setChatMessages, `${msgIDPrefix}-`);
  }
  
  setChatMessages((msgs) => (
    [newMessage, ...msgs].slice(0, MAX_MESSAGES)
  ));
};

/* ---------- Main Hook ---------- */

export const useTwitchChat = (channelInfo: UserInformation) => {
  const configuration = useConfiguration(state => state);

  const { 
    clearQueue: ttsClearQueue,
    onRemoveMessage: ttsRemoveMessage,
    speak: ttsSpeak
  } = useTTS();
  const customEmotes = useCustomEmotes(channelInfo.id);
  const { parseBadges } = useBadges(channelInfo.id);
  const { getPronounsFromTwitchName } = usePronouns();
  const [chat, setChat] = useState<ChatClient | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<ChatMessageData> | []>([]);
  const onMessageHandlerRef = useRef<OnChatMessageEventHandler | null>(null);
  const onChatClearRef = useRef<(() => void) | null>(null);
  const onMessageRemovedRef = useRef<((messageId: string) => void) | null>(null);

  /* ----- Chat Client Initialization ----- */
  useEffect(() => {
    const chatClient = new ChatClient({
      channels: [channelInfo.login]
    });
    chatClient.connect();
    setChat(chatClient);
    console.log(`Twitch Chat Client Connected to channel: ${channelInfo.login}`);
    console.log('Twitch Channel Details:', channelInfo);

    return () => {
      chatClient.quit();
      setChat(null);
    };
  }, [channelInfo]);

  /* ----- Chat Event Handlers ----- */
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
      const eventMsgIDPrefix = 'chat-auth-failure';
      const chatMsg = `Twitch Chat Authentication Failure @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}`;
      handleStatusEvent(setChatMessages, eventMsgIDPrefix, true, chatMsg);
    });

    chat.onAuthenticationSuccess(() => {
      console.log('Twitch Chat Authentication Success');
      const eventMsgIDPrefix = 'chat-auth-success';
      const chatMsg = `Twitch Chat Authentication Success @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}`;
      handleStatusEvent(setChatMessages, eventMsgIDPrefix, true, chatMsg);
    });

    chat.onConnect(() => {
      console.log('Twitch Chat Connected');
      const eventMsgIDPrefix = 'chat-connect-success';
      const chatMsg = `Twitch Chat Connected @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}`;
      handleStatusEvent(setChatMessages, eventMsgIDPrefix, true, chatMsg);
    });

    chat.onDisconnect((manually, reason) => {
      console.log(`Twitch Chat Disconnected. Manually: ${manually}, Reason: ${reason}`);
      const eventMsgIDPrefix = 'chat-disconnect-success';
      const chatMsg = `Twitch Chat Disconnected @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}`;
      handleStatusEvent(setChatMessages, eventMsgIDPrefix, true, chatMsg);
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
        messageType: 'chat',
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