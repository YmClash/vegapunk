/**
 * Apollo Client Configuration
 * Sets up GraphQL client with subscriptions support
 */

import { ApolloClient, InMemoryCache, createHttpLink, split, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const GRAPHQL_URL = process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:4000/graphql';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4000/graphql';

// HTTP Link
const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

// WebSocket Link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: WS_URL,
    connectionParams: () => {
      const token = localStorage.getItem('accessToken');
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
    on: {
      connected: () => console.log('WebSocket connected'),
      error: (error) => console.error('WebSocket error:', error),
    },
  })
);

// Auth Link
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error Link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });

    // Handle authentication errors
    const hasAuthError = graphQLErrors.some(
      (error) => error.extensions?.code === 'UNAUTHENTICATED'
    );

    if (hasAuthError) {
      // Clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
  }
});

// Split links based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, splitLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          agents: {
            keyArgs: ['status', 'type'],
            merge(existing, incoming, { args }) {
              const offset = args?.offset || 0;
              const merged = existing ? existing.edges.slice(0) : [];
              
              for (let i = 0; i < incoming.edges.length; ++i) {
                merged[offset + i] = incoming.edges[i];
              }

              return {
                ...incoming,
                edges: merged,
              };
            },
          },
          tasks: {
            keyArgs: ['status', 'priority', 'assignedAgent'],
            merge(existing, incoming, { args }) {
              const offset = args?.offset || 0;
              const merged = existing ? existing.edges.slice(0) : [];
              
              for (let i = 0; i < incoming.edges.length; ++i) {
                merged[offset + i] = incoming.edges[i];
              }

              return {
                ...incoming,
                edges: merged,
              };
            },
          },
        },
      },
      Agent: {
        keyFields: ['id'],
      },
      Task: {
        keyFields: ['id'],
      },
      Collaboration: {
        keyFields: ['id'],
      },
      Workflow: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
});