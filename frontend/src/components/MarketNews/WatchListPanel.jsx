import { useMemo, useState } from 'react';
import { CATEGORY_CONFIG } from '../../types/news';

const WatchListPanel = ({ watchedNews, onToggleWatch, onClose }) => {
  // 记录当前展开的资讯ID（手风琴模式，同一时间只展开一个）
  const [expandedId, setExpandedId] = useState(null);

  // 按关注时间倒序排列
  const sortedNews = useMemo(() => {
    return [...watchedNews].sort((a, b) => {
      return new Date(b.watchedAt) - new Date(a.watchedAt);
    });
  }, [watchedNews]);

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 小于1小时显示"X分钟前"
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
    }
    // 小于24小时显示"X小时前"
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}小时前`;
    }
    // 否则显示日期
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 切换展开/收起状态（手风琴模式）
  const toggleExpand = (newsId) => {
    setExpandedId(prev => prev === newsId ? null : newsId);
  };

  // 判断是否展开
  const isExpanded = (newsId) => expandedId === newsId;

  return (
    <div className="watch-list-panel">
      <div className="watch-list-header">
        <div className="watch-list-title">
          <span>我的关注</span>
        </div>
        <button className="watch-list-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="watch-list-content">
        {sortedNews.length === 0 ? (
          <div className="watch-list-empty">
            <div className="watch-list-empty-icon">📭</div>
            <p>暂无特别关注的内容</p>
            <span>点击资讯卡片上的 ⭐ 按钮添加关注</span>
          </div>
        ) : (
          <div className="watch-list-items">
            {sortedNews.map((news) => {
              const categoryConfig = CATEGORY_CONFIG[news.category];
              const expanded = isExpanded(news.id);
              return (
                <div 
                  key={news.id} 
                  className={`watch-list-item ${expanded ? 'expanded' : ''}`}
                >
                  <div className="watch-list-item-header">
                    <span
                      className="watch-list-item-category"
                      style={{
                        color: categoryConfig?.color,
                        backgroundColor: categoryConfig?.bgColor
                      }}
                    >
                      {categoryConfig?.name}
                    </span>
                    <span className="watch-list-item-time">
                      {formatTime(news.watchedAt)}
                    </span>
                  </div>
                  
                  {/* 标题 - 点击展开/收起 */}
                  <div 
                    className="watch-list-item-title clickable"
                    onClick={() => toggleExpand(news.id)}
                    title={expanded ? '点击收起' : '点击展开查看详情'}
                  >
                    {news.title}
                    <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>
                      {expanded ? '▲' : '▼'}
                    </span>
                  </div>
                  
                  {/* 摘要 - 始终显示 */}
                  <div className="watch-list-item-summary">{news.summary}</div>
                  
                  {/* 展开后的详细内容 */}
                  <div className={`watch-list-item-details ${expanded ? 'show' : ''}`}>
                    {news.content && (
                      <div className="watch-list-item-content">
                        <div className="details-section-title">📄 详细内容</div>
                        <p>{news.content}</p>
                      </div>
                    )}
                    
                    {news.tags && news.tags.length > 0 && (
                      <div className="watch-list-item-tags">
                        <div className="details-section-title">🏷️ 相关标签</div>
                        <div className="details-tags-list">
                          {news.tags.map((tag, index) => (
                            <span key={index} className="details-tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {news.impact && (
                      <div className="watch-list-item-impact">
                        <div className="details-section-title">📊 市场影响</div>
                        <p>{news.impact}</p>
                      </div>
                    )}
                    
                    {news.relatedStocks && news.relatedStocks.length > 0 && (
                      <div className="watch-list-item-stocks">
                        <div className="details-section-title">📈 相关股票</div>
                        <div className="details-stocks-list">
                          {news.relatedStocks.map((stock, index) => (
                            <span key={index} className="details-stock">
                              {stock.code} {stock.name}
                              {stock.change && (
                                <span className={`stock-change ${stock.change >= 0 ? 'up' : 'down'}`}>
                                  {stock.change >= 0 ? '+' : ''}{stock.change}%
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="watch-list-item-footer">
                    <span className="watch-list-item-source">{news.source}</span>
                    <button
                      className="watch-list-item-unwatch"
                      onClick={() => onToggleWatch(news)}
                      title="取消关注"
                    >
                      取消关注
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchListPanel;
