import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import Error from './Error';
import Layout from './routes/Layout';
import Home from './routes/Home';
import About from './routes/About';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<Error />}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Route>,
  ),
);

export default router;
