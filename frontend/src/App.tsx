import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';

function App() {
  return (
    <>
      <div className="bg-gray-800 h-full flex justify-center items-center space-x-16">
        <a href="https://vitejs.dev" target="_blank">
          <img className="w-64" src={viteLogo} alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="w-64 animate-spin" alt="React logo" />
        </a>
      </div>
    </>
  );
}

export default App;
