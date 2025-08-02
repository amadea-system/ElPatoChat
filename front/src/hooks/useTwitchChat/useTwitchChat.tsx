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

import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { elPatoApi } from '../../api/elpatoApi';

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
const USE_MOCK_API = false;
const MAX_MESSAGES = 20;

// This is a list of status events that will be displayed in the chat.
// If you want to prevent a status event from being displayed in the chat, remove it from this list.
const STATUS_EVENTS_TO_DISPLAY_IN_CHAT: StatusEventIDPrefix[] = [
  // Chat Status Events
  'chat-auth-failure',
  // 'chat-auth-success',
  'chat-connect-success',
  'chat-disconnect-success',

  // EventSub Status Events
  // 'subscription-create-success',
  // 'subscription-create-failure',
  'user-socket-connect',
  // 'user-socket-disconnect'
];


/* ----- Env Vars ----- */
const CLIENT_ID = import.meta.env['VITE_CLIENT_ID'];
const CLIENT_SECRET = import.meta.env['VITE_CLIENT_SECRET'];
const CLIENT_LOGIN = import.meta.env['VITE_CLIENT_LOGIN'];


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
    fullMsgText: finalContent,
    userDisplayName: 'Hibiki The Chat',  // TODO: Don't hardcode the System Message Username
    messageType: 'system',
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

  const [eventSubListener, setEventSubListener] = useState<EventSubWsListener | null>(null);


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

  /* ----- EventSub Listener Initialization ----- */
  useEffect(() => {

    if (!CLIENT_ID || !CLIENT_SECRET || !CLIENT_LOGIN) {
      // console.error('Twitch Client ID, Client Secret, Static Access Token, or Client Login is not defined in environment variables.');
      return;
    }

    if (channelInfo.login !== CLIENT_LOGIN) {
      // Ensure that we only try to use the EventSub with the channel specified by Env Vars for now.
      console.warn(`Channel name does not match client login in Env Vars. Expected: ${CLIENT_LOGIN}, Received: ${channelInfo.login}`);
      return;
    }

    /* RefreshingAuthProvider */
    async function fetchData(channelInfo: UserInformation) {
      let authProvider;
      let _eventSubListener;
      if (!USE_MOCK_API) {
        const tokenDataResp = await elPatoApi.getUserToken(channelInfo.id);
        if (tokenDataResp.hasError || !tokenDataResp.data) {
          console.error('Failed to fetch user token:', tokenDataResp);
          return;
        }
        
        authProvider = new RefreshingAuthProvider({
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
        });
        console.warn('New `RefreshingAuthProvider` instance created.');

        authProvider.onRefresh(async (userId, newTokenData) => {
          await elPatoApi.setUserToken(userId, newTokenData);
          console.log(`Token data for user ${userId} has been updated.`);
        });
        const tokenData = tokenDataResp.data;
        await authProvider.addUserForToken(tokenData);
        const apiClient = new ApiClient({ authProvider });
        _eventSubListener = new EventSubWsListener({ apiClient });
        _eventSubListener.start();
        setEventSubListener(_eventSubListener);
      }else {
        console.warn('Mock API for EventSub Listener not yet implemented. EventSub Listener will not be started.');
      }

      return _eventSubListener;
    }

    let _eventSubListener: EventSubWsListener | null = null;
    fetchData(channelInfo)
      .catch(error => {
        console.error('Error fetching data for channel:', channelInfo.login, ' Error:', error);
      }).then((__eventSubListener) => {
        if (!__eventSubListener) {
          console.error('EventSub Listener is null after fetching data.');
          return;
        }
        _eventSubListener = __eventSubListener;
        console.log('EventSub Listener started successfully.');
      });
    return () => {
      if (_eventSubListener) {
        _eventSubListener.stop();
      }
      setEventSubListener(null);
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
    if (!eventSubListener) return;

    if (!eventSubListener.isActive){
      console.error('EventSub Listener is not active. Please check your connection.');
      return;
    }

    /* ----- EventSub Helper Functions ----- */

    /** 
     * Helper function to convert Error Messages to a string suitable for display.
     * @param error The error object or message.
     * @return A string representation of the error message.
    */
    const eventSubErrorToString = (error: unknown): string => {
      if (error instanceof Error) {
        return ` => Error: ${error.message}`;
      } else if (typeof error === 'string') {
        return ` => Error: ${error}`;
      }
      return '';
    };

    /* ---- EventSub Listeners ---- */

    /* -- EventSub Listener for Subscription Events -- */
    eventSubListener.onSubscriptionCreateSuccess(async event => {
      // Convert event.id from Format 'channel.update.v2.{USER-ID}' to a form like 'channel.update.v2'.
      const subscriptionID = event.id.substring(0, event.id.lastIndexOf('.'));
      const eventMsgIDPrefix = 'subscription-create-success';

      console.log('onSubscriptionCreateSuccess fired', event._cliName);
      console.log(`Event Msg ID Prefix: ${eventMsgIDPrefix}-${subscriptionID}`);
      console.log(event);
      const chatMsg = `Subscription created successfully for ${event.id} @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}`;  // ${event._twitchId} -
      handleStatusEvent(setChatMessages, eventMsgIDPrefix, true, chatMsg, subscriptionID);
    });

    eventSubListener.onSubscriptionCreateFailure(async (event, error) => {
      // Convert event.id from Format 'channel.update.v2.{USER-ID}' to a form like 'channel.update.v2'.
      const subscriptionID = event.id.substring(0, event.id.lastIndexOf('.'));
      const eventMsgIDPrefix = 'subscription-create-failure';

      console.log('onSubscriptionCreateFailure fired');
      console.log(event);
      console.error('Error:', error);

      console.error(`Event Msg ID Prefix: ${eventMsgIDPrefix}-${subscriptionID}`);

      const chatMsg = `Subscription creation failed for ${event.id} @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}${eventSubErrorToString(error)}`;  // ${event._twitchId} -
      handleStatusEvent(setChatMessages, eventMsgIDPrefix, true, chatMsg, subscriptionID);
    });

    eventSubListener.onUserSocketConnect((userID) => {
      console.log('onUserSocketConnect fired for user:', userID);
      const eventMsgIDPrefix = 'user-socket-connect';
      const chatMsg = `User ${userID} connected to socket @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}`;
      handleStatusEvent(setChatMessages, eventMsgIDPrefix, true, chatMsg);
    });

    eventSubListener.onUserSocketDisconnect((userID, error) => {
      console.log('onUserSocketDisconnect fired for user:', userID, 'Error:', error);
      const eventMsgIDPrefix = 'user-socket-disconnect';
      const chatMsg = `User ${userID} disconnected from socket @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}${eventSubErrorToString(error)}.`;
      handleStatusEvent(setChatMessages, eventMsgIDPrefix, true, chatMsg);
    });

    /* -- EventSub Listener for Channel Events -- */

    eventSubListener.onChannelFollow(channelInfo.id, channelInfo.id, async e => {
      console.log(`User ${e.userDisplayName} followed channel ${e.broadcasterDisplayName}`);
  
      const uniqueId = `channel-follow-${crypto.randomUUID()}`;
      const newMessage: ChatMessageData = createNewMessage({
        id: uniqueId,
        fullMsgText: 'Thank you so much!!!!!',
        userDisplayName: e.userDisplayName,
        messageType: 'follow',
        contentParts: [
          {
            content: '@' + e.userDisplayName + ' just followed!!!',
            type: 'follow',
            originalContent: '',
          },
          {
            content: 'Thank you so much!!!!!',
            type: 'text',
            originalContent: '',
          }
        ]
      });
      setChatMessages((msgs) => (
        [newMessage, ...msgs].slice(0, MAX_MESSAGES)
      ));
    });
  
    eventSubListener.onChannelUpdate(channelInfo.id, e => {
      console.log(`Channel ${e.broadcasterDisplayName} updated: Title: ${e.streamTitle}, Category: ${e.categoryName}`);

      const uniqueId = `channel-update-${crypto.randomUUID()}`;
      const newMessage: ChatMessageData = createNewMessage({
        id: uniqueId,
        fullMsgText: `Chat, we're switching it up!!! ${e.categoryName} time!!! Let's have a nice "${e.streamTitle}"`,
        userDisplayName: 'Hibiki The Chat',  // TODO: Don't hardcode the System Message Username
        messageType: 'system'
      });
      setChatMessages((msgs) => (
        [newMessage, ...msgs].slice(0, MAX_MESSAGES)
      ));
    });
  
  }, [eventSubListener, channelInfo]);

  useEffect(() => {
    onMessageHandlerRef.current = async (channel: string, user: string, text: string, msg: TwurpleChatMessage) => {
      if (configuration.ignoredUsers.find(ignoredUser => ignoredUser.value === user)) return;
      const pronoun = await getPronounsFromTwitchName(user);
      const msgParts = TwitchChatParser.parseMessage(msg.text, msg.emoteOffsets, customEmotes, msg);

      const effect = TwitchChatParser.parseMessageEffect(msg);

      const newMessage: ChatMessageData = {
        id: msg.id,
        effect,
        fullMsgText: msg.text,
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
          content: newMessage.fullMsgText,
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