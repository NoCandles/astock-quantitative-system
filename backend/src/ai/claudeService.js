import axios from 'axios';

// Claude API 配置
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

export async function analyzeStock(data, apiKey) {
  const { symbol, name, quote, technicalIndicators, klineDaily } = data;

  // 构建Prompt
  const prompt = buildAnalysisPrompt({
    symbol,
    name,
    quote,
    technicalIndicators,
    klineDaily
  });

  // 优先使用传入的 apiKey，其次使用环境变量配置的
  const configApiKey = process.env.CLAUDE_API_KEY;
  const finalApiKey = apiKey && apiKey.trim() !== '' ? apiKey : configApiKey;

  if (!finalApiKey) {
    // 如果没有API Key，返回模拟分析
    return generateMockAnalysis(data);
  }

  try {
    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': finalApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        timeout: 30000
      }
    );

    return response.data.content[0].text;
  } catch (error) {
    console.error('Claude API调用失败:', error);
    // 降级到模拟分析
    return generateMockAnalysis(data);
  }
}

function buildAnalysisPrompt({ symbol, name, quote, technicalIndicators, klineDaily }) {
  // 生成K线摘要
  const klineSummary = klineDaily.slice(-10).map(k => 
    `${k.date}: 开${k.open} 收${k.close} 高${k.high} 低${k.low}`
  ).join('\n');

  return `你是专业的A股技术分析师。请分析以下股票的技术面：

股票信息：
- 代码：${symbol}
- 名称：${name}
- 当前价格：${quote.price} 元
- 涨跌幅：${quote.changePercent}%
- 今日开盘：${quote.open} 元
- 今日最高：${quote.high} 元
- 今日最低：${quote.low} 元

技术指标：
- MA5：${technicalIndicators.ma5} 元
- MA10：${technicalIndicators.ma10} 元
- MA20：${technicalIndicators.ma20} 元
- MA60：${technicalIndicators.ma60} 元
- RSI(14)：${technicalIndicators.rsi}
- 20日最高：${technicalIndicators.high20} 元
- 20日最低：${technicalIndicators.low20} 元

近10日K线：
${klineSummary}

请给出以下分析（用中文回答，简洁专业）：
1. **短期趋势判断**：基于K线和均线系统，分析短期走势
2. **技术面分析**：从RSI、均线、成交量等角度分析
3. **风险提示**：需要注意的风险点
4. **操作建议**：短期操作建议（仅供参考）

请保持专业客观，不要构成投资建议。`;
}

function generateMockAnalysis({ symbol, name, quote, technicalIndicators }) {
  const change = parseFloat(technicalIndicators.priceChange);
  let trend = '震荡';
  let suggestion = '建议观望，等待明确信号';
  
  if (change > 3) {
    trend = '强势上涨';
    suggestion = '注意追高风险，可考虑部分止盈';
  } else if (change > 0) {
    trend = '温和上涨';
    suggestion = '可以轻仓介入，止损设在关键支撑位';
  } else if (change < -3) {
    trend = '大幅下跌';
    suggestion = '注意止损，不建议抄底';
  } else if (change < 0) {
    trend = '小幅回调';
    suggestion = '可以等待企稳后考虑买入';
  }

  const rsi = parseFloat(technicalIndicators.rsi);
  let rsiAnalysis = '';
  if (rsi > 70) {
    rsiAnalysis = 'RSI处于超买区域，注意回调风险';
  } else if (rsi < 30) {
    rsiAnalysis = 'RSI处于超卖区域，可能存在反弹机会';
  } else {
    rsiAnalysis = 'RSI处于正常区间';
  }

  return `【${name}(${symbol}) 技术分析】

**一、短期趋势判断**
当前股价${quote.price}元，${quote.change > 0 ? '上涨' : quote.change < 0 ? '下跌' : '平盘'}${Math.abs(quote.change)}元，涨幅${quote.changePercent}%。整体呈现${trend}态势。

**二、技术面分析**
1. 均线系统：
   - MA5=${technicalIndicators.ma5}元，MA10=${technicalIndicators.ma10}元，MA20=${technicalIndicators.ma20}元
   - 短期均线对股价形成${parseFloat(technicalIndicators.ma5) > quote.price ? '压力' : '支撑'}
   
2. RSI指标：
   - 当前RSI(14)=${technicalIndicators.rsi}，${rsiAnalysis}
   
3. 价格区间：
   - 20日最高价：${technicalIndicators.high20}元
   - 20日最低价：${technicalIndicators.low20}元
   - 当前位置处于近期价格区间的中${((quote.price - technicalIndicators.low20) / (technicalIndicators.high20 - technicalIndicators.low20) * 100).toFixed(1)}%分位

**三、风险提示**
- 市场整体波动风险
- 个股流动性风险
- 短期技术性回调风险

**四、操作建议**
${suggestion}

⚠️ 以上分析仅供参考，不构成投资建议。股市有风险，投资需谨慎！`;
}
