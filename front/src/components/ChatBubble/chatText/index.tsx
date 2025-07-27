import React, { useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import twemoji from '@twemoji/api';

export interface ChatTextProps {
  text: string;
  scale?: 1 | 2 | 3;
  alignCorrection?: boolean;
}

const ChatTextSpan = styled.span<{ $alignCorrection?: boolean; $scalePx: string }>`
  display: inline-flex;
  margin: 0.1em;
  vertical-align: middle;
  position: relative;
  
  img {
    border-radius: 0.5em;
    width: ${props => props.$scalePx};
    height: auto;
    vertical-align: middle;
  }
  
  ${props => props.$alignCorrection && css`
    margin-top: 8px;
    top: -5px;
  `}
`;

/**
 * React component for Rendering Unicode Emojis in the chat content with Twemoji.
 */
const ChatText = ({ text, scale = 1, alignCorrection }: ChatTextProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  // Width and height are: 1=> 28px, 2=> 56px, 3=> 112px 
  const scalePx = scale === 1 ? '28px' : scale === 2 ? '56px' : '112px';

  useEffect(() => {
    if (containerRef.current) {
      // Set the text content
      containerRef.current.textContent = text;
      
      twemoji.parse(containerRef.current, {
        folder: 'svg',
        ext: '.svg',
      });
    }
  }, [text]);

  return (
    <ChatTextSpan
      ref={containerRef}
      $alignCorrection={alignCorrection}
      $scalePx={scalePx}
    />
  );
};

export default ChatText;
