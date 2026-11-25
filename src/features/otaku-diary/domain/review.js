// A review is a star rating with an optional comment. Pure: no React, no
// browser APIs, so a server can apply the same rules.

export const MAX_RATING = 5;
export const MAX_COMMENT_LENGTH = 200;

export function isValidRating(rating) {
  return Number.isInteger(rating) && rating >= 1 && rating <= MAX_RATING;
}

// The fields a review stores on a record. Throws on a rating outside 1–5.
export function normalizeReview({ rating, comment = '' }) {
  if (!isValidRating(rating)) throw new Error('별점은 1점부터 5점까지예요.');
  return { rating, comment: comment.trim().slice(0, MAX_COMMENT_LENGTH) };
}
