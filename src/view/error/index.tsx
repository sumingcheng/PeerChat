import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-800 animate-bounce">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-600 mt-4">
          页面未找到
        </h2>
        <p className="text-gray-500 mt-4 mb-8">
          抱歉，您访问的页面不存在或已被移除
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          返回首页
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
