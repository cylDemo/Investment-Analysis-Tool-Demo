const NewsEmpty = ({ type, onRetry, onViewAll, searchKeyword, selectedDate }) => {
  const configs = {
    empty: {
      icon: '📭',
      title: '暂无市场资讯',
      description: '当前没有新的市场资讯，请稍后再试',
      action: {
        text: '刷新试试',
        onClick: onRetry
      }
    },
    filter: {
      icon: '🔍',
      title: '暂无重要资讯',
      description: '当前筛选条件下没有重要资讯，请关闭筛选查看全部',
      action: {
        text: '查看全部',
        onClick: onViewAll
      }
    },
    search: {
      icon: '🔎',
      title: '未找到相关资讯',
      description: searchKeyword ? `未找到包含 "${searchKeyword}" 的资讯内容` : '未找到匹配的资讯内容',
      action: {
        text: '清除搜索',
        onClick: onViewAll
      }
    },
    date: {
      icon: '📅',
      title: '未找到相关资讯',
      description: selectedDate ? `${selectedDate} 暂无资讯内容` : '所选日期暂无资讯内容',
      action: {
        text: '查看全部日期',
        onClick: onViewAll
      }
    },
    error: {
      icon: '⚠️',
      title: '资讯加载失败',
      description: '网络连接异常或服务器繁忙，请稍后重试',
      action: {
        text: '重新加载',
        onClick: onRetry
      }
    }
  };

  const config = configs[type] || configs.empty;

  return (
    <div className="news-empty">
      <div className="empty-icon">{config.icon}</div>
      <div className="empty-title">{config.title}</div>
      <div className="empty-description">{config.description}</div>
      {config.action && (
        <button className="empty-action-btn" onClick={config.action.onClick}>
          {config.action.text}
        </button>
      )}
    </div>
  );
};

export default NewsEmpty;
