import { useEffect, useState } from 'react';
import { UserInformation } from '../../../api/elpatoApi/types';
import Chat from '../../../components/chat';
import { ChatWithTwitch } from '../../../components/chat/ChatWithTwitch';
import * as S from '../styles';
import { ChatMessageData } from '../../../types';
import { pickRandom } from '../../../utils/randomUtils';
import { SampleMessages } from '../../../examples/sampleMessages';


export interface ChatSectionProps {
  channelInformation?: UserInformation | null,
  sampleMessagesPaused?: boolean
}

export const ChatSection = ({ channelInformation, sampleMessagesPaused }: ChatSectionProps) => {
  const [messages, setMessages] = useState<Array<ChatMessageData>>([]);

  useEffect(() => {
    if (channelInformation) return;

    const onInterval = () => {
      if (sampleMessagesPaused) return;
      setMessages((prevMessages) => (
        [
          { ...pickRandom(SampleMessages), id: `${Math.random()}` },
          ...prevMessages
        ].splice(0, 10)
      ));
    };
    const intervalRef = setInterval(onInterval, 1000);

    return () => { clearInterval(intervalRef); };
  }, [channelInformation, sampleMessagesPaused]);

  return (
    <S.ChatContainer>
      { channelInformation
        ? <ChatWithTwitch channelDetails={channelInformation} />
        : <Chat msgs={messages} /> 
      }
    </S.ChatContainer>
  );
};
