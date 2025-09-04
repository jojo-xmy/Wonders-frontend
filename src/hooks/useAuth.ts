import { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { User, LoginRequest, UseAuthReturn } from '../types';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 初始化认证状态
  const initializeAuth = useCallback(async () => {
    try {
      const token = apiService.getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // 验证token有效性
      const validation = await apiService.validateToken();
      if (validation.valid) {
        // 获取用户信息
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // Token无效，清除本地存储
        apiService.clearAuthToken();
      }
    } catch (error) {
      console.error('初始化认证失败:', error);
      apiService.clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登录
  const login = useCallback(async (request: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(request);
      
      // 保存token
      apiService.setAuthToken(response.access_token);
      
      // 设置用户信息
      const userData: User = {
        id: response.user_id,
        email: response.email,
        is_anonymous: response.is_anonymous,
      };
      
      // 保存用户信息到localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 使用React的flushSync确保状态立即更新
      // 这样可以避免需要手动刷新页面的问题
      flushSync(() => {
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false); // 提前设置loading为false
      });
      
      // 显示成功消息
      if (request.anonymous) {
        toast.success('匿名登录成功！');
      } else {
         toast.success('登录成功！');
       }
      
    } catch (error: any) {
      console.error('登录失败:', error);
      toast.error(error.message || '登录失败，请重试');
      setIsLoading(false);
      throw error;
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 调用后端登出API
      try {
        await apiService.logout();
      } catch (error) {
        // 即使后端登出失败，也要清除本地状态
        console.warn('后端登出失败:', error);
      }
      
      // 清除本地状态
      apiService.clearAuthToken();
      setUser(null);
      setIsAuthenticated(false);
      
      toast.success('已退出登录');
    } catch (error: any) {
      console.error('登出失败:', error);
      toast.error('登出失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 刷新token
  const refreshToken = useCallback(async () => {
    try {
      const response = await apiService.refreshToken();
      apiService.setAuthToken(response.access_token);
      
      // 更新用户信息
      const userData: User = {
        id: response.user_id,
        email: response.email,
        is_anonymous: response.is_anonymous,
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('刷新token失败:', error);
      // 刷新失败，清除认证状态
      apiService.clearAuthToken();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  // 组件挂载时初始化认证状态
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 定期刷新token（可选）
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // 每30分钟尝试刷新token
    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('自动刷新token失败:', error);
        // 刷新失败时不显示错误提示，让用户在下次操作时重新登录
      }
    }, 30 * 60 * 1000); // 30分钟

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, user, refreshToken]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
  };
};

export default useAuth;