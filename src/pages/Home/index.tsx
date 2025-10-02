import React from 'react';

const BACKGROUND_IMAGE_URL = '/assets/background.jpg';

const Home: React.FC = () => {
  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative z-10 bg-white bg-opacity-70 p-10 rounded-xl shadow-2xl max-w-lg text-center">
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-gray-700 tracking-widest uppercase">
            Born to be alive.
          </h5>
          <h1 className="text-4xl font-extrabold text-indigo-700 mt-1">
            Marcílio Mendes Pley.
          </h1>
        </div>
        <div className="border-t pt-6 border-gray-300">
          <div className="mb-4">
            <div className="mt-2">
              <h5 className="text-xs font-medium text-gray-500 uppercase">
                All Right! Country Sunday.
              </h5>
              <h2 className="text-2xl font-bold text-gray-800">
                O que posso fazer por você?
              </h2>
            </div>
          </div>
          <h4 className="text-lg italic text-gray-600 mb-4">
            Fazer algo pelos outros é uma poderosa ferramenta para reforçar
            nossa saúde e felicidade.
          </h4>
          <p className="text-sm text-gray-500 mt-6">
            © Designed by{' '}
            <a
              href="mailto:micpopolin@gmail.com"
              className="text-indigo-600 hover:text-indigo-800 transition duration-150"
            >
              Popolin
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
