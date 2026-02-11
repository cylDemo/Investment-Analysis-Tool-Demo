const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3001;

// 确保临时目录存在
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// 计算移动平均线
function calculateMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].price;
    }
    result.push(parseFloat((sum / period).toFixed(2)));
  }
  return result;
}

// 计算MACD指标
function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const prices = data.map(item => item.price);
  
  // 计算EMA（修改版，适合小数据集）
  function calculateEMA(prices, period) {
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    // 对于小数据集，使用简单移动平均作为起始值
    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        // 第一个值使用第一个价格
        ema.push(prices[i]);
      } else {
        // 后续值使用EMA公式
        const currentEma = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
        ema.push(parseFloat(currentEma.toFixed(2)));
      }
    }
    
    return ema;
  }
  
  const ema12 = calculateEMA(prices, fastPeriod);
  const ema26 = calculateEMA(prices, slowPeriod);
  
  // 计算DIF
  const dif = [];
  for (let i = 0; i < data.length; i++) {
    const difValue = ema12[i] - ema26[i];
    dif.push(parseFloat(difValue.toFixed(2)));
  }
  
  // 计算DEA
  const dea = calculateEMA(dif, signalPeriod);
  
  // 计算MACD柱状图
  const macdHist = [];
  for (let i = 0; i < data.length; i++) {
    const histValue = (dif[i] - dea[i]) * 2;
    macdHist.push(parseFloat(histValue.toFixed(2)));
  }
  
  return {
    dif,
    dea,
    hist: macdHist
  };
}

// 计算KDJ指标
function calculateKDJ(data, period = 9, kPeriod = 3, dPeriod = 3) {
  const result = {
    k: [],
    d: [],
    j: []
  };
  
  // 确保数据按日期正序排列（从早到晚）
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  for (let i = 0; i < sortedData.length; i++) {
    if (i < period - 1) {
      result.k.push(null);
      result.d.push(null);
      result.j.push(null);
      continue;
    }
    
    // 计算最近period天的最高价、最低价
    let high = -Infinity;
    let low = Infinity;
    for (let j = 0; j < period; j++) {
      const currentData = sortedData[i - j];
      high = Math.max(high, currentData.price);
      low = Math.min(low, currentData.price);
    }
    
    const close = sortedData[i].price;
    // 处理最高价和最低价相等的情况
    let rsv;
    if (high === low) {
      rsv = 50; // 当价格不变时，RSV设为50
    } else {
      rsv = ((close - low) / (high - low)) * 100;
    }
    
    // 确保RSV在合理范围内
    rsv = Math.max(0, Math.min(100, rsv));
    
    // 计算K值
    let k;
    if (i === period - 1) {
      k = rsv;
    } else {
      // 使用前一天的K值
      const prevK = result.k[i - 1] !== null ? result.k[i - 1] : 50; // 如果前一天没有K值，使用50
      k = (2 / 3) * prevK + (1 / 3) * rsv;
    }
    result.k.push(parseFloat(k.toFixed(2)));
    
    // 计算D值
    let d;
    if (i === period - 1) {
      d = k;
    } else {
      // 使用前一天的D值
      const prevD = result.d[i - 1] !== null ? result.d[i - 1] : 50; // 如果前一天没有D值，使用50
      d = (2 / 3) * prevD + (1 / 3) * k;
    }
    result.d.push(parseFloat(d.toFixed(2)));
    
    // 计算J值
    const j = 3 * k - 2 * d;
    result.j.push(parseFloat(j.toFixed(2)));
  }
  
  return result;
}

// 模拟股票数据
const stockData = {
  '000001': {
    name: '平安银行',
    code: '000001',
    price: 15.23,
    change: 0.23,
    changePercent: 1.53,
    pe: 5.8,
    pb: 0.85,
    roe: 14.2,
    dividendRate: 5.2,
    industry: '银行',
    mainBusiness: '吸收公众存款；发放短期、中期和长期贷款；办理国内外结算；办理票据承兑与贴现；发行金融债券；代理发行、代理兑付、承销政府债券；买卖政府债券、金融债券；从事同业拆借；买卖、代理买卖外汇；从事银行卡业务；提供信用证服务及担保；代理收付款项及代理保险业务；提供保管箱服务；结汇、售汇业务；离岸银行业务；资产托管业务；办理黄金业务；财务顾问、资信调查、咨询、见证业务；经国务院银行业监督管理机构及其他相关监管机构批准的其他业务。',
    mainProducts: '个人存款、个人贷款、信用卡、企业贷款、贸易融资、投资银行、资产管理、金融市场业务',
    description: '平安银行是中国平安保险（集团）股份有限公司控股的股份制商业银行，成立于1987年，总部位于深圳。作为中国领先的商业银行之一，平安银行致力于为个人和企业客户提供全方位的金融服务，包括零售银行、公司银行、投资银行等业务。近年来，平安银行积极推进数字化转型，打造智能化银行服务体系，不断提升客户体验和运营效率。',
    financials: {
      balanceSheet: {
        totalAssets: '5,230,000',
        totalLiabilities: '4,850,000',
        totalEquity: '380,000',
        cash: '850,000',
        loans: '2,900,000'
      },
      incomeStatement: {
        revenue: '180,000',
        netProfit: '45,000',
        operatingExpenses: '105,000',
        interestIncome: '145,000',
        nonInterestIncome: '35,000'
      },
      cashFlow: {
        operatingCashFlow: '65,000',
        investingCashFlow: '-25,000',
        financingCashFlow: '-30,000',
        netCashFlow: '10,000'
      }
    },
    history: {
      '2026': [
        { date: '2026-01-31', price: 15.23 },
        { date: '2026-01-15', price: 14.90 },
        { date: '2026-01-01', price: 14.70 }
      ],
      '2025': [
        { date: '2025-12-31', price: 14.60 },
        { date: '2025-11-30', price: 15.20 },
        { date: '2025-10-31', price: 14.80 },
        { date: '2025-09-30', price: 15.50 },
        { date: '2025-08-31', price: 14.90 },
        { date: '2025-07-31', price: 14.20 },
        { date: '2025-06-30', price: 13.80 },
        { date: '2025-05-31', price: 14.50 },
        { date: '2025-04-30', price: 13.90 },
        { date: '2025-03-31', price: 14.30 },
        { date: '2025-02-28', price: 13.70 },
        { date: '2025-01-31', price: 14.10 }
      ],
      '2024': [
        { date: '2024-12-31', price: 13.90 },
        { date: '2024-11-30', price: 14.40 },
        { date: '2024-10-31', price: 13.80 },
        { date: '2024-09-30', price: 14.20 },
        { date: '2024-08-31', price: 13.60 },
        { date: '2024-07-31', price: 13.90 },
        { date: '2024-06-30', price: 13.30 },
        { date: '2024-05-31', price: 13.70 },
        { date: '2024-04-30', price: 13.10 },
        { date: '2024-03-31', price: 13.50 },
        { date: '2024-02-29', price: 12.90 },
        { date: '2024-01-31', price: 13.30 }
      ]
    }
  },
  '600519': {
    name: '贵州茅台',
    code: '600519',
    price: 1789.00,
    change: -12.50,
    changePercent: -0.69,
    pe: 32.5,
    pb: 12.3,
    roe: 30.5,
    dividendRate: 1.5,
    industry: '白酒',
    mainBusiness: '茅台酒及系列酒的生产与销售',
    mainProducts: '茅台酒、茅台王子酒、茅台迎宾酒、茅台年份酒、茅台特制酒等系列产品',
    description: '贵州茅台酒股份有限公司是中国著名的白酒生产企业，成立于1999年，总部位于贵州省仁怀市茅台镇，是茅台酒的发源地。公司主要生产和销售茅台酒系列产品，茅台酒是中国国家地理标志产品，具有悠久的历史和深厚的文化底蕴。贵州茅台是中国A股市场的龙头企业，市值长期位居前列，以其卓越的产品品质和品牌价值享誉国内外。',
    financials: {
      balanceSheet: {
        totalAssets: '280,000',
        totalLiabilities: '55,000',
        totalEquity: '225,000',
        cash: '120,000',
        inventory: '85,000'
      },
      incomeStatement: {
        revenue: '135,000',
        netProfit: '68,000',
        operatingExpenses: '35,000',
        costOfSales: '22,000',
        grossProfit: '113,000'
      },
      cashFlow: {
        operatingCashFlow: '75,000',
        investingCashFlow: '-10,000',
        financingCashFlow: '-60,000',
        netCashFlow: '5,000'
      }
    },
    history: {
      '2026': [
        { date: '2026-01-31', price: 1789.00 },
        { date: '2026-01-15', price: 1800.00 },
        { date: '2026-01-01', price: 1795.00 }
      ],
      '2025': [
        { date: '2025-12-31', price: 1790.00 },
        { date: '2025-11-30', price: 1830.00 },
        { date: '2025-10-31', price: 1780.00 },
        { date: '2025-09-30', price: 1820.00 },
        { date: '2025-08-31', price: 1750.00 },
        { date: '2025-07-31', price: 1790.00 },
        { date: '2025-06-30', price: 1730.00 },
        { date: '2025-05-31', price: 1770.00 },
        { date: '2025-04-30', price: 1710.00 },
        { date: '2025-03-31', price: 1750.00 },
        { date: '2025-02-28', price: 1690.00 },
        { date: '2025-01-31', price: 1730.00 }
      ],
      '2024': [
        { date: '2024-12-31', price: 1720.00 },
        { date: '2024-11-30', price: 1680.00 },
        { date: '2024-10-31', price: 1720.00 },
        { date: '2024-09-30', price: 1670.00 },
        { date: '2024-08-31', price: 1710.00 },
        { date: '2024-07-31', price: 1660.00 },
        { date: '2024-06-30', price: 1700.00 },
        { date: '2024-05-31', price: 1650.00 },
        { date: '2024-04-30', price: 1690.00 },
        { date: '2024-03-31', price: 1640.00 },
        { date: '2024-02-29', price: 1680.00 },
        { date: '2024-01-31', price: 1630.00 }
      ]
    }
  },
  '000858': {
    name: '五粮液',
    code: '000858',
    price: 168.50,
    change: 2.30,
    changePercent: 1.39,
    pe: 25.8,
    pb: 6.2,
    roe: 24.5,
    dividendRate: 2.0,
    industry: '白酒',
    mainBusiness: '五粮液及其系列酒的生产和销售',
    mainProducts: '五粮液、五粮春、五粮醇、五粮特曲、尖庄等系列白酒',
    description: '宜宾五粮液股份有限公司是中国著名的白酒生产企业，成立于1998年，总部位于四川省宜宾市。公司主要生产和销售五粮液系列白酒，五粮液是中国国家地理标志产品，具有悠久的历史和深厚的文化底蕴。五粮液是中国白酒行业的龙头企业之一，以其卓越的产品品质和品牌价值享誉国内外。',
    financials: {
      balanceSheet: {
        totalAssets: '180,000',
        totalLiabilities: '45,000',
        totalEquity: '135,000',
        cash: '75,000',
        inventory: '65,000'
      },
      incomeStatement: {
        revenue: '95,000',
        netProfit: '38,000',
        operatingExpenses: '25,000',
        costOfSales: '22,000',
        grossProfit: '73,000'
      },
      cashFlow: {
        operatingCashFlow: '45,000',
        investingCashFlow: '-8,000',
        financingCashFlow: '-32,000',
        netCashFlow: '5,000'
      }
    },
    history: {
      '2026': [
        { date: '2026-01-31', price: 168.50 },
        { date: '2026-01-15', price: 166.00 },
        { date: '2026-01-01', price: 164.00 }
      ],
      '2025': [
        { date: '2025-12-31', price: 163.00 },
        { date: '2025-11-30', price: 159.00 },
        { date: '2025-10-31', price: 155.00 },
        { date: '2025-09-30', price: 152.00 },
        { date: '2025-08-31', price: 149.00 },
        { date: '2025-07-31', price: 146.00 },
        { date: '2025-06-30', price: 144.00 },
        { date: '2025-05-31', price: 142.00 },
        { date: '2025-04-30', price: 139.00 },
        { date: '2025-03-31', price: 136.00 },
        { date: '2025-02-28', price: 134.00 },
        { date: '2025-01-31', price: 132.00 }
      ],
      '2024': [
        { date: '2024-12-31', price: 131.00 },
        { date: '2024-11-30', price: 128.00 },
        { date: '2024-10-31', price: 125.00 },
        { date: '2024-09-30', price: 122.00 },
        { date: '2024-08-31', price: 119.00 },
        { date: '2024-07-31', price: 117.00 },
        { date: '2024-06-30', price: 115.00 },
        { date: '2024-05-31', price: 113.00 },
        { date: '2024-04-30', price: 111.00 },
        { date: '2024-03-31', price: 109.00 },
        { date: '2024-02-29', price: 108.00 },
        { date: '2024-01-31', price: 107.00 }
      ]
    }
  },
  '601318': {
    name: '中国平安',
    code: '601318',
    price: 48.25,
    change: -0.35,
    changePercent: -0.72,
    pe: 8.5,
    pb: 1.2,
    roe: 14.8,
    dividendRate: 4.5,
    industry: '保险',
    mainBusiness: '保险、银行、资产管理、科技等综合金融服务',
    mainProducts: '寿险、产险、健康险、养老险、银行产品、信托产品、证券产品等',
    description: '中国平安保险（集团）股份有限公司是中国领先的综合金融服务集团，成立于1988年，总部位于深圳。公司业务涵盖保险、银行、资产管理、科技等多个领域，是中国金融行业的龙头企业之一。中国平安以其创新的金融科技和卓越的客户服务享誉国内外。',
    financials: {
      balanceSheet: {
        totalAssets: '12,500,000',
        totalLiabilities: '11,800,000',
        totalEquity: '700,000',
        cash: '1,200,000',
        investments: '8,500,000'
      },
      incomeStatement: {
        revenue: '850,000',
        netProfit: '120,000',
        operatingExpenses: '620,000',
        insurancePremium: '680,000',
        investmentIncome: '120,000'
      },
      cashFlow: {
        operatingCashFlow: '180,000',
        investingCashFlow: '-120,000',
        financingCashFlow: '-40,000',
        netCashFlow: '20,000'
      }
    },
    history: {
      '2026': [
        { date: '2026-01-31', price: 48.25 },
        { date: '2026-01-15', price: 49.00 },
        { date: '2026-01-01', price: 49.50 }
      ],
      '2025': [
        { date: '2025-12-31', price: 49.80 },
        { date: '2025-11-30', price: 50.20 },
        { date: '2025-10-31', price: 50.50 },
        { date: '2025-09-30', price: 50.80 },
        { date: '2025-08-31', price: 51.00 },
        { date: '2025-07-31', price: 51.20 },
        { date: '2025-06-30', price: 51.50 },
        { date: '2025-05-31', price: 51.80 },
        { date: '2025-04-30', price: 52.00 },
        { date: '2025-03-31', price: 52.20 },
        { date: '2025-02-28', price: 52.50 },
        { date: '2025-01-31', price: 52.80 }
      ],
      '2024': [
        { date: '2024-12-31', price: 53.00 },
        { date: '2024-11-30', price: 53.20 },
        { date: '2024-10-31', price: 53.50 },
        { date: '2024-09-30', price: 53.80 },
        { date: '2024-08-31', price: 54.00 },
        { date: '2024-07-31', price: 54.20 },
        { date: '2024-06-30', price: 54.50 },
        { date: '2024-05-31', price: 54.80 },
        { date: '2024-04-30', price: 55.00 },
        { date: '2024-03-31', price: 55.20 },
        { date: '2024-02-29', price: 55.50 },
        { date: '2024-01-31', price: 55.80 }
      ]
    }
  },
  '600036': {
    name: '招商银行',
    code: '600036',
    price: 35.60,
    change: 0.50,
    changePercent: 1.42,
    pe: 6.8,
    pb: 0.95,
    roe: 15.2,
    dividendRate: 4.8,
    industry: '银行',
    mainBusiness: '吸收公众存款；发放短期、中期和长期贷款；办理国内外结算；办理票据承兑与贴现；发行金融债券；代理发行、代理兑付、承销政府债券；买卖政府债券、金融债券；从事同业拆借；买卖、代理买卖外汇；从事银行卡业务；提供信用证服务及担保；代理收付款项及代理保险业务；提供保管箱服务；结汇、售汇业务；离岸银行业务；资产托管业务；办理黄金业务；财务顾问、资信调查、咨询、见证业务等。',
    mainProducts: '个人存款、个人贷款、信用卡、企业贷款、贸易融资、投资银行、资产管理、金融市场业务',
    description: '招商银行股份有限公司是中国领先的股份制商业银行，成立于1987年，总部位于深圳。招商银行以其创新的金融产品和优质的客户服务著称，是中国零售银行业务的领导者之一。近年来，招商银行积极推进数字化转型，打造智能化银行服务体系，不断提升客户体验和运营效率。',
    financials: {
      balanceSheet: {
        totalAssets: '7,800,000',
        totalLiabilities: '7,200,000',
        totalEquity: '600,000',
        cash: '1,300,000',
        loans: '4,200,000'
      },
      incomeStatement: {
        revenue: '280,000',
        netProfit: '95,000',
        operatingExpenses: '150,000',
        interestIncome: '220,000',
        nonInterestIncome: '60,000'
      },
      cashFlow: {
        operatingCashFlow: '120,000',
        investingCashFlow: '-45,000',
        financingCashFlow: '-60,000',
        netCashFlow: '15,000'
      }
    },
    history: {
      '2026': [
        { date: '2026-01-31', price: 35.60 },
        { date: '2026-01-15', price: 35.00 },
        { date: '2026-01-01', price: 34.80 }
      ],
      '2025': [
        { date: '2025-12-31', price: 34.70 },
        { date: '2025-11-30', price: 34.20 },
        { date: '2025-10-31', price: 33.80 },
        { date: '2025-09-30', price: 33.50 },
        { date: '2025-08-31', price: 33.20 },
        { date: '2025-07-31', price: 33.00 },
        { date: '2025-06-30', price: 32.80 },
        { date: '2025-05-31', price: 32.50 },
        { date: '2025-04-30', price: 32.30 },
        { date: '2025-03-31', price: 32.10 },
        { date: '2025-02-28', price: 31.90 },
        { date: '2025-01-31', price: 31.80 }
      ],
      '2024': [
        { date: '2024-12-31', price: 31.70 },
        { date: '2024-11-30', price: 31.50 },
        { date: '2024-10-31', price: 31.30 },
        { date: '2024-09-30', price: 31.10 },
        { date: '2024-08-31', price: 30.90 },
        { date: '2024-07-31', price: 30.70 },
        { date: '2024-06-30', price: 30.50 },
        { date: '2024-05-31', price: 30.30 },
        { date: '2024-04-30', price: 30.10 },
        { date: '2024-03-31', price: 29.90 },
        { date: '2024-02-29', price: 29.80 },
        { date: '2024-01-31', price: 29.70 }
      ]
    }
  },
  '601012': {
    name: '隆基绿能',
    code: '601012',
    price: 32.50,
    change: 1.20,
    changePercent: 3.85,
    pe: 22.5,
    pb: 3.8,
    roe: 17.5,
    dividendRate: 1.8,
    industry: '新能源',
    mainBusiness: '单晶硅棒、硅片、电池和组件的研发、生产和销售，以及光伏电站的开发、建设及运营等业务',
    mainProducts: '单晶硅棒、单晶硅片、高效单晶电池、高效单晶组件、光伏电站',
    description: '隆基绿能科技股份有限公司是全球领先的太阳能科技公司，成立于2000年，总部位于陕西省西安市。公司专注于太阳能光伏产品的研发、生产和销售，是全球最大的单晶硅光伏产品制造商之一。隆基绿能以其高效的产品性能和领先的技术优势在全球光伏市场占据重要地位，致力于为全球能源转型提供清洁、高效的太阳能解决方案。',
    financials: {
      balanceSheet: {
        totalAssets: '1,200,000',
        totalLiabilities: '750,000',
        totalEquity: '450,000',
        cash: '280,000',
        inventory: '320,000'
      },
      incomeStatement: {
        revenue: '850,000',
        netProfit: '95,000',
        operatingExpenses: '650,000',
        costOfSales: '580,000',
        grossProfit: '270,000'
      },
      cashFlow: {
        operatingCashFlow: '120,000',
        investingCashFlow: '-80,000',
        financingCashFlow: '-30,000',
        netCashFlow: '10,000'
      }
    },
    history: {
      '2026': [
        { date: '2026-01-31', price: 32.50 },
        { date: '2026-01-15', price: 31.50 },
        { date: '2026-01-01', price: 30.50 }
      ],
      '2025': [
        { date: '2025-12-31', price: 30.00 },
        { date: '2025-11-30', price: 29.00 },
        { date: '2025-10-31', price: 28.00 },
        { date: '2025-09-30', price: 27.00 },
        { date: '2025-08-31', price: 26.00 },
        { date: '2025-07-31', price: 25.00 },
        { date: '2025-06-30', price: 24.00 },
        { date: '2025-05-31', price: 23.00 },
        { date: '2025-04-30', price: 22.00 },
        { date: '2025-03-31', price: 21.00 },
        { date: '2025-02-28', price: 20.00 },
        { date: '2025-01-31', price: 19.00 }
      ],
      '2024': [
        { date: '2024-12-31', price: 18.50 },
        { date: '2024-11-30', price: 18.00 },
        { date: '2024-10-31', price: 17.50 },
        { date: '2024-09-30', price: 17.00 },
        { date: '2024-08-31', price: 16.50 },
        { date: '2024-07-31', price: 16.00 },
        { date: '2024-06-30', price: 15.50 },
        { date: '2024-05-31', price: 15.00 },
        { date: '2024-04-30', price: 14.50 },
        { date: '2024-03-31', price: 14.00 },
        { date: '2024-02-29', price: 13.50 },
        { date: '2024-01-31', price: 13.00 }
      ]
    }
  }
};

// 模拟基金数据
const fundData = {
  '110022': {
    name: '易方达消费行业股票',
    code: '110022',
    nav: 3.2560,
    dayGrowth: 0.85,
    weekGrowth: 2.30,
    monthGrowth: 5.60,
    yearGrowth: 28.50,
    fundManager: '萧楠',
    description: '易方达消费行业股票型证券投资基金是易方达基金管理有限公司旗下的一只股票型基金，成立于2010年8月。该基金主要投资于消费行业的优质上市公司股票，包括必需消费品和可选消费品。基金经理萧楠具有丰富的消费行业研究和投资经验，注重挖掘具有长期竞争力和成长潜力的消费龙头企业。',
    history: {
      '2026': [
        { date: '2026-01-31', nav: 3.2560 },
        { date: '2026-01-15', nav: 3.2200 },
        { date: '2026-01-01', nav: 3.1900 }
      ],
      '2025': [
        { date: '2025-12-31', nav: 3.1800 },
        { date: '2025-11-30', nav: 3.1200 },
        { date: '2025-10-31', nav: 3.0800 },
        { date: '2025-09-30', nav: 3.0500 },
        { date: '2025-08-31', nav: 3.0200 },
        { date: '2025-07-31', nav: 3.0000 },
        { date: '2025-06-30', nav: 2.9800 },
        { date: '2025-05-31', nav: 2.9500 },
        { date: '2025-04-30', nav: 2.9200 },
        { date: '2025-03-31', nav: 2.9000 },
        { date: '2025-02-28', nav: 2.8800 },
        { date: '2025-01-31', nav: 2.8500 }
      ],
      '2024': [
        { date: '2024-12-31', nav: 2.8400 },
        { date: '2024-11-30', nav: 2.8000 },
        { date: '2024-10-31', nav: 2.7600 },
        { date: '2024-09-30', nav: 2.7300 },
        { date: '2024-08-31', nav: 2.7000 },
        { date: '2024-07-31', nav: 2.6800 },
        { date: '2024-06-30', nav: 2.6500 },
        { date: '2024-05-31', nav: 2.6300 },
        { date: '2024-04-30', nav: 2.6100 },
        { date: '2024-03-31', nav: 2.5900 },
        { date: '2024-02-29', nav: 2.5800 },
        { date: '2024-01-31', nav: 2.5700 }
      ]
    }
  },
  '000001': {
    name: '华夏成长混合',
    code: '000001',
    nav: 1.2340,
    dayGrowth: 0.24,
    weekGrowth: 1.10,
    monthGrowth: 3.20,
    yearGrowth: 15.80,
    fundManager: '巩怀志',
    description: '华夏成长混合型证券投资基金是华夏基金管理有限公司旗下的一只混合型基金，成立于2001年12月。该基金是华夏基金的旗舰产品之一，采用成长型投资策略，主要投资于具有良好成长性的上市公司股票。基金经理巩怀志拥有多年的投资管理经验，注重基本面研究，擅长挖掘具有核心竞争力和持续成长能力的企业。',
    history: {
      '2026': [
        { date: '2026-01-31', nav: 1.2340 },
        { date: '2026-01-15', nav: 1.2300 },
        { date: '2026-01-01', nav: 1.2280 }
      ],
      '2025': [
        { date: '2025-12-31', nav: 1.2250 },
        { date: '2025-11-30', nav: 1.2180 },
        { date: '2025-10-31', nav: 1.2100 },
        { date: '2025-09-30', nav: 1.2050 },
        { date: '2025-08-31', nav: 1.2000 },
        { date: '2025-07-31', nav: 1.1950 },
        { date: '2025-06-30', nav: 1.1900 },
        { date: '2025-05-31', nav: 1.1850 },
        { date: '2025-04-30', nav: 1.1800 },
        { date: '2025-03-31', nav: 1.1750 },
        { date: '2025-02-28', nav: 1.1700 },
        { date: '2025-01-31', nav: 1.1650 }
      ],
      '2024': [
        { date: '2024-12-31', nav: 1.1600 },
        { date: '2024-11-30', nav: 1.1550 },
        { date: '2024-10-31', nav: 1.1500 },
        { date: '2024-09-30', nav: 1.1450 },
        { date: '2024-08-31', nav: 1.1400 },
        { date: '2024-07-31', nav: 1.1350 },
        { date: '2024-06-30', nav: 1.1300 },
        { date: '2024-05-31', nav: 1.1250 },
        { date: '2024-04-30', nav: 1.1200 },
        { date: '2024-03-31', nav: 1.1150 },
        { date: '2024-02-29', nav: 1.1100 },
        { date: '2024-01-31', nav: 1.1050 }
      ]
    }
  },
  '001475': {
    name: '易方达国防军工混合',
    code: '001475',
    nav: 2.1560,
    dayGrowth: 1.20,
    weekGrowth: 3.50,
    monthGrowth: 8.20,
    yearGrowth: 32.50,
    fundManager: '何崇恺',
    description: '易方达国防军工混合型证券投资基金是易方达基金管理有限公司旗下的一只混合型基金，成立于2015年6月。该基金主要投资于国防军工行业的优质上市公司股票，包括国防装备、军工电子、航空航天等领域。基金经理何崇恺具有丰富的军工行业研究和投资经验，注重挖掘具有核心技术和成长潜力的军工企业。',
    history: {
      '2026': [
        { date: '2026-01-31', nav: 2.1560 },
        { date: '2026-01-15', nav: 2.1300 },
        { date: '2026-01-01', nav: 2.1100 }
      ],
      '2025': [
        { date: '2025-12-31', nav: 2.1000 },
        { date: '2025-11-30', nav: 2.0800 },
        { date: '2025-10-31', nav: 2.0500 },
        { date: '2025-09-30', nav: 2.0200 },
        { date: '2025-08-31', nav: 1.9900 },
        { date: '2025-07-31', nav: 1.9600 },
        { date: '2025-06-30', nav: 1.9300 },
        { date: '2025-05-31', nav: 1.9000 },
        { date: '2025-04-30', nav: 1.8700 },
        { date: '2025-03-31', nav: 1.8400 },
        { date: '2025-02-28', nav: 1.8100 },
        { date: '2025-01-31', nav: 1.7800 }
      ],
      '2024': [
        { date: '2024-12-31', nav: 1.7600 },
        { date: '2024-11-30', nav: 1.7400 },
        { date: '2024-10-31', nav: 1.7200 },
        { date: '2024-09-30', nav: 1.7000 },
        { date: '2024-08-31', nav: 1.6800 },
        { date: '2024-07-31', nav: 1.6600 },
        { date: '2024-06-30', nav: 1.6400 },
        { date: '2024-05-31', nav: 1.6200 },
        { date: '2024-04-30', nav: 1.6000 },
        { date: '2024-03-31', nav: 1.5800 },
        { date: '2024-02-29', nav: 1.5600 },
        { date: '2024-01-31', nav: 1.5400 }
      ]
    }
  },
  '161005': {
    name: '富国天惠成长混合A',
    code: '161005',
    nav: 4.8560,
    dayGrowth: 0.50,
    weekGrowth: 1.80,
    monthGrowth: 4.50,
    yearGrowth: 25.80,
    fundManager: '朱少醒',
    description: '富国天惠成长混合型证券投资基金是富国基金管理有限公司旗下的一只混合型基金，成立于2005年11月。该基金采用成长型投资策略，主要投资于具有良好成长性的上市公司股票。基金经理朱少醒拥有超过20年的投资管理经验，是中国基金行业的知名基金经理，以其长期稳健的投资业绩著称。',
    history: {
      '2026': [
        { date: '2026-01-31', nav: 4.8560 },
        { date: '2026-01-15', nav: 4.8400 },
        { date: '2026-01-01', nav: 4.8300 }
      ],
      '2025': [
        { date: '2025-12-31', nav: 4.8200 },
        { date: '2025-11-30', nav: 4.7900 },
        { date: '2025-10-31', nav: 4.7600 },
        { date: '2025-09-30', nav: 4.7300 },
        { date: '2025-08-31', nav: 4.7000 },
        { date: '2025-07-31', nav: 4.6700 },
        { date: '2025-06-30', nav: 4.6400 },
        { date: '2025-05-31', nav: 4.6100 },
        { date: '2025-04-30', nav: 4.5800 },
        { date: '2025-03-31', nav: 4.5500 },
        { date: '2025-02-28', nav: 4.5200 },
        { date: '2025-01-31', nav: 4.4900 }
      ],
      '2024': [
        { date: '2024-12-31', nav: 4.4700 },
        { date: '2024-11-30', nav: 4.4400 },
        { date: '2024-10-31', nav: 4.4100 },
        { date: '2024-09-30', nav: 4.3800 },
        { date: '2024-08-31', nav: 4.3500 },
        { date: '2024-07-31', nav: 4.3200 },
        { date: '2024-06-30', nav: 4.2900 },
        { date: '2024-05-31', nav: 4.2600 },
        { date: '2024-04-30', nav: 4.2300 },
        { date: '2024-03-31', nav: 4.2000 },
        { date: '2024-02-29', nav: 4.1800 },
        { date: '2024-01-31', nav: 4.1600 }
      ]
    }
  },
  '000311': {
    name: '景顺长城沪深300增强',
    code: '000311',
    nav: 2.6580,
    dayGrowth: 0.35,
    weekGrowth: 1.20,
    monthGrowth: 3.80,
    yearGrowth: 18.50,
    fundManager: '黎海威',
    description: '景顺长城沪深300增强型证券投资基金是景顺长城基金管理有限公司旗下的一只指数增强型基金，成立于2013年8月。该基金以沪深300指数为基准，通过量化模型进行增强，旨在获取超越基准的投资收益。基金经理黎海威具有丰富的量化投资经验，注重风险控制和收益稳定性。',
    history: {
      '2026': [
        { date: '2026-01-31', nav: 2.6580 },
        { date: '2026-01-15', nav: 2.6500 },
        { date: '2026-01-01', nav: 2.6450 }
      ],
      '2025': [
        { date: '2025-12-31', nav: 2.6400 },
        { date: '2025-11-30', nav: 2.6300 },
        { date: '2025-10-31', nav: 2.6200 },
        { date: '2025-09-30', nav: 2.6100 },
        { date: '2025-08-31', nav: 2.6000 },
        { date: '2025-07-31', nav: 2.5900 },
        { date: '2025-06-30', nav: 2.5800 },
        { date: '2025-05-31', nav: 2.5700 },
        { date: '2025-04-30', nav: 2.5600 },
        { date: '2025-03-31', nav: 2.5500 },
        { date: '2025-02-28', nav: 2.5400 },
        { date: '2025-01-31', nav: 2.5300 }
      ],
      '2024': [
        { date: '2024-12-31', nav: 2.5200 },
        { date: '2024-11-30', nav: 2.5100 },
        { date: '2024-10-31', nav: 2.5000 },
        { date: '2024-09-30', nav: 2.4900 },
        { date: '2024-08-31', nav: 2.4800 },
        { date: '2024-07-31', nav: 2.4700 },
        { date: '2024-06-30', nav: 2.4600 },
        { date: '2024-05-31', nav: 2.4500 },
        { date: '2024-04-30', nav: 2.4400 },
        { date: '2024-03-31', nav: 2.4300 },
        { date: '2024-02-29', nav: 2.4200 },
        { date: '2024-01-31', nav: 2.4100 }
      ]
    }
  }
};

// 获取股票数据
app.get('/api/stock/:code', (req, res) => {
  let code = req.params.code;
  let stock = stockData[code];
  
  // 如果通过代码找不到，尝试通过名称搜索
  if (!stock) {
    for (const key in stockData) {
      if (stockData[key].name.includes(code)) {
        stock = stockData[key];
        break;
      }
    }
  }
  
  if (stock) {
    // 计算技术指标
    const technicalIndicators = {};
    
    // 处理历史数据，将按年份组织的数据转换为按时间顺序排列的数组
    const allHistoricalData = [];
    Object.keys(stock.history).forEach(year => {
      // 确保每个年份内的日期也是按顺序排列的
      const sortedYearData = [...stock.history[year]].sort((a, b) => new Date(a.date) - new Date(b.date));
      sortedYearData.forEach(item => {
        allHistoricalData.push(item);
      });
    });
    
    // 按日期排序（从早到晚）
    allHistoricalData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 计算MACD和KDJ指标
    if (allHistoricalData.length > 0) {
      technicalIndicators.macd = calculateMACD(allHistoricalData);
      technicalIndicators.kdj = calculateKDJ(allHistoricalData);
      technicalIndicators.ma = {
        ma5: calculateMA(allHistoricalData, 5),
        ma10: calculateMA(allHistoricalData, 10),
        ma20: calculateMA(allHistoricalData, 20)
      };
    }
    
    // 将技术指标添加到股票数据中
    const stockWithIndicators = {
      ...stock,
      technicalIndicators
    };
    
    res.json({
      success: true,
      data: stockWithIndicators
    });
  } else {
    res.status(404).json({
      success: false,
      error: '股票代码或名称不存在',
      code: 404
    });
  }
});

// 获取基金数据
app.get('/api/fund/:code', (req, res) => {
  let code = req.params.code;
  let fund = fundData[code];
  
  // 如果通过代码找不到，尝试通过名称搜索
  if (!fund) {
    for (const key in fundData) {
      if (fundData[key].name.includes(code)) {
        fund = fundData[key];
        break;
      }
    }
  }
  
  if (fund) {
    res.json({
      success: true,
      data: fund
    });
  } else {
    res.status(404).json({
      success: false,
      error: '基金代码或名称不存在',
      code: 404
    });
  }
});

// 生成投资建议
app.post('/api/advice', (req, res) => {
  const { type, code } = req.body;
  let data;
  let advice = '';
  
  if (type === 'stock') {
    // 首先尝试通过代码查找
    data = stockData[code];
    // 如果通过代码找不到，尝试通过名称搜索
    if (!data) {
      for (const key in stockData) {
        if (stockData[key].name.includes(code)) {
          data = stockData[key];
          break;
        }
      }
    }
    
    if (data) {
      const earningYield = data.pe > 0 ? (100 / data.pe).toFixed(2) : 'N/A';
      
      advice = `${data.name} (${data.code}) 的投资分析：\n`;
      advice += `当前PE为${data.pe}，`;
      advice += `PB为${data.pb}，`;
      advice += `股息率为${data.dividendRate}%，`;
      advice += `盈利收益率为${earningYield}%。\n\n`;
      
      // 添加指标解释
      advice += `指标解释：\n`;
      advice += `- 市盈率（PE）：股票价格与每股盈利的比率。PE越低，估值越低，投资价值越高。一般认为PE<15为低估，15-25为合理，>25为高估。\n`;
      advice += `- 市净率（PB）：股票价格与每股净资产的比率。PB越低，估值越低，投资价值越高。一般认为PB<1.5为低估，1.5-3为合理，>3为高估。\n`;
      advice += `- 股息率：年度股息与股票价格的比率。股息率越高，投资回报越高。一般认为股息率>3%为良好。\n`;
      advice += `- 盈利收益率：盈利与股票价格的比率，即1/PE。盈利收益率越高，投资价值越高。一般认为盈利收益率>6%为良好。\n\n`;
      
      // 生成投资建议
      let suggestions = [];
      
      if (data.pe < 15) {
        suggestions.push('PE较低，估值具有吸引力');
      } else if (data.pe > 25) {
        suggestions.push('PE较高，估值偏贵');
      } else {
        suggestions.push('PE合理，估值适中');
      }
      
      if (data.pb < 1.5) {
        suggestions.push('PB较低，资产价值有保障');
      } else if (data.pb > 3) {
        suggestions.push('PB较高，资产价值溢价明显');
      } else {
        suggestions.push('PB合理，资产价值适中');
      }
      
      if (data.dividendRate > 3) {
        suggestions.push('股息率较高，分红回报良好');
      } else {
        suggestions.push('股息率适中，分红回报一般');
      }
      
      const earningYieldNum = parseFloat(earningYield);
      if (!isNaN(earningYieldNum) && earningYieldNum > 6) {
        suggestions.push('盈利收益率较高，投资回报潜力大');
      } else {
        suggestions.push('盈利收益率适中，投资回报潜力一般');
      }
      
      advice += `投资建议：\n`;
      suggestions.forEach(suggestion => {
        advice += `- ${suggestion}\n`;
      });
      
      // 综合建议
      if (data.pe < 15 && data.pb < 1.5 && data.dividendRate > 3 && !isNaN(earningYieldNum) && earningYieldNum > 6) {
        advice += `\n综合评价：该股票估值较低，分红回报良好，具有较高的投资价值，建议重点关注。`;
      } else if ((data.pe < 20 && data.pb < 2.5) || (data.dividendRate > 4 || (!isNaN(earningYieldNum) && earningYieldNum > 8))) {
        advice += `\n综合评价：该股票估值合理，具有一定的投资价值，可以考虑适量配置。`;
      } else {
        advice += `\n综合评价：该股票估值较高，建议谨慎投资，关注基本面变化。`;
      }
    }
  } else if (type === 'fund') {
    // 首先尝试通过代码查找
    data = fundData[code];
    // 如果通过代码找不到，尝试通过名称搜索
    if (!data) {
      for (const key in fundData) {
        if (fundData[key].name.includes(code)) {
          data = fundData[key];
          break;
        }
      }
    }
    
    if (data) {
      if (data.yearGrowth > 20) {
        advice = `${data.name} (${data.code}) 近一年收益率为${data.yearGrowth}%，表现优秀，建议关注。`;
      } else {
        advice = `${data.name} (${data.code}) 近一年收益率为${data.yearGrowth}%，表现稳健，可以考虑配置。`;
      }
    }
  }
  
  if (data) {
    res.json({
      success: true,
      data: { advice }
    });
  } else {
    res.status(404).json({
      success: false,
      error: '数据不存在',
      code: 404
    });
  }
});

// 生成金属价格历史数据的辅助函数
function generateMetalHistory(basePrice, startYear, endYear, trendFactor = 0.05) {
  const history = {};
  
  for (let year = startYear; year <= endYear; year++) {
    history[year] = {};
    let yearPrice = basePrice * Math.pow(1 + trendFactor, year - startYear);
    
    for (let month = 1; month <= 12; month++) {
      const monthKey = month.toString().padStart(2, '0');
      history[year][monthKey] = [];
      
      // 生成该月的日期数据
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = day.toString().padStart(2, '0');
        const date = `${year}-${monthKey}-${dayKey}`;
        
        // 添加一些随机波动
        const randomFactor = 1 + (Math.random() * 0.02 - 0.01);
        const dayPrice = yearPrice * randomFactor;
        
        history[year][monthKey].push({
          date,
          price: parseFloat(dayPrice.toFixed(2))
        });
      }
    }
  }
  
  return history;
}

// 模拟金属价格数据
const metalData = {
  'gold': {
    name: '黄金',
    code: 'gold',
    price: 425.60,
    change: 2.30,
    changePercent: 0.54,
    unit: '元/克',
    description: '黄金是一种重要的贵金属，具有保值、避险和投资功能。黄金价格受全球经济形势、地缘政治风险、通胀预期等多种因素影响。',
    history: generateMetalHistory(350, 2022, 2026, 0.06)
  },
  'silver': {
    name: '白银',
    code: 'silver',
    price: 5.82,
    change: 0.08,
    changePercent: 1.39,
    unit: '元/克',
    description: '白银是一种重要的贵金属，具有工业用途和投资价值。白银价格受全球经济形势、工业需求、通胀预期等多种因素影响。',
    history: generateMetalHistory(4.5, 2022, 2026, 0.07)
  },
  'copper': {
    name: '铜',
    code: 'copper',
    price: 68500.00,
    change: 850.00,
    changePercent: 1.26,
    unit: '元/吨',
    description: '铜是一种重要的工业金属，广泛应用于电力、建筑、交通等领域。铜价格受全球经济形势、工业需求、供应链状况等多种因素影响。',
    history: generateMetalHistory(55000, 2022, 2026, 0.08)
  },
  'platinum': {
    name: '铂',
    code: 'platinum',
    price: 228.50,
    change: 3.20,
    changePercent: 1.42,
    unit: '元/克',
    description: '铂是一种稀有的贵金属，具有优良的催化性能和化学稳定性，广泛应用于汽车催化转化器、珠宝首饰、化工催化等领域。铂价格受汽车工业需求、投资需求、供需关系等多种因素影响。',
    history: generateMetalHistory(180, 2022, 2026, 0.09)
  },
  'lead': {
    name: '铅',
    code: 'lead',
    price: 15800.00,
    change: 120.00,
    changePercent: 0.76,
    unit: '元/吨',
    description: '铅是一种重要的有色金属，具有良好的耐腐蚀性和可塑性，广泛应用于蓄电池、电缆护套、防辐射材料等领域。铅价格受汽车工业需求、电池需求、环保政策等多种因素影响。',
    history: generateMetalHistory(14000, 2022, 2026, 0.05)
  }
};

// 获取金属价格数据
app.get('/api/metal/:code', (req, res) => {
  const code = req.params.code;
  if (metalData[code]) {
    res.json({
      success: true,
      data: metalData[code]
    });
  } else {
    res.status(404).json({
      success: false,
      error: '金属代码不存在',
      code: 404
    });
  }
});

// 模拟投资组合数据
let portfolioData = {
  'default': {
    name: '默认投资组合',
    stocks: [
      { code: '000001', name: '平安银行', quantity: 100, purchasePrice: 14.50 },
      { code: '600519', name: '贵州茅台', quantity: 10, purchasePrice: 1700.00 }
    ],
    funds: [
      { code: '110022', name: '易方达消费行业股票', quantity: 500, purchasePrice: 3.10 }
    ],
    metals: []
  }
};

// 获取投资组合数据
app.get('/api/portfolio/:name', (req, res) => {
  const name = req.params.name || 'default';
  if (portfolioData[name]) {
    res.json({
      success: true,
      data: portfolioData[name]
    });
  } else {
    res.status(404).json({
      success: false,
      error: '投资组合不存在',
      code: 404
    });
  }
});

// 获取所有投资组合
app.get('/api/portfolios', (req, res) => {
  res.json({
    success: true,
    data: Object.keys(portfolioData).map(name => ({
      name,
      ...portfolioData[name]
    }))
  });
});

// 创建或更新投资组合
app.post('/api/portfolio', (req, res) => {
  const { name, stocks, funds, metals } = req.body;
  if (!name) {
    return res.status(400).json({
      success: false,
      error: '投资组合名称不能为空',
      code: 400
    });
  }
  
  portfolioData[name] = {
    name,
    stocks: stocks || [],
    funds: funds || [],
    metals: metals || []
  };
  
  res.json({
    success: true,
    data: portfolioData[name]
  });
});

// 删除投资组合
app.delete('/api/portfolio/:name', (req, res) => {
  const name = req.params.name;
  if (name === 'default') {
    return res.status(400).json({
      success: false,
      error: '默认投资组合不能删除',
      code: 400
    });
  }
  
  if (portfolioData[name]) {
    delete portfolioData[name];
    res.json({
      success: true,
      message: '投资组合删除成功'
    });
  } else {
    res.status(404).json({
      success: false,
      error: '投资组合不存在',
      code: 404
    });
  }
});

// 导出股票数据为PDF
app.get('/api/export/stock/:code/pdf', (req, res) => {
  const code = req.params.code;
  if (!stockData[code]) {
    return res.status(404).json({
      success: false,
      error: '股票代码不存在',
      code: 404
    });
  }
  
  const stock = stockData[code];
  
  // 创建PDF文档
  const doc = new PDFDocument();
  const fileName = `${stock.code}_${stock.name}_${new Date().getTime()}.pdf`;
  const filePath = path.join(tempDir, fileName);
  const writeStream = fs.createWriteStream(filePath);
  
  // 添加错误处理
  writeStream.on('error', (err) => {
    console.error('文件写入失败:', err);
    fs.unlinkSync(filePath);
    res.status(500).json({
      success: false,
      error: '文件生成失败',
      code: 500
    });
  });
  
  doc.pipe(writeStream);
  
  // 添加标题
  doc.fontSize(20).text(`${stock.code} Analysis Report`, { align: 'center' });
  doc.moveDown();
  
  // 添加基本信息
  doc.fontSize(16).text('Basic Information');
  doc.fontSize(12);
  doc.text(`Current Price: ${stock.price} CNY`);
  doc.text(`Change Percent: ${stock.changePercent}%`);
  doc.text(`PE Ratio: ${stock.pe}`);
  doc.text(`PB Ratio: ${stock.pb}`);
  doc.text(`ROE: ${stock.roe}%`);
  doc.text(`Dividend Rate: ${stock.dividendRate}%`);
  doc.text(`Industry: ${stock.industry}`);
  doc.moveDown();
  
  // 添加主营业务
  doc.fontSize(16).text('Main Business');
  doc.fontSize(12).text(stock.mainBusiness);
  doc.moveDown();
  
  // 添加公司简介
  doc.fontSize(16).text('Company Description');
  doc.fontSize(12).text(stock.description);
  doc.moveDown();
  
  // 添加财务数据
  doc.fontSize(16).text('Financial Data');
  doc.fontSize(12);
  
  if (stock.financials) {
    doc.text('Balance Sheet:');
    if (stock.financials.balanceSheet) {
      const balanceSheet = stock.financials.balanceSheet;
      doc.text(`  Total Assets: ${balanceSheet.totalAssets} CNY`);
      doc.text(`  Total Liabilities: ${balanceSheet.totalLiabilities} CNY`);
      doc.text(`  Total Equity: ${balanceSheet.totalEquity} CNY`);
    }
    
    doc.text('Income Statement:');
    if (stock.financials.incomeStatement) {
      const incomeStatement = stock.financials.incomeStatement;
      doc.text(`  Revenue: ${incomeStatement.revenue} CNY`);
      doc.text(`  Net Profit: ${incomeStatement.netProfit} CNY`);
    }
    
    doc.text('Cash Flow:');
    if (stock.financials.cashFlow) {
      const cashFlow = stock.financials.cashFlow;
      doc.text(`  Operating Cash Flow: ${cashFlow.operatingCashFlow} CNY`);
      doc.text(`  Investing Cash Flow: ${cashFlow.investingCashFlow} CNY`);
      doc.text(`  Financing Cash Flow: ${cashFlow.financingCashFlow} CNY`);
    }
  }
  
  doc.moveDown();
  
  // 添加历史价格
  doc.fontSize(16).text('Historical Prices');
  doc.fontSize(12);
  
  Object.keys(stock.history).forEach(year => {
    doc.text(`${year}:`);
    stock.history[year].forEach(item => {
      doc.text(`  ${item.date}: ${item.price} CNY`);
    });
  });
  
  // 结束文档
  doc.end();
  
  // 等待文件写入完成后发送
  writeStream.on('finish', () => {
    res.download(filePath, fileName, (err) => {
      // 下载完成后删除临时文件
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.error('删除临时文件失败:', unlinkErr);
      }
      if (err) {
        console.error('下载失败:', err);
        res.status(500).json({
          success: false,
          error: '下载失败',
          code: 500
        });
      }
    });
  });
});

// 导出股票数据为Excel
app.get('/api/export/stock/:code/excel', (req, res) => {
  const code = req.params.code;
  if (!stockData[code]) {
    return res.status(404).json({
      success: false,
      error: '股票代码不存在',
      code: 404
    });
  }
  
  const stock = stockData[code];
  
  // 创建工作簿
  const wb = XLSX.utils.book_new();
  
  // 创建基本信息工作表
  const basicInfoData = [
    ['项目', '值'],
    ['股票名称', stock.name],
    ['股票代码', stock.code],
    ['当前价格', `${stock.price}元`],
    ['涨跌幅', `${stock.changePercent}%`],
    ['市盈率(PE)', stock.pe],
    ['市净率(PB)', stock.pb],
    ['净资产收益率(ROE)', `${stock.roe}%`],
    ['股息率', `${stock.dividendRate}%`],
    ['所属行业', stock.industry],
    ['主营业务', stock.mainBusiness],
    ['公司简介', stock.description]
  ];
  const basicInfoWs = XLSX.utils.aoa_to_sheet(basicInfoData);
  XLSX.utils.book_append_sheet(wb, basicInfoWs, '基本信息');
  
  // 创建财务数据工作表
  if (stock.financials) {
    const financialData = [['项目', '值']];
    
    if (stock.financials.balanceSheet) {
      const balanceSheet = stock.financials.balanceSheet;
      financialData.push(['总资产', `${balanceSheet.totalAssets}万元`]);
      financialData.push(['总负债', `${balanceSheet.totalLiabilities}万元`]);
      financialData.push(['所有者权益', `${balanceSheet.totalEquity}万元`]);
      if (balanceSheet.cash) financialData.push(['货币资金', `${balanceSheet.cash}万元`]);
      if (balanceSheet.loans) financialData.push(['贷款总额', `${balanceSheet.loans}万元`]);
      if (balanceSheet.inventory) financialData.push(['存货', `${balanceSheet.inventory}万元`]);
    }
    
    if (stock.financials.incomeStatement) {
      const incomeStatement = stock.financials.incomeStatement;
      financialData.push(['营业收入', `${incomeStatement.revenue}万元`]);
      financialData.push(['净利润', `${incomeStatement.netProfit}万元`]);
      if (incomeStatement.grossProfit) financialData.push(['毛利润', `${incomeStatement.grossProfit}万元`]);
      if (incomeStatement.interestIncome) financialData.push(['利息收入', `${incomeStatement.interestIncome}万元`]);
    }
    
    if (stock.financials.cashFlow) {
      const cashFlow = stock.financials.cashFlow;
      financialData.push(['经营活动现金流', `${cashFlow.operatingCashFlow}万元`]);
      financialData.push(['投资活动现金流', `${cashFlow.investingCashFlow}万元`]);
      financialData.push(['筹资活动现金流', `${cashFlow.financingCashFlow}万元`]);
      financialData.push(['净现金流', `${cashFlow.netCashFlow}万元`]);
    }
    
    const financialWs = XLSX.utils.aoa_to_sheet(financialData);
    XLSX.utils.book_append_sheet(wb, financialWs, '财务数据');
  }
  
  // 创建历史价格工作表
  const historicalData = [['日期', '价格']];
  Object.keys(stock.history).forEach(year => {
    stock.history[year].forEach(item => {
      historicalData.push([item.date, item.price]);
    });
  });
  const historicalWs = XLSX.utils.aoa_to_sheet(historicalData);
  XLSX.utils.book_append_sheet(wb, historicalWs, '历史价格');
  
  // 生成Excel文件
  const fileName = `${stock.code}_${stock.name}_${new Date().getTime()}.xlsx`;
  const filePath = path.join(tempDir, fileName);
  XLSX.writeFile(wb, filePath);
  
  // 发送文件
  res.download(filePath, fileName, (err) => {
    // 下载完成后删除临时文件
    fs.unlinkSync(filePath);
    if (err) {
      console.error('下载失败:', err);
      res.status(500).json({
        success: false,
        error: '下载失败',
        code: 500
      });
    }
  });
});

// 导出投资组合数据为Excel
app.get('/api/export/portfolio/:name/excel', (req, res) => {
  const name = req.params.name || 'default';
  if (!portfolioData[name]) {
    return res.status(404).json({
      success: false,
      error: '投资组合不存在',
      code: 404
    });
  }
  
  const portfolio = portfolioData[name];
  
  // 创建工作簿
  const wb = XLSX.utils.book_new();
  
  // 创建股票持仓工作表
  if (portfolio.stocks && portfolio.stocks.length > 0) {
    const stockData = [['代码', '名称', '数量', '买入价', '持仓市值']];
    portfolio.stocks.forEach(stock => {
      const marketValue = (stock.quantity * stock.purchasePrice).toFixed(2);
      stockData.push([stock.code, stock.name, stock.quantity, stock.purchasePrice, marketValue]);
    });
    const stockWs = XLSX.utils.aoa_to_sheet(stockData);
    XLSX.utils.book_append_sheet(wb, stockWs, '股票持仓');
  }
  
  // 创建基金持仓工作表
  if (portfolio.funds && portfolio.funds.length > 0) {
    const fundData = [['代码', '名称', '数量', '买入价', '持仓市值']];
    portfolio.funds.forEach(fund => {
      const marketValue = (fund.quantity * fund.purchasePrice).toFixed(2);
      fundData.push([fund.code, fund.name, fund.quantity, fund.purchasePrice, marketValue]);
    });
    const fundWs = XLSX.utils.aoa_to_sheet(fundData);
    XLSX.utils.book_append_sheet(wb, fundWs, '基金持仓');
  }
  
  // 创建金属持仓工作表
  if (portfolio.metals && portfolio.metals.length > 0) {
    const metalData = [['代码', '名称', '数量', '买入价', '持仓市值']];
    portfolio.metals.forEach(metal => {
      const marketValue = (metal.quantity * metal.purchasePrice).toFixed(2);
      metalData.push([metal.code, metal.name, metal.quantity, metal.purchasePrice, marketValue]);
    });
    const metalWs = XLSX.utils.aoa_to_sheet(metalData);
    XLSX.utils.book_append_sheet(wb, metalWs, '金属持仓');
  }
  
  // 生成Excel文件
  const fileName = `${encodeURIComponent(portfolio.name)}_${new Date().getTime()}.xlsx`;
  const filePath = path.join(tempDir, fileName);
  XLSX.writeFile(wb, filePath);
  
  // 发送文件
  res.download(filePath, fileName, (err) => {
    // 下载完成后删除临时文件
    fs.unlinkSync(filePath);
    if (err) {
      console.error('下载失败:', err);
      res.status(500).json({
        success: false,
        error: '下载失败',
        code: 500
      });
    }
  });
});

// 投资推荐功能
app.post('/api/investment/recommendation', (req, res) => {
  const { type, code } = req.body;
  let data;
  let recommendation = '';
  
  if (type === 'stock') {
    // 首先尝试通过代码查找
    data = stockData[code];
    // 如果通过代码找不到，尝试通过名称搜索
    if (!data) {
      for (const key in stockData) {
        if (stockData[key].name.includes(code)) {
          data = stockData[key];
          break;
        }
      }
    }
    
    if (data) {
      // 股票投资推荐
      recommendation = generateStockRecommendation(data);
    }
  } else if (type === 'fund') {
    // 首先尝试通过代码查找
    data = fundData[code];
    // 如果通过代码找不到，尝试通过名称搜索
    if (!data) {
      for (const key in fundData) {
        if (fundData[key].name.includes(code)) {
          data = fundData[key];
          break;
        }
      }
    }
    
    if (data) {
      // 基金投资推荐
      recommendation = generateFundRecommendation(data);
    }
  }
  
  if (data) {
    res.json({
      success: true,
      data: {
        recommendation
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: `${type === 'stock' ? '股票' : '基金'}代码或名称不存在`,
      code: 404
    });
  }
});

// 生成股票投资推荐
function generateStockRecommendation(stock) {
  let recommendation = `基于 ${stock.name} (${stock.code}) 的投资推荐\n\n`;
  
  // 基本分析
  recommendation += `1. 基本分析\n`;
  recommendation += `   - 当前价格: ${stock.price} 元\n`;
  recommendation += `   - 涨跌幅: ${stock.changePercent}%\n`;
  recommendation += `   - 市盈率(PE): ${stock.pe}\n`;
  recommendation += `   - 市净率(PB): ${stock.pb}\n`;
  recommendation += `   - 净资产收益率(ROE): ${stock.roe}%\n`;
  recommendation += `   - 股息率: ${stock.dividendRate}%\n`;
  recommendation += `   - 所属行业: ${stock.industry}\n\n`;
  
  // 投资建议
  recommendation += `2. 投资建议\n`;
  
  // 基于估值的建议
  let valuationAdvice = '';
  if (stock.pe < 15 && stock.pb < 1.5) {
    valuationAdvice = '估值较低，具有投资吸引力';
  } else if (stock.pe < 25 && stock.pb < 3) {
    valuationAdvice = '估值合理，可以考虑配置';
  } else {
    valuationAdvice = '估值较高，建议谨慎投资';
  }
  recommendation += `   - 估值建议: ${valuationAdvice}\n`;
  
  // 基于行业的建议
  const industryAdvice = getIndustryAdvice(stock.industry);
  recommendation += `   - 行业建议: ${industryAdvice}\n\n`;
  
  // 投资组合建议
  recommendation += `3. 投资组合建议\n`;
  recommendation += `   - 建议配置比例: ${getSuggestedAllocation(stock.industry)}\n`;
  recommendation += `   - 风险等级: ${getRiskLevel(stock)}\n`;
  recommendation += `   - 适合投资者: ${getSuitableInvestor(stock)}\n\n`;
  
  // 组合基金推荐
  recommendation += `4. 组合基金推荐\n`;
  recommendation += `   - 目的: 平衡投资风险，优化资产配置\n`;
  recommendation += generatePortfolioRecommendation('stock', stock.industry);
  recommendation += `\n`;
  
  // 投资策略
  recommendation += `5. 投资策略\n`;
  recommendation += `   - 短期策略: ${getShortTermStrategy(stock)}\n`;
  recommendation += `   - 中长期策略: ${getLongTermStrategy(stock)}\n\n`;
  
  // 风险提示
  recommendation += `6. 风险提示\n`;
  recommendation += `   - 市场风险: 股市波动可能导致投资损失\n`;
  recommendation += `   - 行业风险: ${stock.industry}行业可能面临的特定风险\n`;
  recommendation += `   - 公司风险: 公司基本面变化可能影响股价\n`;
  recommendation += `   - 政策风险: 宏观经济政策变化可能影响市场\n\n`;
  
  // 结论
  recommendation += `7. 结论\n`;
  recommendation += `   ${getConclusion(stock)}\n`;
  
  return recommendation;
}

// 生成基金投资推荐
function generateFundRecommendation(fund) {
  let recommendation = `基于 ${fund.name} (${fund.code}) 的投资推荐\n\n`;
  
  // 基本分析
  recommendation += `1. 基本分析\n`;
  recommendation += `   - 当前净值: ${fund.nav} 元\n`;
  recommendation += `   - 日涨幅: ${fund.dayGrowth}%\n`;
  recommendation += `   - 周涨幅: ${fund.weekGrowth}%\n`;
  recommendation += `   - 月涨幅: ${fund.monthGrowth}%\n`;
  recommendation += `   - 年涨幅: ${fund.yearGrowth}%\n`;
  recommendation += `   - 基金经理: ${fund.fundManager}\n\n`;
  
  // 投资建议
  recommendation += `2. 投资建议\n`;
  
  // 基于业绩的建议
  let performanceAdvice = '';
  if (fund.yearGrowth > 20) {
    performanceAdvice = '业绩优秀，建议重点关注';
  } else if (fund.yearGrowth > 10) {
    performanceAdvice = '业绩良好，可以考虑配置';
  } else {
    performanceAdvice = '业绩一般，建议谨慎考虑';
  }
  recommendation += `   - 业绩建议: ${performanceAdvice}\n\n`;
  
  // 基金组合建议
  recommendation += `3. 基金组合建议\n`;
  recommendation += `   - 核心-卫星配置策略:\n`;
  recommendation += `     * 核心配置: 宽基指数基金 (60-70%)\n`;
  recommendation += `     * 卫星配置: 行业主题基金 (20-30%)\n`;
  recommendation += `     * 防御配置: 债券基金 (10-20%)\n\n`;
  
  // 组合基金推荐
  recommendation += `4. 组合基金推荐\n`;
  recommendation += `   - 目的: 平衡投资风险，优化资产配置\n`;
  recommendation += generatePortfolioRecommendation('fund', fund.name);
  recommendation += `\n`;
  
  // 投资策略
  recommendation += `5. 投资策略\n`;
  recommendation += `   - 定投策略: 建议采用定期定额投资方式\n`;
  recommendation += `   - 止盈止损: 设置合理的止盈止损点位\n`;
  recommendation += `   - 仓位管理: 根据市场情况调整仓位\n\n`;
  
  // 风险提示
  recommendation += `6. 风险提示\n`;
  recommendation += `   - 市场风险: 基金净值可能因市场波动而下跌\n`;
  recommendation += `   - 流动性风险: 部分基金可能面临赎回限制\n`;
  recommendation += `   - 管理风险: 基金经理变更可能影响业绩\n`;
  recommendation += `   - 政策风险: 宏观经济政策变化可能影响基金表现\n\n`;
  
  // 结论
  recommendation += `7. 结论\n`;
  recommendation += `   ${getFundConclusion(fund)}\n`;
  
  return recommendation;
}

// 辅助函数：获取行业建议
function getIndustryAdvice(industry) {
  const industryAdvices = {
    '金融': '金融行业估值处于历史低位，具有长期投资价值',
    '消费': '消费行业具有稳定性，适合长期配置',
    '科技': '科技行业成长性强，但波动较大',
    '医药': '医药行业防御性强，适合作为组合的稳定部分',
    '能源': '能源行业受宏观经济影响较大，建议谨慎配置',
    '房地产': '房地产行业面临调控压力，建议低配',
    '制造业': '制造业受益于经济复苏，具有投资机会',
    '公用事业': '公用事业行业稳定性高，适合保守投资者'
  };
  
  return industryAdvices[industry] || '行业发展前景良好，可以考虑配置';
}

// 辅助函数：获取建议配置比例
function getSuggestedAllocation(industry) {
  const allocations = {
    '金融': '5-15%',
    '消费': '10-20%',
    '科技': '8-15%',
    '医药': '8-15%',
    '能源': '3-8%',
    '房地产': '3-8%',
    '制造业': '10-20%',
    '公用事业': '5-10%'
  };
  
  return allocations[industry] || '5-15%';
}

// 辅助函数：获取风险等级
function getRiskLevel(stock) {
  if (stock.pe > 30 || stock.pb > 4) {
    return '高风险';
  } else if (stock.pe > 20 || stock.pb > 2.5) {
    return '中风险';
  } else {
    return '低风险';
  }
}

// 辅助函数：获取适合的投资者
function getSuitableInvestor(stock) {
  if (stock.pe > 30 || stock.pb > 4) {
    return '激进型投资者';
  } else if (stock.pe > 20 || stock.pb > 2.5) {
    return '稳健型投资者';
  } else {
    return '保守型投资者';
  }
}

// 辅助函数：获取短期策略
function getShortTermStrategy(stock) {
  if (stock.changePercent > 5) {
    return '短期涨幅较大，可能面临回调，建议观望';
  } else if (stock.changePercent < -5) {
    return '短期跌幅较大，可能存在反弹机会，建议关注';
  } else {
    return '短期波动不大，建议持有观察';
  }
}

// 辅助函数：获取中长期策略
function getLongTermStrategy(stock) {
  if (stock.pe < 15 && stock.pb < 1.5 && stock.roe > 15) {
    return '中长期投资价值显著，建议逢低买入并长期持有';
  } else if (stock.pe < 25 && stock.pb < 3 && stock.roe > 10) {
    return '中长期投资价值良好，建议分批建仓';
  } else {
    return '中长期投资价值一般，建议控制仓位';
  }
}

// 辅助函数：获取结论
function getConclusion(stock) {
  if (stock.pe < 15 && stock.pb < 1.5 && stock.roe > 15) {
    return '该股票具有较高的投资价值，建议重点关注并考虑配置';
  } else if (stock.pe < 25 && stock.pb < 3 && stock.roe > 10) {
    return '该股票投资价值良好，可以考虑适量配置';
  } else if (stock.pe > 30 || stock.pb > 4) {
    return '该股票估值较高，建议谨慎投资，关注基本面变化';
  } else {
    return '该股票投资价值一般，建议作为组合的一部分适量配置';
  }
}

// 辅助函数：获取行业基金推荐
function getIndustryFundRecommendation(fundName) {
  if (fundName.includes('消费')) {
    return '消费行业基金、可选消费基金';
  } else if (fundName.includes('科技')) {
    return '科技行业基金、创新成长基金';
  } else if (fundName.includes('医药')) {
    return '医药行业基金、健康产业基金';
  } else if (fundName.includes('金融')) {
    return '金融行业基金、银行ETF';
  } else {
    return '行业主题基金、指数增强基金';
  }
}

// 辅助函数：获取基金结论
function getFundConclusion(fund) {
  if (fund.yearGrowth > 20) {
    return '该基金表现优秀，建议作为组合的核心配置，采用定投方式长期持有';
  } else if (fund.yearGrowth > 10) {
    return '该基金表现良好，可以考虑作为组合的一部分，适量配置';
  } else {
    return '该基金表现一般，建议谨慎配置，关注其业绩变化趋势';
  }
}

// 辅助函数：生成组合基金推荐
function generatePortfolioRecommendation(type, relatedInfo) {
  let recommendation = '';
  
  // 定义不同类型的推荐基金
  const recommendedFunds = {
    // 宽基指数基金
    broadMarket: [
      { code: '000016', name: '上证50ETF', type: 'index', risk: 'low' },
      { code: '510300', name: '沪深300ETF', type: 'index', risk: 'low' },
      { code: '510500', name: '中证500ETF', type: 'index', risk: 'medium' }
    ],
    // 行业主题基金
    industry: {
      '金融': [
        { code: '161005', name: '富国天惠成长混合A', type: 'mixed', risk: 'medium' },
        { code: '000001', name: '华夏成长混合', type: 'mixed', risk: 'medium' }
      ],
      '消费': [
        { code: '110022', name: '易方达消费行业股票', type: 'stock', risk: 'medium' },
        { code: '000083', name: '汇添富消费行业混合', type: 'mixed', risk: 'medium' }
      ],
      '科技': [
        { code: '001593', name: '天弘中证计算机ETF联接A', type: 'index', risk: 'high' },
        { code: '001630', name: '天弘中证电子ETF联接A', type: 'index', risk: 'high' }
      ],
      '医药': [
        { code: '000711', name: '嘉实医疗健康股票A', type: 'stock', risk: 'medium' },
        { code: '001558', name: '天弘中证医药100A', type: 'index', risk: 'medium' }
      ],
      '能源': [
        { code: '161005', name: '富国天惠成长混合A', type: 'mixed', risk: 'medium' },
        { code: '000001', name: '华夏成长混合', type: 'mixed', risk: 'medium' }
      ],
      '房地产': [
        { code: '161005', name: '富国天惠成长混合A', type: 'mixed', risk: 'medium' },
        { code: '000001', name: '华夏成长混合', type: 'mixed', risk: 'medium' }
      ],
      '制造业': [
        { code: '161005', name: '富国天惠成长混合A', type: 'mixed', risk: 'medium' },
        { code: '000001', name: '华夏成长混合', type: 'mixed', risk: 'medium' }
      ],
      '公用事业': [
        { code: '161005', name: '富国天惠成长混合A', type: 'mixed', risk: 'medium' },
        { code: '000001', name: '华夏成长混合', type: 'mixed', risk: 'medium' }
      ]
    },
    // 债券基金
    bond: [
      { code: '001511', name: '天弘余额宝货币', type: 'money', risk: 'low' },
      { code: '000001', name: '华夏成长混合', type: 'mixed', risk: 'medium' }
    ],
    // 基金类型推荐
    fundType: {
      '消费': [
        { code: '510300', name: '沪深300ETF', type: 'index', risk: 'low' },
        { code: '001511', name: '天弘余额宝货币', type: 'money', risk: 'low' }
      ],
      '科技': [
        { code: '510500', name: '中证500ETF', type: 'index', risk: 'medium' },
        { code: '001511', name: '天弘余额宝货币', type: 'money', risk: 'low' }
      ],
      '医药': [
        { code: '510300', name: '沪深300ETF', type: 'index', risk: 'low' },
        { code: '001511', name: '天弘余额宝货币', type: 'money', risk: 'low' }
      ],
      '金融': [
        { code: '510050', name: '上证50ETF', type: 'index', risk: 'low' },
        { code: '001511', name: '天弘余额宝货币', type: 'money', risk: 'low' }
      ]
    }
  };
  
  // 生成推荐
  const selectedFunds = [];
  
  if (type === 'stock') {
    // 股票类型：推荐宽基指数基金 + 债券基金 + 相关行业基金
    
    // 添加宽基指数基金（1个）
    const broadMarketFunds = recommendedFunds.broadMarket;
    if (broadMarketFunds.length > 0) {
      selectedFunds.push(broadMarketFunds[0]);
    }
    
    // 添加相关行业基金（1个）
    const industryFunds = recommendedFunds.industry[relatedInfo] || [];
    if (industryFunds.length > 0 && selectedFunds.length < 3) {
      selectedFunds.push(industryFunds[0]);
    }
    
    // 添加债券基金（1个）
    const bondFunds = recommendedFunds.bond;
    if (bondFunds.length > 0 && selectedFunds.length < 3) {
      selectedFunds.push(bondFunds[0]);
    }
  } else if (type === 'fund') {
    // 基金类型：推荐宽基指数基金 + 债券基金 + 不同类型基金
    
    // 添加宽基指数基金（1个）
    const broadMarketFunds = recommendedFunds.broadMarket;
    if (broadMarketFunds.length > 0) {
      selectedFunds.push(broadMarketFunds[1]);
    }
    
    // 添加债券基金（1个）
    const bondFunds = recommendedFunds.bond;
    if (bondFunds.length > 0 && selectedFunds.length < 3) {
      selectedFunds.push(bondFunds[0]);
    }
    
    // 根据基金名称添加相关类型基金（1个）
    let fundTypeFunds = [];
    for (const fundType in recommendedFunds.fundType) {
      if (relatedInfo.includes(fundType)) {
        fundTypeFunds = recommendedFunds.fundType[fundType];
        break;
      }
    }
    if (fundTypeFunds.length > 0 && selectedFunds.length < 3) {
      selectedFunds.push(fundTypeFunds[0]);
    } else if (selectedFunds.length < 3) {
      // 如果没有找到相关类型，添加一个默认基金
      selectedFunds.push(recommendedFunds.broadMarket[2]);
    }
  }
  
  // 生成推荐文本
  if (selectedFunds.length > 0) {
    recommendation += `   - 推荐组合（最多3个）:\n`;
    selectedFunds.forEach((fund, index) => {
      recommendation += `     ${index + 1}. ${fund.name} (${fund.code}) - ${fund.type === 'stock' ? '股票型' : fund.type === 'mixed' ? '混合型' : fund.type === 'index' ? '指数型' : fund.type === 'money' ? '货币型' : fund.type} - 风险等级: ${fund.risk === 'low' ? '低' : fund.risk === 'medium' ? '中' : '高'}\n`;
    });
    
    // 添加配置建议
    recommendation += `   - 配置建议:\n`;
    if (selectedFunds.length === 3) {
      recommendation += `     * ${selectedFunds[0].name}: 50%\n`;
      recommendation += `     * ${selectedFunds[1].name}: 30%\n`;
      recommendation += `     * ${selectedFunds[2].name}: 20%\n`;
    } else if (selectedFunds.length === 2) {
      recommendation += `     * ${selectedFunds[0].name}: 60%\n`;
      recommendation += `     * ${selectedFunds[1].name}: 40%\n`;
    } else if (selectedFunds.length === 1) {
      recommendation += `     * ${selectedFunds[0].name}: 100%\n`;
    }
  } else {
    recommendation += `   - 暂无合适的推荐组合\n`;
  }
  
  return recommendation;
}

// 市场资讯数据
const newsData = [
  {
    id: 'news_202502101643_001',
    timestamp: '2025-02-10T16:43:00+08:00',
    time_display: '16:43',
    category: 'policy',
    category_name: '政策',
    is_important: true,
    importance_level: 4,
    source: '抖音电商',
    title: '严打虚假价格宣传，严禁制造低价错觉',
    summary: '抖音电商安全与信任中心发文表示，部分商家、达人通过夸大折扣、虚构到手价等方式误导消费者...',
    content: '抖音电商安全与信任中心发文表示，将严厉打击虚假价格宣传行为，严禁通过夸大折扣、虚构到手价等方式制造低价错觉，误导消费者消费。平台将加强监测和处罚力度，维护良好的电商生态。',
    related_stocks: ['抖音概念', '电商'],
    tags: ['价格监管', '虚假宣传']
  },
  {
    id: 'news_202502101641_002',
    timestamp: '2025-02-10T16:41:00+08:00',
    time_display: '16:41',
    category: 'exchange',
    category_name: '交易所',
    is_important: true,
    importance_level: 5,
    source: '上期所',
    title: '对部分客户采取限制开仓监管措施',
    summary: '上海期货交易所发布公告称，经过排查发现部分客户存在违规交易行为，交易所决定对相关客户采取限制开仓监管措施。此举旨在维护市场秩序，保护投资者合法权益。',
    content: '上海期货交易所发布公告称，经过排查发现部分客户存在违规交易行为，交易所决定对相关客户采取限制开仓监管措施。此举旨在维护市场秩序，保护投资者合法权益。',
    related_stocks: ['期货概念'],
    tags: ['监管', '期货']
  },
  {
    id: 'news_202502101638_003',
    timestamp: '2025-02-10T16:38:00+08:00',
    time_display: '16:38',
    category: 'stock',
    category_name: '股市',
    is_important: false,
    importance_level: 2,
    source: '财联社',
    title: 'A股三大指数集体收涨，沪指涨0.86%',
    summary: '今日A股市场三大指数集体收涨，沪指、深成指、创业板指均实现上涨，市场情绪有所回暖。盘面上，券商、白酒、新能源等板块涨幅居前，市场成交额较昨日有所放大。',
    content: '今日A股市场三大指数集体收涨，沪指涨0.86%，深成指涨1.12%，创业板指涨1.27%。盘面上，券商、白酒、新能源等板块涨幅居前，市场成交额较昨日有所放大。',
    related_stocks: ['券商板块', '白酒板块', '新能源'],
    tags: ['A股', '收盘']
  },
  {
    id: 'news_202502101635_004',
    timestamp: '2025-02-10T16:35:00+08:00',
    time_display: '16:35',
    category: 'fund',
    category_name: '基金',
    is_important: false,
    importance_level: 3,
    source: '中国基金报',
    title: '公募基金规模突破31万亿元',
    summary: '最新数据显示，截至2024年1月底，公募基金管理规模已突破31万亿元，创下历史新高。其中，权益类基金规模增长明显，投资者对资本市场的信心持续恢复。',
    content: '最新数据显示，截至2024年1月底，公募基金管理规模已突破31万亿元，创下历史新高。其中，权益类基金规模增长明显，投资者对资本市场的信心持续恢复。',
    related_stocks: ['基金板块'],
    tags: ['基金', '规模']
  },
  {
    id: 'news_202502101632_005',
    timestamp: '2025-02-10T16:32:00+08:00',
    time_display: '16:32',
    category: 'metal',
    category_name: '黄金',
    is_important: false,
    importance_level: 2,
    source: '金十数据',
    title: '现货黄金突破2030美元/盎司',
    summary: '受地缘政治风险升温影响，市场避险情绪上升，现货黄金价格突破2030美元/盎司关口，创下近期新高。分析师表示，黄金短期有望继续走强。',
    content: '受地缘政治风险升温影响，市场避险情绪上升，现货黄金价格突破2030美元/盎司关口，创下近期新高。分析师表示，黄金短期有望继续走强。',
    related_stocks: ['黄金概念', '紫金矿业', '山东黄金'],
    tags: ['黄金', '避险']
  },
  {
    id: 'news_202502101629_006',
    timestamp: '2025-02-10T16:29:00+08:00',
    time_display: '16:29',
    category: 'company',
    category_name: '公司',
    is_important: false,
    importance_level: 4,
    source: '公司公告',
    title: '宁德时代发布新一代钠离子电池',
    summary: '宁德时代今日正式发布新一代钠离子电池，能量密度较上一代产品提升20%，成本下降30%。该产品将主要面向低端电动车和储能市场，有望进一步扩大公司市场份额。',
    content: '宁德时代今日正式发布新一代钠离子电池，能量密度较上一代产品提升20%，成本下降30%。该产品将主要面向低端电动车和储能市场，有望进一步扩大公司市场份额。',
    related_stocks: ['宁德时代', '新能源车'],
    tags: ['电池', '新能源']
  },
  {
    id: 'news_202502101626_007',
    timestamp: '2025-02-10T16:26:00+08:00',
    time_display: '16:26',
    category: 'industry',
    category_name: '行业',
    is_important: false,
    importance_level: 3,
    source: '证券时报',
    title: '半导体行业景气度持续回升',
    summary: '最新行业数据显示，半导体行业景气度连续三个月回升，订单量显著增加。随着AI芯片和高性能计算需求的快速增长，半导体产业链有望迎来新一轮发展机遇。',
    content: '最新行业数据显示，半导体行业景气度连续三个月回升，订单量显著增加。随着AI芯片和高性能计算需求的快速增长，半导体产业链有望迎来新一轮发展机遇。',
    related_stocks: ['半导体', '芯片概念'],
    tags: ['半导体', 'AI']
  },
  {
    id: 'news_202502101623_008',
    timestamp: '2025-02-10T16:23:00+08:00',
    time_display: '16:23',
    category: 'stock',
    category_name: '股市',
    is_important: true,
    importance_level: 5,
    source: '证监会发布',
    title: '证监会部署2024年资本市场重点工作任务',
    summary: '证监会近日召开会议，部署2024年资本市场重点工作任务。会议强调要坚持稳中求进，深化改革，扩大开放，切实维护资本市场平稳健康发展。',
    content: '证监会近日召开会议，部署2024年资本市场重点工作任务。会议强调要坚持稳中求进，深化改革，扩大开放，切实维护资本市场平稳健康发展。重点包括完善注册制、加强监管、防控风险等。',
    related_stocks: ['券商板块'],
    tags: ['证监会', '政策']
  },
  {
    id: 'news_202502101620_009',
    timestamp: '2025-02-10T16:20:00+08:00',
    time_display: '16:20',
    category: 'policy',
    category_name: '政策',
    is_important: true,
    importance_level: 5,
    source: '央行',
    title: '央行宣布降准0.5个百分点，释放流动性约1万亿元',
    summary: '中国人民银行决定下调金融机构存款准备金率0.5个百分点，释放长期资金约1万亿元，以支持实体经济发展。',
    content: '中国人民银行决定下调金融机构存款准备金率0.5个百分点，释放长期资金约1万亿元。此次降准旨在支持实体经济发展，降低融资成本，保持流动性合理充裕。',
    related_stocks: ['银行板块', '房地产板块'],
    tags: ['降准', '货币政策']
  },
  {
    id: 'news_202502101615_010',
    timestamp: '2025-02-10T16:15:00+08:00',
    time_display: '16:15',
    category: 'company',
    category_name: '公司',
    is_important: true,
    importance_level: 4,
    source: '公告',
    title: '比亚迪1月销量突破20万辆，同比增长超过30%',
    summary: '比亚迪发布1月销量数据，新能源汽车销量突破20万辆，同比增长超过30%，继续保持行业领先地位。',
    content: '比亚迪发布1月销量数据，新能源汽车销量突破20万辆，同比增长超过30%，继续保持行业领先地位。其中，纯电动车和插电混动车销量均实现大幅增长。',
    related_stocks: ['比亚迪', '新能源汽车'],
    tags: ['销量', '新能源车']
  },
  {
    id: 'news_202502101610_011',
    timestamp: '2025-02-10T16:10:00+08:00',
    time_display: '16:10',
    category: 'industry',
    category_name: '行业',
    is_important: false,
    importance_level: 2,
    source: '行业研究',
    title: '光伏产业链价格企稳，下游需求回暖',
    summary: '近期光伏产业链各环节价格逐步企稳，硅料、硅片价格止跌回升，组件环节排产增加，下游装机需求明显回暖。',
    content: '近期光伏产业链各环节价格逐步企稳，硅料、硅片价格止跌回升，组件环节排产增加，下游装机需求明显回暖。预计2024年国内光伏装机将保持高增长态势。',
    related_stocks: ['光伏概念', '隆基绿能', '通威股份'],
    tags: ['光伏', '新能源']
  },
  {
    id: 'news_202502101605_012',
    timestamp: '2025-02-10T16:05:00+08:00',
    time_display: '16:05',
    category: 'fund',
    category_name: '基金',
    is_important: false,
    importance_level: 2,
    source: '基金业协会',
    title: '多只权益类基金宣布恢复大额申购',
    summary: '近期多只权益类基金宣布恢复大额申购业务，显示基金经理对后市信心增强，市场流动性有望进一步改善。',
    content: '近期多只权益类基金宣布恢复大额申购业务，显示基金经理对后市信心增强，市场流动性有望进一步改善。此举有利于吸引更多长期资金入市。',
    related_stocks: ['基金板块'],
    tags: ['基金', '申购']
  },
  {
    id: 'news_202502101600_013',
    timestamp: '2025-02-10T16:00:00+08:00',
    time_display: '16:00',
    category: 'metal',
    category_name: '黄金',
    is_important: false,
    importance_level: 1,
    source: '金十数据',
    title: '白银价格跟随黄金上涨，突破23美元/盎司',
    summary: '受黄金价格上涨带动，白银价格突破23美元/盎司，金银比有所收窄。工业需求和投资需求双重支撑白银价格。',
    content: '受黄金价格上涨带动，白银价格突破23美元/盎司，金银比有所收窄。工业需求和投资需求双重支撑白银价格，预计短期将维持强势。',
    related_stocks: ['白银概念', '盛达资源'],
    tags: ['白银', '贵金属']
  },
  {
    id: 'news_202502101555_014',
    timestamp: '2025-02-10T15:55:00+08:00',
    time_display: '15:55',
    category: 'exchange',
    category_name: '交易所',
    is_important: false,
    importance_level: 3,
    source: '深交所',
    title: '深交所发布上市公司自律监管指引',
    summary: '深交所发布新版上市公司自律监管指引，进一步完善信息披露要求，强化公司治理监管，保护投资者合法权益。',
    content: '深交所发布新版上市公司自律监管指引，进一步完善信息披露要求，强化公司治理监管，保护投资者合法权益。指引将于下月正式实施。',
    related_stocks: ['深交所上市公司'],
    tags: ['监管', '深交所']
  },
  {
    id: 'news_202502101550_015',
    timestamp: '2025-02-10T15:50:00+08:00',
    time_display: '15:50',
    category: 'stock',
    category_name: '股市',
    is_important: false,
    importance_level: 2,
    source: '市场分析',
    title: '北向资金今日净流入超50亿元',
    summary: '今日北向资金持续净流入，全天净流入超50亿元，显示外资对A股市场信心持续恢复，主要买入金融、消费等板块。',
    content: '今日北向资金持续净流入，全天净流入超50亿元，显示外资对A股市场信心持续恢复，主要买入金融、消费等板块。北向资金连续多日净流入，为市场带来积极信号。',
    related_stocks: ['北向资金重仓股'],
    tags: ['北向资金', '外资']
  },
  {
    id: 'news_202502101545_016',
    timestamp: '2025-02-10T15:45:00+08:00',
    time_display: '15:45',
    category: 'company',
    category_name: '公司',
    is_important: false,
    importance_level: 4,
    source: '公告',
    title: '腾讯发布2023年财报，净利润同比增长超40%',
    summary: '腾讯控股发布2023年度财报，实现营业收入同比增长10%，净利润同比增长超过40%，业绩超出市场预期。',
    content: '腾讯控股发布2023年度财报，实现营业收入同比增长10%，净利润同比增长超过40%，业绩超出市场预期。游戏业务稳健增长，广告业务复苏明显，金融科技及企业服务业务保持高增长。',
    related_stocks: ['腾讯控股', '港股科技'],
    tags: ['财报', '业绩']
  },
  {
    id: 'news_202502101540_017',
    timestamp: '2025-02-10T15:40:00+08:00',
    time_display: '15:40',
    category: 'policy',
    category_name: '政策',
    is_important: true,
    importance_level: 5,
    source: '国务院',
    title: '国务院印发《关于推动未来产业创新发展的实施意见》',
    summary: '国务院印发《关于推动未来产业创新发展的实施意见》，提出重点推进未来制造、未来信息、未来材料、未来能源、未来空间、未来健康等六大方向产业发展。',
    content: '国务院印发《关于推动未来产业创新发展的实施意见》，提出重点推进未来制造、未来信息、未来材料、未来能源、未来空间、未来健康等六大方向产业发展。到2025年，未来产业技术创新、产业培育、安全治理等全面发展，部分领域达到国际先进水平。',
    related_stocks: ['科技创新', '新兴产业'],
    tags: ['政策', '未来产业']
  },
  {
    id: 'news_202502101535_018',
    timestamp: '2025-02-10T15:35:00+08:00',
    time_display: '15:35',
    category: 'industry',
    category_name: '行业',
    is_important: false,
    importance_level: 3,
    source: '行业分析',
    title: '人工智能芯片市场规模预计2024年将突破500亿元',
    summary: '据行业研究机构预测，2024年中国人工智能芯片市场规模将突破500亿元，同比增长超过30%，国产芯片占比持续提升。',
    content: '据行业研究机构预测，2024年中国人工智能芯片市场规模将突破500亿元，同比增长超过30%，国产芯片占比持续提升。随着大模型应用的普及，AI算力需求持续增长，为国产AI芯片带来发展机遇。',
    related_stocks: ['AI芯片', '寒武纪', '海光信息'],
    tags: ['AI芯片', '人工智能']
  },
  {
    id: 'news_202502101530_019',
    timestamp: '2025-02-10T15:30:00+08:00',
    time_display: '15:30',
    category: 'fund',
    category_name: '基金',
    is_important: false,
    importance_level: 2,
    source: '基金公告',
    title: '多只养老目标基金获批，个人养老金产品扩容',
    summary: '近日多只养老目标基金获批，个人养老金产品进一步扩容。截至目前，个人养老金基金产品数量已超过150只。',
    content: '近日多只养老目标基金获批，个人养老金产品进一步扩容。截至目前，个人养老金基金产品数量已超过150只，为投资者提供更多选择。养老目标基金以FOF形式运作，追求长期稳健收益。',
    related_stocks: ['养老概念', '基金'],
    tags: ['养老金', '基金']
  },
  {
    id: 'news_202502101525_020',
    timestamp: '2025-02-10T15:25:00+08:00',
    time_display: '15:25',
    category: 'metal',
    category_name: '黄金',
    is_important: false,
    importance_level: 2,
    source: '市场数据',
    title: '铜价创近半年新高，供需紧张支撑价格',
    summary: '伦敦铜价创近半年新高，受全球铜矿供应紧张和新能源领域需求增长支撑。国内铜价跟随上涨，冶炼企业利润改善。',
    content: '伦敦铜价创近半年新高，受全球铜矿供应紧张和新能源领域需求增长支撑。国内铜价跟随上涨，冶炼企业利润改善。分析师预计铜价短期将维持高位震荡。',
    related_stocks: ['铜概念', '江西铜业', '云南铜业'],
    tags: ['铜', '有色金属']
  },
  {
    id: 'news_202502101520_021',
    timestamp: '2025-02-10T15:20:00+08:00',
    time_display: '15:20',
    category: 'company',
    category_name: '公司',
    is_important: true,
    importance_level: 5,
    source: '公告',
    title: '茅台集团2023年营收突破1500亿元',
    summary: '茅台集团发布2023年业绩数据，全年营收突破1500亿元，同比增长超过17%，净利润同比增长超过19%，业绩再创历史新高。',
    content: '茅台集团发布2023年业绩数据，全年营收突破1500亿元，同比增长超过17%，净利润同比增长超过19%，业绩再创历史新高。茅台酒销售稳健增长，系列酒快速发展，品牌影响力持续提升。',
    related_stocks: ['贵州茅台', '白酒板块'],
    tags: ['业绩', '白酒']
  },
  {
    id: 'news_202502101515_022',
    timestamp: '2025-02-10T15:15:00+08:00',
    time_display: '15:15',
    category: 'stock',
    category_name: '股市',
    is_important: false,
    importance_level: 3,
    source: '市场动态',
    title: '券商板块集体走强，多只个股涨停',
    summary: '今日券商板块集体走强，多只个股涨停，市场交投活跃度提升。政策利好和业绩改善预期推动券商股估值修复。',
    content: '今日券商板块集体走强，多只个股涨停，市场交投活跃度提升。政策利好和业绩改善预期推动券商股估值修复。分析师认为，随着资本市场改革深化，券商行业有望迎来新的发展机遇。',
    related_stocks: ['券商板块', '中信证券', '东方财富'],
    tags: ['券商', '涨停']
  },
  {
    id: 'news_202502101510_023',
    timestamp: '2025-02-10T15:10:00+08:00',
    time_display: '15:10',
    category: 'exchange',
    category_name: '交易所',
    is_important: false,
    importance_level: 3,
    source: '北交所',
    title: '北交所优化上市审核流程，提高审核效率',
    summary: '北交所发布通知，优化上市审核流程，缩短审核时限，提高审核效率，支持优质中小企业更快登陆资本市场。',
    content: '北交所发布通知，优化上市审核流程，缩短审核时限，提高审核效率，支持优质中小企业更快登陆资本市场。此举将进一步提升北交所服务创新型中小企业的能力。',
    related_stocks: ['北交所', '专精特新'],
    tags: ['北交所', '上市']
  },
  {
    id: 'news_202502101505_024',
    timestamp: '2025-02-10T15:05:00+08:00',
    time_display: '15:05',
    category: 'policy',
    category_name: '政策',
    is_important: true,
    importance_level: 4,
    source: '发改委',
    title: '发改委：将出台更多措施支持新能源汽车消费',
    summary: '国家发改委表示，将出台更多措施支持新能源汽车消费，包括完善充电基础设施、优化车辆购置税政策等，推动新能源汽车产业高质量发展。',
    content: '国家发改委表示，将出台更多措施支持新能源汽车消费，包括完善充电基础设施、优化车辆购置税政策等，推动新能源汽车产业高质量发展。同时，将支持新能源汽车出口，拓展国际市场。',
    related_stocks: ['新能源汽车', '充电桩'],
    tags: ['新能源', '政策']
  },
  {
    id: 'news_202502101500_025',
    timestamp: '2025-02-10T15:00:00+08:00',
    time_display: '15:00',
    category: 'industry',
    category_name: '行业',
    is_important: false,
    importance_level: 2,
    source: '行业报告',
    title: '医药板块迎来估值修复，创新药企业受关注',
    summary: '近期医药板块迎来估值修复行情，创新药企业受到市场关注。随着医保谈判结果落地，创新药企业业绩有望逐步改善。',
    content: '近期医药板块迎来估值修复行情，创新药企业受到市场关注。随着医保谈判结果落地，创新药企业业绩有望逐步改善。分析师认为，医药板块估值处于历史低位，具备较好的投资价值。',
    related_stocks: ['医药板块', '创新药', '恒瑞医药'],
    tags: ['医药', '创新药']
  },
  {
    id: 'news_202502111430_026',
    timestamp: '2025-02-11T14:30:00+08:00',
    time_display: '14:30',
    category: 'policy',
    category_name: '政策',
    is_important: true,
    importance_level: 5,
    source: '证监会',
    title: '证监会：推动上市公司高质量发展 加强投资者保护',
    summary: '证监会发布《关于推动上市公司高质量发展的意见》，提出加强公司治理、完善信息披露、强化投资者保护等多项措施。',
    content: '证监会发布《关于推动上市公司高质量发展的意见》，提出加强公司治理、完善信息披露、强化投资者保护等多项措施。意见要求上市公司提升经营质量，增强回报投资者能力，建立健全投资者关系管理机制。',
    related_stocks: ['A股', '上市公司'],
    tags: ['政策', '投资者保护']
  },
  {
    id: 'news_202502111415_027',
    timestamp: '2025-02-11T14:15:00+08:00',
    time_display: '14:15',
    category: 'stock',
    category_name: '股市',
    is_important: false,
    importance_level: 3,
    source: '证券时报',
    title: 'A股三大指数震荡收涨 科技股表现活跃',
    summary: '今日A股市场三大指数震荡收涨，沪指涨0.3%，深成指涨0.5%，创业板指涨0.8%。科技股表现活跃，半导体、人工智能板块涨幅居前。',
    content: '今日A股市场三大指数震荡收涨，沪指涨0.3%，深成指涨0.5%，创业板指涨0.8%。科技股表现活跃，半导体、人工智能板块涨幅居前。市场成交额约8500亿元，北向资金净流入32亿元。',
    related_stocks: ['科技股', '半导体', '人工智能'],
    tags: ['A股', '收盘']
  },
  {
    id: 'news_202502111400_028',
    timestamp: '2025-02-11T14:00:00+08:00',
    time_display: '14:00',
    category: 'company',
    category_name: '公司',
    is_important: true,
    importance_level: 4,
    source: '公司公告',
    title: '阿里巴巴发布2025财年第三季度财报 云业务增长强劲',
    summary: '阿里巴巴发布2025财年第三季度财报，营收同比增长8%，云智能集团收入增长12%，AI相关收入连续六个季度保持三位数增长。',
    content: '阿里巴巴发布2025财年第三季度财报，营收同比增长8%，云智能集团收入增长12%，AI相关收入连续六个季度保持三位数增长。公司表示将继续加大AI基础设施投入，推动业务全面AI化。',
    related_stocks: ['阿里巴巴', '中概股', '云计算'],
    tags: ['财报', 'AI', '云计算']
  },
  {
    id: 'news_202502111345_029',
    timestamp: '2025-02-11T13:45:00+08:00',
    time_display: '13:45',
    category: 'industry',
    category_name: '行业',
    is_important: false,
    importance_level: 3,
    source: '行业研究',
    title: '人形机器人产业加速发展 多家公司布局量产',
    summary: '随着AI技术突破和成本下降，人形机器人产业进入快速发展期。特斯拉、波士顿动力等加速布局，国内多家企业宣布量产计划。',
    content: '随着AI技术突破和成本下降，人形机器人产业进入快速发展期。特斯拉Optimus计划2025年量产，波士顿动力加强商业化布局，国内优必选、宇树科技等企业宣布量产计划，产业链迎来爆发式增长机遇。',
    related_stocks: ['机器人概念', 'AI', '智能制造'],
    tags: ['机器人', 'AI', '产业']
  },
  {
    id: 'news_202502111330_030',
    timestamp: '2025-02-11T13:30:00+08:00',
    time_display: '13:30',
    category: 'fund',
    category_name: '基金',
    is_important: false,
    importance_level: 2,
    source: '中国基金报',
    title: '主动权益基金业绩回暖 科技主题基金领涨',
    summary: '今年以来主动权益基金业绩明显回暖，平均收益率达5.2%。科技主题基金表现亮眼，人工智能、机器人相关基金涨幅超15%。',
    content: '今年以来主动权益基金业绩明显回暖，平均收益率达5.2%。科技主题基金表现亮眼，人工智能、机器人相关基金涨幅超15%。基金经理表示，科技板块仍是全年投资主线，建议关注AI应用、机器人等细分领域。',
    related_stocks: ['基金', '科技股'],
    tags: ['基金', '业绩', '科技']
  },
  {
    id: 'news_202502111315_031',
    timestamp: '2025-02-11T13:15:00+08:00',
    time_display: '13:15',
    category: 'exchange',
    category_name: '交易所',
    is_important: true,
    importance_level: 4,
    source: '上交所',
    title: '上交所：优化科创板上市审核 支持硬科技企业',
    summary: '上交所发布通知，优化科创板上市审核机制，简化审核流程，提高审核效率，重点支持关键核心技术攻关的硬科技企业。',
    content: '上交所发布通知，优化科创板上市审核机制，简化审核流程，提高审核效率，重点支持关键核心技术攻关的硬科技企业。通知明确对突破关键核心技术的优质企业实行即报即审，加快上市进程。',
    related_stocks: ['科创板', '硬科技'],
    tags: ['科创板', '上市', '政策']
  },
  {
    id: 'news_202502111300_032',
    timestamp: '2025-02-11T13:00:00+08:00',
    time_display: '13:00',
    category: 'metal',
    category_name: '黄金',
    is_important: false,
    importance_level: 2,
    source: '金十数据',
    title: '黄金价格创近三个月新高 避险需求支撑',
    summary: '国际黄金价格突破2900美元/盎司，创近三个月新高。地缘政治不确定性增加，市场避险需求上升支撑金价。',
    content: '国际黄金价格突破2900美元/盎司，创近三个月新高。地缘政治不确定性增加，市场避险需求上升支撑金价。分析师预计，在全球央行持续购金和避险需求支撑下，金价有望维持高位。',
    related_stocks: ['黄金', '贵金属'],
    tags: ['黄金', '避险']
  },
  {
    id: 'news_202502111245_033',
    timestamp: '2025-02-11T12:45:00+08:00',
    time_display: '12:45',
    category: 'policy',
    category_name: '政策',
    is_important: true,
    importance_level: 5,
    source: '国务院',
    title: '国务院：大力发展银发经济 培育智慧养老新业态',
    summary: '国务院办公厅印发《关于发展银发经济增进老年人福祉的意见》，提出培育智慧养老新业态，推动银发经济高质量发展。',
    content: '国务院办公厅印发《关于发展银发经济增进老年人福祉的意见》，提出培育智慧养老新业态，推动银发经济高质量发展。意见明确到2027年，银发经济规模达到15万亿元，智慧养老产品和服务供给大幅增加。',
    related_stocks: ['养老产业', '银发经济', '智慧养老'],
    tags: ['政策', '养老', '银发经济']
  },
  {
    id: 'news_202502111230_034',
    timestamp: '2025-02-11T12:30:00+08:00',
    time_display: '12:30',
    category: 'company',
    category_name: '公司',
    is_important: false,
    importance_level: 3,
    source: '公告',
    title: '小米汽车SU7订单量突破20万辆 产能持续爬坡',
    summary: '小米集团宣布，小米汽车SU7累计订单量突破20万辆，目前产能持续爬坡，月交付量已突破2万辆。',
    content: '小米集团宣布，小米汽车SU7累计订单量突破20万辆，目前产能持续爬坡，月交付量已突破2万辆。公司表示将加大投入扩充产能，确保交付进度，同时加快新车型研发。',
    related_stocks: ['小米集团', '新能源汽车', '港股'],
    tags: ['新能源汽车', '订单', '产能']
  },
  {
    id: 'news_202502111215_035',
    timestamp: '2025-02-11T12:15:00+08:00',
    time_display: '12:15',
    category: 'stock',
    category_name: '股市',
    is_important: false,
    importance_level: 2,
    source: '市场分析',
    title: '北向资金连续5日净流入 累计超200亿元',
    summary: '北向资金连续5个交易日净流入A股，累计净买入超200亿元，显示外资对A股市场信心持续恢复。',
    content: '北向资金连续5个交易日净流入A股，累计净买入超200亿元，显示外资对A股市场信心持续恢复。从行业来看，外资主要买入电子、医药生物、食品饮料等板块，减持银行、房地产板块。',
    related_stocks: ['北向资金', '外资'],
    tags: ['北向资金', '外资', '流入']
  },
  // 2月9日资讯
  {
    id: 'news_202502091600_036',
    timestamp: '2025-02-09T16:00:00+08:00',
    time_display: '16:00',
    category: 'policy',
    category_name: '政策',
    is_important: true,
    importance_level: 5,
    source: '央行',
    title: '央行：保持流动性合理充裕 推动社会融资成本下降',
    summary: '中国人民银行发布货币政策执行报告，表示将继续保持流动性合理充裕，推动社会融资成本稳中有降，支持实体经济发展。',
    content: '中国人民银行发布2024年第四季度货币政策执行报告，表示将继续保持流动性合理充裕，推动社会融资成本稳中有降，支持实体经济发展。报告强调，将灵活运用多种货币政策工具，保持货币供应量和社会融资规模增速同名义经济增速基本匹配。',
    related_stocks: ['银行', '金融板块'],
    tags: ['货币政策', '央行', '流动性']
  },
  {
    id: 'news_202502091545_037',
    timestamp: '2025-02-09T15:45:00+08:00',
    time_display: '15:45',
    category: 'stock',
    category_name: '股市',
    is_important: false,
    importance_level: 3,
    source: '证券时报',
    title: 'A股龙年首个交易日开门红 沪指涨1.5%',
    summary: 'A股龙年首个交易日迎来开门红，沪指涨1.5%，深成指涨2.1%，创业板指涨2.6%。AI概念股全线爆发，ChatGPT、AIGC概念领涨。',
    content: 'A股龙年首个交易日迎来开门红，沪指涨1.5%，深成指涨2.1%，创业板指涨2.6%。AI概念股全线爆发，ChatGPT、AIGC概念领涨，多只个股涨停。市场成交额突破万亿元，北向资金净流入超80亿元。',
    related_stocks: ['AI概念', 'ChatGPT', 'AIGC'],
    tags: ['A股', '开门红', 'AI']
  },
  {
    id: 'news_202502091530_038',
    timestamp: '2025-02-09T15:30:00+08:00',
    time_display: '15:30',
    category: 'company',
    category_name: '公司',
    is_important: true,
    importance_level: 4,
    source: '公告',
    title: '比亚迪1月销量超30万辆 同比增长超80%',
    summary: '比亚迪发布1月销量数据，新能源汽车销量超30万辆，同比增长超80%，蝉联全球新能源汽车销量冠军。',
    content: '比亚迪发布1月销量数据，新能源汽车销量超30万辆，同比增长超80%，蝉联全球新能源汽车销量冠军。其中，海外销量突破5万辆，出口业务持续高速增长。公司表示将继续加大海外市场拓展力度。',
    related_stocks: ['比亚迪', '新能源汽车', '港股'],
    tags: ['销量', '新能源汽车', '业绩']
  },
  {
    id: 'news_202502091515_039',
    timestamp: '2025-02-09T15:15:00+08:00',
    time_display: '15:15',
    category: 'industry',
    category_name: '行业',
    is_important: false,
    importance_level: 3,
    source: '行业研究',
    title: '光伏产业链价格企稳 行业景气度回升',
    summary: '近期光伏产业链价格企稳，硅料、硅片价格止跌回升。随着下游需求回暖，行业景气度有望持续回升。',
    content: '近期光伏产业链价格企稳，硅料、硅片价格止跌回升。随着下游需求回暖，行业景气度有望持续回升。分析师认为，2025年全球光伏装机需求将保持增长，产业链盈利能力有望改善。',
    related_stocks: ['光伏', '隆基绿能', '通威股份'],
    tags: ['光伏', '新能源', '产业链']
  },
  {
    id: 'news_202502091500_040',
    timestamp: '2025-02-09T15:00:00+08:00',
    time_display: '15:00',
    category: 'fund',
    category_name: '基金',
    is_important: false,
    importance_level: 2,
    source: '基金业协会',
    title: '公募基金规模突破28万亿元 创历史新高',
    summary: '中国公募基金规模突破28万亿元，创历史新高。其中，股票型基金规模增长明显，显示投资者风险偏好回升。',
    content: '中国公募基金规模突破28万亿元，创历史新高。其中，股票型基金规模增长明显，显示投资者风险偏好回升。ETF基金持续受追捧，规模突破2万亿元，成为市场重要增量资金。',
    related_stocks: ['公募基金', 'ETF'],
    tags: ['基金', '规模', '创新高']
  },
  // 2月8日资讯
  {
    id: 'news_202502081600_041',
    timestamp: '2025-02-08T16:00:00+08:00',
    time_display: '16:00',
    category: 'policy',
    category_name: '政策',
    is_important: true,
    importance_level: 5,
    source: '工信部',
    title: '工信部：加快推进制造业数字化转型',
    summary: '工信部印发《制造业数字化转型行动方案》，提出到2027年，规模以上制造业企业数字化研发设计工具普及率达到90%以上。',
    content: '工信部印发《制造业数字化转型行动方案》，提出到2027年，规模以上制造业企业数字化研发设计工具普及率达到90%，关键工序数控化率达到75%。方案明确将加大财税支持，推动制造业高端化、智能化、绿色化发展。',
    related_stocks: ['工业软件', '智能制造', '工业互联网'],
    tags: ['政策', '制造业', '数字化']
  },
  {
    id: 'news_202502081545_042',
    timestamp: '2025-02-08T15:45:00+08:00',
    time_display: '15:45',
    category: 'stock',
    category_name: '股市',
    is_important: false,
    importance_level: 3,
    source: '市场分析',
    title: '港股龙年首个交易日大涨 恒生科技指数涨超4%',
    summary: '港股龙年首个交易日大涨，恒生指数涨2.8%，恒生科技指数涨超4%。科技股、消费股领涨，市场情绪积极。',
    content: '港股龙年首个交易日大涨，恒生指数涨2.8%，恒生科技指数涨超4%。科技股、消费股领涨，腾讯、阿里、美团等科技股涨幅明显。南向资金净流入超60亿港元，显示内地资金对港股信心增强。',
    related_stocks: ['恒生指数', '科技股', '港股'],
    tags: ['港股', '恒生科技', '上涨']
  },
  {
    id: 'news_202502081530_043',
    timestamp: '2025-02-08T15:30:00+08:00',
    time_display: '15:30',
    category: 'company',
    category_name: '公司',
    is_important: true,
    importance_level: 4,
    source: '公告',
    title: '宁德时代发布神行超充电池 充电10分钟续航400公里',
    summary: '宁德时代发布神行超充电池，实现充电10分钟续航400公里，预计2025年量产装车，将大幅提升电动车使用体验。',
    content: '宁德时代发布神行超充电池，采用最新磷酸铁锂技术，实现充电10分钟续航400公里，预计2025年量产装车。该电池在低温性能、安全性等方面均有突破，将大幅提升电动车使用体验，加速电动车普及。',
    related_stocks: ['宁德时代', '锂电池', '新能源汽车'],
    tags: ['电池', '快充', '技术突破']
  },
  {
    id: 'news_202502081515_044',
    timestamp: '2025-02-08T15:15:00+08:00',
    time_display: '15:15',
    category: 'metal',
    category_name: '黄金',
    is_important: false,
    importance_level: 2,
    source: '市场数据',
    title: '伦铜创近两年新高 全球需求复苏支撑价格',
    summary: '伦敦铜价创近两年新高，突破9000美元/吨。全球经济复苏预期增强，铜需求前景改善支撑价格上行。',
    content: '伦敦铜价创近两年新高，突破9000美元/吨。全球经济复苏预期增强，铜需求前景改善支撑价格上行。同时，全球铜矿供应紧张，库存处于低位，供需格局偏紧支撑铜价维持高位。',
    related_stocks: ['铜', '有色金属', '江西铜业'],
    tags: ['铜', '有色金属', '价格上涨']
  },
  {
    id: 'news_202502081500_045',
    timestamp: '2025-02-08T15:00:00+08:00',
    time_display: '15:00',
    category: 'exchange',
    category_name: '交易所',
    is_important: false,
    importance_level: 3,
    source: '港交所',
    title: '港交所：优化互联互通机制 扩大标的范围',
    summary: '港交所宣布优化互联互通机制，扩大港股通、沪深股通标的范围，进一步提升两地市场互联互通水平。',
    content: '港交所宣布优化互联互通机制，扩大港股通、沪深股通标的范围，纳入更多优质中小企业，进一步提升两地市场互联互通水平。同时，优化交易机制，提升交易效率，为投资者提供更多投资选择。',
    related_stocks: ['港交所', '互联互通', '港股通'],
    tags: ['港交所', '互联互通', '标的扩容']
  }
];

// 获取资讯列表
app.get('/api/news', (req, res) => {
  const { page = 1, size = 20, important, category } = req.query;
  
  // 筛选数据
  let filteredData = [...newsData];
  
  if (important === 'true') {
    filteredData = filteredData.filter(item => item.is_important);
  }
  
  if (category) {
    filteredData = filteredData.filter(item => item.category === category);
  }
  
  // 按时间倒序排列
  filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // 分页
  const pageNum = parseInt(page);
  const pageSize = parseInt(size);
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const list = filteredData.slice(start, end);
  
  res.json({
    success: true,
    data: {
      list,
      total: filteredData.length,
      hasMore: end < filteredData.length,
      lastUpdate: new Date().toISOString()
    }
  });
});

// 获取资讯详情
app.get('/api/news/:id', (req, res) => {
  const { id } = req.params;
  const news = newsData.find(item => item.id === id);
  
  if (news) {
    res.json({
      success: true,
      data: news
    });
  } else {
    res.status(404).json({
      success: false,
      error: '资讯不存在',
      code: 404
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});