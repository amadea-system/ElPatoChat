import { ChatMessageData } from '../types';

export const createNewMessage = (
  data: Omit<Partial<ChatMessageData>, 'id' | 'userDisplayName'> & { id: string; userDisplayName: string }
): ChatMessageData => {

  if (!data.contentParts && data.content) {
    data.contentParts = [{
      originalContent: data.content,
      content: data.content,
      type: 'text'
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
    ...data
  };
};
