import 'styled-components';


interface Box {
  bg: string,
  text: string,
  borderRadius: string,
  border: string,
  padding: string,
  boxShadow?: string,
  textShadow?: string
}

declare module 'styled-components' {
  export interface DefaultTheme {
    chat: {
      font: string,

      header: Box & {
        fontSize: string,
        fontWeight: string,
        sideMargin?: string, // Default: '8px'

        pronounLocation?: 'before-icons' | 'before-name' | 'after-name',
      },

      content: Box & {
        fontSize: string,
        fontWeight: string,
        sideMargin?: string, // Default: None

        reply: Box,
        reward: Box
        mention: Box,
      }
    }
  }
}