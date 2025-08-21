import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import React from 'react';
import { useForm } from 'react-hook-form';
import { shopCategories } from '../data/shopCategories';

const CreateShop = ({
  sellerId,
  setActiveStep,
}: {
  sellerId: string;
  setActiveStep: (step: number) => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const shopCreateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: any) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/create-shop`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      setActiveStep(3);
    },
  });

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    shopCreateMutation.mutate({
      ...data,
      sellerId,
    });
  };
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className="text-2xl font-semibold text-center mb-4">Setup Shop</h3>
        <label className="block text-gray-700 mb-1 text-left">Name *</label>
        <input
          type="text"
          placeholder="shop name"
          className="w-full p-2 border border-gray-300 outline-0 !rounded text-left"
          {...register('name', {
            required: 'Shop name is required',
          })}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1 text-left">
            {String(errors.name.message)}
          </p>
        )}
        <label className="block text-gray-700 mb-1 text-left">
          Description *
        </label>
        <textarea
          placeholder="shop description"
          className="w-full p-2 border border-gray-300 outline-0 !rounded text-left"
          {...register('description', {
            required: 'Description is required',
            minLength: {
              value: 10,
              message: 'Description must be at least 10 words',
            },
            validate: (value) =>
              countWords(value) <= 100 ||
              'Description must be at most 100 words',
          })}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1 text-left">
            {String(errors.description.message)}
          </p>
        )}
        <label className="block text-gray-700 mb-1 text-left">Address *</label>
        <input
          type="text"
          placeholder="shop address"
          className="w-full p-2 border border-gray-300 outline-0 !rounded text-left"
          {...register('address', {
            required: 'Address is required',
          })}
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1 text-left">
            {String(errors.address.message)}
          </p>
        )}
        <label className="block text-gray-700 mb-1 text-left">
          Opening Hours *
        </label>
        <input
          type="text"
          placeholder="e.g., Mon-Fri 9am-5pm"
          className="w-full p-2 border border-gray-300 outline-0 !rounded text-left"
          {...register('openingHours', {
            required: 'Opening hours are required',
          })}
        />
        {errors.openingHours && (
          <p className="text-red-500 text-sm mt-1 text-left">
            {String(errors.openingHours.message)}
          </p>
        )}
        <label className="block text-gray-700 mb-1 text-left">Website</label>
        <input
          type="text"
          placeholder="e.g., www.shop.com"
          className="w-full p-2 border border-gray-300 outline-0 !rounded text-left"
          {...register('website', {
            pattern: {
              value:
                /^(https?:\/\/)?(www\.)?[a-z0-9]+\.[a-z]{2,}(\.[a-z]{2,})?$/,
              message: 'Invalid website URL',
            },
          })}
        />
        {errors.website && (
          <p className="text-red-500 text-sm mt-1 text-left">
            {String(errors.website.message)}
          </p>
        )}
        <label className="block text-gray-700 mb-1 text-left">Category *</label>
        <select
          className="w-full p-2 border border-gray-300 outline-0 !rounded text-left"
          {...register('category', {
            required: 'Category is required',
          })}
        >
          <option value="">Select category</option>
          {shopCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm mt-1 text-left">
            {String(errors.category.message)}
          </p>
        )}

        <button
          type="submit"
          className="mt-4 w-full p-2 bg-blue-500 text-white !rounded"
        >
          Create Shop
        </button>
        {shopCreateMutation?.isError &&
          shopCreateMutation.error instanceof AxiosError && (
            <p className="text-red-500 text-sm mt-1 text-left">
              {shopCreateMutation.error.response?.data?.message ||
                shopCreateMutation.error.message}
            </p>
          )}
      </form>
    </div>
  );
};

export default CreateShop;
