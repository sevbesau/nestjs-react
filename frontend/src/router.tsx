import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';

import Error from './Error';
import About from './routes/About';
import Home from './routes/Home';
import Layout from './routes/Layout';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<Error />}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Route>,
  ),
);

export default router;
