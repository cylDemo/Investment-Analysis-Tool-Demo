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
import LoginOverlay from './LoginOverlay';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MetalDetail = ({ data, isLoggedIn, onLogin }) => {
  // 获取所有可用的年份
  const years = Object.keys(data.history).sort().reverse();
  // 默认选择最新的年份
  const [selectedYear, setSelectedYear] = useState(years[0]);
  
  // 获取选中年份的所有可用月份
  const months = Object.keys(data.history[selectedYear]).sort().reverse();
  // 默认选择最新的月份
  const [selectedMonth, setSelectedMonth] = useState(months[0]);

  // 根据选择的年份和月份获取历史数据
  const getChartData = () => {
    const monthData = data.history[selectedYear][selectedMonth];
    return {
      labels: monthData.map(item => item.date),
      datasets: [
        {
          label: `${data.name}价格`,
          data: monthData.map(item => item.price),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
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
        text: `${data.name}价格走势（按天）`
      }
    }
  };

  return (
    <div className="metal-detail" style={{ position: 'relative' }}>
      <h2>{data.name} ({data.code})</h2>

      <div className="basic-info">
        <div className="info-item">
          <span className="label">当前价格：</span>
          <span className="value">{data.price}{data.unit}</span>
        </div>
        <div className="info-item">
          <span className="label">涨跌幅：</span>
          <span className={`value ${data.changePercent >= 0 ? 'positive' : 'negative'}`}>
            {data.changePercent >= 0 ? '+' : ''}{data.changePercent}%
          </span>
        </div>
      </div>

      <div className="metal-description">
        <h3>{data.name}简介</h3>
        <p>{data.description}</p>
      </div>

      <div className="price-chart">
        <div className="year-month-selector">
          <div className="year-selector">
            <label htmlFor="year">选择年份：</label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                // 重置月份为新选中年份的最新月份
                const newMonths = Object.keys(data.history[e.target.value]).sort().reverse();
                setSelectedMonth(newMonths[0]);
              }}
              className="year-select"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
          </div>
          <div className="month-selector">
            <label htmlFor="month">选择月份：</label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-select"
            >
              {months.map(month => (
                <option key={month} value={month}>
                  {month}月
                </option>
              ))}
            </select>
          </div>
        </div>
        <Line data={getChartData()} options={chartOptions} />
      </div>

      {/* 未登录时显示蒙层 */}
      <LoginOverlay isVisible={!isLoggedIn} onLogin={onLogin} />
    </div>
  );
};

export default MetalDetail;