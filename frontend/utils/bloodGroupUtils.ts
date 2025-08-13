type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export const getBloodGroupColor = (bloodGroup: string): string[] => {
  const colors: Record<BloodGroup, string[]> = {
    'A+': ['#DC2626', '#EF4444'], 'A-': ['#EF4444', '#F87171'],
    'B+': ['#2563EB', '#3B82F6'], 'B-': ['#3B82F6', '#60A5FA'],
    'O+': ['#059669', '#10B981'], 'O-': ['#10B981', '#34D399'],
    'AB+': ['#7C3AED', '#8B5CF6'], 'AB-': ['#8B5CF6', '#A78BFA'],
  };
  return colors[bloodGroup as BloodGroup] || ['#6B7280', '#9CA3AF'];
};

export const getBloodGroupInfo = (bloodGroup: string): string => {
  const info: Record<BloodGroup, string> = {
    'A+': 'Most common blood type. Universal plasma donor. Can donate to A+ and AB+.',
    'A-': 'Can donate to A+, A-, AB+, AB-. Needs A- or O- blood for transfusion.',
    'B+': 'Can receive from B+, B-, O+, O-. Can donate to B+ and AB+.',
    'B-': 'Can donate to B+, B-, AB+, AB-. Needs B- or O- blood for transfusion.',
    'O+': 'Universal red cell donor for positive blood types. Can receive O+ and O-.',
    'O-': 'Universal donor. Can give to all blood types. Can only receive O-.',
    'AB+': 'Universal recipient. Can receive from all blood types. Can donate to AB+.',
    'AB-': 'Can receive from AB-, A-, B-, O-. Can donate to AB+ and AB-.',
  };
  return info[bloodGroup as BloodGroup] || 'Consult with a healthcare professional for more information.';
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDetailedDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getCompatibilityInfo = (bloodGroup: string) => {
  const compatibility: Record<BloodGroup, { canGiveTo: string[]; canReceiveFrom: string[]; }> = {
    'A+': { canGiveTo: ['A+', 'AB+'], canReceiveFrom: ['A+', 'A-', 'O+', 'O-'] },
    'A-': { canGiveTo: ['A+', 'A-', 'AB+', 'AB-'], canReceiveFrom: ['A-', 'O-'] },
    'B+': { canGiveTo: ['B+', 'AB+'], canReceiveFrom: ['B+', 'B-', 'O+', 'O-'] },
    'B-': { canGiveTo: ['B+', 'B-', 'AB+', 'AB-'], canReceiveFrom: ['B-', 'O-'] },
    'O+': { canGiveTo: ['A+', 'B+', 'AB+', 'O+'], canReceiveFrom: ['O+', 'O-'] },
    'O-': { canGiveTo: ['All types'], canReceiveFrom: ['O-'] },
    'AB+': { canGiveTo: ['AB+'], canReceiveFrom: ['All types'] },
    'AB-': { canGiveTo: ['AB+', 'AB-'], canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'] },
  };
  return compatibility[bloodGroup as BloodGroup] || { canGiveTo: [], canReceiveFrom: [] };
};