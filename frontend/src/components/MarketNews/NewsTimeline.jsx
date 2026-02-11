import { useEffect, useRef, useState } from 'react';
import NewsCard from './NewsCard';

const NewsTimeline = ({ newsList, loading, hasMore, onLoadMore, onRefresh, refreshing }) => {
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const [selectedNews, setSelectedNews] = useState(null);

  // 无限滚动观察器
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, onLoadMore]);

  // 按日期和时间分组资讯
  const groupByDate = (newsList) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = null;

    newsList.forEach((news, index) => {
      // 从timestamp提取日期
      const date = new Date(news.timestamp);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (dateKey !== currentDate) {
        // 新日期，创建新分组
        currentDate = dateKey;
        currentGroup = {
          date: date,
          dateKey: dateKey,
          items: []
        };
        groups.push(currentGroup);
      }
      
      currentGroup.items.push({
        ...news,
        isFirstInList: index === 0
      });
    });

    return groups;
  };

  // 格式化日期显示
  const formatDate = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (dateObj.getTime() === today.getTime()) {
      return '今天';
    } else if (dateObj.getTime() === yesterday.getTime()) {
      return '昨天';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  // 获取星期几
  const getWeekday = (date) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  };

  const dateGroups = groupByDate(newsList);

  return (
    <div className="news-timeline">
      {/* 下拉刷新提示 */}
      {refreshing && (
        <div className="refresh-indicator">
          <div className="loading-spinner small"></div>
          <span>正在刷新...</span>
        </div>
      )}

      <div className="timeline-container">
        {/* 资讯列表 */}
        <div className="news-list">
          {dateGroups.map((group, groupIndex) => (
            <div key={group.dateKey} className="news-date-group">
              {/* 日期分隔 - 作为时间轴节点 */}
              <div className="date-divider">
                {/* 左侧时间轴节点 */}
                <div className="date-timeline-node">
                  <div className="date-node-dot"></div>
                  <div className="date-node-line-top"></div>
                  <div className="date-node-line-bottom"></div>
                </div>
                {/* 日期内容 */}
                <div className="date-divider-content">
                  <span className="date-text">{formatDate(group.date)}</span>
                  <span className="weekday-text">{getWeekday(group.date)}</span>
                </div>
                {/* 右侧分隔线 */}
                <div className="date-divider-line"></div>
              </div>

              {/* 该日期下的资讯 */}
              <div className="date-news-items">
                {group.items.map((news, index) => (
                  <NewsCard
                    key={news.id}
                    news={news}
                    isFirst={news.isFirstInList}
                    isExpanded={selectedNews?.id === news.id}
                    onToggle={() => {
                      setSelectedNews(selectedNews?.id === news.id ? null : news);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 加载更多触发器 */}
      <div ref={loadMoreRef} className="load-more-trigger">
        {!hasMore && newsList.length > 0 && (
          <div className="no-more">
            <span>没有更多资讯了</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsTimeline;
