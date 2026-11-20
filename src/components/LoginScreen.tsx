import React, { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ArrowRight, Database, LogOut, MapPin, UserCheck, User as UserIcon } from 'lucide-react';
import { Customer } from '../models/Customer';
import { User } from '../models/User';
import { InvalidInputError } from '../models/Errors';
import { Logger } from '../services/Logger';
import { signInWithGoogle, signOutFromFirebase } from '../firebase/firebase';

interface LoginScreenProps {
  currentCustomer: Customer | null;
  firebaseUser: FirebaseUser | null;
  authReady: boolean;
  highlightPrompt?: boolean;
  logger: Logger;
  onLoginSuccess: (customer: Customer) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export function LoginScreen({
  currentCustomer,
  firebaseUser,
  authReady,
  highlightPrompt = false,
  logger,
  onLoginSuccess,
  onShowToast,
}: LoginScreenProps) {
  const [customerIdInput, setCustomerIdInput] = useState<string>(
    currentCustomer ? String(currentCustomer.getUserId()) : ''
  );
  const [nameInput, setNameInput] = useState<string>(
    currentCustomer ? currentCustomer.getName() : ''
  );
  const [addressInput, setAddressInput] = useState<string>(
    currentCustomer ? currentCustomer.getAddress() : ''
  );
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Sync loaded Firestore customer profile or Google display name if fields are still blank
  useEffect(() => {
    if (currentCustomer) {
      setCustomerIdInput(String(currentCustomer.getUserId()));
      setNameInput(currentCustomer.getName());
      setAddressInput(currentCustomer.getAddress());
    } else if (firebaseUser?.displayName && !nameInput) {
      setNameInput(firebaseUser.displayName);
    }
  }, [currentCustomer, firebaseUser]);

  const handleFillDemo = () => {
    setCustomerIdInput('101');
    setNameInput(firebaseUser?.displayName || 'Aarav Sharma');
    setAddressInput('42 Anna Nagar East, Madurai');
    setFieldError(null);
  };

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithGoogle();
      onShowToast('success', 'Database Connected', 'Signed in with Google for Firestore sync.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Google Sign-In failed.';
      onShowToast('error', 'Authentication Error', msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setIsAuthLoading(true);
    try {
      await signOutFromFirebase();
      onShowToast('info', 'Signed Out', 'Disconnected from Google account.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Sign-out failed.';
      onShowToast('error', 'Sign-Out Error', msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // OOP CONCEPT: Exception handling — try / catch / finally validating user input into Customer class
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    try {
      const trimmedId = customerIdInput.trim();
      if (trimmedId.length === 0 || !/^\d+$/.test(trimmedId)) {
        throw new InvalidInputError('Customer ID must be a valid positive number.');
      }

      const parsedId = Number(trimmedId);
      const customer = new Customer(parsedId, nameInput, addressInput);

      // OOP CONCEPT: Polymorphism — Assigning Customer instance to base User reference
      const userRef: User = customer;
      logger.info(`Customer logged in — ${userRef.displayDetails()}`);

      onShowToast('success', 'Welcome to Food Paradise', userRef.displayDetails());
      onLoginSuccess(customer);
    } catch (error) {
      if (error instanceof InvalidInputError) {
        setFieldError(error.message);
        logger.warning(`Login validation failed: ${error.message}`);
        onShowToast('error', error.name, error.message);
      } else if (error instanceof Error) {
        setFieldError(error.message);
        logger.warning(`Unexpected login error: ${error.message}`);
        onShowToast('error', 'Login Error', error.message);
      }
    } finally {
      // Cleanup or audit completion block
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
        {/* Left column: Editorial welcome & Cloud Firestore connection */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
              Step 1 of 6 · Customer Registration
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 text-balance sm:text-4xl">
              Fresh meals delivered to your doorstep.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Sign in with your customer details to create a live order session with{' '}
              <span className="font-semibold text-slate-900">Food Paradise</span>. Your session
              instantiates a real <code className="font-mono text-xs text-orange-700">Customer</code>{' '}
              object extending <code className="font-mono text-xs text-orange-700">User</code>.
            </p>

            {/* Cloud Firestore Sync Card */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <Database className="h-4 w-4 text-orange-600" aria-hidden="true" />
                  <span>Cloud Firestore Database</span>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {!authReady ? 'Checking...' : firebaseUser ? 'Connected' : 'Optional'}
                </span>
              </div>

              {firebaseUser ? (
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {firebaseUser.displayName || 'Google User'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{firebaseUser.email}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isAuthLoading}
                    onClick={handleGoogleSignOut}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 whitespace-nowrap shrink-0"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                </div>
              ) : (
                <div className="mt-2.5 space-y-2.5">
                  <p className="text-xs leading-relaxed text-slate-600">
                    Sign in with Google to persist your customer profile, orders, reviews, and logs
                    in Cloud Firestore across sessions.
                  </p>
                  <button
                    type="button"
                    disabled={!authReady || isAuthLoading}
                    onClick={handleGoogleSignIn}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50"
                  >
                    <span>{isAuthLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
              <div className="flex items-start gap-3">
                <UserIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Strict Input Validation</p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Non-numeric IDs or blank fields throw an <code className="font-mono">InvalidInputError</code>{' '}
                    and log a <code className="font-mono">WARNING</code>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Live Delivery Dispatch</p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Your delivery address appears on receipts and persists to Firestore.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {currentCustomer && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Active Customer Instance</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-emerald-900">
                {currentCustomer.displayDetails()}
              </p>
            </div>
          )}
        </div>

        {/* Right column: Customer Login Form */}
        <div
          className={`rounded-2xl border bg-white p-6 transition-all duration-200 sm:p-8 lg:col-span-7 ${
            highlightPrompt ? 'border-orange-500 ring-4 ring-orange-500/15' : 'border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Customer Login</h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter your numeric customer ID, name, and delivery address.
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-orange-600 whitespace-nowrap shrink-0"
            >
              Fill Sample Data
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <div>
              <label htmlFor="customer-id" className="block text-sm font-semibold text-slate-800">
                Customer ID
              </label>
              <input
                id="customer-id"
                type="text"
                inputMode="numeric"
                value={customerIdInput}
                onChange={(e) => setCustomerIdInput(e.target.value)}
                placeholder="e.g. 101"
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono tabular-nums"
              />
              <p className="mt-1 text-xs text-slate-500">
                Must be a positive integer. Try entering letters to test <code className="font-mono">InvalidInputError</code>.
              </p>
            </div>

            <div>
              <label htmlFor="customer-name" className="block text-sm font-semibold text-slate-800">
                Full Name
              </label>
              <input
                id="customer-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label htmlFor="customer-address" className="block text-sm font-semibold text-slate-800">
                Delivery Address
              </label>
              <textarea
                id="customer-address"
                rows={3}
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="e.g. 42 Anna Nagar East, Madurai"
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {fieldError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
              >
                Validation Error: {fieldError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-orange-700 hover:to-red-700 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 whitespace-nowrap"
              >
                <span>{currentCustomer ? 'Update Customer & Browse Menu' : 'Continue to Menu'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
