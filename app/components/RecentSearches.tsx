import React from 'react';

interface RecentSearchesProps {
  searches: string[];
  isDarkTheme: boolean;
  onSearchClick: (location: string) => void;
}

export default function RecentSearches({ searches, isDarkTheme, onSearchClick }: RecentSearchesProps) {
  if (searches.length === 0) return null;

  const textColor = isDarkTheme ? '#a0aec0' : '#4a5568';
  const hoverBg = isDarkTheme ? '#263149' : '#f0f4ff';

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ padding: '8px 16px', fontSize: '12px', color: '#718096', fontWeight: 'bold' }}>
        Recent Searches
      </div>
      {searches.map((location, index) => (
        <button
          key={index}
          onClick={(e) => { e.preventDefault(); onSearchClick(location); }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            color: textColor,
            fontSize: '13px',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.15s ease',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverBg;
            (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = textColor;
          }}
          aria-label={`Search for ${location}`}
        >
          <span>🕐</span>
          <span>{location}</span>
        </button>
      ))}
    </div>
  );
}
