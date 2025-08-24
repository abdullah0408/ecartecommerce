'use client';

import DeleteDiscountCodeModal from '@/components/DeleteDiscountCodeModal';
import axiosInstance from '@/utils/axiosInstance';
import { DiscountCode } from '@/utils/types';
import Input from '@components/Input';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ChevronRightIcon, PlusIcon, TrashIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Page = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDiscountCode, setSelectedDiscountCode] =
    useState<DiscountCode | null>(null);
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      publicName: '',
      discountType: 'percentage',
      discountValue: 0,
      discountCode: '',
    },
  });

  const { data: discountCodes = [], isLoading } = useQuery({
    queryKey: ['shop_discount_codes'],
    queryFn: async () => {
      const response = await axiosInstance.get(
        '/products/api/get-discount-codes'
      );
      return response?.data?.discountCodes || [];
    },
  });

  const handleDeleteClick = async (discountCode: DiscountCode) => {
    setSelectedDiscountCode(discountCode);
    setShowDeleteModal(true);
  };

  const deleteDiscountCodeMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/products/api/delete-discount-code/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop_discount_codes'] });
      setShowDeleteModal(false);
    },
  });

  const createDiscountCodeMutation = useMutation({
    mutationFn: async (data: {
      publicName: string;
      discountType: string;
      discountValue: number;
      discountCode: string;
    }) => {
      await axiosInstance.post('/products/api/create-discount-code', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop_discount_codes'] });
      reset();
      setShowModal(false);
    },
  });

  const onSubmit = async (data: {
    publicName: string;
    discountType: string;
    discountValue: number;
    discountCode: string;
  }) => {
    if (discountCodes && discountCodes.length >= 8) {
      toast.error('You can only have a maximum of 8 discount codes.');
      return;
    }
    createDiscountCodeMutation.mutate(data);
  };

  return (
    <div className="w-full min-h-screen p-8">
      <div className="flex justify-between items-center mb-1">
        <div className="text-2xl text-white font-semibold">Discount Codes</div>

        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <PlusIcon size={18} />
          Create Discount Code
        </button>
      </div>
      <div className="flex items-center text-white">
        <Link href="/dashboard" className="text-blue-500 cursor-pointer">
          Dashboard
        </Link>
        <ChevronRightIcon size={20} className="opacity-[.8]" />
        <span>Create Discount Code</span>
      </div>

      <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Your Discount Codes
        </h3>
        {isLoading ? (
          <p className="text-gray-400 text-center">Loading discount codes...</p>
        ) : (
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Value</th>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discountCodes?.map((discountCode: DiscountCode) => (
                <tr
                  className="border-b border-gray-800 hover:bg-gray-800 transition"
                  key={discountCode?.id}
                >
                  <td className="py-3">{discountCode?.publicName}</td>
                  <td className="p-3 capitalize">
                    {discountCode?.discountType === 'percentage'
                      ? 'Percentage (%)'
                      : 'Flat ($)'}
                  </td>
                  <td className="p-3">
                    {discountCode?.discountType === 'percentage'
                      ? `${discountCode?.discountValue}%`
                      : `$${discountCode?.discountValue}`}
                  </td>
                  <td className="p-3">{discountCode?.discountCode}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDeleteClick(discountCode)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      <TrashIcon size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && discountCodes?.length === 0 && (
          <p className="text-gray-400 block pt-4 text-center">
            No discount codes found.
          </p>
        )}
      </div>

      {showModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-xl text-white">Create Discount Code</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XIcon size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
              <Input
                label="Title"
                {...register('publicName', {
                  required: 'Title is required',
                })}
              />
              {errors.publicName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.publicName.message}
                </p>
              )}

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Discount Type
                </label>

                <Controller
                  control={control}
                  name="discountType"
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full border outline-none border-gray-700 bg-transparent text-white p-2 !rounded"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount ($)</option>
                    </select>
                  )}
                />
              </div>
              <div className="mt-2">
                <Input
                  label="Discount Value"
                  type="number"
                  min={1}
                  {...register('discountValue', {
                    required: 'Discount Value is required',
                  })}
                />
                {errors.discountValue && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.discountValue.message}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <Input
                  label="Discount Code"
                  {...register('discountCode', {
                    required: 'Discount Code is required',
                  })}
                />
                {errors.discountCode && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.discountCode.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={createDiscountCodeMutation.isPending || isLoading}
                className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-semibold flex items-center justify-center gap-2"
              >
                <PlusIcon size={18} />
                {createDiscountCodeMutation.isPending
                  ? 'Creating...'
                  : 'Create'}
              </button>

              {createDiscountCodeMutation.isError && (
                <p className="text-red-500 text-sm mt-2">
                  {(
                    createDiscountCodeMutation.error as AxiosError<{
                      message: string;
                    }>
                  )?.response?.data?.message || 'Something went wrong'}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
      {selectedDiscountCode && showDeleteModal && (
        <DeleteDiscountCodeModal
          discountCode={selectedDiscountCode}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() =>
            deleteDiscountCodeMutation.mutate(selectedDiscountCode?.id)
          }
        />
      )}
    </div>
  );
};

export default Page;
