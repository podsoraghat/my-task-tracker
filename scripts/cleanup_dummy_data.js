const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cracxeobqswrkikkhlbp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYWN4ZW9icXN3cmtpa2tobGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDU5OTIsImV4cCI6MjA4NjcyMTk5Mn0.wnpMbWyNS-fYNs-iy3SOkS6mO14ALLWq2gJMFp3DYO4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('🧹 Starting cleanup of dummy data...');

    // Delete tasks starting with [SEED]
    const { data, error, count } = await supabase
        .from('tasks')
        .delete({ count: 'exact' })
        .like('task_name', '[SEED]%');

    if (error) {
        console.error('❌ Error during cleanup:', error.message);
    } else {
        console.log(`✅ Successfully removed ${count} seeded tasks.`);
    }

    process.exit();
}

cleanup();
