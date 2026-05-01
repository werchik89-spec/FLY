import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatChatTime(date: Date): string {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return 'Вчера';
  }
  if (isThisWeek(date)) {
    return format(date, 'EEE', { locale: ru });
  }
  return format(date, 'dd.MM.yy');
}

export function formatMessageTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function formatDateSeparator(date: Date): string {
  if (isToday(date)) return 'Сегодня';
  if (isYesterday(date)) return 'Вчера';
  return format(date, 'd MMMM yyyy', { locale: ru });
}

export function formatLastSeen(date: Date): string {
  if (isToday(date)) {
    return `был(а) в ${format(date, 'HH:mm')}`;
  }
  if (isYesterday(date)) {
    return `был(а) вчера в ${format(date, 'HH:mm')}`;
  }
  return `был(а) ${format(date, 'd MMM', { locale: ru })}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
