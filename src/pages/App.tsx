// import { ChakraProvider } from '@chakra-ui/react';
// import { ApolloProvider } from '@apollo/client';
// import client from '@abis/apollo';
// import Chat from '@components/Chat';

// function App() {
//   return (
//     <ApolloProvider client={client}>
//       <ChakraProvider>
//         <Chat />
//       </ChakraProvider>
//     </ApolloProvider>
//   );
// }

// export default App;
import { useImmer } from '@hooks/useImmer';
import { useState } from 'react';
// import { useState } from 'react';

const App = () => {
  const [data, setData] = useImmer({ info: '京程一灯' });
  console.log('🐻 App component rendered');
  return (
    <>
      <h1
        className="text-4xl text-[#09F]"
        onClick={() => {
          // setData({info: '京程一灯'});
          setData((draft) => {
            draft.info = '京程一灯 info'
          });
        }}
      >
        {data.info}
      </h1>
    </>
  );
};
App.whyDidYouRender = true; // Enable WDYR for this component
export default App;