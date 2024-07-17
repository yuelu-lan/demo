/**
 * 自顶向下
 * dp[i][j] = min(dp[i-1][j] + dp[i-1][j-1]) + val[i][j]
 */
function minimumTotal(triangle: number[][]): number {
  const dp: number[][] = [];
  for (let i = 0; i < triangle.length; i++) {
    dp[i] = [];
  }
  dp[0][0] = triangle[0][0];

  // 在已知 dp[i][j] 的情况下，
  // 推导 dp[i+1][j]、dp[i+1][j+1] 的值
  for (let i = 0; i < triangle.length - 1; i++) {
    for (let j = 0; j <= i; j++) {
      /**
       * dp[i + 1][j] 会被计算两次，
       * 第一次直接赋值（因此使用 Infinity，保证 min 的结果是计算出来的值）
       * 第二次用本次计算的值与上一次比较，选取最小值
       * 本次循环计算 1、2 下一次循环计算 2、3
       * 这两个 2 就需要取最小值
       */
      dp[i + 1][j] = Math.min(
        dp[i + 1][j] ?? Infinity,
        dp[i][j] + triangle[i + 1][j],
      );
      dp[i + 1][j + 1] = Math.min(
        dp[i + 1][j + 1] ?? Infinity,
        dp[i][j] + triangle[i + 1][j + 1],
      );
    }
  }

  return Math.min(...dp.pop()!);
}
