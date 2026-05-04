import React from 'react';

interface RecentSearchesProps {
  searches: string[];
  onSearchClick: (location: string) => void;
}

export default function RecentSearches({ searches, onSearchClick }: RecentSearchesProps) {
  if (searches.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '15px' }}>
      <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0' }}>Recent Searches:</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {searches.map((location, index) => (
          <button
            key={index}
            onClick={() => onSearchClick(location)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: '#e8f4f8',
              color: '#0066cc',
              border: '1px solid #0066cc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0066cc';
              (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e8f4f8';
              (e.currentTarget as HTMLButtonElement).style.color = '#0066cc';
            }}
          >
            {location}
          </button>
        ))}
      </div>
    </div>
  );
}
