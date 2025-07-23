import styled, { css } from 'styled-components';
import { ChatMessageData } from '../../types';
import { THEME_USER_COLOR } from '../../themes/mainTheme';

// This is the primary container that contains the Header and Content of the chat message
export const Message = styled.div<{ $direction: 'left' | 'right' }>`
  text-align: end;

  display: flex;
  flex-direction: column;
  ${({ $direction }) => $direction === 'left' ?
    css` align-items: start;` :
    css` align-items: end; `
}

  margin: 0.3em 0;

  font-family: ${(props) => props.theme.chat.font};
`;

export const Content = styled.div<{ 
    $direction: 'left' | 'right',
    $effect: ChatMessageData['effect'],
    $userColor: string
  }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3ch;

  flex-direction: column;
  align-items: end;

  background-color: ${(props) => props.theme.chat.content.bg};
  color: ${(props) => props.theme.chat.content.text};
  border-radius: ${(props) => props.theme.chat.content.borderRadius};
  border: ${(props) => props.theme.chat.content.border};
  padding: ${(props) => props.theme.chat.content.padding};

  font-weight: ${(props) => props.theme.chat.content.fontWeight};
  font-size: ${(props) => props.theme.chat.content.fontSize};

  ${(props) => props.theme.chat.content.textShadow && css`
    text-shadow: ${props.theme.chat.content.textShadow.replace(THEME_USER_COLOR, props.$userColor)};
  `}

  ${(props) => props.theme.chat.content.boxShadow && css`
    box-shadow: ${props.theme.chat.content.boxShadow};
  `}

  z-index: 0;
  position: relative;
  word-break: break-word;
  ${({ $direction }) => $direction === 'left' ?
    css` 
      text-align: start;
      justify-content: flex-start;
      ${(props) => props.theme.chat.content.sideMargin && css`
        margin-left: ${props.theme.chat.content.sideMargin};
      `}
    ` :
    css` 
      text-align: end; 
      justify-content: flex-end;
      ${(props) => props.theme.chat.content.sideMargin && css`
        margin-right: ${props.theme.chat.content.sideMargin};
      `}
    `
}

  ${({ $effect }) => ($effect === 'rainbow' || $effect === 'simmer') && css`

    &:before {
      content: "";
      position: absolute;
      z-index: -2;
      inset: -2px;
      transform: translate(0, 0);
      filter: blur(5px);
      border-radius: 12px;

      background: rgb(131,58,180);
      background: conic-gradient(#ff0041, #ff00fd, #00b1ff, #00ffc6);
    }

    &::after {
      content: "";
      position: absolute;
      z-index: -1;
      inset: 0;
      /* Inherit all the decorations defined on the main element */
      background: inherit;
      border: inherit;
      box-shadow: inherit;
      border-radius: inherit;
    }
  `}
`;

export const SystemContent = styled(Content)<{
  $direction: 'left' | 'right',
  $effect: ChatMessageData['effect'],
  $userColor: string
}>`
  // opacity: 0.8;
  font-style: italic;
  
  background-color: ${(props) => props.theme.chat?.systemContent?.bg || props.theme.chat.content.bg};
  // background-color: hsl(0, 100.00%, 97.50%);
  // background-color: #b2a9a9;
  // background-color: #dacfcf;

  // color: ${(props) => props.theme.chat.content.text};
  color: ${(props) => props.theme.chat?.systemContent?.text || props.theme.chat.content.text};
  border-radius: ${(props) => props.theme.chat?.systemContent?.borderRadius || props.theme.chat.content.borderRadius};
  border: ${(props) => props.theme.chat?.systemContent?.border || props.theme.chat.content.border};
  padding: ${(props) => props.theme.chat?.systemContent?.padding || props.theme.chat.content.padding};

  font-weight: ${(props) => props.theme.chat?.systemContent?.fontWeight || props.theme.chat.content.fontWeight};
  font-size: ${(props) => props.theme.chat?.systemContent?.fontSize || props.theme.chat.content.fontSize};

  ${(props) => props.theme.chat?.systemContent?.textShadow && css`
    text-shadow: ${props.theme.chat.systemContent.textShadow.replace(THEME_USER_COLOR, props.$userColor)};
  `}

  ${(props) => props.theme.chat?.systemContent?.boxShadow && css`
    box-shadow: ${props.theme.chat.systemContent.boxShadow};
  `}

  ${({ $direction }) => $direction === 'left' ?
    css` 
      ${(props) => props.theme.chat?.systemContent?.sideMargin && css`
        margin-left: ${props.theme.chat.systemContent.sideMargin};
      `}
    ` :
    css` 
      ${(props) => props.theme.chat?.systemContent?.sideMargin && css`
        margin-right: ${props.theme.chat.systemContent.sideMargin};
      `}
    `
} 
`;


export const FollowNotificationContent = styled(Content)<{
  $direction: 'left' | 'right',
  $effect: ChatMessageData['effect'],
  $userColor: string
}>`
  // opacity: 0.8;
  // font-style: italic;
 

  // background-color: ${(props) => props.theme.chat?.systemContent?.bg || props.theme.chat.content.bg};
  background-color: ${(props) => props.theme.chat.content.bg};

  // color: ${(props) => props.theme.chat.content.text};
  color: ${(props) => props.theme.chat?.systemContent?.text || props.theme.chat.content.text};
  border-radius: ${(props) => props.theme.chat?.systemContent?.borderRadius || props.theme.chat.content.borderRadius};
  border: ${(props) => props.theme.chat?.systemContent?.border || props.theme.chat.content.border};
  padding: ${(props) => props.theme.chat?.systemContent?.padding || props.theme.chat.content.padding};

  font-weight: ${(props) => props.theme.chat?.systemContent?.fontWeight || props.theme.chat.content.fontWeight};
  font-size: ${(props) => props.theme.chat?.systemContent?.fontSize || props.theme.chat.content.fontSize};

  ${(props) => props.theme.chat?.systemContent?.textShadow && css`
    text-shadow: ${props.theme.chat.systemContent.textShadow.replace(THEME_USER_COLOR, props.$userColor)};
  `}

  ${(props) => props.theme.chat?.systemContent?.boxShadow && css`
    box-shadow: ${props.theme.chat.systemContent.boxShadow};
  `}

  ${({ $direction }) => $direction === 'left' ?
    css` 
      ${(props) => props.theme.chat?.systemContent?.sideMargin && css`
        margin-left: ${props.theme.chat.systemContent.sideMargin};
      `}
    ` :
    css` 
      ${(props) => props.theme.chat?.systemContent?.sideMargin && css`
        margin-right: ${props.theme.chat.systemContent.sideMargin};
      `}
    `}

  &:before {
      content: "";
      position: absolute;
      z-index: -2;
      inset: -2px;
      transform: translate(0, 0);
      filter: blur(5px);
      border-radius: 12px;

      background: rgb(131,58,180);
      // background: conic-gradient(#ff0041, #ff00fd, #00b1ff, #00ffc6);
      // background: linear-gradient(var(--a), #ff0041, #ff00fd, #00b1ff, #00ffc6);
      background: conic-gradient(from var(--a), #ff0041, #ff00fd, #00b1ff, #00ffc6);
      animation: rotate-gradient 2s linear infinite;
    }

    &::after {
      content: "";
      position: absolute;
      z-index: -1;
      inset: 0;
      /* Inherit all the decorations defined on the main element */
      background: inherit;
      border: inherit;
      box-shadow: inherit;
      border-radius: inherit;
    }

    @property --a {
      syntax: '<angle>';
      inherits: false;
      initial-value: 0deg;
    }

  @keyframes rotate-gradient {
    from {
      --a: 0deg;
    }
    to {
      --a: 360deg;
    }
  }

`;
