import React, { useMemo, useRef, useLayoutEffect, useState } from 'react';
import AnsiToHtml from 'ansi-to-html';
import DOMPurify from 'dompurify';

interface TerminalPreviewProps {
  content: string;
  isLoading?: boolean;
  className?: string;
}

// CSS properties whitelist for terminal preview
// Only allows safe styling properties needed for ANSI terminal output
const SAFE_CSS_PROPERTIES = [
  // Colors
  'color',
  'background-color',
  'background-color',

  // Text styling
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-decoration',

  // Layout
  'margin',
  'padding',
  'display',
  'visibility',

  // Positioning
  'position',
  'top',
  'left',
  'right',
  'bottom'
];

const ansiConverter = new AnsiToHtml({
  fg: '#dcd6cc',
  bg: '#252320',
  newline: false,
  escapeXML: true,
  stream: false
});

/**
 * Sanitize ANSI-to-HTML converted content to prevent XSS attacks
 * Uses DOMPurify with strict tag/attribute whitelist
 */
function sanitizeTerminalHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    // Allow only basic structural tags needed for terminal output
    ALLOWED_TAGS: ['span', 'br', 'div'],

    // Allow attributes with strict validation
    ALLOWED_ATTR: ['class'],

    // Allow style attribute but with property-level filtering
    ALLOWED_STYLE: SAFE_CSS_PROPERTIES,

    // Additional safety measures
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOW_SELF_CLOSE_IN_ATTR: false,
    SAFE_FOR_JQUERY: true,
    SAFE_FOR_TEMPLATES: true,

    // Remove any script or data URLs
    FORBID_TAGS: ['script', 'style', 'link', 'meta', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  });
}

export function TerminalPreview({ content, isLoading = false, className = '' }: TerminalPreviewProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const scrollTopRef = useRef(0);
  const [wordWrap, setWordWrap] = useState(true);

  const html = useMemo(() => {
    // Save scroll position before content changes
    if (preRef.current) {
      scrollTopRef.current = preRef.current.scrollTop;
    }
    if (!content) return '';

    // Convert ANSI to HTML
    const converted = ansiConverter.toHtml(content);

    // Sanitize HTML to prevent XSS with strict configuration
    // This prevents malicious code injection through ANSI escape sequences
    return sanitizeTerminalHtml(converted);
  }, [content]);

  // Restore scroll position after render
  useLayoutEffect(() => {
    if (preRef.current && scrollTopRef.current > 0) {
      preRef.current.scrollTop = scrollTopRef.current;
    }
  }, [html]);

  const preStyle: React.CSSProperties = {
    padding: '16px',
    margin: 0,
    fontFamily: 'var(--font-terminal)',
    fontSize: '12px',
    lineHeight: '1.6',
    overflow: 'auto',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-bg-card)',
    whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
    wordBreak: wordWrap ? 'break-word' : 'normal',
    position: 'absolute',
    inset: 0,
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-primary)',
        borderRadius: '8px',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Window chrome */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid var(--color-border-primary)',
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          backgroundColor: 'var(--color-bg-header)'
        }}
      >
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28c840' }} />

        <button
          onClick={() => setWordWrap(!wordWrap)}
          style={{
            marginLeft: 'auto',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 500,
            color: wordWrap ? 'var(--color-text-secondary)' : 'var(--color-accent-primary)',
            backgroundColor: 'transparent',
            border: '1px solid',
            borderColor: wordWrap ? 'var(--color-border-primary)' : 'var(--color-accent-primary)',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-accent-primary)';
            e.currentTarget.style.color = 'var(--color-accent-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = wordWrap ? 'var(--color-border-primary)' : 'var(--color-accent-primary)';
            e.currentTarget.style.color = wordWrap ? 'var(--color-text-secondary)' : 'var(--color-accent-primary)';
          }}
          title={wordWrap ? 'Disable word wrap (scroll horizontally)' : 'Enable word wrap'}
        >
          {wordWrap ? '⤢ Wrap' : '⇄ Scroll'}
        </button>
      </div>

      {/* Content area */}
      {isLoading ? (
        <div
          style={{
            padding: '16px',
            fontFamily: 'var(--font-terminal)',
            fontSize: '12px',
            color: 'var(--color-text-secondary)'
          }}
        >
          Loading preview...
        </div>
      ) : (
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <pre
            ref={preRef}
            style={preStyle}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </div>
  );
}
