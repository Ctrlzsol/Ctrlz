
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates if a string is a valid UUID v4
 */
export const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

/**
 * Standardized Status Labels for the entire App
 */
export const getStatusLabel = (status: string) => {
    const s = status?.toLowerCase() || '';
    switch (s) {
        // Finance
        case 'paid': return 'مدفوع';
        case 'pending': return 'غير مدفوعة';
        case 'overdue': return 'متأخر';
        // Bookings
        case 'confirmed': return 'مؤكد';
        case 'completed': return 'مكتمل';
        case 'cancelled': return 'ملغي';
        case 'on-site': return 'زيارة ميدانية';
        case 'consultation': return 'استشارة';
        // Tickets (Legacy)
        case 'open': return 'مفتوح';
        case 'in-progress': return 'قيد التنفيذ';
        
        // --- Remote Support (Exact Arabic Text as Requested) ---
        case 'sent': return 'تم الإرسال للفني';
        case 'viewed': return 'بإنتظار إجراء الفني';
        case 'resolved': return 'تم معالجة التذكرة';
        
        // Account
        case 'active': return 'نشط';
        case 'suspended': return 'معلق';
        default: return status;
    }
};

/**
 * Standardized Status Colors
 */
export const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    switch (s) {
        case 'paid': 
        case 'confirmed': 
        case 'completed': 
        case 'active':
        case 'resolved':
            return 'bg-green-100 text-green-700 border-green-200';
        
        case 'pending': 
        case 'open':
        case 'sent': // Waiting for Technician
        case 'on-site':
            return 'bg-orange-100 text-orange-700 border-orange-200';
            
        case 'in-progress':
        case 'viewed': // Processing by Technician
        case 'consultation':
            return 'bg-blue-100 text-blue-700 border-blue-200';

        case 'overdue': 
        case 'cancelled': 
        case 'suspended':
            return 'bg-red-100 text-red-700 border-red-200';
            
        default: 
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

/**
 * Format Date to readable string
 */
export const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
