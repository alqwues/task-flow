import { useState } from 'react';
import { Form, Input, Button, Typography, Divider } from 'antd';
import { authService } from '../../services/auth';

const { Title, Text } = Typography;

interface Props {
  onSwitch: () => void;
}

export function LoginForm({ onSwitch }: Props) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await authService.signIn(values.email, values.password);
    } catch (err: any) {
      form.setFields([{ name: 'password', errors: [err.message ?? 'Sign in failed'] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
        Sign in to TaskFlow
      </Title>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
        >
          <Input placeholder="you@example.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Enter your password' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign in
          </Button>
        </Form.Item>
      </Form>

      <Divider />
      <Text type="secondary">
        No account?{' '}
        <Button type="link" onClick={onSwitch} style={{ padding: 0 }}>
          Sign up
        </Button>
      </Text>
    </div>
  );
}
