import React, { useState } from 'react';
import { Bot, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [loginMode, setLoginMode] = useState<'anonymous' | 'email'>('anonymous');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAnonymousLogin = async () => {
    try {
      await login({
        anonymous: true,
      });
    } catch (error) {
      // 错误已在useAuth中处理
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('请填写邮箱和密码');
      return;
    }

    try {
      await login({
        email: formData.email,
        password: formData.password,
        anonymous: false,
      });
    } catch (error) {
      // 错误已在useAuth中处理
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
            <Bot size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            AI 助手
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            开始您的智能对话之旅
          </p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* 登录模式选择 */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6">
            <button
              onClick={() => setLoginMode('anonymous')}
              className={clsx(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200',
                loginMode === 'anonymous'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              匿名登录
            </button>
            <button
              onClick={() => setLoginMode('email')}
              className={clsx(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200',
                loginMode === 'email'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              邮箱登录
            </button>
          </div>

          {loginMode === 'anonymous' ? (
            /* 匿名登录 */
            <div className="space-y-6">
              <div className="text-center">
                <User size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  匿名体验
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  无需注册，立即开始使用 AI 助手。
                  <br />
                  注意：匿名会话数据不会永久保存。
                </p>
              </div>

              <button
                onClick={handleAnonymousLogin}
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <User size={20} />
                )}
                <span>{isLoading ? '登录中...' : '匿名登录'}</span>
              </button>
            </div>
          ) : (
            /* 邮箱登录 */
            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  邮箱地址
                </label>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="请输入邮箱地址"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  密码
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="请输入密码"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Mail size={20} />
                )}
                <span>{isLoading ? '登录中...' : '邮箱登录'}</span>
              </button>
            </form>
          )}

          {/* 底部说明 */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              使用本服务即表示您同意我们的服务条款和隐私政策
            </p>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="text-2xl mb-2">🤖</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">智能对话</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">快速响应</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">安全可靠</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;