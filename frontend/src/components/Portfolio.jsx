import React, { useState, useEffect } from 'react';

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('default');
  const [portfolioData, setPortfolioData] = useState(null);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // 导出确认弹窗状态
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exportUrl, setExportUrl] = useState('');

  // 获取所有投资组合
  const fetchPortfolios = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/portfolios');
      if (response.ok) {
        const result = await response.json();
        setPortfolios(result.data);
      }
    } catch (error) {
      console.error('获取投资组合失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取选中的投资组合详情
  const fetchPortfolioDetail = async (name) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/portfolio/${name}`);
      if (response.ok) {
        const result = await response.json();
        setPortfolioData(result.data);
      }
    } catch (error) {
      console.error('获取投资组合详情失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新的投资组合
  const createPortfolio = async () => {
    if (!newPortfolioName.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newPortfolioName.trim(),
          stocks: [],
          funds: [],
          metals: []
        })
      });
      
      if (response.ok) {
        setNewPortfolioName('');
        await fetchPortfolios();
      }
    } catch (error) {
      console.error('创建投资组合失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除投资组合
  const deletePortfolio = async (name) => {
    if (name === 'default') return;
    
    if (!window.confirm(`确定要删除投资组合 "${name}" 吗？`)) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/portfolio/${name}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchPortfolios();
        if (selectedPortfolio === name) {
          setSelectedPortfolio('default');
          await fetchPortfolioDetail('default');
        }
      }
    } catch (error) {
      console.error('删除投资组合失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 添加股票到投资组合
  const addStockToPortfolio = async (code, name, quantity, purchasePrice) => {
    if (!portfolioData) return;
    
    const updatedStocks = [...portfolioData.stocks, { code, name, quantity, purchasePrice }];
    await updatePortfolio({
      ...portfolioData,
      stocks: updatedStocks
    });
  };

  // 更新投资组合
  const updatePortfolio = async (updatedData) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });
      
      if (response.ok) {
        await fetchPortfolioDetail(updatedData.name);
      }
    } catch (error) {
      console.error('更新投资组合失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchPortfolios();
  }, []);

  // 当选中的投资组合改变时，获取详情
  useEffect(() => {
    if (selectedPortfolio) {
      fetchPortfolioDetail(selectedPortfolio);
    }
  }, [selectedPortfolio]);

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="portfolio">
      <h2>投资组合管理</h2>
      
      {/* 投资组合列表和创建 */}
      <div className="portfolio-management">
        <div className="portfolio-list">
          <h3>我的投资组合</h3>
          <ul>
            {portfolios.map(portfolio => (
              <li key={portfolio.name}>
                <button
                  className={`portfolio-item ${selectedPortfolio === portfolio.name ? 'active' : ''}`}
                  onClick={() => setSelectedPortfolio(portfolio.name)}
                >
                  {portfolio.name}
                </button>
                {portfolio.name !== 'default' && (
                  <button
                    className="delete-portfolio"
                    onClick={() => deletePortfolio(portfolio.name)}
                  >
                    删除
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="create-portfolio">
          <h3>创建新投资组合</h3>
          <div className="create-form">
            <input
              type="text"
              placeholder="投资组合名称"
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
            />
            <button onClick={createPortfolio} disabled={!newPortfolioName.trim()}>
              创建
            </button>
          </div>
        </div>
      </div>

      {/* 投资组合详情 */}
      {portfolioData && (
        <div className="portfolio-detail">
          <div className="portfolio-header">
            <h3>{portfolioData.name} 详情</h3>
            <button 
              className="export-button excel"
              onClick={() => {
                setExportUrl(`http://localhost:3001/api/export/portfolio/${portfolioData.name}/excel`);
                setShowConfirmModal(true);
              }}
            >
              导出Excel
            </button>
          </div>
          
          {/* 股票持仓 */}
          <div className="portfolio-section">
            <h4>股票持仓</h4>
            {portfolioData.stocks.length > 0 ? (
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>代码</th>
                    <th>名称</th>
                    <th>数量</th>
                    <th>买入价</th>
                    <th>持仓市值</th>
                    <th>盈亏</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.stocks.map((stock, index) => (
                    <tr key={index}>
                      <td>{stock.code}</td>
                      <td>{stock.name}</td>
                      <td>{stock.quantity}</td>
                      <td>{stock.purchasePrice.toFixed(2)}</td>
                      <td>{(stock.quantity * stock.purchasePrice).toFixed(2)}</td>
                      <td className="profit">+0.00</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-message">暂无股票持仓</p>
            )}
          </div>

          {/* 基金持仓 */}
          <div className="portfolio-section">
            <h4>基金持仓</h4>
            {portfolioData.funds.length > 0 ? (
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>代码</th>
                    <th>名称</th>
                    <th>数量</th>
                    <th>买入价</th>
                    <th>持仓市值</th>
                    <th>盈亏</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.funds.map((fund, index) => (
                    <tr key={index}>
                      <td>{fund.code}</td>
                      <td>{fund.name}</td>
                      <td>{fund.quantity}</td>
                      <td>{fund.purchasePrice.toFixed(2)}</td>
                      <td>{(fund.quantity * fund.purchasePrice).toFixed(2)}</td>
                      <td className="profit">+0.00</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-message">暂无基金持仓</p>
            )}
          </div>

          {/* 金属持仓 */}
          <div className="portfolio-section">
            <h4>金属持仓</h4>
            {portfolioData.metals.length > 0 ? (
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>代码</th>
                    <th>名称</th>
                    <th>数量</th>
                    <th>买入价</th>
                    <th>持仓市值</th>
                    <th>盈亏</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.metals.map((metal, index) => (
                    <tr key={index}>
                      <td>{metal.code}</td>
                      <td>{metal.name}</td>
                      <td>{metal.quantity}</td>
                      <td>{metal.purchasePrice.toFixed(2)}</td>
                      <td>{(metal.quantity * metal.purchasePrice).toFixed(2)}</td>
                      <td className="profit">+0.00</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-message">暂无金属持仓</p>
            )}
          </div>
        </div>
      )}

      {/* 导出确认弹窗 */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>确认导出</h3>
            <p>是否继续导出Excel？</p>
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

export default Portfolio;