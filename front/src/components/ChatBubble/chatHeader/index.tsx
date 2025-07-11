import { ChatMessageData } from '../../../types';
import * as S from './styles';
import { useTheme } from 'styled-components';

interface ChatMsgHeaderProps extends ChatMessageData {
  direction: 'left' | 'right';
}

const ChatMsgHeader = ({ badges, displayPronoun, color, userDisplayName, direction }: ChatMsgHeaderProps) => {
  const theme = useTheme();
  const pronounLocation = theme.chat.header.pronounLocation || 'before-name';

  const renderPronouns = () => displayPronoun ? (
    <S.Pronouns>({ displayPronoun })</S.Pronouns>
  ) : null;

  return (
    <S.Container $userColor={color || 'black'} $direction={direction}>
      {pronounLocation === 'before-icons' && renderPronouns()}
      
      {badges.map((badge) => (
        <S.Badge height={18} width={18} src={badge.url} key={badge.id} alt={badge.id} />
      ))}

      {pronounLocation === 'before-name' && renderPronouns()}

      <S.UserName>{userDisplayName}</S.UserName>

      {pronounLocation === 'after-name' && renderPronouns()}
    </S.Container>
  );
};

export default ChatMsgHeader;