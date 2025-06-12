import { useState } from 'react';

const App = () => {
  const [data, setData] = useState({ info: '京程一灯' });
  console.log('🐻 App component rendered');
  return (
    <>
      <h1
        className="text-4xl text-[#09F]"
        onClick={() => {
          setData({ info: '京程一灯' });
        }}
      >
        {data.info}
      </h1>
    </>
  );
};
App.whyDidYouRender = true; // Enable WDYR for this component
export default App;
