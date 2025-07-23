import { useConfiguration } from '../../store/configuration';
import { ChatMessageData } from '../../types';
import ChatMsgHeader from './chatHeader';
import ChatMsgContent from './chatMsgContent';
import * as S from './styles';

export interface ChatMsgProps extends ChatMessageData {
}

const ChatMsg = (props: ChatMsgProps) => {
  const chatDirection = useConfiguration(state => state.chatDirection);

  if (props.messageType === 'system') {
    return (
      <S.Message $direction={chatDirection}>
        <S.SystemContent $userColor='#DD0000' $effect={props.effect} $direction={chatDirection}>
          <ChatMsgContent userColor={props.color} messageParts={props.contentParts} />
        </S.SystemContent>
      </S.Message>
    );
  } else if (props.messageType === 'follow') {
    return (
      <S.Message $direction={chatDirection}>
        <S.FollowNotificationContent $userColor={props.color ?? 'black'} $effect={props.effect} $direction={chatDirection}>
          <ChatMsgContent userColor={props.color} messageParts={props.contentParts} />
        </S.FollowNotificationContent>
      </S.Message>
    );
  }
  // Default case for chat messages
  return (
    <S.Message $direction={chatDirection}>
      <ChatMsgHeader {...props} direction={chatDirection} />
      <S.Content $userColor={props.color ?? 'black'} $effect={props.effect} $direction={chatDirection}>
        <ChatMsgContent userColor={props.color} messageParts={props.contentParts} />
      </S.Content>
    </S.Message>
  );
};

export default ChatMsg;