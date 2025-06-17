import { useState, useRef, useEffect } from 'react';
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
import ReactMarkdown from 'react-markdown';
import ParticleBackground from './ParticleBackground';
import { MastraClient } from '@mastra/client-js';

// 定义所有动画
const typingAnimation = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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

// 获取当前环境的API地址
const getApiBaseUrl = () => {
  console.log(123123)
  console.log(process.env)
  // 检查是否有环境变量可用
  return process.env.VITE_MASTRA_API_URL;
};

// 打印当前API地址，方便调试
console.log('当前API地址:', getApiBaseUrl());

// 初始化Mastra客户端
const mastraClient = new MastraClient({
  baseUrl: getApiBaseUrl(), // 动态获取API地址
});

const Chat = () => {
  // 所有的 Hooks 都放在组件的最顶层
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false); // 新增等待响应状态
  const messagesEndRef = useRef(null);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  // 保存agent实例的状态
  const [agent, setAgent] = useState(null);
  const [threadId, setThreadId] = useState(`thread_${Date.now()}`); // 创建唯一的对话线程ID，使用下划线
  const [resourceId, setResourceId] = useState(`resource_${Date.now()}`); // 创建唯一的资源ID，使用下划线
  
  // 初始化Agent
  useEffect(() => {
    const initAgent = async () => {
      try {
        console.log('正在初始化Mastra客户端...');
        // 获取所有可用的agents
        const agents = await mastraClient.getAgents();
        console.log('获取到的agents:', agents);
        
        if (agents) {
          const selectedAgent = mastraClient.getAgent('codeReviewAgent');
          setAgent(selectedAgent);
          
          // 获取agent详情（可选）
          try {
            const details = await selectedAgent.details();
            console.log('Agent详情:', details);
          } catch (detailsErr) {
            console.warn('获取Agent详情失败:', detailsErr);
          }
        } else {
          console.error('未找到可用的Agent');
          toast({
            title: '初始化失败',
            description: '未找到可用的Agent',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (err) {
        console.error('初始化Mastra客户端失败:', err);
        toast({
          title: '初始化失败',
          description: err.message || '连接到Mastra服务失败',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    
    initAgent();
  }, [toast]);

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
    if (!message.trim() || !agent) return;

    console.log('发送消息:', message);
    
    // 添加用户消息到本地状态
    const userMessage = { content: message, role: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    scrollToBottom();

    // 设置等待状态，添加一个临时的"等待中"消息
    setIsWaitingForResponse(true);
    setLoading(true);
    const waitingMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { 
      content: '',
      waitingForResponse: true, // 标记为等待响应
      role: 'ai'
    }]);
    scrollToBottom();

    try {
      console.log('使用Mastra Agent发送消息...');
      
      // 准备历史消息以保持上下文
      const historyMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content || msg.fullContent || '',
      }));
      
      // 添加当前消息
      historyMessages.push({
        role: 'user',
        content: message,
      });
      
      console.log('发送消息历史:', historyMessages);
      console.log('使用threadId:', threadId, '和resourceId:', resourceId);
      
      // 使用Mastra客户端发送消息
      const response = await agent.stream({
        messages: historyMessages,
        threadId: threadId, // 使用创建的线程ID以保持对话上下文
        resourceId: resourceId, // 添加资源ID
      });
      
      console.log('收到流式响应');
      
      // 准备接收流式响应
      let fullContent = '';
      
      // 处理流式响应
      await response.processDataStream({
        onTextPart: (text) => {
          fullContent += text;
          // 更新消息，直接显示内容，不需要打字效果
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[waitingMessageIndex]) {
              newMessages[waitingMessageIndex] = { 
                content: fullContent, // 直接使用当前累积的内容
                role: 'ai',
                waitingForResponse: false
              };
            }
            return newMessages;
          });
          
          // 滚动到底部，保持查看最新消息
          scrollToBottom();
        },
        onFilePart: (file) => {
          console.log('收到文件部分:', file);
        },
        onDataPart: (data) => {
          console.log('收到数据部分:', data);
        },
        onErrorPart: (error) => {
          console.error('接收到错误:', error);
          throw new Error(error);
        },
      });
      
      console.log('响应流处理完成');
      setIsWaitingForResponse(false);
      setLoading(false);
      
    } catch (err) {
      console.error('发送消息失败:', err);
      
      // 检查是否是resourceId相关错误
      const errorMsg = err.message || '';
      if (errorMsg.includes('resourceId') || errorMsg.includes('resourceld')) {
        console.log('检测到resourceId错误，尝试重新生成ID...');
        // 重新生成资源ID
        const newResourceId = `resource_${Date.now()}`;
        setResourceId(newResourceId);
        toast({
          title: '会话ID错误',
          description: '已重置会话ID，请再次尝试发送消息',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // 其他错误处理
        toast({
          title: '发送消息失败',
          description: err.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // 移除等待消息
      setMessages(prev => prev.filter((_, idx) => idx !== waitingMessageIndex));
      setIsWaitingForResponse(false);
      setLoading(false);
    }
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
          Mastra Agent 聊天
        </Text>
      </Box>
      
      <Container 
        maxW="100%" 
        h="calc(100vh - 85px)"
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
          boxSizing='border-box'
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
                    {msg.role === 'user' ? '你' : 'Mastra Agent'}
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
                    ) : (
                      // 直接渲染内容，不使用打字效果
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

export default Chat;