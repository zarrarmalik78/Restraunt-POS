import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol: string = 'Rs.') {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol} ${formatted}`;
}

export const getItemImage = (imagePath?: string, name = ''): string => {
  if (imagePath && imagePath.trim().length > 0) {
    return imagePath;
  }
  
  const lowerName = name.toLowerCase();
  if (lowerName.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80';
  }
  if (lowerName.includes('burger') || lowerName.includes('zinger') || lowerName.includes('patty') || lowerName.includes('tower')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80';
  }
  if (lowerName.includes('chicken') || lowerName.includes('wing') || lowerName.includes('piece') || lowerName.includes('nugget') || lowerName.includes('leg') || lowerName.includes('kabab') || lowerName.includes('tikka') || lowerName.includes('skewer')) {
    return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80';
  }
  if (lowerName.includes('fries') || lowerName.includes('fry') || lowerName.includes('potato') || lowerName.includes('sides')) {
    return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80';
  }
  if (lowerName.includes('pasta') || lowerName.includes('spaghetti') || lowerName.includes('macaroni')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80';
  }
  if (lowerName.includes('coke') || lowerName.includes('pepsi') || lowerName.includes('sprite') || lowerName.includes('fanta') || lowerName.includes('drink') || lowerName.includes('soda') || lowerName.includes('dew') || lowerName.includes('water')) {
    return 'https://images.unsplash.com/photo-1437419764061-2473afe69fc2?auto=format&fit=crop&w=400&q=80';
  }
  if (lowerName.includes('shake') || lowerName.includes('smoothie') || lowerName.includes('juice')) {
    return 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=400&q=80';
  }
  if (lowerName.includes('cake') || lowerName.includes('dessert') || lowerName.includes('sweet') || lowerName.includes('brownie')) {
    return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80';
  }
  if (lowerName.includes('deal') || lowerName.includes('combo') || lowerName.includes('pack')) {
    return 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=400&q=80';
  }
  
  return '/logo.png';
};
