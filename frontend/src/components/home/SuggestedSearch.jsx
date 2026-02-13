import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { getMyItems, getCategories } from '../../api/api';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const itemSuggestionsMap = {
  'Phones': ['Watches', 'Gaming', 'Electronics'],
  'Computers': ['Electronics', 'Gaming', 'Fashion'],
  'Cars': ['Motorcycles', 'Boats', 'Watches'],
  'Furniture': ['Art', 'Fashion', 'Other'],
  'Gaming': ['Electronics', 'Computers', 'Phones'],
  'Fashion': ['Jewelry', 'Handbags', 'Sneakers'],
  'Electronics': ['Gaming', 'Computers', 'Phones'],
  'Watches': ['Jewelry', 'Fashion', 'Cars'],
  'Jewelry': ['Watches', 'Fashion', 'Handbags'],
  'Real Estate': ['Furniture', 'Art', 'Cars'],
  'Art': ['Furniture', 'Real Estate', 'Other'],
};

const serviceSuggestionsMap = {
    'Cleaning': ['Repair', 'Plumbing', 'Electrical'],
    'Plumbing': ['Repair', 'Construction', 'Cleaning'],
    'Graphic Design': ['Web Development', 'Marketing', 'Video Editing'],
    'Web Development': ['Graphic Design', 'Marketing', 'Software'],
    'Personal Training': ['Nutrition', 'Massage', 'Health'],
    'Consulting': ['Legal', 'Finance', 'Marketing'],
};

export default function SuggestedSearch({ type = 'item' }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  
  const { data: myItemsData } = useQuery({
    queryKey: ['myItems'],
    queryFn: getMyItems,
    enabled: type === 'item',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  useEffect(() => {
    if (type === 'item') {
      if (myItemsData && myItemsData.items && myItemsData.items.length > 0) {
        // Smart item suggestion based on user's last listed item category
        const lastItem = myItemsData.items[0];
        const categoryName = lastItem.category;
        const suggestedCategories = itemSuggestionsMap[categoryName] || ['Electronics', 'Gaming', 'Fashion'];
        setSuggestions(suggestedCategories);
      } else {
        // Fallback or popular
        setSuggestions(['Electronics', 'Phones', 'Gaming', 'Cars']);
      }
    } else {
      // Service suggestions based on cookies
      const lastServiceSearch = getCookie('last_service_search');
      if (lastServiceSearch) {
        const suggested = serviceSuggestionsMap[lastServiceSearch] || ['Web Development', 'Graphic Design', 'Cleaning'];
        setSuggestions(suggested);
      } else {
        setSuggestions(['Web Development', 'Graphic Design', 'Cleaning', 'Repair']);
      }
    }
  }, [type, myItemsData]);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  const handleSuggestionClick = (suggestion) => {
    if (type === 'item') {
      navigate(`/browse?category=${encodeURIComponent(suggestion)}`);
    } else {
      navigate(`/browse-services?keyword=${encodeURIComponent(suggestion)}`);
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
        <Sparkles size={16} />
        <span>{t('suggestedForYou', 'Suggested:')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="px-4 py-1.5 bg-secondary/30 hover:bg-secondary/50 border border-secondary text-sm rounded-full transition-all flex items-center gap-2 group"
          >
            {t(suggestion.toLowerCase(), suggestion)}
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
