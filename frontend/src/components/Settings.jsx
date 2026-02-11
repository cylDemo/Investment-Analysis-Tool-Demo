import React, { useState, useRef, useEffect } from 'react';
import './Settings.css';

const Settings = ({ darkMode, setDarkMode, onLogout, onNicknameChange, language, setLanguage, resourceSettings, setResourceSettings }) => {
  const [activeSubPage, setActiveSubPage] = useState(null);
  const scrollPositionRef = useRef(0);

  // 处理语言切换
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // 当进入子页面时，滚动到顶部
  useEffect(() => {
    if (activeSubPage) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeSubPage]);

  // 根据 darkMode 状态和 localStorage 确定主题模式
  const [currentThemeMode, setCurrentThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });

  // 当外部 darkMode 变化时，同步更新 themeMode 显示
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    // 根据当前 darkMode 状态更新显示
    const expectedMode = darkMode ? 'dark' : 'light';
    // 如果 localStorage 的模式与当前 darkMode 状态不一致，以 darkMode 状态为准
    if (savedMode === 'dark' || savedMode === 'light') {
      if (savedMode !== expectedMode) {
        // localStorage 与当前状态不一致，更新 localStorage 并同步显示
        localStorage.setItem('themeMode', expectedMode);
      }
      setCurrentThemeMode(expectedMode);
    } else if (savedMode === 'system') {
      setCurrentThemeMode('system');
    } else {
      setCurrentThemeMode(expectedMode);
    }
  }, [darkMode]);
  const [notificationSettings, setNotificationSettings] = useState({
    accountSecurity: true,
    investmentPush: true,
    emailSubscription: false,
    nightMode: false
  });
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);
  const [cancelAgreed, setCancelAgreed] = useState(false);
  const [showAvatarToast, setShowAvatarToast] = useState(false);
  const [helpSearchQuery, setHelpSearchQuery] = useState('');
  const [helpSearchResults, setHelpSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    '新手指南': true,
    '功能介绍': true,
    '常见问题': true
  });
  const [expandedHelpItem, setExpandedHelpItem] = useState(null);
  const fileInputRef = useRef(null);

  // 个人资料表单状态（包含头像）
  const [profileForm, setProfileForm] = useState({
    nickname: localStorage.getItem('nickname') || '',
    email: localStorage.getItem('email') || 'admin@example.com',
    phone: localStorage.getItem('phone') || '138****8888',
    avatar: localStorage.getItem('userAvatar') || null
  });
  const [originalProfileForm, setOriginalProfileForm] = useState({ ...profileForm });
  const [hasProfileChanges, setHasProfileChanges] = useState(false);

  // 账户安全相关状态
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [phoneForm, setPhoneForm] = useState({
    oldPhone: localStorage.getItem('phone') || '138****8888',
    newPhone: '',
    verifyCode: ''
  });
  const [emailForm, setEmailForm] = useState({
    email: '',
    verifyCode: ''
  });
  const [countdown, setCountdown] = useState(0);

  const handleThemeChange = (mode) => {
    localStorage.setItem('themeMode', mode);
    setCurrentThemeMode(mode);
    if (mode === 'dark') {
      setDarkMode(true);
    } else if (mode === 'light') {
      setDarkMode(false);
    } else {
      // 跟随系统
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  };

  const handleResourceToggle = (key) => {
    const newSettings = {
      ...resourceSettings,
      [key]: !resourceSettings[key]
    };
    setResourceSettings(newSettings);
    localStorage.setItem('resourceSettings', JSON.stringify(newSettings));
  };

  const handleNotificationToggle = (key) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmitFeedback = () => {
    if (feedbackContent.length < 10) {
      alert('反馈内容至少需要10个字符');
      return;
    }
    setShowFeedbackToast(true);
    setTimeout(() => {
      setShowFeedbackToast(false);
      setFeedbackContent('');
      setFeedbackContact('');
    }, 2000);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // 保存当前滚动位置并进入子页面
  const handleEnterSubPage = (page) => {
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
    setActiveSubPage(page);
    // 进入子页面时滚动到顶部，确保在组件渲染完成后执行
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    }, 50);
  };

  // 返回主页面并恢复滚动位置
  const handleBackToMain = () => {
    setActiveSubPage(null);
    // 清除帮助搜索状态
    setHelpSearchQuery('');
    setHelpSearchResults([]);
    setHasSearched(false);
    // 使用 setTimeout 确保在页面渲染后恢复滚动位置
    setTimeout(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'auto'
      });
    }, 0);
  };

  // 帮助文档数据
  const helpDocuments = [
    { category: '新手指南', title: '如何注册账号？', content: '点击登录页面的"注册"按钮，填写手机号和密码即可完成注册。' },
    { category: '新手指南', title: '如何搜索股票？', content: '在首页输入框中输入股票代码或名称，点击搜索按钮即可查询。' },
    { category: '新手指南', title: '如何添加自选？', content: '在股票详情页点击"加入自选"按钮即可添加到自选列表。' },
    { category: '功能介绍', title: '投资推荐功能说明', content: '系统根据市场数据和算法分析，为您推荐潜在的投资机会。' },
    { category: '功能介绍', title: '排行榜如何计算？', content: '排行榜根据年涨幅、成交量等多维度数据综合计算得出。' },
    { category: '功能介绍', title: '贵金属数据来源', content: '贵金属数据来自权威金融机构实时报价。' },
    { category: '常见问题', title: '数据更新频率？', content: '股票和基金数据每15分钟更新一次，贵金属数据实时更新。' },
    { category: '常见问题', title: '如何导出数据？', content: '在详情页点击"导出"按钮，可将数据导出为Excel或PDF格式。' },
    { category: '常见问题', title: '账户安全如何保障？', content: '我们采用银行级加密技术，确保您的账户信息安全。' }
  ];

  // 处理帮助搜索
  const handleHelpSearch = () => {
    if (!helpSearchQuery.trim()) {
      setHelpSearchResults([]);
      setHasSearched(false);
      return;
    }

    const query = helpSearchQuery.toLowerCase();
    const results = helpDocuments.filter(doc =>
      doc.title.toLowerCase().includes(query) ||
      doc.content.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query)
    );

    setHelpSearchResults(results);
    setHasSearched(true);
  };

  // 处理搜索框回车事件
  const handleHelpSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleHelpSearch();
    }
  };

  // 处理分类展开/收起
  const handleCategoryToggle = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // 处理帮助项展开/收起
  const handleHelpItemToggle = (itemKey) => {
    setExpandedHelpItem(prev => prev === itemKey ? null : itemKey);
  };

  // 处理头像更换
  const handleChangeAvatar = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      // 检查文件大小（限制为 5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB');
        return;
      }
      // 创建本地预览 URL
      const imageUrl = URL.createObjectURL(file);
      // 更新表单状态，但不保存到 localStorage
      const newForm = { ...profileForm, avatar: imageUrl };
      setProfileForm(newForm);
      // 检测是否有修改
      const hasChanges = Object.keys(newForm).some(key => newForm[key] !== originalProfileForm[key]);
      setHasProfileChanges(hasChanges);
    }
  };

  // 处理个人资料表单变化
  const handleProfileChange = (field, value) => {
    const newForm = { ...profileForm, [field]: value };
    setProfileForm(newForm);
    // 检测是否有修改
    const hasChanges = Object.keys(newForm).some(key => newForm[key] !== originalProfileForm[key]);
    setHasProfileChanges(hasChanges);
  };

  // 保存个人资料
  const handleSaveProfile = () => {
    if (!hasProfileChanges) {
      return; // 没有修改时不执行保存
    }
    // 保存到 localStorage
    localStorage.setItem('nickname', profileForm.nickname);
    localStorage.setItem('email', profileForm.email);
    localStorage.setItem('phone', profileForm.phone);
    localStorage.setItem('userAvatar', profileForm.avatar);
    // 更新原始值
    setOriginalProfileForm({ ...profileForm });
    setHasProfileChanges(false);
    // 通知父组件昵称变化
    if (onNicknameChange) {
      onNicknameChange(profileForm.nickname);
    }
    // 显示提示
    setShowAvatarToast(true);
    setTimeout(() => {
      setShowAvatarToast(false);
    }, 2000);
  };

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendVerifyCode = () => {
    setCountdown(60);
  };

  // 保存密码
  const handleSavePassword = () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('请填写完整信息');
      return;
    }
    // 验证原密码
    const storedPassword = localStorage.getItem('userPassword') || '123456';
    if (passwordForm.oldPassword !== storedPassword) {
      alert('原密码错误，请重新输入');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('新密码长度不能少于6位');
      return;
    }
    // 保存新密码到 localStorage
    localStorage.setItem('userPassword', passwordForm.newPassword);
    alert('密码修改成功');
    setShowPasswordModal(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  // 保存手机号
  const handleSavePhone = () => {
    if (!phoneForm.newPhone || !phoneForm.verifyCode) {
      alert('请填写完整信息');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phoneForm.newPhone)) {
      alert('请输入正确的手机号');
      return;
    }
    localStorage.setItem('phone', phoneForm.newPhone);
    setPhoneForm(prev => ({ ...prev, oldPhone: phoneForm.newPhone, newPhone: '', verifyCode: '' }));
    alert('手机号更换成功');
    setShowPhoneModal(false);
  };

  // 保存邮箱
  const handleSaveEmail = () => {
    if (!emailForm.email || !emailForm.verifyCode) {
      alert('请填写完整信息');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email)) {
      alert('请填写正确的邮箱');
      return;
    }
    localStorage.setItem('email', emailForm.email);
    setEmailForm({ email: '', verifyCode: '' });
    alert('邮箱绑定成功');
    setShowEmailModal(false);
  };

  // 关闭密码弹窗并清除数据
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  // 关闭手机弹窗并清除数据
  const handleClosePhoneModal = () => {
    setShowPhoneModal(false);
    setPhoneForm(prev => ({ ...prev, newPhone: '', verifyCode: '' }));
  };

  // 关闭邮箱弹窗并清除数据
  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setEmailForm({ email: '', verifyCode: '' });
  };

  const renderSubPage = () => {
    switch (activeSubPage) {
      case 'profile':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>个人资料</h3>
            </div>
            <div className="profile-content">
              <div className="profile-avatar">
                {/* 保存成功提示 */}
                {showAvatarToast && (
                  <div className="toast-message avatar-toast">
                    修改成功
                  </div>
                )}
                <div className="avatar-placeholder">
                  {profileForm.avatar ? (
                    <img src={profileForm.avatar} alt="头像" className="avatar-image" />
                  ) : (
                    'I'
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button className="change-avatar-btn" onClick={handleChangeAvatar}>
                  更换头像
                </button>
              </div>
              <div className="profile-form">
                <div className="form-group">
                  <label>用户名</label>
                  <input type="text" defaultValue="admin" readOnly />
                </div>
                <div className="form-group">
                  <label>昵称</label>
                  <input
                    type="text"
                    placeholder="请输入昵称"
                    value={profileForm.nickname}
                    onChange={(e) => handleProfileChange('nickname', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>手机号</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                  />
                </div>
                <button
                  className={`save-btn ${!hasProfileChanges ? 'disabled' : ''}`}
                  onClick={handleSaveProfile}
                  disabled={!hasProfileChanges}
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>账户安全</h3>
            </div>
            <div className="security-content">
              <div className="security-score">
                <div className="score-label-top">安全等级</div>
                <div className="score-circle high">
                  <span className="score">高</span>
                </div>
                <div className="score-label-bottom">您的账户安全状况良好</div>
              </div>
              <div className="security-list">
                <div className="security-item">
                  <div className="item-info">
                    <span className="item-name">登录密码</span>
                    <span className="item-status">已设置</span>
                  </div>
                  <button className="edit-btn" onClick={() => setShowPasswordModal(true)}>修改</button>
                </div>
                <div className="security-item">
                  <div className="item-info">
                    <span className="item-name">手机绑定</span>
                    <span className="item-status">{phoneForm.oldPhone}</span>
                  </div>
                  <button className="edit-btn" onClick={() => setShowPhoneModal(true)}>更换</button>
                </div>
                <div className="security-item">
                  <div className="item-info">
                    <span className="item-name">邮箱绑定</span>
                    <span className={`item-status ${localStorage.getItem('email') ? '' : 'status-warning'}`}>
                      {localStorage.getItem('email') || '未绑定'}
                    </span>
                  </div>
                  <button className="edit-btn" onClick={() => setShowEmailModal(true)}>
                    {localStorage.getItem('email') ? '更换' : '绑定'}
                  </button>
                </div>
              </div>
            </div>

            {/* 修改密码弹窗 */}
            {showPasswordModal && (
              <div className="modal-overlay" onClick={handleClosePasswordModal}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h4>修改密码</h4>
                  <div className="form-group">
                    <label>原密码</label>
                    <input
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      placeholder="请输入原密码"
                    />
                  </div>
                  <div className="form-group">
                    <label>新密码</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="请输入新密码（至少6位）"
                    />
                  </div>
                  <div className="form-group">
                    <label>确认新密码</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="请再次输入新密码"
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={handleClosePasswordModal}>取消</button>
                    <button className="confirm-btn" onClick={handleSavePassword}>确认</button>
                  </div>
                </div>
              </div>
            )}

            {/* 更换手机弹窗 */}
            {showPhoneModal && (
              <div className="modal-overlay" onClick={handleClosePhoneModal}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h4>更换手机号</h4>
                  <div className="form-group">
                    <label>原手机号</label>
                    <input type="text" value={phoneForm.oldPhone} readOnly />
                  </div>
                  <div className="form-group">
                    <label>新手机号</label>
                    <input
                      type="tel"
                      value={phoneForm.newPhone}
                      onChange={e => setPhoneForm({ ...phoneForm, newPhone: e.target.value })}
                      placeholder="请输入新手机号"
                    />
                  </div>
                  <div className="form-group verify-group">
                    <label>验证码</label>
                    <div className="verify-input-group">
                      <input
                        type="text"
                        value={phoneForm.verifyCode}
                        onChange={e => setPhoneForm({ ...phoneForm, verifyCode: e.target.value })}
                        placeholder="请输入验证码"
                      />
                      <button
                        className="verify-btn"
                        onClick={handleSendVerifyCode}
                        disabled={countdown > 0}
                      >
                        {countdown > 0 ? `${countdown}s` : '获取验证码'}
                      </button>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={handleClosePhoneModal}>取消</button>
                    <button className="confirm-btn" onClick={handleSavePhone}>确认</button>
                  </div>
                </div>
              </div>
            )}

            {/* 绑定邮箱弹窗 */}
            {showEmailModal && (
              <div className="modal-overlay" onClick={handleCloseEmailModal}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h4>{localStorage.getItem('email') ? '更换邮箱' : '绑定邮箱'}</h4>
                  <div className="form-group">
                    <label>邮箱地址</label>
                    <input
                      type="email"
                      value={emailForm.email}
                      onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
                      placeholder="请输入邮箱地址"
                    />
                  </div>
                  <div className="form-group verify-group">
                    <label>验证码</label>
                    <div className="verify-input-group">
                      <input
                        type="text"
                        value={emailForm.verifyCode}
                        onChange={e => setEmailForm({ ...emailForm, verifyCode: e.target.value })}
                        placeholder="请输入验证码"
                      />
                      <button
                        className="verify-btn"
                        onClick={handleSendVerifyCode}
                        disabled={countdown > 0}
                      >
                        {countdown > 0 ? `${countdown}s` : '获取验证码'}
                      </button>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={handleCloseEmailModal}>取消</button>
                    <button className="confirm-btn" onClick={handleSaveEmail}>确认</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'notifications':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>通知管理</h3>
            </div>
            <div className="notification-content">
              <div className="notification-group">
                <h4>系统通知</h4>
                <div className="notification-item">
                  <div className="item-info">
                    <span className="item-name">账户安全提醒</span>
                    <span className="item-desc">登录异常、密码修改等安全事件</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.accountSecurity}
                      onChange={() => handleNotificationToggle('accountSecurity')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="notification-item">
                  <div className="item-info">
                    <span className="item-name">投资消息推送</span>
                    <span className="item-desc">自选股票、基金的实时动态</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.investmentPush}
                      onChange={() => handleNotificationToggle('investmentPush')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              <div className="notification-group">
                <h4>邮件通知</h4>
                <div className="notification-item">
                  <div className="item-info">
                    <span className="item-name">邮件订阅</span>
                    <span className="item-desc">接收每周投资报告、市场分析</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.emailSubscription}
                      onChange={() => handleNotificationToggle('emailSubscription')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              <div className="notification-group">
                <h4>免打扰设置</h4>
                <div className="notification-item">
                  <div className="item-info">
                    <span className="item-name">夜间免打扰</span>
                    <span className="item-desc">22:00 - 08:00 不推送消息</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.nightMode}
                      onChange={() => handleNotificationToggle('nightMode')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'appearance':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>外观设置</h3>
            </div>
            <div className="appearance-content">
              <div className="theme-options">
                <div
                  className={`theme-option ${currentThemeMode === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <div className="theme-preview light">
                    <div className="preview-header"></div>
                    <div className="preview-content"></div>
                  </div>
                  <span>浅色模式</span>
                  {currentThemeMode === 'light' && <span className="check-mark">✓</span>}
                </div>
                <div
                  className={`theme-option ${currentThemeMode === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <div className="theme-preview dark">
                    <div className="preview-header"></div>
                    <div className="preview-content"></div>
                  </div>
                  <span>深色模式</span>
                  {currentThemeMode === 'dark' && <span className="check-mark">✓</span>}
                </div>
                <div
                  className={`theme-option ${currentThemeMode === 'system' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('system')}
                >
                  <div className="theme-preview system">
                    <div className="preview-header"></div>
                    <div className="preview-content"></div>
                  </div>
                  <span>跟随系统</span>
                  {currentThemeMode === 'system' && <span className="check-mark">✓</span>}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'language':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>语言设置</h3>
            </div>
            <div className="language-content">
              <div 
                className={`language-option ${language === 'zh-CN' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('zh-CN')}
              >
                <span>简体中文</span>
                {language === 'zh-CN' && <span className="check-mark">✓</span>}
              </div>
              <div 
                className={`language-option ${language === 'zh-TW' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('zh-TW')}
              >
                <span>繁體中文</span>
                {language === 'zh-TW' && <span className="check-mark">✓</span>}
              </div>
              <div 
                className={`language-option ${language === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                <span>English</span>
                {language === 'en' && <span className="check-mark">✓</span>}
              </div>
            </div>
          </div>
        );
      
      case 'resources':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>资源管理</h3>
            </div>
            <div className="resource-content">
              <div className="resource-section">
                <h4>股票页面</h4>
                <div className="resource-item">
                  <div className="item-info">
                    <span className="item-name">投资推荐模块</span>
                    <span className="item-desc">显示股票推荐和投资建议</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={resourceSettings.stockRecommendation}
                      onChange={() => handleResourceToggle('stockRecommendation')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="resource-item">
                  <div className="item-info">
                    <span className="item-name">投资排行榜模块</span>
                    <span className="item-desc">显示热门股票排行榜</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={resourceSettings.stockRanking}
                      onChange={() => handleResourceToggle('stockRanking')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              <div className="resource-section">
                <h4>基金页面</h4>
                <div className="resource-item">
                  <div className="item-info">
                    <span className="item-name">投资推荐模块</span>
                    <span className="item-desc">显示基金推荐和投资建议</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={resourceSettings.fundRecommendation}
                      onChange={() => handleResourceToggle('fundRecommendation')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="resource-item">
                  <div className="item-info">
                    <span className="item-name">投资排行榜模块</span>
                    <span className="item-desc">显示热门基金排行榜</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={resourceSettings.fundRanking}
                      onChange={() => handleResourceToggle('fundRanking')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'help':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>使用帮助</h3>
            </div>
            <div className="help-content">
              <div className="help-search">
                <input
                  type="text"
                  placeholder="搜索帮助内容..."
                  value={helpSearchQuery}
                  onChange={(e) => setHelpSearchQuery(e.target.value)}
                  onKeyDown={handleHelpSearchKeyDown}
                />
                <button className="search-btn" onClick={handleHelpSearch}>搜索</button>
              </div>

              {/* 搜索结果 */}
              {hasSearched && (
                <div className="help-search-results">
                  {helpSearchResults.length > 0 ? (
                    <>
                      <h4>搜索结果 ({helpSearchResults.length}条)</h4>
                      {helpSearchResults.map((result, index) => (
                        <div key={index} className="help-result-item">
                          <div className="result-category">{result.category}</div>
                          <div className="result-title">{result.title}</div>
                          <div className="result-content">{result.content}</div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="help-no-results">未找到相关内容，请尝试其他关键词</div>
                  )}
                </div>
              )}

              {/* 默认分类显示 */}
              {!hasSearched && (
              <div className="help-categories">
                <div className="help-category">
                  <div className="category-header" onClick={() => handleCategoryToggle('新手指南')}>
                    <span>新手指南</span>
                    <span className={`expand-icon ${expandedCategories['新手指南'] ? 'expanded' : ''}`}>
                      {expandedCategories['新手指南'] ? '−' : '+'}
                    </span>
                  </div>
                  <div className={`category-content ${!expandedCategories['新手指南'] ? 'collapsed' : ''}`}>
                    <div className="help-item-wrapper">
                      <div className="help-item" onClick={() => handleHelpItemToggle('register')}>如何注册账号？</div>
                      <div className={`help-item-detail ${expandedHelpItem === 'register' ? 'expanded' : ''}`}>
                        点击登录页面的"注册"按钮，填写手机号和密码即可完成注册。
                      </div>
                    </div>
                    <div className="help-item-wrapper">
                      <div className="help-item" onClick={() => handleHelpItemToggle('search')}>如何搜索股票？</div>
                      <div className={`help-item-detail ${expandedHelpItem === 'search' ? 'expanded' : ''}`}>
                        在首页输入框中输入股票代码或名称，点击搜索按钮即可查询。
                      </div>
                    </div>
                    <div className="help-item-wrapper">
                      <div className="help-item" onClick={() => handleHelpItemToggle('favorite')}>如何添加自选？</div>
                      <div className={`help-item-detail ${expandedHelpItem === 'favorite' ? 'expanded' : ''}`}>
                        在股票详情页点击"加入自选"按钮即可添加到自选列表。
                      </div>
                    </div>
                  </div>
                </div>
                <div className="help-category">
                  <div className="category-header" onClick={() => handleCategoryToggle('功能介绍')}>
                    <span>功能介绍</span>
                    <span className={`expand-icon ${expandedCategories['功能介绍'] ? 'expanded' : ''}`}>
                      {expandedCategories['功能介绍'] ? '−' : '+'}
                    </span>
                  </div>
                  <div className={`category-content ${!expandedCategories['功能介绍'] ? 'collapsed' : ''}`}>
                    <div className="help-item-wrapper">
                      <div className="help-item" onClick={() => handleHelpItemToggle('recommendation')}>投资推荐功能说明</div>
                      <div className={`help-item-detail ${expandedHelpItem === 'recommendation' ? 'expanded' : ''}`}>
                        系统根据市场数据和算法分析，为您推荐潜在的投资机会。
                      </div>
                    </div>
                    <div className="help-item-wrapper">
                      <div className="help-item" onClick={() => handleHelpItemToggle('ranking')}>排行榜如何计算？</div>
                      <div className={`help-item-detail ${expandedHelpItem === 'ranking' ? 'expanded' : ''}`}>
                        排行榜根据年涨幅、成交量等多维度数据综合计算得出。
                      </div>
                    </div>
                    <div className="help-item-wrapper">
                      <div className="help-item" onClick={() => handleHelpItemToggle('metal-data')}>贵金属数据来源</div>
                      <div className={`help-item-detail ${expandedHelpItem === 'metal-data' ? 'expanded' : ''}`}>
                        贵金属数据来自权威金融机构实时报价。
                      </div>
                    </div>
                  </div>
                </div>
                <div className="help-category">
                  <div className="category-header" onClick={() => handleCategoryToggle('常见问题')}>
                    <span>常见问题（FAQ）</span>
                    <span className={`expand-icon ${expandedCategories['常见问题'] ? 'expanded' : ''}`}>
                      {expandedCategories['常见问题'] ? '−' : '+'}
                    </span>
                  </div>
                  <div className={`category-content ${!expandedCategories['常见问题'] ? 'collapsed' : ''}`}>
                    <div className="help-item-wrapper">
                      <div className="help-item" onClick={() => handleHelpItemToggle('update-frequency')}>数据更新频率？</div>
                      <div className={`help-item-detail ${expandedHelpItem === 'update-frequency' ? 'expanded' : ''}`}>
                        股票和基金数据每15分钟更新一次，贵金属数据实时更新。
                      </div>
                    </div>
                    <div className="help-item-wrapper">
                      <div className="help-item" onClick={() => handleHelpItemToggle('export')}>如何导出数据？</div>
                      <div className={`help-item-detail ${expandedHelpItem === 'export' ? 'expanded' : ''}`}>
                        在详情页点击"导出"按钮，可将数据导出为Excel或PDF格式。
                      </div>
                    </div>
                    <div className="help-item-wrapper">
                      <div className="help-item" onClick={() => handleHelpItemToggle('security')}>账户安全如何保障？</div>
                      <div className={`help-item-detail ${expandedHelpItem === 'security' ? 'expanded' : ''}`}>
                        我们采用银行级加密技术，确保您的账户信息安全。
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        );
      
      case 'feedback':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>意见反馈</h3>
            </div>
            <div className="feedback-content">
              <div className="feedback-type">
                <label>反馈类型</label>
                <div className="type-options">
                  {['suggestion', 'problem', 'complaint', 'other'].map(type => (
                    <button 
                      key={type}
                      className={`type-btn ${feedbackType === type ? 'active' : ''}`}
                      onClick={() => setFeedbackType(type)}
                    >
                      {type === 'suggestion' && '功能建议'}
                      {type === 'problem' && '问题反馈'}
                      {type === 'complaint' && '投诉举报'}
                      {type === 'other' && '其他'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="feedback-textarea">
                <label>反馈内容 <span className="char-count">{feedbackContent.length}/1000</span></label>
                <textarea 
                  placeholder="请详细的问题或建议（描述您至少10个字符）..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  maxLength={1000}
                />
              </div>
              <div className="feedback-contact">
                <label>联系方式（选填）</label>
                <input 
                  type="text" 
                  placeholder="手机号或邮箱"
                  value={feedbackContact}
                  onChange={(e) => setFeedbackContact(e.target.value)}
                />
              </div>
              <button className="submit-feedback-btn" onClick={handleSubmitFeedback}>
                提交反馈
              </button>
            </div>
            {showFeedbackToast && (
              <div className="feedback-toast">
                反馈已提交，我们会尽快处理
              </div>
            )}
          </div>
        );
      
      case 'contact':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>联系客服</h3>
            </div>
            <div className="contact-content">
              <div className="contact-item" onClick={() => alert('即将跳转到在线客服...')}>
                <div className="contact-icon">💬</div>
                <div className="contact-info">
                  <span className="contact-name">在线客服</span>
                  <span className="contact-desc">工作日 9:00-18:00</span>
                </div>
                <span className="contact-arrow">></span>
              </div>
              <div className="contact-item" onClick={() => alert('即将拨打 400-XXX-XXXX')}>
                <div className="contact-icon">📞</div>
                <div className="contact-info">
                  <span className="contact-name">客服电话</span>
                  <span className="contact-desc">400-XXX-XXXX</span>
                </div>
                <span className="contact-arrow">></span>
              </div>
              <div className="contact-item" onClick={() => {
                navigator.clipboard.writeText('support@iat.com');
                alert('客服邮箱已复制到剪贴板');
              }}>
                <div className="contact-icon">📧</div>
                <div className="contact-info">
                  <span className="contact-name">客服邮箱</span>
                  <span className="contact-desc">support@iat.com</span>
                </div>
                <span className="contact-arrow">></span>
              </div>
            </div>
          </div>
        );
      
      case 'privacy':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>隐私协议</h3>
            </div>
            <div className="privacy-content">
              <div className="privacy-section">
                <h4>个人信息收集清单</h4>
                <ul>
                  <li>账户信息（用户名、邮箱、手机号）</li>
                  <li>使用数据（搜索记录、浏览历史）</li>
                  <li>设备信息（设备型号、操作系统版本）</li>
                </ul>
              </div>
              <div className="privacy-section">
                <h4>第三方SDK列表</h4>
                <ul>
                  <li>友盟统计SDK</li>
                  <li>极光推送SDK</li>
                  <li>微信分享SDK</li>
                </ul>
              </div>
              <button className="export-privacy-btn">导出PDF</button>
            </div>
          </div>
        );
      
      case 'about':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>关于IAT</h3>
            </div>
            <div className="about-content">
              <div className="about-header">
                <img src="/src/assets/Logo_2.png" alt="IAT Logo" className="about-logo" />
                <h4>IAT</h4>
                <span className="version">V2.5.1</span>
              </div>
              <div className="about-links">
                <div className="about-link" onClick={() => setActiveSubPage('privacy')}>
                  <span>隐私政策</span>
                  <span className="arrow">></span>
                </div>
                <div className="about-link">
                  <span>用户协议</span>
                  <span className="arrow">></span>
                </div>
                <div className="about-link">
                  <span>第三方信息共享清单</span>
                  <span className="arrow">></span>
                </div>
                <div className="about-link">
                  <span>开源许可</span>
                  <span className="arrow">></span>
                </div>
              </div>
              <div className="about-footer">
                <p>Copyright © 2026 IAT Inc.</p>
              </div>
            </div>
          </div>
        );
      
      case 'cancel':
        return (
          <div className="settings-subpage">
            <div className="subpage-header">
              <button className="back-button" onClick={handleBackToMain} aria-label="返回">
                <span className="back-icon">&lt;</span>
                <span className="back-text">返回</span>
              </button>
              <h3>注销账户</h3>
            </div>
            <div className="cancel-content">
              <div className="cancel-warning">
                <h4>注销账户前请阅读</h4>
                <div className="warning-box">
                  <p>注销账户后将产生以下后果：</p>
                  <ul>
                    <li>所有个人数据将被删除</li>
                    <li>投资记录和自选股将无法恢复</li>
                    <li>账户权益将立即清零</li>
                    <li>注销后需重新注册才能使用</li>
                  </ul>
                </div>
              </div>
              <div className="cancel-agreement">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={cancelAgreed}
                    onChange={(e) => setCancelAgreed(e.target.checked)}
                  />
                  <span>我已阅读并了解注销后果</span>
                </label>
              </div>
              <div className="cancel-steps">
                <button 
                  className={`next-step-btn ${cancelAgreed ? 'active' : ''}`}
                  disabled={!cancelAgreed}
                >
                  下一步
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`settings-page ${darkMode ? 'dark-mode' : ''}`}>
      {activeSubPage ? (
        renderSubPage()
      ) : (
        <>
          <div className="settings-header">
            <h2>设置</h2>
          </div>
          <div className="settings-section">
            <div className="settings-group">
              <div className="group-header">
                <h3>账户信息</h3>
              </div>
              <div className="settings-item" onClick={() => setActiveSubPage('profile')}>
                <span className="item-name">个人资料</span>
                <span className="item-arrow">></span>
              </div>
            </div>

            <div className="settings-group">
              <div className="group-header">
                <h3>安全与权限</h3>
              </div>
              <div className="settings-item" onClick={() => setActiveSubPage('security')}>
                <span className="item-name">账户安全</span>
                <span className="item-status security-high">高</span>
                <span className="item-arrow">></span>
              </div>
              <div className="settings-item" onClick={() => setActiveSubPage('notifications')}>
                <span className="item-name">通知管理</span>
                <span className="item-arrow">></span>
              </div>
            </div>

            <div className="settings-group">
              <div className="group-header">
                <h3>个性化</h3>
              </div>
              <div className="settings-item" onClick={() => setActiveSubPage('appearance')}>
                <span className="item-name">外观设置</span>
                <span className="item-desc">
                  {currentThemeMode === 'light' ? '浅色模式' : currentThemeMode === 'dark' ? '深色模式' : '跟随系统'}
                </span>
                <span className="item-arrow">></span>
              </div>
              <div className="settings-item" onClick={() => setActiveSubPage('language')}>
                <span className="item-name">语言设置</span>
                <span className="item-desc">
                  {language === 'zh-CN' ? '简体中文' : language === 'zh-TW' ? '繁體中文' : 'English'}
                </span>
                <span className="item-arrow">></span>
              </div>
            </div>

            <div className="settings-group">
              <div className="group-header">
                <h3>系统工具</h3>
              </div>
              <div className="settings-item" onClick={() => setActiveSubPage('resources')}>
                <span className="item-name">资源管理</span>
                <span className="item-arrow">></span>
              </div>
              <div className="settings-item" onClick={() => setActiveSubPage('help')}>
                <span className="item-name">使用帮助</span>
                <span className="item-arrow">></span>
              </div>
              <div className="settings-item" onClick={() => setActiveSubPage('feedback')}>
                <span className="item-name">意见反馈</span>
                <span className="item-arrow">></span>
              </div>
              <div className="settings-item" onClick={() => setActiveSubPage('contact')}>
                <span className="item-name">联系客服</span>
                <span className="item-arrow">></span>
              </div>
            </div>

            <div className="settings-group">
              <div className="group-header">
                <h3>法律信息</h3>
              </div>
              <div className="settings-item" onClick={() => setActiveSubPage('privacy')}>
                <span className="item-name">隐私协议</span>
                <span className="item-arrow">></span>
              </div>
              <div className="settings-item" onClick={() => setActiveSubPage('about')}>
                <span className="item-name">关于IAT</span>
                <span className="item-desc">V2.5.1</span>
                <span className="item-arrow">></span>
              </div>
            </div>

            <div className="settings-group action-group">
              <div className="settings-item action-item logout-item" onClick={handleLogout}>
                <span className="item-name">退出登录</span>
              </div>
            </div>

            <div className="settings-group action-group danger-zone">
              <div className="settings-item action-item cancel-item" onClick={() => setActiveSubPage('cancel')}>
                <span className="item-name danger-text">注销账户</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Settings;
