// 资讯API服务
const API_BASE_URL = 'http://localhost:3001/api';

// 获取资讯列表
export const fetchNewsList = async (params = {}) => {
  const { page = 1, size = 20, important, category } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString()
  });
  
  if (important) {
    queryParams.append('important', 'true');
  }
  
  if (category) {
    queryParams.append('category', category);
  }
  
  const response = await fetch(`${API_BASE_URL}/news?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('获取资讯列表失败');
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '获取资讯列表失败');
  }
  
  return result.data;
};

// 获取资讯详情
export const fetchNewsDetail = async (id) => {
  const response = await fetch(`${API_BASE_URL}/news/${id}`);
  
  if (!response.ok) {
    throw new Error('获取资讯详情失败');
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '获取资讯详情失败');
  }
  
  return result.data;
};
