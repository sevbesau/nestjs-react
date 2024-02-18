import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import Layout from './routes/Layout';
import ErrorPage from './Error';
import Home from './routes/Home';
import About from './routes/About';

export default createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<ErrorPage />}>
      <Route path="/" element={<Home />}></Route>
      <Route path="/about" element={<About />}></Route>
    </Route>,
  ),
);
