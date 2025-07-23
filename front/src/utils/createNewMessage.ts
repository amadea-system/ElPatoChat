import { ChatMessageData, MessagePart } from '../types';

export const createNewMessage = (
  data: Omit<Partial<ChatMessageData>, 'id' | 'userDisplayName'> & { id: string; userDisplayName: string },
  typeOverride?: MessagePart['type']
): ChatMessageData => {

  if (!data.contentParts && data.content) {
    data.contentParts = [{
      originalContent: data.content,
      content: data.content,
      type: typeOverride || 'text'
    }];
  }

  return {
    effect: 'normal',
    emoteOffsets: new Map(),
    content: '',
    // displayPronoun: 'they/them',  // Optional
    // color: '#FFFFFF',  // Optional
    // systemMessage: false,  // Optional
    badges: [],
    contentParts: [],
    messageType: 'chat',
    ...data
  };
};
