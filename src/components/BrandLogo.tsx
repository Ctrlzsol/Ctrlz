import React from 'react';

export const BrandLogo = () => {
  return (
    <>
      <div className="brand-logo">
        <div className="brand-icon"></div>
        <div className="brand-text">
          <span className="brand-name">NABIH</span>
          <span className="brand-tagline">Smart Buying Reference</span>
        </div>
      </div>
      <style>{`
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .brand-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #0f172a, #020617);
          border-radius: 12px;
          position: relative;
          flex-shrink: 0;
        }

        .brand-icon::after {
          content: '';
          position: absolute;
          inset: 10px;
          border-radius: 6px;
          background: #ffffff;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .brand-name {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #020617;
        }

        .brand-tagline {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.3px;
          color: #475569;
          margin-top: 4px;
        }
      `}</style>
    </>
  );
};
