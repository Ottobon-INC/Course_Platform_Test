export const DRIP_CSS = `
  body {
    background-color: #FFFDD0; /* cream */
    color: #1C1D20; /* dark-text */
    font-family: 'Outfit', 'Inter', sans-serif;
    margin: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Outfit', 'Inter', sans-serif;
  }

  /* Custom scrollbar for leaderboard table */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #F3F4F6;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #D1D5DB;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9CA3AF;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;
