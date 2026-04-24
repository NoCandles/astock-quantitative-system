import express from 'express';
import axios from 'axios';

const router = express.Router();

// ============== 风险管理模块 ==============

class RiskManager {
  constructor(initialCapital, maxDrawdown = 10) {
    this.initialCapital = initialCapital;
    this.maxDrawdown = maxDrawdown;
    this.currentCapital = initialCapital;
    this.peakCapital = initialCapital;
  }

  updateCapital(capital) {
    this.currentCapital = capital;
    this.peakCapital = Math.max(this.peakCapital, capital);
  }

  getCurrentDrawdown() {
    return this.peakCapital > 0 
      ? (this.peakCapital - this.currentCapital) / this.peakCapital * 100 
      : 0;
  }

  shouldStopTrading() {
    return this.getCurrentDrawdown() >= this.maxDrawdown;
  }

  calculatePositionSize(currentPrice, atr, riskPercent = 2) {
    const riskAmount = this.currentCapital * (riskPercent / 100);
    const stopLossDistance = atr * 1.5;
    const positionSize = Math.floor(riskAmount / stopLossDistance);
    return Math.min(positionSize, Math.floor(this.currentCapital * 0.95 / currentPrice));
  }
}

// ============== 技术指标计算模块 ==============

class TechnicalIndicators {
  // 计算EMA
  static calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    const ema = [prices[0]];
    for (let i = 1; i < prices.length; i++) {
      ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  }

  // 计算MACD
  static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);
    
    const macd = [];
    const signal = [];
    const histogram = [];
    
    for (let i = 0; i < prices.length; i++) {
      macd.push(emaFast[i] - emaSlow[i]);
      
      if (i < signalPeriod - 1) {
        signal.push(0);
        histogram.push(0);
      } else if (i === signalPeriod - 1) {
        signal.push(macd.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod);
        histogram.push(macd[i] - signal[i]);
      } else {
        signal.push(signal[i - 1] * (1 - 2/(signalPeriod + 1)) + macd[i] * (2/(signalPeriod + 1)));
        histogram.push(macd[i] - signal[i]);
      }
    }
    
    return { macd, signal, histogram };
  }

  // 计算布林带
  static calculateBollingerBands(prices, period = 20, stdDev = 2) {
    const bands = [];
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      bands.push({
        upper: mean + stdDev * std,
        middle: mean,
        lower: mean - stdDev * std,
        bandwidth: (stdDev * std * 2) / mean * 100,
        percentB: (prices[i] - (mean - stdDev * std)) / (2 * stdDev * std)
      });
    }
    return bands;
  }

  // 计算RSI
  static calculateRSI(prices, period = 14) {
    const rsi = [50];
    let gains = 0, losses = 0;
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains += change > 0 ? change : 0;
      losses += change < 0 ? -change : 0;
      
      if (i >= period) {
        if (i > period) {
          const prevChange = prices[i - 1] - prices[i - 2];
          gains -= prevChange > 0 ? prevChange : 0;
          losses -= prevChange < 0 ? -prevChange : 0;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    return rsi;
  }

  // 计算均线
  static calculateMA(prices, period) {
    const ma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        ma.push(null);
      } else {
        ma.push(prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
      }
    }
    return ma;
  }

  // 计算ATR (Average True Range)
  static calculateATR(data, period = 14) {
    const tr = [];
    const high = data.map(d => d.high);
    const low = data.map(d => d.low);
    const close = data.map(d => d.close);
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        tr.push(high[i] - low[i]);
      } else {
        tr.push(Math.max(
          high[i] - low[i],
          Math.abs(high[i] - close[i - 1]),
          Math.abs(low[i] - close[i - 1])
        ));
      }
    }
    return this.calculateEMA(tr, period);
  }

  // 计算成交量均线
  static calculateVolumeMA(volumes, period = 5) {
    const ma = [];
    for (let i = 0; i < volumes.length; i++) {
      if (i < period - 1) {
        ma.push(null);
      } else {
        ma.push(volumes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
      }
    }
    return ma;
  }

  // 检测价格背离
  static detectDivergence(prices, indicator, lookback = 20) {
    const recentPrices = prices.slice(-lookback);
    const recentIndicator = indicator.slice(-lookback);
    
    const priceTrend = recentPrices[recentPrices.length - 1] > recentPrices[0] ? 'up' : 'down';
    const indicatorTrend = recentIndicator[recentIndicator.length - 1] > recentIndicator[0] ? 'up' : 'down';
    
    if (priceTrend === 'up' && indicatorTrend === 'down') {
      return 'bearish_divergence';
    } else if (priceTrend === 'down' && indicatorTrend === 'up') {
      return 'bullish_divergence';
    }
    return 'no_divergence';
  }

  // 判断趋势方向
  static determineTrend(ma5, ma10, ma20, ma60 = null) {
    if (ma60 && ma5 > ma60 && ma10 > ma60 && ma20 > ma60) {
      return 'strong_uptrend';
    } else if (ma5 > ma10 && ma10 > ma20) {
      return 'uptrend';
    } else if (ma60 && ma5 < ma60 && ma10 < ma60 && ma20 < ma60) {
      return 'strong_downtrend';
    } else if (ma5 < ma10 && ma10 < ma20) {
      return 'downtrend';
    }
    return 'sideways';
  }
}

// ============== 交易成本计算 ==============

function calculateTradingCost(amount, side = 'buy') {
  const commission = amount * 0.0003; // 佣金万三
  const stampTax = side === 'sell' ? amount * 0.001 : 0; // 印花税千一（仅卖出）
  const transferFee = amount * 0.00002; // 过户费万二
  return commission + stampTax + transferFee;
}

// ============== 策略1: 增强型MACD策略 ==============

function enhancedMACDStrategy(data, params = {}) {
  const {
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9,
    stopLossPercent = 2,
    takeProfitPercent = 6,
    trailingStopPercent = 1.5,
    minVolumeRatio = 1.2
  } = params;

  const closes = data.map(d => d.close);
  const volumes = data.map(d => d.volume);
  const { macd, signal, histogram } = TechnicalIndicators.calculateMACD(closes, fastPeriod, slowPeriod, signalPeriod);
  const atr = TechnicalIndicators.calculateATR(data, 14);
  const volMA = TechnicalIndicators.calculateVolumeMA(volumes, 5);
  
  const ma5 = TechnicalIndicators.calculateMA(closes, 5);
  const ma20 = TechnicalIndicators.calculateMA(closes, 20);

  const trades = [];
  const signals = [];
  let position = null;
  let capital = params.initialCapital || 100000;
  const initialCapital = capital;
  const riskManager = new RiskManager(initialCapital, params.maxDrawdown || 20);

  for (let i = 50; i < data.length; i++) {
    if (riskManager.shouldStopTrading()) {
      if (position) {
        const currentPrice = data[i].close;
        trades.push({
          date: data[i].date,
          type: 'force_sell',
          price: currentPrice,
          shares: position.shares,
          amount: currentPrice * position.shares,
          pnl: (currentPrice - position.buyPrice) * position.shares - calculateTradingCost(position.buyPrice * position.shares, 'sell'),
          reason: '风险控制-最大回撤'
        });
        signals.push({ date: data[i].date, type: 'sell', price: currentPrice, reason: '风险控制' });
        capital += currentPrice * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        position = null;
      }
      break;
    }

    const currentPrice = data[i].close;
    const prevPrice = data[i - 1].close;
    const prevMacd = histogram[i - 1];
    const currMacd = histogram[i];
    const volumeRatio = volumes[i] / volMA[i];

    // 买入信号
    if (!position) {
      const maTrendUp = ma5[i] > ma20[i];
      const goldenCross = prevMacd < 0 && currMacd >= 0 && macd[i] > 0;
      const strongVolume = volumeRatio >= minVolumeRatio;
      const priceStabilized = atr[i] / currentPrice < 0.03;

      if (goldenCross && maTrendUp && strongVolume && priceStabilized) {
        const shares = riskManager.calculatePositionSize(currentPrice, atr[i], params.riskPercent || 2);
        if (shares > 0) {
          const cost = currentPrice * shares + calculateTradingCost(currentPrice * shares, 'buy');
          position = {
            buyDate: data[i].date,
            buyPrice: currentPrice,
            shares,
            costBasis: cost,
            highestPrice: currentPrice,
            trailingStop: currentPrice * (1 - trailingStopPercent / 100)
          };
          trades.push({
            date: data[i].date,
            type: 'buy',
            price: currentPrice,
            shares,
            amount: currentPrice * shares,
            reason: `MACD金叉(量比${volumeRatio.toFixed(2)})`
          });
          signals.push({ date: data[i].date, type: 'buy', price: currentPrice, reason: 'MACD金叉确认' });
          capital -= cost;
        }
      }
    }

    // 卖出信号
    if (position) {
      position.highestPrice = Math.max(position.highestPrice, currentPrice);
      position.trailingStop = position.highestPrice * (1 - trailingStopPercent / 100);
      
      const priceChange = (currentPrice - position.buyPrice) / position.buyPrice * 100;
      const deadCross = prevMacd > 0 && currMacd < 0;
      const trailingStopHit = currentPrice <= position.trailingStop;
      const fixedStopLoss = priceChange <= -stopLossPercent;
      const fixedTakeProfit = priceChange >= takeProfitPercent;

      const shouldSell = deadCross || trailingStopHit || fixedStopLoss || fixedTakeProfit;

      if (shouldSell) {
        let reason = '';
        if (deadCross) reason = 'MACD死叉';
        else if (trailingStopHit) reason = '移动止损';
        else if (fixedStopLoss) reason = '固定止损';
        else if (fixedTakeProfit) reason = '止盈';

        const pnl = (currentPrice - position.buyPrice) * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        trades.push({
          date: data[i].date,
          type: 'sell',
          price: currentPrice,
          shares: position.shares,
          amount: currentPrice * position.shares,
          pnl,
          reason
        });
        signals.push({ date: data[i].date, type: 'sell', price: currentPrice, reason });
        capital += currentPrice * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        riskManager.updateCapital(capital);
        position = null;
      }
    }
  }

  return calculateStats(trades, capital, initialCapital, data, signals);
}

// ============== 策略2: 多周期布林带策略 ==============

function multiPeriodBollingerStrategy(data, params = {}) {
  const {
    period = 20,
    stdDev = 2,
    stopLossPercent = 2.5,
    takeProfitPercent = 5,
    confirmationPeriod = 3
  } = params;

  const closes = data.map(d => d.close);
  const volumes = data.map(d => d.volume);
  const bollingerBands = TechnicalIndicators.calculateBollingerBands(closes, period, stdDev);
  const atr = TechnicalIndicators.calculateATR(data, 14);
  const volMA = TechnicalIndicators.calculateVolumeMA(volumes, 20);
  
  const ma5 = TechnicalIndicators.calculateMA(closes, 5);
  const ma20 = TechnicalIndicators.calculateMA(closes, 20);

  const trades = [];
  const signals = [];
  let position = null;
  let capital = params.initialCapital || 100000;
  const initialCapital = capital;
  const riskManager = new RiskManager(initialCapital, params.maxDrawdown || 20);

  let breakCount = 0;

  for (let i = period - 1 + confirmationPeriod; i < data.length; i++) {
    if (riskManager.shouldStopTrading()) break;

    const currentPrice = data[i].close;
    const bbIndex = i - (period - 1);
    const bb = bollingerBands[bbIndex];
    const prevBb = bollingerBands[bbIndex - 1];
    const volumeRatio = volumes[i] / volMA[i];

    if (!position) {
      const priceBreakUpper = prevBb && prevBb.upper < closes[i - 1] && bb.upper >= currentPrice;
      const maAlignment = ma5[i] > ma20[i];
      const strongVolume = volumeRatio > 1.5;

      if (priceBreakUpper && maAlignment && strongVolume) {
        breakCount++;
        if (breakCount >= confirmationPeriod) {
          const shares = riskManager.calculatePositionSize(currentPrice, atr[i], params.riskPercent || 2);
          if (shares > 0) {
            const cost = currentPrice * shares + calculateTradingCost(currentPrice * shares, 'buy');
            position = {
              buyDate: data[i].date,
              buyPrice: currentPrice,
              shares,
              costBasis: cost,
              highestPrice: currentPrice,
              stopLoss: bb.middle
            };
            trades.push({
              date: data[i].date,
              type: 'buy',
              price: currentPrice,
              shares,
              amount: currentPrice * shares,
              reason: `布林带上轨突破(${volumeRatio.toFixed(2)}倍量)`
            });
            signals.push({ date: data[i].date, type: 'buy', price: currentPrice, reason: '布林带上轨突破' });
            capital -= cost;
          }
          breakCount = 0;
        }
      } else {
        breakCount = 0;
      }
    }

    if (position) {
      position.highestPrice = Math.max(position.highestPrice, currentPrice);
      const priceChange = (currentPrice - position.buyPrice) / position.buyPrice * 100;
      const middleBandTouch = currentPrice <= position.stopLoss;
      const trailingStop = position.highestPrice * 0.97;
      const stopLossHit = currentPrice <= position.buyPrice * (1 - stopLossPercent / 100);
      const takeProfitHit = priceChange >= takeProfitPercent;
      const dynamicStopLoss = currentPrice <= Math.max(position.stopLoss, trailingStop);

      const shouldSell = middleBandTouch || dynamicStopLoss || stopLossHit || takeProfitHit;

      if (shouldSell) {
        let reason = '';
        if (middleBandTouch) reason = '回归中轨';
        else if (dynamicStopLoss) reason = '移动止损';
        else if (stopLossHit) reason = '止损';
        else if (takeProfitHit) reason = '止盈';

        const pnl = (currentPrice - position.buyPrice) * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        trades.push({
          date: data[i].date,
          type: 'sell',
          price: currentPrice,
          shares: position.shares,
          amount: currentPrice * position.shares,
          pnl,
          reason
        });
        signals.push({ date: data[i].date, type: 'sell', price: currentPrice, reason });
        capital += currentPrice * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        riskManager.updateCapital(capital);
        position = null;
      }
    }
  }

  return calculateStats(trades, capital, initialCapital, data, signals);
}

// ============== 策略3: 动态RSI策略 ==============

function dynamicRSIStrategy(data, params = {}) {
  const {
    rsiPeriod = 14,
    rsiBuy = 30,
    rsiSell = 70,
    stopLossPercent = 2,
    takeProfitPercent = 5,
    divergenceLookback = 20
  } = params;

  const closes = data.map(d => d.close);
  const volumes = data.map(d => d.volume);
  const rsi = TechnicalIndicators.calculateRSI(closes, rsiPeriod);
  const atr = TechnicalIndicators.calculateATR(data, 14);
  const volMA = TechnicalIndicators.calculateVolumeMA(volumes, 5);
  
  const ma5 = TechnicalIndicators.calculateMA(closes, 5);
  const ma20 = TechnicalIndicators.calculateMA(closes, 20);

  const trades = [];
  const signals = [];
  let position = null;
  let capital = params.initialCapital || 100000;
  const initialCapital = capital;
  const riskManager = new RiskManager(initialCapital, params.maxDrawdown || 20);

  for (let i = rsiPeriod + 10; i < data.length; i++) {
    if (riskManager.shouldStopTrading()) break;

    const currentPrice = data[i].close;
    const currentRSI = rsi[i];
    const volumeRatio = volumes[i] / volMA[i];

    if (!position) {
      const oversold = currentRSI < rsiBuy;
      const trendConfirmation = ma5[i] > ma20[i] * 0.98;
      const volumeConfirmation = volumeRatio >= 1.1;
      const divergence = TechnicalIndicators.detectDivergence(closes.slice(0, i + 1), rsi.slice(0, i + 1), divergenceLookback);
      const bullishDivergence = divergence === 'bullish_divergence';

      if (oversold && trendConfirmation && (volumeConfirmation || bullishDivergence)) {
        const shares = riskManager.calculatePositionSize(currentPrice, atr[i], params.riskPercent || 2);
        if (shares > 0) {
          const cost = currentPrice * shares + calculateTradingCost(currentPrice * shares, 'buy');
          position = {
            buyDate: data[i].date,
            buyPrice: currentPrice,
            shares,
            costBasis: cost,
            highestPrice: currentPrice,
            trailingStop: currentPrice * 0.97,
            rsiEntry: currentRSI
          };
          trades.push({
            date: data[i].date,
            type: 'buy',
            price: currentPrice,
            shares,
            amount: currentPrice * shares,
            reason: `RSI超卖${currentRSI.toFixed(1)}${bullishDivergence ? '(底背离)' : ''}`
          });
          signals.push({ date: data[i].date, type: 'buy', price: currentPrice, reason: `RSI超卖${bullishDivergence ? '+底背离' : ''}` });
          capital -= cost;
        }
      }
    }

    if (position) {
      position.highestPrice = Math.max(position.highestPrice, currentPrice);
      position.trailingStop = position.highestPrice * 0.97;
      
      const priceChange = (currentPrice - position.buyPrice) / position.buyPrice * 100;
      const overbought = currentRSI > rsiSell;
      const trailingStopHit = currentPrice <= position.trailingStop;
      const stopLossHit = priceChange <= -stopLossPercent;
      const takeProfitHit = priceChange >= takeProfitPercent;

      const shouldSell = overbought || trailingStopHit || stopLossHit || takeProfitHit;

      if (shouldSell) {
        let reason = '';
        if (overbought) reason = `RSI超买${currentRSI.toFixed(1)}`;
        else if (trailingStopHit) reason = '移动止损';
        else if (stopLossHit) reason = '止损';
        else if (takeProfitHit) reason = '止盈';

        const pnl = (currentPrice - position.buyPrice) * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        trades.push({
          date: data[i].date,
          type: 'sell',
          price: currentPrice,
          shares: position.shares,
          amount: currentPrice * position.shares,
          pnl,
          reason
        });
        signals.push({ date: data[i].date, type: 'sell', price: currentPrice, reason });
        capital += currentPrice * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        riskManager.updateCapital(capital);
        position = null;
      }
    }
  }

  return calculateStats(trades, capital, initialCapital, data, signals);
}

// ============== 策略4: 多均线趋势跟踪策略 ==============

function multiMATrendStrategy(data, params = {}) {
  const {
    maShort = 5,
    maMid = 20,
    maLong = 60,
    stopLossPercent = 3,
    takeProfitPercent = 8,
    trailingStopPercent = 2
  } = params;

  const closes = data.map(d => d.close);
  const volumes = data.map(d => d.volume);
  const atr = TechnicalIndicators.calculateATR(data, 14);
  const volMA = TechnicalIndicators.calculateVolumeMA(volumes, 10);

  const maShortData = TechnicalIndicators.calculateMA(closes, maShort);
  const maMidData = TechnicalIndicators.calculateMA(closes, maMid);
  const maLongData = TechnicalIndicators.calculateMA(closes, maLong);

  const trades = [];
  const signals = [];
  let position = null;
  let capital = params.initialCapital || 100000;
  const initialCapital = capital;
  const riskManager = new RiskManager(initialCapital, params.maxDrawdown || 20);

  for (let i = maLong + 5; i < data.length; i++) {
    if (riskManager.shouldStopTrading()) break;

    const currentPrice = data[i].close;
    const volumeRatio = volumes[i] / volMA[i];
    
    const maS = maShortData[i];
    const maM = maMidData[i];
    const maL = maLongData[i];
    
    const maSPrev = maShortData[i - 1];
    const maMPrev = maMidData[i - 1];

    if (!position) {
      const strongTrend = maS > maM && maM > maL;
      const goldenCross = maSPrev <= maMPrev && maS > maM;
      const priceAboveMa = currentPrice > maS;
      const volumeConfirmation = volumeRatio >= 1.2;

      if (strongTrend && goldenCross && priceAboveMa && volumeConfirmation) {
        const shares = riskManager.calculatePositionSize(currentPrice, atr[i], params.riskPercent || 2);
        if (shares > 0) {
          const cost = currentPrice * shares + calculateTradingCost(currentPrice * shares, 'buy');
          position = {
            buyDate: data[i].date,
            buyPrice: currentPrice,
            shares,
            costBasis: cost,
            highestPrice: currentPrice,
            trailingStop: currentPrice * (1 - trailingStopPercent / 100),
            maLongPrice: maL
          };
          trades.push({
            date: data[i].date,
            type: 'buy',
            price: currentPrice,
            shares,
            amount: currentPrice * shares,
            reason: `均线金叉(量比${volumeRatio.toFixed(2)})`
          });
          signals.push({ date: data[i].date, type: 'buy', price: currentPrice, reason: '多均线金叉确认' });
          capital -= cost;
        }
      }
    }

    if (position) {
      position.highestPrice = Math.max(position.highestPrice, currentPrice);
      position.trailingStop = Math.max(
        position.trailingStop,
        position.highestPrice * (1 - trailingStopPercent / 100)
      );
      
      const priceChange = (currentPrice - position.buyPrice) / position.buyPrice * 100;
      const trendBroken = maS < maM;
      const maLongBreak = currentPrice < position.maLongPrice * 0.95;
      const trailingStopHit = currentPrice <= position.trailingStop;
      const stopLossHit = priceChange <= -stopLossPercent;
      const takeProfitHit = priceChange >= takeProfitPercent;

      const shouldSell = trendBroken || maLongBreak || trailingStopHit || stopLossHit || takeProfitHit;

      if (shouldSell) {
        let reason = '';
        if (trendBroken) reason = '均线死叉';
        else if (maLongBreak) reason = '跌破长期均线';
        else if (trailingStopHit) reason = '移动止损';
        else if (stopLossHit) reason = '止损';
        else if (takeProfitHit) reason = '止盈';

        const pnl = (currentPrice - position.buyPrice) * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        trades.push({
          date: data[i].date,
          type: 'sell',
          price: currentPrice,
          shares: position.shares,
          amount: currentPrice * position.shares,
          pnl,
          reason
        });
        signals.push({ date: data[i].date, type: 'sell', price: currentPrice, reason });
        capital += currentPrice * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        riskManager.updateCapital(capital);
        position = null;
      }
    }
  }

  return calculateStats(trades, capital, initialCapital, data, signals);
}

// ============== 策略5: 量价配合策略 ==============

function volumePriceStrategy(data, params = {}) {
  const {
    volPeriod = 5,
    volMultiplier = 1.8,
    stopLossPercent = 2.5,
    takeProfitPercent = 5,
    trailingStopPercent = 1.5
  } = params;

  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const volumes = data.map(d => d.volume);
  const atr = TechnicalIndicators.calculateATR(data, 14);
  const volMA = TechnicalIndicators.calculateVolumeMA(volumes, volPeriod);
  const priceMA = TechnicalIndicators.calculateMA(closes, 20);

  const trades = [];
  const signals = [];
  let position = null;
  let capital = params.initialCapital || 100000;
  const initialCapital = capital;
  const riskManager = new RiskManager(initialCapital, params.maxDrawdown || 20);

  for (let i = volPeriod + 20; i < data.length; i++) {
    if (riskManager.shouldStopTrading()) break;

    const currentPrice = data[i].close;
    const currentHigh = highs[i];
    const currentLow = lows[i];
    const currentVol = volumes[i];
    const volAvg = volMA[i];
    const priceMAValue = priceMA[i];
    
    const volumeRatio = currentVol / volAvg;
    const priceChange = (currentPrice - closes[i - 1]) / closes[i - 1] * 100;
    const priceAboveMA = currentPrice > priceMAValue;

    if (!position) {
      const volumeBreakout = volumeRatio >= volMultiplier;
      const priceBreakout = priceChange > 0 && currentPrice >= currentHigh;
      const trendConfirmation = priceAboveMA;
      const healthyPullback = priceChange < 0 && priceChange > -1;

      if ((volumeBreakout || priceBreakout) && trendConfirmation) {
        const shares = riskManager.calculatePositionSize(currentPrice, atr[i], params.riskPercent || 2);
        if (shares > 0) {
          const cost = currentPrice * shares + calculateTradingCost(currentPrice * shares, 'buy');
          position = {
            buyDate: data[i].date,
            buyPrice: currentPrice,
            shares,
            costBasis: cost,
            highestPrice: currentPrice,
            trailingStop: currentPrice * (1 - trailingStopPercent / 100),
            entryVolumeRatio: volumeRatio
          };
          trades.push({
            date: data[i].date,
            type: 'buy',
            price: currentPrice,
            shares,
            amount: currentPrice * shares,
            reason: `量价齐升(量比${volumeRatio.toFixed(2)})`
          });
          signals.push({ date: data[i].date, type: 'buy', price: currentPrice, reason: '量价配合突破' });
          capital -= cost;
        }
      }
    }

    if (position) {
      position.highestPrice = Math.max(position.highestPrice, currentPrice);
      position.trailingStop = position.highestPrice * (1 - trailingStopPercent / 100);
      
      const profitPercent = (currentPrice - position.buyPrice) / position.buyPrice * 100;
      const volumeShrinking = currentVol < volAvg * 0.6;
      const trailingStopHit = currentPrice <= position.trailingStop;
      const stopLossHit = profitPercent <= -stopLossPercent;
      const takeProfitHit = profitPercent >= takeProfitPercent;
      const belowMA = currentPrice < priceMAValue * 0.97;

      const shouldSell = volumeShrinking || trailingStopHit || stopLossHit || takeProfitHit || belowMA;

      if (shouldSell) {
        let reason = '';
        if (volumeShrinking) reason = '量能萎缩';
        else if (belowMA) reason = '跌破均线';
        else if (trailingStopHit) reason = '移动止损';
        else if (stopLossHit) reason = '止损';
        else if (takeProfitHit) reason = '止盈';

        const pnl = (currentPrice - position.buyPrice) * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        trades.push({
          date: data[i].date,
          type: 'sell',
          price: currentPrice,
          shares: position.shares,
          amount: currentPrice * position.shares,
          pnl,
          reason
        });
        signals.push({ date: data[i].date, type: 'sell', price: currentPrice, reason });
        capital += currentPrice * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        riskManager.updateCapital(capital);
        position = null;
      }
    }
  }

  return calculateStats(trades, capital, initialCapital, data, signals);
}

// ============== 策略6: 综合量化策略 ==============

function comprehensiveStrategy(data, params = {}) {
  const {
    stopLossPercent = 2.5,
    takeProfitPercent = 6,
    trailingStopPercent = 1.5,
    minConfidence = 2
  } = params;

  const closes = data.map(d => d.close);
  const volumes = data.map(d => d.volume);
  
  const { macd, signal, histogram } = TechnicalIndicators.calculateMACD(closes, 12, 26, 9);
  const rsi = TechnicalIndicators.calculateRSI(closes, 14);
  const bollingerBands = TechnicalIndicators.calculateBollingerBands(closes, 20, 2);
  const atr = TechnicalIndicators.calculateATR(data, 14);
  const volMA = TechnicalIndicators.calculateVolumeMA(volumes, 5);
  
  const ma5 = TechnicalIndicators.calculateMA(closes, 5);
  const ma20 = TechnicalIndicators.calculateMA(closes, 20);
  const ma60 = TechnicalIndicators.calculateMA(closes, 60);

  const trades = [];
  const signals = [];
  let position = null;
  let capital = params.initialCapital || 100000;
  const initialCapital = capital;
  const riskManager = new RiskManager(initialCapital, params.maxDrawdown || 20);

  for (let i = 70; i < data.length; i++) {
    if (riskManager.shouldStopTrading()) break;

    const currentPrice = data[i].close;
    const volumeRatio = volumes[i] / volMA[i];
    const bbIndex = i - 19;
    const bb = bollingerBands[bbIndex];
    
    const trend = TechnicalIndicators.determineTrend(ma5[i], ma20[i], ma60[i]);
    const bullishTrend = ['uptrend', 'strong_uptrend'].includes(trend);

    if (!position) {
      let buySignals = [];
      
      // MACD金叉
      if (histogram[i - 1] < 0 && histogram[i] >= 0 && macd[i] > 0) {
        buySignals.push('MACD金叉');
      }
      
      // RSI超卖
      if (rsi[i] < 35) {
        buySignals.push('RSI超卖');
      }
      
      // 布林带下轨
      if (bb && currentPrice <= bb.lower) {
        buySignals.push('布林带超卖');
      }
      
      // 均线支撑
      if (ma5[i] > ma20[i] && currentPrice > ma5[i] * 0.98) {
        buySignals.push('均线支撑');
      }
      
      // 成交量确认
      if (volumeRatio >= 1.3) {
        buySignals.push('放量确认');
      }

      if (buySignals.length >= minConfidence && bullishTrend) {
        const shares = riskManager.calculatePositionSize(currentPrice, atr[i], params.riskPercent || 2);
        if (shares > 0) {
          const cost = currentPrice * shares + calculateTradingCost(currentPrice * shares, 'buy');
          position = {
            buyDate: data[i].date,
            buyPrice: currentPrice,
            shares,
            costBasis: cost,
            highestPrice: currentPrice,
            trailingStop: currentPrice * (1 - trailingStopPercent / 100),
            signals: buySignals
          };
          trades.push({
            date: data[i].date,
            type: 'buy',
            price: currentPrice,
            shares,
            amount: currentPrice * shares,
            reason: buySignals.join('+')
          });
          signals.push({ date: data[i].date, type: 'buy', price: currentPrice, reason: '综合信号' });
          capital -= cost;
        }
      }
    }

    if (position) {
      position.highestPrice = Math.max(position.highestPrice, currentPrice);
      position.trailingStop = position.highestPrice * (1 - trailingStopPercent / 100);
      
      const profitPercent = (currentPrice - position.buyPrice) / position.buyPrice * 100;
      
      // 卖出信号
      let shouldSell = false;
      let reason = '';
      
      if (ma5[i] < ma20[i]) {
        shouldSell = true;
        reason = '趋势转空';
      } else if (profitPercent <= -stopLossPercent) {
        shouldSell = true;
        reason = '止损';
      } else if (profitPercent >= takeProfitPercent) {
        shouldSell = true;
        reason = '止盈';
      } else if (currentPrice <= position.trailingStop) {
        shouldSell = true;
        reason = '移动止损';
      } else if (rsi[i] > 75) {
        shouldSell = true;
        reason = 'RSI超买';
      }

      if (shouldSell) {
        const pnl = (currentPrice - position.buyPrice) * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        trades.push({
          date: data[i].date,
          type: 'sell',
          price: currentPrice,
          shares: position.shares,
          amount: currentPrice * position.shares,
          pnl,
          reason
        });
        signals.push({ date: data[i].date, type: 'sell', price: currentPrice, reason });
        capital += currentPrice * position.shares - calculateTradingCost(currentPrice * position.shares, 'sell');
        riskManager.updateCapital(capital);
        position = null;
      }
    }
  }

  return calculateStats(trades, capital, initialCapital, data, signals);
}

// ============== 统计计算模块 ==============

function calculateStats(trades, capital, initialCapital, data, signals) {
  const sellTrades = trades.filter(t => t.type === 'sell' || t.type === 'force_sell');
  const wins = sellTrades.filter(t => t.pnl > 0).length;
  const losses = sellTrades.length - wins;
  const totalPnl = sellTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const returns = (capital - initialCapital) / initialCapital * 100;
  const winRate = sellTrades.length > 0 ? wins / sellTrades.length : 0;

  // 计算最大回撤
  let equity = initialCapital;
  let maxEquity = initialCapital;
  let maxDrawdown = 0;
  let maxDrawdownDate = null;
  const equityCurve = [];

  trades.forEach(trade => {
    if (trade.type === 'buy') {
      equity -= trade.amount;
    } else {
      equity += trade.amount + (trade.pnl || 0);
    }
    equityCurve.push({ date: trade.date, value: equity });
    maxEquity = Math.max(maxEquity, equity);
    const drawdown = (maxEquity - equity) / maxEquity * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownDate = trade.date;
    }
  });

  // 补充权益曲线到最后一个交易日
  if (data.length > 0) {
    const lastTrade = trades[trades.length - 1];
    if (lastTrade) {
      equityCurve.push({ date: data[data.length - 1].date, value: capital });
    }
  }

  // 计算收益率序列
  const dailyReturns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const dailyReturn = (equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value;
    dailyReturns.push(dailyReturn);
  }

  // 计算年化收益率
  const tradingDays = data.length;
  const years = tradingDays / 252;
  const annualizedReturn = years > 0 ? (Math.pow(capital / initialCapital, 1 / years) - 1) * 100 : 0;

  // 计算夏普比率
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length || 0;
  const stdReturn = Math.sqrt(dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length) || 0.001;
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

  // 计算索提诺比率
  const negativeReturns = dailyReturns.filter(r => r < 0);
  const downsideStd = Math.sqrt(negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length) || 0.001;
  const sortinoRatio = downsideStd > 0 ? (avgReturn / downsideStd) * Math.sqrt(252) : 0;

  // 计算卡玛比率
  const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

  // 计算平均持仓天数
  let totalHoldingDays = 0;
  let tradeCount = 0;
  const buyTrades = trades.filter(t => t.type === 'buy');
  sellTrades.forEach((sellTrade, idx) => {
    if (buyTrades[idx]) {
      const buyDate = new Date(buyTrades[idx].date);
      const sellDate = new Date(sellTrade.date);
      totalHoldingDays += Math.ceil((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
      tradeCount++;
    }
  });
  const avgHoldingDays = tradeCount > 0 ? Math.round(totalHoldingDays / tradeCount) : 0;

  // 计算平均盈亏
  const avgWin = wins > 0 ? sellTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / wins : 0;
  const avgLoss = losses > 0 ? Math.abs(sellTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / losses) : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

  // 胜率统计
  const winRateByReason = {};
  sellTrades.forEach(trade => {
    const reason = trade.reason;
    if (!winRateByReason[reason]) {
      winRateByReason[reason] = { total: 0, wins: 0 };
    }
    winRateByReason[reason].total++;
    if (trade.pnl > 0) winRateByReason[reason].wins++;
  });

  return {
    summary: {
      initialCapital,
      finalCapital: capital,
      totalReturn: returns,
      annualizedReturn,
      totalTrades: sellTrades.length,
      winRate,
      totalPnl,
      profitFactor,
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
      avgHoldingDays,
      maxDrawdown: maxDrawdown.toFixed(2),
      maxDrawdownDate,
      sharpeRatio: sharpeRatio.toFixed(2),
      sortinoRatio: sortinoRatio.toFixed(2),
      calmarRatio: calmarRatio.toFixed(2),
      tradingDays
    },
    trades,
    signals,
    equityCurve,
    winRateByReason,
    riskManager: {
      currentCapital: capital,
      maxDrawdown: maxDrawdown.toFixed(2),
      riskEvents: trades.filter(t => t.reason.includes('止损') || t.type === 'force_sell').length
    }
  };
}

// ============== API路由 ==============

router.post('/run', async (req, res) => {
  try {
    const { symbol, startDate, endDate, strategy = 'macd', params: strategyParams } = req.body;

    const market = symbol.startsWith('6') ? 'sh' : 'sz';
    const url = `https://quotes.sina.cn/cn/api/jsonp.php/var%20${symbol}_daily=/CN_MarketDataService.getKLineData?symbol=${market}${symbol}&scale=240&ma=no&datalen=500`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.sina.com.cn'
      }
    });

    const dataStr = response.data;
    const match = dataStr.match(/\[.*\]/);
    let data = match ? JSON.parse(match[0]) : [];

    if (startDate) {
      data = data.filter((d) => d.day >= startDate);
    }
    if (endDate) {
      data = data.filter((d) => d.day <= endDate);
    }

    data = data.map((item) => ({
      date: item.day,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume)
    }));

    if (data.length < 60) {
      return res.status(400).json({ success: false, error: '数据不足，无法进行回测' });
    }

    const defaultParams = {
      ...strategyParams,
      initialCapital: strategyParams?.initialCapital || 100000
    };

    let result;
    switch (strategy) {
      case 'macd':
        result = enhancedMACDStrategy(data, defaultParams);
        break;
      case 'bollinger':
        result = multiPeriodBollingerStrategy(data, defaultParams);
        break;
      case 'rsi':
        result = dynamicRSIStrategy(data, defaultParams);
        break;
      case 'ma_cross':
        result = multiMATrendStrategy(data, defaultParams);
        break;
      case 'volume':
        result = volumePriceStrategy(data, defaultParams);
        break;
      case 'comprehensive':
        result = comprehensiveStrategy(data, defaultParams);
        break;
      default:
        result = enhancedMACDStrategy(data, defaultParams);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('回测失败:', error);
    res.status(500).json({ success: false, error: '回测失败', message: error.message });
  }
});

export default router;
