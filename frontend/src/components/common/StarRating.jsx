import React from 'react';
import { FiStar } from 'react-icons/fi';

const StarRating = ({ rating }) => {
  const totalStars = 5;
  const fullStars = Math.floor(rating);
  const emptyStars = totalStars - fullStars;

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => <FiStar key={`full-${i}`} className="text-yellow-400 fill-current" />)}
      {[...Array(emptyStars)].map((_, i) => <FiStar key={`empty-${i}`} className="text-gray-300" />)}
    </div>
  );
};

export default StarRating;