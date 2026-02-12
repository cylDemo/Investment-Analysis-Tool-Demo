import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import NewsHeader from './NewsHeader';
import NewsTimeline from './NewsTimeline';
import NewsEmpty from './NewsEmpty';
import WatchListPanel from './WatchListPanel';
import { fetchNewsList } from '../../services/newsApi';
import './MarketNews.css';

const MarketNews = () => {
  const [newsList, setNewsList] = useState([]);
  const [filteredNewsList, setFilteredNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showImportantOnly, setShowImportantOnly] = useState(() => {
    return localStorage.getItem('newsShowImportantOnly') === 'true';
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showWatchList, setShowWatchList] = useState(false);
  const [watchedNews, setWatchedNews] = useState(() => {
    const saved = localStorage.getItem('watchedNews');
    return saved ? JSON.parse(saved) : [];
  });
  const loadingRef = useRef(false);

  // 获取可用的日期列表
  const availableDates = useMemo(() => {
    const dates = new Set();
    newsList.forEach(news => {
      const date = new Date(news.timestamp);
      const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
      dates.add(dateStr);
    });
    return Array.from(dates).sort((a, b) => {
      // 按日期倒序排列
      const parseDate = (str) => {
        const match = str.match(/(\d+)月(\d+)日/);
        if (match) {
          return new Date(2025, parseInt(match[1]) - 1, parseInt(match[2]));
        }
        return new Date();
      };
      return parseDate(b) - parseDate(a);
    });
  }, [newsList]);

  // 加载资讯列表
  const loadNews = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await fetchNewsList({
        page: pageNum,
        size: 50,
        important: showImportantOnly || undefined,
        category: selectedCategory || undefined
      });

      if (isRefresh || pageNum === 1) {
        setNewsList(response.list);
        setFilteredNewsList(response.list);
      } else {
        setNewsList(prev => {
          const newList = [...prev, ...response.list];
          setFilteredNewsList(newList);
          return newList;
        });
      }
      
      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || '资讯加载失败');
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [showImportantOnly, selectedCategory]);

  // 初始加载
  useEffect(() => {
    loadNews(1);
  }, [loadNews]);

  // 筛选条件变化时重新加载
  useEffect(() => {
    loadNews(1);
  }, [showImportantOnly, selectedCategory]);

  // 保存筛选状态
  useEffect(() => {
    localStorage.setItem('newsShowImportantOnly', showImportantOnly.toString());
  }, [showImportantOnly]);

  // 保存特别关注列表
  useEffect(() => {
    localStorage.setItem('watchedNews', JSON.stringify(watchedNews));
  }, [watchedNews]);

  // 添加/移除特别关注
  const toggleWatchNews = useCallback((news) => {
    setWatchedNews(prev => {
      const exists = prev.find(item => item.id === news.id);
      if (exists) {
        return prev.filter(item => item.id !== news.id);
      } else {
        return [...prev, { ...news, watchedAt: new Date().toISOString() }];
      }
    });
  }, []);

  // 检查是否已关注
  const isNewsWatched = useCallback((newsId) => {
    return watchedNews.some(item => item.id === newsId);
  }, [watchedNews]);

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNews(1, true);
  };

  // 加载更多
  const handleLoadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    loadNews(nextPage);
  }, [hasMore, page, loadNews]);

  // 搜索和日期过滤
  useEffect(() => {
    let filtered = newsList;

    // 日期筛选
    if (selectedDate) {
      filtered = filtered.filter(news => {
        const date = new Date(news.timestamp);
        const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
        return dateStr === selectedDate;
      });
    }

    // 关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(news => {
        return (
          news.title?.toLowerCase().includes(keyword) ||
          news.summary?.toLowerCase().includes(keyword) ||
          news.content?.toLowerCase().includes(keyword) ||
          news.source?.toLowerCase().includes(keyword) ||
          news.tags?.some(tag => tag.toLowerCase().includes(keyword)) ||
          news.related_stocks?.some(stock => stock.toLowerCase().includes(keyword))
        );
      });
    }

    setFilteredNewsList(filtered);
  }, [searchKeyword, selectedDate, newsList]);

  // 获取当前日期
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[now.getDay()];
    return {
      full: `${year}年${month}月${day}日`,
      weekday
    };
  };

  const currentDate = getCurrentDate();

  return (
    <div className={`market-news ${showWatchList ? 'split-view' : ''}`}>
      {/* 页面标题区域 - 移到最顶部 */}
      <div className="market-news-page-header">
        <div className="page-header-content">
          <div className="page-header-left">
            <div className="page-header-brand">
              <span className="page-brand-icon">📰</span>
              <h1 className="page-brand-title">市场资讯</h1>
              <span className="page-brand-badge">实时</span>
            </div>
            <div className="page-header-date">
              <span className="page-date-full">{currentDate.full}</span>
              <span className="page-date-weekday">{currentDate.weekday}</span>
            </div>
          </div>
          <div className="page-header-right">
            <button
              className={`watch-list-toggle-btn ${showWatchList ? 'active' : ''}`}
              onClick={() => setShowWatchList(!showWatchList)}
            >
              <span className="watch-list-icon">⭐</span>
              <span className="watch-list-text">我的关注</span>
              {watchedNews.length > 0 && (
                <span className="watch-list-count">{watchedNews.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="market-news-content">
        <div className="news-main-panel">
          <NewsHeader
            showImportantOnly={showImportantOnly}
            onToggleImportant={() => setShowImportantOnly(!showImportantOnly)}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            availableDates={availableDates}
          />

          {error ? (
            <NewsEmpty type="error" onRetry={handleRefresh} />
          ) : initialLoading ? (
            <div className="news-initial-loading">
              <div className="loading-spinner"></div>
              <span>正在加载资讯...</span>
            </div>
          ) : filteredNewsList.length === 0 ? (
            <NewsEmpty
              type={searchKeyword ? 'search' : selectedDate ? 'date' : (showImportantOnly ? 'filter' : 'empty')}
              onViewAll={() => {
                setSearchKeyword('');
                setShowImportantOnly(false);
                setSelectedDate(null);
              }}
              onRefresh={handleRefresh}
              searchKeyword={searchKeyword}
              selectedDate={selectedDate}
            />
          ) : (
            <NewsTimeline
              newsList={filteredNewsList}
              loading={loading}
              hasMore={hasMore && !searchKeyword}
              onLoadMore={handleLoadMore}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              onToggleWatch={toggleWatchNews}
              isNewsWatched={isNewsWatched}
            />
          )}

          {loading && newsList.length > 0 && !searchKeyword && (
            <div className="news-loading-more">
              <div className="loading-spinner"></div>
              <span>加载中...</span>
            </div>
          )}
        </div>

        {showWatchList && (
          <WatchListPanel
            watchedNews={watchedNews}
            onToggleWatch={toggleWatchNews}
            onClose={() => setShowWatchList(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MarketNews;
