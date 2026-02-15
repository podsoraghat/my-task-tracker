export const statusConfig: Record<string, string> = {
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
    'Completed': 'bg-green-100 text-green-800 border-green-200',
    'On Hold': 'bg-gray-100 text-gray-800 border-gray-200',
    'Cancelled': 'bg-red-100 text-red-800 border-red-200',
    'Verified': 'bg-purple-100 text-purple-800 border-purple-200'
};

export const statusOptions = Object.keys(statusConfig);
