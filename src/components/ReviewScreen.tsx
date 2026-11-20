import React, { useState } from 'react';
import { MessageSquarePlus, Star } from 'lucide-react';
import { Review } from '../models/Review';
import { InvalidInputError, InvalidRatingError } from '../models/Errors';
import { Logger } from '../services/Logger';

interface ReviewScreenProps {
  customerName: string;
  reviews: Review[];
  logger: Logger;
  onAddReview: (review: Review) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export function ReviewScreen({
  customerName,
  reviews,
  logger,
  onAddReview,
  onShowToast,
}: ReviewScreenProps) {
  const [ratingValue, setRatingValue] = useState<string>('5');
  const [comment, setComment] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>(customerName || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const numericRating = Number(ratingValue);

  // OOP CONCEPT: Exception handling — Validates rating (1-5) via Review constructor and catches InvalidRatingError
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const parsedRating = Number(ratingValue);
      const review = new Review(reviewerName, comment, parsedRating);
      onAddReview(review);
      logger.info(`Review submitted — ${review.displayReview()}`);
      onShowToast('success', 'Review Submitted', 'Thank you for rating your order.');
      setComment('');
    } catch (error) {
      if (error instanceof InvalidRatingError || error instanceof InvalidInputError) {
        setErrorMessage(error.message);
        logger.warning(`Review validation failed: ${error.message}`);
        onShowToast('error', error.name, error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
        logger.warning(`Review error: ${error.message}`);
        onShowToast('error', 'Review Error', error.message);
      }
    } finally {
      // Review form handling finalized
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
          Step 6 of 6 · Customer Feedback & Rating Validation
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Rate Your Experience</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Review Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <h2 className="text-lg font-bold text-slate-900">Submit a Review</h2>
          <p className="mt-1 text-xs text-slate-500">
            Ratings outside 1–5 throw <code className="font-mono">InvalidRatingError</code> inside{' '}
            <code className="font-mono">Review</code> constructor.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
            <div>
              <label htmlFor="reviewer-name" className="block text-sm font-semibold text-slate-800">
                Customer Name
              </label>
              <input
                id="reviewer-name"
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="block text-sm font-semibold text-slate-800">Star Rating (1–5)</span>
                <button
                  type="button"
                  onClick={() => setRatingValue('6')}
                  className="text-xs font-medium text-orange-700 underline-offset-2 hover:underline"
                >
                  Test invalid rating (6)
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5" role="group" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = Number.isInteger(numericRating) && star <= numericRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingValue(String(star))}
                        aria-label={`Rate ${star} out of 5`}
                        className="rounded-lg p-1.5 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-orange-600"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            active
                              ? 'fill-amber-400 text-amber-500'
                              : 'fill-slate-100 text-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="numeric-rating" className="text-xs text-slate-500">
                    Value:
                  </label>
                  <input
                    id="numeric-rating"
                    type="number"
                    value={ratingValue}
                    onChange={(e) => setRatingValue(e.target.value)}
                    className="w-16 rounded-lg border border-slate-300 px-2.5 py-1.5 text-center text-sm font-mono tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="review-comment" className="block text-sm font-semibold text-slate-800">
                Review Comment
              </label>
              <textarea
                id="review-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on food quality and delivery speed..."
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
              >
                Validation Error: {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:from-orange-700 hover:to-red-700 whitespace-nowrap"
            >
              <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
              <span>Submit Review</span>
            </button>
          </form>
        </section>

        {/* Submitted Reviews List */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Customer Reviews</h2>
            <span className="text-xs font-medium text-slate-500 font-mono tabular-nums">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No reviews submitted yet. Be the first to rate your order.
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviews.map((rev, idx) => (
                <li
                  key={`${rev.getCustomerName()}-${idx}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">{rev.getCustomerName()}</p>
                    <span className="text-xs font-semibold text-amber-700 font-mono tabular-nums">
                      {rev.getRating()} / 5 stars · {rev.getCreatedAt()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{rev.getComment()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
