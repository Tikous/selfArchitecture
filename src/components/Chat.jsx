import React, { useState, useRef } from 'react';
import { Box, VStack, Input, Button, Container, Text, useToast, Flex } from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import ReactMarkdown from 'react-markdown';
import { SEND_MESSAGE } from '../graphql/queries';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const toast = useToast();

  const [sendMessage, { loading }] = useMutation(SEND_MESSAGE);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!message.trim()) return;

    // 添加用户消息到本地状态
    const userMessage = { content: message, role: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    scrollToBottom();

    try {
      const { data } = await sendMessage({ variables: { content: message } });
      // 添加 AI 回复到本地状态
      setMessages(prev => [...prev, data.sendMessage]);
      scrollToBottom();
    } catch (err) {
      toast({
        title: '发送消息失败',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.md" h="100vh" py={4}>
      <VStack h="full" spacing={4}>
        <Box flex={1} w="full" overflowY="auto" borderWidth={1} borderRadius="md" p={4}>
          {messages.map((msg, index) => (
            <Box
              key={index}
              mb={4}
              p={3}
              borderRadius="md"
              bg={msg.role === 'user' ? 'blue.50' : 'gray.50'}
              alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
            >
              <Text fontWeight="bold" mb={1}>
                {msg.role === 'user' ? '你' : 'DeepSeek AI'}
              </Text>
              <Box className="markdown-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        <Flex as="form" onSubmit={handleSubmit} w="full" gap={2}>
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="输入消息..."
            size="lg"
            disabled={loading}
          />
          <Button type="submit" colorScheme="blue" size="lg" isLoading={loading}>
            发送
          </Button>
        </Flex>
      </VStack>
    </Container>
  );
};

export default Chat;
