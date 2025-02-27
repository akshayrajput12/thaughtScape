
const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-purple-100/20 to-pink-100/20 rounded-full"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
