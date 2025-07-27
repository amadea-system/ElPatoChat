import { MessagePart } from '../../../types';
import Emote from '../emote';
import ChatText from '../chatText';
import * as S from './styles';

/* ----- Configs ----- */

// TODO: Make this themeable or configurable via URLParams
// Set the max number of emotes that can be displayed at a given scale
const EmoteScaleLimits = {
  Large: 1,
  Medium: 4
  // Small is default, no limit
};

export type ChatMsgContentProps = {
  messageParts: Array<MessagePart>,
  userColor: string | undefined
}

const ChatMsgContent = ({ messageParts, userColor = 'black' }: ChatMsgContentProps) => {
  if (messageParts.length === 0) return null;

  const headerTypes = ['reply', 'redeption', 'follow'];
  const headerPart = messageParts.find(part => headerTypes.includes(part.type));
  const firstPart = headerPart ?? messageParts[0];
  const remainingParts = headerPart ? messageParts.filter(part => part !== headerPart) : messageParts.slice(1);

  const renderPart = ({ content, type, customEmote }: MessagePart, index: number) => {

    const scale = (() => {
      const partCountModifier = headerTypes.includes(firstPart.type) ? 1 : 0;  // If the message has a part that is a reply, redemption, or follow, we increase the required number by one to account for the header part.
      if (messageParts.length <= (EmoteScaleLimits.Large + partCountModifier)) {
        return 3;
      } else if (messageParts.length <= (EmoteScaleLimits.Medium + partCountModifier)) {
        return 2;
      }
      return 1;
    })();

    switch (type) {
    case 'emote': {
      return <Emote
        key={index}
        id={content}
        customEmote={customEmote} 
        scale={scale}
        alignCorrection={
          messageParts.filter(p => p.type === 'reply').length > 1
        }
      />;
    }
    case 'redeption':
      return <S.Redemption $userColor={userColor} key={index}>{ content }</S.Redemption>;
    case 'reply':
      return <S.Reply $userColor={userColor} key={index}>{ content }</S.Reply>;
    case 'mention':
      return <S.ContentExtras $userColor={userColor} key={index}>{ content }</S.ContentExtras>;
    case 'follow':
      return <S.Follow $userColor={userColor} key={index}>{ content }</S.Follow>;
    default:
      // return <span key={index}>{ content }</span>;
      return <ChatText key={index} text={content} scale={scale} />;
    }
  };

  return (
    <>
      {headerTypes.includes(firstPart.type) && remainingParts.length > 0 && (
        <>
          {renderPart(firstPart as MessagePart, 0)}
          <div>
            {remainingParts.map((part, idx) =>
              renderPart(part, idx + 1)
            )}
          </div>
        </>
      )}

      {!headerTypes.includes(firstPart.type) &&
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
