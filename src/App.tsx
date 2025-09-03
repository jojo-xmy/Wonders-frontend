import React from 'react';
import { useAuth } from './hooks/useAuth';
import { ChatInterface, LoginForm } from './components';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">正在加载...</p>
        </div>
      </div>
    );
  }

  // 根据认证状态渲染不同组件
  return (
    <div className="App">
      {isAuthenticated && user ? (
        <ChatInterface />
      ) : (
        <LoginForm />
      )}
    </div>
  );
};

export default App;