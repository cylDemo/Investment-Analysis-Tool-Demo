import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const FundDetail = ({ data, advice }) => {
  // 获取所有可用的年份
  const years = Object.keys(data.history).sort().reverse();
  // 默认选择最新的年份
  const [selectedYear, setSelectedYear] = useState(years[0]);

  // 根据选择的年份获取历史数据
  const getChartData = () => {
    const yearData = data.history[selectedYear];
    return {
      labels: yearData.map(item => item.date),
      datasets: [
        {
          label: '净值',
          data: yearData.map(item => item.nav),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: '历史净值走势'
      }
    }
  };

  return (
    <div className="fund-detail">
      <h2>{data.name} ({data.code})</h2>
      
      <div className="basic-info">
        <div className="info-item">
          <span className="label">最新净值：</span>
          <span className="value">{data.nav}元</span>
        </div>
        <div className="info-item">
          <span className="label">日涨跌幅：</span>
          <span className={`value ${data.dayGrowth >= 0 ? 'positive' : 'negative'}`}>
            {data.dayGrowth >= 0 ? '+' : ''}{data.dayGrowth}%
          </span>
        </div>
        <div className="info-item">
          <span className="label">基金经理：</span>
          <span className="value">{data.fundManager}</span>
        </div>
      </div>

      <div className="performance-indicators">
        <h3>业绩指标</h3>
        <div className="indicator-grid">
          <div className="indicator-item">
            <span className="indicator-label">近一周：</span>
            <span className={`indicator-value ${data.weekGrowth >= 0 ? 'positive' : 'negative'}`}>
              {data.weekGrowth >= 0 ? '+' : ''}{data.weekGrowth}%
            </span>
          </div>
          <div className="indicator-item">
            <span className="indicator-label">近一月：</span>
            <span className={`indicator-value ${data.monthGrowth >= 0 ? 'positive' : 'negative'}`}>
              {data.monthGrowth >= 0 ? '+' : ''}{data.monthGrowth}%
            </span>
          </div>
          <div className="indicator-item">
            <span className="indicator-label">近一年：</span>
            <span className={`indicator-value ${data.yearGrowth >= 0 ? 'positive' : 'negative'}`}>
              {data.yearGrowth >= 0 ? '+' : ''}{data.yearGrowth}%
            </span>
          </div>
        </div>
      </div>

      <div className="fund-description">
        <h3>基金简介</h3>
        <p>{data.description}</p>
      </div>

      <div className="nav-chart">
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
        <Line data={getChartData()} options={chartOptions} />
      </div>

      <div className="investment-advice">
        <h3>投资建议</h3>
        <p className="advice-text">{advice}</p>
      </div>
    </div>
  );
};

export default FundDetail;