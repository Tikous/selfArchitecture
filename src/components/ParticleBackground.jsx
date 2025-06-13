import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';

// 粒子配置
const PARTICLE_CONFIG = {
  count: 120, // 粒子数量增加
  size: {
    min: 1,
    max: 4, // 增加最大尺寸
  },
  speed: {
    min: 0.08,
    max: 0.3, // 增加速度
  },
  opacity: {
    min: 0.4,
    max: 0.9, // 增加不透明度
  },
  glowSize: {
    min: 12,
    max: 25, // 增加光晕
  },
};

// 鼠标尾迹配置
const TRAIL_CONFIG = {
  maxTrailPoints: 30, // 增加尾迹长度
  trailFadeSpeed: 0.04, // 减慢尾迹消失速度
  pointSize: {
    min: 5,
    max: 10,
  },
  colorSets: [
    // 蓝紫色渐变
    ['#3b82f6', '#4f46e5', '#7e22ce', '#2563eb'],
    // 绿蓝色渐变
    ['#10b981', '#0ea5e9', '#06b6d4', '#059669'],
    // 橙红色渐变
    ['#f59e0b', '#ef4444', '#dc2626', '#ea580c'],
    // 粉紫色渐变
    ['#ec4899', '#8b5cf6', '#a855f7', '#db2777'],
  ],
};

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const mouseTrailRef = useRef([]);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null, isOverBackground: false });
  const requestRef = useRef(null);
  const currentColorSetRef = useRef(0); // 跟踪当前使用的颜色集
  const [debugInfo, setDebugInfo] = useState({
    loaded: false,
    width: 0,
    height: 0,
    particleCount: 0,
  });

  // 创建粒子
  const createParticles = ctx => {
    if (!ctx) {
      console.error('创建粒子失败: Canvas context 为 null');
      return [];
    }

    try {
      const particles = [];
      const { width, height } = ctx.canvas;
      console.log(`创建粒子: 画布尺寸 ${width}x${height}`);

      for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size:
            PARTICLE_CONFIG.size.min +
            Math.random() * (PARTICLE_CONFIG.size.max - PARTICLE_CONFIG.size.min),
          speedX: (Math.random() - 0.5) * (PARTICLE_CONFIG.speed.max - PARTICLE_CONFIG.speed.min),
          speedY: (Math.random() - 0.5) * (PARTICLE_CONFIG.speed.max - PARTICLE_CONFIG.speed.min),
          opacity:
            PARTICLE_CONFIG.opacity.min +
            Math.random() * (PARTICLE_CONFIG.opacity.max - PARTICLE_CONFIG.opacity.min),
          glowSize:
            PARTICLE_CONFIG.glowSize.min +
            Math.random() * (PARTICLE_CONFIG.glowSize.max - PARTICLE_CONFIG.glowSize.min),
        });
      }

      setDebugInfo(prev => ({ ...prev, particleCount: particles.length }));
      return particles;
    } catch (error) {
      console.error('创建粒子时出错:', error);
      return [];
    }
  };

  // 更新和绘制粒子
  const updateAndDrawParticles = ctx => {
    if (!ctx) {
      console.error('绘制粒子失败: Canvas context 为 null');
      return;
    }

    try {
      const { width, height } = ctx.canvas;

      // 清除画布并重新填充黑色背景
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000000'; // 纯黑色背景
      ctx.fillRect(0, 0, width, height);

      // 更新和绘制粒子
      particlesRef.current.forEach(particle => {
        // 更新位置
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // 边界检查 - 如果粒子离开画布，从另一侧重新进入
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // 绘制发光粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);

        // 发光效果 - 径向渐变
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.glowSize,
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // 绘制彩虹尾迹
      if (mouseTrailRef.current.length > 0) {
        // 淡化现有尾迹点
        mouseTrailRef.current.forEach(point => {
          point.opacity -= TRAIL_CONFIG.trailFadeSpeed;
          if (point.size > TRAIL_CONFIG.pointSize.min) {
            point.size -= (TRAIL_CONFIG.pointSize.max - TRAIL_CONFIG.pointSize.min) / 10;
          }
        });

        // 移除完全透明的点
        mouseTrailRef.current = mouseTrailRef.current.filter(point => point.opacity > 0);

        // 获取当前颜色集
        const currentColorSet = TRAIL_CONFIG.colorSets[currentColorSetRef.current];

        // 绘制尾迹 - 从尾到头绘制确保新点在上层
        for (let i = 0; i < mouseTrailRef.current.length; i++) {
          const point = mouseTrailRef.current[i];
          const normalizedIndex = i / mouseTrailRef.current.length; // 0到1之间的值

          // 选择颜色 - 根据点在尾迹中的位置选择合适的颜色
          const colorIndex = Math.floor(normalizedIndex * currentColorSet.length);
          const nextColorIndex = (colorIndex + 1) % currentColorSet.length;
          const colorPosition = (normalizedIndex * currentColorSet.length) % 1; // 0到1之间的位置

          // 创建径向渐变
          const gradient = ctx.createRadialGradient(
            point.x,
            point.y,
            0,
            point.x,
            point.y,
            point.size * 1.5,
          );

          // 计算混合颜色
          const color1 = currentColorSet[colorIndex];
          const color2 = currentColorSet[nextColorIndex];

          gradient.addColorStop(
            0,
            `${color1}${Math.floor(point.opacity * 255)
              .toString(16)
              .padStart(2, '0')}`,
          );
          gradient.addColorStop(1, `${color2}00`); // 完全透明的外边缘

          ctx.beginPath();
          ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // 添加轻微发光效果
          ctx.beginPath();
          ctx.arc(point.x, point.y, point.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = `${color1}${Math.floor(point.opacity * 255)
            .toString(16)
            .padStart(2, '0')}`;
          ctx.fill();
        }
      }
    } catch (error) {
      console.error('绘制粒子时出错:', error);
    }
  };

  // 主动画循环
  const animate = () => {
    try {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        updateAndDrawParticles(ctx);
      }
      requestRef.current = window.requestAnimationFrame(animate);
    } catch (error) {
      console.error('动画循环出错:', error);
    }
  };

  // 处理鼠标移动 - 直接捕获整个文档的鼠标移动
  const handleMouseMove = e => {
    try {
      // 直接获取鼠标在窗口中的位置，无需相对于Canvas计算
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // 检查鼠标位置是否发生明显变化，如果变化超过5像素则切换颜色集
      if (mouseRef.current.x !== null) {
        const deltaX = mouseX - mouseRef.current.x;
        const deltaY = mouseY - mouseRef.current.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 50) {
          // 鼠标快速移动超过50像素时切换颜色集
          currentColorSetRef.current =
            (currentColorSetRef.current + 1) % TRAIL_CONFIG.colorSets.length;
        }
      }

      mouseRef.current.x = mouseX;
      mouseRef.current.y = mouseY;

      // 添加新的尾迹点
      mouseTrailRef.current.push({
        x: mouseX,
        y: mouseY,
        opacity: 1,
        size: TRAIL_CONFIG.pointSize.max, // 初始点大小最大
      });

      // 限制尾迹长度
      if (mouseTrailRef.current.length > TRAIL_CONFIG.maxTrailPoints) {
        mouseTrailRef.current.shift();
      }
    } catch (error) {
      console.error('处理鼠标移动时出错:', error);
    }
  };

  // 鼠标进入背景
  const handleMouseEnter = () => {
    console.log('鼠标进入画布');
    mouseRef.current.isOverBackground = true;
  };

  // 鼠标离开背景
  const handleMouseLeave = () => {
    console.log('鼠标离开画布');
    mouseRef.current.isOverBackground = false;
  };

  // 初始化canvas
  const initCanvas = () => {
    if (!canvasRef.current) {
      console.error('初始化画布失败: canvasRef 为 null');
      return;
    }

    try {
      console.log('初始化粒子背景');
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false });

      // 设置画布大小为窗口大小
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      setDebugInfo(prev => ({
        ...prev,
        loaded: true,
        width: canvas.width,
        height: canvas.height,
      }));

      console.log(`画布尺寸设置为 ${canvas.width}x${canvas.height}`);

      // 初始化时先填充黑色背景
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 创建粒子
      particlesRef.current = createParticles(ctx);
      console.log(`创建了 ${particlesRef.current.length} 个粒子`);

      // 开始动画
      requestRef.current = window.requestAnimationFrame(animate);
    } catch (error) {
      console.error('初始化画布时出错:', error);
    }
  };

  // 处理窗口大小变化
  const handleResize = () => {
    if (!canvasRef.current) return;

    try {
      console.log('窗口大小变化，重设画布尺寸');
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // 更新调试信息
      setDebugInfo(prev => ({
        ...prev,
        width: canvas.width,
        height: canvas.height,
      }));

      // 重新创建粒子
      const ctx = canvas.getContext('2d', { alpha: false });
      particlesRef.current = createParticles(ctx);
    } catch (error) {
      console.error('调整画布大小时出错:', error);
    }
  };

  // 组件挂载和卸载
  useEffect(() => {
    console.log('粒子背景组件挂载');
    // 初始化canvas
    initCanvas();

    // 将鼠标事件监听器添加到document而不是canvas
    document.addEventListener('mousemove', handleMouseMove);

    // 默认设置为true，始终跟踪鼠标
    mouseRef.current.isOverBackground = true;

    // 初始化随机颜色集
    currentColorSetRef.current = Math.floor(Math.random() * TRAIL_CONFIG.colorSets.length);

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      console.log('粒子背景组件卸载');
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) {
        window.cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <>
      <Box
        as="canvas"
        ref={canvasRef}
        position="fixed"
        top={0}
        left={0}
        width="100vw"
        height="100vh"
        zIndex={0}
        bg="#000000"
        style={{
          display: 'block',
          pointerEvents: 'none', // 允许鼠标事件穿透到下层元素
        }}
      />
      {/* 调试信息 - 可选，在生产环境可以移除 */}
      {process.env.NODE_ENV === 'development' && false && (
        <Box
          position="fixed"
          bottom="10px"
          right="10px"
          bg="rgba(0,0,0,0.7)"
          color="white"
          p={2}
          borderRadius="md"
          fontSize="xs"
          zIndex={9999}
        >
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </Box>
      )}
    </>
  );
};

export default ParticleBackground;
