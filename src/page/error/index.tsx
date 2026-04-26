import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center max-w-sm">
        <h1 className="text-7xl font-bold text-gray-900">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mt-4">{t('errorPage.title')}</h2>
        <p className="text-sm text-gray-500 mt-2 mb-6">{t('errorPage.description')}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {t('errorPage.backHome')}
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
