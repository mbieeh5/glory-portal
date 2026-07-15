import { serviceMenus, bankMenus, captainMenus, rekapMenus } from './menu';

type Role = 'frontliner' | 'moderator' | 'admin'; // Sesuaikan sama database lu

export const getMenus = (module: 'service' | 'bank' | 'captain' | 'rekap', role: string) => {
  // Default ke empty array kalo role gak dikenal
  const currentRole = role as Role; 
  
  if (module === 'service') {
    return serviceMenus[currentRole] || [];
  }
  
  if (module === 'bank') {
    return bankMenus[currentRole] || [];
  }

  if (module === 'captain') {
    return captainMenus[currentRole] || [];
  }

  if (module === 'rekap') {
    return rekapMenus[currentRole] || []
  }

  return [];
};