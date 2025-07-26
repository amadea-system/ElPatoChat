import styled, { css } from 'styled-components';

export interface DecorationProps {
  url: string,
  alignCorrection?: boolean
}

const DecorationContainer = styled.img<{ $alignCorrection?: boolean }>`
  display: inline-block;
  border-radius: 0.5em;
  // margin: 0.1em;
  vertical-align: middle;
  position: relative;
  width: 75px;
  height: auto;
  ${props => props.$alignCorrection && css`
    margin-top: 8px;
    top: -5px;
  `}
`;

const Decoration = ({ url, alignCorrection } : DecorationProps) => {
  return <DecorationContainer
    $alignCorrection={alignCorrection} 
    src={url} 
  />;
};

export default Decoration;