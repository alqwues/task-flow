import { useState } from 'react';
import { Form, Input, Button, Typography, Divider, Alert } from 'antd';
import { authService } from '../../services/auth';

const { Title, Text } = Typography;

interface Props {
  onSwitch: () => void;
}

export function RegisterForm({ onSwitch }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: { name: string; email: string; password: string }) => {
    setLoading(true);
    try {
      await authService.signUp(values.email, values.password, values.name);
      setDone(true);
    } catch (err: any) {
      form.setFields([{ name: 'email', errors: [err.message ?? 'Registration failed'] }]);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Alert
        type="success"
        title="Check your email"
        description="We sent a confirmation link. Click it to activate your account."
        showIcon
      />
    );
  }

  return (
    <div>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
        Create account
      </Title>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Enter your name' }]}
        >
          <Input placeholder="John Doe" />
        </Form.Item>

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
          rules={[{ required: true, min: 6, message: 'At least 6 characters' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign up
          </Button>
        </Form.Item>
      </Form>

      <Divider />
      <Text type="secondary">
        Have an account?{' '}
        <Button type="link" onClick={onSwitch} style={{ padding: 0 }}>
          Sign in
        </Button>
      </Text>
    </div>
  );
}
