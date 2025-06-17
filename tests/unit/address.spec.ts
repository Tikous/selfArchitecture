import { formatWalletAddress } from '@utils/index';

describe('formatWalletAddress', () => {
  // 测试正常的以太坊地址格式化
  test('formats normal ethereum address correctly', () => {
    const address = '0x123456789abcdef123456789abcdef123456789a';
    const result = formatWalletAddress(address);
    expect(result).toBe('0x123456...789a');
  });

  // 测试没有0x前缀的地址
  test('formats address without 0x prefix correctly', () => {
    const address = '123456789abcdef123456789abcdef123456789a';
    const result = formatWalletAddress(address);
    expect(result).toBe('123456...789a');
  });

  // 测试自定义长度
  test('formats with custom lengths correctly', () => {
    const address = '0x123456789abcdef123456789abcdef123456789a';
    const result = formatWalletAddress(address, 8, 6);
    expect(result).toBe('0x12345678...56789a');
  });

  // 测试空地址
  test('handles empty address', () => {
    const result = formatWalletAddress('');
    expect(result).toBe('');
  });

  // 测试地址长度不足以格式化的情况
  test('returns original address if too short', () => {
    const shortAddress = '0x1234';
    const result = formatWalletAddress(shortAddress);
    expect(result).toBe(shortAddress);
  });

  // 测试边界情况 - 刚好等于起始长度加结束长度
  test('handles address equal to start + end length', () => {
    const address = '0x12345678901234'; // 6 + 4 = 10 characters (不包含0x)
    const result = formatWalletAddress(address);
    expect(result).toBe('0x12345678901234');
  });

  // 测试不同的起始和结束长度组合
  test('handles various start and end length combinations', () => {
    const address = '0x123456789abcdef123456789abcdef123456789a';

    // 测试更短的长度
    expect(formatWalletAddress(address, 4, 2)).toBe('0x1234...9a');

    // 测试更长的长度
    expect(formatWalletAddress(address, 10, 8)).toBe('0x123456789a...456789a');

    // 测试相等的起始和结束长度
    expect(formatWalletAddress(address, 5, 5)).toBe('0x12345...789a');
  });

  // 测试null或undefined的情况
  test('handles null or undefined address', () => {
    // @ts-ignore - 故意传入null/undefined进行测试
    expect(formatWalletAddress(null)).toBe('');
    // @ts-ignore - 故意传入null/undefined进行测试
    expect(formatWalletAddress(undefined)).toBe('');
  });

  // 测试非标准长度的地址
  test('handles non-standard length addresses', () => {
    const shortAddress = '0x1234567890';
    const longAddress = '0x' + '1'.repeat(100);

    // 短地址应该返回原值
    expect(formatWalletAddress(shortAddress)).toBe(shortAddress);

    // 长地址应该正确格式化
    expect(formatWalletAddress(longAddress)).toBe(`0x${'1'.repeat(6)}...${'1'.repeat(4)}`);
  });
});
