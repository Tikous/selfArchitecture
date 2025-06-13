// 请先运行 npm i -S @apollo/client 安装依赖
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

console.log(process.env.VITE_GRAPHQL_URL)
console.log(3333)
const httpLink = createHttpLink({
  uri: process.env.VITE_GRAPHQL_URL,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
  },
});

export default client;
