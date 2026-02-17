const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cracxeobqswrkikkhlbp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYWN4ZW9icXN3cmtpa2tobGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDU5OTIsImV4cCI6MjA4NjcyMTk5Mn0.wnpMbWyNS-fYNs-iy3SOkS6mO14ALLWq2gJMFp3DYO4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCustomData() {
    console.log('🔍 Fetching existing clients and assets...');

    const [{ data: clientsData }, { data: assetsData }] = await Promise.all([
        supabase.from('clients').select('name'),
        supabase.from('assets').select('name')
    ]);

    const clients = (clientsData || []).map(c => c.name);
    const assets = (assetsData || []).map(a => a.name);

    // Fallback if DB is empty
    if (clients.length === 0) clients.push('Sample Client');
    if (assets.length === 0) assets.push('Sample Asset');

    // Valid User IDs from existing tasks to bypass FK constraints
    const validIds = [
        'bc8d1730-00d3-4820-9597-00a151954b45', // subhadipdey2012
        '2a0bea5d-9976-44b2-a32f-9206c494e08c'  // podsoraghat
    ];

    const users = [
        { id: validIds[0], name: 'subhadipdey2012' },
        { id: validIds[1], name: 'podsoraghat' },
        { id: validIds[0], name: 'User 01' },
        { id: validIds[1], name: 'User 02' },
        { id: validIds[0], name: 'User 03' },
        { id: validIds[1], name: 'User 04' },
        { id: validIds[0], name: 'User 05' }
    ];

    const statuses = ['In Progress', 'Completed', 'On Hold', 'Not Started', 'In Review'];

    console.log(`🚀 Seeding 400 tasks for ${users.length} user names...`);
    const tasks = [];

    // Date Range: 1 Jan 2026 to today (16 Feb 2026)
    const start = new Date('2026-01-01');
    const end = new Date('2026-02-16');
    const rangeMs = end.getTime() - start.getTime();

    for (let i = 0; i < 400; i++) {
        // Equal distribution logic (round robin)
        const user = users[i % users.length];
        const client = clients[i % clients.length];
        const asset = assets[i % assets.length];

        // Random date in range
        const randomDate = new Date(start.getTime() + Math.random() * rangeMs);

        tasks.push({
            task_name: `[SEED] ${asset} for ${client} #${Math.floor(i / users.length) + 1}`,
            client_name: client,
            asset_type: asset,
            start_date: randomDate.toISOString().split('T')[0],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            time_taken: `${Math.floor(Math.random() * 5) + 1}hr ${Math.floor(Math.random() * 60)}min`,
            user_id: user.id,
            user_name: user.name,
            asset_count: Math.floor(Math.random() * 20) + 1
        });
    }

    const { error } = await supabase.from('tasks').insert(tasks);

    if (error) {
        console.error('❌ Error seeding data:', error.message);
    } else {
        console.log('✅ Successfully seeded 100 customized tasks!');
        console.log('💡 Note: All seeded tasks start with "[SEED]" for easy cleanup.');
    }
    process.exit();
}

seedCustomData();
