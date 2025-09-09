export const formatDate = (date: Date): string => {
  // Usa data local em vez de UTC para evitar problemas de timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


export const isToday = (dateString: string): boolean => {
  const today = formatDate(new Date());
  return dateString === today;
};

export const isFuture = (dateString: string): boolean => {
  const today = formatDate(new Date());
  return dateString > today;
};

export const addDays = (dateString: string, days: number): string => {
  // Parse manual para evitar interpretação UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

export const subtractDays = (dateString: string, days: number): string => {
  return addDays(dateString, -days);
};

export const getMonthName = (month: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1];
};

export const formatDateDisplay = (dateString: string): string => {
  // Parse manual para evitar interpretação UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const monthName = getMonthName(month);
  
  if (isToday(dateString)) {
    return `Hoje, ${day} de ${monthName}`;
  }
  
  return `${day} de ${monthName} de ${year}`;
};

// Funções centralizadas para padronizar formatação

export const formatDateTimeBR = (date: Date): string => {
  return date.toLocaleString('pt-BR');
};