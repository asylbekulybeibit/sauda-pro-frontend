import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Button, Divider, message } from 'antd';
import {
  ShoppingCartOutlined,
  ToolOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

/**
 * Страница выбора типа услуги или продажи
 */
const ServiceTypeSelection: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  // Обработчик возврата на страницу выбора кассы
  const handleBack = () => {
    navigate(`/cashier/${shopId}`);
  };

  // Обработчик выбора продажи
  const handleSalesClick = () => {
    // Временная заглушка для кнопки "Продажа"
    message.info('Функциональность продаж временно недоступна');
  };

  // Обработчик выбора услуг
  const handleServicesClick = () => {
    // Автопереход на страницу "Начать услугу"
    navigate(`/cashier/${shopId}/select-service`);
  };

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="mr-4"
        >
          Вернуться к выбору кассы
        </Button>
        <Title level={4} className="m-0">
          Выберите сферу
        </Title>
      </div>

      <Row gutter={[16, 16]} className="mt-8">
        <Col xs={24} sm={12}>
          <Card
            hoverable
            className="h-full shadow-md transition-all"
            onClick={handleSalesClick}
            style={{
              borderTop: '5px solid #1890ff',
              minHeight: '200px',
            }}
          >
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div
                className="mb-6 p-5 rounded-full"
                style={{ background: '#e6f7ff' }}
              >
                <ShoppingCartOutlined
                  style={{ fontSize: 48, color: '#1890ff' }}
                />
              </div>
              <h2 className="text-2xl font-bold">🟦 Продажа</h2>
              <p className="text-gray-500 mt-2">
                Продажа товаров и услуг клиентам
              </p>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            hoverable
            className="h-full shadow-md transition-all"
            onClick={handleServicesClick}
            style={{
              borderTop: '5px solid #52c41a',
              minHeight: '200px',
            }}
          >
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div
                className="mb-6 p-5 rounded-full"
                style={{ background: '#f6ffed' }}
              >
                <ToolOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              </div>
              <h2 className="text-2xl font-bold">🟩 Услуги</h2>
              <p className="text-gray-500 mt-2">
                Запись и выполнение услуг для клиентов
              </p>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider className="my-6" />

      <div className="mt-6">
        <Card className="bg-gray-50">
          <p className="m-0">
            <strong>Инструкция:</strong> После нажатия на кнопку "Услуги" вы
            будете перенаправлены на страницу "Начать услугу". В нижнем меню
            появятся дополнительные разделы для работы с услугами.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ServiceTypeSelection;
