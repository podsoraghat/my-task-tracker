const parseTime = (str) => {
    if (!str) return 0;
    const hrs = parseInt(str.match(/(\d+)hr/)?.[1] || '0');
    const mins = parseInt(str.match(/(\d+)min/)?.[1] || '0');
    return (hrs * 60) + mins;
};

const formatTime = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}hr ${m}min`;
};

const mockTasks = [
    { client_name: 'Client A', asset_type: 'Video', asset_count: 2, time_taken: '1hr 30min' },
    { client_name: 'Client A', asset_type: 'Video', asset_count: 1, time_taken: '0hr 45min' },
    { client_name: 'Client A', asset_type: 'Social Media', asset_count: 5, time_taken: '2hr 0min' },
    { client_name: 'Client B', asset_type: 'Video', asset_count: 3, time_taken: '5hr 0min' },
];

const groupTasks = (filtered) => {
    const reportData = {};
    filtered.forEach(task => {
        if (!reportData[task.client_name]) {
            reportData[task.client_name] = {};
        }
        if (!reportData[task.client_name][task.asset_type]) {
            reportData[task.client_name][task.asset_type] = { count: 0, totalMinutes: 0 };
        }

        reportData[task.client_name][task.asset_type].count += (task.asset_count || 1);
        reportData[task.client_name][task.asset_type].totalMinutes += parseTime(task.time_taken);
    });
    return reportData;
};

const result = groupTasks(mockTasks);

console.log('--- Reporting Logic Verification ---');
Object.keys(result).forEach(client => {
    console.log(`\nClient: ${client}`);
    Object.keys(result[client]).forEach(assetType => {
        const data = result[client][assetType];
        console.log(`  - ${assetType}: ${data.count} assets, ${formatTime(data.totalMinutes)} taken`);
    });
});

// Assertions
const clientAVideo = result['Client A']['Video'];
if (clientAVideo.count === 3 && formatTime(clientAVideo.totalMinutes) === '2hr 15min') {
    console.log('\n✅ Client A Video Logic Passed');
} else {
    console.log('\n❌ Client A Video Logic Failed');
}
