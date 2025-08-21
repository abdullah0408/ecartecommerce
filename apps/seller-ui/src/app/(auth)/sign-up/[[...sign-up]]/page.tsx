'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { countries } from '../../../../data/countries';
import Link from 'next/link';
import CreateShop from '../../../../components/CreateShop';
import StripeLogo from '../../../../components/StripeLogo';

type FormData = {
  name: string;
  email: string;
  country: string;
  phone_number: string;
  password: string;
};

const SignUpPage = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [sellerData, setSellerData] = useState<FormData | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [sellerId, setSellerId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const startResendTimer = () => {
    const internal = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(internal);
          setCanResend(true);
        }
        return prev - 1;
      });
    }, 1000);
  };

  const signUpMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/seller-registration`,
        data
      );
      return response.data;
    },
    onSuccess: (_, formData) => {
      setSellerData(formData);
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);
      startResendTimer();
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!sellerData) return;
      const response = await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL + '/api/verify-seller',
        { ...sellerData, otp: otp.join('') }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setSellerId(data?.seller?.id);
      console.log(data);
      setActiveStep(2);
    },
  });

  const onSubmit = (data: FormData) => {
    signUpMutation.mutate(data);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Allow only digits
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move focus to the next input
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const connectStripe = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/create-stripe-connect-link`,
        { sellerId }
      );

      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendOtp = () => {
    if (sellerData) {
      signUpMutation.mutate(sellerData);
    }
  };

  return (
    <div className="w-full flex flex-col text-center pt-10 min-h-screen">
      <div className="relative flex items-center justify-between w-full max-w-2xl mx-auto mb-8">
        <div className="absolute top-5 left-8 right-8 h-1 bg-gray-300 -z-10" />
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold mb-2 ${
                step <= activeStep ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              {step}
            </div>
            <span className="text-sm font-medium text-gray-600">
              {step === 1
                ? 'Create Account'
                : step === 2
                ? 'Setup Shop'
                : 'Connect Bank'}
            </span>
          </div>
        ))}
      </div>

      <div className="md:w-[480px] p-8 bg-white shadow rounded-lg mx-auto">
        {activeStep === 1 && (
          <>
            <h3 className="text-3xl font-semibold text-center mb-2">
              Create Account
            </h3>
            <p className="text-center text-gray-500 mb-4">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-blue-500">
                Sign In
              </Link>
            </p>
            {!showOtp ? (
              <form onSubmit={handleSubmit(onSubmit)} className="text-left">
                <label className="block text-gray-700 mb-1 text-left">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Abdullah"
                  className="w-full p-2 border border-gray-300 outline-0 !rounded text-left"
                  {...register('name', {
                    required: 'Name is required',
                  })}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 text-left">
                    {String(errors.name.message)}
                  </p>
                )}
                <label className="block text-gray-700 mb-1 text-left">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="example@example.com"
                  className="w-full p-2 border border-gray-300 outline-0 !rounded text-left"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Email is invalid',
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 text-left">
                    {String(errors.email.message)}
                  </p>
                )}
                <label className="block text-gray-700 mb-1 text-left">
                  Country
                </label>
                <select
                  className="w-full p-2 border border-gray-300 outline-0 !rounded text-left"
                  {...register('country', {
                    required: 'Please select your country',
                  })}
                >
                  <option value="">Select your country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="text-red-500 text-sm mt-1 text-left">
                    {String(errors.country.message)}
                  </p>
                )}
                <label className="block text-gray-700 mb-1 text-left">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="987*******"
                  className="w-full p-2 border border-gray-300 outline-0 !rounded text-left"
                  {...register('phone_number', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^\+?[1-9]\d{1,14}$/,
                      message: 'Phone number is invalid',
                    },
                    minLength: {
                      value: 10,
                      message: 'Phone number must be at least 10 digits',
                    },
                    maxLength: {
                      value: 15,
                      message: 'Phone number must be at most 15 digits',
                    },
                  })}
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-sm mt-1 text-left">
                    {String(errors.phone_number.message)}
                  </p>
                )}
                <label className="block text-gray-700 mb-1 text-left">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className="w-full p-2 border border-gray-300 outline-0 !rounded text-left"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  >
                    {passwordVisible ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 text-left">
                    {String(errors.password.message)}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={signUpMutation.isPending}
                  className="w-full mt-4 text-lg cursor-pointer bg-blue-500 text-white py-2 rounded-lg"
                >
                  {signUpMutation.isPending ? 'Signing Up...' : 'Sign Up'}
                </button>
                {signUpMutation?.isError &&
                  signUpMutation.error instanceof AxiosError && (
                    <p className="text-red-500 text-sm mt-1 text-left">
                      {signUpMutation.error.response?.data?.message ||
                        signUpMutation.error.message}
                    </p>
                  )}
              </form>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-center mb-4">
                  Enter OTP
                </h3>
                <div className="flex justify-center gap-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      ref={(el) => {
                        if (el) inputRefs.current[index] = el;
                      }}
                      maxLength={1}
                      className="w-12 h-12 text-center border border-gray-300 outline-none !rounded"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    />
                  ))}
                </div>
                <button
                  disabled={verifyOtpMutation.isPending}
                  onClick={() => verifyOtpMutation.mutate()}
                  className="w-full mt-4 text-lg cursor-pointer bg-blue-500 text-white py-2 rounded-lg"
                >
                  {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
                </button>
                {verifyOtpMutation?.isError &&
                  verifyOtpMutation.error instanceof AxiosError && (
                    <p className="text-red-500 text-sm mt-1">
                      {verifyOtpMutation.error.response?.data?.message ||
                        verifyOtpMutation.error.message}
                    </p>
                  )}
                <p className="text-center text-sm mt-4">
                  {canResend ? (
                    <button
                      onClick={resendOtp}
                      className="text-blue-500 cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    `Resend OTP in ${timer}s`
                  )}
                </p>
              </div>
            )}
          </>
        )}
        {activeStep === 2 && sellerId && (
          <CreateShop sellerId={sellerId} setActiveStep={setActiveStep} />
        )}
        {activeStep === 3 && sellerId && (
          <div className="text-center">
            <h3 className="text-2xl font-semibold ">Withdraw Method</h3>
            <br />
            <button
              className="w-full m-auto flex items-center justify-center gap-3 text-lg bg-blue-500 text-white py-2 rounded-lg"
              onClick={connectStripe}
            >
              Connect Stripe <StripeLogo />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;
