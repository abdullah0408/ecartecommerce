'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios, { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

type FormData = {
  email: string;
  password: string;
};

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'resetPassword'>('email');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();

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

  const requestOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/forgot-seller-password`,
        { email }
      );
      return response.data;
    },
    onSuccess: (_, { email }) => {
      setUserEmail(email);
      setStep('otp');
      setServerError(null);
      setCanResend(false);
      setTimer(60);
      startResendTimer();
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string }).message ||
        'Invalid request';
      setServerError(errorMessage);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/forgot-password-otp-verification`,
        { email: userEmail, otp: otp.join('') }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep('resetPassword');
      setServerError(null);
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string }).message || 'Invalid OTP';
      setServerError(errorMessage);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      if (!userEmail || !password) {
        throw new Error('Missing user email or password');
      }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reset-seller-password`,
        { email: userEmail, newPassword: password }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep('email');
      toast.success(
        'Password reset successfully, please sign in with your new password.'
      );
      setServerError(null);
      router.push('/sign-in');
    },
    onError: (error: AxiosError | Error) => {
      if (error.message === 'Missing user email or password') {
        setServerError(
          'Session expired. Please start the password reset process again.'
        );
        setStep('email');
        return;
      }

      const errorMessage =
        error instanceof AxiosError
          ? (error.response?.data as { message?: string }).message ||
            'Failed to reset password, please try again.'
          : 'Failed to reset password, please try again.';
      setServerError(errorMessage);
    },
  });

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

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmitEmail = ({ email }: { email: string }) => {
    requestOtpMutation.mutate({ email });
  };

  const onSubmitPassword = ({ password }: { password: string }) => {
    resetPasswordMutation.mutate({ password });
  };

  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
        Forgot Password
      </h1>
      <p className="text-center text-lg font-medium py-3 text-[#000000]">
        Home . Forgot Password
      </p>
      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
          {step === 'email' && (
            <>
              <h3 className="text-3xl font-semibold text-center mb-2">
                Sign In to E-Cart
              </h3>
              <p className="text-center text-gray-500 mb-4">
                Go back to{' '}
                <Link href="/sign-in" className="text-blue-500">
                  Sign In?
                </Link>
              </p>

              <form onSubmit={handleSubmit(onSubmitEmail)}>
                <label className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="example@example.com"
                  className="w-full p-2 border border-gray-300 outline-0 !rounded"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Email is invalid',
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {String(errors.email.message)}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={requestOtpMutation.isPending}
                  className="w-full text-lg cursor-pointer mt-4 bg-blue-500 text-white py-2 rounded-lg"
                >
                  {requestOtpMutation.isPending ? 'Sending...' : 'Send OTP'}
                </button>

                {serverError && (
                  <p className="text-red-500 text-sm mt-1">
                    {String(serverError)}
                  </p>
                )}
              </form>
            </>
          )}
          {step === 'otp' && (
            <>
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
              {serverError && (
                <p className="text-red-500 text-sm mt-1">
                  {String(serverError)}
                </p>
              )}
              <p className="text-center text-sm mt-4">
                {canResend ? (
                  <button
                    onClick={() =>
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      requestOtpMutation.mutate({ email: userEmail! })
                    }
                    className="text-blue-500 cursor-pointer"
                  >
                    Resend OTP
                  </button>
                ) : (
                  `Resend OTP in ${timer}s`
                )}
              </p>
            </>
          )}

          {step === 'resetPassword' && (
            <>
              <h3 className="text-xl font-semibold text-center mb-4">
                Reset Password
              </h3>
              <form onSubmit={handleSubmit(onSubmitPassword)}>
                <label className="block text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="w-full p-2 border border-gray-300 outline-0 !rounded"
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
                  <p className="text-red-500 text-sm mt-1">
                    {String(errors.password.message)}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="w-full mt-4 text-lg cursor-pointer bg-blue-500 text-white py-2 rounded-lg"
                >
                  {resetPasswordMutation.isPending
                    ? 'Resetting...'
                    : 'Reset Password'}
                </button>

                {serverError && (
                  <p className="text-red-500 text-sm mt-1">
                    {String(serverError)}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
