import { DiscountCode } from '@/utils/types';
import { XIcon } from 'lucide-react';
import React from 'react';

const DeleteDiscountCodeModal = ({
  discountCode,
  onClose,
  onConfirm,
}: {
  discountCode: DiscountCode;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg">
        <div className="flex justify-between items-center border-b border-r-gray-700 pb-3">
          <h3 className="text-xl text-white">Delete Discount Code</h3>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>
            <XIcon size={22} />
          </button>
        </div>
        <p className="text-gray-300 mt-4">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-white">
            {discountCode?.publicName}
          </span>
          ?
          <br />
          This action **cannot be undone**.
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md text-white font-semibold transition"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDiscountCodeModal;
