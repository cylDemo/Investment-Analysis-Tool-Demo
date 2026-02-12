import { useState, useEffect } from 'react';
import './App.css';
import StockDetail from './components/StockDetail';
import FundDetail from './components/FundDetail';
import MetalDetail from './components/MetalDetail';
import Login from './components/Login';
import Settings from './components/Settings';
import MarketNews from './components/MarketNews';
import logo from './assets/Logo_2.png';

function App() {
  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // 从localStorage中读取登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  // 从localStorage中读取昵称
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('nickname') || '';
  });
  // 从localStorage中读取语言设置
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'zh-CN';
  });
  // 资源管理模块显示/隐藏设置
  const [resourceSettings, setResourceSettings] = useState(() => {
    const saved = localStorage.getItem('resourceSettings');
    return saved ? JSON.parse(saved) : {
      stockRecommendation: true,
      stockRanking: true,
      fundRecommendation: true,
      fundRanking: true
    };
  });
  const [activeTab, setActiveTab] = useState('stock');
  const [activeNavTab, setActiveNavTab] = useState('stock');
  const [code, setCode] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [data, setData] = useState(null);
  const [advice, setAdvice] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [recommendationCode, setRecommendationCode] = useState('');
  const [recommendationResult, setRecommendationResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metalLoading, setMetalLoading] = useState(false);
  
  // 退出登录确认弹窗状态
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // 登出成功消息提示状态
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  
  // 登录成功处理
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    // 将登录状态保存到localStorage中
    localStorage.setItem('isLoggedIn', 'true');
  };
  
  // 显示退出登录确认弹窗
  const handleShowLogoutModal = () => {
    setShowLogoutModal(true);
  };
  
  // 取消退出登录
  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };
  
  // 确认退出登录
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    
    // 执行退出操作
    setIsLoggedIn(false);
    // 清除localStorage中的登录状态
    localStorage.removeItem('isLoggedIn');
    
    // 重置所有状态
    setActiveTab('stock');
    setActiveNavTab('stock');
    setCode('');
    setShowDetail(false);
    setData(null);
    setAdvice('');
    setRecommendationCode('');
    setRecommendationResult('');
    
    // 显示登出成功消息
    setShowLogoutToast(true);
    
    // 2秒后自动隐藏消息
    setTimeout(() => {
      setShowLogoutToast(false);
    }, 2000);
  };

  const handleSearch = async (metalCode = null, searchCode = null, searchTab = null) => {
    // 使用传入的搜索代码和标签类型，如果没有则使用当前状态
    const currentCode = searchCode || code;
    const currentTab = searchTab || activeTab;
    
    // 对于金属标签，使用传入的metalCode或currentTab
    const currentMetalCode = metalCode || currentTab;
    
    // 对于股票和基金，需要code
    if (!currentCode && !['gold', 'silver', 'copper', 'platinum', 'lead'].includes(currentMetalCode)) return;

    try {
      let response;
      // 检查是否是金属代码
      if (['gold', 'silver', 'copper', 'platinum', 'lead'].includes(currentMetalCode)) {
        // 金属标签：使用传入的metalCode或currentTab
        response = await fetch(`http://localhost:3001/api/metal/${currentMetalCode}`);
      } else if (currentTab === 'stock') {
        response = await fetch(`http://localhost:3001/api/stock/${currentCode}`);
      } else if (currentTab === 'fund') {
        response = await fetch(`http://localhost:3001/api/fund/${currentCode}`);
      }

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        
        // 更新状态，确保UI显示正确的代码和标签
        if (searchCode) setCode(searchCode);
        if (searchTab) setActiveTab(searchTab);
        
        // 金属标签不需要投资建议
        if (!['gold', 'silver', 'copper', 'platinum', 'lead'].includes(currentTab)) {
          // 获取投资建议
          const adviceResponse = await fetch('http://localhost:3001/api/advice', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: currentTab, code: currentCode })
          });

          if (adviceResponse.ok) {
            const adviceResult = await adviceResponse.json();
            setAdvice(adviceResult.data.advice);
          }
        }

        // 无论什么情况都设置showDetail为true
        setShowDetail(true);
        
        // 滚动到页面顶部，确保结果页显示在最上部
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const errorResult = await response.json();
        alert(errorResult.error || '未找到该代码的数据');
      }
    } catch (error) {
      console.error('搜索出错:', error);
      alert('搜索失败，请稍后重试');
    }
  };

  const handleReset = () => {
    setCode('');
    setShowDetail(false);
    setData(null);
    setAdvice('');
    // 根据当前导航tab设置不同的重置状态
    if (activeNavTab === 'stock') {
      setActiveTab('stock');
    } else if (activeNavTab === 'fund') {
      setActiveTab('fund');
    } else if (activeNavTab === 'metal') {
      setActiveTab('gold');
    }
  };

  // 返回首页并刷新
  const handleGoHome = () => {
    setActiveTab('stock');
    setActiveNavTab('stock');
    setShowDetail(false);
    setCode('');
    setData(null);
    setAdvice('');
    setRecommendationCode('');
    setRecommendationResult('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInvestmentRecommendation = async () => {
    if (!recommendationCode) return;

    setIsLoading(true);
    setRecommendationResult('');

    try {
      const response = await fetch('http://localhost:3001/api/investment/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: activeTab, code: recommendationCode })
      });

      if (response.ok) {
        const result = await response.json();
        setRecommendationResult(result.data.recommendation);
      } else {
        const errorResult = await response.json();
        alert(errorResult.error || '投资推荐失败');
      }
    } catch (error) {
      console.error('投资推荐出错:', error);
      alert('投资推荐失败，请稍后重试');
    } finally {
    setIsLoading(false);
  }
};



  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      {/* 登出成功消息提示 - 放在最外层确保始终可见 */}
      {showLogoutToast && (
        <div className="logout-toast">
          <div className="logout-toast-content">
            <span className="logout-toast-icon">✓</span>
            <span className="logout-toast-text">登出成功</span>
          </div>
        </div>
      )}
      
      {!isLoggedIn ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <header className="header">
            <div className="header-content">
              <div className="header-brand" onClick={handleGoHome} style={{ cursor: 'pointer' }}>
                <img src={logo} alt="IAT Logo" className="header-logo" />
                <h1>IAT</h1>
              </div>
              <nav className="header-nav">
                <button 
                  className={`nav-tab ${activeNavTab === 'stock' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('stock');
                    setActiveNavTab('stock');
                    setShowDetail(false);
                    setCode('');
                    setRecommendationCode('');
                    setRecommendationResult('');
                  }}
                >
                  股票分析
                </button>
                <button 
                  className={`nav-tab ${activeNavTab === 'fund' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('fund');
                    setActiveNavTab('fund');
                    setShowDetail(false);
                    setCode('');
                    setRecommendationCode('');
                    setRecommendationResult('');
                  }}
                >
                  基金分析
                </button>
                <button 
                  className={`nav-tab ${activeNavTab === 'metal' ? 'active' : ''}`}
                  onClick={async () => {
                    // 如果已经在贵金属页面，不要重复加载
                    if (activeNavTab === 'metal') return;
                    
                    // 先重置showDetail和数据，确保从搜索结果页能正常切换
                    setShowDetail(false);
                    setActiveNavTab('metal');
                    setActiveTab('gold');
                    setCode('gold');
                    // 保留旧数据直到新数据加载完成，避免页面抖动
                    setRecommendationCode('');
                    setRecommendationResult('');
                    setMetalLoading(true);
                    
                    try {
                      const response = await fetch(`http://localhost:3001/api/metal/gold`);
                      if (response.ok) {
                        const result = await response.json();
                        setData(result.data);
                      } else {
                        const errorResult = await response.json();
                        alert(errorResult.error || '未找到黄金的数据');
                      }
                    } catch (error) {
                      console.error('搜索出错:', error);
                      alert('搜索失败，请稍后重试');
                    } finally {
                      setMetalLoading(false);
                    }
                  }}
                >
                  金属行业
                </button>
                <button 
                  className={`nav-tab ${activeNavTab === 'news' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNavTab('news');
                    setShowDetail(false);
                    window.scrollTo({ top: 0, behavior: 'auto' });
                  }}
                >
                  市场资讯
                </button>
                <button
                  className={`nav-tab ${activeNavTab === 'settings' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNavTab('settings');
                    // 重置showDetail，确保从搜索结果页能正常切换到设置
                    setShowDetail(false);
                    // 滚动到页面顶部
                    window.scrollTo({ top: 0, behavior: 'auto' });
                  }}
                  title="设置"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {/* 大齿轮 */}
                    <circle cx="8" cy="8" r="3.5"></circle>
                    <path d="M8 2v2.5M8 11.5V14M2 8h2.5M11.5 8H14M4.3 4.3l1.8 1.8M9.9 9.9l1.8 1.8M4.3 11.7l1.8-1.8M9.9 6.1l1.8-1.8"></path>
                    {/* 小齿轮 */}
                    <circle cx="17" cy="17" r="2.8"></circle>
                    <path d="M17 11v2M17 21v2M11 17h2M21 17h2M13.8 13.8l1.2 1.2M19 19l1.2 1.2M13.8 20.2l1.2-1.2M19 14.6l1.2-1.2"></path>
                  </svg>
                </button>
              </nav>
              <div className="header-actions">
                {nickname && (
                  <span className="header-nickname">{nickname}</span>
                )}
                <button
                  className={`theme-toggle ${darkMode ? 'active' : ''}`}
                  onClick={() => {
                    const newDarkMode = !darkMode;
                    setDarkMode(newDarkMode);
                    // 同步更新 localStorage 中的主题模式
                    localStorage.setItem('themeMode', newDarkMode ? 'dark' : 'light');
                  }}
                  aria-label={darkMode ? '切换到浅色模式' : '切换到深色模式'}
                >
                  {darkMode ? '🌞' : '🌙'}
                </button>
              </div>
            </div>
          </header>

          {/* 退出登录确认弹窗 */}
          {showLogoutModal && (
            <div className="modal-overlay logout-modal-overlay">
              <div className="modal-content logout-modal-content">
                <div className="logout-modal-header">
                  <h3>是否退出登录？</h3>
                </div>
                <div className="logout-modal-body">
                  <p>退出后将需要重新登录才能访问系统</p>
                </div>
                <div className="logout-modal-footer">
                  <button 
                    className="logout-modal-btn cancel"
                    onClick={handleCancelLogout}
                  >
                    取消
                  </button>
                  <button 
                    className="logout-modal-btn confirm"
                    onClick={handleConfirmLogout}
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          )}

          <main className="main">
            {!showDetail && activeNavTab !== 'settings' ? (
              <div className="search-page">


                {activeNavTab === 'metal' && (
                  <div className="metal-selector-container">
                    <div className="tab-selector">
                      <button 
                        className={`tab-button ${activeTab === 'gold' ? 'active' : ''}`}
                        onClick={async () => {
                          if (activeTab === 'gold') return;
                          
                          const metalCode = 'gold';
                          setActiveTab(metalCode);
                          setCode(metalCode);
                          setMetalLoading(true);
                          
                          try {
                            const response = await fetch(`http://localhost:3001/api/metal/${metalCode}`);
                            if (response.ok) {
                              const result = await response.json();
                              setData(result.data);
                            } else {
                              const errorResult = await response.json();
                              alert(errorResult.error || '未找到该金属的数据');
                            }
                          } catch (error) {
                            console.error('搜索出错:', error);
                            alert('搜索失败，请稍后重试');
                          } finally {
                            setMetalLoading(false);
                          }
                        }}
                      >
                        黄金
                      </button>
                      <button 
                        className={`tab-button ${activeTab === 'silver' ? 'active' : ''}`}
                        onClick={async () => {
                          if (activeTab === 'silver') return;
                          
                          const metalCode = 'silver';
                          setActiveTab(metalCode);
                          setCode(metalCode);
                          setMetalLoading(true);
                          
                          try {
                            const response = await fetch(`http://localhost:3001/api/metal/${metalCode}`);
                            if (response.ok) {
                              const result = await response.json();
                              setData(result.data);
                            } else {
                              const errorResult = await response.json();
                              alert(errorResult.error || '未找到该金属的数据');
                            }
                          } catch (error) {
                            console.error('搜索出错:', error);
                            alert('搜索失败，请稍后重试');
                          } finally {
                            setMetalLoading(false);
                          }
                        }}
                      >
                        白银
                      </button>
                      <button 
                        className={`tab-button ${activeTab === 'copper' ? 'active' : ''}`}
                        onClick={async () => {
                          if (activeTab === 'copper') return;
                          
                          const metalCode = 'copper';
                          setActiveTab(metalCode);
                          setCode(metalCode);
                          setMetalLoading(true);
                          
                          try {
                            const response = await fetch(`http://localhost:3001/api/metal/${metalCode}`);
                            if (response.ok) {
                              const result = await response.json();
                              setData(result.data);
                            } else {
                              const errorResult = await response.json();
                              alert(errorResult.error || '未找到该金属的数据');
                            }
                          } catch (error) {
                            console.error('搜索出错:', error);
                            alert('搜索失败，请稍后重试');
                          } finally {
                            setMetalLoading(false);
                          }
                        }}
                      >
                        铜
                      </button>
                      <button 
                        className={`tab-button ${activeTab === 'platinum' ? 'active' : ''}`}
                        onClick={async () => {
                          if (activeTab === 'platinum') return;
                          
                          const metalCode = 'platinum';
                          setActiveTab(metalCode);
                          setCode(metalCode);
                          setMetalLoading(true);
                          
                          try {
                            const response = await fetch(`http://localhost:3001/api/metal/${metalCode}`);
                            if (response.ok) {
                              const result = await response.json();
                              setData(result.data);
                            } else {
                              const errorResult = await response.json();
                              alert(errorResult.error || '未找到该金属的数据');
                            }
                          } catch (error) {
                            console.error('搜索出错:', error);
                            alert('搜索失败，请稍后重试');
                          } finally {
                            setMetalLoading(false);
                          }
                        }}
                      >
                        铂
                      </button>
                      <button 
                        className={`tab-button ${activeTab === 'lead' ? 'active' : ''}`}
                        onClick={async () => {
                          if (activeTab === 'lead') return;
                          
                          const metalCode = 'lead';
                          setActiveTab(metalCode);
                          setCode(metalCode);
                          setMetalLoading(true);
                          
                          try {
                            const response = await fetch(`http://localhost:3001/api/metal/${metalCode}`);
                            if (response.ok) {
                              const result = await response.json();
                              setData(result.data);
                            } else {
                              const errorResult = await response.json();
                              alert(errorResult.error || '未找到该金属的数据');
                            }
                          } catch (error) {
                            console.error('搜索出错:', error);
                            alert('搜索失败，请稍后重试');
                          } finally {
                            setMetalLoading(false);
                          }
                        }}
                      >
                        铅
                      </button>
                    </div>
                    
                    {/* 贵金属加载指示器 */}
                    {metalLoading && (
                      <div className="metal-loading-indicator">
                        <div className="spinner small"></div>
                        <span>加载中...</span>
                      </div>
                    )}
                  </div>
                )}

                {(activeNavTab === 'stock' || activeNavTab === 'fund') && (
                  <>
                    <div className="search-container">
                      <input
                        type="text"
                        className="code-input"
                        placeholder={activeTab === 'stock' ? '请输入股票代码或名称，例如：000001 或 平安银行' : '请输入基金代码或名称，例如：110022 或 易方达消费行业股票'}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                      />
                      <button className="search-button" onClick={handleSearch}>
                        搜索
                      </button>
                      <button className="reset-button" onClick={handleReset}>
                        重置
                      </button>
                    </div>

                    <div className="example-codes">
                      <h3>示例代码：</h3>
                      {activeTab === 'stock' ? (
                        <div>
                          <span className="example-code" onClick={() => setCode('000001')}>000001（平安银行）</span>
                          <span className="example-code" onClick={() => setCode('600519')}>600519（贵州茅台）</span>
                        </div>
                      ) : (
                        <div>
                          <span className="example-code" onClick={() => setCode('110022')}>110022（易方达消费行业股票）</span>
                          <span className="example-code" onClick={() => setCode('000001')}>000001（华夏成长混合）</span>
                        </div>
                      )}
                    </div>

                    {/* 投资推荐功能 */}
                    {((activeNavTab === 'stock' && resourceSettings.stockRecommendation) ||
                      (activeNavTab === 'fund' && resourceSettings.fundRecommendation)) && (
                    <div className="investment-recommendation">
                      <h3>投资推荐</h3>
                      <div className="recommendation-input">
                        <input
                          type="text"
                          className="recommendation-code-input"
                          placeholder={activeTab === 'stock' ? '请输入股票代码，例如：000001' : '请输入基金代码，例如：110022'}
                          value={recommendationCode}
                          onChange={(e) => setRecommendationCode(e.target.value)}
                        />
                        <button
                          className="recommendation-button"
                          onClick={handleInvestmentRecommendation}
                          disabled={!recommendationCode || isLoading}
                        >
                          {isLoading ? '分析中...' : '投资推荐'}
                        </button>
                      </div>
                      {isLoading && (
                        <div className="loading-indicator">
                          <div className="spinner"></div>
                          <p>正在分析数据，请稍候...</p>
                        </div>
                      )}
                      {recommendationResult && (
                        <div className="recommendation-result">
                          <h4>推荐结果</h4>
                          <div className="recommendation-content">{recommendationResult}</div>
                        </div>
                      )}
                    </div>
                    )}

                    {/* 投资排行榜轮播卡片 */}
                    {((activeNavTab === 'stock' && resourceSettings.stockRanking) ||
                      (activeNavTab === 'fund' && resourceSettings.fundRanking)) && (
                    <div className="carousel-section">
                      <h3>投资排行榜</h3>
                      <div className="carousel-container">
                        <div className="carousel-wrapper">
                          <div className="carousel-slide">
                            {activeNavTab === 'stock' && (
                              <>
                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '600519', 'stock');
                                }}>
                                  <div className="card-header">
                                    <h4>贵州茅台 (600519)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 1 名</span>
                                    <span className="yearly-gain positive">年涨幅+28.5%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=maotai%20liquor%20bottles%20luxury%20alcohol%20industry%20investment&image_size=square"
                                      alt="贵州茅台"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前价格:</span>
                                      <span className="value">1789 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">成交量:</span>
                                      <span className="value">1.2亿</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '000001', 'stock');
                                }}>
                                  <div className="card-header">
                                    <h4>平安银行 (000001)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 2 名</span>
                                    <span className="yearly-gain positive">年涨幅+15.8%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=banking%20finance%20building%20investment%20money&image_size=square"
                                      alt="平安银行"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前价格:</span>
                                      <span className="value">12.45 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">成交量:</span>
                                      <span className="value">2.5亿</span>
                                    </div>
                                  </div>
                                </div>

                                {/* 新增股票卡片 1 */}
                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '000858', 'stock');
                                }}>
                                  <div className="card-header">
                                    <h4>五粮液 (000858)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 3 名</span>
                                    <span className="yearly-gain positive">年涨幅+22.3%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wu%20liang%20ye%20liquor%20bottles%20luxury%20alcohol%20industry%20investment&image_size=square"
                                      alt="五粮液"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前价格:</span>
                                      <span className="value">165.8 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">成交量:</span>
                                      <span className="value">8500万</span>
                                    </div>
                                  </div>
                                </div>

                                {/* 新增股票卡片 2 */}
                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '601318', 'stock');
                                }}>
                                  <div className="card-header">
                                    <h4>中国平安 (601318)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 4 名</span>
                                    <span className="yearly-gain positive">年涨幅+18.7%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ping%20an%20insurance%20building%20finance%20investment&image_size=square"
                                      alt="中国平安"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前价格:</span>
                                      <span className="value">48.25 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">成交量:</span>
                                      <span className="value">3.1亿</span>
                                    </div>
                                  </div>
                                </div>

                                {/* 复制所有卡片到末尾，实现无缝轮播 */}
                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '600519', 'stock');
                                }}>
                                  <div className="card-header">
                                    <h4>贵州茅台 (600519)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 1 名</span>
                                    <span className="yearly-gain positive">年涨幅+28.5%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=maotai%20liquor%20bottles%20luxury%20alcohol%20industry%20investment&image_size=square"
                                      alt="贵州茅台"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前价格:</span>
                                      <span className="value">1789 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">成交量:</span>
                                      <span className="value">1.2亿</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '000001', 'stock');
                                }}>
                                  <div className="card-header">
                                    <h4>平安银行 (000001)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 2 名</span>
                                    <span className="yearly-gain positive">年涨幅+15.8%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=banking%20finance%20building%20investment%20money&image_size=square"
                                      alt="平安银行"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前价格:</span>
                                      <span className="value">12.45 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">成交量:</span>
                                      <span className="value">2.5亿</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '000858', 'stock');
                                }}>
                                  <div className="card-header">
                                    <h4>五粮液 (000858)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 3 名</span>
                                    <span className="yearly-gain positive">年涨幅+22.3%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wu%20liang%20ye%20liquor%20bottles%20luxury%20alcohol%20industry%20investment&image_size=square"
                                      alt="五粮液"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前价格:</span>
                                      <span className="value">165.8 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">成交量:</span>
                                      <span className="value">8500万</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '601318', 'stock');
                                }}>
                                  <div className="card-header">
                                    <h4>中国平安 (601318)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 4 名</span>
                                    <span className="yearly-gain positive">年涨幅+18.7%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ping%20an%20insurance%20building%20finance%20investment&image_size=square"
                                      alt="中国平安"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前价格:</span>
                                      <span className="value">48.25 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">成交量:</span>
                                      <span className="value">3.1亿</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {activeNavTab === 'fund' && (
                              <>
                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '110022', 'fund');
                                }}>
                                  <div className="card-header">
                                    <h4>易方达消费行业股票 (110022)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 1 名</span>
                                    <span className="yearly-gain positive">年涨幅+25.3%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=consumer%20industry%20shopping%20mall%20retail%20investment&image_size=square"
                                      alt="易方达消费行业股票"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前净值:</span>
                                      <span className="value">3.256 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">规模:</span>
                                      <span className="value">125亿</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '000001', 'fund');
                                }}>
                                  <div className="card-header">
                                    <h4>华夏成长混合 (000001)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 2 名</span>
                                    <span className="yearly-gain positive">年涨幅+12.6%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=investment%20portfolio%20growth%20chart%20financial%20success&image_size=square"
                                      alt="华夏成长混合"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前净值:</span>
                                      <span className="value">2.156 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">规模:</span>
                                      <span className="value">85亿</span>
                                    </div>
                                  </div>
                                </div>

                                {/* 新增基金卡片 1 */}
                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '001475', 'fund');
                                }}>
                                  <div className="card-header">
                                    <h4>易方达国防军工混合 (001475)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 3 名</span>
                                    <span className="yearly-gain positive">年涨幅+19.8%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=military%20defense%20industry%20investment%20technology&image_size=square"
                                      alt="易方达国防军工混合"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前净值:</span>
                                      <span className="value">1.856 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">规模:</span>
                                      <span className="value">65亿</span>
                                    </div>
                                  </div>
                                </div>

                                {/* 新增基金卡片 2 */}
                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '005827', 'fund');
                                }}>
                                  <div className="card-header">
                                    <h4>易方达蓝筹精选混合 (005827)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 4 名</span>
                                    <span className="yearly-gain positive">年涨幅+16.2%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blue%20chip%20stocks%20investment%20portfolio%20financial%20success&image_size=square"
                                      alt="易方达蓝筹精选混合"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前净值:</span>
                                      <span className="value">2.658 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">规模:</span>
                                      <span className="value">210亿</span>
                                    </div>
                                  </div>
                                </div>

                                {/* 复制所有卡片到末尾，实现无缝轮播 */}
                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '110022', 'fund');
                                }}>
                                  <div className="card-header">
                                    <h4>易方达消费行业股票 (110022)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 1 名</span>
                                    <span className="yearly-gain positive">年涨幅+25.3%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=consumer%20industry%20shopping%20mall%20retail%20investment&image_size=square"
                                      alt="易方达消费行业股票"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前净值:</span>
                                      <span className="value">3.256 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">规模:</span>
                                      <span className="value">125亿</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '000001', 'fund');
                                }}>
                                  <div className="card-header">
                                    <h4>华夏成长混合 (000001)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 2 名</span>
                                    <span className="yearly-gain positive">年涨幅+12.6%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=investment%20portfolio%20growth%20chart%20financial%20success&image_size=square"
                                      alt="华夏成长混合"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前净值:</span>
                                      <span className="value">2.156 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">规模:</span>
                                      <span className="value">85亿</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '001475', 'fund');
                                }}>
                                  <div className="card-header">
                                    <h4>易方达国防军工混合 (001475)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 3 名</span>
                                    <span className="yearly-gain positive">年涨幅+19.8%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=military%20defense%20industry%20investment%20technology&image_size=square"
                                      alt="易方达国防军工混合"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前净值:</span>
                                      <span className="value">1.856 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">规模:</span>
                                      <span className="value">65亿</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="rank-card" onClick={() => {
                                  handleSearch(null, '005827', 'fund');
                                }}>
                                  <div className="card-header">
                                    <h4>易方达蓝筹精选混合 (005827)</h4>
                                  </div>
                                  <div className="card-rank-info">
                                    <span className="rank">投资排行榜第 4 名</span>
                                    <span className="yearly-gain positive">年涨幅+16.2%</span>
                                  </div>
                                  <div className="card-chart">
                                    <img 
                                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blue%20chip%20stocks%20investment%20portfolio%20financial%20success&image_size=square"
                                      alt="易方达蓝筹精选混合"
                                      className="card-img"
                                    />
                                  </div>
                                  <div className="card-footer">
                                    <div className="price-info">
                                      <span className="label">当前净值:</span>
                                      <span className="value">2.658 元</span>
                                    </div>
                                    <div className="volume-info">
                                      <span className="label">规模:</span>
                                      <span className="value">210亿</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </>
                )}

                {/* 贵金属数据显示 */}
                {activeNavTab === 'metal' && ['gold', 'silver', 'copper', 'platinum', 'lead'].includes(activeTab) && (
                  <div className="metal-detail-container">
                    {data ? (
                      <MetalDetail data={data} />
                    ) : (
                      <div className="metal-detail-placeholder">
                        <div className="placeholder-content">
                          <div className="placeholder-title"></div>
                          <div className="placeholder-info"></div>
                          <div className="placeholder-chart"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <>
                {activeNavTab !== 'settings' && (
                  <div className="detail-page">
                    <button className="back-button" onClick={handleReset}>
                      &lt;
                    </button>
                    
                    {activeTab === 'stock' && data && (
                      <StockDetail data={data} advice={advice} />
                    )}
                    
                    {activeTab === 'fund' && data && (
                      <FundDetail data={data} advice={advice} />
                    )}
                    
                    {(activeTab === 'gold' || activeTab === 'silver' || activeTab === 'copper' || activeTab === 'platinum' || activeTab === 'lead') && data && (
                      <MetalDetail data={data} />
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* 市场资讯页面 */}
            {activeNavTab === 'news' && (
              <div className="news-page-wrapper">
                <MarketNews />
              </div>
            )}

            {/* 设置页面 - 独立于showDetail条件 */}
            {activeNavTab === 'settings' && (
              <Settings
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                onLogout={handleShowLogoutModal}
                onNicknameChange={setNickname}
                language={language}
                setLanguage={setLanguage}
                resourceSettings={resourceSettings}
                setResourceSettings={setResourceSettings}
              />
            )}
          </main>

          <footer className="footer">
            <p>Investment Analysis Tool &copy; 2026</p>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
