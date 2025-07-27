import { useEffect, useState } from 'react';
import { UserInformation } from '../../../api/elpatoApi/types';
import Chat from '../../../components/chat';
import { ChatWithTwitch } from '../../../components/chat/ChatWithTwitch';
import * as S from '../styles';
import { ChatMessageData } from '../../../types';
import { pickRandom } from '../../../utils/randomUtils';
import { SampleMessages } from '../../../examples/sampleMessages';

const ENABLE_RANDOM_SAMPLE_MESSAGES = true;

export interface ChatSectionProps {
  channelInformation?: UserInformation | null,
  sampleMessagesPaused?: boolean
}

export const ChatSection = ({ channelInformation, sampleMessagesPaused }: ChatSectionProps) => {
  const [messages, setMessages] = useState<Array<ChatMessageData>>([]);
  const [sampleMessageIdx, setSampleMessageIdx] = useState(0);

  useEffect(() => {
    if (channelInformation) return;

    const onInterval = () => {
      if (sampleMessagesPaused) return;

      const selectedMessage = ENABLE_RANDOM_SAMPLE_MESSAGES 
        ? pickRandom(SampleMessages)
        : SampleMessages[sampleMessageIdx];

      setMessages((prevMessages) => (
        [
          { ...selectedMessage, id: `${Math.random()}` },
          ...prevMessages
        ].splice(0, 10)
      ));

      if (!ENABLE_RANDOM_SAMPLE_MESSAGES) {
        setSampleMessageIdx((prevIdx) => (prevIdx + 1) % SampleMessages.length);
      }
    };
    const intervalRef = setInterval(onInterval, 1000);

    return () => { clearInterval(intervalRef); };
  }, [channelInformation, sampleMessagesPaused, sampleMessageIdx]);

  return (
    <S.ChatContainer>
      { channelInformation
        ? <ChatWithTwitch channelDetails={channelInformation} />
        : <Chat msgs={messages} /> 
      }
    </S.ChatContainer>
  );
};
