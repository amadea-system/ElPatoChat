import { MessagePart } from '../../../types';
import Emote from '../emote';
import * as S from './styles';

export type ChatMsgContentProps = {
  messageParts: Array<MessagePart>,
  userColor: string | undefined
}

const ChatMsgContent = ({ messageParts, userColor = 'black' }: ChatMsgContentProps) => {
  if (messageParts.length === 0) return null;

  const parentTypes = ['reply', 'redeption', 'follow'];
  const parentPart = messageParts.find(part => parentTypes.includes(part.type));
  const firstPart = parentPart ?? messageParts[0];
  const remainingParts = parentPart ? messageParts.filter(part => part !== parentPart) : messageParts.slice(1);

  const renderPart = ({ content, type, customEmote }: MessagePart, index: number) => {
    switch (type) {
    case 'emote':
      return <Emote
        key={index}
        id={content}
        customEmote={customEmote} 
        // scale={messageParts.length === 1 ? 3 : 1}
        // scale={((firstPart.type === 'reply' && messageParts.length === 2) || messageParts.length === 1) ? 3 : 1}
        scale={((parentTypes.includes(firstPart.type) && messageParts.length === 2) || messageParts.length === 1) ? 3 : 1}
        alignCorrection={
          messageParts.filter(p => p.type === 'reply').length > 1
        }
      />;
    case 'redeption':
      return <S.Redemption $userColor={userColor} key={index}>{ content }</S.Redemption>;
    case 'reply':
      return <S.Reply $userColor={userColor} key={index}>{ content }</S.Reply>;
    case 'mention':
      return <S.ContentExtras $userColor={userColor} key={index}>{ content }</S.ContentExtras>;
    case 'follow':
      return <S.Follow $userColor={userColor} key={index}>{ content }</S.Follow>;
    default:
      return <span key={index}>{ content }</span>;
    }
  };

  return (
    <>
      {parentTypes.includes(firstPart.type) && remainingParts.length > 0 && (
        <>
          {renderPart(firstPart as MessagePart, 0)}
          <div>
            {remainingParts.map((part, idx) =>
              renderPart(part, idx + 1)
            )}
          </div>
        </>
      )}

      {!parentTypes.includes(firstPart.type) &&
        <div>
          {renderPart(firstPart as MessagePart, 0)}
          {remainingParts.map((part, idx) =>
            renderPart(part, idx)
          )}
        </div>
      }
    </>
  );

};

export default ChatMsgContent;
