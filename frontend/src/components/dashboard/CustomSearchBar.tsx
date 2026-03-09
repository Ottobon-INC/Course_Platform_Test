import React from 'react';
import styled from 'styled-components';

interface CustomSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const CustomSearchBar: React.FC<CustomSearchBarProps> = ({ value, onChange }) => {
  return (
    <StyledWrapper>
      <div className="input-container">
        <input
          type="text"
          name="text"
          className="input"
          placeholder="Search my courses..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="icon">
          <svg width="19px" height="19px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth={0} />
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
            <g id="SVGRepo_iconCarrier">
              <path opacity={1} d="M14 5H20" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path opacity={1} d="M14 8H17" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 11.5C21 16.75 16.75 21 11.5 21C6.25 21 2 16.75 2 11.5C2 6.25 6.25 2 11.5 2" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path opacity={1} d="M22 22L20 20" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </span>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .input-container {
    width: 220px;
    position: relative;
    @media (min-width: 1280px) {
      width: 288px;
    }
  }

  .icon {
    position: absolute;
    right: 10px;
    top: calc(50% + 5px);
    transform: translateY(calc(-50% - 5px));
    pointer-events: none;
  }

  .input {
    width: 100%;
    height: 40px;
    padding: 10px;
    transition: .2s linear;
    border: 2.5px solid #244855;
    background-color: white;
    color: #244855;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-radius: 4px;
  }
  
  .input::placeholder {
    color: rgba(36, 72, 85, 0.5);
    text-transform: none;
    letter-spacing: normal;
  }

  .input:focus {
    outline: none;
    border: 0.5px solid #244855;
    box-shadow: -5px -5px 0px #244855;
  }

  .input-container:hover > .icon {
    animation: anim 1s linear infinite;
  }

  @keyframes anim {
    0%,
    100% {
      transform: translateY(calc(-50% - 5px)) scale(1);
    }

    50% {
      transform: translateY(calc(-50% - 5px)) scale(1.1);
    }
  }
`;

export default CustomSearchBar;
