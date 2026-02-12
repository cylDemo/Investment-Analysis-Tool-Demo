import { CATEGORY_CONFIG } from '../../types/news';

// 五角星等级组件
const ImportanceStars = ({ level }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={`star ${i <= level ? 'filled' : 'empty'}`}>
        ★
      </span>
    );
  }
  return <div className="importance-stars" title={`重要等级：${level}星`}>{stars}</div>;
};

const NewsCard = ({ news, isFirst, isExpanded, onToggle, onToggleWatch, isNewsWatched }) => {
  const categoryConfig = CATEGORY_CONFIG[news.category];
  const importanceLevel = news.importance_level || (news.is_important ? 3 : 2);
  const isWatched = isNewsWatched?.(news.id);

  return (
    <div
      className={`news-card ${news.is_important ? 'important' : ''} ${isExpanded ? 'expanded' : ''}`}
      data-id={news.id}
      tabIndex={0}
      onClick={onToggle}
    >
      {/* 时间节点 */}
      <div className="timeline-node">
        <div className={`node-dot ${news.is_important ? 'important' : ''} ${isFirst ? 'pulse' : ''}`}></div>
      </div>

      {/* 时间显示 */}
      <div className={`news-time ${news.is_important ? 'important' : ''}`}>
        {news.time_display}
      </div>

      {/* 内容区域 */}
      <div className="news-content">
        {/* 标题 */}
        <div className="news-title">
          {news.is_important && (
            <span className="important-badge">!</span>
          )}
          <span
            className="category-tag"
            style={{
              color: categoryConfig?.color,
              backgroundColor: categoryConfig?.bgColor
            }}
          >
            {categoryConfig?.name}
          </span>
          <div className="title-with-stars">
            <span className="title-text">{news.title}</span>
            <ImportanceStars level={importanceLevel} />
          </div>
        </div>

        {/* 摘要 */}
        <div className={`news-summary ${isExpanded ? 'expanded' : ''}`}>
          {news.summary}
        </div>

        {/* 展开后的完整内容 */}
        {isExpanded && news.content && (
          <div className="news-full-content">
            <div className="content-divider"></div>
            <div className="content-body">
              <div className="content-label">
                <span className="label-icon">📄</span>
                <span>详细内容</span>
              </div>
              <div className="content-text">{news.content}</div>
            </div>
          </div>
        )}

        {/* 标签和来源 */}
        <div className="news-meta">
          <span className="news-source">来源：{news.source}</span>
          {news.tags && news.tags.length > 0 && (
            <div className="news-tags">
              {news.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* 相关股票 */}
        {news.related_stocks && news.related_stocks.length > 0 && (
          <div className="related-stocks">
            <span className="label">相关：</span>
            {news.related_stocks.map((stock, index) => (
              <span key={index} className="stock-tag">{stock}</span>
            ))}
          </div>
        )}

        {/* 关注按钮 */}
        {onToggleWatch && (
          <button
            className={`news-watch-btn ${isWatched ? 'watched' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatch(news);
            }}
            title={isWatched ? '取消关注' : '添加关注'}
          >
            <span className="watch-btn-icon">{isWatched ? '⭐' : '☆'}</span>
            <span className="watch-btn-text">{isWatched ? '已关注' : '关注'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default NewsCard;
