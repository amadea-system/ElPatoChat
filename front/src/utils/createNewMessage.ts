import { ChatMessageData, MessagePart } from '../types';

export const createNewMessage = (
  data: Omit<Partial<ChatMessageData>, 'id' | 'userDisplayName'> & { id: string; userDisplayName: string },
  typeOverride?: MessagePart['type']
): ChatMessageData => {

  if (!data.contentParts && data.fullMsgText) {
    data.contentParts = [{
      originalContent: data.fullMsgText,
      content: data.fullMsgText,
      type: typeOverride || 'text'
    }];
  }

  return {
    effect: 'normal',
    emoteOffsets: new Map(),
    fullMsgText: '',
    // displayPronoun: 'they/them',  // Optional
    // color: '#FFFFFF',  // Optional
    badges: [],
    contentParts: [],
    messageType: 'chat',
    ...data
  };
};
