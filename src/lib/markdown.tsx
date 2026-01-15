import React from 'react';

/**
 * Simple markdown parser for notes
 * Supports: **bold**, *italic*, __underline__, ~~strikethrough~~, - lists, numbered lists
 */
export const parseMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  
  const parseInline = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;
    
    // Pattern matching for inline styles
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, render: (match: string) => <strong key={key++} className="font-bold">{match}</strong> },
      { regex: /\*(.+?)\*/g, render: (match: string) => <em key={key++} className="italic">{match}</em> },
      { regex: /__(.+?)__/g, render: (match: string) => <span key={key++} className="underline">{match}</span> },
      { regex: /~~(.+?)~~/g, render: (match: string) => <span key={key++} className="line-through">{match}</span> },
      { regex: /`(.+?)`/g, render: (match: string) => <code key={key++} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{match}</code> },
    ];
    
    // Simple regex-based parsing
    let processed = line;
    const replacements: { start: number; end: number; node: React.ReactNode }[] = [];
    
    // Find all matches
    patterns.forEach(({ regex, render }) => {
      let match;
      const r = new RegExp(regex.source, 'g');
      while ((match = r.exec(line)) !== null) {
        replacements.push({
          start: match.index,
          end: match.index + match[0].length,
          node: render(match[1]),
        });
      }
    });
    
    // Sort by position
    replacements.sort((a, b) => a.start - b.start);
    
    // Build result
    let lastEnd = 0;
    replacements.forEach((rep) => {
      if (rep.start >= lastEnd) {
        if (rep.start > lastEnd) {
          parts.push(line.slice(lastEnd, rep.start));
        }
        parts.push(rep.node);
        lastEnd = rep.end;
      }
    });
    
    if (lastEnd < line.length) {
      parts.push(line.slice(lastEnd));
    }
    
    return parts.length > 0 ? parts : [line];
  };
  
  const result: React.ReactNode[] = [];
  let listItems: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;
  let lineKey = 0;
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Check for unordered list
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      if (!listItems || listItems.type !== 'ul') {
        if (listItems) {
          result.push(
            listItems.type === 'ul' 
              ? <ul key={lineKey++} className="list-disc list-inside space-y-0.5 my-1">{listItems.items}</ul>
              : <ol key={lineKey++} className="list-decimal list-inside space-y-0.5 my-1">{listItems.items}</ol>
          );
        }
        listItems = { type: 'ul', items: [] };
      }
      listItems.items.push(<li key={index}>{parseInline(trimmed.slice(2))}</li>);
      return;
    }
    
    // Check for ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s(.+)$/);
    if (olMatch) {
      if (!listItems || listItems.type !== 'ol') {
        if (listItems) {
          result.push(
            listItems.type === 'ul' 
              ? <ul key={lineKey++} className="list-disc list-inside space-y-0.5 my-1">{listItems.items}</ul>
              : <ol key={lineKey++} className="list-decimal list-inside space-y-0.5 my-1">{listItems.items}</ol>
          );
        }
        listItems = { type: 'ol', items: [] };
      }
      listItems.items.push(<li key={index}>{parseInline(olMatch[2])}</li>);
      return;
    }
    
    // Close any open list
    if (listItems) {
      result.push(
        listItems.type === 'ul' 
          ? <ul key={lineKey++} className="list-disc list-inside space-y-0.5 my-1">{listItems.items}</ul>
          : <ol key={lineKey++} className="list-decimal list-inside space-y-0.5 my-1">{listItems.items}</ol>
      );
      listItems = null;
    }
    
    // Regular line
    if (trimmed === '') {
      result.push(<br key={lineKey++} />);
    } else {
      result.push(<span key={lineKey++}>{parseInline(line)}</span>);
      if (index < lines.length - 1) {
        result.push(<br key={lineKey++} />);
      }
    }
  });
  
  // Close any remaining list
  if (listItems) {
    result.push(
      listItems.type === 'ul' 
        ? <ul key={lineKey++} className="list-disc list-inside space-y-0.5 my-1">{listItems.items}</ul>
        : <ol key={lineKey++} className="list-decimal list-inside space-y-0.5 my-1">{listItems.items}</ol>
    );
  }
  
  return <>{result}</>;
};

export const markdownHelpText = {
  tr: `Markdown desteği:
**kalın** → kalın metin
*italik* → italik metin
~~üstü çizili~~ → üstü çizili
- veya • → madde listesi
1. → numaralı liste`,
  en: `Markdown support:
**bold** → bold text
*italic* → italic text
~~strikethrough~~ → strikethrough
- or • → bullet list
1. → numbered list`,
};
