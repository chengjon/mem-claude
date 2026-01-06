import React, { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { ThemePreference } from '../hooks/useTheme';
import { GitHubStarsButton } from './GitHubStarsButton';
import { SearchType } from '../constants/config';

interface HeaderProps {
  isConnected: boolean;
  projects: string[];
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  keywords?: string[];
  logic?: 'AND' | 'OR';
  onKeywordsChange: (keywords: string[]) => void;
  onLogicChange: (logic: 'AND' | 'OR') => void;
  searchType?: SearchType;
  onSearchTypeChange?: (type: SearchType) => void;
  isProcessing: boolean;
  isSearchLoading?: boolean;
  queueDepth: number;
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onContextPreviewToggle: () => void;
  includeToolCalls?: boolean;
  onIncludeToolCallsChange?: (include: boolean) => void;
  observationType?: string;
  onObservationTypeChange?: (type: string) => void;
}

const OBSERVATION_TYPES = [
  { value: '', label: '所有类型' },
  { value: 'bugfix', label: '🐛 Bug修复' },
  { value: 'feature', label: '✨ 新功能' },
  { value: 'refactor', label: '♻️ 重构' },
  { value: 'change', label: '📝 变更' },
  { value: 'discovery', label: '💡 发现' },
  { value: 'decision', label: '⚖️ 决策' }
];

export function Header(props: HeaderProps) {
  const {
    isConnected,
    projects,
    currentFilter,
    onFilterChange,
    keywords = [],
    logic = 'AND',
    onKeywordsChange,
    onLogicChange,
    searchType = 'standard',
    onSearchTypeChange,
    isProcessing,
    isSearchLoading = false,
    queueDepth,
    themePreference,
    onThemeChange,
    onContextPreviewToggle,
    includeToolCalls = false,
    onIncludeToolCallsChange,
    observationType = '',
    onObservationTypeChange
  } = props;

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      try {
        setIsDark(themePreference === 'dark' ||
          (themePreference === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches));
      } catch {
        setIsDark(false);
      }
    };
    checkDarkMode();
  }, [themePreference]);

  const phBadgeTheme = isDark ? 'dark' : 'light';
  const phBadgeUrl = `https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1045833&theme=${phBadgeTheme}`;

  const handleObservationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onObservationTypeChange?.(e.currentTarget.value);
  };

  const handleIncludeToolCallsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onIncludeToolCallsChange?.(e.currentTarget.checked);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(e.currentTarget.value);
  };

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keywordStr = e.currentTarget.value;
    const keywordArray = keywordStr
      .split(',')
      .map(k => k.trim())
      .filter((k: string) => k.length > 0);
    onKeywordsChange(keywordArray);
  };

  const handleLogicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onLogicChange(e.currentTarget.value as 'AND' | 'OR');
  };

  const handleSearchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSearchTypeChange?.(e.currentTarget.value as SearchType);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    if (value.trim()) {
      onKeywordsChange([value.trim()]);
    } else {
      onKeywordsChange([]);
    }
  };

  return (
    <div className="header">
      <h1>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src="claude-mem-logomark.webp" alt="" className={`logomark ${isProcessing ? 'spinning' : ''}`} />
          {queueDepth > 0 && (
            <div className="queue-bubble">
              {queueDepth}
            </div>
          )}
        </div>
        <span className="logo-text">claude-mem</span>
      </h1>
      <div className="status">
        <a
          href="https://www.producthunt.com/products/claude-mem?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-claude-mem"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <img
            src={phBadgeUrl}
            alt="Claude-Mem on Product Hunt"
            style={{ width: '180px', height: '40px' }}
            width="180"
            height="40"
          />
        </a>
        <GitHubStarsButton username="chengjon" repo="mem-claude" />
        <a
          href="https://discord.gg/J4wttp9vDu"
          target="_blank"
          rel="noopener noreferrer"
          className="icon-link"
          title="Join our Discord community"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </a>

        {/* Observation Type Filter */}
        <select
          value={observationType}
          onChange={handleObservationTypeChange}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            marginRight: '4px',
            minWidth: '130px'
          }}
          title="按观察类型筛选"
        >
          {OBSERVATION_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        {/* Include Tool Calls Toggle */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
          marginRight: '4px',
          cursor: 'pointer',
          background: includeToolCalls ? '#e6f7ff' : '#f5f5f5'
        }}>
          <input
            type="checkbox"
            checked={includeToolCalls}
            onChange={handleIncludeToolCallsChange}
            style={{ marginRight: '4px' }}
          />
          工具调用
        </label>

        <select
          value={currentFilter}
          onChange={handleFilterChange}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            marginRight: '4px'
          }}
        >
          <option value="">所有项目</option>
          {projects.map(project => (
            <option key={project} value={project}>{project}</option>
          ))}
        </select>
        
        {/* Keyword Search */}
        <div className="keyword-search">
          <input
            type="text"
            placeholder="搜索AI回复关键字..."
            value={keywords.join(', ')}
            onChange={handleKeywordsChange}
            style={{
              padding: '4px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
              width: '150px',
              marginRight: '4px'
            }}
          />
          <select
            value={logic}
            onChange={handleLogicChange}
            style={{
              padding: '4px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
              marginRight: '4px'
            }}
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
          {keywords.length > 0 && (
            <button
              onClick={() => onKeywordsChange([])}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                background: '#f5f5f5',
                cursor: 'pointer'
              }}
              title="清除关键字"
            >
              ×
            </button>
          )}
        </div>

        {/* Search Type Selector */}
        <div className="search-type-selector" style={{ position: 'relative' }}>
          <select
            value={searchType}
            onChange={handleSearchTypeChange}
            disabled={isSearchLoading}
            style={{
              padding: '4px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
              marginRight: '4px',
              minWidth: '120px',
              opacity: isSearchLoading ? 0.6 : 1,
              cursor: isSearchLoading ? 'wait' : 'pointer'
            }}
            title={isSearchLoading ? 'Searching...' : '选择搜索类型'}
          >
            <option value="standard">🔍 标准搜索</option>
            <option value="timeline">📅 时间线搜索</option>
            <option value="decisions">💡 决策搜索</option>
            <option value="changes">🔄 变更搜索</option>
            <option value="how-it-works">⚙️ 工作原理</option>
            <option value="by-concept">🏷️ 按概念搜索</option>
            <option value="by-file">📄 按文件搜索</option>
            <option value="by-type">🏷️ 按类型搜索</option>
          </select>

          {/* Search loading indicator */}
          {isSearchLoading && (
            <div
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                style={{
                  animation: 'spin 1s linear infinite'
                }}
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="32"
                  strokeDashoffset="32"
                  strokeLinecap="round"
                />
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </svg>
            </div>
          )}
          
          {/* Context-aware input based on search type */}
          {searchType !== 'standard' && (
            <input
              type="text"
              placeholder={
                searchType === 'timeline' ? '时间线查询...' :
                searchType === 'decisions' ? '决策相关查询...' :
                searchType === 'changes' ? '变更相关查询...' :
                searchType === 'how-it-works' ? '工作原理查询...' :
                searchType === 'by-concept' ? '概念名称...' :
                searchType === 'by-file' ? '文件路径...' :
                searchType === 'by-type' ? '类型名称...' : '查询...'
              }
              onChange={handleSearchInputChange}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                marginLeft: '4px',
                width: '150px'
              }}
            />
          )}
        </div>

        <ThemeToggle preference={themePreference} onThemeChange={onThemeChange} />
        
        <button
          onClick={onContextPreviewToggle}
          style={{
            padding: '4px 12px',
            border: '1px solid #0969da',
            borderRadius: '4px',
            fontSize: '12px',
            background: '#fff',
            color: '#0969da',
            cursor: 'pointer',
            marginLeft: '8px'
          }}
        >
          查看上下文
        </button>
      </div>
    </div>
  );
}
