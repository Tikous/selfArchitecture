import { gql } from '@apollo/client';

export const SEND_MESSAGE = gql`
  mutation SendMessage($content: String!) {
    sendMessage(content: $content) {
      content
      role
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages {
    messages {
      content
      role
    }
  }
`;
