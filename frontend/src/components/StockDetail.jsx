import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StockDetail = ({ data, advice }) => {
  // 获取所有可用的年份
  const years = Object.keys(data.history).sort().reverse();
  // 默认选择最新的年份
  const [selectedYear, setSelectedYear] = useState(years[0]);
  // 默认选择的技术指标类型
  const [selectedIndicator, setSelectedIndicator] = useState('price'); // price, macd, kdj
  // 导出确认弹窗状态
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exportType, setExportType] = useState('');
  const [exportUrl, setExportUrl] = useState('');

  // 根据选择的年份获取历史数据
  const getChartData = () => {
    const yearData = data.history[selectedYear];
    
    switch (selectedIndicator) {
      case 'macd':
        // 检查是否有技术指标数据
        if (data.technicalIndicators && data.technicalIndicators.macd) {
          // 获取当前年份的数据索引范围
          const allHistoricalData = [];
          Object.keys(data.history).forEach(year => {
            // 确保每个年份内的日期也是按顺序排列的
            const sortedYearData = [...data.history[year]].sort((a, b) => new Date(a.date) - new Date(b.date));
            sortedYearData.forEach(item => {
              allHistoricalData.push(item);
            });
          });
          allHistoricalData.sort((a, b) => new Date(a.date) - new Date(b.date));
          
          // 确保yearData也是按日期排序的
          const sortedYearData = [...yearData].sort((a, b) => new Date(a.date) - new Date(b.date));
          
          // 计算索引，确保不会返回-1
          let startIndex = allHistoricalData.findIndex(item => item.date === sortedYearData[0].date);
          let endIndex = allHistoricalData.findIndex(item => item.date === sortedYearData[sortedYearData.length - 1].date);
          
          // 如果没有找到精确匹配的日期，使用合理的默认值
          if (startIndex === -1) startIndex = 0;
          if (endIndex === -1) endIndex = allHistoricalData.length - 1;
          
          // 确保索引在有效范围内
          startIndex = Math.max(0, startIndex);
          endIndex = Math.min(allHistoricalData.length - 1, endIndex);
          
          // 提取当前年份的MACD数据
          const macdData = data.technicalIndicators.macd;
          let dif = macdData.dif.slice(startIndex, endIndex + 1);
          let dea = macdData.dea.slice(startIndex, endIndex + 1);
          let hist = macdData.hist.slice(startIndex, endIndex + 1);
          
          // 确保标签与排序后的数据匹配
          const sortedLabels = sortedYearData.map(item => item.date);
          
          // 确保数据长度与标签长度匹配
          if (dif.length > sortedLabels.length) {
            dif = dif.slice(0, sortedLabels.length);
            dea = dea.slice(0, sortedLabels.length);
            hist = hist.slice(0, sortedLabels.length);
          }
          
          return {
            labels: sortedLabels,
            datasets: [
              {
                label: 'DIF',
                data: dif,
                borderColor: '#3b82f6',
                backgroundColor: 'transparent',
                tension: 0.4
              },
              {
                label: 'DEA',
                data: dea,
                borderColor: '#ef4444',
                backgroundColor: 'transparent',
                tension: 0.4
              },
              {
                label: 'MACD',
                data: hist,
                type: 'bar',
                backgroundColor: hist.map(value => value >= 0 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
                borderColor: 'transparent'
              }
            ]
          };
        }
        // 如果没有MACD数据，返回默认价格数据
        const sortedYearData = [...yearData].sort((a, b) => new Date(a.date) - new Date(b.date));
        const sortedLabels = sortedYearData.map(item => item.date);
        return {
          labels: sortedLabels,
          datasets: [
            {
              label: '股价',
              data: sortedYearData.map(item => item.price),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        };
        
      case 'kdj':
        // 检查是否有技术指标数据
        if (data.technicalIndicators && data.technicalIndicators.kdj) {
          // 获取当前年份的数据索引范围
          const allHistoricalData = [];
          Object.keys(data.history).forEach(year => {
            // 确保每个年份内的日期也是按顺序排列的
            const sortedYearData = [...data.history[year]].sort((a, b) => new Date(a.date) - new Date(b.date));
            sortedYearData.forEach(item => {
              allHistoricalData.push(item);
            });
          });
          allHistoricalData.sort((a, b) => new Date(a.date) - new Date(b.date));
          
          // 确保yearData也是按日期排序的
          const sortedYearData = [...yearData].sort((a, b) => new Date(a.date) - new Date(b.date));
          
          // 计算索引，确保不会返回-1
          let startIndex = allHistoricalData.findIndex(item => item.date === sortedYearData[0].date);
          let endIndex = allHistoricalData.findIndex(item => item.date === sortedYearData[sortedYearData.length - 1].date);
          
          // 如果没有找到精确匹配的日期，使用合理的默认值
          if (startIndex === -1) startIndex = 0;
          if (endIndex === -1) endIndex = allHistoricalData.length - 1;
          
          // 确保索引在有效范围内
          startIndex = Math.max(0, startIndex);
          endIndex = Math.min(allHistoricalData.length - 1, endIndex);
          
          // 提取当前年份的KDJ数据
          const kdjData = data.technicalIndicators.kdj;
          const k = kdjData.k.slice(startIndex, endIndex + 1);
          const d = kdjData.d.slice(startIndex, endIndex + 1);
          const j = kdjData.j.slice(startIndex, endIndex + 1);
          
          // 确保标签与排序后的数据匹配
          const sortedLabels = sortedYearData.map(item => item.date);
          
          // 确保数据长度与标签长度匹配
          const adjustedK = k.slice(0, sortedLabels.length);
          const adjustedD = d.slice(0, sortedLabels.length);
          const adjustedJ = j.slice(0, sortedLabels.length);
          
          return {
            labels: sortedLabels,
            datasets: [
              {
                label: 'K线',
                data: adjustedK,
                borderColor: '#3b82f6',
                backgroundColor: 'transparent',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 1,
                pointHoverRadius: 4
              },
              {
                label: 'D线',
                data: adjustedD,
                borderColor: '#ef4444',
                backgroundColor: 'transparent',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 1,
                pointHoverRadius: 4
              },
              {
                label: 'J线',
                data: adjustedJ,
                borderColor: '#10b981',
                backgroundColor: 'transparent',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 1,
                pointHoverRadius: 4
              }
            ]
          };
        }
        // 如果没有KDJ数据，返回默认价格数据
        return {
          labels,
          datasets: [
            {
              label: '股价',
              data: yearData.map(item => item.price),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        };
        
      case 'price':
      default:
        return {
          labels: yearData.map(item => item.date),
          datasets: [
            {
              label: '股价',
              data: yearData.map(item => item.price),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        };
    }
  };

  const chartData = getChartData();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: selectedIndicator === 'price' ? '历史股价走势' : 
              selectedIndicator === 'macd' ? 'MACD指标' : 'KDJ指标'
      }
    },
    scales: {
      y: {
        beginAtZero: selectedIndicator === 'macd'
      }
    }
  };

  return (
    <div className="stock-detail">
      <h2>{data.name} ({data.code})</h2>
      
      <div className="basic-info">
        <div className="info-item">
          <span className="label">当前价格：</span>
          <span className="value">{data.price}元</span>
        </div>
        <div className="info-item">
          <span className="label">涨跌幅：</span>
          <span className={`value ${data.changePercent >= 0 ? 'positive' : 'negative'}`}>
            {data.changePercent >= 0 ? '+' : ''}{data.changePercent}%
          </span>
        </div>
      </div>

      <div className="stock-basic-info">
        <h3>股票基本信息</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">所属行业：</span>
            <span className="value">{data.industry}</span>
          </div>
          <div className="info-item">
            <span className="label">主营业务：</span>
            <span className="value">{data.mainBusiness}</span>
          </div>
          <div className="info-item">
            <span className="label">主要产品：</span>
            <span className="value">{data.mainProducts}</span>
          </div>
        </div>
      </div>

      <div className="valuation-indicators">
        <h3>估值指标</h3>
        <div className="indicator-grid">
          <div className="indicator-item">
            <span className="indicator-label">市盈率（PE）：</span>
            <span className="indicator-value">{data.pe}</span>
          </div>
          <div className="indicator-item">
            <span className="indicator-label">市净率（PB）：</span>
            <span className="indicator-value">{data.pb}</span>
          </div>
          <div className="indicator-item">
            <span className="indicator-label">净资产收益率（ROE）：</span>
            <span className="indicator-value">{data.roe}%</span>
          </div>
          <div className="indicator-item">
            <span className="indicator-label">1/PE（收益率）：</span>
            <span className="indicator-value">{data.pe > 0 ? (100 / data.pe).toFixed(2) : 'N/A'}%</span>
          </div>
        </div>
      </div>

      <div className="financial-statements">
        <h3>财务报表</h3>
        
        <div className="balance-sheet">
          <h4>资产负债表</h4>
          <div className="indicator-grid">
            <div className="indicator-item">
              <span className="indicator-label">总资产（万元）：</span>
              <span className="indicator-value">{data.financials.balanceSheet.totalAssets}</span>
            </div>
            <div className="indicator-item">
              <span className="indicator-label">总负债（万元）：</span>
              <span className="indicator-value">{data.financials.balanceSheet.totalLiabilities}</span>
            </div>
            <div className="indicator-item">
              <span className="indicator-label">所有者权益（万元）：</span>
              <span className="indicator-value">{data.financials.balanceSheet.totalEquity}</span>
            </div>
            <div className="indicator-item">
              <span className="indicator-label">货币资金（万元）：</span>
              <span className="indicator-value">{data.financials.balanceSheet.cash}</span>
            </div>
            {data.financials.balanceSheet.loans && (
              <div className="indicator-item">
                <span className="indicator-label">贷款总额（万元）：</span>
                <span className="indicator-value">{data.financials.balanceSheet.loans}</span>
              </div>
            )}
            {data.financials.balanceSheet.inventory && (
              <div className="indicator-item">
                <span className="indicator-label">存货（万元）：</span>
                <span className="indicator-value">{data.financials.balanceSheet.inventory}</span>
              </div>
            )}
          </div>
        </div>

        <div className="income-statement">
          <h4>利润表</h4>
          <div className="indicator-grid">
            <div className="indicator-item">
              <span className="indicator-label">营业收入（万元）：</span>
              <span className="indicator-value">{data.financials.incomeStatement.revenue}</span>
            </div>
            <div className="indicator-item">
              <span className="indicator-label">净利润（万元）：</span>
              <span className="indicator-value">{data.financials.incomeStatement.netProfit}</span>
            </div>
            {data.financials.incomeStatement.grossProfit && (
              <div className="indicator-item">
                <span className="indicator-label">毛利润（万元）：</span>
                <span className="indicator-value">{data.financials.incomeStatement.grossProfit}</span>
              </div>
            )}
            {data.financials.incomeStatement.interestIncome && (
              <div className="indicator-item">
                <span className="indicator-label">利息收入（万元）：</span>
                <span className="indicator-value">{data.financials.incomeStatement.interestIncome}</span>
              </div>
            )}
            {data.financials.incomeStatement.nonInterestIncome && (
              <div className="indicator-item">
                <span className="indicator-label">非利息收入（万元）：</span>
                <span className="indicator-value">{data.financials.incomeStatement.nonInterestIncome}</span>
              </div>
            )}
          </div>
        </div>

        <div className="cash-flow">
          <h4>现金流表</h4>
          <div className="indicator-grid">
            <div className="indicator-item">
              <span className="indicator-label">经营活动现金流（万元）：</span>
              <span className="indicator-value">{data.financials.cashFlow.operatingCashFlow}</span>
            </div>
            <div className="indicator-item">
              <span className="indicator-label">投资活动现金流（万元）：</span>
              <span className="indicator-value">{data.financials.cashFlow.investingCashFlow}</span>
            </div>
            <div className="indicator-item">
              <span className="indicator-label">筹资活动现金流（万元）：</span>
              <span className="indicator-value">{data.financials.cashFlow.financingCashFlow}</span>
            </div>
            <div className="indicator-item">
              <span className="indicator-label">净现金流（万元）：</span>
              <span className="indicator-value">{data.financials.cashFlow.netCashFlow}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="company-description">
        <h3>公司简介</h3>
        <p>{data.description}</p>
      </div>

      <div className="price-chart">
        <div className="chart-controls">
          <div className="year-selector">
            <label htmlFor="year">选择年份：</label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="year-select"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
          </div>
          <div className="indicator-selector">
            <label htmlFor="indicator">技术指标：</label>
            <select
              id="indicator"
              value={selectedIndicator}
              onChange={(e) => setSelectedIndicator(e.target.value)}
              className="indicator-select"
            >
              <option value="price">价格走势</option>
              <option value="macd">MACD指标</option>
              <option value="kdj">KDJ指标</option>
            </select>
          </div>
        </div>
        {selectedIndicator === 'macd' ? (
          <>
            <Line data={chartData} options={chartOptions} />
            <div className="indicator-description">
              <h4>MACD指标说明：</h4>
              <p>MACD（Moving Average Convergence Divergence）是一种趋势跟踪指标，由DIF、DEA和MACD柱状图组成。</p>
              <ul>
                <li>DIF：快速移动平均线与慢速移动平均线的差值</li>
                <li>DEA：DIF的移动平均线</li>
                <li>MACD柱状图：(DIF - DEA) * 2</li>
              </ul>
              <p>使用方法：当DIF上穿DEA时，形成金叉，为买入信号；当DIF下穿DEA时，形成死叉，为卖出信号。</p>
            </div>
          </>
        ) : selectedIndicator === 'kdj' ? (
          <>
            <Line data={chartData} options={chartOptions} />
            <div className="indicator-description">
              <h4>KDJ指标说明：</h4>
              <p>KDJ是一种动量指标，由K、D、J三条曲线组成，用于判断股票的超买超卖状态。</p>
              <ul>
                <li>K线：快速确认线，反应敏捷，但容易出错</li>
                <li>D线：慢速主干线，稳重可靠</li>
                <li>J线：方向敏感线，最强劲</li>
              </ul>
              <p>使用方法：KDJ值在0-100之间，当KDJ值大于80时，为超买状态，可能下跌；当KDJ值小于20时，为超卖状态，可能上涨。</p>
            </div>
          </>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      <div className="investment-advice">
        <h3>投资建议</h3>
        <pre className="advice-text">{advice}</pre>
      </div>

      <div className="export-section">
        <h3>数据导出</h3>
        <div className="export-buttons">
          <button 
            className="export-button pdf"
            onClick={() => {
              setExportType('PDF');
              setExportUrl(`http://localhost:3001/api/export/stock/${data.code}/pdf`);
              setShowConfirmModal(true);
            }}
          >
            导出PDF
          </button>
          <button 
            className="export-button excel"
            onClick={() => {
              setExportType('Excel');
              setExportUrl(`http://localhost:3001/api/export/stock/${data.code}/excel`);
              setShowConfirmModal(true);
            }}
          >
            导出Excel
          </button>
        </div>
      </div>

      {/* 导出确认弹窗 */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>确认导出</h3>
            <p>是否继续导出{exportType}？</p>
            <div className="modal-buttons">
              <button 
                className="modal-button cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                取消
              </button>
              <button 
                className="modal-button confirm"
                onClick={() => {
                  // 使用隐藏的a标签触发下载，保持页面状态
                  const link = document.createElement('a');
                  link.href = exportUrl;
                  link.download = ''; // 强制浏览器下载文件
                  link.rel = 'noopener noreferrer';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setShowConfirmModal(false);
                }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDetail;