import { useState } from 'react';
import { Card, Flex } from 'antd';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <Flex justify="center" align="center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        {mode === 'login' ? (
          <LoginForm onSwitch={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitch={() => setMode('login')} />
        )}
      </Card>
    </Flex>
  );
}
