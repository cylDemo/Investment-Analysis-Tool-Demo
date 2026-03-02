import { useState, useEffect } from 'react';
import './App.css';
import StockDetail from './components/StockDetail';
import FundDetail from './components/FundDetail';
import MetalDetail from './components/MetalDetail';
import Login from './components/Login';
import Settings from './components/Settings';
import MarketNews from './components/MarketNews';
import LoginPromptModal from './components/LoginPromptModal';
import LoginOverlay from './components/LoginOverlay';
import logo from './assets/Logo_2.png';

function App() {
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
    const isNewUser = !localStorage.getItem('userAccountCreated');
    const defaultSettings = {
      stockRecommendation: true,
      stockRanking: true,
      fundRecommendation: true,
      fundRanking: true,
      // 金属行业设置 - 默认都显示
      metalGold: true,
      metalSilver: true,
      metalCopper: true,
      metalPlatinum: true,
      metalLead: true,
      metalNickel: true,
      metalRareEarth: true,
      metalZirconium: true,
      metalTungsten: true
    };
    if (saved && !isNewUser) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
    // 新用户或首次登录，设置金属行业默认都显示
    if (isNewUser) {
      localStorage.setItem('userAccountCreated', 'true');
    }
    return defaultSettings;
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
  const [lastAnalyzedCode, setLastAnalyzedCode] = useState('');
  const [lastAnalyzedType, setLastAnalyzedType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stockIndices, setStockIndices] = useState({
    a股: {
      name: 'A股',
      price: '3,258.63',
      change: '+0.86%',
      isPositive: true
    },
    港股: {
      name: '港股',
      price: '15,876.78',
      change: '+1.23%',
      isPositive: true
    },
    上证: {
      name: '上证',
      price: '3,258.63',
      change: '+0.86%',
      isPositive: true
    },
    科创: {
      name: '科创',
      price: '958.32',
      change: '-0.24%',
      isPositive: false
    },
    纳斯达克: {
      name: '纳斯达克',
      price: '18,243.65',
      change: '+0.52%',
      isPositive: true
    },
    标普500: {
      name: '标普500',
      price: '5,132.18',
      change: '+0.31%',
      isPositive: true
    }
  });
  const [metalLoading, setMetalLoading] = useState(false);

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // 金属页面自动加载数据
  useEffect(() => {
    const loadMetalData = async () => {
      if (activeNavTab === 'metal' && !showDetail && !data) {
        // 定义金属顺序
        const metalOrder = ['gold', 'silver', 'copper', 'platinum', 'lead', 'nickel', 'rare-earth', 'zirconium', 'tungsten'];
        
        // 检查当前activeTab是否在metalOrder中
        if (metalOrder.includes(activeTab)) {
          // 检查当前金属是否被隐藏
          const currentMetalKey = `metal${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
          if (!resourceSettings[currentMetalKey]) {
            // 当前金属被隐藏，查找第一个可见的金属
            const firstVisibleMetal = metalOrder.find(metal => {
              const metalKey = `metal${metal.charAt(0).toUpperCase() + metal.slice(1)}`;
              return resourceSettings[metalKey];
            });
            
            if (firstVisibleMetal) {
              // 找到可见的金属，切换到该金属
              setActiveTab(firstVisibleMetal);
              setCode(firstVisibleMetal);
              setMetalLoading(true);
              
              try {
                const response = await fetch(`http://localhost:3001/api/metal/${firstVisibleMetal}`);
                if (response.ok) {
                  const result = await response.json();
                  setData(result.data);
                }
              } catch (error) {
                console.error('加载金属数据失败:', error);
              } finally {
                setMetalLoading(false);
              }
            }
            // 如果没有找到可见的金属，不加载任何数据
          } else {
            // 当前金属可见，加载数据
            setMetalLoading(true);
            try {
              const response = await fetch(`http://localhost:3001/api/metal/${activeTab}`);
              if (response.ok) {
                const result = await response.json();
                setData(result.data);
              }
            } catch (error) {
              console.error('加载金属数据失败:', error);
            } finally {
              setMetalLoading(false);
            }
          }
        }
      }
    };
    
    loadMetalData();
  }, [activeNavTab, activeTab, showDetail, data, resourceSettings]);
  
  // 退出登录确认弹窗状态
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // 登出成功消息提示状态
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  // 登录提示弹窗状态
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  // 基金分类标签状态
  const [fundCategoryTab, setFundCategoryTab] = useState('hot');
  // 是否显示登录页面
  const [showLoginPage, setShowLoginPage] = useState(false);

  // 登录成功处理
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLoginPage(false);
    // 将登录状态保存到localStorage中
    localStorage.setItem('isLoggedIn', 'true');
    // 检查是否是新用户
    const isNewUser = !localStorage.getItem('userAccountCreated');
    if (isNewUser) {
      // 新用户，设置金属行业默认都显示
      const defaultMetalSettings = {
        metalGold: true,
        metalSilver: true,
        metalCopper: true,
        metalPlatinum: true,
        metalLead: true,
        metalNickel: true,
        metalRareEarth: true,
        metalZirconium: true,
        metalTungsten: true
      };
      const newSettings = {
        ...resourceSettings,
        ...defaultMetalSettings
      };
      setResourceSettings(newSettings);
      localStorage.setItem('resourceSettings', JSON.stringify(newSettings));
      localStorage.setItem('userAccountCreated', 'true');
    }
  };

  // 监听资源设置变化，处理金属类型切换
  useEffect(() => {
    // 当切换到金属行业页面时，确保有可见的金属类型被选中
    if (activeNavTab === 'metal') {
      const visibleMetals = [];
      if (resourceSettings.metalGold) visibleMetals.push('gold');
      if (resourceSettings.metalSilver) visibleMetals.push('silver');
      if (resourceSettings.metalCopper) visibleMetals.push('copper');
      if (resourceSettings.metalPlatinum) visibleMetals.push('platinum');
      if (resourceSettings.metalLead) visibleMetals.push('lead');
      if (resourceSettings.metalNickel) visibleMetals.push('nickel');
      if (resourceSettings.metalRareEarth) visibleMetals.push('rare-earth');
      if (resourceSettings.metalZirconium) visibleMetals.push('zirconium');
      if (resourceSettings.metalTungsten) visibleMetals.push('tungsten');

      // 如果当前选中的金属类型不可见，切换到第一个可见的金属类型
      if (visibleMetals.length > 0 && !visibleMetals.includes(activeTab)) {
        const firstVisibleMetal = visibleMetals[0];
        setActiveTab(firstVisibleMetal);
        setCode(firstVisibleMetal);
        
        // 加载第一个可见金属的数据
        const loadFirstMetalData = async () => {
          setMetalLoading(true);
          try {
            const response = await fetch(`http://localhost:3001/api/metal/${firstVisibleMetal}`);
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
        };
        loadFirstMetalData();
      }
    }
  }, [resourceSettings, activeNavTab, activeTab]);
  
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
      // 定义金属顺序
      const metalOrder = ['gold', 'silver', 'copper', 'platinum', 'lead', 'nickel', 'rare-earth', 'zirconium', 'tungsten'];
      // 查找第一个可见的金属
      const firstVisibleMetal = metalOrder.find(metal => {
        const metalKey = `metal${metal.charAt(0).toUpperCase() + metal.slice(1)}`;
        return resourceSettings[metalKey];
      });
      // 如果找到可见的金属，设置为activeTab，否则设置为'gold'
      if (firstVisibleMetal) {
        setActiveTab(firstVisibleMetal);
      }
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

  // 处理排行榜卡片点击
  const handleRankingCardClick = (searchCode, searchTab) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    handleSearch(null, searchCode, searchTab);
  };

  const handleInvestmentRecommendation = async () => {
    if (!recommendationCode) return;

    // 未登录时显示登录提示
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    // 检查是否已经有相同代码和类型的推荐结果
    if (recommendationResult && 
        lastAnalyzedCode === recommendationCode && 
        lastAnalyzedType === activeTab) {
      // 已经有相同的推荐结果，不再重新加载
      return;
    }

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
        // 记录最后分析的代码和类型
        setLastAnalyzedCode(recommendationCode);
        setLastAnalyzedType(activeTab);
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
      
      {showLoginPage ? (
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
                {isLoggedIn && nickname && (
                  <span className="header-nickname">{nickname}</span>
                )}
                {!isLoggedIn && (
                  <button
                    className="header-login-btn"
                    onClick={() => setShowLoginPage(true)}
                  >
                    登录
                  </button>
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
                  <div className="metal-selector-container" style={{ position: 'relative' }}>
                    <div className="tab-selector">
                      {resourceSettings.metalGold && (
                        <button 
                          className={`tab-button ${activeTab === 'gold' ? 'active' : ''}`}
                          data-metal="gold"
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
                      )}
                      {resourceSettings.metalSilver && (
                        <button 
                          className={`tab-button ${activeTab === 'silver' ? 'active' : ''}`}
                          data-metal="silver"
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
                      )}
                      {resourceSettings.metalCopper && (
                        <button 
                          className={`tab-button ${activeTab === 'copper' ? 'active' : ''}`}
                          data-metal="copper"
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
                      )}
                      {resourceSettings.metalPlatinum && (
                        <button 
                          className={`tab-button ${activeTab === 'platinum' ? 'active' : ''}`}
                          data-metal="platinum"
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
                      )}
                      {resourceSettings.metalLead && (
                        <button 
                          className={`tab-button ${activeTab === 'lead' ? 'active' : ''}`}
                          data-metal="lead"
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
                      )}
                      {resourceSettings.metalNickel && (
                        <button 
                          className={`tab-button ${activeTab === 'nickel' ? 'active' : ''}`}
                          data-metal="nickel"
                          onClick={async () => {
                            if (activeTab === 'nickel') return;
                            
                            const metalCode = 'nickel';
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
                          镍
                        </button>
                      )}
                      {resourceSettings.metalRareEarth && (
                        <button 
                          className={`tab-button ${activeTab === 'rare-earth' ? 'active' : ''}`}
                          data-metal="rare-earth"
                          onClick={async () => {
                            if (activeTab === 'rare-earth') return;
                            
                            const metalCode = 'rare-earth';
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
                          稀土
                        </button>
                      )}
                      {resourceSettings.metalZirconium && (
                        <button 
                          className={`tab-button ${activeTab === 'zirconium' ? 'active' : ''}`}
                          data-metal="zirconium"
                          onClick={async () => {
                            if (activeTab === 'zirconium') return;
                            
                            const metalCode = 'zirconium';
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
                          锆
                        </button>
                      )}
                      {resourceSettings.metalTungsten && (
                        <button 
                          className={`tab-button ${activeTab === 'tungsten' ? 'active' : ''}`}
                          data-metal="tungsten"
                          onClick={async () => {
                            if (activeTab === 'tungsten') return;
                            
                            const metalCode = 'tungsten';
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
                          钨
                        </button>
                      )}
                    </div>
                    
                    {/* 贵金属加载指示器 */}
                    {metalLoading && (
                      <div className="metal-loading-indicator">
                        <div className="spinner small"></div>
                        <span>加载中...</span>
                      </div>
                    )}
                    
                    {/* 所有金属都被隐藏时的提示 */}
                    {!resourceSettings.metalGold && 
                     !resourceSettings.metalSilver && 
                     !resourceSettings.metalCopper && 
                     !resourceSettings.metalPlatinum && 
                     !resourceSettings.metalLead && 
                     !resourceSettings.metalNickel && 
                     !resourceSettings.metalRareEarth && 
                     !resourceSettings.metalZirconium && 
                     !resourceSettings.metalTungsten && (
                      <div className="metal-hidden-message">
                        <div className="message-icon">�</div>
                        <h3>暂无显示的金属数据</h3>
                        <p>您已在设置中隐藏了所有金属数据。如需查看，请前往"设置-资源管理"中开启需要查看的金属。</p>
                        <button 
                          className="settings-button"
                          onClick={() => {
                            setActiveNavTab('settings');
                            window.scrollTo({ top: 0, behavior: 'auto' });
                          }}
                        >
                          前往设置
                        </button>
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
                      {activeTab === 'stock' && (
                        <span className="example-code" onClick={() => setCode('000001')}>000001（平安银行）</span>
                      )}
                      {activeTab === 'fund' && (
                        <span className="example-code" onClick={() => setCode('110022')}>110022（易方达消费行业股票）</span>
                      )}
                    </div>

                    {/* 基金分类功能 */}
                    {activeNavTab === 'fund' && (
                      <div className="fund-categories">
                        <div className="category-tabs">
                          <button 
                            className={`category-tab ${fundCategoryTab === 'hot' ? 'active' : ''}`}
                            onClick={() => {
                              setFundCategoryTab('hot');
                              // 重置滚动条位置
                              setTimeout(() => {
                                const fundList = document.querySelector('.fund-list');
                                if (fundList) {
                                  fundList.scrollTop = 0;
                                }
                              }, 0);
                            }}
                          >
                            热门基金
                          </button>
                          <button 
                            className={`category-tab ${fundCategoryTab === 'hold' ? 'active' : ''}`}
                            onClick={() => {
                              setFundCategoryTab('hold');
                              // 重置滚动条位置
                              setTimeout(() => {
                                const fundList = document.querySelector('.fund-list');
                                if (fundList) {
                                  fundList.scrollTop = 0;
                                }
                              }, 0);
                            }}
                          >
                            持有基金
                          </button>
                          <button 
                            className={`category-tab ${fundCategoryTab === 'watch' ? 'active' : ''}`}
                            onClick={() => {
                              setFundCategoryTab('watch');
                              // 重置滚动条位置
                              setTimeout(() => {
                                const fundList = document.querySelector('.fund-list');
                                if (fundList) {
                                  fundList.scrollTop = 0;
                                }
                              }, 0);
                            }}
                          >
                            自选基金
                          </button>
                        </div>
                        <div className="category-content">
                          <div className="fund-list">
                            {/* 热门基金列表 */}
                            {fundCategoryTab === 'hot' && (
                              <>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>易方达消费行业股票 (110022)</h4>
                                    <p>年涨幅: +25.3%</p>
                                  </div>
                                  <div className="fund-price">3.256 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>华夏成长混合 (000001)</h4>
                                    <p>年涨幅: +12.6%</p>
                                  </div>
                                  <div className="fund-price">2.156 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>易方达国防军工混合 (001475)</h4>
                                    <p>年涨幅: +19.8%</p>
                                  </div>
                                  <div className="fund-price">1.856 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>广发双擎升级混合A (005911)</h4>
                                    <p>年涨幅: +31.2%</p>
                                  </div>
                                  <div className="fund-price">2.134 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>诺安成长混合 (320007)</h4>
                                    <p>年涨幅: +18.5%</p>
                                  </div>
                                  <div className="fund-price">1.678 元</div>
                                </div>
                              </>
                            )}
                            {/* 持有基金列表 */}
                            {fundCategoryTab === 'hold' && (
                              <>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>广发稳健增长混合 (270002)</h4>
                                    <p>持有份额: 5,000份 | 收益率: +8.5%</p>
                                  </div>
                                  <div className="fund-price">1.892 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>嘉实沪深300指数 (160706)</h4>
                                    <p>持有份额: 3,200份 | 收益率: +15.2%</p>
                                  </div>
                                  <div className="fund-price">1.456 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>南方中证500ETF联接 (160119)</h4>
                                    <p>持有份额: 2,800份 | 收益率: +6.8%</p>
                                  </div>
                                  <div className="fund-price">1.234 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>富国天惠成长混合 (161005)</h4>
                                    <p>持有份额: 1,500份 | 收益率: +22.1%</p>
                                  </div>
                                  <div className="fund-price">2.678 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>兴全合润混合 (163406)</h4>
                                    <p>持有份额: 2,000份 | 收益率: +11.3%</p>
                                  </div>
                                  <div className="fund-price">1.856 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>交银新成长混合 (519736)</h4>
                                    <p>持有份额: 1,800份 | 收益率: +14.7%</p>
                                  </div>
                                  <div className="fund-price">2.345 元</div>
                                </div>
                              </>
                            )}
                            {/* 自选基金列表 */}
                            {fundCategoryTab === 'watch' && (
                              <>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>中欧医疗健康混合A (003095)</h4>
                                    <p>日涨幅: +1.2% | 关注价格: 2.156元</p>
                                  </div>
                                  <div className="fund-price">2.189 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>招商中证白酒指数 (161725)</h4>
                                    <p>日涨幅: -0.5% | 关注价格: 1.023元</p>
                                  </div>
                                  <div className="fund-price">1.018 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>汇添富消费行业混合 (000083)</h4>
                                    <p>日涨幅: +0.8% | 关注价格: 3.456元</p>
                                  </div>
                                  <div className="fund-price">3.482 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>工银瑞信前沿医疗股票A (001717)</h4>
                                    <p>日涨幅: +2.1% | 关注价格: 2.789元</p>
                                  </div>
                                  <div className="fund-price">2.845 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>景顺长城新兴成长混合 (260108)</h4>
                                    <p>日涨幅: +0.3% | 关注价格: 2.234元</p>
                                  </div>
                                  <div className="fund-price">2.241 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>华安媒体互联网混合A (001071)</h4>
                                    <p>日涨幅: +1.5% | 关注价格: 1.567元</p>
                                  </div>
                                  <div className="fund-price">1.589 元</div>
                                </div>
                                <div className="fund-item">
                                  <div className="fund-info">
                                    <h4>鹏华新兴产业混合 (206009)</h4>
                                    <p>日涨幅: -0.2% | 关注价格: 2.123元</p>
                                  </div>
                                  <div className="fund-price">2.118 元</div>
                                </div>
                              </>
                            )}
                          </div>

                        </div>
                      </div>
                    )}

                    {/* 股市实时状态数据 */}
                    {activeNavTab === 'stock' && (
                      <div className="stock-indices-container">
                        {Object.values(stockIndices).map((index, idx) => (
                          <div key={idx} className="stock-index-card">
                            <div className="index-name">{index.name}</div>
                            <div className="index-price">{index.price} 点</div>
                            <div className={`index-change ${index.isPositive ? 'positive' : 'negative'}`}>
                              {index.change}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 投资推荐功能 */}
                    {((activeNavTab === 'stock' && resourceSettings.stockRecommendation) ||
                      (activeNavTab === 'fund' && resourceSettings.fundRecommendation)) && (
                    <div className="investment-recommendation">
                      <div className="recommendation-input">
                        <input
                          type="text"
                          className="recommendation-code-input"
                          placeholder={activeTab === 'stock' ? '请输入股票代码，例如：000001' : '请输入基金代码，例如：110022'}
                          value={recommendationCode}
                          onChange={(e) => {
                            const value = e.target.value;
                            setRecommendationCode(value);
                            // 当输入框内容变化时，重置最后分析的代码状态
                            setLastAnalyzedCode('');
                            setLastAnalyzedType('');
                            // 当输入框内容被清除时，清空推荐结果
                            if (!value.trim()) {
                              setRecommendationResult(null);
                            }
                          }}
                        />
                      </div>
                      <div className="recommendation-button-container">
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
                          <div className="recommendation-header">
                            <div className="recommendation-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                <line x1="12" y1="22.08" x2="12" y2="12"/>
                              </svg>
                            </div>
                            <h4>AI 投资分析报告</h4>
                          </div>
                          <div className="recommendation-content">
                            {recommendationResult.split('\n').map((line, index) => {
                              // 标题行
                              if (line.match(/^基于.*的投资推荐$/)) {
                                return (
                                  <div key={index} className="recommendation-title-section">
                                    <h3 className="recommendation-main-title">{line}</h3>
                                  </div>
                                );
                              }
                              // 数字标题 (1. 2. 3. 等)
                              if (line.match(/^\d+\./)) {
                                return (
                                  <div key={index} className="recommendation-section-title">
                                    {line}
                                  </div>
                                );
                              }
                              // 子项 (- 开头)
                              if (line.trim().startsWith('-')) {
                                const [label, value] = line.split(':').map(s => s.trim());
                                return (
                                  <div key={index} className="recommendation-item">
                                    <span className="recommendation-label">{label.replace('-', '').trim()}</span>
                                    <span className="recommendation-value">{value || ''}</span>
                                  </div>
                                );
                              }
                              // 空行
                              if (line.trim() === '') {
                                return <div key={index} className="recommendation-spacer"></div>;
                              }
                              // 普通文本
                              return <div key={index} className="recommendation-text">{line}</div>;
                            })}
                          </div>
                          <div className="recommendation-footer">
                            <span className="recommendation-disclaimer">* 以上分析仅供参考，投资有风险，入市需谨慎</span>
                          </div>
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
                                  handleRankingCardClick('600519', 'stock');
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
                                  handleRankingCardClick('000001', 'stock');
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
                                  handleRankingCardClick('000858', 'stock');
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
                                  handleRankingCardClick('601318', 'stock');
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
                                  handleRankingCardClick('600519', 'stock');
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
                                  handleRankingCardClick('000001', 'stock');
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
                                  handleRankingCardClick('000858', 'stock');
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
                                  handleRankingCardClick('601318', 'stock');
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
                                  handleRankingCardClick('110022', 'fund');
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
                                  handleRankingCardClick('000001', 'fund');
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
                                  handleRankingCardClick('001475', 'fund');
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
                                  handleRankingCardClick('005827', 'fund');
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
                                  handleRankingCardClick('110022', 'fund');
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
                                  handleRankingCardClick('000001', 'fund');
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
                                  handleRankingCardClick('001475', 'fund');
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
                                  handleRankingCardClick('005827', 'fund');
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
                {activeNavTab === 'metal' && ['gold', 'silver', 'copper', 'platinum', 'lead', 'nickel', 'rare-earth', 'zirconium', 'tungsten'].includes(activeTab) && (
                  (() => {
                    // 处理特殊情况，如rare-earth转换为RareEarth
                    let currentMetalKey;
                    if (activeTab === 'rare-earth') {
                      currentMetalKey = 'metalRareEarth';
                    } else {
                      currentMetalKey = `metal${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
                    }
                    if (resourceSettings[currentMetalKey]) {
                      return (
                        <div className="metal-detail-container" style={{ position: 'relative' }}>
                          {data ? (
                            <MetalDetail data={data} isLoggedIn={isLoggedIn} onLogin={() => setShowLoginPage(true)} />
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
                      );
                    }
                    return null;
                  })()
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
                    
                    {(activeTab === 'gold' || activeTab === 'silver' || activeTab === 'copper' || activeTab === 'platinum' || activeTab === 'lead' || activeTab === 'nickel' || activeTab === 'rare-earth' || activeTab === 'zirconium' || activeTab === 'tungsten') && data && (
                      <MetalDetail data={data} isLoggedIn={isLoggedIn} onLogin={() => setShowLoginPage(true)} />
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* 市场资讯页面 */}
            {activeNavTab === 'news' && (
              <div className="news-page-wrapper" style={{ position: 'relative', minHeight: '300px' }}>
                <MarketNews isLoggedIn={isLoggedIn} onLogin={() => setShowLoginPage(true)} />

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
                isLoggedIn={isLoggedIn}
                onLogin={() => setShowLoginPage(true)}
              />
            )}
          </main>

          <footer className="footer">
            <p>Investment Analysis Tool &copy; 2026</p>
          </footer>

          {/* 登录提示弹窗 */}
          <LoginPromptModal
            isOpen={showLoginPrompt}
            onClose={() => setShowLoginPrompt(false)}
            onLogin={() => {
              setShowLoginPrompt(false);
              setShowLoginPage(true);
            }}
          />
        </>
      )}
    </div>
  );
}

export default App;
