// 资讯分类类型
export type NewsCategory = 'stock' | 'fund' | 'metal' | 'policy' | 'exchange' | 'company' | 'industry';

// 资讯数据模型
export interface NewsItem {
  id: string;
  timestamp: string;
  time_display: string;
  category: NewsCategory;
  category_name: string;
  is_important: boolean;
  source: string;
  title: string;
  summary: string;
  content?: string;
  related_stocks?: string[];
  tags?: string[];
}

// 资讯列表请求参数
export interface NewsListRequest {
  page: number;
  size: number;
  important?: boolean;
  category?: NewsCategory;
}

// 资讯列表响应
export interface NewsListResponse {
  list: NewsItem[];
  total: number;
  hasMore: boolean;
  lastUpdate: string;
}

// 分类标签配置
export interface CategoryConfig {
  key: NewsCategory;
  name: string;
  color: string;
  bgColor: string;
}

// 分类标签映射
export const CATEGORY_CONFIG: Record<NewsCategory, CategoryConfig> = {
  stock: {
    key: 'stock',
    name: '股市',
    color: '#1890FF',
    bgColor: '#E6F7FF'
  },
  fund: {
    key: 'fund',
    name: '基金',
    color: '#52C41A',
    bgColor: '#F6FFED'
  },
  metal: {
    key: 'metal',
    name: '贵金属',
    color: '#FAAD14',
    bgColor: '#FFFBE6'
  },
  policy: {
    key: 'policy',
    name: '政策',
    color: '#EB2F96',
    bgColor: '#FFF0F6'
  },
  exchange: {
    key: 'exchange',
    name: '交易所',
    color: '#722ED1',
    bgColor: '#F9F0FF'
  },
  company: {
    key: 'company',
    name: '公司',
    color: '#13C2C2',
    bgColor: '#E6FFFB'
  },
  industry: {
    key: 'industry',
    name: '行业',
    color: '#13C2C2',
    bgColor: '#E6FFFB'
  }
};
