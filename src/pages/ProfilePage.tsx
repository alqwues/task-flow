import { useEffect, useRef, useState } from 'react';
import { Card, Form, Input, Button, Typography, Flex, Avatar, Skeleton } from 'antd';
import { App } from 'antd';
import { RiUserLine, RiCameraLine } from 'react-icons/ri';
import { profilesService } from '../services/profiles';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

export function ProfilePage() {
  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    profilesService.getProfile(user.id).then((profile) => {
      setAvatarUrl(profile?.avatar_url ?? null);
      setLoading(false);
      // setFieldsValue AFTER loading=false so <Form> is in the DOM
      requestAnimationFrame(() => {
        form.setFieldsValue({ name: profile?.name ?? '' });
      });
    });
  }, [user]);

  const onSave = async (values: { name: string }) => {
    if (!user) return;
    setSaving(true);
    try {
      await profilesService.updateProfile(user.id, { name: values.name });
      message.success('Profile updated');
    } catch {
      message.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file');
      return;
    }
    setUploading(true);
    try {
      const url = await profilesService.uploadAvatar(user.id, file);
      await profilesService.updateProfile(user.id, { avatar_url: url });
      setAvatarUrl(url);
      message.success('Avatar updated');
    } catch {
      message.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Flex justify="center" style={{ padding: '32px 16px' }}>
      <Card style={{ width: '100%', maxWidth: 480 }}>
        {loading ? (
          <Skeleton avatar active paragraph={{ rows: 3 }} />
        ) : (
          <>
            <Flex align="center" gap={16} style={{ marginBottom: 24 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  size={64}
                  src={avatarUrl}
                  icon={!avatarUrl && <RiUserLine />}
                  style={{ backgroundColor: '#1677ff' }}
                />
                <Button
                  shape="circle"
                  size="small"
                  icon={<RiCameraLine size={12} />}
                  loading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 22,
                    height: 22,
                    minWidth: 22,
                    padding: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #d9d9d9',
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onAvatarChange(file);
                    e.target.value = '';
                  }}
                />
              </div>
              <div>
                <Title level={4} style={{ margin: 0 }}>Profile</Title>
                <Text type="secondary" style={{ fontSize: 13 }}>{user?.email}</Text>
              </div>
            </Flex>

            <Form form={form} layout="vertical" onFinish={onSave}>
              <Form.Item name="name" label="Display name">
                <Input placeholder="Your name" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>
    </Flex>
  );
}
