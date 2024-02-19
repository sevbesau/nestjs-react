import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="w-full bg-gray-200">
      <nav>
        <ul className="h-24 flex items-center space-x-4 text-4xl mx-4 text-blue-400 underline">
          <li>
            <Link to="/">home</Link>
          </li>
          <li>
            <Link to="/about">about</Link>
          </li>
          <li>
            <Link to="/404">404</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
