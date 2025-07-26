/**
 * Container Div for Notifications such as Follows, Subs, Etc.
 */

import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

export interface DecorationProps {
  direction: 'left' | 'right';
  alignCorrection: boolean;
  children: ReactNode;
}

const NotificationContainerDiv = styled.div.withConfig({
  shouldForwardProp: (prop) => !['direction', 'alignCorrection'].includes(prop),
})<DecorationProps>`

  display: flex;
  flex-direction: ${props => props.direction === 'left' ? 'row' : 'row-reverse'};
  align-items: center;
  gap: 0.5em;
  
  ${props => props.alignCorrection && css`
    margin-top: 8px;
    top: -5px;
  `}
`;

const NotificationContainer = ({ direction, alignCorrection, children } : DecorationProps) => {
  return (
    <NotificationContainerDiv
      direction={direction}
      alignCorrection={alignCorrection}
    >
      {children}
    </NotificationContainerDiv>
  );
};

export default NotificationContainer;