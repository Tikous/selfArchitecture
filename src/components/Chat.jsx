import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  Input,
  Button,
  Container,
  Text,
  useToast,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useMutation } from '@apollo/client';
import ReactMarkdown from 'react-markdown';
import { SEND_MESSAGE } from '../graphql/queries';
import ParticleBackground from './ParticleBackground';

// 定义所有动画
const typingAnimation = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const blinkAnimation = keyframes`
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
`;

const bounceAnimation = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
`;

// 添加动画关键帧
const glowingBorder = keyframes`
  0% { border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 0 10px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.1), inset 0 0 3px rgba(59, 130, 246, 0.4); }
  50% { border-color: rgba(59, 130, 246, 0.9); box-shadow: 0 0 15px rgba(59, 130, 246, 0.7), 0 0 30px rgba(59, 130, 246, 0.3), inset 0 0 5px rgba(59, 130, 246, 0.7); }
  100% { border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 0 10px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.1), inset 0 0 3px rgba(59, 130, 246, 0.4); }
`;

const neonEffect = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// 改进的打字机效果组件 - 支持Markdown渲染
const TypewriterEffect = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 15); // 打字速度，可调整

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  // 使用ReactMarkdown直接渲染当前已显示的文本
  return (
    <>
      <ReactMarkdown>{displayedText}</ReactMarkdown>
      <span className="typing-cursor">|</span>
    </>
  );
};

const Chat = () => {
  // 所有的 Hooks 都放在组件的最顶层
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingMessageIndex, setTypingMessageIndex] = useState(-1);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false); // 新增等待响应状态
  const messagesEndRef = useRef(null);
  const toast = useToast();
  const [sendMessage, { loading }] = useMutation(SEND_MESSAGE);

  // 所有的 useColorModeValue hooks 也放在顶层
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  // 主色调：深蓝色
  const mainColor = '#2563eb'; // 主色调
  const mainColorHover = '#1d4fd7'; // 主色调悬停
  const glowColor = '#3b82f6'; // 泛光边框颜色
  const userBubbleBg = '#2563eb'; // 深蓝色
  const aiBubbleBg = 'rgba(255, 255, 255, 0.15)'; // 半透明白色
  const userTextColor = '#ffffff'; // 白色
  const aiTextColor = '#ffffff'; // 白色
  const inputBg = '#f3f4f6';
  const borderColor = '#e5e7eb';
  const messageBoxBg = '#ffffff';
  const codeBlockBg = 'rgba(0, 0, 0, 0.3)'; // 半透明黑色
  const gradientBg = 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)';
  // 页面背景色，协调主色调
  const pageBg = '#eef2fa'; // 浅灰蓝色，科技感

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // 添加用户消息到本地状态
    const userMessage = { content: message, role: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    scrollToBottom();

    // 设置等待状态，添加一个临时的"等待中"消息
    setIsWaitingForResponse(true);
    const waitingMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { 
      content: '',
      waitingForResponse: true, // 标记为等待响应
      role: 'ai'
    }]);
    scrollToBottom();

    try {
      const { data } = await sendMessage({ variables: { content: message } });

      // 移除等待消息，添加真实回复
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[waitingMessageIndex] = { 
          content: '', 
          fullContent: data.sendMessage.content,
          role: 'ai'
        };
        return newMessages;
      });

      // 开始打字效果
      setTypingMessageIndex(waitingMessageIndex);
      setIsWaitingForResponse(false);

    } catch (err) {
      // 移除等待消息
      setMessages(prev => prev.filter((_, idx) => idx !== waitingMessageIndex));
      setIsWaitingForResponse(false);

      toast({
        title: '发送消息失败',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // 完成打字效果后的回调
  const handleTypingComplete = () => {
    setTypingMessageIndex(-1);
    // 用完整内容替换打字效果内容
    setMessages(prev => prev.map((msg, idx) => 
      idx === typingMessageIndex 
        ? { ...msg, content: msg.fullContent }
        : msg
    ));
    scrollToBottom();
  };

  return (
    <Box 
      w="100vw"
      h="100vh"
      position="relative"
      overflow="hidden"
    >
      {/* 添加粒子背景 */}
      <ParticleBackground />

      {/* 顶部标题 */}
      <Box w="100%" py={4} textAlign="center" position="relative" zIndex={10}>
        <Text 
          fontSize="3xl" 
          fontWeight="bold" 
          color="white" 
          letterSpacing={2}
          textShadow="0 0 15px rgba(255, 255, 255, 0.7)"
        >
          WSK的秘密基地
        </Text>
      </Box>

      <Container 
        maxW="100%" 
        h="calc(100vh - 85px)"
        py={4} 
        px={[4, 6, 8]} 
        display="flex"
        flexDirection="column"
        overflow="hidden"
        position="relative"
        zIndex={10}
      >
        <VStack 
          h="full" 
          spacing={4} 
          w="full"
          maxW="1200px"
          mx="auto"
          overflow="hidden"
          padding={4}
          boxSizing='content-box'
        >
          <Box
            flex={1}
            w="full"
            overflowY="auto"
            borderRadius="xl"
            p={6}
            bg="rgba(20, 20, 20, 0.7)"
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.5)"
          
            position="relative"
            animation={`${glowingBorder} 3s infinite ease-in-out`}
            boxShadow="0 0 30px rgba(0, 0, 0, 0.5)"
            _before={{
              content: '""',
              position: 'absolute',
              inset: '-2px',
              borderRadius: 'xl',
              padding: '2px',
              background: `linear-gradient(120deg, #3b82f600, #3b82f6, #4f46e5, #3b82f600, #3b82f600)`,
              backgroundSize: '300% 300%',
              animation: `${neonEffect} 5s ease infinite`,
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              opacity: 0.8,
              pointerEvents: 'none',
            }}
            sx={{
              // 完全隐藏滚动条但保持功能
              '&::-webkit-scrollbar': {
                width: '0px',
                background: 'transparent',
              },
              '&': {
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none', // IE and Edge
              },
              // 确保内容不会被边框剪切
              '> div': {
                paddingBottom: '20px',
              }
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={index}
                mb={6}
                animation={`${typingAnimation} 0.3s ease-out`}
                maxW="80%"
                ml={msg.role === 'user' ? 'auto' : '0'}
                mr={msg.role === 'user' ? '0' : 'auto'}
              >
                <Box
                  p={4}
                  borderRadius="2xl"
                  bg={msg.role === 'user' ? userBubbleBg : aiBubbleBg}
                  color={msg.role === 'user' ? userTextColor : aiTextColor}
                  boxShadow="lg"
                  position="relative"
                >
                  <Text 
                    fontWeight="bold" 
                    mb={2}
                    fontSize="sm"
                    opacity={0.8}
                  >
                    {msg.role === 'user' ? '你' : 'DeepSeek AI'}
                  </Text>
                  <Box 
                    className="markdown-content"
                    fontSize="md"
                    sx={{
                      'p': { mb: 2 },
                      'pre': { 
                        bg: codeBlockBg,
                        p: 3,
                        borderRadius: 'md',
                        overflowX: 'auto'
                      },
                      'code': {
                        bg: codeBlockBg,
                        px: 1,
                        py: 0.5,
                        borderRadius: 'sm'
                      },
                      'ul, ol': {
                        pl: 6,
                        mb: 4,
                      },
                      'li': {
                        mb: 2,
                      },
                      'li > ul, li > ol': {
                        mt: 2,
                      }
                    }}
                  >
                    {msg.waitingForResponse ? (
                      <Flex align="center">
                        <Text color={aiTextColor} opacity={0.7}>正在思考中</Text>
                        <Box 
                          as="span" 
                          display="inline-flex" 
                          alignItems="center" 
                          ml={2}
                        >
                          <Box 
                            as="span" 
                            h="4px" 
                            w="4px" 
                            borderRadius="full" 
                            bg={aiTextColor} 
                            opacity={0.7} 
                            mx="1px"
                            animation={`${bounceAnimation} 1.4s infinite ease-in-out both`}
                            style={{animationDelay: '0s'}}
                          />
                          <Box 
                            as="span" 
                            h="4px" 
                            w="4px" 
                            borderRadius="full" 
                            bg={aiTextColor} 
                            opacity={0.7} 
                            mx="1px"
                            animation={`${bounceAnimation} 1.4s infinite ease-in-out both`}
                            style={{animationDelay: '0.2s'}}
                          />
                          <Box 
                            as="span" 
                            h="4px" 
                            w="4px" 
                            borderRadius="full" 
                            bg={aiTextColor} 
                            opacity={0.7} 
                            mx="1px"
                            animation={`${bounceAnimation} 1.4s infinite ease-in-out both`}
                            style={{animationDelay: '0.4s'}}
                          />
                        </Box>
                      </Flex>
                    ) : index === typingMessageIndex ? (
                      <TypewriterEffect 
                        text={msg.fullContent || ''} 
                        onComplete={handleTypingComplete} 
                      />
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          <Flex 
            as="form" 
            onSubmit={handleSubmit} 
            w="full"
            maxW="1200px"
            gap={3}
            p={4}
            bg="rgba(20, 20, 20, 0.7)"
            backdropFilter="blur(10px)"
            borderRadius="xl"
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.5)"
            position="relative"
            zIndex={10}
            animation={`${glowingBorder} 3s infinite ease-in-out`}
            _before={{
              content: '""',
              position: 'absolute',
              inset: '-2px',
              borderRadius: 'xl',
              padding: '2px',
              background: `linear-gradient(120deg, #3b82f600, #3b82f6, #4f46e5, #3b82f600, #3b82f600)`,
              backgroundSize: '300% 300%',
              animation: `${neonEffect} 5s ease infinite`,
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              opacity: 0.8,
              pointerEvents: 'none',
            }}
          >
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入消息..."
              size="lg"
              disabled={loading || isWaitingForResponse}
              bg="rgba(30, 30, 30, 0.6)"
              color="white"
              borderColor="rgba(59, 130, 246, 0.5)"
              _hover={{ borderColor: "rgba(59, 130, 246, 0.7)" }}
              _focus={{ 
                borderColor: glowColor, 
                boxShadow: `0 0 0 1px ${glowColor}, 0 0 8px ${glowColor}` 
              }}
              borderRadius="full"
              px={6}
            />
            <Button 
              type="submit" 
              bg={mainColor}
              color="white"
              size="lg"
              isLoading={loading || isWaitingForResponse}
              loadingText="发送中..."
              borderRadius="full"
              px={8}
              boxShadow={`0 0 15px ${glowColor}80`}
              _hover={{
                bg: mainColorHover,
                transform: 'translateY(-1px)',
                boxShadow: `0 0 20px ${glowColor}`,
              }}
              _active={{
                bg: mainColor,
                transform: 'translateY(0)',
              }}
              transition="all 0.2s"
            >
              发送
            </Button>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
};

export default Chat