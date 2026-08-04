import React from 'react';
import { FiPackage, FiClock, FiTruck, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const OrderStatusTracker = ({ status }) => {
  const steps = [
    { status: 'PENDING', icon: <FiClock />, text: 'Chờ duyệt' },
    { status: 'PROCESSING', icon: <FiPackage />, text: 'Đang chuẩn bị' },
    { status: 'DELIVERING', icon: <FiTruck />, text: 'Đang giao' },
    { status: 'COMPLETED', icon: <FiCheckCircle />, text: 'Hoàn thành' },
  ];

  const currentStepIndex = steps.findIndex(step => step.status === status);

  // Xử lý trạng thái ĐÃ HỦY
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center justify-center p-6 bg-red-50 border-t border-b border-red-100 my-4">
        <FiXCircle className="text-red-500 text-4xl mr-4 flex-shrink-0" />
        <div>
          <p className="font-bold text-red-700 text-lg">Đơn hàng đã bị hủy</p>
          <p className="text-sm text-red-500">Đơn hàng này đã được hủy và không thể tiếp tục xử lý.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-2 sm:px-4">
      <div className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = currentStepIndex >= index;
          const isCurrent = currentStepIndex === index;
          const isLineCompleted = currentStepIndex > index;
          const isLastStep = index === steps.length - 1;

          return (
            <React.Fragment key={step.status}>
              {/* Vòng tròn và chữ */}
              <div className="flex flex-col items-center relative">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                    isCompleted
                      ? 'bg-sky-500 border-sky-200 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                  } ${isCurrent ? 'animate-pulse' : ''}`}
                >
                  <div className="text-xl sm:text-2xl">{step.icon}</div>
                </div>
                <p
                  className={`mt-2 text-xs sm:text-sm font-bold text-center w-20 transition-colors duration-500 ${
                    isCompleted ? 'text-sky-600' : 'text-gray-500'
                  }`}
                >
                  {step.text}
                </p>
              </div>

              {/* Đường kẻ nối */}
              {!isLastStep && (
                <div className="flex-1 h-1 bg-gray-300 mt-5 sm:mt-6 mx-1 sm:mx-2">
                  <div className="h-full bg-sky-500 transition-all duration-700 ease-out" style={{ width: isLineCompleted ? '100%' : '0%' }}></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusTracker;