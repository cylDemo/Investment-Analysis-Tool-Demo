import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import NewsHeader from './NewsHeader';
import NewsTimeline from './NewsTimeline';
import NewsEmpty from './NewsEmpty';
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

  return (
    <div className="market-news">
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
        />
      )}

      {loading && newsList.length > 0 && !searchKeyword && (
        <div className="news-loading-more">
          <div className="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      )}
    </div>
  );
};

export default MarketNews;
