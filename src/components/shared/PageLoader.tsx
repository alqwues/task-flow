import { Flex, Spin } from 'antd';

export function PageLoader() {
  return (
    <Flex justify="center" align="center" style={{ height: '100vh' }}>
      <Spin size="large" />
    </Flex>
  );
}
