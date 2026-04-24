import OpenAI from 'openai';

export async function analyzeStockWithDeepSeek(data, apiKey) {
  const { symbol, name, quote, technicalIndicators, klineDaily } = data;
  
  const configApiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro';
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '2048', 10);
  const timeout = parseInt(process.env.AI_TIMEOUT || '60000', 10);

  const finalApiKey = apiKey && apiKey.trim() !== '' ? apiKey : configApiKey;

  console.log('开始调用DeepSeek API (OpenAI SDK)...');
  console.log('使用的模型:', model);
  console.log('API基础地址:', baseUrl);
  console.log('是否使用API Key:', finalApiKey ? '是' : '否');

  if (!finalApiKey || finalApiKey.trim() === '') {
    console.warn('DeepSeek API key 为空，使用模拟分析');
    return generateMockAnalysis(data);
  }

  const openai = new OpenAI({
    baseURL: baseUrl,
    apiKey: finalApiKey,
  });

  const prompt = buildAnalysisPrompt({
    symbol,
    name,
    quote,
    technicalIndicators,
    klineDaily,
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: '你是专业的A股技术分析师，具备扎实的技术分析能力和丰富的实战经验。你需要以专业、客观的态度分析股票，给出基于技术面的判断。请用简洁专业的语言回答，结论要明确有理有据。永远记住：股市有风险，分析仅供参考，不构成投资建议。' },
        { role: 'user', content: prompt },
      ],
      model: model,
      thinking: { "type": "enabled" },
      reasoning_effort: "high",
      max_tokens: maxTokens,
      stream: false,
    }, {
      timeout: timeout,
    });

    return completion.choices[0].message.content || '分析服务暂时无法返回结果，请稍后重试。';
  } catch (error) {
    console.error('DeepSeek API调用失败:', error.message);
    return generateMockAnalysis(data);
  }
}

function buildAnalysisPrompt({ symbol, name, quote, technicalIndicators, klineDaily }) {
  const klineSummary = (klineDaily || [])
    .slice(-10)
    .map((k) => `${k.date}: 开${k.open} 收${k.close} 高${k.high} 低${k.low}`)
    .join('\n');

  const indicators = [];
  if (technicalIndicators) {
    if (technicalIndicators.ma5) indicators.push(`MA5: ${technicalIndicators.ma5}元`);
    if (technicalIndicators.ma10) indicators.push(`MA10: ${technicalIndicators.ma10}元`);
    if (technicalIndicators.ma20) indicators.push(`MA20: ${technicalIndicators.ma20}元`);
    if (technicalIndicators.ma60) indicators.push(`MA60: ${technicalIndicators.ma60}元`);
    if (technicalIndicators.rsi) indicators.push(`RSI(14): ${technicalIndicators.rsi}`);
    if (technicalIndicators.high20) indicators.push(`20日最高: ${technicalIndicators.high20}元`);
    if (technicalIndicators.low20) indicators.push(`20日最低: ${technicalIndicators.low20}元`);
  }

  return `请分析以下A股股票：

股票信息：
- 代码：${symbol}
- 名称：${name}
- 当前价格：${quote?.price ?? '-'} 元
- 涨跌幅：${quote?.changePercent ?? '-'}%
- 今日开盘：${quote?.open ?? '-'} 元
- 今日最高：${quote?.high ?? '-'} 元
- 今日最低：${quote?.low ?? '-'} 元

技术指标：
${indicators.join('\n')}

近10日K线数据：
${klineSummary || '暂无数据'}

请从以下维度给出分析（用中文回答，简洁专业）：
1. **短期趋势判断**：基于K线和均线系统，分析短期走势
2. **技术面分析**：从RSI、均线、成交量等角度分析当前状态
3. **风险提示**：需要注意的风险点
4. **操作建议**：短期操作建议（仅供参考）

注意：所有分析仅供技术参考，不构成任何投资建议。`;
}

function generateMockAnalysis({ symbol, name, quote, technicalIndicators }) {
  const change = parseFloat(technicalIndicators?.priceChange || 0);
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
    suggestion = '注意止损，不建议盲目抄底';
  } else if (change < 0) {
    trend = '小幅回调';
    suggestion = '等待企稳后再考虑操作';
  }

  const rsi = parseFloat(technicalIndicators?.rsi || 50);
  let rsiAnalysis = '';
  if (rsi > 70) {
    rsiAnalysis = 'RSI处于超买区域，注意回调风险';
  } else if (rsi < 30) {
    rsiAnalysis = 'RSI处于超卖区域，可能存在反弹机会';
  } else {
    rsiAnalysis = 'RSI处于正常区间';
  }

  return `【${name || symbol}(${symbol}) 技术分析】

**一、短期趋势判断**
当前股价${quote?.price ?? '-'}元，${quote?.change > 0 ? '上涨' : quote?.change < 0 ? '下跌' : '平盘'}${Math.abs(quote?.change ?? 0).toFixed(2)}元，涨幅${quote?.changePercent ?? '-'}%。整体呈现${trend}态势。

**二、技术面分析**
1. 均线系统：
   - MA5=${technicalIndicators?.ma5 ?? '-'}元，MA10=${technicalIndicators?.ma10 ?? '-'}元，MA20=${technicalIndicators?.ma20 ?? '-'}元
   - 短期均线对股价形成${parseFloat(technicalIndicators?.ma5 ?? 0) > (quote?.price ?? 0) ? '压力' : '支撑'}

2. RSI指标：
   - 当前RSI(14)=${technicalIndicators?.rsi ?? '-'}，${rsiAnalysis}

3. 价格区间：
   - 20日最高价：${technicalIndicators?.high20 ?? '-'}元
   - 20日最低价：${technicalIndicators?.low20 ?? '-'}元
${technicalIndicators?.high20 && technicalIndicators?.low20 && quote?.price ? `   - 当前位置处于近期价格区间的${((quote.price - technicalIndicators.low20) / (technicalIndicators.high20 - technicalIndicators.low20) * 100).toFixed(1)}%分位` : ''}

**三、风险提示**
- 市场整体波动风险
- 个股流动性风险
- 短期技术性回调风险

**四、操作建议**
${suggestion}

⚠️ 以上分析仅供参考，不构成投资建议。股市有风险，投资需谨慎！`;
}