import { useRouteError } from 'react-router-dom';

export default function Error() {
  const error = useRouteError() as {
    statusText: string;
    message: string;
    status: number;
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4 justify-center items-center">
      <h1 className="text-4xl">Oops! 🤷</h1>
      <p className="text-xl">Sorry, an unexpected error has occured. </p>
      <p className="text-gray-600">
        <i>
          {error.status} {error.statusText || error.message}
        </i>
      </p>
    </div>
  );
}
