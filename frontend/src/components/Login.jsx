import React, { useState, useRef, useEffect } from 'react';
import './Login.css';
// 暂时注释掉import方式，使用相对路径直接引用
// import Logo from '../assets/Logo_2.png';
// import Logo from '../assets/react.svg';
// import Logo from '../assets/logo.png';

function Login({ onLoginSuccess }) {
  // 登录方式：account（账号登录），phone（手机号登录）
  const [loginType, setLoginType] = useState('account');
  
  // 账号登录态
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  // 手机号登录态
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  // 登录状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 输入框错误提示状态
  const [inputErrors, setInputErrors] = useState({
    account: '',
    password: '',
    phone: '',
    verificationCode: ''
  });
  
  // 忘记用户名/密码模态框状态
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotType, setForgotType] = useState('username'); // username 或 password
  
  // 找回用户名状态
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotVerificationCode, setForgotVerificationCode] = useState('');
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  
  // 账号输入框自动聚焦
  const accountInputRef = useRef(null);
  
  // 历史登录记录
  const [loginHistory, setLoginHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // 历史登录记录下拉框的ref
  const historyDropdownRef = useRef(null);
  
  useEffect(() => {
    // 页面加载后自动聚焦账号输入框
    if (accountInputRef.current) {
      accountInputRef.current.focus();
    }
    
    // 从本地存储中读取历史登录记录
    const savedHistory = localStorage.getItem('loginHistory');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setLoginHistory(history);
      } catch (error) {
        console.error('读取历史登录记录失败:', error);
      }
    }
    
    // 添加点击外部区域关闭历史登录记录的事件监听器
    const handleClickOutside = (event) => {
      // 检查点击事件是否发生在历史登录记录下拉框或账号输入框之外
      if (
        showHistory &&
        historyDropdownRef.current &&
        !historyDropdownRef.current.contains(event.target) &&
        accountInputRef.current &&
        !accountInputRef.current.contains(event.target)
      ) {
        setShowHistory(false);
      }
    };
    
    // 添加事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    
    // 清理事件监听器
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistory]);
  
  // 验证码倒计时
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  
  // 忘记用户名/密码验证码倒计时
  useEffect(() => {
    let timer;
    if (forgotCountdown > 0) {
      timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [forgotCountdown]);
  
  // 切换登录方式
  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setError('');
    // 切换时重置输入框错误提示
    setInputErrors({
      account: '',
      password: '',
      phone: '',
      verificationCode: ''
    });
    // 切换时清空当前表单输入
    if (type === 'account') {
      setAccount('');
      setPassword('');
      // 聚焦账号输入框
      setTimeout(() => {
        if (accountInputRef.current) {
          accountInputRef.current.focus();
        }
      }, 100);
    } else {
      setPhone('');
      setVerificationCode('');
      setCountdown(0);
    }
  };
  
  // 获取验证码
  const handleGetVerificationCode = () => {
    // 手机号格式校验
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    
    // 模拟发送验证码
    setCountdown(60);
    setError('');
    console.log('发送验证码到:', phone);
    // 实际项目中这里会调用后端API发送验证码
  };
  
  // 登录
  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    // 重置输入框错误提示
    const newInputErrors = {
      account: '',
      password: '',
      phone: '',
      verificationCode: ''
    };
    setInputErrors(newInputErrors);
    
    try {
      // 表单校验
      let hasError = false;
      
      if (loginType === 'account') {
        if (!account) {
          newInputErrors.account = '请输入账号';
          hasError = true;
        }
        if (!password) {
          newInputErrors.password = '请输入密码';
          hasError = true;
        }
        if (password.length < 6 || password.length > 20) {
          newInputErrors.password = '密码长度应在6-20位之间';
          hasError = true;
        }
        
        // 验证账号和密码
        const storedPassword = localStorage.getItem('userPassword') || '123456';
        if (!hasError && (account !== 'admin' || password !== storedPassword)) {
          setError('账号或密码错误');
          throw new Error('账号或密码错误');
        }
      } else {
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
          newInputErrors.phone = '请输入正确的手机号';
          hasError = true;
        }
        if (!verificationCode) {
          newInputErrors.verificationCode = '请输入验证码';
          hasError = true;
        }
        if (verificationCode.length !== 6) {
          newInputErrors.verificationCode = '验证码为6位数字';
          hasError = true;
        }
        
        // 手机号登录暂时只支持测试账号
        if (!hasError) {
          setError('当前仅支持账号登录，请切换到账号登录方式');
          throw new Error('当前仅支持账号登录，请切换到账号登录方式');
        }
      }
      
      // 如果有输入框错误，更新状态并抛出异常
      if (hasError) {
        setInputErrors(newInputErrors);
        throw new Error('输入参数错误');
      }
      
      // 模拟登录请求
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 登录成功
      console.log('登录成功:', loginType === 'account' ? { account } : { phone });
      
      // 保存登录记录到本地存储
      if (loginType === 'account') {
        // 检查是否已存在相同账号的记录
        const existingIndex = loginHistory.findIndex(item => item.account === account);
        let updatedHistory;
        
        if (existingIndex >= 0) {
          // 如果已存在，更新记录
          updatedHistory = [...loginHistory];
          updatedHistory[existingIndex] = { account, password, timestamp: Date.now() };
        } else {
          // 如果不存在，添加新记录
          updatedHistory = [...loginHistory, { account, password, timestamp: Date.now() }];
        }
        
        // 限制历史记录数量为5条
        if (updatedHistory.length > 5) {
          updatedHistory = updatedHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
        }
        
        // 保存到本地存储
        localStorage.setItem('loginHistory', JSON.stringify(updatedHistory));
        setLoginHistory(updatedHistory);
      }
      
      // 调用父组件的回调函数
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      // 只在没有输入框错误时设置全局错误
      if (!Object.values(newInputErrors).some(error => error)) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 忘记用户名
  const handleForgotUsername = () => {
    setForgotType('username');
    setShowForgotModal(true);
    setForgotPhone('');
    setForgotVerificationCode('');
    setForgotCountdown(0);
    setForgotError('');
    setForgotSuccess('');
  };
  
  // 忘记密码
  const handleForgotPassword = () => {
    setForgotType('password');
    setShowForgotModal(true);
    setForgotPhone('');
    setForgotVerificationCode('');
    setForgotCountdown(0);
    setForgotError('');
    setForgotSuccess('');
  };
  
  // 获取找回用户名/密码验证码
  const handleGetForgotVerificationCode = () => {
    // 手机号格式校验
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(forgotPhone)) {
      setForgotError('请输入正确的手机号');
      return;
    }
    
    // 模拟发送验证码
    setForgotCountdown(60);
    setForgotError('');
    console.log('发送验证码到:', forgotPhone);
    // 实际项目中这里会调用后端API发送验证码
  };
  
  // 提交找回用户名
  const handleSubmitForgotUsername = async () => {
    // 手机号格式校验
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(forgotPhone)) {
      setForgotError('请输入正确的手机号');
      return;
    }
    
    // 验证码校验
    if (!forgotVerificationCode || forgotVerificationCode.length !== 6) {
      setForgotError('请输入6位验证码');
      return;
    }
    
    setIsForgotLoading(true);
    setForgotError('');
    
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟成功响应
      const mockUsername = 'admin';
      setForgotSuccess(`您的用户名为：${mockUsername}`);
      
      // 3秒后关闭模态框
      setTimeout(() => {
        setShowForgotModal(false);
      }, 3000);
    } catch (err) {
      setForgotError('找回用户名失败，请稍后重试');
    } finally {
      setIsForgotLoading(false);
    }
  };
  
  // 提交重置密码
  const handleSubmitForgotPassword = async () => {
    // 手机号格式校验
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(forgotPhone)) {
      setForgotError('请输入正确的手机号');
      return;
    }
    
    // 验证码校验
    if (!forgotVerificationCode || forgotVerificationCode.length !== 6) {
      setForgotError('请输入6位验证码');
      return;
    }
    
    setIsForgotLoading(true);
    setForgotError('');
    
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟成功响应
      setForgotSuccess('密码重置成功，请使用新密码登录');
      
      // 3秒后关闭模态框
      setTimeout(() => {
        setShowForgotModal(false);
      }, 3000);
    } catch (err) {
      setForgotError('重置密码失败，请稍后重试');
    } finally {
      setIsForgotLoading(false);
    }
  };
  
  // 处理账号输入框点击事件
  const handleAccountInputClick = () => {
    if (loginHistory.length > 0) {
      setShowHistory(true);
    }
  };
  
  // 选择历史登录记录
  const handleSelectHistory = (historyItem) => {
    setAccount(historyItem.account);
    setPassword(historyItem.password);
    setShowHistory(false);
  };
  
  // 关闭历史登录记录
  const handleCloseHistory = () => {
    setShowHistory(false);
  };
  
  return (
    <div className="login-container">
      <div className="login-content">
        {/* 左侧：品牌视觉展示区 */}
        <div className="left-brand-area">
          {/* 背景图片 */}
          <div className="brand-background">
            <img src="/src/assets/20260206152810_4.png" alt="投资分析工具" className="brand-bg-image" />
          </div>
          {/* 文案内容 */}
          <div className="brand-content-left">
            <h2>投资分析工具</h2>
            <p>精准投资 风险把控</p>
            <div className="brand-description">
              <p>专业的投资分析工具，帮助您做出明智的投资决策</p>
              <p>实时数据 智能分析 个性化推荐</p>
            </div>
          </div>
        </div>
        
        {/* 右侧：登录功能操作区 */}
        <div className="right-login-area">
          <div className="login-card">
          {/* 头部区域 */}
        <div className="login-header">
          <img src="/src/assets/Logo_2.png" alt="投资分析工具" className="login-logo" />
          <p>精准投资 风险把控</p>
        </div>
          
          {/* 登录方式切换 */}
          <div className="login-type-tabs">
            <div 
              className={`tab ${loginType === 'account' ? 'active' : ''}`}
              onClick={() => handleLoginTypeChange('account')}
            >
              账号登录
            </div>
            <div 
              className={`tab ${loginType === 'phone' ? 'active' : ''}`}
              onClick={() => handleLoginTypeChange('phone')}
            >
              手机号登录
            </div>
          </div>
          
          {/* 错误提示 */}
          {error && <div className="error-message">{error}</div>}
          
          {/* 表单输入区 */}
          <div className="login-form">
            {loginType === 'account' ? (
              // 账号登录态
              <>
                <div className="form-group account-input-group">
                  <input
                    ref={accountInputRef}
                    type="text"
                    className="form-input"
                    placeholder="请输入邮箱/账号"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    onClick={handleAccountInputClick}
                    autoComplete="username"
                  />
                  {/* 历史登录记录 */}
                  {showHistory && loginHistory.length > 0 && (
                    <div className="login-history-dropdown" ref={historyDropdownRef}>
                      <div className="login-history-list">
                        {loginHistory.map((item, index) => (
                          <div 
                            key={index}
                            className="login-history-item"
                            onClick={() => handleSelectHistory(item)}
                          >
                            <div className="history-account">{item.account}</div>
                            <div className="history-password">{item.password}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {inputErrors.account && (
                    <div className="input-error">{inputErrors.account}</div>
                  )}
                </div>
                <div className="form-group">
                  <div className="password-input-wrapper">
                    <input
                      type={passwordVisible ? 'text' : 'password'}
                      className="form-input"
                      placeholder="请输入登录密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
                    >
                      {passwordVisible ? '👁' : '🙈'}
                    </button>
                  </div>
                  {inputErrors.password && (
                    <div className="input-error">{inputErrors.password}</div>
                  )}
                </div>
              </>
            ) : (
              // 手机号登录态
              <>
                <div className="form-group">
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="请输入手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={11}
                  />
                  {inputErrors.phone && (
                    <div className="input-error">{inputErrors.phone}</div>
                  )}
                </div>
                <div className="form-group">
                  <div className="verification-code-wrapper">
                    <input
                      type="text"
                      className="form-input verification-code-input"
                      placeholder="请输入验证码"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                    />
                    <button
                      type="button"
                      className={`verification-code-button ${countdown > 0 ? 'disabled' : ''}`}
                      onClick={handleGetVerificationCode}
                      disabled={countdown > 0}
                    >
                      {countdown > 0 ? `${countdown}s后重新获取` : '获取验证码'}
                    </button>
                  </div>
                  {inputErrors.verificationCode && (
                    <div className="input-error">{inputErrors.verificationCode}</div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* 主操作按钮 */}
          <div className="form-group">
            <button
              type="button"
              className="login-button"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                '登录'
              )}
            </button>
          </div>
          
          {/* 辅助功能区 */}
          <div className="auxiliary-functions">
            <span className="auxiliary-link" onClick={handleForgotUsername}>
              忘记用户名
            </span>
            <span className="auxiliary-separator">|</span>
            <span className="auxiliary-link" onClick={handleForgotPassword}>
              忘记密码
            </span>
          </div>
          </div>
        </div>
      </div>
      
      {/* 忘记用户名/密码模态框 */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-content forgot-modal">
            <div className="modal-header">
              <h3>{forgotType === 'username' ? '找回用户名' : '重置密码'}</h3>
              <button 
                className="close-button"
                onClick={() => setShowForgotModal(false)}
              >
                ×
              </button>
            </div>
            
            {forgotSuccess ? (
              <div className="success-message">
                {forgotSuccess}
              </div>
            ) : (
              <div className="modal-body">
                {forgotError && <div className="error-message">{forgotError}</div>}
                
                <div className="form-group">
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="请输入注册手机号"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    maxLength={11}
                  />
                </div>
                
                <div className="form-group">
                  <div className="verification-code-wrapper">
                    <input
                      type="text"
                      className="form-input verification-code-input"
                      placeholder="请输入验证码"
                      value={forgotVerificationCode}
                      onChange={(e) => setForgotVerificationCode(e.target.value)}
                      maxLength={6}
                    />
                    <button
                      type="button"
                      className={`verification-code-button ${forgotCountdown > 0 ? 'disabled' : ''}`}
                      onClick={handleGetForgotVerificationCode}
                      disabled={forgotCountdown > 0}
                    >
                      {forgotCountdown > 0 ? `${forgotCountdown}s后重新获取` : '获取验证码'}
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <button
                    type="button"
                    className="login-button"
                    onClick={forgotType === 'username' ? handleSubmitForgotUsername : handleSubmitForgotPassword}
                    disabled={isForgotLoading}
                  >
                    {isForgotLoading ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      forgotType === 'username' ? '找回用户名' : '重置密码'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;