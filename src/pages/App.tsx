import { ChakraProvider } from '@chakra-ui/react';
import { ApolloProvider } from '@apollo/client';
import client from '@/abis/apollo';
import Chat from '@/components/Chat';

function App() {
  return (
    <ApolloProvider client={client}>
      <ChakraProvider>
        <Chat />
      </ChakraProvider>
    </ApolloProvider>
  );
}

export default App;
