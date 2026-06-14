import { useEffect, useState } from 'react';
import { Upload, List, Typography, Button, App, Popconfirm } from 'antd';
import { RiAttachmentLine, RiDeleteBinLine, RiDownloadLine } from 'react-icons/ri';
import { attachmentsService, type Attachment } from '../../services/attachments';
import { useAuthStore } from '../../store/authStore';

const { Text } = Typography;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  taskId: string;
}

export function TaskAttachments({ taskId }: Props) {
  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    attachmentsService.getAttachments(taskId).then(setAttachments).catch(() => {});
  }, [taskId]);

  const handleUpload = async (file: File) => {
    if (!user) return false;
    if (file.size > 10 * 1024 * 1024) {
      message.error('File must be under 10 MB');
      return false;
    }
    setUploading(true);
    try {
      const att = await attachmentsService.upload(taskId, file, user.id);
      setAttachments((prev) => [att, ...prev]);
    } catch {
      message.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = async (id: string, url: string) => {
    try {
      await attachmentsService.deleteAttachment(id, url);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      message.error('Failed to delete attachment');
    }
  };

  return (
    <div>
      <Upload beforeUpload={handleUpload} showUploadList={false} disabled={uploading}>
        <Button icon={<RiAttachmentLine />} loading={uploading} size="small">
          Attach file
        </Button>
      </Upload>

      {attachments.length > 0 && (
        <List
          size="small"
          style={{ marginTop: 8 }}
          dataSource={attachments}
          renderItem={(att) => (
            <List.Item
              style={{ padding: '4px 0' }}
              actions={[
                <a href={att.url} target="_blank" rel="noopener noreferrer" key="dl">
                  <RiDownloadLine size={14} style={{ color: '#1677ff' }} />
                </a>,
                <Popconfirm key="del" title="Remove attachment?" onConfirm={() => handleDelete(att.id, att.url)}>
                  <RiDeleteBinLine size={14} style={{ cursor: 'pointer', color: '#ff4d4f' }} />
                </Popconfirm>,
              ]}
            >
              <Text style={{ fontSize: 12, flex: 1 }} ellipsis={{ tooltip: att.name }}>
                {att.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 8, flexShrink: 0 }}>
                {formatSize(att.size)}
              </Text>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
