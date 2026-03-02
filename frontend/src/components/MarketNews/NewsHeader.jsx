import { useState, useEffect } from 'react';
import { CATEGORY_CONFIG } from '../../types/news';

const NewsHeader = ({ showImportantOnly, onToggleImportant, selectedCategory, onSelectCategory, searchKeyword, onSearchChange, selectedDate, onSelectDate, availableDates = [] }) => {
  const [currentDate, setCurrentDate] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [inputValue, setInputValue] = useState(searchKeyword);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // 获取当前选中的日期对象
  const getSelectedDateObj = () => {
    if (!selectedDate) return null;
    const match = selectedDate.match(/(\d+)月(\d+)日/);
    if (match) {
      const year = new Date().getFullYear();
      return new Date(year, parseInt(match[1]) - 1, parseInt(match[2]));
    }
    return null;
  };

  // 生成日历数据
  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // 检查日期是否有资讯
  const hasNewsOnDate = (date) => {
    const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
    return availableDates.includes(dateStr);
  };

  // 检查日期是否被选中
  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    const match = selectedDate.match(/(\d+)月(\d+)日/);
    if (match) {
      const selectedMonth = parseInt(match[1]) - 1;
      const selectedDay = parseInt(match[2]);
      return date.getMonth() === selectedMonth && date.getDate() === selectedDay;
    }
    return false;
  };

  // 切换月份
  const changeMonth = (delta) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCalendarMonth(newMonth);
  };

  // 选择日期
  const handleDateSelect = (date) => {
    const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
    onSelectDate(dateStr);
    setShowDateDropdown(false);
  };

  // 清除日期选择
  const clearDateSelect = () => {
    onSelectDate(null);
    setShowDateDropdown(false);
  };

  // 更新日期显示
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekday = weekdays[now.getDay()];
      setCurrentDate({ year, month, day, weekday, full: `${year}年${month}月${day}日` });
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  // 获取当前选中的分类名称
  const getSelectedCategoryName = () => {
    if (!selectedCategory) return '全部分类';
    return CATEGORY_CONFIG[selectedCategory]?.name || '全部分类';
  };

  // 获取分类图标
  const getCategoryIcon = (key) => {
    const icons = {
      policy: '📋',
      stock: '📈',
      fund: '💰',
      metal: '🥇',
      company: '🏢',
      industry: '🏭',
      exchange: '🏛️',
      international: '🌍'
    };
    return icons[key] || '📊';
  };

  return (
    <div className="news-header">
      {/* 顶部装饰条 */}
      <div className="header-accent-bar"></div>
      
      <div className="news-header-main">
        {/* 筛选器区域 */}
        <div className="news-filters">
          {/* 搜索输入框 */}
          <div className={`search-box ${isSearchFocused ? 'focused' : ''}`}>
            <span className="search-icon" onClick={() => onSearchChange(inputValue)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 14L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索资讯内容..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearchChange(inputValue);
                }
              }}
            />
            {inputValue && (
              <button
                className="search-clear"
                onClick={() => {
                  setInputValue('');
                  onSearchChange('');
                }}
                aria-label="清除搜索"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* 日期筛选日历 */}
          <div className="date-filter">
            <button
              className="date-filter-btn"
              onClick={() => setShowDateDropdown(!showDateDropdown)}
            >
              <span className="filter-text">{selectedDate || '选择日期'}</span>
              <span className="filter-icon calendar-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
            </button>

            {showDateDropdown && (
              <div className="calendar-dropdown">
                {/* 日历头部 */}
                <div className="calendar-header">
                  <button 
                    className="calendar-nav-btn" 
                    onClick={() => changeMonth(-1)}
                    aria-label="上个月"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M7.5 2L4.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <span className="calendar-title">
                    {calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月
                  </span>
                  <button 
                    className="calendar-nav-btn" 
                    onClick={() => changeMonth(1)}
                    aria-label="下个月"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M4.5 2L7.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* 星期标题 */}
                <div className="calendar-weekdays">
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                    <span key={day} className="weekday-label">{day}</span>
                  ))}
                </div>

                {/* 日期网格 */}
                <div className="calendar-days">
                  {generateCalendarDays().map((date, index) => {
                    const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                    const isSelected = isDateSelected(date);
                    const hasNews = hasNewsOnDate(date);
                    
                    return (
                      <button
                        key={index}
                        className={`calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isSelected ? 'selected' : ''} ${hasNews ? 'has-news' : ''}`}
                        onClick={() => handleDateSelect(date)}
                        disabled={!hasNews}
                      >
                        <span className="day-number">{date.getDate()}</span>
                        {hasNews && <span className="news-dot"></span>}
                      </button>
                    );
                  })}
                </div>

                {/* 底部操作 */}
                <div className="calendar-footer">
                  <button className="calendar-clear-btn" onClick={clearDateSelect}>
                    全部日期
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 分类筛选下拉框 */}
          <div className="category-filter">
            <button
              className="category-filter-btn"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <span className="filter-icon">{getCategoryIcon(selectedCategory)}</span>
              <span className="filter-text">{getSelectedCategoryName()}</span>
              <span className={`dropdown-arrow ${showCategoryDropdown ? 'open' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
            
            {showCategoryDropdown && (
              <div className="category-dropdown">
                <div className="dropdown-header">
                  <span>选择分类</span>
                </div>
                <div 
                  className={`category-option ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => {
                    onSelectCategory(null);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <span className="category-icon">📊</span>
                  <span className="category-name">全部分类</span>
                </div>
                {Object.values(CATEGORY_CONFIG).map(config => (
                  <div
                    key={config.key}
                    className={`category-option ${selectedCategory === config.key ? 'active' : ''}`}
                    onClick={() => {
                      onSelectCategory(config.key);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <span className="category-icon">{getCategoryIcon(config.key)}</span>
                    <span className="category-name">{config.name}</span>
                    <span 
                      className="category-dot"
                      style={{ backgroundColor: config.color }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 只看重要开关 - 移到最右侧 */}
        <div className="important-filter">
          <span className="filter-label">只看重要</span>
          <button 
            className={`toggle-switch ${showImportantOnly ? 'active' : ''}`}
            onClick={onToggleImportant}
            aria-label="只看重要"
          >
            <span className="toggle-slider"></span>
          </button>
        </div>
      </div>

      {/* 点击外部关闭下拉框 */}
      {(showCategoryDropdown || showDateDropdown) && (
        <div
          className="dropdown-overlay"
          onClick={() => {
            setShowCategoryDropdown(false);
            setShowDateDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default NewsHeader;
