
import React, { useState } from 'react';
import { FoodCalorieInfo } from '../../../types';
import { useLanguage } from '../../context/LanguageContext';

interface CalorieResultCardProps {
  item: FoodCalorieInfo;
}

const CalorieResultCard: React.FC<CalorieResultCardProps> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const totalItemCalories = item.caloriesPerItem * item.quantity;

  return (
    <button
      type="button"
      onClick={() => setIsOpen((current) => !current)}
      className="w-full text-left p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition"
      aria-expanded={isOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800 text-sm truncate">{item.foodItem}</p>
            {item.quantity > 1 && (
              <span className="text-xs font-medium text-white bg-emerald-500 px-1.5 py-0.5 rounded-full">
                ×{item.quantity}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{item.servingSize}</p>
          {item.quantity > 1 && (
            <p className="text-xs text-slate-400 mt-0.5">
              {item.caloriesPerItem} kcal × {item.quantity}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-orange-500 font-bold text-sm">
            {totalItemCalories.toLocaleString()} kcal
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("whatContains")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.likelyIngredients.map((ingredient) => (
                <span
                  key={`${item.foodItem}-${ingredient}`}
                  className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("howMade")}</p>
            <p className="mt-1 text-sm text-slate-600">{item.preparationStyle}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("nutritionNote")}</p>
            <p className="mt-1 text-sm text-slate-600">{item.nutritionNotes}</p>
          </div>
        </div>
      )}
    </button>
  );
};

export default CalorieResultCard;
