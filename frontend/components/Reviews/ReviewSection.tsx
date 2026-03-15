"use client";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/apiClient";
import { Star, MessageSquare } from "lucide-react";
import { Spinner } from "../common/Spinner";
import { Button } from "../common/Button";

interface Review {
  id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
  name: string;
}

export const ReviewSection = ({ subjectId }: { subjectId: string }) => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [subjectId, user]);

  const fetchReviews = async () => {
    try {
      const { data } = await apiClient.get(`/reviews/${subjectId}`);
      setReviews(data);
      if (user) {
        const userReview = data.find((r: Review) => r.user_id === user.id);
        if (userReview) {
          setHasReviewed(true);
          setRating(userReview.rating);
          setComment(userReview.comment);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to review.");
    setSubmitting(true);
    try {
      await apiClient.post(`/reviews/${subjectId}`, { rating, comment });
      await fetchReviews();
    } catch (err) {
      alert("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-10 flex justify-center"><Spinner /></div>;

  return (
    <div className="mt-12 pt-10 border-t border-slate-200 font-sans">
      <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-indigo-600" />
        Course Reviews
      </h3>

      {/* Review Form - only show if logged in */}
      {user && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-10 shadow-sm">
          <h4 className="font-bold text-slate-700 mb-4">{hasReviewed ? "Edit your review" : "Leave a review"}</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="What did you think about this course?"
                className="w-full border-slate-300 rounded-lg p-3 border shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              ></textarea>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                {submitting ? "Submitting..." : hasReviewed ? "Update Review" : "Submit Review"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-slate-500 italic">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold shrink-0 text-lg">
                {review.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-slate-800">{review.name}</h5>
                  <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${review.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                {review.comment && <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
